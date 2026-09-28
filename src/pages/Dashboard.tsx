import React, { useState, useEffect, useMemo } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, orderBy, getDoc, setDoc, addDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Edit2, User, Phone, Mail, Droplets, Download, Repeat, Bell, Globe, ArrowRight, Eye, Check, Trash2, Clock, Calendar, XCircle, ArrowUpDown, Crown, Sparkles, Trophy, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import LoyaltyRewards from "@/components/LoyaltyRewards";
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
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/AuthModal";
import { exportToCSV } from "@/lib/exportUtils";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";

import { ROLES, SALON_SERVICES } from "@/constants";

interface Appointment {
  id: string;
  name: string;
  phone?: string;
  service?: string;
  shopId?: string;
  date?: string;
  time?: string;
  address?: string;
  userId: string;
  status?: string;
  isRecurring?: boolean;
  frequency?: string;
  duration?: string;
  createdAt: any;
}

export default function Dashboard() {
  const { user, isAdmin, isOwner, isVendor, profile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState("appointments");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vendorShop, setVendorShop] = useState<any>(null);
  const [allShops, setAllShops] = useState<any[]>([]);
  const [isEditing, setIsEditing] = useState<Appointment | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Appointment>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dynamicServices, setDynamicServices] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Review states for appointment feedback
  const [reviewAppointment, setReviewAppointment] = useState<Appointment | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewRecommend, setReviewRecommend] = useState(true);
  const [reviewTags, setReviewTags] = useState<string[]>([]);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [userReviews, setUserReviews] = useState<Record<string, any>>({});

  const qualifyingVisits = useMemo(() => {
    return appointments.filter(a => a.status === 'completed' || a.status === 'confirmed' || a.status === 'pending');
  }, [appointments]);
  const isGoldMember = qualifyingVisits.length >= 5;

  useEffect(() => {
    const servicesRef = collection(db, "services");
    const q = query(servicesRef, orderBy("createdAt", "asc"));

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

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  // Profile State
  const [profileData, setProfileData] = useState({
    displayName: "",
    phone: "",
    email: "",
    role: "User",
    emailReminders: true,
    smsReminders: false
  });
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete' | 'cancel', id: string } | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: keyof Appointment | 'schedule'; direction: 'asc' | 'desc' } | null>(null);

  const requestSort = (key: keyof Appointment | 'schedule') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedData = (data: Appointment[]) => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      let aValue: any = a[sortConfig.key as keyof Appointment];
      let bValue: any = b[sortConfig.key as keyof Appointment];

      if (sortConfig.key === 'schedule') {
        const aDate = new Date(a.date || 0).getTime();
        const bDate = new Date(b.date || 0).getTime();
        return sortConfig.direction === 'asc' ? aDate - bDate : bDate - aDate;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  useEffect(() => {
    if (!user) return;

    // Fetch Appointments based on Role
    const appointmentsRef = collection(db, "customers");
    let q;

    if (isOwner || isAdmin) {
      // Platform Admins see everything
      q = query(appointmentsRef, orderBy("createdAt", "desc"));
    } else if (isVendor && profile?.shopId) {
      // Vendors see only their shop's bookings
      q = query(appointmentsRef, where("shopId", "==", profile.shopId), orderBy("createdAt", "desc"));
    } else {
      // Regular users see only their own bookings
      q = query(appointmentsRef, where("userId", "==", user.uid), orderBy("createdAt", "desc"));
    }

    const unsubscribeAppointments = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      setAppointments(docs);
    }, (error) => {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.LIST, "customers");
    });

    // Fetch Profile
    if (profile) {
      setProfileData({
        displayName: profile.displayName || user.displayName || "",
        phone: profile.phone || "",
        email: profile.email || user.email || "",
        role: profile.role || "User",
        emailReminders: profile.emailReminders !== undefined ? profile.emailReminders : true,
        smsReminders: profile.smsReminders !== undefined ? profile.smsReminders : false
      });
    }

    return () => unsubscribeAppointments();
  }, [user, profile]);

  // Fetch all shops for name and link resolution across all user appointments
  useEffect(() => {
    const shopsRef = collection(db, "shops");
    const unsubscribe = onSnapshot(shopsRef, (snapshot) => {
      setAllShops(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  // Listen to reviews written by this user to mark appointments as reviewed
  useEffect(() => {
    if (!user) {
      setUserReviews({});
      return;
    }
    const reviewsRef = collection(db, "reviews");
    const q = query(reviewsRef, where("userId", "==", user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const map: Record<string, any> = {};
      snapshot.docs.forEach((d) => {
        const data = d.data();
        if (data.appointmentId) {
          map[data.appointmentId] = { id: d.id, ...data };
        }
      });
      setUserReviews(map);
    });
    return () => unsubscribe();
  }, [user]);

  const getShopInfo = (shopId?: string) => {
    if (!shopId || shopId === "aurelia-luxe-main") {
      return { name: "Aurelia Luxe Flagship", slug: "" };
    }
    const found = allShops.find((s) => s.id === shopId || s.slug === shopId);
    return { name: found?.name || "Partner Salon", slug: found?.slug || "" };
  };

  useEffect(() => {
    if (!isVendor || !profile?.shopId) return;
    const shopRef = doc(db, "shops", profile.shopId);
    const unsubscribe = onSnapshot(shopRef, (docSnap) => {
      if (docSnap.exists()) setVendorShop({ id: docSnap.id, ...docSnap.data() });
    });
    return () => unsubscribe();
  }, [isVendor, profile?.shopId]);

  useEffect(() => {
    if (!user || (profile?.role !== 'Owner' && !isAdmin)) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(docs);
      setUnreadCount(docs.filter((n: any) => !n.read).length);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "notifications");
    });

    return () => unsubscribe();
  }, [user, profile, isAdmin]);

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `notifications/${id}`);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true })));
      toast.success("All notifications marked as read");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "notifications");
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
      toast.success("Notification deleted");
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `notifications/${id}`);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSavingProfile(true);
    try {
      await setDoc(doc(db, "users", user.uid), {
        ...profileData,
        uid: user.uid,
        email: user.email,
      }, { merge: true });
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "customers", id));
      toast.success("Appointment deleted successfully");
      setConfirmAction(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
    }
  };

  const handleCancel = async (id: string) => {
    try {
      await updateDoc(doc(db, "customers", id), {
        status: 'cancelled'
      });
      toast.success("Appointment cancelled successfully");
      setConfirmAction(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
    }
  };

  const handleEditClick = (appointment: Appointment) => {
    setIsEditing(appointment);
    setEditFormData({
      name: appointment.name,
      phone: appointment.phone || "",
      service: appointment.service || "",
      date: appointment.date || "",
      time: appointment.time || "",
      address: appointment.address || "",
      status: appointment.status || "pending"
    });
  };

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "customers", id), {
        status: newStatus
      });
      toast.success(`Status updated to ${newStatus}`);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `customers/${id}`);
    }
  };

  const handleUpdate = async () => {
    if (!isEditing) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "customers", isEditing.id), {
        ...editFormData
      });
      toast.success("Appointment updated successfully");
      setIsEditing(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `customers/${isEditing.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReviewTag = (tag: string) => {
    setReviewTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitAppointmentReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !reviewAppointment) return;

    if (!reviewTitle.trim() || !reviewComment.trim()) {
      toast.error("Please provide both a review headline and comments.");
      return;
    }

    if (reviewComment.trim().length < 15) {
      toast.error("Please write at least 15 characters to provide helpful details.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const targetShopId = reviewAppointment.shopId || "aurelia-luxe-main";
      await addDoc(collection(db, "reviews"), {
        shopId: targetShopId,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Valued Client",
        userPhoto: user.photoURL || "",
        rating: Number(reviewRating),
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
        service: reviewAppointment.service || "Salon Treatment",
        appointmentId: reviewAppointment.id,
        verifiedBooking: true,
        recommend: Boolean(reviewRecommend),
        tags: reviewTags,
        helpfulCount: 0,
        createdAt: serverTimestamp()
      });

      // Update shop rating if we can find the shop document
      try {
        const found = allShops.find(s => s.id === targetShopId || s.slug === targetShopId);
        if (found) {
          const currentCount = found.ratingCount || 0;
          const currentAvg = found.rating || 5;
          const newCount = currentCount + 1;
          const newAvg = Number(((currentAvg * currentCount + reviewRating) / newCount).toFixed(1));
          await updateDoc(doc(db, "shops", found.id), {
            rating: newAvg,
            ratingCount: newCount
          });
        }
      } catch (shopErr) {
        console.log("Shop aggregate update skipped/deferred:", shopErr);
      }

      toast.success("Thank you! Your verified appointment review has been published.");
      setReviewAppointment(null);
      setReviewComment("");
      setReviewTitle("");
      setReviewTags([]);
      setReviewRating(5);
    } catch (err) {
      console.error("Failed to post appointment review:", err);
      toast.error("Failed to submit review.");
      handleFirestoreError(err, OperationType.CREATE, "reviews");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const now = new Date();
  const upcomingAppointments = useMemo(() => {
    const filtered = appointments.filter(app => {
      if (!app.date) return true;
      const appDate = new Date(app.date);
      return appDate >= new Date(now.setHours(0,0,0,0));
    });
    return getSortedData(filtered);
  }, [appointments, sortConfig]);

  const pastAppointments = useMemo(() => {
    const filtered = appointments.filter(app => {
      if (!app.date) return false;
      const appDate = new Date(app.date);
      return appDate < new Date(now.setHours(0,0,0,0));
    });
    return getSortedData(filtered);
  }, [appointments, sortConfig]);

  // Metrics Calculations
  const stats = {
    totalRevenue: appointments
      .filter(a => a.status === 'completed' || a.status === 'confirmed')
      .reduce((acc, a) => {
        const service = allServices.find(s => s.name === a.service);
        return acc + (service?.price || 0);
      }, 0),
    totalBookings: appointments.length,
    completedBookings: appointments.filter(a => a.status === 'completed').length,
    platformCommission: 0,
    activeShops: allShops.filter(s => s.isActive).length
  };
  stats.platformCommission = stats.totalRevenue * 0.1; // 10% Platform fee

  if (loading) return null;

  return (
    <div className="bg-background min-h-screen py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
            {profile?.role === 'Owner' ? 'Business Intelligence' : 
             profile?.role === 'Admin' ? 'Management Center' : 
             'Personalized Care'}
          </span>
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">
            {isOwner ? 'OWNER' : isAdmin ? 'ADMIN' : isVendor ? 'VENDOR' : 'USER'} <span className="italic text-primary">DASHBOARD</span>
          </h1>
        </motion.div>

        {(isOwner || isVendor) && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
            <Card className="bg-card border-border shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase tracking-widest">
                  {isOwner ? "Global Revenue" : "Shop Revenue"}
                </CardDescription>
                <CardTitle className="text-2xl font-bold text-primary">
                  ₹{stats.totalRevenue.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase tracking-widest">
                  {isOwner ? "Platform Fee (10%)" : "Total Sessions"}
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {isOwner ? `₹${stats.platformCommission.toLocaleString()}` : stats.totalBookings}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="bg-card border-border shadow-lg">
              <CardHeader className="pb-2">
                <CardDescription className="text-[10px] uppercase tracking-widest">
                  {isOwner ? "Total Shops" : "Completion Rate"}
                </CardDescription>
                <CardTitle className="text-2xl font-bold">
                  {isOwner ? allShops.length : `${Math.round((stats.completedBookings / (stats.totalBookings || 1)) * 100)}%`}
                </CardTitle>
              </CardHeader>
            </Card>
            {isOwner && (
              <Card className="bg-card border-border shadow-lg">
                <CardHeader className="pb-2">
                  <CardDescription className="text-[10px] uppercase tracking-widest">Active Shops</CardDescription>
                  <CardTitle className="text-2xl font-bold text-green-500">{stats.activeShops}</CardTitle>
                </CardHeader>
              </Card>
            )}
          </div>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 bg-card border border-border">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-primary data-[state=active]:text-black">My Appointments</TabsTrigger>
            <TabsTrigger value="loyalty" className="data-[state=active]:bg-primary data-[state=active]:text-black flex items-center gap-1.5">
              <Crown className="h-4 w-4 text-amber-400" />
              Loyalty Rewards
              {isGoldMember ? (
                <span className="bg-amber-400 text-black text-[9px] px-1.5 py-0.5 rounded font-bold leading-none">GOLD</span>
              ) : (
                <span className="text-[10px] text-primary font-mono bg-primary/10 px-1.5 py-0.5 rounded leading-none">
                  {qualifyingVisits.length}/5
                </span>
              )}
            </TabsTrigger>
            {(profile?.role === 'Owner' || isAdmin || isVendor) && (
              <TabsTrigger value="shop" className="data-[state=active]:bg-primary data-[state=active]:text-black">Shop Landing Page</TabsTrigger>
            )}
            <TabsTrigger value="notifications" className="data-[state=active]:bg-primary data-[state=active]:text-black relative">
              Notifications
              {unreadCount > 0 && (
                <span className="ml-2 bg-primary text-black h-4 w-4 rounded-full flex items-center justify-center text-[10px] font-bold">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-black">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            {/* Loyalty Rewards Quick Progress Bar & Repeat Booking Incentive */}
            <div className="mb-8 rounded-2xl border border-primary/25 bg-gradient-to-r from-card via-primary/5 to-card p-5 sm:p-6 shadow-md">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-400/10">
                    <Crown className="h-6 w-6 sm:h-7 sm:w-7 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary">
                        Loyalty Rewards
                      </span>
                      <Badge className={cn(
                        "text-[9px] uppercase tracking-wider font-bold px-1.5 py-0 h-4 leading-none",
                        isGoldMember ? "bg-amber-400 text-black border-amber-300" : "bg-primary/20 text-primary border-primary/30"
                      )}>
                        {isGoldMember ? "★ Gold Member" : "Path to Gold"}
                      </Badge>
                    </div>
                    <h3 className="text-base sm:text-lg font-light tracking-tight text-foreground">
                      {isGoldMember
                        ? "You've achieved Gold Member status! Enjoy 20% off all salon services."
                        : `${Math.max(0, 5 - qualifyingVisits.length)} more ${Math.max(0, 5 - qualifyingVisits.length) === 1 ? 'visit' : 'visits'} to achieve Gold Member status & unlock 20% off.`}
                    </h3>

                    {/* Progress Bar */}
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="h-2.5 w-44 sm:w-60 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden p-0.5">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_8px_rgba(234,179,8,0.4)] transition-all duration-500" 
                          style={{ width: `${Math.min(100, Math.round((qualifyingVisits.length / 5) * 100))}%` }} 
                        />
                      </div>
                      <span className="text-xs font-mono font-semibold text-primary">
                        {qualifyingVisits.length}/5 Visits ({Math.min(100, Math.round((qualifyingVisits.length / 5) * 100))}%)
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 w-full md:w-auto self-end md:self-center">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab("loyalty")} 
                    className="border-primary/30 text-primary hover:bg-primary/10 text-xs uppercase tracking-widest h-9 px-4"
                  >
                    View All Rewards
                  </Button>
                  <Button 
                    asChild 
                    size="sm" 
                    className="bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-widest h-9 px-5 shadow-md shadow-primary/20"
                  >
                    <Link to="/book">
                      Book Next Visit <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>

            {profile?.role !== 'Owner' && profile?.role !== 'Admin' && !isVendor && (
              <Card className="mb-12 bg-primary/5 border-primary/20 overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Globe className="h-32 w-32" />
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-light tracking-tight">Are you a Shop Owner?</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Register your shop today and get a professional landing page for your business.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild className="bg-primary text-black hover:bg-primary/90">
                    <Link to="/partner">
                      Register My Shop <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="mb-8 flex items-center justify-between">
              <h2 className="text-xl font-serif text-primary italic">Managed Bookings</h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => exportToCSV(appointments, `appointments_${user.uid}.csv`)}
                className="border-border bg-card hover:bg-white/5 text-xs uppercase tracking-widest gap-2"
              >
                <Download className="h-3.5 w-3.5" />
                Export CSV
              </Button>
            </div>

            <div className="space-y-12">
              {/* Upcoming Section */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Calendar className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-lg font-light uppercase tracking-widest text-foreground">Upcoming Visits</h3>
                </div>
                
                <div className="rounded-[16px] border border-border bg-card overflow-hidden">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('name')}>
                            <div className="flex items-center gap-2">
                              Client
                              <ArrowUpDown className={cn("h-3 w-3", sortConfig?.key === 'name' ? "text-primary" : "opacity-30")} />
                            </div>
                          </TableHead>
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('service')}>
                            <div className="flex items-center gap-2">
                              Service
                              <ArrowUpDown className={cn("h-3 w-3", sortConfig?.key === 'service' ? "text-primary" : "opacity-30")} />
                            </div>
                          </TableHead>
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('status')}>
                            <div className="flex items-center gap-2">
                              Status
                              <ArrowUpDown className={cn("h-3 w-3", sortConfig?.key === 'status' ? "text-primary" : "opacity-30")} />
                            </div>
                          </TableHead>
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('schedule')}>
                            <div className="flex items-center gap-2">
                              Schedule
                              <ArrowUpDown className={cn("h-3 w-3", sortConfig?.key === 'schedule' ? "text-primary" : "opacity-30")} />
                            </div>
                          </TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {upcomingAppointments.length === 0 ? (
                          <TableRow className="border-border hover:bg-transparent">
                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                              <div className="flex flex-col items-center gap-2">
                                <Calendar className="h-8 w-8 opacity-20" />
                                <span>No upcoming appointments scheduled.</span>
                                <Button asChild variant="link" className="text-primary text-xs uppercase tracking-widest" >
                                  <Link to="/book">Book Now</Link>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          upcomingAppointments.map((appointment) => (
                            <TableRow key={appointment.id} className="border-border hover:bg-white/5 transition-colors">
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-primary" />
                                  <span>{appointment.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 w-fit">
                                    {appointment.service || "General"}
                                  </Badge>
                                  {appointment.isRecurring && (
                                    <div className="flex items-center gap-1 text-[9px] text-muted-foreground uppercase tracking-widest">
                                      <Repeat className="h-2.5 w-2.5 text-primary" />
                                      {appointment.frequency} • {appointment.duration}m
                                    </div>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select 
                                  value={appointment.status || "pending"} 
                                  onValueChange={(val) => handleStatusUpdate(appointment.id, val)}
                                  disabled={!isAdmin && profile?.role !== 'Owner' && appointment.status === 'confirmed'}
                                >
                                  <SelectTrigger className={cn(
                                    "h-8 w-[120px] text-[10px] uppercase tracking-widest border-0 bg-transparent focus:ring-0",
                                    appointment.status === 'confirmed' ? "text-green-500" :
                                    appointment.status === 'cancelled' ? "text-red-500" :
                                    "text-yellow-500"
                                  )}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent className="bg-card border-border">
                                    <SelectItem value="pending" className="text-yellow-500">Pending</SelectItem>
                                    <SelectItem value="confirmed" className="text-green-500">Confirmed</SelectItem>
                                    <SelectItem value="cancelled" className="text-red-500">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                <div className="flex flex-col text-[11px]">
                                  <span className="text-foreground">
                                    {appointment.date ? format(new Date(appointment.date), "MMM d, yyyy") : "N/A"}
                                  </span>
                                  <span className="text-primary">
                                    {appointment.time || "N/A"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(appointment)} className="h-8 w-8 hover:text-primary">
                                        <Edit2 className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Edit</TooltipContent>
                                  </Tooltip>

                                  {appointment.status !== 'cancelled' && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => setConfirmAction({ type: 'cancel', id: appointment.id })} 
                                          className="h-8 w-8 hover:text-orange-500"
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Cancel Appointment</TooltipContent>
                                    </Tooltip>
                                  )}

                                  {(isAdmin || isOwner) && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          onClick={() => setConfirmAction({ type: 'delete', id: appointment.id })} 
                                          className="h-8 w-8 hover:text-red-500"
                                        >
                                          <Trash2 className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>Delete Record</TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </section>

              {/* Past Section */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-light uppercase tracking-widest text-muted-foreground">Past History</h3>
                </div>
                
                <div className="rounded-[16px] border border-border bg-card/50 overflow-hidden opacity-80 transition-opacity hover:opacity-100">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('service')}>
                            <div className="flex items-center gap-2">
                              Service
                              <ArrowUpDown className={cn("h-3 w-3", sortConfig?.key === 'service' ? "text-primary" : "opacity-30")} />
                            </div>
                          </TableHead>
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('status')}>
                            <div className="flex items-center gap-2">
                              Status
                              <ArrowUpDown className={cn("h-3 w-3", sortConfig?.key === 'status' ? "text-primary" : "opacity-30")} />
                            </div>
                          </TableHead>
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer hover:text-primary transition-colors" onClick={() => requestSort('date')}>
                            <div className="flex items-center gap-2">
                              Date
                              <ArrowUpDown className={cn("h-3 w-3", sortConfig?.key === 'date' ? "text-primary" : "opacity-30")} />
                            </div>
                          </TableHead>
                          <TableHead className="text-right text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pastAppointments.length === 0 ? (
                          <TableRow className="border-border hover:bg-transparent">
                            <TableCell colSpan={4} className="text-center py-8 text-muted-foreground text-xs italic">
                              No past records found.
                            </TableCell>
                          </TableRow>
                        ) : (
                          pastAppointments.map((appointment) => {
                            const shopInfo = getShopInfo(appointment.shopId);
                            const existingReview = userReviews[appointment.id];

                            return (
                              <TableRow key={appointment.id} className="border-border hover:bg-white/5 transition-colors grayscale-[0.3] hover:grayscale-0">
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{appointment.service || "General"}</span>
                                    <span className="text-[10px] text-zinc-500 flex items-center gap-1 mt-0.5">
                                      {shopInfo.name}
                                      {shopInfo.slug && (
                                        <Link 
                                          to={`/shop/${shopInfo.slug}#reviews-section`}
                                          className="text-primary hover:underline ml-1"
                                          title="View shop page & reviews"
                                        >
                                          (View Shop)
                                        </Link>
                                      )}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className={cn(
                                      "uppercase text-[8px] tracking-[0.15em] border-primary/20",
                                      appointment.status === 'confirmed' ? "text-green-500/70" :
                                      appointment.status === 'cancelled' ? "text-red-500/70" :
                                      "text-yellow-500/70"
                                    )}
                                  >
                                    {appointment.status || "pending"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                  <div className="text-[10px] uppercase">
                                    {appointment.date ? format(new Date(appointment.date), "MMM d, yyyy") : "N/A"}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    {existingReview ? (
                                      <Badge variant="outline" className="border-amber-400/40 text-amber-400 text-[10px] flex items-center gap-1 font-mono py-1 px-2 bg-amber-400/5">
                                        <Star className="h-3 w-3 fill-amber-400" />
                                        {existingReview.rating}★ Rated
                                      </Badge>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        variant="outline"
                                        onClick={() => {
                                          setReviewAppointment(appointment);
                                          setReviewRating(5);
                                          setReviewTitle(`Exceptional experience with ${appointment.service || "salon"}`);
                                          setReviewComment("");
                                          setReviewTags(["Master Barber", "Punctual & Prompt"]);
                                        }}
                                        className="h-7 px-2.5 text-[10px] uppercase tracking-wider font-bold border-primary/40 text-primary hover:bg-primary hover:text-black gap-1.5 transition-all shadow-sm"
                                      >
                                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                        Review Visit
                                      </Button>
                                    )}

                                    <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'delete', id: appointment.id })} className="h-8 w-8 hover:text-red-500">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
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
              </section>
            </div>
          </TabsContent>

          <TabsContent value="shop">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-2xl font-light tracking-tight">Shop Management</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Manage your shop's landing page and online presence.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-lg border border-border bg-background/50 flex flex-col items-center text-center">
                    <Globe className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">Landing Page Editor</h3>
                    <p className="text-sm text-muted-foreground mb-6">Customize your shop's website, services, and story.</p>
                    <Button asChild className="w-full bg-primary text-black hover:bg-primary/90">
                      <Link to="/dashboard/shop-editor">Open Editor</Link>
                    </Button>
                  </div>
                  <div className="p-6 rounded-lg border border-border bg-background/50 flex flex-col items-center text-center">
                    <Eye className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-lg font-medium mb-2">View Live Page</h3>
                    <p className="text-sm text-muted-foreground mb-6">See how your shop appears to potential customers.</p>
                    <Button variant="outline" asChild className="w-full border-border hover:bg-white/5">
                      <Link to={profile?.shopId ? `/shop/${profile.slug || 'my-shop'}` : '#'} target="_blank">View Website</Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications">
            <Card className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div>
                  <CardTitle className="text-2xl font-light tracking-tight">Recent Notifications</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Stay updated with the latest activity in your shop.
                  </CardDescription>
                </div>
                {unreadCount > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={markAllAsRead}
                    className="border-primary/30 text-primary hover:bg-primary/10 text-[10px] uppercase tracking-widest"
                  >
                    Mark all as read
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-border rounded-lg">
                      <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                      <p className="text-muted-foreground">No notifications yet.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div 
                        key={n.id} 
                        className={cn(
                          "flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg border transition-all",
                          n.read ? "bg-background/20 border-border" : "bg-primary/5 border-primary/20 ring-1 ring-primary/10"
                        )}
                      >
                        <div className="flex-grow">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                              {n.title || "System Message"}
                            </span>
                            {!n.read && (
                              <Badge className="bg-primary text-black text-[8px] h-3 px-1 leading-none">NEW</Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground leading-relaxed mb-2">
                            {n.message}
                          </p>
                          <div className="flex items-center gap-4 text-[10px] text-muted-foreground uppercase tracking-widest">
                            <span>{n.createdAt?.toDate ? format(n.createdAt.toDate(), "MMM d, yyyy • h:mm a") : "Recently"}</span>
                            {n.type && <span className="text-primary/50">{n.type.replace('_', ' ')}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 md:mt-0">
                          {!n.read && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => markAsRead(n.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                              title="Mark as read"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => deleteNotification(n.id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile">
            <div className="rounded-[16px] border border-border bg-card p-8 max-w-2xl">
              <h2 className="text-2xl font-light mb-6">User Details</h2>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="displayName" className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="displayName"
                        value={profileData.displayName}
                        onChange={(e) => setProfileData({...profileData, displayName: e.target.value})}
                        className="pl-10 border-border bg-background focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs uppercase tracking-widest text-muted-foreground">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10 border-border bg-background focus:border-primary"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-xs uppercase tracking-widest text-muted-foreground">Role</Label>
                  <Select 
                    value={profileData.role}
                    onValueChange={(val) => setProfileData({...profileData, role: val})}
                  >
                    <SelectTrigger className="border-border bg-background focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="User">User</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs uppercase tracking-widest text-muted-foreground">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email"
                      value={profileData.email}
                      disabled
                      className="pl-10 border-border bg-background opacity-50 cursor-not-allowed"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Email is managed by your Google Account.</p>
                </div>

                <div className="pt-6 border-t border-border">
                  <h3 className="text-sm font-medium uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bell className="h-4 w-4 text-primary" />
                    Notification Settings
                  </h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                      <div>
                        <p className="text-sm font-medium">Email Reminders</p>
                        <p className="text-xs text-muted-foreground">Receive appointment reminders via email</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={profileData.emailReminders}
                        onChange={(e) => setProfileData({...profileData, emailReminders: e.target.checked})}
                        className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary accent-primary"
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-background/50">
                      <div>
                        <p className="text-sm font-medium">SMS Reminders</p>
                        <p className="text-xs text-muted-foreground">Receive appointment reminders via text message</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={profileData.smsReminders}
                        onChange={(e) => setProfileData({...profileData, smsReminders: e.target.checked})}
                        className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary accent-primary"
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" disabled={isSavingProfile} className="bg-primary text-black hover:bg-primary/90 w-full">
                  {isSavingProfile ? "Saving..." : "Save Profile"}
                </Button>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="loyalty">
            <LoyaltyRewards 
              appointments={appointments}
              user={user}
              profile={profile}
              onBookClick={() => setActiveTab("appointments")}
            />
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={!!isEditing} onOpenChange={(open) => !open && setIsEditing(null)}>
          <DialogContent className="bg-card border-border text-foreground sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-light tracking-tight">Edit Appointment</DialogTitle>
            </DialogHeader>
            <div className="grid gap-6 py-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Client Name</Label>
                <Input 
                  value={editFormData.name || ""} 
                  onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                  className="border-border bg-background focus:border-primary"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Phone</Label>
                  <Input 
                    value={editFormData.phone || ""} 
                    onChange={e => setEditFormData({...editFormData, phone: e.target.value})}
                    className="border-border bg-background focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Service</Label>
                  <Select 
                    value={editFormData.service}
                    onValueChange={(val) => setEditFormData({...editFormData, service: val})}
                  >
                    <SelectTrigger className="border-border bg-background focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {allServices.map((service) => (
                        <SelectItem key={service.name} value={service.name}>{service.name} (${service.price})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Status</Label>
                  <Select 
                    value={editFormData.status}
                    onValueChange={(val) => setEditFormData({...editFormData, status: val})}
                  >
                    <SelectTrigger className="border-border bg-background focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Date</Label>
                  <Input 
                    type="date"
                    value={editFormData.date ? editFormData.date.split('T')[0] : ""} 
                    onChange={e => setEditFormData({...editFormData, date: new Date(e.target.value).toISOString()})}
                    className="border-border bg-background focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-widest text-muted-foreground">Time</Label>
                  <Select 
                    value={editFormData.time}
                    onValueChange={(val) => setEditFormData({...editFormData, time: val})}
                  >
                    <SelectTrigger className="border-border bg-background focus:border-primary">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {timeSlots.map((slot) => (
                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Additional Notes</Label>
                <Input 
                  value={editFormData.address || ""} 
                  onChange={e => setEditFormData({...editFormData, address: e.target.value})}
                  className="border-border bg-background focus:border-primary"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditing(null)} className="border-border bg-transparent hover:bg-white/5">
                Cancel
              </Button>
              <Button onClick={handleUpdate} disabled={isSubmitting} className="bg-primary text-black hover:bg-primary/90">
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Confirmation Dialog */}
        <Dialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
          <DialogContent className="bg-card border-border text-foreground sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle className="text-xl font-light tracking-tight">
                {confirmAction?.type === 'cancel' ? 'Cancel Appointment' : 'Delete Appointment'}
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 text-muted-foreground">
              {confirmAction?.type === 'cancel' 
                ? "Are you sure you want to cancel this appointment? This action will notify the salon."
                : "Are you sure you want to permanently delete this appointment record?"}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmAction(null)} className="border-border bg-transparent hover:bg-white/5">
                {confirmAction?.type === 'cancel' ? "No, Keep Appointment" : "No, Keep Record"}
              </Button>
              {confirmAction?.type === 'cancel' ? (
                <Button 
                  onClick={() => handleCancel(confirmAction.id)} 
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  Yes, Cancel Appointment
                </Button>
              ) : (
                <Button 
                  onClick={() => handleDelete(confirmAction!.id)} 
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Yes, Delete Record
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Appointment Review Dialog */}
        <Dialog open={!!reviewAppointment} onOpenChange={(open) => !open && setReviewAppointment(null)}>
          <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[560px] p-0 overflow-hidden max-h-[90vh] flex flex-col">
            <DialogHeader className="p-6 pb-4 border-b border-zinc-900">
              <div className="flex items-center gap-2 text-primary text-xs uppercase tracking-widest font-bold mb-1">
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                Share Your Experience
              </div>
              <DialogTitle className="text-2xl font-bold uppercase tracking-tight italic">
                Review Your Visit
              </DialogTitle>
              {reviewAppointment && (
                <DialogDescription className="text-xs text-zinc-400 mt-1">
                  {reviewAppointment.service || "Appointment"} at{" "}
                  <span className="text-white font-medium">
                    {getShopInfo(reviewAppointment.shopId).name}
                  </span>
                  {reviewAppointment.date && ` on ${format(new Date(reviewAppointment.date), "MMMM d, yyyy")}`}
                </DialogDescription>
              )}
            </DialogHeader>

            <form onSubmit={handleSubmitAppointmentReview} className="overflow-y-auto p-6 space-y-5 flex-1">
              
              {/* Verified Booking Seal */}
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0" />
                <div className="text-xs">
                  <span className="font-bold text-white">Verified Appointment: </span>
                  <span className="text-emerald-300">
                    Your completed booking verifies this review, unlocking the gold client badge.
                  </span>
                </div>
              </div>

              {/* Star Rating Selector */}
              <div className="space-y-2 text-center p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold block">
                  How was your overall experience?
                </Label>
                
                <div className="flex items-center justify-center gap-2 py-1">
                  {[1, 2, 3, 4, 5].map((starNum) => {
                    const activeRating = reviewHoverRating || reviewRating;
                    const isFilled = starNum <= activeRating;

                    return (
                      <button
                        key={starNum}
                        type="button"
                        onMouseEnter={() => setReviewHoverRating(starNum)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        onClick={() => setReviewRating(starNum)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <Star
                          className={cn(
                            "h-7 w-7 transition-colors",
                            isFilled
                              ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]"
                              : "text-zinc-700 hover:text-yellow-500/50"
                          )}
                        />
                      </button>
                    );
                  })}
                </div>

                <p className="text-xs font-semibold text-primary h-4">
                  {reviewHoverRating === 1 || reviewRating === 1 ? "Disappointing" :
                   reviewHoverRating === 2 || reviewRating === 2 ? "Fair" :
                   reviewHoverRating === 3 || reviewRating === 3 ? "Good" :
                   reviewHoverRating === 4 || reviewRating === 4 ? "Very Good" : "Exceptional Experience"}
                </p>
              </div>

              {/* Headline */}
              <div className="space-y-2">
                <Label htmlFor="app-review-title" className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                  Review Headline
                </Label>
                <Input
                  id="app-review-title"
                  placeholder="e.g. Masterful beard trim and calming scalp champi"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  required
                  className="bg-zinc-900 border-zinc-800 text-sm h-11 text-white"
                />
              </div>

              {/* Comments */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="app-review-comment" className="text-xs uppercase tracking-widest text-zinc-400 font-bold">
                    Feedback Details
                  </Label>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {reviewComment.length} / 500
                  </span>
                </div>
                <Textarea
                  id="app-review-comment"
                  placeholder="Share details on the precision, stylist attentiveness, shop hygiene, and punctuality..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  rows={4}
                  required
                  maxLength={500}
                  className="bg-zinc-900 border-zinc-800 text-sm text-white resize-none"
                />
              </div>

              {/* Tag Highlights */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-zinc-400 font-bold block">
                  Highlight Tags
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {["Master Barber", "Clean & Hygienic", "Punctual & Prompt", "Relaxing Vibe", "Great Consultation", "Luxury Amenities"].map((tag) => {
                    const isSelected = reviewTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleReviewTag(tag)}
                        className={cn(
                          "text-[11px] px-3 py-1 rounded-full transition-all border",
                          isSelected
                            ? "bg-primary text-black border-primary font-bold shadow-sm"
                            : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Recommendation Switch */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900/40 border border-zinc-800/80">
                <div className="space-y-0.5">
                  <Label className="text-xs font-bold uppercase tracking-wider text-white">
                    Recommend this shop?
                  </Label>
                  <p className="text-[11px] text-zinc-400">
                    Would you recommend this salon to friends?
                  </p>
                </div>
                <Switch
                  checked={reviewRecommend}
                  onCheckedChange={setReviewRecommend}
                />
              </div>

              <DialogFooter className="pt-4 border-t border-zinc-900 flex sm:justify-between items-center gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setReviewAppointment(null)}
                  className="text-xs uppercase tracking-widest text-zinc-400 hover:text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingReview || !reviewTitle.trim() || !reviewComment.trim()}
                  className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs h-11 px-8 rounded-none shadow-lg shadow-primary/20"
                >
                  {isSubmittingReview ? "Submitting..." : "Post Review"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
