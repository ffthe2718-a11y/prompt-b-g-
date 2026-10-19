import { Router } from "express";
import db, { newId, nowIso } from "../db";
import { AuthedRequest, assertOwnedResource, requireAuth, requireSalonOwner } from "../auth";
import {
  ApiError,
  CURRENCIES,
  DEFAULT_HOURS,
  DEFAULT_SECTIONS,
  TEMPLATES,
  cleanText,
  cleanMultiline,
  digitsOnly,
  isEmail,
  isHexColor,
  isValidSlug,
  isValidTime,
  normalizeDomain,
  parseBoolean,
  safeImageUrl,
  safeLinkUrl,
  slugify,
  toCents,
  isValidDate,
} from "../validation";
import { getSettings } from "../settings";
import { sendSalonStatusEmail, sendBookingStatusEmail, sendReminderEmail, type BookingEmailPayload } from "../emails";
import {
  approvalState,
  markSubmitted,
  recordSalonReview,
  submitBlockers,
} from "../approval";
import {
  privateSalonBundle,
  publicSalonBundle,
  reviewRow,
  staffRow,
  serviceRow,
  galleryRow,
  bookingRow,
} from "../serializers";

const router = Router();
router.use(requireAuth);

function ownerSalon(req: any) {
  const user = (req as AuthedRequest).user!;
  return requireSalonOwner(user.id);
}

function ownerAppUrl(req: any): string {
  const configured = (process.env.PUBLIC_SITE_ORIGIN || process.env.APP_URL || "").trim().replace(/\/$/, "");
  if (configured) return configured;
  return `${req.protocol}://${req.get("host")}`;
}

function slugTaken(slug: string, exceptSalonId?: string): boolean {
  const row = db.prepare("SELECT id FROM salons WHERE slug = ?").get(slug) as any;
  return !!row && row.id !== exceptSalonId;
}

function assertSlug(slug: string, exceptSalonId?: string): string {
  const clean = slugify(slug);
  if (!isValidSlug(clean)) {
    throw new ApiError(
      400,
      "Choose a URL with 3–48 lowercase letters, numbers and hyphens. It cannot be a reserved word.",
      "invalid_slug"
    );
  }
  if (slugTaken(clean, exceptSalonId)) {
    throw new ApiError(409, "That website address is already taken. Try another one.", "slug_taken");
  }
  return clean;
}

function touchSalon(salonId: string) {
  db.prepare("UPDATE salons SET updated_at = ? WHERE id = ?").run(nowIso(), salonId);
}

/* ------------------------------------------------------------------ */
/* Current owner's salon                                               */
/* ------------------------------------------------------------------ */

router.get("/slug-available", (req, res, next) => {
  try {
    const slug = slugify(String(req.query.slug ?? ""));
    let reason = "";
    if (!isValidSlug(slug)) reason = "Use 3–48 lowercase letters, numbers and hyphens. Some words are reserved.";
    else if (slugTaken(slug)) reason = "That address is already taken.";
    res.json({ available: !reason, slug, reason });
  } catch (error) {
    next(error);
  }
});

router.get("/me", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    res.json({ salon: privateSalonBundle(salon) });
  } catch (error) {
    next(error);
  }
});

router.post("/", (req, res, next) => {
  try {
    const user = (req as AuthedRequest).user!;
    const existing = db.prepare("SELECT id FROM salons WHERE owner_id = ?").get(user.id);
    if (existing) throw new ApiError(409, "You already have a salon.", "salon_exists");

    const name = cleanText(req.body?.name, 100);
    if (name.length < 2) throw new ApiError(400, "Enter your salon name.", "invalid_name");
    const slug = assertSlug(String(req.body?.slug || slugify(name)));
    const tagline = cleanText(req.body?.tagline, 160);
    const description = cleanMultiline(req.body?.description, 2000);
    const now = nowIso();
    const id = newId();
    const settings = getSettings();
    const plan = settings.defaultPlan;
    // Paid plans start on a short trial; the free plan is active immediately.
    const subscriptionStatus = plan === "launch" ? "active" : "trialing";
    const renewsAt =
      plan === "launch" ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO salons
        (id, owner_id, name, slug, tagline, description, hero_title, hero_subtitle,
         template, primary_color, accent_color, status, sections_json, hours_json, booking_json,
         plan, subscription_status, subscription_renews_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'luxury', '#D4AF37', '#F4E4BC', 'draft', ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      user.id,
      name,
      slug,
      tagline,
      description,
      name,
      tagline,
      JSON.stringify(DEFAULT_SECTIONS),
      JSON.stringify(DEFAULT_HOURS),
      JSON.stringify({ enabled: true, slotIntervalMinutes: 30, minNoticeHours: 2, maxAdvanceDays: 60, requireEmail: false }),
      plan,
      subscriptionStatus,
      renewsAt,
      now,
      now
    );

    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(id) as any;
    res.status(201).json({ salon: privateSalonBundle(row) });
  } catch (error) {
    next(error);
  }
});

