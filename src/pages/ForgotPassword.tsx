import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandMark } from "@/components/platform/Brand";
import { authApi } from "@/lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.forgotPassword(email.trim());
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Something went wrong. Please try again.");
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
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/25 bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-400" />
              </div>
              <h1 className="mt-6 font-serif text-3xl text-foreground">Check your inbox</h1>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                If an account exists for <span className="font-medium text-foreground">{email}</span>, we have sent a
                link to choose a new password. The link is valid for one hour.
              </p>
              <p className="mt-4 rounded-xl border border-border bg-card/50 p-3 text-[10px] leading-relaxed text-muted-foreground">
                Nothing arrived? Check your spam folder, or try again in a few minutes. On local development without
                SMTP configured, the reset link is printed in the server console.
              </p>
              <Button
                asChild
                variant="outline"
                className="mt-6 h-11 w-full rounded-full border-border text-[10px] font-bold uppercase tracking-[0.18em]"
              >
                <Link to="/login">Return to sign in</Link>
              </Button>
            </div>
          ) : (
            <>
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">Account recovery</span>
              <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">Forgot your password?</h1>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                Enter the email you use for your salon dashboard and we will send you a link to choose a new password.
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                      autoFocus
                      className="h-12 rounded-xl border-border bg-card/60 pl-10 text-sm focus-visible:border-primary"
                      required
                    />
                  </div>
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
                  Send reset link
                </Button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
