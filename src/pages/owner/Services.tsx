import { useMemo, useState, useEffect } from "react";
import type { Service, Salon } from "@/types/salon";
import { CURRENCY_SYMBOLS, formatDuration, formatPrice } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  Clock3,
  DollarSign,
  Layers,
  ListChecks,
  Pencil,
  Percent,
  Plus,
  Scissors,
  Search,
  SlidersHorizontal,
  Sparkles,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import ImageField from "@/components/common/ImageField";
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

  // Bulk Edit mode states
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkDeleteModalOpen, setBulkDeleteModalOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  type BulkPriceAction = "none" | "set" | "increase_percent" | "decrease_percent" | "increase_flat" | "decrease_flat";
  type BulkStatusAction = "none" | "active" | "inactive";
  type BulkCategoryAction = "none" | "set";

  const [bulkPriceAction, setBulkPriceAction] = useState<BulkPriceAction>("none");
  const [bulkPriceValue, setBulkPriceValue] = useState<string>("");
  const [bulkStatusAction, setBulkStatusAction] = useState<BulkStatusAction>("none");
  const [bulkCategoryAction, setBulkCategoryAction] = useState<BulkCategoryAction>("none");
  const [bulkCategoryValue, setBulkCategoryValue] = useState<string>("");

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

  const selectedServices = useMemo(
    () => services.filter((s) => selectedIds.has(s.id)),
    [services, selectedIds]
  );

  const calculatePreviewPrice = (basePrice: number, action: BulkPriceAction, value: number) => {
    if (action === "none" || Number.isNaN(value) || value === 0) return basePrice;
    if (action === "set") return Math.max(0, value);
    if (action === "increase_percent") return Math.round(basePrice * (1 + Math.max(0, value) / 100) * 100) / 100;
    if (action === "decrease_percent") return Math.max(0, Math.round(basePrice * (1 - Math.max(0, value) / 100) * 100) / 100);
    if (action === "increase_flat") return Math.max(0, basePrice + value);
    if (action === "decrease_flat") return Math.max(0, basePrice - value);
    return basePrice;
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const allSelected = visible.length > 0 && visible.every((s) => selectedIds.has(s.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        visible.forEach((s) => next.delete(s.id));
      } else {
        visible.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const selectCategory = (categoryServices: Service[]) => {
    const allInCat = categoryServices.every((s) => selectedIds.has(s.id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allInCat) {
        categoryServices.forEach((s) => next.delete(s.id));
      } else {
        categoryServices.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const deselectAll = () => setSelectedIds(new Set());

  const handleQuickStatus = async (isActive: boolean) => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      await salonApi.bulkUpdateServices({
        ids: Array.from(selectedIds),
        isActive,
      });
      toast.success(`Set ${selectedIds.size} service${selectedIds.size > 1 ? "s" : ""} to ${isActive ? "Bookable" : "Hidden"}.`);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to update services status.");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (selectedIds.size === 0) {
      toast.error("No services selected.");
      return;
    }
    if (bulkPriceAction === "none" && bulkStatusAction === "none" && bulkCategoryAction === "none") {
      toast.error("Choose at least one update (pricing, status, or category).");
      return;
    }

    if (bulkPriceAction !== "none") {
      const val = Number(bulkPriceValue);
      if (!bulkPriceValue.trim() || Number.isNaN(val) || val < 0) {
        toast.error("Enter a valid price adjustment amount.");
        return;
      }
    }

    setBulkSaving(true);
    try {
      await salonApi.bulkUpdateServices({
        ids: Array.from(selectedIds),
        isActive: bulkStatusAction === "none" ? undefined : bulkStatusAction === "active",
        priceAction: bulkPriceAction === "none" ? undefined : bulkPriceAction,
        priceValue: bulkPriceAction === "none" ? undefined : Number(bulkPriceValue),
        category: bulkCategoryAction === "set" ? bulkCategoryValue.trim() : undefined,
      });
      toast.success(`Updated ${selectedIds.size} service${selectedIds.size > 1 ? "s" : ""} simultaneously.`);
      await refresh();
      setBulkModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Could not apply bulk updates.");
    } finally {
      setBulkSaving(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await salonApi.bulkDeleteServices(Array.from(selectedIds));
      toast.success(`Removed ${selectedIds.size} service${selectedIds.size > 1 ? "s" : ""}.`);
      setSelectedIds(new Set());
      setBulkDeleteModalOpen(false);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || "Could not delete selected services.");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeading
          title="Services & prices"
          description="Everything clients can book. Prices use your salon currency and are shown exactly as you enter them."
          action={
            <div className="flex items-center gap-2">
              {services.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const nextMode = !bulkMode;
                    setBulkMode(nextMode);
                    if (!nextMode) setSelectedIds(new Set());
                  }}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-lg border px-3 text-[9px] font-bold uppercase tracking-[0.14em] transition-all",
                    bulkMode
                      ? "border-primary bg-primary/20 text-primary shadow-sm ring-1 ring-primary/40"
                      : "border-border bg-background/50 text-foreground hover:border-primary/40 hover:text-primary"
                  )}
                  title="Toggle multi-service selection mode"
                >
                  <ListChecks className="h-3.5 w-3.5" />
                  {bulkMode ? "Exit bulk edit" : "Bulk edit"}
                  {bulkMode && selectedIds.size > 0 && (
                    <span className="ml-1 rounded-full bg-primary px-1.5 py-0.2 text-[8px] font-bold text-black">
                      {selectedIds.size}
                    </span>
                  )}
                </button>
              )}
              <button
                onClick={openCreate}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" /> Add service
              </button>
            </div>
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

        {/* Bulk Action Toolbar when bulkMode is active */}
        {bulkMode && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/[0.04] p-3 shadow-sm backdrop-blur-sm transition-all">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 text-[11px] font-medium text-foreground select-none">
                  <input
                    type="checkbox"
                    checked={visible.length > 0 && visible.every((s) => selectedIds.has(s.id))}
                    onChange={selectAllVisible}
                    className="h-4 w-4 rounded border-border bg-background text-primary accent-[#D4AF37] focus:ring-primary cursor-pointer"
                  />
                  <span>Select all visible ({visible.length})</span>
                </label>
                <span className="h-3.5 w-px bg-border hidden sm:block" />
                <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em] text-primary">
                  {selectedIds.size} of {services.length} selected
                </span>
                {selectedIds.size > 0 && (
                  <button
                    type="button"
                    onClick={deselectAll}
                    className="text-[9px] text-muted-foreground hover:text-foreground underline underline-offset-2"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={selectedIds.size === 0 || bulkSaving}
                  onClick={() => void handleQuickStatus(true)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 text-[8px] font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-emerald-500/40 hover:text-emerald-400 disabled:opacity-30 disabled:pointer-events-none"
                  title="Make all selected bookable online"
                >
                  <Sparkles className="h-3 w-3 text-emerald-400" />
                  Make Bookable
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0 || bulkSaving}
                  onClick={() => void handleQuickStatus(false)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background/80 px-2.5 text-[8px] font-bold uppercase tracking-[0.12em] text-foreground transition-colors hover:border-amber-500/40 hover:text-amber-400 disabled:opacity-30 disabled:pointer-events-none"
                  title="Hide all selected from online booking"
                >
                  <Clock3 className="h-3 w-3 text-amber-400" />
                  Hide
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0 || bulkSaving}
                  onClick={() => {
                    setBulkPriceAction("none");
                    setBulkPriceValue("");
                    setBulkStatusAction("none");
                    setBulkCategoryAction("none");
                    setBulkCategoryValue("");
                    setBulkModalOpen(true);
                  }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-[9px] font-bold uppercase tracking-[0.14em] text-black shadow-sm transition-transform hover:scale-[1.02] disabled:opacity-30 disabled:pointer-events-none"
                >
                  <SlidersHorizontal className="h-3 w-3" />
                  Update pricing & status
                </button>
                <button
                  type="button"
                  disabled={selectedIds.size === 0 || bulkSaving}
                  onClick={() => setBulkDeleteModalOpen(true)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background/80 text-muted-foreground transition-colors hover:border-red-500/40 hover:text-red-400 disabled:opacity-30 disabled:pointer-events-none"
                  title="Delete selected services"
                  aria-label="Delete selected services"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}

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
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    {category} <span className="font-normal text-muted-foreground/60">({catServices.length})</span>
                  </h3>
                  {bulkMode && (
                    <button
                      type="button"
                      onClick={() => selectCategory(catServices)}
                      className="text-[8px] font-bold uppercase tracking-[0.12em] text-primary/80 hover:text-primary transition-colors"
                    >
                      {catServices.every((s) => selectedIds.has(s.id)) ? "Deselect group" : "Select group"}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {catServices.map((service) => {
                    const index = services.findIndex((item) => item.id === service.id);
                    const busy = pendingId === service.id;
                    const isSelected = selectedIds.has(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={(e) => {
                          if (bulkMode) {
                            const target = e.target as HTMLElement;
                            if (target.closest("button") || target.closest("input") || target.closest("label")) return;
                            toggleSelect(service.id);
                          }
                        }}
                        className={cn(
                          "group rounded-xl border p-3.5 transition-all duration-150",
                          bulkMode ? "cursor-pointer select-none" : "",
                          isSelected
                            ? "border-primary bg-primary/[0.08] ring-1 ring-primary/40 shadow-sm"
                            : "border-border bg-background/40 hover:border-primary/30 hover:shadow-md",
                          !service.isActive && "opacity-60"
                        )}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                          {bulkMode && (
                            <div className="shrink-0 flex items-center pt-0.5 sm:pr-1">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelect(service.id)}
                                className="h-4 w-4 rounded border-border bg-background text-primary accent-[#D4AF37] focus:ring-primary cursor-pointer"
                                aria-label={`Select ${service.name}`}
                              />
                            </div>
                          )}

                          {service.imageUrl && (
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border bg-background">
                              <img src={service.imageUrl} alt={service.name} className="h-full w-full object-cover" />
                            </div>
                          )}

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
                            {!bulkMode && (
                              <>
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
                              </>
                            )}
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
            rounded="lg"
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

      {/* Bulk Edit Modal */}
      <Modal
        open={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        title={`Bulk edit ${selectedIds.size} service${selectedIds.size > 1 ? "s" : ""}`}
        description="Update pricing, booking status, or categories simultaneously across all selected services."
        wide
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkModalOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton saving={bulkSaving} onClick={() => void handleBulkSubmit()}>
              Apply changes ({selectedIds.size})
            </SavingButton>
          </>
        }
      >
        <div className="space-y-4">
          {/* Selected services summary */}
          <div className="rounded-xl border border-border bg-background/50 p-3">
            <div className="flex items-center justify-between text-[9px] uppercase tracking-[0.14em] text-muted-foreground font-bold mb-2">
              <span>Selected services ({selectedServices.length})</span>
              <span>Current prices</span>
            </div>
            <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1">
              {selectedServices.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-xs py-0.5">
                  <span className="truncate max-w-[240px] text-foreground font-medium">{s.name}</span>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[7px] uppercase font-bold tracking-[0.1em] px-1.5 py-0.2 rounded-full border",
                        s.isActive ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" : "border-border text-muted-foreground"
                      )}
                    >
                      {s.isActive ? "Bookable" : "Hidden"}
                    </span>
                    <span className="font-mono text-muted-foreground">{formatPrice(s.price, salon.currency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>Update Pricing</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <label
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs transition-colors",
                  bulkPriceAction === "none"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <input
                  type="radio"
                  name="bulkPriceAction"
                  checked={bulkPriceAction === "none"}
                  onChange={() => setBulkPriceAction("none")}
                  className="accent-[#D4AF37]"
                />
                <span>Don't change price</span>
              </label>

              <label
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs transition-colors",
                  bulkPriceAction === "set"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <input
                  type="radio"
                  name="bulkPriceAction"
                  checked={bulkPriceAction === "set"}
                  onChange={() => setBulkPriceAction("set")}
                  className="accent-[#D4AF37]"
                />
                <span>Set exact price</span>
              </label>

              <label
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs transition-colors",
                  bulkPriceAction === "increase_percent"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <input
                  type="radio"
                  name="bulkPriceAction"
                  checked={bulkPriceAction === "increase_percent"}
                  onChange={() => setBulkPriceAction("increase_percent")}
                  className="accent-[#D4AF37]"
                />
                <span>Increase by percentage (%)</span>
              </label>

              <label
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs transition-colors",
                  bulkPriceAction === "decrease_percent"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <input
                  type="radio"
                  name="bulkPriceAction"
                  checked={bulkPriceAction === "decrease_percent"}
                  onChange={() => setBulkPriceAction("decrease_percent")}
                  className="accent-[#D4AF37]"
                />
                <span>Discount / decrease by %</span>
              </label>

              <label
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs transition-colors",
                  bulkPriceAction === "increase_flat"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <input
                  type="radio"
                  name="bulkPriceAction"
                  checked={bulkPriceAction === "increase_flat"}
                  onChange={() => setBulkPriceAction("increase_flat")}
                  className="accent-[#D4AF37]"
                />
                <span>Increase by flat amount</span>
              </label>

              <label
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border p-2.5 cursor-pointer text-xs transition-colors",
                  bulkPriceAction === "decrease_flat"
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <input
                  type="radio"
                  name="bulkPriceAction"
                  checked={bulkPriceAction === "decrease_flat"}
                  onChange={() => setBulkPriceAction("decrease_flat")}
                  className="accent-[#D4AF37]"
                />
                <span>Decrease by flat amount</span>
              </label>
            </div>

            {bulkPriceAction !== "none" && (
              <div className="pt-2">
                <Field
                  label={
                    bulkPriceAction === "set"
                      ? `New fixed price (${CURRENCY_SYMBOLS[salon.currency] || salon.currency})`
                      : bulkPriceAction.includes("percent")
                      ? "Percentage value (%)"
                      : `Flat adjustment amount (${CURRENCY_SYMBOLS[salon.currency] || salon.currency})`
                  }
                >
                  <div className="relative">
                    <input
                      value={bulkPriceValue}
                      onChange={(e) => setBulkPriceValue(e.target.value.replace(/[^0-9.]/g, ""))}
                      placeholder={bulkPriceAction.includes("percent") ? "10" : "1500"}
                      className={cn(inputClass, "font-mono")}
                      autoFocus
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      {bulkPriceAction.includes("percent") ? "%" : CURRENCY_SYMBOLS[salon.currency] || salon.currency}
                    </span>
                  </div>
                </Field>
              </div>
            )}

            {bulkPriceAction !== "none" && bulkPriceValue.trim() !== "" && (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3 text-xs">
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-primary mb-2">Live Price Preview</p>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 font-mono text-[11px]">
                  {selectedServices.slice(0, 5).map((s) => {
                    const newP = calculatePreviewPrice(s.price, bulkPriceAction, Number(bulkPriceValue));
                    return (
                      <div key={s.id} className="flex items-center justify-between text-muted-foreground">
                        <span className="truncate max-w-[180px] font-sans text-foreground">{s.name}</span>
                        <span>
                          {formatPrice(s.price, salon.currency)} →{" "}
                          <span className="text-primary font-bold">{formatPrice(newP, salon.currency)}</span>
                        </span>
                      </div>
                    );
                  })}
                  {selectedServices.length > 5 && (
                    <p className="text-[10px] text-muted-foreground italic pt-1">
                      ...and {selectedServices.length - 5} more service{selectedServices.length - 5 > 1 ? "s" : ""}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Status Section */}
          <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Update Booking Status</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <button
                type="button"
                onClick={() => setBulkStatusAction("none")}
                className={cn(
                  "rounded-xl border p-2.5 text-xs text-center transition-colors font-medium",
                  bulkStatusAction === "none"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Don't change
              </button>
              <button
                type="button"
                onClick={() => setBulkStatusAction("active")}
                className={cn(
                  "rounded-xl border p-2.5 text-xs text-center transition-colors font-medium",
                  bulkStatusAction === "active"
                    ? "border-emerald-500 bg-emerald-500/15 text-emerald-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Make Bookable
              </button>
              <button
                type="button"
                onClick={() => setBulkStatusAction("inactive")}
                className={cn(
                  "rounded-xl border p-2.5 text-xs text-center transition-colors font-medium",
                  bulkStatusAction === "inactive"
                    ? "border-amber-500 bg-amber-500/15 text-amber-400"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                Set to Hidden
              </button>
            </div>
          </div>

          {/* Category Section */}
          <div className="space-y-3 rounded-xl border border-border bg-card/40 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Tag className="h-4 w-4 text-primary" />
                <span>Move to Category (Optional)</span>
              </div>
              {bulkCategoryAction === "set" && (
                <button
                  type="button"
                  onClick={() => {
                    setBulkCategoryAction("none");
                    setBulkCategoryValue("");
                  }}
                  className="text-[9px] text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              )}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 items-center">
              <select
                value={bulkCategoryAction === "none" ? "none" : bulkCategoryValue}
                onChange={(e) => {
                  if (e.target.value === "none") {
                    setBulkCategoryAction("none");
                    setBulkCategoryValue("");
                  } else {
                    setBulkCategoryAction("set");
                    setBulkCategoryValue(e.target.value);
                  }
                }}
                className={inputClass}
              >
                <option value="none">Don't change category</option>
                {Array.from(new Set([...salon.services.map((s) => s.category).filter(Boolean), "Hair", "Colour", "Skin", "Nails", "Bridal", "Spa"])).map((cat) => (
                  <option key={cat} value={cat}>
                    Move all to: {cat}
                  </option>
                ))}
              </select>
              {bulkCategoryAction === "set" && (
                <input
                  value={bulkCategoryValue}
                  onChange={(e) => setBulkCategoryValue(e.target.value)}
                  placeholder="Or enter new category..."
                  className={inputClass}
                />
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Bulk Delete Modal */}
      <Modal
        open={bulkDeleteModalOpen}
        onClose={() => setBulkDeleteModalOpen(false)}
        title={`Delete ${selectedIds.size} service${selectedIds.size > 1 ? "s" : ""}?`}
        description="These services will be permanently removed from your salon website and menu. Past booking records will be retained."
        footer={
          <>
            <button
              type="button"
              onClick={() => setBulkDeleteModalOpen(false)}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Cancel
            </button>
            <SavingButton
              saving={bulkDeleting}
              onClick={() => void handleBulkDelete()}
              className="bg-red-500 text-white hover:bg-red-500/90"
            >
              Delete {selectedIds.size} service{selectedIds.size > 1 ? "s" : ""}
            </SavingButton>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground leading-relaxed">
            You are about to delete <span className="font-semibold text-foreground">{selectedIds.size}</span> services:
          </p>
          <div className="max-h-36 overflow-y-auto space-y-1 rounded-xl border border-border bg-background p-2.5 text-xs">
            {selectedServices.map((s) => (
              <div key={s.id} className="flex justify-between text-muted-foreground py-0.5">
                <span className="text-foreground font-medium">{s.name}</span>
                <span className="font-mono">{formatPrice(s.price, salon.currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
