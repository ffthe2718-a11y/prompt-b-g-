import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const services = [
  {
    category: "Styling & Cuts",
    items: [
      { name: "Signature Haircut", price: "from ₹1,500", desc: "Precision cut, wash, and luxury blow-dry." },
      { name: "Executive Grooming", price: "from ₹1,000", desc: "Tailored cut for the modern gentleman." },
      { name: "Traditional Champi", price: "from ₹800", desc: "Relaxing head massage with Ayurvedic oils." },
    ]
  },
  {
    category: "Bridal & Special Events",
    items: [
      { name: "Indian Bridal Makeup", price: "from ₹15,000", desc: "Traditional luxury makeup for the Indian bride." },
      { name: "Designer Mehndi", price: "from ₹5,000", desc: "Intricate henna artistry for weddings and events." },
      { name: "Sari Draping", price: "from ₹1,200", desc: "Professional draping in various traditional styles." },
    ]
  },
  {
    category: "Treatments & Color",
    items: [
      { name: "Luxury Keratin", price: "from ₹8,000", desc: "Long-lasting smoothing and frizz reduction." },
      { name: "Glow Revival Facial", price: "from ₹2,500", desc: "Intense radiance treatment for healthy skin." },
      { name: "Bespoke Balayage", price: "from ₹5,500", desc: "Hand-painted highlights for a natural look." },
    ]
  }
];

export default function Services() {
  return (
    <TooltipProvider>
      <div className="bg-background py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20 text-center"
          >
            <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
              Our Expertise
            </span>
            <h1 className="text-5xl font-light tracking-tight md:text-7xl">
              CURATED <span className="italic text-primary">SERVICES</span>
            </h1>
          </motion.div>

          <div className="grid grid-cols-1 gap-16 lg:grid-cols-3">
            {services.map((section, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <h2 className="mb-8 text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground border-b border-border pb-4">
                  {section.category}
                </h2>
                <div className="space-y-10">
                  {section.items.map((item, i) => (
                    <div key={i} className="group cursor-default">
                      <div className="flex items-baseline justify-between mb-2">
                        <h3 className="text-lg font-light tracking-wide group-hover:text-primary transition-colors">
                          {item.name}
                        </h3>
                        <div className="flex items-center gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Info className="h-3.5 w-3.5 text-zinc-600 cursor-help hover:text-primary transition-colors" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-zinc-900 border-zinc-800 text-white p-3 text-[10px] uppercase tracking-widest leading-relaxed max-w-[200px] shadow-2xl">
                              <p>{item.desc}</p>
                            </TooltipContent>
                          </Tooltip>
                          <span className="text-xs font-mono text-primary whitespace-nowrap">{item.price}</span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-24 rounded-[16px] border border-border bg-card p-12 text-center"
          >
            <h3 className="mb-4 text-2xl font-serif text-primary">Need a custom consultation?</h3>
            <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
              Our stylists are available for one-on-one consultations to help you 
              achieve your dream look.
            </p>
            <Button asChild className="rounded bg-primary px-10 py-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90">
              <Link to="/book">Book Consultation</Link>
            </Button>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}

