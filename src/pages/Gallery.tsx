import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Instagram, Eye, Heart, Camera, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface GalleryLook {
  id: string;
  src: string;
  title: string;
  category: "bridal" | "cuts" | "colour" | "champi" | "grooming";
  categoryLabel: string;
  stylist: string;
  atelier: string;
  likesCount: number;
}

const LOOKBOOK_ITEMS: GalleryLook[] = [
  {
    id: "look-1",
    src: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1000",
    title: "Liquid Glass Korean Hair Lamination",
    category: "colour",
    categoryLabel: "Colour & Gloss",
    stylist: "Elena Rostova",
    atelier: "Bandra Flagship Atelier",
    likesCount: 342,
  },
  {
    id: "look-2",
    src: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1000",
    title: "24K Gold Royal Bridal Updo & Jewelry Draping",
    category: "bridal",
    categoryLabel: "Royal Bridal",
    stylist: "Meera Kapoor",
    atelier: "Bandra Flagship Atelier",
    likesCount: 890,
  },
  {
    id: "look-3",
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1000",
    title: "Maharajah Executive Beard Architecture & Razor Fade",
    category: "grooming",
    categoryLabel: "Gentlemen's Grooming",
    stylist: "Vikram Malhotra",
    atelier: "Juhu VIP Studio",
    likesCount: 415,
  },
  {
    id: "look-4",
    src: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1000",
    title: "Diwali Festive Shimmer & Mirror Glass Blowout",
    category: "cuts",
    categoryLabel: "Styling & Blowout",
    stylist: "Elena Rostova",
    atelier: "Colaba Heritage Lounge",
    likesCount: 612,
  },
  {
    id: "look-5",
    src: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=1000",
    title: "French Dimensional Honey Balayage",
    category: "colour",
    categoryLabel: "Colour & Gloss",
    stylist: "Aarav Sharma",
    atelier: "Bandra Flagship Atelier",
    likesCount: 528,
  },
  {
    id: "look-6",
    src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1000",
    title: "Aromatherapy Ayurvedic Champi & Scalp Hydrotherapy",
    category: "champi",
    categoryLabel: "Ayurvedic Champi",
    stylist: "Ananya Iyer",
    atelier: "Juhu VIP Studio",
    likesCount: 734,
  },
  {
    id: "look-7",
    src: "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=1000",
    title: "Precision Editorial Scissor Architecture & Texturizing",
    category: "cuts",
    categoryLabel: "Precision Cuts",
    stylist: "Vikram Malhotra",
    atelier: "Colaba Heritage Lounge",
    likesCount: 298,
  },
  {
    id: "look-8",
    src: "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=1000",
    title: "Rose Quartz Paraffin Hand & Foot Hydro-Nourishment",
    category: "bridal",
    categoryLabel: "Spa Rituals",
    stylist: "Meera Kapoor",
    atelier: "Bandra Flagship Atelier",
    likesCount: 467,
  },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "All Looks" },
  { id: "bridal", label: "Bridal & Trousseau" },
  { id: "colour", label: "Colour & Balayage" },
  { id: "cuts", label: "Precision Cuts" },
  { id: "grooming", label: "Grooming & Fades" },
  { id: "champi", label: "Ayurvedic Wellness" },
];

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedLook, setSelectedLook] = useState<GalleryLook | null>(null);
  const [likedLooks, setLikedLooks] = useState<Record<string, boolean>>({});

  const filteredLooks = LOOKBOOK_ITEMS.filter(
    item => activeCategory === "all" || item.category === activeCategory
  );

  const toggleLike = (lookId: string) => {
    setLikedLooks(prev => ({ ...prev, [lookId]: !prev[lookId] }));
  };

  return (
    <div className="bg-background py-16 px-4 sm:px-8 lg:px-12 min-h-screen w-full">
      <div className="mx-auto w-full max-w-[1800px]">
        {/* Header Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
            Real Client Hairstyles & Makeovers
          </span>
          <h1 className="text-5xl font-light tracking-tight md:text-7xl">
            PHOTOS & <span className="italic font-serif text-primary">HAIRSTYLES</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Explore real haircuts, hair coloring, bridal makeup, and beard styles done by expert stylists at our partner salons in Mumbai.
          </p>
        </motion.div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {CATEGORY_FILTERS.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 border select-none",
                activeCategory === cat.id
                  ? "bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20 scale-105"
                  : "bg-card/80 text-muted-foreground hover:text-white border-border hover:border-primary/40"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Lookbook Staggered Masonry Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredLooks.map((item, index) => {
              const isLiked = likedLooks[item.id];
              return (
                <motion.div
                  layout
                  key={item.id}
                  initial={{ opacity: 0, y: 24, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: index * 0.06, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl group cursor-pointer shadow-xl hover:shadow-[0_20px_40px_rgba(212,175,55,0.12)] hover:border-primary/50 transition-all duration-500"
                  onClick={() => setSelectedLook(item)}
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <img
                      src={item.src}
                      alt={item.title}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                    {/* Top Overlay Badge */}
                    <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                      <Badge className="bg-zinc-900/90 backdrop-blur-md border border-white/20 text-white text-[9px] uppercase font-mono tracking-wider">
                        {item.categoryLabel}
                      </Badge>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLike(item.id);
                        }}
                        className={cn(
                          "h-8 w-8 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center transition-all",
                          isLiked ? "bg-red-500 text-white border-red-500" : "bg-black/60 text-white hover:text-red-400"
                        )}
                        title={isLiked ? "Unlike" : "Like look"}
                      >
                        <Heart className={cn("h-4 w-4", isLiked && "fill-white")} />
                      </button>
                    </div>

                    {/* Bottom Content Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 text-white z-10 space-y-1">
                      <h3 className="font-serif text-lg font-light leading-snug line-clamp-2 text-white group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-1">
                        <span className="font-medium">{item.stylist}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {isLiked ? item.likesCount + 1 : item.likesCount} ❤️
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* Inspection Modal */}
        <Dialog open={!!selectedLook} onOpenChange={(open) => !open && setSelectedLook(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[700px] p-0 overflow-hidden">
            {selectedLook && (
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="relative aspect-[3/4] md:aspect-auto">
                  <img
                    src={selectedLook.src}
                    alt={selectedLook.title}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="p-6 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-mono tracking-wider">
                      {selectedLook.categoryLabel}
                    </Badge>
                    <h3 className="text-2xl font-serif text-white leading-tight">
                      {selectedLook.title}
                    </h3>
                    <div className="space-y-2 text-xs text-zinc-300 border-t border-zinc-800 pt-3">
                      <div className="flex justify-between">
                        <span className="text-zinc-500 uppercase font-bold text-[10px]">Master Artist:</span>
                        <span className="font-bold text-white">{selectedLook.stylist}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500 uppercase font-bold text-[10px]">Atelier:</span>
                        <span className="text-primary font-mono">{selectedLook.atelier}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-zinc-800">
                    <Button asChild className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider text-xs h-12">
                      <Link to={`/book?service=${encodeURIComponent(selectedLook.title)}`}>
                        Book This Exact Look
                      </Link>
                    </Button>
                    <p className="text-[10px] text-zinc-500 text-center uppercase tracking-widest">
                      Consultation includes HD hair porosity test
                    </p>
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
