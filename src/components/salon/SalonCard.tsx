import { Link } from "react-router-dom";
import { ArrowUpRight, MapPin, Sparkles, Star } from "lucide-react";
import type { SalonSummary } from "@/types/salon";
import { formatPrice } from "@/types/salon";
import { cn } from "@/lib/utils";

const fallbackGradients: Record<string, string> = {
  luxury: "linear-gradient(135deg, #221d10 0%, #0c0b08 55%, #2b2413 100%)",
  blush: "linear-gradient(135deg, #f3dfd8 0%, #ead2ca 50%, #d9b8ae 100%)",
  noir: "linear-gradient(135deg, #26262a 0%, #0b0b0d 60%, #1c1c21 100%)",
  emerald: "linear-gradient(135deg, #12362b 0%, #06120e 60%, #1b4436 100%)",
};

export default function SalonCard({ salon, className }: { salon: SalonSummary; className?: string }) {
  const location = [salon.city, salon.state || salon.country].filter(Boolean).join(", ");
  return (
    <Link
      to={`/${salon.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-all duration-500 hover:-translate-y-1 hover:border-primary/40 hover:shadow-2xl hover:shadow-black/40",
        className
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {salon.heroImageUrl ? (
          <img
            src={salon.heroImageUrl}
            alt={`${salon.name} salon`}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: fallbackGradients[salon.template] ?? fallbackGradients.luxury }}
          >
            <span className="font-serif text-4xl tracking-[0.2em] text-white/20 uppercase">
              {salon.name.slice(0, 2)}
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-transparent" />

        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
            {salon.serviceCount > 0 ? `${salon.serviceCount} services` : "New studio"}
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-serif text-xl text-white">{salon.name}</h3>
            {location && (
              <p className="mt-1 flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-white/65">
                <MapPin className="h-3 w-3" /> {location}
              </p>
            )}
          </div>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-black">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {salon.tagline || salon.description || "A new salon website on Velvet Studio."}
        </p>

        {salon.services.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {salon.services.slice(0, 3).map((service) => (
              <span
                key={service}
                className="rounded-full border border-border/80 bg-background/60 px-2.5 py-1 text-[9px] uppercase tracking-[0.1em] text-muted-foreground"
              >
                {service}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between border-t border-border/60 pt-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            {salon.ratingCount > 0 ? (
              <>
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-foreground">{salon.rating.toFixed(1)}</span>
                <span>({salon.ratingCount})</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 text-primary" />
                <span>Newly published</span>
              </>
            )}
          </span>
          {salon.priceFrom > 0 && (
            <span className="text-[10px] uppercase tracking-[0.1em] text-muted-foreground">
              From <span className="font-semibold text-foreground">{formatPrice(salon.priceFrom, salon.currency)}</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
