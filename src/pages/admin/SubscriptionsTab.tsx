import { useCallback, useEffect, useState } from "react";
import type { AdminSubscription, PlanDefinition, PlanId, SubscriptionStatus } from "@/types/salon";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Check, CreditCard, Loader2, TrendingUp } from "lucide-react";
import { Panel } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const STATUSES: SubscriptionStatus[] = ["trialing", "active", "past_due", "canceled"];

const STATUS_TONE: Record<SubscriptionStatus, string> = {
  active: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  trialing: "border-sky-500/25 bg-sky-500/10 text-sky-400",
  past_due: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  canceled: "border-red-500/25 bg-red-500/10 text-red-400",
};

export default function SubscriptionsTab({ onChanged }: { onChanged: () => void }) {
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [subscriptions, setSubscriptions] = useState<AdminSubscription[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    byPlan: Record<string, number>;
    byStatus: Record<string, number>;
    mrr: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.subscriptions();
      setPlans(data.plans);
      setSubscriptions(data.subscriptions);
      setSummary(data.summary);
    } catch (error: any) {
      toast.error(error?.message || "Could not load subscriptions.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = async (row: AdminSubscription, patch: { plan?: PlanId; status?: SubscriptionStatus }) => {
    setBusyId(row.salonId);
    try {
      await adminApi.updateSubscription(row.salonId, patch);
      setSubscriptions((current) =>
        current.map((item) => (item.salonId === row.salonId ? { ...item, ...patch } : item))
      );
      toast.success(`${row.salonName} updated.`);
      await load();
      onChanged();
    } catch (error: any) {
      toast.error(error?.message || "Could not update this subscription.");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Loading subscriptions</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">Revenue & plans</p>
        <h1 className="mt-1.5 font-serif text-2xl text-foreground">Subscriptions, without surprises.</h1>
        <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">
          Move a salon between plans, mark a payment issue, or cancel access. Owners see their plan in Settings. Plans
          record entitlements and recurring revenue — this console never charges a card.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card/50 p-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Salons billed</p>
          <p className="mt-1 font-serif text-xl text-foreground">{summary?.total ?? 0}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Monthly revenue</p>
          <p className="mt-1 font-serif text-xl text-foreground">₹{(summary?.mrr ?? 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Active</p>
          <p className="mt-1 font-serif text-xl text-foreground">{(summary?.byStatus.active ?? 0) + (summary?.byStatus.trialing ?? 0)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card/50 p-3">
          <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Needs attention</p>
          <p className="mt-1 font-serif text-xl text-foreground">
            {(summary?.byStatus.past_due ?? 0) + (summary?.byStatus.canceled ?? 0)}
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {plans.map((plan) => (
          <Panel key={plan.id} className="flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-primary">{plan.name}</p>
                <p className="mt-2 font-serif text-2xl text-foreground">
                  {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
                  {plan.price > 0 && <span className="text-[9px] font-sans text-muted-foreground"> /mo</span>}
                </p>
              </div>
              <CreditCard className="h-4 w-4 text-primary/40" />
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{plan.blurb}</p>
            <ul className="mt-3 flex-1 space-y-1.5">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-1.5 text-[9px] text-muted-foreground">
                  <Check className="mt-0.5 h-2.5 w-2.5 shrink-0 text-primary" /> {feature}
                </li>
              ))}
            </ul>
            <p className="mt-4 inline-flex items-center gap-1 border-t border-border/60 pt-3 text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-primary/60" />
              {summary?.byPlan[plan.id] ?? 0} salon{(summary?.byPlan[plan.id] ?? 0) === 1 ? "" : "s"} on this plan
            </p>
          </Panel>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/50">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-[11px] font-semibold text-foreground">Salon subscriptions</h2>
          <span className="text-[8px] uppercase tracking-[0.14em] text-muted-foreground">{subscriptions.length} total</span>
        </div>
        {subscriptions.length === 0 ? (
          <p className="py-12 text-center text-[11px] text-muted-foreground">No salons have been created yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Salon", "Owner", "Plan", "Status", "Renews", "Price", "Actions"].map((label) => (
                    <th key={label} className="px-4 py-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {subscriptions.map((row) => (
                  <tr key={row.salonId} className="hover:bg-background/40">
                    <td className="px-4 py-3">
                      <a
                        href={`/${row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-medium text-foreground hover:text-primary"
                      >
                        {row.salonName}
                      </a>
                      <span className="block font-mono text-[8px] text-muted-foreground">/{row.slug}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[10px] text-foreground">{row.ownerName}</p>
                      <p className="truncate text-[8px] text-muted-foreground">{row.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={row.plan}
                        disabled={busyId === row.salonId}
                        onChange={(event) => void update(row, { plan: event.target.value as PlanId })}
                        className="h-7 rounded-lg border border-border bg-background px-2 text-[9px] capitalize text-foreground outline-none focus:border-primary disabled:opacity-60"
                      >
                        {plans.map((plan) => (
                          <option key={plan.id} value={plan.id}>
                            {plan.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em]",
                          STATUS_TONE[row.status]
                        )}
                      >
                        {row.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[9px] text-muted-foreground">
                      {row.renewsAt ? new Date(row.renewsAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[10px] text-foreground">₹{row.price.toLocaleString("en-IN")}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {STATUSES.filter((status) => status !== row.status).map((status) => (
                          <button
                            key={status}
                            onClick={() => void update(row, { status })}
                            disabled={busyId === row.salonId}
                            className={cn(
                              "rounded-md border px-1.5 py-1 text-[7px] font-bold uppercase tracking-[0.1em] disabled:opacity-50",
                              STATUS_TONE[status]
                            )}
                          >
                            {status.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
