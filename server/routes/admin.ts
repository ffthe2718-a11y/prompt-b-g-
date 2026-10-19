import { Router } from "express";
import db, { nowIso } from "../db";
import { AuthedRequest, requireAdmin, requireAuth } from "../auth";
import { ApiError, cleanText, isEmail, normalizeEmail } from "../validation";
import { privateSalonBundle, publicSalonBundle, reviewSummary, userPayload } from "../serializers";
import { sendSalonStatusEmail, sendPasswordResetEmail } from "../emails";
import { createHash, randomBytes } from "node:crypto";
import {
  approvalHistory,
  contentHash,
  markApprovedInline,
  markReviewed,
  submitBlockers,
} from "../approval";
import {
  PLANS,
  PLAN_IDS,
  SUBSCRIPTION_STATUSES,
  getSettings,
  logAudit,
  planPrice,
  updateSettings,
} from "../settings";

const router = Router();
router.use(requireAuth, requireAdmin);

function currentAdmin(req: AuthedRequest) {
  return req.user!;
}

/** Active super admins other than the row being changed. */
function otherActiveAdmins(userId: string): number {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin' AND status = 'active' AND id <> ?"
    )
    .get(userId) as any;
  return row.count;
}

function userRow(row: any) {
  const salon = db
    .prepare("SELECT id, name, slug, status, plan, subscription_status, subscription_renews_at FROM salons WHERE owner_id = ?")
    .get(row.id) as any;
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    status: row.status || "active",
    emailVerified: row.email_verified === 1,
    provider: row.google_id ? "google" : "password",
    hasPassword: row.password_set !== 0,
    avatarUrl: row.avatar_url || null,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
    salon: salon
      ? {
          id: salon.id,
          name: salon.name,
          slug: salon.slug,
          status: salon.status,
          plan: salon.plan,
          subscriptionStatus: salon.subscription_status,
          renewsAt: salon.subscription_renews_at,
        }
      : null,
  };
}

/* ------------------------------------------------------------------ */
/* Overview                                                            */
/* ------------------------------------------------------------------ */

router.get("/stats", (_req, res) => {
  const users = db.prepare("SELECT COUNT(*) AS count FROM users").get() as any;
  const owners = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'owner'").get() as any;
  const admins = db.prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'super_admin'").get() as any;
  const suspended = db.prepare("SELECT COUNT(*) AS count FROM users WHERE status = 'suspended'").get() as any;
  const salons = db.prepare("SELECT COUNT(*) AS count FROM salons").get() as any;
  const published = db.prepare("SELECT COUNT(*) AS count FROM salons WHERE status = 'published'").get() as any;
  const bookings = db.prepare("SELECT COUNT(*) AS count FROM bookings").get() as any;
  const revenue = db
    .prepare("SELECT COALESCE(SUM(price_cents), 0) AS value FROM bookings WHERE status IN ('confirmed','completed')")
    .get() as any;
  const reviews = db.prepare("SELECT COUNT(*) AS count FROM reviews WHERE status = 'published'").get() as any;
  const pendingApprovals = db
    .prepare("SELECT COUNT(*) AS count FROM salons WHERE approval_status = 'pending'")
    .get() as any;
  const newUsers = db
    .prepare("SELECT COUNT(*) AS count FROM users WHERE created_at >= ?")
    .get(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) as any;

  const planRows = db
    .prepare("SELECT plan, COUNT(*) AS count FROM salons GROUP BY plan")
    .all() as { plan: string; count: number }[];
  const plans = Object.fromEntries(PLAN_IDS.map((id) => [id, 0])) as Record<string, number>;
  for (const row of planRows) plans[row.plan] = row.count;

  const mrr = (db.prepare("SELECT plan, COUNT(*) AS count FROM salons WHERE subscription_status IN ('active','trialing') GROUP BY plan").all() as any[])
    .reduce((sum, row) => sum + planPrice(row.plan) * row.count, 0);

  res.json({
    users: users.count,
    owners: owners.count,
    superAdmins: admins.count,
    suspendedUsers: suspended.count,
    newUsers30d: newUsers.count,
    salons: salons.count,
    publishedSalons: published.count,
    bookings: bookings.count,
    revenue: Math.round(revenue.value) / 100,
    reviews: reviews.count,
    pendingApprovals: pendingApprovals.count,
    plans,
    mrr,
  });
});

