import { useMemo, useState } from "react";
import type { Service, Salon } from "@/types/salon";
import { CURRENCY_SYMBOLS, formatDuration, formatPrice } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  Pencil,
  Plus,
  Scissors,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import {
  EmptyState,
  Field,
  Modal,
  Panel,
  SavingButton,
  SectionHeading,
  inputClass,
  textareaClass,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

type ServiceDraft = {
  name: string;
  category: string;
  price: string;
  durationMinutes: string;
  description: string;
  imageUrl: string;
  isActive: boolean;
};

const blankDraft: ServiceDraft = {
  name: "",
  category: "",
  price: "",
  durationMinutes: "45",
  description: "",
  imageUrl: "",
  isActive: true,
};

const suggested = ["Haircut & styling", "Hair colour", "Facial", "Manicure", "Massage"];

export default function Services({
  salon,
  refresh,
}: {
  salon: Salon;
  refresh: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<ServiceDraft>(blankDraft);
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);

  const services = useMemo(
    () => [...salon.services].sort((a, b) => a.sortOrder - b.sortOrder),
    [salon.services]
  );

  useEffect(() => {
    if (services.length === 0 && !saving) {
      (async () => {
        setSaving(true);
        try {
          const mockServices = [
            { name: "Haircut & styling", category: "Hair", price: 1500, durationMinutes: 45, description: "A precision cut and finish.", isActive: true },
            { name: "Hair colour", category: "Colour", price: 3000, durationMinutes: 120, description: "Full head colour treatment.", isActive: true },
            { name: "Facial", category: "Skin", price: 2000, durationMinutes: 60, description: "Refreshing facial treatment.", isActive: true },
          ];
          for (const service of mockServices) {
            await salonApi.createService(service);
          }
          await refresh();
        } catch (error: any) {
          console.error("Could not load demo services.", error);
        } finally {
          setSaving(false);
        }
      })();
    }
  }, [services.length, refresh]);

  const categories = useMemo(() => {
    const set = new Set(services.map((service) => service.category || "Uncategorised"));
    return ["all", ...Array.from(set)];
  }, [services]);

  const visible = services.filter((service) => {
    const category = service.category || "Uncategorised";
    const matchesFilter = filter === "all" || category === filter;
    const matchesQuery =
      !query.trim() ||
      service.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      service.description.toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesQuery;
  });

  const activeCount = services.filter((service) => service.isActive).length;
  const priceFrom = services.length ? Math.min(...services.map((service) => service.price)) : 0;

  const openCreate = () => {
    setEditing(null);
    setDraft(blankDraft);
    setOpen(true);
  };

  const openEdit = (service: Service) => {
    setEditing(service);
    setDraft({
      name: service.name,
      category: service.category,
      price: String(service.price),
      durationMinutes: String(service.durationMinutes || 45),
      description: service.description,
      imageUrl: service.imageUrl || "",
      isActive: service.isActive,
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!draft.name.trim()) {
      toast.error("Give your service a name.");
      return;
    }
    const price = Number(draft.price);
    if (!draft.price.trim() || Number.isNaN(price) || price < 0) {
      toast.error("Enter a valid price.");
      return;
    }
    const payload = {
      name: draft.name.trim(),
      category: draft.category.trim(),
      price,
      durationMinutes: Math.max(0, Number(draft.durationMinutes) || 0),
      description: draft.description.trim(),
      imageUrl: draft.imageUrl.trim(),
      isActive: draft.isActive,
    };
    setSaving(true);
    try {
      if (editing) {
        await salonApi.updateService(editing.id, payload);
        toast.success("Service updated.");
      } else {
        await salonApi.createService(payload);
        toast.success("Service added.");
      }
      await refresh();
      setOpen(false);
    } catch (error: any) {
      toast.error(error?.message || "Could not save the service.");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (service: Service, active: boolean) => {
    setPendingId(service.id);
    try {
      await salonApi.updateService(service.id, { isActive: active });
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not update the service.");
    } finally {
      setPendingId(null);
    }
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= services.length) return;
    const next = [...services];
    [next[index], next[target]] = [next[target], next[index]];
    setPendingId(services[index].id);
    try {
      await salonApi.reorderServices(next.map((service) => service.id));
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not reorder services.");
    } finally {
      setPendingId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await salonApi.deleteService(deleting.id);
      toast.success("Service removed.");
      setDeleting(null);
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not remove the service.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeading
          title="Services & prices"
          description="Everything clients can book. Prices use your salon currency and are shown exactly as you enter them."
          action={
            <button
              onClick={openCreate}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" /> Add service
            </button>
          }
        />

        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Total", value: String(services.length) },
            { label: "Bookable", value: String(activeCount) },
            { label: "Starting at", value: services.length ? formatPrice(priceFrom, salon.currency) : "—" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-background/40 px-3 py-2.5">
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
              <p className="mt-0.5 truncate font-serif text-lg text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilter(category)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] transition-colors",
                  filter === category
                    ? "border-primary/40 bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {category === "all" ? "All services" : category}
              </button>
            ))}
          </div>
          <div className="relative sm:w-56">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search services"
              className={cn(inputClass, "h-9 pl-8 text-[11px]")}
            />
          </div>
        </div>

        {services.length > 0 && (
          <div className="mt-4">
            {Object.entries(
              visible.reduce((acc, s) => {
                const c = s.category || "Uncategorised";
                if (!acc[c]) acc[c] = [];
                acc[c].push(s);
                return acc;
              }, {} as Record<string, Service[]>)
            ).map(([category, catServices]) => (
              <div key={category} className="mb-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">{category}</h3>
                <div className="space-y-2">
                  {catServices.map((service) => {
                    const index = services.findIndex((item) => item.id === service.id);
                    const busy = pendingId === service.id;
                    return (
                      <div
                        key={service.id}
                        className={cn(
                          "group rounded-xl border border-border bg-background/40 p-3.5 transition-colors hover:border-primary/30 hover:shadow-md",
                          !service.isActive && "opacity-60"
                        )}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-[12px] font-semibold text-foreground">{service.name}</p>
                              {service.category && (
                                <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-primary">
                                  {service.category}
                                </span>
                              )}
                              {!service.isActive && (
                                <span className="rounded-full border border-border px-2 py-0.5 text-[7px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                                  Hidden
                                </span>
                              )}
                            </div>
                            {service.description && (
                              <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-muted-foreground">
                                {service.description}
                              </p>
                            )}
                            <div className="mt-1.5 flex items-center gap-3 text-[9px] text-muted-foreground">
                              <span className="font-medium text-foreground">{formatPrice(service.price, salon.currency)}</span>
                              {service.durationMinutes > 0 && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock3 className="h-2.5 w-2.5" /> {formatDuration(service.durationMinutes)}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-start">
                            <div className="mr-1 flex items-center gap-1.5">
                              <span className="text-[8px] uppercase tracking-[0.12em] text-muted-foreground">Bookable</span>
                              <Switch
                                aria-label={`${service.name} bookable online`}
                                checked={service.isActive}
                                disabled={busy}
                                onCheckedChange={(checked) => void toggleActive(service, Boolean(checked))}
                                size="sm"
                              />
                            </div>
                            <button
                              onClick={() => void move(index, -1)}
                              disabled={index === 0 || busy}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary disabled:opacity-25"
                              aria-label={`Move ${service.name} up`}
                            >
                              <ArrowUp className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => void move(index, 1)}
                              disabled={index === services.length - 1 || busy}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-primary disabled:opacity-25"
                              aria-label={`Move ${service.name} down`}
                            >
                              <ArrowDown className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => openEdit(service)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
                              aria-label={`Edit ${service.name}`}
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => setDeleting(service)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400"
                              aria-label={`Delete ${service.name}`}
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {services.length === 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-4">
            <span className="text-[9px] text-muted-foreground">Ideas starting out:</span>
            {suggested.map((name) => (
              <button
                key={name}
                onClick={() => {
                  setEditing(null);
                  setDraft({ ...blankDraft, name, price: "" });
                  setOpen(true);
                }}
                className="rounded-full border border-border px-2.5 py-1 text-[8px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                + {name}
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? "Edit service" : "Add a service"}
        description="Keep names short and specific. Clients see this on your website and in the booking form."
        footer={
          <>
            <button
              onClick={() => setOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton saving={saving} onClick={() => void submit()}>
              {editing ? "Save changes" : "Add service"}
            </SavingButton>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Service name">
            <input
              value={draft.name}
              onChange={(event) => setDraft({ ...draft, name: event.target.value })}
              placeholder="Signature blow-dry"
              className={inputClass}
              autoFocus
            />
          </Field>
          <ImageField
            label="Service image"
            value={draft.imageUrl}
            onChange={(url) => setDraft({ ...draft, imageUrl: url })}
            aspect="aspect-square"
            rounded="xl"
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category" hint="Optional. Groups services on your site.">
              <input
                value={draft.category}
                onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                placeholder="Hair"
                list="service-categories"
                className={inputClass}
              />
              <datalist id="service-categories">
                {Array.from(new Set([...salon.services.map((service) => service.category).filter(Boolean), "Hair", "Colour", "Skin", "Nails", "Bridal", "Spa"])).map(
                  (category) => (
                    <option key={category} value={category} />
                  )
                )}
              </datalist>
            </Field>
            <Field label="Duration" hint="Used to space out booking slots.">
              <div className="relative">
                <input
                  value={draft.durationMinutes}
                  onChange={(event) => setDraft({ ...draft, durationMinutes: event.target.value.replace(/[^0-9]/g, "") })}
                  inputMode="numeric"
                  className={cn(inputClass, "pr-12")}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] uppercase text-muted-foreground">min</span>
              </div>
            </Field>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={`Price (${salon.currency})`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground">
                  {CURRENCY_SYMBOLS[salon.currency] || salon.currency}
                </span>
                <input
                  value={draft.price}
                  onChange={(event) => setDraft({ ...draft, price: event.target.value.replace(/[^0-9.]/g, "") })}
                  placeholder="1200"
                  inputMode="decimal"
                  className={cn(inputClass, "pl-9")}
                />
              </div>
            </Field>
            <div className="flex items-end">
              <label className="flex h-10 w-full items-center justify-between rounded-xl border border-border bg-background px-3">
                <span className="flex items-center gap-1.5 text-[10px] text-foreground">
                  <Sparkles className="h-3 w-3 text-primary" /> Bookable now
                </span>
                <Switch
                  checked={draft.isActive}
                  onCheckedChange={(checked) => setDraft({ ...draft, isActive: Boolean(checked) })}
                  size="sm"
                />
              </label>
            </div>
          </div>
          <Field label="Description" hint="One or two lines about what is included.">
            <textarea
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="A relaxing wash, precision cut and finish with our signature products."
              className={textareaClass}
            />
          </Field>
        </div>
      </Modal>

      <Modal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        title="Remove this service?"
        description="Existing bookings keep their record. The service will disappear from your website immediately."
        footer={
          <>
            <button
              onClick={() => setDeleting(null)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Keep service
            </button>
            <SavingButton saving={deleteBusy} onClick={() => void confirmDelete()} className="bg-red-500 text-white hover:bg-red-500/90">
              Remove service
            </SavingButton>
          </>
        }
      >
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          You are about to remove <span className="font-medium text-foreground">{deleting?.name}</span>. This cannot be
          undone.
        </p>
      </Modal>
    </div>
  );
}
