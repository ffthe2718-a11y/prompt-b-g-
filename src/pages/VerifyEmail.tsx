import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { authApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { BrandLink } from "@/components/platform/Brand";
import { toast } from "sonner";
import { AlertTriangle, ArrowRight, BadgeCheck, Loader2, MailCheck, RefreshCw } from "lucide-react";

type Phase = "checking" | "success" | "error";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { user, refresh, setUserFromServer } = useAuth();
  const [phase, setPhase] = useState<Phase>(token ? "checking" : "error");
  const [message, setMessage] = useState(
    token ? "" : "This link is missing its verification code. Request a new email from your dashboard."
  );
  const [resending, setResending] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    (async () => {
      try {
        const result = await authApi.verifyEmail(token);
        if (result.user) setUserFromServer(result.user);
        setMessage(result.message || "Your email address is confirmed.");
        setPhase("success");
        void refresh();
      } catch (error: any) {
        setMessage(error?.message || "This verification link could not be used. Request a new email.");
        setPhase("error");
      }
    })();
  }, [token, refresh, setUserFromServer]);

  const resend = async () => {
    setResending(true);
    try {
      const result = await authApi.sendVerification();
      toast.success(result.message);
    } catch (error: any) {
      toast.error(error?.message || "Could not send the verification email.");
    } finally {
      setResending(false);
    }
  };

  const destination = user?.role === "super_admin" ? "/admin" : user?.salon ? "/dashboard" : "/onboarding";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-4 py-4 sm:px-8">
        <BrandLink />
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center"
        >
          <div
            className={
              phase === "success"
                ? "mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10"
                : phase === "error"
                  ? "mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-red-500/30 bg-red-500/10"
                  : "mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10"
            }
          >
            {phase === "checking" ? (
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            ) : phase === "success" ? (
              <MailCheck className="h-6 w-6 text-emerald-400" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-red-400" />
            )}
          </div>

          <h1 className="mt-5 font-serif text-2xl text-foreground">
            {phase === "checking"
              ? "Confirming your email"
              : phase === "success"
                ? "Email confirmed"
                : "We couldn't confirm this link"}
          </h1>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
            {phase === "checking" ? "One moment while we check the link." : message}
          </p>

          {phase === "success" && (
            <div className="mt-5 flex flex-col gap-2">
              <Link
                to={destination}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[9px] font-bold uppercase tracking-[0.16em] text-black"
              >
                {user?.salon ? "Open your dashboard" : "Continue setup"} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <p className="flex items-center justify-center gap-1 text-[9px] text-muted-foreground">
                <BadgeCheck className="h-3 w-3 text-emerald-400" /> You can now submit your website for approval.
              </p>
            </div>
          )}

          {phase === "error" && (
            <div className="mt-5 flex flex-col gap-2">
              {user && (
                <button
                  onClick={() => void resend()}
                  disabled={resending}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[9px] font-bold uppercase tracking-[0.16em] text-black disabled:opacity-50"
                >
                  {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                  Send a new link
                </button>
              )}
              <Link
                to="/login"
                className="inline-flex h-10 items-center justify-center rounded-full border border-border px-5 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
