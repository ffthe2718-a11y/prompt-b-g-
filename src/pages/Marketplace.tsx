import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Loader2, MapPin, Search, SlidersHorizontal, Sparkles, Store, X } from "lucide-react";
import { publicApi } from "@/lib/api";
import type { SalonSummary } from "@/types/salon";
import SalonCard from "@/components/salon/SalonCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

type Sort = "newest" | "rating" | "name";

export default function Marketplace() {
  const { user } = useAuth();
  const [salons, setSalons] = useState<SalonSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [directoryVisible, setDirectoryVisible] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    publicApi
      .listSalons()
      .then(({ salons: list, directoryVisible: visible }) => {
        if (!cancelled) {
          setSalons(list);
          setDirectoryVisible(visible !== false);
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Could not load salon sites.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = salons;
    if (q) {
      result = salons.filter((salon) => {
        const haystack = [
          salon.name,
          salon.tagline,
          salon.description,
          salon.city,
          salon.state,
          salon.country,
          ...salon.services,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }
    return [...result].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating || b.ratingCount - a.ratingCount;
      if (sort === "name") return a.name.localeCompare(b.name);
      return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
    });
  }, [salons, query, sort]);

  const startLink = user ? (user.role === "super_admin" ? "/admin" : user.salon ? "/dashboard" : "/onboarding") : "/signup";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[460px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[120px]" />
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">The directory</span>
            <h1 className="mt-3 font-light text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              Salon sites, <span className="font-serif italic text-primary">live</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Explore real websites built by independent owners on Velvet. Every site is its own world — its own
              brand, services and booking flow.
            </p>
          </div>
          <Button
            asChild
            className="h-11 w-fit rounded-full bg-primary px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-black"
          >
            <Link to={startLink}>
              Create your site <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by salon, city or service…"
              className="h-10 rounded-xl border-border bg-background pl-9 pr-9 text-xs"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="hidden items-center gap-1.5 pl-2 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground sm:flex">
              <SlidersHorizontal className="h-3 w-3" /> Sort
            </span>
            {(
              [
                ["newest", "Newest"],
                ["rating", "Top rated"],
                ["name", "A–Z"],
              ] as [Sort, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setSort(value)}
                className={cn(
                  "shrink-0 rounded-full border px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.14em] transition-colors",
                  sort === value
                    ? "border-primary bg-primary text-black"
                    : "border-border bg-background text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          <span>
            {loading ? "Discovering sites…" : `${filtered.length} live site${filtered.length === 1 ? "" : "s"}`}
          </span>
          {query && <span className="normal-case tracking-normal">Results for “{query}”</span>}
        </div>

        {loading ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-3xl border border-border bg-card">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-2/3 rounded bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                  <div className="h-8 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-10 text-center">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        ) : filtered.length > 0 ? (
          <motion.div layout className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </motion.div>
        ) : (
          <div className="mt-6 rounded-3xl border border-dashed border-border bg-card/30 px-6 py-16 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/5">
              {query ? <Search className="h-6 w-6 text-primary" /> : <Store className="h-6 w-6 text-primary" />}
            </div>
            <h2 className="font-serif text-2xl text-foreground">
              {query
                ? "No salons match that search."
                : directoryVisible
                  ? "The directory is waiting for its first site."
                  : "The directory is taking a break."}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
              {query
                ? "Try a different salon name, city or service."
                : directoryVisible
                  ? "Publish your salon website and it will appear here automatically — with your logo, services and booking link."
                  : "Every published salon website is still live at its own address. The platform has simply paused the public directory."}
            </p>
            <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
              {query && (
                <Button
                  variant="outline"
                  onClick={() => setQuery("")}
                  className="h-10 rounded-full border-border px-5 text-[9px] font-bold uppercase tracking-[0.18em]"
                >
                  Clear search
                </Button>
              )}
              <Button asChild className="h-10 rounded-full bg-primary px-6 text-[9px] font-bold uppercase tracking-[0.18em] text-black">
                <Link to={startLink}>
                  <Sparkles className="h-3 w-3" /> Launch your site
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
