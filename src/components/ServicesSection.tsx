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
  ChevronLeft,
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
  Sparkle,
  MessageSquare,
  Award,
  ThumbsUp,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { db } from "@/firebase";
import { collection, onSnapshot, query, orderBy, getDocs } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { ServiceReviewItem, ServiceRatingAggregate } from "@/types/serviceReview";
import { DEFAULT_SERVICE_REVIEWS, calculateServiceRatings } from "@/data/mockServiceReviews";
import ServiceReviewModal from "@/components/ServiceReviewModal";
import ServiceReviewsListModal from "@/components/ServiceReviewsListModal";

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
    id: "hair-care",
    title: "Hair Care",
    tagline: "Expert Haircuts, Color, Balayage & Keratin Styling",
    description: "Custom haircuts, beard shaping, balayage highlights, and restorative keratin smoothing treatments.",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1200",
    altText: "Master hair stylist performing precision haircut and styling in luxury salon environment",
    accentColor: "from-amber-500/20 via-primary/10 to-transparent",
    badge: "Hair Expert",
    startingPrice: "from ₹1,000",
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
        name: "Balayage & Foil Highlights",
        price: "₹4,500",
        rawPrice: 4500,
        desc: "Hand-painted balayage highlights with custom gloss toner and bonded fiber protection.",
        duration: "2.5 hrs",
        popular: true,
        atHomeAvailable: false,
      },
      {
        name: "Global Hair Color & Toning",
        price: "₹3,200",
        rawPrice: 3200,
        desc: "Ammonia-free full hair color with high-shine gloss sealing mask.",
        duration: "1.5 hrs",
        popular: false,
        atHomeAvailable: true,
      },
      {
        name: "Keratin Smooth Treatment",
        price: "₹5,000",
        rawPrice: 5000,
        desc: "Deep conditioning keratin treatment to lock shine and eliminate frizz for up to 3 months.",
        duration: "2 hrs",
        popular: true,
        atHomeAvailable: true,
      }
    ]
  },
  {
    id: "traditional-rituals",
    title: "Traditional Rituals",
    tagline: "Ayurvedic Champi & Herbal Scalp Therapies",
    description: "Ancestral herbal therapies, warm oil head massage, and deep cleansing scalp treatments for root strength.",
    image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200",
    altText: "Traditional ayurvedic herbal scalp oil massage therapy in a serene sanctuary",
    accentColor: "from-amber-500/20 via-primary/10 to-transparent",
    badge: "Ancestral Care",
    startingPrice: "from ₹800",
    items: [
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
        name: "Deep Cleansing Scalp Spa",
        price: "₹1,800",
        rawPrice: 1800,
        desc: "Herbal scalp scrub, warm steam bath, and nourishing hair root strengthening pack.",
        duration: "45 mins",
        popular: false,
        atHomeAvailable: true,
      },
      {
        name: "Ayurvedic Herbal Hair Treatment",
        price: "₹2,200",
        rawPrice: 2200,
        desc: "Ancestral herbal mask with hibiscus and aloe vera to control hair fall and add shine.",
        duration: "50 mins",
        popular: true,
        atHomeAvailable: true,
      }
    ]
  },
  {
    id: "skin-care",
    title: "Skin Care",
    tagline: "24K Gold Facials & Botanical Glow Treatments",
    description: "Revitalizing botanical skin facials, gold foil infusions, and deep pore cleansing for a glowing complexion.",
    image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=1200",
    altText: "Client relaxing during luxury 24K gold foil facial treatment with gentle massage",
    accentColor: "from-amber-500/20 via-primary/10 to-transparent",
    badge: "Radiant Glow",
    startingPrice: "from ₹2,800",
    items: [
      {
        name: "24K Gold Revival Facial",
        price: "₹2,800",
        rawPrice: 2800,
        desc: "24K gold foil infusion, deep skin cleanse, exfoliation mask, and lymphatic drainage facial massage.",
        duration: "60 mins",
        popular: true,
        atHomeAvailable: true,
      }
    ]
  },
  {
    id: "bridal",
    title: "Bridal",
    tagline: "HD Bridal Makeup, Mehendi & Draping",
    description: "Long-lasting waterproof HD camera-ready makeup, designer organic mehendi, and traditional saree draping.",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200",
    altText: "Indian bride wearing exquisite HD bridal makeup and gold ornaments",
    accentColor: "from-amber-500/20 via-primary/10 to-transparent",
    badge: "Bridal Suite",
    startingPrice: "from ₹1,200",
    items: [
      {
        name: "Shringar Bridal HD Makeup",
        price: "₹12,500",
        rawPrice: 12500,
        desc: "Waterproof HD bridal makeup, hair styling, eyelashes, and dupatta setting for your big day.",
        duration: "3 hrs",
        popular: true,
        atHomeAvailable: true,
      },
      {
        name: "Bridal Mehendi & Hand Art",
        price: "₹4,000",
        rawPrice: 4000,
        desc: "Intricate designer bridal mehendi for full hands and feet using natural organic henna.",
        duration: "2.5 hrs",
        popular: false,
        atHomeAvailable: true,
      },
      {
        name: "Saree & Dupatta Draping",
        price: "₹1,200",
        rawPrice: 1200,
        desc: "Professional saree pleating and dupatta pinning in traditional or modern styles.",
        duration: "30 mins",
        popular: false,
        atHomeAvailable: true,
      }
    ]
  }
];