/* ------------------------------------------------------------------ */
/* Users                                                               */
/* ------------------------------------------------------------------ */

router.get("/users", (req, res) => {
  const q = cleanText(req.query.q, 100).toLowerCase();
  const role = String(req.query.role || "");
  const status = String(req.query.status || "");

  let rows = db
    .prepare("SELECT * FROM users ORDER BY created_at DESC")
    .all() as any[];
  if (q) {
    rows = rows.filter(
      (row) =>
        row.name.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        String(row.google_id || "").includes(q)
    );
  }
  if (role && role !== "all") rows = rows.filter((row) => row.role === role);
  if (status && status !== "all") rows = rows.filter((row) => (row.status || "active") === status);

  res.json({ users: rows.map(userRow) });
});

router.patch("/users/:id", (req, res, next) => {
  try {
    const actor = currentAdmin(req);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "User not found.", "not_found");

    const patch: { role?: string; status?: string; name?: string } = {};
    if (req.body?.role !== undefined) {
      const role = String(req.body.role);
      if (!["owner", "super_admin"].includes(role)) throw new ApiError(400, "Invalid role.", "invalid_role");
      if (row.id === actor.id && role !== "super_admin") {
        throw new ApiError(400, "You cannot remove your own super admin access.", "cannot_demote_self");
      }
      if (row.role === "super_admin" && role !== "super_admin" && row.status === "active" && otherActiveAdmins(row.id) === 0) {
        throw new ApiError(400, "Keep at least one active super admin on the platform.", "last_super_admin");
      }
      patch.role = role;
    }
    if (req.body?.status !== undefined) {
      const status = String(req.body.status);
      if (!["active", "suspended"].includes(status)) throw new ApiError(400, "Invalid status.", "invalid_status");
      if (row.id === actor.id && status === "suspended") {
        throw new ApiError(400, "You cannot suspend your own account.", "cannot_suspend_self");
      }
      patch.status = status;
    }
    if (req.body?.name !== undefined) {
      const name = cleanText(req.body.name, 80);
      if (name.length < 2) throw new ApiError(400, "Name must be at least 2 characters.", "invalid_name");
      patch.name = name;
    }

    const fields: string[] = [];
    const values: unknown[] = [];
    for (const [key, value] of Object.entries(patch)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    if (fields.length) {
      db.prepare(`UPDATE users SET ${fields.join(", ")}, updated_at = ? WHERE id = ?`).run(
        ...values,
        nowIso(),
        row.id
      );
    }
    logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user_updated",
      targetType: "user",
      targetId: row.id,
      detail: Object.keys(patch).join(","),
    });

    const updated = db.prepare("SELECT * FROM users WHERE id = ?").get(row.id) as any;
    res.json({ user: userRow(updated), session: updated.id === actor.id ? userPayload(updated) : null });
  } catch (error) {
    next(error);
  }
});

router.post("/users/:id/reset-password", async (req, res, next) => {
  try {
    const actor = currentAdmin(req);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "User not found.", "not_found");

    // Super admins send a single-use link; they never see or set the password.
    const token = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const now = nowIso();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    db.prepare("DELETE FROM password_resets WHERE user_id = ? AND used_at IS NULL").run(row.id);
    db.prepare(
      "INSERT INTO password_resets (token_hash, user_id, expires_at, used_at, created_at) VALUES (?, ?, ?, NULL, ?)"
    ).run(tokenHash, row.id, expiresAt, now);

    const delivered = await sendPasswordResetEmail({
      to: row.email,
      name: row.name || "there",
      resetUrl: `${appUrl(req)}/reset-password?token=${token}`,
    });

    logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "password_reset_requested",
      targetType: "user",
      targetId: row.id,
      detail: delivered ? "email" : "logged-only",
    });
    res.json({
      success: true,
      delivered,
      message: delivered
        ? `A password reset link is on its way to ${row.email}.`
        : "Email is not configured on this server, so the link was only written to the server log.",
    });
  } catch (error) {
    next(error);
  }
});

