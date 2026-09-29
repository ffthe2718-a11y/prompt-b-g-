import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Scissors, Star, Clock, MapPin, ArrowRight, Globe, Store } from "lucide-react";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useI18n } from "@/context/I18nContext";
import { cn } from "@/lib/utils";
import { db } from "@/firebase";
import { collection, query, where, limit, getDocs } from "firebase/firestore";
import SeasonalPromotionsCarousel from "@/components/SeasonalPromotionsCarousel";
import CustomerTestimonialsSlider from "@/components/CustomerTestimonialsSlider";
import ServicesSection from "@/components/ServicesSection";
import { CURATED_SHOPS } from "@/data/curatedShops";

export default function Home() {
  const { t } = useI18n();
  const [featuredShops, setFeaturedShops] = useState<any[]>(CURATED_SHOPS.slice(0, 3));
  const [isLoadingShops, setIsLoadingShops] = useState(false);
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 250]);

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
    <div className="w-full max-w-[1800px] mx-auto px-4 sm:px-8 lg:px-12 py-6 grid grid-cols-1 md:grid-cols-4 gap-6 min-h-[90vh]">
      {/* Hero Section */}
      <section 
        ref={containerRef}
        className="md:col-span-2 md:row-span-3 rounded-[20px] border border-primary bg-gradient-to-br from-card to-background p-6 sm:p-8 md:p-12 relative overflow-hidden flex flex-col justify-center min-h-[480px]"
      >
        <div className="absolute inset-0 z-0">
          <motion.img
            style={{ y, scale: 1.1 }}
            src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1920"
            alt="Salon Interior"
            className="h-full w-full object-cover opacity-20 grayscale"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/90" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
              {t("hero.subtitle")}
            </span>
            <h1 className="mb-6 text-5xl font-light tracking-tighter sm:text-7xl group">
              {t("hero.title").split(" ").map((word, i) => (
                <span key={i} className={cn(word.toLowerCase().includes("redefined") || word.includes("परिभाषा") ? "italic text-primary" : "")}>
                  {word}{" "}
                  {i === 0 && <br />}
                </span>
              ))}
            </h1>
            <p className="mb-10 max-w-md text-sm leading-relaxed text-muted-foreground">
              Get top-quality hair cuts, beard styling, Ayurvedic Champi, and hair coloring from expert stylists across Mumbai.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild className="rounded bg-primary px-8 py-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90">
                <Link to="/marketplace">Find Salons</Link>
              </Button>
              <Button asChild variant="outline" className="rounded border-border px-8 py-6 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-white/5">
                <Link to="/partner">Register Your Salon</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Independent Shops */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="md:col-span-2 md:row-span-2 rounded-[16px] border border-border/80 bg-card/90 backdrop-blur-xl p-6 md:p-8 flex flex-col justify-between shadow-2xl"
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-primary tracking-widest mb-1">
                Curated Artisans
              </span>
              <h2 className="text-2xl font-serif text-foreground">
                Featured <span className="italic text-primary">Shops</span>
              </h2>
            </div>
            <Button asChild variant="link" className="text-primary text-[10px] uppercase tracking-widest p-0 h-auto hover:text-primary/80">
              <Link to="/marketplace" className="flex items-center gap-1.5 font-semibold">
                Explore All <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3.5">
            {isLoadingShops ? (
              [1, 2, 3].map((i) => (
                <div key={i} className="flex gap-4 p-3.5 rounded-xl border border-border/50 animate-pulse bg-background/50">
                  <div className="h-14 w-14 rounded-lg bg-zinc-800 shrink-0" />
                  <div className="flex-grow space-y-2 py-1">
                    <div className="h-4 w-36 bg-zinc-800 rounded" />
                    <div className="h-3 w-24 bg-zinc-800 rounded" />
                  </div>
                </div>
              ))
            ) : (
              featuredShops.map((shop, i) => (
                <motion.div
                  key={shop.id || shop.slug || i}
                  initial={{ opacity: 0, y: 16, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.09, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <Link 
                    to={`/shop/${shop.slug}`}
                    className="flex items-center gap-4 p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl hover:border-primary/40 hover:bg-white/[0.08] transition-all duration-500 group shadow-lg hover:shadow-[0_20px_40px_rgba(212,175,55,0.08)] hover:scale-[1.015]"
                  >
                    <div className="h-14 w-14 rounded-xl bg-zinc-900/80 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/15 overflow-hidden group-hover:border-primary/50 group-hover:scale-105 group-hover:drop-shadow-[0_6px_14px_rgba(212,175,55,0.2)] transition-all duration-500">
                      {shop.logo ? (
                        <img 
                          src={shop.logo} 
                          alt={shop.name} 
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <Store className="h-6 w-6 text-primary group-hover:scale-105 transition-transform duration-500" />
                      )}
                    </div>
                    
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                          {shop.name}
                        </h3>
                        {shop.isVerified !== false && (
                          <span className="text-[10px] text-blue-400 font-semibold flex items-center shrink-0" title="Verified Studio">
                            ✓
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground mt-1">
                        <span className="flex items-center gap-1 text-zinc-300">
                          <MapPin className="h-3 w-3 text-primary shrink-0" />
                          <span className="truncate">{shop.location || "Mumbai"}</span>
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span className="flex items-center gap-1 text-amber-400 font-semibold shrink-0">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          <span>{shop.rating ? Number(shop.rating).toFixed(1) : "4.9"}</span>
                        </span>
                      </div>

                      {shop.specialty && (
                        <p className="text-[10px] text-muted-foreground/80 truncate mt-1">
                          {shop.specialty}
                        </p>
                      )}
                    </div>

                    <div className="h-8 w-8 rounded-full border border-border flex items-center justify-center shrink-0 text-muted-foreground group-hover:border-primary group-hover:bg-primary group-hover:text-black transition-all">
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </Link>
                </motion.div>
              ))
            )}
          </div>
        </div>

        <div className="pt-4 mt-2 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
          <span className="flex items-center gap-1 text-zinc-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live partner studios
          </span>
          <Link to="/marketplace" className="text-primary hover:underline font-semibold">
            Browse directory →
          </Link>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="md:col-span-2 md:row-span-1 rounded-[16px] border border-border/80 bg-card/90 backdrop-blur-xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group shadow-xl"
      >
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="max-w-sm relative z-10">
          <h2 className="mb-2 text-2xl font-serif text-primary">
            Looking for a Great Haircut or Hair Treatment?
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-70">
            Book your appointment at top salons in Mumbai today.
          </p>
        </div>
        <Button asChild className="relative z-10 rounded bg-primary px-8 py-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 whitespace-nowrap shadow-xl shadow-primary/10">
          <Link to="/marketplace" className="flex items-center gap-2">
            Find Salons Now <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </motion.section>

      {/* Seasonal Promotions Carousel (Festive & Bridal Showcase) */}
      <div className="md:col-span-4 mt-6 mb-4">
        <SeasonalPromotionsCarousel />
      </div>

      {/* Curated Services Section with High-Quality Category Imagery */}
      <div className="md:col-span-4 my-8">
        <ServicesSection showTitle={true} />
      </div>

      {/* Customer Testimonials & Verified Social Proof Slider */}
      <div className="md:col-span-4 my-6">
        <CustomerTestimonialsSlider />
      </div>

      {/* New Immersive CTA Section */}
      <section className="md:col-span-4 mt-8 mb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[500px] rounded-[24px] overflow-hidden group border border-border"
          >
            <img 
              src="https://images.unsplash.com/photo-1599351431247-f5091e3c339a?auto=format&fit=crop&q=80&w=1200" 
              alt="Art of Grooming"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
            <div className="absolute bottom-10 left-10 right-10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-2 block">Our Hair & Beard Care</span>
              <h3 className="text-4xl font-light text-white tracking-tight leading-none mb-6">EXPERT SALON & <br /><span className="italic font-serif">GROOMING SERVICES</span></h3>
              <Button asChild variant="outline" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black uppercase text-[10px] tracking-widest font-bold px-8 h-12">
                <Link to="/services">View All Services</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-between p-12 rounded-[24px] border border-primary/20 bg-gradient-to-br from-zinc-900 to-black relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Scissors className="h-48 w-48 text-primary rotate-12" />
            </div>
            
            <div className="relative z-10">
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4 block">Easy Booking</span>
              <h2 className="text-5xl font-light text-white tracking-tight leading-none mb-8">BOOK YOUR <br /><span className="italic text-primary font-serif">APPOINTMENT</span></h2>
              
              <div className="space-y-6 mb-12">
                {[
                  { label: "Style Advice", desc: "Expert recommendations for your look and hair type." },
                  { label: "Expert Haircut & Care", desc: "Clean cuts and professional styling by trained stylists." },
                  { label: "Quality Products", desc: "Best hair and beard products for long-lasting results." }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-start">
                    <div className="h-5 w-5 rounded-full border border-primary/50 flex items-center justify-center shrink-0 mt-1">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">{item.label}</h4>
                      <p className="text-xs text-zinc-500 mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10">
              <Button asChild className="w-full h-16 rounded-none bg-primary text-black hover:bg-primary/90 text-xs font-bold uppercase tracking-[0.3em] shadow-2xl shadow-primary/20">
                <Link to="/book">Book Appointment Now</Link>
              </Button>
              <p className="text-[10px] text-zinc-600 text-center mt-4 tracking-widest uppercase">Instant Confirmation • Easy Cancellation • Mumbai</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
