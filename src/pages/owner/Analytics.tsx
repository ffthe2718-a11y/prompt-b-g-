import { useEffect, useState } from "react";
import type { Analytics as AnalyticsData, Salon } from "@/types/salon";
import { formatPrice } from "@/types/salon";
import { BarChart3, Copy, Download, Eye, Mail, Star, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { salonApi } from "@/lib/api";
import { Panel, SectionHeading, StatCard } from "@/components/dashboard/ui";

export default function Analytics({
  salon,
  analytics,
}: {
  salon: Salon;
  analytics: AnalyticsData | null;
}) {
  const [subscribers, setSubscribers] = useState<{ id: string; email: string; createdAt: string }[]>([]);
  const [subscriberCount, setSubscriberCount] = useState(0);

  useEffect(() => {
    let alive = true;
    salonApi
      .subscribers()
      .then((data) => {
        if (!alive) return;
        setSubscribers(data.subscribers);
        setSubscriberCount(data.count);
      })
      .catch(() => {
        /* the headline count from analytics is still shown */
      });
    return () => {
      alive = false;
    };
  }, []);

  const subscriberEmails = subscribers.map((entry) => entry.email);

  const exportSubscribers = () => {
    if (subscribers.length === 0) {
      toast.error("No newsletter subscribers to export yet.");
      return;
    }
    const csv = ["Email,Subscribed", ...subscribers.map((entry) => `"${entry.email}","${entry.createdAt}"`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${salon.slug}-subscribers.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"} exported.`);
  };

  const copySubscribers = async () => {
    if (subscriberEmails.length === 0) {
      toast.error("There are no subscriber emails to copy yet.");
      return;
    }
    try {
      await navigator.clipboard.writeText(subscriberEmails.join(", "));
      toast.success("Subscriber emails copied.");
    } catch {
      toast.error("Your browser blocked clipboard access. Use Export CSV instead.");
    }
  };

  if (!analytics) {
    return (
      <Panel>
        <p className="text-[11px] text-muted-foreground">Loading your analytics…</p>
      </Panel>
    );
  }

  const totalBookings = analytics.days.reduce((sum, day) => sum + day.bookings, 0);
  const totalRevenue = analytics.days.reduce((sum, day) => sum + day.revenue, 0);
  const peak = Math.max(1, ...analytics.days.map((day) => day.bookings));
  const conversion = analytics.views > 0 ? (totalBookings / analytics.views) * 100 : 0;
  const maxTop = Math.max(1, ...analytics.topServices.map((service) => service.count));

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeading
          title="Analytics"
          description="A quiet, honest read on how your website is working. Page views are counted on your published site only."
        />
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <StatCard label="Page views" value={analytics.views.toLocaleString()} hint="All time" icon={<Eye className="h-3.5 w-3.5" />} />
          <StatCard label="Bookings" value={String(totalBookings)} hint="Last 14 days" icon={<BarChart3 className="h-3.5 w-3.5" />} accent />
          <StatCard
            label="Booking value"
            value={formatPrice(totalRevenue, salon.currency)}
            hint="Last 14 days"
            icon={<TrendingUp className="h-3.5 w-3.5" />}
          />
          <StatCard
            label="Subscribers"
            value={String(subscriberCount || analytics.subscribers)}
            hint="Newsletter sign-ups"
            icon={<Mail className="h-3.5 w-3.5" />}
          />
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Panel>
          <SectionHeading title="Bookings, last 14 days" description="Requests received through your website." />
          <div className="mt-6 flex h-44 items-end gap-1.5">
            {analytics.days.map((day) => {
              const height = Math.max(4, (day.bookings / peak) * 100);
              const label = new Date(`${day.date}T00:00:00`).toLocaleDateString(undefined, {
                weekday: "short",
                day: "numeric",
              });
              return (
                <div key={day.date} className="group flex h-full flex-1 flex-col items-center justify-end gap-1.5">
                  <span className="text-[8px] font-medium text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
                    {day.bookings}
                  </span>
                  <div
                    className="w-full rounded-t-md bg-primary/25 transition-colors group-hover:bg-primary/60"
                    style={{ height: `${height}%` }}
                    title={`${label}: ${day.bookings} bookings`}
                  />
                  <span className="text-[7px] text-muted-foreground/70">{new Date(`${day.date}T00:00:00`).getDate()}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-3 text-[9px] text-muted-foreground">
            <span>{totalBookings} booking{totalBookings === 1 ? "" : "s"} in this period</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-primary/40" /> Requests
            </span>
          </div>
        </Panel>

        <Panel>
          <SectionHeading title="Reputation" description="Published reviews only." />
          <div className="mt-5 flex items-center gap-3">
            <p className="font-serif text-4xl text-foreground">{analytics.rating ? analytics.rating.toFixed(1) : "—"}</p>
            <div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={
                      star <= Math.round(analytics.rating)
                        ? "h-3 w-3 fill-primary text-primary"
                        : "h-3 w-3 text-border"
                    }
                  />
                ))}
              </div>
              <p className="mt-1 text-[9px] text-muted-foreground">
                {analytics.ratingCount} review{analytics.ratingCount === 1 ? "" : "s"}
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-1.5">
            {analytics.ratingDistribution.map((row) => (
              <div key={row.rating} className="flex items-center gap-2">
                <span className="w-3 text-[8px] text-muted-foreground">{row.rating}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-background">
                  <div
                    className="h-full rounded-full bg-primary/60"
                    style={{
                      width: `${analytics.ratingCount ? (row.count / analytics.ratingCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span className="w-3 text-right text-[8px] text-muted-foreground">{row.count}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl border border-border bg-background/40 p-3">
            <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">View to booking</p>
            <p className="mt-1 font-serif text-xl text-foreground">{conversion.toFixed(1)}%</p>
            <p className="mt-0.5 text-[8px] leading-relaxed text-muted-foreground">
              {analytics.views > 0
                ? "Of visitors who opened your site in the last 14 days, this share requested an appointment."
                : "Share your live link to start measuring visits."}
            </p>
          </div>
        </Panel>
      </div>

      <Panel>
        <SectionHeading title="Popular services" description="What clients actually book, all time." />
        {analytics.topServices.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-[10px] text-muted-foreground">
            No bookings yet. Your service mix will appear here after your first appointment request.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {analytics.topServices.map((service) => (
              <div key={service.name}>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="truncate font-medium text-foreground">{service.name}</span>
                  <span className="ml-3 shrink-0 text-muted-foreground">
                    {service.count} booking{service.count === 1 ? "" : "s"} ·{" "}
                    {formatPrice(service.revenue, salon.currency)}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                  <div className="h-full rounded-full bg-primary/60" style={{ width: `${(service.count / maxTop) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel>
        <SectionHeading
          title="Newsletter subscribers"
          description="Collected by the sign-up form in your website footer. Export the list for a campaign."
          action={
            <div className="flex items-center gap-2">
              <button
                onClick={() => void copySubscribers()}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:text-foreground"
              >
                <Copy className="h-3 w-3" /> Copy
              </button>
              <button
                onClick={exportSubscribers}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 text-[8px] font-bold uppercase tracking-[0.12em] text-primary"
              >
                <Download className="h-3 w-3" /> Export CSV
              </button>
            </div>
          }
        />
        {subscribers.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-border px-4 py-8 text-center text-[10px] text-muted-foreground">
            No sign-ups yet. The footer of your published website invites visitors to join your list.
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {subscribers.slice(0, 12).map((entry) => (
                <div key={entry.id} className="truncate rounded-lg border border-border bg-background/40 px-3 py-2 text-[10px] text-foreground">
                  {entry.email}
                  <span className="ml-2 text-[8px] text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
            {subscribers.length > 12 && (
              <p className="mt-2 text-[9px] text-muted-foreground">
                Showing the 12 most recent of {subscriberCount}. Export for the full list.
              </p>
            )}
          </>
        )}
      </Panel>
    </div>
  );
}