router.delete("/users/:id", (req, res, next) => {
  try {
    const actor = currentAdmin(req);
    const row = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "User not found.", "not_found");
    if (row.id === actor.id) throw new ApiError(400, "You cannot delete your own account.", "cannot_delete_self");
    if (row.role === "super_admin" && row.status === "active" && otherActiveAdmins(row.id) === 0) {
      throw new ApiError(400, "Keep at least one active super admin on the platform.", "last_super_admin");
    }
    db.prepare("DELETE FROM users WHERE id = ?").run(row.id);
    logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "user_deleted",
      targetType: "user",
      targetId: row.id,
      detail: row.email,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Salons                                                              */
/* ------------------------------------------------------------------ */

router.get("/salons", (req, res) => {
  const q = cleanText(req.query.q, 100).toLowerCase();
  const status = String(req.query.status || "");
  const rows = db
    .prepare(
      `SELECT s.*, u.name AS owner_name, u.email AS owner_email
       FROM salons s JOIN users u ON u.id = s.owner_id
       ORDER BY s.created_at DESC`
    )
    .all() as any[];

  const salons = rows
    .filter((row) => {
      if (status && status !== "all" && row.status !== status) return false;
      if (!q) return true;
      return (
        row.name.toLowerCase().includes(q) ||
        row.slug.toLowerCase().includes(q) ||
        row.owner_email.toLowerCase().includes(q)
      );
    })
    .map((row) => {
      const serviceCount = db.prepare("SELECT COUNT(*) AS count FROM services WHERE salon_id = ?").get(row.id) as any;
      const bookingCount = db.prepare("SELECT COUNT(*) AS count FROM bookings WHERE salon_id = ?").get(row.id) as any;
      const { rating, ratingCount } = reviewSummary(row.id);
      return {
        id: row.id,
        name: row.name,
        slug: row.slug,
        status: row.status,
        city: row.city,
        country: row.country,
        logoUrl: row.logo_url,
        template: row.template,
        primaryColor: row.primary_color,
        ownerName: row.owner_name,
        ownerEmail: row.owner_email,
        ownerId: row.owner_id,
        createdAt: row.created_at,
        publishedAt: row.published_at,
        views: row.views,
        serviceCount: serviceCount.count,
        bookingCount: bookingCount.count,
        rating,
        ratingCount,
        plan: row.plan,
        approvalStatus: row.approval_status || "draft",
        approvalNote: row.approval_note || "",
        submittedAt: row.submitted_at,
        approvedAt: row.approved_at,
        reviewedAt: row.reviewed_at,
        submissionStale:
          row.approval_status === "pending" && !!row.submitted_hash && row.submitted_hash !== contentHash(row),
        changesSinceApproval:
          row.approval_status === "approved" && !!row.approved_hash && row.approved_hash !== contentHash(row),
        subscriptionStatus: row.subscription_status,
        subscriptionRenewsAt: row.subscription_renews_at,
        customDomain: row.custom_domain_verified ? row.custom_domain : null,
      };
    });
  res.json({ salons });
});

router.patch("/salons/:id/status", (req, res, next) => {
  try {
    const actor = currentAdmin(req);
    const status = String(req.body?.status || "");
    if (!["draft", "published", "suspended"].includes(status)) {
      throw new ApiError(400, "Invalid salon status.", "invalid_status");
    }
    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");

    if (status === "published") {
      // A super admin publishing counts as approval of the current content.
      const state = { approvedHash: row.approved_hash, current: contentHash(row) };
      if (row.approval_status !== "approved" || state.approvedHash !== state.current) {
        markApprovedInline(row, { id: actor.id, email: actor.email });
      }
      const snapshot = publicSalonBundle(row, { includeReviews: false });
      db.prepare(
        "UPDATE salons SET status = 'published', published_json = ?, published_at = ?, updated_at = ? WHERE id = ?"
      ).run(JSON.stringify(snapshot), nowIso(), nowIso(), row.id);
    } else {
      db.prepare("UPDATE salons SET status = ?, updated_at = ? WHERE id = ?").run(status, nowIso(), row.id);
    }

    if (status === "suspended" && row.status !== "suspended") {
      const owner = db.prepare("SELECT name, email FROM users WHERE id = ?").get(row.owner_id) as any;
      if (owner?.email) {
        void sendSalonStatusEmail({
          to: owner.email,
          ownerName: owner.name || "there",
          salonName: row.name,
          event: "suspended",
          note: cleanText(req.body?.note, 2000),
          dashboardUrl: `${appUrl(req)}/dashboard`,
        });
      }
    }

    logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "salon_status_changed",
      targetType: "salon",
      targetId: row.id,
      detail: status,
    });
    res.json({ success: true, status });
  } catch (error) {
    next(error);
  }
});

