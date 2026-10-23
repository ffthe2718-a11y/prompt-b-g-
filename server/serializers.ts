import db, { parseJson } from "./db";
import { approvalState } from "./approval";
import { DEFAULT_HOURS, DEFAULT_SECTIONS } from "./validation";

export interface SectionConfig {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

export function serviceRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    category: row.category,
    price: Math.round(row.price_cents) / 100,
    priceCents: row.price_cents,
    durationMinutes: row.duration_minutes,
    isActive: !!row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function addonRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Math.round(row.price_cents) / 100,
    priceCents: row.price_cents,
    durationMinutes: row.duration_minutes,
    isActive: !!row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function staffRow(row: any) {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    bio: row.bio,
    imageUrl: row.image_url,
    specialties: parseJson<string[]>(row.specialties_json, []),
    experienceYears: row.experience_years,
    isActive: !!row.is_active,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function galleryRow(row: any) {
  return {
    id: row.id,
    imageUrl: row.image_url,
    caption: row.caption,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export function bookingRow(row: any) {
  return {
    id: row.id,
    salonId: row.salon_id,
    serviceId: row.service_id,
    staffId: row.staff_id,
    serviceName: row.service_name,
    staffName: row.staff_name,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    date: row.date,
    time: row.time,
    notes: row.notes,
    status: row.status,
    price: Math.round(row.price_cents) / 100,
    priceCents: row.price_cents,
    addonIds: parseJson<string[]>(row.addon_ids_json, []),
    whatsappReminderSentAt: row.whatsapp_reminder_sent_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function reviewRow(row: any) {
  return {
    id: row.id,
    authorName: row.author_name,
    authorEmail: row.author_email,
    rating: row.rating,
    title: row.title,
    comment: row.comment,
    status: row.status,
    ownerReply: row.owner_reply,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function reviewSummary(salonId: string) {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS count, COALESCE(AVG(rating), 0) AS average FROM reviews WHERE salon_id = ? AND status = 'published'"
    )
    .get(salonId) as { count: number; average: number };
  return {
    ratingCount: row.count,
    rating: row.count ? Math.round(row.average * 10) / 10 : 0,
  };
}

function sectionsFor(row: any): SectionConfig[] {
  const sections = parseJson<SectionConfig[]>(row.sections_json, []);
  if (!Array.isArray(sections) || sections.length === 0) return DEFAULT_SECTIONS;
  // Keep a stable, validated shape and include newly added platform sections.
  const known = new Map(sections.map((s) => [String(s.id), s]));
  return DEFAULT_SECTIONS.map((fallback, index) => {
    const saved = known.get(fallback.id);
    return {
      id: fallback.id,
      label: fallback.label,
      enabled: saved ? !!saved.enabled : fallback.enabled,
      order: saved && Number.isFinite(Number(saved.order)) ? Number(saved.order) : index,
    };
  }).sort((a, b) => a.order - b.order);
}

function hoursFor(row: any) {
  const hours = parseJson<any[]>(row.hours_json, []);
  if (!Array.isArray(hours) || hours.length === 0) return DEFAULT_HOURS;
  return DEFAULT_HOURS.map((fallback, index) => {
    const saved = hours.find((h) => h?.day === fallback.day) ?? hours[index];
    if (!saved) return fallback;
    return {
      day: fallback.day,
      closed: !!saved.closed,
      open: typeof saved.open === "string" ? saved.open : fallback.open,
      close: typeof saved.close === "string" ? saved.close : fallback.close,
    };
  });
}

function bookingSettingsFor(row: any) {
  const saved = parseJson<Record<string, unknown>>(row.booking_json, {});
  const interval = Number(saved.slotIntervalMinutes);
  const minNotice = Number(saved.minNoticeHours);
  const maxAdvance = Number(saved.maxAdvanceDays);
  return {
    enabled: saved.enabled === false ? false : true,
    slotIntervalMinutes: [15, 30, 45, 60, 90, 120].includes(interval) ? interval : 30,
    minNoticeHours: Number.isFinite(minNotice) ? Math.min(Math.max(minNotice, 0), 168) : 2,
    maxAdvanceDays: Number.isFinite(maxAdvance) ? Math.min(Math.max(maxAdvance, 1), 365) : 60,
    requireEmail: saved.requireEmail === true,
  };
}

/** Fields that are safe to expose on a public website. */
export function publicSalonBundle(row: any, options: { includeReviews?: boolean } = {}) {
  const { rating, ratingCount } = reviewSummary(row.id);
  const services = db
    .prepare("SELECT * FROM services WHERE salon_id = ? AND is_active = 1 ORDER BY sort_order, created_at")
    .all(row.id) as any[];
  const addons = db
    .prepare("SELECT * FROM service_addons WHERE salon_id = ? AND is_active = 1 ORDER BY sort_order, created_at")
    .all(row.id) as any[];
  const staff = db
    .prepare("SELECT * FROM staff WHERE salon_id = ? AND is_active = 1 ORDER BY sort_order, created_at")
    .all(row.id) as any[];
  const gallery = db
    .prepare("SELECT * FROM gallery WHERE salon_id = ? ORDER BY sort_order, created_at")
    .all(row.id) as any[];
  const reviews =
    options.includeReviews === false
      ? []
      : (db
          .prepare(
            "SELECT * FROM reviews WHERE salon_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 60"
          )
          .all(row.id) as any[]);
  const prices = services.map((s) => s.price_cents).filter((p) => p > 0);

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    logoUrl: row.logo_url,
    heroImageUrl: row.hero_image_url,
    aboutImageUrl: row.about_image_url,
    heroTitle: row.hero_title || row.name,
    heroSubtitle: row.hero_subtitle || row.tagline,
    aboutTitle: row.about_title,
    aboutText: row.about_text,
    announcement: row.announcement,
    ctaText: row.cta_text || "Book your appointment",
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
    twitter: row.twitter || "",
    website: row.website,
    currency: row.currency,
    timezone: row.timezone,
    template: row.template,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    sections: sectionsFor(row),
    hours: hoursFor(row),
    bookingSettings: bookingSettingsFor(row),
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    status: row.status,
    rating,
    ratingCount,
    priceFrom: prices.length ? Math.min(...prices) / 100 : 0,
    services: services.map(serviceRow),
    addons: addons.map(addonRow),
    staff: staff.map(staffRow),
    gallery: gallery.map(galleryRow),
    reviews: reviews.map(reviewRow),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    publishedAt: row.published_at,
  };
}

/** Full salon document for its owner's dashboard. */
export function privateSalonBundle(row: any) {
  const services = db
    .prepare("SELECT * FROM services WHERE salon_id = ? ORDER BY sort_order, created_at")
    .all(row.id) as any[];
  const addons = db
    .prepare("SELECT * FROM service_addons WHERE salon_id = ? ORDER BY sort_order, created_at")
    .all(row.id) as any[];
  const staff = db
    .prepare("SELECT * FROM staff WHERE salon_id = ? ORDER BY sort_order, created_at")
    .all(row.id) as any[];
  const gallery = db
    .prepare("SELECT * FROM gallery WHERE salon_id = ? ORDER BY sort_order, created_at")
    .all(row.id) as any[];
  const reviews = db
    .prepare("SELECT * FROM reviews WHERE salon_id = ? ORDER BY created_at DESC")
    .all(row.id) as any[];
  const bookingStats = db
    .prepare(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending,
         SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END) AS confirmed,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled,
         COALESCE(SUM(CASE WHEN status IN ('confirmed','completed') THEN price_cents ELSE 0 END), 0) AS revenue_cents
       FROM bookings WHERE salon_id = ?`
    )
    .get(row.id) as any;
  const { rating, ratingCount } = reviewSummary(row.id);

  return {
    ...publicSalonBundle(row),
    ownerId: row.owner_id,
    plan: row.plan || "launch",
    subscriptionStatus: row.subscription_status || "active",
    subscriptionRenewsAt: row.subscription_renews_at ?? null,
    views: row.views,
    customDomain: row.custom_domain ?? "",
    customDomainVerified: row.custom_domain_verified === 1,
    domainVerifyToken: row.domain_verify_token ?? "",
    whatsappRemindersEnabled: row.whatsapp_reminders_enabled !== 0,
    whatsappReminderLeadHours: Number(row.whatsapp_reminder_lead_hours) || 2,
    whatsappCustomTemplate: row.whatsapp_custom_template ?? "",
    seoTitle: row.seo_title,
    seoDescription: row.seo_description,
    sections: sectionsFor(row),
    hours: hoursFor(row),
    bookingSettings: bookingSettingsFor(row),
    services: services.map(serviceRow),
    addons: addons.map(addonRow),
    staff: staff.map(staffRow),
    gallery: gallery.map(galleryRow),
    reviews: reviews.map(reviewRow),
    rating,
    ratingCount,
    ...approvalState(row),
    hasUnpublishedChanges: !!row.published_at && String(row.updated_at) > String(row.published_at),
    stats: {
      totalBookings: bookingStats.total || 0,
      pendingBookings: bookingStats.pending || 0,
      confirmedBookings: bookingStats.confirmed || 0,
      completedBookings: bookingStats.completed || 0,
      cancelledBookings: bookingStats.cancelled || 0,
      revenue: Math.round(bookingStats.revenue_cents || 0) / 100,
      activeServices: services.filter((s) => s.is_active).length,
      activeStaff: staff.filter((s) => s.is_active).length,
      galleryImages: gallery.length,
    },
  };
}

/**
 * Published snapshot used by public websites and the directory. Live edits stay
 * private until the owner presses Publish, while reviews remain live.
 */
export function publishedSalonBundle(row: any) {
  const snapshot = row.published_json ? parseJson<any>(row.published_json, null) : null;
  const base = snapshot ?? publicSalonBundle(row, { includeReviews: false });
  const { rating, ratingCount } = reviewSummary(row.id);
  const reviews = db
    .prepare("SELECT * FROM reviews WHERE salon_id = ? AND status = 'published' ORDER BY created_at DESC LIMIT 60")
    .all(row.id) as any[];
  return {
    ...base,
    reviews: reviews.map(reviewRow),
    rating,
    ratingCount,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
  };
}

export function directorySalon(row: any) {
  if (row.published_json) {
    const bundle = publishedSalonBundle(row);
    const prices = (bundle.services ?? []).map((s: any) => Number(s.priceCents) || 0).filter((p: number) => p > 0);
    const names = (bundle.services ?? []).map((s: any) => s.name);
    const categories = Array.from(new Set((bundle.services ?? []).map((s: any) => s.category).filter(Boolean)));
    return {
      id: row.id,
      name: bundle.name,
      slug: row.slug,
      tagline: bundle.tagline,
      description: bundle.description,
      logoUrl: bundle.logoUrl,
      heroImageUrl: bundle.heroImageUrl,
      city: bundle.city,
      state: bundle.state,
      country: bundle.country,
      template: bundle.template,
      primaryColor: bundle.primaryColor,
      accentColor: bundle.accentColor,
      currency: bundle.currency,
      rating: bundle.rating,
      ratingCount: bundle.ratingCount,
      serviceCount: names.length,
      priceFrom: prices.length ? Math.min(...prices) / 100 : 0,
      priceTo: prices.length ? Math.max(...prices) / 100 : 0,
      categories,
      services: names.slice(0, 6),
      publishedAt: row.published_at,
    };
  }

  const { rating, ratingCount } = reviewSummary(row.id);
  const services = db
    .prepare("SELECT name, price_cents, category FROM services WHERE salon_id = ? AND is_active = 1 ORDER BY sort_order")
    .all(row.id) as any[];
  const prices = services.map((s) => s.price_cents).filter((p) => p > 0);
  const categories = Array.from(new Set(services.map((s) => s.category).filter(Boolean)));
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    tagline: row.tagline,
    description: row.description,
    logoUrl: row.logo_url,
    heroImageUrl: row.hero_image_url,
    city: row.city,
    state: row.state,
    country: row.country,
    template: row.template,
    primaryColor: row.primary_color,
    accentColor: row.accent_color,
    currency: row.currency,
    rating,
    ratingCount,
    serviceCount: services.length,
    priceFrom: prices.length ? Math.min(...prices) / 100 : 0,
    priceTo: prices.length ? Math.max(...prices) / 100 : 0,
    categories,
    services: services.slice(0, 6).map((s) => s.name),
    publishedAt: row.published_at,
  };
}

export function userPayload(row: any) {
  const salon = db
    .prepare("SELECT id, name, slug, status FROM salons WHERE owner_id = ?")
    .get(row.id) as any;
  return {
    id: row.id,
    uid: row.id,
    email: row.email,
    name: row.name,
    displayName: row.name,
    photoURL: row.avatar_url || null,
    avatarUrl: row.avatar_url || null,
    role: row.role,
    isAdmin: row.role === "super_admin",
    emailVerified: row.email_verified === 1,
    provider: row.google_id ? "google" : "password",
    hasPassword: row.password_set !== 0,
    status: row.status || "active",
    createdAt: row.created_at,
    salon: salon
      ? { id: salon.id, name: salon.name, slug: salon.slug, status: salon.status }
      : null,
  };
}

export function giftCardConfigRow(salonId: string) {
  let row = db.prepare("SELECT * FROM gift_card_configs WHERE salon_id = ?").get(salonId) as any;
  if (!row) {
    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO gift_card_configs (salon_id, enabled, denominations_json, headline, message, card_style, custom_bg_color, custom_accent_color, expiry_months, created_at, updated_at)
       VALUES (?, 1, '[50, 100, 150, 250, 500]', 'The Gift of Luxury & Beauty', 'Treat someone special to an unforgettable salon experience.', 'gold_foil', '#12110E', '#D4AF37', 12, ?, ?)`
    ).run(salonId, now, now);
    row = db.prepare("SELECT * FROM gift_card_configs WHERE salon_id = ?").get(salonId) as any;
  }
  return {
    salonId: row.salon_id,
    enabled: row.enabled !== 0,
    denominations: parseJson<number[]>(row.denominations_json, [50, 100, 150, 250, 500]),
    headline: row.headline,
    message: row.message,
    cardStyle: row.card_style,
    customBgColor: row.custom_bg_color,
    customAccentColor: row.custom_accent_color,
    expiryMonths: Number(row.expiry_months) || 12,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function giftCardRow(row: any) {
  return {
    id: row.id,
    salonId: row.salon_id,
    code: row.code,
    amount: Math.round(row.amount_cents) / 100,
    amountCents: row.amount_cents,
    balance: Math.round(row.balance_cents) / 100,
    balanceCents: row.balance_cents,
    purchaserName: row.purchaser_name,
    purchaserEmail: row.purchaser_email,
    recipientName: row.recipient_name,
    recipientEmail: row.recipient_email,
    personalMessage: row.personal_message,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}
