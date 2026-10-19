import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck,
  Check,
  ChevronRight,
  CreditCard,
  Globe2,
  Image,
  Layers,
  LayoutTemplate,
  LockKeyhole,
  Mail,
  Menu,
  Palette,
  Scissors,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  Store,
  Users,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { usePlatformConfig } from "@/context/PlatformConfigContext";
import { publicApi } from "@/lib/api";
import type { SalonSummary } from "@/types/salon";
import SalonCard from "@/components/salon/SalonCard";
import { cn } from "@/lib/utils";

const HERO_IMAGE = "/images/salon-hero.jpg";

const features = [
  {
    icon: Zap,
    title: "Launch in minutes",
    body: "A guided onboarding walks you through your brand, services, team and contact details. No code, no calls, no waiting.",
  },
  {
    icon: Globe2,
    title: "Your own live URL",
    body: "Every salon gets a unique, shareable website address the moment you publish — ready for Instagram, Google and WhatsApp.",
  },
  {
    icon: Scissors,
    title: "Services & prices",
    body: "Build a clean, structured menu with categories, durations and exact pricing. Edit it any time from your dashboard.",
  },
  {
    icon: Users,
    title: "Your team, front and centre",
    body: "Add stylists and therapists with photos, roles, specialties and experience — then let clients book with the right person.",
  },
  {
    icon: CalendarCheck,
    title: "Real online bookings",
    body: "A built-in booking flow that respects your opening hours and existing appointments. Requests land straight in your dashboard.",
  },
  {
    icon: Palette,
    title: "Fully white-label",
    body: "Your logo, hero image, colors and copy on a website that looks like you built it from scratch. Because you did.",
  },
  {
    icon: Image,
    title: "Gallery & reviews",
    body: "Showcase your best work and collect genuine client reviews. Moderate replies without leaving the dashboard.",
  },
  {
    icon: ShieldCheck,
    title: "Isolated by design",
    body: "Every salon's content, bookings and clients live in their own space. No shared databases, no accidental leaks.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first, always",
    body: "Your site and dashboard are designed for the way clients and owners actually browse — beautifully on any screen.",
  },
];

const steps = [
  {
    number: "01",
    title: "Create your account",
    body: "Sign up with your email and tell us your salon name. Your private workspace is ready instantly.",
  },
  {
    number: "02",
    title: "Make it yours",
    body: "Add your logo, photos, services, staff, hours and colors. Watch the live preview update as you go.",
  },
  {
    number: "03",
    title: "Publish & share",
    body: "Hit publish and share your unique link. Take bookings, collect reviews and update your site whenever you like.",
  },
];

const templates = [
  {
    id: "luxury",
    name: "Luxury Gold",
    mood: "Dark, sculptural, high-glamour",
    bg: "linear-gradient(160deg,#17140b 0%,#080807 58%,#2a2212 100%)",
    text: "#f5ecdc",
    accent: "#d4af37",
    secondary: "#8a7a54",
  },
  {
    id: "blush",
    name: "Blush Atelier",
    mood: "Warm, editorial, soft luxury",
    bg: "linear-gradient(160deg,#fbf3ed 0%,#f3e2d8 55%,#e9d2c6 100%)",
    text: "#2c221d",
    accent: "#b76e79",
    secondary: "#9b8a7f",
  },
  {
    id: "noir",
    name: "Noir Minimal",
    mood: "Clean, monochrome, modern",
    bg: "linear-gradient(160deg,#19191c 0%,#09090a 58%,#222226 100%)",
    text: "#f5f5f4",
    accent: "#d6d3d1",
    secondary: "#8a8a8a",
  },
  {
    id: "emerald",
    name: "Emerald Spa",
    mood: "Earthy, calm, wellness-led",
    bg: "linear-gradient(160deg,#0d211a 0%,#07120e 58%,#143529 100%)",
    text: "#f2efe4",
    accent: "#c9a86a",
    secondary: "#86a294",
  },
];

function HeroMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <div className="absolute -left-10 top-20 h-52 w-52 rounded-full bg-primary/15 blur-3xl" />
      <div className="absolute -right-8 bottom-10 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 24, rotate: -1.5 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
        className="relative overflow-hidden rounded-[24px] border border-white/15 bg-zinc-950 shadow-[0_40px_120px_rgba(0,0,0,0.65)]"
      >
        <div className="flex items-center gap-2 border-b border-white/10 bg-zinc-900/90 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-red-400/70" />
          <span className="h-2 w-2 rounded-full bg-amber-300/70" />
          <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
          <div className="ml-3 flex flex-1 items-center gap-1.5 rounded-full border border-white/10 bg-black/50 px-3 py-1">
            <LockKeyhole className="h-2.5 w-2.5 text-emerald-400" />
            <span className="truncate font-mono text-[9px] text-zinc-400">yourdomain.com/your-salon</span>
          </div>
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-400">
            Live
          </span>
        </div>

        <div className="relative h-[430px] overflow-hidden sm:h-[470px]">
          <img
            src={HERO_IMAGE}
            alt="Salon interior preview"
            className="absolute inset-0 h-full w-full object-cover opacity-45"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/25 to-black" />
          <div className="relative flex h-full flex-col items-center justify-center px-8 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full border border-white/25 bg-black/35 backdrop-blur-md">
              <Scissors className="h-6 w-6 rotate-45 text-primary" />
            </div>
            <span className="mb-2 text-[8px] font-bold uppercase tracking-[0.42em] text-primary">Your brand</span>
            <h3 className="font-serif text-4xl leading-tight text-white">Your salon name</h3>
            <p className="mt-3 max-w-[260px] text-[11px] leading-relaxed text-zinc-300">
              Your story, your services, your team — beautifully online, in your colors.
            </p>
            <div className="mt-6 flex items-center gap-2">
              <span className="rounded-full bg-primary px-4 py-2 text-[8px] font-bold uppercase tracking-[0.18em] text-black">
                Book appointment
              </span>
              <span className="rounded-full border border-white/25 px-4 py-2 text-[8px] font-bold uppercase tracking-[0.18em] text-white">
                Explore services
              </span>
            </div>
            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-3 gap-2">
              {["Hair", "Colour", "Bridal"].map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-white/10 bg-white/[0.06] px-2 py-2 backdrop-blur-md"
                >
                  <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-white/70">{item}</span>
                  <div className="mt-1.5 h-1 w-8 rounded-full bg-primary/60" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.65, duration: 0.6 }}
        className="absolute -left-4 top-28 hidden rounded-2xl border border-white/15 bg-black/70 px-4 py-3 shadow-2xl backdrop-blur-xl sm:block"
      >
        <p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[0.16em] text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Site published
        </p>
        <p className="mt-1 font-mono text-[10px] text-white/70">your-salon.com/slug</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute -bottom-6 -right-3 hidden rounded-2xl border border-white/15 bg-black/75 p-4 shadow-2xl backdrop-blur-xl sm:block"
      >
        <div className="flex items-center gap-2">
          <Palette className="h-4 w-4 text-primary" />
          <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/70">Your palette</span>
        </div>
        <div className="mt-2 flex gap-1.5">
          {["#D4AF37", "#F4E4BC", "#0A0A0A", "#2A2A2A"].map((color) => (
            <span
              key={color}
              className="h-5 w-5 rounded-full border border-white/25"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
}

export default function PlatformHome() {
  const { user } = useAuth();
  const { supportEmail } = usePlatformConfig();
  const [salons, setSalons] = useState<SalonSummary[]>([]);
  const [loadingSalons, setLoadingSalons] = useState(true);

  const startLink = user ? (user.role === "super_admin" ? "/admin" : user.salon ? "/dashboard" : "/onboarding") : "/signup";

  useEffect(() => {
    let cancelled = false;
    publicApi
      .listSalons()
      .then(({ salons: list }) => {
        if (!cancelled) setSalons(list.slice(0, 3));
      })
      .catch(() => {
        if (!cancelled) setSalons([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingSalons(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const heroWords = useMemo(() => ["YOUR", "SALON."], []);

  return (
    <div className="relative overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]">
        <div className="absolute left-1/2 top-[-280px] h-[620px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[130px]" />
        <div className="absolute right-0 top-[420px] h-[320px] w-[320px] rounded-full bg-amber-700/10 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.35) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.35) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage: "linear-gradient(to bottom, black, transparent 70%)",
            WebkitMaskImage: "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />
      </div>

      {/* HERO */}
      <section className="mx-auto w-full max-w-[1440px] px-4 pb-16 pt-10 sm:px-8 sm:pt-16 lg:px-12 lg:pb-24 lg:pt-20">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3.5 py-1.5"
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
                White-label salon websites
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.75, delay: 0.08 }}
              className="mt-7 font-light leading-[0.95] tracking-tight text-foreground"
            >
              <span className="block text-5xl sm:text-6xl md:text-7xl xl:text-[92px]">
                {heroWords[0]}
                <br className="hidden sm:block" />
                {heroWords[1]}
              </span>
              <span className="mt-2 block font-serif text-5xl italic text-primary sm:text-6xl md:text-7xl xl:text-[92px]">
                Your website.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.16 }}
              className="mt-7 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-[15px]"
            >
              Build a beautiful, booking-ready website for your salon in minutes. Your name, logo, services, prices,
              team and colors — no developers, no templates to wrestle with, no shared marketplace profile.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.24 }}
              className="mt-9 flex flex-col gap-3 sm:flex-row"
            >
              <Button
                asChild
                className="h-12 rounded-full bg-primary px-7 text-[10px] font-bold uppercase tracking-[0.2em] text-black shadow-xl shadow-primary/20 hover:bg-primary/90"
              >
                <Link to={startLink}>
                  {user ? "Open your studio" : "Build your salon site"}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 rounded-full border-border bg-card/50 px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-foreground hover:bg-white/5"
              >
                <Link to="/marketplace">
                  Explore live sites <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.7 }}
              className="mt-9 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              {["Free to launch", "No code needed", "Live in minutes"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5">
                  <Check className="h-3 w-3 text-primary" /> {item}
                </span>
              ))}
            </motion.div>
          </div>

          <HeroMockup />
        </div>
      </section>

      {/* STATS STRIP */}
      <section className="border-y border-border/70 bg-card/30">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 divide-x divide-border/70 px-4 sm:px-8 lg:grid-cols-4 lg:px-12">
          {[
            { label: "Your brand, front to back", value: "100%" },
            { label: "Unique live website", value: "1 per salon" },
            { label: "Owners per dashboard", value: "Just you" },
            { label: "Code required", value: "Zero" },
          ].map((stat) => (
            <div key={stat.label} className="px-4 py-6 text-center sm:py-8">
              <p className="font-serif text-xl text-foreground sm:text-2xl">{stat.value}</p>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="mx-auto w-full max-w-[1440px] scroll-mt-24 px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">Everything included</span>
            <h2 className="mt-4 font-light leading-[1.02] tracking-tight text-foreground">
              <span className="block text-4xl sm:text-5xl">One dashboard.</span>
              <span className="block font-serif text-4xl italic text-primary sm:text-5xl">Your whole salon.</span>
            </h2>
            <p className="mt-5 max-w-md text-sm leading-relaxed text-muted-foreground">
              From your first service to your hundredth booking, everything happens in one calm, considered place.
              No add-ons, no plugins, no learning curve.
            </p>
            <div className="mt-8 hidden overflow-hidden rounded-2xl border border-border bg-card/60 p-5 lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
                  <LayoutTemplate className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Preview before you publish</p>
                  <p className="text-[10px] text-muted-foreground">Drafts stay private until you are ready.</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-emerald-400">
                  Draft saved
                </span>
                <span className="rounded-full border border-border bg-background px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Preview
                </span>
                <span className="rounded-full bg-primary px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-black">
                  Publish
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 14 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.45, delay: (index % 2) * 0.05 }}
                  className="group rounded-2xl border border-border bg-card/50 p-5 transition-all duration-300 hover:border-primary/30 hover:bg-card"
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl border border-primary/20 bg-primary/5 text-primary transition-transform duration-300 group-hover:scale-110">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{feature.body}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="scroll-mt-24 border-y border-border/60 bg-gradient-to-b from-card/30 via-background to-background">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="mb-12 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">Three steps</span>
              <h2 className="mt-3 font-light text-4xl tracking-tight sm:text-5xl">
                From name to <span className="font-serif italic text-primary">live</span>.
              </h2>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              Most owners publish their first site in under ten minutes. You can always come back and refine it.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="relative overflow-hidden rounded-3xl border border-border bg-card/50 p-6 sm:p-8"
              >
                <span className="absolute -right-2 -top-5 font-serif text-[92px] leading-none text-primary/[0.07]">
                  {step.number}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-primary">{step.number}</span>
                <h3 className="mt-6 font-serif text-2xl text-foreground">{step.title}</h3>
                <p className="mt-3 max-w-xs text-xs leading-relaxed text-muted-foreground">{step.body}</p>
                {index < 2 && (
                  <ChevronRight className="absolute bottom-6 right-6 h-4 w-4 text-primary/40" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LIVE SALONS */}
      <section id="live" className="mx-auto w-full max-w-[1440px] scroll-mt-24 px-4 py-20 sm:px-8 lg:px-12 lg:py-24">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">Real salons, real sites</span>
            <h2 className="mt-3 font-light text-4xl tracking-tight sm:text-5xl">
              Recently <span className="font-serif italic text-primary">published</span>.
            </h2>
          </div>
          <Button
            asChild
            variant="outline"
            className="h-10 w-fit rounded-full border-border px-5 text-[9px] font-bold uppercase tracking-[0.2em]"
          >
            <Link to="/marketplace">
              Browse all sites <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>

        {loadingSalons ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-3xl border border-border bg-card">
                <div className="aspect-[4/3] bg-white/5" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-2/3 rounded bg-white/5" />
                  <div className="h-3 w-1/2 rounded bg-white/5" />
                </div>
              </div>
            ))}
          </div>
        ) : salons.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {salons.map((salon) => (
              <SalonCard key={salon.id} salon={salon} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/30 px-6 py-14 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-primary/25 bg-primary/5">
              <Store className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-serif text-2xl text-foreground">Your salon could be the first here.</h3>
            <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted-foreground">
              Every site in this space is published by a real owner. Claim your spot and share your work with the
              world.
            </p>
            <Button asChild className="mt-6 h-11 rounded-full bg-primary px-7 text-[10px] font-bold uppercase tracking-[0.2em] text-black">
              <Link to={startLink}>Create your website</Link>
            </Button>
          </div>
        )}
      </section>

      {/* TEMPLATES */}
      <section id="templates" className="scroll-mt-24 border-y border-border/60 bg-card/20">
        <div className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-24">
          <div className="mb-10 max-w-2xl">
            <span className="text-[10px] font-bold uppercase tracking-[0.32em] text-primary">Designed to be yours</span>
            <h2 className="mt-3 font-light text-4xl tracking-tight sm:text-5xl">
              Start with a mood. <span className="font-serif italic text-primary">Make it yours.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Every template is a starting point for your colors, imagery and words — not a borrowed brand.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {templates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
              >
                <Link
                  to={`/signup?template=${template.id}`}
                  className="group block overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-primary/40"
                >
                  <div className="relative flex aspect-[4/5] flex-col p-4" style={{ background: template.bg, color: template.text }}>
                    <div className="flex items-center justify-between">
                      <span className="font-serif text-[9px] tracking-[0.24em] uppercase opacity-80">Your salon</span>
                      <span className="text-[8px] uppercase tracking-[0.2em] opacity-50">Menu</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center text-center">
                      <div
                        className="mb-4 flex h-10 w-10 items-center justify-center rounded-full border"
                        style={{ borderColor: `${template.accent}66`, color: template.accent }}
                      >
                        <Scissors className="h-3.5 w-3.5 rotate-45" />
                      </div>
                      <p className="font-serif text-2xl leading-tight">Your<br />salon name</p>
                      <p className="mt-2 text-[7px] uppercase tracking-[0.24em] opacity-60">Est. by you</p>
                      <span
                        className="mt-4 rounded-full px-3 py-1 text-[7px] font-bold uppercase tracking-[0.16em]"
                        style={{ backgroundColor: template.accent, color: template.id === "blush" ? "#fff" : "#0a0a0a" }}
                      >
                        Book now
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {[80, 60, 70].map((width) => (
                        <div key={width} className="flex justify-between">
                          <span className="h-1 rounded-full" style={{ width: `${width}%`, backgroundColor: template.secondary, opacity: 0.5 }} />
                          <span className="h-1 w-6 rounded-full" style={{ backgroundColor: template.accent, opacity: 0.7 }} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div>
                      <h3 className="text-xs font-semibold text-foreground">{template.name}</h3>
                      <p className="mt-0.5 text-[9px] text-muted-foreground">{template.mood}</p>
                    </div>
                    <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all group-hover:border-primary group-hover:bg-primary group-hover:text-black">
                      <ArrowUpRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-[1440px] px-4 py-20 sm:px-8 lg:px-12 lg:py-28">
        <div className="relative overflow-hidden rounded-[32px] border border-primary/25 bg-gradient-to-br from-card via-background to-primary/[0.06] px-6 py-14 text-center sm:px-14 sm:py-20">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[360px] w-[620px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[100px]" />
          <div className="relative">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
              <CreditCard className="h-3 w-3" /> Free to launch
            </span>
            <h2 className="mx-auto mt-6 max-w-2xl font-light text-4xl leading-[1.05] tracking-tight sm:text-6xl">
              Your chairs are full. <br />
              <span className="font-serif italic text-primary">Your website should be, too.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-muted-foreground">
              Join the owners who stopped renting space on someone else's marketplace and built a home for their
              brand.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 w-full rounded-full bg-primary px-8 text-[10px] font-bold uppercase tracking-[0.2em] text-black shadow-xl shadow-primary/20 sm:w-auto"
              >
                <Link to={startLink}>
                  Start building <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-12 w-full rounded-full border-border px-7 text-[10px] font-bold uppercase tracking-[0.2em] sm:w-auto"
              >
                <Link to="/marketplace">See examples</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-[1100px] px-4 pb-24 sm:px-8">
        <div className="grid gap-8 md:grid-cols-[0.7fr_1.3fr]">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Questions</span>
            <h2 className="mt-3 font-light text-3xl tracking-tight sm:text-4xl">
              Good to <span className="font-serif italic text-primary">know</span>.
            </h2>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-muted-foreground">
              Still curious? Write to us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                {supportEmail}
              </a>
              .
            </p>
          </div>
          <div className="divide-y divide-border/70 border-y border-border/70">
            {[
              {
                q: "Do I need a designer or developer?",
                a: "No. Onboarding collects everything the site needs, and every field can be edited later from your dashboard. Colors, fonts and layouts are handled for you.",
              },
              {
                q: "What URL will my salon get?",
                a: "You choose a unique address such as yourdomain.com/your-salon. If you own a custom domain, you can connect it with a DNS record once your site is live.",
              },
              {
                q: "Can I change things after publishing?",
                a: "Yes. You can save drafts as often as you like, preview them privately, and publish when you are ready. Your live site stays up while you work.",
              },
              {
                q: "Will my data be mixed with other salons?",
                a: "Never. Every salon has its own isolated record, services, team, gallery, reviews and bookings. Your dashboard can only ever reach your salon.",
              },
              {
                q: "How much does it cost?",
                a: "Launching is free during our early-access period. There is no credit card required and no limit on how many services or team members you add.",
              },
            ].map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-medium text-foreground marker:hidden">
                  {item.q}
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform group-open:rotate-45">
                    <span className="text-lg leading-none">+</span>
                  </span>
                </summary>
                <p className="mt-3 max-w-xl text-xs leading-relaxed text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
