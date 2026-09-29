import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { db, handleFirestoreError, OperationType } from "@/firebase";
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  serverTimestamp, 
  orderBy,
  getDocs
} from "firebase/firestore";
import { 
  Gift, 
  Share2, 
  Copy, 
  Check, 
  Users, 
  Sparkles, 
  Crown, 
  ArrowRight, 
  Smartphone, 
  Mail, 
  MessageCircle, 
  Send, 
  ShieldCheck, 
  Trophy, 
  Coins, 
  TrendingUp, 
  Calendar, 
  Scissors, 
  Star, 
  QrCode, 
  ExternalLink,
  Zap,
  Info,
  BadgePercent,
  CheckCircle2,
  Clock,
  ChevronRight,
  Flame,
  UserPlus,
  RefreshCw,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import AuthModal from "@/components/AuthModal";
import { ReferralRecord, RewardPerk } from "@/types/referral";
import { format } from "date-fns";

const REWARD_PERKS: RewardPerk[] = [
  {
    id: "perk-250",
    title: "₹250 Direct Booking Credit",
    pointsCost: 250,
    valueText: "₹250 OFF",
    category: "discount",
    description: "Instant deduction applied at checkout for any atelier hair, facial, or grooming treatment.",
    iconName: "BadgePercent",
    code: "REF250-CASH"
  },
  {
    id: "perk-500",
    title: "₹500 VIP Atelier Voucher",
    pointsCost: 500,
    valueText: "₹500 OFF",
    category: "discount",
    description: "Applicable on any signature couture, balayage, or bridal bundle appointment.",
    iconName: "Coins",
    code: "VIP500-LUXE"
  },
  {
    id: "perk-750",
    title: "Kérastase Caviar Hair Therapy",
    pointsCost: 750,
    valueText: "₹1,800 Value",
    category: "service",
    description: "Complimentary revitalizing deep-conditioning scalp and fiber infusion treatment.",
    iconName: "Sparkles",
    code: "KERASTASE-FREE"
  },
  {
    id: "perk-1000",
    title: "24K Gold Facial & Champagne Wash",
    pointsCost: 1000,
    valueText: "₹3,500 Value",
    category: "vip_perk",
    description: "Full complimentary luxury indulgence package with private salon suite upgrade.",
    iconName: "Crown",
    code: "GOLD-EXPERIENCE"
  }
];

export default function ReferralDashboard() {
  const { user, profile, loading } = useAuth();
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [referrals, setReferrals] = useState<ReferralRecord[]>([]);
  const [redeemedPerk, setRedeemedPerk] = useState<RewardPerk | null>(null);
  const [customVanityCode, setCustomVanityCode] = useState("");
  const [isEditingCode, setIsEditingCode] = useState(false);
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Derive unique referral code from profile or user UID
  const referralCode = useMemo(() => {
    if (profile?.referralCode) return profile.referralCode;
    if (user?.uid) {
      const cleanUid = user.uid.substring(0, 6).toUpperCase();
      const cleanName = (user.displayName || "GUEST").split(" ")[0].toUpperCase().replace(/[^A-Z]/g, "");
      return `AURELIA-${cleanName || "VIP"}-${cleanUid}`;
    }
    return "AURELIA-VIP-LUXE";
  }, [profile, user]);

  const inviteLink = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://aurelialuxe.com";
    return `${origin}/book?ref=${referralCode}`;
  }, [referralCode]);

  // Listen to Firestore referrals
  useEffect(() => {
    if (!user) {
      // Seed default sample referrals for non-authenticated preview
      return;
    }

    const referralsRef = collection(db, "referrals");
    // Listen to referrals created for this user
    const q = query(
      referralsRef,
      where("referrerId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as ReferralRecord[];
        
        // Sort by createdAt desc
        docs.sort((a, b) => {
          const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
          const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
          return tB - tA;
        });

        setReferrals(docs);
      },
      (error) => {
        console.warn("Referrals listen error:", error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Points calculation
  const totalEarnedPoints = useMemo(() => {
    // 250 points for each successful referral + profile points
    const referralPoints = referrals.reduce((sum, r) => sum + (r.pointsEarned || 250), 0);
    const profilePoints = profile?.loyaltyPoints || 0;
    return Math.max(referralPoints, profilePoints, (user ? 250 : 0)); // Give 250 initial welcome points
  }, [referrals, profile, user]);

  const successfulReferralsCount = referrals.filter(r => r.status === "completed" || r.status === "rewarded").length;
  const pendingReferralsCount = referrals.filter(r => r.status === "pending").length;
  const totalInvitesSent = Math.max(referrals.length + 3, 5); // Realistic engagement stat

  // VIP Tier calculation
  const currentTier = useMemo(() => {
    if (totalEarnedPoints >= 2000) {
      return {
        name: "Platinum Elite",
        color: "from-zinc-100 via-slate-200 to-zinc-400 text-zinc-900 border-zinc-300",
        badge: "bg-gradient-to-r from-zinc-200 to-slate-100 text-zinc-950 font-bold",
        multiplier: "2.5x Points",
        nextTier: null,
        pointsToNext: 0,
        perk: "Complimentary Valet & Champagne at all flagships"
      };
    }
    if (totalEarnedPoints >= 1000) {
      return {
        name: "Gold Member",
        color: "from-amber-400 via-yellow-200 to-amber-500 text-amber-950 border-amber-300",
        badge: "bg-amber-400 text-black font-bold",
        multiplier: "2.0x Points",
        nextTier: "Platinum Elite",
        pointsToNext: 2000 - totalEarnedPoints,
        perk: "Priority Weekend Booking Window"
      };
    }
    if (totalEarnedPoints >= 500) {
      return {
        name: "Silver VIP",
        color: "from-slate-300 via-slate-100 to-zinc-400 text-slate-900 border-slate-300",
        badge: "bg-slate-200 text-slate-900 font-medium",
        multiplier: "1.5x Points",
        nextTier: "Gold Member",
        pointsToNext: 1000 - totalEarnedPoints,
        perk: "Free Scalp Exfoliation with any Haircut"
      };
    }
    return {
      name: "Bronze Ambassador",
      color: "from-amber-700 via-amber-600 to-amber-800 text-amber-100 border-amber-600",
      badge: "bg-amber-800/80 text-amber-200 border-amber-600/40",
      multiplier: "1.0x Points",
      nextTier: "Silver VIP",
      pointsToNext: 500 - totalEarnedPoints,
      perk: "₹500 Friend Welcome Reward"
    };
  }, [totalEarnedPoints]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedLink(true);
    toast.success("Invite link copied to clipboard! Share it with friends.");
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    toast.success(`Referral code ${referralCode} copied!`);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Aurelia Luxe — Exclusive Salon Referral",
          text: `Treat yourself to a luxury appointment at Aurelia Luxe! Use my code ${referralCode} for ₹500 OFF your first bespoke salon experience:`,
          url: inviteLink,
        });
        toast.success("Shared successfully!");
      } catch (err) {
        // User dismissed share dialog
      }
    } else {
      handleCopyLink();
    }
  };

  const shareViaWhatsApp = () => {
    const text = encodeURIComponent(
      `Hey! ✨ Treat yourself to a VIP appointment at Aurelia Luxe. Use my exclusive invite code *${referralCode}* to get ₹500 OFF your first luxury hair, bridal, or spa treatment:\n\n${inviteLink}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank");
  };

  const shareViaTwitter = () => {
    const text = encodeURIComponent(
      `Get ₹500 OFF your next luxury salon session at @aurelialuxe with my exclusive invite code ${referralCode}! Book here: ${inviteLink} ✨`
    );
    window.open(`https://twitter.com/intent/tweet?text=${text}`, "_blank");
  };

  const shareViaEmail = () => {
    const subject = encodeURIComponent("You've been invited to Aurelia Luxe Salon & Atelier (₹500 Gift)");
    const body = encodeURIComponent(
      `Hi there,\n\nI thought you'd love Aurelia Luxe! Here is my personal referral code for ₹500 OFF your first luxury appointment:\n\nReferral Code: ${referralCode}\nBook Online: ${inviteLink}\n\nEnjoy your pampering!\n${user?.displayName || "Your Friend"}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  };

  const shareViaSMS = () => {
    const body = encodeURIComponent(
      `Here is ₹500 OFF your first luxury appointment at Aurelia Luxe! Use code ${referralCode}: ${inviteLink}`
    );
    window.open(`sms:?body=${body}`, "_blank");
  };

  const handleSaveVanityCode = async () => {
    if (!user) return;
    if (!customVanityCode.trim() || customVanityCode.trim().length < 4) {
      toast.error("Referral code must be at least 4 characters.");
      return;
    }
    const cleanCode = customVanityCode.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
    setIsSavingCode(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        referralCode: cleanCode,
      });
      toast.success(`Personalized code saved as ${cleanCode}!`);
      setIsEditingCode(false);
    } catch (err) {
      toast.error("Failed to update referral code. Please try again.");
    } finally {
      setIsSavingCode(false);
    }
  };

  // Interactive Test Simulation for the user to try the referral mechanism
  const handleSimulateFriendBooking = async () => {
    if (!user) {
      toast.error("Please sign in to test the referral system.");
      return;
    }

    setIsSimulating(true);
    try {
      const sampleNames = ["Priya Sharma", "Aarav Mehta", "Siddharth Rao", "Ananya Deshmukh", "Zara Fernandez"];
      const sampleServices = ["Bespoke Dimensional Balayage", "Royal Grooming & Hot Towel Shave", "24K Gold Revival Facial", "Hydra-Gloss Blowout"];
      const randomName = sampleNames[Math.floor(Math.random() * sampleNames.length)];
      const randomService = sampleServices[Math.floor(Math.random() * sampleServices.length)];

      const referralsRef = collection(db, "referrals");
      await addDoc(referralsRef, {
        referrerId: user.uid,
        referralCode: referralCode,
        referredUserId: "simulated-user-" + Date.now(),
        referredUserName: randomName,
        referredUserEmail: `${randomName.toLowerCase().replace(" ", ".")}@example.com`,
        service: randomService,
        amount: 2800,
        pointsEarned: 250,
        status: "completed",
        createdAt: serverTimestamp()
      });

      // Update user points in profile
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        loyaltyPoints: totalEarnedPoints + 250
      });

      toast.success(`🎉 Demo Booking Confirmed: ${randomName} booked "${randomService}" using your code! +250 Loyalty Points credited.`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to complete demo simulation.");
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-24">
      {/* Hero Header */}
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-b from-card via-background to-background py-16 md:py-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(212,175,55,0.08),transparent_70%)] pointer-events-none" />
        <div className="mx-auto max-w-7xl px-6 relative z-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-widest text-primary mb-4">
                <Gift className="h-3.5 w-3.5" />
                Aurelia Privé Referral Program
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight text-foreground">
                Share The Luxury. <br />
                <span className="italic text-primary font-normal">Earn Loyalty Points.</span>
              </h1>
              <p className="mt-4 text-base text-muted-foreground leading-relaxed">
                Invite friends and family to indulge in Aurelia Luxe’s signature hair, couture, and bridal treatments. 
                They receive an exclusive <span className="text-foreground font-semibold">₹500 welcome reward</span>, 
                and you earn <span className="text-primary font-semibold">250 Loyalty Points</span> for every confirmed booking.
              </p>
            </div>

            {/* Quick Status Pill */}
            <div className="w-full md:w-auto flex flex-col sm:flex-row md:flex-col gap-4">
              <Card className="border-border bg-card/60 backdrop-blur-md shadow-xl border-primary/20 p-6 min-w-[280px]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Your Balance</span>
                  <Badge variant="outline" className={cn("text-xs uppercase", currentTier.badge)}>
                    {currentTier.name}
                  </Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold font-serif text-primary">{totalEarnedPoints}</span>
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Points</span>
                </div>
                <div className="mt-2 text-[11px] text-muted-foreground flex items-center justify-between">
                  <span>₹{totalEarnedPoints} redemption value</span>
                  <span className="text-emerald-400 font-medium">{currentTier.multiplier}</span>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl px-6 -mt-6">
        {/* Top Invite Generator Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="rounded-2xl border border-primary/30 bg-card p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl"
        >
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left: Code & Link */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary font-semibold mb-1">
                  <Sparkles className="h-4 w-4" />
                  Your Unique Referral Invite
                </div>
                <h2 className="text-2xl font-serif text-foreground">Personalized Booking Link & Code</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  When a friend clicks this link or enters your code at checkout, their ₹500 welcome credit applies automatically.
                </p>
              </div>

              {/* Referral Code Display */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Your Referral Code</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 flex items-center justify-between rounded-xl border border-border bg-background/80 px-4 py-3 font-mono text-sm tracking-widest text-primary font-bold shadow-inner">
                    <span>{referralCode}</span>
                    <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 uppercase">
                      Active
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleCopyCode}
                    className="gap-2 border-primary/40 hover:bg-primary/10 text-primary shrink-0 h-11"
                  >
                    {copiedCode ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    {copiedCode ? "Copied" : "Copy Code"}
                  </Button>
                </div>
              </div>

              {/* Shareable Invite URL */}
              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-widest text-muted-foreground">Shareable Invite Link</Label>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="flex-1 overflow-hidden rounded-xl border border-border bg-background/80 px-4 py-3 text-xs text-muted-foreground shadow-inner truncate font-mono">
                    {inviteLink}
                  </div>
                  <Button
                    onClick={handleCopyLink}
                    className="gap-2 bg-primary text-black hover:bg-primary/90 font-medium shrink-0 h-11 uppercase tracking-wider text-xs"
                  >
                    {copiedLink ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                    {copiedLink ? "Link Copied!" : "Copy Link"}
                  </Button>
                </div>
              </div>

              {/* Instant Social Share Buttons */}
              <div className="pt-2">
                <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quick Share via</div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareViaWhatsApp}
                    className="gap-2 border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40 text-emerald-400 text-xs"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    WhatsApp
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareViaTwitter}
                    className="gap-2 border-sky-500/30 bg-sky-950/20 hover:bg-sky-950/40 text-sky-400 text-xs"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Twitter / X
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareViaEmail}
                    className="gap-2 border-border hover:bg-white/5 text-xs"
                  >
                    <Mail className="h-3.5 w-3.5" />
                    Email
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={shareViaSMS}
                    className="gap-2 border-border hover:bg-white/5 text-xs"
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                    SMS
                  </Button>
                  {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNativeShare}
                      className="gap-2 border-primary/30 text-primary hover:bg-primary/10 text-xs"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                      More Apps
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Right: VIP Benefit Highlights Card */}
            <div className="lg:col-span-5 rounded-xl border border-border/80 bg-gradient-to-br from-card via-card/90 to-background p-6 space-y-5">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <span className="text-sm font-semibold uppercase tracking-wider text-foreground">Referral Rewards</span>
                </div>
                <Badge variant="outline" className="border-amber-500/40 text-amber-300 text-[10px] uppercase">
                  Instant Credit
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">₹500 Friend Welcome Gift</div>
                    <div className="text-xs text-muted-foreground">Your friend receives ₹500 off their first hair, couture, or bridal session.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <Coins className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">+250 Loyalty Points For You</div>
                    <div className="text-xs text-muted-foreground">Automatically credited upon completed appointment. 1 Point = ₹1 value.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Crown className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">VIP Tier Upgrades</div>
                    <div className="text-xs text-muted-foreground">Unlock priority booking, champagne salon upgrades, and 2.5x point multipliers.</div>
                  </div>
                </div>
              </div>

              {/* Test Sandbox Trigger */}
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Test the Referral Loop:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isSimulating}
                    onClick={handleSimulateFriendBooking}
                    className="text-[11px] uppercase tracking-wider text-primary hover:bg-primary/10 h-7 px-2"
                  >
                    {isSimulating ? (
                      <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                    ) : (
                      <Zap className="h-3 w-3 mr-1 text-amber-400" />
                    )}
                    Simulate Booking (+250 Pts)
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 4 Stat Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          <Card className="border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs uppercase tracking-widest">Total Points</span>
              <Coins className="h-4 w-4 text-primary" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-primary">{totalEarnedPoints}</div>
            <p className="text-[11px] text-muted-foreground mt-1">₹{totalEarnedPoints} Redeemable Value</p>
          </Card>

          <Card className="border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs uppercase tracking-widest">Successful Bookings</span>
              <Users className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">{successfulReferralsCount}</div>
            <p className="text-[11px] text-emerald-400 mt-1">Confirmed appointments</p>
          </Card>

          <Card className="border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs uppercase tracking-widest">Pending Visits</span>
              <Clock className="h-4 w-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-bold font-serif text-foreground">{pendingReferralsCount}</div>
            <p className="text-[11px] text-amber-400 mt-1">Scheduled appointments</p>
          </Card>

          <Card className="border-border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs uppercase tracking-widest">VIP Tier</span>
              <Crown className="h-4 w-4 text-primary" />
            </div>
            <div className="text-lg sm:text-xl font-bold text-foreground truncate">{currentTier.name}</div>
            <p className="text-[11px] text-muted-foreground mt-1">{currentTier.multiplier}</p>
          </Card>
        </div>

        {/* Tier Progress Bar */}
        {currentTier.nextTier && (
          <Card className="border-border bg-card/60 p-6 mt-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-foreground">
                  Tier Milestone: <span className="text-primary font-semibold">{currentTier.nextTier}</span>
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Earn <span className="text-primary font-bold">{currentTier.pointsToNext} more points</span> to level up
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary/80">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-primary transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(15, ((totalEarnedPoints % 1000) / 1000) * 100))}%`,
                }}
              />
            </div>
          </Card>
        )}

        {/* Tabbed Navigation: Activity Log, Rewards Redemption, How It Works */}
        <div className="mt-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="bg-secondary/40 border border-border p-1">
              <TabsTrigger value="overview" className="text-xs uppercase tracking-wider gap-2">
                <Users className="h-3.5 w-3.5" />
                Referral Activity ({referrals.length})
              </TabsTrigger>
              <TabsTrigger value="rewards" className="text-xs uppercase tracking-wider gap-2">
                <Gift className="h-3.5 w-3.5" />
                Redeem Rewards
              </TabsTrigger>
              <TabsTrigger value="how-it-works" className="text-xs uppercase tracking-wider gap-2">
                <Info className="h-3.5 w-3.5" />
                How It Works
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: REFERRAL ACTIVITY LOG */}
            <TabsContent value="overview" className="space-y-6">
              <Card className="border-border bg-card">
                <CardHeader className="border-b border-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-serif">Referral History & Bookings</CardTitle>
                      <CardDescription className="text-xs">
                        Real-time tracking of friends who booked treatments using your invite link or code.
                      </CardDescription>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleCopyLink}
                      className="text-xs uppercase tracking-wider border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Share2 className="h-3.5 w-3.5 mr-2" />
                      Invite More Friends
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {referrals.length === 0 ? (
                    <div className="p-12 text-center space-y-4">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/20">
                        <Users className="h-6 w-6" />
                      </div>
                      <h3 className="text-base font-serif text-foreground">No Referrals Yet</h3>
                      <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                        Share your personalized code <strong className="text-primary font-mono">{referralCode}</strong> with friends, family, or social followers to start earning loyalty points!
                      </p>
                      <div className="pt-2 flex justify-center gap-3">
                        <Button 
                          onClick={handleCopyLink}
                          className="bg-primary text-black hover:bg-primary/90 text-xs uppercase tracking-wider"
                        >
                          <Copy className="h-3.5 w-3.5 mr-2" />
                          Copy Invite Link
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={handleSimulateFriendBooking}
                          disabled={isSimulating}
                          className="text-xs uppercase tracking-wider border-border hover:bg-white/5"
                        >
                          <Zap className="h-3.5 w-3.5 mr-2 text-amber-400" />
                          Simulate Test Referral
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {referrals.map((ref) => (
                        <div key={ref.id} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary border border-border text-foreground font-serif font-bold text-sm">
                              {ref.referredUserName ? ref.referredUserName.charAt(0) : "F"}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm text-foreground">{ref.referredUserName || "Referred Friend"}</span>
                                <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px] uppercase",
                                    ref.status === "completed" || ref.status === "rewarded"
                                      ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/30"
                                      : "bg-amber-950/40 text-amber-400 border-amber-500/30"
                                  )}
                                >
                                  {ref.status === "completed" || ref.status === "rewarded" ? "Completed" : "Scheduled"}
                                </Badge>
                              </div>
                              <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                                <Scissors className="h-3 w-3" />
                                <span>{ref.service || "Salon Treatment"}</span>
                                <span>•</span>
                                <span>{ref.createdAt?.toDate ? format(ref.createdAt.toDate(), "MMM d, yyyy") : "Recent"}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 self-end sm:self-auto">
                            <div className="text-right">
                              <div className="text-sm font-bold text-primary font-mono">+{ref.pointsEarned || 250} Pts</div>
                              <div className="text-[10px] text-muted-foreground">Credited to Balance</div>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* TAB 2: REDEEM LOYALTY REWARDS */}
            <TabsContent value="rewards" className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-serif text-foreground">Redeem Loyalty Points</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Convert your accumulated referral balance into salon credit vouchers or complimentary VIP treatments.
                  </p>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2">
                  <Coins className="h-4 w-4 text-primary" />
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">Available:</span>
                  <span className="text-sm font-bold text-primary font-mono">{totalEarnedPoints} Points</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {REWARD_PERKS.map((perk) => {
                  const canAfford = totalEarnedPoints >= perk.pointsCost;

                  return (
                    <Card 
                      key={perk.id} 
                      className={cn(
                        "border-border bg-card transition-all hover:border-primary/40 relative overflow-hidden",
                        !canAfford && "opacity-80"
                      )}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] uppercase border-primary/30 text-primary">
                            {perk.valueText}
                          </Badge>
                          <div className="flex items-center gap-1 font-mono text-xs font-bold text-primary">
                            <Coins className="h-3.5 w-3.5" />
                            {perk.pointsCost} Points
                          </div>
                        </div>
                        <CardTitle className="text-base font-serif text-foreground mt-2">{perk.title}</CardTitle>
                        <CardDescription className="text-xs leading-relaxed">{perk.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="pt-2 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[11px] font-mono text-muted-foreground">Voucher: {perk.code}</span>
                        <Button
                          size="sm"
                          disabled={!canAfford}
                          onClick={() => {
                            setRedeemedPerk(perk);
                            toast.success(`Redeemed ${perk.title}! Coupon code ready.`);
                          }}
                          className={cn(
                            "text-xs uppercase tracking-wider",
                            canAfford 
                              ? "bg-primary text-black hover:bg-primary/90" 
                              : "bg-secondary text-muted-foreground cursor-not-allowed"
                          )}
                        >
                          {canAfford ? "Redeem Perk" : `Need ${perk.pointsCost - totalEarnedPoints} Pts`}
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>

            {/* TAB 3: HOW IT WORKS */}
            <TabsContent value="how-it-works" className="space-y-6">
              <Card className="border-border bg-card p-6 md:p-8">
                <div className="text-center max-w-2xl mx-auto mb-10">
                  <Badge variant="outline" className="border-primary/30 text-primary text-xs uppercase mb-2">
                    Simple 4-Step Cycle
                  </Badge>
                  <h3 className="text-2xl font-serif text-foreground">How The Referral Program Works</h3>
                  <p className="text-xs text-muted-foreground mt-2">
                    Reward your circle with Mumbai's most prestigious salon experiences while stacking points for your own self-care.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                  <div className="rounded-xl border border-border bg-background p-5 space-y-3 relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold font-serif text-lg border border-primary/20">
                      1
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Share Your Invite</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Copy your unique link or share via WhatsApp, Twitter, SMS, or email with your friends and family.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-5 space-y-3 relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 font-bold font-serif text-lg border border-emerald-500/20">
                      2
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Friend Gets ₹500</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your friend receives an instant ₹500 welcome deduction automatically when booking their first appointment.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-5 space-y-3 relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 font-bold font-serif text-lg border border-amber-500/20">
                      3
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Earn 250 Points</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Once their appointment is confirmed, 250 Loyalty Points are credited straight to your account balance.
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-background p-5 space-y-3 relative">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold font-serif text-lg border border-primary/20">
                      4
                    </div>
                    <h4 className="text-sm font-semibold text-foreground">Redeem For Luxury</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Use your points for billing discounts, complimentary hair spas, gold facials, or VIP salon perks.
                    </p>
                  </div>
                </div>

                <div className="mt-10 p-6 rounded-xl border border-primary/20 bg-primary/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">Ready to start earning rewards?</h4>
                    <p className="text-xs text-muted-foreground">Share your invite code with 3 friends today to unlock Silver VIP status.</p>
                  </div>
                  <Button 
                    onClick={handleCopyLink}
                    className="bg-primary text-black hover:bg-primary/90 text-xs uppercase tracking-wider shrink-0"
                  >
                    <Share2 className="h-3.5 w-3.5 mr-2" />
                    Share Invite Link
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Redeemed Perk Modal */}
      <Dialog open={!!redeemedPerk} onOpenChange={(open) => !open && setRedeemedPerk(null)}>
        <DialogContent className="sm:max-w-md border-border bg-card">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary border border-primary/30 mb-2">
              <Gift className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-xl font-serif">Reward Unlocked!</DialogTitle>
            <DialogDescription className="text-center text-xs">
              You have successfully redeemed {redeemedPerk?.title}.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4 text-center">
              <span className="text-[11px] uppercase tracking-widest text-muted-foreground block mb-1">Your Redemption Voucher Code</span>
              <div className="font-mono text-lg font-bold text-primary tracking-widest">{redeemedPerk?.code}</div>
              <p className="text-[11px] text-muted-foreground mt-2">
                Present this code to the concierge during your atelier visit or enter it during online checkout.
              </p>
            </div>

            <Button
              onClick={() => {
                navigator.clipboard.writeText(redeemedPerk?.code || "");
                toast.success("Voucher code copied to clipboard!");
                setRedeemedPerk(null);
              }}
              className="w-full bg-primary text-black hover:bg-primary/90 text-xs uppercase tracking-wider"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Voucher & Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
