import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { 
  Scissors, 
  Sparkles, 
  Crown, 
  Heart, 
  Clock, 
  ArrowRight, 
  Info, 
  Check, 
  Star, 
  Home, 
  ShieldCheck, 
  Layers, 
  ChevronRight,
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Sparkle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { db } from "@/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";

export interface ServiceItem {
  id?: string;
  name: string;
  price: string;
  rawPrice?: number;
  desc: string;
  duration?: string;
  popular?: boolean;
  atHomeAvailable?: boolean;
  image?: string;
  altText?: string;
  categoryTitle?: string;
  categoryId?: string;
  categoryImage?: string;
}

export interface ServiceCategory {
  id: string;
  title: string;
  tagline: string;
  description: string;
  image: string;
  altText: string;
  accentColor: string;
  badge: string;
  startingPrice: string;
  items: ServiceItem[];
}

export const CURATED_SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    id: "styling-cuts",
    title: "Haircuts & Styling",
    tagline: "Expert Haircuts & Modern Hair Styling",
    description: "Custom haircuts, beard shaping, and blowouts tailored for your face shape and personal look.",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1200",
    altText: "Master hair stylist performing precision haircut, sectioning hair with professional shears in a luxury salon environment",
    accentColor: "from-amber-500/20 via-primary/10 to-transparent",
    badge: "Popular Choice",
    startingPrice: "from ₹800",
    items: [
      {
        name: "Expert Haircut & Blowdry",
        price: "₹1,500",
        rawPrice: 1500,
        desc: "Precision haircut, deep hair wash with premium shampoo, scalp massage, and professional blowout.",
        duration: "45 mins",
        popular: true,
        atHomeAvailable: true,
      },
      {
        name: "Men's Beard & Hair Grooming",
        price: "₹1,000",
        rawPrice: 1000,
        desc: "Haircut, beard shaping, hot towel facial massage, and hair setting balm.",
        duration: "35 mins",
        popular: false,
        atHomeAvailable: true,
      },
      {
        name: "Traditional Ayurvedic Champi",
        price: "₹800",
        rawPrice: 800,
        desc: "Relaxing head massage with warm herbal oils to relieve stress and strengthen hair roots.",
        duration: "30 mins",
        popular: true,
        atHomeAvailable: true,
      },
      {
        name: "Special Event Blowdry & Styling",
        price: "₹1,200",
        rawPrice: 1200,
        desc: "Smooth or bouncy blowdry styling with heat protection for a long-lasting shiny finish.",
        duration: "40 mins",
        popular: false,
        atHomeAvailable: false,
      }
    ]
  },
  {
    id: "bridal-special",
    title: "Bridal & Special Occasions",
    tagline: "Complete Wedding & Party Makeup Packages",
    description: "Bridal makeup, designer mehendi, and saree draping for weddings, receptions, and special functions.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200",
    altText: "Indian bride wearing intricate gold kundan jewelry, designer bridal mehendi, and radiant wedding makeup",
    accentColor: "from-amber-600/25 via-primary/15 to-transparent",
    badge: "Wedding Special",
    startingPrice: "from ₹1,200",
    items: [
      {
        name: "Bridal HD Makeup & Hairstyling",
        price: "₹15,000",
        rawPrice: 15000,
        desc: "HD camera-ready bridal makeup, hairstyling, dupatta draping, and jewelry setting.",
        duration: "180 mins",
        popular: true,
        atHomeAvailable: true,
      },
      {
        name: "Designer Bridal Mehendi",
        price: "₹5,000",
        rawPrice: 5000,
        desc: "Beautiful Rajasthani or Arabic mehendi designs for hands and feet with dark stain natural henna.",
        duration: "120 mins",
        popular: true,
        atHomeAvailable: true,
      },
      {
        name: "Saree & Dupatta Draping",
        price: "₹1,200",
        rawPrice: 1200,
        desc: "Neat draping in classic, Gujarati, South Indian, or modern party styles.",
        duration: "30 mins",
        popular: false,
        atHomeAvailable: true,
      },
      {
        name: "Pre-Bridal Glow Package",
        price: "₹9,500",
        rawPrice: 9500,
        desc: "Full body polish, gold facial, body waxing, manicure, and pedicure for wedding preparation.",
        duration: "150 mins",
        popular: false,
        atHomeAvailable: true,
      }
    ]
  },
  {
    id: "treatments-color",
    title: "Hair Treatments & Highlights",
    tagline: "Keratin, Balayage & Hair Care",
    description: "Ammonia-free hair coloring, balayage highlights, and smooth keratin treatments for soft, shiny hair.",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200",
    altText: "Professional salon colorist applying balayage highlights and glossing treatment with fine brush technique",
    accentColor: "from-purple-600/20 via-primary/10 to-transparent",
    badge: "Hair Experts",
    startingPrice: "from ₹2,800",
    items: [
      {
        name: "Keratin Smooth Hair Treatment",
        price: "₹8,000",
        rawPrice: 8000,
        desc: "Frizz-control keratin treatment for smooth, manageable hair that stays straight and shiny up to 5 months.",
        duration: "120 mins",
        popular: true,
        atHomeAvailable: true,
      },
      {
        name: "Balayage Hair Highlights",
        price: "₹5,500",
        rawPrice: 5500,
        desc: "Natural-looking dimensional highlights and gloss customized for Indian hair tones.",
        duration: "150 mins",
        popular: true,
        atHomeAvailable: false,
      },
      {
        name: "Ammonia-Free Global Hair Color",
        price: "₹4,500",
        rawPrice: 4500,
        desc: "100% grey coverage with nourishing hair color that leaves hair soft and healthy.",
        duration: "90 mins",
        popular: false,
        atHomeAvailable: true,
      },
      {
        name: "Deep Conditioning Repair Mask",
        price: "₹2,800",
        rawPrice: 2800,
        desc: "Deep moisture treatment to repair dry, damaged, or color-treated hair in 1 session.",
        duration: "45 mins",
        popular: false,
        atHomeAvailable: true,
      }
    ]
  },
  {
    id: "spa-wellness",
    title: "Facials & Spa Care",
    tagline: "Relaxing Facials & Skin Care",
    description: "24K Gold facials, hydrating herbal treatments, and neck massage for fresh, glowing skin.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200",
    altText: "Serene luxury spa treatment room with essential botanical oils, warm candlelight, and rejuvenating skincare therapy",
    accentColor: "from-emerald-600/20 via-primary/10 to-transparent",
    badge: "Skin Care",
    startingPrice: "from ₹1,800",
    items: [
      {
        name: "24K Gold Instant Glow Facial",
        price: "₹4,500",
        rawPrice: 4500,
        desc: "Real 24K gold facial massage and hydra-serum for immediate wedding or party glow.",
        duration: "75 mins",
        popular: true,
        atHomeAvailable: true,
      },
      {
        name: "Deep Hydration & Cleaning Facial",
        price: "₹2,500",
        rawPrice: 2500,
        desc: "Blackhead removal, Vitamin C glow mask, and deep skin moisturization.",
        duration: "60 mins",
        popular: true,
        atHomeAvailable: true,
      },
      {
        name: "Kumkumadi Saffron Glow Facial",
        price: "₹3,500",
        rawPrice: 3500,
        desc: "Pure Kashmiri saffron oil facial massage to clear tan and brighten skin tone.",
        duration: "60 mins",
        popular: false,
        atHomeAvailable: true,
      },
      {
        name: "Head, Neck & Shoulder Massage",
        price: "₹1,800",
        rawPrice: 1800,
        desc: "Stress-relieving pressure point massage with sandalwood oil.",
        duration: "45 mins",
        popular: false,
        atHomeAvailable: true,
      }
    ]
  }
];

