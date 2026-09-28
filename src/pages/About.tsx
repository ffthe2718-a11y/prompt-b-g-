import { motion } from "motion/react";

export default function About() {
  return (
    <div className="bg-background py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-24 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
              Our Story
            </span>
            <h1 className="mb-8 text-5xl font-light tracking-tight md:text-7xl">
              ARTISTRY <br />
              <span className="italic text-primary">REDEFINED</span>
            </h1>
            <div className="space-y-6 text-lg font-light leading-relaxed text-muted-foreground">
              <p>
                Founded in 2015, Aurelia Luxe was born from a vision to create a 
                sanctuary where hair styling is elevated to a fine art. We believe 
                that every client is a canvas, and every style is a unique expression 
                of their inner self.
              </p>
              <p>
                Now at the heart of Mumbai, our studio is designed to be an immersive 
                experience. From the minimalist dark aesthetic to the curated 
                soundscape, every detail is chosen to provide a sense of calm and exclusivity.
              </p>
              <p>
                We don't just cut hair; we craft identities. Our master stylists 
                bring traditional Indian techniques like the Ayurvedic Champi into 
                modern luxury styling, ensuring that Aurelia Luxe remains at the 
                forefront of the industry.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative"
          >
            <div className="aspect-[4/5] overflow-hidden rounded-[16px] border border-border">
              <img
                src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=1000"
                alt="Stylist at work"
                className="h-full w-full object-cover grayscale"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="absolute -bottom-12 -left-12 hidden md:block w-64 aspect-square overflow-hidden rounded-[16px] border border-border bg-card p-4">
              <img
                src="https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=500"
                alt="Detail"
                className="h-full w-full object-cover rounded-lg grayscale"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>
        </div>

        {/* Team Section */}
        <div className="mt-48">
          <div className="mb-20 text-center">
            <h2 className="text-3xl font-serif text-primary uppercase tracking-widest">The Master Artists</h2>
          </div>
          <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { name: "Ananya Sharma", role: "Creative Director", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=500" },
              { name: "Arjun Khanna", role: "Master Stylist", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=500" },
              { name: "Priya Nair", role: "Color Specialist", img: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=500" },
            ].map((member, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <div className="aspect-[3/4] overflow-hidden rounded-[16px] border border-border mb-6 grayscale group-hover:grayscale-0 transition-all duration-500">
                  <img src={member.img} alt={member.name} className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <h3 className="text-xl font-light tracking-wide text-foreground">{member.name}</h3>
                <p className="text-xs uppercase tracking-widest text-primary">{member.role}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
