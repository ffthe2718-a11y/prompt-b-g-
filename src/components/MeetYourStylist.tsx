import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  Calendar, 
  Sparkles, 
  Instagram, 
  Award, 
  Clock, 
  Scissors, 
  ChevronRight, 
  X, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { StylistMember, StylistPortfolioItem, DEFAULT_STYLISTS } from "@/types/stylist";

interface MeetYourStylistProps {
  stylists?: StylistMember[];
  shopId?: string;
  shopName?: string;
  shopSlug?: string;
  className?: string;
}

export default function MeetYourStylist({
  stylists,
  shopId,
  shopName = "Aurelia Luxe",
  shopSlug,
  className
}: MeetYourStylistProps) {
  const activeStylists = stylists && stylists.length > 0 ? stylists : DEFAULT_STYLISTS;

  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [activeModalStylist, setActiveModalStylist] = useState<StylistMember | null>(null);
  const [selectedPortfolioImage, setSelectedPortfolioImage] = useState<StylistPortfolioItem | null>(null);

  // Extract all categories available in the current stylist list
  const categories = useMemo(() => {
    const set = new Set<string>();
    activeStylists.forEach(s => {
      s.portfolio?.forEach(p => {
        if (p.category) set.add(p.category);
      });
    });
    return ["all", ...Array.from(set)];
  }, [activeStylists]);

  // Filter stylists based on selected category (either their specialties or portfolio categories)
  const filteredStylists = useMemo(() => {
    if (selectedCategory === "all") return activeStylists;
    return activeStylists.filter(s => {
      const hasInPortfolio = s.portfolio?.some(p => p.category === selectedCategory);
      const hasInSpecialties = s.specialties?.some(spec => 
        spec.toLowerCase().includes(selectedCategory.toLowerCase())
      );
      return hasInPortfolio || hasInSpecialties;
    });
  }, [activeStylists, selectedCategory]);

  const bookingBaseUrl = shopId 
    ? `/book?shopId=${encodeURIComponent(shopId)}`
    : (shopSlug ? `/book?shopSlug=${encodeURIComponent(shopSlug)}` : `/book`);

  return (
    <section 
      id="stylists-section" 
      className={cn("py-24 px-4 bg-zinc-950 text-white relative overflow-hidden border-t border-zinc-900", className)}
    >
      {/* Background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center max-w-3xl mx-auto mb-16">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs uppercase tracking-[0.25em] font-semibold mb-4"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Meet Your Stylist</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight italic mb-6"
          >
            Master Artists of <span className="text-primary not-italic">{shopName}</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-zinc-400 text-base md:text-lg font-light leading-relaxed"
          >
            Every client is a canvas. Explore our team of dedicated master cutters, color sculptors, and holistic Ayurvedic therapists—browse their signature transformations and reserve your appointment directly with your preferred artist.
          </motion.p>

          {/* Category Filter Tabs */}
          {categories.length > 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-2 mt-8 p-1.5 bg-black/60 rounded-xl border border-zinc-800 backdrop-blur-md"
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200",
                    selectedCategory === cat
                      ? "bg-primary text-black font-bold shadow-md shadow-primary/20"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900"
                  )}
                >
                  {cat === "all" ? "All Specialists" : cat}
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Stylists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 lg:gap-10">
          <AnimatePresence mode="popLayout">
            {filteredStylists.map((stylist, index) => (
              <motion.div
                key={stylist.id || stylist.name}
                layout
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="group relative bg-zinc-900/60 rounded-2xl border border-zinc-800/90 overflow-hidden hover:border-primary/50 transition-all duration-300 flex flex-col shadow-xl hover:shadow-2xl hover:shadow-primary/5"
              >
                {/* Top Stylist Info Banner */}
                <div className="p-6 md:p-8 flex flex-col sm:flex-row gap-6">
                  {/* Portrait Avatar */}
                  <div className="relative shrink-0 mx-auto sm:mx-0">
                    <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 border-zinc-800 group-hover:border-primary/60 transition-colors duration-300 relative shadow-lg">
                      <img 
                        src={stylist.avatar} 
                        alt={stylist.name} 
                        className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
                    </div>

                    {/* Verification / Certified icon */}
                    <div className="absolute -bottom-2 -right-2 bg-black border border-primary/40 rounded-full p-1 shadow-md">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    </div>
                  </div>

                  {/* Stylist Credentials */}
                  <div className="flex-1 flex flex-col justify-center text-center sm:text-left">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 text-[10px] uppercase font-mono tracking-wider">
                        {stylist.experience}
                      </Badge>
                      {stylist.rating && (
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-yellow-400 text-xs font-mono font-bold">
                          <Star className="h-3 w-3 fill-yellow-400" />
                          <span>{stylist.rating.toFixed(2)}</span>
                          {stylist.reviewCount && (
                            <span className="text-zinc-400 text-[10px] font-normal">
                              ({stylist.reviewCount})
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <h3 className="text-2xl font-bold text-white tracking-tight uppercase group-hover:text-primary transition-colors">
                      {stylist.name}
                    </h3>
                    <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mt-1 mb-3">
                      {stylist.role}
                    </p>

                    <p className="text-xs text-zinc-300 leading-relaxed font-light line-clamp-2 mb-3">
                      {stylist.bio}
                    </p>

                    {/* Specialties Badges */}
                    <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                      {stylist.specialties?.slice(0, 3).map((spec, i) => (
                        <span 
                          key={i} 
                          className="px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 text-[11px] font-medium border border-zinc-700/60"
                        >
                          {spec}
                        </span>
                      ))}
                      {(stylist.specialties?.length || 0) > 3 && (
                        <span className="px-1.5 py-0.5 rounded-md bg-zinc-800/40 text-zinc-400 text-[10px]">
                          +{(stylist.specialties?.length || 0) - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stylist Portfolio Preview Strip */}
                {stylist.portfolio && stylist.portfolio.length > 0 && (
                  <div className="px-6 md:px-8 pb-4 pt-2">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-[11px] uppercase font-bold tracking-widest text-zinc-400 flex items-center gap-1.5">
                        <Scissors className="h-3 w-3 text-primary" />
                        Signature Portfolio Work
                      </span>
                      <button 
                        onClick={() => setActiveModalStylist(stylist)}
                        className="text-[11px] text-primary hover:text-white transition-colors flex items-center gap-1 font-medium group/link"
                      >
                        <span>View All ({stylist.portfolio.length})</span>
                        <ChevronRight className="h-3 w-3 group-hover/link:translate-x-0.5 transition-transform" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      {stylist.portfolio.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setActiveModalStylist(stylist);
                            setSelectedPortfolioImage(item);
                          }}
                          className="aspect-[4/3] rounded-lg overflow-hidden relative group/thumb cursor-pointer border border-zinc-800 bg-zinc-950"
                        >
                          <img 
                            src={item.imageUrl} 
                            alt={item.title} 
                            className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity p-2 flex flex-col justify-end">
                            <span className="text-[10px] text-white font-medium line-clamp-1 leading-tight">
                              {item.title}
                            </span>
                            <span className="text-[8px] text-primary uppercase font-mono tracking-widest">
                              {item.category}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="mt-auto px-6 md:px-8 py-5 border-t border-zinc-800/80 bg-zinc-950/60 flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setActiveModalStylist(stylist)}
                    className="flex-1 border-zinc-800 hover:border-zinc-600 hover:bg-zinc-900 text-xs font-bold uppercase tracking-wider text-zinc-200"
                  >
                    View Portfolio & Bio
                  </Button>

                  <Button
                    asChild
                    className="flex-1 bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-wider gap-1.5 shadow-md shadow-primary/10"
                  >
                    <Link to={`${bookingBaseUrl}&stylist=${encodeURIComponent(stylist.name)}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Book with {stylist.name.split(" ")[0]}</span>
                    </Link>
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Full Stylist Portfolio & Bio Modal */}
      <Dialog 
        open={!!activeModalStylist} 
        onOpenChange={(open) => {
          if (!open) {
            setActiveModalStylist(null);
            setSelectedPortfolioImage(null);
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border border-zinc-800 text-white p-0 gap-0">
          {activeModalStylist && (
            <div className="flex flex-col">
              {/* Modal Hero Banner */}
              <div className="relative p-6 sm:p-8 md:p-10 border-b border-zinc-800/80 bg-gradient-to-b from-zinc-900 via-zinc-900/50 to-zinc-950">
                <div className="flex flex-col sm:flex-row gap-6 sm:gap-8 items-center sm:items-start text-center sm:text-left">
                  {/* Portrait Avatar */}
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-primary/40 shrink-0 shadow-2xl relative">
                    <img 
                      src={activeModalStylist.avatar} 
                      alt={activeModalStylist.name} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-2">
                      <Badge className="bg-primary text-black font-bold uppercase tracking-wider text-xs">
                        {activeModalStylist.experience}
                      </Badge>
                      {activeModalStylist.rating && (
                        <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-yellow-400 text-xs font-mono font-bold">
                          <Star className="h-3.5 w-3.5 fill-yellow-400" />
                          <span>{activeModalStylist.rating.toFixed(2)}</span>
                          <span className="text-zinc-400 text-[11px] font-normal">
                            ({activeModalStylist.reviewCount} client reviews)
                          </span>
                        </div>
                      )}
                    </div>

                    <DialogTitle className="text-3xl sm:text-4xl font-black uppercase tracking-tight italic text-white mb-1">
                      {activeModalStylist.name}
                    </DialogTitle>
                    <DialogDescription className="text-primary text-sm uppercase tracking-widest font-semibold mb-4">
                      {activeModalStylist.role}
                    </DialogDescription>

                    {/* Social & Contact */}
                    {activeModalStylist.instagram && (
                      <a 
                        href={`https://instagram.com/${activeModalStylist.instagram}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors bg-zinc-800/60 px-3 py-1.5 rounded-lg border border-zinc-700/50"
                      >
                        <Instagram className="h-3.5 w-3.5 text-primary" />
                        <span>@{activeModalStylist.instagram}</span>
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Bio & Philosophy Section */}
              <div className="p-6 sm:p-8 border-b border-zinc-800/80 bg-zinc-950">
                <h4 className="text-xs uppercase font-bold tracking-[0.2em] text-primary mb-3 flex items-center gap-2">
                  <Award className="h-4 w-4" />
                  Professional Biography & Artistry
                </h4>
                <p className="text-zinc-300 text-sm md:text-base leading-relaxed font-light mb-6">
                  {activeModalStylist.bio}
                </p>

                {/* Specialties Grid */}
                <div>
                  <h5 className="text-[11px] uppercase font-bold tracking-widest text-zinc-400 mb-2">
                    Key Specialties & Techniques
                  </h5>
                  <div className="flex flex-wrap gap-2">
                    {activeModalStylist.specialties?.map((spec, i) => (
                      <Badge 
                        key={i} 
                        variant="outline" 
                        className="border-zinc-700 bg-zinc-900 text-zinc-200 text-xs py-1 px-3"
                      >
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Available Services */}
                {activeModalStylist.availableServices && activeModalStylist.availableServices.length > 0 && (
                  <div className="mt-5 pt-5 border-t border-zinc-800/60">
                    <h5 className="text-[11px] uppercase font-bold tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                      <Scissors className="h-3.5 w-3.5 text-primary" />
                      Signature Services Offered
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {activeModalStylist.availableServices.map((serviceName, i) => (
                        <span 
                          key={i} 
                          className="text-xs px-2.5 py-1 rounded bg-primary/10 text-primary border border-primary/20 font-medium"
                        >
                          {serviceName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Portfolio Showcase Grid */}
              <div className="p-6 sm:p-8 bg-zinc-900/30">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h4 className="text-lg font-bold uppercase tracking-wide text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-primary" />
                      Client Transformation Portfolio
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      Recent styles crafted by {activeModalStylist.name.split(" ")[0]}
                    </p>
                  </div>
                  <Badge variant="outline" className="border-zinc-700 text-zinc-300 font-mono text-xs">
                    {activeModalStylist.portfolio?.length || 0} Looks
                  </Badge>
                </div>

                {/* Portfolio Looks Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {activeModalStylist.portfolio?.map((item) => (
                    <div 
                      key={item.id}
                      onClick={() => setSelectedPortfolioImage(item)}
                      className={cn(
                        "group/card rounded-xl overflow-hidden border bg-zinc-900 flex flex-col transition-all cursor-pointer",
                        selectedPortfolioImage?.id === item.id 
                          ? "border-primary ring-2 ring-primary/20" 
                          : "border-zinc-800 hover:border-zinc-700"
                      )}
                    >
                      <div className="aspect-[4/3] relative overflow-hidden bg-black">
                        <img 
                          src={item.imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute top-2 left-2">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-black/75 backdrop-blur-md text-primary border border-primary/30">
                            {item.category}
                          </span>
                        </div>
                        {item.duration && (
                          <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono bg-black/80 text-zinc-300">
                            <Clock className="h-2.5 w-2.5 text-zinc-400" />
                            <span>{item.duration}</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3.5 flex flex-col flex-1">
                        <h6 className="font-bold text-sm text-white group-hover/card:text-primary transition-colors leading-snug">
                          {item.title}
                        </h6>
                        {item.description && (
                          <p className="text-xs text-zinc-400 mt-1 line-clamp-2 font-light">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Expanded Portfolio Item Detail Preview (if clicked) */}
                {selectedPortfolioImage && (
                  <div className="mt-6 p-4 rounded-xl border border-primary/40 bg-black/60 backdrop-blur-md flex flex-col sm:flex-row gap-5 items-center">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-lg overflow-hidden shrink-0 border border-zinc-700">
                      <img 
                        src={selectedPortfolioImage.imageUrl} 
                        alt={selectedPortfolioImage.title} 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                        <span className="text-[10px] uppercase font-mono tracking-widest text-primary font-bold">
                          {selectedPortfolioImage.category}
                        </span>
                        {selectedPortfolioImage.duration && (
                          <span className="text-[10px] text-zinc-400">
                            • Session: {selectedPortfolioImage.duration}
                          </span>
                        )}
                      </div>
                      <h5 className="text-base font-bold text-white">
                        {selectedPortfolioImage.title}
                      </h5>
                      {selectedPortfolioImage.description && (
                        <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                          {selectedPortfolioImage.description}
                        </p>
                      )}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setSelectedPortfolioImage(null)}
                      className="text-zinc-400 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Modal Bottom CTA */}
              <div className="p-6 border-t border-zinc-800 bg-zinc-950 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-xs text-zinc-400">Ready to transform your look?</p>
                  <p className="text-sm font-bold text-white">Book a dedicated session with {activeModalStylist.name}</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => setActiveModalStylist(null)}
                    className="border-zinc-800 hover:bg-zinc-900 text-xs uppercase"
                  >
                    Close
                  </Button>
                  <Button
                    asChild
                    className="flex-1 sm:flex-none bg-primary text-black hover:bg-primary/90 font-bold text-xs uppercase tracking-wider gap-2 px-6 h-11"
                  >
                    <Link 
                      to={`${bookingBaseUrl}&stylist=${encodeURIComponent(activeModalStylist.name)}`}
                      onClick={() => setActiveModalStylist(null)}
                    >
                      <Calendar className="h-4 w-4" />
                      <span>Book with {activeModalStylist.name.split(" ")[0]}</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
