import type {
  AdminApproval,
  AdminSalon,
  ApprovalEvent,
  AdminStats,
  AdminSubscription,
  AdminUser,
  Analytics,
  AuthUser,
  Availability,
  Booking,
  BookingStatus,
  DayHours,
  GalleryImage,
  AuditEntry,
  PlanDefinition,
  PlatformConfig,
  PlatformSettings,
  Review,
  Salon,
  SalonSummary,
  SectionConfig,
  Service,
  StaffMember,
} from "@/types/salon";

const TOKEN_KEY = "velvet_token";
const UNAUTHORIZED_EVENT = "velvet:unauthorized";

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: Record<string, unknown>;

  constructor(message: string, status = 0, code = "request_failed", details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const tokenStore = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage can be disabled */
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* noop */
    }
  },
};

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  auth?: boolean;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const token = tokenStore.get();
  if (options.auth !== false && token) headers.Authorization = `Bearer ${token}`;
  let body: BodyInit | undefined;
  if (options.formData) {
    body = options.formData;
  } else if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: options.signal,
    });
  } catch (error: any) {
    if (error?.name === "AbortError") throw error;
    throw new ApiRequestError("Network error. Check your connection and try again.", 0, "network_error");
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 && token) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const message =
      data?.error?.message ||
      (response.status === 404 ? "Not found." : "Something went wrong. Please try again.");
    throw new ApiRequestError(message, response.status, data?.error?.code || "request_failed", data?.error?.details);
  }
  return data as T;
}

export const unauthorizedEvent = UNAUTHORIZED_EVENT;

/* ------------------------------------------------------------------ */
/* Auth                                                               */
/* ------------------------------------------------------------------ */

export const authApi = {
  async register(payload: { name: string; email: string; password: string }) {
    return request<{ token: string; user: AuthUser; verificationRequired?: boolean; verificationSent?: boolean }>(
      "/auth/register",
      { method: "POST", body: payload, auth: false }
    );
  },
  async login(payload: { email: string; password: string }) {
    return request<{ token: string; user: AuthUser }>("/auth/login", { method: "POST", body: payload, auth: false });
  },
  async me() {
    return request<{ user: AuthUser }>("/auth/me");
  },
  async sendVerification() {
    return request<{ success: boolean; message: string; alreadyVerified?: boolean }>("/auth/send-verification", {
      method: "POST",
    });
  },
  async verifyEmail(token: string) {
    return request<{ success: boolean; message: string; user: AuthUser }>("/auth/verify-email", {
      method: "POST",
      body: { token },
      auth: false,
    });
  },
  async googleStatus() {
    return request<{ enabled: boolean }>("/auth/google/status", { auth: false });
  },
  googleStartUrl(returnTo?: string) {
    const suffix = returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : "";
    return `/api/auth/google/start${suffix}`;
  },
  async exchangeGoogleCode(code: string) {
    return request<{ token: string; user: AuthUser }>("/auth/google/exchange", {
      method: "POST",
      body: { code },
      auth: false,
    });
  },
  async setPassword(payload: { newPassword: string; currentPassword?: string }) {
    return request<{ success: boolean; message: string }>("/auth/set-password", {
      method: "POST",
      body: payload,
    });
  },
  async forgotPassword(email: string) {
    return request<{ success: boolean; message: string }>("/auth/forgot-password", {
      method: "POST",
      body: { email },
      auth: false,
    });
  },
  async resetPassword(token: string, password: string) {
    return request<{ success: boolean; message: string }>("/auth/reset-password", {
      method: "POST",
      body: { token, password },
      auth: false,
    });
  },
  async updateProfile(payload: {
    name?: string;
    email?: string;
    currentPassword?: string;
    newPassword?: string;
  }) {
    return request<{ user: AuthUser; verificationRequired?: boolean; verificationSent?: boolean }>(
      "/auth/profile",
      { method: "PATCH", body: payload }
    );
  },
};

/* ------------------------------------------------------------------ */
/* Salon                                                              */
/* ------------------------------------------------------------------ */

