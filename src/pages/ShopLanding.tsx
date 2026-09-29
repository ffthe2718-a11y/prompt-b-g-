import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "@/firebase";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Calendar, Phone, MapPin, Instagram, Facebook, Twitter, ShieldCheck, Mail, Star } from "lucide-react";
import ShopReviews from "@/components/ShopReviews";
import MeetYourStylist from "@/components/MeetYourStylist";
import JoinWaitlistModal from "@/components/JoinWaitlistModal";
import { StylistMember } from "@/types/stylist";
import { cn } from "@/lib/utils";

interface ShopSection {
  id: string;
  title: string;
  enabled: boolean;
  order: number;
}

interface ShopData {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo?: string;
  location?: string;
  phone?: string;
  email?: string;
  rating?: number;
  ratingCount?: number;
  templateId: string;
  isVerified?: boolean;
  isActive?: boolean;
  instagramHandle?: string;
  facebookHandle?: string;
  twitterHandle?: string;
  sections?: ShopSection[];
  content: {
    heroTitle?: string;
    heroSubtitle?: string;
    heroImage?: string;
    heroVideo?: string;
    aboutText?: string;
    aboutImage?: string;
    services?: { name: string; price: string; description?: string }[];
    stylists?: StylistMember[];
    gallery?: string[];
  };
  theme: {
    primaryColor?: string;
    accentColor?: string;
  };
}

