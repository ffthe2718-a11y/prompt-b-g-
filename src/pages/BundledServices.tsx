import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Sparkles, 
  Clock, 
  Check, 
  Tag, 
  Calendar, 
  ArrowRight, 
  ShieldCheck, 
  Gift, 
  Heart, 
  Scissors, 
  Crown, 
  Layers, 
  Percent, 
  ChevronRight, 
  SlidersHorizontal,
  Info,
  CheckCircle2,
  X,
  Phone,
  User,
  MapPin,
  MessageSquare,
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";
import { CURATED_BUNDLES, CATALOG_SERVICES_FOR_BUNDLING, calculateCustomBundleDiscount } from "@/data/bundles";
import { CuratedBundle, BundleServiceItem } from "@/types/bundle";
import { DEFAULT_STYLISTS, StylistMember } from "@/types/stylist";
import { SALON_WHATSAPP } from "@/constants";
import JoinWaitlistModal from "@/components/JoinWaitlistModal";

export default function BundledServices() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();

  // Active view tab: 'curated' | 'custom'
  const [activeTab, setActiveTab] = useState<'curated' | 'custom'>('curated');
  
  // Category filter for curated bundles
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal inspection state for package itinerary
  const [inspectingBundle, setInspectingBundle] = useState<CuratedBundle | null>(null);

  // Booking drawer / modal state
  const [bookingTarget, setBookingTarget] = useState<{
    isCustom: boolean;
    bundle?: CuratedBundle;
    customItems?: BundleServiceItem[];
    originalPrice: number;
    discountedPrice: number;
    savingsAmount: number;
    discountPercentage: number;
    title: string;
    durationText: string;
  } | null>(null);

  // Custom Bundle Builder state
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([
    "indian-bridal-makeup",
    "glow-revival-facial"
  ]);
  const [customCategoryFilter, setCustomCategoryFilter] = useState<string>('all');

  // Booking Form state inside modal
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    phone: "",
    email: user?.email || "",
    date: "",
    time: "10:00 AM",
    address: "",
    stylist: "Any Available Master Artist",
    specialRequests: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<any | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Sync user profile data into form if logged in
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.displayName || "",
        email: prev.email || user.email || ""
      }));
    }
  }, [user?.uid, user?.displayName, user?.email]);

  // Handle URL deep-linking e.g., ?bundle=bridal-glow-package
  React.useEffect(() => {
    const bundleParam = searchParams.get("bundle");
    if (bundleParam) {
      const found = CURATED_BUNDLES.find(b => b.id === bundleParam);
      if (found) {
        setInspectingBundle(found);
      }
    }
  }, [searchParams]);

  // Curated bundles filtered by category
  const filteredCuratedBundles = useMemo(() => {
    if (selectedCategory === 'all') return CURATED_BUNDLES;
    return CURATED_BUNDLES.filter(b => b.category === selectedCategory);
  }, [selectedCategory]);

  // The primary Bridal Glow Package
  const bridalGlowPackage = useMemo(() => {
    return CURATED_BUNDLES.find(b => b.id === "bridal-glow-package") || CURATED_BUNDLES[0];
  }, []);

  // Custom Bundle calculation
  const customSelectedItems = useMemo(() => {
    return CATALOG_SERVICES_FOR_BUNDLING.filter(s => selectedServiceIds.includes(s.id));
  }, [selectedServiceIds]);

  const customTotalOriginal = useMemo(() => {
    return customSelectedItems.reduce((acc, curr) => acc + curr.price, 0);
  }, [customSelectedItems]);

  const customDiscountPct = useMemo(() => {
    return calculateCustomBundleDiscount(selectedServiceIds.length);
  }, [selectedServiceIds.length]);

  const customSavings = useMemo(() => {
    return Math.round((customTotalOriginal * customDiscountPct) / 100);
  }, [customTotalOriginal, customDiscountPct]);

  const customFinalPrice = useMemo(() => {
    return customTotalOriginal - customSavings;
  }, [customTotalOriginal, customSavings]);

  const customTotalMinutes = useMemo(() => {
    return customSelectedItems.reduce((acc, curr) => acc + curr.durationMinutes, 0);
  }, [customSelectedItems]);

  const formatMinutes = (totalMins: number) => {
    const hrs = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    if (hrs === 0) return `${mins} mins`;
    if (mins === 0) return `${hrs} hrs`;
    return `${hrs} hrs ${mins} mins`;
  };

  const toggleCustomService = (serviceId: string) => {
    setSelectedServiceIds(prev => {
      if (prev.includes(serviceId)) {
        return prev.filter(id => id !== serviceId);
      } else {
        return [...prev, serviceId];
      }
    });
  };

  const handleOpenCuratedBooking = (bundle: CuratedBundle) => {
    setBookingTarget({
      isCustom: false,
      bundle,
      originalPrice: bundle.originalPrice,
      discountedPrice: bundle.bundledPrice,
      savingsAmount: bundle.savingsAmount,
      discountPercentage: bundle.discountPercentage,
      title: bundle.title,
      durationText: bundle.estimatedDuration
    });
  };

  const handleOpenCustomBooking = () => {
    if (selectedServiceIds.length < 2) {
      toast.error("Please select at least 2 services to unlock bundle discounts!");
      return;
    }
    setBookingTarget({
      isCustom: true,
      customItems: customSelectedItems,
      originalPrice: customTotalOriginal,
      discountedPrice: customFinalPrice,
      savingsAmount: customSavings,
      discountPercentage: customDiscountPct,
      title: `Custom ${selectedServiceIds.length}-Service Luxury Bundle`,
      durationText: formatMinutes(customTotalMinutes)
    });
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.info("Please sign in to confirm and record your appointment");
      setShowAuthModal(true);
      return;
    }

    if (!formData.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your mobile phone number");
      return;
    }
    if (!formData.date) {
      toast.error("Please choose your preferred appointment date");
      return;
    }
    if (!bookingTarget) return;

    setIsSubmitting(true);
    try {
      const selectedDate = new Date(formData.date);
      const bookingData = {
        name: formData.name,
        phone: formData.phone,
        userEmail: user.email || formData.email,
        userName: user.displayName || formData.name,
        userId: user.uid,
        service: bookingTarget.title,
        date: selectedDate.toISOString(),
        time: formData.time,
        address: formData.address || "Aurelia Luxe Mumbai Flagship Suite",
        stylist: formData.stylist,
        isBundle: true,
        bundleId: bookingTarget.bundle?.id || "custom-bundle",
        bundledServices: bookingTarget.isCustom
          ? bookingTarget.customItems?.map(i => i.name) || []
          : bookingTarget.bundle?.servicesIncluded || [],
        originalPrice: bookingTarget.originalPrice,
        discountPercentage: bookingTarget.discountPercentage,
        finalPrice: bookingTarget.discountedPrice,
        savingsAmount: bookingTarget.savingsAmount,
        durationText: bookingTarget.durationText,
        specialRequests: formData.specialRequests || "",
        status: "pending",
        shopId: "aurelia-luxe-main",
        createdAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, "customers"), bookingData);

      // Also create an admin notification in Firestore
      try {
        await addDoc(collection(db, "notifications"), {
          type: "bundle_booking",
          title: `New Package Booking: ${bookingTarget.title}`,
          message: `${formData.name} booked ${bookingTarget.title} for ${formData.date} at ${formData.time} (Total: ₹${bookingTarget.discountedPrice.toLocaleString('en-IN')})`,
          bookingId: docRef.id,
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Notification non-blocking warning:", err);
      }

      setConfirmedBooking({
        id: docRef.id,
        ...bookingData,
        dateFormatted: formData.date
      });
      toast.success("Package appointment confirmed successfully!");
    } catch (err: any) {
      console.error("Booking error:", err);
      toast.error(err.message || "Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
    "05:00 PM", "06:00 PM", "07:00 PM"
  ];

  const getMinDateString = () => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 pb-28">
      {/* Hero Header Section */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card/80 via-background to-background pt-20 pb-16 px-6">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <div className="mx-auto w-full max-w-[1800px] relative z-10 text-center px-4 sm:px-8 lg:px-12">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-semibold tracking-widest text-primary uppercase mb-6 shadow-sm">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Special Packages & Combo Offers</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light tracking-tight mb-6">
              SPECIAL <span className="italic font-serif text-primary">PACKAGES</span> & COMBOS
            </h1>

            <p className="max-w-2xl text-sm md:text-base text-muted-foreground leading-relaxed font-light mb-8">
              Combine haircuts, bridal makeup, facials, and Ayurvedic Champi head massage to get special combo discounts up to 26% off!
            </p>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl w-full mb-10">
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 text-center">
                <span className="block text-2xl font-serif text-primary font-bold">Up to 26%</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Bundle Savings</span>
              </div>
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 text-center">
                <span className="block text-2xl font-serif text-white font-bold">5.5 hrs</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Bridal Glow Duration</span>
              </div>
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 text-center">
                <span className="block text-2xl font-serif text-primary font-bold">VIP Suite</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Complimentary Access</span>
              </div>
              <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm p-4 text-center">
                <span className="block text-2xl font-serif text-white font-bold">Custom</span>
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground">Build-Your-Own Builder</span>
              </div>
            </div>

            {/* Tab Navigation: Curated Packages vs Custom Builder */}
            <div className="inline-flex p-1.5 rounded-full border border-border bg-zinc-900/90 backdrop-blur-md shadow-2xl">
              <button
                onClick={() => setActiveTab('curated')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'curated'
                    ? 'bg-primary text-black shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <Crown className="h-3.5 w-3.5" />
                <span>Curated Packages ({CURATED_BUNDLES.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  activeTab === 'custom'
                    ? 'bg-primary text-black shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Build Custom Bundle</span>
                <span className="bg-primary/20 text-primary px-1.5 py-0.5 rounded text-[10px] font-bold">
                  Save 20%
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto w-full max-w-[1800px] px-4 sm:px-8 lg:px-12 pt-12">
        {activeTab === 'curated' ? (
          <div>
            {/* FEATURED SPOTLIGHT: The Royal Bridal Glow Package */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative rounded-3xl border-2 border-primary/40 bg-gradient-to-br from-zinc-900 via-card to-zinc-950 p-6 md:p-10 shadow-2xl overflow-hidden mb-16"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Visual Image with Luxury Overlay */}
                <div className="lg:col-span-5 relative group overflow-hidden rounded-2xl border border-primary/30 aspect-[4/5] max-h-[460px]">
                  <img
                    src={bridalGlowPackage.image}
                    alt={bridalGlowPackage.title}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
                  
                  <div className="absolute top-4 left-4 bg-primary text-black text-[11px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                    {bridalGlowPackage.tag}
                  </div>
                  
                  <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md border border-primary/30 text-primary text-[11px] font-bold px-3 py-1 rounded-full">
                    {bridalGlowPackage.badge}
                  </div>

                  <div className="absolute bottom-5 left-5 right-5 text-white">
                    <span className="text-xs text-primary font-serif italic mb-1 block">Flagship Bridal Couturier</span>
                    <h3 className="text-2xl font-serif font-light text-white mb-2 leading-tight">
                      {bridalGlowPackage.title}
                    </h3>
                    <p className="text-xs text-zinc-300 font-light flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      {bridalGlowPackage.estimatedDuration}
                    </p>
                  </div>
                </div>

                {/* Package Details & Action */}
                <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                  <div>
                    <div className="flex items-center gap-2 text-primary text-xs font-semibold uppercase tracking-widest mb-2">
                      <Crown className="h-4 w-4" />
                      <span>The Complete Indian Wedding Radiance Suite</span>
                    </div>

                    <h2 className="text-3xl md:text-4xl font-serif text-white font-light tracking-tight mb-3">
                      {bridalGlowPackage.title}
                    </h2>

                    <p className="text-sm text-muted-foreground leading-relaxed mb-6 font-light">
                      {bridalGlowPackage.description}
                    </p>

                    {/* What's Bundled Inside */}
                    <div className="space-y-3 mb-6">
                      <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 block">
                        5 Synchronized Services Included:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {bridalGlowPackage.servicesIncluded.map((srv, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2.5 rounded-lg border border-border/70 bg-card/60 px-3 py-2 text-xs text-zinc-200"
                          >
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{srv}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Exclusive VIP Perks */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1.5 mb-2">
                        <Gift className="h-3.5 w-3.5" />
                        Complimentary Wedding Perks
                      </span>
                      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                        {bridalGlowPackage.perks.slice(0, 4).map((perk, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-primary font-bold">•</span>
                            <span>{perk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pricing and Actions */}
                  <div className="pt-4 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-xs text-muted-foreground line-through">
                          ₹{bridalGlowPackage.originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-3xl md:text-4xl font-serif font-bold text-primary">
                          ₹{bridalGlowPackage.bundledPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 text-xs font-bold uppercase">
                          Save ₹{bridalGlowPackage.savingsAmount.toLocaleString('en-IN')} (22% Off)
                        </span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">
                        Includes all taxes, bridal suite reservation, & stylist consultation.
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setInspectingBundle(bridalGlowPackage)}
                        className="rounded border-zinc-700 text-xs uppercase tracking-wider font-semibold hover:border-primary hover:text-primary h-12 px-5"
                      >
                        <Info className="h-4 w-4 mr-1.5" />
                        Itinerary & Steps
                      </Button>
                      <JoinWaitlistModal
                        shopName="Aurelia Flagship Atelier (Bandra West)"
                        shopId="shop-aurelia-flagship"
                        serviceName={bridalGlowPackage.title}
                        triggerText="Join Waitlist"
                        triggerVariant="outline"
                        triggerClassName="h-12 px-5 border-amber-500/40 text-amber-400 hover:bg-amber-400 hover:text-black text-xs font-bold uppercase tracking-wider"
                      />
                      <Button
                        onClick={() => handleOpenCuratedBooking(bridalGlowPackage)}
                        className="rounded bg-primary text-black font-bold text-xs uppercase tracking-widest hover:bg-primary/90 shadow-xl shadow-primary/20 h-12 px-7"
                      >
                        <Crown className="h-4 w-4 mr-2" />
                        Book Bridal Glow
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 mb-8 border-b border-border pb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">Filter Rituals:</span>
              {[
                { id: 'all', label: 'All Packages' },
                { id: 'bridal', label: 'Bridal & Weddings' },
                { id: 'glow', label: 'Radiance & Skin' },
                { id: 'groom', label: "Groom's Lounge" },
                { id: 'hair-revival', label: 'Hair & Scalp' },
                { id: 'duo', label: 'Duo & Celebrations' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-primary text-black font-bold'
                      : 'bg-card text-muted-foreground hover:text-white border border-border'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Grid of Other Curated Bundles */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredCuratedBundles.map((bundle, idx) => (
                <motion.div
                  key={bundle.id}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true, margin: "-30px" }}
                  transition={{ duration: 0.6, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6, scale: 1.015 }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl overflow-hidden flex flex-col justify-between group hover:border-primary/50 transition-all duration-500 hover:shadow-[0_20px_45px_rgba(212,175,55,0.08)]"
                >
                  <div>
                    {/* Image Header */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={bundle.image}
                        alt={bundle.title}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      
                      <div className="absolute top-3 left-3 bg-zinc-900/90 backdrop-blur-md border border-white/15 text-white text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded">
                        {bundle.categoryLabel}
                      </div>

                      <div className="absolute top-3 right-3 bg-primary text-black text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded shadow">
                        {bundle.badge}
                      </div>

                      <div className="absolute bottom-3 left-3 right-3">
                        <span className="text-white text-base font-serif font-light leading-snug line-clamp-1">
                          {bundle.title}
                        </span>
                        <div className="flex items-center gap-2 text-[11px] text-zinc-300 mt-1">
                          <Clock className="h-3 w-3 text-primary" />
                          <span>{bundle.estimatedDuration}</span>
                        </div>
                      </div>
                    </div>

                    {/* Body content */}
                    <div className="p-6">
                      <p className="text-xs text-muted-foreground font-light leading-relaxed mb-4 line-clamp-2">
                        {bundle.subtitle}
                      </p>

                      {/* Services Included */}
                      <div className="space-y-1.5 mb-5">
                        <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 block">
                          Included Treatments:
                        </span>
                        {bundle.servicesIncluded.map((srv, sIdx) => (
                          <div key={sIdx} className="flex items-center gap-2 text-xs text-zinc-300">
                            <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="truncate">{srv}</span>
                          </div>
                        ))}
                      </div>

                      {/* Highlighted Perk */}
                      {bundle.perks.length > 0 && (
                        <div className="rounded-lg bg-zinc-900/80 border border-zinc-800 p-2.5 mb-4 text-[11px] text-zinc-300 flex items-start gap-2">
                          <Gift className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{bundle.perks[0]}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer with Price & Actions */}
                  <div className="p-6 pt-0 border-t border-border mt-auto">
                    <div className="flex items-baseline justify-between pt-4 mb-4">
                      <div>
                        <span className="text-xs text-muted-foreground line-through block">
                          ₹{bundle.originalPrice.toLocaleString('en-IN')}
                        </span>
                        <span className="text-2xl font-serif font-bold text-primary">
                          ₹{bundle.bundledPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Save ₹{bundle.savingsAmount.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setInspectingBundle(bundle)}
                        className="rounded text-[11px] font-semibold uppercase tracking-wider border-border hover:border-primary hover:text-primary h-10"
                      >
                        Details
                      </Button>
                      <Button
                        onClick={() => handleOpenCuratedBooking(bundle)}
                        className="rounded bg-primary text-black text-[11px] font-bold uppercase tracking-wider hover:bg-primary/90 h-10 shadow-md shadow-primary/10"
                      >
                        Book Bundle
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          /* CUSTOM BUNDLE BUILDER */
          <div>
            {/* Builder Header & Tier Meter */}
            <div className="rounded-3xl border border-border bg-card p-6 md:p-8 mb-10">
              <div className="max-w-3xl mb-6">
                <span className="text-xs uppercase font-bold tracking-widest text-primary mb-2 block">
                  Create Your Bespoke Combination
                </span>
                <h2 className="text-3xl md:text-4xl font-serif font-light text-white mb-3">
                  CUSTOM MULTI-SERVICE BUNDLE BUILDER
                </h2>
                <p className="text-sm text-muted-foreground font-light leading-relaxed">
                  Select 2 or more services from our salon and bridal menu to automatically unlock 
                  graduated bundle savings. The more services you combine into a single appointment visit, 
                  the higher your discount.
                </p>
              </div>

              {/* Tier Progress Bar */}
              <div className="rounded-2xl border border-primary/20 bg-zinc-900/90 p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-white">
                      Current Discount Tier:
                    </span>
                    <span className="ml-2 text-lg font-serif font-bold text-primary">
                      {customDiscountPct > 0 ? `${customDiscountPct}% OFF` : '0% (Select 2+ Services)'}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {selectedServiceIds.length === 0 && "Select at least 2 services to unlock 10% discount"}
                    {selectedServiceIds.length === 1 && "Add 1 more service to unlock 10% OFF"}
                    {selectedServiceIds.length === 2 && "Add 1 more service to reach 15% OFF"}
                    {selectedServiceIds.length === 3 && "Add 1 more service to achieve max 20% OFF"}
                    {selectedServiceIds.length >= 4 && "Maximum 20% bundle discount achieved!"}
                  </div>
                </div>

                {/* Visual Progress Steps */}
                <div className="grid grid-cols-3 gap-2">
                  <div className={`p-3 rounded-lg border text-center transition-all ${
                    selectedServiceIds.length >= 2 
                      ? 'border-primary bg-primary/10 text-primary font-bold' 
                      : 'border-border bg-black/40 text-muted-foreground'
                  }`}>
                    <span className="block text-xs uppercase tracking-wider">Tier 1: 2 Services</span>
                    <span className="text-sm font-serif">10% OFF</span>
                  </div>
                  <div className={`p-3 rounded-lg border text-center transition-all ${
                    selectedServiceIds.length >= 3 
                      ? 'border-primary bg-primary/10 text-primary font-bold' 
                      : 'border-border bg-black/40 text-muted-foreground'
                  }`}>
                    <span className="block text-xs uppercase tracking-wider">Tier 2: 3 Services</span>
                    <span className="text-sm font-serif">15% OFF</span>
                  </div>
                  <div className={`p-3 rounded-lg border text-center transition-all ${
                    selectedServiceIds.length >= 4 
                      ? 'border-primary bg-primary/10 text-primary font-bold' 
                      : 'border-border bg-black/40 text-muted-foreground'
                  }`}>
                    <span className="block text-xs uppercase tracking-wider">Tier 3: 4+ Services</span>
                    <span className="text-sm font-serif">20% MAX OFF</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Layout: Service Catalog on Left (8 cols) + Sticky Summary on Right (4 cols) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Service Selector */}
              <div className="lg:col-span-8 space-y-6">
                {/* Category Selector for Services */}
                <div className="flex flex-wrap items-center gap-2 pb-2">
                  {[
                    { id: 'all', label: 'All Services' },
                    { id: 'bridal', label: 'Bridal & Mehndi' },
                    { id: 'skin', label: 'Facials & Skin' },
                    { id: 'hair', label: 'Hair & Color' },
                    { id: 'grooming', label: "Men's Grooming" },
                    { id: 'wellness', label: 'Wellness & Nails' }
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCustomCategoryFilter(cat.id)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-colors ${
                        customCategoryFilter === cat.id
                          ? 'bg-primary text-black font-bold'
                          : 'bg-card text-muted-foreground hover:text-white border border-border'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Service Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {CATALOG_SERVICES_FOR_BUNDLING
                    .filter(s => customCategoryFilter === 'all' || s.category === customCategoryFilter)
                    .map(service => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <div
                          key={service.id}
                          onClick={() => toggleCustomService(service.id)}
                          className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 select-none flex flex-col justify-between ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-lg shadow-primary/5 ring-1 ring-primary'
                              : 'border-border bg-card hover:border-zinc-700'
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <span className="text-sm font-semibold text-white group-hover:text-primary">
                                {service.name}
                              </span>
                              <div className={`h-5 w-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                isSelected ? 'bg-primary border-primary text-black' : 'border-zinc-700'
                              }`}>
                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                              </div>
                            </div>

                            <p className="text-xs text-muted-foreground font-light leading-relaxed mb-3">
                              {service.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
                            <span className="text-muted-foreground flex items-center gap-1">
                              <Clock className="h-3 w-3 text-primary" />
                              {service.durationMinutes} mins
                            </span>
                            <span className="font-serif font-bold text-primary">
                              ₹{service.price.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Right Column: Sticky Live Custom Bundle Summary */}
              <div className="lg:col-span-4 sticky top-28">
                <div className="rounded-2xl border-2 border-primary/30 bg-zinc-900 p-6 shadow-2xl">
                  <div className="flex items-center justify-between pb-4 border-b border-border mb-4">
                    <span className="text-xs uppercase font-bold tracking-widest text-primary flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Your Custom Package
                    </span>
                    <span className="text-xs font-bold bg-primary/20 text-primary px-2 py-0.5 rounded">
                      {selectedServiceIds.length} {selectedServiceIds.length === 1 ? 'Service' : 'Services'}
                    </span>
                  </div>

                  {/* Selected Services List */}
                  {customSelectedItems.length === 0 ? (
                    <div className="py-8 text-center text-muted-foreground text-xs font-light">
                      <Layers className="h-8 w-8 text-zinc-600 mx-auto mb-2 opacity-50" />
                      Click any service on the left to start building your package.
                    </div>
                  ) : (
                    <div className="space-y-2 mb-6 max-h-60 overflow-y-auto pr-1">
                      {customSelectedItems.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-black/40 border border-border text-xs"
                        >
                          <div className="truncate">
                            <span className="font-medium text-white block truncate">{item.name}</span>
                            <span className="text-[10px] text-muted-foreground">{item.durationMinutes} mins</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-serif text-primary">₹{item.price.toLocaleString('en-IN')}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleCustomService(item.id);
                              }}
                              className="text-zinc-500 hover:text-rose-400 p-1"
                              title="Remove service"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Summary Calculations */}
                  <div className="space-y-2 pt-4 border-t border-border text-xs mb-6">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total Estimated Duration:</span>
                      <span className="text-white font-medium">{formatMinutes(customTotalMinutes)}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>Standard Rate:</span>
                      <span className="text-zinc-400 line-through">₹{customTotalOriginal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-medium">
                      <span>Bundle Discount ({customDiscountPct}%):</span>
                      <span>- ₹{customSavings.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between items-baseline pt-2 border-t border-border text-sm">
                      <span className="font-bold text-white uppercase tracking-wider text-xs">Total Package Price:</span>
                      <span className="text-2xl font-serif font-bold text-primary">
                        ₹{customFinalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>

                  {/* Book Button */}
                  <Button
                    onClick={handleOpenCustomBooking}
                    disabled={selectedServiceIds.length < 2}
                    className="w-full rounded bg-primary text-black font-bold uppercase tracking-widest text-xs h-12 hover:bg-primary/90 shadow-xl shadow-primary/20 disabled:opacity-50"
                  >
                    {selectedServiceIds.length < 2 ? (
                      "Select 2+ Services to Book"
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Book Custom Bundle Now
                      </>
                    )}
                  </Button>

                  <p className="text-[10px] text-center text-muted-foreground mt-3 font-light">
                    No advance payment required. Reschedule anytime up to 24 hrs prior.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ITINERARY & DETAILS MODAL */}
      <Dialog open={!!inspectingBundle} onOpenChange={(open) => !open && setInspectingBundle(null)}>
        <DialogContent className="max-w-2xl bg-zinc-950 border border-primary/30 text-white p-6 max-h-[88vh] overflow-y-auto">
          {inspectingBundle && (
            <div>
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
                  <Crown className="h-4 w-4" />
                  <span>{inspectingBundle.categoryLabel} Ritual</span>
                </div>
                <DialogTitle className="text-2xl md:text-3xl font-serif font-light text-white">
                  {inspectingBundle.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {inspectingBundle.subtitle} • Duration: {inspectingBundle.estimatedDuration}
                </DialogDescription>
              </DialogHeader>

              {/* Ritual Phases & Steps */}
              <div className="space-y-4 mb-6">
                <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 block border-b border-border pb-1">
                  Chronological Ritual Timeline & Steps:
                </span>
                {inspectingBundle.steps.map((st, i) => (
                  <div key={i} className="rounded-xl border border-border bg-card/60 p-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">{st.phase}</span>
                      <span className="text-[11px] font-mono text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-border">
                        {st.duration}
                      </span>
                    </div>
                    <h4 className="text-sm font-medium text-white mb-1">{st.title}</h4>
                    <p className="text-xs text-muted-foreground font-light leading-relaxed">{st.detail}</p>
                  </div>
                ))}
              </div>

              {/* Included Perks */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-6">
                <span className="text-xs uppercase font-bold tracking-widest text-primary flex items-center gap-1.5 mb-2">
                  <Gift className="h-4 w-4" />
                  Complimentary Luxury Amenities
                </span>
                <ul className="space-y-1.5 text-xs text-zinc-300 font-light">
                  {inspectingBundle.perks.map((p, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Price & Action */}
              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div>
                  <span className="text-xs text-muted-foreground line-through block">
                    ₹{inspectingBundle.originalPrice.toLocaleString('en-IN')}
                  </span>
                  <span className="text-2xl font-serif font-bold text-primary">
                    ₹{inspectingBundle.bundledPrice.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setInspectingBundle(null)}
                    className="rounded text-xs uppercase"
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      const b = inspectingBundle;
                      setInspectingBundle(null);
                      handleOpenCuratedBooking(b);
                    }}
                    className="rounded bg-primary text-black font-bold text-xs uppercase tracking-wider hover:bg-primary/90 px-6"
                  >
                    Book This Package
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIRECT BOOKING MODAL */}
      <Dialog open={!!bookingTarget} onOpenChange={(open) => !open && setBookingTarget(null)}>
        <DialogContent className="max-w-xl bg-zinc-950 border border-primary/30 text-white p-6 max-h-[90vh] overflow-y-auto">
          {bookingTarget && !confirmedBooking && (
            <div>
              <DialogHeader className="mb-4">
                <div className="flex items-center gap-2 text-primary text-xs font-bold uppercase tracking-widest mb-1">
                  <Calendar className="h-4 w-4" />
                  <span>Reserve Bundled Appointment</span>
                </div>
                <DialogTitle className="text-xl md:text-2xl font-serif font-light text-white">
                  {bookingTarget.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Estimated Duration: {bookingTarget.durationText} • Total Savings: ₹{bookingTarget.savingsAmount.toLocaleString('en-IN')} ({bookingTarget.discountPercentage}% OFF)
                </DialogDescription>
              </DialogHeader>

              {/* Package Summary Box */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 mb-5 flex items-center justify-between">
                <div>
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground block">Bundled Package Total</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs line-through text-zinc-500">₹{bookingTarget.originalPrice.toLocaleString('en-IN')}</span>
                    <span className="text-2xl font-serif font-bold text-primary">₹{bookingTarget.discountedPrice.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <span className="bg-primary/20 text-primary border border-primary/30 text-xs font-bold px-3 py-1 rounded-full uppercase">
                  {bookingTarget.discountPercentage}% Discount
                </span>
              </div>

              <form onSubmit={handleBookingSubmit} className="space-y-4">
                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Full Name</Label>
                    <Input
                      required
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Radhika Sharma"
                      className="bg-card border-border text-white text-xs h-10"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Mobile Number</Label>
                    <Input
                      required
                      value={formData.phone}
                      onChange={e => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="bg-card border-border text-white text-xs h-10"
                    />
                  </div>
                </div>

                {/* Date & Time Slot */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Preferred Date</Label>
                    <Input
                      required
                      type="date"
                      min={getMinDateString()}
                      value={formData.date}
                      onChange={e => setFormData({ ...formData, date: e.target.value })}
                      className="bg-card border-border text-white text-xs h-10 [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">Starting Time Slot</Label>
                    <select
                      value={formData.time}
                      onChange={e => setFormData({ ...formData, time: e.target.value })}
                      className="w-full bg-card border border-border text-white rounded-md text-xs h-10 px-3 focus:outline-none focus:border-primary"
                    >
                      {timeSlots.map(t => (
                        <option key={t} value={t} className="bg-zinc-900 text-white">{t}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Preferred Stylist / Artist */}
                <div>
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">
                    Preferred Master Stylist / Specialist
                  </Label>
                  <select
                    value={formData.stylist}
                    onChange={e => setFormData({ ...formData, stylist: e.target.value })}
                    className="w-full bg-card border border-border text-white rounded-md text-xs h-10 px-3 focus:outline-none focus:border-primary"
                  >
                    <option value="Any Available Master Artist" className="bg-zinc-900">
                      ★ Any Available Master Artist (Fastest Availability)
                    </option>
                    {DEFAULT_STYLISTS.map(s => (
                      <option key={s.id} value={s.name} className="bg-zinc-900">
                        {s.name} — {s.role} ({s.experience})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Special Requests / Notes */}
                <div>
                  <Label className="text-xs text-zinc-400 uppercase tracking-wider mb-1 block">
                    Special Requests (Bridal Date, Allergies, or Hair Texture)
                  </Label>
                  <textarea
                    rows={2}
                    value={formData.specialRequests}
                    onChange={e => setFormData({ ...formData, specialRequests: e.target.value })}
                    placeholder="e.g. Wedding is on 15th Nov, need soft airbrush finish and dupatta pinning..."
                    className="w-full bg-card border border-border text-white rounded-md text-xs p-2.5 focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Submit & Auth note */}
                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full rounded bg-primary text-black font-bold uppercase tracking-widest text-xs h-12 hover:bg-primary/90 shadow-xl shadow-primary/20"
                  >
                    {isSubmitting ? (
                      "Confirming Reservation..."
                    ) : (
                      <>
                        <Check className="h-4 w-4 mr-2" />
                        Confirm Package Booking (₹{bookingTarget.discountedPrice.toLocaleString('en-IN')})
                      </>
                    )}
                  </Button>
                  {!user && (
                    <p className="text-[11px] text-center text-muted-foreground mt-2">
                      You will be asked to sign in or create an account to save this booking.
                    </p>
                  )}
                </div>
              </form>
            </div>
          )}

          {/* CONFIRMATION SCREEN */}
          {confirmedBooking && (
            <div className="py-4 text-center">
              <div className="h-16 w-16 bg-primary/20 border-2 border-primary rounded-full flex items-center justify-center mx-auto mb-4 text-primary">
                <Check className="h-8 w-8 stroke-[3]" />
              </div>

              <span className="text-xs uppercase font-bold tracking-widest text-primary mb-1 block">
                Reservation Confirmed
              </span>
              <h3 className="text-2xl font-serif font-light text-white mb-2">
                Your Luxury Ritual is Booked!
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                We have registered your appointment for {confirmedBooking.service}. A confirmation email and calendar invite have been queued.
              </p>

              {/* Receipt Card */}
              <div className="rounded-xl border border-border bg-card p-5 text-left text-xs space-y-2.5 mb-6">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking Ref:</span>
                  <span className="font-mono text-primary font-bold">{confirmedBooking.id?.slice(0, 10).toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium text-white text-right">{confirmedBooking.service}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-medium text-white">{confirmedBooking.dateFormatted} at {confirmedBooking.time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stylist / Artist:</span>
                  <span className="font-medium text-primary">{confirmedBooking.stylist}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-bold text-white uppercase">Bundled Total:</span>
                  <span className="font-serif font-bold text-primary text-base">₹{confirmedBooking.finalPrice.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
                <Button
                  onClick={() => {
                    const message = encodeURIComponent(`Namaste! I just booked the ${confirmedBooking.service} on ${confirmedBooking.dateFormatted} at ${confirmedBooking.time}. Reference: ${confirmedBooking.id?.slice(0, 8)}`);
                    window.open(`https://wa.me/${SALON_WHATSAPP}?text=${message}`, "_blank");
                  }}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs uppercase font-bold tracking-wider h-11 px-6 rounded"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Bridal Concierge
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setConfirmedBooking(null);
                    setBookingTarget(null);
                    navigate("/dashboard");
                  }}
                  className="w-full sm:w-auto text-xs uppercase font-semibold h-11 px-6 rounded"
                >
                  View in Dashboard
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Auth Modal helper if triggered */}
      {showAuthModal && (
        <AuthModal trigger={<span className="hidden" />} />
      )}
    </div>
  );
}
