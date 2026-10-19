import { useEffect, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import {
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  Globe2,
  Image as ImageIcon,
  Link2,
  Loader2,
  LockKeyhole,
  Palette,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Unlink,
} from "lucide-react";
import type { PlatformConfig, Salon, TemplateId } from "@/types/salon";
import { readiness, type SiteForm } from "@/pages/owner/websiteForm";
import { CURRENCIES, TEMPLATE_PRESETS, TIMEZONES, isHexColor } from "@/lib/salonUi";
import { publicApi, resolveSiteUrl, resolveSubdomainUrl, salonApi } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import ImageField from "@/components/common/ImageField";
import { CopyButton, Field, Panel, SectionHeading, inputClass, textareaClass } from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const TABS = [
  { id: "content", label: "Content", icon: Sparkles },
  { id: "design", label: "Look & feel", icon: Palette },
  { id: "contact", label: "Contact", icon: Globe2 },
  { id: "booking", label: "Hours & booking", icon: LockKeyhole },
  { id: "sections", label: "Sections", icon: ImageIcon },
  { id: "visibility", label: "Visibility", icon: Search },
];

type TabId = (typeof TABS)[number]["id"];

export default function WebsiteEditor({
  salon,
  form,
  setForm,
  dirty,
  saving,
  onSave,
  onSalonUpdated,
}: {
  salon: Salon;
  form: SiteForm;
  setForm: Dispatch<SetStateAction<SiteForm>>;
  dirty: boolean;
  saving: boolean;
  onSave: () => Promise<void>;
  onSalonUpdated: (salon: Salon) => void;
}) {
  const [tab, setTab] = useState<TabId>("content");
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [domainInput, setDomainInput] = useState(salon.customDomain || "");
  const [domainBusy, setDomainBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    publicApi.config().then(setConfig).catch(() => setConfig(null));
  }, []);

  useEffect(() => {
    setDomainInput(salon.customDomain || "");
  }, [salon.customDomain]);

  const update = <K extends keyof SiteForm>(key: K, value: SiteForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const updateHour = (index: number, patch: Partial<SiteForm["hours"][number]>) => {
    setForm((current) => ({
      ...current,
      hours: current.hours.map((hour, i) => (i === index ? { ...hour, ...patch } : hour)),
    }));
  };

  const openPreview = async () => {
    if (dirty) {
      try {
        await onSave();
      } catch {
        return;
      }
    }
    window.open("/dashboard/preview", "_blank", "noopener,noreferrer");
  };

  const moveSection = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= form.sections.length) return;
    const next = [...form.sections];
    [next[index], next[target]] = [next[target], next[index]];
    update(
      "sections",
      next.map((section, order) => ({ ...section, order }))
    );
  };

  const toggleSection = (id: string, enabled: boolean) => {
    update(
      "sections",
      form.sections.map((section) => (section.id === id ? { ...section, enabled } : section))
    );
  };

  const pathUrl = resolveSiteUrl(form.slug || salon.slug, config);
  const subdomainUrl = resolveSubdomainUrl(form.slug || salon.slug, config);

  const connectDomain = async () => {
    if (!domainInput.trim()) {
      toast.error("Enter a domain like www.yoursalon.com.");
      return;
    }
    setDomainBusy(true);
    try {
      const result = await salonApi.connectDomain(domainInput.trim());
      onSalonUpdated({
        ...salon,
        customDomain: result.domain,
        customDomainVerified: result.verified,
        domainVerifyToken: result.record.value.replace("velvet-verify=", ""),
      });
      setDomainInput(result.domain);
      toast.success("Domain added. Add the DNS record below, then verify.");
    } catch (error: any) {
      toast.error(error?.message || "Could not connect the domain.");
    } finally {
      setDomainBusy(false);
    }
  };

  const verifyDomain = async () => {
    setVerifying(true);
    try {
      await salonApi.verifyDomain();
      onSalonUpdated({ ...salon, customDomainVerified: true });
      toast.success("Domain verified. It will now serve your salon website.");
    } catch (error: any) {
      toast.error(error?.message || "Could not verify the domain yet.");
    } finally {
      setVerifying(false);
    }
  };

  const removeDomain = async () => {
    setDomainBusy(true);
    try {
      await salonApi.removeDomain();
      onSalonUpdated({ ...salon, customDomain: "", customDomainVerified: false, domainVerifyToken: "" });
      setDomainInput("");
      toast.success("Custom domain removed.");
    } catch (error: any) {
      toast.error(error?.message || "Could not remove the domain.");
    } finally {
      setDomainBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col justify-between gap-3 xl:flex-row xl:items-center">
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card/50 p-1">
          {TABS.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[9px] font-bold uppercase tracking-[0.14em] transition-colors",
                  tab === item.id ? "bg-primary text-black" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3 w-3" /> {item.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-[0.14em] text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> Unsaved changes
            </span>
          )}
          <Button
            onClick={() => void onSave()}
            disabled={!dirty || saving}
            className="h-9 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black"
          >
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
            Save changes
          </Button>
          <Button
            variant="outline"
            onClick={() => void openPreview()}
            className="h-9 rounded-lg border-border px-3 text-[9px] font-bold uppercase tracking-[0.14em]"
          >
            <ExternalLink className="h-3 w-3" /> Preview
          </Button>
        </div>
      </div>

      {tab === "content" && (
        <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
          <Panel>
            <SectionHeading title="The essentials" description="The words clients see first. Keep it warm, clear and unmistakably you." />
            <div className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Salon name">
                  <input value={form.name} onChange={(event) => update("name", event.target.value)} className={inputClass} />
                </Field>
                <Field label="Tagline" hint="A short line shown under your logo.">
                  <input value={form.tagline} onChange={(event) => update("tagline", event.target.value)} className={inputClass} />
                </Field>
              </div>
              <Field label="Short description" hint="Used in the about section, directory and search previews.">
                <textarea value={form.description} onChange={(event) => update("description", event.target.value)} className={textareaClass} />
              </Field>
              <div className="border-t border-border/60 pt-4">
                <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">Hero section</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Headline" hint="Defaults to your salon name.">
                    <input value={form.heroTitle} onChange={(event) => update("heroTitle", event.target.value)} placeholder={form.name} className={inputClass} />
                  </Field>
                  <Field label="Subheadline" hint="Defaults to your tagline.">
                    <input value={form.heroSubtitle} onChange={(event) => update("heroSubtitle", event.target.value)} placeholder={form.tagline} className={inputClass} />
                  </Field>
                  <Field label="Booking button label">
                    <input value={form.ctaText} onChange={(event) => update("ctaText", event.target.value)} className={inputClass} />
                  </Field>
                  <Field label="Announcement" hint="Shown as a slim strip above the navigation.">
                    <input value={form.announcement} onChange={(event) => update("announcement", event.target.value)} placeholder="Optional" className={inputClass} />
                  </Field>
                </div>
              </div>
              <div className="border-t border-border/60 pt-4">
                <p className="mb-3 text-[9px] font-bold uppercase tracking-[0.18em] text-primary">About section</p>
                <div className="space-y-3">
                  <Field label="About title" hint="Leave blank to use the default heading.">
                    <input value={form.aboutTitle} onChange={(event) => update("aboutTitle", event.target.value)} placeholder="The story behind the chair" className={inputClass} />
                  </Field>
                  <Field label="Your story" hint="Use blank lines to separate paragraphs.">
                    <textarea
                      value={form.aboutText}
                      onChange={(event) => update("aboutText", event.target.value)}
                      placeholder={form.description || "Tell clients what makes your salon different…"}
                      className={cn(textareaClass, "min-h-36")}
                    />
                  </Field>
                </div>
              </div>
            </div>
          </Panel>

          <div className="space-y-4">
            <Panel className="overflow-hidden">
              <SectionHeading title="Live preview" description="Your draft website, updating with every word." />
              <div className="mt-4 overflow-hidden rounded-2xl border border-border">
                <div className="flex items-center gap-1.5 border-b border-border bg-background px-3 py-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400/60" />
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400/60" />
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400/60" />
                  <span className="ml-2 truncate font-mono text-[7px] text-muted-foreground">/{form.slug || salon.slug}</span>
                </div>
                <div
                  className="relative flex min-h-[260px] flex-col justify-end p-4"
                  style={{ background: TEMPLATE_PRESETS[form.template]?.gradient }}
                >
                  {form.heroImageUrl && (
                    <img src={form.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" referrerPolicy="no-referrer" />
                  )}
                  <div className="relative">
                    <p className="text-[7px] font-bold uppercase tracking-[0.2em]" style={{ color: TEMPLATE_PRESETS[form.template]?.primary }}>
                      {form.tagline || "Your salon"}
                    </p>
                    <h3 className="mt-1.5 font-serif text-2xl leading-tight text-white">{form.heroTitle || form.name || "Your salon name"}</h3>
                    <p className="mt-1.5 line-clamp-2 text-[8px] text-white/60">{form.heroSubtitle || form.description || "A beautiful place to be yourself."}</p>
                    <span className="mt-3 inline-block rounded-full px-3 py-1.5 text-[7px] font-bold uppercase tracking-[0.14em] text-black" style={{ backgroundColor: form.primaryColor }}>
                      {form.ctaText || "Book appointment"}
                    </span>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => void openPreview()}
                variant="outline"
                className="mt-3 h-9 w-full rounded-lg border-border text-[9px] font-bold uppercase tracking-[0.14em]"
              >
                <ExternalLink className="h-3 w-3" /> Open full preview
              </Button>
            </Panel>

            <Panel>
              <SectionHeading title="Publishing" description="Your live site only changes when you publish." />
              <div className="mt-4 flex items-center justify-between gap-3 text-[10px]">
                <span className="text-muted-foreground">Current status</span>
                <span className={cn("rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.12em]", salon.status === "published" ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-400" : "border-amber-500/25 bg-amber-500/10 text-amber-400")}>
                  {salon.status}
                </span>
              </div>
              <div className="mt-4 space-y-1.5 border-t border-border/60 pt-3">
                {readiness(salon, form).map((item) => (
                  <div key={item.key} className="flex items-center gap-2 text-[9px]">
                    <span
                      className={cn(
                        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
                        item.done
                          ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                          : item.critical
                            ? "border-amber-500/30 text-amber-400"
                            : "border-border text-muted-foreground"
                      )}
                    >
                      {item.done ? <Check className="h-2.5 w-2.5" /> : <span className="h-1 w-1 rounded-full bg-current" />}
                    </span>
                    <span className={item.done ? "text-muted-foreground line-through decoration-border" : "text-foreground/80"}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground">
                Saving updates your draft. Publish from the dashboard header when you are ready for clients to see
                the new version.
              </p>
            </Panel>
          </div>
        </div>
      )}

      {tab === "design" && (
        <div className="space-y-4">
          <Panel>
            <SectionHeading title="Template" description="Start with a typographic mood. Your colors and images make it yours." />
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
              {(Object.keys(TEMPLATE_PRESETS) as TemplateId[]).map((id) => {
                const preset = TEMPLATE_PRESETS[id];
                const selected = form.template === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      update("template", id);
                    }}
                    className={cn(
                      "overflow-hidden rounded-xl border text-left transition-all",
                      selected ? "border-primary ring-1 ring-primary/40" : "border-border hover:border-primary/40"
                    )}
                  >
                    <div className="flex aspect-[4/3] flex-col justify-between p-3" style={{ background: preset.gradient }}>
                      <span className="text-[6px] uppercase tracking-[0.2em]" style={{ color: preset.accent }}>Your salon</span>
                      <span className="font-serif text-base leading-tight" style={{ color: preset.ink }}>Your name</span>
                      <span className="h-1 w-9 rounded-full" style={{ backgroundColor: preset.primary }} />
                    </div>
                    <div className="flex items-center justify-between p-2.5">
                      <span>
                        <span className="block text-[9px] font-semibold text-foreground">{preset.name}</span>
                        <span className="block text-[8px] text-muted-foreground">{preset.mood}</span>
                      </span>
                      {selected && <Check className="h-3.5 w-3.5 text-primary" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Field label="Primary color" hint="Buttons, links and accents.">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
                  <input
                    type="color"
                    value={isHexColor(form.primaryColor) ? form.primaryColor : "#D4AF37"}
                    onChange={(event) => update("primaryColor", event.target.value)}
                    className="h-8 w-10 rounded-lg border-0 bg-transparent"
                    aria-label="Primary color"
                  />
                  <input
                    value={form.primaryColor}
                    onChange={(event) => update("primaryColor", event.target.value)}
                    className="h-8 w-full bg-transparent font-mono text-xs uppercase text-foreground outline-none"
                  />
                </div>
              </Field>
              <Field label="Secondary color" hint="Used for soft details.">
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5">
                  <input
                    type="color"
                    value={isHexColor(form.accentColor) ? form.accentColor : "#F4E4BC"}
                    onChange={(event) => update("accentColor", event.target.value)}
                    className="h-8 w-10 rounded-lg border-0 bg-transparent"
                    aria-label="Secondary color"
                  />
                  <input
                    value={form.accentColor}
                    onChange={(event) => update("accentColor", event.target.value)}
                    className="h-8 w-full bg-transparent font-mono text-xs uppercase text-foreground outline-none"
                  />
                </div>
              </Field>
            </div>
          </Panel>

          <div className="grid gap-4 lg:grid-cols-3">
            <Panel>
              <ImageField
                label="Logo"
                value={form.logoUrl}
                onChange={(url) => update("logoUrl", url)}
                aspect="aspect-square"
                rounded="full"
                description="Square image, displayed as a circle."
              />
            </Panel>
            <Panel>
              <ImageField
                label="Hero image"
                value={form.heroImageUrl}
                onChange={(url) => update("heroImageUrl", url)}
                aspect="aspect-square"
                rounded="2xl"
                description="Your best salon or styling photo."
              />
            </Panel>
            <Panel>
              <ImageField
                label="About image"
                value={form.aboutImageUrl}
                onChange={(url) => update("aboutImageUrl", url)}
                aspect="aspect-square"
                rounded="2xl"
                description="A portrait shot or interior detail."
              />
            </Panel>
          </div>
        </div>
      )}

      {tab === "contact" && (
        <Panel>
          <SectionHeading title="Contact details" description="These power your contact links, map directions and booking notifications." />
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Phone number">
              <input value={form.phone} onChange={(event) => update("phone", event.target.value)} className={inputClass} inputMode="tel" />
            </Field>
            <Field label="WhatsApp" hint="Leave blank to use your phone number.">
              <input value={form.whatsapp} onChange={(event) => update("whatsapp", event.target.value)} className={inputClass} inputMode="tel" />
            </Field>
            <Field label="Contact email">
              <input value={form.email} onChange={(event) => update("email", event.target.value)} type="email" className={inputClass} />
            </Field>
            <Field label="Website (optional)">
              <input value={form.website} onChange={(event) => update("website", event.target.value)} placeholder="https://" className={inputClass} />
            </Field>
            <Field label="Instagram handle">
              <div className="flex items-center rounded-xl border border-border bg-background px-3">
                <span className="text-xs text-muted-foreground">@</span>
                <input
                  value={form.instagram}
                  onChange={(event) => update("instagram", event.target.value.replace(/^@/, ""))}
                  className="h-10 w-full bg-transparent pl-1.5 text-sm text-foreground outline-none"
                />
              </div>
            </Field>
            <Field label="Facebook handle">
              <input value={form.facebook} onChange={(event) => update("facebook", event.target.value.replace(/^@/, ""))} className={inputClass} />
            </Field>
            <Field label="TikTok handle">
              <input value={form.tiktok} onChange={(event) => update("tiktok", event.target.value.replace(/^@/, ""))} className={inputClass} />
            </Field>
            <div className="hidden sm:block" />
            <Field label="Street address" className="sm:col-span-2">
              <input value={form.address} onChange={(event) => update("address", event.target.value)} className={inputClass} />
            </Field>
            <Field label="City">
              <input value={form.city} onChange={(event) => update("city", event.target.value)} className={inputClass} />
            </Field>
            <Field label="State / region">
              <input value={form.state} onChange={(event) => update("state", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Postal code">
              <input value={form.postalCode} onChange={(event) => update("postalCode", event.target.value)} className={inputClass} />
            </Field>
            <Field label="Country">
              <input value={form.country} onChange={(event) => update("country", event.target.value)} className={inputClass} />
            </Field>
          </div>
        </Panel>
      )}

      {tab === "booking" && (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <SectionHeading title="Opening hours" description="Used on your website and to generate available booking slots." />
            <div className="mt-4 space-y-1.5">
              {form.hours.map((hour, index) => (
                <div key={hour.day} className="grid grid-cols-[72px_1fr_1fr_auto] items-center gap-2 rounded-lg px-1 py-1">
                  <span className="text-[10px] font-medium text-foreground">{hour.day.slice(0, 3)}</span>
                  <input
                    type="time"
                    value={hour.open}
                    disabled={hour.closed}
                    onChange={(event) => updateHour(index, { open: event.target.value })}
                    className={cn(inputClass, "h-8 text-[10px] disabled:opacity-30")}
                  />
                  <input
                    type="time"
                    value={hour.close}
                    disabled={hour.closed}
                    onChange={(event) => updateHour(index, { close: event.target.value })}
                    className={cn(inputClass, "h-8 text-[10px] disabled:opacity-30")}
                  />
                  <label className="flex items-center gap-1.5 text-[8px] text-muted-foreground">
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
          </Panel>

          <div className="space-y-4">
            <Panel>
              <SectionHeading title="Online booking" description="Control how appointment requests reach you." />
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-border bg-background/50 p-3">
                  <div>
                    <p className="text-[11px] font-medium text-foreground">Accept online bookings</p>
                    <p className="text-[9px] text-muted-foreground">Show the booking form on your website.</p>
                  </div>
                  <Switch
                    checked={form.bookingSettings.enabled}
                    onCheckedChange={(checked) => update("bookingSettings", { ...form.bookingSettings, enabled: Boolean(checked) })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Slot interval">
                    <select
                      value={form.bookingSettings.slotIntervalMinutes}
                      onChange={(event) =>
                        update("bookingSettings", { ...form.bookingSettings, slotIntervalMinutes: Number(event.target.value) })
                      }
                      className={inputClass}
                    >
                      {[15, 30, 45, 60, 90, 120].map((value) => (
                        <option key={value} value={value}>{value} minutes</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Minimum notice" hint="Hours before an appointment.">
                    <input
                      type="number"
                      min={0}
                      max={168}
                      value={form.bookingSettings.minNoticeHours}
                      onChange={(event) =>
                        update("bookingSettings", { ...form.bookingSettings, minNoticeHours: Number(event.target.value) })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Bookable window" hint="How many days ahead clients can book.">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={form.bookingSettings.maxAdvanceDays}
                      onChange={(event) =>
                        update("bookingSettings", { ...form.bookingSettings, maxAdvanceDays: Number(event.target.value) })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <div className="flex items-end">
                    <label className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-3 py-2.5">
                      <span className="text-[10px] text-foreground">Require email</span>
                      <Switch
                        checked={form.bookingSettings.requireEmail}
                        onCheckedChange={(checked) =>
                          update("bookingSettings", { ...form.bookingSettings, requireEmail: Boolean(checked) })
                        }
                        size="sm"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </Panel>

            <Panel>
              <SectionHeading title="Money & time" description="Currency and timezone used across your website." />
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <Field label="Currency">
                  <select value={form.currency} onChange={(event) => update("currency", event.target.value)} className={inputClass}>
                    {CURRENCIES.map((currency) => (
                      <option key={currency} value={currency}>{currency}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Timezone">
                  <select value={form.timezone} onChange={(event) => update("timezone", event.target.value)} className={inputClass}>
                    {TIMEZONES.map((timezone) => (
                      <option key={timezone} value={timezone}>{timezone}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Panel>
          </div>
        </div>
      )}

      {tab === "sections" && (
        <Panel>
          <SectionHeading
            title="Page sections"
            description="Turn sections on or off and choose the order they appear on your public website. The hero is the first impression."
          />
          <div className="mt-4 space-y-2">
            {form.sections.map((section, index) => (
              <div key={section.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/40 px-3 py-2.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10 text-[9px] font-bold text-primary">
                    {index + 1}
                  </span>
                  <span className="text-[11px] font-medium capitalize text-foreground">{section.label}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => moveSection(index, -1)}
                    disabled={index === 0}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30"
                    aria-label={`Move ${section.label} up`}
                  >
                    <ArrowUp className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => moveSection(index, 1)}
                    disabled={index === form.sections.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground disabled:opacity-30"
                    aria-label={`Move ${section.label} down`}
                  >
                    <ArrowDown className="h-3 w-3" />
                  </button>
                  <Switch
                    checked={section.enabled}
                    onCheckedChange={(checked) => toggleSection(section.id, Boolean(checked))}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[9px] leading-relaxed text-muted-foreground/70">
            Sections without content (for example an empty gallery) are hidden automatically, even when switched on.
          </p>
        </Panel>
      )}

      {tab === "visibility" && (
        <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
          <Panel>
            <SectionHeading title="Your live address" description="Every salon gets a unique path on the platform." />
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/[0.04] p-4">
              <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-primary">Public URL</p>
              <div className="mt-2 flex items-center gap-2">
                <Globe2 className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-foreground">{pathUrl}</span>
                <CopyButton value={pathUrl} />
                <a
                  href={pathUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-primary"
                  aria-label="Open website"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              {salon.status !== "published" && (
                <p className="mt-2 text-[9px] leading-relaxed text-amber-400/80">
                  This address is reserved but not public until you publish your website.
                </p>
              )}
              {form.slug !== salon.slug && (
                <p className="mt-2 text-[9px] leading-relaxed text-amber-400/80">
                  You have changed your address to /{form.slug}. Save changes to reserve it — previous links will stop
                  working.
                </p>
              )}
            </div>
            {subdomainUrl && (
              <div className="mt-3 rounded-xl border border-border bg-background/50 p-4">
                <p className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Subdomain</p>
                <div className="mt-2 flex items-center gap-2">
                  <Link2 className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate font-mono text-[10px] text-foreground">{subdomainUrl}</span>
                  <CopyButton value={subdomainUrl} />
                </div>
              </div>
            )}

            <div className="mt-5 border-t border-border/60 pt-4">
              <p className="text-[10px] font-semibold text-foreground">Search preview</p>
              <div className="mt-2 rounded-xl border border-border bg-background p-3">
                <p className="truncate text-[11px] text-blue-400">{form.seoTitle || `${form.name}${form.city ? ` — Salon in ${form.city}` : ""}`}</p>
                <p className="mt-0.5 truncate font-mono text-[8px] text-emerald-500">{pathUrl}</p>
                <p className="mt-1 line-clamp-2 text-[9px] leading-relaxed text-muted-foreground">
                  {form.seoDescription || form.tagline || form.description || "Book an appointment at " + form.name + "."}
                </p>
              </div>
            </div>
          </Panel>

          <Panel>
            <SectionHeading title="Search engine details" description="Optional. We generate sensible defaults if you leave these blank." />
            <div className="mt-4 space-y-3">
              <Field label="Meta title" hint="Aim for under 60 characters.">
                <input value={form.seoTitle} onChange={(event) => update("seoTitle", event.target.value)} placeholder={form.name} className={inputClass} />
              </Field>
              <Field label="Meta description" hint="Aim for 140–160 characters.">
                <textarea value={form.seoDescription} onChange={(event) => update("seoDescription", event.target.value)} className={textareaClass} />
              </Field>
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-border bg-background/50 p-3 text-[9px] leading-relaxed text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              Your published website includes structured data for search engines automatically — your name, address,
              phone and star rating.
            </div>
          </Panel>

          <Panel className="xl:col-span-2">
            <SectionHeading
              title="Custom domain"
              description="Point your own domain at this salon website. We verify ownership with a DNS TXT record."
            />
            {salon.customDomain ? (
              <div className="mt-4 space-y-3">
                <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-background/50 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="flex items-center gap-2 font-mono text-[12px] text-foreground">
                      {salon.customDomain}
                      {salon.customDomainVerified ? (
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-emerald-400">Verified</span>
                      ) : (
                        <span className="rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-amber-400">Pending DNS</span>
                      )}
                    </p>
                    <p className="mt-1 text-[9px] text-muted-foreground">
                      {salon.customDomainVerified
                        ? "This domain now serves your published salon website."
                        : "Add the records below at your domain provider, then verify."}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!salon.customDomainVerified && (
                      <Button onClick={() => void verifyDomain()} disabled={verifying} className="h-9 rounded-lg bg-primary px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-black">
                        {verifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShieldCheck className="h-3 w-3" />} Verify
                      </Button>
                    )}
                    <Button onClick={() => void removeDomain()} disabled={domainBusy} variant="outline" className="h-9 rounded-lg border-border px-3 text-[9px] font-bold uppercase tracking-[0.12em] text-red-400">
                      <Unlink className="h-3 w-3" /> Remove
                    </Button>
                  </div>
                </div>
                {!salon.customDomainVerified && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">TXT record</p>
                      <p className="mt-1 break-all font-mono text-[9px] text-foreground">
                        _velvet.{salon.customDomain} → velvet-verify={salon.domainVerifyToken || "…"}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-background p-3">
                      <p className="text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground">CNAME target</p>
                      <p className="mt-1 break-all font-mono text-[9px] text-foreground">
                        {salon.customDomain} → {config?.baseDomain || "your-platform-domain.com"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  value={domainInput}
                  onChange={(event) => setDomainInput(event.target.value)}
                  placeholder="www.yoursalon.com"
                  className={cn(inputClass, "sm:max-w-sm")}
                />
                <Button onClick={() => void connectDomain()} disabled={domainBusy} className="h-10 shrink-0 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black">
                  {domainBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Globe2 className="h-3 w-3" />} Connect domain
                </Button>
              </div>
            )}
            <p className="mt-3 text-[9px] leading-relaxed text-muted-foreground/60">
              DNS changes can take up to 24 hours to propagate. Your path-based URL always continues to work.
            </p>
          </Panel>
        </div>
      )}
    </div>
  );
}
