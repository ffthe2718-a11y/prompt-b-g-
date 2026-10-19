import { useMemo, useState } from "react";
import type { Booking, BookingStatus, Salon } from "@/types/salon";
import { formatPrice } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  CheckCheck,
  ChevronRight,
  Clock3,
  Download,
  Mail,
  BellRing,
  Trash2,
  Phone,
  Search,
  X,
} from "lucide-react";
import {
  BookingBadge,
  EmptyState,
  Modal,
  Panel,
  SectionHeading,
  inputClass,
  SavingButton,
} from "@/components/dashboard/ui";
import { cn } from "@/lib/utils";

const STATUS_TABS: { id: BookingStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "confirmed", label: "Confirmed" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

function formatDate(value: string) {
  if (!value) return "";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

function formatTime(value: string) {
  if (!value) return "";
  const [hour, minute] = value.split(":").map(Number);
  if (Number.isNaN(hour)) return value;
  const date = new Date();
  date.setHours(hour, minute || 0, 0, 0);
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

function relativeDay(value: string) {
  if (!value) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${value}T00:00:00`);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  if (diff > 1 && diff < 7) return `In ${diff} days`;
  return "";
}

export default function Bookings({
  salon,
  bookings,
  refresh,
}: {
  salon: Salon;
  bookings: Booking[];
  refresh: () => Promise<void>;
}) {
  const [status, setStatus] = useState<BookingStatus | "all">("all");
  const [query, setQuery] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [detail, setDetail] = useState<Booking | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...bookings].sort((a, b) => {
        const aKey = `${a.date} ${a.time}`;
        const bKey = `${b.date} ${b.time}`;
        return bKey.localeCompare(aKey);
      }),
    [bookings]
  );

  const filtered = sorted.filter((booking) => {
    if (status !== "all" && booking.status !== status) return false;
    if (from && booking.date < from) return false;
    if (to && booking.date > to) return false;
    if (query.trim()) {
      const needle = query.trim().toLowerCase();
      const haystack = `${booking.customerName} ${booking.customerEmail} ${booking.customerPhone} ${booking.serviceName} ${booking.staffName}`;
      if (!haystack.toLowerCase().includes(needle)) return false;
    }
    return true;
  });

  const counts = {
    all: bookings.length,
    pending: bookings.filter((booking) => booking.status === "pending").length,
    confirmed: bookings.filter((booking) => booking.status === "confirmed").length,
    completed: bookings.filter((booking) => booking.status === "completed").length,
    cancelled: bookings.filter((booking) => booking.status === "cancelled").length,
  };

  const upcoming = bookings.filter((booking) => booking.date >= new Date().toISOString().slice(0, 10) && ["pending", "confirmed"].includes(booking.status));
  const completedRevenue = bookings
    .filter((booking) => booking.status === "completed")
    .reduce((sum, booking) => sum + booking.price, 0);

  const changeStatus = async (booking: Booking, next: BookingStatus) => {
    setBusyId(booking.id);
    try {
      await salonApi.updateBooking(booking.id, { status: next });
      toast.success(next === "cancelled" ? "Booking cancelled." : `Booking marked ${next}.`);
      setDetail((current) => (current && current.id === booking.id ? { ...current, status: next } : current));
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not update this booking.");
    } finally {
      setBusyId(null);
    }
  };

  const sendReminder = async (booking: Booking) => {
    setBusyId(booking.id);
    try {
      const result = await salonApi.remindBooking(booking.id);
      if (result.delivered) toast.success(result.message);
      else toast.warning(result.message);
    } catch (error: any) {
      toast.error(error?.message || "Could not send the reminder.");
    } finally {
      setBusyId(null);
    }
  };

  const removeBooking = async (booking: Booking) => {
    if (!window.confirm(`Permanently delete ${booking.customerName}'s booking record? This cannot be undone.`)) return;
    setBusyId(booking.id);
    try {
      await salonApi.deleteBooking(booking.id);
      toast.success("Booking record deleted.");
      setDetail(null);
      await refresh();
    } catch (error: any) {
      toast.error(error?.message || "Could not delete this booking.");
    } finally {
      setBusyId(null);
    }
  };

  const exportCsv = () => {
    if (filtered.length === 0) {
      toast.error("There are no bookings to export with these filters.");
      return;
    }
    const rows = [
      ["Customer", "Email", "Phone", "Service", "Team member", "Date", "Time", "Status", "Price", "Notes"],
      ...filtered.map((booking) => [
        booking.customerName,
        booking.customerEmail,
        booking.customerPhone,
        booking.serviceName,
        booking.staffName,
        booking.date,
        booking.time,
        booking.status,
        booking.price.toFixed(2),
        booking.notes.replace(/\s+/g, " "),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${salon.slug}-bookings.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Bookings exported.");
  };

  return (
    <div className="space-y-4">
      <Panel>
        <SectionHeading
          title="Bookings"
          description="Every appointment request from your website lands here. Confirm, complete or cancel — clients are notified by email when you change a status."
          action={
            <button
              onClick={exportCsv}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3.5 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          }
        />
        <div className="mt-5 grid grid-cols-3 gap-2">
          {[
            { label: "Upcoming", value: String(upcoming.length) },
            { label: "Pending", value: String(counts.pending) },
            { label: "Completed value", value: formatPrice(completedRevenue, salon.currency) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-border bg-background/40 px-3 py-2.5">
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{stat.label}</p>
              <p className="mt-0.5 truncate font-serif text-lg text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel padded={false}>
        <div className="border-b border-border p-4">
          <div className="flex gap-1 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatus(tab.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.14em] transition-colors",
                  status === tab.id ? "bg-primary text-black" : "text-muted-foreground hover:bg-background hover:text-foreground"
                )}
              >
                {tab.label}
                <span className={cn("rounded-full px-1.5 text-[7px]", status === tab.id ? "bg-black/15" : "bg-background")}>
                  {counts[tab.id]}
                </span>
              </button>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search name, email, phone or service"
                className={cn(inputClass, "h-9 pl-8 text-[11px]")}
              />
            </div>
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={cn(inputClass, "h-9 w-full text-[10px] sm:w-36")} aria-label="From date" />
              <span className="text-[9px] text-muted-foreground">to</span>
              <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={cn(inputClass, "h-9 w-full text-[10px] sm:w-36")} aria-label="To date" />
              {(from || to || query) && (
                <button
                  onClick={() => {
                    setFrom("");
                    setTo("");
                    setQuery("");
                  }}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
                  aria-label="Clear filters"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<CalendarDays className="h-5 w-5" />}
              title={bookings.length === 0 ? "No bookings yet" : "Nothing matches these filters"}
              description={
                bookings.length === 0
                  ? "When a client books through your website, the request appears here instantly. Publish your site and share your link to get started."
                  : "Try a different status, date range or search term."
              }
            />
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {filtered.map((booking) => (
              <div key={booking.id} className="flex flex-col gap-3 px-4 py-3.5 transition-colors hover:bg-background/30 sm:flex-row sm:items-center">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl border border-border bg-background">
                    <span className="text-[7px] uppercase tracking-[0.1em] text-muted-foreground">
                      {booking.date ? new Date(`${booking.date}T00:00:00`).toLocaleDateString(undefined, { month: "short" }) : ""}
                    </span>
                    <span className="text-[13px] font-semibold leading-none text-foreground">
                      {booking.date ? new Date(`${booking.date}T00:00:00`).getDate() : ""}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-[12px] font-semibold text-foreground">{booking.customerName}</p>
                      <BookingBadge status={booking.status} />
                      {relativeDay(booking.date) && (
                        <span className="text-[8px] uppercase tracking-[0.1em] text-primary">{relativeDay(booking.date)}</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                      {booking.serviceName}
                      {booking.staffName ? ` · with ${booking.staffName}` : ""}
                    </p>
                    <p className="mt-0.5 text-[9px] text-muted-foreground/80">
                      {formatDate(booking.date)} at {formatTime(booking.time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 pl-13 sm:justify-end sm:pl-0">
                  <span className="text-[11px] font-medium text-foreground">{formatPrice(booking.price, salon.currency)}</span>
                  <div className="flex items-center gap-1.5">
                    {booking.status === "pending" && (
                      <button
                        onClick={() => void changeStatus(booking, "confirmed")}
                        disabled={busyId === booking.id}
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 text-[8px] font-bold uppercase tracking-[0.1em] text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        <Check className="h-3 w-3" /> Confirm
                      </button>
                    )}
                    {booking.status === "confirmed" && (
                      <button
                        onClick={() => void changeStatus(booking, "completed")}
                        disabled={busyId === booking.id}
                        className="inline-flex h-7 items-center gap-1 rounded-lg bg-primary/10 px-2.5 text-[8px] font-bold uppercase tracking-[0.1em] text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
                      >
                        <CheckCheck className="h-3 w-3" /> Complete
                      </button>
                    )}
                    <button
                      onClick={() => setDetail(booking)}
                      className="flex h-7 items-center gap-1 rounded-lg border border-border px-2.5 text-[8px] font-bold uppercase tracking-[0.1em] text-muted-foreground transition-colors hover:text-foreground"
                    >
                      View <ChevronRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? detail.customerName : "Booking"}
        description={detail ? `${formatDate(detail.date)} at ${formatTime(detail.time)}` : undefined}
        footer={
          detail && (
            <>
              <button
                onClick={() => setDetail(null)}
                className="inline-flex h-9 items-center justify-center rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground"
              >
                Close
              </button>
              {["pending", "confirmed"].includes(detail.status) && detail.customerEmail && (
                <button
                  onClick={() => void sendReminder(detail)}
                  disabled={busyId === detail.id}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-border px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-foreground disabled:opacity-50"
                >
                  <BellRing className="h-3 w-3" /> Send reminder
                </button>
              )}
              {detail.status === "cancelled" && (
                <button
                  onClick={() => void removeBooking(detail)}
                  disabled={busyId === detail.id}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-red-500/25 px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-red-400/80 disabled:opacity-50"
                >
                  <Trash2 className="h-3 w-3" /> Delete record
                </button>
              )}
              {detail.status !== "cancelled" && detail.status !== "completed" && (
                <button
                  onClick={() => void changeStatus(detail, "cancelled")}
                  disabled={busyId === detail.id}
                  className="inline-flex h-9 items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-red-400 disabled:opacity-50"
                >
                  Cancel booking
                </button>
              )}
              {detail.status === "pending" && (
                <SavingButton saving={busyId === detail.id} onClick={() => void changeStatus(detail, "confirmed")}>
                  Confirm booking
                </SavingButton>
              )}
              {detail.status === "confirmed" && (
                <SavingButton saving={busyId === detail.id} onClick={() => void changeStatus(detail, "completed")}>
                  Mark completed
                </SavingButton>
              )}
              {detail.status === "cancelled" && (
                <SavingButton saving={busyId === detail.id} onClick={() => void changeStatus(detail, "pending")}>
                  Restore request
                </SavingButton>
              )}
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <BookingBadge status={detail.status} />
              <span className="text-[11px] font-medium text-foreground">{formatPrice(detail.price, salon.currency)}</span>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Service</p>
                <p className="mt-1 text-[11px] text-foreground">{detail.serviceName}</p>
                {detail.staffName && <p className="text-[9px] text-muted-foreground">with {detail.staffName}</p>}
              </div>
              <div className="rounded-xl border border-border bg-background/50 p-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">When</p>
                <p className="mt-1 text-[11px] text-foreground">{formatDate(detail.date)}</p>
                <p className="text-[9px] text-muted-foreground">{formatTime(detail.time)}</p>
              </div>
            </div>

            <div className="space-y-2 rounded-xl border border-border bg-background/50 p-3">
              <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Contact</p>
              <a href={`mailto:${detail.customerEmail}`} className="flex items-center gap-2 text-[11px] text-foreground hover:text-primary">
                <Mail className="h-3.5 w-3.5 text-primary" /> {detail.customerEmail || "No email provided"}
              </a>
              <a href={`tel:${detail.customerPhone}`} className="flex items-center gap-2 text-[11px] text-foreground hover:text-primary">
                <Phone className="h-3.5 w-3.5 text-primary" /> {detail.customerPhone || "No phone provided"}
              </a>
            </div>

            {detail.notes && (
              <div className="rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
                <p className="text-[8px] font-bold uppercase tracking-[0.16em] text-primary">Client note</p>
                <p className="mt-1 whitespace-pre-wrap text-[10px] leading-relaxed text-foreground/90">{detail.notes}</p>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
              <Clock3 className="h-3 w-3" /> Requested {new Date(detail.createdAt).toLocaleString()}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
