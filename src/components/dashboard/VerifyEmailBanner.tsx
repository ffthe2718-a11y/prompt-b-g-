import { useState } from "react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Loader2, MailWarning, Send } from "lucide-react";

/**
 * Owners must confirm their email before a website can be submitted for
 * approval, so the reminder follows them across the dashboard and wizard.
 */
export default function VerifyEmailBanner({ compact = false }: { compact?: boolean }) {
  const { user } = useAuth();
  const [sending, setSending] = useState(false);
  if (!user || user.emailVerified) return null;

  const resend = async () => {
    setSending(true);
    try {
      const result = await authApi.sendVerification();
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error?.message || "Could not send the verification email.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className={
        compact
          ? "flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-500/25 bg-sky-500/[0.06] px-3 py-2"
          : "flex flex-col justify-between gap-3 rounded-2xl border border-sky-500/25 bg-sky-500/[0.06] p-4 sm:flex-row sm:items-center"
      }
    >
      <div className="flex min-w-0 items-start gap-2.5">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
        <div>
          <p className="text-[10px] font-semibold text-foreground">Confirm your email address</p>
          <p className="text-[9px] leading-relaxed text-muted-foreground">
            We sent a link to <span className="text-foreground">{user.email}</span>. Confirming it unlocks website
            submission and password recovery.
          </p>
        </div>
      </div>
      <button
        onClick={() => void resend()}
        disabled={sending}
        className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-sky-300 disabled:opacity-50"
      >
        {sending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
        Resend link
      </button>
    </div>
  );
}
