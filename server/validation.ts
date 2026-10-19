/** Shared validation + formatting helpers for the API. */

export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, string>;

  constructor(status: number, message: string, code = "request_error", details?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const RESERVED_SLUGS = new Set([
  "api", "admin", "administrator", "assets", "auth", "book", "booking", "blog",
  "bundles", "business", "checkout", "contact", "dashboard", "docs", "download",
  "embed", "features", "gallery", "help", "home", "images", "instagram", "join",
  "legal", "login", "logout", "mail", "marketplace", "media", "new", "onboarding",
  "pricing", "privacy", "public", "register", "reviews", "s", "salon", "salons",
  "services", "settings", "signin", "signout", "signup", "start", "static",
  "status", "studio", "support", "terms", "upload", "uploads", "user", "users",
  "velvet", "www", "app", "platform", "preview", "site", "sites", "teams", "team",
]);

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{1,46}[a-z0-9])$/.test(slug) && !RESERVED_SLUGS.has(slug);
}

export function cleanText(value: unknown, max = 500): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export function cleanMultiline(value: unknown, max = 5000): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value) && value.length <= 254;
}

export function normalizeEmail(value: unknown): string {
  return cleanText(value, 254).toLowerCase();
}

export function isHexColor(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

/**
 * Only allow remote http(s) images or files uploaded to this platform.
 * This blocks javascript:, data: and other schemes in image/link fields.
 */
export function safeImageUrl(value: unknown, max = 2000): string {
  const raw = cleanText(value, max);
  if (!raw) return "";
  if (raw.startsWith("/uploads/") && !raw.includes("..")) return raw;
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    /* ignore */
  }
  return "";
}

export function safeLinkUrl(value: unknown, max = 500): string {
  const raw = cleanText(value, max);
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (url.protocol === "http:" || url.protocol === "https:") return url.toString();
  } catch {
    /* ignore */
  }
  return "";
}

export function digitsOnly(value: unknown, max = 20): string {
  return cleanText(value, max).replace(/[^\d+]/g, "");
}

export function toCents(value: unknown): number {
  const number = typeof value === "number" ? value : Number(String(value ?? "").replace(/[^\d.]/g, ""));
  if (!Number.isFinite(number) || number < 0) return 0;
  return Math.min(Math.round(number * 100), 10_000_000);
}

export function parseBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return fallback;
}

export function isValidDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function normalizeDomain(value: unknown): string {
  const raw = cleanText(value, 253).toLowerCase();
  if (!raw) return "";
  let host = raw.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  if (host.startsWith("www.")) host = host.slice(4);
  if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(host)) return "";
  if (!host.includes(".")) return "";
  return host;
}

export const DEFAULT_HOURS = [
  { day: "Monday", closed: false, open: "10:00", close: "20:00" },
  { day: "Tuesday", closed: false, open: "10:00", close: "20:00" },
  { day: "Wednesday", closed: false, open: "10:00", close: "20:00" },
  { day: "Thursday", closed: false, open: "10:00", close: "20:00" },
  { day: "Friday", closed: false, open: "10:00", close: "20:00" },
  { day: "Saturday", closed: false, open: "10:00", close: "20:00" },
  { day: "Sunday", closed: true, open: "10:00", close: "18:00" },
];

export const DEFAULT_SECTIONS = [
  { id: "hero", label: "Hero", enabled: true, order: 0 },
  { id: "about", label: "About", enabled: true, order: 1 },
  { id: "services", label: "Services", enabled: true, order: 2 },
  { id: "team", label: "Team", enabled: true, order: 3 },
  { id: "gallery", label: "Gallery", enabled: true, order: 4 },
  { id: "reviews", label: "Reviews", enabled: true, order: 5 },
  { id: "booking", label: "Booking", enabled: true, order: 6 },
  { id: "contact", label: "Contact", enabled: true, order: 7 },
];

export const TEMPLATES = new Set(["luxury", "blush", "noir", "emerald"]);
export const CURRENCIES = new Set(["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"]);
