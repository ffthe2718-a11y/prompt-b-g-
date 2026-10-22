import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Loader2, Phone, RefreshCw, Scissors, Sparkles, User } from "lucide-react";
import type { Availability, Salon } from "@/types/salon";
import { formatDuration, formatPrice } from "@/types/salon";
import type { SiteTheme } from "@/components/site/theme";
import { isApiError, publicApi } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function todayString() {
  return localDate(new Date());
}

function previewAvailability(salon: Salon, date: string, serviceId: string): Availability {
  const weekday = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "long" });
  const hours = salon.hours.find((item) => item.day === weekday);
  if (!hours || hours.closed) {
    return { date, closed: true, reason: `Closed on ${weekday}.`, slots: [] };
  }
  const [openH, openM] = hours.open.split(":").map(Number);
  const [closeH, closeM] = hours.close.split(":").map(Number);
  const start = openH * 60 + openM;
  const end = closeH * 60 + closeM;
  const interval = salon.bookingSettings.slotIntervalMinutes || 30;
  const service = salon.services.find((item) => item.id === serviceId);
  const duration = Math.max(5, Number(service?.durationMinutes) || interval);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
    return { date, closed: true, reason: "Opening hours are not set for this day.", slots: [] };
  }
  if (start + duration > end) {
    return {
      date,
      closed: true,
      reason: "This service needs more time than the salon is open on this day.",
      slots: [],
    };
  }
  const slots: { time: string; available: boolean }[] = [];
  // Mirror the live grid: a slot only exists if the whole appointment fits.
  for (let minute = start; minute + duration <= end; minute += interval) {
    const time = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
    slots.push({ time, available: true });
  }
  return { date, closed: false, reason: "", hours: { open: hours.open, close: hours.close }, slots };
}

