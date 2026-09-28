import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Globe, Scissors, Star, ShieldCheck, MapPin, Navigation, Crosshair, Loader2, Search, Filter, SlidersHorizontal, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLocation } from "@/hooks/useLocation";
import { calculateDistance, cn } from "@/lib/utils";
import { toast } from "sonner";
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
  latitude?: number;
  longitude?: number;
  rating?: number;
  ratingCount?: number;
  isVerified?: boolean;
  content?: {
    services?: { name: string; price: string; description?: string }[];
  };
  theme?: {
    primaryColor?: string;
  };
}

type SortOption = "newest" | "rating" | "proximity";

export default function Marketplace() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const { getLocation, coords, loading: detecting, error: detectError } = useLocation();

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
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(shop => 
        shop.name.toLowerCase().includes(q) || 
        shop.description.toLowerCase().includes(q) ||
        shop.content?.services?.some(s => s.name.toLowerCase().includes(q))
      );
    }

    // 2. Service Filter
    if (selectedService) {
      result = result.filter(shop => 
        shop.content?.services?.some(s => s.name.toLowerCase().includes(selectedService.toLowerCase()))
      );
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
    // "newest" is handled by the initial fetch order or can be explicitly handled if needed

    return shopsWithDistance;
  }, [shops, searchQuery, selectedService, sortBy, coords]);

  // Extract all unique services for filters
  const availableServices = useMemo(() => {
    const services = new Set<string>();
    shops.forEach(shop => {
      shop.content?.services?.forEach(s => {
        // Simple normalization for categories (e.g. Haircut, Shave, Beard)
        const name = s.name.toLowerCase();
        if (name.includes("hair")) services.add("Haircut");
        else if (name.includes("beard") || name.includes("shave")) services.add("Shave & Beard");
        else if (name.includes("massage") || name.includes("champi")) services.add("Massage");
        else if (name.includes("facial") || name.includes("skin")) services.add("Skincare");
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
        const docs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Shop[];
        setShops(docs);
      } catch (error) {
        console.error("Error fetching shops:", error);
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

        {filteredAndSortedShops.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border rounded-lg">
            <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <p className="text-muted-foreground">No shops matching your search or filters.</p>
            <Button variant="link" className="text-primary mt-4" onClick={() => { setSearchQuery(""); setSelectedService(null); }}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredAndSortedShops.map((shop, i) => (
                <motion.div
                  key={shop.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ 
                    duration: 0.4, 
                    delay: i * 0.05,
                    layout: { type: "spring", stiffness: 300, damping: 30 }
                  }}
                >
                <Card className="bg-card border-border hover:border-primary/50 transition-all group h-full flex flex-col relative overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start mb-4">
                      <div className="h-12 w-12 rounded-full border border-border bg-background flex items-center justify-center overflow-hidden">
                        {shop.logo ? (
                          <img src={shop.logo} alt={shop.name} className="h-full w-full object-cover" />
                        ) : (
                          <Scissors className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex gap-1.5">
                          {shop.isVerified && (
                            <Badge variant="outline" className="border-blue-500/20 bg-blue-500/5 text-blue-500 uppercase text-[8px] tracking-[0.2em] px-2 h-5">
                              VERIFIED
                            </Badge>
                          )}
                          <Badge variant="outline" className="border-primary/20 text-primary uppercase text-[8px] tracking-[0.2em] px-2 h-5">
                            LIVE
                          </Badge>
                        </div>
                        
                        {(shop as any).distance !== undefined && (shop as any).distance !== Infinity && (
                          <Badge variant="secondary" className="bg-primary/10 text-primary border-none rounded-full flex items-center gap-1.5 px-3 py-1">
                            <MapPin className="h-2.5 w-2.5" />
                            <span className="text-[10px] font-bold">{(shop as any).distance.toFixed(1)} KM AWAY</span>
                          </Badge>
                        )}
                      </div>
                    </div>
                    <CardTitle className="text-2xl font-light tracking-tight group-hover:text-primary transition-colors flex items-center gap-2 text-left">
                      {shop.name}
                    </CardTitle>
                    <div className="flex items-center gap-1.5 mt-2">
                       {[...Array(5)].map((_, i) => (
                         <Star 
                          key={i} 
                          className={cn(
                            "h-3 w-3", 
                            i < (shop.rating || 4) ? "text-yellow-500 fill-yellow-500" : "text-zinc-800"
                          )} 
                         />
                       ))}
                       <span className="text-[10px] text-zinc-500">({shop.ratingCount || 12})</span>
                    </div>
                    <CardDescription className="line-clamp-2 text-xs mt-4">
                      {shop.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {shop.content?.services && shop.content.services.length > 0 && (
                      <div className="space-y-4 pt-4 border-t border-zinc-900/50">
                        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-500 mb-2">Signature Services</p>
                        <div className="space-y-3">
                          {shop.content.services.slice(0, 3).map((service, idx) => (
                            <div key={idx} className="flex justify-between items-start gap-4 group/service">
                              <div className="flex-1">
                                <p className="text-xs font-semibold group-hover/service:text-primary transition-colors">{service.name}</p>
                                {service.description && (
                                  <p className="text-[10px] text-muted-foreground line-clamp-1 italic mt-0.5">{service.description}</p>
                                )}
                              </div>
                              <span className="text-xs font-mono text-primary font-bold shrink-0">{service.price}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 flex items-center justify-between border-t border-zinc-900/50 mt-3 text-[11px] text-zinc-400">
                      <span className="flex items-center gap-1.5 text-zinc-400 text-[10px] uppercase tracking-wider font-semibold">
                        <Scissors className="h-3 w-3 text-primary" />
                        Master Stylists & Portfolios
                      </span>
                      <span className="text-primary font-mono font-bold text-[10px] uppercase">
                        View Bios →
                      </span>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-6 border-t border-border">
                    <Button asChild className="w-full bg-primary text-black hover:bg-primary/90 rounded-none uppercase text-xs font-bold tracking-widest gap-2 h-12">
                      <Link to={`/shop/${shop.slug}`}>
                        Enter Atelier <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              </motion.div>
            ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

