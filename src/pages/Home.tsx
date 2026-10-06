import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Star, Clock, MapPin, ArrowRight, Globe, Store, ShieldCheck, Heart, Sparkles, CheckCircle2 } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useI18n } from "@/context/I18nContext";
import { cn } from "@/lib/utils";
import { db } from "@/firebase";
import { collection, query, limit, getDocs } from "firebase/firestore";
import SeasonalPromotionsCarousel from "@/components/SeasonalPromotionsCarousel";
import CustomerTestimonialsSlider from "@/components/CustomerTestimonialsSlider";
import ServicesSection from "@/components/ServicesSection";
import FeaturedReelsSection from "@/components/FeaturedReelsSection";
import { CURATED_SHOPS } from "@/data/curatedShops";

export default function Home() {
  const { t } = useI18n();
  const location = useLocation();
  const [featuredShops, setFeaturedShops] = useState<any[]>(CURATED_SHOPS.slice(0, 3));
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 150]);

  // Handle smooth scroll when navigating to anchor links
  useEffect(() => {
    if (location.hash) {
      const targetId = location.hash.replace("#", "");
      const elem = document.getElementById(targetId);
      if (elem) {
        setTimeout(() => {
          elem.scrollIntoView({ behavior: "smooth" });
        }, 150);
      }
    }
  }, [location.hash]);

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const q = query(collection(db, "shops"), limit(6));
        const snap = await getDocs(q);
        const firestoreShops = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter((s: any) => s.isActive !== false && s.status !== "archived");

        if (firestoreShops.length > 0) {
          const combined = [...firestoreShops];
          for (const curated of CURATED_SHOPS) {
            if (combined.length < 3 && !combined.some((s: any) => s.slug === curated.slug)) {
              combined.push(curated);
            }
          }
          setFeaturedShops(combined.slice(0, 3));
        } else {
          setFeaturedShops(CURATED_SHOPS.slice(0, 3));
        }
      } catch (error) {
        console.warn("Using curated shops:", error);
        setFeaturedShops(CURATED_SHOPS.slice(0, 3));
      } finally {
        setIsLoadingShops(false);
      }
    };
    fetchShops();
  }, []);
  
  return (
    <div className="w-full max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-12 py-3 sm:py-6 grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 min-h-0">
      {/* Hero Section */}
      <section 
        id="home"
        ref={containerRef}
        className="md:col-span-2 md:row-span-3 rounded-2xl md:rounded-[20px] border border-primary/40 bg-gradient-to-br from-card to-background p-5 sm:p-8 md:p-12 relative overflow-hidden flex flex-col justify-center h-auto min-h-0"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <motion.img
            style={{ y, scale: 1.05 }}
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920"
            alt="Salon Interior"
            className="h-full w-full object-cover opacity-15 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background/95" />
        </div>

        <div className="relative z-10 flex flex-col justify-center my-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="mb-2 sm:mb-4 block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.3em] sm:tracking-[0.5em] text-primary">
              {t("hero.subtitle")}
            </span>
            
            <h1 className="mb-3 sm:mb-6 text-3xl sm:text-5xl md:text-7xl font-light tracking-tight leading-tight">
              {t("hero.title").split(" ").map((word, i) => (
                <span key={i} className={cn(word.toLowerCase().includes("redefined") || word.includes("परिभाषा") ? "italic text-primary" : "")}>
                  {word}{" "}
                  {i === 0 && <br className="hidden sm:inline" />}
                </span>
              ))}
            </h1>

            <p className="mb-6 sm:mb-10 max-w-md text-xs sm:text-sm leading-relaxed text-muted-foreground">
              Get top-quality hair cuts, beard styling, Ayurvedic Champi, and hair coloring from expert stylists across Mumbai.
            </p>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-4">
              <Button asChild className="w-full sm:w-auto h-11 sm:h-14 rounded-full bg-primary px-6 sm:px-8 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 shadow-lg shadow-primary/20">
                <Link to="/marketplace">Find Salons</Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto h-11 sm:h-14 rounded-full border-border/80 bg-card/60 px-6 sm:px-8 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-white/5">
                <Link to="/partner">Register Your Salon</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Bar Section */}
      <section id="trust-bar" className="md:col-span-2 rounded-xl sm:rounded-2xl border border-border/80 bg-card/60 p-3 sm:p-4">
        <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
          <div className="flex flex-col items-center">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 mb-0.5" />
            <span className="text-[11px] sm:text-xs font-bold text-foreground">Sterilized Tools</span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">100% Sanitized</span>
          </div>
          <div className="flex flex-col items-center">
            <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400 fill-amber-400 mb-0.5" />
            <span className="text-[11px] sm:text-xs font-bold text-foreground">4.9 / 5.0 Rating</span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">Verified Reviews</span>
          </div>
          <div className="flex flex-col items-center">
            <CheckCircle2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary mb-0.5" />
            <span className="text-[11px] sm:text-xs font-bold text-foreground">Top Stylists</span>
            <span className="text-[9px] sm:text-[10px] text-muted-foreground">Master Artists</span>
          </div>
        </div>
      </section>

      {/* Featured Partner Salons Section */}
      <motion.section 
        id="locations"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.5 }}
        className="md:col-span-2 md:row-span-2 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-4 sm:p-6 md:p-8 flex flex-col justify-between shadow-xl"
      >
        <div>
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex flex-col">
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-primary tracking-widest mb-0.5">
                Curated Artisans
              </span>
              <h2 className="text-xl sm:text-2xl font-serif text-foreground">
                Featured <span className="italic text-primary">Shops</span>
              </h2>
            </div>
            <Button asChild variant="link" className="text-primary text-[10px] uppercase tracking-widest p-0 h-auto hover:text-primary/80">
              <Link to="/marketplace" className="flex items-center gap-1 font-semibold">
                Explore All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 sm:grid sm:grid-cols-1 pb-2 -mx-1 px-1 sm:mx-0 sm:px-0 custom-scrollbar">
            {isLoadingShops ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="w-[85%] sm:w-auto shrink-0 snap-start flex gap-3 p-3 rounded-xl border border-border/50 animate-pulse bg-background/50">
                  <div className="h-12 w-12 rounded-lg bg-zinc-800 shrink-0" />
                  <div className="flex-grow space-y-1.5 py-1">
                    <div className="h-3.5 w-32 bg-zinc-800 rounded" />
                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                  </div>
                </div>
              ))
            ) : (
              featuredShops.map((shop, i) => (
                <motion.div
                  key={shop.id || shop.slug || i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="w-[85%] sm:w-auto shrink-0 snap-start"
                >
                  <Link 
                    to={`/shop/${shop.slug}`}
                    className="flex items-center gap-3 p-3 sm:p-3.5 rounded-xl border border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-300 group shadow-md"
                  >
                    <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-zinc-900 flex items-center justify-center shrink-0 border border-white/15 overflow-hidden group-hover:border-primary/50 transition-all">
                      {shop.logo ? (
                        <img 
                          src={shop.logo} 
                          alt={shop.name} 
                          className="h-full w-full object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <Store className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-xs sm:text-sm tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                          {shop.name}
                        </h3>
                        {shop.isVerified !== false && (
                          <span className="text-[9px] text-blue-400 font-semibold shrink-0" title="Verified Studio">
                            ✓
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1 text-zinc-300 truncate">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">{shop.location || "Mumbai"}</span>
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-0.5 text-amber-400 font-semibold shrink-0">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{shop.rating ? Number(shop.rating).toFixed(1) : "4.9"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="h-7 w-7 rounded-full border border-border flex items-center justify-center shrink-0 text-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-black transition-all">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="pt-3 mt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Partner Studios
          </span>
          <Link to="/marketplace" className="text-primary hover:underline font-semibold">
            Directory →
          </Link>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-20px" }}
        transition={{ duration: 0.5 }}
        className="md:col-span-2 md:row-span-1 rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 overflow-hidden relative group shadow-lg"
      >
        <div className="max-w-sm relative z-10 text-center sm:text-left">
          <h2 className="mb-1 text-lg sm:text-2xl font-serif text-primary">
            Looking for Haircare or Beard Grooming?
          </h2>
          <p className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider font-bold opacity-80">
            Book top salon appointments in Mumbai.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto h-11 rounded-full bg-primary px-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 whitespace-nowrap shadow-lg shadow-primary/10">
          <Link to="/marketplace" className="flex items-center justify-center gap-2">
            Find Salons Now <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </motion.section>

      {/* Seasonal Promotions Carousel */}
      <div id="bundles" className="md:col-span-4 mt-4 sm:mt-6 mb-2">
        <SeasonalPromotionsCarousel />
      </div>

      {/* Featured Video Reels Section */}
      <div id="featured-reels" className="md:col-span-4 my-2">
        <FeaturedReelsSection />
      </div>

      {/* Curated Services Section */}
      <div id="services" className="md:col-span-4 my-4 sm:my-8">
        <ServicesSection showTitle={true} />
      </div>

      {/* Customer Testimonials & Verified Social Proof Slider */}
      <div id="reviews" className="md:col-span-4 my-4 sm:my-6">
        <CustomerTestimonialsSlider />
      </div>

      {/* Immersive Mobile-Friendly Booking CTA Section */}
      <section id="booking" className="md:col-span-4 mt-4 mb-8 sm:mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 items-stretch">
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative h-[280px] sm:h-[450px] rounded-2xl sm:rounded-[24px] overflow-hidden group border border-border"
          >
            <img 
              src="https://images.unsplash.com/photo-1599351431247-f5091e3c339a?auto=format&fit=crop&q=80&w=1200" 
              alt="Art of Grooming"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
            <div className="absolute bottom-6 left-6 right-6 sm:bottom-10 sm:left-10 sm:right-10">
              <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-[0.3em] mb-1 block">Hair & Beard Care</span>
              <h3 className="text-2xl sm:text-4xl font-light text-white tracking-tight leading-tight mb-4">EXPERT SALON & <br /><span className="italic font-serif text-primary">GROOMING SERVICES</span></h3>
              <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white hover:text-black uppercase text-[10px] tracking-widest font-bold px-6 h-10">
                <Link to="/services">View All Services</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-between p-6 sm:p-12 rounded-2xl sm:rounded-[24px] border border-primary/30 bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden"
          >
            <div className="relative z-10 space-y-4">
              <span className="text-[9px] sm:text-[10px] font-bold text-primary uppercase tracking-[0.3em] block">Easy Online Booking</span>
              <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight leading-none">BOOK YOUR <br /><span className="italic text-primary font-serif">APPOINTMENT</span></h2>
              
              <div className="space-y-3 pt-2">
                {[
                  { label: "Style Advice", desc: "Expert recommendations for your look." },
                  { label: "Precision Cut & Grooming", desc: "Styling by experienced master artists." },
                  { label: "Hygiene Standard", desc: "100% sanitized tools and luxury salon ambiance." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-start">
                    <div className="h-4 w-4 rounded-full border border-primary/50 flex items-center justify-center shrink-0 mt-0.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">{item.label}</h4>
                      <p className="text-[11px] text-zinc-400 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 pt-6">
              <Button asChild className="w-full h-13 rounded-full bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-primary/20">
                <Link to="/book">Book Appointment Now</Link>
              </Button>
              <p className="text-[9px] text-zinc-500 text-center mt-3 tracking-widest uppercase">Instant Confirmation • Easy Reschedule • Mumbai</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
