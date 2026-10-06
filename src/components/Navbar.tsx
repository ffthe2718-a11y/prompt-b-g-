import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { Scissors, Menu, X, User, Shield, Bell, Check, Globe, Calendar, BarChart3, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { db, logout } from "@/firebase";
import AuthModal from "@/components/AuthModal";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Home", path: "/" },
  { name: "Services", path: "/services" },
  { name: "Special Packages", path: "/bundles" },
  { name: "Photos & Styles", path: "/gallery" },
  { name: "Find Salons", path: "/marketplace" },
  { name: "About Us", path: "/about" },
];

export default function Navbar() {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAdmin, isOwner, profile, loading } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const notificationsRef = collection(db, "notifications");
    const q = query(notificationsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      const unread = docs.filter((n: any) => !n.read);
      setNotifications(docs);
      setUnreadCount(unread.length);
    });

    return () => unsubscribe();
  }, [user, isAdmin]);

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

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-xl pt-safe">
      <div className="mx-auto flex w-full max-w-[1800px] items-center justify-between px-3 sm:px-6 lg:px-12 py-2.5 md:py-4">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-1.5 group shrink-0">
          <Scissors className="h-4 w-4 sm:h-5 sm:w-5 text-primary rotate-45 shrink-0" />
          <span className="text-base sm:text-2xl font-bold font-serif tracking-wider uppercase text-primary truncate max-w-[160px] sm:max-w-none">
            Aurelia Salon
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`text-xs uppercase tracking-widest transition-colors hover:text-primary font-medium nav-underline-anim ${
                location.pathname === link.path ? "text-primary active" : "text-muted-foreground"
              }`}
            >
              {link.name === "Home" ? t("nav.home") : 
               link.name === "Services" ? t("nav.services") :
               link.name === "Gallery" ? t("nav.gallery") : link.name}
            </Link>
          ))}
          <Link
            to="/partner"
            className={`text-xs uppercase tracking-widest transition-colors hover:text-primary font-medium nav-underline-anim ${
              location.pathname === "/partner" ? "text-primary active" : "text-muted-foreground"
            }`}
          >
            {t("partner.title")}
          </Link>
          <Link
            to="/referrals"
            className={`text-xs uppercase tracking-widest transition-colors hover:text-primary font-medium flex items-center gap-1.5 ${
              location.pathname === "/referrals" ? "text-primary font-bold" : "text-emerald-400"
            }`}
          >
            <Gift className="h-3.5 w-3.5" /> Refer & Earn
          </Link>
          {user && (
            <Link
              to="/dashboard"
              className={`text-xs uppercase tracking-widest transition-colors hover:text-primary font-medium flex items-center gap-2 ${
                location.pathname === "/dashboard" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <User className="h-4 w-4" /> Dashboard
            </Link>
          )}
          {(isOwner || isAdmin) && (
            <Link
              to="/dashboard/shop-editor"
              className={`text-xs uppercase tracking-widest transition-colors hover:text-primary font-medium flex items-center gap-2 ${
                location.pathname === "/dashboard/shop-editor" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Globe className="h-4 w-4" /> Shop Editor
            </Link>
          )}
          {(isAdmin || isOwner) && (
            <div className="flex items-center gap-4">
              <Popover>
                <PopoverTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="relative text-muted-foreground hover:text-primary"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black border-2 border-background">
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
                              <button 
                                onClick={() => markAsRead(n.id)}
                                className="text-[10px] text-muted-foreground hover:text-primary"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                          <span className="text-[9px] text-muted-foreground/60 font-mono mt-1">
                            {n.createdAt ? format(n.createdAt.toDate ? n.createdAt.toDate() : new Date(n.createdAt), "MMM d, h:mm a") : 'Just now'}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </PopoverContent>
              </Popover>

              <Link
                to="/admin"
                className={`text-xs uppercase tracking-widest transition-colors hover:text-primary font-medium flex items-center gap-1.5 ${
                  location.pathname === "/admin" ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <Shield className="h-4 w-4" /> Admin
              </Link>
            </div>
          )}

          {/* User Auth or Sign In */}
          <div className="flex items-center gap-4">
            {loading ? (
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end mr-1">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-primary leading-tight">
                    {profile?.role || 'User'}
                  </span>
                  <Button 
                    variant="ghost" 
                    onClick={logout}
                    className="text-xs uppercase tracking-widest text-muted-foreground hover:text-primary px-0 h-4"
                  >
                    Logout
                  </Button>
                </div>
                {user.photoURL ? (
                  <img src={user.photoURL} alt="User" className="h-8 w-8 rounded-full border border-primary/20" referrerPolicy="no-referrer" />
                ) : (
                  <div className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center border text-primary font-bold text-xs uppercase",
                    isOwner ? "border-red-500 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.2)]" :
                    isAdmin ? "border-primary bg-primary/10 shadow-[0_0_10px_rgba(234,179,8,0.2)]" :
                    "border-primary/20 bg-primary/20"
                  )}>
                    {user.displayName?.charAt(0) || user.email?.charAt(0)}
                  </div>
                )}
              </div>
            ) : (
              <AuthModal />
            )}
            
            <Button asChild className="rounded-full bg-primary px-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 gap-2">
              <Link to="/book">
                <Calendar className="h-3.5 w-3.5" />
                Book Appointment
              </Link>
            </Button>
          </div>
        </div>

        {/* Mobile Header Right Controls */}
        <div className="flex items-center gap-2 md:hidden">
          {user ? (
            <Link to="/dashboard" className="flex items-center gap-1.5 p-1">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="h-7 w-7 rounded-full border border-primary/30" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-7 w-7 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary text-[10px] font-bold uppercase">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
              )}
            </Link>
          ) : (
            <AuthModal trigger={
              <Button variant="outline" size="sm" className="h-8 px-2.5 rounded-full text-[10px] uppercase font-bold border-primary/40 text-primary">
                Sign In
              </Button>
            } />
          )}

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9 text-foreground hover:bg-white/10">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="bg-zinc-950 border-border text-foreground w-[280px] p-6">
              <div className="flex flex-col gap-6 mt-6">
                <div className="border-b border-border/60 pb-4">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-primary block">
                    Aurelia Salon Menu
                  </span>
                </div>

                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className={cn(
                      "text-sm uppercase tracking-wider font-semibold py-1",
                      location.pathname === link.path ? "text-primary" : "text-muted-foreground hover:text-white"
                    )}
                  >
                    {link.name}
                  </Link>
                ))}

                <Link
                  to="/referrals"
                  onClick={() => setIsOpen(false)}
                  className="text-sm uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-2 py-1"
                >
                  <Gift className="h-4 w-4" /> Refer & Earn (₹500)
                </Link>

                {user && (
                  <Link
                    to="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="text-sm uppercase tracking-wider font-semibold text-muted-foreground hover:text-white flex items-center gap-2 py-1"
                  >
                    <User className="h-4 w-4" /> My Dashboard
                  </Link>
                )}

                {(isAdmin || isOwner) && (
                  <>
                    <div className="border-t border-border/60 pt-3">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-amber-400 block mb-2">
                        Admin Controls
                      </span>
                      <Link
                        to="/admin"
                        onClick={() => setIsOpen(false)}
                        className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-white flex items-center gap-2 py-1"
                      >
                        <Shield className="h-4 w-4" /> Admin Console
                      </Link>
                      <Link
                        to="/admin/analytics"
                        onClick={() => setIsOpen(false)}
                        className="text-xs uppercase tracking-wider font-semibold text-muted-foreground hover:text-white flex items-center gap-2 py-1"
                      >
                        <BarChart3 className="h-4 w-4 text-primary" /> Analytics
                      </Link>
                    </div>
                  </>
                )}

                <div className="pt-4 border-t border-border/60 space-y-3">
                  {user ? (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        logout();
                        setIsOpen(false);
                      }}
                      className="w-full border-border text-foreground tracking-widest uppercase text-xs h-10"
                    >
                      Logout
                    </Button>
                  ) : null}

                  <Button asChild className="w-full rounded-full bg-primary h-11 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 shadow-lg shadow-primary/20 gap-2">
                    <Link to="/book" onClick={() => setIsOpen(false)}>
                      <Calendar className="h-3.5 w-3.5" />
                      Book Appointment
                    </Link>
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}
