import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Sparkles, Calendar, ArrowRight, ShieldCheck, Heart } from "lucide-react";
import ServicesSection from "@/components/ServicesSection";

export default function Services() {
  return (
    <div className="bg-background py-16 px-4 sm:px-8 lg:px-12 min-h-screen w-full">
      <div className="mx-auto w-full max-w-[1800px]">
        {/* Main Services Section with Category Imagery */}
        <ServicesSection showTitle={true} />

        {/* Custom Consultation & Bridal Bespoke Inquiries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-24 rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-background to-primary/5 p-8 sm:p-14 text-center relative overflow-hidden shadow-2xl"
        >
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <span className="text-xs uppercase tracking-[0.4em] text-primary font-bold block mb-3">
              Personalized Artistry
            </span>
            <h3 className="mb-4 text-3xl sm:text-4xl font-light text-foreground tracking-tight">
              NEED A <span className="italic font-serif text-primary">CUSTOM CONSULTATION</span>?
            </h3>
            <p className="mx-auto mb-8 text-sm text-muted-foreground leading-relaxed">
              Whether preparing for a royal wedding, seeking a total color makeover, or requesting bespoke at-home salon care in Mumbai, our master artisans provide personalized 1-on-1 consultations.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button asChild className="w-full sm:w-auto rounded-full bg-primary px-8 py-6 text-xs font-bold uppercase tracking-widest text-black hover:bg-primary/90 shadow-xl shadow-primary/20">
                <Link to="/book" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Book Private Consultation
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full sm:w-auto rounded-full border-border bg-card/60 hover:bg-white/5 px-8 py-6 text-xs font-bold uppercase tracking-widest text-foreground">
                <Link to="/bundles" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  Explore Curated Bundles
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
