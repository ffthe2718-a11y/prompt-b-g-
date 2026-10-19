import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import type { AdminApproval, Salon } from "@/types/salon";
import { adminApi } from "@/lib/api";
import { ApprovalBadge } from "@/components/dashboard/ApprovalPanel";
import SalonSite from "@/components/site/SalonSite";
import { ArrowLeft, ExternalLink, Loader2, ShieldCheck } from "lucide-react";

export default function AdminSalonPreview() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [approval, setApproval] = useState<AdminApproval | null>(null);
  const [owner, setOwner] = useState<{ name: string; email: string } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    adminApi
      .salonPreview(id)
      .then((result) => {
        if (!alive) return;
        setSalon(result.salon);
        setApproval(result.approval);
        setOwner(result.owner);
      })
      .catch((err: any) => {
        if (!alive) return;
        if (err?.status === 401 || err?.status === 403) navigate("/login", { replace: true });
        else setError(err?.message || "Could not load this preview.");
      });
    return () => {
      alive = false;
    };
  }, [id, navigate]);

  if (!salon) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080807] px-4">
        {error ? (
          <div className="max-w-sm text-center">
            <p className="font-serif text-2xl text-white">Preview unavailable</p>
            <p className="mt-2 text-[11px] text-white/50">{error}</p>
            <Link to="/admin" className="mt-4 inline-block text-[9px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
              Back to admin
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Loading submission</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080807]">
      <div className="sticky top-0 z-[80] flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/85 px-3 py-2.5 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/admin"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3 w-3" /> Approvals
          </Link>
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate text-[10px] font-semibold text-white">{salon.name}</span>
            {approval && <ApprovalBadge status={approval.approvalStatus} />}
            <span className="hidden text-[8px] uppercase tracking-[0.14em] text-white/40 sm:block">
              {owner?.name} · {owner?.email}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[220px] truncate font-mono text-[9px] text-white/40 md:block">/{salon.slug}</span>
          <a
            href={`/${salon.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white"
          >
            <ExternalLink className="h-3 w-3" /> Live site
          </a>
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-3 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/50 backdrop-blur">
        <ShieldCheck className="h-3 w-3" /> Admin preview · unpublished content
      </div>

      <SalonSite salon={salon} preview />
    </div>
  );
}
