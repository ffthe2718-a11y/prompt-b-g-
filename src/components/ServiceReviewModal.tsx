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
  X,
  MessageSquare
} from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface ServiceReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialServiceName?: string;
  availableServiceNames?: string[];
  onReviewSubmitted?: (review: any) => void;
}

const RATING_LABELS: Record<number, { title: string; desc: string; color: string }> = {
  1: { title: "Needs Improvement", desc: "Service did not meet expectations", color: "text-red-400" },
  2: { title: "Fair Experience", desc: "Average service with room for refinement", color: "text-amber-400" },
  3: { title: "Good Service", desc: "Satisfactory salon experience", color: "text-yellow-400" },
  4: { title: "Very Good & Polished", desc: "High quality technique and great service", color: "text-primary" },
  5: { title: "Exceptional & Regal", desc: "Flawless experience, highly recommended!", color: "text-amber-300" }
};

const HIGHLIGHT_TAGS = [
  "Master Artistry",
  "Flawless Technique",
  "Punctual & Prompt",
  "Clean & Sanitized",
  "Luxury Ambiance",
  "Relaxing Champi",
  "Great Consultation",
  "Expert Colourist",
  "Attentive Stylist"
];

export default function ServiceReviewModal({
  isOpen,
  onClose,
  initialServiceName = "Expert Haircut & Blowdry",
  availableServiceNames = [
    "Expert Haircut & Blowdry",
    "Men's Beard & Hair Grooming",
    "Traditional Ayurvedic Champi",
    "Balayage & Foil Highlights",
    "Global Hair Color & Toning",
    "Keratin Smooth Treatment",
    "24K Gold Revival Facial",
    "Deep Cleansing Scalp Spa",
    "Ayurvedic Herbal Hair Treatment",
    "Shringar Bridal HD Makeup",
    "Bridal Mehendi & Hand Art",
    "Saree & Dupatta Draping"
  ],
  onReviewSubmitted
}: ServiceReviewModalProps) {
  const { user, profile } = useAuth();
  const [selectedService, setSelectedService] = useState<string>(initialServiceName);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [title, setTitle] = useState<string>("");
  const [comment, setComment] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>(["Master Artistry", "Clean & Sanitized"]);
  const [recommend, setRecommend] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialServiceName) {
      setSelectedService(initialServiceName);
      setTitle(`Great experience with ${initialServiceName}`);
    }
  }, [initialServiceName]);

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
      toast.error("Please sign in to write a review.", {
        description: "You can sign in using your Google account in seconds."
      });
      return;
    }

    if (!selectedService.trim()) {
      toast.error("Please select a service to review.");
      return;
    }

    if (!title.trim()) {
      toast.error("Please write a review headline.");
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      toast.error("Please write at least 10 characters in your comments.");
      return;
    }

    setIsSubmitting(true);
    try {
      const targetUserName = user.displayName || profile?.displayName || user.email?.split("@")[0] || "Valued Client";

      const reviewData = {
        shopId: "aurelia-main",
        userId: user.uid,
        userName: targetUserName,
        userPhoto: user.photoURL || "",
        rating: Number(rating),
        title: title.trim(),
        comment: comment.trim(),
        service: selectedService,
        verifiedBooking: true,
        recommend: Boolean(recommend),
        tags: selectedTags,
        helpfulCount: 0,
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "reviews"), reviewData);

      toast.success("Thank you for your feedback!", {
        description: `Your ${rating}-star review for "${selectedService}" was posted successfully.`
      });

      if (onReviewSubmitted) {
        onReviewSubmitted({
          id: docRef.id,
          ...reviewData,
          createdAt: new Date().toISOString()
        });
      }

      // Reset & close
      setComment("");
      setTitle("");
      onClose();
    } catch (err: any) {
      console.error("Error submitting review:", err);
      toast.error("Failed to post review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="w-[calc(100%-24px)] max-w-xl max-h-[90dvh] overflow-y-auto rounded-2xl md:rounded-3xl border-primary/20 bg-background/95 backdrop-blur-2xl p-4 sm:p-6 md:p-8 shadow-2xl">
        <DialogHeader className="space-y-3 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary uppercase tracking-widest w-fit">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Service Feedback & Review</span>
          </div>

          <DialogTitle className="text-2xl font-light tracking-tight text-foreground">
            RATE YOUR <span className="italic font-serif text-primary">SERVICE EXPERIENCE</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
            Share your authentic feedback to help fellow customers discover top salon services.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-2">
          {/* Service Selector */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
              <Scissors className="h-3.5 w-3.5 text-primary" />
              Select Service
            </Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger className="w-full rounded-xl border-border bg-card/60 text-sm">
                <SelectValue placeholder="Choose service..." />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-border bg-card">
                {availableServiceNames.map(s => (
                  <SelectItem key={s} value={s} className="text-xs py-2">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Interactive Star Rating Selection */}
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-card to-background p-5 text-center space-y-3 shadow-inner">
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground block">
              Tap Stars to Rate Performance
            </span>

            <div className="flex items-center justify-center gap-2 py-1">
              {[1, 2, 3, 4, 5].map((starIndex) => {
                const isFilled = starIndex <= displayRating;
                return (
                  <button
                    key={starIndex}
                    type="button"
                    onMouseEnter={() => setHoverRating(starIndex)}
                    onMouseLeave={() => setHoverRating(null)}
                    onClick={() => setRating(starIndex)}
                    className="p-1 transition-transform hover:scale-125 focus:outline-none"
                  >
                    <Star 
                      className={cn(
                        "h-8 w-8 transition-colors duration-200",
                        isFilled 
                          ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]" 
                          : "text-zinc-700 hover:text-zinc-500"
                      )} 
                    />
                  </button>
                );
              })}
            </div>

            <div className="pt-1">
              <span className={cn("text-sm font-bold block", ratingInfo.color)}>
                {displayRating} / 5 ★ — {ratingInfo.title}
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">{ratingInfo.desc}</p>
            </div>
          </div>

          {/* Review Headline & Comment */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="review-title" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Review Headline
              </Label>
              <Input
                id="review-title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Flawless haircut with bouncy blowdry!"
                className="rounded-xl border-border bg-card/60 text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="review-comment" className="text-xs font-semibold uppercase tracking-wider text-foreground">
                Your Comments & Feedback
              </Label>
              <Textarea
                id="review-comment"
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Tell us about the technique, hair finish, staff behavior, cleanliness, and overall satisfaction..."
                rows={3}
                className="rounded-xl border-border bg-card/60 text-xs leading-relaxed"
                required
              />
            </div>
          </div>

          {/* Highlight Tags */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-foreground">
              Highlight Tags
            </Label>
            <div className="flex flex-wrap gap-1.5">
              {HIGHLIGHT_TAGS.map(tag => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={cn(
                      "rounded-full px-3 py-1 text-[10px] font-semibold transition-all border",
                      isSelected
                        ? "border-primary bg-primary/20 text-primary"
                        : "border-border bg-card/40 text-muted-foreground hover:border-zinc-700"
                    )}
                  >
                    {isSelected ? `✓ ${tag}` : `+ ${tag}`}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recommendation Toggle */}
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card/40 p-4">
            <div className="space-y-0.5">
              <span className="text-xs font-bold text-foreground block">
                Would you recommend this service?
              </span>
              <span className="text-[11px] text-muted-foreground block">
                Recommending helps other clients make informed booking decisions.
              </span>
            </div>
            <Switch
              checked={recommend}
              onCheckedChange={setRecommend}
            />
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="rounded-full border-border bg-card/60 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full bg-primary px-8 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting Review...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Submit Feedback
                </span>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
