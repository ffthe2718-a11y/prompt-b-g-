import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Globe, Scissors, Star, ShieldCheck, MapPin, Navigation, Crosshair, Loader2, Search, Filter, SlidersHorizontal, X, Sparkles, RefreshCw, Clock, History, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistance, cn } from "@/lib/utils";
import { toast } from "sonner";
import { CURATED_SHOPS, CuratedShop } from "@/data/curatedShops";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  coverImage?: string;
  location?: string;
  latitude?: number;
  longitude?: number;
  rating?: number;
  ratingCount?: number;
  isVerified?: boolean;
  priceRange?: string;
  content?: {
    services?: { name: string; price: string; description?: string }[];
  };
  theme?: {
    primaryColor?: string;
  };
}

type SortOption = "newest" | "rating" | "proximity";

// Transform curated shops into full mock salon marketplace items
const MOCK_SALON_SHOPS: Shop[] = CURATED_SHOPS.map((c, index) => ({
  id: c.id,
  name: c.name,
  slug: c.slug,
  location: c.location,
  description: c.description,
  logo: c.logo,
  coverImage: c.coverImage,
  isVerified: c.isVerified,
  rating: c.rating,
  ratingCount: c.ratingCount,
  priceRange: c.priceRange,
  latitude: 19.0596 + index * 0.015, // Realistic Mumbai coordinates
  longitude: 72.8295 + index * 0.012,
  content: {
    services: c.services || [
      { name: "Couture Haircut & Styling", price: "₹1,500", description: "Bespoke consultation & master finish" },
      { name: "Ayurvedic Herbal Scalp Spa", price: "₹950", description: "Infused botanical oils & head massage" },
      { name: "Luxury Glow Treatment", price: "₹2,800", description: "Deep hydration and radiant skin therapy" }
    ]
  },
  theme: {
    primaryColor: "#D4AF37"
  }
}));

const RECENT_SEARCHES_KEY = "aurelia_marketplace_recent_searches";
const MAX_RECENT_SEARCHES = 3;