router.patch("/me", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const body = req.body ?? {};
    const updates: { column: string; value: unknown }[] = [];

    const textFields: Record<string, { column: string; max: number; multiline?: boolean }> = {
      name: { column: "name", max: 100 },
      tagline: { column: "tagline", max: 160 },
      description: { column: "description", max: 3000, multiline: true },
      heroTitle: { column: "hero_title", max: 120 },
      heroSubtitle: { column: "hero_subtitle", max: 240 },
      aboutTitle: { column: "about_title", max: 120 },
      aboutText: { column: "about_text", max: 6000, multiline: true },
      announcement: { column: "announcement", max: 200 },
      ctaText: { column: "cta_text", max: 60 },
      address: { column: "address", max: 300 },
      city: { column: "city", max: 100 },
      state: { column: "state", max: 100 },
      postalCode: { column: "postal_code", max: 20 },
      country: { column: "country", max: 100 },
      seoTitle: { column: "seo_title", max: 70 },
      seoDescription: { column: "seo_description", max: 320 },
      instagram: { column: "instagram", max: 100 },
      facebook: { column: "facebook", max: 100 },
      tiktok: { column: "tiktok", max: 100 },
    };

    for (const [key, config] of Object.entries(textFields)) {
      if (body[key] !== undefined) {
        let value = config.multiline ? cleanMultiline(body[key], config.max) : cleanText(body[key], config.max);
        if (key === "instagram" || key === "facebook" || key === "tiktok") {
          value = value
            .replace(/^https?:\/\/(www\.)?(instagram|facebook|tiktok)\.com\//i, "")
            .replace(/^@/, "")
            .replace(/[/?#].*$/, "");
        }
        if (key === "name" && value.length < 2) {
          throw new ApiError(400, "Salon name must be at least 2 characters.", "invalid_name");
        }
        updates.push({ column: config.column, value });
      }
    }

    if (body.slug !== undefined) {
      updates.push({ column: "slug", value: assertSlug(String(body.slug), salon.id) });
    }

    const imageFields: Record<string, string> = {
      logoUrl: "logo_url",
      heroImageUrl: "hero_image_url",
      aboutImageUrl: "about_image_url",
    };
    for (const [key, column] of Object.entries(imageFields)) {
      if (body[key] !== undefined) updates.push({ column, value: safeImageUrl(body[key]) });
    }

    if (body.website !== undefined) updates.push({ column: "website", value: safeLinkUrl(body.website) });
    if (body.phone !== undefined) updates.push({ column: "phone", value: digitsOnly(body.phone, 25) });
    if (body.whatsapp !== undefined) updates.push({ column: "whatsapp", value: digitsOnly(body.whatsapp, 25) });
    if (body.email !== undefined) {
      const email = cleanText(body.email, 254).toLowerCase();
      if (email && !isEmail(email)) throw new ApiError(400, "Enter a valid contact email.", "invalid_email");
      updates.push({ column: "email", value: email });
    }
    if (body.currency !== undefined) {
      const currency = String(body.currency).toUpperCase();
      if (!CURRENCIES.has(currency)) throw new ApiError(400, "Unsupported currency.", "invalid_currency");
      updates.push({ column: "currency", value: currency });
    }
    if (body.timezone !== undefined) {
      const timezone = cleanText(body.timezone, 60);
      try {
        new Intl.DateTimeFormat("en-US", { timeZone: timezone });
      } catch {
        throw new ApiError(400, "Invalid timezone.", "invalid_timezone");
      }
      updates.push({ column: "timezone", value: timezone });
    }
    if (body.template !== undefined) {
      const template = String(body.template);
      if (!TEMPLATES.has(template)) throw new ApiError(400, "Unknown website theme.", "invalid_template");
      updates.push({ column: "template", value: template });
    }
    if (body.primaryColor !== undefined) {
      if (!isHexColor(String(body.primaryColor))) throw new ApiError(400, "Primary color must be a hex value.", "invalid_color");
      updates.push({ column: "primary_color", value: String(body.primaryColor) });
    }
    if (body.accentColor !== undefined) {
      if (!isHexColor(String(body.accentColor))) throw new ApiError(400, "Accent color must be a hex value.", "invalid_color");
      updates.push({ column: "accent_color", value: String(body.accentColor) });
    }

    if (body.sections !== undefined) {
      if (!Array.isArray(body.sections)) throw new ApiError(400, "Sections must be a list.", "invalid_sections");
      const incoming = new Map<string, any>(body.sections.map((s: any) => [String(s?.id), s]));
      const sections = DEFAULT_SECTIONS.map((fallback, index) => {
        const saved = incoming.get(fallback.id);
        return {
          id: fallback.id,
          label: fallback.label,
          enabled: saved ? parseBoolean(saved.enabled, fallback.enabled) : fallback.enabled,
          order: saved && Number.isFinite(Number(saved.order)) ? Number(saved.order) : index,
        };
      }).sort((a, b) => a.order - b.order);
      updates.push({ column: "sections_json", value: JSON.stringify(sections) });
    }

    if (body.hours !== undefined) {
      if (!Array.isArray(body.hours)) throw new ApiError(400, "Hours must be a list.", "invalid_hours");
      const incoming = new Map<string, any>(body.hours.map((h: any) => [String(h?.day), h]));
      const hours = DEFAULT_HOURS.map((fallback) => {
        const saved = incoming.get(fallback.day);
        if (!saved) return fallback;
        const open = isValidTime(String(saved.open)) ? String(saved.open) : fallback.open;
        const close = isValidTime(String(saved.close)) ? String(saved.close) : fallback.close;
        return {
          day: fallback.day,
          closed: parseBoolean(saved.closed, fallback.closed),
          open,
          close,
        };
      });
      updates.push({ column: "hours_json", value: JSON.stringify(hours) });
    }

    if (body.bookingSettings !== undefined) {
      const current = JSON.parse(salon.booking_json || "{}");
      const input = body.bookingSettings ?? {};
      const interval = Number(input.slotIntervalMinutes);
      const minNotice = Number(input.minNoticeHours);
      const maxAdvance = Number(input.maxAdvanceDays);
      const settings = {
        enabled: input.enabled === undefined ? current.enabled !== false : parseBoolean(input.enabled, true),
        slotIntervalMinutes: [15, 30, 45, 60, 90, 120].includes(interval) ? interval : Number(current.slotIntervalMinutes) || 30,
        minNoticeHours: Number.isFinite(minNotice) ? Math.min(Math.max(minNotice, 0), 168) : Number(current.minNoticeHours) || 2,
        maxAdvanceDays: Number.isFinite(maxAdvance) ? Math.min(Math.max(maxAdvance, 1), 365) : Number(current.maxAdvanceDays) || 60,
        requireEmail: input.requireEmail === undefined ? current.requireEmail === true : parseBoolean(input.requireEmail, false),
      };
      updates.push({ column: "booking_json", value: JSON.stringify(settings) });
    }

    if (updates.length === 0) {
      return res.json({ salon: privateSalonBundle(salon), message: "Nothing to update." });
    }

    const now = nowIso();
    const setClause = updates.map((u) => `${u.column} = ?`).join(", ");
    db.prepare(`UPDATE salons SET ${setClause}, updated_at = ? WHERE id = ?`).run(
      ...updates.map((u) => u.value),
      now,
      salon.id
    );

    const updated = db.prepare("SELECT * FROM salons WHERE id = ?").get(salon.id) as any;
    res.json({ salon: privateSalonBundle(updated) });
  } catch (error) {
    next(error);
  }
});

/** Send the current draft to the platform team for review. */
router.post("/me/submit", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const user = (req as AuthedRequest).user!;

    const account = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as any;
    if (!account || account.email_verified !== 1) {
      throw new ApiError(
        403,
        "Verify your email address before submitting your website for approval.",
        "email_unverified"
      );
    }
    if (salon.status === "suspended") {
      throw new ApiError(403, "This salon is suspended. Contact support before submitting again.", "salon_suspended");
    }
    if (salon.approval_status === "pending") {
      throw new ApiError(409, "Your website is already waiting for review.", "already_pending");
    }

    const blockers = submitBlockers(salon);
    if (blockers.length) {
      throw new ApiError(400, `Finish these steps before submitting: ${blockers.join(", ")}.`, "not_ready", {
        missing: blockers.join(", "),
      });
    }

    markSubmitted(salon, { id: user.id, email: user.email });
    const updated = db.prepare("SELECT * FROM salons WHERE id = ?").get(salon.id) as any;
    void sendSalonStatusEmail({
      to: account.email,
      ownerName: account.name,
      salonName: updated.name,
      event: "submitted",
      dashboardUrl: `${ownerAppUrl(req)}/dashboard`,
    });
    res.json({ salon: privateSalonBundle(updated) });
  } catch (error) {
    next(error);
  }
});

