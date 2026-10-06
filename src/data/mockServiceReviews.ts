import { ServiceReviewItem, ServiceRatingAggregate } from "@/types/serviceReview";

export const DEFAULT_SERVICE_REVIEWS: ServiceReviewItem[] = [
  // Expert Haircut & Blowdry
  {
    id: "rev-hc-1",
    shopId: "aurelia-main",
    service: "Expert Haircut & Blowdry",
    userId: "user-mumbai-101",
    userName: "Ananya Deshmukh",
    userPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Best layered haircut in Bandra!",
    comment: "Aarav understood exactly what framing layers suited my face shape. The volume blowdry lasted 3 full days! Super professional salon setup.",
    tags: ["Master Artistry", "Clean & Sanitized", "Great Consultation"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 14,
    createdAt: "2026-09-15T10:30:00Z"
  },
  {
    id: "rev-hc-2",
    shopId: "aurelia-main",
    service: "Expert Haircut & Blowdry",
    userId: "user-mumbai-102",
    userName: "Rohan Kapoor",
    userPhoto: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Crisp cut and great hair wash experience",
    comment: "The scalp massage during the wash was so relaxing. Aarav gave me a modern haircut that looks neat even without heavy styling products.",
    tags: ["Punctual & Prompt", "Attentive Stylist"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 8,
    createdAt: "2026-09-18T14:15:00Z"
  },
  {
    id: "rev-hc-3",
    shopId: "aurelia-main",
    service: "Expert Haircut & Blowdry",
    userId: "user-mumbai-103",
    userName: "Priya Sharma",
    userPhoto: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
    rating: 4,
    title: "Very soft curtain bangs and bounce",
    comment: "Loved the soft curtain bangs! The blowout had amazing shine and zero frizz. Highly recommended for hair makeover.",
    tags: ["Flawless Technique"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 5,
    createdAt: "2026-09-22T11:00:00Z"
  },

  // Men's Beard & Hair Grooming
  {
    id: "rev-bg-1",
    shopId: "aurelia-main",
    service: "Men's Beard & Hair Grooming",
    userId: "user-mumbai-104",
    userName: "Vikram Malhotra",
    userPhoto: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Sharp beard line & hot towel steam",
    comment: "Kabir is a master barber! The hot towel razor shave and beard alignment were so sharp. Will definitely book again.",
    tags: ["Master Artistry", "Punctual & Prompt"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 11,
    createdAt: "2026-09-12T16:00:00Z"
  },
  {
    id: "rev-bg-2",
    shopId: "aurelia-main",
    service: "Men's Beard & Hair Grooming",
    userId: "user-mumbai-105",
    userName: "Siddharth Rao",
    userPhoto: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Clean taper fade and relaxing facial massage",
    comment: "Extremely tidy service. The beard balm and facial massage left my skin super fresh.",
    tags: ["Clean & Sanitized"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 6,
    createdAt: "2026-09-20T17:30:00Z"
  },

  // Traditional Ayurvedic Champi
  {
    id: "rev-ch-1",
    shopId: "aurelia-main",
    service: "Traditional Ayurvedic Champi",
    userId: "user-mumbai-106",
    userName: "Meera Nair",
    userPhoto: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Pure bliss & stress relief!",
    comment: "Devika's warm herbal oil head massage melted away my work stress. The Marma pressure point technique is incredible.",
    tags: ["Authentic Ayurveda", "Relaxing Champi"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 19,
    createdAt: "2026-09-10T12:00:00Z"
  },
  {
    id: "rev-ch-2",
    shopId: "aurelia-main",
    service: "Traditional Ayurvedic Champi",
    userId: "user-mumbai-107",
    userName: "Aditya Verma",
    userPhoto: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Helped reduce my scalp tension",
    comment: "A divine experience with warm herbal oils and shoulder pressure release. 10/10 worth every rupee.",
    tags: ["Authentic Ayurveda"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 7,
    createdAt: "2026-09-21T15:45:00Z"
  },

  // Balayage & Foil Highlights
  {
    id: "rev-bal-1",
    shopId: "aurelia-main",
    service: "Balayage & Foil Highlights",
    userId: "user-mumbai-108",
    userName: "Kavya Iyer",
    userPhoto: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Gorgeous caramel balayage without hair damage!",
    comment: "I was worried about bleaching, but Aarav used Olaplex protection and custom caramel toning. My hair looks glossy and naturally sun-kissed!",
    tags: ["Expert Colourist", "Master Artistry"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 22,
    createdAt: "2026-09-14T11:20:00Z"
  },
  {
    id: "rev-bal-2",
    shopId: "aurelia-main",
    service: "Balayage & Foil Highlights",
    userId: "user-mumbai-109",
    userName: "Simran Kaur",
    userPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Perfect honey blonde dimension",
    comment: "Seamless blend from my natural dark roots. I get compliments every single day!",
    tags: ["Expert Colourist"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 12,
    createdAt: "2026-09-25T13:10:00Z"
  },

  // Global Hair Color & Toning
  {
    id: "rev-gc-1",
    shopId: "aurelia-main",
    service: "Global Hair Color & Toning",
    userId: "user-mumbai-110",
    userName: "Sneha Reddy",
    userPhoto: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Rich chocolate brown color with brilliant gloss",
    comment: "100% grey coverage and zero harsh ammonia chemical smell. The color seal mask made my hair silky smooth.",
    tags: ["Clean & Sanitized", "Attentive Stylist"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 9,
    createdAt: "2026-09-16T16:30:00Z"
  },

  // Keratin Smooth Treatment
  {
    id: "rev-ker-1",
    shopId: "aurelia-main",
    service: "Keratin Smooth Treatment",
    userId: "user-mumbai-111",
    userName: "Neha Shah",
    userPhoto: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Zero frizzy hair even in Mumbai humidity!",
    comment: "Transformed my unmanageable frizzy hair into glass-smooth hair. Cuts my morning routine down to 5 minutes.",
    tags: ["Flawless Technique", "Master Artistry"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 18,
    createdAt: "2026-09-08T10:00:00Z"
  },

  // 24K Gold Revival Facial
  {
    id: "rev-fcl-1",
    shopId: "aurelia-main",
    service: "24K Gold Revival Facial",
    userId: "user-mumbai-112",
    userName: "Aarti Agarwal",
    userPhoto: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Unbelievable wedding glow!",
    comment: "The 24K gold foil infusion and lymphatic drainage facial massage gave my skin an instant luminous radiance before my cousin's wedding.",
    tags: ["Luxury Ambiance", "Master Artistry"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 16,
    createdAt: "2026-09-19T14:00:00Z"
  },

  // Shringar Bridal HD Makeup
  {
    id: "rev-brd-1",
    shopId: "aurelia-main",
    service: "Shringar Bridal HD Makeup",
    userId: "user-mumbai-113",
    userName: "Pooja Mehta",
    userPhoto: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    title: "Made my dream wedding look come true!",
    comment: "Zara Khan is a magician! The HD bridal makeup lasted 14 hours through sweat, tears, and pheras without getting cakey. The saree draping was flawless.",
    tags: ["Master Artistry", "Punctual & Prompt", "Luxury Ambiance"],
    recommend: true,
    verifiedBooking: true,
    helpfulCount: 31,
    createdAt: "2026-09-05T09:00:00Z"
  }
];

export function calculateServiceRatings(reviews: ServiceReviewItem[]): Record<string, ServiceRatingAggregate> {
  const map: Record<string, { totalRating: number; count: number; dist: { 5: number; 4: number; 3: number; 2: number; 1: number } }> = {};

  reviews.forEach(r => {
    const sName = r.service.trim();
    if (!map[sName]) {
      map[sName] = {
        totalRating: 0,
        count: 0,
        dist: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
      };
    }

    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    map[sName].totalRating += r.rating;
    map[sName].count += 1;
    map[sName].dist[star] += 1;
  });

  const result: Record<string, ServiceRatingAggregate> = {};
  Object.keys(map).forEach(sName => {
    const item = map[sName];
    const avg = Number((item.totalRating / item.count).toFixed(1));
    result[sName] = {
      serviceName: sName,
      averageRating: avg,
      totalReviews: item.count,
      ratingDistribution: item.dist
    };
  });

  return result;
}
