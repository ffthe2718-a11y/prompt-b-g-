import { useEffect, useMemo, useState } from "react";
import type { Review, Salon } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { initials } from "@/lib/salonUi";
import { toast } from "sonner";
import { Eye, EyeOff, MessageSquare, Reply, Star, Trash2 } from "lucide-react";
import {
  EmptyState,
  Field,
  Modal,
  Panel,
  SavingButton,
  SectionHeading,
  textareaClass,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

function StarRow({ rating, size = 3 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(size === 3 ? "h-3 w-3" : "h-3.5 w-3.5", value <= Math.round(rating) ? "fill-primary text-primary" : "text-border")}
        />
      ))}
    </div>
  );
}

export default function Reviews({ salon, refresh }: { salon: Salon; refresh: () => Promise<void> }) {
  const [filter, setFilter] = useState<"all" | "published" | "hidden">("all");
  const [replying, setReplying] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // The dashboard bundle carries reviews, but re-reading the collection keeps
  // this screen honest when a client posts a review while it is open.
  const [reviews, setReviews] = useState<Review[]>(salon.reviews);

  useEffect(() => {
    setReviews(salon.reviews);
  }, [salon.reviews]);

  useEffect(() => {
    let alive = true;
    salonApi
      .listReviews()
      .then((data) => {
        if (alive) setReviews(data.reviews);
      })
      .catch(() => {
        /* the bundled reviews remain usable */
      });
    return () => {
      alive = false;
    };
  }, []);

  const sorted = useMemo(
    () => [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [reviews]
  );

  const published = sorted.filter((review) => review.status === "published");
  const average = published.length
    ? published.reduce((sum, review) => sum + review.rating, 0) / published.length
    : 0;
  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: published.filter((review) => review.rating === rating).length,
  }));

  const visible = sorted.filter((review) => filter === "all" || review.status === filter);

  const toggleVisibility = async (review: Review) => {
    const next = review.status === "published" ? "hidden" : "published";
    setPendingId(review.id);
    try {
      await salonApi.updateReview(review.id, { status: next });
      toast.success(next === "published" ? "Review is now public." : "Review hidden from your website.");
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not update this review.");
    } finally {
      setPendingId(null);
    }
  };

  const openReply = (review: Review) => {
    setReplying(review);
    setReplyText(review.ownerReply || "");
  };

  const saveReply = async () => {
    if (!replying) return;
    setReplyBusy(true);
    try {
      await salonApi.updateReview(replying.id, { ownerReply: replyText.trim() });
      toast.success(replyText.trim() ? "Reply published." : "Reply removed.");
      setReplying(null);
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not save your reply.");
    } finally {
      setReplyBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await salonApi.deleteReview(deleting.id);
      toast.success("Review removed.");
      setDeleting(null);
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not remove this review.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeading
          title="Client reviews"
          description="Reviews build trust before a client ever calls. Reply once, politely and specifically — it is read by everyone who follows."
        />
        <div className="mt-5 grid gap-4 sm:grid-cols-[200px_1fr]">
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background/40 p-4 text-center">
            <p className="font-serif text-4xl text-primary">{average ? average.toFixed(1) : "—"}</p>
            <div className="mt-1.5">
              <StarRow rating={average} size={4} />
            </div>
            <p className="mt-1.5 text-[9px] text-muted-foreground">
              {published.length} public review{published.length === 1 ? "" : "s"}
              {reviews.length !== published.length ? ` · ${reviews.length - published.length} hidden` : ""}
            </p>
          </div>
          <div className="space-y-1.5">
            {distribution.map((row) => (
              <div key={row.rating} className="flex items-center gap-2">
                <span className="w-3 text-[9px] text-muted-foreground">{row.rating}</span>
                <Star className="h-2.5 w-2.5 fill-primary/70 text-primary/70" />
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary/70"
                    style={{ width: `${published.length ? (row.count / published.length) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-4 text-right text-[9px] text-muted-foreground">{row.count}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>

      <div className="flex items-center gap-1.5">
        {(["all", "published", "hidden"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] capitalize transition-colors",
              filter === tab?.toString() ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {tab} · {tab === "all" ? reviews.length : reviews.filter((review) => review.status === tab).length}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-5 w-5" />}
          title={reviews.length === 0 ? "No reviews yet" : "Nothing in this view"}
          description={
            reviews.length === 0
              ? "Reviews arrive through your public website. Once clients have visited, share your link and invite them to leave a note — real testimonials outperform anything you could write yourself."
              : "Switch filters to see the rest of your reviews."
          }
        />
      ) : (
        <div className="space-y-3">
          {visible.map((review) => (
            <Panel key={review.id} className={cn("transition-opacity", review.status === "hidden" && "opacity-60")}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-[10px] font-bold text-primary">
                    {initials(review.authorName)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[11px] font-semibold text-foreground">{review.authorName}</p>
                      <StarRow rating={review.rating} />
                      {review.status === "hidden" && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                          Hidden
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[8px] uppercase tracking-[0.1em] text-muted-foreground">
                      {new Date(review.createdAt).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                    {review.title && <p className="mt-2 text-[11px] font-medium text-foreground">{review.title}</p>}
                    <p className="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-muted-foreground">{review.comment}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-start">
                  <button
                    onClick={() => openReply(review)}
                    className="inline-flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                  >
                    <Reply className="h-3 w-3" /> {review.ownerReply ? "Edit reply" : "Reply"}
                  </button>
                  <button
                    onClick={() => void toggleVisibility(review)}
                    disabled={pendingId === review.id}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary disabled:opacity-50"
                    aria-label={review.status === "published" ? "Hide review" : "Publish review"}
                    title={review.status === "published" ? "Hide from website" : "Show on website"}
                  >
                    {review.status === "published" ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => setDeleting(review)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                    aria-label="Delete review"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>

              {review.ownerReply && (
                <div className="mt-3 rounded-xl border-l-2 border-primary/50 bg-primary/[0.04] px-3.5 py-2.5">
                  <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-primary">Your reply</p>
                  <p className="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-foreground/80">{review.ownerReply}</p>
                </div>
              )}
            </Panel>
          ))}
        </div>
      )}

      <Modal
        open={Boolean(replying)}
        onClose={() => setReplying(null)}
        title="Reply to this review"
        description={replying ? `${replying.authorName} · ${replying.rating} star${replying.rating === 1 ? "" : "s"}` : undefined}
        footer={
          <>
            <button
              onClick={() => setReplying(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton saving={replyBusy} onClick={() => void saveReply()}>
              {replyText.trim() ? "Publish reply" : "Remove reply"}
            </SavingButton>
          </>
        }
      >
        <div className="space-y-3">
          {replying && (
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <StarRow rating={replying.rating} />
              <p className="mt-1.5 text-[10px] leading-relaxed text-muted-foreground">{replying.comment}</p>
            </div>
          )}
          <Field label="Your public reply" hint="Keep it warm and specific. Thank them by name if you like.">
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Thank you for taking the time to share this…"
              className={cn(textareaClass, "min-h-28")}
              autoFocus
            />
          </Field>
          <p className="text-[9px] leading-relaxed text-muted-foreground/70">
            Your reply appears directly beneath the review on your website. Leave the field empty and save to remove it.
          </p>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this review?"
        description="This permanently removes the review and its reply. Hiding it may be a better option if you want the record kept."
        footer={
          <>
            <button
              onClick={() => setDeleting(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Keep review
            </button>
            <SavingButton saving={deleteBusy} onClick={() => void confirmDelete()} className="bg-red-500 text-white hover:bg-red-500/90">
              Delete permanently
            </SavingButton>
          </>
        }
      >
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          The review by <span className="font-medium text-foreground">{deleting?.authorName}</span> will be removed from
          your records. This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
