import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearchParams, useNavigate } from "react-router-dom";
import { UserPlus, LogIn, Users, CreditCard, Droplets, Phone, MapPin, Info, MessageCircle, Calendar as CalendarIcon, Clock, Repeat, Loader2, Check, Store, Mail, Bell, BellRing, Scissors, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { format, addWeeks, addMonths, isBefore } from "date-fns";
import { db, signInWithGoogle, handleFirestoreError, OperationType } from "@/firebase";
import { collection, addDoc, serverTimestamp, query, orderBy, onSnapshot, where, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { ROLES, SALON_SERVICES, SALON_WHATSAPP } from "@/constants";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_STYLISTS, StylistMember } from "@/types/stylist";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Book() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const shopId = searchParams.get("shopId");
  const stylistParam = searchParams.get("stylist");
  const { user, profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicServices, setDynamicServices] = useState<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<any>(null);
  const [selectedStylist, setSelectedStylist] = useState<string>(stylistParam || "");
  const [viewingService, setViewingService] = useState<any | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [lastBooking, setLastBooking] = useState<any | null>(null);

  useEffect(() => {
    if (stylistParam) {
      setSelectedStylist(stylistParam);
    }
  }, [stylistParam]);

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
      handleFirestoreError(error, OperationType.LIST, "services");
    });

    return () => unsubscribe();
  }, []);

  const allServices = [...SALON_SERVICES, ...dynamicServices];

  const availableStylists: StylistMember[] = 
    selectedShop?.content?.stylists && selectedShop.content.stylists.length > 0
      ? selectedShop.content.stylists
      : DEFAULT_STYLISTS;

  const matchedStylist = availableStylists.find(s => 
    selectedStylist && s.name.toLowerCase() === selectedStylist.toLowerCase()
  );

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please sign in to book an appointment");
      return;
    }

    if (!formData.date) {
      toast.error("Please select a date");
      return;
    }

    if (formData.isRecurring && (formData.frequency === "none" || !formData.duration)) {
      toast.error("Please select frequency and duration for your recurring appointment");
      return;
    }

    setIsSubmitting(true);
    
    const path = "customers";
    try {
      const seriesId = crypto.randomUUID();
      const appointmentsToCreate = [];
      const startDate = formData.date;
      
      if (formData.isRecurring) {
        const durationMonths = parseInt(formData.duration);
        const endDate = addMonths(startDate, durationMonths);
        let currentDate = startDate;

        while (isBefore(currentDate, endDate) || currentDate.getTime() === endDate.getTime()) {
          appointmentsToCreate.push({
            ...formData,
            stylist: selectedStylist || "Any Available Specialist",
            shopId: shopId || "aurelia-luxe-main",
            date: currentDate.toISOString(),
            seriesId,
            userId: user.uid,
            userName: user.displayName,
            userEmail: user.email,
            status: "pending",
            createdAt: serverTimestamp()
          });

          if (formData.frequency === "weekly") {
            currentDate = addWeeks(currentDate, 1);
          } else if (formData.frequency === "bi-weekly") {
            currentDate = addWeeks(currentDate, 2);
          } else if (formData.frequency === "monthly") {
            currentDate = addMonths(currentDate, 1);
          } else {
            break; // Safety break
          }
        }
      } else {
        appointmentsToCreate.push({
          ...formData,
          stylist: selectedStylist || "Any Available Specialist",
          shopId: shopId || "aurelia-luxe-main",
          date: startDate.toISOString(),
          userId: user.uid,
          userName: user.displayName,
          userEmail: user.email,
          status: "pending",
          createdAt: serverTimestamp()
        });
      }

      // Batch create appointments
      const createdDocs = await Promise.all(
        appointmentsToCreate.map(app => addDoc(collection(db, path), app))
      );

      setLastBooking({
        ...formData,
        stylist: selectedStylist || "Any Available Specialist",
        date: startDate, // Pass Date object
        count: appointmentsToCreate.length
      });
      setShowSuccessModal(true);

      // Send confirmation email (just for the first one or a summary)
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
          title: formData.isRecurring ? "New Recurring Series Booked" : "New Appointment Booked",
          message: formData.isRecurring 
            ? `${formData.name} has booked ${appointmentsToCreate.length} appointments (${formData.frequency}) for ${formData.service} starting ${format(startDate, "PPP")}.`
            : `${formData.name} has booked a ${formData.service} for ${format(startDate, "PPP")} at ${formData.time}.`,
          appointmentId: createdDocs[0].id,
          read: false,
          createdAt: serverTimestamp()
        });
      } catch (notifyError) {
        console.error("Failed to create admin notification:", notifyError);
      }
      
      toast.success("Appointment request submitted successfully! A confirmation email has been sent to your inbox.");

      // Trigger WhatsApp notification
      const recurringText = formData.isRecurring ? `\nRecurring: ${formData.frequency} for ${formData.duration} month(s)` : "";
      const whatsappMsg = `New Appointment Request!\n\nName: ${formData.name}\nService: ${formData.service}\nDate: ${formData.date ? format(formData.date, "PPP") : "N/A"}\nTime: ${formData.time}${recurringText}\nNotes: ${formData.address || "None"}`;
      const encodedMsg = encodeURIComponent(whatsappMsg);
      const whatsappUrl = `https://wa.me/${SALON_WHATSAPP.replace(/\+/g, '')}?text=${encodedMsg}`;
      
      // Open WhatsApp in a new tab
      window.open(whatsappUrl, '_blank');

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
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsSubmitting(false);
    }
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
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Select Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-border bg-background h-12 rounded-[8px] focus:border-primary",
                        !formData.date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {formData.date ? format(formData.date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-card border-border shadow-2xl" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.date}
                      onSelect={(date) => setFormData({ ...formData, date })}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      className="rounded-md"
                      classNames={{
                        day_selected: "bg-primary text-black hover:bg-primary/90 focus:bg-primary focus:text-black font-bold",
                        day_today: "bg-white/5 text-primary",
                      }}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs uppercase tracking-widest text-muted-foreground">Select Time</Label>
                <Select 
                  value={formData.time}
                  onValueChange={(val) => setFormData({...formData, time: val})}
                  required
                >
                  <SelectTrigger className="border-border bg-background text-foreground focus:border-primary focus:ring-primary h-12">
                    <div className="flex items-center overflow-hidden">
                      <Clock className="mr-2 h-4 w-4 text-muted-foreground shrink-0" />
                      <SelectValue placeholder="Pick a time" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-xs uppercase tracking-widest text-muted-foreground">Special Requests</Label>
                <Input 
                  id="address" 
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Any specifics we should know?" 
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

              <Button type="submit" disabled={isSubmitting || !user} className="w-full rounded-none bg-primary py-8 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 disabled:opacity-50 h-16 shadow-xl shadow-primary/10 transition-all flex items-center justify-center gap-3">
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  "Confirm Reservation"
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
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

      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="bg-card border-border max-w-md">
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
              Reservation <span className="italic">Confirmed</span>
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground uppercase tracking-widest text-[10px] mt-2">
              Thank you for choosing Aurelia Salon
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-4 rounded-[12px] border border-border bg-white/5 p-6">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Client</span>
              <span className="font-medium">{lastBooking?.name}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Service</span>
              <span className="text-primary italic">{lastBooking?.service}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Date</span>
              <span>{lastBooking?.date ? format(lastBooking.date, "MMMM do, yyyy") : ""}</span>
            </div>
            {lastBooking?.isRecurring && (
              <div className="pt-4 mt-4 border-t border-border space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-primary font-bold uppercase tracking-widest text-[9px]">Recurring Series</span>
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Total Sessions</span>
                  <span className="font-semibold text-primary">{lastBooking.count} Sessions</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Frequency</span>
                  <span className="capitalize">{lastBooking.frequency}</span>
                </div>
                <p className="text-[10px] text-zinc-500 italic leading-relaxed text-center mt-2">
                  All sessions have been added to your dashboard. You can manage or cancel specific appointments individually.
                </p>
              </div>
            )}
            {lastBooking?.stylist && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Stylist / Specialist</span>
                <span className="font-semibold text-primary">{lastBooking.stylist}</span>
              </div>
            )}
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground uppercase tracking-wider text-[10px]">Time</span>
              <span>{lastBooking?.time}</span>
            </div>
            {lastBooking?.address && (
              <div className="pt-2 border-t border-border mt-2">
                <span className="text-muted-foreground uppercase tracking-wider text-[10px] block mb-1">Special Requests</span>
                <p className="text-xs text-zinc-400 leading-relaxed italic">"{lastBooking.address}"</p>
              </div>
            )}
            {lastBooking?.isRecurring && (
              <div className="pt-2 border-t border-border mt-2">
                <div className="flex justify-between items-center text-[10px] text-primary uppercase tracking-[0.2em]">
                  <span>Recurring Plan</span>
                  <span>{lastBooking.frequency} / {lastBooking.duration}mo</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-8 px-2">
            <h4 className="text-[10px] uppercase tracking-[0.3em] text-primary/70 font-bold mb-4 flex items-center gap-2">
              <span className="h-[1px] flex-1 bg-primary/10"></span>
              Next Steps
              <span className="h-[1px] flex-1 bg-primary/10"></span>
            </h4>
            <div className="grid gap-4">
              <div className="flex gap-4 items-start group">
                <div className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                  <Mail className="h-4 w-4 text-zinc-500 group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Confirmation Sent</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">A detailed invoice and calendar invite are on their way to your inbox.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start group">
                <div className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                  <Clock className="h-4 w-4 text-zinc-500 group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Arrival Protocol</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">Please arrive 5-10 minutes prior to your slot for a dedicated consultation.</p>
                </div>
              </div>
              <div className="flex gap-4 items-start group">
                <div className="h-8 w-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                  <MessageCircle className="h-4 w-4 text-zinc-500 group-hover:text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Support & Changes</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5 leading-relaxed">Reschedule or cancel instantly via your dashboard or WhatsApp support.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 border border-zinc-900 bg-black/40 p-6 rounded-[12px] text-center border-dashed group hover:border-primary/20 transition-all">
            <h4 className="text-[10px] uppercase tracking-widest text-zinc-500 mb-4 font-bold">Pay via UPI (Instant)</h4>
            <div className="mx-auto h-32 w-32 bg-white p-2 rounded-lg mb-4">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=ffthe2718@okaxis&pn=Aurelia%20Luxe%20Studio&cu=INR`} 
                alt="UPI QR Code" 
                className="h-full w-full object-contain"
              />
            </div>
            <p className="text-[9px] text-zinc-500 italic">Scan to pay directly to Aurelia Luxe Studio</p>
          </div>

          <div className="mt-8 flex gap-3">
            <Button 
              variant="outline"
              onClick={() => setShowSuccessModal(false)}
              className="flex-1 border-border text-foreground font-bold uppercase tracking-widest text-[10px] h-12 rounded-none hover:bg-white/5 transition-all"
            >
              Close
            </Button>
            <Button 
              onClick={() => navigate("/dashboard")}
              className="flex-1 bg-primary text-black font-bold uppercase tracking-widest text-[10px] h-12 rounded-none hover:bg-primary/90 transition-all shadow-lg shadow-primary/5"
            >
              View My Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
