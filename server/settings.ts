import db, { nowIso } from "./db";

/**
 * Platform-wide, super-admin editable settings.
 *
 * Values live in SQLite so a platform owner can change branding, support
 * details and access rules without redeploying. Environment variables act as
 * defaults for a fresh installation.
 */
export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  announcement: string;
  signupsEnabled: boolean;
  directoryVisible: boolean;
  defaultPlan: PlanId;
}

export type PlanId = "launch" | "studio" | "atelier";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export const PLANS: Record<
  PlanId,
  { id: PlanId; name: string; price: number; currency: string; blurb: string; features: string[] }
> = {
  launch: {
    id: "launch",
    name: "Launch",
    price: 0,
    currency: "INR",
    blurb: "Everything you need to get your salon online.",
    features: [
      "Public website with unique address",
      "Up to 5 services",
      "Online booking requests",
      "Gallery and reviews",
    ],
  },
  studio: {
    id: "studio",
    name: "Studio",
    price: 1499,
    currency: "INR",
    blurb: "For working salons with a full team and menu.",
    features: [
      "Unlimited services and team members",
      "Custom domain support",
      "Booking analytics",
      "Review replies",
    ],
  },
  atelier: {
    id: "atelier",
    name: "Atelier",
    price: 2999,
    currency: "INR",
    blurb: "For multi-stylist studios and bridal specialists.",
    features: [
      "Everything in Studio",
      "Priority support",
      "Advanced analytics",
      "Early access to new features",
    ],
  },
};

export const PLAN_IDS = Object.keys(PLANS) as PlanId[];
export const SUBSCRIPTION_STATUSES: SubscriptionStatus[] = ["trialing", "active", "past_due", "canceled"];

const DEFAULTS: PlatformSettings = {
  platformName: process.env.PLATFORM_NAME?.trim() || "Velvet Salon Studio",
  supportEmail: process.env.SUPPORT_EMAIL?.trim() || "hello@velvetstudio.app",
  announcement: "",
  signupsEnabled: true,
  directoryVisible: true,
  defaultPlan: "launch",
};

function readAll(): Record<string, string> {
  const rows = db.prepare("SELECT key, value FROM platform_settings").all() as { key: string; value: string }[];
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  return value === "true" || value === "1";
}

export function getSettings(): PlatformSettings {
  const saved = readAll();
  const defaultPlan = PLAN_IDS.includes(saved.default_plan as PlanId)
    ? (saved.default_plan as PlanId)
    : DEFAULTS.defaultPlan;
  return {
    platformName: saved.platform_name?.trim() || DEFAULTS.platformName,
    supportEmail: saved.support_email?.trim() || DEFAULTS.supportEmail,
    announcement: saved.announcement ?? DEFAULTS.announcement,
    signupsEnabled: parseBoolean(saved.signups_enabled, DEFAULTS.signupsEnabled),
    directoryVisible: parseBoolean(saved.directory_visible, DEFAULTS.directoryVisible),
    defaultPlan,
  };
}

export function updateSettings(patch: Partial<PlatformSettings>): PlatformSettings {
  const now = nowIso();
  const write = db.prepare(
    `INSERT INTO platform_settings (key, value, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
  );
  const tx = db.transaction(() => {
    if (patch.platformName !== undefined) write.run("platform_name", patch.platformName, now);
    if (patch.supportEmail !== undefined) write.run("support_email", patch.supportEmail, now);
    if (patch.announcement !== undefined) write.run("announcement", patch.announcement, now);
    if (patch.signupsEnabled !== undefined) write.run("signups_enabled", String(patch.signupsEnabled), now);
    if (patch.directoryVisible !== undefined) write.run("directory_visible", String(patch.directoryVisible), now);
    if (patch.defaultPlan !== undefined) write.run("default_plan", patch.defaultPlan, now);
  });
  tx();
  return getSettings();
}

/** Best-effort audit trail for privileged actions. Never throws. */
export function logAudit(options: {
  actorId?: string;
  actorEmail?: string;
  action: string;
  targetType?: string;
  targetId?: string;
  detail?: string;
}) {
  try {
    db.prepare(
      `INSERT INTO admin_audit (id, actor_id, actor_email, action, target_type, target_id, detail, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
      options.actorId ?? null,
      options.actorEmail ?? "",
      options.action,
      options.targetType ?? "",
      options.targetId ?? "",
      options.detail ?? "",
      nowIso()
    );
  } catch (error: any) {
    console.warn("[audit] could not write entry:", error?.message || error);
  }
}

export function planPrice(plan: string): number {
  return PLANS[(plan as PlanId) in PLANS ? (plan as PlanId) : "launch"].price;
}