export default function BookingSection({
  salon,
  theme,
  serviceId,
  onServiceChange,
  staffId,
  onStaffChange,
  preview = false,
}: {
  salon: Salon;
  theme: SiteTheme;
  serviceId: string;
  onServiceChange: (id: string) => void;
  staffId: string;
  onStaffChange: (id: string) => void;
  preview?: boolean;
}) {
  const [date, setDate] = useState(todayString());
  const [time, setTime] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  // Availability can fail independently of the form (offline, 5xx, rate limit).
  // Keep that separate from "the salon is closed" so the guest gets a retry
  // instead of a misleading message.
  const [slotsError, setSlotsError] = useState("");
  const [reloadToken, setReloadToken] = useState(0);
  const salonRef = useRef(salon);
  salonRef.current = salon;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{
    reference: string;
    date: string;
    time: string;
    serviceName: string;
    staffName: string;
    price: number;
  } | null>(null);

  const activeStaff = useMemo(() => salon?.staff?.filter((member) => member.isActive) ?? [], [salon?.staff]);
  const service = salon?.services?.find((item) => item.id === serviceId) ?? null;
  const bookingSettings = salon?.bookingSettings ?? {
    enabled: false,
    slotIntervalMinutes: 30,
    minNoticeHours: 24,
    maxAdvanceDays: 30,
    requireEmail: true,
  };

  const maxDate = useMemo(() => {
    const max = new Date();
    max.setDate(max.getDate() + (bookingSettings.maxAdvanceDays || 60));
    return localDate(max);
  }, [bookingSettings.maxAdvanceDays]);

  useEffect(() => {
    setTime("");
    if (!date) return;
    if (preview) {
      setSlotsError("");
      setAvailability(previewAvailability(salonRef.current, date, serviceId));
      setLoadingSlots(false);
      return;
    }
    let cancelled = false;
    setLoadingSlots(true);
    setAvailability(null);
    setSlotsError("");
    publicApi
      .availability(salon.slug, date, serviceId || undefined, staffId || undefined)
      .then((result) => {
        if (cancelled) return;
        setAvailability(result);
        // A slot can vanish between renders (another guest booked it). Drop a
        // selection that is no longer offered instead of submitting a stale one.
        setTime((current) =>
          current && result.slots.some((slot) => slot.time === current && slot.available) ? current : ""
        );
      })
      .catch((err) => {
        if (cancelled) return;
        setSlotsError(err?.message || "Could not load available times.");
      })
      .finally(() => {
        if (!cancelled) setLoadingSlots(false);
      });
    return () => {
      cancelled = true;
    };
  }, [date, serviceId, staffId, salon.slug, preview, reloadToken]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    if (!service) {
      setError("Choose a service to continue.");
      return;
    }
    if (!date || !time) {
      setError("Choose a date and time.");
      return;
    }
    if (name.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 6) {
      setError("Enter a valid phone number.");
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (preview) {
      toast.info("This is a preview. Publish your site to start accepting bookings.");
      return;
    }

    const selectedSlot = availability?.slots.find((slot) => slot.time === time);
    if (!selectedSlot || !selectedSlot.available) {
      setError("That time is no longer available. Pick another slot.");
      setTime("");
      setReloadToken((token) => token + 1);
      return;
    }

    setSubmitting(true);
    try {
      const result = await publicApi.createBooking(salon.slug, {
        serviceId: service.id,
        staffId: staffId || undefined,
        customerName: name.trim(),
        customerEmail: email.trim() || undefined,
        customerPhone: phone.trim(),
        date,
        time,
        notes: notes.trim() || undefined,
      });
      setSuccess({
        reference: result.booking.reference,
        date: result.booking.date,
        time: result.booking.time,
        serviceName: result.booking.serviceName,
        staffName: result.booking.staffName,
        price: result.booking.price,
      });
      toast.success(result.message);
    } catch (err: any) {
      setError(err?.message || "Could not send your booking request.");
      // The slot was taken while the form was open: refresh the grid so the
      // guest can immediately pick a valid time instead of guessing.
      if (isApiError(err) && (err.code === "slot_unavailable" || err.code === "invalid_staff" || err.code === "invalid_service")) {
        setTime("");
        setReloadToken((token) => token + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setSuccess(null);
    setTime("");
    setNotes("");
  };

  const inputClass =
    "h-11 w-full rounded-xl border border-[color:var(--site-border)] bg-[var(--site-surface)] px-3.5 text-sm text-[color:var(--site-ink)] outline-none transition-colors placeholder:text-[color:var(--site-muted)] focus:border-[color:var(--site-accent)]";

  if (!bookingSettings.enabled) {
    return (
      <section id="booking" className="border-t border-[color:var(--site-border)] bg-[var(--site-surface)] py-20">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-8">
          <CalendarDays className="mx-auto h-8 w-8" style={{ color: theme.accent }} />
          <h2 className="mt-5 font-serif text-4xl text-[color:var(--site-ink)]">Book your visit</h2>
          <p className="mt-3 text-sm leading-relaxed text-[color:var(--site-muted)]">
            Online booking is paused for now. Call or message the salon and we will find a time for you.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {salon.phone && (
              <a
                href={`tel:${salon.phone.replace(/[^\d+]/g, "")}`}
                className="inline-flex h-11 items-center gap-2 rounded-full px-6 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                <Phone className="h-3.5 w-3.5" /> Call the salon
              </a>
            )}
            {salon.email && (
              <a
                href={`mailto:${salon.email}`}
                className="inline-flex h-11 items-center gap-2 rounded-full border px-6 text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ borderColor: theme.border, color: theme.ink }}
              >
                Email us
              </a>
            )}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      id="booking"
      className="scroll-mt-20 border-t py-16 sm:py-24"
      style={{ borderColor: theme.border, backgroundColor: theme.surface }}
    >
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-8">
        <div className="mb-10 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.32em]" style={{ color: theme.accent }}>
              Online booking
            </span>
            <h2 className="mt-2 font-serif text-4xl leading-tight sm:text-5xl" style={{ color: theme.ink }}>
              Reserve your hour.
            </h2>
          </div>
          <p className="max-w-sm text-xs leading-relaxed" style={{ color: theme.muted }}>
            Choose a service, pick a time that suits you, and we will confirm your appointment personally.
          </p>
        </div>

        {success ? (
          <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
            <div className="p-7 text-center sm:p-10">
              <div
                className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border"
                style={{ borderColor: `${theme.accent}55`, backgroundColor: theme.accentSoft }}
              >
                <CheckCircle2 className="h-7 w-7" style={{ color: theme.accent }} />
              </div>
              <p className="mt-5 text-[9px] font-bold uppercase tracking-[0.3em]" style={{ color: theme.accent }}>
                Request sent
              </p>
              <h3 className="mt-2 font-serif text-3xl" style={{ color: theme.ink }}>
                Thank you, {name.split(" ")[0] || "friend"}.
              </h3>
              <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed" style={{ color: theme.muted }}>
                Your booking request is with {salon.name}. They will contact you at {phone} to confirm the time.
              </p>
              <div
                className="mx-auto mt-6 max-w-sm space-y-2 rounded-2xl border p-4 text-left text-xs"
                style={{ borderColor: theme.border, backgroundColor: theme.surface }}
              >
                <div className="flex justify-between gap-4">
                  <span style={{ color: theme.muted }}>Reference</span>
                  <span className="font-mono" style={{ color: theme.ink }}>{success.reference}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span style={{ color: theme.muted }}>Service</span>
                  <span style={{ color: theme.ink }}>{success.serviceName}</span>
                </div>
                {success.staffName && (
                  <div className="flex justify-between gap-4">
                    <span style={{ color: theme.muted }}>With</span>
                    <span style={{ color: theme.ink }}>{success.staffName}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span style={{ color: theme.muted }}>When</span>
                  <span style={{ color: theme.ink }}>{success.date} · {success.time}</span>
                </div>
                {success.price > 0 && (
                  <div className="flex justify-between gap-4 border-t pt-2" style={{ borderColor: theme.border }}>
                    <span style={{ color: theme.muted }}>Price</span>
                    <span style={{ color: theme.ink }}>{formatPrice(success.price, salon.currency)}</span>
                  </div>
                )}
              </div>
              <button
                onClick={reset}
                className="mt-6 h-10 rounded-full border px-5 text-[9px] font-bold uppercase tracking-[0.18em]"
                style={{ borderColor: theme.border, color: theme.ink }}
              >
                Book another visit
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="space-y-4">
              <div className="rounded-3xl border p-5" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.ink }}>
                  <Scissors className="h-3.5 w-3.5" style={{ color: theme.accent }} /> 1. Choose a service
                </h3>
                <div className="mt-3 max-h-[280px] space-y-2 overflow-y-auto pr-1">
                  {salon.services.length === 0 && (
                    <p className="text-xs" style={{ color: theme.muted }}>Services will appear here once added.</p>
                  )}
                  {salon.services.map((item) => {
                    const selected = item.id === serviceId;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onServiceChange(item.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left transition-all"
                        style={{
                          borderColor: selected ? theme.accent : theme.border,
                          backgroundColor: selected ? theme.accentSoft : "transparent",
                        }}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-medium" style={{ color: theme.ink }}>{item.name}</p>
                          <p className="mt-0.5 text-[9px]" style={{ color: theme.muted }}>
                            {formatDuration(item.durationMinutes) || "Timing on request"}
                            {item.category ? ` · ${item.category}` : ""}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-[11px]" style={{ color: theme.ink }}>
                            {item.price > 0 ? formatPrice(item.price, salon.currency) : "Enquire"}
                          </span>
                          <span
                            className="flex h-4 w-4 items-center justify-center rounded-full border"
                            style={{ borderColor: selected ? theme.accent : theme.border }}
                          >
                            {selected && <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.accent }} />}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {activeStaff.length > 0 && (
                  <div className="mt-5">
                    <label className="text-[9px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.muted }}>
                      Preferred team member
                    </label>
                    <select
                      value={staffId}
                      onChange={(event) => onStaffChange(event.target.value)}
                      className={cn(inputClass, "mt-1.5 appearance-none")}
                    >
                      <option value="">Any available</option>
                      {activeStaff.map((member) => (
                        <option key={member.id} value={member.id}>{member.name}{member.role ? ` — ${member.role}` : ""}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="rounded-3xl border p-5" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
                <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.ink }}>
                  <CalendarDays className="h-3.5 w-3.5" style={{ color: theme.accent }} /> 2. Pick a date & time
                </h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <input
                    type="date"
                    value={date}
                    min={todayString()}
                    max={maxDate}
                    onChange={(event) => setDate(event.target.value)}
                    className={inputClass}
                    style={{ colorScheme: theme.isLight ? "light" : "dark" }}
                  />
                  <div className="flex items-center gap-2 rounded-xl border px-3 py-2 text-[10px]" style={{ borderColor: theme.border, color: theme.muted }}>
                    <Clock className="h-3.5 w-3.5" style={{ color: theme.accent }} />
                    {availability?.hours ? `${availability.hours.open} – ${availability.hours.close}` : "Select a day"}
                  </div>
                </div>

                <div className="mt-4">
                  {loadingSlots ? (
                    <div className="flex items-center gap-2 py-4 text-[10px]" style={{ color: theme.muted }}>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking availability…
                    </div>
                  ) : slotsError ? (
                    <div
                      className="rounded-xl border px-3 py-3 text-[10px] leading-relaxed"
                      style={{ borderColor: "#ef444455", backgroundColor: "#ef444410", color: "#f87171" }}
                    >
                      <p className="font-medium">We could not load open times.</p>
                      <p className="mt-1 opacity-90">{slotsError}</p>
                      <button
                        type="button"
                        onClick={() => setReloadToken((token) => token + 1)}
                        className="mt-2.5 inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[9px] font-bold uppercase tracking-[0.16em]"
                        style={{ borderColor: "#ef444455", color: "#f87171" }}
                      >
                        <RefreshCw className="h-3 w-3" /> Try again
                      </button>
                    </div>
                  ) : availability?.closed ? (
                    <p className="rounded-xl border px-3 py-3 text-[10px] leading-relaxed" style={{ borderColor: theme.border, color: theme.muted }}>
                      {availability.reason}
                    </p>
                  ) : availability && availability.slots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4">
                      {availability.slots.map((slot) => {
                        const selected = time === slot.time;
                        return (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => setTime(slot.time)}
                            className="rounded-lg border py-2 text-[10px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-25"
                            style={{
                              borderColor: selected ? theme.accent : theme.border,
                              backgroundColor: selected ? theme.accent : "transparent",
                              color: selected ? theme.accentText : theme.ink,
                            }}
                          >
                            {slot.time}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[10px]" style={{ color: theme.muted }}>No open slots on this day. Try another date.</p>
                  )}
                </div>
                {preview && (
                  <p className="mt-3 flex items-center gap-1.5 text-[9px]" style={{ color: theme.muted }}>
                    <Sparkles className="h-3 w-3" style={{ color: theme.accent }} /> Preview mode — publish to accept live bookings.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-3xl border p-5" style={{ borderColor: theme.border, backgroundColor: theme.bg }}>
              <h3 className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: theme.ink }}>
                <User className="h-3.5 w-3.5" style={{ color: theme.accent }} /> 3. Your details
              </h3>
              <div className="mt-3 grid gap-2.5">
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  className={inputClass}
                />
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="Phone number"
                    autoComplete="tel"
                    inputMode="tel"
                    className={inputClass}
                  />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder={bookingSettings.requireEmail ? "Email address" : "Email (optional)"}
                    autoComplete="email"
                    type="email"
                    className={inputClass}
                  />
                </div>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Anything we should know? (optional)"
                  rows={3}
                  className={cn(inputClass, "h-auto py-3")}
                />
              </div>

              <div className="mt-4 rounded-2xl border p-3.5" style={{ borderColor: theme.border, backgroundColor: theme.surface }}>
                <p className="text-[9px] font-bold uppercase tracking-[0.16em]" style={{ color: theme.muted }}>Your appointment</p>
                <div className="mt-2 space-y-1.5 text-[10px]">
                  <div className="flex justify-between gap-3">
                    <span style={{ color: theme.muted }}>Service</span>
                    <span className="text-right" style={{ color: theme.ink }}>{service?.name || "Choose a service"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: theme.muted }}>Date</span>
                    <span style={{ color: theme.ink }}>{date || "—"}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span style={{ color: theme.muted }}>Time</span>
                    <span style={{ color: theme.ink }}>{time || "Choose a time"}</span>
                  </div>
                  {service && (
                    <div className="flex justify-between gap-3 border-t pt-1.5" style={{ borderColor: theme.border }}>
                      <span style={{ color: theme.muted }}>Total</span>
                      <span style={{ color: theme.ink }}>{service.price > 0 ? formatPrice(service.price, salon.currency) : "On request"}</span>
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <p className="mt-3 rounded-xl border px-3 py-2 text-[10px] leading-relaxed" style={{ borderColor: "#ef444455", backgroundColor: "#ef444410", color: "#f87171" }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting || (!!availability?.closed) || !time}
                aria-busy={submitting}
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-full text-[10px] font-bold uppercase tracking-[0.2em] transition-transform hover:scale-[1.01] disabled:opacity-40"
                style={{ backgroundColor: theme.accent, color: theme.accentText }}
              >
                {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CalendarDays className="h-3.5 w-3.5" />}
                {submitting ? "Sending request…" : preview ? "Preview booking form" : "Request appointment"}
              </button>
              <p className="mt-2 text-center text-[8px]" style={{ color: theme.muted }}>
                No payment required. The salon confirms personally.
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