export default function ShopLanding({ previewData }: { previewData?: ShopData }) {
  const { slug } = useParams<{ slug: string }>();
  const [shop, setShop] = useState<ShopData | null>(previewData || null);
  const [loading, setLoading] = useState(!previewData);

  useEffect(() => {
    if (previewData) {
      setShop(previewData);
      setLoading(false);
      return;
    }

    const fetchShop = async () => {
      if (!slug) return;
      try {
        const q = query(collection(db, "shops"), where("slug", "==", slug), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0];
          setShop({ id: doc.id, ...doc.data() } as ShopData);
        } else {
          // Check curated fallback shops
          const { CURATED_SHOPS } = await import("@/data/curatedShops");
          const curated = CURATED_SHOPS.find(s => s.slug === slug);
          if (curated) {
            setShop({
              id: curated.id,
              name: curated.name,
              slug: curated.slug,
              description: curated.description,
              logo: curated.logo,
              location: curated.location,
              rating: curated.rating,
              ratingCount: curated.ratingCount,
              templateId: "luxury",
              isVerified: curated.isVerified,
              isActive: true,
              content: {
                heroTitle: curated.name,
                heroSubtitle: curated.specialty,
                heroImage: curated.coverImage,
                aboutText: curated.description,
                services: curated.services?.map(s => ({ name: s.name, price: s.price, description: s.duration })),
              },
              theme: {
                primaryColor: "#cda45e"
              }
            });
          }
        }
      } catch (error) {
        console.error("Error fetching shop:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [slug, previewData]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="animate-pulse text-primary font-mono tracking-widest">LOADING SHOP...</div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4 text-center">
        <h1 className="text-4xl font-bold mb-4">Shop Not Found</h1>
        <p className="text-muted-foreground mb-8">The shop you are looking for doesn't exist or has been moved.</p>
        <Button asChild variant="outline">
          <Link to="/">Back to Marketplace</Link>
        </Button>
      </div>
    );
  }

  // Basic Template Rendering
  const sortedSections = shop.sections 
    ? [...shop.sections].sort((a, b) => a.order - b.order)
    : [
        { id: 'hero', title: 'Hero', enabled: true, order: 0 },
        { id: 'about', title: 'About', enabled: true, order: 1 },
        { id: 'services', title: 'Services', enabled: true, order: 2 },
        { id: 'stylists', title: 'Meet Your Stylist', enabled: true, order: 3 },
        { id: 'reviews', title: 'Reviews & Ratings', enabled: true, order: 4 },
      ];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      {sortedSections.map((section) => {
        if (!section.enabled) return null;

        switch (section.id) {
          case 'instagram':
            return (
              <section key="instagram" className="py-24 px-4 bg-zinc-950 border-t border-zinc-900">
                <div className="max-w-6xl mx-auto">
                  <div className="flex justify-between items-end mb-12">
                    <div>
                      <h2 className="text-4xl font-bold uppercase tracking-widest mb-2 italic flex items-center gap-3">
                        <Instagram className="h-8 w-8 text-primary" />
                        Live Feed
                      </h2>
                      <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">Follow @{shop.instagramHandle || shop.slug} on Instagram</p>
                    </div>
                    <Button variant="outline" className="border-zinc-800 hover:bg-zinc-900 hidden md:flex">
                      Follow Us
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <motion.div 
                        key={i}
                        whileHover={{ scale: 1.02 }}
                        className="aspect-square bg-zinc-900 rounded-xl overflow-hidden relative group"
                      >
                        <img 
                          src={`https://picsum.photos/seed/${shop.slug}-${i}/800/800`} 
                          alt="Instagram feed" 
                          referrerPolicy="no-referrer"
                          className="h-full w-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <Instagram className="h-6 w-6 text-white" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>
            );
          case 'hero':
            return (
              <section key="hero" className="relative h-screen flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                  {shop.content.heroVideo ? (
                    <video 
                      autoPlay 
                      muted 
                      loop 
                      playsInline
                      className="w-full h-full object-cover opacity-40"
                    >
                      <source src={shop.content.heroVideo} type="video/mp4" />
                    </video>
                  ) : (
                    <img 
                      src={shop.content.heroImage || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=2070"} 
                      alt="Barber Shop" 
                      className="w-full h-full object-cover opacity-40"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black" />
                </div>

                <div className="relative z-10 px-4 max-w-4xl mx-auto flex justify-center">
                  <motion.div 
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="w-full rounded-[28px] bg-white/[0.07] border border-white/20 backdrop-blur-xl p-8 md:p-14 shadow-2xl shadow-black/60 text-center transition-all duration-500 hover:scale-[1.03] hover:border-white/40 hover:shadow-[0_25px_60px_rgba(255,255,255,0.08)] group/card relative overflow-hidden"
                  >
                    {/* Subtle top gloss line */}
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />

                    {shop.logo && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6 }}
                        className="mb-8 flex justify-center"
                      >
                        <div className="h-24 w-24 md:h-32 md:w-32 rounded-full border-2 border-white/30 p-1.5 bg-black/40 backdrop-blur-md overflow-hidden shadow-2xl transition-all duration-500 group-hover/card:scale-105 group-hover/card:border-white/60 group-hover/card:drop-shadow-[0_10px_25px_rgba(255,255,255,0.2)]">
                          <img src={shop.logo} alt={shop.name} className="h-full w-full object-cover rounded-full transition-transform duration-500 group-hover/card:scale-105" />
                        </div>
                      </motion.div>
                    )}
                    <motion.h1 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-4 italic flex items-center justify-center gap-3"
                    >
                      {shop.content.heroTitle || shop.name}
                      {shop.isVerified && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5, delay: 0.8 }}
                        >
                          <ShieldCheck className="h-9 w-9 text-blue-400 fill-blue-500/20 shrink-0" />
                        </motion.div>
                      )}
                    </motion.h1>
                    <motion.p 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-lg md:text-xl text-zinc-300 mb-6 font-light tracking-wide max-w-2xl mx-auto leading-relaxed"
                    >
                      {shop.content.heroSubtitle || shop.description}
                    </motion.p>

                    {/* Rating preview pill */}
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="flex flex-wrap items-center justify-center gap-3 mb-8"
                    >
                      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-md shadow-sm">
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              className={cn(
                                "h-3.5 w-3.5",
                                s <= Math.round(shop.rating || 5)
                                  ? "text-yellow-400 fill-yellow-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.5)]"
                                  : "text-zinc-700"
                              )} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold font-mono text-white">
                          {shop.rating ? shop.rating.toFixed(1) : "5.0"}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          ({shop.ratingCount || 16} reviews)
                        </span>
                        <a 
                          href="#reviews-section" 
                          className="text-[11px] text-primary hover:text-white underline underline-offset-4 ml-1.5 transition-colors font-medium"
                        >
                          Read Reviews
                        </a>
                        <a 
                          href="#stylists-section" 
                          className="text-[11px] text-zinc-300 hover:text-primary transition-colors font-medium border-l border-zinc-700 pl-2"
                        >
                          Meet Stylists
                        </a>
                      </div>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="flex flex-col sm:flex-row items-center justify-center gap-4"
                    >
                      <Button size="lg" className="bg-primary text-black hover:bg-primary/90 rounded-full px-10 h-14 text-sm font-bold uppercase tracking-widest shadow-xl shadow-primary/20 w-full sm:w-auto transition-transform hover:scale-105" asChild>
                        <Link to={`/book?shopId=${shop.id}`}>
                          <Calendar className="mr-2 h-4 w-4" />
                          Book Appointment
                        </Link>
                      </Button>
                      <JoinWaitlistModal
                        shopName={shop.name}
                        shopId={shop.id}
                        serviceName={shop.content?.services?.[0]?.name || "Atelier Master Treatment"}
                        triggerText="Join Priority Waitlist"
                        triggerVariant="outline"
                        triggerClassName="h-14 px-8 rounded-full border-white/20 bg-white/[0.04] text-amber-300 hover:bg-white/10 hover:border-amber-400/50 font-bold uppercase tracking-widest text-xs w-full sm:w-auto transition-transform hover:scale-105"
                      />
                    </motion.div>
                  </motion.div>
                </div>
              </section>
            );
          case 'about':
            return (
              <section key="about" className="py-24 px-4 bg-zinc-950">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
                  <div>
                    <h2 className="text-4xl font-bold uppercase tracking-widest mb-8 border-l-4 border-primary pl-6">Our Story</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                      {shop.content.aboutText || "Welcome to our shop. We provide the best grooming services in town with a focus on quality and customer satisfaction."}
                    </p>
                    <div className="flex gap-6">
                      <Instagram className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                      <Facebook className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                      <Twitter className="h-6 w-6 text-muted-foreground hover:text-primary cursor-pointer transition-colors" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <img 
                      src={shop.content.aboutImage || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&q=80&w=1000"} 
                      alt="Interior" 
                      className="rounded-lg grayscale hover:grayscale-0 transition-all duration-500" 
                    />
                    <img src="https://images.unsplash.com/photo-1621605815841-aa897bd07b3d?auto=format&fit=crop&q=80&w=1000" alt="Detail" className="rounded-lg mt-8 grayscale hover:grayscale-0 transition-all duration-500" />
                  </div>
                </div>
              </section>
            );
          case 'services':
            return (
              <section key="services" className="py-24 px-4 bg-black">
                <div className="max-w-4xl mx-auto">
                  <h2 className="text-4xl font-bold uppercase tracking-widest mb-16 text-center">Premium Services</h2>
                  <div className="space-y-8">
                    {(shop.content.services || [
                      { name: "Signature Haircut", price: "$35", description: "Precision cut tailored to your head shape." },
                      { name: "Beard Sculpting", price: "$25", description: "Expert beard shaping and line-up." },
                      { name: "Luxury Hot Towel Shave", price: "$40", description: "Traditional straight-razor shave experience." },
                      { name: "Head Massage", price: "$15", description: "Relaxing 10-minute scalp massage." }
                    ]).map((service, idx) => (
                      <div key={idx} className="flex flex-col border-b border-zinc-800 pb-4 group hover:border-primary transition-colors">
                        <div className="flex justify-between items-end">
                          <div>
                            <h3 className="text-xl font-bold uppercase group-hover:text-primary transition-colors">{service.name}</h3>
                          </div>
                          <span className="text-2xl font-mono text-primary">{service.price}</span>
                        </div>
                        {service.description && (
                          <p className="text-sm text-muted-foreground mt-2 italic max-w-2xl">{service.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );
          case 'stylists':
            return (
              <div key="stylists" id="stylists-section">
                <MeetYourStylist
                  stylists={shop.content?.stylists}
                  shopId={shop.id}
                  shopName={shop.name}
                  shopSlug={shop.slug}
                />
              </div>
            );
          case 'reviews':
            return (
              <div key="reviews" id="reviews-section">
                <ShopReviews
                  shopId={shop.id}
                  shopName={shop.name}
                  shopSlug={shop.slug}
                  services={shop.content?.services}
                  onReviewSubmitted={(newRating, newCount) => {
                    setShop(prev => prev ? { ...prev, rating: newRating, ratingCount: newCount } : null);
                  }}
                />
              </div>
            );
          default:
            return null;
        }
      })}

      {/* Fallback Meet Your Stylist section if not in custom sections array */}
      {!sortedSections.some(s => s.id === 'stylists' && s.enabled) && (
        <div id="stylists-section">
          <MeetYourStylist
            stylists={shop.content?.stylists}
            shopId={shop.id}
            shopName={shop.name}
            shopSlug={shop.slug}
          />
        </div>
      )}

      {/* Fallback Reviews section if not in custom sections array */}
      {!sortedSections.some(s => s.id === 'reviews' && s.enabled) && (
        <div id="reviews-section">
          <ShopReviews
            shopId={shop.id}
            shopName={shop.name}
            shopSlug={shop.slug}
            services={shop.content?.services}
            onReviewSubmitted={(newRating, newCount) => {
              setShop(prev => prev ? { ...prev, rating: newRating, ratingCount: newCount } : null);
            }}
          />
        </div>
      )}

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-900 bg-zinc-950 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
          <div className="flex flex-col items-center md:items-start text-center md:text-left gap-4">
            {shop.logo && (
              <img src={shop.logo} alt="Logo" className="h-10 w-10 object-cover rounded-md mb-2 grayscale hover:grayscale-0 transition-all" />
            )}
            <div>
              <h3 className="text-2xl font-black italic tracking-tighter mb-2 uppercase text-primary">{shop.name}</h3>
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-4">Crafting excellence with every cut.</p>
              <p className="text-zinc-600 text-[10px] uppercase tracking-widest">© 2026 {shop.name}. Powered by Aurelia Luxe.</p>
            </div>
          </div>
          
          <div className="flex flex-wrap justify-center md:justify-end gap-12 text-sm uppercase tracking-widest text-muted-foreground group">
            {shop.phone && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-600 font-bold tracking-tighter">Phone</span>
                  <span className="text-white text-xs">{shop.phone}</span>
                </div>
              </div>
            )}
            
            {shop.location && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-600 font-bold tracking-tighter uppercase">Address</span>
                  <span className="text-white text-xs whitespace-pre-wrap max-w-xs">{shop.location}</span>
                </div>
              </div>
            )}

            {shop.email && (
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-zinc-900 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-all">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-600 font-bold tracking-tighter uppercase">Email</span>
                  <span className="text-white text-xs">{shop.email}</span>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <span className="text-[9px] text-zinc-600 font-bold tracking-tighter uppercase ml-auto">Follow</span>
              <div className="flex gap-4">
                {shop.instagramHandle && (
                  <a href={`https://instagram.com/${shop.instagramHandle}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {shop.facebookHandle && (
                  <a href={`https://facebook.com/${shop.facebookHandle}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {shop.twitterHandle && (
                  <a href={`https://twitter.com/${shop.twitterHandle}`} target="_blank" rel="noreferrer" className="hover:text-primary transition-colors">
                    <Twitter className="h-5 w-5" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