router.patch("/salons/:id/subscription", (req, res, next) => {
  try {
    const actor = currentAdmin(req);
    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");

    const plan = req.body?.plan === undefined ? row.plan : String(req.body.plan);
    const status = req.body?.status === undefined ? row.subscription_status : String(req.body.status);
    if (!PLAN_IDS.includes(plan as any)) throw new ApiError(400, "Unknown plan.", "invalid_plan");
    if (!SUBSCRIPTION_STATUSES.includes(status as any)) {
      throw new ApiError(400, "Unknown subscription status.", "invalid_subscription_status");
    }
    const renewsAt =
      req.body?.renewsAt === undefined
        ? row.subscription_renews_at
        : req.body.renewsAt === null
          ? null
          : String(req.body.renewsAt).slice(0, 40);

    db.prepare(
      "UPDATE salons SET plan = ?, subscription_status = ?, subscription_renews_at = ?, updated_at = ? WHERE id = ?"
    ).run(plan, status, renewsAt, nowIso(), row.id);

    logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "subscription_updated",
      targetType: "salon",
      targetId: row.id,
      detail: `${plan}/${status}`,
    });
    res.json({ success: true, plan, status, renewsAt });
  } catch (error) {
    next(error);
  }
});

router.delete("/salons/:id", (req, res, next) => {
  try {
    const actor = currentAdmin(req);
    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");
    db.prepare("DELETE FROM salons WHERE id = ?").run(row.id);
    logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "salon_deleted",
      targetType: "salon",
      targetId: row.id,
      detail: row.slug,
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

/* ------------------------------------------------------------------ */
/* Subscriptions                                                       */
/* ------------------------------------------------------------------ */

router.get("/subscriptions", (_req, res) => {
  const rows = db
    .prepare(
      `SELECT s.id, s.name, s.slug, s.plan, s.subscription_status, s.subscription_renews_at, s.created_at,
              u.email AS owner_email, u.name AS owner_name
       FROM salons s JOIN users u ON u.id = s.owner_id
       ORDER BY s.created_at DESC`
    )
    .all() as any[];

  const byPlan = Object.fromEntries(PLAN_IDS.map((id) => [id, 0])) as Record<string, number>;
  const byStatus = Object.fromEntries(SUBSCRIPTION_STATUSES.map((id) => [id, 0])) as Record<string, number>;
  let mrr = 0;
  for (const row of rows) {
    byPlan[row.plan] = (byPlan[row.plan] || 0) + 1;
    byStatus[row.subscription_status] = (byStatus[row.subscription_status] || 0) + 1;
    if (row.subscription_status === "active" || row.subscription_status === "trialing") {
      mrr += planPrice(row.plan);
    }
  }

  res.json({
    plans: Object.values(PLANS),
    summary: { total: rows.length, byPlan, byStatus, mrr, currency: "INR" },
    subscriptions: rows.map((row) => ({
      salonId: row.id,
      salonName: row.name,
      slug: row.slug,
      ownerName: row.owner_name,
      ownerEmail: row.owner_email,
      plan: row.plan,
      status: row.subscription_status,
      renewsAt: row.subscription_renews_at,
      startedAt: row.created_at,
      price: planPrice(row.plan),
    })),
  });
});

/* ------------------------------------------------------------------ */
/* Platform settings                                                   */
/* ------------------------------------------------------------------ */

router.get("/settings", (_req, res) => {
  res.json({ settings: getSettings(), plans: Object.values(PLANS) });
});

router.patch("/settings", (req, res, next) => {
  try {
    const actor = currentAdmin(req);
    const patch: Record<string, unknown> = {};

    if (req.body?.platformName !== undefined) {
      const value = cleanText(req.body.platformName, 60);
      if (value.length < 2) throw new ApiError(400, "Platform name is too short.", "invalid_platform_name");
      patch.platformName = value;
    }
    if (req.body?.supportEmail !== undefined) {
      const email = normalizeEmail(req.body.supportEmail);
      if (!isEmail(email)) throw new ApiError(400, "Enter a valid support email.", "invalid_email");
      patch.supportEmail = email;
    }
    if (req.body?.announcement !== undefined) {
      patch.announcement = cleanText(req.body.announcement, 280);
    }
    if (req.body?.signupsEnabled !== undefined) patch.signupsEnabled = Boolean(req.body.signupsEnabled);
    if (req.body?.directoryVisible !== undefined) patch.directoryVisible = Boolean(req.body.directoryVisible);
    if (req.body?.defaultPlan !== undefined) {
      if (!PLAN_IDS.includes(String(req.body.defaultPlan) as any)) {
        throw new ApiError(400, "Unknown plan.", "invalid_plan");
      }
      patch.defaultPlan = String(req.body.defaultPlan);
    }

    const settings = updateSettings(patch);
    logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "settings_updated",
      targetType: "platform",
      detail: Object.keys(patch).join(","),
    });
    res.json({ settings });
  } catch (error) {
    next(error);
  }
});

router.get("/audit", (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 40, 1), 200);
  const rows = db
    .prepare("SELECT * FROM admin_audit ORDER BY created_at DESC LIMIT ?")
    .all(limit) as any[];
  res.json({
    entries: rows.map((row) => ({
      id: row.id,
      actorEmail: row.actor_email,
      action: row.action,
      targetType: row.target_type,
      targetId: row.target_id,
      detail: row.detail,
      createdAt: row.created_at,
    })),
  });
});


