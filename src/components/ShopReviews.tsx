import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  CheckCircle2, 
  ShieldCheck, 
  ThumbsUp, 
  MessageSquare, 
  Sparkles, 
  Filter, 
  SlidersHorizontal, 
  Scissors, 
  Calendar, 
  User, 
  Plus, 
  X,
  Trash2,
  Award,
  ChevronDown
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  deleteDoc, 
  increment,
  getDocs 
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/AuthModal";

export interface ReviewItem {
  id: string;
  shopId: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  title: string;
  comment: string;
  service?: string;
  appointmentId?: string;
  verifiedBooking?: boolean;
  recommend?: boolean;
  tags?: string[];
  helpfulCount?: number;
  createdAt: any;
}

interface ShopReviewsProps {
  shopId: string;
  shopName: string;
  shopSlug?: string;
  services?: { name: string; price?: string; description?: string }[];
  targetAppointmentId?: string;
  onReviewSubmitted?: (newRating: number, newCount: number) => void;
  className?: string;
}

const HIGHLIGHT_TAGS = [
  "Master Barber",
  "Flawless Fade",
  "Punctual & Prompt",
  "Luxury Ambiance",
  "Relaxing Treatment",
  "Complimentary Drink",
  "Clean & Hygienic",
  "Expert Consultation",
  "Great Value"
];

const RATING_DESCRIPTIONS: Record<number, string> = {
  1: "Disappointing — Did not meet expectations",
  2: "Fair — Needs notable improvement",
  3: "Good — Satisfactory service",
  4: "Very Good — High quality & professional",
  5: "Exceptional — Flawless luxury experience"
};

