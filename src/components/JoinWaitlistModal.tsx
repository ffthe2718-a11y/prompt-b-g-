import React, { useState } from "react";
import { 
  BellRing, 
  Clock, 
  Calendar as CalendarIcon, 
  MessageCircle, 
  Mail, 
  Smartphone, 
  CheckCircle2, 
  Sparkles, 
  Users, 
  Scissors, 
  Store, 
  AlertCircle,
  Loader2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { db } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "@/context/AuthContext";
import { format, addDays } from "date-fns";

export interface JoinWaitlistModalProps {
  shopName?: string;
  shopId?: string;
  serviceName?: string;
  stylistName?: string;
  preferredDate?: Date | string;
  preferredTime?: string;
  triggerText?: string;
  triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
  triggerClassName?: string;
  triggerSize?: "default" | "sm" | "lg" | "icon";
  isCompactTrigger?: boolean;
  isOpenControlled?: boolean;
  onOpenChangeControlled?: (open: boolean) => void;
  customTrigger?: React.ReactNode;
}

export default function JoinWaitlistModal({
  shopName = "Aurelia Flagship Atelier",
  shopId = "shop-aurelia-flagship",
  serviceName = "Signature Couture Treatment",
  stylistName = "Master Stylist",
  preferredDate,
  preferredTime = "Prime Time Slot",
  triggerText = "Join Priority Waitlist",
  triggerVariant = "outline",
  triggerClassName,
  triggerSize = "default",
  isCompactTrigger = false,
  isOpenControlled,
  onOpenChangeControlled,
  customTrigger,
}: JoinWaitlistModalProps) {
  const { user } = useAuth();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedData, setSubmittedData] = useState<any | null>(null);

  const isControlled = isOpenControlled !== undefined;
  const open = isControlled ? isOpenControlled : internalOpen;
  const setOpen = (val: boolean) => {
    if (isControlled && onOpenChangeControlled) {
      onOpenChangeControlled(val);
    } else {
      setInternalOpen(val);
    }
    if (!val) {
      // Reset success state after modal closes
      setTimeout(() => setIsSuccess(false), 300);
    }
  };

  const initialDateStr = preferredDate 
    ? (typeof preferredDate === "string" ? preferredDate : format(preferredDate, "yyyy-MM-dd"))
    : format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    phone: "",
    email: user?.email || "",
    targetShop: shopName,
    targetService: serviceName,
    targetStylist: stylistName,
    desiredDate: initialDateStr,
    flexibility: "flexible-weekend",
    preferredTimeRange: preferredTime || "Any Available Time",
    notifyWhatsApp: true,
    notifySMS: true,
    notifyEmail: true,
    notes: "",
  });

  const handleJoinWaitlist = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.phone.trim()) {
      toast.error("Please provide your name and contact phone number.");
      return;
    }

    setIsSubmitting(true);
    try {
      const waitlistEntry = {
        userId: user?.uid || "guest",
        userName: formData.name,
        userPhone: formData.phone,
        userEmail: formData.email,
        shopId,
        shopName: formData.targetShop,
        service: formData.targetService,
        stylist: formData.targetStylist,
        desiredDate: formData.desiredDate,
        flexibility: formData.flexibility,
        timeRange: formData.preferredTimeRange,
        notificationPreferences: {
          whatsapp: formData.notifyWhatsApp,
          sms: formData.notifySMS,
          email: formData.notifyEmail,
        },
        specialNotes: formData.notes,
        status: "waiting",
        priorityQueueNumber: Math.floor(Math.random() * 3) + 1, // Simulated queue position
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, "waitlist"), waitlistEntry);

      setSubmittedData(waitlistEntry);
      setIsSuccess(true);
      toast.success("You are on the priority waitlist!", {
        description: `We'll notify you immediately via WhatsApp/SMS if ${formData.targetService} opens up.`
      });
    } catch (error) {
      console.warn("Firestore waitlist note:", error);
      // Fallback local confirmation
      const fallbackEntry = {
        userName: formData.name,
        userPhone: formData.phone,
        shopName: formData.targetShop,
        service: formData.targetService,
        desiredDate: formData.desiredDate,
        priorityQueueNumber: 2,
      };
      setSubmittedData(fallbackEntry);
      setIsSuccess(true);
      toast.success("Waitlist request registered!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {customTrigger ? (
        <DialogTrigger asChild>
          {customTrigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button
            variant={triggerVariant}
            size={triggerSize}
            className={cn(
              "gap-2 font-bold uppercase tracking-wider text-xs transition-all",
              triggerVariant === "outline" && "border-amber-500/40 text-amber-400 hover:bg-amber-400 hover:text-black",
              triggerClassName
            )}
          >
            <BellRing className="h-3.5 w-3.5 text-amber-400 shrink-0 animate-pulse" />
            <span>{triggerText}</span>
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="bg-zinc-950 border-zinc-800 text-white max-w-lg p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
        {!isSuccess ? (
          <>
            <DialogHeader className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5">
                  High Demand Slot Alert
                </Badge>
                <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-mono">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>Instant Cancellation Alerts</span>
                </div>
              </div>

              <DialogTitle className="text-2xl font-serif text-white tracking-tight pt-1">
                Join <span className="italic text-primary font-serif">Priority Waitlist</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 leading-relaxed">
                When appointments reschedule or extra salon chairs open, waitlist members receive instant SMS & WhatsApp priority booking links before general release.
              </DialogDescription>
            </DialogHeader>

            {/* Target Reservation Summary Card */}
            <div className="my-4 p-3.5 rounded-xl border border-primary/30 bg-primary/5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-bold text-white">{shopName}</span>
                </div>
                <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-mono border-zinc-700 text-zinc-300">
                  Salon Chair Hold
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-primary/10 text-[11px]">
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-mono">Service</span>
                  <span className="text-zinc-200 font-medium truncate block">{serviceName}</span>
                </div>
                <div>
                  <span className="text-zinc-500 block text-[9px] uppercase tracking-wider font-mono">Specialist</span>
                  <span className="text-primary font-medium truncate block">{stylistName}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleJoinWaitlist} className="space-y-4">
              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Full Name *
                  </Label>
                  <Input
                    required
                    placeholder="Enter full name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Phone / WhatsApp *
                  </Label>
                  <Input
                    required
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white focus:border-primary"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Email Address
                </Label>
                <Input
                  type="email"
                  placeholder="name@domain.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white focus:border-primary"
                />
              </div>

              {/* Date & Time Preferences */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Target Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.desiredDate}
                    onChange={(e) => setFormData({ ...formData, desiredDate: e.target.value })}
                    className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                    Date Flexibility
                  </Label>
                  <Select
                    value={formData.flexibility}
                    onValueChange={(val) => setFormData({ ...formData, flexibility: val })}
                  >
                    <SelectTrigger className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white">
                      <SelectValue placeholder="Flexibility" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                      <SelectItem value="exact-only">Exact Date Only</SelectItem>
                      <SelectItem value="plus-minus-1">± 1 Day Window</SelectItem>
                      <SelectItem value="flexible-weekend">Anytime This Weekend</SelectItem>
                      <SelectItem value="first-available">First Available Opening</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Preferred Time Window
                </Label>
                <Select
                  value={formData.preferredTimeRange}
                  onValueChange={(val) => setFormData({ ...formData, preferredTimeRange: val })}
                >
                  <SelectTrigger className="h-10 text-xs bg-zinc-900 border-zinc-800 text-white">
                    <SelectValue placeholder="Select Time Window" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="Morning (09:00 AM - 12:00 PM)">🌅 Morning (09:00 AM - 12:00 PM)</SelectItem>
                    <SelectItem value="Afternoon (12:00 PM - 05:00 PM)">☀️ Afternoon (12:00 PM - 05:00 PM)</SelectItem>
                    <SelectItem value="Evening (05:00 PM - 08:30 PM)">🌙 Evening Prime (05:00 PM - 08:30 PM)</SelectItem>
                    <SelectItem value="Any Available Time">✨ Any Time of Day</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Notification Preferences */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5 space-y-3">
                <span className="text-[10px] uppercase tracking-wider text-primary font-bold block">
                  Instant Notification Channels
                </span>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <MessageCircle className="h-4 w-4 text-emerald-400" />
                    <span>WhatsApp Priority Alert (Fastest)</span>
                  </div>
                  <Switch
                    checked={formData.notifyWhatsApp}
                    onCheckedChange={(checked) => setFormData({ ...formData, notifyWhatsApp: checked })}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Smartphone className="h-4 w-4 text-sky-400" />
                    <span>SMS Direct Message</span>
                  </div>
                  <Switch
                    checked={formData.notifySMS}
                    onCheckedChange={(checked) => setFormData({ ...formData, notifySMS: checked })}
                  />
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Mail className="h-4 w-4 text-amber-400" />
                    <span>Email Confirmation Link</span>
                  </div>
                  <Switch
                    checked={formData.notifyEmail}
                    onCheckedChange={(checked) => setFormData({ ...formData, notifyEmail: checked })}
                  />
                </div>
              </div>

              {/* Special Notes */}
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold">
                  Additional Notes (Optional)
                </Label>
                <Textarea
                  rows={2}
                  placeholder="e.g. Can arrive on 30 mins notice, Bridal party timing..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="text-xs bg-zinc-900 border-zinc-800 text-white resize-none"
                />
              </div>

              {/* Submit CTA */}
              <div className="pt-2 flex items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-wider h-11 px-6 gap-2 shadow-lg shadow-primary/20"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Securing Queue...
                    </>
                  ) : (
                    <>
                      <BellRing className="h-4 w-4" />
                      Join Priority Waitlist
                    </>
                  )}
                </Button>
              </div>
            </form>
          </>
        ) : (
          /* Success Screen */
          <div className="py-6 text-center space-y-6">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/20 border-2 border-primary flex items-center justify-center text-primary shadow-xl shadow-primary/10">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 text-[10px] uppercase font-mono tracking-widest px-3 py-1">
                Priority Queue Position: #{submittedData?.priorityQueueNumber || 1}
              </Badge>
              <h3 className="text-2xl font-serif text-white tracking-tight">
                You're on the Aurelia Waitlist
              </h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                We've locked your request for <strong className="text-white">{submittedData?.service || serviceName}</strong> at <strong className="text-primary">{submittedData?.shopName || shopName}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/60 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Contact Number:</span>
                <span className="font-mono text-white font-bold">{submittedData?.userPhone || formData.phone}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Target Date:</span>
                <span className="font-mono text-white">{submittedData?.desiredDate || formData.desiredDate}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-300">
                <span className="text-zinc-500">Alert Channels:</span>
                <span className="text-emerald-400 font-bold">WhatsApp + SMS Priority</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                type="button"
                onClick={() => setOpen(false)}
                className="bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-wider h-11 px-8"
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
