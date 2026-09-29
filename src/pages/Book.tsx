import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { 
  UserPlus, LogIn, Users, CreditCard, Droplets, Phone, MapPin, Info, 
  MessageCircle, Calendar as CalendarIcon, Clock, Repeat, Loader2, Check, 
  Store, Mail, Bell, BellRing, Scissors, Sparkles, Tag, Gift, Percent,
  Home, Car, Navigation, AlertTriangle, ShieldAlert, Wallet, QrCode, 
  Building, CheckCircle2, ChevronRight, Zap, ArrowRight, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { format, addWeeks, addMonths, isBefore, addDays, isSameDay, isToday } from "date-fns";
import { db, signInWithGoogle, handleFirestoreError, OperationType } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ROLES, SALON_SERVICES, SALON_WHATSAPP } from "@/constants";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_STYLISTS, StylistMember } from "@/types/stylist";
import { SEASONAL_PROMOTIONS } from "@/data/promotions";
import { Sun, Moon, Sunrise, CalendarCheck } from "lucide-react";
import JoinWaitlistModal from "@/components/JoinWaitlistModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Helper function for dynamic distance-based home service fees
export function calculateHomeServiceFee(distance: number): {
  fee: number;
  tierText: string;
  isExtended: boolean;
  extraKm: number;
  extraFee: number;
} {
  const dist = Math.max(0.1, Number(distance) || 1);
  if (dist <= 2) {
    return { fee: 99, tierText: "Minimum / Up to 2 km: ₹99", isExtended: false, extraKm: 0, extraFee: 0 };
  } else if (dist <= 5) {
    return { fee: 199, tierText: "2 km to 5 km: ₹199", isExtended: false, extraKm: 0, extraFee: 0 };
  } else if (dist <= 10) {
    return { fee: 349, tierText: "5 km to 10 km: ₹349", isExtended: false, extraKm: 0, extraFee: 0 };
  } else {
    const extraKm = Math.ceil(dist - 10);
    const extraFee = extraKm * 35;
    const fee = 349 + extraFee;
    return { 
      fee, 
      tierText: `Above 10 km: ₹349 + ₹${extraFee} (${extraKm} extra km @ ₹35/km)`, 
      isExtended: true, 
      extraKm,
      extraFee
    };
  }
}

