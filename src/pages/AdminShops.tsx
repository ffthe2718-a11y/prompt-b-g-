import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { collection, query, onSnapshot, doc, updateDoc, orderBy, getDocs, where } from "firebase/firestore";
import { format } from "date-fns";
import { CheckCircle2, XCircle, ShieldCheck, BarChart3, Store, User, MapPin, ExternalLink, Filter, Shield } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Navigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Shop {
  id: string;
  name: string;
  ownerId: string;
  location: string;
  status: string;
  isActive: boolean;
  isVerified: boolean;
  slug: string;
  createdAt: any;
  bookingCount?: number;
}

export default function AdminShops() {
  const { user, isAdmin, loading } = useAuth();
  const [shops, setShops] = useState<Shop[]>([]);
  const [analytics, setAnalytics] = useState<any>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return;

    const q = query(collection(db, "shops"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const shopsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Shop[];
      
      // Basic Analytics Simulation (counting bookings per shop)
      const shopAnalytics: any = {};
      for (const shop of shopsData) {
        const bookingsQ = query(collection(db, "customers"), where("shopId", "==", shop.id));
        const bookingsSnap = await getDocs(bookingsQ);
        shopAnalytics[shop.id] = bookingsSnap.size;
      }
      
      setShops(shopsData.map(s => ({ ...s, bookingCount: shopAnalytics[s.id] || 0 })));
      setAnalytics(shopAnalytics);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, "shops");
    });

    return () => unsubscribe();
  }, [isAdmin]);

  const toggleApproval = async (shop, currentStatus) => {
    setIsProcessing(shop.id);
    try {
      const newStatus = !currentStatus;
      await updateDoc(doc(db, "shops", shop.id), {
        isActive: newStatus,
        status: newStatus ? "approved" : "pending"
      });

      // If approving, upgrade owner role to Vendor_Admin
      if (newStatus && shop.ownerId) {
        await updateDoc(doc(db, "users", shop.ownerId), {
          role: "Vendor_Admin"
        });
      }

      toast.success(newStatus ? "Shop approved and owner promoted to Vendor!" : "Shop disabled");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shop.id}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const toggleVerification = async (shopId: string, currentStatus: boolean) => {
    setIsProcessing(shopId);
    try {
      await updateDoc(doc(db, "shops", shopId), {
        isVerified: !currentStatus
      });
      toast.success(currentStatus ? "Verification badge removed" : "Shop marked as Verified!");
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `shops/${shopId}`);
    } finally {
      setIsProcessing(null);
    }
  };

  if (loading) return null;
  if (!user || !isAdmin) return <Navigate to="/" />;

  return (
    <div className="bg-black min-h-screen py-24 px-6 text-white">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
        >
          <div>
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
              Master Control Panel
            </span>
            <h1 className="text-4xl font-light tracking-tight md:text-5xl">
              SHOP <span className="italic text-primary">MANAGEMENT</span>
            </h1>
          </div>
          <div className="flex gap-4">
            <Card className="bg-zinc-950 border-zinc-900 px-6 py-4 min-w-[150px]">
              <div className="flex items-center gap-3">
                <Store className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Total Shops</p>
                  <p className="text-2xl font-bold">{shops.length}</p>
                </div>
              </div>
            </Card>
            <Card className="bg-zinc-950 border-zinc-900 px-6 py-4 min-w-[150px]">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500">Active Now</p>
                  <p className="text-2xl font-bold">{shops.filter(s => s.isActive).length}</p>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>

        <div className="rounded-[16px] border border-zinc-900 bg-zinc-950 overflow-hidden shadow-2xl">
          <div className="p-6 border-b border-zinc-900 bg-black/50 flex justify-between items-center">
            <h2 className="text-sm uppercase tracking-widest font-bold text-primary">Partner Shops</h2>
            <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-white">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-900 hover:bg-transparent">
                  <TableHead className="text-xs uppercase tracking-widest text-zinc-500">Shop Name</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-zinc-500">Location</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-zinc-500">Bookings</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-zinc-500">Status</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest text-zinc-500">
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Verification
                    </div>
                  </TableHead>
                  <TableHead className="text-right text-xs uppercase tracking-widest text-zinc-500">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shops.length === 0 ? (
                  <TableRow className="border-zinc-900">
                    <TableCell colSpan={6} className="text-center py-20 text-zinc-600 italic">
                      No partner shops found.
                    </TableCell>
                  </TableRow>
                ) : (
                  shops.map((shop) => (
                    <TableRow key={shop.id} className="border-zinc-900 hover:bg-white/5 transition-colors">
                      <TableCell className="py-6">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-lg bg-zinc-900 flex items-center justify-center">
                            <Store className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-bold flex items-center gap-2">
                              {shop.name}
                              {shop.isVerified && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" fill="currentColor" />}
                            </p>
                            <p className="text-[10px] text-zinc-500 tracking-wider">Created: {shop.createdAt ? format(new Date(shop.createdAt), "MMM d, yyyy") : "N/A"}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-zinc-400 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-primary" />
                          {shop.location || "N/A"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary">
                          {shop.bookingCount || 0} Bookings
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={cn(
                            "uppercase text-[10px] tracking-widest py-1",
                            shop.isActive ? "bg-green-500/10 text-green-500 border-green-500/50" : "bg-red-500/10 text-red-500 border-red-500/50"
                          )}
                          variant="outline"
                        >
                          {shop.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col gap-1">
                            <Switch 
                              checked={shop.isVerified} 
                              onCheckedChange={() => toggleVerification(shop.id, shop.isVerified)}
                              disabled={isProcessing === shop.id}
                              className="data-[state=checked]:bg-blue-500"
                            />
                            <span className={cn(
                              "text-[8px] uppercase tracking-tighter font-bold",
                              shop.isVerified ? "text-blue-500" : "text-zinc-600"
                            )}>
                              {shop.isVerified ? "VERIFIED" : "UNVERIFIED"}
                            </span>
                          </div>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={cn(
                                "cursor-help transition-colors",
                                shop.isVerified ? "text-blue-500" : "text-zinc-600"
                              )}>
                                <ShieldCheck className={cn("h-4 w-4", shop.isVerified && "fill-blue-500/10")} />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="bg-zinc-900 border-zinc-800 text-[10px] uppercase tracking-widest p-2">
                              {shop.isVerified ? "Verified Shop" : "Not Verified"}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button asChild variant="ghost" size="icon" className="h-8 w-8 hover:text-primary">
                            <Link to={`/shop/${shop.slug}`} target="_blank">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            onClick={() => toggleApproval(shop, shop.isActive)}
                            disabled={isProcessing === shop.id}
                            className={cn(
                              "h-9 px-4 text-[10px] uppercase tracking-widest font-bold rounded-lg transition-all",
                              shop.isActive 
                                ? "bg-red-500/10 text-red-500 border border-red-500/50 hover:bg-red-500 hover:text-white" 
                                : "bg-primary text-black hover:bg-primary/90 shadow-[0_4px_10px_rgba(234,179,8,0.2)]"
                            )}
                          >
                            {shop.isActive ? <XCircle className="h-4 w-4 mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                            {shop.isActive ? "Disable" : "Approve"}
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
      </div>
    </div>
  );
}
