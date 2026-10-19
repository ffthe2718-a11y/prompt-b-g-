import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowRight, Check, Globe2, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const included = [
  "Your own public salon website",
  "Unique live address on your domain",
  "Unlimited services, prices & categories",
  "Staff profiles with specialties",
  "Online booking requests & calendar",
  "Gallery and client reviews",
  "Logo, hero and about imagery uploads",
  "Full color and template customisation",
  "SEO title, description & rich metadata",
  "Mobile-first design out of the box",
];

export default function Pricing() {
  const { user } = useAuth();
  const startLink = user ? (user.role === "super_admin" ? "/admin" : user.salon ? "/dashboard" : "/onboarding") : "/signup";

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-1/2 top-[-200px] h-[500px] w-[780px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <section className="mx-auto w-full max-w-[1200px] px-4 pb-16 pt-14 sm:px-8 sm:pt-20">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
            <Sparkles className="h-3 w-3" /> Simple, honest pricing
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl font-light text-4xl leading-[1.02] tracking-tight sm:text-6xl">
            Everything you need to be <span className="font-serif italic text-primary">online</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
            No setup fees. No commission on bookings. No credit card. Velvet is free to launch while we welcome our
            first cohort of independent salons.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-background to-primary/[0.05] p-7 sm:p-10"
          >
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Studio plan</p>
                  <h2 className="mt-2 font-serif text-3xl text-foreground">Your whole salon, online</h2>
                </div>
                <div className="rounded-2xl border border-primary/25 bg-primary/5 px-4 py-2 text-center">
                  <p className="font-serif text-3xl text-primary">Free</p>
                  <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">early access</p>
                </div>
              </div>

              <div className="mt-8 grid gap-2.5 sm:grid-cols-2">
                {included.map((item) => (
                  <div key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-2.5 w-2.5" />
                    </span>
                    <span className="text-[11px] leading-relaxed text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border/70 pt-6 sm:flex-row sm:items-center">
                <p className="max-w-xs text-[10px] leading-relaxed text-muted-foreground">
                  No commission on your bookings. No lock-in. You can export your booking list at any time.
                </p>
                <Button
                  asChild
                  className="h-11 w-full rounded-full bg-primary px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-black shadow-lg shadow-primary/20 sm:w-auto"
                >
                  <Link to={startLink}>
                    Start free <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col gap-5"
          >
            <div className="rounded-3xl border border-border bg-card/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/5">
                <Globe2 className="h-4 w-4 text-primary" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-foreground">Bring your own domain</h3>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                Every salon gets a free path-based address immediately. Connect a custom domain when you are ready
                with a single DNS record — we verify it for you.
              </p>
              <div className="mt-4 rounded-xl border border-border bg-background/60 p-3 font-mono text-[10px] text-muted-foreground">
                <p className="text-primary">https://your-salon.com/yourname</p>
                <p className="mt-1">https://www.yoursalon.com</p>
              </div>
            </div>

            <div className="rounded-3xl border border-border bg-card/60 p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/5">
                <Mail className="h-4 w-4 text-primary" />
              </div>
              <h3 className="mt-4 font-serif text-xl text-foreground">Multiple locations?</h3>
              <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
                We are building multi-location support. If you run a group of salons and need a bespoke setup, write
                to us and we will help you launch.
              </p>
              <a
                href="mailto:hello@velvetstudio.app?subject=Multi-location%20salon%20group"
                className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary hover:underline"
              >
                Talk to us <ArrowRight className="h-3 w-3" />
              </a>
            </div>
          </motion.div>
        </div>

        <p className="mt-10 text-center text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
          Early-access pricing may change for new accounts in the future. Existing sites will always be notified
          first.
        </p>
      </section>
    </div>
  );
}
