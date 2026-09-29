import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  Scissors, 
  Instagram, 
  Facebook, 
  Twitter, 
  Youtube,
  Send, 
  Check, 
  MapPin, 
  Phone, 
  Mail, 
  MessageCircle, 
  Sparkles, 
  ShieldCheck, 
  ArrowUpRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { SALON_WHATSAPP } from "@/constants";
import { cn } from "@/lib/utils";

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [isSubscribed, setIsSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes("@")) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setIsSubscribed(true);
    toast.success("Welcome to Aurelia Luxe VIP Club!", {
      description: "You'll receive private invitations to seasonal festive & bridal releases."
    });
    setNewsletterEmail("");
  };

  const socialLinks = [
    {
      name: "Instagram",
      handle: "@aurelialuxe",
      url: "https://instagram.com/aurelialuxe",
      followers: "48.5K",
      icon: Instagram,
      color: "hover:text-pink-400 group-hover:border-pink-500/50 hover:bg-pink-950/20"
    },
    {
      name: "Facebook",
      handle: "/aurelialuxe.mumbai",
      url: "https://facebook.com/aurelialuxe",
      followers: "24.2K",
      icon: Facebook,
      color: "hover:text-blue-400 group-hover:border-blue-500/50 hover:bg-blue-950/20"
    },
    {
      name: "Twitter / X",
      handle: "@aurelialuxe",
      url: "https://twitter.com/aurelialuxe",
      followers: "16.8K",
      icon: Twitter,
      color: "hover:text-sky-400 group-hover:border-sky-500/50 hover:bg-sky-950/20"
    },
    {
      name: "YouTube",
      handle: "Aurelia Masterclasses",
      url: "https://youtube.com/@aurelialuxe",
      followers: "32.1K",
      icon: Youtube,
      color: "hover:text-red-400 group-hover:border-red-500/50 hover:bg-red-950/20"
    }
  ];

  return (
    <footer className="border-t border-border bg-gradient-to-b from-background via-card/50 to-zinc-950 pt-16 pb-12 px-4 sm:px-8 lg:px-12 relative overflow-hidden w-full">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto w-full max-w-[1800px] relative z-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 mb-12">
          {/* Brand & Social Column */}
          <div className="lg:col-span-4 space-y-6">
            <Link to="/" className="inline-block group">
              <div className="flex items-center gap-2">
                <Scissors className="h-6 w-6 text-primary rotate-45 group-hover:rotate-90 transition-transform duration-500" />
                <span className="text-2xl md:text-3xl font-serif tracking-[0.15em] uppercase text-primary font-bold">
                  Aurelia Salon
                </span>
              </div>
              <span className="text-[9px] uppercase tracking-[0.4em] text-zinc-500 font-mono block mt-1">
                Top Haircuts, Beauty & Bridal Salon • Mumbai
              </span>
            </Link>

            <p className="text-sm leading-relaxed text-muted-foreground max-w-sm">
              Get top haircuts, beard grooming, HD bridal makeup, and relaxing herbal oil Champi head massages across top salon branches in Mumbai.
            </p>

            {/* Social Engagement Community Box */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Join Our Social Circle
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">120K+ Community</span>
              </div>

              <div className="flex items-center gap-3">
                {socialLinks.map((social) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={social.name}
                      href={social.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "h-11 w-11 rounded-xl border border-zinc-800 bg-zinc-950/80 flex items-center justify-center text-zinc-400 transition-all duration-300 group hover:scale-110 shadow-md",
                        social.color
                      )}
                      aria-label={`Follow Aurelia Luxe on ${social.name}`}
                      title={`${social.name} (${social.handle})`}
                    >
                      <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                    </a>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="lg:col-span-2 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground border-l-2 border-primary pl-3">
              Explore
            </h4>
            <ul className="space-y-3 text-xs text-muted-foreground">
              <li>
                <Link to="/" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-600 group-hover:text-primary">•</span> Home
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-600 group-hover:text-primary">•</span> Discover Shops
                </Link>
              </li>
              <li>
                <Link to="/services" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-600 group-hover:text-primary">•</span> Salon Menu
                </Link>
              </li>
              <li>
                <Link to="/bundles" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-600 group-hover:text-primary">•</span> Luxury Packages
                </Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-600 group-hover:text-primary">•</span> Book Appointment
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-600 group-hover:text-primary">•</span> Lookbook Gallery
                </Link>
              </li>
              <li>
                <Link to="/referrals" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1.5 group font-medium">
                  <span className="text-emerald-500">•</span> Referral Program (₹500 Gift)
                </Link>
              </li>
              <li>
                <Link to="/partner" className="hover:text-primary transition-colors flex items-center gap-1.5 group">
                  <span className="text-zinc-600 group-hover:text-primary">•</span> Partner With Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Flagship Mumbai Ateliers */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground border-l-2 border-primary pl-3">
              Our Mumbai Branches
            </h4>
            <div className="space-y-3 text-xs text-muted-foreground">
              <div className="p-3 rounded-xl border border-zinc-900 bg-background/50 space-y-1">
                <p className="font-bold text-white text-xs">Bandra Salon Branch</p>
                <p className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  101 Turner Road, Bandra West, Mumbai
                </p>
              </div>

              <div className="p-3 rounded-xl border border-zinc-900 bg-background/50 space-y-1">
                <p className="font-bold text-white text-xs">Colaba Salon Branch</p>
                <p className="flex items-center gap-1 text-[11px] text-zinc-400">
                  <MapPin className="h-3 w-3 text-primary shrink-0" />
                  Arthur Bunder Road, Colaba, Mumbai
                </p>
              </div>

              <div className="pt-1 flex flex-col gap-3">
                <a href="tel:+919876543210" className="flex items-center gap-2 text-zinc-300 hover:text-primary transition-colors text-xs font-mono">
                  <Phone className="h-3.5 w-3.5 text-primary" />
                  <span>Call Us: +91 98765 43210</span>
                </a>

                {/* Direct Front Desk WhatsApp Chat Card */}
                <div className="p-3.5 rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 via-zinc-950 to-zinc-950 space-y-2.5 shadow-xl">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
                      <MessageCircle className="h-4 w-4" />
                    </div>
                    <div>
                      <h5 className="font-bold text-white text-xs flex items-center gap-1.5">
                        <span>Mumbai Front Desk</span>
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Front Desk Online" />
                      </h5>
                      <p className="text-[10px] text-emerald-300/80 font-mono">Live WhatsApp Help</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed font-light">
                    Have questions about prices, available slots, or home service in Mumbai? Chat directly with our front desk.
                  </p>
                  <a
                    href={`https://wa.me/${SALON_WHATSAPP.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Namaste! I would like to ask a question about salon services and availability in Mumbai.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-950/50 hover:scale-[1.02]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    <span>Chat with Us</span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Social Channels & VIP Newsletter Column */}
          <div className="lg:col-span-3 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground border-l-2 border-primary pl-3">
              Connect & Engage
            </h4>
            <div className="space-y-2">
              {socialLinks.slice(0, 3).map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-900 bg-background/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("h-8 w-8 rounded-lg border border-zinc-800 bg-zinc-950 flex items-center justify-center transition-colors", social.color)}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-bold text-white group-hover:text-primary transition-colors">{social.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{social.handle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 group-hover:text-white">
                      <span>{social.followers}</span>
                      <ArrowUpRight className="h-3.5 w-3.5 text-zinc-600 group-hover:text-primary transition-colors" />
                    </div>
                  </a>
                );
              })}
            </div>

            {/* VIP Newsletter Form */}
            <div className="pt-2">
              <form onSubmit={handleSubscribe} className="space-y-2">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400 font-semibold block">
                  VIP Festive & Bridal Drop Alerts
                </span>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="Enter email for private drops"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="h-10 text-xs bg-zinc-950 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-primary"
                  />
                  <Button type="submit" size="sm" className="h-10 px-4 bg-primary text-black hover:bg-primary/90 font-bold uppercase text-[10px] tracking-widest shrink-0">
                    <Send className="h-3 w-3" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Copyright Bar */}
        <div className="border-t border-zinc-900 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-6 text-[10px] uppercase tracking-[0.25em] text-zinc-500 font-mono">
            <span>© {new Date().getFullYear()} Aurelia Luxe Studio.</span>
            <span className="hidden sm:inline text-zinc-800">•</span>
            <span>All Rights Reserved.</span>
            <span className="hidden sm:inline text-zinc-800">•</span>
            <span className="text-zinc-400">Mumbai • India</span>
          </div>

          <div className="flex items-center gap-6 text-xs text-zinc-500">
            <Link to="/about" className="hover:text-primary transition-colors text-[11px]">Privacy Policy</Link>
            <Link to="/about" className="hover:text-primary transition-colors text-[11px]">Terms of Service</Link>
            <Link to="/partner" className="hover:text-primary transition-colors text-[11px]">Artisan Network</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
