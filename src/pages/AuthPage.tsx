import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/platform/Brand";
import { useAuth } from "@/context/AuthContext";
import { usePlatformConfig } from "@/context/PlatformConfigContext";
import { authApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SIDE_IMAGE = "/images/auth-side.jpg";

function GoogleGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09Z" />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.7 0 3.99 2.47 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75Z"
      />
    </svg>
  );
}

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { user, loading, login, register } = useAuth();
  const { signupsEnabled } = usePlatformConfig();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const template = params.get("template") || "";
  const from = (location.state as { from?: string } | null)?.from;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [error, setError] = useState("");
  const [googleEnabled, setGoogleEnabled] = useState<boolean | null>(null);

  const isSignup = mode === "signup";

  useEffect(() => {
    setError("");
  }, [mode]);

  useEffect(() => {
    let active = true;
    authApi
      .googleStatus()
      .then((status) => {
        if (active) setGoogleEnabled(status.enabled);
      })
      .catch(() => {
        if (active) setGoogleEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Surface a failed Google round-trip, then clean the URL.
  useEffect(() => {
    const failure = params.get("google_error");
    if (!failure) return;
    const message = params.get("google_message") || "Google sign-in could not be completed. Please try again.";
    setError(message);
    const next = new URLSearchParams(params);
    next.delete("google_error");
    next.delete("google_message");
    const query = next.toString();
    navigate(`${isSignup ? "/signup" : "/login"}${query ? `?${query}` : ""}`, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loading && user && !finished) {
    if (from && from !== "/login" && from !== "/signup") return <Navigate to={from} replace />;
    if (user.role === "super_admin") return <Navigate to="/admin" replace />;
    return <Navigate to={user.salon ? "/dashboard" : "/onboarding"} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (isSignup && name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      if (isSignup) {
        if (template) {
          try {
            sessionStorage.setItem("velvet_template", template);
            if (params.get("primary")) sessionStorage.setItem("velvet_primary", params.get("primary")!);
            if (params.get("accent")) sessionStorage.setItem("velvet_accent", params.get("accent")!);
            if (params.get("name")) sessionStorage.setItem("velvet_name", params.get("name")!);
          } catch {
            /* noop */
          }
        }
        const created = await register(name.trim(), email.trim(), password);
        setFinished(true);
        toast.success(`Welcome to Velvet, ${created.name.split(" ")[0]}.`, {
          description: "Let's build your salon website.",
        });
        const forward = new URLSearchParams();
        if (template) forward.set("template", template);
        if (params.get("primary")) forward.set("primary", params.get("primary")!);
        if (params.get("accent")) forward.set("accent", params.get("accent")!);
        if (params.get("name")) forward.set("name", params.get("name")!);
        if (params.get("tagline")) forward.set("tagline", params.get("tagline")!);
        const forwardQuery = forward.toString();
        navigate(forwardQuery ? `/onboarding?${forwardQuery}` : "/onboarding", {
          replace: true,
        });
      } else {
        const signedIn = await login(email.trim(), password);
        setFinished(true);
        toast.success(`Welcome back${signedIn.name ? `, ${signedIn.name.split(" ")[0]}` : ""}.`);
        const destination =
          from && from !== "/login" && from !== "/signup"
            ? from
            : signedIn.role === "super_admin"
              ? "/admin"
              : signedIn.salon
                ? "/dashboard"
                : "/onboarding";
        navigate(destination, { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      {/* Visual panel */}
      <div className="relative hidden overflow-hidden border-r border-border lg:block">
        <img
          src={SIDE_IMAGE}
          alt="Stylist at work in a salon"
          className="absolute inset-0 h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/65 to-black/90" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(212,175,55,0.16),transparent_45%)]" />

        <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
          <BrandMark />
          <div className="max-w-lg">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">A home for your craft</span>
            <h1 className="mt-5 font-light text-5xl leading-[1.03] tracking-tight text-white xl:text-6xl">
              Your salon deserves a website that feels <span className="font-serif italic text-primary">like you</span>.
            </h1>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/60">
              Build your brand, present your services and take bookings from one beautifully simple dashboard.
              Launch today — no code, no commission, no shared marketplace profile.
            </p>
            <div className="mt-10 space-y-3">
              {[
                "Your own live address and custom domain support",
                "Services, staff, gallery, reviews and bookings",
                "Save drafts, preview privately, publish when ready",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3 text-xs text-white/75">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.22em] text-white/40">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-primary/70" /> Isolated salon data
            </span>
            <span className="inline-flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-primary/70" /> Free early access
            </span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="relative flex min-h-screen flex-col justify-center overflow-y-auto px-4 py-10 sm:px-8 lg:px-14 xl:px-20">
        <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 rounded-full bg-primary/[0.06] blur-3xl" />
        <div className="relative mx-auto w-full max-w-[420px]">
          <div className="mb-10 flex items-center justify-between lg:hidden">
            <BrandMark />
            <Link to="/" className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground hover:text-primary">
              <ArrowLeft className="h-3 w-3" /> Home
            </Link>
          </div>

          <Link
            to="/"
            className="mb-8 hidden items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary lg:inline-flex"
          >
            <ArrowLeft className="h-3 w-3" /> Back to Velvet
          </Link>

          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">
              {isSignup ? "Create your studio" : "Welcome back"}
            </span>
            <h2 className="mt-3 font-serif text-4xl leading-tight text-foreground">
              {isSignup ? "Let's get you online." : "Your studio is waiting."}
            </h2>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              {isSignup
                ? "One account. One salon website. Everything you need to take bookings and show your work."
                : "Sign in to update your website, manage bookings or publish new changes."}
            </p>

            {googleEnabled && (
              <div className="mt-8 space-y-4">
                <button
                  type="button"
                  disabled={isSignup && !signupsEnabled}
                  onClick={() => {
                    const returnTo = from || (isSignup ? "/onboarding" : "/dashboard");
                    window.location.href = authApi.googleStartUrl(returnTo);
                  }}
                  className="flex h-12 w-full items-center justify-center gap-2.5 rounded-full border border-border bg-card/60 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground transition-colors hover:border-primary/50 hover:bg-card disabled:opacity-40"
                >
                  <GoogleGlyph className="h-4 w-4" />
                  {isSignup ? "Sign up with Google" : "Continue with Google"}
                </button>
              </div>
            )}

            {googleEnabled && (
              <div className="my-5 flex items-center gap-3">
                <span className="h-px flex-1 bg-border" />
                <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                  or use email
                </span>
                <span className="h-px flex-1 bg-border" />
              </div>
            )}

            {googleEnabled === false && import.meta.env.DEV && (
              <p className="mt-6 rounded-xl border border-border/70 bg-card/40 px-3 py-2 text-[9px] leading-relaxed text-muted-foreground/70">
                Google sign-in appears here once <span className="font-mono">GOOGLE_CLIENT_ID</span> and{" "}
                <span className="font-mono">GOOGLE_CLIENT_SECRET</span> are set.
              </p>
            )}

            <form onSubmit={handleSubmit} className={cn("space-y-4", googleEnabled ? "mt-0" : "mt-8")}>
              {isSignup && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Your name
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="name"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Aisha Kapoor"
                      autoComplete="name"
                      className="h-12 rounded-xl border-border bg-card/60 pl-10 text-sm focus-visible:border-primary"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Email address
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="you@yoursalon.com"
                    autoComplete="email"
                    className="h-12 rounded-xl border-border bg-card/60 pl-10 text-sm focus-visible:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Password
                  </Label>
                  {!isSignup && (
                    <Link
                      to="/forgot-password"
                      className="text-[9px] font-medium text-muted-foreground transition-colors hover:text-primary"
                    >
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={isSignup ? "At least 8 characters" : "Your password"}
                    autoComplete={isSignup ? "new-password" : "current-password"}
                    className="h-12 rounded-xl border-border bg-card/60 pl-10 pr-10 text-sm focus-visible:border-primary"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isSignup && (
                  <div className="flex items-center gap-2 pt-1">
                    {[0, 1, 2].map((index) => (
                      <span
                        key={index}
                        className={cn(
                          "h-1 flex-1 rounded-full transition-colors",
                          password.length >= 8 + index * 3 ? "bg-primary" : "bg-border"
                        )}
                      />
                    ))}
                    <span className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">
                      {password.length >= 14 ? "Strong" : password.length >= 8 ? "Good" : "8+ characters"}
                    </span>
                  </div>
                )}
              </div>

              {isSignup && !signupsEnabled && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-3.5 py-2.5 text-[11px] leading-relaxed text-amber-200">
                  New sign-ups are paused right now. Existing owners can still sign in.
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3.5 py-2.5 text-[11px] leading-relaxed text-red-300">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting || (isSignup && !signupsEnabled)}
                className="h-12 w-full rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.22em] text-black shadow-xl shadow-primary/10 hover:bg-primary/90"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-black/30 border-t-black" />
                    {isSignup ? "Creating your studio…" : "Signing in…"}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    {isSignup ? "Create my studio" : "Sign in"} <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                )}
              </Button>
            </form>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              {isSignup ? "Already have a studio?" : "New to Velvet?"}{" "}
              <Link
                to={isSignup ? `/login${template ? `?template=${template}` : ""}` : `/signup${template ? `?template=${template}` : ""}`}
                className="font-semibold text-primary hover:underline"
              >
                {isSignup ? "Sign in" : "Create one free"}
              </Link>
            </p>

            <div className="mt-10 flex items-center justify-center gap-5 text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground/60">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="h-3 w-3 text-primary/60" /> Secure sign-in
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-primary/60" /> Private by default
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
