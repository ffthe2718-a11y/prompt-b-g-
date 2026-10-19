import { ReactNode, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CheckCircle2, Clock3, Copy, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { BookingStatus, SalonStatus } from "@/types/salon";

export function Panel({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card/50", padded && "p-5 sm:p-6", className)}>
      {children}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="mt-1 max-w-2xl text-[11px] leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label className="block text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-[9px] leading-relaxed text-muted-foreground/60">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary";

export const textareaClass =
  "min-h-24 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary";

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              "my-8 w-full overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
              wide ? "max-w-2xl" : "max-w-lg"
            )}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
              <div>
                <h3 className="font-serif text-xl text-foreground">{title}</h3>
                {description && <p className="mt-1 text-[10px] leading-relaxed text-muted-foreground">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
            {footer && <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StatusBadge({ status }: { status: SalonStatus }) {
  const styles: Record<SalonStatus, string> = {
    published: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
    draft: "border-amber-500/25 bg-amber-500/10 text-amber-400",
    suspended: "border-red-500/25 bg-red-500/10 text-red-400",
  };
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[8px] font-bold uppercase tracking-[0.16em]", styles[status])}>
      <span className={cn("h-1.5 w-1.5 rounded-full", status === "published" ? "bg-emerald-400" : status === "draft" ? "bg-amber-400" : "bg-red-400")} />
      {status === "published" ? "Live" : status}
    </span>
  );
}

const bookingStatusStyles: Record<BookingStatus, string> = {
  pending: "border-amber-500/25 bg-amber-500/10 text-amber-400",
  confirmed: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
  completed: "border-blue-500/25 bg-blue-500/10 text-blue-400",
  cancelled: "border-red-500/25 bg-red-500/10 text-red-400",
};

export function BookingBadge({ status }: { status: BookingStatus }) {
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.14em]", bookingStatusStyles[status])}>
      {status}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/30 px-5 py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-primary/25 bg-primary/5 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-serif text-xl text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-[11px] leading-relaxed text-muted-foreground">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SavingButton({
  saving,
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { saving?: boolean }) {
  return (
    <button
      {...props}
      disabled={props.disabled || saving}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[9px] font-bold uppercase tracking-[0.14em] text-black transition-opacity hover:opacity-90 disabled:opacity-50",
        className
      )}
    >
      {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      {children}
    </button>
  );
}

export async function copyText(value: string, label = "Link copied") {
  try {
    await navigator.clipboard.writeText(value);
    toast.success(label);
  } catch {
    toast.error("Could not copy. Please copy it manually.");
  }
}

export function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  return (
    <button
      onClick={() => void copyText(value)}
      className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
    >
      <Copy className="h-3 w-3" /> {label}
    </button>
  );
}

export function ChecklistRow({ done, label }: { done: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full border",
          done ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-border text-muted-foreground"
        )}
      >
        {done ? <CheckCircle2 className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
      </span>
      <span className={cn("text-[11px]", done ? "text-foreground" : "text-muted-foreground")}>{label}</span>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  accent = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card/50 p-4", accent && "border-primary/25 bg-primary/[0.04]")}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[8px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</span>
        <span className="text-primary">{icon}</span>
      </div>
      <p className="mt-2 font-serif text-2xl text-foreground">{value}</p>
      {hint && <p className="mt-0.5 text-[9px] text-muted-foreground">{hint}</p>}
    </div>
  );
}
