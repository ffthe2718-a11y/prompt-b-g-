import { useEffect, useState } from "react";
import type { GiftCard, GiftCardConfig } from "@/types/salon";
import { formatPrice } from "@/types/salon";
import { publicApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Check,
  Copy,
  CreditCard,
  Gift,
  Heart,
  Loader2,
  Printer,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  salonSlug: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function GiftCardPurchaseModal({ salonSlug, isOpen, onClose }: Props) {
  const [salonData, setSalonData] = useState<{
    name: string;
    currency: string;
    logoUrl: string;
  } | null>(null);
  const [config, setConfig] = useState<GiftCardConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Purchase form state
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState(false);

  const [purchaserName, setPurchaserName] = useState("");
  const [purchaserEmail, setPurchaserEmail] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [personalMessage, setPersonalMessage] = useState("");

  // Result state
  const [issuedCard, setIssuedCard] = useState<GiftCard | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !salonSlug) return;
    setLoading(true);
    publicApi
      .getPublicGiftCards(salonSlug)
      .then((res) => {
        setSalonData(res.salon);
        setConfig(res.config);
        const denoms = res.config.denominations?.length ? res.config.denominations : [50, 100, 200];
        setSelectedAmount(denoms[0]);
      })
      .catch((err: any) => {
        toast.error("Gift card sales are currently not active for this salon.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isOpen, salonSlug]);

  if (!isOpen) return null;

  const currentAmount = isCustom
    ? parseFloat(customAmount) || 0
    : selectedAmount;

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAmount || currentAmount < 5) {
      toast.error("Please select or enter a valid gift card amount (min 5).");
      return;
    }
    if (!purchaserName.trim() || !purchaserEmail.trim()) {
      toast.error("Please enter your name and email.");
      return;
    }
    if (!recipientName.trim()) {
      toast.error("Please enter the recipient's name.");
      return;
    }

    setPurchasing(true);
    try {
      const res = await publicApi.purchaseGiftCard(salonSlug, {
        amount: currentAmount,
        purchaserName,
        purchaserEmail,
        recipientName,
        recipientEmail,
        personalMessage,
      });

      setIssuedCard(res.card);
      setShareUrl(res.shareUrl);
      toast.success("Gift card purchased successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to complete purchase.");
    } finally {
      setPurchasing(false);
    }
  };

  const copyVoucherLink = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast.success("Voucher link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const cardStyleClass =
    config?.cardStyle === "minimal_dark"
      ? "from-[#0d0d0d] via-[#171717] to-[#050505] border-white/20 text-white"
      : config?.cardStyle === "silk_blush"
      ? "from-[#2b1f24] via-[#3a2830] to-[#1e151a] border-rose-300/30 text-rose-100"
      : config?.cardStyle === "emerald_velvet"
      ? "from-[#0c1f17] via-[#142e23] to-[#08140f] border-emerald-400/30 text-emerald-100"
      : "from-[#1a1714] via-[#2a241e] to-[#12110E] border-amber-500/30 text-amber-100";

  const accentHex =
    config?.customAccentColor ||
    (config?.cardStyle === "minimal_dark"
      ? "#ffffff"
      : config?.cardStyle === "silk_blush"
      ? "#E8B4B8"
      : config?.cardStyle === "emerald_velvet"
      ? "#E2C373"
      : "#D4AF37");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4 backdrop-blur-md">
      <div className="relative my-8 w-full max-w-2xl rounded-3xl border border-white/10 bg-[#12110E] p-6 sm:p-8 shadow-2xl text-white">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full border border-white/10 bg-white/5 p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
          </div>
        ) : issuedCard ? (
          /* SUCCESS / VOUCHER VIEW */
          <div className="space-y-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Sparkles className="h-6 w-6" />
            </div>

            <div>
              <h2 className="font-serif text-2xl font-light tracking-wide">Digital Gift Voucher Ready!</h2>
              <p className="mt-1 text-xs text-white/60">
                Thank you {purchaserName}. A digital copy has been issued for {recipientName}.
              </p>
            </div>

            {/* Render Digital Voucher Card */}
            <div
              className={cn(
                "relative mx-auto aspect-[1.58/1] w-full max-w-md rounded-2xl p-6 shadow-2xl border flex flex-col justify-between bg-gradient-to-r text-left overflow-hidden",
                cardStyleClass
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-base font-semibold">{salonData?.name}</span>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-amber-300">
                  GIFT VOUCHER
                </span>
              </div>

              <div className="my-auto text-center space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-white/60">
                  For {recipientName}
                </p>
                <p className="font-serif text-3xl font-light" style={{ color: accentHex }}>
                  {formatPrice(issuedCard.amount, salonData?.currency)}
                </p>
              </div>

              <div className="flex items-end justify-between border-t border-white/10 pt-3 text-[10px]">
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-white/40">Voucher Code</p>
                  <p className="font-mono text-sm font-bold tracking-wider text-amber-300">
                    {issuedCard.code}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-white/60">From {purchaserName}</p>
                  <p className="text-[8px] text-white/40">
                    Expires {new Date(issuedCard.expiresAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {personalMessage && (
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 text-xs italic text-white/80">
                "{personalMessage}"
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center pt-2">
              <button
                onClick={copyVoucherLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied Voucher Link!" : "Copy Voucher Link"}
              </button>
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-xs font-medium text-white transition hover:bg-white/10"
              >
                <Printer className="h-4 w-4 text-white/70" />
                Print Voucher
              </button>
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl bg-white/10 px-5 py-2.5 text-xs font-medium text-white hover:bg-white/20"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <div className="space-y-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-amber-400">
                <Gift className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-widest">
                  {salonData?.name} Gift Experience
                </span>
              </div>
              <h2 className="font-serif text-2xl font-light">
                {config?.headline || "Give the Gift of Luxury"}
              </h2>
              <p className="text-xs text-white/60">
                {config?.message || "Select an amount to treat your loved one to a salon appointment."}
              </p>
            </div>

            <form onSubmit={handlePurchase} className="space-y-6">
              {/* Amount Picker */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-white/70">
                  Select Denomination ({salonData?.currency || "USD"})
                </label>

                <div className="flex flex-wrap gap-2.5">
                  {(config?.denominations || [50, 100, 200]).map((amt) => {
                    const isSelected = !isCustom && selectedAmount === amt;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setIsCustom(false);
                          setSelectedAmount(amt);
                        }}
                        className={cn(
                          "rounded-xl border px-4 py-2.5 text-xs font-semibold transition",
                          isSelected
                            ? "border-amber-400 bg-amber-500/20 text-amber-300"
                            : "border-white/10 bg-white/5 text-white/80 hover:border-white/20"
                        )}
                      >
                        {formatPrice(amt, salonData?.currency)}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={cn(
                      "rounded-xl border px-4 py-2.5 text-xs font-semibold transition",
                      isCustom
                        ? "border-amber-400 bg-amber-500/20 text-amber-300"
                        : "border-white/10 bg-white/5 text-white/80 hover:border-white/20"
                    )}
                  >
                    Custom Amount
                  </button>
                </div>

                {isCustom && (
                  <div className="pt-2">
                    <input
                      type="number"
                      placeholder={`Enter custom amount in ${salonData?.currency}`}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Recipient Info */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Recipient Details
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/60">Recipient Name *</label>
                    <input
                      type="text"
                      required
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Sarah Jenkins"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60">Recipient Email (Optional)</label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="e.g. sarah@example.com"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-white/60">Personal Note or Greeting</label>
                  <textarea
                    rows={2}
                    value={personalMessage}
                    onChange={(e) => setPersonalMessage(e.target.value)}
                    placeholder="e.g. Happy Birthday! Enjoy a relaxing spa day on me."
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Purchaser Info */}
              <div className="space-y-3 rounded-2xl border border-white/10 bg-black/30 p-4">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                  Your Information
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-white/60">Your Name *</label>
                    <input
                      type="text"
                      required
                      value={purchaserName}
                      onChange={(e) => setPurchaserName(e.target.value)}
                      placeholder="e.g. Alex Morgan"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-white/60">Your Email *</label>
                    <input
                      type="email"
                      required
                      value={purchaserEmail}
                      onChange={(e) => setPurchaserEmail(e.target.value)}
                      placeholder="e.g. alex@example.com"
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/50 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Summary CTA */}
              <div className="flex items-center justify-between border-t border-white/10 pt-4">
                <div>
                  <p className="text-[10px] text-white/50">Total Amount</p>
                  <p className="font-serif text-2xl font-light text-amber-300">
                    {formatPrice(currentAmount, salonData?.currency)}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={purchasing || !currentAmount}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[#D4AF37] px-6 py-3 text-xs font-bold uppercase tracking-wider text-black transition hover:bg-[#e2bd4b] disabled:opacity-50"
                >
                  {purchasing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CreditCard className="h-4 w-4" />
                  )}
                  Complete Gift Purchase
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