/** Withdraw a submission so the owner can keep working without waiting. */
router.post("/me/withdraw", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    if (salon.approval_status !== "pending") {
      throw new ApiError(400, "Only a submission that is waiting for review can be withdrawn.", "not_pending");
    }
    const user = (req as AuthedRequest).user!;
    db.prepare(
      "UPDATE salons SET approval_status = 'draft', submitted_at = NULL, submitted_hash = NULL, updated_at = ? WHERE id = ?"
    ).run(nowIso(), salon.id);
    recordSalonReview({
      salonId: salon.id,
      action: "revoke",
      note: "Withdrawn by the owner.",
      actorId: user.id,
      actorEmail: user.email,
    });
    const updated = db.prepare("SELECT * FROM salons WHERE id = ?").get(salon.id) as any;
    res.json({ salon: privateSalonBundle(updated) });
  } catch (error) {
    next(error);
  }
});

router.post("/me/publish", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const user = (req as AuthedRequest).user!;
    const account = db.prepare("SELECT * FROM users WHERE id = ?").get(user.id) as any;
    if (!account || account.email_verified !== 1) {
      throw new ApiError(403, "Verify your email address before publishing.", "email_unverified");
    }
    if (salon.status === "suspended") {
      throw new ApiError(403, "This website is suspended and cannot be published.", "salon_suspended");
    }

    const services = db
      .prepare("SELECT * FROM services WHERE salon_id = ? AND is_active = 1")
      .all(salon.id) as any[];
    const missing: string[] = [];
    if (services.length === 0) missing.push("Add at least one service");
    if (!salon.phone && !salon.email && !salon.whatsapp) missing.push("Add a phone number or contact email");
    if (!salon.name || !salon.slug) missing.push("Add your salon name and address");
    if (missing.length) {
      throw new ApiError(400, `Your site is not ready to publish yet: ${missing.join(", ")}.`, "not_ready", {
        missing: missing.join(", "),
      });
    }

    const state = approvalState(salon);
    if (state.approvalStatus !== "approved") {
      throw new ApiError(
        403,
        state.approvalStatus === "pending"
          ? "Your website is still waiting for approval. We'll let you know as soon as it's reviewed."
          : "Your website needs approval from the platform team before it can go live.",
        "approval_required",
        { approvalStatus: state.approvalStatus }
      );
    }
    if (state.changesSinceApproval) {
      throw new ApiError(
        403,
        "You've changed your website since it was approved. Submit the new version for review before publishing.",
        "changes_need_approval"
      );
    }

    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(salon.id) as any;
    const snapshot = publicSalonBundle(row, { includeReviews: false });
    const now = nowIso();
    db.prepare(
      "UPDATE salons SET status = 'published', published_json = ?, published_at = ?, updated_at = ? WHERE id = ?"
    ).run(JSON.stringify(snapshot), now, now, salon.id);
    const updated = db.prepare("SELECT * FROM salons WHERE id = ?").get(salon.id) as any;
    res.json({ salon: privateSalonBundle(updated), publishedUrl: `/${updated.slug}` });
  } catch (error) {
    next(error);
  }
});


