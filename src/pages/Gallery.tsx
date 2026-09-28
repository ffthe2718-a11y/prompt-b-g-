import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Instagram } from "lucide-react";

const fallbackImages = [
  "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1595476108010-b4d1f80d9312?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&q=80&w=800",
  "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
];

export default function Gallery() {
  return (
    <div className="bg-background py-24 px-6">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 text-center"
        >
          <span className="mb-4 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
            Visual Inspiration
          </span>
          <h1 className="text-5xl font-light tracking-tight md:text-7xl">
            THE <span className="italic text-primary">GALLERY</span>
          </h1>
        </motion.div>

        <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 xl:columns-4 space-y-6">
          {fallbackImages.map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="relative overflow-hidden rounded-[16px] border border-border group cursor-pointer"
            >
              <img
                src={src}
                alt={`Gallery image ${i + 1}`}
                className="w-full transition-transform duration-700 group-hover:scale-110 grayscale hover:grayscale-0"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-xs uppercase tracking-widest border border-primary text-primary px-4 py-2 rounded">
                  View Look
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
