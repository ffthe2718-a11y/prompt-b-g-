import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { 
  collection, 
  query, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  orderBy, 
  addDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { format } from "date-fns";
import { 
  Home, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Phone, 
  MapPin, 
  Navigation, 
  CreditCard, 
  ArrowUpDown, 
  Download, 
  ExternalLink, 
  Copy, 
  Clock, 
  Calendar, 
  DollarSign, 
  Trash2, 
  Eye, 
  Send, 
  RefreshCw, 
  Sparkles, 
  Check, 
  User, 
  Users,
  Layers,
  Building,
  Store,
  BarChart3,
  Scissors,
  Bell,
  BellRing,
} from "lucide-react";
import { toast } from "sonner";
import { useAppointmentReminders } from "@/hooks/useAppointmentReminders";
import { getTimeUntilAppointment } from "@/lib/reminderUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableBody,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, Navigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/exportUtils";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";

interface HomeServiceAppointment {
  id: string;
  name: string;
  phone?: string;
  service?: string;
  date?: string;
  time?: string;
  address?: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  status?: string;
  serviceType?: 'home' | 'salon';
  deliveryAddress?: {
    street?: string;
    landmark?: string;
    city?: string;
    pincode?: string;
    fullAddress?: string;
  } | null;
  distanceKm?: number;
  homeServiceFee?: number;
  subtotal?: number;
  totalAmount?: number;
  advanceRequired?: number;
  advanceAmountPaid?: number;
  remainingAmount?: number;
  advancePaid?: boolean;
  transactionId?: string | null;
  depositPaymentMethod?: string;
  depositPaidAt?: any;
  depositVerifiedBy?: string;
  notes?: string;
  createdAt: any;
}

export default function AdminHomeServices() {
  const { user, isAdmin, isOwner, loading } = useAuth();
  const [appointments, setAppointments] = useState<HomeServiceAppointment[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Proactive 24-hour Appointment Reminders
  const {
    permission: notifPermission,
    requestPermission: handleRequestPermission,
    triggerCheck: handleTrigger24hReminders,
    upcoming24hCount,
  } = useAppointmentReminders(appointments);

  // Filters and Search
  const [searchTerm, setSearchTerm] = useState("");
  const [depositFilter, setDepositFilter] = useState<"all" | "pending_deposit" | "verified_deposit" | "cancelled">("all");
  const [distanceTierFilter, setDistanceTierFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortKey, setSortKey] = useState<"createdAt" | "date" | "advanceRequired" | "distanceKm">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Verification Modal State
  const [verifyingAppointment, setVerifyingAppointment] = useState<HomeServiceAppointment | null>(null);
  const [verificationForm, setVerificationForm] = useState({
    transactionId: "",
    paymentMethod: "upi",
    verifiedAmount: 0,
    managerNotes: "",
  });
  const [isSubmittingVerification, setIsSubmittingVerification] = useState(false);

  // Details Modal State
  const [viewDetailsAppointment, setViewDetailsAppointment] = useState<HomeServiceAppointment | null>(null);

  // Delete / Cancel Confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Real-time listener for customer appointments
  useEffect(() => {
    if (!user || (!isAdmin && !isOwner)) return;

    const q = query(collection(db, "customers"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as HomeServiceAppointment[];

        // Filter for Home Services or records with delivery addresses / distances
        const homeRequests = docs.filter(
          (a) => a.serviceType === "home" || a.deliveryAddress || (a.homeServiceFee && a.homeServiceFee > 0)
        );

        setAppointments(homeRequests);
        setLoadingData(false);
      },
      (error) => {
        toast.error(getFriendlyErrorMessage(error));
        handleFirestoreError(error, OperationType.LIST, "customers");
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [user, isAdmin, isOwner]);

  // Compute metrics
  const metrics = useMemo(() => {
    const total = appointments.length;
    const pendingDeposit = appointments.filter((a) => !a.advancePaid && a.status !== "cancelled");
    const verifiedDeposit = appointments.filter((a) => a.advancePaid);
    const totalVerifiedAmount = verifiedDeposit.reduce((acc, curr) => acc + (curr.advanceAmountPaid || 0), 0);
    const totalPendingAmount = pendingDeposit.reduce((acc, curr) => {
      const due = curr.advanceRequired || Math.round((curr.totalAmount || 0) * 0.25);
      return acc + due;
    }, 0);
    const avgDistance = total > 0 ? (appointments.reduce((acc, curr) => acc + (curr.distanceKm || 0), 0) / total).toFixed(1) : "0";

    return {
      total,
      pendingCount: pendingDeposit.length,
      verifiedCount: verifiedDeposit.length,
      totalVerifiedAmount,
      totalPendingAmount,
      avgDistance,
    };
  }, [appointments]);

  // Filtered & Sorted appointments
  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((app) => {
        // Deposit Filter
        if (depositFilter === "pending_deposit") {
          if (app.advancePaid || app.status === "cancelled") return false;
        } else if (depositFilter === "verified_deposit") {
          if (!app.advancePaid) return false;
        } else if (depositFilter === "cancelled") {
          if (app.status !== "cancelled") return false;
        }

        // Distance Tier Filter
        if (distanceTierFilter === "tier1" && (app.distanceKm || 0) > 2) return false;
        if (distanceTierFilter === "tier2" && ((app.distanceKm || 0) <= 2 || (app.distanceKm || 0) > 5)) return false;
        if (distanceTierFilter === "tier3" && ((app.distanceKm || 0) <= 5 || (app.distanceKm || 0) > 10)) return false;
        if (distanceTierFilter === "tier4" && (app.distanceKm || 0) <= 10) return false;

        // Search Term
        if (searchTerm.trim()) {
          const s = searchTerm.toLowerCase();
          const matchesName = app.name?.toLowerCase().includes(s);
          const matchesPhone = app.phone?.toLowerCase().includes(s);
          const matchesService = app.service?.toLowerCase().includes(s);
          const matchesPincode = app.deliveryAddress?.pincode?.toLowerCase().includes(s);
          const matchesCity = app.deliveryAddress?.city?.toLowerCase().includes(s);
          const matchesStreet = app.deliveryAddress?.street?.toLowerCase().includes(s);
          const matchesTxn = app.transactionId?.toLowerCase().includes(s);

          if (!matchesName && !matchesPhone && !matchesService && !matchesPincode && !matchesCity && !matchesStreet && !matchesTxn) {
            return false;
          }
        }

        // Date Range Filter
        if (app.createdAt?.toDate) {
          const created = app.createdAt.toDate();
          if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            if (created < start) return false;
          }
          if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            if (created > end) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = 0;
        let valB: any = 0;

        if (sortKey === "createdAt") {
          valA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          valB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        } else if (sortKey === "date") {
          valA = a.date ? new Date(a.date).getTime() : 0;
          valB = b.date ? new Date(b.date).getTime() : 0;
        } else if (sortKey === "advanceRequired") {
          valA = a.advanceRequired || Math.round((a.totalAmount || 0) * 0.25);
          valB = b.advanceRequired || Math.round((b.totalAmount || 0) * 0.25);
        } else if (sortKey === "distanceKm") {
          valA = a.distanceKm || 0;
          valB = b.distanceKm || 0;
        }

        if (sortOrder === "asc") {
          return valA > valB ? 1 : -1;
        }
        return valA < valB ? 1 : -1;
      });
  }, [appointments, depositFilter, distanceTierFilter, searchTerm, startDate, endDate, sortKey, sortOrder]);

  // Open verification dialog
  const handleOpenVerifyModal = (app: HomeServiceAppointment) => {
    const defaultAdvance = app.advanceRequired || Math.round((app.totalAmount || 0) * 0.25);
    const autoTxn = "TXN_MGR_" + Math.random().toString(36).substring(2, 8).toUpperCase();

    setVerifyingAppointment(app);
    setVerificationForm({
      transactionId: app.transactionId || autoTxn,
      paymentMethod: app.depositPaymentMethod || "upi",
      verifiedAmount: defaultAdvance,
      managerNotes: `Verified 25% deposit of ₹${defaultAdvance} by manager ${user?.displayName || user?.email || "Admin"}.`,
    });
  };

  // Submit Verification
  const handleConfirmVerification = async () => {
    if (!verifyingAppointment) return;
    setIsSubmittingVerification(true);

    try {
      const verifiedAmount = Number(verificationForm.verifiedAmount) || 0;
      const total = verifyingAppointment.totalAmount || (verifyingAppointment.subtotal || 0) + (verifyingAppointment.homeServiceFee || 0);
      const remaining = Math.max(0, total - verifiedAmount);

      await updateDoc(doc(db, "customers", verifyingAppointment.id), {
        advancePaid: true,
        advanceAmountPaid: verifiedAmount,
        remainingAmount: remaining,
        status: "confirmed",
        transactionId: verificationForm.transactionId,
        depositPaymentMethod: verificationForm.paymentMethod,
        depositVerifiedBy: user?.displayName || user?.email || "Admin Manager",
        depositVerifiedAt: new Date().toISOString(),
        managerNotes: verificationForm.managerNotes,
      });

      // Post an admin notification
      try {
        await addDoc(collection(db, "notifications"), {
          title: "Home Service Advance Verified",
          message: `Manager verified ₹${verifiedAmount} deposit for ${verifyingAppointment.name} (${verifyingAppointment.service}). Appointment confirmed!`,
          read: false,
          type: "home_service_verified",
          appointmentId: verifyingAppointment.id,
          createdAt: serverTimestamp(),
        });
      } catch (notifErr) {
        console.warn("Notification logging skipped:", notifErr);
      }

      toast.success(`Advance payment of ₹${verifiedAmount} verified for ${verifyingAppointment.name}! Booking is now Confirmed.`);
      setVerifyingAppointment(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `customers/${verifyingAppointment.id}`);
    } finally {
      setIsSubmittingVerification(false);
    }
  };

  // Quick Action: Mark as Cancelled
  const handleCancelAppointment = async (id: string) => {
    try {
      await updateDoc(doc(db, "customers", id), {
        status: "cancelled",
      });
      toast.success("Home service request marked as cancelled.");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
    }
  };

  // Delete appointment
  const handleDeleteAppointment = async (id: string) => {
    try {
      await deleteDoc(doc(db, "customers", id));
      toast.success("Home service record deleted.");
      setConfirmDeleteId(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
    }
  };

  // WhatsApp reminder message
  const handleOpenWhatsApp = (app: HomeServiceAppointment) => {
    if (!app.phone) {
      toast.error("No phone number available for this client.");
      return;
    }
    const cleanPhone = app.phone.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const advanceDue = app.advanceRequired || Math.round((app.totalAmount || 0) * 0.25);
    const dateFormatted = app.date ? format(new Date(app.date), "dd MMM yyyy") : "your chosen date";

    let message = "";
    if (!app.advancePaid) {
      message = `Hello ${app.name}! 🌟 This is Aurelia Luxe regarding your At-Home Beauty Appointment for "${app.service}" on ${dateFormatted} at ${app.time || "scheduled time"}.\n\n⚠️ Policy Reminder: Your booking requires a mandatory 25% Advance Deposit of ₹${advanceDue} to be confirmed.\n\nPlease share your UPI/payment reference with us or complete payment in your Dashboard so we can confirm your specialist visit.\n\nThank you! ✨`;
    } else {
      message = `Hello ${app.name}! 🌟 Your At-Home Beauty appointment with Aurelia Luxe for "${app.service}" on ${dateFormatted} at ${app.time || "scheduled time"} has been CONFIRMED. Your 25% advance deposit of ₹${app.advanceAmountPaid} is verified.\n\nOur beauty specialist will arrive at your address: ${app.deliveryAddress?.fullAddress || app.address}.\n\nRemaining due at service: ₹${app.remainingAmount}.\n\nThank you for choosing Aurelia Luxe! ✨`;
    }

    window.open(`https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`, "_blank");
  };

  // Export Home Services to CSV
  const handleExportCSV = () => {
    const exportData = filteredAppointments.map((a) => ({
      ID: a.id,
      Client_Name: a.name,
      Phone: a.phone || "",
      Service: a.service || "",
      Date: a.date ? format(new Date(a.date), "yyyy-MM-dd") : "",
      Time: a.time || "",
      Service_Mode: "Home Service",
      Street_Address: a.deliveryAddress?.street || a.address || "",
      Landmark: a.deliveryAddress?.landmark || "",
      City: a.deliveryAddress?.city || "",
      Pincode: a.deliveryAddress?.pincode || "",
      Distance_Km: a.distanceKm || 0,
      Home_Service_Fee: a.homeServiceFee || 0,
      Subtotal: a.subtotal || 0,
      Total_Amount: a.totalAmount || 0,
      Advance_Required_25pct: a.advanceRequired || Math.round((a.totalAmount || 0) * 0.25),
      Advance_Paid: a.advancePaid ? "YES (Verified)" : "NO (Pending Deposit)",
      Advance_Amount_Paid: a.advanceAmountPaid || 0,
      Remaining_Balance_Due: a.remainingAmount || 0,
      Transaction_ID: a.transactionId || "",
      Status: a.status || "pending",
      Booked_At: a.createdAt?.toDate ? a.createdAt.toDate().toISOString() : "",
    }));

    exportToCSV(exportData, `home_service_requests_${new Date().toISOString().split("T")[0]}.csv`);
  };

  // Auth Protection Check
  if (!loading && (!user || (!isAdmin && !isOwner))) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Top Header & Breadcrumbs */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border"
        >
          <div>
            <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-widest text-primary font-bold">
              <Home className="h-4 w-4" />
              <span>Admin Control Center</span>
              <span>•</span>
              <span className="text-muted-foreground">At-Home Beauty & Grooming</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-light uppercase tracking-widest font-serif text-white flex items-center gap-3">
              Home Service Requests
              {metrics.pendingCount > 0 && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-xs uppercase tracking-widest font-mono py-1 px-3 animate-pulse">
                  {metrics.pendingCount} Pending Verification
                </Badge>
              )}
            </h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              Manage incoming door-step salon bookings, inspect delivery addresses, audit distance fees, and manually verify the mandatory 25% advance payment deposits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {notifPermission !== "granted" && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestPermission}
                className="border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs uppercase tracking-widest gap-1.5 font-bold"
              >
                <BellRing className="h-3.5 w-3.5" />
                Enable Push Alerts
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTrigger24hReminders({ forceTrigger: true, enableSound: true })}
              className={cn(
                "border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary text-xs uppercase tracking-widest gap-1.5 font-bold",
                upcoming24hCount > 0 && "bg-primary text-black hover:bg-primary/90"
              )}
            >
              <Bell className="h-3.5 w-3.5" />
              Trigger 24h Alerts ({upcoming24hCount})
            </Button>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-border bg-card hover:bg-white/5 text-xs uppercase tracking-widest gap-2"
            >
              <Link to="/admin">
                <Users className="h-3.5 w-3.5" />
                All Salon Bookings
              </Link>
            </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-primary/40 bg-primary/10 hover:bg-primary/20 text-primary text-xs uppercase tracking-widest gap-2 font-semibold"
              >
                <Link to="/admin/analytics">
                  <BarChart3 className="h-3.5 w-3.5" />
                  Analytics & Visualizations
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="border-border bg-card hover:bg-white/5 text-xs uppercase tracking-widest gap-2"
              >
                <Link to="/admin/shops">
                  <Store className="h-3.5 w-3.5" />
                  Master Dashboard
                </Link>
              </Button>
            <Button
              onClick={handleExportCSV}
              size="sm"
              className="bg-primary text-black hover:bg-primary/90 text-xs uppercase tracking-widest font-bold gap-2"
            >
              <Download className="h-3.5 w-3.5" />
              Export Home Manifest (CSV)
            </Button>
          </div>
        </motion.div>

        {/* Highlight Banner for Pending Deposit Action */}
        {metrics.pendingCount > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black border border-amber-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-amber-950/20"
          >
            <div className="flex items-start gap-3.5">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0 text-amber-400">
                <AlertTriangle className="h-5 w-5 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-amber-200 flex items-center gap-2">
                  Action Required: {metrics.pendingCount} Home Service {metrics.pendingCount === 1 ? 'Booking' : 'Bookings'} Awaiting Deposit Verification
                </h3>
                <p className="text-xs text-amber-300/80 mt-0.5">
                  Customers have booked home services with a total of <span className="font-bold text-white font-mono">₹{metrics.totalPendingAmount}</span> in pending 25% advance deposits. Verify their payments to confirm staff dispatch.
                </p>
              </div>
            </div>
            <Button
              onClick={() => setDepositFilter("pending_deposit")}
              className="bg-amber-400 text-black hover:bg-amber-300 text-xs uppercase tracking-wider font-bold shrink-0 h-9 px-4"
            >
              Filter Pending Deposits ({metrics.pendingCount})
            </Button>
          </motion.div>
        )}

        {/* KPI Metrics Summary Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card/70 border-border hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest flex items-center justify-between">
                <span>Pending 25% Deposits</span>
                <ShieldAlert className="h-4 w-4 text-amber-400" />
              </CardDescription>
              <CardTitle className="text-2xl font-light text-amber-400 font-mono flex items-baseline gap-2">
                {metrics.pendingCount}
                <span className="text-xs text-muted-foreground font-sans">requests</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Pending Volume:</span>
                <span className="font-mono text-white font-semibold">₹{metrics.totalPendingAmount}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest flex items-center justify-between">
                <span>Verified Advance Deposits</span>
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
              </CardDescription>
              <CardTitle className="text-2xl font-light text-emerald-400 font-mono flex items-baseline gap-2">
                ₹{metrics.totalVerifiedAmount}
                <span className="text-xs text-muted-foreground font-sans">collected</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Verified Bookings:</span>
                <span className="font-mono text-white font-semibold">{metrics.verifiedCount} confirmed</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest flex items-center justify-between">
                <span>Total Home Bookings</span>
                <Home className="h-4 w-4 text-primary" />
              </CardDescription>
              <CardTitle className="text-2xl font-light text-white font-mono">
                {metrics.total}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Verification Rate:</span>
                <span className="font-mono text-white font-semibold">
                  {metrics.total > 0 ? Math.round((metrics.verifiedCount / metrics.total) * 100) : 0}%
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card/70 border-border hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase tracking-widest flex items-center justify-between">
                <span>Avg Delivery Radius</span>
                <Navigation className="h-4 w-4 text-purple-400" />
              </CardDescription>
              <CardTitle className="text-2xl font-light text-white font-mono flex items-baseline gap-1">
                {metrics.avgDistance} <span className="text-sm font-sans text-muted-foreground">km</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Dynamic Tiering:</span>
                <span className="font-mono text-purple-300 font-semibold">Active Rules</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Bar & Controls */}
        <div className="space-y-4 p-5 rounded-2xl bg-card border border-border">
          {/* Main Search & Status Filter Chips */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name, mobile, service, street, city, pincode, or Txn ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-black/40 border-border text-xs focus:border-primary"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setDepositFilter("all")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold border transition-all",
                  depositFilter === "all"
                    ? "bg-primary text-black border-primary font-bold shadow-sm"
                    : "bg-black/30 text-muted-foreground border-border hover:text-white"
                )}
              >
                All ({appointments.length})
              </button>

              <button
                type="button"
                onClick={() => setDepositFilter("pending_deposit")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold border transition-all flex items-center gap-1.5",
                  depositFilter === "pending_deposit"
                    ? "bg-amber-500 text-black border-amber-400 font-bold shadow-sm shadow-amber-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                )}
              >
                <AlertTriangle className="h-3 w-3" />
                Pending Deposit ({metrics.pendingCount})
              </button>

              <button
                type="button"
                onClick={() => setDepositFilter("verified_deposit")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold border transition-all flex items-center gap-1.5",
                  depositFilter === "verified_deposit"
                    ? "bg-emerald-500 text-black border-emerald-400 font-bold shadow-sm shadow-emerald-500/20"
                    : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                )}
              >
                <CheckCircle2 className="h-3 w-3" />
                Verified ({metrics.verifiedCount})
              </button>

              <button
                type="button"
                onClick={() => setDepositFilter("cancelled")}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider font-semibold border transition-all",
                  depositFilter === "cancelled"
                    ? "bg-red-500 text-white border-red-400 font-bold"
                    : "bg-black/30 text-muted-foreground border-border hover:text-white"
                )}
              >
                Cancelled
              </button>
            </div>
          </div>

          {/* Secondary Filters: Distance Tier & Date Ranges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border/50 text-xs">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Distance Tier</Label>
              <Select value={distanceTierFilter} onValueChange={setDistanceTierFilter}>
                <SelectTrigger className="h-8 bg-black/40 border-border text-xs">
                  <SelectValue placeholder="All Distances" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="all">All Distances</SelectItem>
                  <SelectItem value="tier1">Up to 2 km (₹99 fee)</SelectItem>
                  <SelectItem value="tier2">2 km to 5 km (₹199 fee)</SelectItem>
                  <SelectItem value="tier3">5 km to 10 km (₹349 fee)</SelectItem>
                  <SelectItem value="tier4">Above 10 km (₹349 + ₹35/km)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Sort By</Label>
              <Select value={sortKey} onValueChange={(val: any) => setSortKey(val)}>
                <SelectTrigger className="h-8 bg-black/40 border-border text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  <SelectItem value="createdAt">Booking Received Date</SelectItem>
                  <SelectItem value="date">Appointment Service Date</SelectItem>
                  <SelectItem value="advanceRequired">Deposit Amount Due</SelectItem>
                  <SelectItem value="distanceKm">Delivery Distance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">From Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 bg-black/40 border-border text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 bg-black/40 border-border text-xs"
              />
            </div>
          </div>
        </div>

        {/* Main Requests Table */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
          <div className="p-4 bg-muted/20 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-widest font-semibold text-white">
                Showing {filteredAppointments.length} Home Service {filteredAppointments.length === 1 ? 'Request' : 'Requests'}
              </span>
              {depositFilter === "pending_deposit" && (
                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] uppercase tracking-widest">
                  Filtered to Pending Deposits
                </Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Click <span className="text-primary font-bold">"Verify Deposit"</span> to confirm advance payments.
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Client & Contact</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Service & Schedule</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Delivery Address</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Distance & Fee</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Price & 25% Deposit</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Deposit Status</TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {loadingData ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
                        <span className="text-xs uppercase tracking-widest">Loading incoming home services...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-16 text-muted-foreground">
                      <div className="flex flex-col items-center gap-3">
                        <Home className="h-8 w-8 opacity-30 text-primary" />
                        <p className="text-sm font-light uppercase tracking-wider text-zinc-300">
                          No home service requests found matching current filters.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSearchTerm("");
                            setDepositFilter("all");
                            setDistanceTierFilter("all");
                            setStartDate("");
                            setEndDate("");
                          }}
                          className="h-8 text-xs border-border text-primary"
                        >
                          Clear All Filters
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((app) => {
                    const isPendingDeposit = !app.advancePaid && app.status !== "cancelled";
                    const advanceDue = app.advanceRequired || Math.round((app.totalAmount || 0) * 0.25);
                    const remaining = app.remainingAmount || Math.max(0, (app.totalAmount || 0) - advanceDue);

                    return (
                      <TableRow
                        key={app.id}
                        className={cn(
                          "border-border hover:bg-white/5 transition-colors",
                          isPendingDeposit && "bg-amber-500/[0.04] border-l-4 border-l-amber-400"
                        )}
                      >
                        {/* Client & Contact */}
                        <TableCell className="align-top py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                              {app.name}
                            </span>
                            {app.phone && (
                              <a
                                href={`tel:${app.phone}`}
                                className="text-xs text-primary hover:underline flex items-center gap-1 mt-1 font-mono"
                              >
                                <Phone className="h-3 w-3" />
                                {app.phone}
                              </a>
                            )}
                            {app.userEmail && (
                              <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[140px]">
                                {app.userEmail}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Service & Schedule */}
                        <TableCell className="align-top py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-zinc-200">
                              {app.service || "Salon Service"}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-zinc-400 mt-1 font-mono">
                              <Calendar className="h-3 w-3 text-primary" />
                              <span>{app.date ? format(new Date(app.date), "dd MMM yyyy") : "Date TBD"}</span>
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-zinc-400 mt-0.5 font-mono">
                              <Clock className="h-3 w-3 text-zinc-500" />
                              <span>{app.time || "Slot TBD"}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Delivery Address */}
                        <TableCell className="align-top py-4">
                          <div className="flex flex-col max-w-[200px]">
                            {app.deliveryAddress ? (
                              <>
                                <span className="text-xs text-zinc-200 font-medium line-clamp-2">
                                  {app.deliveryAddress.street || app.address || "Street specified"}
                                </span>
                                {app.deliveryAddress.landmark && (
                                  <span className="text-[11px] text-amber-400/90 italic">
                                    Near {app.deliveryAddress.landmark}
                                  </span>
                                )}
                                <span className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                                  {app.deliveryAddress.city || "Mumbai"} - {app.deliveryAddress.pincode || "400001"}
                                </span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const full = app.deliveryAddress?.fullAddress || `${app.deliveryAddress?.street}, ${app.deliveryAddress?.landmark || ''}, ${app.deliveryAddress?.city} - ${app.deliveryAddress?.pincode}`;
                                      navigator.clipboard.writeText(full);
                                      toast.success("Address copied to clipboard!");
                                    }}
                                    className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-mono"
                                  >
                                    <Copy className="h-2.5 w-2.5" /> Copy
                                  </button>
                                  <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(app.deliveryAddress?.fullAddress || `${app.deliveryAddress?.street} ${app.deliveryAddress?.city} ${app.deliveryAddress?.pincode}`)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] text-zinc-400 hover:text-white flex items-center gap-0.5"
                                  >
                                    <ExternalLink className="h-2.5 w-2.5" /> Map
                                  </a>
                                </div>
                              </>
                            ) : (
                              <span className="text-xs text-zinc-400 italic">
                                {app.address || "Standard location"}
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Distance & Fee */}
                        <TableCell className="align-top py-4">
                          <div className="flex flex-col">
                            <Badge variant="outline" className="bg-purple-500/10 text-purple-300 border-purple-500/30 text-[10px] w-fit font-mono">
                              🚗 {app.distanceKm || 0} km
                            </Badge>
                            <span className="text-xs font-mono text-zinc-300 mt-1">
                              Fee: +₹{app.homeServiceFee || 0}
                            </span>
                            {(app.distanceKm || 0) > 10 && (
                              <span className="text-[9px] text-amber-400 uppercase font-mono">
                                Extended Radius
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Price & 25% Deposit */}
                        <TableCell className="align-top py-4">
                          <div className="flex flex-col text-xs font-mono">
                            <div className="text-zinc-400 flex justify-between gap-2">
                              <span>Total:</span>
                              <span className="text-white font-bold">₹{app.totalAmount || 0}</span>
                            </div>
                            <div className="text-amber-300 font-bold flex justify-between gap-2 mt-0.5">
                              <span>25% Adv:</span>
                              <span>₹{advanceDue}</span>
                            </div>
                            <div className="text-zinc-400 text-[10px] flex justify-between gap-2 mt-0.5">
                              <span>Due on visit:</span>
                              <span>₹{remaining}</span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Deposit Status */}
                        <TableCell className="align-top py-4">
                          {isPendingDeposit ? (
                            <div className="flex flex-col gap-1">
                              <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px] uppercase tracking-wider font-bold py-1 flex items-center gap-1 w-fit animate-pulse">
                                <AlertTriangle className="h-3 w-3" />
                                Pending Deposit
                              </Badge>
                              <span className="text-[10px] text-amber-200/80 italic leading-tight">
                                Mandatory 25% (₹{advanceDue}) required
                              </span>
                            </div>
                          ) : app.advancePaid ? (
                            <div className="flex flex-col gap-1">
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/40 text-[10px] uppercase tracking-wider font-bold py-0.5 flex items-center gap-1 w-fit">
                                <CheckCircle2 className="h-3 w-3" />
                                25% Verified
                              </Badge>
                              <span className="text-[10px] text-emerald-300 font-mono">
                                Paid: ₹{app.advanceAmountPaid || advanceDue}
                              </span>
                              {app.transactionId && (
                                <span className="text-[9px] text-zinc-400 font-mono truncate max-w-[120px]" title={app.transactionId}>
                                  Txn: {app.transactionId}
                                </span>
                              )}
                            </div>
                          ) : (
                            <Badge variant="outline" className="text-[10px] uppercase text-zinc-400 border-zinc-700">
                              {app.status || "Pending"}
                            </Badge>
                          )}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="align-top py-4 text-right">
                          <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-1.5">
                            {isPendingDeposit ? (
                              <Button
                                size="sm"
                                onClick={() => handleOpenVerifyModal(app)}
                                className="h-8 bg-amber-400 hover:bg-amber-300 text-black text-xs uppercase tracking-wider font-bold gap-1 shadow-md shadow-amber-950/40"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Verify Deposit
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setViewDetailsAppointment(app)}
                                className="h-8 text-xs uppercase tracking-wider border-border bg-card text-zinc-200 hover:bg-white/5 gap-1"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View Details
                              </Button>
                            )}

                            {/* WhatsApp Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  onClick={() => handleOpenWhatsApp(app)}
                                  className="h-8 w-8 text-emerald-400 border-emerald-500/30 hover:bg-emerald-950/30"
                                >
                                  <Send className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Message via WhatsApp</TooltipContent>
                            </Tooltip>

                            {/* Delete Button */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => setConfirmDeleteId(app.id)}
                                  className="h-8 w-8 text-zinc-500 hover:text-red-400"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Request</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Modal: Manual 25% Advance Payment Verification */}
        <Dialog open={!!verifyingAppointment} onOpenChange={(open) => !open && setVerifyingAppointment(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[560px] p-0 overflow-hidden max-h-[92vh] flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-zinc-900 bg-amber-500/10">
              <div className="flex items-center gap-2 text-amber-400 text-xs uppercase tracking-widest font-bold mb-1">
                <ShieldCheck className="h-4 w-4" />
                Manager Deposit Verification
              </div>
              <DialogTitle className="text-xl font-bold uppercase tracking-tight italic">
                Verify 25% Advance Payment
              </DialogTitle>
              <DialogDescription className="text-xs text-zinc-400 mt-1">
                Confirm that the customer's 25% booking deposit has been received to confirm the home service visit.
              </DialogDescription>
            </DialogHeader>

            {verifyingAppointment && (
              <div className="overflow-y-auto p-6 space-y-5 flex-1">
                {/* Client & Booking Summary Card */}
                <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Client Name:</span>
                    <span className="font-semibold text-white">{verifyingAppointment.name} ({verifyingAppointment.phone})</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Service:</span>
                    <span className="font-semibold text-white">{verifyingAppointment.service}</span>
                  </div>
                  <div className="flex justify-between items-start pt-1.5 border-t border-zinc-800/80">
                    <span className="text-zinc-400">Delivery Address:</span>
                    <span className="text-right text-zinc-200 max-w-[280px]">
                      {verifyingAppointment.deliveryAddress?.fullAddress || verifyingAppointment.address}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1.5 border-t border-zinc-800/80">
                    <span className="text-zinc-400">Distance & Fee:</span>
                    <span className="font-mono text-purple-300">{verifyingAppointment.distanceKm || 0} km (+₹{verifyingAppointment.homeServiceFee || 0})</span>
                  </div>
                </div>

                {/* Price Breakdown Calculation */}
                <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 to-black border border-amber-500/30 space-y-2 text-xs">
                  <div className="flex justify-between text-zinc-300">
                    <span>Total Booking Value:</span>
                    <span className="font-mono font-semibold">₹{verifyingAppointment.totalAmount || 0}</span>
                  </div>
                  <div className="flex justify-between text-amber-300 font-bold text-sm pt-1 border-t border-zinc-800">
                    <span className="flex items-center gap-1.5">
                      <ShieldAlert className="h-4 w-4 text-amber-400" />
                      Mandatory 25% Advance Required:
                    </span>
                    <span className="font-mono text-base">
                      ₹{verifyingAppointment.advanceRequired || Math.round((verifyingAppointment.totalAmount || 0) * 0.25)}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400 text-[11px]">
                    <span>Remaining Balance Due on Visit:</span>
                    <span className="font-mono">
                      ₹{Math.max(0, (verifyingAppointment.totalAmount || 0) - (verificationForm.verifiedAmount || 0))}
                    </span>
                  </div>
                </div>

                {/* Manager Verification Inputs */}
                <div className="space-y-4 pt-1">
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                      Verified Deposit Amount (₹)
                    </Label>
                    <Input
                      type="number"
                      value={verificationForm.verifiedAmount}
                      onChange={(e) => setVerificationForm({ ...verificationForm, verifiedAmount: Number(e.target.value) })}
                      className="bg-zinc-900 border-zinc-800 font-mono text-base text-white h-10"
                      min={1}
                      max={verifyingAppointment.totalAmount || 100000}
                    />
                    <span className="text-[10px] text-zinc-500">
                      Standard 25% deposit is pre-filled. Adjust if the customer paid a custom advance.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                        Payment Method
                      </Label>
                      <Select
                        value={verificationForm.paymentMethod}
                        onValueChange={(val) => setVerificationForm({ ...verificationForm, paymentMethod: val })}
                      >
                        <SelectTrigger className="bg-zinc-900 border-zinc-800 text-xs text-white h-10">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-800">
                          <SelectItem value="upi">UPI (GPay, PhonePe, Paytm)</SelectItem>
                          <SelectItem value="neft_imps">Bank Transfer (IMPS / NEFT)</SelectItem>
                          <SelectItem value="cash_advance">Cash Advance at Counter</SelectItem>
                          <SelectItem value="card_pos">Card POS Terminal</SelectItem>
                          <SelectItem value="online_portal">Online Gateway</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                        Transaction / Reference ID
                      </Label>
                      <Input
                        value={verificationForm.transactionId}
                        onChange={(e) => setVerificationForm({ ...verificationForm, transactionId: e.target.value })}
                        placeholder="e.g. UPI-9382710482"
                        className="bg-zinc-900 border-zinc-800 font-mono text-xs text-white h-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                      Manager Verification Note
                    </Label>
                    <Input
                      value={verificationForm.managerNotes}
                      onChange={(e) => setVerificationForm({ ...verificationForm, managerNotes: e.target.value })}
                      placeholder="e.g. Payment verified via ICICI Bank SMS alert"
                      className="bg-zinc-900 border-zinc-800 text-xs text-white h-10"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-4 border-t border-zinc-900 flex sm:justify-between items-center gap-3">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setVerifyingAppointment(null)}
                    className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirmVerification}
                    disabled={isSubmittingVerification || !verificationForm.verifiedAmount}
                    className="bg-amber-400 text-black hover:bg-amber-300 font-bold uppercase tracking-widest text-xs h-11 px-8 rounded-none shadow-lg shadow-amber-950/40 flex items-center gap-2"
                  >
                    {isSubmittingVerification ? (
                      <>
                        <div className="h-4 w-4 border-2 border-black border-t-transparent animate-spin rounded-full" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" />
                        Verify & Confirm Booking
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal: View Full Details */}
        <Dialog open={!!viewDetailsAppointment} onOpenChange={(open) => !open && setViewDetailsAppointment(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[500px] p-6 space-y-4">
            <DialogHeader>
              <DialogTitle className="text-xl font-light uppercase tracking-widest">
                Home Service Booking Details
              </DialogTitle>
            </DialogHeader>

            {viewDetailsAppointment && (
              <div className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Client:</span>
                    <span className="font-semibold text-white">{viewDetailsAppointment.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Phone:</span>
                    <span className="font-mono text-primary">{viewDetailsAppointment.phone || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Service:</span>
                    <span className="text-white">{viewDetailsAppointment.service}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Date & Time:</span>
                    <span className="font-mono text-zinc-200">
                      {viewDetailsAppointment.date ? format(new Date(viewDetailsAppointment.date), "dd MMM yyyy") : "N/A"} at {viewDetailsAppointment.time}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Delivery Address</div>
                  <p className="text-zinc-200 leading-relaxed">
                    {viewDetailsAppointment.deliveryAddress?.fullAddress || viewDetailsAppointment.address}
                  </p>
                  <div className="flex justify-between text-purple-300 font-mono pt-1 border-t border-zinc-800">
                    <span>Distance:</span>
                    <span>{viewDetailsAppointment.distanceKm || 0} km (Fee: ₹{viewDetailsAppointment.homeServiceFee || 0})</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 space-y-2">
                  <div className="text-xs uppercase tracking-widest text-zinc-400 font-bold">Payment & Deposit Audit</div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Total Price:</span>
                    <span className="font-mono font-semibold text-white">₹{viewDetailsAppointment.totalAmount || 0}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400">
                    <span>Advance Deposit Status:</span>
                    <span className="font-bold">{viewDetailsAppointment.advancePaid ? "VERIFIED & PAID" : "PENDING DEPOSIT"}</span>
                  </div>
                  {viewDetailsAppointment.advancePaid && (
                    <>
                      <div className="flex justify-between font-mono">
                        <span className="text-zinc-400">Verified Amount:</span>
                        <span>₹{viewDetailsAppointment.advanceAmountPaid}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-zinc-400">Transaction ID:</span>
                        <span>{viewDetailsAppointment.transactionId || "N/A"}</span>
                      </div>
                      <div className="flex justify-between font-mono">
                        <span className="text-zinc-400">Remaining Balance:</span>
                        <span>₹{viewDetailsAppointment.remainingAmount}</span>
                      </div>
                    </>
                  )}
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    onClick={() => setViewDetailsAppointment(null)}
                    className="w-full bg-primary text-black hover:bg-primary/90 text-xs uppercase font-bold"
                  >
                    Close
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal: Delete Confirmation */}
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-lg font-light uppercase tracking-wider text-red-400">
                Delete Home Service Record?
              </DialogTitle>
            </DialogHeader>
            <p className="text-xs text-zinc-400 py-2">
              Are you sure you want to delete this home service booking record? This action cannot be undone.
            </p>
            <DialogFooter className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmDeleteId(null)}
                className="text-xs border-border bg-card"
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmDeleteId && handleDeleteAppointment(confirmDeleteId)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Yes, Delete Record
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
