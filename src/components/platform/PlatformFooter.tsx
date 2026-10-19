import { Link } from "react-router-dom";
import { ArrowUpRight, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { BrandMark } from "@/components/platform/Brand";

const product = [
  { label: "Features", to: "/#features" },
  { label: "Templates", to: "/#templates" },
  { label: "Live salon sites", to: "/marketplace" },
  { label: "Pricing", to: "/pricing" },
];
const owners = [
  { label: "Create your site", to: "/signup" },
  { label: "Sign in", to: "/login" },
  { label: "Owner dashboard", to: "/dashboard" },
  { label: "Publish guide", to: "/#how-it-works" },
];

export default function PlatformFooter() {
  return (
    <footer className="border-t border-border bg-gradient-to-b from-background via-card/40 to-black">
      <div className="mx-auto w-full max-w-[1440px] px-4 py-14 sm:px-8 lg:px-12">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
          <div>
            <BrandMark />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              The white-label website builder for independent salons, barbers and beauty studios. Your brand, your
              content, your bookings — all in one place.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> All systems operational
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-primary" /> Your data, isolated
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">Platform</h4>
            <ul className="space-y-3">
              {product.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
                  >
                    {link.label}
                    <ArrowUpRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">For owners</h4>
            <ul className="space-y-3">
              {owners.map((link) => (
                <li key={link.label}>
                  <Link to={link.to} className="text-xs text-muted-foreground transition-colors hover:text-primary">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-[10px] font-bold uppercase tracking-[0.25em] text-foreground">Talk to us</h4>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Questions about launching your salon online? We usually reply within one business day.
            </p>
            <a
              href="mailto:hello@velvetstudio.app"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Mail className="h-3.5 w-3.5 text-primary" />
              hello@velvetstudio.app
            </a>
            <Link
              to="/signup"
              className="mt-4 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-3 text-xs font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" /> Launch your salon site
              </span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-border/70 pt-6 text-center sm:flex-row sm:text-left">
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            © {new Date().getFullYear()} Velvet Salon Studio. Built for independent businesses.
          </p>
          <div className="flex items-center gap-5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
            <Link to="/pricing" className="hover:text-primary">
              Pricing
            </Link>
            <a href="mailto:hello@velvetstudio.app?subject=Privacy" className="hover:text-primary">
              Privacy
            </a>
            <a href="mailto:hello@velvetstudio.app?subject=Terms" className="hover:text-primary">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
