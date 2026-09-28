import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { Edit2, Trash2, Download, Bell, Repeat, BellRing, Check, Search, User, Plus, Scissors, BarChart3, Shield, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Navigate } from "react-router-dom";
import { exportToCSV } from "@/lib/exportUtils";
import { getFriendlyErrorMessage } from "@/lib/errorUtils";

import { ROLES, SALON_SERVICES } from "@/constants";

interface Appointment {
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
  isRecurring?: boolean;
  frequency?: string;
  duration?: string;
  createdAt: any;
}

interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: string;
  phone?: string;
}

export default function AdminMembers() {
  const { user, isAdmin, isOwner, loading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isEditing, setIsEditing] = useState<Appointment | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Appointment>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingReminders, setIsSendingReminders] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: 'delete', id: string } | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dynamicServices, setDynamicServices] = useState<any[]>([]);
  const [newService, setNewService] = useState({ name: "", price: "", description: "" });
  const [isAddingService, setIsAddingService] = useState(false);

  const timeSlots = [
    "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", 
    "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", 
    "05:00 PM", "06:00 PM", "07:00 PM", "08:00 PM"
  ];

  useEffect(() => {
    if (!user || (!isAdmin && !isOwner)) return;

    const appointmentsRef = collection(db, "customers");
    const q = query(appointmentsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Appointment[];
      setAppointments(docs);
    }, (error) => {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.LIST, "customers");
    });

    return () => unsubscribe();
  }, [user, isAdmin, isOwner]);

  useEffect(() => {
    if (!user || (!isAdmin && !isOwner)) return;

    const usersRef = collection(db, "users");
    const unsubscribe = onSnapshot(usersRef, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        ...doc.data()
      })) as UserProfile[];
      setUsers(docs);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "users");
    });

    return () => unsubscribe();
  }, [user, isAdmin, isOwner]);

  useEffect(() => {
    if (!user || (!isAdmin && !isOwner)) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      // Check for new unread notifications to show toast
      const unread = docs.filter((n: any) => !n.read);
      if (unread.length > unreadCount) {
        const newest = unread[0];
        if (newest) {
          toast.info(newest.title, {
            description: newest.message,
            duration: 5000,
          });
        }
      }
      
      setNotifications(docs);
      setUnreadCount(unread.length);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "notifications");
    });

    return () => unsubscribe();
  }, [user, isAdmin, isOwner, unreadCount]);

  useEffect(() => {
    if (!user || (!isAdmin && !isOwner)) return;

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
  }, [user, isAdmin, isOwner]);

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newService.name || !newService.price) {
      toast.error("Please provide both name and price");
      return;
    }
    setIsAddingService(true);
    try {
      await addDoc(collection(db, "services"), {
        name: newService.name,
        price: parseFloat(newService.price),
        description: newService.description,
        createdAt: serverTimestamp()
      });
      toast.success("Service added successfully");
      setNewService({ name: "", price: "", description: "" });
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.CREATE, "services");
    } finally {
      setIsAddingService(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await deleteDoc(doc(db, "services", id));
      toast.success("Service deleted successfully");
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.DELETE, `services/${id}`);
    }
  };

  const allServices = [...SALON_SERVICES, ...dynamicServices];

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => updateDoc(doc(db, "notifications", n.id), { read: true })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      app.name.toLowerCase().includes(searchLower) ||
      (app.service || "").toLowerCase().includes(searchLower) ||
      (app.status || "").toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === "all" || (app.status || "pending").toLowerCase() === statusFilter.toLowerCase();
    
    let matchesDate = true;
    if (app.createdAt?.toDate) {
      const appDate = app.createdAt.toDate();
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && appDate >= start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && appDate <= end;
      }
    }

    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "customers", id));
      toast.success("Appointment record deleted successfully");
      setConfirmAction(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.DELETE, `customers/${id}`);
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

  const handleUpdate = async () => {
    if (!isEditing) return;
    setIsSubmitting(true);
    try {
      const oldStatus = isEditing.status;
      const newStatus = editFormData.status;

      await updateDoc(doc(db, "customers", isEditing.id), {
        ...editFormData
      });

      // Send status update email if status changed
      if (newStatus && newStatus !== oldStatus && isEditing.userEmail) {
        try {
          await fetch("/api/send-status-update", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: isEditing.userEmail,
              name: editFormData.name || isEditing.name,
              service: editFormData.service || isEditing.service,
              date: isEditing.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              status: newStatus,
              time: editFormData.time || isEditing.time,
            }),
          });
        } catch (emailError) {
          console.error("Failed to send status update email:", emailError);
        }
      }

      toast.success("Appointment record updated successfully");
      setIsEditing(null);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `customers/${isEditing.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendReminders = async () => {
    setIsSendingReminders(true);
    try {
      const response = await fetch("/api/admin/trigger-reminders", {
        method: "POST",
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Reminders triggered successfully");
      } else {
        throw new Error(data.error || "Failed to trigger reminders");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to trigger reminders");
    } finally {
      setIsSendingReminders(false);
    }
  };

  const handleRoleUpdate = async (uid: string, targetUserRole: string | undefined, newRole: string) => {
    // RBAC Checks
    if (uid === user.uid) {
      toast.error("You cannot change your own role.");
      return;
    }

    if (isAdmin && !isOwner) {
      if (targetUserRole === "Owner") {
        toast.error("Admins cannot change Owner roles.");
        return;
      }
      if (newRole === "Owner") {
        toast.error("Only current Owners can promote users to Owner.");
        return;
      }
    }

    try {
      await updateDoc(doc(db, "users", uid), {
        role: newRole
      });
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error(getFriendlyErrorMessage(error));
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

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
            Admin Portal
          </span>
          <h1 className="text-4xl font-light tracking-tight md:text-5xl">
            ALL <span className="italic text-primary">APPOINTMENTS</span>
          </h1>
          {isAdmin && (
            <Button asChild className="mt-6 bg-primary text-black hover:bg-primary/90 gap-2">
              <a href="/admin/shops">
                <BarChart3 className="h-4 w-4" />
                Go to Master Control Panel (Shops)
              </a>
            </Button>
          )}
        </motion.div>

        <Tabs defaultValue="appointments" className="w-full">
          <TabsList className="mb-8 bg-card border border-border">
            <TabsTrigger value="appointments" className="data-[state=active]:bg-primary data-[state=active]:text-black">Appointments</TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-primary data-[state=active]:text-black">User Management</TabsTrigger>
            <TabsTrigger value="services" className="data-[state=active]:bg-primary data-[state=active]:text-black">Services</TabsTrigger>
          </TabsList>

          <TabsContent value="appointments">
            <div className="mb-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:max-w-2xl">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input 
                    placeholder="Search by client, service, or status..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 border-border bg-card focus:border-primary"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-[130px] border-border bg-card text-xs uppercase tracking-widest shrink-0">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="relative border-border bg-card hover:bg-white/5 text-xs uppercase tracking-widest gap-2"
                    >
                      <Bell className="h-3.5 w-3.5" />
                      Notifications
                      {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
                          {unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80 bg-card border-border p-0" align="end">
                    <div className="flex items-center justify-between border-b border-border p-4">
                      <h3 className="text-sm font-medium uppercase tracking-widest">Notifications</h3>
                      {unreadCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={markAllAsRead}
                          className="h-auto p-0 text-[10px] uppercase tracking-widest text-primary hover:bg-transparent"
                        >
                          Mark all as read
                        </Button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-muted-foreground">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div 
                            key={n.id} 
                            className={cn(
                              "flex flex-col gap-1 border-b border-border p-4 transition-colors hover:bg-white/5",
                              !n.read && "bg-primary/5"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                                {n.title}
                              </span>
                              {!n.read && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => markAsRead(n.id)}
                                  className="h-4 w-4 text-muted-foreground hover:text-primary"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {n.message}
                            </p>
                            <span className="text-[9px] text-muted-foreground/50">
                              {n.createdAt?.toDate ? format(n.createdAt.toDate(), "MMM d, h:mm a") : "Just now"}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </PopoverContent>
                </Popover>

                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSendReminders}
                  disabled={isSendingReminders}
                  className="border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary text-xs uppercase tracking-widest gap-2"
                >
                  <Bell className="h-3.5 w-3.5" />
                  {isSendingReminders ? "Sending..." : "Send Reminders"}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => exportToCSV(appointments, `all_appointments_${new Date().toISOString().split('T')[0]}.csv`)}
                  className="border-border bg-card hover:bg-white/5 text-xs uppercase tracking-widest gap-2"
                >
                  <Download className="h-3.5 w-3.5" />
                  Export All CSV
                </Button>
              </div>
            </div>

            <div className="mb-8 flex flex-col md:flex-row items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50">
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                <Scissors className="h-3 w-3" />
                Filter by Date:
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">From</span>
                  <Input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-8 w-36 px-2 text-xs border-border bg-black/40 focus:border-primary"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">To</span>
                  <Input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-8 w-36 px-2 text-xs border-border bg-black/40 focus:border-primary"
                  />
                </div>
                {(startDate || endDate || statusFilter !== "all") && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                      setStatusFilter("all");
                    }}
                    className="h-8 text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10 hover:text-primary"
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-[16px] border border-border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Client Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Phone</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Service</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Status</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Date & Time</TableHead>
                      <TableHead className="text-xs uppercase tracking-widest text-muted-foreground">Booked By</TableHead>
                      <TableHead className="text-right text-xs uppercase tracking-widest text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAppointments.length === 0 ? (
                      <TableRow className="border-border hover:bg-transparent">
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No appointments found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAppointments.map((appointment) => (
                        <TableRow key={appointment.id} className="border-border hover:bg-white/5 transition-colors">
                          <TableCell className="font-medium">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex items-center gap-2 cursor-help">
                                  {appointment.name}
                                </div>
                              </TooltipTrigger>
                              {appointment.address && (
                                <TooltipContent className="bg-card border-border text-xs max-w-xs">
                                  <p className="font-semibold text-primary mb-1 uppercase tracking-widest text-[10px]">Additional Notes</p>
                                  <p className="text-muted-foreground leading-relaxed">{appointment.address}</p>
                                </TooltipContent>
                              )}
                            </Tooltip>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {appointment.phone || "N/A"}
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
                            <Badge 
                              variant="outline" 
                              className={cn(
                                "uppercase text-[10px] tracking-widest",
                                appointment.status === 'confirmed' ? "border-green-500/50 text-green-500 bg-green-500/5" :
                                appointment.status === 'cancelled' ? "border-red-500/50 text-red-500 bg-red-500/5" :
                                "border-yellow-500/50 text-yellow-500 bg-yellow-500/5"
                              )}
                            >
                              {appointment.status || "pending"}
                            </Badge>
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
                          <TableCell>
                            <span className="text-sm">{appointment.userName || "Unknown"}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" onClick={() => handleEditClick(appointment)} className="h-8 w-8 hover:text-primary">
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => setConfirmAction({ type: 'delete', id: appointment.id })} className="h-8 w-8 hover:text-red-500">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl font-light tracking-tight">Active Accounts</CardTitle>
                  <CardDescription className="text-muted-foreground">Manage user roles and permissions.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border hover:bg-transparent">
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground px-6 py-4">Display Name</TableHead>
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground px-6 py-4">Email</TableHead>
                          <TableHead className="text-xs uppercase tracking-widest text-muted-foreground px-6 py-4">Role</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => (
                          <TableRow key={u.uid} className="border-border hover:bg-white/5 transition-colors">
                            <TableCell className="font-medium px-6">
                              <div className="flex items-center gap-2">
                                <UserCircle className="h-4 w-4 text-primary" />
                                {u.displayName || "Anonymous"}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground px-6">
                              {u.email}
                            </TableCell>
                            <TableCell className="px-6">
                              <Select 
                                value={u.role || "User"} 
                                onValueChange={(val) => handleRoleUpdate(u.uid, u.role, val)}
                                disabled={u.uid === user.uid || (isAdmin && !isOwner && u.role === "Owner")}
                              >
                                <SelectTrigger className={cn(
                                  "h-8 w-[120px] text-[10px] uppercase tracking-widest border-0 bg-transparent focus:ring-0",
                                  u.role === 'Admin' ? "text-primary" : u.role === 'Owner' ? "text-red-500 font-bold" : "text-muted-foreground"
                                )}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border">
                                  <SelectItem value="User">User</SelectItem>
                                  <SelectItem value="Admin">Admin</SelectItem>
                                  {isOwner && <SelectItem value="Owner">Owner</SelectItem>}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-xl font-light tracking-tight flex items-center gap-2">
                    <Shield className="h-5 w-5 text-primary" />
                    Role Hierarchy
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">Permission levels defined.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-red-500 border-red-500/30 bg-red-500/5">Owner</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Full system access. Can manage all shop approvals, verification badges, and promote/demote any user or Admin.</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-primary border-primary/30 bg-primary/5">Admin</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Managerial access. Can approve/deny appointments, edit service lists, and manage user roles (excluding Owners).</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] uppercase tracking-widest text-zinc-500 border-zinc-700 bg-black/40">User</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">Standard customer account. Can book appointments and manage their personal profile and history.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          <TabsContent value="services">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <Card className="bg-card border-border lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-xl font-light tracking-tight">Add New Service</CardTitle>
                  <CardDescription className="text-muted-foreground">Define a new salon service and its price.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddService} className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">Service Name</Label>
                      <Input 
                        placeholder="e.g. Keratin Treatment"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        className="border-border bg-background focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">Price (₹)</Label>
                      <Input 
                        type="number"
                        placeholder="e.g. 150"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        className="border-border bg-background focus:border-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase tracking-widest text-muted-foreground">Description (Optional)</Label>
                      <Input 
                        placeholder="e.g. A relaxing treatment for hair longevity"
                        value={newService.description}
                        onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                        className="border-border bg-background focus:border-primary"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={isAddingService}
                      className="w-full bg-primary text-black hover:bg-primary/90 gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {isAddingService ? "Adding..." : "Add Service"}
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="bg-card border-border lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl font-light tracking-tight">Current Services</CardTitle>
                  <CardDescription className="text-muted-foreground">List of all services available for booking.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <span className="h-px w-8 bg-border"></span>
                      Standard Services
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                      {SALON_SERVICES.map((service) => (
                        <div key={service.name} className="group relative p-4 rounded-xl border border-border bg-black/20 hover:border-primary/50 transition-all duration-300">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="mt-1 p-2 rounded-lg bg-primary/10 text-primary">
                                <Scissors className="h-4 w-4" />
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-semibold tracking-tight">{service.name}</span>
                                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">{service.description}</p>
                              </div>
                            </div>
                            <span className="text-sm text-primary font-mono font-bold">₹{service.price}</span>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="outline" className="text-[9px] uppercase tracking-widest border-border bg-black text-muted-foreground">Standard</Badge>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                      <span className="h-px w-8 bg-border"></span>
                      Custom Dynamic Services
                    </div>
                    {dynamicServices.length === 0 ? (
                      <div className="p-12 text-center border border-dashed border-border rounded-2xl bg-black/10 flex flex-col items-center gap-3">
                        <Plus className="h-6 w-6 text-muted-foreground/30" />
                        <p className="text-xs text-muted-foreground tracking-wide">No dynamic services added yet. Use the form to add some.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dynamicServices.map((service) => (
                          <div key={service.id} className="group relative p-4 rounded-xl border border-primary/20 bg-primary/5 hover:border-primary/40 transition-all duration-300">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-3">
                                <div className="mt-1 p-2 rounded-lg bg-primary/20 text-primary">
                                  <Plus className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-semibold tracking-tight">{service.name}</span>
                                  <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                                    {service.description || "No description provided."}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-3">
                                <span className="text-sm text-primary font-mono font-bold">₹{service.price}</span>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => {
                                    if(confirm(`Are you sure you want to remove "${service.name}"?`)) {
                                      handleDeleteService(service.id);
                                    }
                                  }}
                                  className="h-8 w-8 text-black/40 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
                        <SelectItem key={service.name} value={service.name}>{service.name} (₹{service.price})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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

              <div className="rounded-lg border border-border bg-background/50 p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4 text-primary" />
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Recurring</Label>
                  </div>
                  <input 
                    type="checkbox" 
                    checked={editFormData.isRecurring || false}
                    onChange={(e) => setEditFormData({...editFormData, isRecurring: e.target.checked})}
                    className="h-4 w-4 accent-primary"
                  />
                </div>
                {editFormData.isRecurring && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Frequency</Label>
                      <Select 
                        value={editFormData.frequency || "none"}
                        onValueChange={(val) => setEditFormData({...editFormData, frequency: val})}
                      >
                        <SelectTrigger className="h-8 border-border bg-background text-xs uppercase tracking-widest">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] uppercase tracking-widest text-muted-foreground">Duration</Label>
                      <Select 
                        value={editFormData.duration || "1"}
                        onValueChange={(val) => setEditFormData({...editFormData, duration: val})}
                      >
                        <SelectTrigger className="h-8 border-border bg-background text-xs uppercase tracking-widest">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border">
                          <SelectItem value="1">1 Month</SelectItem>
                          <SelectItem value="3">3 Months</SelectItem>
                          <SelectItem value="6">6 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
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
                Delete Appointment
              </DialogTitle>
            </DialogHeader>
            <div className="py-4 text-muted-foreground">
              Are you sure you want to permanently delete this appointment record?
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmAction(null)} className="border-border bg-transparent hover:bg-white/5">
                No, Keep it
              </Button>
              <Button 
                onClick={() => handleDelete(confirmAction!.id)} 
                className="text-white bg-red-600 hover:bg-red-700"
              >
                Yes, Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
