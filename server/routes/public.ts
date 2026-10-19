import { Router } from "express";
import db, { newId, nowIso } from "../db";
import { rateLimit } from "../auth";
import {
  ApiError,
  cleanMultiline,
  cleanText,
  digitsOnly,
  isEmail,
  isValidDate,
  isValidTime,
  minutesToTime,
  normalizeEmail,
  timeToMinutes,
} from "../validation";
import {
  directorySalon,
  publishedSalonBundle,
  reviewRow,
} from "../serializers";
import { getSettings } from "../settings";
import { sendBookingEmails } from "../emails";

const router = Router();

const publicFormLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  message: "Too many submissions from this device. Please try again later.",
  key: (req) => `public:${req.ip ?? "unknown"}`,
});

function publishedSalon(slug: string) {
  return db
    .prepare(
      "SELECT * FROM salons WHERE slug = ? COLLATE NOCASE AND status = 'published' AND approval_status = 'approved'"
    )
    .get(slug) as any;
}

function todayIn(timezone: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function minutesNowIn(timezone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone || "UTC",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(new Date());
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
    const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
    return hour * 60 + minute;
  } catch {
    const now = new Date();
    return now.getHours() * 60 + now.getMinutes();
  }
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function weekdayName(date: string): string {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "UTC" }).format(
    new Date(`${date}T12:00:00Z`)
  );
}

function computeAvailability(row: any, bundle: any, date: string, serviceId?: string, staffId?: string) {
  const settings = bundle.bookingSettings || {};
  if (settings.enabled === false) {
    return { date, closed: true, reason: "Online booking is currently disabled.", slots: [] };
  }
  if (!isValidDate(date)) throw new ApiError(400, "Choose a valid date.", "invalid_date");

  const today = todayIn(bundle.timezone);
  const maxDate = addDays(today, settings.maxAdvanceDays ?? 60);
  if (date < today) return { date, closed: true, reason: "This date has already passed.", slots: [] };
  if (date > maxDate) {
    return { date, closed: true, reason: `Bookings are open up to ${settings.maxAdvanceDays ?? 60} days ahead.`, slots: [] };
  }

  const day = weekdayName(date);
  const hours = (bundle.hours || []).find((h: any) => h.day === day);
  if (!hours || hours.closed) {
    return { date, closed: true, reason: `We are closed on ${day}.`, slots: [] };
  }

  const interval = Number(settings.slotIntervalMinutes) || 30;
  const openMinutes = timeToMinutes(hours.open);
  const closeMinutes = timeToMinutes(hours.close);
  const service = serviceId ? (bundle.services || []).find((s: any) => s.id === serviceId) : null;
  const duration = Number(service?.durationMinutes) || interval;
  const activeStaff = (bundle.staff || []).filter((s: any) => s.isActive !== false);
  const capacity = staffId ? 1 : Math.max(1, activeStaff.length);
  const minNotice = Math.max(0, Number(settings.minNoticeHours) || 0);
  const earliest = date === today ? minutesNowIn(bundle.timezone) + minNotice * 60 : -1;

  const booked = db
    .prepare(
      "SELECT time, staff_id FROM bookings WHERE salon_id = ? AND date = ? AND status IN ('pending','confirmed')"
    )
    .all(row.id, date) as { time: string; staff_id: string | null }[];

  const slots: { time: string; available: boolean }[] = [];
  for (let minute = openMinutes; minute + duration <= closeMinutes; minute += interval) {
    const time = minutesToTime(minute);
    const count = staffId
      ? booked.filter((b) => b.time === time && b.staff_id === staffId).length
      : booked.filter((b) => b.time === time).length;
    slots.push({ time, available: minute >= earliest && count < capacity });
  }

  return {
    date,
    closed: false,
    reason: "",
    hours: { open: hours.open, close: hours.close },
    slots,
  };
}

/* ------------------------------------------------------------------ */
/* Platform config                                                     */
/* ------------------------------------------------------------------ */

router.get("/config", (_req, res) => {
  const settings = getSettings();
  res.json({
    platformName: settings.platformName,
    supportEmail: settings.supportEmail,
    announcement: settings.announcement,
    signupsEnabled: settings.signupsEnabled,
    directoryVisible: settings.directoryVisible,
    baseDomain: process.env.PUBLIC_BASE_DOMAIN || "",
    siteOrigin: process.env.PUBLIC_SITE_ORIGIN || "",
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 6),
  });
});

/* ------------------------------------------------------------------ */
/* Directory                                                           */
/* ------------------------------------------------------------------ */

