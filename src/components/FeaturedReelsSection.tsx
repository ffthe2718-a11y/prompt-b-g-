import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Sparkles, Heart, Eye, X, ArrowRight, Scissors, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export interface ReelVideo {
  id: string;
  title: string;
  category: string;
  stylist: string;
  duration: string;
  views: string;
  likes: string;
  thumbnail: string;
  videoUrl: string;
  serviceName: string;
  description: string;
}

export const FEATURED_REELS: ReelVideo[] = [
  {
    id: "reel-1",
    title: "Dimensional Honey Caramel Balayage Transformation",
    category: "Hair Colour",
    stylist: "Aarav Sharma",
    duration: "0:45",
    views: "18.4K",
    likes: "2.1K",
    thumbnail: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-stylist-combing-a-clients-hair-41525-large.mp4",
    serviceName: "Balayage & Foil Highlights",
    description: "Watch our master colorist transform dull dark hair into sun-kissed honey caramel balayage using Olaplex bond protection."
  },
  {
    id: "reel-2",
    title: "Liquid Glass Korean Hair Lamination & Keratin",
    category: "Treatments",
    stylist: "Elena Rostova",
    duration: "0:38",
    views: "24.9K",
    likes: "3.8K",
    thumbnail: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=800",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-hairdresser-blow-drying-a-womans-hair-41524-large.mp4",
    serviceName: "Keratin Smooth Treatment",
    description: "Witness the anti-frizz mirror shine result of our signature Keratin Lamination treatment."
  },
  {
    id: "reel-3",
    title: "Shringar Royal Bridal HD Makeup & Saree Draping",
    category: "Bridal",
    stylist: "Zara Khan",
    duration: "0:52",
    views: "42.1K",
    likes: "5.6K",
    thumbnail: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-makeup-artist-applying-eyeshadow-to-a-model-41520-large.mp4",
    serviceName: "Shringar Bridal HD Makeup",
    description: "Full bridal makeover journey from skin prep to 14-hour waterproof HD airbrush finish and dupatta setting."
  },
  {
    id: "reel-4",
    title: "Maharajah Executive Beard Razor Fade & Hot Towel",
    category: "Grooming",
    stylist: "Kabir Verma",
    duration: "0:30",
    views: "15.2K",
    likes: "1.9K",
    thumbnail: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=800",
    videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-barber-cutting-the-hair-of-a-man-41523-large.mp4",
    serviceName: "Men's Beard & Hair Grooming",
    description: "Precision skin fade haircut, razor beard shaping, and hot steam towel facial massage."
  }
];