export default function Book() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shopId = searchParams.get("shopId");
  const stylistParam = searchParams.get("stylist");
  const serviceParam = searchParams.get("service");
  const promoParam = searchParams.get("promo");
  const refParam = searchParams.get("ref");

  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicServices, setDynamicServices] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [selectedStylist, setSelectedStylist] = useState<string>(stylistParam || "");
  const [viewingService, setViewingService] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBooking, setLastBooking] = useState<any | null>(null);

  const [promoCodeInput, setPromoCodeInput] = useState<string>(promoParam || "");
  const [appliedPromotion, setAppliedPromotion] = useState<any | null>(null);
  const [showPromoInput, setShowPromoInput] = useState<boolean>(!!promoParam);

  const [referralCodeInput, setReferralCodeInput] = useState<string>(refParam || "");
  const [appliedReferral, setAppliedReferral] = useState<{ code: string; discount: number } | null>(
    refParam ? { code: refParam.toUpperCase(), discount: 500 } : null
  );
  const [showReferralInput, setShowReferralInput] = useState<boolean>(!!refParam);

  useEffect(() => {
    if (refParam) {
      setReferralCodeInput(refParam.toUpperCase());
      setAppliedReferral({ code: refParam.toUpperCase(), discount: 500 });
      setShowReferralInput(true);
      toast.success(`VIP Referral Applied: ₹500 welcome credit activated from code "${refParam.toUpperCase()}"!`);
    }
  }, [refParam]);

  useEffect(() => {
    if (stylistParam) {
      setSelectedStylist(stylistParam);
    }
  }, [stylistParam]);

  useEffect(() => {
    if (serviceParam) {
      setFormData(prev => ({ ...prev, service: serviceParam }));
    }
  }, [serviceParam]);

  useEffect(() => {
    const code = promoParam || promoCodeInput;
    if (code) {
      const match = SEASONAL_PROMOTIONS.find(
        p => p.promoCode.toLowerCase() === code.trim().toLowerCase()
      );
      if (match) {
        setAppliedPromotion(match);
        if (!formData.service || (serviceParam && formData.service === serviceParam)) {
          setFormData(prev => ({ ...prev, service: match.title }));
        }
      }
    }
  }, [promoParam]);

  useEffect(() => {
    if (shopId) {
      const getShop = async () => {
        try {
          const shopRef = doc(db, "shops", shopId);
          const snap = await getDoc(shopRef);
          if (snap.exists()) {
            setSelectedShop({ id: snap.id, ...snap.data() });
          }
        } catch (error) {
          console.error("Error fetching shop info:", error);
        }
      };
      getShop();
    }

    const servicesRef = collection(db, "services");
    const q = shopId 
      ? query(servicesRef, where("shopId", "==", shopId), orderBy("createdAt", "asc"))
      : query(servicesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDynamicServices(docs);
    }, (error) => {
      console.warn("Dynamic services list note, using curated catalog:", error);
    });

    return () => unsubscribe();
  }, []);

  // Format seasonal promotions as selectable services
  const promotionalServices = React.useMemo(() => {
    return SEASONAL_PROMOTIONS.map(p => ({
      name: p.title,
      price: p.discountedPrice,
      originalPrice: p.originalPrice,
      duration: p.durationText,
      description: `${p.subtitle} (Bonus: ${p.exclusivePerk})`,
      category: "Seasonal Offer",
      isPromotional: true,
      promoCode: p.promoCode,
      discountPercentage: p.discountPercentage
    }));
  }, []);

  const allServices = [...promotionalServices, ...SALON_SERVICES, ...dynamicServices];

  const availableStylists: StylistMember[] = 
    selectedShop?.content?.stylists && selectedShop.content.stylists.length > 0
      ? selectedShop.content.stylists
      : DEFAULT_STYLISTS;

  const matchedStylist = availableStylists.find(s => 
    selectedStylist && s.name.toLowerCase() === selectedStylist.toLowerCase()
  );

  const [serviceType, setServiceType] = useState<'salon' | 'home'>('salon');
  const [homeAddress, setHomeAddress] = useState({
    street: "",
    landmark: "",
    city: "Mumbai",
    pincode: ""
  });
  const [distanceKm, setDistanceKm] = useState<number>(3.5);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [advancePaymentMethod, setAdvancePaymentMethod] = useState<'upi' | 'card' | 'netbanking'>('upi');
  const [isProcessingAdvance, setIsProcessingAdvance] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    service: "",
    date: undefined as Date | undefined,
    time: "",
    address: "",
    isRecurring: false,
    frequency: "none",
    duration: "1",
    remindersEnabled: false,
    reminderEmail: true,
    reminderSMS: false,
    reminderFrequency: "1-day-before"
  });

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  // Pricing calculations
  const selectedServiceObj = allServices.find(s => s.name === formData.service);
  const baseServicePrice = appliedPromotion?.discountedPrice 
    ? appliedPromotion.discountedPrice 
    : (selectedServiceObj?.price || 1500);

  const referralDiscountAmount = appliedReferral ? 500 : 0;
  const subtotalPrice = Math.max(0, baseServicePrice - referralDiscountAmount);

  const distanceCalc = calculateHomeServiceFee(distanceKm);
  const homeServiceFee = serviceType === 'home' ? distanceCalc.fee : 0;

  const totalAmount = subtotalPrice + homeServiceFee;
  const advanceRequired = Math.round(totalAmount * 0.25);
  const remainingAmount = totalAmount - advanceRequired;

  const validateBookingForm = (): boolean => {
    if (!user) {
      toast.error("Please sign in to book an appointment");
      return false;
    }
    if (!formData.name.trim()) {
      toast.error("Please enter your full name");
      return false;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your contact phone number");
      return false;
    }
    if (!formData.service) {
      toast.error("Please select a service");
      return false;
    }
    if (!formData.date) {
      toast.error("Please select an appointment date");
      return false;
    }
    if (!formData.time) {
      toast.error("Please select a time slot");
      return false;
    }

    if (serviceType === 'home') {
      if (!homeAddress.street.trim()) {
        toast.error("Please provide your complete street/flat address for home service");
        return false;
      }
      if (!homeAddress.pincode.trim() || homeAddress.pincode.trim().length < 4) {
        toast.error("Please enter a valid postal pincode");
        return false;
      }
    }

    if (formData.isRecurring && (formData.frequency === "none" || !formData.duration)) {
      toast.error("Please select frequency and duration for your recurring appointment");
      return false;
    }

    return true;
  };

  const handleCreateAppointment = async (isAdvancePaid: boolean, txnId?: string) => {
    if (!validateBookingForm() || !user || !formData.date) return;

    setIsSubmitting(true);
    const path = "customers";
    
    try {
      const seriesId = crypto.randomUUID();
      const appointmentsToCreate = [];
      const startDate = formData.date;
      const activeReferralCode = appliedReferral?.code || (referralCodeInput.trim() ? referralCodeInput.trim().toUpperCase() : null);
      
      const fullDeliveryAddress = serviceType === 'home' 
        ? `${homeAddress.street.trim()}${homeAddress.landmark.trim() ? ', Near ' + homeAddress.landmark.trim() : ''}, ${homeAddress.city.trim() || 'Mumbai'} - ${homeAddress.pincode.trim()}`
        : null;

      const baseAppointmentData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        service: formData.service,
        time: formData.time,
        notes: formData.address || "",
        stylist: selectedStylist || "Any Available Specialist",
        shopId: shopId || "aurelia-luxe-main",
        promoCode: appliedPromotion?.promoCode || null,
        promotionalOffer: appliedPromotion?.title || null,
        discountPercentage: appliedPromotion?.discountPercentage || null,
        referralCode: activeReferralCode,
        referralDiscount: referralDiscountAmount,
        serviceType,
        deliveryAddress: serviceType === 'home' ? {
          street: homeAddress.street.trim(),
          landmark: homeAddress.landmark.trim(),
          city: homeAddress.city.trim() || "Mumbai",
          pincode: homeAddress.pincode.trim(),
          fullAddress: fullDeliveryAddress
        } : null,
        distanceKm: serviceType === 'home' ? distanceKm : 0,
        homeServiceFee: serviceType === 'home' ? homeServiceFee : 0,
        subtotal: subtotalPrice,
        totalAmount: totalAmount,
        finalPrice: totalAmount,
        advanceRequired: advanceRequired,
        advanceAmountPaid: isAdvancePaid ? advanceRequired : 0,
        remainingAmount: isAdvancePaid ? remainingAmount : totalAmount,
        advancePaid: isAdvancePaid,
        transactionId: isAdvancePaid ? (txnId || `AUR-ADV-${Math.floor(100000 + Math.random() * 900000)}`) : null,
        userId: user.uid,
        userName: user.displayName || formData.name,
        userEmail: user.email || "",
        status: isAdvancePaid ? "confirmed" : "pending",
        remindersEnabled: formData.remindersEnabled,
        reminderEmail: formData.reminderEmail,
        reminderSMS: formData.reminderSMS,
        reminderFrequency: formData.reminderFrequency,
        createdAt: serverTimestamp()
      };

      if (formData.isRecurring) {
        const durationMonths = parseInt(formData.duration);
        const endDate = addMonths(startDate, durationMonths);
        let currentDate = startDate;

        while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
          appointmentsToCreate.push({
            ...baseAppointmentData,
            date: currentDate.toISOString(),
            seriesId,
            isRecurring: true,
            frequency: formData.frequency,
            duration: formData.duration
          });

          if (formData.frequency === "weekly") {
            currentDate = addWeeks(currentDate, 1);
          } else if (formData.frequency === "bi-weekly") {
            currentDate = addWeeks(currentDate, 2);
          } else if (formData.frequency === "monthly") {
            currentDate = addMonths(currentDate, 1);
          } else {
            break;
          }
        }
      } else {
        appointmentsToCreate.push({
          ...baseAppointmentData,
          date: startDate.toISOString(),
          isRecurring: false
        });
      }

      // Batch create appointments
      const createdDocs = await Promise.all(
        appointmentsToCreate.map(app => addDoc(collection(db, path), app))
      );

      // If referral code was used, register referral reward in Firestore
      if (activeReferralCode) {
        try {
          await addDoc(collection(db, "referrals"), {
            referralCode: activeReferralCode,
            referrerId: "referrer-code-" + activeReferralCode.toLowerCase(),
            referredUserId: user.uid,
            referredUserName: formData.name || user.displayName || "Guest Client",
            referredUserEmail: user.email || "",
            appointmentId: createdDocs[0]?.id || "",
            service: formData.service,
            amount: totalAmount,
            pointsEarned: 250,
            status: "completed",
            createdAt: serverTimestamp()
          });
        } catch (refErr) {
          console.warn("Could not save referral document:", refErr);
        }
      }

      setLastBooking({
        ...baseAppointmentData,
        date: startDate,
        count: appointmentsToCreate.length,
        isRecurring: formData.isRecurring,
        frequency: formData.frequency,
        duration: formData.duration,
        fullAddress: fullDeliveryAddress
      });

      setShowAdvanceModal(false);
      setShowSuccessModal(true);

      // Send confirmation email
      try {
        await fetch("/api/send-confirmation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: user.email,
            name: formData.name,
            service: formData.service,
            date: startDate.toISOString(),
            time: formData.time,
            serviceType,
            deliveryAddress: fullDeliveryAddress,
            distanceKm: serviceType === 'home' ? distanceKm : 0,
            homeServiceFee,
            totalAmount,
            advancePaid: isAdvancePaid,
            advanceAmountPaid: isAdvancePaid ? advanceRequired : 0,
            remainingAmount: isAdvancePaid ? remainingAmount : totalAmount,
            isRecurring: formData.isRecurring,
            frequency: formData.frequency,
            duration: formData.duration,
            count: appointmentsToCreate.length
          }),
        });
      } catch (emailError) {
        console.error("Failed to send confirmation email:", emailError);
      }
      
      // Create Admin Notification
      try {
        await addDoc(collection(db, "notifications"), {
          type: "new_appointment",
          title: isAdvancePaid 
            ? `New ${serviceType === 'home' ? 'Home Service' : 'Salon'} Appointment (25% Advance Paid)` 
            : `New ${serviceType === 'home' ? 'Home Service' : 'Salon'} Appointment (Pending Deposit)`,
          message: `${formData.name} booked ${formData.service} on ${format(startDate, "PPP")} at ${formData.time}.${serviceType === 'home' ? ` [Home Service: ${distanceKm} km, Fee: ₹${homeServiceFee}]` : ''} Total: ₹${totalAmount}, 25% Advance: ₹${advanceRequired} (${isAdvancePaid ? 'VERIFIED' : 'PENDING'}).`,
          appointmentId: createdDocs[0].id,
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (notifyError) {
        console.error("Failed to create admin notification:", notifyError);
      }

      if (isAdvancePaid) {
        toast.success("25% Advance Payment Verified! Your reservation is confirmed.", {
          description: `Transaction ID: ${baseAppointmentData.transactionId}`
        });
      } else {
        toast.warning("Appointment reserved with Pending Deposit status.", {
          description: "Please complete the mandatory 25% advance deposit to confirm your slot."
        });
      }

      // Trigger WhatsApp notification
      const recurringText = formData.isRecurring ? `\nRecurring: ${formData.frequency} for ${formData.duration} month(s)` : "";
      const homeText = serviceType === 'home' 
        ? `\nService Mode: Home Service (At-Home)\nDistance: ${distanceKm} km (Fee: ₹${homeServiceFee})\nAddress: ${fullDeliveryAddress}`
        : `\nService Mode: In-Salon`;
      const advanceText = isAdvancePaid 
        ? `\nAdvance Payment: 25% Paid (₹${advanceRequired}) - Confirmed\nBalance Due on Service: ₹${remainingAmount}` 
        : `\nAdvance Payment: Pending 25% Deposit (₹${advanceRequired})\nTotal Amount: ₹${totalAmount}`;

      const whatsappMsg = `New Appointment Booking Request!\n\nName: ${formData.name}\nPhone: ${formData.phone}\nService: ${formData.service}\nDate: ${format(startDate, "PPP")}\nTime: ${formData.time}${homeText}${advanceText}${recurringText}\nNotes: ${formData.address || "None"}`;
      const encodedMsg = encodeURIComponent(whatsappMsg);
      const whatsappUrl = `https://wa.me/${SALON_WHATSAPP.replace(/\+/g, '')}?text=${encodedMsg}`;
      
      // Reset form fields
      setFormData({
        name: "",
        phone: "",
        service: "",
        date: undefined,
        time: "",
        address: "",
        isRecurring: false,
        frequency: "none",
        duration: "1",
        remindersEnabled: false,
        reminderEmail: true,
        reminderSMS: false,
        reminderFrequency: "1-day-before"
      });
      setHomeAddress({
        street: "",
        landmark: "",
        city: "Mumbai",
        pincode: ""
      });
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateBookingForm()) return;

    // Open the 25% Advance Payment verification modal
    setShowAdvanceModal(true);
  };

  return (
    <div className="bg-background py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-24 lg:grid-cols-2">
          {/* Left Side: Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
              Reservations
            </span>
            <h1 className="mb-8 text-5xl font-light tracking-tight md:text-7xl">
              BOOK <br />
              <span className="italic text-primary">APPOINTMENT</span>
            </h1>

            {selectedShop && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 mb-12 p-4 rounded-2xl bg-primary/5 border border-primary/20"
              >
                <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center text-black">
                  <Store className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest">{selectedShop.name}</h2>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase">
                    <MapPin className="h-2.5 w-2.5" />
                    {selectedShop.location || "Online Store"}
                  </div>
                </div>
                <div className="ml-auto">
                  <Badge className="bg-primary/20 text-primary text-[8px] tracking-tighter">PARTNER SHOP</Badge>
                </div>
              </motion.div>
            )}
            
            <div className="space-y-12">
              <div className="rounded-[16px] border border-primary bg-card p-8 shadow-2xl shadow-primary/10">
                <h3 className="mb-4 text-lg font-light uppercase tracking-widest text-primary">Instant Booking</h3>
                <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                  The fastest way to secure your spot is via WhatsApp. Connect directly with our stylists.
                </p>
                <WhatsAppButton className="w-full py-8 text-sm" text="Book via WhatsApp Now" />
              </div>

              <div className="rounded-[16px] border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-card to-card p-8 shadow-xl relative overflow-hidden">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[9px] uppercase font-mono tracking-wider">
                    Sold-Out Alert System
                  </Badge>
                  <span className="text-[10px] text-zinc-500 font-mono">Real-time alerts</span>
                </div>
                <h3 className="mb-2 text-lg font-serif text-white">Can't Find Your Ideal Time?</h3>
                <p className="mb-6 text-xs text-muted-foreground leading-relaxed">
                  Prime evening and weekend appointments fill fast. Join our priority waitlist to get alerted instantly when a chair opens up due to rescheduling.
                </p>
                <JoinWaitlistModal 
                  shopName={selectedShop?.name || "Aurelia Flagship Atelier"}
                  shopId={shopId || "shop-aurelia-flagship"}
                  serviceName={formData.service || "Signature Salon Treatment"}
                  stylistName={selectedStylist || "Master Stylist"}
                  preferredDate={formData.date}
                  preferredTime={formData.time}
                  triggerText="Join Priority Waitlist"
                  triggerVariant="outline"
                  triggerClassName="w-full py-6 text-xs border-amber-500/40 text-amber-400 hover:bg-amber-400 hover:text-black"
                />
              </div>

              {!user && (
                <div className="rounded-[16px] border border-border bg-card p-8 border-dashed">
                  <h3 className="mb-4 text-lg font-light uppercase tracking-widest text-foreground">Or Use Our Form</h3>
                  <p className="mb-6 text-sm text-muted-foreground">
                    Sign in with Google to fill out a detailed booking request.
                  </p>
                  <Button onClick={signInWithGoogle} variant="outline" className="rounded border-border bg-transparent px-8 py-6 text-xs uppercase tracking-widest hover:bg-primary hover:text-black hover:border-primary">
                    <LogIn className="mr-2 h-4 w-4" /> Sign In with Google
                  </Button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Right Side: Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="rounded-[16px] border border-border bg-card p-8 md:p-12 relative overflow-hidden"
          >
            {isSubmitting && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] transition-all">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                    <Loader2 className="h-12 w-12 text-primary animate-spin" />
                    <div className="absolute inset-0 h-12 w-12 border-2 border-primary/20 rounded-full animate-pulse"></div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-serif text-primary italic lowercase tracking-widest">Processing</p>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">Your Reservation</p>
                  </div>
                </div>
              </div>
            )}
            <h2 className="mb-8 text-xl font-serif text-primary">Booking Details</h2>
            
            {shopId && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8 p-4 rounded-[12px] bg-primary/5 border border-primary/10 flex items-center gap-4 group hover:bg-primary/[0.08] transition-colors"
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                  <Store className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold mb-0.5">Booking For</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white uppercase tracking-tight">
                      {selectedShop ? selectedShop.name : "Loading Shop..."}
                    </p>
                    {selectedShop?.isVerified && <Check className="h-3 w-3 text-primary" />}
                  </div>
                  {selectedShop?.location && (
                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-zinc-500">
                      <MapPin className="h-2.5 w-2.5" />
                      <span className="truncate max-w-[200px]">{selectedShop.location}</span>
                    </div>
                  )}
                </div>
                {selectedShop?.logo && (
                  <div className="h-10 w-10 rounded-md overflow-hidden border border-zinc-800">
                    <img src={selectedShop.logo} alt="Shop Logo" className="h-full w-full object-cover" />
                  </div>
                )}
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Service Mode Selection: In-Salon vs Home Service */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-primary" />
                    Appointment Experience & Location
                  </Label>
                  <Badge variant="outline" className={cn(
                    "text-[10px] uppercase font-mono tracking-wider",
                    serviceType === 'home' 
                      ? "border-amber-400/50 text-amber-400 bg-amber-400/10" 
                      : "border-primary/50 text-primary bg-primary/10"
                  )}>
                    {serviceType === 'home' ? "🏠 Doorstep Service" : "💈 Salon Chair"}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setServiceType('salon')}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group",
                      serviceType === 'salon'
                        ? "bg-primary/10 border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/40 scale-[1.01]"
                        : "bg-background/80 hover:bg-zinc-900 border-border text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-start justify-between w-full mb-2">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                        serviceType === 'salon' ? "bg-primary text-black" : "bg-zinc-900 text-zinc-400 group-hover:text-primary"
                      )}>
                        <Store className="h-5 w-5" />
                      </div>
                      {serviceType === 'salon' && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/15 px-2 py-0.5 rounded-full border border-primary/30 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Selected
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className={cn("text-sm font-bold tracking-tight mb-0.5", serviceType === 'salon' ? "text-white" : "text-zinc-300")}>
                        In-Salon Appointment
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Visit our flagship luxury atelier or partner salons for an indulgent on-site retreat.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Standard Chair Experience</span>
                      <span className="text-emerald-400 font-bold">No Travel Fee</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setServiceType('home')}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between group",
                      serviceType === 'home'
                        ? "bg-amber-400/10 border-amber-400 shadow-lg shadow-amber-400/10 ring-1 ring-amber-400/40 scale-[1.01]"
                        : "bg-background/80 hover:bg-zinc-900 border-border text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    <div className="flex items-start justify-between w-full mb-2">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center transition-colors",
                        serviceType === 'home' ? "bg-amber-400 text-black font-bold" : "bg-zinc-900 text-zinc-400 group-hover:text-amber-400"
                      )}>
                        <Home className="h-5 w-5" />
                      </div>
                      {serviceType === 'home' ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full border border-amber-400/30 uppercase">
                          <CheckCircle2 className="h-3 w-3" /> Selected
                        </span>
                      ) : (
                        <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px] uppercase font-mono">
                          VIP Concierge
                        </Badge>
                      )}
                    </div>
                    <div>
                      <h4 className={cn("text-sm font-bold tracking-tight mb-0.5", serviceType === 'home' ? "text-white" : "text-zinc-300")}>
                        Home Service (At-Home)
                      </h4>
                      <p className="text-[11px] text-zinc-400 leading-snug">
                        Master beauty specialists bring sanitized premium equipment directly to your doorstep.
                      </p>
                    </div>
                    <div className="mt-3 pt-2 border-t border-zinc-800/60 flex items-center justify-between text-[10px] font-mono text-zinc-500">
                      <span>Distance Surcharge</span>
                      <span className="text-amber-400 font-bold">From ₹99 (Distance Based)</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Home Service Delivery Address & Distance Calculator Accordion / Card */}
              <AnimatePresence>
                {serviceType === 'home' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-6 rounded-2xl border border-amber-400/30 bg-gradient-to-b from-amber-950/20 via-card to-card p-5 sm:p-6 shadow-xl relative overflow-hidden"
                  >
                    <div className="flex items-start justify-between gap-3 border-b border-amber-400/20 pb-4">
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 w-9 rounded-xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
                          <Navigation className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>At-Home Concierge Delivery Address</span>
                            <Badge className="bg-amber-400/20 text-amber-300 border-amber-400/30 text-[9px] uppercase font-mono">
                              Required
                            </Badge>
                          </h4>
                          <p className="text-[11px] text-zinc-400">
                            Our certified beauty team arrives equipped with sterilized disposable kits & lighting
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] uppercase font-mono text-zinc-400 block">Distance Fee</span>
                        <span className="text-base font-serif font-bold text-amber-400">₹{distanceCalc.fee}</span>
                      </div>
                    </div>

                    {/* Address Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2 space-y-1.5">
                        <Label htmlFor="streetAddress" className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                          <span>Complete Street Address & Flat / House No.</span>
                          <span className="text-red-400">*</span>
                        </Label>
                        <Input
                          id="streetAddress"
                          placeholder="e.g. Flat 602, Sea Green Heights, 14th Road, Bandra West"
                          value={homeAddress.street}
                          onChange={(e) => setHomeAddress({ ...homeAddress, street: e.target.value })}
                          required={serviceType === 'home'}
                          className="h-11 bg-background border-zinc-800 text-foreground text-xs focus:border-amber-400"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="landmark" className="text-xs uppercase tracking-widest text-muted-foreground">
                          Landmark (Optional)
                        </Label>
                        <Input
                          id="landmark"
                          placeholder="e.g. Near St. Andrews Church / Opposite Starbucks"
                          value={homeAddress.landmark}
                          onChange={(e) => setHomeAddress({ ...homeAddress, landmark: e.target.value })}
                          className="h-11 bg-background border-zinc-800 text-foreground text-xs focus:border-amber-400"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="city" className="text-xs uppercase tracking-widest text-muted-foreground">
                            City / Region
                          </Label>
                          <Input
                            id="city"
                            value={homeAddress.city}
                            onChange={(e) => setHomeAddress({ ...homeAddress, city: e.target.value })}
                            className="h-11 bg-background border-zinc-800 text-foreground text-xs focus:border-amber-400"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="pincode" className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1">
                            <span>Pincode</span>
                            <span className="text-red-400">*</span>
                          </Label>
                          <Input
                            id="pincode"
                            placeholder="e.g. 400050"
                            maxLength={6}
                            value={homeAddress.pincode}
                            onChange={(e) => setHomeAddress({ ...homeAddress, pincode: e.target.value.replace(/\D/g, '') })}
                            required={serviceType === 'home'}
                            className="h-11 bg-background border-zinc-800 text-foreground text-xs font-mono focus:border-amber-400"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Distance Selector & Dynamic Fee Calculation */}
                    <div className="space-y-3 pt-3 border-t border-zinc-800/80">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-xs uppercase tracking-widest text-white font-bold flex items-center gap-1.5">
                            <Car className="h-3.5 w-3.5 text-amber-400" />
                            Distance from Salon / Hub (in km)
                          </Label>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            Automated delivery distance tier charge
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold font-mono text-white bg-black/60 px-3 py-1 rounded-lg border border-amber-400/40">
                            {distanceKm} km
                          </span>
                        </div>
                      </div>

                      {/* Distance Slider */}
                      <div className="space-y-2">
                        <input
                          type="range"
                          min="0.5"
                          max="25"
                          step="0.5"
                          value={distanceKm}
                          onChange={(e) => setDistanceKm(parseFloat(e.target.value))}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                        />
                        <div className="flex justify-between text-[9px] font-mono text-zinc-500 px-1">
                          <span>0.5 km (Local)</span>
                          <span>2 km (₹99)</span>
                          <span>5 km (₹199)</span>
                          <span>10 km (₹349)</span>
                          <span>25 km (Extended)</span>
                        </div>
                      </div>

                      {/* Quick Distance Preset Chips */}
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {[
                          { label: "1.5 km", desc: "Local (₹99)", val: 1.5 },
                          { label: "4.0 km", desc: "City (₹199)", val: 4.0 },
                          { label: "8.0 km", desc: "Suburban (₹349)", val: 8.0 },
                          { label: "14.0 km", desc: "Extended (>10km)", val: 14.0 },
                        ].map((preset) => (
                          <button
                            key={preset.label}
                            type="button"
                            onClick={() => setDistanceKm(preset.val)}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-medium shrink-0 transition-all border flex items-center gap-1.5",
                              distanceKm === preset.val
                                ? "bg-amber-400 text-black border-amber-400 font-bold shadow-md shadow-amber-400/20"
                                : "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-zinc-300"
                            )}
                          >
                            <span>{preset.label}</span>
                            <span className={cn("text-[10px] font-mono", distanceKm === preset.val ? "text-black/80 font-bold" : "text-zinc-500")}>
                              {preset.desc}
                            </span>
                          </button>
                        ))}
                      </div>

                      {/* Distance Pricing Rule Breakdown Notice */}
                      <div className={cn(
                        "p-3 rounded-xl border text-xs space-y-1.5",
                        distanceCalc.isExtended
                          ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
                          : "bg-zinc-900/90 border-zinc-800 text-zinc-300"
                      )}>
                        <div className="flex items-center justify-between font-bold">
                          <span className="flex items-center gap-1.5">
                            <Info className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            <span>{distanceCalc.tierText}</span>
                          </span>
                          <span className="font-mono text-amber-400 text-sm">₹{distanceCalc.fee}</span>
                        </div>
                        {distanceCalc.isExtended && (
                          <p className="text-[11px] text-amber-300/90 leading-relaxed font-sans pl-5">
                            ⚠️ Distance exceeds standard 10 km zone. A dynamic surcharge of ₹35/km is calculated for the additional {distanceCalc.extraKm} km (+₹{distanceCalc.extraFee}).
                          </p>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</Label>
                  <div className="relative">
                    <Input 
                      id="name" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      placeholder="Enter full name" 
                      required 
                      className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary h-12" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-xs uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                  <Input 
                    id="phone" 
                    type="tel" 
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="Enter phone number" 
                    required
                    className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary h-12" 
                  />
                </div>
              </div>

              {/* Stylist Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="stylist" className="text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Scissors className="h-3.5 w-3.5 text-primary" />
                    Preferred Stylist / Specialist
                  </Label>
                  {matchedStylist && (
                    <Badge variant="outline" className="text-[10px] border-primary/40 text-primary bg-primary/5 uppercase font-mono tracking-wider">
                      {matchedStylist.experience}
                    </Badge>
                  )}
                </div>

                <Select 
                  value={selectedStylist || "Any Available Specialist"}
                  onValueChange={(val) => setSelectedStylist(val === "Any Available Specialist" ? "" : val)}
                >
                  <SelectTrigger className="border-border bg-background text-foreground focus:border-primary focus:ring-primary h-12">
                    <SelectValue placeholder="Any Available Specialist (Fastest Service)" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Any Available Specialist">
                      <div className="flex items-center gap-2 py-1">
                        <Users className="h-4 w-4 text-zinc-400" />
                        <span className="text-xs font-medium">Any Available Specialist (Fastest Service)</span>
                      </div>
                    </SelectItem>
                    {availableStylists.map((s) => (
                      <SelectItem key={s.id || s.name} value={s.name}>
                        <div className="flex items-center gap-3 py-1">
                          <img 
                            src={s.avatar} 
                            alt={s.name} 
                            className="h-6 w-6 rounded-full object-cover border border-zinc-700 shrink-0" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-xs text-white">{s.name}</span>
                            <span className="text-[10px] text-zinc-400">{s.role}</span>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {matchedStylist && (
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-primary/30 bg-primary/5 text-xs">
                    <img 
                      src={matchedStylist.avatar} 
                      alt={matchedStylist.name} 
                      className="w-10 h-10 rounded-full object-cover border border-primary shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-white flex items-center gap-1.5">
                        <span>{matchedStylist.name}</span>
                        <span className="text-primary text-[10px] uppercase font-mono tracking-wider">• {matchedStylist.role}</span>
                      </p>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">{matchedStylist.bio}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="service" className="text-xs uppercase tracking-widest text-muted-foreground">Select Service</Label>
                <Select 
                  value={formData.service}
                  onValueChange={(val) => setFormData({...formData, service: val})}
                  required
                >
                  <SelectTrigger className="border-border bg-background text-foreground focus:border-primary focus:ring-primary h-12">
                    <SelectValue placeholder="Choose a service" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <TooltipProvider delay={300}>
                      {allServices.map((service) => (
                        <SelectItem 
                          key={service.name} 
                          value={service.name}
                          className="group"
                        >
                          <div className="flex w-full items-center justify-between gap-4">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="flex-1 cursor-help">{service.name} (₹{service.price})</span>
                              </TooltipTrigger>
                              {service.description && (
                                <TooltipContent side="right" className="bg-zinc-900 border-zinc-800 text-[11px] p-3 max-w-[200px] shadow-xl z-[100]">
                                  <p className="text-zinc-300 leading-relaxed font-sans">{service.description}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                            {service.description && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setViewingService(service);
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-white/10 rounded-full"
                              >
                                <Info className="h-3.5 w-3.5 text-primary" />
                              </button>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </TooltipProvider>
                  </SelectContent>
                </Select>

                {/* Active Promotional Offer Banner */}
                {appliedPromotion && (
                  <div className="p-4 rounded-xl border border-primary/40 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent relative overflow-hidden text-xs space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">{appliedPromotion.title}</span>
                            <span className="text-[10px] font-mono font-bold text-primary bg-black/60 px-2 py-0.5 rounded border border-primary/30">
                              {appliedPromotion.promoCode}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                              Save {appliedPromotion.discountPercentage}%
                            </span>
                          </div>
                          <p className="text-[11px] text-zinc-300 mt-1">
                            Festive Package Rate: <strong className="text-primary font-serif text-sm">₹{appliedPromotion.discountedPrice.toLocaleString("en-IN")}</strong>{" "}
                            <span className="line-through text-zinc-500 text-[10px]">₹{appliedPromotion.originalPrice.toLocaleString("en-IN")}</span>
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setAppliedPromotion(null)}
                        className="h-6 text-[10px] text-zinc-400 hover:text-white px-2"
                      >
                        Remove
                      </Button>
                    </div>
                    {appliedPromotion.exclusivePerk && (
                      <div className="flex items-center gap-2 text-[11px] text-amber-300/90 pt-1 border-t border-primary/20">
                        <Gift className="h-3.5 w-3.5 shrink-0" />
                        <span>{appliedPromotion.exclusivePerk}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Promo Code Input Trigger / Field */}
                {!appliedPromotion && (
                  <div className="pt-1">
                    {!showPromoInput ? (
                      <button
                        type="button"
                        onClick={() => setShowPromoInput(true)}
                        className="text-xs text-primary hover:underline flex items-center gap-1.5 font-medium"
                      >
                        <Tag className="h-3 w-3" />
                        <span>Have a festive or bridal promo code?</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="e.g. ROYALBRIDE25, FESTIVEGLOW"
                          value={promoCodeInput}
                          onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                          className="h-9 text-xs font-mono uppercase bg-background border-border"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (!promoCodeInput.trim()) return;
                            const match = SEASONAL_PROMOTIONS.find(
                              p => p.promoCode.toLowerCase() === promoCodeInput.trim().toLowerCase()
                            );
                            if (match) {
                              setAppliedPromotion(match);
                              setFormData(prev => ({ ...prev, service: match.title }));
                              toast.success(`Promo code "${match.promoCode}" applied!`, {
                                description: `${match.discountPercentage}% savings on ${match.title}`
                              });
                            } else {
                              toast.error(`Invalid promo code: "${promoCodeInput}".`);
                            }
                          }}
                          className="h-9 px-4 text-xs font-bold uppercase bg-primary text-black hover:bg-primary/90"
                        >
                          Apply
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPromoInput(false)}
                          className="h-9 px-2 text-zinc-400"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* VIP Referral Code & Discount Section */}
                {appliedReferral ? (
                  <div className="p-4 rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/40 via-emerald-950/20 to-transparent relative overflow-hidden text-xs space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <Gift className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5 animate-bounce" />
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">Friend's VIP Referral Applied</span>
                            <span className="text-[10px] font-mono font-bold text-emerald-300 bg-black/60 px-2 py-0.5 rounded border border-emerald-500/30">
                              {appliedReferral.code}
                            </span>
                            <Badge className="text-[10px] bg-emerald-500 text-black font-bold uppercase">
                              ₹500 OFF First Visit
                            </Badge>
                          </div>
                          <p className="text-[11px] text-zinc-300 mt-1">
                            Your friend's invite gives you <strong className="text-emerald-400 font-semibold">₹500 instant welcome savings</strong> on this booking!
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAppliedReferral(null);
                          setReferralCodeInput("");
                          toast.info("Referral code removed.");
                        }}
                        className="h-6 text-[10px] text-zinc-400 hover:text-white px-2"
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-1">
                    {!showReferralInput ? (
                      <button
                        type="button"
                        onClick={() => setShowReferralInput(true)}
                        className="text-xs text-emerald-400 hover:underline flex items-center gap-1.5 font-medium"
                      >
                        <Gift className="h-3 w-3" />
                        <span>Have a friend's referral or invite code? (₹500 OFF)</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="e.g. AURELIA-PRIYA-1234"
                          value={referralCodeInput}
                          onChange={(e) => setReferralCodeInput(e.target.value.toUpperCase())}
                          className="h-9 text-xs font-mono uppercase bg-background border-border"
                        />
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            if (!referralCodeInput.trim() || referralCodeInput.trim().length < 4) {
                              toast.error("Please enter a valid referral code.");
                              return;
                            }
                            setAppliedReferral({
                              code: referralCodeInput.trim().toUpperCase(),
                              discount: 500
                            });
                            toast.success(`Referral code "${referralCodeInput.trim().toUpperCase()}" applied!`, {
                              description: "₹500 Welcome Discount activated for your appointment."
                            });
                          }}
                          className="h-9 px-4 text-xs font-bold uppercase bg-emerald-500 text-black hover:bg-emerald-400"
                        >
                          Apply Referral
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowReferralInput(false)}
                          className="h-9 px-2 text-zinc-400"
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Calendar & Time Slot Availability Section */}
              <div className="space-y-6 pt-2">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-primary font-bold flex items-center gap-1.5">
                      <CalendarCheck className="h-4 w-4 text-primary" />
                      Visual Calendar & Availability Schedule
                    </Label>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Pick your preferred date to visualize open salon chairs & master stylist slots
                    </p>
                  </div>
                  {formData.date && formData.time && (
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-mono px-2.5 py-1">
                      Slot Selected
                    </Badge>
                  )}
                </div>

                {/* Quick Date Shortcut Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { label: "Today", date: new Date() },
                    { label: "Tomorrow", date: addDays(new Date(), 1) },
                    { label: "In 2 Days", date: addDays(new Date(), 2) },
                    { label: "In 3 Days", date: addDays(new Date(), 3) },
                    { label: "This Weekend", date: addDays(new Date(), (6 - new Date().getDay() + 7) % 7 || 7) },
                  ].map((preset, idx) => {
                    const isSelected = formData.date && isSameDay(formData.date, preset.date);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setFormData({ ...formData, date: preset.date })}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium shrink-0 transition-all border flex items-center gap-1.5",
                          isSelected
                            ? "bg-primary text-black border-primary font-bold shadow-md shadow-primary/20 scale-[1.02]"
                            : "bg-background/80 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                        )}
                      >
                        <Zap className={cn("h-3 w-3", isSelected ? "text-black" : "text-primary")} />
                        <span>{preset.label}</span>
                        <span className={cn("text-[10px] font-mono", isSelected ? "text-black/80" : "text-zinc-500")}>
                          ({format(preset.date, "MMM d")})
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Interactive Calendar Card */}
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-xl">
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Inline Calendar */}
                    <div className="md:col-span-6 flex flex-col items-center justify-center p-2 rounded-xl bg-background/50 border border-zinc-800/80">
                      <div className="w-full flex items-center justify-between px-2 pb-2 mb-2 border-b border-zinc-800 text-xs text-zinc-400">
                        <span className="uppercase tracking-widest font-semibold text-[10px] text-primary">Monthly Availability</span>
                        <span>{formData.date ? format(formData.date, "MMMM yyyy") : "Select Date"}</span>
                      </div>
                      <Calendar
                        mode="single"
                        selected={formData.date}
                        onSelect={(date) => {
                          if (date) {
                            setFormData({ ...formData, date });
                          }
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                        className="rounded-lg p-1"
                        classNames={{
                          day_selected: "bg-primary text-black hover:bg-primary/90 focus:bg-primary focus:text-black font-bold shadow-md",
                          day_today: "border border-primary/50 text-primary font-bold",
                        }}
                      />
                    </div>

                    {/* Time Slot Availability Matrix for Selected Date */}
                    <div className="md:col-span-6 space-y-4">
                      <div className="flex items-center justify-between bg-primary/10 border border-primary/20 rounded-xl px-3.5 py-2.5">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">Selected Date</p>
                            <p className="text-xs font-bold text-white">
                              {formData.date ? format(formData.date, "EEEE, MMMM d, yyyy") : "Please pick a date first"}
                            </p>
                          </div>
                        </div>
                        {formData.date && (
                          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                            12 Slots Open
                          </span>
                        )}
                      </div>

                      {/* Time Slot Categories */}
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {/* Morning */}
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-400 mb-2 tracking-wider">
                            <Sunrise className="h-3.5 w-3.5" />
                            <span>Morning (09:00 AM - 12:00 PM)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { slot: "09:00 AM", status: "Available" },
                              { slot: "10:00 AM", status: "Filling Fast" },
                              { slot: "11:00 AM", status: "Popular" },
                            ].map(({ slot, status }) => {
                              const isSelected = formData.time === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, time: slot })}
                                  className={cn(
                                    "p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between",
                                    isSelected
                                      ? "bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20 scale-[1.03]"
                                      : "bg-background/80 hover:bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-xs font-mono font-bold">{slot}</span>
                                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                                  </div>
                                  <span className={cn(
                                    "text-[8px] uppercase tracking-tighter mt-1 font-semibold",
                                    isSelected ? "text-black/80" : "text-zinc-500"
                                  )}>
                                    {status}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Afternoon */}
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-sky-400 mb-2 tracking-wider">
                            <Sun className="h-3.5 w-3.5" />
                            <span>Afternoon (12:00 PM - 05:00 PM)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { slot: "12:00 PM", status: "Available" },
                              { slot: "01:00 PM", status: "Available" },
                              { slot: "02:00 PM", status: "VIP Slot" },
                              { slot: "03:00 PM", status: "Popular" },
                              { slot: "04:00 PM", status: "Available" },
                            ].map(({ slot, status }) => {
                              const isSelected = formData.time === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, time: slot })}
                                  className={cn(
                                    "p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between",
                                    isSelected
                                      ? "bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20 scale-[1.03]"
                                      : "bg-background/80 hover:bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-xs font-mono font-bold">{slot}</span>
                                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                                  </div>
                                  <span className={cn(
                                    "text-[8px] uppercase tracking-tighter mt-1 font-semibold",
                                    isSelected ? "text-black/80" : "text-zinc-500"
                                  )}>
                                    {status}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Evening */}
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-purple-400 mb-2 tracking-wider">
                            <Moon className="h-3.5 w-3.5" />
                            <span>Evening (05:00 PM - 08:30 PM)</span>
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {[
                              { slot: "05:00 PM", status: "Prime Time" },
                              { slot: "06:00 PM", status: "Filling Fast" },
                              { slot: "07:00 PM", status: "Available" },
                              { slot: "08:00 PM", status: "Available" },
                            ].map(({ slot, status }) => {
                              const isSelected = formData.time === slot;
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, time: slot })}
                                  className={cn(
                                    "p-2.5 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between",
                                    isSelected
                                      ? "bg-primary text-black border-primary font-bold shadow-lg shadow-primary/20 scale-[1.03]"
                                      : "bg-background/80 hover:bg-zinc-900 border-zinc-800 text-white hover:border-zinc-700"
                                  )}
                                >
                                  <div className="flex items-center justify-between w-full">
                                    <span className="text-xs font-mono font-bold">{slot}</span>
                                    {isSelected && <CheckCircle2 className="h-3.5 w-3.5 text-black" />}
                                  </div>
                                  <span className={cn(
                                    "text-[8px] uppercase tracking-tighter mt-1 font-semibold",
                                    isSelected ? "text-black/80" : "text-zinc-500"
                                  )}>
                                    {status}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  {formData.date && formData.time && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between text-xs text-zinc-300"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        <span>
                          Reserved: <strong className="text-white">{format(formData.date, "EEEE, MMM d")}</strong> at <strong className="text-primary font-mono">{formData.time}</strong>
                          {selectedStylist && <span> with <strong className="text-white">{selectedStylist}</strong></span>}
                          {serviceType === 'home' && <span className="text-amber-400 font-semibold"> (At-Home)</span>}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono uppercase">Instant Slot Hold</span>
                    </motion.div>
                  )}
                </div>

                {/* Priority Waitlist Fast Action Box */}
                <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <BellRing className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-white">Desired prime slot fully booked?</p>
                      <p className="text-[11px] text-zinc-400">Join our priority waitlist to receive instant WhatsApp alerts if someone cancels or reschedules.</p>
                    </div>
                  </div>
                  <JoinWaitlistModal 
                    shopName={selectedShop?.name || "Aurelia Flagship Atelier"}
                    shopId={shopId || "shop-aurelia-flagship"}
                    serviceName={formData.service || "Signature Salon Treatment"}
                    stylistName={selectedStylist || "Master Stylist"}
                    preferredDate={formData.date}
                    preferredTime={formData.time}
                    triggerText="Waitlist This Day"
                    triggerVariant="outline"
                    triggerSize="sm"
                    triggerClassName="shrink-0 h-8 text-[10px] border-amber-500/40 text-amber-400 hover:bg-amber-400 hover:text-black font-mono font-bold uppercase"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialRequests" className="text-xs uppercase tracking-widest text-muted-foreground">Special Requests / Preferences</Label>
                <Input 
                  id="specialRequests" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="e.g. Skin allergies, preferred beverages, quiet appointment..." 
                  className="border-border bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary h-12" 
                />
              </div>

              <div className={cn(
                "rounded-[16px] border p-6 space-y-6 transition-all duration-300",
                formData.isRecurring 
                  ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/5 ring-1 ring-primary/20" 
                  : "bg-card/50 border-border"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-full p-2 transition-colors",
                      formData.isRecurring ? "bg-primary text-black" : "bg-primary/10 text-primary"
                    )}>
                      <Repeat className="h-4 w-4" />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Recurring Appointment</Label>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Schedule multiple visits</p>
                    </div>
                  </div>
                  <input 
                    type="checkbox" 
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({...formData, isRecurring: e.target.checked})}
                    className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary accent-primary cursor-pointer"
                  />
                </div>

                {formData.isRecurring && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="grid grid-cols-2 gap-6 pt-4 border-t border-primary/10"
                  >
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Frequency</Label>
                      <Select 
                        value={formData.frequency}
                        onValueChange={(val) => setFormData({...formData, frequency: val})}
                      >
                        <SelectTrigger className="border-border bg-background text-foreground focus:border-primary h-10">
                          <SelectValue placeholder="Frequency" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Duration</Label>
                      <Select 
                        value={formData.duration}
                        onValueChange={(val) => setFormData({...formData, duration: val})}
                      >
                        <SelectTrigger className="border-border bg-background text-foreground focus:border-primary h-10">
                          <SelectValue placeholder="Duration" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="1">1 Month</SelectItem>
                          <SelectItem value="2">2 Months</SelectItem>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </div>

              <div className={cn(
                "rounded-[16px] border p-6 space-y-6 transition-all duration-300",
                formData.remindersEnabled 
                  ? "bg-primary/5 border-primary/30 shadow-lg shadow-primary/5" 
                  : "bg-card/50 border-border"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "rounded-full p-2 transition-colors",
                      formData.remindersEnabled ? "bg-primary text-black" : "bg-primary/10 text-primary"
                    )}>
                      {formData.remindersEnabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Appointment Reminders</Label>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Never miss your slot</p>
                    </div>
                  </div>
                  <Switch 
                    checked={formData.remindersEnabled}
                    onCheckedChange={(val) => setFormData({...formData, remindersEnabled: val})}
                  />
                </div>

                {formData.remindersEnabled && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-6 pt-4 border-t border-primary/10"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Email</Label>
                        <Switch 
                          checked={formData.reminderEmail}
                          onCheckedChange={(val) => setFormData({...formData, reminderEmail: val})}
                          disabled={!formData.remindersEnabled}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-zinc-900 border border-zinc-800">
                        <Label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">SMS</Label>
                        <Switch 
                          checked={formData.reminderSMS}
                          onCheckedChange={(val) => setFormData({...formData, reminderSMS: val})}
                          disabled={!formData.remindersEnabled}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                       <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Notification Frequency</Label>
                       <Select 
                        value={formData.reminderFrequency}
                        onValueChange={(val) => setFormData({...formData, reminderFrequency: val})}
                      >
                        <SelectTrigger className="border-border bg-background text-foreground focus:border-primary h-10">
                          <SelectValue placeholder="When should we remind you?" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="2-hours-before">2 Hours Before</SelectItem>
                          <SelectItem value="1-day-before">1 Day Before</SelectItem>
                          <SelectItem value="2-days-before">2 Days Before</SelectItem>
                          <SelectItem value="1-week-before">1 Week Before</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Comprehensive Financial Pricing Breakdown & Mandatory 25% Advance Calculation Card */}
              <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-zinc-950 via-card to-card p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="h-4 w-4 text-primary" />
                    <span className="text-xs uppercase font-bold tracking-widest text-white">
                      Transparent Pricing Breakdown
                    </span>
                  </div>
                  <Badge variant="outline" className="text-[10px] border-primary/40 text-primary font-mono uppercase">
                    Mandatory 25% Rule
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center text-zinc-300">
                    <span>1. Subtotal ({formData.service || "Selected Service"}):</span>
                    <span className="font-mono font-semibold text-white">₹{subtotalPrice.toLocaleString("en-IN")}</span>
                  </div>

                  {appliedReferral && (
                    <div className="flex justify-between items-center text-emerald-400 text-[11px]">
                      <span>• VIP Referral Welcome Credit ({appliedReferral.code}):</span>
                      <span className="font-mono font-bold">-₹500</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-zinc-300">
                    <span className="flex items-center gap-1.5">
                      <span>2. Home Service Charge:</span>
                      {serviceType === 'home' && (
                        <span className="text-[10px] font-mono text-amber-400">({distanceKm} km)</span>
                      )}
                    </span>
                    <span className={cn("font-mono font-semibold", serviceType === 'home' ? "text-amber-400" : "text-zinc-500")}>
                      {serviceType === 'home' ? `+₹${homeServiceFee.toLocaleString("en-IN")}` : "₹0 (In-Salon)"}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800 flex justify-between items-center text-sm font-bold text-white">
                    <span>3. Total Booking Value:</span>
                    <span className="font-serif text-primary text-base">₹{totalAmount.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="p-3 rounded-xl bg-primary/10 border border-primary/30 flex justify-between items-center text-xs">
                    <div>
                      <span className="font-bold text-white flex items-center gap-1">
                        <span>4. Mandatory Advance Required:</span>
                        <Badge className="bg-primary text-black text-[9px] font-bold h-4 px-1.5">25% OF TOTAL</Badge>
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5">Required to confirm & lock stylist schedule</span>
                    </div>
                    <span className="font-mono text-base font-bold text-primary">₹{advanceRequired.toLocaleString("en-IN")}</span>
                  </div>

                  <div className="flex justify-between items-center text-zinc-400 text-[11px] pt-1">
                    <span>5. Remaining Balance Due at Time of Service (75%):</span>
                    <span className="font-mono font-semibold text-zinc-300">₹{remainingAmount.toLocaleString("en-IN")}</span>
                  </div>
                </div>

                {/* Mandatory Advance Warning Notice Banner */}
                <div className="rounded-xl border border-amber-500/40 bg-amber-950/20 p-3 flex items-start gap-2.5 text-xs text-amber-300">
                  <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <p className="font-bold text-white">Booking Policy & Deposit Notice:</p>
                    <p className="text-[11px] text-amber-200/90 mt-0.5">
                      "Booking is not confirmed until 25% advance payment is completed." Appointments without deposit remain in <em>Pending Deposit</em> status.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !user} 
                  className="w-full bg-primary py-7 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 disabled:opacity-50 h-16 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 group"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Processing Reservation...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 text-black group-hover:scale-110 transition-transform" />
                      <span>Pay 25% Advance (₹{advanceRequired.toLocaleString("en-IN")}) & Confirm Booking</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  disabled={isSubmitting || !user}
                  onClick={() => handleCreateAppointment(false)}
                  className="w-full border-zinc-800 hover:bg-white/5 text-zinc-400 hover:text-white text-xs uppercase tracking-widest h-12"
                >
                  Reserve with Deposit Pending (Pay ₹{advanceRequired} Later)
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      {/* Service Details Modal */}
      <Dialog open={!!viewingService} onOpenChange={(open) => !open && setViewingService(null)}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif text-primary">
              {viewingService?.name}
            </DialogTitle>
            <div className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
              <span>Service Details</span>
              <span className="text-primary">₹{viewingService?.price}</span>
            </div>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-foreground leading-relaxed">
              {viewingService?.description || "Experience top-tier salon care with our premium services."}
            </p>
          </div>
          <div className="mt-6">
            <Button 
              onClick={() => {
                setFormData({...formData, service: viewingService?.name || ""});
                setViewingService(null);
              }}
              className="w-full bg-primary text-black font-bold uppercase tracking-widest text-[10px]"
            >
              Select this service
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mandatory 25% Advance Payment Checkout Verification Modal */}
      <Dialog open={showAdvanceModal} onOpenChange={setShowAdvanceModal}>
        <DialogContent className="bg-card border-border max-w-lg p-6 sm:p-8">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] uppercase font-mono">
                Aurelia Escrow Deposit
              </Badge>
            </div>
            <DialogTitle className="text-2xl font-serif text-white">
              Verify <span className="text-primary italic">25% Advance Deposit</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-zinc-400 mt-1">
              Complete your mandatory 25% deposit to lock in your specialist and confirm your booking.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {/* Amount Due Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold block">
                  Mandatory 25% Deposit Due
                </span>
                <span className="text-2xl font-bold font-serif text-white">
                  ₹{advanceRequired.toLocaleString("en-IN")}
                </span>
              </div>
              <div className="text-right text-xs">
                <span className="text-[10px] text-zinc-400 block font-mono">Total Order: ₹{totalAmount.toLocaleString("en-IN")}</span>
                <span className="text-emerald-400 text-[11px] font-semibold">Remaining Due on Arrival: ₹{remainingAmount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Select Payment Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'upi', label: 'UPI / QR', icon: QrCode },
                  { id: 'card', label: 'Cards', icon: CreditCard },
                  { id: 'netbanking', label: 'NetBanking', icon: Building }
                ].map((mode) => {
                  const Icon = mode.icon;
                  const isSel = advancePaymentMethod === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setAdvancePaymentMethod(mode.id as any)}
                      className={cn(
                        "p-3 rounded-xl border text-center flex flex-col items-center justify-center gap-1.5 transition-all",
                        isSel 
                          ? "bg-primary text-black border-primary font-bold shadow-md shadow-primary/20" 
                          : "bg-background/80 hover:bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white"
                      )}
                    >
                      <Icon className={cn("h-4 w-4", isSel ? "text-black" : "text-primary")} />
                      <span className="text-xs">{mode.label}</span>
                    </button>
                  );
                })}
              </div>

              {advancePaymentMethod === 'upi' && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-center space-y-3">
                  <div className="mx-auto h-32 w-32 bg-white p-2 rounded-xl border border-zinc-700 shadow-inner flex items-center justify-center">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=ffthe2718@okaxis&pn=Aurelia%20Luxe%20Salon&am=${advanceRequired}&cu=INR`} 
                      alt="UPI QR Code" 
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-mono font-bold text-white">VPA: <span className="text-primary">ffthe2718@okaxis</span></p>
                    <p className="text-[10px] text-zinc-500">Scan via Google Pay, PhonePe, Paytm, or BHIM for instant verification</p>
                  </div>
                </div>
              )}

              {advancePaymentMethod === 'card' && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-3">
                  <Input placeholder="Card Number (•••• •••• •••• 4242)" defaultValue="4532 •••• •••• 8821" className="h-10 text-xs font-mono bg-background border-zinc-800" />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="MM/YY" defaultValue="12/28" className="h-10 text-xs font-mono bg-background border-zinc-800" />
                    <Input placeholder="CVV" defaultValue="•••" type="password" className="h-10 text-xs font-mono bg-background border-zinc-800" />
                  </div>
                </div>
              )}

              {advancePaymentMethod === 'netbanking' && (
                <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2">
                  <Select defaultValue="hdfc">
                    <SelectTrigger className="h-10 text-xs bg-background border-zinc-800">
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-zinc-800 text-xs">
                      <SelectItem value="hdfc">HDFC Bank</SelectItem>
                      <SelectItem value="icici">ICICI Bank</SelectItem>
                      <SelectItem value="sbi">State Bank of India</SelectItem>
                      <SelectItem value="axis">Axis Bank</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[10px] text-zinc-500 italic">You will be securely redirected to authenticate your 25% deposit.</p>
                </div>
              )}
            </div>

            {/* Action Trigger in Modal */}
            <div className="space-y-2 pt-2">
              <Button
                type="button"
                disabled={isProcessingAdvance}
                onClick={async () => {
                  setIsProcessingAdvance(true);
                  // Simulate rapid gateway verification
                  await new Promise(res => setTimeout(res, 900));
                  setIsProcessingAdvance(false);
                  const txnId = `AUR-ADV-${Math.floor(100000 + Math.random() * 900000)}`;
                  handleCreateAppointment(true, txnId);
                }}
                className="w-full bg-primary text-black font-bold uppercase tracking-widest text-xs h-13 hover:bg-primary/90 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                {isProcessingAdvance ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    <span>Verifying 25% Deposit with Gateway...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Verify & Pay ₹{advanceRequired.toLocaleString("en-IN")} (Confirm)</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="ghost"
                disabled={isProcessingAdvance}
                onClick={() => {
                  setShowAdvanceModal(false);
                  handleCreateAppointment(false);
                }}
                className="w-full text-zinc-400 hover:text-white text-[11px]"
              >
                Skip Payment for Now (Save as Pending Deposit)
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Booking Confirmation Receipt Dialog */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-card border-border max-w-lg p-6 sm:p-8">
          <DialogHeader>
            <motion.div 
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1
              }}
              className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(234,179,8,0.1)]"
            >
              <Check className="h-10 w-10 text-primary" strokeWidth={3} />
            </motion.div>
            <DialogTitle className="text-2xl font-serif text-primary text-center">
              Reservation {lastBooking?.advancePaid ? <span className="italic">Confirmed</span> : <span className="italic text-amber-400">Received (Pending Deposit)</span>}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground uppercase tracking-widest text-[10px] mt-2">
              Thank you for choosing Aurelia Luxury Experience
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-3.5 rounded-2xl border border-border bg-white/5 p-5 text-xs">
            {/* Status Badge */}
            <div className="flex justify-between items-center pb-3 border-b border-border">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Booking Status</span>
              {lastBooking?.advancePaid ? (
                <Badge className="bg-emerald-500 text-black font-bold uppercase text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Advance Paid (25%) - Confirmed
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-400 text-amber-400 bg-amber-400/10 font-bold uppercase text-[10px] flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Pending 25% Deposit
                </Badge>
              )}
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Service Mode</span>
              <span className="font-bold text-white flex items-center gap-1.5">
                {lastBooking?.serviceType === 'home' ? (
                  <>
                    <Home className="h-3.5 w-3.5 text-amber-400" />
                    <span>Home Service (At-Home Concierge)</span>
                  </>
                ) : (
                  <>
                    <Store className="h-3.5 w-3.5 text-primary" />
                    <span>In-Salon Appointment</span>
                  </>
                )}
              </span>
            </div>

            {lastBooking?.serviceType === 'home' && (
              <>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Delivery Address</span>
                  <span className="font-medium text-right text-zinc-200 text-[11px] max-w-[240px]">
                    {lastBooking.fullAddress || lastBooking.deliveryAddress?.fullAddress}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Distance Surcharge</span>
                  <span className="font-mono text-amber-400 font-semibold">{lastBooking.distanceKm} km (₹{lastBooking.homeServiceFee})</span>
                </div>
              </>
            )}

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Client</span>
              <span className="font-medium text-white">{lastBooking?.name}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Service</span>
              <span className="text-primary italic font-medium">{lastBooking?.service}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Date & Slot</span>
              <span className="font-mono font-medium text-white">
                {lastBooking?.date ? format(new Date(lastBooking.date), "MMM d, yyyy") : ""} at {lastBooking?.time}
              </span>
            </div>

            {lastBooking?.stylist && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Specialist</span>
                <span className="font-semibold text-primary">{lastBooking.stylist}</span>
              </div>
            )}

            {/* Financial Summary */}
            <div className="pt-3 border-t border-border/80 space-y-1.5">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-400">Total Order Amount:</span>
                <span className="font-mono font-bold text-white">₹{lastBooking?.totalAmount?.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-zinc-400">25% Mandatory Advance:</span>
                <span className={cn("font-mono font-bold", lastBooking?.advancePaid ? "text-emerald-400" : "text-amber-400")}>
                  {lastBooking?.advancePaid ? `Paid (₹${lastBooking.advanceAmountPaid})` : `Pending (₹${lastBooking.advanceRequired})`}
                </span>
              </div>
              {lastBooking?.transactionId && (
                <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono">
                  <span>Txn Ref:</span>
                  <span>{lastBooking.transactionId}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-border/40">
                <span className="text-white">Remaining Balance Due at Service:</span>
                <span className="font-mono text-primary font-bold">₹{lastBooking?.remainingAmount?.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>

          {!lastBooking?.advancePaid && (
            <div className="mt-3 p-3 rounded-xl border border-amber-500/40 bg-amber-950/20 text-[11px] text-amber-200">
              ⚠️ <strong>Reminder:</strong> Please complete your 25% deposit within 24 hours to prevent slot release. You can pay anytime from your Dashboard.
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
              className="flex-1 border-border text-foreground font-bold uppercase tracking-widest text-[10px] h-12 hover:bg-white/5 transition-all"
            >
              Close
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-primary text-black font-bold uppercase tracking-widest text-[10px] h-12 hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
            >
              View My Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