function appUrl(req: any): string {
  return (
    (process.env.PUBLIC_SITE_ORIGIN || process.env.APP_URL || "").trim().replace(/\/$/, "") ||
    `${req.protocol}://${req.get("host")}`
  );
}

/* ------------------------------------------------------------------ */
/* Approvals                                                           */
/* ------------------------------------------------------------------ */

function approvalRow(row: any) {
  const ownerSalon = db
    .prepare("SELECT name, email FROM users WHERE id = ?")
    .get(row.owner_id) as any;
  const counts = {
    services: (db.prepare("SELECT COUNT(*) AS count FROM services WHERE salon_id = ? AND is_active = 1").get(row.id) as any).count,
    staff: (db.prepare("SELECT COUNT(*) AS count FROM staff WHERE salon_id = ? AND is_active = 1").get(row.id) as any).count,
    gallery: (db.prepare("SELECT COUNT(*) AS count FROM gallery WHERE salon_id = ?").get(row.id) as any).count,
  };
  const stale =
    row.approval_status === "pending" && !!row.submitted_hash && row.submitted_hash !== contentHash(row);
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    status: row.status,
    approvalStatus: row.approval_status || "draft",
    approvalNote: row.approval_note || "",
    submittedAt: row.submitted_at,
    approvedAt: row.approved_at,
    reviewedAt: row.reviewed_at,
    reviewedBy: row.reviewed_by,
    stale,
    changesSinceApproval:
      row.approval_status === "approved" && !!row.approved_hash && row.approved_hash !== contentHash(row),
    blockers: submitBlockers(row),
    counts,
    city: row.city,
    country: row.country,
    logoUrl: row.logo_url,
    heroImageUrl: row.hero_image_url,
    tagline: row.tagline,
    ownerName: ownerSalon?.name || "",
    ownerEmail: ownerSalon?.email || "",
    history: approvalHistory(row.id, 6),
  };
}

router.get("/approvals", (req, res) => {
  const status = String(req.query.status || "pending");
  const rows = db
    .prepare(
      `SELECT s.* FROM salons s
        WHERE (? = 'all' AND s.approval_status <> 'draft') OR s.approval_status = ?
        ORDER BY COALESCE(s.submitted_at, s.updated_at) DESC`
    )
    .all(status, status) as any[];

  const pending = db
    .prepare("SELECT COUNT(*) AS count FROM salons WHERE approval_status = 'pending'")
    .get() as any;

  res.json({
    pendingCount: pending.count,
    approvals: rows.map(approvalRow),
  });
});

