import crypto from "crypto";
import db, { newId, nowIso } from "./db";

/**
 * Website approval workflow.
 *
 * Owners can build freely in a draft, then submit a snapshot for review.
 * Super admins approve, reject or request changes with a reason. Publishing is
 * only possible while the *current* draft still matches the approved content —
 * any later edit requires a fresh review, so nothing unreviewed can go live.
 */

export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected" | "changes_requested";
export type ReviewAction = "submit" | "approve" | "reject" | "request_changes" | "revoke";

export const APPROVAL_LABELS: Record<ApprovalStatus, string> = {
  draft: "Draft",
  pending: "Pending approval",
  approved: "Approved",
  rejected: "Rejected",
  changes_requested: "Changes requested",
};

interface ContentSnapshot {
  [key: string]: unknown;
}

/**
 * Everything a visitor can see, normalised into a deterministic object.
 * Volatile/derived values (views, ratings, timestamps, publication state and
 * the URL slug) are deliberately excluded so they don't trigger re-review.
 */
export function contentSnapshot(row: any): ContentSnapshot {
  const services = db
    .prepare("SELECT * FROM services WHERE salon_id = ? AND is_active = 1 ORDER BY sort_order, created_at, id")
    .all(row.id) as any[];
  const staff = db
    .prepare("SELECT * FROM staff WHERE salon_id = ? AND is_active = 1 ORDER BY sort_order, created_at, id")
    .all(row.id) as any[];
  const gallery = db
    .prepare("SELECT * FROM gallery WHERE salon_id = ? ORDER BY sort_order, created_at, id")
    .all(row.id) as any[];

  return {
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    logoUrl: row.logo_url,
    heroImageUrl: row.hero_image_url,
    aboutImageUrl: row.about_image_url,
    heroTitle: row.hero_title,
    heroSubtitle: row.hero_subtitle,
    aboutTitle: row.about_title,
    aboutText: row.about_text,
    announcement: row.announcement,
    ctaText: row.cta_text,
    address: row.address,
    city: row.city,
    state: row.state,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    instagram: row.instagram,
    facebook: row.facebook,
    tiktok: row.tiktok,
    website: row.website,
    currency: row.currency,
    timezone: row.timezone,
    template: row.template,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    sections: row.sections_json,
    hours: row.hours_json,
    bookingSettings: row.booking_json,
    services: services.map((service) => ({
      id: service.id,
      name: service.name,
      description: service.description,
      category: service.category,
      priceCents: service.price_cents,
      durationMinutes: service.duration_minutes,
      sortOrder: service.sort_order,
    })),
    staff: staff.map((member) => ({
      id: member.id,
      name: member.name,
      role: member.role,
      bio: member.bio,
      imageUrl: member.image_url,
      specialties: member.specialties_json,
      experienceYears: member.experience_years,
      sortOrder: member.sort_order,
    })),
    gallery: gallery.map((image) => ({
      id: image.id,
      url: image.url,
      caption: image.caption,
      sortOrder: image.sort_order,
    })),
  };
}

export function contentHash(row: any): string {
  return crypto.createHash("sha256").update(JSON.stringify(contentSnapshot(row))).digest("hex");
}

/** What still needs doing before a salon can be sent for review. */
export function submitBlockers(row: any): string[] {
  const blockers: string[] = [];
  if (String(row.name || "").trim().length < 2) blockers.push("Add your salon name");
  const services = db
    .prepare("SELECT COUNT(*) AS count FROM services WHERE salon_id = ? AND is_active = 1")
    .get(row.id) as any;
  if (!services.count) blockers.push("Add at least one active service");
  if (!row.phone && !row.email && !row.whatsapp) {
    blockers.push("Add a phone number or contact email");
  }
  if (!row.address && !row.city) blockers.push("Add your salon address or city");
  return blockers;
}

