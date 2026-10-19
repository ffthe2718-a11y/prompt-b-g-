import { useMemo } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  Copy,
  Eye,
  Globe2,
  Image,
  Palette,
  Scissors,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import type { Analytics, Booking, Salon } from "@/types/salon";
import { formatPrice } from "@/types/salon";
import { BookingBadge, ChecklistRow, Panel, SectionHeading, StatusBadge, StatCard, copyText } from "@/components/dashboard/ui";
import { fullAddress, sitePath } from "@/lib/salonUi";

export default function Overview({
  salon,
  analytics,
  bookings,
  onNavigate,
  onPublish,
  publishing,
}: {
  salon: Salon;
  analytics: Analytics | null;
  bookings: Booking[];
  onNavigate: (section: string) => void;
  onPublish: () => void;
  publishing: boolean;
}) {
  const stats = salon.stats;
  const url = typeof window !== "undefined" ? `${window.location.origin}/${salon.slug}` : sitePath(salon.slug);
  const recent = bookings.slice(0, 5);
  const maxBookings = Math.max(1, ...(analytics?.days.map((day) => day.bookings) ?? [1]));
  const contactDone = Boolean(salon.phone || salon.email || salon.whatsapp);
  const activeServices = salon.services.filter((service) => service.isActive).length;
  const readiness = [
    { label: "Salon details added", done: Boolean(salon.name && salon.slug) },
    { label: "Contact information", done: contactDone },
    { label: "At least one service", done: activeServices > 0 },
    { label: "Branding image", done: Boolean(salon.logoUrl || salon.heroImageUrl) },
    { label: "Published website", done: salon.status === "published" },
  ];
  const progress = Math.round((readiness.filter((item) => item.done).length / readiness.length) * 100);

  const topServices = useMemo(() => {
    if (analytics?.topServices?.length) return analytics.topServices;
    const counts = new Map<string, { name: string; count: number; revenue: number }>();
    for (const booking of bookings) {
      if (!booking.serviceName) continue;
      const current = counts.get(booking.serviceName) ?? { name: booking.serviceName, count: 0, revenue: 0 };
      current.count += 1;
      if (booking.status === "confirmed" || booking.status === "completed") current.revenue += booking.price;
      counts.set(booking.serviceName, current);
    }
    return Array.from(counts.values()).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [analytics, bookings]);

  return (
    <div className="space-y-4">
      {/* Status banner */}
      <div
        className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-background to-primary/[0.05] p-5 sm:p-6"
      >
        <div className="pointer-events-none absolute -right-20 -top-20 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={salon.status} />
              {salon.hasUnpublishedChanges && (
                <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.14em] text-amber-400">
                  Unpublished changes
                </span>
              )}
              <span className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {salon.stats?.totalBookings ?? bookings.length} bookings all time
              </span>
            </div>
            <h2 className="mt-3 font-serif text-3xl leading-tight text-foreground sm:text-4xl">
              {salon.status === "published" ? "Your studio is live." : "Your studio is almost ready."}
            </h2>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-background/60 px-3 py-2">
                <Globe2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                <span className="truncate font-mono text-[10px] text-foreground">{url}</span>
                <button
                  onClick={() => void copyText(url)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-primary"
                  aria-label="Copy website link"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              {salon.status === "published" && (
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-[0.16em] text-primary hover:underline"
                >
                  View live site <ArrowUpRight className="h-3 w-3" />
                </a>
              )}
            </div>
            {salon.hasUnpublishedChanges && salon.status === "published" && (
              <p className="mt-3 text-[10px] leading-relaxed text-amber-400/90">
                {salon.changesSinceApproval
                  ? "Your live website still shows the approved version. New edits need approval before they can go live."
                  : "You have changes that are not on your live website yet. Publish to update it."}
              </p>
            )}
            {salon.approvalStatus === "pending" && (
              <p className="mt-3 text-[10px] leading-relaxed text-amber-400/90">
                Submitted for review. Editing is still open — we will email you with the decision.
              </p>
            )}
            {(salon.approvalStatus === "rejected" || salon.approvalStatus === "changes_requested") &&
              salon.approvalNote && (
                <p className="mt-3 text-[10px] leading-relaxed text-red-300">
                  Reviewer note: {salon.approvalNote}
                </p>
              )}
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
            {salon.canPublish ? (
              <button
                onClick={onPublish}
                disabled={publishing}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-5 text-[9px] font-bold uppercase tracking-[0.16em] text-black disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {salon.status === "published"
                  ? salon.hasUnpublishedChanges
                    ? "Publish changes"
                    : "Publish again"
                  : "Publish website"}
              </button>
            ) : (
              <button
                onClick={() => onNavigate("website")}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 text-[9px] font-bold uppercase tracking-[0.16em] text-amber-300"
              >
                <Sparkles className="h-3.5 w-3.5" />
                {salon.approvalStatus === "pending"
                  ? "Waiting for approval"
                  : salon.approvalStatus === "approved"
                    ? "Submit new changes"
                    : "Finish & submit"}
              </button>
            )}
            <button
              onClick={() => onNavigate("website")}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-[9px] font-bold uppercase tracking-[0.16em] text-foreground"
            >
              <Palette className="h-3.5 w-3.5" /> Customize
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total bookings"
          value={String(stats?.totalBookings ?? bookings.length)}
          hint={`${stats?.pendingBookings ?? bookings.filter((b) => b.status === "pending").length} pending`}
          icon={<CalendarDays className="h-4 w-4" />}
        />
        <StatCard
          label="Revenue"
          value={formatPrice(stats?.revenue ?? 0, salon.currency)}
          hint="Confirmed & completed"
          icon={<CircleDollarSign className="h-4 w-4" />}
          accent
        />
        <StatCard
          label="Rating"
          value={salon.ratingCount > 0 ? salon.rating.toFixed(1) : "—"}
          hint={`${salon.ratingCount} review${salon.ratingCount === 1 ? "" : "s"}`}
          icon={<Star className="h-4 w-4" />}
        />
        <StatCard
          label="Site views"
          value={String(analytics?.views ?? salon.views ?? 0)}
          hint={`${analytics?.subscribers ?? 0} subscribers`}
          icon={<Eye className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Chart */}
        <Panel>
          <div className="flex items-start justify-between gap-4">
            <SectionHeading title="Last 14 days" description="Booking requests and confirmed revenue." />
            <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400">
              <TrendingUp className="h-3 w-3" /> Live
            </span>
          </div>
          <div className="mt-6 flex h-40 items-end gap-1.5">
            {(analytics?.days ?? []).map((day) => {
              const height = Math.max(6, (day.bookings / maxBookings) * 100);
              return (
                <div key={day.date} className="group relative flex flex-1 flex-col items-center justify-end gap-1.5">
                  <div className="pointer-events-none absolute -top-8 z-10 hidden whitespace-nowrap rounded-lg border border-border bg-popover px-2 py-1 text-[8px] text-foreground group-hover:block">
                    {day.bookings} booking{day.bookings === 1 ? "" : "s"} · {formatPrice(day.revenue, salon.currency)}
                  </div>
                  <div
                    className="w-full rounded-t-sm bg-gradient-to-t from-primary/25 to-primary/70 transition-all group-hover:from-primary/40 group-hover:to-primary"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-[7px] uppercase text-muted-foreground/60">{day.date.slice(8)}</span>
                </div>
              );
            })}
            {!analytics && <p className="text-[10px] text-muted-foreground">Loading activity…</p>}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-[9px] text-muted-foreground">
            <span>14-day booking activity</span>
            <span>{formatPrice(analytics?.days.reduce((sum, day) => sum + day.revenue, 0) ?? 0, salon.currency)} revenue</span>
          </div>
        </Panel>

        {/* Checklist + quick actions */}
        <div className="space-y-4">
          <Panel>
            <SectionHeading title="Launch checklist" description="Everything a complete salon website needs." />
            <div className="mt-4 space-y-2.5">
              {readiness.map((item) => (
                <ChecklistRow key={item.label} done={item.done} label={item.label} />
              ))}
            </div>
            <div className="mt-4">
              <div className="flex items-center justify-between text-[9px] text-muted-foreground">
                <span>Site completeness</span>
                <span>{progress}%</span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>
          </Panel>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Services", icon: Scissors, section: "services" },
              { label: "Team", icon: Users, section: "team" },
              { label: "Gallery", icon: Image, section: "gallery" },
              { label: "Bookings", icon: CalendarDays, section: "bookings" },
            ].map((action) => (
              <button
                key={action.section}
                onClick={() => onNavigate(action.section)}
                className="group flex items-center justify-between rounded-xl border border-border bg-card/50 px-3 py-3 text-left transition-colors hover:border-primary/30 hover:bg-card"
              >
                <span className="flex items-center gap-2 text-[10px] font-medium text-foreground">
                  <action.icon className="h-3.5 w-3.5 text-primary" /> {action.label}
                </span>
                <ArrowRight className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.3fr_0.7fr]">
        {/* Recent bookings */}
        <Panel>
          <SectionHeading
            title="Recent bookings"
            description="Requests from your public website."
            action={
              <button onClick={() => onNavigate("bookings")} className="text-[8px] font-bold uppercase tracking-[0.14em] text-primary hover:underline">
                View all
              </button>
            }
          />
          <div className="mt-4 space-y-2">
            {recent.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
                <CalendarDays className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-[11px] text-muted-foreground">No bookings yet. Share your live link to start receiving requests.</p>
              </div>
            ) : (
              recent.map((booking) => (
                <div key={booking.id} className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-medium text-foreground">{booking.customerName}</p>
                    <p className="mt-0.5 truncate text-[9px] text-muted-foreground">
                      {booking.serviceName || "Appointment"} · {booking.date} at {booking.time}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <BookingBadge status={booking.status} />
                    <p className="mt-1 text-[9px] text-muted-foreground">{formatPrice(booking.price, salon.currency)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Panel>

        {/* Top services */}
        <Panel>
          <SectionHeading title="Popular services" description="What clients are booking most." />
          <div className="mt-4 space-y-3">
            {topServices.length === 0 ? (
              <p className="text-[10px] text-muted-foreground">Booking trends appear once clients start booking.</p>
            ) : (
              topServices.map((service, index) => (
                <div key={service.name}>
                  <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="truncate text-foreground">{index + 1}. {service.name}</span>
                    <span className="shrink-0 text-muted-foreground">{service.count} booked</span>
                  </div>
                  <div className="mt-1 h-1 overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-primary/70"
                      style={{ width: `${Math.max(8, (service.count / Math.max(1, topServices[0].count)) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="mt-5 border-t border-border/60 pt-4 text-[9px] leading-relaxed text-muted-foreground">
            <p className="flex items-center gap-1.5 text-foreground">
              <Sparkles className="h-3 w-3 text-primary" /> Tip
            </p>
            <p className="mt-1">
              Add detailed descriptions and durations to your services — clients are more likely to book when they
              know exactly what to expect.
            </p>
          </div>
        </Panel>
      </div>

      {fullAddress(salon) && (
        <p className="px-1 text-[9px] uppercase tracking-[0.16em] text-muted-foreground/60">
          Listed at {fullAddress(salon)}
        </p>
      )}
    </div>
  );
}
