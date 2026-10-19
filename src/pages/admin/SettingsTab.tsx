import { useCallback, useEffect, useState } from "react";
import type { PlanDefinition, PlanId, PlatformSettings } from "@/types/salon";
import { adminApi } from "@/lib/api";
import { toast } from "sonner";
import { Globe2, Loader2, Save, ShieldCheck } from "lucide-react";
import { Field, Panel, inputClass, textareaClass } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

export default function SettingsTab({ onChanged }: { onChanged: () => void }) {
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [plans, setPlans] = useState<PlanDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await adminApi.settings();
      setSettings(data.settings);
      setPlans(data.plans);
    } catch (error: any) {
      toast.error(error?.message || "Could not load platform settings.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const patch = (next: Partial<PlatformSettings>) => {
    setSettings((current) => (current ? { ...current, ...next } : current));
  };

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const result = await adminApi.updateSettings(settings);
      setSettings(result.settings);
      toast.success("Platform settings saved.");
      onChanged();
    } catch (error: any) {
      toast.error(error?.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center gap-2 py-24">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-[9px] uppercase tracking-[0.18em] text-muted-foreground">Loading settings</span>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-primary">Platform settings</p>
          <h1 className="mt-1.5 font-serif text-2xl text-foreground">The rules of the house.</h1>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Branding, access rules and defaults for every salon. Changes apply immediately.
          </p>
        </div>
        <button
          onClick={() => void save()}
          disabled={saving}
          className="inline-flex h-9 items-center gap-1.5 self-start rounded-full bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.16em] text-black disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          {saving ? "Saving" : "Save settings"}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel className="space-y-4">
          <div className="flex items-center gap-2">
            <Globe2 className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Brand & support</h2>
          </div>
          <Field label="Platform name" hint="Shown in page titles and emails.">
            <input
              value={settings.platformName}
              onChange={(event) => patch({ platformName: event.target.value })}
              className={inputClass}
              maxLength={60}
            />
          </Field>
          <Field label="Support email" hint="Owners use this when they need help.">
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(event) => patch({ supportEmail: event.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Platform announcement" hint="Leave blank to hide it. Max 280 characters.">
            <textarea
              value={settings.announcement}
              onChange={(event) => patch({ announcement: event.target.value })}
              className={textareaClass}
              maxLength={280}
              placeholder="e.g. Scheduled maintenance on Sunday 02:00–03:00 IST"
            />
          </Field>
        </Panel>

        <Panel className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Access & defaults</h2>
          </div>

          <button
            type="button"
            onClick={() => patch({ signupsEnabled: !settings.signupsEnabled })}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left"
          >
            <span>
              <span className="block text-[10px] font-medium text-foreground">Allow new sign-ups</span>
              <span className="block text-[9px] text-muted-foreground">
                When off, new owners can't register. Existing owners can still sign in.
              </span>
            </span>
            <span
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                settings.signupsEnabled ? "bg-primary" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-black/80 transition-all",
                  settings.signupsEnabled ? "left-[18px]" : "left-0.5"
                )}
              />
            </span>
          </button>

          <button
            type="button"
            onClick={() => patch({ directoryVisible: !settings.directoryVisible })}
            className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background/60 px-3 py-2.5 text-left"
          >
            <span>
              <span className="block text-[10px] font-medium text-foreground">Show public directory</span>
              <span className="block text-[9px] text-muted-foreground">
                Lists published salons on the marketplace. Direct website links keep working when off.
              </span>
            </span>
            <span
              className={cn(
                "relative h-5 w-9 shrink-0 rounded-full transition-colors",
                settings.directoryVisible ? "bg-primary" : "bg-border"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 h-4 w-4 rounded-full bg-black/80 transition-all",
                  settings.directoryVisible ? "left-[18px]" : "left-0.5"
                )}
              />
            </span>
          </button>

          <Field label="Default plan for new salons">
            <select
              value={settings.defaultPlan}
              onChange={(event) => patch({ defaultPlan: event.target.value as PlanId })}
              className={inputClass}
            >
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name} — {plan.price === 0 ? "Free" : `₹${plan.price}/mo`}
                </option>
              ))}
            </select>
          </Field>
        </Panel>
      </div>

      <Panel>
        <h2 className="text-sm font-semibold text-foreground">Plan catalog</h2>
        <p className="mt-1 text-[10px] text-muted-foreground">
          Prices are stored in the platform catalog and applied to every subscription view.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          {plans.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border bg-background/60 p-3">
              <div className="flex items-center justify-between">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-primary">{plan.name}</p>
                {settings.defaultPlan === plan.id && (
                  <span className="rounded-full bg-primary/15 px-1.5 py-0.5 text-[7px] font-bold uppercase tracking-[0.1em] text-primary">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-1 font-serif text-lg text-foreground">
                {plan.price === 0 ? "Free" : `₹${plan.price.toLocaleString("en-IN")}`}
              </p>
              <p className="mt-1 text-[9px] text-muted-foreground">{plan.blurb}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