export default function FeaturedReelsSection() {
  const [activeReel, setActiveReel] = useState<ReelVideo | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [likedReels, setLikedReels] = useState<Record<string, boolean>>({});

  const toggleLike = (reelId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedReels(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  return (
    <section id="featured-reels" className="w-full my-12 py-10">
      <div className="text-center mb-10">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.5em] text-primary">
          Live Makeover Stories
        </span>
        <h2 className="text-3xl font-light tracking-tight md:text-5xl text-foreground">
          FEATURED <span className="italic font-serif text-primary">VIDEO REELS</span>
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-xs text-muted-foreground leading-relaxed">
          Watch real client transformation reels from our master colorists, stylists, and bridal artists in Jaipur.
        </p>
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-4 pb-4 -mx-3 px-3 sm:mx-0 sm:px-0 custom-scrollbar">
        {FEATURED_REELS.map((reel) => {
          const isLiked = likedReels[reel.id];
          return (
            <motion.div
              key={reel.id}
              whileHover={{ y: -6, scale: 1.02 }}
              onClick={() => setActiveReel(reel)}
              className="w-[82%] sm:w-auto shrink-0 snap-start group relative rounded-3xl overflow-hidden border border-border/80 bg-card shadow-xl cursor-pointer transition-all duration-500 hover:border-primary/50"
            >
              {/* Thumbnail Container */}
              <div className="relative aspect-[9/14] w-full overflow-hidden bg-zinc-950">
                <img
                  src={reel.thumbnail}
                  alt={reel.title}
                  className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-700"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />

                {/* Top Floating Badges */}
                <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between z-10">
                  <Badge className="bg-black/80 backdrop-blur-md border border-primary/40 text-primary text-[9px] uppercase font-bold tracking-wider px-2.5 py-0.5">
                    {reel.category}
                  </Badge>

                  <button
                    type="button"
                    onClick={(e) => toggleLike(reel.id, e)}
                    className={cn(
                      "h-8 w-8 rounded-full border border-white/20 backdrop-blur-md flex items-center justify-center transition-all",
                      isLiked ? "bg-red-500 text-white border-red-500" : "bg-black/60 text-white hover:text-red-400"
                    )}
                    title={isLiked ? "Liked" : "Like Reel"}
                  >
                    <Heart className={cn("h-4 w-4", isLiked && "fill-white")} />
                  </button>
                </div>

                {/* Center Play Icon Button */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="h-14 w-14 rounded-full bg-primary/90 text-black flex items-center justify-center shadow-2xl group-hover:scale-125 transition-transform duration-300">
                    <Play className="h-6 w-6 fill-black ml-1" />
                  </div>
                </div>

                {/* Bottom Overlay Content */}
                <div className="absolute bottom-4 left-4 right-4 z-10 text-white space-y-1">
                  <h3 className="text-sm font-bold leading-snug line-clamp-2 text-white group-hover:text-primary transition-colors font-serif">
                    {reel.title}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-zinc-300 pt-1">
                    <span className="font-medium text-amber-300">By {reel.stylist}</span>
                    <span className="flex items-center gap-1 text-[10px] text-zinc-400 font-mono">
                      <Eye className="h-3 w-3" /> {reel.views}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Lightbox Video Player Modal */}
      <Dialog open={!!activeReel} onOpenChange={open => !open && setActiveReel(null)}>
        <DialogContent className="w-[calc(100%-24px)] max-w-3xl max-h-[90dvh] overflow-y-auto rounded-2xl md:rounded-3xl border-primary/30 bg-zinc-950 p-0 text-white shadow-2xl">
          {activeReel && (
            <div className="grid grid-cols-1 md:grid-cols-12">
              {/* Video Player Column */}
              <div className="md:col-span-7 bg-black relative flex items-center justify-center min-h-[360px]">
                <video
                  src={activeReel.videoUrl}
                  poster={activeReel.thumbnail}
                  controls
                  autoPlay
                  loop
                  muted={isMuted}
                  playsInline
                  className="w-full h-full object-cover max-h-[500px]"
                />

                <button
                  type="button"
                  onClick={() => setIsMuted(!isMuted)}
                  className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/70 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </button>
              </div>

              {/* Reel Info & Booking CTA Column */}
              <div className="md:col-span-5 p-6 flex flex-col justify-between space-y-5 bg-card/90">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase font-bold tracking-wider">
                      {activeReel.category} Reel
                    </Badge>
                    <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                      <Eye className="h-3 w-3 text-primary" /> {activeReel.views} Views
                    </span>
                  </div>

                  <h3 className="text-xl font-light font-serif text-white leading-tight">
                    {activeReel.title}
                  </h3>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {activeReel.description}
                  </p>

                  <div className="space-y-2 border-t border-border/80 pt-3 text-xs">
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">Master Artist:</span>
                      <span className="font-bold text-primary">{activeReel.stylist}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-300">
                      <span className="text-muted-foreground text-[10px] uppercase font-bold">Featured Ritual:</span>
                      <span className="font-bold text-white">{activeReel.serviceName}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    asChild
                    className="w-full bg-primary text-black hover:bg-primary/90 font-bold uppercase text-xs tracking-widest h-12 shadow-lg shadow-primary/20 gap-2"
                  >
                    <Link
                      to={`/book?service=${encodeURIComponent(activeReel.serviceName)}`}
                      onClick={() => setActiveReel(null)}
                    >
                      <Scissors className="h-4 w-4" />
                      Book This Look Now
                    </Link>
                  </Button>
                  <p className="text-[10px] text-muted-foreground text-center uppercase tracking-widest">
                    Instant confirmation • 1-on-1 consultation
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
