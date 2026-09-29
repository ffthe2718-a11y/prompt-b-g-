import { motion } from "motion/react";
import { Sparkles, Scissors, Crown, MapPin, Award, ShieldCheck, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import MeetYourStylist from "@/components/MeetYourStylist";

export default function About() {
  return (
    <div className="bg-background py-16 px-4 sm:px-8 lg:px-12 min-h-screen w-full">
      <div className="mx-auto w-full max-w-[1800px]">
        {/* Story Section */}
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
              Our Story & Promise
            </span>
            <h1 className="mb-8 text-5xl font-light tracking-tight md:text-7xl">
              BEST SALON <br />
              <span className="italic font-serif text-primary">EXPERIENCE</span>
            </h1>
            <div className="space-y-6 text-base font-light leading-relaxed text-muted-foreground">
              <p>
                Founded in 2015, Aurelia Luxe brings together top hair stylists, makeup artists, and beauty experts across Mumbai. We offer high-quality salon services, hair treatments, and bridal styling at fair, transparent prices.
              </p>
              <p>
                Located in top areas of Mumbai like Bandra, Juhu, and Colaba, our partner salons are clean, comfortable, and equipped with modern styling tools.
              </p>
              <p>
                From relaxing herbal oil Champi head massages to smooth keratin treatments and HD bridal makeup, we make sure every visit leaves you feeling confident.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-3xl border border-white/10 shadow-2xl relative group">
              <img
                src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1000"
                alt="Master stylist sectioning hair"
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-white">
                <span className="text-[10px] uppercase tracking-widest text-primary font-bold block mb-1">
                  Bandra Salon Branch
                </span>
                <p className="text-xs text-zinc-300 font-light">
                  101 Turner Road, Bandra West, Mumbai • Private Styling Rooms
                </p>
              </div>
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="absolute -bottom-10 -left-8 hidden md:block w-60 aspect-square overflow-hidden rounded-2xl border border-primary/30 bg-zinc-950 p-2 shadow-2xl backdrop-blur-xl"
            >
              <img
                src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=500"
                alt="Hair Lamination"
                className="h-full w-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </motion.div>
          </motion.div>
        </div>

        {/* 3 Pillars Glass Cards */}
        <div className="mt-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-xs uppercase tracking-[0.4em] text-primary font-bold block mb-2">
              Our Core Features
            </span>
            <h2 className="text-4xl font-serif text-white">WHY CLIENTS <span className="italic text-primary">TRUST US</span></h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Scissors,
                title: "Expert Haircuts & Styling",
                desc: "Tailored cuts and hair coloring designed for your face shape and hair type."
              },
              {
                icon: Crown,
                title: "Complete Bridal Makeup",
                desc: "HD bridal makeup, hair styling, saree draping, and pre-bridal glow facials for your big day."
              },
              {
                icon: Heart,
                title: "Relaxing Champi & Scalp Care",
                desc: "Traditional herbal oil head massage to relieve stress and nourish hair roots."
              }
            ].map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 24, scale: 0.98 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="p-8 rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-xl hover:border-primary/50 hover:bg-white/[0.06] transition-all duration-500 group"
                >
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-serif text-white mb-3 group-hover:text-primary transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-light">
                    {pillar.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Master Stylists Component */}
        <div className="mt-36">
          <MeetYourStylist />
        </div>
      </div>
    </div>
  );
}
