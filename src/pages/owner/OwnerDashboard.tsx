import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { Analytics, Booking, Salon } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { siteFormFromSalon, siteFormToPatch, isSiteFormDirty, type SiteForm } from "@/pages/owner/websiteForm";
import { initials } from "@/lib/salonUi";
import { toast } from "sonner";
import {
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ExternalLink,
  Globe2,
  Images,
  LayoutDashboard,
  Loader2,
  LogOut,
  Menu,
  Rocket,
  Scissors,
  Settings2,
  Star,
  Users,
  X,
} from "lucide-react";
import { BrandMark } from "@/components/platform/Brand";
import { StatusBadge } from "@/components/dashboard/ui";
import ApprovalPanel, { ApprovalBadge } from "@/components/dashboard/ApprovalPanel";
import VerifyEmailBanner from "@/components/dashboard/VerifyEmailBanner";
import Overview from "@/pages/owner/Overview";
import WebsiteEditor from "@/pages/owner/WebsiteEditor";
import Services from "@/pages/owner/Services";
import Team from "@/pages/owner/Team";
import Gallery from "@/pages/owner/Gallery";
import Bookings from "@/pages/owner/Bookings";
import Reviews from "@/pages/owner/Reviews";
import AnalyticsView from "@/pages/owner/Analytics";
import Settings from "@/pages/owner/Settings";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "website", label: "Website", icon: Globe2 },
  { id: "services", label: "Services", icon: Scissors },
  { id: "team", label: "Team", icon: Users },
  { id: "gallery", label: "Gallery", icon: Images },
  { id: "bookings", label: "Bookings", icon: CalendarDays },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const SECTION_COPY: Record<SectionId, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Your salon at a glance." },
  website: { title: "Your website", subtitle: "Edit the words, images and details clients see." },
  services: { title: "Services", subtitle: "Build your menu and set your prices." },
  team: { title: "Team", subtitle: "The people your clients book with." },
  gallery: { title: "Gallery", subtitle: "Photographs of your work and your space." },
  bookings: { title: "Bookings", subtitle: "Appointment requests from your website." },
  reviews: { title: "Reviews", subtitle: "What clients are saying, and your replies." },
  analytics: { title: "Analytics", subtitle: "How your website is performing." },
  settings: { title: "Settings", subtitle: "Account, address and plan." },
};

