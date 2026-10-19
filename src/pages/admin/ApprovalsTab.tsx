import { useCallback, useEffect, useState } from "react";
import type { ApprovalStatus, AdminApproval } from "@/types/salon";
import { adminApi } from "@/lib/api";
import { Link } from "react-router-dom";
import { initials } from "@/lib/salonUi";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  Clock3,
  ExternalLink,
  Loader2,
  MessageSquareWarning,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const FILTERS: { id: ApprovalStatus; label: string }[] = [
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Approved" },
  { id: "rejected", label: "Rejected" },
  { id: "changes_requested", label: "Changes" },
  { id: "draft", label: "Drafts" },
];

function when(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

function NoteBox({ onSubmit, busy }: { onSubmit: (note: string) => void; busy: boolean }) {
  const [note, setNote] = useState("");
  return (
    <div className="mt-3 rounded-xl border border-border bg-background/60 p-3">
      <label className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        Message to the owner (visible in their dashboard and email)
      </label>
      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={3}
        placeholder="Explain exactly what should change so the owner can act on it."
        className="mt-2 w-full resize-none rounded-lg border border-border bg-background p-2.5 text-[11px] text-foreground outline-none focus:border-primary"
      />
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[8px] text-muted-foreground">At least 4 characters.</span>
        <div className="flex gap-2">
          <button
            onClick={() => onSubmit(note.trim())}
            disabled={busy || note.trim().length < 4}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-sky-300 disabled:opacity-40"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <MessageSquareWarning className="h-3 w-3" />}
            Request changes
          </button>
          <button
            onClick={() => onSubmit(note.trim())}
            disabled={busy || note.trim().length < 4}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-red-300 disabled:opacity-40"
          >
            <X className="h-3 w-3" /> Reject
          </button>
        </div>
      </div>
    </div>
  );
}

function ReviewCard({ approval, onDecided }: { approval: AdminApproval; onDecided: () => void }) {
  const [busy, setBusy] = useState<"approve" | "reject" | "changes" | null>(null);
  const [noteOpen, setNoteOpen] = useState<null | "changes" | "reject">(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const decide = async (action: "approve" | "reject" | "changes", note = "") => {
    setBusy(action);
    try {
      if (action === "approve") await adminApi.approveSalon(approval.id);
      else if (action === "reject") await adminApi.rejectSalon(approval.id, note);
      else await adminApi.requestChanges(approval.id, note);
      toast.success(
        action === "approve"
          ? `${approval.name} approved. The owner can publish now.`
          : action === "reject"
            ? `${approval.name} rejected with feedback.`
            : `Changes requested from ${approval.name}.`
      );
      onDecided();
    } catch (error: any) {
      toast.error(error?.message || "Could not record the decision.");
    } finally {
      setBusy(null);
    }
  };

  const pending = approval.approvalStatus === "pending";

  return (
    <article className="rounded-2xl border border-border bg-card/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 gap-3">
          {approval.logoUrl ? (
            <img src={approval.logoUrl} alt="" className="h-11 w-11 rounded-xl border border-border object-cover" />
          ) : (
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 font-serif text-xs text-primary">
              {initials(approval.name)}
            </span>
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[13px] font-semibold text-foreground">{approval.name}</h2>
              <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-amber-400">
                {approval.approvalStatus.replace("_", " ")}
              </span>
              {approval.status === "published" && (
                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-emerald-400">
                  Live
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate font-mono text-[8px] text-muted-foreground">/{approval.slug}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">
              {approval.ownerName} · {approval.ownerEmail}
            </p>
            <p className="mt-1 text-[9px] text-muted-foreground">
              Submitted {when(approval.submittedAt)} · {approval.counts.services} services · {approval.counts.staff} staff
              · {approval.counts.gallery} photos
            </p>
            {approval.stale && (
              <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[9px] text-amber-300">
                The owner edited the website after submitting. Approve only after they resubmit the latest version.
              </p>
            )}
            {approval.blockers.length > 0 && (
              <p className="mt-2 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-1 text-[9px] text-red-300">
                Missing: {approval.blockers.join(", ")}
              </p>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            to={`/admin/preview/${approval.id}`}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            <ExternalLink className="h-3 w-3" /> Preview
          </Link>
          {pending && (
            <>
              <button
                onClick={() => void decide("approve")}
                disabled={busy !== null || approval.stale || approval.blockers.length > 0}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-emerald-500 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-black disabled:opacity-40"
              >
                {busy === "approve" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                Approve
              </button>
              <button
                onClick={() => setNoteOpen(noteOpen === "changes" ? null : "changes")}
                disabled={busy !== null}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-sky-300 disabled:opacity-40"
              >
                <MessageSquareWarning className="h-3 w-3" /> Request changes
              </button>
              <button
                onClick={() => setNoteOpen(noteOpen === "reject" ? null : "reject")}
                disabled={busy !== null}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-red-300 disabled:opacity-40"
              >
                <X className="h-3 w-3" /> Reject
              </button>
            </>
          )}
          <button
            onClick={() => setHistoryOpen((open) => !open)}
            className="inline-flex h-8 items-center gap-1 rounded-lg border border-border px-2.5 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
            aria-expanded={historyOpen}
          >
            History <ChevronDown className={cn("h-3 w-3 transition-transform", historyOpen && "rotate-180")} />
          </button>
        </div>
      </div>

      {noteOpen && (
        <NoteBox
          busy={busy !== null}
          onSubmit={(note) => {
            if (noteOpen === "reject") void decide("reject", note);
            else void decide("changes", note);
          }}
        />
      )}

      {approval.approvalStatus === "rejected" || approval.approvalStatus === "changes_requested" ? (
        <p className="mt-3 rounded-lg border border-border bg-background/50 px-3 py-2 text-[10px] leading-relaxed text-muted-foreground">
          <span className="font-semibold text-foreground">Owner note:</span> {approval.approvalNote || "No note recorded."}
        </p>
      ) : null}

      {historyOpen && (
        <ol className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
          {approval.history.length === 0 && (
            <li className="text-[9px] text-muted-foreground">No review history yet.</li>
          )}
          {approval.history.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-baseline gap-2 text-[9px] text-muted-foreground">
              <span className="font-bold uppercase tracking-[0.1em] text-foreground/80">{entry.action.replace("_", " ")}</span>
              <span>{when(entry.createdAt)}</span>
              <span>by {entry.actorEmail || "system"}</span>
              {entry.note && <span className="basis-full text-[9px] italic text-muted-foreground/80">“{entry.note}”</span>}
            </li>
          ))}
        </ol>
      )}
    </article>
  );
}

export default function ApprovalsTab({ onChanged }: { onChanged: () => void }) {
  const [status, setStatus] = useState<ApprovalStatus>("pending");
  const [approvals, setApprovals] = useState<AdminApproval[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (filter: ApprovalStatus) => {
    try {
      const data = await adminApi.approvals(filter);
      setApprovals(data.approvals);
      setPendingCount(data.pendingCount);
    } catch (error: any) {
      toast.error(error?.message || "Could not load the review queue.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(status);
  }, [status, load]);

  const refreshAll = () => {
    void load(status);
    onChanged();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">Approvals</p>
          <h1 className="mt-1.5 font-serif text-2xl text-foreground">Review salon websites.</h1>
          <p className="mt-1 max-w-2xl text-[11px] text-muted-foreground">
            Approve a website to let the owner publish it, or send it back with a clear reason. Only approved content can
            go live.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] text-amber-400">
            <Clock3 className="h-3 w-3" /> {pendingCount} pending
          </span>
          <button
            onClick={refreshAll}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" /> Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-xl border border-border p-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.id}
            onClick={() => {
              setLoading(true);
              setStatus(filter.id);
            }}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.12em] transition-colors",
              status === filter.id ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {filter.label}
            {filter.id === "pending" && pendingCount > 0 ? ` · ${pendingCount}` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Loading queue</span>
        </div>
      ) : approvals.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card/40 py-20 text-center">
          <ShieldCheck className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-[11px] text-muted-foreground">
            {status === "pending" ? "Nothing waiting for review. Nice work." : "No salons in this state."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {approvals.map((approval) => (
            <ReviewCard key={approval.id} approval={approval} onDecided={refreshAll} />
          ))}
        </div>
      )}
    </div>
  );
}