export const salonApi = {
  async getMine() {
    return request<{ salon: Salon }>("/salons/me");
  },
  async create(payload: { name: string; slug: string; tagline?: string; description?: string }) {
    return request<{ salon: Salon }>("/salons", { method: "POST", body: payload });
  },
  async update(patch: Partial<Salon>) {
    return request<{ salon: Salon }>("/salons/me", { method: "PATCH", body: patch });
  },
  async publish() {
    return request<{ salon: Salon; publishedUrl: string }>("/salons/me/publish", { method: "POST" });
  },
  async submitForApproval() {
    return request<{ salon: Salon }>("/salons/me/submit", { method: "POST" });
  },
  async withdrawSubmission() {
    return request<{ salon: Salon }>("/salons/me/withdraw", { method: "POST" });
  },
  async unpublish() {
    return request<{ salon: Salon }>("/salons/me/unpublish", { method: "POST" });
  },
  async analytics() {
    return request<Analytics>("/salons/me/analytics");
  },
  async slugAvailable(slug: string) {
    return request<{ available: boolean; slug: string; reason: string }>(
      `/salons/slug-available?slug=${encodeURIComponent(slug)}`
    );
  },

  /* Services */
  async createService(payload: {
    name: string;
    description?: string;
    imageUrl?: string;
    category?: string;
    price: number;
    durationMinutes?: number;
    isActive?: boolean;
  }) {
    return request<{ service: Service }>("/salons/me/services", { method: "POST", body: payload });
  },
  async updateService(id: string, patch: Partial<Service>) {
    return request<{ service: Service }>(`/salons/me/services/${id}`, { method: "PATCH", body: patch });
  },
  async deleteService(id: string) {
    return request<{ success: boolean }>(`/salons/me/services/${id}`, { method: "DELETE" });
  },
  async reorderServices(ids: string[]) {
    return request<{ success: boolean }>("/salons/me/services/reorder", { method: "POST", body: { ids } });
  },
  async bulkUpdateServices(payload: {
    ids: string[];
    isActive?: boolean;
    priceAction?: "set" | "increase_percent" | "decrease_percent" | "increase_flat" | "decrease_flat";
    priceValue?: number;
    category?: string;
  }) {
    return request<{ success: boolean; count: number }>("/salons/me/services/bulk", {
      method: "POST",
      body: payload,
    });
  },
  async bulkDeleteServices(ids: string[]) {
    return request<{ success: boolean; count: number }>("/salons/me/services/bulk-delete", {
      method: "POST",
      body: { ids },
    });
  },

  /* Staff */
  async createStaff(payload: {
    name: string;
    role?: string;
    bio?: string;
    imageUrl?: string;
    specialties?: string[];
    experienceYears?: number;
  }) {
    return request<{ staff: StaffMember }>("/salons/me/staff", { method: "POST", body: payload });
  },
  async updateStaff(id: string, patch: Partial<StaffMember>) {
    return request<{ staff: StaffMember }>(`/salons/me/staff/${id}`, { method: "PATCH", body: patch });
  },
  async deleteStaff(id: string) {
    return request<{ success: boolean }>(`/salons/me/staff/${id}`, { method: "DELETE" });
  },

  /* Gallery */
  async createGalleryImage(payload: { imageUrl: string; caption?: string }) {
    return request<{ image: GalleryImage }>("/salons/me/gallery", { method: "POST", body: payload });
  },
  async updateGalleryImage(id: string, patch: { imageUrl?: string; caption?: string }) {
    return request<{ image: GalleryImage }>(`/salons/me/gallery/${id}`, { method: "PATCH", body: patch });
  },
  async deleteGalleryImage(id: string) {
    return request<{ success: boolean }>(`/salons/me/gallery/${id}`, { method: "DELETE" });
  },
  async reorderGallery(ids: string[]) {
    return request<{ success: boolean }>("/salons/me/gallery/reorder", { method: "POST", body: { ids } });
  },

  /* Bookings */
  async listBookings(params: { status?: BookingStatus | "all"; from?: string; to?: string } = {}) {
    const search = new URLSearchParams();
    if (params.status && params.status !== "all") search.set("status", params.status);
    if (params.from) search.set("from", params.from);
    if (params.to) search.set("to", params.to);
    return request<{ bookings: Booking[] }>(`/salons/me/bookings?${search.toString()}`);
  },
  async updateBooking(id: string, patch: { status?: BookingStatus; notes?: string; staffId?: string | null }) {
    return request<{ booking: Booking }>(`/salons/me/bookings/${id}`, { method: "PATCH", body: patch });
  },
  async deleteBooking(id: string) {
    return request<{ success: boolean }>(`/salons/me/bookings/${id}`, { method: "DELETE" });
  },
  async remindBooking(id: string) {
    return request<{ success: boolean; delivered: boolean; message: string }>(
      `/salons/me/bookings/${id}/reminder`,
      { method: "POST" }
    );
  },

  /* Newsletter */
  async subscribers() {
    return request<{ subscribers: { id: string; email: string; createdAt: string }[]; count: number }>(
      "/salons/me/subscribers"
    );
  },

  /* Reviews */
  async listReviews() {
    return request<{ reviews: Review[] }>("/salons/me/reviews");
  },
  async updateReview(id: string, patch: { status?: "published" | "hidden"; ownerReply?: string }) {
    return request<{ review: Review }>(`/salons/me/reviews/${id}`, { method: "PATCH", body: patch });
  },
  async deleteReview(id: string) {
    return request<{ success: boolean }>(`/salons/me/reviews/${id}`, { method: "DELETE" });
  },

  /* Domain */
  async connectDomain(domain: string) {
    return request<{
      domain: string;
      verified: boolean;
      record: { type: string; name: string; value: string };
      cname: { type: string; name: string; value: string };
    }>("/salons/me/domain", { method: "POST", body: { domain } });
  },
  async verifyDomain() {
    return request<{ verified: boolean; domain: string }>("/salons/me/domain/verify", { method: "POST" });
  },
  async removeDomain() {
    return request<{ success: boolean }>("/salons/me/domain", { method: "DELETE" });
  },
};

