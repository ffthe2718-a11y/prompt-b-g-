import React from "react";
import { motion } from "motion/react";
import { Trophy, Sparkles, Star, ArrowRight, Gift, Calendar, MessageSquare, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MyRewardsCardProps {
  totalPoints?: number;
  currentTierName?: string;
  nextTierName?: string | null;
  pointsForNextTier?: number;
  progressPercentage?: number;
  className?: string;
}

export default function MyRewardsCard({
  totalPoints = 850,
  currentTierName = "Gold Member",
  nextTierName = "Platinum Elite",
  pointsForNextTier = 150,
  progressPercentage = 85,
  className
}: MyRewardsCardProps) {
  // SVG Circular progress ring parameters
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  return (
    <div className={cn("rounded-3xl border border-border/80 bg-card p-6 shadow-xl relative overflow-hidden group", className)}>
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10">
        
        {/* Left / Center: Circular Progress Ring & Points */}
        <div className="flex items-center gap-5">
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-28 h-28 transform -rotate-90">
              {/* Background Track */}
              <circle
                cx="56"
                cy="56"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                className="text-zinc-800"
                fill="transparent"
              />
              {/* Animated Progress Ring */}
              <motion.circle
                cx="56"
                cy="56"
                r={radius}
                stroke="currentColor"
                strokeWidth="8"
                className="text-primary"
                fill="transparent"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <Sparkles className="h-4 w-4 text-primary mb-0.5 animate-pulse" />
              <span className="text-xl font-bold font-serif text-white">{totalPoints}</span>
              <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-mono">Points</span>
            </div>
          </div>

          <div className="space-y-1.5 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold uppercase tracking-wider">
                {currentTierName}
              </Badge>
            </div>

            <h3 className="text-lg font-bold text-white font-serif tracking-tight">
              Loyalty & Rewards Club
            </h3>

            <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
              {nextTierName ? `${pointsForNextTier} pts to ${nextTierName}` : "You have reached top tier status!"}
            </p>
          </div>
        </div>

        {/* Right: How to earn more preview & action */}
        <div className="flex flex-col sm:items-end justify-center gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-4 sm:pt-0 border-border/60">
          <div className="space-y-1 text-xs text-zinc-300">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Book Salon Visit <strong className="text-primary">+100 pts</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              <span>Write Service Review <strong className="text-amber-400">+50 pts</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              <span>Refer a Friend <strong className="text-emerald-400">+200 pts</strong></span>
            </div>
          </div>

          <Button asChild size="sm" className="w-full sm:w-auto rounded-full bg-primary text-black font-bold uppercase text-[10px] tracking-widest px-5 h-9 shadow-md hover:bg-primary/90 gap-1.5">
            <Link to="/rewards">
              View All Rewards <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

      </div>
    </div>
  );
}
