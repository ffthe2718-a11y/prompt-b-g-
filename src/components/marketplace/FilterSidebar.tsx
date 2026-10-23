import { useMemo } from "react";
import { Filter, MapPin, DollarSign, Tag, RotateCcw, X, Check, Star, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/types/salon";

export interface FilterState {
  locationQuery: string;
  selectedLocations: string[];
  minPrice: string;
  maxPrice: string;
  pricePreset: string;
  selectedCategories: string[];
  minRating: number;
}

export const INITIAL_FILTER_STATE: FilterState = {
  locationQuery: "",
  selectedLocations: [],
  minPrice: "",
  maxPrice: "",
  pricePreset: "all",
  selectedCategories: [],
  minRating: 0,
};

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  availableLocations: { name: string; count: number }[];
  availableCategories: { name: string; count: number }[];
  maxDirectoryPrice: number;
  totalResults: number;
  unfilteredCount: number;
  currencySymbol?: string;
  onCloseMobile?: () => void;
  className?: string;
}

export default function FilterSidebar({
  filters,
  onChange,
  availableLocations,
  availableCategories,
  maxDirectoryPrice,
  totalResults,
  unfilteredCount,
  currencySymbol = "$",
  onCloseMobile,
  className,
}: FilterSidebarProps) {
  const hasActiveFilters = useMemo(() => {
    return (
      filters.locationQuery.trim() !== "" ||
      filters.selectedLocations.length > 0 ||
      filters.minPrice !== "" ||
      filters.maxPrice !== "" ||
      filters.pricePreset !== "all" ||
      filters.selectedCategories.length > 0 ||
      filters.minRating > 0
    );
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.locationQuery.trim()) count++;
    if (filters.selectedLocations.length) count += filters.selectedLocations.length;
    if (filters.minPrice || filters.maxPrice || filters.pricePreset !== "all") count++;
    if (filters.selectedCategories.length) count += filters.selectedCategories.length;
    if (filters.minRating > 0) count++;
    return count;
  }, [filters]);

  const handleReset = () => {
    onChange(INITIAL_FILTER_STATE);
  };

  const toggleLocation = (loc: string) => {
    const exists = filters.selectedLocations.includes(loc);
    const next = exists
      ? filters.selectedLocations.filter((l) => l !== loc)
      : [...filters.selectedLocations, loc];
    onChange({ ...filters, selectedLocations: next });
  };

  const toggleCategory = (cat: string) => {
    const exists = filters.selectedCategories.includes(cat);
    const next = exists
      ? filters.selectedCategories.filter((c) => c !== cat)
      : [...filters.selectedCategories, cat];
    onChange({ ...filters, selectedCategories: next });
  };

  const handlePricePreset = (preset: string) => {
    if (preset === "all") {
      onChange({ ...filters, pricePreset: "all", minPrice: "", maxPrice: "" });
      return;
    }

    let min = "";
    let max = "";
    if (preset === "under_50") {
      min = "0";
      max = "50";
    } else if (preset === "50_100") {
      min = "50";
      max = "100";
    } else if (preset === "100_200") {
      min = "100";
      max = "200";
    } else if (preset === "200_plus") {
      min = "200";
      max = "";
    }

    onChange({
      ...filters,
      pricePreset: preset,
      minPrice: min,
      maxPrice: max,
    });
  };

  const filteredLocations = useMemo(() => {
    if (!filters.locationQuery.trim()) return availableLocations;
    const q = filters.locationQuery.toLowerCase();
    return availableLocations.filter((loc) => loc.name.toLowerCase().includes(q));
  }, [availableLocations, filters.locationQuery]);

  return (
    <aside className={cn("flex flex-col gap-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Filter className="h-3.5 w-3.5" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">Filter Directory</h2>
          {activeFilterCount > 0 && (
            <span className="flex h-5 items-center rounded-full bg-primary px-2 text-[9px] font-bold text-black">
              {activeFilterCount}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-primary transition-colors"
              title="Reset all filters"
            >
              <RotateCcw className="h-3 w-3" /> Clear
            </button>
          )}

          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:text-foreground lg:hidden"
              aria-label="Close filters"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Sections */}
      <div className="space-y-6 overflow-y-auto pr-1">
        {/* 1. Geographic Location */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              <MapPin className="h-3.5 w-3.5 text-primary" /> Geographic Location
            </label>
            {filters.selectedLocations.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, selectedLocations: [], locationQuery: "" })}
                className="text-[9px] text-muted-foreground hover:text-foreground"
              >
                Clear ({filters.selectedLocations.length})
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={filters.locationQuery}
              onChange={(e) => onChange({ ...filters, locationQuery: e.target.value })}
              placeholder="Search city or region..."
              className="h-9 w-full rounded-xl border border-border bg-background/60 pl-8 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {filters.locationQuery && (
              <button
                onClick={() => onChange({ ...filters, locationQuery: "" })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {filteredLocations.length > 0 ? (
            <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border/60 bg-card/40 p-2 text-xs">
              {filteredLocations.map((loc) => {
                const isSelected = filters.selectedLocations.includes(loc.name);
                return (
                  <button
                    key={loc.name}
                    type="button"
                    onClick={() => toggleLocation(loc.name)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors text-[11px]",
                      isSelected
                        ? "bg-primary/15 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={cn(
                          "flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors",
                          isSelected ? "border-primary bg-primary text-black" : "border-border bg-background"
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </span>
                      <span className="truncate">{loc.name}</span>
                    </span>
                    <span className="ml-2 rounded-full bg-border/50 px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground">
                      {loc.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="p-2 text-[11px] italic text-muted-foreground">No locations found</p>
          )}
        </div>

        {/* 2. Price Range Filter */}
        <div className="space-y-3 border-t border-border/60 pt-5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              <DollarSign className="h-3.5 w-3.5 text-primary" /> Price Range
            </label>
            {(filters.minPrice || filters.maxPrice || filters.pricePreset !== "all") && (
              <button
                onClick={() => handlePricePreset("all")}
                className="text-[9px] text-muted-foreground hover:text-foreground"
              >
                Reset price
              </button>
            )}
          </div>

          {/* Quick Price Tier Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: "all", label: "All Prices" },
              { id: "under_50", label: `< ${currencySymbol}50` },
              { id: "50_100", label: `${currencySymbol}50–100` },
              { id: "100_200", label: `${currencySymbol}100–200` },
              { id: "200_plus", label: `${currencySymbol}200+` },
            ].map((tier) => (
              <button
                key={tier.id}
                type="button"
                onClick={() => handlePricePreset(tier.id)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.1em] transition-colors",
                  filters.pricePreset === tier.id
                    ? "border-primary bg-primary text-black"
                    : "border-border/80 bg-background/60 text-muted-foreground hover:text-foreground"
                )}
              >
                {tier.label}
              </button>
            ))}
          </div>

          {/* Custom Min / Max Inputs */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="space-y-1">
              <span className="text-[9px] font-medium text-muted-foreground">Min price</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={filters.minPrice}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      minPrice: e.target.value,
                      pricePreset: "custom",
                    })
                  }
                  className="h-9 w-full rounded-xl border border-border bg-background/60 pl-6 pr-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-[9px] font-medium text-muted-foreground">Max price</span>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                  {currencySymbol}
                </span>
                <input
                  type="number"
                  min="0"
                  placeholder={maxDirectoryPrice ? String(Math.ceil(maxDirectoryPrice)) : "500"}
                  value={filters.maxPrice}
                  onChange={(e) =>
                    onChange({
                      ...filters,
                      maxPrice: e.target.value,
                      pricePreset: "custom",
                    })
                  }
                  className="h-9 w-full rounded-xl border border-border bg-background/60 pl-6 pr-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 3. Service Category */}
        <div className="space-y-3 border-t border-border/60 pt-5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              <Tag className="h-3.5 w-3.5 text-primary" /> Service Category
            </label>
            {filters.selectedCategories.length > 0 && (
              <button
                onClick={() => onChange({ ...filters, selectedCategories: [] })}
                className="text-[9px] text-muted-foreground hover:text-foreground"
              >
                Clear ({filters.selectedCategories.length})
              </button>
            )}
          </div>

          {availableCategories.length > 0 ? (
            <div className="space-y-1 max-h-52 overflow-y-auto rounded-xl border border-border/60 bg-card/40 p-2">
              {availableCategories.map((cat) => {
                const isSelected = filters.selectedCategories.includes(cat.name);
                return (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => toggleCategory(cat.name)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left transition-colors text-[11px]",
                      isSelected
                        ? "bg-primary/15 font-semibold text-primary"
                        : "text-muted-foreground hover:bg-background/80 hover:text-foreground"
                    )}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className={cn(
                          "flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors",
                          isSelected ? "border-primary bg-primary text-black" : "border-border bg-background"
                        )}
                      >
                        {isSelected && <Check className="h-2.5 w-2.5 stroke-[3]" />}
                      </span>
                      <span className="truncate">{cat.name}</span>
                    </span>
                    <span className="ml-2 rounded-full bg-border/50 px-1.5 py-0.2 text-[9px] font-mono text-muted-foreground">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="p-2 text-[11px] italic text-muted-foreground">No categories available</p>
          )}
        </div>

        {/* 4. Rating Filter */}
        <div className="space-y-3 border-t border-border/60 pt-5">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">
              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> Minimum Rating
            </label>
            {filters.minRating > 0 && (
              <button
                onClick={() => onChange({ ...filters, minRating: 0 })}
                className="text-[9px] text-muted-foreground hover:text-foreground"
              >
                Any rating
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[0, 4.0, 4.5, 4.8].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onChange({ ...filters, minRating: rating })}
                className={cn(
                  "flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-colors",
                  filters.minRating === rating
                    ? "border-amber-400 bg-amber-400/15 text-amber-300 font-bold"
                    : "border-border/80 bg-background/60 text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="text-[11px]">
                  {rating === 0 ? "All" : `${rating}★`}
                </span>
                <span className="text-[8px] font-normal uppercase tracking-wider text-muted-foreground">
                  {rating === 0 ? "Any" : "& up"}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Stats / Action */}
      <div className="mt-auto border-t border-border/60 pt-4 flex flex-col gap-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">Matching Salons:</span>
          <span className="font-bold text-foreground">
            {totalResults} of {unfilteredCount}
          </span>
        </div>

        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="mt-2 h-10 w-full rounded-xl bg-primary text-xs font-bold uppercase tracking-[0.16em] text-black shadow-lg shadow-primary/20 lg:hidden"
          >
            Show {totalResults} Salon{totalResults === 1 ? "" : "s"}
          </button>
        )}
      </div>
    </aside>
  );
}