/* ------------------------------------------------------------------ */
/* Uploads                                                            */
/* ------------------------------------------------------------------ */

export const uploadApi = {
  async image(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ url: string; mimeType: string; size: number }>("/uploads", {
      method: "POST",
      formData,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Public website                                                     */
/* ------------------------------------------------------------------ */

export const publicApi = {
  async config() {
    return request<PlatformConfig>("/public/config", { auth: false });
  },
  async listSalons(params: { q?: string; sort?: "newest" | "rating" | "name" } = {}) {
    const search = new URLSearchParams();
    if (params.q) search.set("q", params.q);
    if (params.sort) search.set("sort", params.sort);
    return request<{ salons: SalonSummary[]; directoryVisible: boolean }>(`/public/salons?${search.toString()}`, {
      auth: false,
    });
  },
  async getSalon(slug: string) {
    return request<{ salon: Salon }>(`/public/salons/${encodeURIComponent(slug)}`, { auth: false });
  },
  async availability(slug: string, date: string, serviceId?: string, staffId?: string) {
    const search = new URLSearchParams({ date });
    if (serviceId) search.set("serviceId", serviceId);
    if (staffId) search.set("staffId", staffId);
    return request<Availability>(`/public/salons/${encodeURIComponent(slug)}/availability?${search.toString()}`, {
      auth: false,
    });
  },
  async createBooking(
    slug: string,
    payload: {
      serviceId: string;
      staffId?: string;
      customerName: string;
      customerEmail?: string;
      customerPhone: string;
      date: string;
      time: string;
      notes?: string;
    }
  ) {
    return request<{
      booking: {
        id: string;
        reference: string;
        date: string;
        time: string;
        status: string;
        serviceName: string;
        staffName: string;
        price: number;
      };
      message: string;
    }>(`/public/salons/${encodeURIComponent(slug)}/bookings`, { method: "POST", body: payload, auth: false });
  },
  async createReview(
    slug: string,
    payload: { authorName: string; customerEmail?: string; rating: number; title?: string; comment: string }
  ) {
    return request<{ review: Review; message: string }>(`/public/salons/${encodeURIComponent(slug)}/reviews`, {
      method: "POST",
      body: payload,
      auth: false,
    });
  },
  async subscribe(slug: string, email: string) {
    return request<{ success: boolean; message: string }>(`/public/salons/${encodeURIComponent(slug)}/subscribe`, {
      method: "POST",
      body: { email },
      auth: false,
    });
  },
};

/* ------------------------------------------------------------------ */
/* Platform admin                                                     */
/* ------------------------------------------------------------------ */

export const adminApi = {
  async stats() {
    return request<AdminStats>("/admin/stats");
  },
  async salons(q = "", status = "all") {
    return request<{ salons: AdminSalon[] }>(
      `/admin/salons?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`
    );
  },
  async setSalonStatus(id: string, status: "draft" | "published" | "suspended") {
    return request<{ success: boolean; status: string }>(`/admin/salons/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },
  async deleteSalon(id: string) {
    return request<{ success: boolean }>(`/admin/salons/${id}`, { method: "DELETE" });
  },
  async users(q = "", role = "all", status = "all") {
    return request<{ users: AdminUser[] }>(
      `/admin/users?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}&status=${encodeURIComponent(status)}`
    );
  },
  async updateUser(id: string, patch: { role?: string; status?: string; name?: string }) {
    return request<{ user: AdminUser; session: AuthUser | null }>(`/admin/users/${id}`, {
      method: "PATCH",
      body: patch,
    });
  },
  async deleteUser(id: string) {
    return request<{ success: boolean }>(`/admin/users/${id}`, { method: "DELETE" });
  },
  async sendPasswordReset(id: string) {
    return request<{ success: boolean; delivered: boolean; message: string }>(
      `/admin/users/${id}/reset-password`,
      { method: "POST" }
    );
  },
  async subscriptions() {
    return request<{
      plans: PlanDefinition[];
      summary: {
        total: number;
        byPlan: Record<string, number>;
        byStatus: Record<string, number>;
        mrr: number;
        currency: string;
      };
      subscriptions: AdminSubscription[];
    }>("/admin/subscriptions");
  },
  async updateSubscription(id: string, patch: { plan?: string; status?: string; renewsAt?: string | null }) {
    return request<{ success: boolean }>(`/admin/salons/${id}/subscription`, { method: "PATCH", body: patch });
  },
  async settings() {
    return request<{ settings: PlatformSettings; plans: PlanDefinition[] }>("/admin/settings");
  },
  async updateSettings(patch: Partial<PlatformSettings>) {
    return request<{ settings: PlatformSettings }>("/admin/settings", { method: "PATCH", body: patch });
  },
  async audit(limit = 40) {
    return request<{ entries: AuditEntry[] }>(`/admin/audit?limit=${limit}`);
  },
  async approvals(status = "pending") {
    return request<{ pendingCount: number; approvals: AdminApproval[] }>(
      `/admin/approvals?status=${encodeURIComponent(status)}`
    );
  },
  async salonPreview(id: string) {
    return request<{ salon: Salon; owner: { name: string; email: string }; approval: AdminApproval }>(
      `/admin/salons/${id}/preview`
    );
  },
  async salonApproval(id: string) {
    return request<{ approval: AdminApproval; history: ApprovalEvent[] }>(`/admin/salons/${id}/approval`);
  },
  async approveSalon(id: string, note = "") {
    return request<{ success: boolean; approvalStatus: string }>(`/admin/salons/${id}/approve`, {
      method: "POST",
      body: { note },
    });
  },
  async rejectSalon(id: string, note: string) {
    return request<{ success: boolean; approvalStatus: string }>(`/admin/salons/${id}/reject`, {
      method: "POST",
      body: { note },
    });
  },
  async requestChanges(id: string, note: string) {
    return request<{ success: boolean; approvalStatus: string }>(`/admin/salons/${id}/request-changes`, {
      method: "POST",
      body: { note },
    });
  },
  async unpublishSalon(id: string) {
    return request<{ success: boolean; status: string }>(`/admin/salons/${id}/unpublish`, { method: "POST" });
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

export function resolveSiteUrl(slug: string, config?: PlatformConfig | null): string {
  const origin = config?.siteOrigin || (typeof window !== "undefined" ? window.location.origin : "");
  return `${origin.replace(/\/$/, "")}/${slug}`;
}

export function resolveSubdomainUrl(slug: string, config?: PlatformConfig | null): string {
  if (!config?.baseDomain) return "";
  return `https://${slug}.${config.baseDomain}`;
}

export type SalonUpdatePayload = Partial<
  Pick<
    Salon,
    | "name"
    | "slug"
    | "tagline"
    | "description"
    | "logoUrl"
    | "heroImageUrl"
    | "backgroundImageUrl"
    | "aboutImageUrl"
    | "heroTitle"
    | "heroSubtitle"
    | "aboutTitle"
    | "aboutText"
    | "announcement"
    | "ctaText"
    | "address"
    | "city"
    | "state"
    | "postalCode"
    | "country"
    | "phone"
    | "whatsapp"
    | "email"
    | "instagram"
    | "facebook"
    | "tiktok"
    | "website"
    | "currency"
    | "timezone"
    | "template"
    | "primaryColor"
    | "accentColor"
    | "seoTitle"
    | "seoDescription"
  >
> & {
  sections?: SectionConfig[];
  hours?: DayHours[];
  bookingSettings?: Salon["bookingSettings"];
};

export function isApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError;
}
