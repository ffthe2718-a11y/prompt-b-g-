export type SalonStatus = "draft" | "published" | "suspended";
export type TemplateId = "luxury" | "blush" | "noir" | "emerald";
export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export interface SectionConfig {
  id: string;
  label: string;
  enabled: boolean;
  order: number;
}

export interface DayHours {
  day: string;
  closed: boolean;
  open: string;
  close: string;
}

export interface BookingSettings {
  enabled: boolean;
  slotIntervalMinutes: number;
  minNoticeHours: number;
  maxAdvanceDays: number;
  requireEmail: boolean;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  category: string;
  price: number;
  priceCents: number;
  durationMinutes: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  bio: string;
  imageUrl: string;
  specialties: string[];
  experienceYears: number;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
  createdAt: string;
}

export interface Review {
  id: string;
  authorName: string;
  authorEmail?: string;
  rating: number;
  title: string;
  comment: string;
  status: "published" | "hidden";
  ownerReply: string;
  createdAt: string;
  updatedAt: string;
}

export interface SalonStats {
  totalBookings: number;
  pendingBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
  activeServices: number;
  activeStaff: number;
  galleryImages: number;
}

export type ApprovalStatus = "draft" | "pending" | "approved" | "rejected" | "changes_requested";
export type ReviewAction = "submit" | "approve" | "reject" | "request_changes" | "revoke";

export interface ApprovalEvent {
  id: string;
  action: ReviewAction;
  note: string;
  actorEmail: string;
  createdAt: string;
}

export interface Salon {
  id: string;
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
  instagram: string;
  facebook: string;
  tiktok: string;
  twitter: string;
  website: string;
  currency: string;
  timezone: string;
  template: TemplateId;
  primaryColor: string;
  accentColor: string;
  sections: SectionConfig[];
  hours: DayHours[];
  bookingSettings: BookingSettings;
  seoTitle: string;
  seoDescription: string;
  status: SalonStatus;
  rating: number;
  ratingCount: number;
  priceFrom: number;
  services: Service[];
  staff: StaffMember[];
  gallery: GalleryImage[];
  reviews: Review[];
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  ownerId?: string;
  plan?: PlanId;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionRenewsAt?: string | null;
  views?: number;
  customDomain?: string;
  customDomainVerified?: boolean;
  domainVerifyToken?: string;
  hasUnpublishedChanges?: boolean;
  stats?: SalonStats;
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
  approvalHistory: ApprovalEvent[];
}

export interface SalonSummary {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  logoUrl: string;
  heroImageUrl: string;
  city: string;
  state: string;
  country: string;
  template: TemplateId;
  primaryColor: string;
  accentColor: string;
  currency: string;
  rating: number;
  ratingCount: number;
  serviceCount: number;
  priceFrom: number;
  services: string[];
  publishedAt?: string | null;
}

/** RBAC roles. Visitors are simply unauthenticated requests. */
export type UserRole = "owner" | "super_admin";
export type UserStatus = "active" | "suspended";

export interface AuthUser {
  id: string;
  uid: string;
  email: string;
  name: string;
  displayName: string;
  photoURL: string | null;
  avatarUrl: string | null;
  role: UserRole;
  isAdmin: boolean;
  emailVerified: boolean;
  provider: "google" | "password";
  hasPassword: boolean;
  status: UserStatus;
  createdAt: string;
  salon: { id: string; name: string; slug: string; status: SalonStatus } | null;
}

export interface Booking {
  id: string;
  salonId: string;
  serviceId: string | null;
  staffId: string | null;
  serviceName: string;
  staffName: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  date: string;
  time: string;
  notes: string;
  status: BookingStatus;
  price: number;
  priceCents: number;
  createdAt: string;
  updatedAt: string;
}

export interface Availability {
  date: string;
  closed: boolean;
  reason: string;
  hours?: { open: string; close: string };
  slots: { time: string; available: boolean }[];
}

export interface Analytics {
  days: { date: string; bookings: number; revenue: number }[];
  topServices: { name: string; count: number; revenue: number }[];
  ratingDistribution: { rating: number; count: number }[];
  recentBookings: Booking[];
  subscribers: number;
  rating: number;
  ratingCount: number;
  views: number;
}

export interface AdminSalon {
  id: string;
  name: string;
  slug: string;
  status: SalonStatus;
  city: string;
  country: string;
  logoUrl: string;
  template: TemplateId;
  primaryColor: string;
  ownerName: string;
  ownerEmail: string;
  createdAt: string;
  publishedAt: string | null;
  views: number;
  serviceCount: number;
  bookingCount: number;
  rating: number;
  ratingCount: number;
  ownerId?: string;
  approvalStatus?: ApprovalStatus;
  approvalNote?: string;
  submittedAt?: string | null;
  approvedAt?: string | null;
  reviewedAt?: string | null;
  submissionStale?: boolean;
  changesSinceApproval?: boolean;
  plan?: PlanId;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionRenewsAt?: string | null;
  customDomain?: string | null;
}

export type PlanId = "launch" | "studio" | "atelier";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  provider: "google" | "password";
  hasPassword: boolean;
  avatarUrl: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  salon: {
    id: string;
    name: string;
    slug: string;
    status: SalonStatus;
    plan: PlanId;
    subscriptionStatus: SubscriptionStatus;
    renewsAt: string | null;
  } | null;
}

export interface AdminSubscription {
  salonId: string;
  salonName: string;
  slug: string;
  ownerName: string;
  ownerEmail: string;
  plan: PlanId;
  status: SubscriptionStatus;
  renewsAt: string | null;
  startedAt: string;
  price: number;
}

export interface PlatformSettings {
  platformName: string;
  supportEmail: string;
  announcement: string;
  signupsEnabled: boolean;
  directoryVisible: boolean;
  defaultPlan: PlanId;
}

export interface PlanDefinition {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  blurb: string;
  features: string[];
}

export interface AuditEntry {
  id: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId: string;
  detail: string;
  createdAt: string;
}

export interface AdminApproval {
  id: string;
  name: string;
  slug: string;
  status: SalonStatus;
  approvalStatus: ApprovalStatus;
  approvalNote: string;
  submittedAt: string | null;
  approvedAt: string | null;
  reviewedAt: string | null;
  reviewedBy: string | null;
  stale: boolean;
  changesSinceApproval: boolean;
  blockers: string[];
  counts: { services: number; staff: number; gallery: number };
  city: string;
  country: string;
  logoUrl: string;
  heroImageUrl: string;
  tagline: string;
  ownerName: string;
  ownerEmail: string;
  history: ApprovalEvent[];
}

export interface AdminStats {
  users: number;
  owners: number;
  superAdmins: number;
  suspendedUsers: number;
  newUsers30d: number;
  salons: number;
  publishedSalons: number;
  bookings: number;
  revenue: number;
  reviews: number;
  pendingApprovals: number;
  plans: Record<string, number>;
  mrr: number;
}

export interface PlatformConfig {
  platformName: string;
  supportEmail: string;
  announcement: string;
  signupsEnabled: boolean;
  directoryVisible: boolean;
  baseDomain: string;
  siteOrigin: string;
  maxUploadMb: number;
}

export const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
  AED: "AED ",
  AUD: "A$",
  CAD: "C$",
  SGD: "S$",
};

export function formatPrice(amount: number, currency = "INR"): string {
  try {
    return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${CURRENCY_SYMBOLS[currency] ?? ""}${amount}`;
  }
}

export function formatDuration(minutes: number): string {
  if (!minutes) return "";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours}h ${rest}m` : `${hours} hr${hours > 1 ? "s" : ""}`;
}
