import React, { useState } from "react";
import { motion } from "motion/react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { 
  Crown, 
  Sparkles, 
  Gift, 
  Check, 
  Calendar, 
  ArrowRight, 
  Percent, 
  Coffee, 
  Scissors, 
  Copy, 
  CheckCircle2, 
  Trophy, 
  Flame, 
  RefreshCw, 
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface Appointment {
  id: string;
  name: string;
  phone?: string;
  service?: string;
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

interface LoyaltyRewardsProps {
  appointments: Appointment[];
  user: any;
  profile?: any;
  onBookClick?: () => void;
}

export const GOLD_THRESHOLD = 5;
export const SILVER_THRESHOLD = 3;
export const PLATINUM_THRESHOLD = 10;

export default function LoyaltyRewards({
  appointments,
  user,
  profile,
  onBookClick
}: LoyaltyRewardsProps) {
  // Bonus demo visits for testing milestone progression
  const [bonusVisits, setBonusVisits] = useState<number>(0);
  const [copiedCode, setCopiedCode] = useState(false);

  // Filter qualifying visits (completed or confirmed or pending non-cancelled)
  const realVisits = appointments.filter(
    (app) => app.status === "completed" || app.status === "confirmed" || app.status === "pending"
  );
  
  // Total visits tracked including any interactive simulated demo visits for testing
  const totalVisits = Math.max(0, realVisits.length + bonusVisits);

  // Tier calculation
  const getTier = (visits: number) => {
    if (visits >= PLATINUM_THRESHOLD) {
      return {
        name: "Platinum Elite",
        color: "from-zinc-300 via-slate-100 to-zinc-400 text-zinc-900",
        badgeBg: "bg-slate-100 text-black border-slate-300",
        glow: "shadow-[0_0_25px_rgba(255,255,255,0.25)]",
        discount: "25% OFF",
        ptsMultiplier: "2.5x",
        visitsNeededForNext: 0,
        nextTier: null
      };
    }
    if (visits >= GOLD_THRESHOLD) {
      return {
        name: "Gold Member",
        color: "from-amber-400 via-yellow-200 to-amber-500 text-amber-950",
        badgeBg: "bg-amber-400 text-black border-amber-300 font-bold",
        glow: "shadow-[0_0_30px_rgba(234,179,8,0.35)]",
        discount: "20% OFF",
        ptsMultiplier: "2.0x",
        visitsNeededForNext: PLATINUM_THRESHOLD - visits,
        nextTier: "Platinum Elite"
      };
    }
    if (visits >= SILVER_THRESHOLD) {
      return {
        name: "Silver Member",
        color: "from-slate-200 via-gray-100 to-slate-300 text-slate-900",
        badgeBg: "bg-slate-300 text-slate-900 border-slate-400",
        glow: "shadow-[0_0_20px_rgba(203,213,225,0.2)]",
        discount: "10% OFF",
        ptsMultiplier: "1.5x",
        visitsNeededForNext: GOLD_THRESHOLD - visits,
        nextTier: "Gold Member"
      };
    }
    return {
      name: "Bronze Member",
      color: "from-amber-800 via-amber-700 to-amber-900 text-amber-100",
      badgeBg: "bg-amber-900/50 text-amber-300 border-amber-700/50",
      glow: "shadow-none",
      discount: "5% Welcome Bonus",
      ptsMultiplier: "1.0x",
      visitsNeededForNext: SILVER_THRESHOLD - visits,
      nextTier: "Silver Member"
    };
  };

  const currentTier = getTier(totalVisits);
  const isGold = totalVisits >= GOLD_THRESHOLD;
  const visitsToGold = Math.max(0, GOLD_THRESHOLD - totalVisits);
  const progressToGold = Math.min(100, Math.round((totalVisits / GOLD_THRESHOLD) * 100));

  // Points calculation: 100 points per visit
  const totalPoints = totalVisits * 100 + (isGold ? 500 : totalVisits >= SILVER_THRESHOLD ? 200 : 50);

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    toast.success(`Coupon code ${code} copied to clipboard!`);
    setTimeout(() => setCopiedCode(false), 3000);
  };

  const perksList = [
    {
      id: "gold-discount",
      title: "20% Off All Salon Services",
      desc: "Apply on any luxury haircut, styling, color, or spa ritual at checkout.",
      code: "GOLDLUXE20",
      unlockedAt: GOLD_THRESHOLD,
      icon: Percent,
      category: "Savings"
    },
    {
      id: "scalp-massage",
      title: "Complimentary Scalp Ritual",
      desc: "15-minute invigorating botanical scalp massage during your hair wash.",
      code: "SCALPRELAX",
      unlockedAt: SILVER_THRESHOLD,
      icon: Scissors,
      category: "Treatment"
    },
    {
      id: "vip-booking",
      title: "Guaranteed Weekend Priority",
      desc: "Direct access to prime Friday-Sunday appointments with zero wait time.",
      code: "VIPSLOT",
      unlockedAt: GOLD_THRESHOLD,
      icon: Crown,
      category: "Privilege"
    },
    {
      id: "free-spa",
      title: "5th Visit Deluxe Hair Spa Upgrade",
      desc: "Full organic argan oil hair deep-conditioning ritual on us.",
      code: "GOLDSPAFREE",
      unlockedAt: GOLD_THRESHOLD,
      icon: Sparkles,
      category: "Gift"
    },
    {
      id: "birthday-styling",
      title: "Birthday Celebration Makeover",
      desc: "Complimentary signature blow-dry and glass of sparkling beverage on your birthday.",
      code: "BDAYLUXE",
      unlockedAt: GOLD_THRESHOLD,
      icon: Gift,
      category: "Exclusive"
    },
    {
      id: "welcome-glow",
      title: "Artisanal Welcome Beverage",
      desc: "Choice of single-origin espresso, matcha latte, or infused herbal tea.",
      code: "WELCOMECAFE",
      unlockedAt: 1,
      icon: Coffee,
      category: "Hospitality"
    }
  ];

  // Quick repeat booking recommended services
  const recommendedServices = [
    { name: "Royal Hair Cut & Finish", price: 65, duration: "45m" },
    { name: "Aromatherapy Hair Spa", price: 85, duration: "60m" },
    { name: "Luxury Beard Sculpt & Hot Towel", price: 45, duration: "35m" },
    { name: "Signature Glow Radiance Facial", price: 110, duration: "60m" }
  ];

  return (
    <div className="space-y-10">
      {/* Top Banner / Celebration if Gold Achieved */}
      {isGold ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-black p-6 md:p-8 shadow-[0_0_50px_rgba(234,179,8,0.15)]"
        >
          <div className="absolute top-0 right-0 -mr-8 -mt-8 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-yellow-600 text-black shadow-lg shadow-amber-500/30">
                <Crown className="h-8 w-8 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-amber-400 text-black text-[10px] font-bold uppercase tracking-widest px-2 py-0.5">
                    Gold Member Active
                  </Badge>
                  <span className="flex items-center gap-1 text-xs text-amber-300 font-mono">
                    <Sparkles className="h-3.5 w-3.5" /> VIP Privileges Unlocked
                  </span>
                </div>
                <h2 className="mt-1 text-2xl md:text-3xl font-light tracking-tight text-white">
                  Welcome to Aurelia <span className="font-serif italic text-amber-400">Gold Society</span>
                </h2>
                <p className="mt-1 text-xs md:text-sm text-zinc-300 max-w-xl">
                  You have logged {totalVisits} qualifying visits. You enjoy 20% off every booking, priority styling reservations, and complimentary spa rituals.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              <Button
                onClick={() => copyPromoCode("GOLDLUXE20")}
                variant="outline"
                className="w-full sm:w-auto border-amber-500/50 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 gap-2 text-xs uppercase tracking-widest font-semibold"
              >
                {copiedCode ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                {copiedCode ? "Code Copied!" : "Copy 20% Code: GOLDLUXE20"}
              </Button>
              <Button
                asChild
                className="w-full sm:w-auto bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-bold uppercase tracking-widest hover:brightness-110 shadow-lg shadow-amber-500/20 text-xs"
              >
                <Link to="/book">
                  Book Next VIP Visit <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-background to-card p-6 md:p-8"
        >
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2">
                <Badge className={cn("text-[10px] uppercase tracking-widest font-semibold", currentTier.badgeBg)}>
                  {currentTier.name}
                </Badge>
                <span className="text-xs text-primary font-medium flex items-center gap-1">
                  <Flame className="h-3.5 w-3.5 text-amber-400" />
                  {visitsToGold} {visitsToGold === 1 ? "visit" : "visits"} away from Gold Member!
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-light tracking-tight">
                Unlock <span className="font-serif italic text-primary">Gold Member</span> Status
              </h2>
              <p className="text-xs md:text-sm text-muted-foreground leading-relaxed">
                Reach 5 salon visits to unlock 20% savings on all services, guaranteed weekend priority appointments, and complimentary deluxe hair spa treatments.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto shrink-0">
              <Button
                asChild
                className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs px-6 py-5 shadow-lg shadow-primary/20"
              >
                <Link to="/book">
                  Book Next Appointment <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Progress Bar towards Gold */}
          <div className="mt-8 pt-6 border-t border-border/60">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="uppercase tracking-widest font-medium text-foreground flex items-center gap-2">
                <Trophy className="h-3.5 w-3.5 text-amber-400" />
                Progress to Gold Member
              </span>
              <span className="font-mono text-primary font-bold">
                {totalVisits} / {GOLD_THRESHOLD} Visits ({progressToGold}%)
              </span>
            </div>

            <div className="h-3.5 w-full rounded-full bg-zinc-900 border border-zinc-800 p-0.5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressToGold}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 shadow-[0_0_12px_rgba(234,179,8,0.5)]"
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Bronze (0-2 visits)</span>
              <span>Silver (3-4 visits)</span>
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Crown className="h-3 w-3" /> Gold Target (5 visits)
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Grid: Digital Stamp Card + Luxury Member Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Col: 5-Stamp Digital Punch Card (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border bg-card shadow-xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-light tracking-tight flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Digital Visit Punch Card
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Earn 1 stamp with every completed salon visit. Unlock perks at every milestone.
                  </CardDescription>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">Balance</span>
                  <span className="text-lg font-bold font-mono text-primary">{totalPoints} Pts</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* 5-Stamp Slot Grid */}
              <div className="grid grid-cols-5 gap-2 sm:gap-4 py-4">
                {[1, 2, 3, 4, 5].map((slotNumber) => {
                  const isCompleted = totalVisits >= slotNumber;
                  const isCurrent = totalVisits + 1 === slotNumber;
                  const visitRecord = realVisits[slotNumber - 1];

                  return (
                    <motion.div
                      key={slotNumber}
                      whileHover={{ scale: 1.04 }}
                      className={cn(
                        "relative flex flex-col items-center justify-center rounded-xl p-3 sm:p-4 text-center transition-all border",
                        isCompleted
                          ? slotNumber === 5
                            ? "bg-gradient-to-b from-amber-400/20 to-amber-950/40 border-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.3)] text-amber-300"
                            : "bg-primary/10 border-primary/40 text-primary"
                          : isCurrent
                          ? "bg-primary/5 border-primary/50 border-dashed animate-pulse text-foreground"
                          : "bg-background/40 border-border/60 text-muted-foreground opacity-60"
                      )}
                    >
                      {/* Badge indicator */}
                      <span className="text-[10px] font-mono uppercase tracking-wider mb-1.5 opacity-80">
                        Visit {slotNumber}
                      </span>

                      {/* Icon */}
                      <div
                        className={cn(
                          "h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center transition-all",
                          isCompleted
                            ? slotNumber === 5
                              ? "bg-amber-400 text-black shadow-lg shadow-amber-400/40"
                              : "bg-primary text-black shadow-md shadow-primary/20"
                            : isCurrent
                            ? "bg-primary/20 text-primary border border-primary/40"
                            : "bg-zinc-800/80 text-zinc-500 border border-zinc-700/50"
                        )}
                      >
                        {isCompleted ? (
                          slotNumber === 5 ? (
                            <Crown className="h-6 w-6 stroke-[2.5]" />
                          ) : (
                            <Check className="h-5 w-5 stroke-[2.5]" />
                          )
                        ) : slotNumber === 5 ? (
                          <Crown className="h-5 w-5 opacity-60" />
                        ) : slotNumber === 3 ? (
                          <Gift className="h-4 w-4 opacity-60" />
                        ) : (
                          <Scissors className="h-4 w-4 opacity-40" />
                        )}
                      </div>

                      {/* Label below */}
                      <span className="mt-2 text-[10px] font-medium leading-tight">
                        {isCompleted ? (
                          slotNumber === 5 ? "GOLD VIP" : "Stamped"
                        ) : slotNumber === 5 ? (
                          "Gold Status"
                        ) : slotNumber === 3 ? (
                          "10% Perk"
                        ) : isCurrent ? (
                          "Next Visit"
                        ) : (
                          "Locked"
                        )}
                      </span>

                      {/* Tooltip detail if visited */}
                      {visitRecord && (
                        <span className="text-[8px] text-muted-foreground/80 mt-1 truncate max-w-full">
                          {visitRecord.date ? format(new Date(visitRecord.date), "MMM d") : "Visited"}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              {/* Next Milestone Incentive Callout */}
              <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Flame className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      {isGold
                        ? "Gold Status Active — Keep Earning!"
                        : totalVisits >= SILVER_THRESHOLD
                        ? "Next Visit Brings You Closer to Gold!"
                        : "Next Visit Goal: Unlock Silver Tier at 3 Visits"}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {isGold
                        ? "Every visit earns 100 bonus loyalty points redeemable for premium salon treatments."
                        : `Complete ${visitsToGold} more ${visitsToGold === 1 ? "booking" : "bookings"} to attain permanent Gold Member perks & 20% discount.`}
                    </p>
                  </div>
                </div>

                <Button
                  asChild
                  size="sm"
                  className="bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-[10px] shrink-0"
                >
                  <Link to="/book">Book Now</Link>
                </Button>
              </div>

              {/* Interactive Demo Visit Check-in Button (helpful for evaluating the feature) */}
              <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground">
                <span className="text-[11px]">Testing or previewing the loyalty tiers?</span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setBonusVisits((prev) => prev + 1);
                      toast.success("Added 1 visit check-in! Watch your tier progress.");
                    }}
                    className="h-7 text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10 gap-1.5"
                  >
                    <Sparkles className="h-3 w-3" />
                    +1 Test Visit
                  </Button>
                  {bonusVisits > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setBonusVisits(0);
                        toast.info("Reset test visits to your actual booking count.");
                      }}
                      className="h-7 text-[10px] uppercase tracking-widest text-muted-foreground hover:text-red-400 gap-1"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Reset
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Repeat Booking Recommendations */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-light tracking-tight">
                    Repeat Favorite Services
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Quickly re-book your preferred salon services to log your next visit.
                  </CardDescription>
                </div>
                <Button asChild variant="link" className="text-xs text-primary p-0 h-auto">
                  <Link to="/services">View All Services →</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {recommendedServices.map((srv, idx) => (
                  <div
                    key={idx}
                    className="group flex items-center justify-between p-3.5 rounded-xl border border-border bg-background/50 hover:border-primary/40 hover:bg-primary/5 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                        {srv.name}
                      </h4>
                      <p className="text-[11px] text-muted-foreground font-mono">
                        ${srv.price} • {srv.duration}
                      </p>
                    </div>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="border-primary/30 text-primary hover:bg-primary hover:text-black text-[10px] font-bold uppercase tracking-widest h-8 px-3"
                    >
                      <Link to="/book">Re-Book</Link>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Col: Luxury VIP Member Card & Status Summary (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Digital VIP Membership Card */}
          <div className="relative group">
            <div
              className={cn(
                "relative overflow-hidden rounded-2xl p-6 sm:p-7 border transition-all duration-500",
                isGold
                  ? "bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/80 border-amber-400/60 shadow-[0_0_35px_rgba(234,179,8,0.25)]"
                  : totalVisits >= SILVER_THRESHOLD
                  ? "bg-gradient-to-br from-zinc-950 via-slate-900 to-slate-800 border-slate-400/50 shadow-lg"
                  : "bg-gradient-to-br from-zinc-950 via-stone-900 to-amber-950/30 border-primary/30 shadow-lg"
              )}
            >
              {/* Card Holographic / Ambient highlights */}
              <div className="absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-amber-400/20 to-transparent blur-2xl" />
              <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-gradient-to-tr from-primary/10 to-transparent blur-2xl" />

              {/* Card Header */}
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400 block">
                    Aurelia Luxe Salon
                  </span>
                  <h3 className="font-serif italic text-lg text-primary tracking-wide">
                    Privilege Membership
                  </h3>
                </div>
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border shadow-md",
                    isGold
                      ? "border-amber-400 bg-amber-400/20 text-amber-300"
                      : "border-primary/40 bg-primary/10 text-primary"
                  )}
                >
                  <Crown className="h-6 w-6" />
                </div>
              </div>

              {/* Card Middle: Status & Discount */}
              <div className="relative z-10 my-8">
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "text-xs px-3 py-1 uppercase tracking-widest font-bold",
                      currentTier.badgeBg
                    )}
                  >
                    {currentTier.name}
                  </Badge>
                  {isGold && (
                    <span className="text-[10px] text-amber-300 font-mono tracking-wider">
                      ★ VIP REWARD ACTIVE
                    </span>
                  )}
                </div>

                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-light tracking-tight text-white">
                    {currentTier.discount}
                  </span>
                  <span className="text-xs text-zinc-400 uppercase tracking-widest">
                    on all bookings
                  </span>
                </div>
              </div>

              {/* Card Footer: Client Details & Code */}
              <div className="relative z-10 pt-4 border-t border-white/10 flex items-end justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">
                    Member Name
                  </span>
                  <span className="text-sm font-medium text-white tracking-wide truncate max-w-[180px] block">
                    {user?.displayName || profile?.displayName || "Valued Patron"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase tracking-widest text-zinc-500 block">
                    Membership ID
                  </span>
                  <span className="text-xs font-mono text-primary tracking-wider">
                    AL-{(user?.uid || "MEMBER").slice(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Gold Member Privileges Checklist */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-medium uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Tier Benefits Comparison
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2.5 text-xs">
                <div className="flex items-start gap-2.5 p-2 rounded-lg bg-background/40">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-foreground">Bronze Member (1-2 visits)</span>
                    <p className="text-muted-foreground text-[11px]">Welcome espresso / tea, standard booking, earn 100 pts/visit</p>
                  </div>
                </div>

                <div className={cn(
                  "flex items-start gap-2.5 p-2 rounded-lg transition-colors",
                  totalVisits >= SILVER_THRESHOLD ? "bg-primary/10 border border-primary/20" : "bg-background/40"
                )}>
                  <CheckCircle2 className={cn(
                    "h-4 w-4 shrink-0 mt-0.5",
                    totalVisits >= SILVER_THRESHOLD ? "text-primary" : "text-zinc-600"
                  )} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-foreground">Silver Member (3-4 visits)</span>
                      {totalVisits >= SILVER_THRESHOLD && (
                        <Badge className="bg-primary/20 text-primary text-[8px] h-4 px-1 leading-none">ACTIVE</Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-[11px]">10% off services, complimentary scalp relaxation ritual, priority booking</p>
                  </div>
                </div>

                <div className={cn(
                  "flex items-start gap-2.5 p-2.5 rounded-lg border transition-all",
                  isGold 
                    ? "bg-gradient-to-r from-amber-950/40 to-amber-900/20 border-amber-500/50 shadow-sm" 
                    : "bg-background/40 border-border"
                )}>
                  <Crown className={cn(
                    "h-4 w-4 shrink-0 mt-0.5",
                    isGold ? "text-amber-400" : "text-amber-500/50"
                  )} />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-amber-300">Gold Member (5+ visits)</span>
                      {isGold && (
                        <Badge className="bg-amber-400 text-black text-[8px] h-4 px-1.5 font-bold leading-none">UNLOCKED</Badge>
                      )}
                    </div>
                    <p className="text-zinc-300 text-[11px] leading-relaxed mt-0.5">
                      20% off all salon therapies, free hair spa on every 5th visit, VIP weekend reservations, and dedicated master stylist.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <Button
                  asChild
                  className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase tracking-widest text-xs"
                >
                  <Link to="/book">
                    {isGold ? "Book with 20% Gold Privilege" : "Book Next Visit to Reach Gold"}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rewards & Perks Catalog */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-light tracking-tight flex items-center gap-2">
              <Gift className="h-5 w-5 text-primary" />
              Available Perks & Vouchers
            </h3>
            <p className="text-xs text-muted-foreground">
              Perks unlock automatically as your visit count reaches each milestone.
            </p>
          </div>
          <span className="text-xs font-mono text-primary">
            {perksList.filter((p) => totalVisits >= p.unlockedAt).length} of {perksList.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {perksList.map((perk) => {
            const isUnlocked = totalVisits >= perk.unlockedAt;
            const IconComponent = perk.icon;

            return (
              <div
                key={perk.id}
                className={cn(
                  "relative flex flex-col justify-between p-5 rounded-2xl border transition-all",
                  isUnlocked
                    ? "bg-card border-border hover:border-primary/50 shadow-md"
                    : "bg-card/40 border-border/40 opacity-70"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div
                      className={cn(
                        "h-9 w-9 rounded-xl flex items-center justify-center",
                        isUnlocked
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <IconComponent className="h-4 w-4" />
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] uppercase tracking-wider",
                        isUnlocked
                          ? "border-primary/40 text-primary bg-primary/5"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {isUnlocked ? "Available" : `Requires ${perk.unlockedAt} Visits`}
                    </Badge>
                  </div>

                  <h4 className="text-sm font-medium text-foreground mb-1">
                    {perk.title}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {perk.desc}
                  </p>
                </div>

                <div className="mt-5 pt-3 border-t border-border/60 flex items-center justify-between">
                  {isUnlocked ? (
                    <>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-mono">Code:</span>
                        <code className="text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {perk.code}
                        </code>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyPromoCode(perk.code)}
                        className="h-7 text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10 px-2 gap-1"
                      >
                        <Copy className="h-3 w-3" /> Copy
                      </Button>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between text-xs text-muted-foreground">
                      <span>{perk.unlockedAt - totalVisits} more {perk.unlockedAt - totalVisits === 1 ? "visit" : "visits"} needed</span>
                      <Button asChild variant="link" className="text-primary text-xs p-0 h-auto">
                        <Link to="/book">Book Now</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tracked Visit Ledger */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-light tracking-tight flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Visit Stamp History
            </h3>
            <p className="text-xs text-muted-foreground">
              Every salon reservation recorded under your account counts towards your Gold Member status.
            </p>
          </div>
          <Badge variant="outline" className="border-border text-muted-foreground text-xs">
            {realVisits.length} Recorded in Database
          </Badge>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {realVisits.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                <Scissors className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-medium">No visits recorded yet</h4>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Book your first styling appointment today to start your journey toward prestigious Gold Member status!
              </p>
              <Button asChild className="bg-primary text-black hover:bg-primary/90 text-xs uppercase tracking-widest font-bold mt-2">
                <Link to="/book">Book First Appointment</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {realVisits.map((app, index) => (
                <div
                  key={app.id || index}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/5 transition-colors gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-mono text-xs font-bold shrink-0">
                      #{index + 1}
                    </div>
                    <div>
                      <h5 className="text-xs font-semibold text-foreground">
                        {app.service || "Salon Treatment & Styling"}
                      </h5>
                      <p className="text-[11px] text-muted-foreground">
                        {app.date ? format(new Date(app.date), "MMMM d, yyyy") : "Scheduled Date"} • {app.time || "Salon Slot"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] uppercase tracking-wider",
                        app.status === "completed"
                          ? "border-green-500/30 text-green-400 bg-green-500/5"
                          : "border-primary/30 text-primary bg-primary/5"
                      )}
                    >
                      {app.status === "completed" ? "Completed Visit (+100 Pts)" : "Scheduled (+1 Stamp)"}
                    </Badge>
                    <span className="text-xs font-mono text-primary font-semibold">
                      +100 Pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
