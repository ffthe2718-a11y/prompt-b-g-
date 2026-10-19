import { FormEvent, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/platform/Brand";
import { authApi } from "@/lib/api";
import { toast } from "sonner";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Choose a password of at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setDone(true);
      toast.success("Password updated. You can sign in now.");
      window.setTimeout(() => navigate("/login", { replace: true }), 2200);
    } catch (err: any) {
      setError(err?.message || "This reset link could not be used.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-4 py-10 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1040px] items-center justify-between">
        <Link to="/" aria-label="Velvet home">
          <BrandMark />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
        >
          <ArrowLeft className="h-3 w-3" /> Back to sign in
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-12">
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          {!token ? (
            <div className="text-center">
              <h1 className="font-serif text-3xl text-foreground">This link is incomplete</h1>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Reset links must be opened exactly as they were sent. Request a new email and try again.
              </p>
              <Button asChild className="mt-6 h-11 w-full rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                <Link to="/forgot-password">Request a new link</Link>
              </Button>
            </div>
          ) : done ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="mt-6 font-serif text-3xl text-foreground">Password updated</h1>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Taking you to sign in. You can close this page if nothing happens.
              </p>
              <Button asChild className="mt-6 h-11 w-full rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                <Link to="/login">Sign in now</Link>
              </Button>
            </div>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Almost there</span>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">Choose a new password.</h1>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Use at least eight characters. A short phrase is easier to remember than a scramble of symbols.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    New password
                  </Label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      type={show ? "text" : "password"}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      autoComplete="new-password"
                      autoFocus
                      className="h-12 rounded-xl border-border bg-card/60 pl-10 pr-11 text-sm focus-visible:border-primary"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShow((value) => !value)}
                      aria-label={show ? "Hide password" : "Show password"}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm" className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Confirm password
                  </Label>
                  <Input
                    id="confirm"
                    type={show ? "text" : "password"}
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    autoComplete="new-password"
                    className="h-12 rounded-xl border-border bg-card/60 text-sm focus-visible:border-primary"
                    required
                  />
                </div>

                {error && (
                  <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-[10px] leading-relaxed text-red-300">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="h-12 w-full rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.2em] text-black"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  Update password
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
