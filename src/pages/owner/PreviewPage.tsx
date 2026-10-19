import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Salon } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2, Pencil, Rocket } from "lucide-react";
import { StatusBadge } from "@/components/dashboard/ui";
import SalonSite from "@/components/site/SalonSite";

export default function PreviewPage() {
  const navigate = useNavigate();
  const [salon, setSalon] = useState<Salon | null>(null);
  const [error, setError] = useState("");
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    let alive = true;
    salonApi
      .getMine()
      .then((result) => {
        if (alive) setSalon(result.salon);
      })
      .catch((err: any) => {
        if (!alive) return;
        if (err?.status === 404) navigate("/onboarding", { replace: true });
        else setError(err?.message || "Could not load your preview.");
      });
    return () => {
      alive = false;
    };
  }, [navigate]);

  const publish = async () => {
    setPublishing(true);
    try {
      const { salon: updated } = await salonApi.publish();
      setSalon(updated);
      toast.success("Your website is live.", { description: `Share it at /${updated.slug}` });
    } catch (err: any) {
      toast.error(err?.message || "Your site is not ready to publish yet.");
    } finally {
      setPublishing(false);
    }
  };

  if (!salon) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080807] px-4">
        {error ? (
          <div className="max-w-sm text-center">
            <p className="font-serif text-2xl text-white">Preview unavailable</p>
            <p className="mt-2 text-[11px] text-white/50">{error}</p>
            <Link to="/dashboard" className="mt-4 inline-block text-[9px] font-bold uppercase tracking-[0.16em] text-[#D4AF37]">
              Back to dashboard
            </Link>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-[#D4AF37]" />
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/50">Rendering your website</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#080807]">
      <div className="sticky top-0 z-[80] flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-black/80 px-3 py-2.5 backdrop-blur-xl sm:px-5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            to="/dashboard/website"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:border-[#D4AF37]/40 hover:text-[#D4AF37]"
          >
            <ArrowLeft className="h-3 w-3" /> Editor
          </Link>
          <div className="hidden items-center gap-2 sm:flex">
            <StatusBadge status={salon.status} />
            <span className="text-[8px] uppercase tracking-[0.14em] text-white/40">Draft preview</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-[200px] truncate font-mono text-[9px] text-white/40 md:block">/{salon.slug}</span>
          <Link
            to="/dashboard/website"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/15 px-2.5 text-[8px] font-bold uppercase tracking-[0.14em] text-white/70 transition-colors hover:text-white"
          >
            <Pencil className="h-3 w-3" /> Edit
          </Link>
          {salon.canPublish ? (
            <button
              onClick={() => void publish()}
              disabled={publishing}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#D4AF37] px-3 text-[8px] font-bold uppercase tracking-[0.14em] text-black disabled:opacity-50"
            >
              {publishing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Rocket className="h-3 w-3" />}
              {salon.status === "published" ? "Publish changes" : "Publish"}
            </button>
          ) : (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-[#D4AF37]/30 bg-[#D4AF37]/10 px-3 text-[8px] font-bold uppercase tracking-[0.14em] text-[#D4AF37]">
              {salon.approvalStatus === "pending" ? "In review" : "Not approved yet"}
            </span>
          )}
        </div>
      </div>

      <div className="pointer-events-none fixed bottom-3 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/10 bg-black/70 px-3 py-1.5 text-[8px] font-bold uppercase tracking-[0.16em] text-white/50 backdrop-blur">
        Preview · booking is disabled here
      </div>

      <SalonSite salon={salon} preview />
    </div>
  );
}
