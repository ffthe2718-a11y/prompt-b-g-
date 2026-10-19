import type { AdminStats, AuditEntry, PlanId } from "@/types/salon";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  CreditCard,
  Globe2,
  RefreshCw,
  ShieldCheck,
  Store,
  UserCheck,
  Users,
} from "lucide-react";
import { Panel } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const PLAN_LABELS: Record<PlanId, string> = { launch: "Launch", studio: "Studio", atelier: "Atelier" };
const PLAN_ORDER: PlanId[] = ["launch", "studio", "atelier"];

function Stat({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-3">
      <div className="flex items-center justify-between">
        <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
        <Icon className="h-3 w-3 text-primary/60" />
      </div>
      <p className="mt-1 font-serif text-xl text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[8px] text-muted-foreground/70">{hint}</p>}
    </div>
  );
}

function formatWhen(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const diff = Date.now() - date.getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const ACTION_LABELS: Record<string, string> = {
  google_login: "Signed in with Google",
  google_signup: "Created account with Google",
  user_updated: "Updated a user",
  user_deleted: "Deleted a user",
  password_reset_cleared: "Cleared reset links",
  salon_status_changed: "Changed salon status",
  salon_deleted: "Deleted a salon",
  subscription_updated: "Changed subscription",
  settings_updated: "Updated platform settings",
};

export default function OverviewTab({
  stats,
  audit,
  onRefresh,
}: {
  stats: AdminStats | null;
  audit: AuditEntry[];
  onRefresh: () => void;
}) {
  const planTotal = stats ? PLAN_ORDER.reduce((sum, id) => sum + (stats.plans[id] || 0), 0) : 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">Platform overview</p>
          <h1 className="mt-1.5 font-serif text-3xl text-foreground">Every salon, in one place.</h1>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Super admins can see all accounts, websites, plans and activity across the platform.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="inline-flex h-8 items-center gap-1.5 self-start rounded-lg border border-border px-3 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-3 w-3" /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Stat label="Accounts" value={stats?.users ?? 0} hint={`${stats?.newUsers30d ?? 0} new in 30 days`} icon={Users} />
        <Stat label="Salon owners" value={stats?.owners ?? 0} hint={`${stats?.suspendedUsers ?? 0} suspended`} icon={UserCheck} />
        <Stat label="Salons" value={stats?.salons ?? 0} hint={`${stats?.publishedSalons ?? 0} live`} icon={Store} />
        <Stat label="Super admins" value={stats?.superAdmins ?? 0} hint="Full platform access" icon={ShieldCheck} />
        <Stat label="Monthly revenue" value={`₹${(stats?.mrr ?? 0).toLocaleString("en-IN")}`} hint="Active subscriptions" icon={CreditCard} />
        <Stat label="Booking value" value={`₹${Math.round(stats?.revenue ?? 0).toLocaleString("en-IN")}`} icon={ArrowUpRight} />
        <Stat label="Bookings" value={stats?.bookings ?? 0} icon={CalendarDays} />
        <Stat label="Published reviews" value={stats?.reviews ?? 0} icon={BookOpen} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Plan distribution</h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Salons by subscription tier</p>
            </div>
            <Globe2 className="h-4 w-4 text-primary/50" />
          </div>
          <div className="mt-5 space-y-4">
            {PLAN_ORDER.map((plan) => {
              const count = stats?.plans[plan] || 0;
              const percent = planTotal > 0 ? Math.round((count / planTotal) * 100) : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-medium text-foreground">{PLAN_LABELS[plan]}</span>
                    <span className="text-muted-foreground">
                      {count} salon{count === 1 ? "" : "s"} · {percent}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/60">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        plan === "launch" ? "bg-primary/50" : plan === "studio" ? "bg-primary/75" : "bg-primary"
                      )}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Live websites</p>
              <p className="mt-1 font-serif text-lg text-foreground">{stats?.publishedSalons ?? 0}</p>
            </div>
            <div className="rounded-xl border border-border bg-background/60 p-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Draft / suspended</p>
              <p className="mt-1 font-serif text-lg text-foreground">
                {Math.max((stats?.salons ?? 0) - (stats?.publishedSalons ?? 0), 0)}
              </p>
            </div>
          </div>
        </Panel>

        <Panel>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-foreground">Recent activity</h2>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Audited privileged actions</p>
            </div>
            <Activity className="h-4 w-4 text-primary/50" />
          </div>
          {audit.length === 0 ? (
            <p className="mt-8 text-[11px] text-muted-foreground">
              No admin activity yet. Role changes, suspensions, plan changes and settings updates appear here.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-border/60">
              {audit.map((entry) => (
                <li key={entry.id} className="flex items-start justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium text-foreground">
                      {ACTION_LABELS[entry.action] || entry.action.replace(/_/g, " ")}
                      {entry.detail && entry.targetType !== "user" ? (
                        <span className="font-normal text-muted-foreground"> · {entry.detail}</span>
                      ) : null}
                    </p>
                    <p className="truncate text-[8px] text-muted-foreground/70">{entry.actorEmail || "system"}</p>
                  </div>
                  <span className="shrink-0 text-[8px] uppercase tracking-[0.1em] text-muted-foreground/60">
                    {formatWhen(entry.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
