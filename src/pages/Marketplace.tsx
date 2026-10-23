import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  Tag,
  X,
  DollarSign,
  Star,
  RotateCcw,
} from "lucide-react";
import { publicApi } from "@/lib/api";
import type { SalonSummary } from "@/types/salon";
import { CURRENCY_SYMBOLS, formatPrice } from "@/types/salon";
import SalonCard from "@/components/salon/SalonCard";
import FilterSidebar, { FilterState, INITIAL_FILTER_STATE } from "@/components/marketplace/FilterSidebar";
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
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTER_STATE);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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

  // Compute available locations with counts
  const availableLocations = useMemo(() => {
    const counts = new Map<string, number>();
    salons.forEach((salon) => {
      const loc = salon.city || salon.state || salon.country;
      if (loc) {
        counts.set(loc, (counts.get(loc) || 0) + 1);
      }
    });
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [salons]);

  // Compute available service categories with counts
  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    salons.forEach((salon) => {
      const categories = salon.categories && salon.categories.length > 0 ? salon.categories : [];
      categories.forEach((cat) => {
        if (cat) counts.set(cat, (counts.get(cat) || 0) + 1);
      });
    });

    // Fallback if no explicit categories stored: infer from standard categories or service names
    if (counts.size === 0) {
      const defaults = ["Hair", "Colour", "Skin", "Nails", "Spa", "Massage", "Bridal", "Barber"];
      salons.forEach((salon) => {
        const text = [...salon.services, salon.tagline, salon.description].join(" ").toLowerCase();
        defaults.forEach((cat) => {
          if (text.includes(cat.toLowerCase())) {
            counts.set(cat, (counts.get(cat) || 0) + 1);
          }
        });
      });
    }

    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [salons]);

  // Compute maximum price across directory
  const maxDirectoryPrice = useMemo(() => {
    let max = 0;
    salons.forEach((salon) => {
      if (salon.priceTo && salon.priceTo > max) max = salon.priceTo;
      if (salon.priceFrom && salon.priceFrom > max) max = salon.priceFrom;
    });
    return max || 300;
  }, [salons]);

  // Detect dominant currency symbol in directory
  const currencySymbol = useMemo(() => {
    if (salons.length > 0 && salons[0].currency) {
      return CURRENCY_SYMBOLS[salons[0].currency] || "$";
    }
    return "$";
  }, [salons]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (query.trim()) count++;
    if (filters.locationQuery.trim()) count++;
    if (filters.selectedLocations.length) count += filters.selectedLocations.length;
    if (filters.minPrice || filters.maxPrice || filters.pricePreset !== "all") count++;
    if (filters.selectedCategories.length) count += filters.selectedCategories.length;
    if (filters.minRating > 0) count++;
    return count;
  }, [query, filters]);

  // Reset all filters including search query
  const handleClearAll = () => {
    setQuery("");
    setFilters(INITIAL_FILTER_STATE);
  };

  // Filter & sort logic
  const filtered = useMemo(() => {
    let result = salons;

    // 1. Text Search Query
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((salon) => {
        const haystack = [
          salon.name,
          salon.tagline,
          salon.description,
          salon.city,
          salon.state,
          salon.country,
          ...(salon.categories || []),
          ...salon.services,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(q);
      });
    }

    // 2. Geographic Location Filter
    if (filters.selectedLocations.length > 0) {
      result = result.filter((salon) => {
        const locs = [salon.city, salon.state, salon.country].filter(Boolean).map((l) => l.toLowerCase());
        return filters.selectedLocations.some((selected) => locs.includes(selected.toLowerCase()));
      });
    }

    if (filters.locationQuery.trim()) {
      const locQ = filters.locationQuery.trim().toLowerCase();
      result = result.filter((salon) => {
        const locText = [salon.city, salon.state, salon.country].filter(Boolean).join(" ").toLowerCase();
        return locText.includes(locQ);
      });
    }

    // 3. Price Range Filter
    const minP = filters.minPrice !== "" ? Number(filters.minPrice) : null;
    const maxP = filters.maxPrice !== "" ? Number(filters.maxPrice) : null;

    if (minP !== null && !isNaN(minP)) {
      result = result.filter((salon) => {
        const effectiveMax = salon.priceTo && salon.priceTo > 0 ? salon.priceTo : salon.priceFrom;
        return effectiveMax >= minP;
      });
    }

    if (maxP !== null && !isNaN(maxP)) {
      result = result.filter((salon) => {
        const effectiveMin = salon.priceFrom;
        return effectiveMin <= maxP;
      });
    }

    // 4. Service Category Filter
    if (filters.selectedCategories.length > 0) {
      result = result.filter((salon) => {
        const salonCats = (salon.categories || []).map((c) => c.toLowerCase());
        const serviceNames = (salon.services || []).map((s) => s.toLowerCase());

        return filters.selectedCategories.some((selectedCat) => {
          const target = selectedCat.toLowerCase();
          return (
            salonCats.includes(target) ||
            serviceNames.some((s) => s.includes(target)) ||
            (salon.tagline && salon.tagline.toLowerCase().includes(target)) ||
            (salon.description && salon.description.toLowerCase().includes(target))
          );
        });
      });
    }

    // 5. Minimum Rating Filter
    if (filters.minRating > 0) {
      result = result.filter((salon) => salon.rating >= filters.minRating);
    }

    // Sort
    return [...result].sort((a, b) => {
      if (sort === "rating") return b.rating - a.rating || b.ratingCount - a.ratingCount;
      if (sort === "name") return a.name.localeCompare(b.name);
      return String(b.publishedAt || "").localeCompare(String(a.publishedAt || ""));
    });
  }, [salons, query, filters, sort]);

  const startLink = user ? (user.role === "super_admin" ? "/admin" : user.salon ? "/dashboard" : "/onboarding") : "/signup";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-[-240px] h-[460px] w-[800px] -translate-x-1/2 rounded-full bg-primary/[0.08] blur-[120px]" />
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-20 pt-12 sm:px-8 sm:pt-16 lg:px-12">
        {/* Page Hero */}
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">The directory</span>
            <h1 className="mt-3 font-light text-4xl tracking-tight sm:text-5xl lg:text-6xl">
              Salon sites, <span className="font-serif italic text-primary">live</span>.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Explore real websites built by independent owners on Velvet. Search by geographic location, price range, or service category.
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

        {/* Top Control Bar (Search + Sort + Mobile Filter Trigger) */}
        <div className="mt-10 flex flex-col gap-3 rounded-2xl border border-border bg-card/60 p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by salon name, city or service…"
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
            {/* Mobile Filter Toggle Button */}
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex shrink-0 items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary lg:hidden"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
              {activeFilterCount > 0 && (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] text-black font-extrabold">
                  {activeFilterCount}
                </span>
              )}
            </button>

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

        {/* Active Filter Chips Bar */}
        {activeFilterCount > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-border/50 bg-card/30 p-2.5 text-xs">
            <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Active Filters:</span>

            {query && (
              <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] text-primary">
                Search: "{query}"
                <button onClick={() => setQuery("")} className="hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.locationQuery && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-foreground">
                <MapPin className="h-3 w-3 text-primary" /> "{filters.locationQuery}"
                <button onClick={() => setFilters({ ...filters, locationQuery: "" })} className="hover:text-primary">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.selectedLocations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-foreground"
              >
                <MapPin className="h-3 w-3 text-primary" /> {loc}
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      selectedLocations: filters.selectedLocations.filter((l) => l !== loc),
                    })
                  }
                  className="hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {(filters.minPrice || filters.maxPrice || filters.pricePreset !== "all") && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-foreground">
                <DollarSign className="h-3 w-3 text-primary" />{" "}
                {filters.minPrice && filters.maxPrice
                  ? `${currencySymbol}${filters.minPrice}–${currencySymbol}${filters.maxPrice}`
                  : filters.minPrice
                  ? `>= ${currencySymbol}${filters.minPrice}`
                  : `<= ${currencySymbol}${filters.maxPrice}`}
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      minPrice: "",
                      maxPrice: "",
                      pricePreset: "all",
                    })
                  }
                  className="hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            {filters.selectedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-foreground"
              >
                <Tag className="h-3 w-3 text-primary" /> {cat}
                <button
                  onClick={() =>
                    setFilters({
                      ...filters,
                      selectedCategories: filters.selectedCategories.filter((c) => c !== cat),
                    })
                  }
                  className="hover:text-primary"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}

            {filters.minRating > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1 text-[10px] text-foreground">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> {filters.minRating}+ Stars
                <button onClick={() => setFilters({ ...filters, minRating: 0 })} className="hover:text-primary">
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}

            <button
              onClick={handleClearAll}
              className="ml-auto inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-primary"
            >
              <RotateCcw className="h-3 w-3" /> Reset all
            </button>
          </div>
        )}

        {/* Main Content Area (Sidebar + Grid) */}
        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block lg:w-72 lg:shrink-0 lg:sticky lg:top-20">
            <div className="rounded-3xl border border-border bg-card/60 p-5 backdrop-blur-sm shadow-xl">
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                availableLocations={availableLocations}
                availableCategories={availableCategories}
                maxDirectoryPrice={maxDirectoryPrice}
                totalResults={filtered.length}
                unfilteredCount={salons.length}
                currencySymbol={currencySymbol}
              />
            </div>
          </div>

          {/* Results Column */}
          <div className="flex-1">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              <span>
                {loading
                  ? "Discovering sites…"
                  : `${filtered.length} live site${filtered.length === 1 ? "" : "s"} found`}
              </span>
              {activeFilterCount > 0 && (
                <span className="normal-case tracking-normal">Filtered by {activeFilterCount} criteria</span>
              )}
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
                  <Filter className="h-6 w-6 text-primary" />
                </div>
                <h2 className="font-serif text-2xl text-foreground">
                  {activeFilterCount > 0
                    ? "No salons match your selected filters."
                    : directoryVisible
                    ? "The directory is waiting for its first site."
                    : "The directory is taking a break."}
                </h2>
                <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
                  {activeFilterCount > 0
                    ? "Try adjusting your location, price range or category filters to broaden your search."
                    : directoryVisible
                    ? "Publish your salon website and it will appear here automatically — with your logo, services and booking link."
                    : "Every published salon website is still live at its own address. The platform has simply paused the public directory."}
                </p>
                <div className="mt-6 flex flex-col items-center justify-center gap-2 sm:flex-row">
                  {activeFilterCount > 0 && (
                    <Button
                      variant="outline"
                      onClick={handleClearAll}
                      className="h-10 rounded-full border-border px-5 text-[9px] font-bold uppercase tracking-[0.18em]"
                    >
                      <RotateCcw className="h-3 w-3" /> Reset all filters
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
          </div>
        </div>
      </section>

      {/* Mobile Filter Drawer / Sheet */}
      <AnimatePresence>
        {mobileFilterOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileFilterOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Slide-over panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-xs bg-background p-6 shadow-2xl overflow-y-auto"
            >
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                availableLocations={availableLocations}
                availableCategories={availableCategories}
                maxDirectoryPrice={maxDirectoryPrice}
                totalResults={filtered.length}
                unfilteredCount={salons.length}
                currencySymbol={currencySymbol}
                onCloseMobile={() => setMobileFilterOpen(false)}
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
