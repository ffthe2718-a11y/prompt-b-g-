import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  Scissors, 
  Calendar, 
  User, 
  Heart, 
  Award, 
  Loader2, 
  Store,
  MapPin,
  Clock,
  ThumbsUp,
  X
} from "lucide-react";
import { format } from "date-fns";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  getDoc,
  getDocs,
  query,
  where 
} from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export interface ReviewAppointmentData {
  id: string;
  name?: string;
  service?: string;
  stylist?: string;
  shopId?: string;
  date?: string;
  time?: string;
  serviceType?: 'salon' | 'home';
  totalAmount?: number;
}

interface AppointmentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: ReviewAppointmentData | null;
  shopName?: string;
  onReviewSubmitted?: (reviewId: string, rating: number) => void;
}

const RATING_LABELS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: "Needs Improvement", desc: "Service did not meet expectations", color: "text-red-400" },
  2: { title: "Fair Experience", desc: "Average service with room for refinement", color: "text-amber-400" },
  3: { title: "Good Ritual", desc: "Satisfactory salon experience", color: "text-yellow-400" },
  4: { title: "Very Good & Polished", desc: "High quality technique and great service", color: "text-primary" },
  5: { title: "Exceptional & Regal", desc: "Flawless luxury experience, highly recommended!", color: "text-amber-300" }
};

const SUGGESTED_HIGHLIGHT_TAGS = [
  "Master Artistry",
  "Flawless Technique",
  "Punctual & Prompt",
  "Clean & Sanitized",
  "Luxury Ambiance",
  "Relaxing Champi",
  "Great Consultation",
  "Complimentary Refreshment",
  "Authentic Ayurveda",
  "Expert Colourist",
  "Attentive Stylist"
];