router.get("/salons", (req, res, next) => {
  try {
    const settings = getSettings();
    if (!settings.directoryVisible) {
      return res.json({ salons: [], directoryVisible: false });
    }
    const q = cleanText(req.query.q, 100).toLowerCase();
    const sort = String(req.query.sort || "newest");
    const rows = db
      .prepare(
        "SELECT * FROM salons WHERE status = 'published' AND approval_status = 'approved' ORDER BY published_at DESC, updated_at DESC LIMIT 120"
      )
      .all() as any[];
    let salons = rows.map(directorySalon);
    if (q) {
      salons = salons.filter((salon) => {
        return (
          salon.name.toLowerCase().includes(q) ||
          salon.tagline.toLowerCase().includes(q) ||
          salon.description.toLowerCase().includes(q) ||
          [salon.city, salon.state, salon.country].filter(Boolean).join(" ").toLowerCase().includes(q) ||
          salon.services.some((service: string) => service.toLowerCase().includes(q))
        );
      });
    }
    if (sort === "rating") salons.sort((a, b) => b.rating - a.rating || b.ratingCount - a.ratingCount);
    if (sort === "name") salons.sort((a, b) => a.name.localeCompare(b.name));
    res.setHeader("Cache-Control", "public, max-age=60");
    res.json({ salons, directoryVisible: true });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Public salon website                                                */
/* ------------------------------------------------------------------ */

router.get("/salons/:slug", (req, res, next) => {
  try {
    const row = publishedSalon(req.params.slug);
    if (!row) throw new ApiError(404, "This salon website does not exist or is not published yet.", "not_found");
    const bundle = publishedSalonBundle(row);
    db.prepare("UPDATE salons SET views = views + 1 WHERE id = ?").run(row.id);
    res.setHeader("Cache-Control", "public, max-age=30");
    res.json({ salon: { ...bundle, status: "published" } });
  } catch (error) {
    next(error);
  }
});

router.get("/salons/:slug/availability", (req, res, next) => {
  try {
    const row = publishedSalon(req.params.slug);
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");
    const bundle = publishedSalonBundle(row);
    const date = String(req.query.date || todayIn(bundle.timezone));
    const serviceId = req.query.serviceId ? String(req.query.serviceId) : undefined;
    const staffId = req.query.staffId ? String(req.query.staffId) : undefined;
    res.json(computeAvailability(row, bundle, date, serviceId, staffId));
  } catch (error) {
    next(error);
  }
});

router.post("/salons/:slug/bookings", publicFormLimiter, async (req, res, next) => {
  try {
    const row = publishedSalon(req.params.slug);
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");
    const bundle = publishedSalonBundle(row);
    if (bundle.bookingSettings?.enabled === false) {
      throw new ApiError(400, "Online booking is currently disabled. Please contact the salon directly.", "booking_disabled");
    }

    const serviceId = cleanText(req.body?.serviceId, 80);
    const service = (bundle.services || []).find((s: any) => s.id === serviceId);
    if (!service) throw new ApiError(400, "Please choose a valid service.", "invalid_service");

    const customerName = cleanText(req.body?.customerName, 100);
    if (customerName.length < 2) throw new ApiError(400, "Enter your full name.", "invalid_name");
    const customerPhone = digitsOnly(req.body?.customerPhone, 25);
    if (customerPhone.replace(/\D/g, "").length < 6) {
      throw new ApiError(400, "Enter a valid phone number.", "invalid_phone");
    }
    const email = normalizeEmail(req.body?.customerEmail);
    if (email && !isEmail(email)) throw new ApiError(400, "Enter a valid email address.", "invalid_email");
    if (bundle.bookingSettings?.requireEmail && !email) {
      throw new ApiError(400, "This salon requires an email address for bookings.", "email_required");
    }

    const date = String(req.body?.date || "");
    const time = String(req.body?.time || "");
    if (!isValidDate(date)) throw new ApiError(400, "Choose a valid appointment date.", "invalid_date");
    if (!isValidTime(time)) throw new ApiError(400, "Choose an available time slot.", "invalid_time");

    const staffId = req.body?.staffId ? cleanText(req.body.staffId, 80) : "";
    const staff = staffId ? (bundle.staff || []).find((s: any) => s.id === staffId) : null;
    if (staffId && !staff) throw new ApiError(400, "Choose a valid team member.", "invalid_staff");

    const availability = computeAvailability(row, bundle, date, service.id, staff?.id);
    const slot = availability.slots.find((s: any) => s.time === time);
    if (!slot || !slot.available) {
      throw new ApiError(409, "That time is no longer available. Please choose another slot.", "slot_unavailable");
    }

    const id = newId();
    const now = nowIso();
    const create = db.transaction(() => {
      const existing = db
        .prepare(
          "SELECT COUNT(*) AS count FROM bookings WHERE salon_id = ? AND date = ? AND time = ? AND status IN ('pending','confirmed')" +
            (staff?.id ? " AND staff_id = ?" : "")
        )
        .get(...(staff?.id ? [row.id, date, time, staff.id] : [row.id, date, time])) as { count: number };
      const activeStaff = (bundle.staff || []).filter((s: any) => s.isActive !== false).length;
      const capacity = staff?.id ? 1 : Math.max(1, activeStaff);
      if (existing.count >= capacity) {
        throw new ApiError(409, "That time was just booked. Please choose another slot.", "slot_unavailable");
      }
      db.prepare(
        `INSERT INTO bookings
          (id, salon_id, service_id, staff_id, service_name, staff_name, customer_name, customer_email,
           customer_phone, date, time, notes, status, price_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)`
      ).run(
        id,
        row.id,
        service.id,
        staff?.id ?? null,
        service.name,
        staff?.name ?? "",
        customerName,
        email,
        customerPhone,
        date,
        time,
        cleanMultiline(req.body?.notes, 1000),
        Number(service.priceCents) || 0,
        now,
        now
      );
    });
    create();

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id) as any;
    void sendBookingEmails({
      salon: {
        name: bundle.name,
        email: bundle.email,
        phone: bundle.phone,
        address: bundle.address,
        city: bundle.city,
        slug: bundle.slug,
        currency: bundle.currency,
        timezone: bundle.timezone,
      },
      booking: {
        id: booking.id,
        customerName: booking.customer_name,
        customerEmail: booking.customer_email,
        customerPhone: booking.customer_phone,
        serviceName: booking.service_name,
        staffName: booking.staff_name,
        date: booking.date,
        time: booking.time,
        notes: booking.notes,
        price: booking.price_cents / 100,
      },
    });

    res.status(201).json({
      booking: {
        id,
        reference: id.slice(0, 8).toUpperCase(),
        date,
        time,
        status: "pending",
        serviceName: service.name,
        staffName: staff?.name ?? "",
        price: (Number(service.priceCents) || 0) / 100,
      },
      message: "Your booking request has been sent to the salon.",
    });
  } catch (error) {
    next(error);
  }
});

router.post("/salons/:slug/reviews", publicFormLimiter, (req, res, next) => {
  try {
    const row = publishedSalon(req.params.slug);
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");
    const authorName = cleanText(req.body?.authorName, 80);
    if (authorName.length < 2) throw new ApiError(400, "Enter your name.", "invalid_name");
    const rating = Math.round(Number(req.body?.rating));
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      throw new ApiError(400, "Choose a rating from 1 to 5 stars.", "invalid_rating");
    }
    const comment = cleanMultiline(req.body?.comment, 2000);
    if (comment.length < 5) throw new ApiError(400, "Please share a little more about your visit.", "invalid_comment");
    const email = normalizeEmail(req.body?.customerEmail ?? req.body?.authorEmail);
    if (email && !isEmail(email)) throw new ApiError(400, "Enter a valid email address.", "invalid_email");
    const id = newId();
    const now = nowIso();
    db.prepare(
      `INSERT INTO reviews (id, salon_id, author_name, author_email, rating, title, comment, status, owner_reply, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'published', '', ?, ?)`
    ).run(id, row.id, authorName, email, rating, cleanText(req.body?.title, 120), comment, now, now);
    const saved = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id) as any;
    res.status(201).json({ review: reviewRow(saved), message: "Thank you for sharing your experience." });
  } catch (error) {
    next(error);
  }
});

router.post("/salons/:slug/subscribe", publicFormLimiter, (req, res, next) => {
  try {
    const row = publishedSalon(req.params.slug);
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");
    const email = normalizeEmail(req.body?.email);
    if (!isEmail(email)) throw new ApiError(400, "Enter a valid email address.", "invalid_email");
    db.prepare("INSERT OR IGNORE INTO subscribers (id, salon_id, email, created_at) VALUES (?, ?, ?, ?)").run(
      newId(),
      row.id,
      email,
      nowIso()
    );
    res.json({ success: true, message: "You are on the list." });
  } catch (error) {
    next(error);
  }
});

export default router;
