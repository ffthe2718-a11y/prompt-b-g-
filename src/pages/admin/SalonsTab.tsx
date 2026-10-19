import { useCallback, useEffect, useState } from "react";
import type { AdminSalon, ApprovalEvent, SalonStatus, SubscriptionStatus } from "@/types/salon";
import { adminApi } from "@/lib/api";
import { initials } from "@/lib/salonUi";
import { StatusBadge } from "@/components/dashboard/ui";
import { ApprovalBadge } from "@/components/dashboard/ApprovalPanel";
import { toast } from "sonner";
import {
  Clock3,
  ExternalLink,
  Loader2,
  Search,
  ShieldCheck,
  ShieldOff,
  Store,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_FILTERS: { id: "all" | SalonStatus; label: string }[] = [
  { id: "all", label: "All" },
  { id: "published", label: "Live" },
  { id: "draft", label: "Draft" },
  { id: "suspended", label: "Suspended" },
];

const SUBSCRIPTION_TONE: Record<SubscriptionStatus, string> = {
  active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  trialing: "border-sky-500/25 bg-sky-500/10 text-sky-400",
  past_due: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  canceled: "border-red-500/25 bg-red-500/10 text-red-400",
};

export default function SalonsTab({
  onChanged,
  onReview,
}: {
  onChanged: () => void;
  onReview?: () => void;
}) {
  const [salons, setSalons] = useState<AdminSalon[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | SalonStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [history, setHistory] = useState<{ salon: AdminSalon; entries: ApprovalEvent[] } | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  const openHistory = async (salon: AdminSalon) => {
    setHistoryLoading(true);
    try {
      const data = await adminApi.salonApproval(salon.id);
      setHistory({ salon, entries: data.history });
    } catch (error: any) {
      toast.error(error?.message || "Could not load the review history.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const load = useCallback(async (search: string, filter: string) => {
    try {
      const data = await adminApi.salons(search, filter);
      setSalons(data.salons);
    } catch (error: any) {
      toast.error(error?.message || "Could not load salons.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(query.trim(), status), 300);
    return () => window.clearTimeout(timer);
  }, [query, status, load]);

  const setSalonStatus = async (salon: AdminSalon, next: SalonStatus) => {
    if (next === "suspended" && !window.confirm(`Suspend ${salon.name}? Its public website will go offline immediately.`)) {
      return;
    }
    setBusyId(salon.id);
    try {
      await adminApi.setSalonStatus(salon.id, next);
      setSalons((current) => current.map((item) => (item.id === salon.id ? { ...item, status: next } : item)));
      toast.success(`${salon.name} is now ${next}.`);
      onChanged();
    } catch (error: any) {
      toast.error(error?.message || "Could not update this salon.");
    } finally {
      setBusyId(null);
    }
  };

  const unpublish = async (salon: AdminSalon) => {
    if (!window.confirm(`Take ${salon.name} offline? The owner keeps the approval and can republish later.`)) return;
    setBusyId(salon.id);
    try {
      await adminApi.unpublishSalon(salon.id);
      setSalons((current) => current.map((item) => (item.id === salon.id ? { ...item, status: "draft" } : item)));
      toast.success(`${salon.name} is offline.`);
      onChanged();
    } catch (error: any) {
      toast.error(error?.message || "Could not unpublish this salon.");
    } finally {
      setBusyId(null);
    }
  };

  const removeSalon = async (salon: AdminSalon) => {
    const confirmation = window.prompt(
      `This permanently deletes ${salon.name}, its services, staff, bookings and website.\n\nType "${salon.slug}" to confirm.`
    );
    if (confirmation?.trim() !== salon.slug) {
      if (confirmation !== null) toast.error("The slug didn't match, so nothing was deleted.");
      return;
    }
    setBusyId(salon.id);
    try {
      await adminApi.deleteSalon(salon.id);
      setSalons((current) => current.filter((item) => item.id !== salon.id));
      toast.success(`${salon.name} was deleted.`);
      onChanged();
    } catch (error: any) {
      toast.error(error?.message || "Could not delete this salon.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">Salon websites</p>
          <h1 className="mt-1.5 font-serif text-2xl text-foreground">Every published storefront.</h1>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Publish, suspend or remove any salon website. Owners keep their data while suspended.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex rounded-xl border border-border p-0.5">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatus(filter.id)}
                className={cn(
                  "rounded-lg px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.12em] transition-colors",
                  status === filter.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search salons or owners"
              className="h-9 w-full rounded-xl border border-border bg-background pl-8 pr-3 text-[11px] text-foreground outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-[11px] font-semibold text-foreground">Salons</h2>
          <span className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">
            {salons.length} result{salons.length === 1 ? "" : "s"}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Loading salons</span>
          </div>
        ) : salons.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-center">
            <Store className="h-5 w-5 text-muted-foreground/40" />
            <p className="text-[11px] text-muted-foreground">No salons match this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Salon", "Owner", "Location", "Plan", "Website", "Views", "Bookings", "Rating", "Actions"].map((label) => (
                    <th key={label} className="px-4 py-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {salons.map((salon) => (
                  <tr key={salon.id} className="hover:bg-background/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        {salon.logoUrl ? (
                          <img src={salon.logoUrl} alt="" className="h-8 w-8 rounded-full border border-border object-cover" />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-serif text-[10px] text-primary">
                            {initials(salon.name)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <a
                            href={`/${salon.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block truncate text-[11px] font-medium text-foreground hover:text-primary"
                          >
                            {salon.name}
                          </a>
                          <span className="block truncate font-mono text-[8px] text-muted-foreground">
                            /{salon.slug}
                            {salon.customDomain ? ` · ${salon.customDomain}` : ""}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] text-foreground">{salon.ownerName || "—"}</p>
                      <p className="truncate text-[8px] text-muted-foreground">{salon.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">
                      {[salon.city, salon.country].filter(Boolean).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] capitalize text-foreground">{salon.plan || "launch"}</p>
                      <span
                        className={cn(
                          "mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em]",
                          SUBSCRIPTION_TONE[(salon.subscriptionStatus || "active") as SubscriptionStatus]
                        )}
                      >
                        {(salon.subscriptionStatus || "active").replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge status={salon.status} />
                        <ApprovalBadge status={salon.approvalStatus || "draft"} />
                        {salon.submissionStale && (
                          <span className="text-[7px] font-bold uppercase tracking-[0.1em] text-amber-400">Stale</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">{salon.views.toLocaleString()}</td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">{salon.bookingCount}</td>
                    <td className="px-4 py-3 text-[10px] text-muted-foreground">
                      {salon.rating ? `${salon.rating.toFixed(1)} (${salon.ratingCount})` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {salon.approvalStatus === "pending" && onReview && (
                          <button
                            onClick={onReview}
                            className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em] text-amber-400"
                          >
                            <ShieldCheck className="h-2.5 w-2.5" /> Review
                          </button>
                        )}
                        {salon.status === "published" && (
                          <a
                            href={`/${salon.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground"
                            aria-label="Open website"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {salon.status === "suspended" ? (
                          <button
                            onClick={() => void setSalonStatus(salon, "published")}
                            disabled={busyId === salon.id}
                            className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em] text-emerald-400 disabled:opacity-50"
                          >
                            <Undo2 className="h-2.5 w-2.5" /> Restore
                          </button>
                        ) : (
                          <>
                            {salon.status === "draft" && (
                              <button
                                onClick={() => void setSalonStatus(salon, "published")}
                                disabled={busyId === salon.id}
                                className="inline-flex items-center gap-1 rounded-md border border-emerald-500/30 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em] text-emerald-400 disabled:opacity-50"
                              >
                                <ShieldCheck className="h-2.5 w-2.5" /> Publish
                              </button>
                            )}
                            {salon.status === "published" && (
                              <button
                                onClick={() => void unpublish(salon)}
                                disabled={busyId === salon.id}
                                className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                                aria-label="Unpublish website"
                                title="Unpublish website"
                              >
                                <Undo2 className="h-3 w-3" />
                              </button>
                            )}
                            <button
                              onClick={() => void setSalonStatus(salon, "suspended")}
                              disabled={busyId === salon.id}
                              className="inline-flex items-center gap-1 rounded-md border border-amber-500/30 px-2 py-1 text-[7px] font-bold uppercase tracking-[0.1em] text-amber-400 disabled:opacity-50"
                            >
                              <ShieldOff className="h-2.5 w-2.5" /> Suspend
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => void openHistory(salon)}
                          disabled={historyLoading}
                          className="rounded-md border border-border p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-50"
                          aria-label={`Approval history for ${salon.name}`}
                          title="Approval history"
                        >
                          {historyLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Clock3 className="h-3 w-3" />}
                        </button>
                        <button
                          onClick={() => void removeSalon(salon)}
                          disabled={busyId === salon.id}
                          className="rounded-md border border-red-500/25 p-1.5 text-red-400/80 hover:text-red-400 disabled:opacity-50"
                          aria-label="Delete salon"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {history && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-3 backdrop-blur-sm sm:items-center">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-primary">Approval history</p>
                <h2 className="mt-1 text-[14px] font-semibold text-foreground">{history.salon.name}</h2>
                <p className="mt-0.5 font-mono text-[8px] text-muted-foreground">/{history.salon.slug}</p>
              </div>
              <button
                onClick={() => setHistory(null)}
                className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
                aria-label="Close approval history"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4 max-h-[55vh] overflow-y-auto">
              {history.entries.length === 0 ? (
                <p className="py-6 text-center text-[10px] text-muted-foreground">No review history yet.</p>
              ) : (
                <ol className="space-y-2.5">
                  {history.entries.map((entry) => (
                    <li key={entry.id} className="rounded-xl border border-border/70 bg-background/40 px-3 py-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-foreground">
                          {entry.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[8px] text-muted-foreground">
                          {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : "—"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[8px] text-muted-foreground">by {entry.actorEmail || "system"}</p>
                      {entry.note && (
                        <p className="mt-1.5 text-[9px] italic leading-relaxed text-muted-foreground/90">“{entry.note}”</p>
                      )}
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>
        </div>
      )}

      <p className="text-[8px] leading-relaxed text-muted-foreground/60">
        Suspending a salon hides its public website immediately. The owner keeps their data and can be restored at any
        time. Deleting a salon is permanent and also removes its bookings and uploads.
      </p>
    </div>
  );
}
