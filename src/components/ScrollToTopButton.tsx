import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

export default function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 250) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          className="fixed bottom-20 right-4 md:bottom-8 md:right-8 z-30 pb-safe"
        >
          <Button
            onClick={scrollToTop}
            size="icon"
            className="h-11 w-11 md:h-12 md:w-12 rounded-full bg-zinc-900/90 backdrop-blur-xl border border-primary/50 text-primary hover:bg-primary hover:text-black shadow-2xl shadow-black/80 transition-all duration-300 hover:scale-110 active:scale-95"
            title="Scroll back to top"
            aria-label="Scroll back to top"
          >
            <ArrowUp className="h-5 w-5 stroke-[2.5]" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
