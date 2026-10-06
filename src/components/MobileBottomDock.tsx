import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Scissors, 
  Calendar, 
  User, 
  MoreHorizontal, 
  Sparkles, 
  Image, 
  Star, 
  HelpCircle, 
  ShieldCheck, 
  Store, 
  Gift, 
  Info,
  X,
  ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function MobileBottomDock() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAdmin, isOwner } = useAuth();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const moreLinks = [
    { name: "Special Packages", path: "/bundles", icon: Sparkles, badge: "Save 25%" },
    { name: "Photos & Styles", path: "/gallery", icon: Image },
    { name: "Find Salons", path: "/marketplace", icon: Store },
    { name: "Refer & Earn", path: "/referrals", icon: Gift, badge: "₹500 Reward" },
    { name: "About Us", path: "/about", icon: Info },
    { name: "Partner With Us", path: "/partner", icon: Store },
  ];

  const adminLinks = [
    { name: "Admin Dashboard", path: "/admin", icon: ShieldCheck },
    { name: "Analytics & Trends", path: "/admin/analytics", icon: Sparkles },
    { name: "Home Services Admin", path: "/admin/home-services", icon: Scissors },
    { name: "Shop Editor", path: "/dashboard/shop-editor", icon: Store },
  ];

  return (
    <>
      {/* Fixed Glassmorphic Bottom Dock for Mobile Only */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 backdrop-blur-2xl border-t border-border/80 px-3 py-2 flex items-center justify-around md:hidden pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        {/* Services / Explore */}
        <Link
          to="/services"
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200",
            isActive("/services") ? "text-primary font-bold scale-105" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Scissors className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">Services</span>
        </Link>

        {/* Primary Center Action: Book Now */}
        <button
          type="button"
          onClick={() => navigate("/book")}
          className="relative -top-3 flex flex-col items-center justify-center h-13 w-13 rounded-full bg-gradient-to-tr from-amber-500 via-primary to-amber-300 text-black font-extrabold shadow-xl shadow-primary/30 border-2 border-background transition-transform active:scale-95"
          title="Book Appointment"
        >
          <Calendar className="h-6 w-6 stroke-[2.5]" />
          <span className="sr-only">Book Now</span>
        </button>

        {/* Dashboard / Profile */}
        <Link
          to={user ? "/dashboard" : "/services"}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200",
            isActive("/dashboard") ? "text-primary font-bold scale-105" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">
            {user ? "Bookings" : "Account"}
          </span>
        </Link>

        {/* More Options Sheet Trigger */}
        <button
          type="button"
          onClick={() => setIsMoreOpen(true)}
          className={cn(
            "flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200",
            isMoreOpen ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <MoreHorizontal className="h-5 w-5 mb-0.5" />
          <span className="text-[10px] uppercase font-bold tracking-wider">More</span>
        </button>
      </nav>

      {/* Bottom Sheet for 'More' Menu */}
      <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
        <SheetContent side="bottom" className="bg-zinc-950 border-t border-border/80 text-foreground rounded-t-3xl p-6 max-h-[85dvh] overflow-y-auto pb-safe">
          <SheetHeader className="text-left border-b border-border/60 pb-4 mb-4 flex items-center justify-between">
            <div>
              <SheetTitle className="text-xl font-light font-serif tracking-tight text-white">
                EXPLORE <span className="italic font-serif text-primary">AURELIA SALON</span>
              </SheetTitle>
              <p className="text-xs text-muted-foreground">Select a section to navigate</p>
            </div>
          </SheetHeader>

          <div className="space-y-4">
            {/* Quick Links */}
            <div className="grid grid-cols-2 gap-2.5">
              {moreLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMoreOpen(false)}
                    className="p-3.5 rounded-2xl border border-border bg-card/60 hover:bg-card hover:border-primary/40 transition-all flex flex-col justify-between space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="h-8 w-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                        <Icon className="h-4 w-4" />
                      </div>
                      {item.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                        {item.name}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Admin Links if Authorized */}
            {(isAdmin || isOwner) && (
              <div className="pt-2 border-t border-border/60 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary block">
                  Management & Admin
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {adminLinks.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMoreOpen(false)}
                        className="p-3 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 flex items-center justify-between transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-xs font-bold text-white">{item.name}</span>
                        </div>
                        <ChevronRight className="h-3.5 w-3.5 text-primary" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              onClick={() => {
                setIsMoreOpen(false);
                navigate("/book");
              }}
              className="w-full h-12 rounded-full bg-primary text-black font-bold uppercase text-xs tracking-widest hover:bg-primary/90 mt-2 shadow-lg shadow-primary/20"
            >
              Book Appointment Now
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
