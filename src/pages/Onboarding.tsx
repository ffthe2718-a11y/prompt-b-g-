import { FormEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  Globe2,
  Loader2,
  Mail,
  MapPin,
  Palette,
  Phone,
  Plus,
  Rocket,
  Save,
  Send,
  Scissors,
  Sparkles,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { BrandLink } from "@/components/platform/Brand";
import VerifyEmailBanner from "@/components/dashboard/VerifyEmailBanner";
import ImageField from "@/components/common/ImageField";
import { useAuth } from "@/context/AuthContext";
import { ApiRequestError, salonApi } from "@/lib/api";
import { TEMPLATE_PRESETS, WEEKDAYS, initials, isHexColor, slugify } from "@/lib/salonUi";
import type { DayHours, Salon, TemplateId } from "@/types/salon";
import { formatDuration, formatPrice } from "@/types/salon";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "basics", title: "Your salon", icon: Store, blurb: "Name and public address" },
  { id: "contact", title: "Contact & hours", icon: MapPin, blurb: "Where clients find you" },
  { id: "menu", title: "Services & team", icon: Scissors, blurb: "What you offer and who" },
  { id: "brand", title: "Brand & launch", icon: Palette, blurb: "Make it unmistakably yours" },
];

const DEFAULT_HOURS: DayHours[] = WEEKDAYS.map((day) => ({
  day,
  closed: day === "Sunday",
  open: "10:00",
  close: "20:00",
}));

interface Draft {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  tiktok: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  logoUrl: string;
  heroImageUrl: string;
  aboutImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  announcement: string;
  ctaText: string;
  template: TemplateId;
  primaryColor: string;
  accentColor: string;
  hours: DayHours[];
  bookingSettings: Salon["bookingSettings"];
}

function initialDraft(template: TemplateId): Draft {
  const preset = TEMPLATE_PRESETS[template] ?? TEMPLATE_PRESETS.luxury;
  return {
    name: "",
    slug: "",
    tagline: "",
    description: "",
    phone: "",
    whatsapp: "",
    email: "",
    website: "",
    instagram: "",
    facebook: "",
    tiktok: "",
    address: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    logoUrl: "",
    heroImageUrl: "",
    aboutImageUrl: "",
    heroTitle: "",
    heroSubtitle: "",
    aboutTitle: "",
    aboutText: "",
    announcement: "",
    ctaText: "Book your appointment",
    template,
    primaryColor: preset.primary,
    accentColor: preset.accent,
    hours: DEFAULT_HOURS,
    bookingSettings: {
      enabled: true,
      slotIntervalMinutes: 30,
      minNoticeHours: 2,
      maxAdvanceDays: 60,
      requireEmail: false,
    },
  };
}

function draftFromSalon(salon: Salon): Draft {
  return {
    name: salon.name,
    slug: salon.slug,
    tagline: salon.tagline,
    description: salon.description,
    phone: salon.phone,
    whatsapp: salon.whatsapp,
    email: salon.email,
    website: salon.website,
    instagram: salon.instagram,
    facebook: salon.facebook,
    tiktok: salon.tiktok,
    address: salon.address,
    city: salon.city,
    state: salon.state,
    postalCode: salon.postalCode,
    country: salon.country,
    logoUrl: salon.logoUrl,
    heroImageUrl: salon.heroImageUrl,
    aboutImageUrl: salon.aboutImageUrl,
    heroTitle: salon.heroTitle,
    heroSubtitle: salon.heroSubtitle,
    aboutTitle: salon.aboutTitle,
    aboutText: salon.aboutText,
    announcement: salon.announcement,
    ctaText: salon.ctaText,
    template: salon.template,
    primaryColor: salon.primaryColor,
    accentColor: salon.accentColor,
    hours: salon.hours,
    bookingSettings: salon.bookingSettings,
  };
}

function slugError(slug: string): string {
  if (slug.length < 3) return "Use at least 3 characters.";
  if (!/^[a-z0-9-]+$/.test(slug)) return "Only lowercase letters, numbers and hyphens.";
  return "";
}

