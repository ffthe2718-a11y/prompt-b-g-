import { useCallback, useEffect, useState } from "react";
import type { GiftCard, GiftCardConfig, GiftCardStyle, Salon } from "@/types/salon";
import { formatPrice } from "@/types/salon";
import { salonApi } from "@/lib/api";
import { toast } from "sonner";
import {
  Check,
  Copy,
  CreditCard,
  Eye,
  Gift,
  Loader2,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import GiftCardPurchaseModal from "@/components/site/GiftCardPurchaseModal";

interface Props {
  salon: Salon;
  refresh?: () => void;
}

const STYLE_PRESETS: {
  id: GiftCardStyle;
  label: string;
  bgGradient: string;
  accentColor: string;
  cardBg: string;
  textColor: string;
  description: string;
}[] = [
  {
    id: "gold_foil",
    label: "Gold Foil",
    bgGradient: "from-[#1a1714] via-[#2a241e] to-[#12110E]",
    accentColor: "#D4AF37",
    cardBg: "#12110E",
    textColor: "#F5F2EB",
    description: "Deep obsidian backdrop with brushed champagne gold accents.",
  },
  {
    id: "minimal_dark",
    label: "Minimal Dark",
    bgGradient: "from-[#0d0d0d] via-[#171717] to-[#050505]",
    accentColor: "#E5E5E5",
    cardBg: "#0a0a0a",
    textColor: "#FFFFFF",
    description: "Sleek monochrome dark aesthetic with crisp typography.",
  },
  {
    id: "silk_blush",
    label: "Silk Blush",
    bgGradient: "from-[#2b1f24] via-[#3a2830] to-[#1e151a]",
    accentColor: "#E8B4B8",
    cardBg: "#1e151a",
    textColor: "#FAF0F2",
    description: "Rose velvet elegance with warm satin rose details.",
  },
  {
    id: "emerald_velvet",
    label: "Emerald Velvet",
    bgGradient: "from-[#0c1f17] via-[#142e23] to-[#08140f]",
    accentColor: "#E2C373",
    cardBg: "#08140f",
    textColor: "#EAF5EF",
    description: "Royal deep emerald with polished gold foil highlights.",
  },
];

export default function GiftCards({ salon, refresh }: Props) {
  const [config, setConfig] = useState<GiftCardConfig | null>(null);
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Form state
  const [enabled, setEnabled] = useState(true);
  const [headline, setHeadline] = useState("");
  const [message, setMessage] = useState("");
  const [cardStyle, setCardStyle] = useState<GiftCardStyle>("gold_foil");
  const [denominations, setDenominations] = useState<number[]>([50, 100, 150, 250, 500]);
  const [expiryMonths, setExpiryMonths] = useState(12);
  const [customBgColor, setCustomBgColor] = useState("#12110E");
  const [customAccentColor, setCustomAccentColor] = useState("#D4AF37");
  const [newDenom, setNewDenom] = useState("");

  // Modals state
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [showRedeemModal, setShowRedeemModal] = useState<GiftCard | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Issue modal form
  const [issueAmount, setIssueAmount] = useState<number>(100);
  const [issueRecipientName, setIssueRecipientName] = useState("");
  const [issueRecipientEmail, setIssueRecipientEmail] = useState("");
  const [issuePurchaserName, setIssuePurchaserName] = useState("");
  const [issuePurchaserEmail, setIssuePurchaserEmail] = useState("");
  const [issueNote, setIssueNote] = useState("");
  const [issuing, setIssuing] = useState(false);

  // Redeem modal form
  const [redeemAmount, setRedeemAmount] = useState<string>("");
  const [redeeming, setRedeeming] = useState(false);

  // Table search & filter
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "redeemed" | "expired">("all");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salonApi.getGiftCardConfig();
      setConfig(res.config);
      setCards(res.cards || []);
      setEnabled(res.config.enabled);
      setHeadline(res.config.headline || "Give the Gift of Luxury");
      setMessage(
        res.config.message ||
          "Treat someone special to an unforgettable experience at " + salon.name + "."
      );
      setCardStyle(res.config.cardStyle || "gold_foil");
      setDenominations(res.config.denominations?.length ? res.config.denominations : [50, 100, 150, 250, 500]);
      setExpiryMonths(res.config.expiryMonths || 12);
      setCustomBgColor(res.config.customBgColor || "#12110E");
      setCustomAccentColor(res.config.customAccentColor || "#D4AF37");
    } catch (err: any) {
      toast.error("Failed to load gift card configuration.");
    } finally {
      setLoading(false);
    }
  }, [salon.name]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const res = await salonApi.updateGiftCardConfig({
        enabled,
        headline,
        message,
        cardStyle,
        denominations: denominations.sort((a, b) => a - b),
        expiryMonths,
        customBgColor,
        customAccentColor,
      });
      setConfig(res.config);
      toast.success("Gift card configuration saved!");
      if (refresh) refresh();
    } catch (err: any) {
      toast.error(err?.message || "Failed to save configuration.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddDenomination = () => {
    const val = parseInt(newDenom.replace(/[^\d]/g, ""), 10);
    if (!val || val <= 0) {
      toast.error("Please enter a valid amount.");
      return;
    }
    if (denominations.includes(val)) {
      toast.error("This denomination already exists.");
      return;
    }
    setDenominations([...denominations, val].sort((a, b) => a - b));
    setNewDenom("");
  };

  const handleRemoveDenomination = (amount: number) => {
    if (denominations.length <= 1) {
      toast.error("You must keep at least one denomination.");
      return;
    }
    setDenominations(denominations.filter((d) => d !== amount));
  };

  const purchaseUrl = `${window.location.origin}/${salon.slug}?gift=buy`;

  const copyPurchaseLink = () => {
    navigator.clipboard.writeText(purchaseUrl);
    setCopied(true);
    toast.success("Purchase link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleIssueCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueRecipientName.trim()) {
      toast.error("Please enter the recipient's name.");
      return;
    }
    if (!issueAmount || issueAmount <= 0) {
      toast.error("Please enter a valid gift card amount.");
      return;
    }
    setIssuing(true);
    try {
      const res = await salonApi.issueGiftCard({
        amount: issueAmount,
        recipientName: issueRecipientName,
        recipientEmail: issueRecipientEmail,
        purchaserName: issuePurchaserName || salon.name,
        purchaserEmail: issuePurchaserEmail,
        personalMessage: issueNote,
      });
      setCards([res.card, ...cards]);
      toast.success(`Issued gift card ${res.card.code}!`);
      setShowIssueModal(false);
      // Reset form
      setIssueRecipientName("");
      setIssueRecipientEmail("");
      setIssuePurchaserName("");
      setIssuePurchaserEmail("");
      setIssueNote("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to issue gift card.");
    } finally {
      setIssuing(false);
    }
  };

  const handleRedeemBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showRedeemModal) return;
    const amount = parseFloat(redeemAmount);
    if (!amount || amount <= 0) {
      toast.error("Please enter a valid redemption amount.");
      return;
    }
    if (amount > showRedeemModal.balance) {
      toast.error(`Redemption amount exceeds remaining balance (${formatPrice(showRedeemModal.balance, salon.currency)}).`);
      return;
    }
    setRedeeming(true);
    try {
      const res = await salonApi.redeemGiftCard(showRedeemModal.id, amount);
      setCards(cards.map((c) => (c.id === res.card.id ? res.card : c)));
      toast.success(`Redeemed ${formatPrice(amount, salon.currency)} from ${res.card.code}!`);
      setShowRedeemModal(null);
      setRedeemAmount("");
    } catch (err: any) {
      toast.error(err?.message || "Failed to redeem balance.");
    } finally {
      setRedeeming(false);
    }
  };

  const activePreset = STYLE_PRESETS.find((p) => p.id === cardStyle) || STYLE_PRESETS[0];

  const filteredCards = cards.filter((card) => {
    const matchesSearch =
      card.code.toLowerCase().includes(search.toLowerCase()) ||
      card.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      card.purchaserName.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || card.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#D4AF37]" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col gap-4 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-[#171410] via-[#1a1712] to-[#12110E] p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-[#D4AF37]" />
            <h2 className="font-serif text-xl font-medium tracking-wide text-white">Digital Gift Cards</h2>
            <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[9px] font-semibold text-amber-300">
              {enabled ? "Active" : "Disabled"}
            </span>
          </div>
          <p className="text-xs text-white/60">
            Allow your clients to buy beautifully formatted luxury digital gift vouchers online or issue them directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowPreviewModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <Eye className="h-3.5 w-3.5 text-amber-400" />
            Client View
          </button>
          <button
            onClick={copyPurchaseLink}
            className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-2 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied Link!" : "Copy Share Link"}
          </button>
          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-white/10"
          >
            <QrCode className="h-3.5 w-3.5 text-amber-400" />
            QR Code
          </button>
          <button
            onClick={() => setShowIssueModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-black transition hover:bg-[#e2bd4b]"
          >
            <Plus className="h-3.5 w-3.5" />
            Issue Gift Card
          </button>
        </div>
      </div>

      {/* Main Grid: Config + Live Preview */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Settings */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-2xl border border-white/10 bg-[#12110E] p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="font-serif text-lg font-medium text-white">Online Sales Settings</h3>
                <p className="text-xs text-white/50">Configure headline, messages, and available amounts</p>
              </div>

              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="peer sr-only"
                />
                <div className="peer h-6 w-11 rounded-full bg-white/20 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none"></div>
              </label>
            </div>

            {/* Headline & Message */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70">Page Headline</label>
                <input
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. Give the Gift of Luxury"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70">Custom Message / Description</label>
                <textarea
                  rows={2}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Treat someone special to an unforgettable experience at our salon."
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                />
              </div>
            </div>

            {/* Denominations */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-white/70">
                Preset Denominations ({salon.currency || "INR"})
              </label>
              <div className="flex flex-wrap gap-2">
                {denominations.map((denom) => (
                  <span
                    key={denom}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300"
                  >
                    {formatPrice(denom, salon.currency)}
                    <button
                      onClick={() => handleRemoveDenomination(denom)}
                      className="text-amber-400/60 hover:text-amber-200"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="number"
                  placeholder="Custom amount"
                  value={newDenom}
                  onChange={(e) => setNewDenom(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddDenomination())}
                  className="w-36 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                />
                <button
                  onClick={handleAddDenomination}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10"
                >
                  Add Denomination
                </button>
              </div>
            </div>

            {/* Expiry Settings */}
            <div>
              <label className="block text-xs font-medium text-white/70">Gift Card Validity</label>
              <select
                value={expiryMonths}
                onChange={(e) => setExpiryMonths(Number(e.target.value))}
                className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
              >
                <option value={3}>3 Months from purchase</option>
                <option value={6}>6 Months from purchase</option>
                <option value={12}>12 Months (1 Year)</option>
                <option value={24}>24 Months (2 Years)</option>
                <option value={0}>Never Expires</option>
              </select>
            </div>

            {/* Visual Style Selector */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-medium text-white/70">Card Visual Theme</label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {STYLE_PRESETS.map((preset) => {
                  const isSelected = cardStyle === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setCardStyle(preset.id)}
                      className={cn(
                        "flex flex-col items-start rounded-xl border p-3 text-left transition",
                        isSelected
                          ? "border-amber-400 bg-amber-500/10"
                          : "border-white/10 bg-white/5 hover:border-white/20"
                      )}
                    >
                      <div
                        className={cn(
                          "h-8 w-full rounded-lg bg-gradient-to-r border mb-2",
                          preset.bgGradient
                        )}
                        style={{ borderColor: preset.accentColor + "40" }}
                      />
                      <span className="text-xs font-semibold text-white">{preset.label}</span>
                      <span className="text-[10px] text-white/40 line-clamp-1">{preset.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Colors override */}
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-[11px] font-medium text-white/60">Custom Card Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customBgColor}
                    onChange={(e) => setCustomBgColor(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-white/60">Accent / Foil Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="color"
                    value={customAccentColor}
                    onChange={(e) => setCustomAccentColor(e.target.value)}
                    className="h-8 w-10 cursor-pointer rounded border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customAccentColor}
                    onChange={(e) => setCustomAccentColor(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-mono text-white"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-[#e2bd4b] disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Save Gift Card Settings
            </button>
          </div>
        </div>

        {/* Right Column: Live Luxury Card Preview */}
        <div className="space-y-6 lg:col-span-5">
          <div className="sticky top-6 rounded-2xl border border-white/10 bg-[#12110E] p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
                Live Card Preview
              </span>
              <span className="text-[10px] text-white/40">Real-time styling</span>
            </div>

            {/* Card Graphic */}
            <div
              className={cn(
                "relative flex aspect-[1.58/1] w-full flex-col justify-between rounded-2xl p-6 shadow-2xl border overflow-hidden transition-all duration-300",
                activePreset.bgGradient
              )}
              style={{
                backgroundColor: customBgColor || undefined,
                borderColor: (customAccentColor || activePreset.accentColor) + "55",
              }}
            >
              {/* Subtle Foil Pattern Overlay */}
              <div
                className="pointer-events-none absolute inset-0 opacity-15"
                style={{
                  backgroundImage: `radial-gradient(${customAccentColor || activePreset.accentColor} 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }}
              />

              {/* Card Header */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    {salon.logoUrl ? (
                      <img
                        src={salon.logoUrl}
                        alt="Salon logo"
                        className="h-7 w-7 rounded-full object-cover border border-white/20"
                      />
                    ) : (
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold"
                        style={{
                          borderColor: customAccentColor || activePreset.accentColor,
                          color: customAccentColor || activePreset.accentColor,
                        }}
                      >
                        {salon.name.charAt(0)}
                      </div>
                    )}
                    <span className="font-serif text-sm font-semibold tracking-wide text-white">
                      {salon.name}
                    </span>
                  </div>
                  {salon.city && (
                    <p className="mt-0.5 text-[9px] uppercase tracking-widest text-white/50">
                      {salon.city}
                    </p>
                  )}
                </div>

                <span
                  className="rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-widest"
                  style={{
                    borderColor: (customAccentColor || activePreset.accentColor) + "88",
                    color: customAccentColor || activePreset.accentColor,
                    backgroundColor: (customAccentColor || activePreset.accentColor) + "15",
                  }}
                >
                  Gift Card
                </span>
              </div>

              {/* Card Center Amount & Headline */}
              <div className="relative z-10 my-auto text-center space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-white/60">
                  {headline || "Give the Gift of Luxury"}
                </p>
                <p
                  className="font-serif text-3xl font-light tracking-wider"
                  style={{ color: customAccentColor || activePreset.accentColor }}
                >
                  {formatPrice(denominations[0] || 100, salon.currency)}
                </p>
              </div>

              {/* Card Footer Code & Details */}
              <div className="relative z-10 flex items-end justify-between border-t border-white/10 pt-3 text-[10px] text-white/60">
                <div>
                  <p className="font-mono text-[11px] tracking-wider text-white">GIFT-8821-LUXE</p>
                  <p className="text-[8px] uppercase tracking-widest text-white/40">
                    Valid for {expiryMonths > 0 ? `${expiryMonths} Months` : "Lifetime"}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[9px] font-medium text-white/80">Recipient: Jane Doe</p>
                  <p className="text-[8px] text-white/40">Sample Digital Card</p>
                </div>
              </div>
            </div>

            {/* Direct Purchase Link Display */}
            <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                Shareable Customer Link
              </span>
              <div className="flex items-center justify-between gap-2">
                <p className="truncate font-mono text-xs text-amber-300">{purchaseUrl}</p>
                <button
                  onClick={copyPurchaseLink}
                  className="shrink-0 rounded-lg bg-white/10 p-1.5 text-white hover:bg-white/20"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Issued Gift Cards Management Section */}
      <div className="rounded-2xl border border-white/10 bg-[#12110E] p-6 space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="font-serif text-lg font-medium text-white">Issued Gift Cards & Balances</h3>
            <p className="text-xs text-white/50">Manage existing cards, view remaining balances, or redeem amounts</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-white/40" />
              <input
                type="text"
                placeholder="Search code or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-48 rounded-xl border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder-white/40 focus:border-amber-500/50 focus:outline-none"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="redeemed">Redeemed</option>
              <option value="expired">Expired</option>
            </select>

            <button
              onClick={() => void loadData()}
              className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/70 hover:bg-white/10 hover:text-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-wider text-white/40">
              <tr>
                <th className="pb-3 pl-2">Gift Code</th>
                <th className="pb-3">Recipient</th>
                <th className="pb-3">Purchaser</th>
                <th className="pb-3">Original Amount</th>
                <th className="pb-3">Remaining Balance</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Issued Date</th>
                <th className="pb-3 pr-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCards.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-white/40">
                    No gift cards found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredCards.map((card) => {
                  const isRedeemed = card.status === "redeemed" || card.balance === 0;
                  return (
                    <tr key={card.id} className="group hover:bg-white/[0.02]">
                      <td className="py-3 pl-2 font-mono font-semibold text-amber-300">{card.code}</td>
                      <td className="py-3 text-white">
                        <div>
                          <p className="font-medium">{card.recipientName}</p>
                          {card.recipientEmail && (
                            <p className="text-[10px] text-white/40">{card.recipientEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-white/80">
                        <div>
                          <p>{card.purchaserName || "Direct / Owner"}</p>
                          {card.purchaserEmail && (
                            <p className="text-[10px] text-white/40">{card.purchaserEmail}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 font-medium text-white">{formatPrice(card.amount, salon.currency)}</td>
                      <td className="py-3 font-semibold text-emerald-400">
                        {formatPrice(card.balance, salon.currency)}
                      </td>
                      <td className="py-3">
                        <span
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider",
                            card.status === "active" && card.balance > 0
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : card.status === "redeemed" || card.balance === 0
                              ? "bg-white/10 text-white/50 border border-white/20"
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                          )}
                        >
                          {card.balance === 0 ? "Fully Redeemed" : card.status}
                        </span>
                      </td>
                      <td className="py-3 text-white/50">
                        {new Date(card.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 pr-2 text-right">
                        {card.balance > 0 && card.status === "active" && (
                          <button
                            onClick={() => {
                              setShowRedeemModal(card);
                              setRedeemAmount(card.balance.toString());
                            }}
                            className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300 transition hover:bg-amber-500/20"
                          >
                            Redeem Balance
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Issue Gift Card Manually */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#12110E] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-lg font-medium text-white">Issue Gift Card</h3>
              <button onClick={() => setShowIssueModal(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIssueCard} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70">
                  Gift Card Amount ({salon.currency})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={issueAmount}
                  onChange={(e) => setIssueAmount(Number(e.target.value))}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/70">Recipient Name *</label>
                  <input
                    type="text"
                    required
                    value={issueRecipientName}
                    onChange={(e) => setIssueRecipientName(e.target.value)}
                    placeholder="Recipient's Name"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Recipient Email</label>
                  <input
                    type="email"
                    value={issueRecipientEmail}
                    onChange={(e) => setIssueRecipientEmail(e.target.value)}
                    placeholder="recipient@example.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-white/70">Purchaser Name</label>
                  <input
                    type="text"
                    value={issuePurchaserName}
                    onChange={(e) => setIssuePurchaserName(e.target.value)}
                    placeholder={`Defaults to ${salon.name}`}
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/70">Purchaser Email</label>
                  <input
                    type="email"
                    value={issuePurchaserEmail}
                    onChange={(e) => setIssuePurchaserEmail(e.target.value)}
                    placeholder="buyer@example.com"
                    className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/70">Personal Note / Message</label>
                <textarea
                  rows={2}
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  placeholder="Enjoy your special day!"
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={issuing}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-2 text-xs font-semibold text-black hover:bg-[#e2bd4b] disabled:opacity-50"
                >
                  {issuing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  Generate & Issue Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Redeem Balance */}
      {showRedeemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12110E] p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="font-serif text-lg font-medium text-white">Redeem Gift Card</h3>
                <p className="text-xs font-mono text-amber-300">{showRedeemModal.code}</p>
              </div>
              <button onClick={() => setShowRedeemModal(null)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/40 p-3 space-y-1 text-xs">
              <p className="text-white/60">
                Recipient: <span className="text-white font-medium">{showRedeemModal.recipientName}</span>
              </p>
              <p className="text-white/60">
                Current Balance:{" "}
                <span className="font-semibold text-emerald-400">
                  {formatPrice(showRedeemModal.balance, salon.currency)}
                </span>
              </p>
            </div>

            <form onSubmit={handleRedeemBalance} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/70">
                  Amount to Redeem ({salon.currency})
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  max={showRedeemModal.balance}
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRedeemModal(null)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-white hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={redeeming}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-semibold text-black hover:bg-emerald-400 disabled:opacity-50"
                >
                  {redeeming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Confirm Redemption
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#12110E] p-6 space-y-4 text-center shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-serif text-lg font-medium text-white">Gift Card QR Code</h3>
              <button onClick={() => setShowQrModal(false)} className="text-white/50 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-white/60">
              Display or print this QR code at your reception desk or on marketing materials.
            </p>

            <div className="mx-auto flex h-48 w-48 items-center justify-center rounded-2xl bg-white p-4 shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  purchaseUrl
                )}&color=12110e`}
                alt="Gift Card QR Code"
                className="h-full w-full object-contain"
              />
            </div>

            <p className="font-mono text-[10px] text-amber-300 break-all">{purchaseUrl}</p>

            <button
              onClick={copyPurchaseLink}
              className="w-full rounded-xl bg-[#D4AF37] py-2.5 text-xs font-semibold text-black hover:bg-[#e2bd4b]"
            >
              Copy Purchase Link
            </button>
          </div>
        </div>
      )}

      {/* MODAL 4: Public Customer Purchase Flow Preview */}
      {showPreviewModal && (
        <GiftCardPurchaseModal
          salonSlug={salon.slug}
          isOpen={showPreviewModal}
          onClose={() => setShowPreviewModal(false)}
        />
      )}
    </div>
  );
}
