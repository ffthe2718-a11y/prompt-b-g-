import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { Review, Salon } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { initials } from "@/lib/salonUi";
import { toast } from "sonner";
import {
  Check,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  Filter,
  MessageSquare,
  MessageSquareQuote,
  Plus,
  Quote,
  Reply,
  Search,
  Sparkles,
  Star,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  EmptyState,
  Field,
  Modal,
  Panel,
  SavingButton,
  SectionHeading,
  inputClass,
  textareaClass,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

function StarRow({ rating, size = 3 }: { rating: number; size?: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={cn(
            size === 3 ? "h-3 w-3" : size === 4 ? "h-3.5 w-3.5" : "h-4 w-4",
            value <= Math.round(rating) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-border/60"
          )}
        />
      ))}
    </div>
  );
}

function StarRatingSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (val: number) => void;
}) {
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="flex items-center gap-1.5 py-1">
      {[1, 2, 3, 4, 5].map((star) => {
        const active = (hover ?? value) >= star;
        return (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(null)}
            onClick={() => onChange(star)}
            className="rounded p-1 transition-transform hover:scale-110 focus:outline-none"
            aria-label={`${star} star${star > 1 ? "s" : ""}`}
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                active ? "fill-[#D4AF37] text-[#D4AF37]" : "text-border hover:text-[#D4AF37]/50"
              )}
            />
          </button>
        );
      })}
      <span className="ml-2 text-xs font-semibold text-foreground">
        {value} of 5 star{value > 1 ? "s" : ""}
      </span>
    </div>
  );
}

