import type { DayHours, Salon, TemplateId } from "@/types/salon";

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

export const TEMPLATE_PRESETS: Record<
  TemplateId,
  {
    name: string;
    mood: string;
    primary: string;
    accent: string;
    gradient: string;
    ink: string;
  }
> = {
  luxury: {
    name: "Luxury Gold",
    mood: "Dark & high-glamour",
    primary: "#D4AF37",
    accent: "#F4E4BC",
    gradient: "linear-gradient(160deg,#17140b 0%,#080807 58%,#2a2212 100%)",
    ink: "#f5ecdc",
  },
  blush: {
    name: "Blush Atelier",
    mood: "Warm & editorial",
    primary: "#B76E79",
    accent: "#E9D2C6",
    gradient: "linear-gradient(160deg,#fbf3ed 0%,#f3e2d8 55%,#e9d2c6 100%)",
    ink: "#2c221d",
  },
  noir: {
    name: "Noir Minimal",
    mood: "Clean & monochrome",
    primary: "#D6D3D1",
    accent: "#8A8A8A",
    gradient: "linear-gradient(160deg,#19191c 0%,#09090a 58%,#222226 100%)",
    ink: "#f5f5f4",
  },
  emerald: {
    name: "Emerald Spa",
    mood: "Earthy & wellness-led",
    primary: "#C9A86A",
    accent: "#86A294",
    gradient: "linear-gradient(160deg,#0d211a 0%,#07120e 58%,#143529 100%)",
    ink: "#f2efe4",
  },
};

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const DEFAULT_HOURS: DayHours[] = [
  { day: "Monday", closed: false, open: "10:00", close: "20:00" },
  { day: "Tuesday", closed: false, open: "10:00", close: "20:00" },
  { day: "Wednesday", closed: false, open: "10:00", close: "20:00" },
  { day: "Thursday", closed: false, open: "10:00", close: "20:00" },
  { day: "Friday", closed: false, open: "10:00", close: "20:00" },
  { day: "Saturday", closed: false, open: "10:00", close: "20:00" },
  { day: "Sunday", closed: true, open: "10:00", close: "18:00" },
];

export function formatTime12(time: string): string {
  if (!time) return "";
  const [hStr, mStr] = time.split(":");
  const h = parseInt(hStr, 10);
  if (isNaN(h)) return time;
  const m = mStr ?? "00";
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export function getSalonOpenStatus(hours: DayHours[] | undefined) {
  if (!hours || hours.length === 0) {
    return { isOpen: false, text: "Hours unavailable", today: "" };
  }
  const now = new Date();
  const dayName = new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(now);
  const todayHour = hours.find((h) => h.day.toLowerCase() === dayName.toLowerCase());
  if (!todayHour || todayHour.closed) {
    return { isOpen: false, text: "Closed today", today: dayName, todayHour };
  }
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = todayHour.open.split(":").map(Number);
  const [closeH, closeM] = todayHour.close.split(":").map(Number);
  const openMinutes = (openH || 0) * 60 + (openM || 0);
  const closeMinutes = (closeH || 0) * 60 + (closeM || 0);

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    return {
      isOpen: true,
      text: `Open now until ${formatTime12(todayHour.close)}`,
      today: dayName,
      todayHour,
    };
  } else if (currentMinutes < openMinutes) {
    return {
      isOpen: false,
      text: `Opens today at ${formatTime12(todayHour.open)}`,
      today: dayName,
      todayHour,
    };
  } else {
    return {
      isOpen: false,
      text: `Closed for today (closed at ${formatTime12(todayHour.close)})`,
      today: dayName,
      todayHour,
    };
  }
}

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Australia/Sydney",
  "UTC",
];

export const CURRENCIES = ["INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD", "SGD"];

export function sitePath(slug: string) {
  return `/${slug}`;
}

export function absoluteUrl(path: string) {
  if (typeof window === "undefined") return path;
  return `${window.location.origin}${path}`;
}

export function whatsappLink(number: string, message = "Hello! I would like to book an appointment.") {
  const digits = String(number || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function telLink(number: string) {
  return `tel:${String(number || "").replace(/[^\d+]/g, "")}`;
}

export function mapsLink(salon: Pick<Salon, "address" | "city" | "state" | "postalCode" | "country">) {
  const query = [salon.address, salon.city, salon.state, salon.postalCode, salon.country].filter(Boolean).join(", ");
  return query ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}` : "";
}

export function fullAddress(salon: Pick<Salon, "address" | "city" | "state" | "postalCode" | "country">) {
  return [salon.address, salon.city, salon.state, salon.postalCode, salon.country].filter(Boolean).join(", ");
}

export function instagramUrl(handleOrUrl: string) {
  const clean = String(handleOrUrl || "").trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  const handle = clean.replace(/^@/, "");
  return handle ? `https://instagram.com/${handle}` : "";
}

export function facebookUrl(handleOrUrl: string) {
  const clean = String(handleOrUrl || "").trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  const handle = clean.replace(/^@/, "");
  return handle ? `https://facebook.com/${handle}` : "";
}

export function twitterUrl(handleOrUrl: string) {
  const clean = String(handleOrUrl || "").trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  const handle = clean.replace(/^@/, "");
  return handle ? `https://twitter.com/${handle}` : "";
}

export function tiktokUrl(handleOrUrl: string) {
  const clean = String(handleOrUrl || "").trim();
  if (!clean) return "";
  if (clean.startsWith("http://") || clean.startsWith("https://")) return clean;
  const handle = clean.replace(/^@/, "");
  return handle ? `https://tiktok.com/@${handle}` : "";
}

export function initials(name: string) {
  return String(name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase())
    .join("");
}

export function isHexColor(value: string) {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function publicUrlFor(slug: string) {
  return `${window.location.origin}/${slug}`;
}

export function shortRef(id: string) {
  return id.slice(0, 8).toUpperCase();
}

export function chmodStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}
