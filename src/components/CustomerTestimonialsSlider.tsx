import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { 
  Star, 
  Quote, 
  ChevronLeft, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Scissors, 
  MapPin, 
  Play, 
  Pause, 
  PlusCircle, 
  CheckCircle2, 
  ThumbsUp, 
  Award,
  ArrowRight,
  Heart,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TESTIMONIALS_DATA, Testimonial } from "@/data/testimonials";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";

type CategoryFilter = "All" | "Hair & Balayage" | "Bridal & Couture" | "Grooming & Shave" | "Skincare & Spa";

export default function CustomerTestimonialsSlider() {
  const { user } = useAuth();
  const [testimonials, setTestimonials] = useState<Testimonial[]>(TESTIMONIALS_DATA);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [likedReviews, setLikedReviews] = useState<Record<string, number>>({});

  // Review submission state
  const [newReview, setNewReview] = useState({
    name: user?.displayName || "",
    location: "Mumbai",
    rating: 5,
    treatment: "Bespoke Dimensional Balayage",
    category: "Hair & Balayage" as CategoryFilter,
    title: "",
    comment: "",
  });

  // Fetch dynamic reviews from Firestore if available
  useEffect(() => {
    const fetchFirestoreReviews = async () => {
      try {
        const q = query(collection(db, "reviews"), orderBy("createdAt", "desc"), limit(10));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const remoteReviews: Testimonial[] = snap.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              clientName: data.clientName || data.name || "Aurelia Client",
              location: data.location || "Mumbai",
              avatar: data.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
              rating: Number(data.rating) || 5,
              reviewTitle: data.reviewTitle || data.title || "Exceptional Service",
              content: data.content || data.comment || "",
              treatment: data.treatment || "Signature Salon Treatment",
              serviceCategory: (data.category as any) || "Hair & Balayage",
              stylistName: data.stylistName || "Master Stylist",
              shopName: data.shopName || "Aurelia Flagship Atelier",
              verifiedVisitDate: "Verified Visit • Recent",
              isVerifiedClient: true,
              highlightPerk: data.highlightPerk || "VIP Experience"
            };
          });

          // Combine with curated testimonials
          setTestimonials([...remoteReviews, ...TESTIMONIALS_DATA]);
        }
      } catch (error) {
        console.warn("Using curated client reviews:", error);
      }
    };

    fetchFirestoreReviews();
  }, []);

  // Filtered list based on category tab
  const filteredTestimonials = React.useMemo(() => {
    if (selectedCategory === "All") return testimonials;
    return testimonials.filter(t => t.serviceCategory === selectedCategory);
  }, [testimonials, selectedCategory]);

  // Handle slide index bounds
  const totalSlides = filteredTestimonials.length;

  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedCategory]);

  // Autoplay timer
  useEffect(() => {
    if (!isPlaying || isHovered || totalSlides <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
    }, 5500);

    return () => clearInterval(timer);
  }, [isPlaying, isHovered, totalSlides]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  };

  const handleToggleLike = (id: string) => {
    setLikedReviews(prev => ({
      ...prev,
      [id]: (prev[id] || 0) + 1
    }));
    toast.success("Thank you for your feedback!", {
      description: "Marked review as helpful"
    });
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReview.name.trim() || !newReview.comment.trim() || !newReview.title.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewPayload = {
        clientName: newReview.name,
        location: newReview.location,
        rating: newReview.rating,
        treatment: newReview.treatment,
        category: newReview.category === "All" ? "Hair & Balayage" : newReview.category,
        reviewTitle: newReview.title,
        content: newReview.comment,
        createdAt: serverTimestamp(),
        verified: true,
        userId: user?.uid || "guest",
      };

      await addDoc(collection(db, "reviews"), reviewPayload);

      const optimisticReview: Testimonial = {
        id: `local-${Date.now()}`,
        clientName: newReview.name,
        location: newReview.location,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
        rating: newReview.rating,
        reviewTitle: newReview.title,
        content: newReview.comment,
        treatment: newReview.treatment,
        serviceCategory: (newReview.category === "All" ? "Hair & Balayage" : newReview.category) as any,
        stylistName: "Master Specialist",
        shopName: "Aurelia Flagship Atelier",
        verifiedVisitDate: "Verified Visit • Just now",
        isVerifiedClient: true,
        highlightPerk: "Verified Community Feedback"
      };

      setTestimonials(prev => [optimisticReview, ...prev]);
      setIsSubmitModalOpen(false);
      setNewReview({
        name: "",
        location: "Mumbai",
        rating: 5,
        treatment: "Bespoke Dimensional Balayage",
        category: "Hair & Balayage",
        title: "",
        comment: "",
      });

      toast.success("Review published successfully!", {
        description: "Thank you for sharing your luxury salon experience."
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error("Could not save review right now. Please try again.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const currentTestimonial = filteredTestimonials[currentIndex] || filteredTestimonials[0];

  const categories: CategoryFilter[] = [
    "All",
    "Hair & Balayage",
    "Bridal & Couture",
    "Grooming & Shave",
    "Skincare & Spa"
  ];

  if (!currentTestimonial) return null;

  return (
    <section 
      className="w-full rounded-[24px] border border-border bg-gradient-to-b from-card via-card/90 to-background p-6 md:p-10 shadow-2xl relative overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Subtle Luxury Ambient Background Glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 relative z-10 border-b border-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-primary" />
              Verified Client Impressions
            </span>
            <Badge variant="outline" className="border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-[9px] uppercase font-mono tracking-wider px-2 h-5">
              100% Verified Visits
            </Badge>
          </div>
          
          <h2 className="text-3xl md:text-5xl font-light tracking-tight text-white">
            WORDS OF <span className="italic text-primary font-serif">EXCELLENCE</span>
          </h2>
          <p className="text-xs md:text-sm text-muted-foreground mt-2 max-w-xl leading-relaxed">
            Discover why Mumbai's elite professionals, brides, and style icons trust Aurelia Luxe Studios for their signature transformations.
          </p>
        </div>

        {/* Social Proof Stats & Modal Trigger */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-background/80 border border-border rounded-xl px-4 py-2.5 flex items-center gap-3 backdrop-blur-sm shadow-sm">
            <div className="flex flex-col items-center">
              <span className="text-xl font-bold font-serif text-white flex items-center gap-1">
                4.98 <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              </span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">480+ Reviews</span>
            </div>
            <div className="h-8 w-px bg-zinc-800" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-emerald-400">99.4%</span>
              <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-mono">Recommendation</span>
            </div>
          </div>

          <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-primary/40 text-primary hover:bg-primary hover:text-black rounded-lg text-xs font-bold uppercase tracking-wider h-11 px-5 gap-2">
                <PlusCircle className="h-4 w-4" /> Share Review
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-md p-6">
              <DialogHeader>
                <DialogTitle className="text-xl font-serif text-primary">Share Your Salon Experience</DialogTitle>
                <DialogDescription className="text-xs text-zinc-400">
                  Your feedback helps maintain the gold standard of luxury styling in Mumbai.
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleReviewSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Your Name *</Label>
                    <Input 
                      required
                      placeholder="e.g. Radhika Kapoor" 
                      value={newReview.name}
                      onChange={(e) => setNewReview({ ...newReview, name: e.target.value })}
                      className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Neighborhood / City</Label>
                    <Input 
                      placeholder="e.g. Bandra, Mumbai" 
                      value={newReview.location}
                      onChange={(e) => setNewReview({ ...newReview, location: e.target.value })}
                      className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Treatment Category</Label>
                    <Select 
                      value={newReview.category} 
                      onValueChange={(val: any) => setNewReview({ ...newReview, category: val })}
                    >
                      <SelectTrigger className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white">
                        <SelectValue placeholder="Select Category" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                        <SelectItem value="Hair & Balayage">Hair & Balayage</SelectItem>
                        <SelectItem value="Bridal & Couture">Bridal & Couture</SelectItem>
                        <SelectItem value="Grooming & Shave">Grooming & Shave</SelectItem>
                        <SelectItem value="Skincare & Spa">Skincare & Spa</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Rating</Label>
                    <div className="flex items-center gap-1.5 h-10 px-3 rounded-md bg-zinc-900 border border-zinc-800">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewReview({ ...newReview, rating: star })}
                          className="hover:scale-110 transition-transform"
                        >
                          <Star className={cn(
                            "h-5 w-5",
                            star <= newReview.rating ? "text-amber-400 fill-amber-400" : "text-zinc-700"
                          )} />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Service / Treatment Name *</Label>
                  <Input 
                    required
                    placeholder="e.g. Traditional Ayurvedic Champi & Scalp Detox" 
                    value={newReview.treatment}
                    onChange={(e) => setNewReview({ ...newReview, treatment: e.target.value })}
                    className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Review Headline *</Label>
                  <Input 
                    required
                    placeholder="e.g. Unmatched attention to detail and radiant results" 
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400">Your Experience Details *</Label>
                  <Textarea 
                    required
                    rows={3}
                    placeholder="Tell us about the ambiance, master stylist expertise, and longevity of the treatment..." 
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    className="text-xs bg-zinc-900 border-zinc-800 text-white resize-none"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={() => setIsSubmitModalOpen(false)}
                    className="text-xs text-zinc-400"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmittingReview}
                    className="bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-wider px-6"
                  >
                    {isSubmittingReview ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none mb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold tracking-wider uppercase transition-all shrink-0 border",
              selectedCategory === cat
                ? "bg-primary text-black border-primary shadow-md shadow-primary/20 scale-[1.02]"
                : "bg-background/80 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Slider Carousel Card */}
      <div className="relative min-h-[380px] md:min-h-[320px] flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentTestimonial.id}-${currentIndex}`}
            initial={{ opacity: 0, x: 25, scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -25, scale: 0.98 }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="w-full rounded-2xl border border-zinc-800/90 bg-zinc-950/70 p-6 md:p-8 backdrop-blur-md relative overflow-hidden shadow-xl group/card"
          >
            {/* Ambient Watermark Quote */}
            <Quote className="absolute top-4 right-6 h-28 w-28 text-primary/5 pointer-events-none rotate-180" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Column: Client Avatar & Identity */}
              <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-start gap-4 border-b lg:border-b-0 lg:border-r border-zinc-800/80 pb-6 lg:pb-0 lg:pr-8">
                <div className="relative">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden border-2 border-primary/40 shadow-lg shadow-primary/10">
                    <img 
                      src={currentTestimonial.avatar} 
                      alt={currentTestimonial.clientName} 
                      className="h-full w-full object-cover group-hover/card:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 shadow-md">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </div>
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      {currentTestimonial.clientName}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
                    <MapPin className="h-3 w-3 text-primary shrink-0" />
                    <span>{currentTestimonial.location}</span>
                  </div>

                  <div className="mt-2.5 flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-500/20 px-2 py-0.5 rounded w-fit">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>{currentTestimonial.verifiedVisitDate}</span>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-900 w-full space-y-1 text-xs">
                    <p className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Studio Visited</p>
                    <p className="text-zinc-300 font-medium truncate">{currentTestimonial.shopName}</p>
                    <p className="text-[11px] text-primary/90 flex items-center gap-1">
                      <Scissors className="h-3 w-3" /> Stylist: {currentTestimonial.stylistName}
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Review Title, Stars & Content */}
              <div className="lg:col-span-8 flex flex-col justify-between space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={cn(
                            "h-4 w-4", 
                            i < currentTestimonial.rating ? "text-amber-400 fill-amber-400" : "text-zinc-800"
                          )} 
                        />
                      ))}
                      <span className="ml-2 text-xs font-bold font-mono text-white">5.0 / 5.0</span>
                    </div>

                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px] uppercase font-mono tracking-wider">
                      {currentTestimonial.serviceCategory}
                    </Badge>
                  </div>

                  <h4 className="text-xl md:text-2xl font-serif text-white tracking-tight leading-snug">
                    "{currentTestimonial.reviewTitle}"
                  </h4>

                  <p className="text-sm md:text-base text-zinc-300 font-light leading-relaxed mt-3">
                    {currentTestimonial.content}
                  </p>
                </div>

                {/* Service Tag & Action Bar */}
                <div className="pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-200">
                      <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium">{currentTestimonial.treatment}</span>
                    </div>

                    {currentTestimonial.highlightPerk && (
                      <span className="text-[11px] text-amber-400/90 italic flex items-center gap-1">
                        ★ {currentTestimonial.highlightPerk}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleLike(currentTestimonial.id)}
                      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-primary transition-colors px-2 py-1 rounded hover:bg-zinc-900"
                      title="Helpful Review"
                    >
                      <ThumbsUp className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-mono">{likedReviews[currentTestimonial.id] ? 14 + likedReviews[currentTestimonial.id] : 14}</span>
                    </button>

                    <Button asChild size="sm" className="bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-wider h-9 px-4 gap-1.5 shadow-md">
                      <Link to={`/book?service=${encodeURIComponent(currentTestimonial.treatment)}&stylist=${encodeURIComponent(currentTestimonial.stylistName)}`}>
                        Book This Treatment <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slider Controls Footer (Dots, Prev/Next, Play/Pause) */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10 pt-4 border-t border-border/50">
        {/* Slide Counter & Dots */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-zinc-400">
            <strong className="text-white">{currentIndex + 1}</strong> of <strong>{totalSlides}</strong>
          </span>

          <div className="flex items-center gap-1.5 ml-2">
            {filteredTestimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  currentIndex === idx ? "w-7 bg-primary" : "w-2 bg-zinc-800 hover:bg-zinc-700"
                )}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsPlaying(!isPlaying)}
            className="h-9 px-3 border-zinc-800 bg-background/80 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-full text-xs flex items-center gap-1.5"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 text-primary" />
                <span className="text-[10px] uppercase font-mono">Autoplay On</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-zinc-400" />
                <span className="text-[10px] uppercase font-mono">Paused</span>
              </>
            )}
          </Button>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handlePrev}
              className="h-9 w-9 rounded-full border-zinc-800 bg-background/80 hover:bg-primary hover:text-black hover:border-primary transition-colors"
              aria-label="Previous review"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleNext}
              className="h-9 w-9 rounded-full border-zinc-800 bg-background/80 hover:bg-primary hover:text-black hover:border-primary transition-colors"
              aria-label="Next review"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
