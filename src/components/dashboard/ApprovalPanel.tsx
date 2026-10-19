import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { ApprovalStatus, Salon } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  CornerDownRight,
  Loader2,
  Rocket,
  Send,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const APPROVAL_LABEL: Record<ApprovalStatus, string> = {
  draft: "Draft",
  pending: "In review",
  approved: "Approved",
  rejected: "Needs changes",
  changes_requested: "Changes requested",
};

export function ApprovalBadge({ status, className }: { status: ApprovalStatus; className?: string }) {
  const tone: Record<ApprovalStatus, string> = {
    draft: "border-border bg-background text-muted-foreground",
    pending: "border-amber-500/30 bg-amber-500/10 text-amber-400",
    approved: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    rejected: "border-red-500/30 bg-red-500/10 text-red-400",
    changes_requested: "border-sky-500/30 bg-sky-500/10 text-sky-400",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em]",
        tone[status],
        className
      )}
    >
      {APPROVAL_LABEL[status]}
    </span>
  );
}

function relative(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

/**
 * Owner-facing status card. Explains exactly where the website sits in
 * draft → pending → approved → published and offers the next action.
 */
export default function ApprovalPanel({
  salon,
  onChanged,
  compact = false,
}: {
  salon: Salon;
  onChanged: () => void | Promise<void>;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<"submit" | "withdraw" | "publish" | null>(null);
  const status = salon.approvalStatus;

  const state = useMemo(() => {
    if (salon.status === "suspended") {
      return {
        tone: "border-red-500/25 bg-red-500/[0.06]",
        icon: XCircle,
        iconClass: "text-red-400",
        title: "Website suspended",
        body: "The platform team has taken this website offline. Your content is safe — contact support to restore it.",
        action: null as null | "submit" | "publish",
        actionLabel: "",
      };
    }
    if (status === "pending") {
      return {
        tone: "border-amber-500/25 bg-amber-500/[0.06]",
        icon: Clock3,
        iconClass: "text-amber-400",
        title: "Waiting for approval",
        body: salon.submittedAt
          ? `Submitted ${relative(salon.submittedAt)}. A super admin reviews every website by hand — usually within one business day.`
          : "A super admin reviews every website by hand — usually within one business day.",
        action: null,
        actionLabel: "",
      };
    }
    if (status === "rejected" || status === "changes_requested") {
      return {
        tone: "border-red-500/25 bg-red-500/[0.06]",
        icon: AlertTriangle,
        iconClass: "text-red-400",
        title: status === "rejected" ? "Not approved yet" : "Changes requested",
        body: salon.approvalNote || "Make the requested changes, then submit the website again.",
        action: "submit" as const,
        actionLabel: "Resubmit for review",
      };
    }
    if (status === "approved" && salon.approvalStale) {
      return {
        tone: "border-sky-500/25 bg-sky-500/[0.06]",
        icon: CornerDownRight,
        iconClass: "text-sky-400",
        title: "Approved — new edits are in review",
        body: "You changed the website after submitting it. Withdraw the submission to keep editing, or wait for the review to finish.",
        action: null,
        actionLabel: "",
      };
    }
    if (status === "approved" && salon.changesSinceApproval) {
      return {
        tone: "border-sky-500/25 bg-sky-500/[0.06]",
        icon: CornerDownRight,
        iconClass: "text-sky-400",
        title: "Significant changes not yet approved",
        body:
          "Your live website still shows the approved version. Submit the new version for review before publishing it.",
        action: "submit" as const,
        actionLabel: "Submit changes",
      };
    }
    if (status === "approved") {
      return {
        tone: "border-emerald-500/25 bg-emerald-500/[0.06]",
        icon: ShieldCheck,
        iconClass: "text-emerald-400",
        title: salon.status === "published" ? "Approved and live" : "Approved — ready to publish",
        body:
          salon.status === "published"
            ? "Your public website is live. Every edit you publish keeps this approval until the content changes substantially."
            : "Your website passed review. Publish it to make it visible to clients.",
        action: salon.status === "published" ? null : ("publish" as const),
        actionLabel: "Publish website",
      };
    }
    const missing = salon.approvalBlockers ?? [];
    return {
      tone: "border-border bg-background/50",
      icon: Rocket,
      iconClass: "text-primary",
      title: "Draft — not submitted",
      body: missing.length
        ? `Finish these steps first: ${missing.join(", ")}.`
        : "Everything looks ready. Submit your website for review to get it approved.",
      action: "submit" as const,
      actionLabel: "Submit for approval",
    };
  }, [salon, status]);

  const Icon = state.icon;

  const run = async (action: "submit" | "withdraw" | "publish") => {
    setBusy(action);
    try {
      if (action === "submit") {
        await salonApi.submitForApproval();
        toast.success("Submitted for review. We'll email you when there's a decision.");
      } else if (action === "withdraw") {
        await salonApi.withdrawSubmission();
        toast.success("Submission withdrawn. You can keep editing.");
      } else {
        const result = await salonApi.publish();
        toast.success("Your website is live.", { description: `${window.location.origin}${result.publishedUrl}` });
      }
      await onChanged();
    } catch (error: any) {
      toast.error(error?.message || "Could not update the approval status.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className={cn("rounded-2xl border p-4", state.tone, compact && "p-3")}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-background/60">
            <Icon className={cn("h-3.5 w-3.5", state.iconClass)} />
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[12px] font-semibold text-foreground">{state.title}</h2>
              <ApprovalBadge status={status} />
            </div>
            <p className="mt-1 max-w-2xl text-[10px] leading-relaxed text-muted-foreground">{state.body}</p>
            {salon.approvalNote && (status === "rejected" || status === "changes_requested") && salon.reviewedBy ? (
              <p className="mt-1 text-[8px] uppercase tracking-[0.12em] text-muted-foreground/60">
                Reviewed by {salon.reviewedBy} · {relative(salon.reviewedAt)}
              </p>
            ) : null}
            {status === "approved" && salon.approvedAt ? (
              <p className="mt-1 flex items-center gap-1 text-[8px] uppercase tracking-[0.12em] text-muted-foreground/60">
                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" /> Approved {relative(salon.approvedAt)}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {status === "pending" && (
            <button
              onClick={() => void run("withdraw")}
              disabled={busy !== null}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
              {busy === "withdraw" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Undo2 className="h-3 w-3" />}
              Withdraw
            </button>
          )}
          {state.action && (
            <button
              onClick={() => void run(state.action!)}
              disabled={busy !== null || (state.action === "submit" && (salon.approvalBlockers?.length ?? 0) > 0)}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[8px] font-bold uppercase tracking-[0.12em] text-black transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {busy ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : state.action === "publish" ? (
                <Rocket className="h-3 w-3" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              {state.actionLabel}
            </button>
          )}
          <Link
            to="/dashboard/preview"
            className="inline-flex h-8 items-center rounded-lg border border-border px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
          >
            Preview
          </Link>
        </div>
      </div>

      {status === "pending" && salon.approvalHistory?.length ? (
        <p className="mt-3 border-t border-white/5 pt-2 text-[8px] uppercase tracking-[0.12em] text-muted-foreground/60">
          Latest submission {relative(salon.approvalHistory[0]?.createdAt)}
        </p>
      ) : null}
    </section>
  );
}
