import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { AlertTriangle, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/platform/Brand";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

/**
 * Landing page for the Google OAuth round-trip.
 *
 * The server redirects here with a short-lived, single-use exchange code in
 * the URL fragment (never a session token, and the fragment is not sent to
 * servers or leaked through Referer). We trade it for a real session.
 */
export default function GoogleCallback() {
  const { loginWithGoogleCode } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const code = params.get("code") || "";
    const next = params.get("next") || "";
    window.history.replaceState(null, "", window.location.pathname);

    if (!code) {
      setError("This sign-in link is incomplete. Please start again from the login page.");
      return;
    }

    loginWithGoogleCode(code)
      .then((user) => {
        const destination =
          next.startsWith("/") && !next.startsWith("//")
            ? next
            : user.role === "super_admin"
              ? "/admin"
              : user.salon
                ? "/dashboard"
                : "/onboarding";
        toast.success(`Signed in with Google${user.name ? `, ${user.name.split(" ")[0]}` : ""}.`);
        navigate(destination, { replace: true });
      })
      .catch((err: any) => {
        setError(err?.message || "Google sign-in could not be completed. Please try again.");
      });
  }, [loginWithGoogleCode, navigate]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <Link to="/" className="mb-10">
        <BrandMark />
      </Link>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card/60 p-8 text-center"
      >
        {error ? (
          <>
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <h1 className="mt-4 font-serif text-xl text-foreground">We couldn't sign you in</h1>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{error}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-[9px] font-bold uppercase tracking-[0.18em] text-black"
            >
              Back to sign in <ArrowRight className="h-3 w-3" />
            </Link>
          </>
        ) : (
          <>
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
            <h1 className="mt-4 font-serif text-xl text-foreground">Finishing sign-in</h1>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Verifying your Google account and opening your studio…
            </p>
            <span className="mt-5 inline-flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
              <ShieldCheck className="h-3 w-3 text-primary/60" /> Secure handoff
            </span>
          </>
        )}
      </motion.div>
    </div>
  );
}