function Field({
  label,
  htmlFor,
  hint,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
        {label}
      </Label>
      {children}
      {hint && <p className="text-[9px] leading-relaxed text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

export default function Onboarding() {
  const { user, loading: authLoading, refresh } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const templateParam = params.get("template") as TemplateId | null;
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salon, setSalon] = useState<Salon | null>(null);
  const [draft, setDraft] = useState<Draft>(() => {
    let stored: TemplateId | null = null;
    try {
      stored = sessionStorage.getItem("velvet_template") as TemplateId | null;
      if (stored) sessionStorage.removeItem("velvet_template");
    } catch {
      /* noop */
    }
    const template = (templateParam || stored || "luxury") as TemplateId;
    return initialDraft(TEMPLATE_PRESETS[template] ? template : "luxury");
  });
  const [slugTouched, setSlugTouched] = useState(false);
  const [slugState, setSlugState] = useState<{ status: "idle" | "checking" | "available" | "taken" | "invalid"; message: string }>({
    status: "idle",
    message: "",
  });
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishedUrl, setPublishedUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [serviceForm, setServiceForm] = useState({ name: "", price: "", duration: "60" });
  const [staffForm, setStaffForm] = useState({ name: "", role: "" });
  const [addingService, setAddingService] = useState(false);
  const [addingStaff, setAddingStaff] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    let cancelled = false;
    salonApi
      .getMine()
      .then(({ salon: existing }) => {
        if (cancelled) return;
        if (existing.status === "published") {
          navigate("/dashboard", { replace: true });
          return;
        }
        setSalon(existing);
        setDraft(draftFromSalon(existing));
        setSlugTouched(true);
      })
      .catch((err) => {
        if (err instanceof ApiRequestError && err.code === "no_salon") {
          setSalon(null);
        } else if (!cancelled) {
          setError(err?.message || "Could not load your salon.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!draft.slug) {
      setSlugState({ status: "idle", message: "" });
      return;
    }
    const localError = slugError(draft.slug);
    if (localError) {
      setSlugState({ status: "invalid", message: localError });
      return;
    }
    if (salon?.slug && salon.slug === draft.slug) {
      setSlugState({ status: "available", message: "This is your current address." });
      return;
    }
    setSlugState({ status: "checking", message: "Checking availability…" });
    let cancelled = false;
    const timer = window.setTimeout(() => {
      salonApi
        .slugAvailable(draft.slug)
        .then((result) => {
          if (!cancelled) {
            setSlugState({ status: result.available ? "available" : "taken", message: result.reason });
          }
        })
        .catch(() => {
          if (!cancelled) setSlugState({ status: "idle", message: "" });
        });
    }, 350);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [draft.slug, salon?.slug]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((current) => ({ ...current, [key]: value }));
    setError("");
  };

  const handleNameChange = (value: string) => {
    setDraft((current) => ({
      ...current,
      name: value,
      slug: slugTouched ? current.slug : slugify(value),
    }));
    setError("");
  };

  const contactMissing = !draft.phone && !draft.email && !draft.whatsapp;
  const serviceCount = salon?.services.length ?? 0;
  const readiness = useMemo(
    () => [
      { label: "Salon name & live address", done: draft.name.trim().length >= 2 && !slugError(draft.slug) },
      { label: "Contact method", done: !contactMissing },
      { label: "At least one service", done: serviceCount > 0 },
      { label: "Branding image", done: Boolean(draft.heroImageUrl || draft.logoUrl) },
      { label: "Published", done: Boolean(publishedUrl) },
    ],
    [draft.name, draft.slug, contactMissing, serviceCount, draft.heroImageUrl, draft.logoUrl, publishedUrl]
  );

  const buildPatch = (fields: Partial<Draft> = draft) => ({
    name: fields.name,
    slug: fields.slug,
    tagline: fields.tagline,
    description: fields.description,
    phone: fields.phone,
    whatsapp: fields.whatsapp,
    email: fields.email,
    website: fields.website,
    instagram: fields.instagram,
    facebook: fields.facebook,
    tiktok: fields.tiktok,
    address: fields.address,
    city: fields.city,
    state: fields.state,
    postalCode: fields.postalCode,
    country: fields.country,
    logoUrl: fields.logoUrl,
    heroImageUrl: fields.heroImageUrl,
    aboutImageUrl: fields.aboutImageUrl,
    heroTitle: fields.heroTitle,
    heroSubtitle: fields.heroSubtitle,
    aboutTitle: fields.aboutTitle,
    aboutText: fields.aboutText,
    announcement: fields.announcement,
    ctaText: fields.ctaText,
    template: fields.template,
    primaryColor: fields.primaryColor,
    accentColor: fields.accentColor,
    hours: fields.hours,
    bookingSettings: fields.bookingSettings,
  });

  const ensureSalon = async (): Promise<Salon | null> => {
    if (salon) return salon;
    const created = await salonApi.create({
      name: draft.name.trim(),
      slug: draft.slug,
      tagline: draft.tagline,
      description: draft.description,
    });
    setSalon(created.salon);
    setDraft((current) => ({ ...current, ...draftFromSalon(created.salon) }));
    await refresh();
    return created.salon;
  };

  const saveStep = async (fields: Partial<Draft>, nextStep: number) => {
    setError("");
    setSaving(true);
    try {
      await ensureSalon();
      const result = await salonApi.update(buildPatch(fields) as any);
      setSalon(result.salon);
      setDraft((current) => ({ ...current, ...draftFromSalon(result.salon) }));
      setStep(nextStep);
    } catch (err: any) {
      if (err instanceof ApiRequestError && err.code === "slug_taken") {
        setSlugState({ status: "taken", message: err.message });
      }
      setError(err?.message || "Could not save your progress.");
    } finally {
      setSaving(false);
    }
  };

  const validateBasics = (): boolean => {
    if (draft.name.trim().length < 2) {
      setError("Please enter your salon name.");
      return false;
    }
    const problem = slugError(draft.slug);
    if (problem) {
      setError(problem);
      return false;
    }
    if (slugState.status === "taken") {
      setError("That website address is taken. Try another one.");
      return false;
    }
    return true;
  };

  const continueBasics = async () => {
    if (!validateBasics()) return;
    if (salon) {
      await saveStep(
        { name: draft.name, slug: draft.slug, tagline: draft.tagline, description: draft.description },
        1
      );
    } else {
      setSaving(true);
      setError("");
      try {
        const created = await salonApi.create({
          name: draft.name.trim(),
          slug: draft.slug,
          tagline: draft.tagline,
          description: draft.description,
        });
        setSalon(created.salon);
        setDraft((current) => ({ ...current, ...draftFromSalon(created.salon) }));
        await refresh();
        toast.success("Your studio is created. Now let's add the essentials.");
        setStep(1);
      } catch (err: any) {
        if (err instanceof ApiRequestError && err.code === "slug_taken") {
          setSlugState({ status: "taken", message: err.message });
        }
        setError(err?.message || "Could not create your salon.");
      } finally {
        setSaving(false);
      }
    }
  };

  const continueContact = async () => {
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email)) {
      setError("Enter a valid contact email.");
      return;
    }
    if (draft.whatsapp && draft.whatsapp.replace(/\D/g, "").length < 6) {
      setError("Enter a valid WhatsApp number.");
      return;
    }
    await saveStep(
      {
        phone: draft.phone,
        whatsapp: draft.whatsapp,
        email: draft.email,
        website: draft.website,
        instagram: draft.instagram,
        address: draft.address,
        city: draft.city,
        state: draft.state,
        postalCode: draft.postalCode,
        country: draft.country,
        hours: draft.hours,
        bookingSettings: draft.bookingSettings,
      },
      2
    );
  };

  const continueMenu = () => {
    setStep(3);
  };

  const saveBrand = async (silent = false) => {
    if (!salon) return null;
    if (!isHexColor(draft.primaryColor) || !isHexColor(draft.accentColor)) {
      setError("Choose valid hex colors.");
      return null;
    }
    setSaving(true);
    setError("");
    try {
      const result = await salonApi.update(buildPatch() as any);
      setSalon(result.salon);
      setDraft((current) => ({ ...current, ...draftFromSalon(result.salon) }));
      if (!silent) toast.success("Draft saved.");
      return result.salon;
    } catch (err: any) {
      setError(err?.message || "Could not save your draft.");
      return null;
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAndExit = async () => {
    if (!validateBasics()) return;
    setSaving(true);
    setError("");
    try {
      await ensureSalon();
      const result = await salonApi.update(buildPatch() as any);
      setSalon(result.salon);
      toast.success("Draft saved. Continue any time from your dashboard.");
      await refresh();
      navigate("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Could not save your progress.");
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = async () => {
    if (slideBlocked()) return;
    const saved = await saveBrand(true);
    if (saved) window.open("/dashboard/preview", "_blank", "noopener,noreferrer");
  };

  const slideBlocked = () => {
    if (!salon) {
      setError("Finish the first step before previewing.");
      return true;
    }
    return false;
  };

  const handlePublish = async () => {
    if (!salon) {
      setError("Finish the first step before publishing.");
      return;
    }
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email)) {
      setError("Enter a valid contact email.");
      return;
    }
    setPublishing(true);
    setError("");
    setPublishError("");
    try {
      const saved = await saveBrand(true);
      if (!saved) return;
      const result = await salonApi.publish();
      setSalon(result.salon);
      setPublishedUrl(`${window.location.origin}${result.publishedUrl}`);
      await refresh();
      toast.success("Your salon website is live.");
    } catch (err: any) {
      setPublishError(err?.message || "Could not publish your website.");
    } finally {
      setPublishing(false);
    }
  };

  /** Send the finished website to a super admin for review. */
  const handleSubmit = async () => {
    if (!salon) {
      setError("Finish the first step before submitting.");
      return;
    }
    if (draft.email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(draft.email)) {
      setError("Enter a valid contact email.");
      return;
    }
    setPublishing(true);
    setError("");
    setPublishError("");
    try {
      const saved = await saveBrand(true);
      if (!saved) return;
      const result = await salonApi.submitForApproval();
      setSalon(result.salon);
      setSubmitted(true);
      await refresh();
      toast.success("Submitted for review. We'll email you with the decision.");
    } catch (err: any) {
      setPublishError(err?.message || "Could not submit your website for approval.");
    } finally {
      setPublishing(false);
    }
  };

  const addService = async (event: FormEvent) => {
    event.preventDefault();
    if (!salon) return;
    if (!serviceForm.name.trim()) {
      toast.error("Give the service a name.");
      return;
    }
    setAddingService(true);
    try {
      const { service } = await salonApi.createService({
        name: serviceForm.name.trim(),
        price: Number(serviceForm.price) || 0,
        durationMinutes: Number(serviceForm.duration) || 0,
      });
      setSalon((current) => (current ? { ...current, services: [...current.services, service] } : current));
      setServiceForm({ name: "", price: "", duration: "60" });
      toast.success("Service added.");
    } catch (err: any) {
      toast.error(err?.message || "Could not add the service.");
    } finally {
      setAddingService(false);
    }
  };

  const removeService = async (id: string) => {
    try {
      await salonApi.deleteService(id);
      setSalon((current) =>
        current ? { ...current, services: current.services.filter((service) => service.id !== id) } : current
      );
    } catch (err: any) {
      toast.error(err?.message || "Could not remove the service.");
    }
  };

  const addStaff = async (event: FormEvent) => {
    event.preventDefault();
    if (!salon) return;
    if (!staffForm.name.trim()) {
      toast.error("Enter the team member's name.");
      return;
    }
    setAddingStaff(true);
    try {
      const { staff } = await salonApi.createStaff({
        name: staffForm.name.trim(),
        role: staffForm.role.trim(),
      });
      setSalon((current) => (current ? { ...current, staff: [...current.staff, staff] } : current));
      setStaffForm({ name: "", role: "" });
      toast.success("Team member added.");
    } catch (err: any) {
      toast.error(err?.message || "Could not add the team member.");
    } finally {
      setAddingStaff(false);
    }
  };

  const removeStaff = async (id: string) => {
    try {
      await salonApi.deleteStaff(id);
      setSalon((current) =>
        current ? { ...current, staff: current.staff.filter((member) => member.id !== id) } : current
      );
    } catch (err: any) {
      toast.error(err?.message || "Could not remove the team member.");
    }
  };

  const updateHour = (index: number, patch: Partial<DayHours>) => {
    setDraft((current) => ({
      ...current,
      hours: current.hours.map((hour, i) => (i === index ? { ...hour, ...patch } : hour)),
    }));
  };

  const chooseTemplate = (template: TemplateId) => {
    const preset = TEMPLATE_PRESETS[template];
    setDraft((current) => ({
      ...current,
      template,
      primaryColor: preset.primary,
      accentColor: preset.accent,
    }));
  };

  if (loading || authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-primary">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-50">Preparing your studio</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-amber-500/25 bg-gradient-to-br from-card via-background to-amber-500/[0.06] p-8 sm:p-12"
        >
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10">
              <Send className="h-7 w-7 text-amber-400" />
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-400">Submitted for review</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">{draft.name} is in the queue.</h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              A super admin reviews every new website by hand, usually within one business day. We&apos;ll email{" "}
              <span className="text-foreground">{user?.email}</span> as soon as there is a decision.
            </p>
            <div className="mt-6 rounded-xl border border-border bg-background/70 p-4 text-left">
              <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">While you wait</p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-muted-foreground">
                <li>You can keep editing drafts — changes are saved but not published.</li>
                <li>Your preview link always shows the latest draft.</li>
                <li>Once approved, you publish with one click from your dashboard.</li>
              </ul>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="h-11 flex-1 rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                <Link to="/dashboard">
                  Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="h-11 flex-1 rounded-full border-border text-[10px] font-bold uppercase tracking-[0.18em]"
              >
                <a href="/dashboard/preview" target="_blank" rel="noopener noreferrer">
                  Open preview <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
            </div>
            <p className="mt-5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
              No payment is taken until your website is approved.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (publishedUrl) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-background to-primary/[0.06] p-8 sm:p-12"
        >
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <Rocket className="h-7 w-7 text-primary" />
            </div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-primary">You are live</p>
            <h1 className="mt-3 font-serif text-4xl leading-tight text-foreground">
              {draft.name} has a home on the internet.
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Share this address everywhere your clients already look: Instagram bio, WhatsApp, Google.
            </p>
            <div className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-background/70 p-2 pl-4">
              <Globe2 className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1 truncate text-left font-mono text-[11px] text-foreground">
                {publishedUrl}
              </span>
              <Button
                size="sm"
                onClick={() => {
                  void navigator.clipboard.writeText(publishedUrl);
                  toast.success("Link copied.");
                }}
                className="h-8 rounded-lg bg-primary px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-black"
              >
                <Copy className="h-3 w-3" /> Copy
              </Button>
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button asChild className="h-11 flex-1 rounded-full bg-primary text-[10px] font-bold uppercase tracking-[0.18em] text-black">
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                  View my website <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button
                onClick={() => navigate("/dashboard")}
                variant="outline"
                className="h-11 flex-1 rounded-full border-border text-[10px] font-bold uppercase tracking-[0.18em]"
              >
                Go to dashboard <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="mt-5 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
              Edit anything later in your dashboard — your site stays live.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  const preset = TEMPLATE_PRESETS[draft.template] ?? TEMPLATE_PRESETS.luxury;
  const previewServices = salon?.services.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-4 px-4 py-3 sm:px-8">
          <div className="flex items-center gap-4">
            <BrandLink />
            <span className="hidden h-5 w-px bg-border sm:block" />
            <span className="hidden text-[9px] font-bold uppercase tracking-[0.22em] text-muted-foreground sm:block">
              Studio setup
            </span>
          </div>
          <div className="flex items-center gap-2">
            {salon && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden h-9 rounded-full px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground sm:inline-flex"
              >
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            )}
            <Button
              onClick={handleSaveAndExit}
              disabled={saving}
              variant="outline"
              size="sm"
              className="h-9 rounded-full border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em]"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              <span className="hidden sm:inline">Save & exit</span>
              <span className="sm:hidden">Save</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[1280px] px-4 py-8 sm:px-8 sm:py-10">
        <div className="mb-5">
          <VerifyEmailBanner />
        </div>
        {/* Progress */}
        <div className="mb-8 flex items-center gap-2 overflow-x-auto pb-1">
          {STEPS.map((item, index) => {
            const Icon = item.icon;
            const completed = index < step;
            const active = index === step;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (index < step) setStep(index);
                }}
                disabled={index > step}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-full border px-3 py-2 text-left transition-all sm:px-4",
                  active
                    ? "border-primary bg-primary/10"
                    : completed
                      ? "border-primary/30 bg-card/60"
                      : "border-border bg-card/30 opacity-60"
                )}
              >
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full text-[9px] font-bold",
                    active ? "bg-primary text-black" : completed ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {completed ? <Check className="h-3 w-3" /> : index + 1}
                </span>
                <span className="hidden sm:block">
                  <span className={cn("block text-[9px] font-bold uppercase tracking-[0.16em]", active ? "text-primary" : "text-foreground")}>
                    {item.title}
                  </span>
                  <span className="block text-[8px] text-muted-foreground">{item.blurb}</span>
                </span>
                <Icon className={cn("h-3.5 w-3.5 sm:hidden", active ? "text-primary" : "text-muted-foreground")} />
              </button>
            );
          })}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <div className="min-w-0">
            <div className="overflow-hidden rounded-3xl border border-border bg-card/40">
              <div className="border-b border-border/70 px-5 py-6 sm:px-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-primary/25 bg-primary/5">
                    {(() => {
                      const Icon = STEPS[step].icon;
                      return <Icon className="h-4 w-4 text-primary" />;
                    })()}
                  </div>
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">
                      Step {step + 1} of {STEPS.length}
                    </p>
                    <h1 className="font-serif text-2xl text-foreground sm:text-3xl">{STEPS[step].title}</h1>
                  </div>
                </div>
              </div>

              <div className="px-5 py-7 sm:px-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.25 }}
                  >
                    {step === 0 && (
                      <div className="space-y-5">
                        <div className="rounded-2xl border border-primary/20 bg-primary/[0.04] p-4">
                          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                            <Sparkles className="h-3.5 w-3.5" /> Start with the essentials
                          </p>
                          <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground">
                            You can change every field later. Your public address is reserved when you continue.
                          </p>
                        </div>

                        <Field label="Salon name" htmlFor="salon-name">
                          <Input
                            id="salon-name"
                            value={draft.name}
                            onChange={(event) => handleNameChange(event.target.value)}
                            placeholder="e.g. Lumen Hair Studio"
                            className="h-11 rounded-xl border-border bg-background text-sm focus-visible:border-primary"
                            autoFocus
                          />
                        </Field>

                        <Field
                          label="Your public address"
                          htmlFor="salon-slug"
                          hint="Lowercase letters, numbers and hyphens. This becomes your salon's live link."
                        >
                          <div className="flex items-center overflow-hidden rounded-xl border border-border bg-background focus-within:border-primary">
                            <span className="hidden shrink-0 border-r border-border px-3 py-3 text-[10px] text-muted-foreground/70 sm:block">
                              {typeof window !== "undefined" ? window.location.host : "yoursite.com"}/
                            </span>
                            <Input
                              id="salon-slug"
                              value={draft.slug}
                              onChange={(event) => {
                                setSlugTouched(true);
                                setDraft((current) => ({ ...current, slug: slugify(event.target.value) }));
                              }}
                              placeholder="house-of-lumen"
                              className="h-11 flex-1 rounded-none border-0 bg-transparent font-mono text-sm focus-visible:ring-0"
                            />
                            <span className="shrink-0 pr-3">
                              {slugState.status === "checking" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                              {slugState.status === "available" && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                              {(slugState.status === "taken" || slugState.status === "invalid") && (
                                <AlertCircle className="h-4 w-4 text-red-400" />
                              )}
                            </span>
                          </div>
                          {slugState.message && (
                            <p
                              className={cn(
                                "mt-1.5 text-[9px]",
                                slugState.status === "available"
                                  ? "text-emerald-400"
                                  : slugState.status === "taken" || slugState.status === "invalid"
                                    ? "text-red-400"
                                    : "text-muted-foreground"
                              )}
                            >
                              {slugState.message}
                            </p>
                          )}
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Tagline" htmlFor="salon-tagline" hint="One line clients remember.">
                            <Input
                              id="salon-tagline"
                              value={draft.tagline}
                              onChange={(event) => set("tagline", event.target.value)}
                              placeholder="Quiet luxury for everyday hair"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                          <Field label="Country" htmlFor="salon-country">
                            <Input
                              id="salon-country"
                              value={draft.country}
                              onChange={(event) => set("country", event.target.value)}
                              placeholder="India"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                        </div>

                        <Field label="About your salon" htmlFor="salon-desc" hint="A short paragraph in your own words.">
                          <Textarea
                            id="salon-desc"
                            value={draft.description}
                            onChange={(event) => set("description", event.target.value)}
                            placeholder="We are a small studio focused on healthy hair, honest advice and a calm hour away from the world."
                            className="min-h-24 rounded-xl border-border bg-background text-sm"
                          />
                        </Field>
                      </div>
                    )}

                    {step === 1 && (
                      <div className="space-y-6">
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          These details appear on your website and power the contact buttons, maps link and booking
                          notifications.
                        </p>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Phone number" htmlFor="salon-phone">
                            <div className="relative">
                              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="salon-phone"
                                value={draft.phone}
                                onChange={(event) => set("phone", event.target.value)}
                                placeholder="+91 98290 12345"
                                className="h-11 rounded-xl border-border bg-background pl-10 text-sm"
                                inputMode="tel"
                              />
                            </div>
                          </Field>
                          <Field label="WhatsApp" htmlFor="salon-whatsapp" hint="Leave blank to use the phone number.">
                            <div className="relative">
                              <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="salon-whatsapp"
                                value={draft.whatsapp}
                                onChange={(event) => set("whatsapp", event.target.value)}
                                placeholder="+91 98290 12345"
                                className="h-11 rounded-xl border-border bg-background pl-10 text-sm"
                                inputMode="tel"
                              />
                            </div>
                          </Field>
                          <Field label="Contact email" htmlFor="salon-email">
                            <div className="relative">
                              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                              <Input
                                id="salon-email"
                                type="email"
                                value={draft.email}
                                onChange={(event) => set("email", event.target.value)}
                                placeholder="hello@yoursalon.com"
                                className="h-11 rounded-xl border-border bg-background pl-10 text-sm"
                              />
                            </div>
                          </Field>
                          <Field label="Instagram handle" htmlFor="salon-instagram">
                            <div className="relative">
                              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">@</span>
                              <Input
                                id="salon-instagram"
                                value={draft.instagram}
                                onChange={(event) => set("instagram", event.target.value.replace(/^@/, ""))}
                                placeholder="yoursalon"
                                className="h-11 rounded-xl border-border bg-background pl-8 text-sm"
                              />
                            </div>
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Street address" htmlFor="salon-address" className="sm:col-span-2">
                            <Input
                              id="salon-address"
                              value={draft.address}
                              onChange={(event) => set("address", event.target.value)}
                              placeholder="Shop 4, 12th Main Road"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                          <Field label="City" htmlFor="salon-city">
                            <Input
                              id="salon-city"
                              value={draft.city}
                              onChange={(event) => set("city", event.target.value)}
                              placeholder="Jaipur"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                          <Field label="State / region" htmlFor="salon-state">
                            <Input
                              id="salon-state"
                              value={draft.state}
                              onChange={(event) => set("state", event.target.value)}
                              placeholder="Rajasthan"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                          <Field label="Postal code" htmlFor="salon-postal">
                            <Input
                              id="salon-postal"
                              value={draft.postalCode}
                              onChange={(event) => set("postalCode", event.target.value)}
                              placeholder="302001"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                          <Field label="Country" htmlFor="salon-country-2">
                            <Input
                              id="salon-country-2"
                              value={draft.country}
                              onChange={(event) => set("country", event.target.value)}
                              placeholder="India"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                        </div>

                        <div>
                          <div className="mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground">Opening hours</h3>
                          </div>
                          <div className="space-y-1.5 rounded-2xl border border-border bg-background/40 p-3">
                            {draft.hours.map((hour, index) => (
                              <div
                                key={hour.day}
                                className="grid grid-cols-[76px_1fr_1fr_auto] items-center gap-2 rounded-xl px-2 py-1.5 transition-colors hover:bg-white/[0.02]"
                              >
                                <span className="text-[10px] font-semibold text-foreground">{hour.day.slice(0, 3)}</span>
                                <Input
                                  type="time"
                                  value={hour.open}
                                  disabled={hour.closed}
                                  onChange={(event) => updateHour(index, { open: event.target.value })}
                                  className="h-8 rounded-lg border-border bg-background text-[10px] disabled:opacity-30"
                                />
                                <Input
                                  type="time"
                                  value={hour.close}
                                  disabled={hour.closed}
                                  onChange={(event) => updateHour(index, { close: event.target.value })}
                                  className="h-8 rounded-lg border-border bg-background text-[10px] disabled:opacity-30"
                                />
                                <label className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                                  <Switch
                                    checked={hour.closed}
                                    onCheckedChange={(checked) => updateHour(index, { closed: Boolean(checked) })}
                                    size="sm"
                                  />
                                  Closed
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-7">
                        <div>
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Scissors className="h-4 w-4 text-primary" /> Your services
                              </h3>
                              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                                Add your real services and prices. You can add descriptions, categories and more in
                                the dashboard.
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[9px] text-muted-foreground">
                              {serviceCount} added
                            </span>
                          </div>

                          {salon && salon.services.length > 0 && (
                            <div className="mb-3 space-y-2">
                              {salon.services.map((service) => (
                                <div
                                  key={service.id}
                                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 px-3 py-2.5"
                                >
                                  <div className="min-w-0">
                                    <p className="truncate text-xs font-medium text-foreground">{service.name}</p>
                                    <p className="mt-0.5 text-[9px] text-muted-foreground">
                                      {formatPrice(service.price, salon.currency)}
                                      {service.durationMinutes ? ` · ${formatDuration(service.durationMinutes)}` : ""}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => void removeService(service.id)}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                                    aria-label={`Remove ${service.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <form onSubmit={addService} className="rounded-2xl border border-dashed border-border bg-background/30 p-3">
                            <div className="grid gap-2 sm:grid-cols-[1.4fr_0.7fr_0.7fr_auto]">
                              <Input
                                value={serviceForm.name}
                                onChange={(event) => setServiceForm({ ...serviceForm, name: event.target.value })}
                                placeholder="Service name"
                                className="h-9 rounded-lg border-border bg-background text-xs"
                              />
                              <Input
                                value={serviceForm.price}
                                onChange={(event) => setServiceForm({ ...serviceForm, price: event.target.value })}
                                placeholder="Price"
                                inputMode="decimal"
                                className="h-9 rounded-lg border-border bg-background text-xs"
                              />
                              <Input
                                value={serviceForm.duration}
                                onChange={(event) => setServiceForm({ ...serviceForm, duration: event.target.value })}
                                placeholder="Minutes"
                                inputMode="numeric"
                                className="h-9 rounded-lg border-border bg-background text-xs"
                              />
                              <Button
                                type="submit"
                                disabled={addingService}
                                className="h-9 rounded-lg bg-primary px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-black"
                              >
                                {addingService ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                Add
                              </Button>
                            </div>
                          </form>
                        </div>

                        <div className="border-t border-border/60 pt-6">
                          <div className="mb-4 flex items-start justify-between gap-3">
                            <div>
                              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                <Users className="h-4 w-4 text-primary" /> Your team
                              </h3>
                              <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">
                                Optional. Add the people clients will meet. Photos and bios can follow later.
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-border bg-background px-2.5 py-1 text-[9px] text-muted-foreground">
                              {salon?.staff.length ?? 0} added
                            </span>
                          </div>

                          {salon && salon.staff.length > 0 && (
                            <div className="mb-3 grid gap-2 sm:grid-cols-2">
                              {salon.staff.map((member) => (
                                <div
                                  key={member.id}
                                  className="flex items-center justify-between gap-2 rounded-xl border border-border bg-background/50 px-3 py-2.5"
                                >
                                  <div className="flex min-w-0 items-center gap-2">
                                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                                      {initials(member.name)}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="truncate text-xs font-medium text-foreground">{member.name}</p>
                                      {member.role && <p className="truncate text-[9px] text-muted-foreground">{member.role}</p>}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => void removeStaff(member.id)}
                                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-400"
                                    aria-label={`Remove ${member.name}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <form onSubmit={addStaff} className="rounded-2xl border border-dashed border-border bg-background/30 p-3">
                            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                              <Input
                                value={staffForm.name}
                                onChange={(event) => setStaffForm({ ...staffForm, name: event.target.value })}
                                placeholder="Team member name"
                                className="h-9 rounded-lg border-border bg-background text-xs"
                              />
                              <Input
                                value={staffForm.role}
                                onChange={(event) => setStaffForm({ ...staffForm, role: event.target.value })}
                                placeholder="Role (e.g. Senior stylist)"
                                className="h-9 rounded-lg border-border bg-background text-xs"
                              />
                              <Button
                                type="submit"
                                disabled={addingStaff}
                                className="h-9 rounded-lg bg-primary px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-black"
                              >
                                {addingStaff ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                                Add
                              </Button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-foreground">
                            <Palette className="h-4 w-4 text-primary" /> Choose a starting theme
                          </h3>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {(Object.keys(TEMPLATE_PRESETS) as TemplateId[]).map((id) => {
                              const item = TEMPLATE_PRESETS[id];
                              const selected = draft.template === id;
                              return (
                                <button
                                  key={id}
                                  type="button"
                                  onClick={() => chooseTemplate(id)}
                                  className={cn(
                                    "overflow-hidden rounded-xl border text-left transition-all",
                                    selected ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-primary/40"
                                  )}
                                >
                                  <div className="flex aspect-[4/3] flex-col justify-between p-2.5" style={{ background: item.gradient }}>
                                    <span className="text-[6px] uppercase tracking-[0.2em]" style={{ color: item.accent }}>
                                      Your salon
                                    </span>
                                    <span className="font-serif text-[13px] leading-tight" style={{ color: item.ink }}>
                                      Your name
                                    </span>
                                    <span className="h-1 w-8 rounded-full" style={{ backgroundColor: item.accent }} />
                                  </div>
                                  <div className="flex items-center justify-between gap-1 p-2">
                                    <span className="text-[8px] font-semibold text-foreground">{item.name}</span>
                                    {selected && <Check className="h-3 w-3 text-primary" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <Field label="Primary color">
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
                              <input
                                type="color"
                                value={isHexColor(draft.primaryColor) ? draft.primaryColor : preset.primary}
                                onChange={(event) => set("primaryColor", event.target.value)}
                                className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
                                aria-label="Primary color picker"
                              />
                              <Input
                                value={draft.primaryColor}
                                onChange={(event) => set("primaryColor", event.target.value)}
                                className="h-8 flex-1 rounded-lg border-0 bg-transparent font-mono text-xs uppercase focus-visible:ring-0"
                              />
                            </div>
                          </Field>
                          <Field label="Accent color">
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
                              <input
                                type="color"
                                value={isHexColor(draft.accentColor) ? draft.accentColor : preset.accent}
                                onChange={(event) => set("accentColor", event.target.value)}
                                className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
                                aria-label="Accent color picker"
                              />
                              <Input
                                value={draft.accentColor}
                                onChange={(event) => set("accentColor", event.target.value)}
                                className="h-8 flex-1 rounded-lg border-0 bg-transparent font-mono text-xs uppercase focus-visible:ring-0"
                              />
                            </div>
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-[0.7fr_1.3fr]">
                          <ImageField
                            label="Logo"
                            value={draft.logoUrl}
                            onChange={(url) => set("logoUrl", url)}
                            aspect="aspect-square"
                            rounded="full"
                            disabled={!salon}
                            description="Square works best."
                          />
                          <ImageField
                            label="Hero image"
                            value={draft.heroImageUrl}
                            onChange={(url) => set("heroImageUrl", url)}
                            aspect="aspect-square"
                            rounded="2xl"
                            disabled={!salon}
                            description="Your salon, your work."
                          />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field label="Hero headline" htmlFor="hero-title" hint="Defaults to your salon name.">
                            <Input
                              id="hero-title"
                              value={draft.heroTitle}
                              onChange={(event) => set("heroTitle", event.target.value)}
                              placeholder={draft.name || "Your salon name"}
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                          <Field label="Hero subtitle" htmlFor="hero-subtitle" hint="Defaults to your tagline.">
                            <Input
                              id="hero-subtitle"
                              value={draft.heroSubtitle}
                              onChange={(event) => set("heroSubtitle", event.target.value)}
                              placeholder={draft.tagline || "Your salon, your story"}
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                          <Field label="Button label" htmlFor="cta">
                            <Input
                              id="cta"
                              value={draft.ctaText}
                              onChange={(event) => set("ctaText", event.target.value)}
                              placeholder="Book your appointment"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                          <Field label="Announcement (optional)" htmlFor="announcement" hint="Shown as a slim banner on your site.">
                            <Input
                              id="announcement"
                              value={draft.announcement}
                              onChange={(event) => set("announcement", event.target.value)}
                              placeholder="Now taking bridal bookings for December"
                              className="h-11 rounded-xl border-border bg-background text-sm"
                            />
                          </Field>
                        </div>

                        <Field label="About section" htmlFor="about-text" hint="Tell clients what makes your studio different.">
                          <Textarea
                            id="about-text"
                            value={draft.aboutText || draft.description}
                            onChange={(event) => set("aboutText", event.target.value)}
                            placeholder="A calm, considered space for hair and beauty."
                            className="min-h-24 rounded-xl border-border bg-background text-sm"
                          />
                        </Field>

                        {publishError && (
                          <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] leading-relaxed text-red-300">
                            {publishError}
                          </div>
                        )}

                        <div className="rounded-2xl border border-border bg-background/40 p-4">
                          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                            Ready for review
                          </p>
                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {readiness.map((item) => (
                              <div key={item.label} className="flex items-center gap-2 text-[10px]">
                                <span
                                  className={cn(
                                    "flex h-4 w-4 items-center justify-center rounded-full",
                                    item.done ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {item.done ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-current" />}
                                </span>
                                <span className={item.done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                              </div>
                            ))}
                          </div>
                          {serviceCount === 0 && (
                            <p className="mt-3 text-[10px] leading-relaxed text-amber-400/80">
                              Add at least one service in the previous step before submitting for approval.
                            </p>
                          )}
                          {contactMissing && (
                            <p className="mt-1 text-[10px] leading-relaxed text-amber-400/80">
                              Add a phone number or contact email so clients can reach you.
                            </p>
                          )}
                          <p className="mt-3 border-t border-border/60 pt-3 text-[10px] leading-relaxed text-muted-foreground">
                            {salon?.approvalStatus === "approved"
                              ? "This website is approved. Publishing makes it live immediately."
                              : salon?.approvalStatus === "pending"
                                ? "Waiting for a super admin. You can keep saving drafts while you wait."
                                : salon?.approvalStatus === "rejected" || salon?.approvalStatus === "changes_requested"
                                  ? salon?.approvalNote || "Make the requested changes, then submit again."
                                  : "Every website is reviewed by a super admin before it can be published."}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>

                {error && (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-[11px] leading-relaxed text-red-300">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="mt-7 flex flex-col-reverse items-stretch justify-between gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep((current) => Math.max(0, current - 1))}
                    disabled={step === 0 || saving || publishing}
                    className="h-10 rounded-full px-4 text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </Button>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    {step === 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handlePreview()}
                        disabled={saving || publishing || !salon}
                        className="h-10 rounded-full border-border px-5 text-[9px] font-bold uppercase tracking-[0.16em]"
                      >
                        <Eye className="h-3.5 w-3.5" /> Preview
                      </Button>
                    )}

                    {step < 3 ? (
                      <Button
                        type="button"
                        onClick={() => {
                          if (step === 0) void continueBasics();
                          else if (step === 1) void continueContact();
                          else continueMenu();
                        }}
                        disabled={saving || addingService || addingStaff}
                        className="h-10 rounded-full bg-primary px-6 text-[9px] font-bold uppercase tracking-[0.16em] text-black hover:bg-primary/90"
                      >
                        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Save & continue <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => void saveBrand()}
                          disabled={saving || publishing || !salon}
                          className="h-10 rounded-full border-border px-5 text-[9px] font-bold uppercase tracking-[0.16em]"
                        >
                          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                          Save draft
                        </Button>
                        <Button
                          type="button"
                          onClick={() => void (salon?.canPublish ? handlePublish() : handleSubmit())}
                          disabled={publishing || saving || !salon || salon?.approvalStatus === "pending"}
                          className="h-10 rounded-full bg-primary px-6 text-[9px] font-bold uppercase tracking-[0.16em] text-black hover:bg-primary/90"
                        >
                          {publishing ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : salon?.canPublish ? (
                            <Rocket className="h-3.5 w-3.5" />
                          ) : (
                            <Send className="h-3.5 w-3.5" />
                          )}
                          {publishing
                            ? "Working…"
                            : salon?.approvalStatus === "pending"
                              ? "Submitted for review"
                              : salon?.canPublish
                                ? "Publish website"
                                : "Submit for approval"}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live preview + checklist */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-4">
              <div className="overflow-hidden rounded-3xl border border-border bg-card">
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Live preview</span>
                  <span className="flex items-center gap-1.5 text-[8px] uppercase tracking-[0.14em] text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Updating
                  </span>
                </div>
                <div className="p-3">
                  <div
                    className="relative flex min-h-[300px] flex-col justify-between overflow-hidden rounded-2xl p-4"
                    style={{ background: preset.gradient }}
                  >
                    {draft.heroImageUrl && (
                      <img
                        src={draft.heroImageUrl}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-30"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="relative flex items-center justify-between">
                      <span className="text-[7px] uppercase tracking-[0.2em]" style={{ color: preset.accent }}>
                        {draft.city || "Your city"}
                      </span>
                      <span className="text-[7px] uppercase tracking-[0.16em]" style={{ color: preset.ink, opacity: 0.55 }}>
                        Book
                      </span>
                    </div>
                    <div className="relative py-6 text-center">
                      <div
                        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border"
                        style={{ borderColor: `${draft.primaryColor}66`, backgroundColor: `${draft.primaryColor}18` }}
                      >
                        {draft.logoUrl ? (
                          <img src={draft.logoUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <span className="font-serif text-xs" style={{ color: preset.accent }}>
                            {initials(draft.name || "Your Salon")}
                          </span>
                        )}
                      </div>
                      <h3 className="font-serif text-2xl leading-tight" style={{ color: preset.ink }}>
                        {draft.heroTitle || draft.name || "Your salon name"}
                      </h3>
                      <p className="mx-auto mt-2 max-w-[190px] text-[8px] leading-relaxed" style={{ color: preset.ink, opacity: 0.65 }}>
                        {draft.heroSubtitle || draft.tagline || "Your story, your services, beautifully online."}
                      </p>
                      <span
                        className="mt-4 inline-block rounded-full px-3 py-1.5 text-[7px] font-bold uppercase tracking-[0.16em]"
                        style={{ backgroundColor: draft.primaryColor, color: "#0a0a0a" }}
                      >
                        {draft.ctaText || "Book appointment"}
                      </span>
                    </div>
                    <div className="relative space-y-1.5">
                      {previewServices.length > 0 ? (
                        previewServices.map((service) => (
                          <div key={service.id} className="flex items-center justify-between gap-2">
                            <span className="truncate text-[8px]" style={{ color: preset.ink, opacity: 0.8 }}>
                              {service.name}
                            </span>
                            <span className="shrink-0 font-mono text-[7px]" style={{ color: preset.accent }}>
                              {formatPrice(service.price, salon?.currency || "INR")}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="space-y-1.5 opacity-40">
                          {[72, 56, 64].map((width) => (
                            <div key={width} className="flex items-center justify-between">
                              <span className="h-1 rounded-full" style={{ width: `${width}%`, backgroundColor: preset.ink }} />
                              <span className="h-1 w-5 rounded-full" style={{ backgroundColor: preset.accent }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 rounded-xl border border-border bg-background/50 px-3 py-2">
                    <Globe2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                    <span className="truncate font-mono text-[9px] text-muted-foreground">
                      /{draft.slug || "your-salon"}
                    </span>
                    <span
                      className={cn(
                        "ml-auto shrink-0 rounded-full px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em]",
                        salon?.status === "published"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-amber-500/10 text-amber-400"
                      )}
                    >
                      {salon?.status === "published" ? "Live" : "Draft"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Your launch checklist</p>
                <div className="mt-3 space-y-2.5">
                  {readiness.map((item) => (
                    <div key={item.label} className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex h-4 w-4 items-center justify-center rounded-full",
                          item.done ? "bg-emerald-500/15 text-emerald-400" : "border border-border text-muted-foreground"
                        )}
                      >
                        {item.done && <Check className="h-2.5 w-2.5" />}
                      </span>
                      <span className={cn("text-[10px]", item.done ? "text-foreground" : "text-muted-foreground")}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-4 border-t border-border/60 pt-3 text-[9px] leading-relaxed text-muted-foreground/60">
                  Nothing is visible to clients until you press publish.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

