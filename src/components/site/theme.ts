import type { Salon } from "@/types/salon";

export interface SiteTheme {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  muted: string;
  border: string;
  accent: string;
  accentText: string;
  accentSoft: string;
  heroFallback: string;
  isLight: boolean;
  navBlur: string;
  vars: Record<string, string>;
}

function luminance(hex: string): number {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return 0;
  const channels = [0, 2, 4].map((offset) => {
    const value = parseInt(clean.slice(offset, offset + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

export function readableInk(background: string): string {
  return luminance(background) > 0.52 ? "#0a0a0a" : "#ffffff";
}

function withAlpha(hex: string, alpha: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${alpha}` : hex;
}

export function siteTheme(salon: Pick<Salon, "template" | "primaryColor" | "accentColor">): SiteTheme {
  const accent = /^#[0-9a-fA-F]{6}$/.test(salon.primaryColor) ? salon.primaryColor : "#D4AF37";
  const secondary = /^#[0-9a-fA-F]{6}$/.test(salon.accentColor) ? salon.accentColor : "#F4E4BC";

  let palette: Pick<SiteTheme, "bg" | "surface" | "surfaceAlt" | "ink" | "muted" | "border" | "heroFallback" | "isLight" | "navBlur">;

  switch (salon.template) {
    case "blush":
      palette = {
        bg: "#fbf5f0",
        surface: "#fffaf6",
        surfaceAlt: "#f5e9e1",
        ink: "#2b211c",
        muted: "#7c6b61",
        border: "#e9d9cf",
        heroFallback: "linear-gradient(145deg,#f8ece3 0%,#ecd6c9 55%,#dfc1b4 100%)",
        isLight: true,
        navBlur: "rgba(251,245,240,0.88)",
      };
      break;
    case "noir":
      palette = {
        bg: "#0a0a0b",
        surface: "#121214",
        surfaceAlt: "#18181b",
        ink: "#fafafa",
        muted: "#a1a1aa",
        border: "#27272a",
        heroFallback: "linear-gradient(145deg,#232326 0%,#0b0b0d 60%,#1c1c21 100%)",
        isLight: false,
        navBlur: "rgba(10,10,11,0.82)",
      };
      break;
    case "emerald":
      palette = {
        bg: "#07110d",
        surface: "#0c1b15",
        surfaceAlt: "#11241c",
        ink: "#f4efe4",
        muted: "#9eb0a6",
        border: "#1f352b",
        heroFallback: "linear-gradient(145deg,#153b2e 0%,#07120e 60%,#0f2a20 100%)",
        isLight: false,
        navBlur: "rgba(7,17,13,0.84)",
      };
      break;
    case "luxury":
    default:
      palette = {
        bg: "#080806",
        surface: "#100f0b",
        surfaceAlt: "#16140e",
        ink: "#f7f1e5",
        muted: "#a89f8f",
        border: "#2a251a",
        heroFallback: "linear-gradient(145deg,#221d10 0%,#080807 55%,#2b2413 100%)",
        isLight: false,
        navBlur: "rgba(8,8,6,0.82)",
      };
  }

  const accentText = readableInk(accent);
  return {
    ...palette,
    accent,
    accentText,
    accentSoft: withAlpha(accent, "1a"),
    vars: {
      "--site-bg": palette.bg,
      "--site-surface": palette.surface,
      "--site-surface-alt": palette.surfaceAlt,
      "--site-ink": palette.ink,
      "--site-muted": palette.muted,
      "--site-border": palette.border,
      "--site-accent": accent,
      "--site-accent-text": accentText,
      "--site-accent-soft": withAlpha(accent, "1a"),
      "--site-secondary": secondary,
      "--site-secondary-soft": withAlpha(secondary, "26"),
    },
  };
}
