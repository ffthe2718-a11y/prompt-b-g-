import { useMemo } from "react";
import { MapPin, Navigation, Compass, ExternalLink } from "lucide-react";
import type { Salon } from "@/types/salon";
import { fullAddress, mapsLink } from "@/lib/salonUi";

interface LuxuryMapPlaceholderProps {
  salon: Salon;
  theme: {
    bg: string;
    surface: string;
    border: string;
    accent: string;
    accentText: string;
    ink: string;
    muted: string;
    isLight?: boolean;
  };
  className?: string;
}

/**
 * Computes deterministic coordinate strings for luxury map aesthetic
 * based on salon ID or address string length.
 */
function deriveCoordinates(address: string, city: string, country: string) {
  const seed = (address + city + country).split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const lat = (48.8566 + (seed % 100) * 0.0012).toFixed(4);
  const lng = (2.3522 + (seed % 120) * 0.0015).toFixed(4);
  return {
    lat: `${lat}° N`,
    lng: `${lng}° E`,
  };
}

export default function LuxuryMapPlaceholder({ salon, theme, className }: LuxuryMapPlaceholderProps) {
  const addressText = fullAddress(salon) || [salon.city, salon.state, salon.country].filter(Boolean).join(", ") || "Main Studio Location";
  const coords = useMemo(() => deriveCoordinates(salon.address || "", salon.city || "", salon.country || ""), [salon.address, salon.city, salon.country]);

  const mapsUrl = mapsLink(salon);

  return (
    <div
      className={`group relative overflow-hidden rounded-3xl border transition-all ${className || ""}`}
      style={{ borderColor: theme.border, backgroundColor: theme.surface }}
    >
      {/* Canvas / Vector Map Graphic Background */}
      <div className="relative h-full min-h-[320px] w-full overflow-hidden">
        {/* Base Grid Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `radial-gradient(${theme.accent} 1px, transparent 1px), linear-gradient(to right, ${theme.border} 1px, transparent 1px), linear-gradient(to bottom, ${theme.border} 1px, transparent 1px)`,
            backgroundSize: "24px 24px, 48px 48px, 48px 48px",
          }}
        />

        {/* Abstract Street Vector Paths */}
        <svg
          className="absolute inset-0 h-full w-full opacity-35"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 600 400"
          preserveAspectRatio="none"
        >
          {/* Main Avenues / Highways */}
          <path d="M-50 200 Q 150 120, 300 200 T 650 180" fill="none" stroke={theme.accent} strokeWidth="4" strokeLinecap="round" opacity="0.6" />
          <path d="M 300 -50 L 300 450" fill="none" stroke={theme.accent} strokeWidth="3" opacity="0.5" />
          <path d="M 120 -50 Q 250 200, 480 450" fill="none" stroke={theme.accent} strokeWidth="2" opacity="0.4" />
          <path d="M-50 320 Q 280 280, 650 350" fill="none" stroke={theme.border} strokeWidth="2.5" />

          {/* Secondary Street Grid */}
          <path d="M 50 0 L 50 400 M 150 0 L 150 400 M 220 0 L 220 400 M 380 0 L 380 400 M 450 0 L 450 400 M 530 0 L 530 400" fill="none" stroke={theme.border} strokeWidth="1" strokeDasharray="4 4" />
          <path d="M 0 60 L 600 60 M 0 130 L 600 130 M 0 260 L 600 260 M 0 340 L 600 340" fill="none" stroke={theme.border} strokeWidth="1" strokeDasharray="4 4" />

          {/* River / Park Contour Shape */}
          <path
            d="M-50 80 Q 100 140, 240 70 T 650 110 L 650 -50 L -50 -50 Z"
            fill={theme.accent}
            opacity="0.06"
          />
        </svg>

        {/* Ambient Radial Gradient Glow at Center */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl opacity-30"
          style={{ backgroundColor: theme.accent }}
        />

        {/* Top Header Overlay Badge */}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          <span
            className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em] backdrop-blur-md shadow-md"
            style={{
              borderColor: theme.border,
              backgroundColor: `${theme.bg}cc`,
              color: theme.ink,
            }}
          >
            <Compass className="h-3 w-3" style={{ color: theme.accent }} /> Studio Location
          </span>
        </div>

        {/* Top Right Coordinates Display */}
        <div className="absolute right-4 top-4 z-10 hidden sm:block">
          <span
            className="rounded-full border px-2.5 py-1 font-mono text-[9px] font-semibold tracking-widest backdrop-blur-md"
            style={{
              borderColor: theme.border,
              backgroundColor: `${theme.bg}cc`,
              color: theme.accent,
            }}
          >
            {coords.lat} · {coords.lng}
          </span>
        </div>

        {/* CENTER PIN / MAP MARKER */}
        <div className="absolute left-1/2 top-1/2 z-20 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
          {/* Outer Pulsing Aura Ring */}
          <div className="relative flex items-center justify-center">
            <span
              className="absolute h-16 w-16 animate-ping rounded-full opacity-25"
              style={{ backgroundColor: theme.accent }}
            />
            <span
              className="absolute h-12 w-12 rounded-full border opacity-50"
              style={{ borderColor: theme.accent }}
            />

            {/* Main Pin Badge Button */}
            <div
              className="relative flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-2xl transition-transform duration-300 group-hover:scale-110"
              style={{
                borderColor: theme.accent,
                backgroundColor: theme.bg,
                color: theme.accent,
              }}
            >
              <MapPin className="h-5 w-5 fill-current/20" />
            </div>
          </div>

          {/* Floating Tooltip Card */}
          <div
            className="mt-3 max-w-[240px] rounded-2xl border px-3.5 py-2.5 text-center shadow-2xl backdrop-blur-md transition-all duration-300 group-hover:-translate-y-1"
            style={{
              borderColor: theme.border,
              backgroundColor: `${theme.bg}f0`,
              color: theme.ink,
            }}
          >
            <p className="truncate font-serif text-xs font-semibold" style={{ color: theme.ink }}>
              {salon.name}
            </p>
            <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight" style={{ color: theme.muted }}>
              {addressText}
            </p>
          </div>
        </div>

        {/* Bottom Overlay Info & Direction Button */}
        <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            className="flex items-center gap-2 rounded-xl border px-3 py-1.5 backdrop-blur-md"
            style={{ borderColor: theme.border, backgroundColor: `${theme.bg}cc` }}
          >
            <Navigation className="h-3 w-3" style={{ color: theme.accent }} />
            <span className="text-[9px] uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
              Static Map View · {salon.city || salon.country || "Studio"}
            </span>
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full px-4 text-[9px] font-bold uppercase tracking-[0.18em] shadow-lg transition-transform hover:scale-[1.02]"
              style={{ backgroundColor: theme.accent, color: theme.accentText }}
            >
              Get Directions <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
