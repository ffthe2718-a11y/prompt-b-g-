import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock,
  Eye,
  Globe2,
  Heart,
  Instagram,
  Laptop,
  Layers,
  LockKeyhole,
  MapPin,
  MessageSquareQuote,
  Palette,
  Phone,
  RefreshCw,
  RotateCcw,
  Scissors,
  Share2,
  Smartphone,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { TemplateId } from "@/types/salon";

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  tagline: string;
  mood: string;
  description: string;
  defaultSalonName: string;
  defaultTagline: string;
  primary: string;
  accent: string;
  bgGradient: string;
  surfaceBg: string;
  heroImage: string;
  isLight: boolean;
  curatedSwatches: string[];
  sampleServices: Array<{
    name: string;
    category: string;
    price: string;
    duration: string;
  }>;
  review: {
    author: string;
    role: string;
    stars: number;
    quote: string;
    date: string;
  };
  bestFor: string;
}

export const TEMPLATE_DEFINITIONS: Record<TemplateId, TemplateDefinition> = {
  luxury: {
    id: "luxury",
    name: "Luxury Gold",
    tagline: "High-glamour & sculptural elegance",
    mood: "Dark & High-Glamour",
    description: "Designed for premium boutique salons and high-end studios that command luxury pricing.",
    defaultSalonName: "Maison d'Or Studio",
    defaultTagline: "Bespoke Balayage, Colour Artistry & Botanical Haircare",
    primary: "#D4AF37",
    accent: "#F4E4BC",
    bgGradient: "linear-gradient(160deg, #17140b 0%, #080807 58%, #2a2212 100%)",
    surfaceBg: "#100f0b",
    heroImage: "/images/salon-hero.jpg",
    isLight: false,
    curatedSwatches: ["#D4AF37", "#E5C158", "#C59B27", "#E2B870", "#F3D089"],
    sampleServices: [
      { name: "Signature Balayage & Glaze", category: "Colour", price: "$195", duration: "120m" },
      { name: "Velvet Silk Blowout & Treatment", category: "Styling", price: "$75", duration: "45m" },
      { name: "Caviar Scalp Reconstruction", category: "Care", price: "$110", duration: "60m" },
      { name: "Gloss & Tone Refresh", category: "Colour", price: "$90", duration: "45m" },
    ],
    review: {
      author: "Camille Dupont",
      role: "Verified Client",
      stars: 5,
      quote: "The salon experience here is truly unrivaled. The online booking took 30 seconds and my color has never looked more vibrant.",
      date: "2 days ago",
    },
    bestFor: "High-End Colourists & Luxury Hair Salons",
  },
  blush: {
    id: "blush",
    name: "Blush Atelier",
    tagline: "Warm, editorial & soft luxury",
    mood: "Warm & Editorial",
    description: "A soft, romantic editorial palette tailored for nail boutiques, lash studios, and aesthetic bars.",
    defaultSalonName: "Atelier Rose & Glow",
    defaultTagline: "Sculpted Nail Artistry, Lash Enhancements & Skin Rituals",
    primary: "#B76E79",
    accent: "#E9D2C6",
    bgGradient: "linear-gradient(160deg, #fbf3ed 0%, #f3e2d8 55%, #e9d2c6 100%)",
    surfaceBg: "#fffaf6",
    heroImage: "/images/demo/gallery-2.jpg",
    isLight: true,
    curatedSwatches: ["#B76E79", "#C97A85", "#D88B96", "#A25C67", "#8E4A55"],
    sampleServices: [
      { name: "Luxe Sculpted Gel Manicure", category: "Nails", price: "$68", duration: "50m" },
      { name: "Russian Volume Lash Set", category: "Lashes", price: "$140", duration: "90m" },
      { name: "Hydra-Dew Botanical Facial", category: "Skin", price: "$125", duration: "60m" },
      { name: "Brow Lamination & Tint", category: "Brows", price: "$80", duration: "45m" },
    ],
    review: {
      author: "Elena Rostova",
      role: "Monthly Member",
      stars: 5,
      quote: "The aesthetic of the salon and the website are both immaculate. Booking appointments directly on my phone is so effortless.",
      date: "Yesterday",
    },
    bestFor: "Nail Bars, Lash Lounges & Aesthetic Studios",
  },
  noir: {
    id: "noir",
    name: "Noir Minimal",
    tagline: "Clean, monochrome & architectural",
    mood: "Clean & Monochrome",
    description: "Sharp, modern contrast built for contemporary cutters, boutique barber clubs, and urban studios.",
    defaultSalonName: "Studio Noir & Co.",
    defaultTagline: "Precision Haircutting, Texture Styling & Executive Grooming",
    primary: "#D6D3D1",
    accent: "#8A8A8A",
    bgGradient: "linear-gradient(160deg, #19191c 0%, #09090a 58%, #222226 100%)",
    surfaceBg: "#121214",
    heroImage: "/images/demo/hero-ochre.jpg",
    isLight: false,
    curatedSwatches: ["#D6D3D1", "#E4E4E7", "#A1A1AA", "#71717A", "#FAFAFA"],
    sampleServices: [
      { name: "Precision Scissor Cut & Finish", category: "Cut", price: "$60", duration: "45m" },
      { name: "Executive Hot Towel Shave", category: "Grooming", price: "$45", duration: "30m" },
      { name: "Matte Texture Clay Styling", category: "Styling", price: "$35", duration: "25m" },
      { name: "Custom Grey Blending Tint", category: "Colour", price: "$70", duration: "40m" },
    ],
    review: {
      author: "Marcus Vance",
      role: "Regular Client",
      stars: 5,
      quote: "Zero fluff, unmatched technique. Being able to choose my barber and book in 2 clicks makes this the only spot I visit.",
      date: "3 days ago",
    },
    bestFor: "Boutique Barbershops & Precision Cutters",
  },
  emerald: {
    id: "emerald",
    name: "Emerald Spa",
    tagline: "Earthy, botanical & holistic calm",
    mood: "Earthy & Botanical",
    description: "Deep organic greens and soothing gold accents for day spas, holistic scalp therapy, and wellness centers.",
    defaultSalonName: "Aura Botanical Sanctuary",
    defaultTagline: "Organic Scalp Therapy, Holistic Wellness & Herbal Rituals",
    primary: "#C9A86A",
    accent: "#86A294",
    bgGradient: "linear-gradient(160deg, #0d211a 0%, #07120e 58%, #143529 100%)",
    surfaceBg: "#0c1b15",
    heroImage: "/images/demo/gallery-1.jpg",
    isLight: false,
    curatedSwatches: ["#C9A86A", "#D8B77B", "#B59456", "#86A294", "#A2BEB0"],
    sampleServices: [
      { name: "Organic Botanical Scalp Detox", category: "Scalp", price: "$95", duration: "60m" },
      { name: "Aromatherapy Deep Tissue Ritual", category: "Wellness", price: "$130", duration: "75m" },
      { name: "Herbal Stem Cell Facial", category: "Skin", price: "$150", duration: "75m" },
      { name: "Wild Cedar Foot Treatment", category: "Ritual", price: "$70", duration: "45m" },
    ],
    review: {
      author: "Sophia Lin",
      role: "Wellness Member",
      stars: 5,
      quote: "A true sanctuary in the city. The website captures the calm energy perfectly and booking my treatments is a joy.",
      date: "1 week ago",
    },
    bestFor: "Holistic Day Spas, Wellness & Scalp Clinics",
  },
};