router.post("/me/unpublish", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const now = nowIso();
    db.prepare("UPDATE salons SET status = 'draft', updated_at = ? WHERE id = ?").run(now, salon.id);
    const updated = db.prepare("SELECT * FROM salons WHERE id = ?").get(salon.id) as any;
    res.json({ salon: privateSalonBundle(updated) });
  } catch (error) {
    next(error);
  }
});

/** Shape a booking row + its salon into the payload the mail templates expect. */
function bookingEmailPayload(salon: any, row: any): BookingEmailPayload {
  return {
    salon: {
      name: salon.name,
      email: salon.email,
      phone: salon.phone,
      address: salon.address,
      city: salon.city,
      slug: salon.slug,
      currency: salon.currency || "INR",
      timezone: salon.timezone || "Asia/Kolkata",
    },
    booking: {
      id: row.id,
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      customerPhone: row.customer_phone,
      serviceName: row.service_name,
      staffName: row.staff_name,
      date: row.date,
      time: row.time,
      notes: row.notes,
      price: Math.round(row.price_cents) / 100,
    },
  };
}

/** Newsletter addresses collected by the public footer form. */
router.get("/me/subscribers", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const rows = db
      .prepare("SELECT id, email, created_at FROM subscribers WHERE salon_id = ? ORDER BY created_at DESC LIMIT 1000")
      .all(salon.id) as any[];
    const total = db.prepare("SELECT COUNT(*) AS count FROM subscribers WHERE salon_id = ?").get(salon.id) as any;
    res.json({
      subscribers: rows.map((row) => ({ id: row.id, email: row.email, createdAt: row.created_at })),
      count: total?.count ?? rows.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/me/analytics", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const days: { date: string; bookings: number; revenue: number }[] = [];
    const base = new Date();
    base.setUTCHours(0, 0, 0, 0);
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(base);
      d.setUTCDate(d.getUTCDate() - i);
      days.push({ date: d.toISOString().slice(0, 10), bookings: 0, revenue: 0 });
    }
    const bookings = db
      .prepare("SELECT date, status, price_cents FROM bookings WHERE salon_id = ? AND date >= ?")
      .all(salon.id, days[0].date) as any[];
    for (const b of bookings) {
      const day = days.find((d) => d.date === b.date);
      if (day) {
        day.bookings += 1;
        if (b.status === "confirmed" || b.status === "completed") day.revenue += b.price_cents / 100;
      }
    }
    const topServices = db
      .prepare(
        `SELECT service_name AS name, COUNT(*) AS count,
                COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN price_cents ELSE 0 END), 0) AS revenue_cents
         FROM bookings WHERE salon_id = ? AND service_name <> ''
         GROUP BY service_name ORDER BY count DESC LIMIT 6`
      )
      .all(salon.id) as any[];
    const ratings = db
      .prepare("SELECT rating, COUNT(*) AS count FROM reviews WHERE salon_id = ? AND status = 'published' GROUP BY rating")
      .all(salon.id) as any[];
    const recentBookings = db
      .prepare("SELECT * FROM bookings WHERE salon_id = ? ORDER BY created_at DESC LIMIT 6")
      .all(salon.id) as any[];
    const subscribers = db.prepare("SELECT COUNT(*) AS count FROM subscribers WHERE salon_id = ?").get(salon.id) as any;
    const { rating, ratingCount } = privateSalonBundle(salon);
    res.json({
      days,
      topServices: topServices.map((t) => ({
        name: t.name,
        count: t.count,
        revenue: Math.round(t.revenue_cents) / 100,
      })),
      ratingDistribution: [5, 4, 3, 2, 1].map((star) => ({
        rating: star,
        count: ratings.find((r) => r.rating === star)?.count ?? 0,
      })),
      recentBookings: recentBookings.map(bookingRow),
      subscribers: subscribers.count,
      rating,
      ratingCount,
      views: salon.views,
    });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Services                                                           */
/* ------------------------------------------------------------------ */

router.post("/me/services", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const name = cleanText(req.body?.name, 100);
    if (!name) throw new ApiError(400, "Service name is required.", "invalid_name");
    const max = db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM services WHERE salon_id = ?").get(salon.id) as any;
    const id = newId();
    const now = nowIso();
    db.prepare(
      `INSERT INTO services (id, salon_id, name, description, category, price_cents, duration_minutes, is_active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      salon.id,
      name,
      cleanMultiline(req.body?.description, 1000),
      cleanText(req.body?.category, 60),
      toCents(req.body?.price),
      Math.min(Math.max(Number(req.body?.durationMinutes) || 0, 0), 1440),
      req.body?.isActive === false ? 0 : 1,
      max.m + 1,
      now,
      now
    );
    touchSalon(salon.id);
    const row = db.prepare("SELECT * FROM services WHERE id = ?").get(id) as any;
    res.status(201).json({ service: serviceRow(row) });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/services/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const existing = assertOwnedResource("services", req.params.id, salon.id);
    const body = req.body ?? {};
    const updates: { column: string; value: unknown }[] = [];
    if (body.name !== undefined) {
      const name = cleanText(body.name, 100);
      if (!name) throw new ApiError(400, "Service name is required.", "invalid_name");
      updates.push({ column: "name", value: name });
    }
    if (body.description !== undefined) updates.push({ column: "description", value: cleanMultiline(body.description, 1000) });
    if (body.category !== undefined) updates.push({ column: "category", value: cleanText(body.category, 60) });
    if (body.price !== undefined) updates.push({ column: "price_cents", value: toCents(body.price) });
    if (body.durationMinutes !== undefined) {
      updates.push({ column: "duration_minutes", value: Math.min(Math.max(Number(body.durationMinutes) || 0, 0), 1440) });
    }
    if (body.isActive !== undefined) updates.push({ column: "is_active", value: parseBoolean(body.isActive, true) ? 1 : 0 });
    if (body.sortOrder !== undefined) updates.push({ column: "sort_order", value: Math.max(0, Number(body.sortOrder) || 0) });
    if (updates.length) {
      const setClause = updates.map((u) => `${u.column} = ?`).join(", ");
      db.prepare(`UPDATE services SET ${setClause}, updated_at = ? WHERE id = ?`).run(
        ...updates.map((u) => u.value),
        nowIso(),
        existing.id
      );
      touchSalon(salon.id);
    }
    const row = db.prepare("SELECT * FROM services WHERE id = ?").get(existing.id) as any;
    res.json({ service: serviceRow(row) });
  } catch (error) {
    next(error);
  }
});

router.delete("/me/services/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    assertOwnedResource("services", req.params.id, salon.id);
    db.prepare("DELETE FROM services WHERE id = ?").run(req.params.id);
    touchSalon(salon.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/me/services/reorder", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const update = db.prepare("UPDATE services SET sort_order = ? WHERE id = ? AND salon_id = ?");
    const tx = db.transaction(() => {
      ids.forEach((id, index) => update.run(index, id, salon.id));
    });
    tx();
    touchSalon(salon.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Staff                                                               */
/* ------------------------------------------------------------------ */

router.post("/me/staff", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const name = cleanText(req.body?.name, 100);
    if (!name) throw new ApiError(400, "Team member name is required.", "invalid_name");
    const specialties = Array.isArray(req.body?.specialties)
      ? req.body.specialties.map((s: unknown) => cleanText(s, 40)).filter(Boolean).slice(0, 12)
      : [];
    const max = db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM staff WHERE salon_id = ?").get(salon.id) as any;
    const id = newId();
    const now = nowIso();
    db.prepare(
      `INSERT INTO staff (id, salon_id, name, role, bio, image_url, specialties_json, experience_years, is_active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      salon.id,
      name,
      cleanText(req.body?.role, 100),
      cleanMultiline(req.body?.bio, 1000),
      safeImageUrl(req.body?.imageUrl),
      JSON.stringify(specialties),
      Math.min(Math.max(Number(req.body?.experienceYears) || 0, 0), 70),
      req.body?.isActive === false ? 0 : 1,
      max.m + 1,
      now,
      now
    );
    touchSalon(salon.id);
    const row = db.prepare("SELECT * FROM staff WHERE id = ?").get(id) as any;
    res.status(201).json({ staff: staffRow(row) });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/staff/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const existing = assertOwnedResource("staff", req.params.id, salon.id);
    const body = req.body ?? {};
    const updates: { column: string; value: unknown }[] = [];
    if (body.name !== undefined) {
      const name = cleanText(body.name, 100);
      if (!name) throw new ApiError(400, "Team member name is required.", "invalid_name");
      updates.push({ column: "name", value: name });
    }
    if (body.role !== undefined) updates.push({ column: "role", value: cleanText(body.role, 100) });
    if (body.bio !== undefined) updates.push({ column: "bio", value: cleanMultiline(body.bio, 1000) });
    if (body.imageUrl !== undefined) updates.push({ column: "image_url", value: safeImageUrl(body.imageUrl) });
    if (body.specialties !== undefined) {
      const specialties = Array.isArray(body.specialties)
        ? body.specialties.map((s: unknown) => cleanText(s, 40)).filter(Boolean).slice(0, 12)
        : [];
      updates.push({ column: "specialties_json", value: JSON.stringify(specialties) });
    }
    if (body.experienceYears !== undefined) {
      updates.push({ column: "experience_years", value: Math.min(Math.max(Number(body.experienceYears) || 0, 0), 70) });
    }
    if (body.isActive !== undefined) updates.push({ column: "is_active", value: parseBoolean(body.isActive, true) ? 1 : 0 });
    if (body.sortOrder !== undefined) updates.push({ column: "sort_order", value: Math.max(0, Number(body.sortOrder) || 0) });
    if (updates.length) {
      const setClause = updates.map((u) => `${u.column} = ?`).join(", ");
      db.prepare(`UPDATE staff SET ${setClause}, updated_at = ? WHERE id = ?`).run(
        ...updates.map((u) => u.value),
        nowIso(),
        existing.id
      );
      touchSalon(salon.id);
    }
    const row = db.prepare("SELECT * FROM staff WHERE id = ?").get(existing.id) as any;
    res.json({ staff: staffRow(row) });
  } catch (error) {
    next(error);
  }
});

router.delete("/me/staff/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    assertOwnedResource("staff", req.params.id, salon.id);
    db.prepare("DELETE FROM staff WHERE id = ?").run(req.params.id);
    touchSalon(salon.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Gallery                                                             */
/* ------------------------------------------------------------------ */

router.post("/me/gallery", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const imageUrl = safeImageUrl(req.body?.imageUrl, 3000);
    if (!imageUrl) throw new ApiError(400, "Upload an image or paste a valid image URL.", "invalid_image");
    const max = db.prepare("SELECT COALESCE(MAX(sort_order), -1) AS m FROM gallery WHERE salon_id = ?").get(salon.id) as any;
    const id = newId();
    db.prepare(
      "INSERT INTO gallery (id, salon_id, image_url, caption, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(id, salon.id, imageUrl, cleanText(req.body?.caption, 160), max.m + 1, nowIso());
    touchSalon(salon.id);
    const row = db.prepare("SELECT * FROM gallery WHERE id = ?").get(id) as any;
    res.status(201).json({ image: galleryRow(row) });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/gallery/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const existing = assertOwnedResource("gallery", req.params.id, salon.id);
    const updates: { column: string; value: unknown }[] = [];
    if (req.body?.caption !== undefined) updates.push({ column: "caption", value: cleanText(req.body.caption, 160) });
    if (req.body?.imageUrl !== undefined) {
      const url = safeImageUrl(req.body.imageUrl, 3000);
      if (!url) throw new ApiError(400, "Invalid image URL.", "invalid_image");
      updates.push({ column: "image_url", value: url });
    }
    if (updates.length) {
      const setClause = updates.map((u) => `${u.column} = ?`).join(", ");
      db.prepare(`UPDATE gallery SET ${setClause} WHERE id = ?`).run(...updates.map((u) => u.value), existing.id);
      touchSalon(salon.id);
    }
    const row = db.prepare("SELECT * FROM gallery WHERE id = ?").get(existing.id) as any;
    res.json({ image: galleryRow(row) });
  } catch (error) {
    next(error);
  }
});

router.delete("/me/gallery/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    assertOwnedResource("gallery", req.params.id, salon.id);
    db.prepare("DELETE FROM gallery WHERE id = ?").run(req.params.id);
    touchSalon(salon.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

router.post("/me/gallery/reorder", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const ids: string[] = Array.isArray(req.body?.ids) ? req.body.ids.map(String) : [];
    const update = db.prepare("UPDATE gallery SET sort_order = ? WHERE id = ? AND salon_id = ?");
    const tx = db.transaction(() => {
      ids.forEach((id, index) => update.run(index, id, salon.id));
    });
    tx();
    touchSalon(salon.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Bookings                                                           */
/* ------------------------------------------------------------------ */

router.get("/me/bookings", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const status = String(req.query.status ?? "");
    const from = String(req.query.from ?? "");
    const to = String(req.query.to ?? "");
    const clauses = ["salon_id = ?"];
    const params: unknown[] = [salon.id];
    if (["pending", "confirmed", "completed", "cancelled"].includes(status)) {
      clauses.push("status = ?");
      params.push(status);
    }
    if (isValidDate(from)) {
      clauses.push("date >= ?");
      params.push(from);
    }
    if (isValidDate(to)) {
      clauses.push("date <= ?");
      params.push(to);
    }
    const rows = db
      .prepare(`SELECT * FROM bookings WHERE ${clauses.join(" AND ")} ORDER BY date DESC, time DESC, created_at DESC LIMIT 500`)
      .all(...params) as any[];
    res.json({ bookings: rows.map(bookingRow) });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/bookings/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const existing = assertOwnedResource("bookings", req.params.id, salon.id);
    const updates: { column: string; value: unknown }[] = [];
    if (req.body?.status !== undefined) {
      const status = String(req.body.status);
      if (!["pending", "confirmed", "completed", "cancelled"].includes(status)) {
        throw new ApiError(400, "Invalid booking status.", "invalid_status");
      }
      updates.push({ column: "status", value: status });
    }
    if (req.body?.notes !== undefined) updates.push({ column: "notes", value: cleanMultiline(req.body.notes, 2000) });
    if (req.body?.staffId !== undefined) {
      if (req.body.staffId) assertOwnedResource("staff", String(req.body.staffId), salon.id);
      const staff = req.body.staffId ? db.prepare("SELECT * FROM staff WHERE id = ?").get(req.body.staffId) as any : null;
      updates.push({ column: "staff_id", value: staff?.id ?? null });
      updates.push({ column: "staff_name", value: staff?.name ?? "" });
    }
    if (updates.length) {
      const setClause = updates.map((u) => `${u.column} = ?`).join(", ");
      db.prepare(`UPDATE bookings SET ${setClause}, updated_at = ? WHERE id = ?`).run(
        ...updates.map((u) => u.value),
        nowIso(),
        existing.id
      );
    }
    const row = db.prepare("SELECT * FROM bookings WHERE id = ?").get(existing.id) as any;
    // Keep the guest in the loop: a status change is only useful if the client
    // who requested the appointment is told about it.
    if (
      req.body?.status !== undefined &&
      row.status !== existing.status &&
      ["confirmed", "cancelled", "completed"].includes(row.status) &&
      row.customer_email
    ) {
      void sendBookingStatusEmail({
        ...bookingEmailPayload(salon, row),
        event: row.status as "confirmed" | "cancelled" | "completed",
      });
    }
    res.json({ booking: bookingRow(row) });
  } catch (error) {
    next(error);
  }
});

router.delete("/me/bookings/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    assertOwnedResource("bookings", req.params.id, salon.id);
    db.prepare("DELETE FROM bookings WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/** One-tap appointment reminder for pending/confirmed requests. */
router.post("/me/bookings/:id/reminder", async (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const existing = assertOwnedResource("bookings", req.params.id, salon.id) as any;
    if (!["pending", "confirmed"].includes(existing.status)) {
      throw new ApiError(400, "Only pending or confirmed bookings can be reminded.", "not_remindable");
    }
    if (!existing.customer_email) {
      throw new ApiError(400, "This booking has no customer email address.", "no_email");
    }
    const delivered = await sendReminderEmail(bookingEmailPayload(salon, existing));
    res.json({
      success: true,
      delivered,
      message: delivered
        ? `Reminder sent to ${existing.customer_email}.`
        : "Email is not configured on this server, so the reminder was logged instead of sent.",
    });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Reviews                                                            */
/* ------------------------------------------------------------------ */

router.get("/me/reviews", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const rows = db
      .prepare("SELECT * FROM reviews WHERE salon_id = ? ORDER BY created_at DESC LIMIT 300")
      .all(salon.id) as any[];
    res.json({ reviews: rows.map(reviewRow) });
  } catch (error) {
    next(error);
  }
});

router.patch("/me/reviews/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const existing = assertOwnedResource("reviews", req.params.id, salon.id);
    const updates: { column: string; value: unknown }[] = [];
    if (req.body?.status !== undefined) {
      const status = String(req.body.status);
      if (!["published", "hidden"].includes(status)) throw new ApiError(400, "Invalid review status.", "invalid_status");
      updates.push({ column: "status", value: status });
    }
    if (req.body?.ownerReply !== undefined) {
      updates.push({ column: "owner_reply", value: cleanMultiline(req.body.ownerReply, 1200) });
    }
    if (updates.length) {
      const setClause = updates.map((u) => `${u.column} = ?`).join(", ");
      db.prepare(`UPDATE reviews SET ${setClause}, updated_at = ? WHERE id = ?`).run(
        ...updates.map((u) => u.value),
        nowIso(),
        existing.id
      );
      touchSalon(salon.id);
    }
    const row = db.prepare("SELECT * FROM reviews WHERE id = ?").get(existing.id) as any;
    res.json({ review: reviewRow(row) });
  } catch (error) {
    next(error);
  }
});

router.delete("/me/reviews/:id", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    assertOwnedResource("reviews", req.params.id, salon.id);
    db.prepare("DELETE FROM reviews WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Custom domain (optional, verified by DNS TXT record)               */
/* ------------------------------------------------------------------ */

router.post("/me/domain", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    const domain = normalizeDomain(req.body?.domain);
    if (!domain) throw new ApiError(400, "Enter a valid domain like www.yoursalon.com.", "invalid_domain");
    const existing = db.prepare("SELECT id FROM salons WHERE custom_domain = ? AND id <> ?").get(domain, salon.id);
    if (existing) throw new ApiError(409, "That domain is already connected to another salon.", "domain_taken");
    const token = salon.domain_verify_token || `velvet-${newId().replace(/-/g, "").slice(0, 24)}`;
    db.prepare(
      "UPDATE salons SET custom_domain = ?, custom_domain_verified = 0, domain_verify_token = ?, updated_at = ? WHERE id = ?"
    ).run(domain, token, nowIso(), salon.id);
    res.json({
      domain,
      verified: false,
      record: { type: "TXT", name: `_velvet.${domain}`, value: `velvet-verify=${token}` },
      cname: { type: "CNAME", name: domain, value: process.env.PUBLIC_BASE_DOMAIN || "your-platform-domain.com" },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/me/domain/verify", async (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    if (!salon.custom_domain || !salon.domain_verify_token) {
      throw new ApiError(400, "Add a domain before verifying it.", "no_domain");
    }
    const dns = await import("dns/promises");
    const records = await dns.resolveTxt(`_velvet.${salon.custom_domain}`).catch(() => [] as string[][]);
    const expected = `velvet-verify=${salon.domain_verify_token}`;
    const verified = records.some((chunks) => chunks.join("") === expected);
    if (!verified) {
      throw new ApiError(400, "DNS record not found yet. Changes can take a few minutes to propagate.", "not_verified");
    }
    db.prepare("UPDATE salons SET custom_domain_verified = 1, updated_at = ? WHERE id = ?").run(nowIso(), salon.id);
    res.json({ verified: true, domain: salon.custom_domain });
  } catch (error) {
    next(error);
  }
});

router.delete("/me/domain", (req, res, next) => {
  try {
    const salon = ownerSalon(req);
    db.prepare(
      "UPDATE salons SET custom_domain = NULL, custom_domain_verified = 0, domain_verify_token = NULL, updated_at = ? WHERE id = ?"
    ).run(nowIso(), salon.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