export default function Marketplace() {
  const [shops, setShops] = useState<Shop[]>(MOCK_SALON_SHOPS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const { getLocation, coords, loading: detecting, error: detectError } = useLocation();

  // Load recent searches from localStorage on mount (max 3)
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => typeof item === "string" && item.trim().length > 0).slice(0, MAX_RECENT_SEARCHES);
        }
      }
    } catch (e) {
      console.warn("Could not load recent searches from localStorage:", e);
    }
    return [];
  });

  const saveSearchQuery = (queryToSave: string) => {
    const trimmed = queryToSave.trim();
    if (!trimmed || trimmed.length < 2) return;

    setRecentSearches(prev => {
      // Remove any case-insensitive duplicates and prepend the new query (max 3)
      const filtered = prev.filter(q => q.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save recent searches to localStorage:", e);
      }
      return updated;
    });
  };

  const removeRecentSearch = (queryToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(q => q.toLowerCase() !== queryToRemove.toLowerCase());
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      toast.success("Recent searches cleared");
    } catch (e) {}
  };

  const applyRecentSearch = (term: string) => {
    setSearchQuery(term);
    saveSearchQuery(term);
    toast.success(`Search filter applied: "${term}"`);
  };

  // Debounced auto-save when user finishes typing a query
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      const handler = setTimeout(() => {
        saveSearchQuery(searchQuery);
      }, 1200);
      return () => clearTimeout(handler);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (detectError) {
      toast.error(detectError);
      if (sortBy === "proximity") setSortBy("newest");
    }
  }, [detectError]);

  useEffect(() => {
    if (coords && sortBy === "proximity") {
      toast.success("Location updated! Sorting by proximity.");
    }
  }, [coords]);

  const filteredAndSortedShops = useMemo(() => {
    let result = [...shops];

    // 1. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const filtered = result.filter(shop => 
        shop.name.toLowerCase().includes(q) || 
        shop.description.toLowerCase().includes(q) ||
        (shop.location && shop.location.toLowerCase().includes(q)) ||
        shop.content?.services?.some(s => s.name.toLowerCase().includes(q))
      );
      if (filtered.length > 0) {
        result = filtered;
      }
    }

    // 2. Service Filter
    if (selectedService) {
      const filtered = result.filter(shop => 
        shop.content?.services?.some(s => s.name.toLowerCase().includes(selectedService.toLowerCase()))
      );
      if (filtered.length > 0) {
        result = filtered;
      }
    }

    // 3. Proximity Calculation & Sort
    const shopsWithDistance = result.map(shop => {
      const distance = (shop.latitude && shop.longitude && coords) 
        ? calculateDistance(coords.latitude, coords.longitude, shop.latitude, shop.longitude)
        : undefined;
      return { ...shop, distance };
    });

    if (sortBy === "proximity" && coords) {
      shopsWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    } else if (sortBy === "rating") {
      shopsWithDistance.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return shopsWithDistance;
  }, [shops, searchQuery, selectedService, sortBy, coords]);

  // Extract all unique services for filters
  const availableServices = useMemo(() => {
    const services = new Set<string>();
    shops.forEach(shop => {
      shop.content?.services?.forEach(s => {
        const name = s.name.toLowerCase();
        if (name.includes("hair") || name.includes("cut")) services.add("Haircut & Style");
        else if (name.includes("beard") || name.includes("shave")) services.add("Shave & Beard");
        else if (name.includes("massage") || name.includes("champi")) services.add("Massage & Champi");
        else if (name.includes("facial") || name.includes("skin") || name.includes("glow")) services.add("Facial & Skincare");
        else if (name.includes("bridal") || name.includes("mehndi")) services.add("Bridal & Couture");
        else services.add(s.name);
      });
    });
    return Array.from(services).slice(0, 8);
  }, [shops]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const q = query(
          collection(db, "shops"), 
          where("status", "==", "published"),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const firestoreDocs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Shop[];

        // Combine firestore shops with curated mock salon ateliers
        const existingSlugs = new Set(firestoreDocs.map(s => s.slug));
        const combined = [
          ...firestoreDocs,
          ...MOCK_SALON_SHOPS.filter(c => !existingSlugs.has(c.slug))
        ];
        setShops(combined.length > 0 ? combined : MOCK_SALON_SHOPS);
      } catch (error) {
        console.warn("Firestore shops query note, using curated mock salons:", error);
        setShops(MOCK_SALON_SHOPS);
      } finally {
        setLoading(false);
      }
    };

    fetchShops();
  }, []);

  const handleSortChange = (value: string) => {
    if (value === "proximity") {
      if (!coords) {
        getLocation();
      }
    }
    setSortBy(value as SortOption);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-primary tracking-[0.5em] uppercase text-xs font-bold">Discovering Shops...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
            Independent Creators
          </span>
          <h1 className="text-5xl font-light tracking-tight md:text-7xl mb-6">
            DISCOVER <span className="italic text-primary">UNIQUE</span> SHOPS
          </h1>
          <p className="max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            Support local barbers and stylists by visiting their independent landing pages. 
            Each shop is unique, offering a personal touch to your grooming journey.
          </p>

          <div className="mt-12 max-w-4xl mx-auto space-y-6">
            {/* Search and Sort */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-primary transition-colors" />
                <Input 
                  placeholder="Search by name, service or style..." 
                  className="pl-12 h-14 bg-card border-zinc-800 rounded-full focus:ring-1 focus:ring-primary/20 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchQuery.trim()) {
                      saveSearchQuery(searchQuery);
                    }
                  }}
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="h-14 px-8 rounded-full border-zinc-800 bg-card hover:bg-zinc-900 group shrink-0">
                    <SlidersHorizontal className="h-4 w-4 mr-2 text-zinc-500 group-hover:text-primary" />
                    <span className="uppercase text-[10px] tracking-widest font-bold">
                      Sort By: {sortBy === "newest" ? "Newest" : sortBy === "rating" ? "Top Rated" : "Distance"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-zinc-950 border-zinc-800 text-white w-48">
                  <DropdownMenuRadioGroup value={sortBy} onValueChange={handleSortChange}>
                    <DropdownMenuRadioItem value="newest" className="text-xs uppercase tracking-widest focus:bg-primary focus:text-black">Newest Arrivals</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="rating" className="text-xs uppercase tracking-widest focus:bg-primary focus:text-black">Highest Rated</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="proximity" className="text-xs uppercase tracking-widest focus:bg-primary focus:text-black flex items-center justify-between gap-2">
                      Nearby Me {detecting && <Loader2 className="h-3 w-3 animate-spin" />}
                    </DropdownMenuRadioItem>
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Recent Searches Bar (Max 3 queries saved in localStorage) */}
            {recentSearches.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-wrap items-center justify-center gap-2 py-1"
              >
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-1">
                  <Clock className="h-3.5 w-3.5 text-primary animate-pulse" />
                  <span className="uppercase text-[10px] tracking-widest font-semibold text-zinc-400">Recent Searches:</span>
                </div>

                {recentSearches.map((term) => {
                  const isCurrent = searchQuery.toLowerCase().trim() === term.toLowerCase().trim();
                  return (
                    <div
                      key={term}
                      onClick={() => applyRecentSearch(term)}
                      className={cn(
                        "group/chip inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs cursor-pointer transition-all duration-200 border select-none",
                        isCurrent
                          ? "bg-primary/20 border-primary text-primary font-bold shadow-sm ring-1 ring-primary/30"
                          : "bg-card/90 border-zinc-800 text-zinc-300 hover:text-white hover:border-primary/40 hover:bg-zinc-900"
                      )}
                    >
                      <History className="h-3 w-3 text-muted-foreground group-hover/chip:text-primary transition-colors" />
                      <span className="truncate max-w-[140px]">{term}</span>
                      <button
                        type="button"
                        title={`Remove "${term}" from history`}
                        onClick={(e) => removeRecentSearch(term, e)}
                        className="text-muted-foreground hover:text-red-400 p-0.5 rounded-full hover:bg-white/10 transition-colors ml-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}

                <button
                  type="button"
                  onClick={clearAllRecentSearches}
                  className="text-[10px] uppercase tracking-wider text-muted-foreground/70 hover:text-primary transition-colors ml-1.5 underline decoration-dotted"
                >
                  Clear All
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2 py-1 text-xs text-muted-foreground">
                <span className="uppercase text-[10px] tracking-widest text-zinc-500 font-semibold flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-400" /> Popular:
                </span>
                {["Balayage", "Bridal Couture", "Ayurvedic Champi"].map((popularTerm) => (
                  <button
                    key={popularTerm}
                    type="button"
                    onClick={() => applyRecentSearch(popularTerm)}
                    className="text-xs text-zinc-400 hover:text-primary hover:underline px-1.5 py-0.5"
                  >
                    {popularTerm}
                  </button>
                ))}
              </div>
            )}

            {/* Service Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button 
                variant={selectedService === null ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedService(null)}
                className={cn(
                  "rounded-full text-[10px] uppercase tracking-widest font-bold h-8 px-4 border-zinc-800",
                  selectedService === null ? "bg-primary text-black" : "bg-card text-zinc-400 hover:text-white"
                )}
              >
                All Shops
              </Button>
              {availableServices.map((service) => (
                <Button 
                  key={service}
                  variant={selectedService === service ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedService(service)}
                  className={cn(
                    "rounded-full text-[10px] uppercase tracking-widest font-bold h-8 px-4 border-zinc-800",
                    selectedService === service ? "bg-primary text-black" : "bg-card text-zinc-400 hover:text-white"
                  )}
                >
                  {service}
                </Button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Shop Cards Display */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredAndSortedShops.map((shop, i) => (
              <motion.div
                key={shop.id || shop.slug}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ 
                  duration: 0.35, 
                  delay: i * 0.05,
                  layout: { type: "spring", stiffness: 300, damping: 30 }
                }}
              >
              <Card className="bg-card border-border hover:border-primary/50 transition-all group h-full flex flex-col relative overflow-hidden shadow-lg hover:shadow-primary/5">
                {/* Cover Image / Banner */}
                <div className="h-40 w-full relative overflow-hidden bg-zinc-900">
                  <img 
                    src={shop.coverImage || shop.logo || "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800"} 
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                  
                  <div className="absolute top-3 right-3 flex items-center gap-1.5">
                    {shop.isVerified && (
                      <Badge variant="outline" className="border-emerald-500/40 bg-emerald-950/80 text-emerald-400 uppercase text-[8px] tracking-[0.2em] px-2 h-5 backdrop-blur-sm">
                        <ShieldCheck className="h-2.5 w-2.5 mr-1" /> VERIFIED
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-primary/40 bg-black/80 text-primary uppercase text-[8px] tracking-[0.2em] px-2 h-5 backdrop-blur-sm">
                      MOCK WEBSITE
                    </Badge>
                  </div>

                  {shop.location && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1 text-[11px] text-zinc-300 bg-black/70 px-2 py-0.5 rounded backdrop-blur-sm">
                      <MapPin className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate max-w-[200px]">{shop.location}</span>
                    </div>
                  )}
                </div>

                <CardHeader className="pt-4">
                  <div className="flex justify-between items-start gap-3">
                    <div className="h-12 w-12 rounded-xl border border-zinc-700 bg-background flex items-center justify-center overflow-hidden shrink-0 shadow-md -mt-8 relative z-10">
                      {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="h-full w-full object-cover" />
                      ) : (
                        <Scissors className="h-6 w-6 text-primary" />
                      )}
                    </div>
                    
                    {(shop as any).distance !== undefined && (shop as any).distance !== Infinity && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 rounded-full flex items-center gap-1.5 px-2.5 py-0.5">
                        <Navigation className="h-2.5 w-2.5" />
                        <span className="text-[9px] font-bold font-mono">{(shop as any).distance.toFixed(1)} KM</span>
                      </Badge>
                    )}
                  </div>

                  <CardTitle className="text-xl font-light tracking-tight group-hover:text-primary transition-colors flex items-center gap-2 text-left mt-2">
                    {shop.name}
                  </CardTitle>
                  
                  <div className="flex items-center gap-2 mt-1">
                     <div className="flex items-center gap-0.5">
                       {[...Array(5)].map((_, idx) => (
                         <Star 
                          key={idx} 
                          className={cn(
                            "h-3 w-3", 
                            idx < Math.floor(shop.rating || 4.9) ? "text-amber-400 fill-amber-400" : "text-zinc-800"
                          )} 
                         />
                       ))}
                     </div>
                     <span className="text-xs font-bold text-white">{shop.rating || 4.9}</span>
                     <span className="text-[10px] text-zinc-500 font-mono">({shop.ratingCount || 180}+ reviews)</span>
                  </div>

                  <CardDescription className="line-clamp-2 text-xs mt-2 text-zinc-400">
                    {shop.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-grow pt-0">
                  {shop.content?.services && shop.content.services.length > 0 && (
                    <div className="space-y-3 pt-3 border-t border-zinc-900">
                      <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-500">Curated Offerings</p>
                      <div className="space-y-2">
                        {shop.content.services.slice(0, 3).map((service, idx) => (
                          <div key={idx} className="flex justify-between items-center gap-3 group/service text-xs">
                            <span className="text-zinc-300 group-hover/service:text-primary transition-colors truncate">{service.name}</span>
                            <span className="font-mono text-primary font-bold shrink-0">{service.price}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="pt-4 border-t border-border grid grid-cols-2 gap-2">
                  <Button asChild variant="outline" className="w-full border-zinc-800 hover:border-primary/50 text-xs font-bold uppercase tracking-wider h-11">
                    <Link to={`/shop/${shop.slug}`}>
                      View Site <ArrowRight className="h-3.5 w-3.5 ml-1" />
                    </Link>
                  </Button>
                  <Button asChild className="w-full bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-wider h-11">
                    <Link to={`/book?shopId=${shop.id || shop.slug}&shopName=${encodeURIComponent(shop.name)}`}>
                      Book Slot
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