export default function OwnerDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { section: rawSection } = useParams();
  const active = (SECTIONS.find((item) => item.id === rawSection)?.id || "overview") as SectionId;

  const [salon, setSalon] = useState<Salon | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingSite, setSavingSite] = useState(false);

  const [form, setForm] = useState<SiteForm | null>(null);
  const formSalonRef = useRef<string | null>(null);

  const load = useCallback(async (): Promise<Salon | null> => {
    try {
      const { salon: fresh } = await salonApi.getMine();
      const [analyticsData, bookingData] = await Promise.all([
        salonApi.analytics().catch(() => null),
        salonApi.listBookings().catch(() => ({ bookings: [] as Booking[] })),
      ]);
      setSalon(fresh);
      setAnalytics(analyticsData);
      setBookings(bookingData.bookings);
      setLoadError("");
      return fresh;
    } catch (error: any) {
      if (error?.status === 404) {
        navigate("/onboarding", { replace: true });
        return null;
      }
      setLoadError(error?.message || "Could not load your dashboard.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (salon && formSalonRef.current !== salon.id) {
      setForm(siteFormFromSalon(salon));
      formSalonRef.current = salon.id;
    }
  }, [salon]);

  useEffect(() => {
    setMenuOpen(false);
  }, [active]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  /** Used after changes to the salon's identity (e.g. its slug) so the
   *  website editor cannot accidentally save a stale address back. */
  const refreshIdentity = useCallback(async () => {
    const fresh = await load();
    if (fresh) {
      setForm(siteFormFromSalon(fresh));
      formSalonRef.current = fresh.id;
    }
  }, [load]);

  const dirty = isSiteFormDirty(form, salon);

  const saveSite = useCallback(
    async (announce = true) => {
      if (!form) return;
      setSavingSite(true);
      try {
        const { salon: updated } = await salonApi.update(siteFormToPatch(form));
        setSalon(updated);
        setForm(siteFormFromSalon(updated));
        if (announce) toast.success("Website changes saved.");
        return updated;
      } catch (error: any) {
        toast.error(error?.message || "Could not save your website.");
        throw error;
      } finally {
        setSavingSite(false);
      }
    },
    [form]
  );

  const publish = useCallback(async () => {
    if (!salon) return;
    setPublishing(true);
    try {
      if (dirty && form) {
        await salonApi.update(siteFormToPatch(form));
      }
      const { salon: updated } = await salonApi.publish();
      setSalon(updated);
      setForm(siteFormFromSalon(updated));
      toast.success("Your website is live.", { description: `Share it at /${updated.slug}` });
    } catch (error: any) {
      toast.error(error?.message || "Your site is not ready to publish yet.");
    } finally {
      setPublishing(false);
    }
  }, [salon, dirty, form]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Opening your studio</p>
        </div>
      </div>
    );
  }

  if (loadError || !salon) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-serif text-2xl text-foreground">We could not open your studio</p>
          <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{loadError || "Please try again."}</p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              onClick={() => {
                setLoading(true);
                void load();
              }}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black"
            >
              Try again
            </button>
            <button
              onClick={() => navigate("/")}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  const copy = SECTION_COPY[active];
  const siteUrl = `${window.location.origin}/${salon.slug}`;
  const viewHref = salon.status === "published" ? `/${salon.slug}` : "/dashboard/preview";
  const pendingBookings = bookings.filter((booking) => booking.status === "pending").length;
  const approvedAndCurrent = salon.approvalStatus === "approved" && !salon.changesSinceApproval;
  const canPublish = salon.status !== "suspended" && approvedAndCurrent;
  const publishLabel = publishing
    ? "Publishing"
    : !approvedAndCurrent
      ? salon.status === "suspended"
        ? "Suspended"
        : salon.approvalStatus === "pending"
          ? "In review"
          : salon.approvalStatus === "approved"
            ? "Changes need review"
            : salon.approvalStatus === "rejected"
              ? "Needs changes"
              : salon.approvalStatus === "changes_requested"
                ? "Changes requested"
                : "Awaiting approval"
      : salon.status === "published"
        ? salon.hasUnpublishedChanges
          ? "Publish changes"
          : "Published"
        : "Publish website";

  const navBadges: Partial<Record<SectionId, number>> = {
    bookings: pendingBookings,
    reviews: salon.reviews.length,
  };

  const handleNavigate = (section: string) => {
    if (section === active) return;
    if (active === "website" && dirty && form) {
      void (async () => {
        try {
          await saveSite(false);
          toast.success("Draft saved before leaving the editor.");
        } catch {
          return;
        }
        navigate(`/dashboard/${section}`);
      })();
      return;
    }
    navigate(`/dashboard/${section}`);
  };

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 py-5">
        <Link to="/" aria-label="Velvet home">
          <BrandMark />
        </Link>
        <button onClick={() => setMenuOpen(false)} className="text-muted-foreground lg:hidden" aria-label="Close menu">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mx-3 mb-4 rounded-xl border border-border bg-background/40 p-3">
        <div className="flex items-center gap-2.5">
          {salon.logoUrl ? (
            <img src={salon.logoUrl} alt="" className="h-9 w-9 shrink-0 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 font-serif text-[11px] text-primary">
              {initials(salon.name)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-foreground">{salon.name}</p>
            <p className="truncate font-mono text-[8px] text-muted-foreground">/{salon.slug}</p>
          </div>
        </div>
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <StatusBadge status={salon.status} />
            <ApprovalBadge status={salon.approvalStatus} />
          </div>
          <a
            href={viewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-primary"
          >
            {salon.status === "published" ? "View" : "Preview"} <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {SECTIONS.map((item) => {
          const Icon = item.icon;
          const badge = navBadges[item.id];
          return (
            <button
              key={item.id}
              onClick={() => handleNavigate(item.id)}
              className={cn(
                "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[10px] font-medium transition-colors",
                active === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
              )}
            >
              <Icon className={cn("h-3.5 w-3.5", active === item.id ? "text-primary" : "text-muted-foreground/70")} />
              <span className="flex-1">{item.label}</span>
              {badge ? (
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[7px] font-bold",
                    item.id === "bookings" && pendingBookings > 0
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-background text-muted-foreground"
                  )}
                >
                  {badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <Link
          to="/"
          className="flex items-center justify-between rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:bg-background/60 hover:text-primary"
        >
          <span className="inline-flex items-center gap-2">
            <Rocket className="h-3.5 w-3.5" /> Merchant home
          </span>
          <ArrowUpRight className="h-3 w-3" />
        </Link>
        <div className="mt-1 flex items-center gap-2 rounded-lg px-2 py-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border bg-background text-[9px] font-semibold text-foreground">
            {initials(user?.name || "Owner")}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[9px] font-medium text-foreground">{user?.name || "Salon owner"}</p>
            <p className="truncate text-[8px] text-muted-foreground">{user?.email}</p>
          </div>
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="text-muted-foreground transition-colors hover:text-red-400"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-border bg-card/40 lg:block">
        {sidebar}
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-64 border-r border-border bg-card">{sidebar}</div>
        </div>
      )}

      <div className="lg:pl-60">
        <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMenuOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground lg:hidden"
                aria-label="Open menu"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-[13px] font-semibold text-foreground">{copy.title}</p>
                  {salon.hasUnpublishedChanges && (
                    <span className="hidden rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em] text-amber-400 sm:inline">
                      Draft changes
                    </span>
                  )}
                </div>
                <p className="truncate text-[9px] text-muted-foreground">{copy.subtitle}</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={viewHref}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary sm:inline-flex"
              >
                <ExternalLink className="h-3 w-3" /> {salon.status === "published" ? "View site" : "Preview"}
              </a>
              <button
                onClick={() => void publish()}
                disabled={publishing || (salon.status === "published" && !salon.hasUnpublishedChanges && !dirty) || !canPublish}
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-[8px] font-bold uppercase tracking-[0.12em] transition-opacity",
                  salon.status === "published" && !salon.hasUnpublishedChanges && !dirty
                    ? "border border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                    : "bg-primary text-black hover:opacity-90 disabled:opacity-50"
                )}
              >
                {publishing ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : salon.status === "published" && !salon.hasUnpublishedChanges && !dirty ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Rocket className="h-3 w-3" />
                )}
                {publishLabel}
              </button>
            </div>
          </div>
          {dirty && active !== "website" && (
            <div className="flex items-center justify-between gap-3 border-t border-amber-500/15 bg-amber-500/[0.06] px-4 py-1.5 sm:px-6">
              <p className="text-[8px] font-bold uppercase tracking-[0.12em] text-amber-400">
                You have unsaved website changes
              </p>
              <button
                onClick={() => handleNavigate("website")}
                className="text-[8px] font-bold uppercase tracking-[0.12em] text-amber-400 underline decoration-amber-500/40 underline-offset-2"
              >
                Review & save
              </button>
            </div>
          )}
        </header>

        <div className="px-4 pt-4 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1320px] space-y-2">
            <VerifyEmailBanner compact />
            <ApprovalPanel salon={salon} onChanged={refresh} compact />
          </div>
        </div>

        {salon.status === "suspended" && (
          <div className="border-b border-red-500/20 bg-red-500/[0.06] px-4 py-2.5 text-[10px] text-red-300 sm:px-6">
            This salon has been suspended by the platform team. Contact support to restore your website.
          </div>
        )}

        <main className="mx-auto w-full max-w-[1320px] px-4 py-5 sm:px-6 lg:px-8">
          {active === "overview" && (
            <Overview
              salon={salon}
              analytics={analytics}
              bookings={bookings}
              onNavigate={handleNavigate}
              onPublish={() => void publish()}
              publishing={publishing}
            />
          )}

          {active === "website" && form && (
            <WebsiteEditor
              salon={salon}
              form={form}
              setForm={setForm}
              dirty={dirty}
              saving={savingSite}
              onSave={async () => {
                try {
                  await saveSite();
                } catch {
                  /* handled inside saveSite */
                }
              }}
              onSalonUpdated={() => {
                void refresh();
              }}
            />
          )}

          {active === "services" && <Services salon={salon} refresh={refresh} />}
          {active === "team" && <Team salon={salon} refresh={refresh} />}
          {active === "gallery" && <Gallery salon={salon} refresh={refresh} />}
          {active === "bookings" && <Bookings salon={salon} bookings={bookings} refresh={refresh} />}
          {active === "reviews" && <Reviews salon={salon} refresh={refresh} />}
          {active === "analytics" && <AnalyticsView salon={salon} analytics={analytics} />}
          {active === "settings" && (
            <Settings salon={salon} refresh={refreshIdentity} onPublish={publish} publishing={publishing} />
          )}
        </main>

        <footer className="border-t border-border px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-[1320px] flex-col gap-1 text-[8px] text-muted-foreground/60 sm:flex-row sm:items-center sm:justify-between">
            <span>© {new Date().getFullYear()} Velvet Salon Studio</span>
            <span className="truncate font-mono">{siteUrl}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