const POPULAR_SEARCH_PRESETS = [
  "Expert Haircut",
  "Balayage",
  "Keratin",
  "24K Gold Facial",
  "Bridal Makeup",
  "Ayurvedic Champi"
];

export interface ServicesSectionProps {
  showTitle?: boolean;
  compact?: boolean;
  filterId?: string;
}

function CategoryHorizontalRow({ 
  category, 
  services, 
  onViewReviews, 
  onWriteReview 
}: { 
  key?: string;
  category: ServiceCategory; 
  services: (ServiceItem & { ratingObj: ServiceRatingAggregate })[]; 
  onViewReviews: (name: string) => void; 
  onWriteReview: (name: string) => void; 
}) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -260 : 260;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  if (services.length === 0) return null;

  return (
    <div className="mb-6 relative group/row">
      <div className="flex items-center justify-between mb-2.5 px-1">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-primary" />
          <h3 className="text-base sm:text-lg font-serif font-bold text-foreground tracking-tight">
            {category.title}
          </h3>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">({category.tagline})</span>
        </div>
        <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
          {services.length} items
        </span>
      </div>

      <div className="relative">
        <button
          onClick={() => scroll('left')}
          className="absolute -left-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-zinc-900/90 border border-border text-primary shadow-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-zinc-800 hidden sm:flex"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          onClick={() => scroll('right')}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-20 h-8 w-8 rounded-full bg-zinc-900/90 border border-border text-primary shadow-lg flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-opacity hover:bg-zinc-800 hidden sm:flex"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory gap-3.5 no-scrollbar pb-2 px-0.5"
        >
          {services.map((service, idx) => {
            const ratingInfo = service.ratingObj;
            return (
              <div
                key={`${service.name}-${idx}`}
                className="w-[190px] sm:w-[220px] shrink-0 snap-start bg-card border border-border/80 hover:border-primary/50 rounded-2xl p-3.5 flex flex-col justify-between shadow-md transition-all duration-300 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-2">
                    <span className="text-[10px] font-bold text-primary font-mono">
                      {service.duration || "45m"}
                    </span>
                    <button
                      type="button"
                      onClick={() => onViewReviews(service.name)}
                      className="inline-flex items-center gap-1 bg-amber-400/10 border border-amber-400/30 px-2 py-0.5 rounded-full text-[10px] font-bold text-amber-300 hover:bg-amber-400/20"
                    >
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span>{ratingInfo.averageRating}</span>
                    </button>
                  </div>

                  <h4 className="text-xs font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {service.name}
                  </h4>

                  <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2 leading-snug">
                    {service.desc}
                  </p>
                </div>

                <div className="pt-3 mt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-sm font-serif font-bold text-primary">
                    {service.price}
                  </span>

                  <Button
                    asChild
                    size="sm"
                    className="h-8 px-3 rounded-xl bg-primary text-black font-bold uppercase text-[9px] tracking-wider hover:bg-primary/90 shadow"
                  >
                    <Link to={`/book?service=${encodeURIComponent(service.name)}`}>
                      Reserve
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
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

  // Reviews state & real-time sync
  const [reviewsList, setReviewsList] = useState<ServiceReviewItem[]>(DEFAULT_SERVICE_REVIEWS);
  
  // Filter & Sort state for ratings
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0); // 0 = All, 4.5 = 4.5+ ★, 5.0 = 5 ★
  const [sortBy, setSortBy] = useState<string>("recommended");

  // Modal inspection states
  const [writeReviewModalOpen, setWriteReviewModalOpen] = useState<boolean>(false);
  const [writeReviewServiceName, setWriteReviewServiceName] = useState<string>("Expert Haircut & Blowdry");
  
  const [viewReviewsModalOpen, setViewReviewsModalOpen] = useState<boolean>(false);
  const [viewReviewsServiceName, setViewReviewsServiceName] = useState<string>("Expert Haircut & Blowdry");

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

  // Listen to live reviews from Firestore
  useEffect(() => {
    try {
      const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const liveReviews = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              shopId: data.shopId || "aurelia-main",
              service: data.service || "Salon Treatment",
              userId: data.userId || "",
              userName: data.userName || "Valued Client",
              userPhoto: data.userPhoto || "",
              rating: Number(data.rating) || 5,
              title: data.title || "",
              comment: data.comment || "",
              tags: data.tags || [],
              recommend: Boolean(data.recommend),
              verifiedBooking: Boolean(data.verifiedBooking),
              helpfulCount: Number(data.helpfulCount) || 0,
              createdAt: data.createdAt ? new Date().toISOString() : new Date().toISOString()
            } as ServiceReviewItem;
          });

          // Combine with default seed reviews so every service stays richly populated
          const combined = [...liveReviews, ...DEFAULT_SERVICE_REVIEWS.filter(d => !liveReviews.some(l => l.id === d.id))];
          setReviewsList(combined);
        }
      }, (err) => {
        console.warn("Reviews snapshot listener note:", err);
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn("Reviews query setup note:", err);
    }
  }, []);

  // Calculate rating aggregates per service
  const serviceRatingMap: Record<string, ServiceRatingAggregate> = useMemo(() => {
    return calculateServiceRatings(reviewsList);
  }, [reviewsList]);

  // Total global stats
  const globalRatingStats = useMemo(() => {
    const total = reviewsList.length;
    if (total === 0) return { avg: 4.9, count: 0 };
    const sum = reviewsList.reduce((acc, r) => acc + r.rating, 0);
    const avg = Number((sum / total).toFixed(1));
    return { avg, count: total };
  }, [reviewsList]);

  // Compute all services with category associations and ratings
  const allServicesWithCategory = useMemo(() => {
    const list: (ServiceItem & { ratingObj: ServiceRatingAggregate })[] = [];
    categories.forEach(cat => {
      cat.items.forEach(item => {
        const ratingObj = serviceRatingMap[item.name] || {
          serviceName: item.name,
          averageRating: 4.9,
          totalReviews: 12,
          ratingDistribution: { 5: 10, 4: 2, 3: 0, 2: 0, 1: 0 }
        };

        list.push({
          ...item,
          categoryTitle: cat.title,
          categoryId: cat.id,
          categoryImage: cat.image,
          altText: cat.altText,
          ratingObj
        });
      });
    });
    return list;
  }, [categories, serviceRatingMap]);

  // Filtered & sorted services based on search, category, rating filter, and sort order
  const filteredServices = useMemo(() => {
    let result = [...allServicesWithCategory];

    // Category Filter
    if (selectedCategoryId !== "all") {
      result = result.filter(item => item.categoryId === selectedCategoryId);
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(item => 
        item.name.toLowerCase().includes(q) ||
        item.desc.toLowerCase().includes(q) ||
        (item.categoryTitle && item.categoryTitle.toLowerCase().includes(q))
      );
    }

    // Minimum Rating Filter
    if (minRatingFilter > 0) {
      result = result.filter(item => item.ratingObj.averageRating >= minRatingFilter);
    }

    // Sorting Order
    if (sortBy === "highest-rated") {
      result.sort((a, b) => b.ratingObj.averageRating - a.ratingObj.averageRating);
    } else if (sortBy === "most-reviewed") {
      result.sort((a, b) => b.ratingObj.totalReviews - a.ratingObj.totalReviews);
    } else if (sortBy === "price-low") {
      result.sort((a, b) => (a.rawPrice || 0) - (b.rawPrice || 0));
    } else if (sortBy === "price-high") {
      result.sort((a, b) => (b.rawPrice || 0) - (a.rawPrice || 0));
    }

    return result;
  }, [allServicesWithCategory, selectedCategoryId, searchQuery, minRatingFilter, sortBy]);

  const activeCategory = useMemo(() => {
    if (selectedCategoryId === "all") {
      return categories[0];
    }
    return categories.find(c => c.id === selectedCategoryId) || categories[0];
  }, [categories, selectedCategoryId]);

  const handleImageLoad = (catId: string) => {
    setImageLoadedState(prev => ({ ...prev, [catId]: true }));
  };

  const handleOpenWriteReview = (serviceName: string) => {
    setWriteReviewServiceName(serviceName);
    setWriteReviewModalOpen(true);
  };

  const handleOpenViewReviews = (serviceName: string) => {
    setViewReviewsServiceName(serviceName);
    setViewReviewsModalOpen(true);
  };

  const isSearchActive = searchQuery.trim().length > 0 || minRatingFilter > 0 || sortBy !== "recommended";

  // All unique service names for the review modal dropdown
  const allServiceNames = useMemo(() => {
    return allServicesWithCategory.map(s => s.name);
  }, [allServicesWithCategory]);

  // Strict deduplication across all categories and filtering
  const deduplicatedCategoriesWithServices = useMemo(() => {
    const seenNames = new Set<string>();
    return categories.map(cat => {
      const categorySpecificFiltered = filteredServices.filter(s => s.categoryId === cat.id);
      const uniqueItems: typeof filteredServices = [];
      categorySpecificFiltered.forEach(item => {
        const cleanName = item.name.toLowerCase().trim();
        if (!seenNames.has(cleanName)) {
          seenNames.add(cleanName);
          uniqueItems.push(item);
        }
      });
      return {
        category: cat,
        services: uniqueItems
      };
    }).filter(group => group.services.length > 0);
  }, [categories, filteredServices]);

  return (
    <TooltipProvider>
      <section className="w-full relative">
        {showTitle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-10 text-center"
          >
            <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
              Hair, Beauty & Grooming Services
            </span>
            <h2 className="text-4xl font-light tracking-tight md:text-6xl text-foreground">
              POPULAR <span className="italic font-serif text-primary">SALON SERVICES</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
              Explore rated haircuts, beard grooming, bridal makeup, and Ayurvedic Champi massages. See verified client feedback and ratings for each service.
            </p>
          </motion.div>
        )}

        {/* Global Average Rating & Write Feedback Callout Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto mb-10 rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-primary/10 p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-5 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-40 h-40 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-center gap-4 text-left">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-amber-400/20 border border-amber-400/40 text-amber-300 font-bold text-3xl font-serif shrink-0 shadow-inner">
              {globalRatingStats.avg}
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
                <span className="text-xs font-bold text-amber-300 ml-1">
                  {globalRatingStats.avg} / 5.0 Rating
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground">
                Verified Client Reviews & Rating System
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Calculated from {globalRatingStats.count}+ verified customer feedbacks across all services.
              </p>
            </div>
          </div>

          <Button
            onClick={() => handleOpenWriteReview("Expert Haircut & Blowdry")}
            className="w-full sm:w-auto rounded-full bg-primary px-6 py-5 text-xs font-bold uppercase tracking-wider text-black hover:bg-primary/90 shadow-lg shadow-primary/20 shrink-0 gap-2"
          >
            <Plus className="h-4 w-4" />
            Write Service Review
          </Button>
        </motion.div>

        {/* Search Bar & Rating Filter Controls */}
        <div className="max-w-4xl mx-auto mb-10 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3">
            {/* Search Input */}
            <div className="relative group w-full flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search services by name, category, or rating (e.g. Haircut, Balayage, Facial)..."
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

            {/* Sort Dropdown */}
            <div className="w-full md:w-56 shrink-0">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-13 rounded-full border-border bg-card text-xs font-semibold px-4">
                  <SelectValue placeholder="Sort Services" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-border bg-card">
                  <SelectItem value="recommended" className="text-xs">
                    Sort: Recommended
                  </SelectItem>
                  <SelectItem value="highest-rated" className="text-xs">
                    Sort: Highest Rated ★
                  </SelectItem>
                  <SelectItem value="most-reviewed" className="text-xs">
                    Sort: Most Reviewed
                  </SelectItem>
                  <SelectItem value="price-low" className="text-xs">
                    Price: Low to High
                  </SelectItem>
                  <SelectItem value="price-high" className="text-xs">
                    Price: High to Low
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Rating Filter Pills & Preset Search Chips */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground flex items-center gap-1 mr-1">
                <Star className="h-3 w-3 text-amber-400" /> Filter Rating:
              </span>
              <button
                type="button"
                onClick={() => setMinRatingFilter(0)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all border",
                  minRatingFilter === 0
                    ? "bg-primary text-black border-primary"
                    : "bg-card/60 border-border text-muted-foreground hover:text-foreground"
                )}
              >
                All Ratings
              </button>
              <button
                type="button"
                onClick={() => setMinRatingFilter(4.5)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all border flex items-center gap-1",
                  minRatingFilter === 4.5
                    ? "bg-amber-400 text-black border-amber-400 font-bold"
                    : "bg-card/60 border-border text-amber-400 hover:border-amber-400/50"
                )}
              >
                ★ 4.5+ Top Rated
              </button>
              <button
                type="button"
                onClick={() => setMinRatingFilter(5.0)}
                className={cn(
                  "px-3 py-1 rounded-full text-xs font-semibold transition-all border flex items-center gap-1",
                  minRatingFilter === 5.0
                    ? "bg-amber-400 text-black border-amber-400 font-bold"
                    : "bg-card/60 border-border text-amber-300 hover:border-amber-400/50"
                )}
              >
                ★ 5.0 Only
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              {POPULAR_SEARCH_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setSearchQuery(searchQuery === preset ? "" : preset)}
                  className="hover:text-primary transition-colors hover:underline"
                >
                  #{preset}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Category Navigation Bar */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto pb-4 mb-8 custom-scrollbar">
          <button
            onClick={() => {
              setSelectedCategoryId("all");
              setSearchQuery("");
              setMinRatingFilter(0);
            }}
            className={cn(
              "px-5 py-2.5 rounded-full text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap border shrink-0 flex items-center gap-2",
              selectedCategoryId === "all" && !isSearchActive
                ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                : "bg-card/60 border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>All Services</span>
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategoryId === cat.id && !isSearchActive;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategoryId(cat.id);
                  setSearchQuery("");
                }}
                className={cn(
                  "px-5 py-2.5 rounded-full text-xs uppercase font-bold tracking-wider transition-all whitespace-nowrap border shrink-0 flex items-center gap-2",
                  isSelected
                    ? "bg-primary text-black border-primary shadow-lg shadow-primary/20"
                    : "bg-card/60 border-border/80 text-muted-foreground hover:text-foreground hover:border-primary/40"
                )}
              >
                {cat.id === "hair-care" && <Scissors className="h-3.5 w-3.5" />}
                {cat.id === "traditional-rituals" && <Sparkles className="h-3.5 w-3.5" />}
                {cat.id === "skin-care" && <Heart className="h-3.5 w-3.5" />}
                {cat.id === "bridal" && <Crown className="h-3.5 w-3.5" />}
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
                Found <strong className="text-foreground">{filteredServices.length}</strong> service(s)
                {searchQuery && <span> matching <strong className="text-primary">"{searchQuery}"</strong></span>}
                {minRatingFilter > 0 && <span> with rating <strong className="text-amber-400">★ {minRatingFilter}+</strong></span>}
              </span>
            </div>
            <button
              onClick={() => {
                setSearchQuery("");
                setMinRatingFilter(0);
                setSortBy("recommended");
              }}
              className="text-[11px] uppercase tracking-wider text-primary hover:underline font-bold"
            >
              Reset Filters
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
              <h3 className="text-xl font-light tracking-tight text-foreground">No Services Match Filters</h3>
              <p className="text-xs text-muted-foreground mt-2 max-w-md mx-auto leading-relaxed">
                We couldn't find any services matching your search or rating criteria. Try resetting your filter to view all services.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategoryId("all");
                  setMinRatingFilter(0);
                  setSortBy("recommended");
                }}
                className="rounded-full text-xs uppercase tracking-widest border-border"
              >
                Reset All Filters
              </Button>
            </div>
          </motion.div>
        ) : (
          <div>
            {/* Deduplicated & Grouped Horizontal Rows per Category */}
            <div className="space-y-6">
              {deduplicatedCategoriesWithServices.map(({ category, services }) => (
                <CategoryHorizontalRow
                  key={category.id}
                  category={category}
                  services={services}
                  onViewReviews={handleOpenViewReviews}
                  onWriteReview={handleOpenWriteReview}
                />
              ))}
            </div>
          </div>
        )}
        <ServiceReviewModal
          isOpen={writeReviewModalOpen}
          onClose={() => setWriteReviewModalOpen(false)}
          initialServiceName={writeReviewServiceName}
          availableServiceNames={allServiceNames}
          onReviewSubmitted={(newRev) => {
            setReviewsList(prev => [newRev, ...prev]);
          }}
        />

        {/* Modal for Viewing All Reviews of a Specific Service */}
        <ServiceReviewsListModal
          isOpen={viewReviewsModalOpen}
          onClose={() => setViewReviewsModalOpen(false)}
          serviceName={viewReviewsServiceName}
          aggregate={serviceRatingMap[viewReviewsServiceName]}
          reviews={reviewsList}
          onOpenWriteReview={() => handleOpenWriteReview(viewReviewsServiceName)}
        />
      </section>
    </TooltipProvider>
  );
}
