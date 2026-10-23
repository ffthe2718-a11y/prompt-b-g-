import type { DayHours, Salon, SectionConfig, TemplateId } from "@/types/salon";
import type { SalonUpdatePayload } from "@/lib/api";

export interface SiteForm {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string;
  heroImageUrl: string;
  backgroundImageUrl: string;
  aboutImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  announcement: string;
  ctaText: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  twitter: string;
  currency: string;
  timezone: string;
  template: TemplateId;
  primaryColor: string;
  accentColor: string;
  seoTitle: string;
  seoDescription: string;
  sections: SectionConfig[];
  hours: DayHours[];
  bookingSettings: Salon["bookingSettings"];
}

export function siteFormFromSalon(salon: Salon): SiteForm {
  return {
    name: salon.name,
    slug: salon.slug,
    tagline: salon.tagline,
    description: salon.description,
    logoUrl: salon.logoUrl,
    heroImageUrl: salon.heroImageUrl,
    backgroundImageUrl: salon.backgroundImageUrl,
    aboutImageUrl: salon.aboutImageUrl,
    heroTitle: salon.heroTitle,
    heroSubtitle: salon.heroSubtitle,
    aboutTitle: salon.aboutTitle,
    aboutText: salon.aboutText,
    announcement: salon.announcement,
    ctaText: salon.ctaText,
    address: salon.address,
    city: salon.city,
    state: salon.state,
    postalCode: salon.postalCode,
    country: salon.country,
    phone: salon.phone,
    whatsapp: salon.whatsapp,
    email: salon.email,
    website: salon.website,
    instagram: salon.instagram,
    facebook: salon.facebook,
    tiktok: salon.tiktok,
    twitter: salon.twitter || "",
    currency: salon.currency,
    timezone: salon.timezone,
    template: salon.template,
    primaryColor: salon.primaryColor,
    accentColor: salon.accentColor,
    seoTitle: salon.seoTitle,
    seoDescription: salon.seoDescription,
    sections: [...salon.sections].sort((a, b) => a.order - b.order),
    hours: salon.hours.map((hour) => ({ ...hour })),
    bookingSettings: { ...salon.bookingSettings },
  };
}

export function siteFormToPatch(form: SiteForm): SalonUpdatePayload & { sections: SectionConfig[]; hours: DayHours[] } {
  return {
    name: form.name,
    slug: form.slug,
    tagline: form.tagline,
    description: form.description,
    logoUrl: form.logoUrl,
    heroImageUrl: form.heroImageUrl,
    backgroundImageUrl: form.backgroundImageUrl,
    aboutImageUrl: form.aboutImageUrl,
    heroTitle: form.heroTitle,
    heroSubtitle: form.heroSubtitle,
    aboutTitle: form.aboutTitle,
    aboutText: form.aboutText,
    announcement: form.announcement,
    ctaText: form.ctaText,
    address: form.address,
    city: form.city,
    state: form.state,
    postalCode: form.postalCode,
    country: form.country,
    phone: form.phone,
    whatsapp: form.whatsapp,
    email: form.email,
    website: form.website,
    instagram: form.instagram,
    facebook: form.facebook,
    tiktok: form.tiktok,
    twitter: form.twitter,
    currency: form.currency,
    timezone: form.timezone,
    template: form.template,
    primaryColor: form.primaryColor,
    accentColor: form.accentColor,
    seoTitle: form.seoTitle,
    seoDescription: form.seoDescription,
    sections: form.sections,
    hours: form.hours,
    bookingSettings: form.bookingSettings,
  };
}

export function isSiteFormDirty(form: SiteForm | null, salon: Salon | null): boolean {
  if (!form || !salon) return false;
  try {
    return JSON.stringify(form) !== JSON.stringify(siteFormFromSalon(salon));
  } catch {
    return false;
  }
}

export function readiness(salon: Salon | null, form: SiteForm | null) {
  const activeServices = salon?.services.filter((service) => service.isActive).length ?? 0;
  const hasContact = Boolean(form?.phone || form?.email || form?.whatsapp);
  const hasName = Boolean(form?.name && form.name.trim().length >= 2);
  const hasSlug = Boolean(form?.slug && form.slug.length >= 3);
  return [
    { key: "name", label: "Salon name and address chosen", done: hasName && hasSlug, critical: true },
    { key: "contact", label: "Phone or contact email added", done: hasContact, critical: true },
    { key: "services", label: "At least one active service", done: activeServices > 0, critical: true },
    { key: "images", label: "Logo or hero image added", done: Boolean(form?.logoUrl || form?.heroImageUrl), critical: false },
    { key: "about", label: "About section written", done: Boolean(form?.aboutText || form?.description), critical: false },
  ];
}