export default function ShopReviews({
  shopId,
  shopName,
  shopSlug,
  services = [],
  targetAppointmentId,
  onReviewSubmitted,
  className
}: ShopReviewsProps) {
  const { user, isAdmin } = useAuth();
  
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // User appointments at this shop for verification
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [checkingBookings, setCheckingBookings] = useState(false);
  
  // Helpful votes tracked in session to prevent duplicate clicks
  const [votedHelpful, setVotedHelpful] = useState<Record<string, boolean>>({});

  // Filter & Sort states
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [filterVerifiedOnly, setFilterVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest" | "helpful">("newest");

  // Form states
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [customService, setCustomService] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");

  // Seed reviews for new shops to provide rich UI immediately
  const seedReviews: ReviewItem[] = useMemo(() => [
    {
      id: "seed-1",
      shopId,
      userId: "client-seed-1",
      userName: "Alexander Vance",
      userPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
      rating: 5,
      title: "The pinnacle of executive grooming",
      comment: "Stepped in for a signature cut and luxury hot towel shave. The attention to detail, precision fade, and soothing scalp massage were unmatched. Truly a world-class luxury barbershop experience.",
      service: services[0]?.name || "Signature Haircut & Beard Sculpt",
      verifiedBooking: true,
      recommend: true,
      tags: ["Master Barber", "Luxury Ambiance", "Punctual & Prompt"],
      helpfulCount: 14,
      createdAt: { toDate: () => new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) }
    },
    {
      id: "seed-2",
      shopId,
      userId: "client-seed-2",
      userName: "Devon Chen",
      userPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
      rating: 5,
      title: "Impeccable service and warm hospitality",
      comment: "From the complimentary espresso on arrival to the meticulous scissor work, every moment was effortless. They listened carefully to what I wanted and tailored the style to my head shape perfectly.",
      service: services[1]?.name || "Traditional Champi & Hair Styling",
      verifiedBooking: true,
      recommend: true,
      tags: ["Clean & Hygienic", "Expert Consultation", "Relaxing Treatment"],
      helpfulCount: 9,
      createdAt: { toDate: () => new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) }
    },
    {
      id: "seed-3",
      shopId,
      userId: "client-seed-3",
      userName: "Marcus Sterling",
      userPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      rating: 4,
      title: "Great technique & clean atmosphere",
      comment: "Very pleased with the razor sharp lines and beard hydration treatment. Clean shop with pleasant music and zero rushing. Will definitely re-book for my next routine grooming.",
      service: services[0]?.name || "Signature Beard Sculpting",
      verifiedBooking: true,
      recommend: true,
      tags: ["Flawless Fade", "Great Value"],
      helpfulCount: 4,
      createdAt: { toDate: () => new Date(Date.now() - 15 * 24 * 60 * 60 * 1000) }
    }
  ], [shopId, services]);

  // Fetch real reviews from Firestore
  useEffect(() => {
    if (!shopId) return;

    const reviewsRef = collection(db, "reviews");
    const q = query(
      reviewsRef,
      where("shopId", "==", shopId)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ReviewItem[];

        // Sort on client side to avoid needing composite indexes
        docs.sort((a, b) => {
          const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return timeB - timeA;
        });

        setReviews(docs);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching reviews:", error);
        handleFirestoreError(error, OperationType.LIST, "reviews");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [shopId]);

  // Check if current user has appointment history with this shop
  useEffect(() => {
    if (!user || !shopId) {
      setUserBookings([]);
      return;
    }

    const checkUserBookings = async () => {
      setCheckingBookings(true);
      try {
        const q = query(
          collection(db, "customers"),
          where("userId", "==", user.uid),
          where("shopId", "==", shopId)
        );
        const snap = await getDocs(q);
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
        setUserBookings(docs);

        // Pre-select service or appointment if target passed
        if (targetAppointmentId) {
          const match = docs.find((b: any) => b.id === targetAppointmentId);
          if (match) {
            setSelectedAppointmentId(match.id);
            if (match.service) setSelectedService(match.service);
            setIsWriteModalOpen(true);
          }
        } else if (docs.length > 0 && !selectedService) {
          setSelectedAppointmentId(docs[0].id);
          if (docs[0].service) setSelectedService(docs[0].service);
        }
      } catch (err) {
        console.error("Error querying customer bookings:", err);
      } finally {
        setCheckingBookings(false);
      }
    };

    checkUserBookings();
  }, [user, shopId, targetAppointmentId]);

  // Combined review pool: if no Firestore reviews, use seed; if Firestore has reviews, use Firestore reviews
  const displayedReviewsPool = useMemo(() => {
    if (reviews.length > 0) return reviews;
    return seedReviews;
  }, [reviews, seedReviews]);

  // Compute stats
  const stats = useMemo(() => {
    const list = displayedReviewsPool;
    if (list.length === 0) {
      return {
        avgRating: 5.0,
        totalReviews: 0,
        recommendRate: 100,
        breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        breakdownPct: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const total = list.length;
    const sum = list.reduce((acc, r) => acc + (r.rating || 5), 0);
    const avg = Number((sum / total).toFixed(1));

    const recCount = list.filter(r => r.recommend !== false).length;
    const recRate = Math.round((recCount / total) * 100);

    const breakdown: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach(r => {
      const rClamped = Math.min(5, Math.max(1, Math.round(r.rating || 5)));
      breakdown[rClamped] = (breakdown[rClamped] || 0) + 1;
    });

    const breakdownPct: Record<number, number> = {
      5: Math.round((breakdown[5] / total) * 100),
      4: Math.round((breakdown[4] / total) * 100),
      3: Math.round((breakdown[3] / total) * 100),
      2: Math.round((breakdown[2] / total) * 100),
      1: Math.round((breakdown[1] / total) * 100),
    };

    return {
      avgRating: avg,
      totalReviews: total,
      recommendRate: recRate,
      breakdown,
      breakdownPct
    };
  }, [displayedReviewsPool]);

  // Filtered and sorted reviews
  const filteredReviews = useMemo(() => {
    let list = [...displayedReviewsPool];

    if (filterRating !== null) {
      list = list.filter(r => Math.round(r.rating) === filterRating);
    }

    if (filterVerifiedOnly) {
      list = list.filter(r => r.verifiedBooking);
    }

    list.sort((a, b) => {
      if (sortBy === "highest") return (b.rating || 0) - (a.rating || 0);
      if (sortBy === "lowest") return (a.rating || 0) - (b.rating || 0);
      if (sortBy === "helpful") return (b.helpfulCount || 0) - (a.helpfulCount || 0);
      // Newest
      const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
      const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
      return timeB - timeA;
    });

    return list;
  }, [displayedReviewsPool, filterRating, filterVerifiedOnly, sortBy]);

  // Handle helpful vote
  const handleHelpfulVote = async (review: ReviewItem) => {
    if (votedHelpful[review.id]) {
      toast.info("You've already marked this review as helpful!");
      return;
    }

    setVotedHelpful(prev => ({ ...prev, [review.id]: true }));
    toast.success("Thank you for your feedback!");

    // If it's a seed review, just update local state
    if (review.id.startsWith("seed-")) {
      return;
    }

    try {
      const docRef = doc(db, "reviews", review.id);
      await updateDoc(docRef, {
        helpfulCount: increment(1)
      });
    } catch (err) {
      console.error("Failed to increment helpful count:", err);
    }
  };

  // Handle delete review (for author or admin)
  const handleDeleteReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to remove this review?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Review removed successfully.");
    } catch (err) {
      toast.error("Failed to delete review.");
      handleFirestoreError(err, OperationType.DELETE, `reviews/${reviewId}`);
    }
  };

  // Toggle highlight tag
  const handleToggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  // Submit new review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to share your experience.");
      return;
    }

    if (!title.trim() || !comment.trim()) {
      toast.error("Please provide both a review headline and detailed comments.");
      return;
    }

    if (comment.trim().length < 15) {
      toast.error("Please write at least 15 characters to provide helpful detail for other clients.");
      return;
    }

    const finalService = selectedService === "other" 
      ? customService.trim() || "Bespoke Service" 
      : selectedService || services[0]?.name || "Salon Service";

    setIsSubmitting(true);

    try {
      const isVerified = userBookings.length > 0;
      const newReviewData = {
        shopId,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Valued Client",
        userPhoto: user.photoURL || "",
        rating: Number(rating),
        title: title.trim(),
        comment: comment.trim(),
        service: finalService,
        appointmentId: selectedAppointmentId || null,
        verifiedBooking: isVerified,
        recommend: Boolean(recommend),
        tags: selectedTags,
        helpfulCount: 0,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "reviews"), newReviewData);

      // Attempt to update the shop aggregate score if possible
      try {
        const newTotalCount = stats.totalReviews + 1;
        const newAvg = Number(((stats.avgRating * stats.totalReviews + rating) / newTotalCount).toFixed(1));
        const shopRef = doc(db, "shops", shopId);
        await updateDoc(shopRef, {
          rating: newAvg,
          ratingCount: newTotalCount
        });
        if (onReviewSubmitted) {
          onReviewSubmitted(newAvg, newTotalCount);
        }
      } catch (shopUpdateErr) {
        // Non-fatal if shop doc update rules differ
        console.log("Shop aggregate rating update skipped/deferred:", shopUpdateErr);
      }

      toast.success("Review published! Thank you for sharing your experience.");
      
      // Reset form
      setTitle("");
      setComment("");
      setSelectedTags([]);
      setRating(5);
      setIsWriteModalOpen(false);
    } catch (error) {
      console.error("Failed to post review:", error);
      toast.error("Failed to submit review. Please try again.");
      handleFirestoreError(error, OperationType.CREATE, "reviews");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className={cn("py-20 px-4 bg-zinc-950 border-t border-zinc-900", className)}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-xs uppercase tracking-[0.3em] font-bold text-primary">
                Client Experiences
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight italic text-white">
              Reviews & <span className="text-primary">Ratings</span>
            </h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-xl">
              Authentic feedback from verified clients who have experienced {shopName}'s bespoke craftsmanship.
            </p>
          </div>

          <div>
            {user ? (
              <Button
                onClick={() => setIsWriteModalOpen(true)}
                className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-none shadow-lg shadow-primary/20 flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Write a Review
              </Button>
            ) : (
              <AuthModal
                trigger={
                  <Button className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs h-12 px-6 rounded-none shadow-lg shadow-primary/20 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Sign In to Review
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Verified Booking Banner for logged in user */}
        {user && userBookings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10 p-4 rounded-xl border border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  Verified Visit Detected
                  <Badge variant="outline" className="text-[9px] border-primary/40 text-primary uppercase py-0 px-1.5">
                    {userBookings.length} {userBookings.length === 1 ? "Appointment" : "Appointments"}
                  </Badge>
                </p>
                <p className="text-xs text-zinc-400">
                  Your feedback will receive the gold <span className="text-primary font-medium">Verified Client</span> trust badge.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setIsWriteModalOpen(true)}
              size="sm"
              className="bg-primary text-black hover:bg-primary/90 text-xs uppercase tracking-widest font-bold shrink-0 rounded-none h-9 px-4"
            >
              Review Your Visit
            </Button>
          </motion.div>
        )}

        {/* Rating Breakdown & Summary Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 bg-black/60 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm">
          
          {/* Main Average Score */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center text-center p-6 border-b lg:border-b-0 lg:border-r border-zinc-800/80">
            <div className="text-6xl md:text-7xl font-black text-primary font-mono tracking-tighter">
              {stats.avgRating.toFixed(1)}
            </div>
            
            <div className="flex items-center gap-1.5 my-3">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={cn(
                    "h-5 w-5",
                    s <= Math.round(stats.avgRating)
                      ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
                      : "text-zinc-800"
                  )}
                />
              ))}
            </div>

            <p className="text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">
              Based on {stats.totalReviews} {stats.totalReviews === 1 ? "Review" : "Reviews"}
            </p>
            
            <div className="inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              <CheckCircle2 className="h-3 w-3" />
              <span>{stats.recommendRate}% recommend this salon</span>
            </div>
          </div>

          {/* Histogram / Rating Bars */}
          <div className="lg:col-span-8 flex flex-col justify-center gap-2.5 px-2 md:px-6">
            <div className="flex items-center justify-between text-xs uppercase tracking-widest text-zinc-400 font-bold mb-1">
              <span>Rating Breakdown</span>
              <span className="text-[10px] text-zinc-500 font-normal">Click any bar to filter</span>
            </div>

            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats.breakdown[stars] || 0;
              const pct = stats.breakdownPct[stars] || 0;
              const isSelected = filterRating === stars;

              return (
                <button
                  key={stars}
                  type="button"
                  onClick={() => setFilterRating(isSelected ? null : stars)}
                  className={cn(
                    "group flex items-center gap-4 text-xs transition-all w-full text-left py-1 px-2 rounded-lg hover:bg-zinc-900/60",
                    isSelected && "bg-primary/10 border border-primary/30"
                  )}
                >
                  <div className="flex items-center gap-1 w-14 shrink-0 font-mono font-bold text-zinc-300 group-hover:text-primary">
                    <span>{stars}</span>
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                  </div>

                  <div className="flex-1 h-2.5 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, ease: "easeOut" }}
                      className={cn(
                        "h-full rounded-full transition-all",
                        stars === 5 ? "bg-primary shadow-[0_0_8px_rgba(234,179,8,0.4)]" :
                        stars === 4 ? "bg-amber-400" :
                        stars === 3 ? "bg-amber-600" :
                        stars === 2 ? "bg-orange-500" : "bg-red-500"
                      )}
                    />
                  </div>

                  <div className="w-12 text-right shrink-0 font-mono text-[11px] text-zinc-400 group-hover:text-white">
                    {pct}%
                  </div>

                  <div className="w-8 text-right shrink-0 text-[10px] text-zinc-600 font-mono">
                    ({count})
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter & Sort Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-900">
          
          {/* Quick Filter Tags */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant={filterRating === null && !filterVerifiedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setFilterRating(null);
                setFilterVerifiedOnly(false);
              }}
              className={cn(
                "rounded-full text-[10px] uppercase tracking-widest font-bold h-7 px-3.5 border-zinc-800",
                filterRating === null && !filterVerifiedOnly
                  ? "bg-primary text-black"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              All Reviews ({displayedReviewsPool.length})
            </Button>

            {[5, 4, 3].map((starNum) => (
              <Button
                key={starNum}
                variant={filterRating === starNum ? "default" : "outline"}
                size="sm"
                onClick={() => setFilterRating(filterRating === starNum ? null : starNum)}
                className={cn(
                  "rounded-full text-[10px] uppercase tracking-widest font-bold h-7 px-3 border-zinc-800 flex items-center gap-1",
                  filterRating === starNum
                    ? "bg-primary text-black"
                    : "bg-zinc-900 text-zinc-400 hover:text-white"
                )}
              >
                <span>{starNum}</span>
                <Star className="h-3 w-3 fill-current" />
              </Button>
            ))}

            <Button
              variant={filterVerifiedOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterVerifiedOnly(!filterVerifiedOnly)}
              className={cn(
                "rounded-full text-[10px] uppercase tracking-widest font-bold h-7 px-3 border-zinc-800 flex items-center gap-1",
                filterVerifiedOnly
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              <ShieldCheck className="h-3 w-3" />
              Verified Only
            </Button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Sort By:</span>
            <Select value={sortBy} onValueChange={(val: any) => setSortBy(val)}>
              <SelectTrigger className="w-[150px] h-8 bg-zinc-900 border-zinc-800 text-xs font-medium text-white focus:ring-primary rounded-lg">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                <SelectItem value="newest">Most Recent</SelectItem>
                <SelectItem value="highest">Highest Rating</SelectItem>
                <SelectItem value="lowest">Lowest Rating</SelectItem>
                <SelectItem value="helpful">Most Helpful</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Active Filters Pill display */}
        {(filterRating !== null || filterVerifiedOnly) && (
          <div className="flex items-center gap-2 mb-6">
            <span className="text-xs text-zinc-500">Active filters:</span>
            {filterRating !== null && (
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] flex items-center gap-1">
                {filterRating} Stars
                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterRating(null)} />
              </Badge>
            )}
            {filterVerifiedOnly && (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-400 text-[10px] flex items-center gap-1">
                Verified Appointments
                <X className="h-3 w-3 cursor-pointer" onClick={() => setFilterVerifiedOnly(false)} />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterRating(null);
                setFilterVerifiedOnly(false);
              }}
              className="text-[10px] text-zinc-400 hover:text-white h-6 px-2"
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="py-16 text-center text-primary font-mono tracking-widest text-xs animate-pulse">
            LOADING CLIENT EXPERIENCES...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-zinc-800 rounded-2xl bg-black/40 p-8">
            <MessageSquare className="h-10 w-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-white font-bold text-base mb-1">No reviews matching your filter criteria</p>
            <p className="text-xs text-zinc-500 mb-6">Try resetting your star or verified filters to see all reviews.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilterRating(null);
                setFilterVerifiedOnly(false);
              }}
              className="border-zinc-800 text-xs uppercase tracking-widest text-primary hover:bg-zinc-900"
            >
              Reset Filters
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <AnimatePresence mode="popLayout">
              {filteredReviews.map((rev, index) => {
                const isAuthor = user?.uid === rev.userId;
                const formattedDate = rev.createdAt?.toDate 
                  ? formatDistanceToNow(rev.createdAt.toDate(), { addSuffix: true })
                  : "Recently";

                return (
                  <motion.div
                    key={rev.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="p-6 md:p-7 rounded-2xl border border-zinc-800/80 bg-zinc-950/70 hover:border-zinc-700/80 transition-all shadow-md group relative overflow-hidden"
                  >
                    {/* Top Row: User Avatar, Name, Rating & Badges */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3.5">
                        {rev.userPhoto ? (
                          <img
                            src={rev.userPhoto}
                            alt={rev.userName}
                            className="h-11 w-11 rounded-full object-cover border border-primary/30"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center text-primary font-bold text-sm">
                            {rev.userName ? rev.userName.charAt(0).toUpperCase() : "C"}
                          </div>
                        )}

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-white text-sm tracking-tight">{rev.userName}</h4>
                            {rev.verifiedBooking && (
                              <TooltipProvider>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold uppercase tracking-wider">
                                  <ShieldCheck className="h-3 w-3" />
                                  Verified Client
                                </span>
                              </TooltipProvider>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                            <span>{formattedDate}</span>
                            {rev.service && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-zinc-400">
                                  <Scissors className="h-2.5 w-2.5 text-primary" />
                                  {rev.service}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Stars Display & Actions */}
                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={cn(
                                "h-4 w-4",
                                s <= rev.rating
                                  ? "text-yellow-400 fill-yellow-400"
                                  : "text-zinc-800"
                              )}
                            />
                          ))}
                        </div>

                        {(isAuthor || isAdmin) && !rev.id.startsWith("seed-") && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteReview(rev.id)}
                            className="h-7 w-7 text-zinc-600 hover:text-red-400 opacity-60 hover:opacity-100 transition-opacity"
                            title="Delete review"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Headline / Title */}
                    {rev.title && (
                      <h5 className="text-base font-bold text-white mb-2 tracking-tight group-hover:text-primary transition-colors">
                        "{rev.title}"
                      </h5>
                    )}

                    {/* Comment Body */}
                    <p className="text-sm text-zinc-300 leading-relaxed font-light mb-4">
                      {rev.comment}
                    </p>

                    {/* Tag Pills */}
                    {rev.tags && rev.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        {rev.tags.map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Row: Helpful Button & Recommendation */}
                    <div className="flex items-center justify-between pt-3 border-t border-zinc-900 text-xs">
                      <div className="flex items-center gap-2">
                        {rev.recommend !== false && (
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400/90 font-medium">
                            <CheckCircle2 className="h-3 w-3" />
                            Recommends this salon
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleHelpfulVote(rev)}
                        disabled={votedHelpful[rev.id]}
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full transition-all border",
                          votedHelpful[rev.id]
                            ? "border-primary/40 bg-primary/10 text-primary font-bold"
                            : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700"
                        )}
                      >
                        <ThumbsUp className="h-3 w-3" />
                        <span>Helpful ({rev.helpfulCount || 0})</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Modal: Write a Review */}
        <Dialog open={isWriteModalOpen} onOpenChange={setIsWriteModalOpen}>
          <DialogContent className="sm:max-w-[620px] bg-zinc-950 border-zinc-800 text-white p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-zinc-900">
              <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest font-bold mb-1">
                <Sparkles className="h-3.5 w-3.5" />
                Share Your Experience
              </div>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight italic">
                Review <span className="text-primary">{shopName}</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400">
                Help future clients discover what makes your appointment special.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmitReview} className="overflow-y-auto p-6 space-y-6 flex-1">
              
              {/* Verified Badge notification inside form */}
              {userBookings.length > 0 && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-white">Verified Client Status: </span>
                    <span className="text-emerald-300">
                      Your booking history confirms your visit. Your review will display the verified seal.
                    </span>
                  </div>
                </div>
              )}

              {/* Interactive Star Rating Selector */}
              <div className="space-y-2 text-center p-5 rounded-xl bg-zinc-900/50 border border-zinc-800">
                <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold block">
                  Overall Rating
                </Label>
                
                <div className="flex items-center justify-center gap-2 py-2">
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const activeRating = hoverRating || rating;
                    const isFilled = starNum <= activeRating;

                    return (
                      <button
                        key={starNum}
                        type="button"
                        onMouseEnter={() => setHoverRating(starNum)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(starNum)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "h-8 w-8 transition-colors",
                            isFilled
                              ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.6)]"
                              : "text-zinc-700 hover:text-yellow-500/50"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs font-semibold text-primary h-5 transition-all">
                  {RATING_DESCRIPTIONS[hoverRating || rating]}
                </p>
              </div>

              {/* Service Selection */}
              <div className="space-y-2">
                <Label htmlFor="review-service" className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  Service Experienced
                </Label>
                <Select
                  value={selectedService}
                  onValueChange={(val) => setSelectedService(val)}
                >
                  <SelectTrigger id="review-service" className="bg-zinc-900 border-zinc-800 text-sm h-11 text-white">
                    <SelectValue placeholder="Select the service you received" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    {services.map((s, idx) => (
                      <SelectItem key={idx} value={s.name}>
                        {s.name} {s.price ? `(${s.price})` : ""}
                      </SelectItem>
                    ))}
                    {services.length === 0 && (
                      <>
                        <SelectItem value="Signature Haircut">Signature Haircut</SelectItem>
                        <SelectItem value="Beard Sculpting & Hot Towel">Beard Sculpting & Hot Towel</SelectItem>
                        <SelectItem value="Ayurvedic Head Massage">Ayurvedic Head Massage</SelectItem>
                        <SelectItem value="Complete Royal Treatment">Complete Royal Treatment</SelectItem>
                      </>
                    )}
                    <SelectItem value="other">Other / Custom Service</SelectItem>
                  </SelectContent>
                </Select>

                {selectedService === "other" && (
                  <Input
                    placeholder="Enter custom service name"
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    className="bg-zinc-900 border-zinc-800 text-sm mt-2 text-white"
                  />
                )}
              </div>

              {/* Review Title */}
              <div className="space-y-2">
                <Label htmlFor="review-title" className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  Headline / Title
                </Label>
                <Input
                  id="review-title"
                  placeholder="e.g. Masterful precision cut & luxury hospitality"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-800 text-sm h-11 text-white"
                />
              </div>

              {/* Review Comments */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="review-comment" className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                    Detailed Experience
                  </Label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {comment.length} / 500 characters
                  </span>
                </div>
                <Textarea
                  id="review-comment"
                  placeholder="Describe the consultation, barber technique, cleanliness, comfort, and results..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  required
                  maxLength={500}
                  className="bg-zinc-900 border-zinc-800 text-sm text-white resize-none"
                />
              </div>

              {/* Tag Highlights */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold block">
                  Highlight Tags (Select all that apply)
                </Label>
                <div className="flex flex-wrap gap-2">
                  {HIGHLIGHT_TAGS.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={cn(
                          "text-xs px-3 py-1.5 rounded-full transition-all border",
                          isSelected
                            ? "bg-primary text-black border-primary font-bold shadow-md shadow-primary/20"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommend Salon Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-white">
                    Recommend this salon to others?
                  </Label>
                  <p className="text-[11px] text-zinc-400">
                    Would you advise friends or colleagues to book here?
                  </p>
                </div>
                <Switch
                  checked={recommend}
                  onCheckedChange={setRecommend}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-zinc-900 flex sm:justify-between items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsWriteModalOpen(false)}
                  className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !title.trim() || !comment.trim()}
                  className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs h-11 px-8 rounded-none shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? "Publishing..." : "Submit Review"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </section>
  );
}

// Minimal tooltip provider helper to keep code clean and self-contained
function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
