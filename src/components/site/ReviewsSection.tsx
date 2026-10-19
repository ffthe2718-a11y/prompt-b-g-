import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Loader2, MessageSquareQuote, Quote, Star, X } from "lucide-react";
import type { Review, Salon } from "@/types/salon";
import type { SiteTheme } from "@/components/site/theme";
import { publicApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function Stars({
  rating,
  size = "h-3.5 w-3.5",
  color = "#D4AF37",
  emptyColor = "#6b6b6b",
}: {
  rating: number;
  size?: string;
  color?: string;
  emptyColor?: string;
}) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(size, star <= Math.round(rating) ? "fill-current" : "")}
          style={{ color: star <= Math.round(rating) ? color : emptyColor }}
        />
      ))}
    </span>
  );
}

export default function ReviewsSection({
  salon,
  theme,
  preview = false,
}: {
  salon: Salon;
  theme: SiteTheme;
  preview?: boolean;
}) {
  const [reviews, setReviews] = useState<Review[]>(salon.reviews);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setReviews(salon.reviews);
  }, [salon.reviews]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  const average = reviews.length
    ? Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
    : salon.rating;
  const count = reviews.length || salon.ratingCount;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) {
      setError("Please enter your name.");
      return;
    }
    if (comment.trim().length < 5) {
      setError("Please share a little more about your visit.");
      return;
    }
    if (preview) {
      toast.info("Reviews open when your website is published.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await publicApi.createReview(salon.slug, {
        authorName: name.trim(),
        customerEmail: email.trim() || undefined,
        rating,
        title: title.trim() || undefined,
        comment: comment.trim(),
      });
      setReviews((current) => [result.review, ...current]);
      setName("");
      setEmail("");
      setRating(5);
      setTitle("");
      setComment("");
      setOpen(false);
      toast.success(result.message);
    } catch (err: any) {
      setError(err?.message || "Could not submit your review.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-[color:var(--site-border)] bg-[var(--site-surface)] px-3.5 text-sm text-[color:var(--site-ink)] outline-none transition-colors placeholder:text-[color:var(--site-muted)] focus:border-[color:var(--site-accent)]";

  return (
    <section
      id="reviews"
      className="scroll-mt-20 border-t py-16 sm:py-24"
      style={{ borderColor: theme.border, backgroundColor: theme.bg }}
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
              Client words
            </span>
            <h2 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl" style={{ color: theme.ink }}>
              Loved by our clients.
            </h2>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="h-10 w-fit rounded-full border px-5 text-[9px] font-bold uppercase tracking-[0.18em] transition-colors hover:opacity-80"
            style={{ borderColor: theme.border, color: theme.ink }}
          >
            <MessageSquareQuote className="mr-1.5 inline h-3.5 w-3.5" style={{ color: theme.accent }} />
            Write a review
          </button>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-[0.72fr_1.28fr]">
          <div
            className="flex flex-col justify-between rounded-3xl border p-6"
            style={{ borderColor: theme.border, backgroundColor: theme.surface }}
          >
            <div>
              <div className="flex items-end gap-3">
                <span className="font-serif text-6xl leading-none" style={{ color: theme.ink }}>
                  {average ? average.toFixed(1) : "–"}
                </span>
                <div className="pb-1">
                  <Stars rating={average} size="h-4 w-4" color={theme.accent} emptyColor={`${theme.muted}66`} />
                  <p className="mt-1 text-[9px] uppercase tracking-[0.16em]" style={{ color: theme.muted }}>
                    {count ? `${count} review${count === 1 ? "" : "s"}` : "No reviews yet"}
                  </p>
                </div>
              </div>
              <div className="mt-5 space-y-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const starCount = reviews.filter((review) => review.rating === star).length;
                  const percent = reviews.length ? (starCount / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span className="w-2 text-[9px]" style={{ color: theme.muted }}>{star}</span>
                      <div className="h-1 flex-1 overflow-hidden rounded-full" style={{ backgroundColor: theme.border }}>
                        <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: theme.accent }} />
                      </div>
                      <span className="w-4 text-right text-[8px]" style={{ color: theme.muted }}>{starCount}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <p className="mt-6 border-t pt-4 text-[10px] leading-relaxed" style={{ borderColor: theme.border, color: theme.muted }}>
              Every review is submitted by a real client. Owners can reply but not edit what clients write.
            </p>
          </div>

          <div className="space-y-3">
            {reviews.length === 0 ? (
              <div
                className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-3xl border border-dashed px-6 text-center"
                style={{ borderColor: theme.border }}
              >
                <Quote className="h-7 w-7" style={{ color: theme.accent }} />
                <p className="mt-3 font-serif text-xl" style={{ color: theme.ink }}>Be the first to share your visit.</p>
                <p className="mt-1 max-w-xs text-[10px] leading-relaxed" style={{ color: theme.muted }}>
                  Your words help other clients find the right chair — and help this salon grow.
                </p>
              </div>
            ) : (
              reviews.slice(0, 5).map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.04 }}
                  className="rounded-2xl border p-4"
                  style={{ borderColor: theme.border, backgroundColor: theme.surface }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: theme.accentSoft, color: theme.accent }}
                      >
                        {review.authorName.slice(0, 1).toUpperCase()}
                      </span>
                      <div>
                        <p className="text-xs font-medium" style={{ color: theme.ink }}>{review.authorName}</p>
                        <p className="text-[8px]" style={{ color: theme.muted }}>
                          {new Date(review.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                        </p>
                      </div>
                    </div>
                    <Stars rating={review.rating} size="h-3 w-3" color={theme.accent} emptyColor={`${theme.muted}55`} />
                  </div>
                  {review.title && (
                    <p className="mt-3 text-[11px] font-semibold" style={{ color: theme.ink }}>{review.title}</p>
                  )}
                  <p className="mt-1.5 text-[11px] leading-relaxed" style={{ color: theme.muted }}>{review.comment}</p>
                  {review.ownerReply && (
                    <div className="mt-3 rounded-xl border-l-2 px-3 py-2" style={{ borderColor: theme.accent, backgroundColor: theme.accentSoft }}>
                      <p className="text-[8px] font-bold uppercase tracking-[0.14em]" style={{ color: theme.accent }}>
                        Reply from {salon.name}
                      </p>
                      <p className="mt-1 text-[10px] leading-relaxed" style={{ color: theme.ink, opacity: 0.8 }}>
                        {review.ownerReply}
                      </p>
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.98 }}
              onClick={(event) => event.stopPropagation()}
              className="my-8 w-full max-w-lg overflow-hidden rounded-3xl border shadow-2xl"
              style={{ borderColor: theme.border, backgroundColor: theme.bg }}
            >
              <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: theme.border }}>
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.24em]" style={{ color: theme.accent }}>Your experience</p>
                  <h3 className="mt-1 font-serif text-2xl" style={{ color: theme.ink }}>Write a review</h3>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border"
                  style={{ borderColor: theme.border, color: theme.muted }}
                  aria-label="Close review form"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3 px-5 py-5">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>Your rating</label>
                  <div className="mt-1.5 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={`${star} star${star === 1 ? "" : "s"}`}
                        className="p-0.5"
                      >
                        <Star
                          className={cn("h-6 w-6 transition-transform hover:scale-110", star <= rating ? "fill-current" : "")}
                          style={{ color: star <= rating ? theme.accent : `${theme.muted}66` }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" className={inputClass} required />
                  <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="Email (optional)" className={inputClass} />
                </div>
                <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Headline (optional)" className={inputClass} />
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Tell us about your visit…"
                  rows={4}
                  className={cn(inputClass, "h-auto py-3")}
                  required
                />
                {error && (
                  <p className="rounded-xl border px-3 py-2 text-[10px]" style={{ borderColor: "#ef444455", backgroundColor: "#ef444410", color: "#f87171" }}>
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] disabled:opacity-50"
                  style={{ backgroundColor: theme.accent, color: theme.accentText }}
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {submitting ? "Submitting…" : "Publish my review"}
                </button>
                <p className="text-center text-[8px]" style={{ color: theme.muted }}>
                  Your review appears on this salon's website. Email is never shown publicly.
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
