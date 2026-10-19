import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, LayoutDashboard, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { BrandLink } from "@/components/platform/Brand";
import { cn } from "@/lib/utils";

const links = [
  { label: "Features", to: "/#features" },
  { label: "Live sites", to: "/marketplace" },
  { label: "Templates", to: "/#templates" },
  { label: "Pricing", to: "/pricing" },
];

export default function PlatformNavbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const destination = user ? (user.role === "super_admin" ? "/admin" : user.salon ? "/dashboard" : "/onboarding") : null;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-all duration-500",
        scrolled ? "border-border/80 bg-background/90 backdrop-blur-xl shadow-xl shadow-black/20" : "border-transparent bg-transparent"
      )}
    >
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between gap-4 px-4 py-3 sm:px-8 lg:px-12">
        <BrandLink />

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((link) =>
            link.to.startsWith("/#") ? (
              <a
                key={link.label}
                href={link.to}
                className="nav-underline-anim text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground transition-colors hover:text-primary"
              >
                {link.label}
              </a>
            ) : (
              <Link
                key={link.label}
                to={link.to}
                className={cn(
                  "nav-underline-anim text-[11px] font-semibold uppercase tracking-[0.22em] transition-colors hover:text-primary",
                  location.pathname === link.to ? "text-primary active" : "text-muted-foreground"
                )}
              >
                {link.label}
              </Link>
            )
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user && destination ? (
            <>
              <Link
                to={destination}
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
              >
                {user.name.split(" ")[0] || "Account"}
              </Link>
              <Button asChild className="h-10 rounded-full bg-primary px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-primary/90">
                <Link to={destination}>
                  <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
                </Link>
              </Button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground transition-colors hover:text-primary"
              >
                Sign in
              </Link>
              <Button asChild className="h-10 rounded-full bg-primary px-5 text-[10px] font-bold uppercase tracking-[0.18em] text-black hover:bg-primary/90">
                <Link to="/signup">
                  Start free <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-border bg-background/95 backdrop-blur-xl md:hidden"
          >
            <div className="space-y-1 px-4 py-4">
              {links.map((link) =>
                link.to.startsWith("/#") ? (
                  <a
                    key={link.label}
                    href={link.to}
                    onClick={() => setOpen(false)}
                    className="block rounded-xl px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-white/5 hover:text-primary"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.to}
                    className="block rounded-xl px-3 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground hover:bg-white/5 hover:text-primary"
                  >
                    {link.label}
                  </Link>
                )
              )}
              <div className="grid grid-cols-2 gap-3 pt-3">
                {user && destination ? (
                  <Button asChild className="col-span-2 h-11 rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                    <Link to={destination}>Open dashboard</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" className="h-11 rounded-full border-border text-[10px] font-bold uppercase tracking-[0.2em]">
                      <Link to="/login">Sign in</Link>
                    </Button>
                    <Button asChild className="h-11 rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.2em] text-black">
                      <Link to="/signup">Start free</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