export default function Reviews({
  salon,
  refresh,
}: {
  salon: Salon;
  refresh: () => Promise<void>;
}) {
  const [filter, setFilter] = useState<"all" | "published" | "hidden" | "unreplied">("all");
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [replying, setReplying] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Review | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // New Testimonial modal state
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [newAuthorName, setNewAuthorName] = useState("");
  const [newRating, setNewRating] = useState(5);
  const [newTitle, setNewTitle] = useState("");
  const [newComment, setNewComment] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newDisplayOnSite, setNewDisplayOnSite] = useState(true);
  const [newOwnerReply, setNewOwnerReply] = useState("");
  const [savingNew, setSavingNew] = useState(false);

  // Bulk actions state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

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
        /* bundled reviews remain usable */
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
  const hidden = sorted.filter((review) => review.status === "hidden");
  const unreplied = sorted.filter((review) => !review.ownerReply?.trim());

  const average = published.length
    ? published.reduce((sum, review) => sum + review.rating, 0) / published.length
    : 0;

  const distribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: published.filter((review) => review.rating === rating).length,
  }));

  const visible = useMemo(() => {
    return sorted.filter((review) => {
      // Filter by status / reply
      if (filter === "published" && review.status !== "published") return false;
      if (filter === "hidden" && review.status !== "hidden") return false;
      if (filter === "unreplied" && Boolean(review.ownerReply?.trim())) return false;

      // Filter by rating
      if (ratingFilter !== "all" && review.rating !== Number(ratingFilter)) return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = review.authorName.toLowerCase().includes(q);
        const matchesComment = review.comment.toLowerCase().includes(q);
        const matchesTitle = review.title?.toLowerCase().includes(q);
        const matchesReply = review.ownerReply?.toLowerCase().includes(q);
        if (!matchesName && !matchesComment && !matchesTitle && !matchesReply) return false;
      }

      return true;
    });
  }, [sorted, filter, ratingFilter, searchQuery]);

  // Check if public reviews section is enabled
  const reviewsSectionConfig = salon.sections.find((s) => s.id === "reviews");
  const isSectionEnabled = reviewsSectionConfig?.enabled ?? true;

  const toggleVisibility = async (review: Review) => {
    const next = review.status === "published" ? "hidden" : "published";
    setPendingId(review.id);
    try {
      await salonApi.updateReview(review.id, { status: next });
      toast.success(
        next === "published"
          ? `Approved! "${review.authorName}" testimonial is now displayed on your website.`
          : `Hidden! "${review.authorName}" testimonial has been removed from your website.`
      );
      setReviews((prev) =>
        prev.map((r) => (r.id === review.id ? { ...r, status: next } : r))
      );
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not update this review.");
    } finally {
      setPendingId(null);
    }
  };

  const handleCreateTestimonial = async () => {
    if (!newAuthorName.trim()) {
      toast.error("Please enter the client's name.");
      return;
    }
    if (!newComment.trim()) {
      toast.error("Please enter the client's testimonial or feedback.");
      return;
    }

    setSavingNew(true);
    try {
      const { review } = await salonApi.createReview({
        authorName: newAuthorName.trim(),
        authorEmail: newEmail.trim() || undefined,
        rating: newRating,
        title: newTitle.trim() || undefined,
        comment: newComment.trim(),
        status: newDisplayOnSite ? "published" : "hidden",
        ownerReply: newOwnerReply.trim() || undefined,
      });

      toast.success(
        newDisplayOnSite
          ? "Customer testimonial approved and displayed on your public website!"
          : "Customer testimonial saved as draft (hidden)."
      );

      setReviews((prev) => [review, ...prev]);
      setNewModalOpen(false);
      resetNewForm();
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Could not save customer testimonial.");
    } finally {
      setSavingNew(false);
    }
  };

  const resetNewForm = () => {
    setNewAuthorName("");
    setNewRating(5);
    setNewTitle("");
    setNewComment("");
    setNewEmail("");
    setNewDisplayOnSite(true);
    setNewOwnerReply("");
  };

  const handleSeedDemoReviews = async () => {
    setSavingNew(true);
    try {
      const mockReviews = [
        {
          authorName: "Ananya Sharma",
          rating: 5,
          title: "Incredible transformation & pampering experience",
          comment: "I came in for a balayage and haircut. The attention to detail and care was beyond expectations. My hair has never felt so silky and vibrant!",
          status: "published" as const,
          ownerReply: "Thank you so much Ananya! We loved creating that warm honey tone for you. Can't wait to see you next time!",
        },
        {
          authorName: "Rohan Mehra",
          rating: 5,
          title: "Precision cut and calm environment",
          comment: "Always punctual, clean, and top-tier stylists. The scalp massage during the wash was heavenly.",
          status: "published" as const,
          ownerReply: "Appreciate the wonderful review, Rohan! Glad you enjoyed the wash ritual.",
        },
        {
          authorName: "Meera Patel",
          rating: 5,
          title: "Best bridal hair & makeup in the area",
          comment: "Booked Velvet for my sister's wedding party. Everyone looked radiant and the team kept us calm and laughing the entire morning.",
          status: "published" as const,
          ownerReply: "It was an absolute honour to be part of such a special celebration, Meera!",
        },
      ];

      for (const item of mockReviews) {
        await salonApi.createReview(item);
      }

      toast.success("Demo customer testimonials loaded and displayed on your website.");
      await refresh();
      const fresh = await salonApi.listReviews();
      setReviews(fresh.reviews);
    } catch (err: any) {
      toast.error(err?.message || "Could not load demo reviews.");
    } finally {
      setSavingNew(false);
    }
  };

  // Bulk actions
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const allSelected = visible.length > 0 && visible.every((r) => selectedIds.has(r.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visible.forEach((r) => next.delete(r.id));
      } else {
        visible.forEach((r) => next.add(r.id));
      }
      return next;
    });
  };

  const handleBulkStatus = async (status: "published" | "hidden") => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      await salonApi.bulkUpdateReviews({
        ids: Array.from(selectedIds),
        status,
      });
      toast.success(
        status === "published"
          ? `Approved! Displaying ${selectedIds.size} testimonial${selectedIds.size > 1 ? "s" : ""} on your public website.`
          : `Hidden ${selectedIds.size} testimonial${selectedIds.size > 1 ? "s" : ""} from your public website.`
      );
      setReviews((prev) =>
        prev.map((r) => (selectedIds.has(r.id) ? { ...r, status } : r))
      );
      setSelectedIds(new Set());
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update selected reviews.");
    } finally {
      setBulkBusy(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkBusy(true);
    try {
      for (const id of Array.from(selectedIds)) {
        await salonApi.deleteReview(id);
      }
      toast.success(`Removed ${selectedIds.size} review${selectedIds.size > 1 ? "s" : ""}.`);
      setReviews((prev) => prev.filter((r) => !selectedIds.has(r.id)));
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Could not delete selected reviews.");
    } finally {
      setBulkBusy(false);
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
      toast.success(replyText.trim() ? "Reply published on your website." : "Reply removed.");
      setReviews((prev) =>
        prev.map((r) => (r.id === replying.id ? { ...r, ownerReply: replyText.trim() } : r))
      );
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
      setReviews((prev) => prev.filter((r) => r.id !== deleting.id));
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
      {/* Overview & Action Header Panel */}
      <Panel>
        <SectionHeading
          title="Client Reviews & Testimonials"
          description="View, approve, and showcase customer testimonials on your public salon website. Approved reviews appear immediately in your website's review section."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`/${salon.slug}#reviews`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-background/50 px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                title="View reviews section on your live site"
              >
                <ExternalLink className="h-3 w-3" /> View live site
              </a>
              <button
                type="button"
                onClick={() => {
                  resetNewForm();
                  setNewModalOpen(true);
                }}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black shadow-sm transition-transform hover:scale-[1.02]"
              >
                <Plus className="h-3.5 w-3.5" /> Add testimonial
              </button>
            </div>
          }
        />

        {/* Website Section Notice if disabled */}
        {!isSectionEnabled && (
          <div className="mt-4 flex items-center justify-between rounded-xl border border-amber-500/25 bg-amber-500/10 p-3 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <EyeOff className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                The <strong>Reviews</strong> section is currently toggled OFF in your website editor.
              </span>
            </div>
            <Link
              to="/dashboard/website"
              className="rounded-lg border border-amber-500/40 bg-amber-500/20 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-amber-200 hover:bg-amber-500/30"
            >
              Enable in Editor
            </Link>
          </div>
        )}

        {/* Rating metrics breakdown */}
        <div className="mt-5 grid gap-4 lg:grid-cols-[220px_1.2fr_0.8fr]">
          {/* Average Score Card */}
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-background/40 p-5 text-center">
            <p className="font-serif text-5xl text-primary">{average ? average.toFixed(1) : "—"}</p>
            <div className="mt-2">
              <StarRow rating={average} size={4} />
            </div>
            <p className="mt-2 text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-semibold">
              {published.length} Publicly Displayed
            </p>
            {hidden.length > 0 && (
              <p className="mt-0.5 text-[8px] text-amber-400 font-medium">
                {hidden.length} waiting for approval / hidden
              </p>
            )}
          </div>

          {/* Star Distribution Progress */}
          <div className="flex flex-col justify-center space-y-2 rounded-xl border border-border bg-background/40 p-4">
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Rating Breakdown</p>
            <div className="space-y-1.5">
              {distribution.map((row) => (
                <div key={row.rating} className="flex items-center gap-2">
                  <span className="w-4 text-[9px] font-medium text-muted-foreground">{row.rating}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border/40">
                    <div
                      className="h-full rounded-full bg-[#D4AF37] transition-all duration-500"
                      style={{ width: `${published.length ? (row.count / published.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="w-5 text-right text-[9px] font-mono text-muted-foreground">{row.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Website Display Health Card */}
          <div className="flex flex-col justify-between rounded-xl border border-border bg-background/40 p-4 text-xs">
            <div>
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Website Display Status</p>
              <div className="mt-2.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="h-3 w-3 text-emerald-400" /> Displayed on site:
                  </span>
                  <span className="font-mono font-bold text-emerald-400">{published.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <EyeOff className="h-3 w-3 text-muted-foreground" /> Hidden / Unapproved:
                  </span>
                  <span className="font-mono font-bold text-muted-foreground">{hidden.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageSquare className="h-3 w-3 text-primary" /> Answered with reply:
                  </span>
                  <span className="font-mono font-bold text-foreground">
                    {reviews.filter((r) => r.ownerReply?.trim()).length}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-3 border-t border-border/60 pt-2.5 text-[9px] text-muted-foreground">
              Only approved reviews are shown on your live site.
            </div>
          </div>
        </div>
      </Panel>

      {/* Filter and Search Bar */}
      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilter("all")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] transition-colors",
                filter === "all"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              All · {reviews.length}
            </button>
            <button
              onClick={() => setFilter("published")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] transition-colors flex items-center gap-1.5",
                filter === "published"
                  ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Displayed · {published.length}
            </button>
            <button
              onClick={() => setFilter("hidden")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] transition-colors flex items-center gap-1.5",
                filter === "hidden"
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-400"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              Hidden / Pending · {hidden.length}
            </button>
            <button
              onClick={() => setFilter("unreplied")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] transition-colors",
                filter === "unreplied"
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Needs Reply · {unreplied.length}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className={cn(inputClass, "h-9 w-32 text-[10px]")}
              aria-label="Filter by star rating"
            >
              <option value="all">All ratings</option>
              <option value="5">5 Stars only</option>
              <option value="4">4 Stars only</option>
              <option value="3">3 Stars only</option>
              <option value="2">2 Stars only</option>
              <option value="1">1 Star only</option>
            </select>

            <div className="relative sm:w-56">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search testimonials..."
                className={cn(inputClass, "h-9 pl-8 text-[11px]")}
              />
            </div>
          </div>
        </div>

        {/* Bulk Action Bar for Selected Reviews */}
        {selectedIds.size > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/[0.06] p-3 text-xs shadow-sm">
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-primary">
                {selectedIds.size} selected
              </span>
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="text-[9px] text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear selection
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => void handleBulkStatus("published")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-emerald-400 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
              >
                <Check className="h-3 w-3" /> Approve & Display ({selectedIds.size})
              </button>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => void handleBulkStatus("hidden")}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background/80 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
              >
                <EyeOff className="h-3 w-3" /> Hide from site ({selectedIds.size})
              </button>
              <button
                type="button"
                disabled={bulkBusy}
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
              >
                <Trash2 className="h-3 w-3" /> Delete ({selectedIds.size})
              </button>
            </div>
          </div>
        )}

        {/* Reviews List */}
        <div className="mt-5">
          {reviews.length === 0 ? (
            <EmptyState
              icon={<MessageSquareQuote className="h-6 w-6" />}
              title="No customer testimonials yet"
              description="Testimonials build immediate trust for first-time visitors. You can invite clients to leave a review via your public website or add your existing testimonials manually right now."
              action={
                <div className="flex flex-wrap items-center justify-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      resetNewForm();
                      setNewModalOpen(true);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black shadow-sm"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add first testimonial
                  </button>
                  <button
                    type="button"
                    disabled={savingNew}
                    onClick={() => void handleSeedDemoReviews()}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-primary" /> Load demo reviews
                  </button>
                </div>
              }
            />
          ) : visible.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-12 text-center text-xs text-muted-foreground">
              No reviews match the current filters or search query.
            </div>
          ) : (
            <div className="space-y-3">
              {/* Select All Checkbox row */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2 px-1 text-[10px] text-muted-foreground">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={visible.length > 0 && visible.every((r) => selectedIds.has(r.id))}
                    onChange={selectAllVisible}
                    className="h-3.5 w-3.5 rounded border-border bg-background text-primary accent-[#D4AF37] focus:ring-primary cursor-pointer"
                  />
                  <span>Select all in view ({visible.length})</span>
                </label>
                <span>Showing {visible.length} of {reviews.length} reviews</span>
              </div>

              {visible.map((review) => {
                const isSelected = selectedIds.has(review.id);
                const isApproved = review.status === "published";
                return (
                  <div
                    key={review.id}
                    className={cn(
                      "rounded-xl border p-4 transition-all duration-150",
                      isSelected
                        ? "border-primary bg-primary/[0.06] ring-1 ring-primary/40"
                        : "border-border bg-card/40 hover:border-primary/30",
                      !isApproved && "border-dashed opacity-85"
                    )}
                  >
                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                      {/* Left: Avatar, Details & Quote */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(review.id)}
                          className="mt-1 h-4 w-4 rounded border-border bg-background text-primary accent-[#D4AF37] focus:ring-primary cursor-pointer shrink-0"
                          aria-label={`Select review by ${review.authorName}`}
                        />
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-[10px] font-bold text-primary">
                          {initials(review.authorName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold text-foreground">{review.authorName}</p>
                            <StarRow rating={review.rating} />

                            {/* Prominent Display Status Badge */}
                            {isApproved ? (
                              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                                <Check className="h-2.5 w-2.5" /> Displayed on Website
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-amber-400">
                                <EyeOff className="h-2.5 w-2.5" /> Hidden from Website
                              </span>
                            )}
                          </div>

                          <div className="mt-0.5 flex items-center gap-2 text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                            <span>
                              {new Date(review.createdAt).toLocaleDateString(undefined, {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                            {review.authorEmail && (
                              <>
                                <span>·</span>
                                <span className="lowercase">{review.authorEmail}</span>
                              </>
                            )}
                          </div>

                          {review.title && (
                            <p className="mt-2 text-xs font-semibold text-foreground">{review.title}</p>
                          )}
                          <p className="mt-1 whitespace-pre-wrap text-[11px] leading-relaxed text-muted-foreground">
                            "{review.comment}"
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5 self-end sm:self-start">
                        {/* 1-Click Approve / Hide Button */}
                        {isApproved ? (
                          <button
                            type="button"
                            onClick={() => void toggleVisibility(review)}
                            disabled={pendingId === review.id}
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-50"
                            title="Hide this review from your public website"
                          >
                            <EyeOff className="h-3 w-3" /> Hide
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void toggleVisibility(review)}
                            disabled={pendingId === review.id}
                            className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                            title="Approve and display this testimonial on your public salon website"
                          >
                            <Check className="h-3 w-3" /> Approve & Display
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => openReply(review)}
                          className={cn(
                            "inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[8px] font-bold uppercase tracking-[0.1em] transition-colors",
                            review.ownerReply
                              ? "border-primary/40 bg-primary/10 text-primary"
                              : "border-border text-muted-foreground hover:border-primary/40 hover:text-primary"
                          )}
                        >
                          <Reply className="h-3 w-3" />
                          {review.ownerReply ? "Edit reply" : "Reply"}
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeleting(review)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                          aria-label={`Delete review by ${review.authorName}`}
                          title="Delete review"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>

                    {/* Owner reply box */}
                    {review.ownerReply && (
                      <div className="mt-3 ml-7 rounded-xl border-l-2 border-primary/60 bg-primary/[0.05] p-3 text-xs">
                        <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-primary">
                          Salon reply (displayed publicly)
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-foreground/80">
                          {review.ownerReply}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Panel>

      {/* Add Customer Testimonial Modal */}
      <Modal
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        title="Add Customer Testimonial"
        description="Record offline feedback, customer reviews, or testimonials to display on your salon website."
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setNewModalOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton saving={savingNew} onClick={() => void handleCreateTestimonial()}>
              {newDisplayOnSite ? "Approve & Display on Website" : "Save Testimonial"}
            </SavingButton>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Client Name" hint="Client's name as shown on the review.">
              <input
                value={newAuthorName}
                onChange={(e) => setNewAuthorName(e.target.value)}
                placeholder="e.g. Priya Kapoor"
                className={inputClass}
                autoFocus
              />
            </Field>
            <Field label="Client Email (Optional)" hint="For your records only; not shown publicly.">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="client@example.com"
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Rating">
            <StarRatingSelector value={newRating} onChange={setNewRating} />
          </Field>

          <Field label="Testimonial Title / Headline (Optional)" hint="A short summary like 'Best haircut in town'">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g. Flawless balayage and warm hospitality"
              className={inputClass}
            />
          </Field>

          <Field label="Testimonial Feedback / Review" hint="What the client said about their experience.">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Write or paste the customer's review here…"
              className={cn(textareaClass, "min-h-24")}
            />
          </Field>

          {/* Display immediately on site toggle */}
          <div className="rounded-xl border border-border bg-background p-3.5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-foreground">Display on public website</p>
                <p className="text-[10px] text-muted-foreground">
                  When enabled, this testimonial appears immediately on your public site and lookbook.
                </p>
              </div>
              <Switch
                checked={newDisplayOnSite}
                onCheckedChange={setNewDisplayOnSite}
                aria-label="Display on public website"
              />
            </div>
          </div>

          <Field label="Initial Salon Reply (Optional)" hint="A public thank you note from your team.">
            <textarea
              value={newOwnerReply}
              onChange={(e) => setNewOwnerReply(e.target.value)}
              placeholder="e.g. Thank you Priya! It was such a pleasure styling your hair."
              className={cn(textareaClass, "min-h-20")}
            />
          </Field>
        </div>
      </Modal>

      {/* Reply to Review Modal */}
      <Modal
        open={Boolean(replying)}
        onClose={() => setReplying(null)}
        title="Reply to Customer Review"
        description={replying ? `${replying.authorName} · ${replying.rating} Star Review` : undefined}
        footer={
          <>
            <button
              type="button"
              onClick={() => setReplying(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton saving={replyBusy} onClick={() => void saveReply()}>
              {replyText.trim() ? "Publish Reply" : "Remove Reply"}
            </SavingButton>
          </>
        }
      >
        <div className="space-y-3.5">
          {replying && (
            <div className="rounded-xl border border-border bg-background/50 p-3">
              <StarRow rating={replying.rating} />
              {replying.title && <p className="mt-1 font-semibold text-xs text-foreground">{replying.title}</p>}
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground italic">"{replying.comment}"</p>
            </div>
          )}
          <Field label="Your public reply" hint="Keep it warm and specific. Thank them by name if you like.">
            <textarea
              value={replyText}
              onChange={(event) => setReplyText(event.target.value)}
              placeholder="Thank you for taking the time to share this with us…"
              className={cn(textareaClass, "min-h-28")}
              autoFocus
            />
          </Field>
          <div className="flex flex-wrap items-center gap-1.5 text-[8px]">
            <span className="text-muted-foreground">Quick templates:</span>
            {[
              "Thank you so much for the kind words!",
              "It was an absolute pleasure having you with us.",
              "We appreciate you taking the time to share your experience!",
            ].map((tmpl) => (
              <button
                key={tmpl}
                type="button"
                onClick={() => setReplyText(tmpl)}
                className="rounded-full border border-border px-2 py-0.5 text-muted-foreground hover:border-primary/40 hover:text-primary transition-colors"
              >
                + "{tmpl.slice(0, 24)}..."
              </button>
            ))}
          </div>
          <p className="text-[9px] leading-relaxed text-muted-foreground/70">
            Your reply appears directly beneath the review on your website. Leave the field empty and save to remove it.
          </p>
        </div>
      </Modal>

      {/* Delete Review Modal */}
      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Delete this review?"
        description="This permanently removes the review and its reply from your database."
        footer={
          <>
            <button
              type="button"
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
        <p className="text-xs leading-relaxed text-muted-foreground">
          The review by <span className="font-semibold text-foreground">{deleting?.authorName}</span> will be permanently deleted. If you only wish to remove it from the public website, choose <strong className="text-foreground">"Hide from website"</strong> instead.
        </p>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        title={`Delete ${selectedIds.size} reviews?`}
        description="These reviews will be permanently deleted from your salon database."
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkDeleteOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton saving={bulkBusy} onClick={() => void handleBulkDelete()} className="bg-red-500 text-white hover:bg-red-500/90">
              Delete {selectedIds.size} reviews
            </SavingButton>
          </>
        }
      >
        <p className="text-xs leading-relaxed text-muted-foreground">
          Are you sure you want to permanently delete <span className="font-semibold text-foreground">{selectedIds.size}</span> selected reviews? This cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