export function recordSalonReview(options: {
  salonId: string;
  action: ReviewAction;
  actorId?: string | null;
  actorEmail?: string;
  note?: string;
}) {
  db.prepare(
    `INSERT INTO salon_reviews (id, salon_id, actor_id, actor_email, action, note, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(
    newId(),
    options.salonId,
    options.actorId ?? null,
    options.actorEmail ?? "",
    options.action,
    (options.note ?? "").slice(0, 2000),
    nowIso()
  );
}

export function approvalHistory(salonId: string, limit = 25) {
  const rows = db
    .prepare("SELECT * FROM salon_reviews WHERE salon_id = ? ORDER BY created_at DESC LIMIT ?")
    .all(salonId, limit) as any[];
  return rows.map((row) => ({
    id: row.id,
    action: row.action as ReviewAction,
    note: row.note,
    actorEmail: row.actor_email,
    createdAt: row.created_at,
  }));
}

export interface ApprovalState {
  approvalStatus: ApprovalStatus;
  approvalNote: string;
  submittedAt: string | null;
  approvedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  approvalBlockers: string[];
  approvalStale: boolean;
  changesSinceApproval: boolean;
  canPublish: boolean;
  approvalHistory: ReturnType<typeof approvalHistory>;
}

export function approvalState(row: any): ApprovalState {
  const current = contentHash(row);
  const status = (row.approval_status || "draft") as ApprovalStatus;
  const approvedHash: string | null = row.approved_hash || null;
  const submittedHash: string | null = row.submitted_hash || null;
  const changesSinceApproval = status === "approved" && !!approvedHash && approvedHash !== current;
  const approvalStale = status === "pending" && !!submittedHash && submittedHash !== current;

  return {
    approvalStatus: status,
    approvalNote: row.approval_note || "",
    submittedAt: row.submitted_at || null,
    approvedAt: row.approved_at || null,
    reviewedAt: row.reviewed_at || null,
    reviewedBy: row.reviewed_by || null,
    approvalBlockers: submitBlockers(row),
    approvalStale,
    changesSinceApproval,
    canPublish: status === "approved" && !changesSinceApproval && row.status !== "suspended",
    approvalHistory: approvalHistory(row.id),
  };
}

/** Owner submitted their site for review. */
export function markSubmitted(row: any, actor: { id: string; email: string }) {
  const now = nowIso();
  db.prepare(
    `UPDATE salons
        SET approval_status = 'pending', submitted_at = ?, submitted_hash = ?,
            approval_note = '', reviewed_at = NULL, reviewed_by = NULL, updated_at = ?
      WHERE id = ?`
  ).run(now, contentHash(row), now, row.id);
  recordSalonReview({ salonId: row.id, action: "submit", actorId: actor.id, actorEmail: actor.email });
}

/** Super admin decision. Approval records the exact content that was reviewed. */
export function markReviewed(options: {
  row: any;
  action: "approve" | "reject" | "request_changes";
  note: string;
  actor: { id: string; email: string };
}) {
  const { row, action, note, actor } = options;
  const now = nowIso();
  const status: ApprovalStatus =
    action === "approve" ? "approved" : action === "reject" ? "rejected" : "changes_requested";

  if (action === "approve") {
    db.prepare(
      `UPDATE salons
          SET approval_status = ?, approval_note = ?, reviewed_at = ?, reviewed_by = ?,
              approved_at = ?, approved_hash = ?, updated_at = ?
        WHERE id = ?`
    ).run(status, note, now, actor.email, now, contentHash(row), now, row.id);
  } else {
    db.prepare(
      `UPDATE salons
          SET approval_status = ?, approval_note = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?
        WHERE id = ?`
    ).run(status, note, now, actor.email, now, row.id);
  }

  recordSalonReview({ salonId: row.id, action, note, actorId: actor.id, actorEmail: actor.email });
}

/** An approval snapshots the current draft, e.g. when a super admin publishes directly. */
export function markApprovedInline(row: any, actor: { id: string; email: string }, note = "Approved and published by a super admin.") {
  const now = nowIso();
  db.prepare(
    `UPDATE salons
        SET approval_status = 'approved', approval_note = ?, submitted_hash = ?,
            approved_at = ?, approved_hash = ?, reviewed_at = ?, reviewed_by = ?, updated_at = ?
      WHERE id = ?`
  ).run(note, contentHash(row), now, contentHash(row), now, actor.email, now, row.id);
  recordSalonReview({ salonId: row.id, action: "approve", note, actorId: actor.id, actorEmail: actor.email });
}

/**
 * Salons published before the approval workflow existed are treated as
 * approved at their published content so they keep working after upgrading.
 */
export function backfillLegacyApprovals() {
  const rows = db
    .prepare(
      `SELECT * FROM salons
        WHERE status = 'published' AND approval_status = 'draft' AND approved_at IS NULL`
    )
    .all() as any[];
  if (!rows.length) return;
  const update = db.prepare(
    `UPDATE salons
        SET approval_status = 'approved', approved_at = COALESCE(published_at, updated_at),
            submitted_at = COALESCE(published_at, updated_at), approved_hash = ?, updated_at = ?
      WHERE id = ?`
  );
  const now = nowIso();
  for (const row of rows) {
    update.run(contentHash(row), now, row.id);
  }
  console.log(`[approval] marked ${rows.length} existing published salon(s) as approved.`);
}