router.get("/salons/:id/preview", (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");
    const owner = db.prepare("SELECT name, email FROM users WHERE id = ?").get(row.owner_id) as any;
    res.json({
      salon: privateSalonBundle(row),
      owner: { name: owner?.name || "", email: owner?.email || "" },
      approval: approvalRow(row),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/salons/:id/approval", (req, res, next) => {
  try {
    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");
    res.json({
      approval: approvalRow(row),
      history: approvalHistory(row.id, 50),
    });
  } catch (error) {
    next(error);
  }
});

function assertReviewable(row: any) {
  if (row.approval_status !== "pending") {
    throw new ApiError(409, "This salon has no submission waiting for review.", "not_pending");
  }
  if (row.submitted_hash && row.submitted_hash !== contentHash(row)) {
    throw new ApiError(
      409,
      "The owner changed the website after submitting it. Ask them to submit the latest version.",
      "submission_stale"
    );
  }
}

function reviewHandler(action: "approve" | "reject" | "request_changes", noteRequired: boolean) {
  return (req: any, res: any, next: any) => {
    try {
      const actor = currentAdmin(req);
      const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(req.params.id) as any;
      if (!row) throw new ApiError(404, "Salon not found.", "not_found");
      assertReviewable(row);

      const note = cleanText(req.body?.note, 2000);
      if (noteRequired && note.length < 4) {
        throw new ApiError(
          400,
          action === "reject"
            ? "Give the owner a reason for the rejection."
            : "Tell the owner what needs to change.",
          "note_required"
        );
      }

      markReviewed({ row, action, note, actor: { id: actor.id, email: actor.email } });
      const owner = db.prepare("SELECT name, email FROM users WHERE id = ?").get(row.owner_id) as any;
      if (owner?.email) {
        const site = row.slug ? `${appUrl(req)}/${row.slug}` : "";
        void sendSalonStatusEmail({
          to: owner.email,
          ownerName: owner.name || "there",
          salonName: row.name,
          event: action === "approve" ? "approved" : action === "reject" ? "rejected" : "changes_requested",
          note,
          siteUrl: site,
          dashboardUrl: `${appUrl(req)}/dashboard`,
        });
      }
      logAudit({
        actorId: actor.id,
        actorEmail: actor.email,
        action: `salon_${action}`,
        targetType: "salon",
        targetId: row.id,
        detail: note.slice(0, 200),
      });

      const updated = db.prepare("SELECT * FROM salons WHERE id = ?").get(row.id) as any;
      res.json({
        success: true,
        approvalStatus: updated.approval_status,
        approvalNote: updated.approval_note,
        salon: approvalRow(updated),
      });
    } catch (error) {
      next(error);
    }
  };
}

router.post("/salons/:id/approve", reviewHandler("approve", false));
router.post("/salons/:id/reject", reviewHandler("reject", true));
router.post("/salons/:id/request-changes", reviewHandler("request_changes", true));

/** Take a live website offline without suspending the salon or its approval. */
router.post("/salons/:id/unpublish", (req, res, next) => {
  try {
    const actor = currentAdmin(req);
    const row = db.prepare("SELECT * FROM salons WHERE id = ?").get(req.params.id) as any;
    if (!row) throw new ApiError(404, "Salon not found.", "not_found");
    if (row.status !== "published") {
      throw new ApiError(400, "This website is not currently published.", "not_published");
    }
    const note = cleanText(req.body?.note, 2000);
    db.prepare("UPDATE salons SET status = 'draft', updated_at = ? WHERE id = ?").run(nowIso(), row.id);
    const owner = db.prepare("SELECT name, email FROM users WHERE id = ?").get(row.owner_id) as any;
    if (owner?.email) {
      void sendSalonStatusEmail({
        to: owner.email,
        ownerName: owner.name || "there",
        salonName: row.name,
        event: "unpublished",
        note,
        siteUrl: row.slug ? `${appUrl(req)}/${row.slug}` : "",
        dashboardUrl: `${appUrl(req)}/dashboard`,
      });
    }
    logAudit({
      actorId: actor.id,
      actorEmail: actor.email,
      action: "salon_unpublished",
      targetType: "salon",
      targetId: row.id,
      detail: row.slug,
    });
    res.json({ success: true, status: "draft" });
  } catch (error) {
    next(error);
  }
});

export default router;