const POPULAR_SEARCH_PRESETS = [
  "Keratin Smoothing",
  "Balayage",
  "Bridal Makeup",
  "Ayurvedic Champi",
  "24K Gold Facial",
  "Mehndi"
];

interface ServicesSectionProps {
  showTitle?: boolean;
  compact?: boolean;
  filterId?: string;
}

export default function ServicesSection({ 
  showTitle = true, 
  compact = false,
  filterId 
}: ServicesSectionProps) {
  const [categories, setCategories] = useState<ServiceCategory[]>(CURATED_SERVICE_CATEGORIES);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [imageLoadedState, setImageLoadedState] = useState<Record<string, boolean>>({});

  // Synchronize Firestore services if available
  useEffect(() => {
    const loadDynamicServices = async () => {
      try {
        const q = query(collection(db, "services"), orderBy("name", "asc"));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const fetchedItems = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
          
          setCategories(prevCategories => {
            return prevCategories.map(cat => {
              const matched = fetchedItems.filter(item => 
                (item.category && item.category.toLowerCase().includes(cat.id.split("-")[0])) ||
                (item.name && cat.items.some(ci => ci.name.toLowerCase() === item.name.toLowerCase()))
              );
              if (matched.length > 0) {
                const combinedItems = [
                  ...matched.map(m => ({
                    id: m.id,
                    name: m.name,
                    price: m.price ? (typeof m.price === 'number' ? `₹${m.price.toLocaleString()}` : m.price) : "₹1,500",
                    rawPrice: typeof m.price === 'number' ? m.price : 1500,
                    desc: m.description || m.desc || "Bespoke luxury grooming service.",
                    duration: m.duration || "45 mins",
                    popular: m.popular || false,
                    atHomeAvailable: m.serviceType === 'home' || true
                  })),
                  ...cat.items.filter(ci => !matched.some(m => m.name === ci.name))
                ];
                return { ...cat, items: combinedItems };
              }
              return cat;
            });
          });
        }
      } catch (e) {
        // Graceful fallback
      }
    };

    loadDynamicServices();
  }, []);

  // Compute all services with category associations
  const allServicesWithCategory = useMemo(() => {
    const list: ServiceItem[] = [];
    categories.forEach(cat => {
      cat.items.forEach(item => {
        list.push({
          ...item,
          categoryTitle: cat.title,
          categoryId: cat.id,
          categoryImage: cat.image,
          altText: cat.altText
        });
      });
    });
    return list;
  }, [categories]);

  // Filtered services based on search query and category filter
  const filteredServices = useMemo(() => {
    let result = allServicesWithCategory;

    // Filter by category if a specific category is selected
    if (selectedCategoryId !== "all") {
      result = result.filter(item => item.categoryId === selectedCategoryId);
    }

    // Filter by search query across name, description, and category title
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        (item.categoryTitle && item.categoryTitle.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allServicesWithCategory, selectedCategoryId, searchQuery]);

  const activeCategory = useMemo(() => {
    if (selectedCategoryId === "all") {
      return categories[0];
    }
    return categories.find(c => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  const handleImageLoad = (catId: string) => {
    setImageLoadedState(prev => ({ ...prev, [catId]: true }));
  };

  const isSearchActive = searchQuery.trim().length > 0;

  return (
    <TooltipProvider>
      <section className="w-full relative">
        {showTitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
              Hair, Beauty & Grooming Services
            </span>
            <h2 className="text-4xl font-light tracking-tight md:text-6xl text-foreground">
              POPULAR <span className="italic font-serif text-primary">SALON SERVICES</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Choose from top hair cuts, beard grooming, bridal makeup, hair treatments, and facials. Search any service or filter by category.
            </p>
          </motion.div>
        )}

        {/* Clean Luxury Search Bar & Filter Controls */}
        <div className="max-w-3xl mx-auto mb-10 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beauty services by name or category (e.g. Balayage, Bridal, Keratin, Facial)..."
              className="pl-11 pr-10 h-13 bg-card border-border/80 rounded-full focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary text-sm shadow-lg placeholder:text-muted-foreground/70"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-white/10 transition-colors"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Quick Preset Search Chips */}
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1 mr-1">
              <Sparkles className="h-3 w-3 text-amber-400" /> Popular:
            </span>
            {POPULAR_SEARCH_PRESETS.map((preset) => {
              const isCurrent = searchQuery.toLowerCase() === preset.toLowerCase();
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSearchQuery(isCurrent ? "" : preset)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs transition-all border select-none",
                    isCurrent
                      ? "bg-primary text-black font-bold border-primary shadow-sm"
                      : "bg-card/60 border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  )}
                >
                  {preset}
                </button>
              );
            })}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategoryId("all");
                }}
                className="text-[10px] text-primary hover:underline uppercase tracking-wider ml-1 font-semibold flex items-center gap-1"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            type="button"
            onClick={() => setSelectedCategoryId("all")}
            className={cn(
              "px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border select-none",
              selectedCategoryId === "all"
                ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 font-bold scale-[1.02]"
                : "bg-card/80 border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-white/5"
            )}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Categories ({allServicesWithCategory.length})</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 border select-none",
                  isSelected
                    ? "bg-primary text-black border-primary shadow-lg shadow-primary/20 font-bold scale-[1.02]"
                    : "bg-card/80 border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-white/5"
                )}
              >
                {cat.id === "styling-cuts" && <Scissors className="h-3.5 w-3.5" />}
                {cat.id === "bridal-special" && <Crown className="h-3.5 w-3.5" />}
                {cat.id === "treatments-color" && <Sparkles className="h-3.5 w-3.5" />}
                {cat.id === "spa-wellness" && <Heart className="h-3.5 w-3.5" />}
                <span>{cat.title}</span>
              </button>
            );
          })}
        </div>

        {/* Search Results Summary Banner */}
        {isSearchActive && (
          <div className="max-w-4xl mx-auto mb-8 px-4 py-3 rounded-2xl bg-card border border-primary/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Search className="h-3.5 w-3.5 text-primary" />
              <span>
                Found <strong className="text-foreground">{filteredServices.length}</strong> rituals matching <strong className="text-primary font-semibold">"{searchQuery}"</strong>
                {selectedCategoryId !== "all" && <span> in {activeCategory.title}</span>}
              </span>
            </div>
            <button
              onClick={() => setSearchQuery("")}
              className="text-[11px] uppercase tracking-wider text-primary hover:underline font-bold"
            >
              Clear Filter
            </button>
          </div>
        )}

        {/* Zero Match Search State */}
        {filteredServices.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-12 text-center rounded-3xl bg-card border border-border max-w-xl mx-auto space-y-6 shadow-2xl"
          >
            <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Search className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-xl font-light tracking-tight text-foreground">No Beauty Rituals Found</h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                We couldn't find any treatments matching <strong className="text-primary">"{searchQuery}"</strong>. Try checking our most popular luxury services:
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {POPULAR_SEARCH_PRESETS.map((preset) => (
                <Button
                  key={preset}
                  size="sm"
                  variant="outline"
                  onClick={() => setSearchQuery(preset)}
                  className="border-border bg-background hover:border-primary/50 text-xs rounded-full gap-1.5"
                >
                  <Sparkles className="h-3 w-3 text-amber-400" />
                  {preset}
                </Button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategoryId("all");
                }}
                className="rounded-full text-xs uppercase tracking-widest border-border"
              >
                Reset All Filters
              </Button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* View Mode: If a single category is selected (and not searching across all), show the Hero + Menu layout; Otherwise show the Unified Search Grid */}
            {selectedCategoryId !== "all" && !isSearchActive ? (
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeCategory.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.35 }}
                  className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch"
                >
                  {/* Visual Hero Showcase Column (5 Cols) */}
                  <div className="lg:col-span-5 flex flex-col">
                    <div className="relative rounded-3xl overflow-hidden border border-border/80 bg-card shadow-2xl h-full flex flex-col group min-h-[440px]">
                      
                      {/* High-Quality Editorial Imagery */}
                      <div className="relative h-72 sm:h-80 w-full overflow-hidden bg-zinc-950">
                        {!imageLoadedState[activeCategory.id] && (
                          <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
                            <Sparkles className="h-8 w-8 text-primary/40 animate-spin" />
                          </div>
                        )}
                        <img
                          src={activeCategory.image}
                          alt={activeCategory.altText}
                          onLoad={() => handleImageLoad(activeCategory.id)}
                          className={cn(
                            "h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105",
                            imageLoadedState[activeCategory.id] ? "opacity-100" : "opacity-0"
                          )}
                          loading="lazy"
                        />
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />

                        {/* Top Floating Badges */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
                          <Badge className="bg-black/80 backdrop-blur-md border border-primary/40 text-primary font-bold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg">
                            {activeCategory.badge}
                          </Badge>
                          <Badge className="bg-primary/95 text-black font-extrabold uppercase tracking-widest text-[10px] px-3 py-1 shadow-lg">
                            {activeCategory.startingPrice}
                          </Badge>
                        </div>

                        {/* Bottom Image Tagline */}
                        <div className="absolute bottom-4 left-4 right-4">
                          <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-primary/90 block mb-1">
                            {activeCategory.tagline}
                          </span>
                          <h3 className="text-2xl font-light tracking-tight text-white font-serif">
                            {activeCategory.title}
                          </h3>
                        </div>
                      </div>

                      {/* Editorial Description & Booking CTA */}
                      <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between bg-gradient-to-b from-card to-background">
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-6">
                          {activeCategory.description}
                        </p>

                        <div className="space-y-4 pt-4 border-t border-border/60">
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                              <ShieldCheck className="h-4 w-4 text-emerald-400" />
                              Sterilized Salon Equipment
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Home className="h-4 w-4 text-amber-400" />
                              Doorstep Delivery Available
                            </span>
                          </div>

                          <Button asChild className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase text-xs tracking-widest h-12 shadow-lg shadow-primary/10 gap-2">
                            <Link to={`/book?category=${encodeURIComponent(activeCategory.title)}`}>
                              Book in {activeCategory.title}
                              <ArrowRight className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Service Offerings Menu Column (7 Cols) */}
                  <div className="lg:col-span-7 flex flex-col justify-between">
                    <div className="grid grid-cols-1 gap-4">
                      {activeCategory.items.map((service, idx) => (
                        <motion.div
                          key={service.name}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.06 }}
                          className="p-5 sm:p-6 rounded-2xl border border-border/80 bg-card/60 hover:border-primary/50 hover:bg-card transition-all duration-300 group shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden"
                        >
                          <div className="space-y-2 min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="text-base font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors">
                                {service.name}
                              </h4>
                              {service.popular && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] uppercase tracking-wider font-bold px-2 py-0.5">
                                  <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 mr-1" />
                                  Guest Favorite
                                </Badge>
                              )}
                              {service.atHomeAvailable && (
                                <Badge variant="outline" className="border-border text-muted-foreground text-[9px] uppercase tracking-wider px-2 py-0.5">
                                  Salon & Home
                                </Badge>
                              )}
                            </div>

                            <p className="text-xs text-muted-foreground leading-relaxed pr-2">
                              {service.desc}
                            </p>

                            <div className="flex items-center gap-4 text-[11px] text-muted-foreground/80 pt-1">
                              {service.duration && (
                                <span className="flex items-center gap-1 font-mono">
                                  <Clock className="h-3 w-3 text-primary" />
                                  {service.duration}
                                </span>
                              )}
                              <span className="text-zinc-600">•</span>
                              <span className="text-emerald-400/90 font-medium flex items-center gap-1">
                                <Check className="h-3 w-3" />
                                Consultation Included
                              </span>
                            </div>
                          </div>

                          <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/50">
                            <div className="text-right">
                              <span className="text-lg font-serif font-bold text-primary block leading-none">
                                {service.price}
                              </span>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                                Standard Rate
                              </span>
                            </div>

                            <Button
                              asChild
                              size="sm"
                              className="bg-primary/10 hover:bg-primary text-primary hover:text-black border border-primary/30 font-bold uppercase text-[10px] tracking-widest px-4 h-9 transition-all"
                            >
                              <Link to={`/book?service=${encodeURIComponent(service.name)}`}>
                                Reserve Slot
                              </Link>
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>

                    {/* Bundle Link Box */}
                    <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-card via-background to-card border border-border/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-3 text-xs">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                          <Sparkles className="h-4 w-4" />
                        </div>
                        <div>
                          <span className="font-bold text-foreground block">Looking for a custom combination?</span>
                          <span className="text-muted-foreground text-[11px]">Bundle multiple rituals to save up to 25% with Aurelia Luxe Curated Bundles.</span>
                        </div>
                      </div>

                      <Button asChild variant="outline" size="sm" className="border-border bg-background hover:bg-white/5 text-xs font-semibold uppercase tracking-wider shrink-0 gap-1.5">
                        <Link to="/bundles">
                          View Bundles <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            ) : (
              /* Unified Multi-Column Grid for Search Results and All Categories */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredServices.map((service, idx) => (
                  <motion.div
                    key={`${service.name}-${idx}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04 }}
                    className="p-6 rounded-3xl border border-border/80 bg-card hover:border-primary/50 transition-all duration-300 group shadow-lg flex flex-col justify-between relative overflow-hidden"
                  >
                    <div>
                      {/* Category Header Badge */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-[9px] uppercase tracking-wider font-semibold">
                          {service.categoryTitle}
                        </Badge>
                        {service.popular && (
                          <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] uppercase tracking-wider font-bold">
                            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400 mr-1" />
                            Favorite
                          </Badge>
                        )}
                      </div>

                      <h4 className="text-lg font-light tracking-tight text-foreground group-hover:text-primary transition-colors">
                        {service.name}
                      </h4>

                      <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                        {service.desc}
                      </p>
                    </div>

                    <div className="pt-5 mt-5 border-t border-border/60">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
                          {service.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-primary" />
                              {service.duration}
                            </span>
                          )}
                        </div>
                        <span className="text-xl font-serif font-bold text-primary">
                          {service.price}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {service.categoryId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedCategoryId(service.categoryId || "all");
                              setSearchQuery("");
                            }}
                            className="border-border bg-background hover:bg-white/5 text-[10px] uppercase font-bold tracking-wider h-10"
                          >
                            Category
                          </Button>
                        )}
                        <Button
                          asChild
                          size="sm"
                          className={cn(
                            "bg-primary text-black hover:bg-primary/90 text-[10px] uppercase font-bold tracking-wider h-10 shadow-md",
                            !service.categoryId && "col-span-2"
                          )}
                        >
                          <Link to={`/book?service=${encodeURIComponent(service.name)}`}>
                            Reserve Slot
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Gallery Preview of All Categories in Grid */}
        <div className="mt-20 pt-16 border-t border-border/60">
          <div className="text-center mb-10">
            <span className="text-xs font-semibold uppercase tracking-[0.4em] text-primary block mb-2">
              Visual Catalog
            </span>
            <h3 className="text-2xl font-light text-foreground uppercase tracking-tight">
              EXPLORE ALL <span className="italic font-serif text-primary">CATEGORIES</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSearchQuery("");
                }}
                className={cn(
                  "cursor-pointer rounded-2xl overflow-hidden border transition-all duration-500 group relative bg-card shadow-lg flex flex-col",
                  selectedCategoryId === cat.id && !isSearchActive
                    ? "border-primary ring-2 ring-primary/30 shadow-primary/10 scale-[1.02]" 
                    : "border-border/80 hover:border-primary/50 hover:shadow-xl"
                )}
              >
                {/* Imagery with Alt text */}
                <div className="relative h-48 w-full overflow-hidden bg-zinc-900">
                  <img
                    src={cat.image}
                    alt={cat.altText}
                    className="h-full w-full object-cover object-center group-hover:scale-110 transition-transform duration-700"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                  
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-black/80 backdrop-blur-sm border-primary/40 text-primary text-[9px] uppercase tracking-wider font-bold">
                      {cat.items.length} Treatments
                    </Badge>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-primary transition-colors">
                      {cat.title}
                    </h4>
                    <span className="text-[10px] text-primary font-serif font-bold">
                      {cat.startingPrice}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {cat.tagline}
                  </p>
                  
                  <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold">
                    <span className={cn(selectedCategoryId === cat.id && !isSearchActive ? "text-primary" : "text-muted-foreground")}>
                      {selectedCategoryId === cat.id && !isSearchActive ? "Currently Viewing" : "Explore Category"}
                    </span>
                    <ArrowRight className="h-3 w-3 text-primary group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </section>
    </TooltipProvider>
  );
}