const TEMPLATE_KEYS: TemplateId[] = ["luxury", "blush", "noir", "emerald"];

interface TemplateStudioProps {
  startLink: string;
}

export default function TemplateStudio({ startLink }: TemplateStudioProps) {
  const [activeTemplateId, setActiveTemplateId] = useState<TemplateId>("luxury");
  const templateDef = TEMPLATE_DEFINITIONS[activeTemplateId];

  // Customizable state per template
  const [salonName, setSalonName] = useState(templateDef.defaultSalonName);
  const [tagline, setTagline] = useState(templateDef.defaultTagline);
  const [primaryColor, setPrimaryColor] = useState(templateDef.primary);
  const [accentColor, setAccentColor] = useState(templateDef.accent);
  const [fontMood, setFontMood] = useState<"serif" | "sans" | "geometric">("serif");
  const [deviceView, setDeviceView] = useState<"desktop" | "mobile">("desktop");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [previewBookingModal, setPreviewBookingModal] = useState<boolean>(false);
  const [bookedService, setBookedService] = useState<string | null>(null);

  // Switch template and load its defaults
  const handleSelectTemplate = (id: TemplateId) => {
    setActiveTemplateId(id);
    const def = TEMPLATE_DEFINITIONS[id];
    setSalonName(def.defaultSalonName);
    setTagline(def.defaultTagline);
    setPrimaryColor(def.primary);
    setAccentColor(def.accent);
    setSelectedCategory("All");
  };

  const handleResetDefaults = () => {
    const def = TEMPLATE_DEFINITIONS[activeTemplateId];
    setSalonName(def.defaultSalonName);
    setTagline(def.defaultTagline);
    setPrimaryColor(def.primary);
    setAccentColor(def.accent);
    setFontMood(activeTemplateId === "noir" ? "sans" : "serif");
  };

  // Launch URL carries customized params straight into onboarding or signup
  const buildLaunchUrl = (templateId: TemplateId) => {
    const isCurrent = templateId === activeTemplateId;
    const tName = isCurrent ? salonName : TEMPLATE_DEFINITIONS[templateId].defaultSalonName;
    const tPrimary = isCurrent ? primaryColor : TEMPLATE_DEFINITIONS[templateId].primary;
    const tAccent = isCurrent ? accentColor : TEMPLATE_DEFINITIONS[templateId].accent;
    const tTagline = isCurrent ? tagline : TEMPLATE_DEFINITIONS[templateId].defaultTagline;

    const base = startLink.startsWith("/signup") ? "/signup" : "/onboarding";
    const query = new URLSearchParams({
      template: templateId,
      name: tName,
      primary: tPrimary,
      accent: tAccent,
      tagline: tTagline,
    }).toString();

    return `${base}?${query}`;
  };

  const activeServices = useMemo(() => {
    if (selectedCategory === "All") return templateDef.sampleServices;
    return templateDef.sampleServices.filter((s) => s.category === selectedCategory);
  }, [selectedCategory, templateDef]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(templateDef.sampleServices.map((s) => s.category)));
    return ["All", ...cats];
  }, [templateDef]);

  return (
    <div className="space-y-12">
      {/* SECTION HEADER & CONTROL BAR */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
            <Sparkles className="h-3 w-3" />
            Interactive Template Studio
          </div>
          <h2 className="mt-3 font-light text-4xl tracking-tight sm:text-5xl">
            Start with a mood. <span className="font-serif italic text-primary">Make it yours.</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Test and customize any template live below. Edit your salon name, fine-tune colors, inspect the booking
            experience on desktop or mobile, and launch with one click.
          </p>
        </div>

        {/* Global Template Switcher Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {TEMPLATE_KEYS.map((id) => {
            const def = TEMPLATE_DEFINITIONS[id];
            const isActive = activeTemplateId === id;
            return (
              <button
                key={id}
                onClick={() => handleSelectTemplate(id)}
                className={cn(
                  "group relative flex items-center gap-2.5 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200",
                  isActive
                    ? "border-primary bg-primary/15 text-foreground shadow-sm shadow-primary/10 ring-1 ring-primary/40"
                    : "border-border/80 bg-card/60 text-muted-foreground hover:border-border hover:bg-card hover:text-foreground"
                )}
              >
                <span
                  className="h-2.5 w-2.5 rounded-full ring-1 ring-white/20 transition-transform group-hover:scale-110"
                  style={{ backgroundColor: def.primary }}
                />
                <span>{def.name}</span>
                {isActive && (
                  <span className="rounded-full bg-primary/20 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider text-primary">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MAIN TWO-COLUMN STUDIO INTERFACE */}
      <div className="grid gap-8 lg:grid-cols-[400px_1fr] xl:grid-cols-[440px_1fr]">
        {/* LEFT COLUMN: LIVE EDITOR CONTROLS ("IS ME AAP IN KO EDIT KARO") */}
        <div className="flex flex-col gap-6 rounded-3xl border border-border/80 bg-card/70 p-6 shadow-xl backdrop-blur-sm sm:p-7">
          <div className="flex items-center justify-between border-b border-border/60 pb-4">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg border"
                style={{ borderColor: `${primaryColor}44`, backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                <Palette className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">Template Customizer</h3>
                <p className="text-[10px] text-muted-foreground">Changes update the preview instantly</p>
              </div>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetDefaults}
              className="h-8 gap-1.5 px-2.5 text-[10px] uppercase tracking-wider text-muted-foreground hover:text-foreground"
              title="Reset to template defaults"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </Button>
          </div>

          {/* 1. Salon Identity Input */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Your Salon Name
              </Label>
              <span className="text-[9px] text-muted-foreground/70">Type to test live</span>
            </div>
            <Input
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              placeholder="e.g. Maison Noir, Aura Studio..."
              className="h-10 border-border/80 bg-background/80 font-medium text-foreground focus-visible:ring-primary"
            />
          </div>

          {/* 2. Tagline / Specialty */}
          <div className="space-y-3">
            <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Tagline & Specialties
            </Label>
            <Input
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Bespoke Hair Artistry & Botanical Scalp Care"
              className="h-10 border-border/80 bg-background/80 text-xs text-foreground focus-visible:ring-primary"
            />
          </div>

          {/* 3. Color Customizer */}
          <div className="space-y-4 rounded-2xl border border-border/50 bg-background/40 p-4">
            <div className="flex items-center justify-between">
              <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                Palette & Accent Colors
              </Label>
              <span className="text-[9px] uppercase tracking-wider text-primary">{templateDef.mood}</span>
            </div>

            {/* Primary Color Picker */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Primary Brand Accent</span>
                <span className="font-mono text-[11px] text-foreground">{primaryColor.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-xl border border-border shadow-inner">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="absolute -inset-2 h-14 w-14 cursor-pointer"
                  />
                </div>
                <div className="flex flex-1 items-center gap-1.5 overflow-x-auto py-1">
                  {templateDef.curatedSwatches.map((swatch) => (
                    <button
                      key={swatch}
                      onClick={() => setPrimaryColor(swatch)}
                      className={cn(
                        "h-7 w-7 shrink-0 rounded-lg border transition-all hover:scale-110",
                        primaryColor.toLowerCase() === swatch.toLowerCase()
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                          : "border-border/60"
                      )}
                      style={{ backgroundColor: swatch }}
                      title={swatch}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Accent Highlight Color */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Secondary Soft Accent</span>
                <span className="font-mono text-[11px] text-foreground">{accentColor.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-xl border border-border">
                  <input
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="absolute -inset-2 h-12 w-12 cursor-pointer"
                  />
                </div>
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-8 font-mono text-xs uppercase"
                  maxLength={7}
                />
              </div>
            </div>
          </div>

          {/* 4. Font Mood Switcher */}
          <div className="space-y-2.5">
            <Label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
              Typography Vibe
            </Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "serif", label: "Editorial Serif", sample: "Vogue" },
                { id: "sans", label: "Modern Sans", sample: "Minimal" },
                { id: "geometric", label: "Architectural", sample: "Studio" },
              ].map((font) => (
                <button
                  key={font.id}
                  onClick={() => setFontMood(font.id as any)}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-xl border p-2.5 text-center transition-all",
                    fontMood === font.id
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/60 bg-background/50 text-muted-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      font.id === "serif" ? "font-serif" : font.id === "sans" ? "font-sans" : "font-mono uppercase tracking-wider"
                    )}
                  >
                    {font.sample}
                  </span>
                  <span className="mt-1 text-[8px] uppercase tracking-wider opacity-70">{font.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 5. Production-Ready Feature Badges */}
          <div className="space-y-2 rounded-2xl border border-border/50 bg-background/40 p-3.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Pre-configured & Ready</p>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5 text-foreground/90">
                <Check className="h-3 w-3 text-emerald-400" /> Real-time Bookings
              </span>
              <span className="flex items-center gap-1.5 text-foreground/90">
                <Check className="h-3 w-3 text-emerald-400" /> Customer Reviews
              </span>
              <span className="flex items-center gap-1.5 text-foreground/90">
                <Check className="h-3 w-3 text-emerald-400" /> Business Hours
              </span>
              <span className="flex items-center gap-1.5 text-foreground/90">
                <Check className="h-3 w-3 text-emerald-400" /> Social Links Bar
              </span>
            </div>
          </div>

          {/* 6. Primary Action CTA */}
          <div className="space-y-2.5 pt-2">
            <Button
              asChild
              className="h-12 w-full rounded-2xl bg-primary text-[10px] font-bold uppercase tracking-[0.2em] text-black shadow-lg shadow-primary/20 hover:bg-primary/90"
            >
              <Link to={buildLaunchUrl(activeTemplateId)}>
                Launch with this custom template
                <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
            <p className="text-center text-[10px] text-muted-foreground">
              Loads this template, your salon name & palette directly into setup.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-FIDELITY LIVE PREVIEW FRAME */}
        <div className="flex flex-col gap-4">
          {/* Top Device Bar & Quick Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/60 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] font-semibold tracking-wider uppercase text-muted-foreground">
                Live Interactive Mockup: <strong className="text-foreground">{templateDef.name}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Device view switcher */}
              <div className="flex items-center rounded-xl border border-border bg-background/60 p-0.5">
                <button
                  onClick={() => setDeviceView("desktop")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all",
                    deviceView === "desktop"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Laptop className="h-3 w-3" />
                  Desktop
                </button>
                <button
                  onClick={() => setDeviceView("mobile")}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-medium transition-all",
                    deviceView === "mobile"
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Smartphone className="h-3 w-3" />
                  Mobile
                </button>
              </div>

              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-7 rounded-lg border-border/80 px-2.5 text-[9px] font-bold uppercase tracking-wider"
              >
                <Link to={buildLaunchUrl(activeTemplateId)}>
                  Use Template <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Browser / Device View Container */}
          <div
            className={cn(
              "relative mx-auto w-full transition-all duration-300",
              deviceView === "mobile" ? "max-w-[390px]" : "max-w-full"
            )}
          >
            {/* Outer Browser Chrome */}
            <div
              className={cn(
                "overflow-hidden border border-border/90 bg-zinc-950 shadow-2xl transition-all",
                deviceView === "mobile" ? "rounded-[40px] p-2 ring-1 ring-white/10" : "rounded-3xl"
              )}
            >
              {/* Browser Toolbar Header */}
              <div className="flex items-center justify-between border-b border-white/10 bg-zinc-900/90 px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>

                <div className="flex max-w-[280px] flex-1 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-black/60 px-3 py-1 text-center font-mono text-[10px] text-zinc-300 sm:max-w-[360px]">
                  <LockKeyhole className="h-2.5 w-2.5 text-emerald-400 shrink-0" />
                  <span className="truncate">
                    velvet.app/
                    {salonName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "your-salon"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="hidden sm:inline-block rounded-full bg-emerald-500/15 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-emerald-400">
                    Template Ready
                  </span>
                </div>
              </div>

              {/* Website Mockup Viewport */}
              <div
                className={cn(
                  "relative max-h-[660px] overflow-y-auto scrollbar-thin transition-all",
                  templateDef.isLight ? "text-stone-900" : "text-stone-100"
                )}
                style={{
                  background: templateDef.bgGradient,
                  color: templateDef.isLight ? "#2c221d" : "#f5f5f4",
                }}
              >
                {/* 1. MOCKUP NAVIGATION */}
                <nav
                  className="sticky top-0 z-20 flex items-center justify-between border-b px-5 py-3.5 backdrop-blur-md transition-colors"
                  style={{
                    backgroundColor: templateDef.isLight ? "rgba(255, 250, 246, 0.85)" : "rgba(10, 10, 11, 0.85)",
                    borderColor: `${accentColor}33`,
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-full border text-xs font-serif font-bold"
                      style={{
                        borderColor: `${primaryColor}66`,
                        backgroundColor: `${primaryColor}22`,
                        color: primaryColor,
                      }}
                    >
                      {salonName.slice(0, 1) || "V"}
                    </span>
                    <span
                      className={cn(
                        "text-xs font-semibold tracking-wide truncate max-w-[150px] sm:max-w-[200px]",
                        fontMood === "serif" ? "font-serif text-sm" : fontMood === "sans" ? "font-sans" : "font-mono uppercase tracking-wider"
                      )}
                    >
                      {salonName}
                    </span>
                  </div>

                  {deviceView === "desktop" && (
                    <div className="hidden md:flex items-center gap-5 text-[10px] uppercase tracking-[0.16em] opacity-75">
                      <span>Services</span>
                      <span>About</span>
                      <span>Reviews</span>
                      <span>Hours</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setBookedService("General Appointment");
                      setPreviewBookingModal(true);
                    }}
                    className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[9px] font-bold uppercase tracking-[0.16em] transition-transform active:scale-95 shadow-sm"
                    style={{
                      backgroundColor: primaryColor,
                      color: templateDef.isLight ? "#ffffff" : "#0a0a0a",
                    }}
                  >
                    <span>Book Now</span>
                  </button>
                </nav>

                {/* 2. MOCKUP HERO SECTION */}
                <div className="relative overflow-hidden px-5 py-12 sm:px-8 sm:py-16 text-center">
                  {/* Subtle Background Glow with custom primary color */}
                  <div
                    className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[80px] opacity-25"
                    style={{ backgroundColor: primaryColor }}
                  />

                  <div className="relative mx-auto max-w-xl">
                    <div className="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[8px] font-bold uppercase tracking-[0.2em]"
                      style={{
                        borderColor: `${primaryColor}44`,
                        backgroundColor: `${primaryColor}18`,
                        color: primaryColor,
                      }}
                    >
                      <Scissors className="h-2.5 w-2.5" />
                      {templateDef.mood}
                    </div>

                    <h1
                      className={cn(
                        "mt-4 text-3xl font-light tracking-tight sm:text-4xl lg:text-5xl",
                        fontMood === "serif" ? "font-serif italic" : fontMood === "sans" ? "font-sans font-medium" : "font-mono tracking-tighter"
                      )}
                    >
                      {salonName}
                    </h1>

                    <p className="mx-auto mt-3 max-w-md text-xs leading-relaxed opacity-80 sm:text-sm">
                      {tagline}
                    </p>

                    {/* Social proof bar */}
                    <div className="mt-5 flex items-center justify-center gap-3 text-[10px] opacity-75">
                      <div className="flex items-center gap-1 text-amber-400">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        <span className="font-semibold text-foreground">4.9</span>
                      </div>
                      <span>•</span>
                      <span>140+ verified bookings</span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Open Today
                      </span>
                    </div>

                    {/* Action buttons inside mockup */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                      <button
                        onClick={() => {
                          setBookedService("VIP Experience");
                          setPreviewBookingModal(true);
                        }}
                        className="rounded-full px-5 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-all hover:opacity-90 active:scale-95 shadow-lg"
                        style={{
                          backgroundColor: primaryColor,
                          color: templateDef.isLight ? "#ffffff" : "#0a0a0a",
                        }}
                      >
                        Reserve Appointment
                      </button>

                      <button
                        onClick={() => {
                          const el = document.getElementById("mockup-services");
                          el?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="rounded-full border px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.18em] transition-colors"
                        style={{
                          borderColor: `${accentColor}55`,
                          backgroundColor: `${accentColor}11`,
                        }}
                      >
                        Explore Menu
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. MOCKUP SERVICES SHOWCASE */}
                <div id="mockup-services" className="border-t px-5 py-8 sm:px-8" style={{ borderColor: `${accentColor}26` }}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                      <span className="text-[8px] font-bold uppercase tracking-[0.24em]" style={{ color: primaryColor }}>
                        Curated Offerings
                      </span>
                      <h3
                        className={cn(
                          "mt-1 text-xl font-light",
                          fontMood === "serif" ? "font-serif" : "font-sans font-semibold"
                        )}
                      >
                        Services & Transparent Pricing
                      </h3>
                    </div>

                    {/* Category tabs */}
                    <div className="flex flex-wrap items-center gap-1">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[9px] font-medium transition-all",
                            selectedCategory === cat
                              ? "font-semibold shadow-xs"
                              : "opacity-60 hover:opacity-100"
                          )}
                          style={{
                            backgroundColor: selectedCategory === cat ? primaryColor : "transparent",
                            color: selectedCategory === cat ? (templateDef.isLight ? "#fff" : "#0a0a0a") : undefined,
                          }}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Services Grid */}
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {activeServices.map((service) => (
                      <div
                        key={service.name}
                        className="group flex flex-col justify-between rounded-2xl border p-3.5 transition-all hover:translate-y-[-1px]"
                        style={{
                          borderColor: `${accentColor}33`,
                          backgroundColor: templateDef.isLight ? "#ffffff" : "rgba(255, 255, 255, 0.03)",
                        }}
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-semibold leading-snug">{service.name}</h4>
                            <span
                              className="text-xs font-bold shrink-0 font-mono"
                              style={{ color: primaryColor }}
                            >
                              {service.price}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center gap-2 text-[9px] opacity-60">
                            <span className="flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> {service.duration}
                            </span>
                            <span>•</span>
                            <span>{service.category}</span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between border-t pt-2" style={{ borderColor: `${accentColor}22` }}>
                          <span className="text-[8px] uppercase tracking-wider opacity-60">Instant confirmation</span>
                          <button
                            onClick={() => {
                              setBookedService(service.name);
                              setPreviewBookingModal(true);
                            }}
                            className="rounded-full px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-wider transition-all"
                            style={{
                              backgroundColor: `${primaryColor}22`,
                              color: primaryColor,
                              border: `1px solid ${primaryColor}44`,
                            }}
                          >
                            Select
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. MOCKUP REVIEWS & HOURS SNIPPET */}
                <div
                  className="border-t px-5 py-8 sm:px-8"
                  style={{
                    borderColor: `${accentColor}26`,
                    backgroundColor: templateDef.isLight ? "rgba(245, 233, 225, 0.4)" : "rgba(0, 0, 0, 0.25)",
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Review card */}
                    <div
                      className="rounded-2xl border p-4"
                      style={{
                        borderColor: `${accentColor}33`,
                        backgroundColor: templateDef.isLight ? "#ffffff" : "rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(templateDef.review.stars)].map((_, i) => (
                            <Star key={i} className="h-2.5 w-2.5 fill-amber-400" />
                          ))}
                        </div>
                        <span className="text-[8px] opacity-60">{templateDef.review.date}</span>
                      </div>
                      <p className="mt-2.5 text-[11px] leading-relaxed italic opacity-85">
                        "{templateDef.review.quote}"
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold"
                          style={{ backgroundColor: `${primaryColor}22`, color: primaryColor }}
                        >
                          {templateDef.review.author[0]}
                        </span>
                        <span className="text-[9px] font-semibold">{templateDef.review.author}</span>
                        <span className="text-[8px] opacity-50">({templateDef.review.role})</span>
                      </div>
                    </div>

                    {/* Hours & Location card */}
                    <div
                      className="rounded-2xl border p-4 flex flex-col justify-between"
                      style={{
                        borderColor: `${accentColor}33`,
                        backgroundColor: templateDef.isLight ? "#ffffff" : "rgba(255, 255, 255, 0.03)",
                      }}
                    >
                      <div>
                        <span className="text-[8px] font-bold uppercase tracking-[0.2em]" style={{ color: primaryColor }}>
                          Salon Schedule
                        </span>
                        <h4 className="mt-1 text-xs font-semibold">Opening Hours & Location</h4>
                        <div className="mt-2 space-y-1 text-[9px] opacity-75">
                          <div className="flex justify-between">
                            <span>Mon – Fri:</span>
                            <span className="font-medium">10:00 AM – 8:00 PM</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Saturday:</span>
                            <span className="font-medium">9:00 AM – 7:00 PM</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground/80">
                            <span>Sunday:</span>
                            <span>Closed for rest</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t pt-2 text-[8px] opacity-60" style={{ borderColor: `${accentColor}22` }}>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" /> Central Fashion District
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Instagram className="h-2.5 w-2.5" /> @{salonName.toLowerCase().replace(/[^a-z0-9]/g, "")}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. MOCKUP FOOTER */}
                <div
                  className="border-t px-5 py-4 text-center text-[9px] opacity-60"
                  style={{ borderColor: `${accentColor}22` }}
                >
                  <p>© {new Date().getFullYear()} {salonName}. Powered by Velvet Studio.</p>
                </div>
              </div>
            </div>

            {/* INTERACTIVE BOOKING PREVIEW MODAL */}
            <AnimatePresence>
              {previewBookingModal && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
                  <motion.div
                    initial={{ scale: 0.92, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.92, opacity: 0 }}
                    className="w-full max-w-xs overflow-hidden rounded-3xl border border-white/20 bg-zinc-950 p-5 text-left text-white shadow-2xl"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3">
                      <div>
                        <span className="text-[8px] font-bold uppercase tracking-[0.24em] text-primary">
                          Client Experience Preview
                        </span>
                        <h4 className="font-serif text-sm font-light text-zinc-100">
                          {bookedService || "Book Service"}
                        </h4>
                      </div>
                      <button
                        onClick={() => setPreviewBookingModal(false)}
                        className="rounded-full p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-3.5 space-y-2.5 text-xs">
                      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider">Date & Time</p>
                        <p className="font-medium text-white">Tomorrow at 2:30 PM (Confirmed)</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5">
                        <p className="text-[9px] text-zinc-400 uppercase tracking-wider">Stylist</p>
                        <p className="font-medium text-white">First Available Senior Specialist</p>
                      </div>

                      <div className="rounded-xl border border-white/10 bg-white/5 p-2.5 flex justify-between items-center">
                        <span className="text-[10px] text-zinc-400">Total Price</span>
                        <span className="font-mono font-bold text-primary">$95.00</span>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button
                        onClick={() => {
                          setPreviewBookingModal(false);
                        }}
                        className="h-9 w-full rounded-full bg-primary text-[10px] font-bold uppercase tracking-wider text-black"
                      >
                        Test Confirmation Flow
                      </Button>
                      <p className="text-center text-[8px] text-zinc-400">
                        This online booking system is live immediately when you publish.
                      </p>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* 4 READY-TO-USE SIGNATURE TEMPLATE CARDS GRID */}
      <div className="space-y-6 pt-8 border-t border-border/70">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Ready to Launch</span>
            <h3 className="mt-1 font-serif text-2xl text-foreground sm:text-3xl">
              Compare all four signature aesthetics
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Select any template to edit it in the studio above, or jump straight into launching your salon.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Showing 4/4 Ready Templates</span>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {TEMPLATE_KEYS.map((id, index) => {
            const def = TEMPLATE_DEFINITIONS[id];
            const isCurrentlySelected = activeTemplateId === id;

            return (
              <motion.div
                key={id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.07 }}
                className={cn(
                  "group flex flex-col justify-between overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1.5 shadow-lg",
                  isCurrentlySelected
                    ? "border-primary ring-2 ring-primary/40 shadow-primary/10"
                    : "border-border/80 hover:border-primary/50"
                )}
              >
                {/* Visual Header Mockup */}
                <div
                  className="relative flex aspect-[4/3] flex-col justify-between p-4"
                  style={{
                    background: def.bgGradient,
                    color: def.isLight ? "#2c221d" : "#f5f5f4",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-full bg-black/40 px-2 py-0.5 font-mono text-[8px] uppercase tracking-wider text-white/80 backdrop-blur-xs">
                      {def.mood}
                    </span>
                    <span
                      className="h-3 w-3 rounded-full border border-white/20"
                      style={{ backgroundColor: def.primary }}
                    />
                  </div>

                  <div className="text-center py-2">
                    <div
                      className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full border"
                      style={{ borderColor: `${def.primary}66`, color: def.primary }}
                    >
                      <Scissors className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="font-serif text-lg leading-tight font-medium">
                      {def.name}
                    </h4>
                    <p className="mt-1 text-[8px] uppercase tracking-widest opacity-60">
                      {def.bestFor.split("&")[0]}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[8px] opacity-70 border-t pt-2" style={{ borderColor: `${def.accent}33` }}>
                    <span>Online Bookings</span>
                    <span className="font-semibold" style={{ color: def.primary }}>Ready to use</span>
                  </div>
                </div>

                {/* Card Details & Action Buttons */}
                <div className="flex flex-1 flex-col justify-between p-5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">{def.name}</h4>
                      {isCurrentlySelected && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-primary">
                          Editing
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed line-clamp-2">
                      {def.description}
                    </p>

                    {/* Curated Color Swatches */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <span className="text-[9px] uppercase tracking-wider text-muted-foreground/70">Palette:</span>
                      <div className="flex items-center gap-1">
                        {def.curatedSwatches.slice(0, 4).map((c) => (
                          <span
                            key={c}
                            className="h-3.5 w-3.5 rounded-full border border-border/40"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions: Edit in Studio OR Launch Directly */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                    <Button
                      variant={isCurrentlySelected ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        handleSelectTemplate(id);
                        const el = document.getElementById("templates");
                        el?.scrollIntoView({ behavior: "smooth" });
                      }}
                      className="h-9 rounded-xl text-[9px] font-bold uppercase tracking-wider"
                    >
                      {isCurrentlySelected ? "Editing Above" : "Customize"}
                    </Button>

                    <Button
                      asChild
                      size="sm"
                      className="h-9 rounded-xl bg-primary text-[9px] font-bold uppercase tracking-wider text-black shadow-xs hover:bg-primary/90"
                    >
                      <Link to={buildLaunchUrl(id)}>
                        Use Template
                      </Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
