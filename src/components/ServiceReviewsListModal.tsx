import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  ThumbsUp, 
  User, 
  Calendar, 
  X,
  MessageSquare,
  BadgeCheck,
  Scissors
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ServiceReviewItem, ServiceRatingAggregate } from "@/types/serviceReview";
import { cn } from "@/lib/utils";

interface ServiceReviewsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  serviceName: string;
  aggregate?: ServiceRatingAggregate;
  reviews: ServiceReviewItem[];
  onOpenWriteReview?: () => void;
}

export default function ServiceReviewsListModal({
  isOpen,
  onClose,
  serviceName,
  aggregate,
  reviews,
  onOpenWriteReview
}: ServiceReviewsListModalProps) {
  const filteredReviews = reviews.filter(
    r => r.service.trim().toLowerCase() === serviceName.trim().toLowerCase()
  );

  const avgRating = aggregate?.averageRating || (
    filteredReviews.length > 0 
      ? Number((filteredReviews.reduce((sum, r) => sum + r.rating, 0) / filteredReviews.length).toFixed(1))
      : 5.0
  );

  const totalCount = aggregate?.totalReviews || filteredReviews.length;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="w-[calc(100%-24px)] max-w-2xl max-h-[88dvh] overflow-y-auto rounded-2xl md:rounded-3xl border-primary/20 bg-background/95 backdrop-blur-2xl p-4 sm:p-6 md:p-8 shadow-2xl custom-scrollbar">
        <DialogHeader className="space-y-3 text-left border-b border-border/60 pb-6">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary uppercase tracking-widest">
              <Scissors className="h-3.5 w-3.5" />
              <span>Service Ratings & Client Reviews</span>
            </div>
          </div>

          <DialogTitle className="text-2xl font-light tracking-tight text-foreground">
            REVIEWS FOR <span className="italic font-serif text-primary">{serviceName}</span>
          </DialogTitle>

          {/* Rating Summary Bar */}
          <div className="rounded-2xl border border-primary/20 bg-card/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-amber-400 font-bold text-2xl font-serif">
                {avgRating}
              </div>
              <div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star 
                      key={s} 
                      className={cn(
                        "h-4 w-4", 
                        s <= Math.round(avgRating) 
                          ? "fill-amber-400 text-amber-400" 
                          : "text-zinc-700"
                      )} 
                    />
                  ))}
                  <span className="text-xs font-bold text-foreground ml-1.5">{avgRating} / 5</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Based on {totalCount} verified customer ratings
                </p>
              </div>
            </div>

            {onOpenWriteReview && (
              <Button
                onClick={() => {
                  onClose();
                  onOpenWriteReview();
                }}
                className="w-full sm:w-auto rounded-full bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-black hover:bg-primary/90 shadow-md shadow-primary/20"
              >
                <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                Write Feedback
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* Reviews List */}
        <div className="space-y-4 pt-4">
          {filteredReviews.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <MessageSquare className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-semibold text-foreground">No customer reviews yet for this service.</p>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Be the first customer to leave a 5-star review and share your feedback!
              </p>
              {onOpenWriteReview && (
                <Button
                  onClick={() => {
                    onClose();
                    onOpenWriteReview();
                  }}
                  variant="outline"
                  className="rounded-full border-primary/30 text-xs font-bold uppercase tracking-wider text-primary mt-2"
                >
                  Write First Review
                </Button>
              )}
            </div>
          ) : (
            filteredReviews.map((rev) => (
              <motion.div
                key={rev.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-border bg-card/60 p-5 space-y-3 shadow-sm hover:border-border/80 transition-all"
              >
                {/* Header: User Avatar, Name, Rating */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {rev.userPhoto ? (
                      <img 
                        src={rev.userPhoto} 
                        alt={rev.userName} 
                        className="h-10 w-10 rounded-full object-cover border border-primary/20"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary/10 border border-primary/30 text-primary font-bold text-xs">
                        {rev.userName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{rev.userName}</span>
                        {rev.verifiedBooking && (
                          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px] px-2 py-0.5 flex items-center gap-1">
                            <BadgeCheck className="h-3 w-3" />
                            Verified Client
                          </Badge>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Reviewed for {rev.service}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold text-amber-400">{rev.rating}.0</span>
                  </div>
                </div>

                {/* Review Title & Body */}
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-foreground">{rev.title}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>
                </div>

                {/* Tags & Recommendations */}
                {rev.tags && rev.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {rev.tags.map((t, idx) => (
                      <span key={idx} className="rounded-md bg-zinc-800/80 px-2 py-0.5 text-[10px] text-zinc-300 border border-zinc-700/50">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
