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

export default function Home() {
  const { t } = useI18n();
  const [featuredShops, setFeaturedShops] = useState<any[]>([]);
  const containerRef = useRef(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 800], [0, 250]);

  useEffect(() => {
    const fetchShops = async () => {
      const q = query(collection(db, "shops"), where("isActive", "==", true), limit(3));
      const snap = await getDocs(q);
      setFeaturedShops(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchShops();
  }, []);
  
  return (
    <div className="mx-auto max-w-7xl p-6 grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 min-h-[90vh]">
      {/* Hero Section */}
      <section 
        ref={containerRef}
        className="md:col-span-2 md:row-span-3 rounded-[16px] border border-primary bg-gradient-to-br from-card to-background p-8 relative overflow-hidden flex flex-col justify-center"
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
              Indulge in a premium styling experience tailored to your unique identity. 
              Our master stylists specialize in precision cuts, traditional Champi, and custom coloring in the heart of Mumbai.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild className="rounded bg-primary px-8 py-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90">
                <Link to="/marketplace">Explore Shops</Link>
              </Button>
              <Button asChild variant="outline" className="rounded border-border px-8 py-6 text-xs font-bold uppercase tracking-widest text-foreground hover:bg-white/5">
                <Link to="/partner">Become Partner</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Stats/Independent Shops */}
      <section className="md:col-span-2 md:row-span-2 rounded-[16px] border border-border bg-card p-8 flex flex-col justify-center">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-primary tracking-widest mb-1">Curation</span>
            <h2 className="text-2xl font-serif text-foreground">Featured <span className="italic text-primary">Shops</span></h2>
          </div>
          <Button asChild variant="link" className="text-primary text-[10px] uppercase tracking-widest p-0 h-auto">
            <Link to="/marketplace" className="flex items-center gap-1">
              View All <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {featuredShops.length === 0 ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 rounded-xl border border-border/50 animate-pulse">
                <div className="h-12 w-12 rounded-lg bg-zinc-900 shrink-0" />
                <div className="flex-grow space-y-2">
                  <div className="h-4 w-32 bg-zinc-900 rounded" />
                  <div className="h-3 w-20 bg-zinc-900 rounded" />
                </div>
              </div>
            ))
          ) : (
            featuredShops.map((shop, i) => (
              <motion.div
                key={shop.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Link 
                  to={`/shop/${shop.slug}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-border/50 hover:border-primary/50 hover:bg-primary/[0.02] transition-all group"
                >
                  <div className="h-14 w-14 rounded-lg bg-zinc-900 flex items-center justify-center shrink-0 border border-border group-hover:border-primary/30">
                    {shop.logo ? (
                      <img src={shop.logo} alt={shop.name} className="h-full w-full object-cover rounded-lg" referrerPolicy="no-referrer" />
                    ) : (
                      <Store className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-bold text-sm tracking-tight">{shop.name}</h3>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase mt-1">
                      <MapPin className="h-2 w-2 text-primary" />
                      <span>{shop.location || "Online"}</span>
                      {shop.isVerified && <span className="text-blue-500">• Verified</span>}
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-zinc-700 group-hover:text-primary transition-colors" />
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="md:col-span-2 md:row-span-1 rounded-[16px] border border-border bg-card p-8 flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative group">
        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="max-w-sm relative z-10">
          <h2 className="mb-2 text-2xl font-serif text-primary">
            Ready for your transformation?
          </h2>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold opacity-70">
            Join our exclusive clientele in Mumbai.
          </p>
        </div>
        <Button asChild className="relative z-10 rounded bg-primary px-8 py-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 whitespace-nowrap shadow-xl shadow-primary/10">
          <Link to="/marketplace" className="flex items-center gap-2">
            Get Started <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>

      {/* New Immersive CTA Section */}
      <section className="md:col-span-4 mt-12 mb-12">
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
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-2 block">The Craft</span>
              <h3 className="text-4xl font-light text-white tracking-tight leading-none mb-6">THE ART OF <br /><span className="italic font-serif">MODERN GROOMING</span></h3>
              <Button asChild variant="outline" className="rounded-none border-white/20 text-white hover:bg-white hover:text-black uppercase text-[10px] tracking-widest font-bold px-8 h-12">
                <Link to="/services">Explore The Menu</Link>
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
              <span className="text-[10px] font-bold text-primary uppercase tracking-[0.4em] mb-4 block">Reservation</span>
              <h2 className="text-5xl font-light text-white tracking-tight leading-none mb-8">ELEVATE YOUR <br /><span className="italic text-primary font-serif">PRESENCE</span></h2>
              
              <div className="space-y-6 mb-12">
                {[
                  { label: "Master Consultation", desc: "Expert analysis of your features and style." },
                  { label: "Precision Execution", desc: "Technical mastery in every stroke." },
                  { label: "Premium Aftercare", desc: "Curated products for lasting results." }
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
                <Link to="/book">Secure Your Appointment</Link>
              </Button>
              <p className="text-[10px] text-zinc-600 text-center mt-4 tracking-widest uppercase">Limited Daily Availability • Mumbai Central</p>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
