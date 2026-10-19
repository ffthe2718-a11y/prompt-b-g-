import { Link } from "react-router-dom";
import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-9 w-9 items-center justify-center rounded-full border border-primary/50 bg-primary/10">
        <Scissors className="h-4 w-4 rotate-45 text-primary" />
      </span>
      <span className="leading-none">
        <span className="block font-serif text-lg font-semibold tracking-[0.18em] text-foreground">VELVET</span>
        {!compact && (
          <span className="mt-1 block text-[8px] font-bold uppercase tracking-[0.34em] text-primary">
            Salon Studio
          </span>
        )}
      </span>
    </span>
  );
}

export function BrandLink({ className }: { className?: string }) {
  return (
    <Link to="/" className={cn("group inline-flex items-center", className)} aria-label="Velvet Salon Studio home">
      <BrandMark />
    </Link>
  );
}
