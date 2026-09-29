import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Sparkles, 
  Clock, 
  Tag, 
  Check, 
  Copy, 
  CheckCheck, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Gift, 
  Info, 
  Flame,
  Calendar,
  X,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { SEASONAL_PROMOTIONS } from "@/data/promotions";
import { SeasonalPromotion } from "@/types/promotion";

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateTimeRemaining(targetDateStr: string): TimeRemaining {
  // Ensure target date is always ahead for interactive demo experience
  const targetDate = new Date(targetDateStr).getTime();
  const now = new Date().getTime();
  let diff = targetDate - now;

  // Fallback to 14 days dynamic countdown if fixed date has elapsed
  if (diff <= 0) {
    diff = (14 * 24 * 60 * 60 + 18 * 60 * 60 + 45 * 60) * 1000;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / 1000 / 60) % 60);
  const seconds = Math.floor((diff / 1000) % 60);

  return { days, hours, minutes, seconds, isExpired: false };
}

export default function SeasonalPromotionsCarousel() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [inspectingPromo, setInspectingPromo] = useState<SeasonalPromotion | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false
  });

  const filteredPromotions = useMemo(() => {
    if (selectedCategory === "all") return SEASONAL_PROMOTIONS;
    return SEASONAL_PROMOTIONS.filter(p => p.category === selectedCategory);
  }, [selectedCategory]);

  const activePromo = filteredPromotions[currentIndex] || filteredPromotions[0];

  // Update countdown clock every second
  useEffect(() => {
    if (!activePromo) return;
    
    setTimeRemaining(calculateTimeRemaining(activePromo.validUntil));
    const timer = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(activePromo.validUntil));
    }, 1000);

    return () => clearInterval(timer);
  }, [activePromo]);

  // Autoplay functionality with smooth interval
  useEffect(() => {
    if (!isPlaying || filteredPromotions.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredPromotions.length);
    }, 6500);

    return () => clearInterval(interval);
  }, [isPlaying, filteredPromotions.length]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredPromotions.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredPromotions.length) % filteredPromotions.length);
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setCurrentIndex(0);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Promo code "${code}" copied to clipboard!`, {
      description: "Apply this code at booking to unlock your seasonal savings."
    });
    setTimeout(() => {
      setCopiedCode(null);
    }, 3000);
  };

  const handleClaimOffer = (promo: SeasonalPromotion) => {
    navigate(`/book?service=${encodeURIComponent(promo.title)}&promo=${promo.promoCode}`);
  };

  // Touch swipe gestures
  const minSwipeDistance = 50;
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (!activePromo) return null;

  return (
    <section className="relative overflow-hidden rounded-[24px] border border-border/80 bg-gradient-to-b from-card/95 via-card/80 to-background shadow-2xl">
      {/* Ambient background glow */}
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />

      {/* Header Bar: Category Navigation & Controls */}
      <div className="border-b border-border/60 bg-black/30 backdrop-blur-md px-6 py-5 md:px-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-primary font-bold">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              <span>Seasonal Highlights</span>
              <span className="text-zinc-600">·</span>
              <span className="text-muted-foreground font-normal tracking-wider">Limited Festive & Bridal Editions</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-serif tracking-tight text-foreground mt-1">
              Festive Celebrations & <span className="italic font-light text-primary">Bridal Packages</span>
            </h2>
          </div>

          {/* Interactive Category Filter Tabs (Zero-Pill Button Segment) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All Offers" },
              { id: "bridal", label: "Bridal Couture" },
              { id: "festive", label: "Festive Splendor" },
              { id: "hair-skin", label: "Hair & Skin" },
              { id: "groom", label: "Regal Groom" },
              { id: "wellness", label: "Duo & Couples" }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-md transition-all whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? "bg-primary text-black shadow-md shadow-primary/20 scale-[1.02]"
                    : "text-zinc-400 hover:text-foreground hover:bg-white/5"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Carousel Display Area */}
      <div 
        className="p-6 md:p-10 lg:p-12 relative"
        onMouseEnter={() => setIsPlaying(false)}
        onMouseLeave={() => setIsPlaying(true)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activePromo.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
          >
            {/* Left Column: Offer Details & Booking Actions (7 cols) */}
            <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
              {/* Typographic Metadata Kicker (Anti-slop clean text) */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                <span className="text-primary font-bold">{activePromo.seasonTag}</span>
                <span aria-hidden="true" className="text-zinc-600">/</span>
                <span>{activePromo.categoryLabel}</span>
                <span aria-hidden="true" className="text-zinc-600">/</span>
                <span className="text-amber-400 font-bold">{activePromo.badgeText}</span>
              </div>

              {/* Title & Tagline */}
              <div>
                <h3 className="text-3xl sm:text-4xl md:text-5xl font-light text-foreground tracking-tight leading-[1.1] mb-3">
                  {activePromo.title}
                </h3>
                <p className="text-sm md:text-base text-zinc-300 font-light leading-relaxed max-w-2xl">
                  {activePromo.subtitle}
                </p>
              </div>

              {/* Package Highlights Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-2">
                {activePromo.highlights.slice(0, 4).map((highlight, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <div className="h-4 w-4 rounded-full bg-primary/10 border border-primary/40 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="h-2.5 w-2.5 text-primary" />
                    </div>
                    <span className="leading-snug">{highlight}</span>
                  </div>
                ))}
              </div>

              {/* Exclusive Perk Banner */}
              <div className="flex items-center gap-3 p-3.5 rounded-xl border border-primary/20 bg-primary/[0.04] text-xs">
                <Gift className="h-4 w-4 text-primary shrink-0 animate-bounce" />
                <div className="flex-1">
                  <span className="font-bold text-primary uppercase tracking-wider text-[10px] block">Exclusive Package Bonus</span>
                  <span className="text-zinc-300 font-medium">{activePromo.exclusivePerk}</span>
                </div>
              </div>

              {/* Pricing & Dynamic Live Countdown Row */}
              <div className="flex flex-wrap items-end justify-between gap-6 pt-2 border-t border-border/60">
                {/* Price Display */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block mb-1">
                    Special Package Price
                  </span>
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl md:text-4xl font-light font-serif text-primary">
                      ₹{activePromo.discountedPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-sm text-zinc-500 line-through">
                      ₹{activePromo.originalPrice.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Save {activePromo.discountPercentage}%
                    </span>
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Duration: {activePromo.durationText}
                  </span>
                </div>

                {/* Countdown Timer Block */}
                <div className="flex flex-col items-start sm:items-end">
                  <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1.5">
                    <Clock className="h-3 w-3 text-primary animate-spin-slow" />
                    <span>Offer Expires In</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-center">
                    <div className="flex flex-col items-center bg-black/60 border border-border px-2 py-1 rounded min-w-[36px]">
                      <span className="text-sm font-bold text-foreground">
                        {String(timeRemaining.days).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] text-muted-foreground uppercase">Days</span>
                    </div>
                    <span className="text-primary font-bold">:</span>
                    <div className="flex flex-col items-center bg-black/60 border border-border px-2 py-1 rounded min-w-[36px]">
                      <span className="text-sm font-bold text-foreground">
                        {String(timeRemaining.hours).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] text-muted-foreground uppercase">Hrs</span>
                    </div>
                    <span className="text-primary font-bold">:</span>
                    <div className="flex flex-col items-center bg-black/60 border border-border px-2 py-1 rounded min-w-[36px]">
                      <span className="text-sm font-bold text-foreground">
                        {String(timeRemaining.minutes).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] text-muted-foreground uppercase">Min</span>
                    </div>
                    <span className="text-primary font-bold">:</span>
                    <div className="flex flex-col items-center bg-black/60 border border-border px-2 py-1 rounded min-w-[36px]">
                      <span className="text-sm font-bold text-primary">
                        {String(timeRemaining.seconds).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] text-muted-foreground uppercase">Sec</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Promo Code Box & Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                {/* Clickable Promo Code Box */}
                <button
                  onClick={() => handleCopyCode(activePromo.promoCode)}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-lg border border-dashed border-primary/50 bg-black/40 hover:bg-primary/5 transition-all text-left group"
                  title="Click to copy coupon code"
                >
                  <div className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Code:</span>
                    <span className="text-sm font-bold text-primary font-mono tracking-wider">{activePromo.promoCode}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    {copiedCode === activePromo.promoCode ? (
                      <>
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </div>
                </button>

                {/* Primary: Claim & Book */}
                <Button
                  onClick={() => handleClaimOffer(activePromo)}
                  className="rounded-lg bg-primary px-6 py-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 shadow-lg shadow-primary/20 flex-1 flex items-center justify-center gap-2"
                >
                  <span>Claim Offer & Book</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>

                {/* Secondary: View Full Itinerary */}
                <Button
                  variant="outline"
                  onClick={() => setInspectingPromo(activePromo)}
                  className="rounded-lg border-border px-4 py-6 text-xs font-semibold uppercase tracking-wider text-foreground hover:bg-white/5 flex items-center gap-1.5"
                >
                  <Info className="h-4 w-4 text-primary" />
                  <span>Itinerary</span>
                </Button>
              </div>
            </div>

            {/* Right Column: Editorial Visual Asset & Floating Badges (5 cols) */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/5] rounded-[20px] overflow-hidden border border-border/80 shadow-2xl group">
                <img
                  src={activePromo.imageUrl}
                  alt={activePromo.imageAlt}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Top Corner Floating Chip: Slots Urgency */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-white font-medium">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span>{activePromo.slotsRemaining} Slots Remaining</span>
                  </div>
                  <div className="bg-primary/90 backdrop-blur-md text-black font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full">
                    Save {activePromo.discountPercentage}%
                  </div>
                </div>

                {/* Bottom Overlay Info */}
                <div className="absolute bottom-4 left-4 right-4 bg-black/75 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-bold">Curated For</span>
                    <span className="text-[10px] text-zinc-400">{activePromo.durationText}</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">{activePromo.targetAudience}</p>
                </div>
              </div>

              {/* Quick Thumbnail Selector Strip beneath card */}
              <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {filteredPromotions.map((promo, idx) => (
                  <button
                    key={promo.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-12 w-16 shrink-0 rounded-lg overflow-hidden border transition-all ${
                      currentIndex === idx
                        ? "border-primary ring-2 ring-primary/40 scale-105"
                        : "border-border/60 opacity-60 hover:opacity-100"
                    }`}
                    title={promo.title}
                  >
                    <img
                      src={promo.imageUrl}
                      alt={promo.title}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    {currentIndex === idx && (
                      <div className="absolute inset-0 bg-primary/20" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Footer Bar: Progress, Counter & Prev/Next Controls */}
        <div className="mt-8 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Slide Indicator & Autoplay Toggle */}
          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-muted-foreground tracking-wider">
              <span className="text-primary font-bold">0{currentIndex + 1}</span> / 0{filteredPromotions.length}
            </span>

            {/* Stepper Dots */}
            <div className="flex items-center gap-1.5">
              {filteredPromotions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 transition-all rounded-full ${
                    currentIndex === idx
                      ? "w-8 bg-primary"
                      : "w-2 bg-zinc-700 hover:bg-zinc-500"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>

            {/* Play / Pause Toggle Button */}
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1 text-[10px] uppercase font-bold text-zinc-500 hover:text-foreground transition-colors ml-2"
              title={isPlaying ? "Pause autoplay" : "Resume autoplay"}
            >
              {isPlaying ? (
                <>
                  <Pause className="h-3 w-3" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3" />
                  <span>Auto</span>
                </>
              )}
            </button>
          </div>

          {/* Previous / Next Arrow Navigation Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-10 w-10 rounded-full border-border/80 hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
              aria-label="Previous Offer"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-10 w-10 rounded-full border-border/80 hover:border-primary/60 hover:bg-primary/10 hover:text-primary transition-all active:scale-95"
              aria-label="Next Offer"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Package Itinerary & Ritual Modal */}
      <Dialog open={!!inspectingPromo} onOpenChange={(open) => !open && setInspectingPromo(null)}>
        {inspectingPromo && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-card border-border p-6 md:p-8">
            <DialogHeader className="space-y-2 pb-4 border-b border-border">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-bold">
                <span>{inspectingPromo.seasonTag}</span>
                <span className="text-zinc-600">·</span>
                <span>{inspectingPromo.categoryLabel}</span>
              </div>
              <DialogTitle className="text-2xl md:text-3xl font-serif text-foreground">
                {inspectingPromo.title}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                {inspectingPromo.description}
              </DialogDescription>
            </DialogHeader>

            {/* Price & Promo Highlight */}
            <div className="my-5 p-4 rounded-xl border border-primary/30 bg-primary/5 flex items-center justify-between flex-wrap gap-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest block">Package Price</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-serif text-primary">₹{inspectingPromo.discountedPrice.toLocaleString("en-IN")}</span>
                  <span className="text-xs text-zinc-500 line-through">₹{inspectingPromo.originalPrice.toLocaleString("en-IN")}</span>
                  <span className="text-xs font-bold text-emerald-400">({inspectingPromo.discountPercentage}% Off)</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-black/60 px-3 py-2 rounded border border-border">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-mono font-bold text-primary">{inspectingPromo.promoCode}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopyCode(inspectingPromo.promoCode)}
                  className="h-6 px-2 text-[10px] text-zinc-300 hover:text-white"
                >
                  Copy
                </Button>
              </div>
            </div>

            {/* Step-by-Step Ritual Sequence */}
            <div className="space-y-4 mb-6">
              <h4 className="text-xs uppercase font-bold tracking-widest text-primary">
                Ritual Itinerary & Experience Sequence ({inspectingPromo.durationText})
              </h4>
              <div className="space-y-3">
                {inspectingPromo.steps.map((step, idx) => (
                  <div key={idx} className="flex gap-4 p-3.5 rounded-lg bg-zinc-900/60 border border-border/50 items-start">
                    <span className="h-6 w-6 rounded-full bg-primary/10 border border-primary/40 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <h5 className="text-sm font-semibold text-foreground">{step.title}</h5>
                        <span className="text-[10px] font-mono text-zinc-400 shrink-0">{step.duration}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Complimentary Gift & Perks */}
            <div className="p-4 rounded-xl border border-border bg-zinc-950/60 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <Gift className="h-4 w-4" />
                <span>Complimentary Perks Included</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed pl-6">
                {inspectingPromo.exclusivePerk}
              </p>
            </div>

            {/* Terms */}
            <div className="mb-6 space-y-1 text-[11px] text-zinc-500">
              <span className="font-bold uppercase tracking-wider text-[10px] text-zinc-400 block mb-1">Reservation Policy:</span>
              {inspectingPromo.terms.map((term, idx) => (
                <p key={idx}>• {term}</p>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <DialogClose asChild>
                <Button variant="outline" className="border-border">
                  Close
                </Button>
              </DialogClose>
              <Button
                onClick={() => {
                  setInspectingPromo(null);
                  handleClaimOffer(inspectingPromo);
                }}
                className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-wider text-xs gap-2"
              >
                <span>Reserve Package</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </section>
  );
}