export default function AppointmentReviewModal({
  isOpen,
  onClose,
  appointment,
  shopName = "Aurelia Luxe Atelier",
  onReviewSubmitted
}: AppointmentReviewModalProps) {
  const { user, profile } = useAuth();
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "Master Artistry",
    "Clean & Sanitized"
  ]);
  const [recommend, setRecommend] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Initialize or reset form state when modal opens or appointment changes
  useEffect(() => {
    if (appointment) {
      setRating(5);
      setHoverRating(null);
      setTitle(`Exceptional experience with ${appointment.service || "salon treatment"}`);
      setComment("");
      setSelectedTags(["Master Artistry", "Clean & Sanitized"]);
      setRecommend(true);
    }
  }, [appointment]);

  if (!appointment) return null;

  const displayRating = hoverRating !== null ? hoverRating : rating;
  const ratingInfo = RATING_LABELS[displayRating] || RATING_LABELS[5];

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to submit your appointment review.");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a review headline.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Please share your feedback comments.");
      return;
    }

    if (comment.trim().length < 10) {
      toast.error("Please write at least 10 characters to provide helpful feedback.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetShopId = appointment.shopId || "aurelia-luxe-main";
      const targetUserName = user.displayName || profile?.displayName || user.email?.split("@")[0] || "Valued Client";

      const reviewData = {
        shopId: targetShopId,
        userId: user.uid,
        userName: targetUserName,
        userPhoto: user.photoURL || "",
        rating: Number(rating),
        title: title.trim(),
        comment: comment.trim(),
        service: appointment.service || "Salon Treatment",
        appointmentId: appointment.id,
        verifiedBooking: true,
        recommend: Boolean(recommend),
        tags: selectedTags,
        helpfulCount: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "reviews"), reviewData);

      // Award 50 bonus Loyalty Points for verified review
      try {
        await addDoc(collection(db, "loyaltyTransactions"), {
          userId: user.uid,
          points: 50,
          type: "earned",
          description: `Review Bonus: Verified feedback for ${appointment.service || "appointment"}`,
          appointmentId: appointment.id,
          createdAt: serverTimestamp()
        });
      } catch (loyaltyErr) {
        console.warn("Loyalty point credit note:", loyaltyErr);
      }

      // Update shop aggregate rating if accessible
      try {
        const shopsRef = collection(db, "shops");
        const q = query(shopsRef, where("id", "==", targetShopId));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const shopDoc = snap.docs[0];
          const data = shopDoc.data();
          const currentCount = data.ratingCount || 0;
          const currentAvg = data.rating || 5;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + rating) / newCount).toFixed(1));

          await updateDoc(doc(db, "shops", shopDoc.id), {
            rating: newAvg,
            ratingCount: newCount
          });
        }
      } catch (shopErr) {
        console.warn("Shop aggregate score update note:", shopErr);
      }

      toast.success("Review Submitted Successfully!", {
        description: "Thank you! +50 Loyalty Points credited to your profile."
      });

      if (onReviewSubmitted) {
        onReviewSubmitted(docRef.id, rating);
      }
      onClose();
    } catch (error) {
      console.error("Failed to submit appointment review:", error);
      toast.error("Failed to submit review. Please try again.");
      handleFirestoreError(error, OperationType.CREATE, "reviews");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[580px] p-0 overflow-hidden max-h-[92vh] flex flex-col shadow-2xl">
        <DialogHeader className="p-6 pb-4 border-b border-zinc-900 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest font-bold">
              <Sparkles className="h-4 w-4" />
              <span>Post-Appointment Feedback</span>
            </div>
            <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[9px] uppercase font-mono tracking-wider flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> Verified Client
            </Badge>
          </div>

          <DialogTitle className="text-2xl font-serif text-white mt-1">
            Rate Your Beauty Ritual
          </DialogTitle>
          <DialogDescription className="text-xs text-zinc-400">
            Your authentic review helps our master stylists continually elevate luxury services.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6 flex-1">
          {/* Appointment Snapshot Card */}
          <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 flex items-center justify-between gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm truncate">
                  {appointment.service || "Signature Salon Ritual"}
                </span>
                {appointment.stylist && (
                  <Badge variant="outline" className="border-primary/40 text-primary text-[9px] uppercase font-mono">
                    <Scissors className="h-2.5 w-2.5 mr-1" />
                    {appointment.stylist}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-3 text-xs text-zinc-400">
                <span className="flex items-center gap-1">
                  <Store className="h-3 w-3 text-primary" />
                  {shopName}
                </span>
                {appointment.date && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-mono">
                      <Calendar className="h-3 w-3 text-zinc-500" />
                      {format(new Date(appointment.date), "dd MMM yyyy")}
                    </span>
                  </>
                )}
              </div>
            </div>

            <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Award className="h-5 w-5" />
            </div>
          </div>

          {/* Interactive Star Rating Selector */}
          <div className="text-center py-2 space-y-3">
            <Label className="text-xs uppercase tracking-[0.2em] text-zinc-400 font-bold block">
              Overall Experience Rating
            </Label>

            <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = star <= displayRating;
                return (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(null)}
                    className="p-1 rounded-lg transition-transform hover:scale-125 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Rate ${star} out of 5 stars`}
                  >
                    <Star
                      className={cn(
                        "h-8 w-8 sm:h-9 sm:w-9 transition-colors duration-200",
                        isFilled
                          ? "fill-primary text-primary drop-shadow-[0_0_8px_rgba(212,175,55,0.4)]"
                          : "text-zinc-700 hover:text-zinc-500"
                      )}
                    />
                  </button>
                );
              })}
            </div>

            {/* Dynamic Rating Feedback Text */}
            <div className="min-h-[28px]">
              <span className={cn("text-xs font-bold uppercase tracking-wider block", ratingInfo.color)}>
                {displayRating} / 5 ★ • {ratingInfo.title}
              </span>
              <span className="text-[11px] text-zinc-400">
                {ratingInfo.desc}
              </span>
            </div>
          </div>

          {/* Review Headline */}
          <div className="space-y-1.5">
            <Label htmlFor="reviewHeadline" className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
              Review Headline <span className="text-primary">*</span>
            </Label>
            <Input
              id="reviewHeadline"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Majestic balayage styling and soothing scalp care..."
              required
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-sm h-11 focus-visible:ring-primary/40"
            />
          </div>

          {/* Detailed Comments */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="reviewComment" className="text-xs uppercase tracking-widest text-zinc-300 font-bold">
                Detailed Comments & Experience <span className="text-primary">*</span>
              </Label>
              <span className="text-[10px] text-zinc-500 font-mono">
                {comment.length} / 2000 chars
              </span>
            </div>
            <Textarea
              id="reviewComment"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe your ritual: consultation quality, stylist technique, cleanliness, comfort, and results..."
              required
              maxLength={2000}
              className="bg-zinc-900 border-zinc-700 text-white placeholder:text-zinc-500 text-xs sm:text-sm resize-none focus-visible:ring-primary/40 leading-relaxed"
            />
          </div>

          {/* Highlight Tags Selection */}
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold block">
              Highlight Tags (Select all that apply)
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED_HIGHLIGHT_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      "text-[11px] px-3 py-1 rounded-full transition-all border select-none",
                      isSelected
                        ? "bg-primary text-black border-primary font-bold shadow-md shadow-primary/20 scale-[1.02]"
                        : "bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommendation Toggle */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800">
            <div className="space-y-0.5 pr-4">
              <Label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <ThumbsUp className="h-3.5 w-3.5 text-primary" />
                Recommend to Friends & Family?
              </Label>
              <p className="text-[11px] text-zinc-400">
                Let others know if this salon is worth booking for special occasions.
              </p>
            </div>
            <Switch
              checked={recommend}
              onCheckedChange={setRecommend}
            />
          </div>

          <DialogFooter className="pt-4 border-t border-zinc-800 flex sm:justify-between items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !title.trim() || !comment.trim()}
              className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs h-11 px-8 rounded-xl shadow-lg shadow-primary/20 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Publishing Review...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Submit Verified Review</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
