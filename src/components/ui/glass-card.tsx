import React from "react";
import { motion, HTMLMotionProps } from "motion/react";
import { cn } from "@/lib/utils";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  hoverEffect?: boolean;
  glowColor?: "gold" | "primary" | "emerald" | "amber" | "none";
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  (
    {
      children,
      className,
      delay = 0,
      hoverEffect = true,
      glowColor = "gold",
      initial = { opacity: 0, y: 28, scale: 0.98 },
      whileInView = { opacity: 1, y: 0, scale: 1 },
      viewport = { once: true, margin: "-40px" },
      transition,
      whileHover,
      ...props
    },
    ref
  ) => {
    const defaultTransition = {
      duration: 0.7,
      delay,
      ease: [0.16, 1, 0.3, 1],
    };

    const hoverAnimation = hoverEffect
      ? whileHover || {
          scale: 1.03,
          y: -6,
          transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
        }
      : undefined;

    const glowStyles = {
      gold: "hover:border-primary/50 hover:shadow-[0_18px_45px_rgba(0,0,0,0.25)]",
      primary: "hover:border-primary/60 hover:shadow-[0_18px_45px_rgba(212,175,55,0.15)]",
      emerald: "hover:border-emerald-500/50 hover:shadow-[0_18px_45px_rgba(16,185,129,0.12)]",
      amber: "hover:border-amber-500/50 hover:shadow-[0_18px_45px_rgba(245,158,11,0.12)]",
      none: "hover:border-white/20 hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)]",
    };

    return (
      <motion.div
        ref={ref}
        initial={initial}
        whileInView={whileInView}
        viewport={viewport}
        transition={transition || defaultTransition}
        whileHover={hoverAnimation}
        className={cn(
          "relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl transition-all duration-500",
          glowStyles[glowColor],
          className
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export interface MotionSectionProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export const MotionSection = React.forwardRef<HTMLElement, MotionSectionProps>(
  (
    {
      children,
      className,
      delay = 0,
      initial = { opacity: 0, y: 32 },
      whileInView = { opacity: 1, y: 0 },
      viewport = { once: true, margin: "-50px" },
      transition,
      ...props
    },
    ref
  ) => {
    const defaultTransition = {
      duration: 0.8,
      delay,
      ease: [0.16, 1, 0.3, 1],
    };

    return (
      <motion.section
        ref={ref}
        initial={initial}
        whileInView={whileInView}
        viewport={viewport}
        transition={transition || defaultTransition}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </motion.section>
    );
  }
);

MotionSection.displayName = "MotionSection";
