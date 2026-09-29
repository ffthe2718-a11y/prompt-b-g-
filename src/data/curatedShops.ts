export interface CuratedShop {
  id: string;
  name: string;
  slug: string;
  location: string;
  rating: number;
  ratingCount: number;
  isVerified: boolean;
  specialty: string;
  description: string;
  logo: string;
  coverImage: string;
  priceRange: string;
  timing?: string;
  services?: { name: string; price: string; duration: string }[];
}

export const CURATED_SHOPS: CuratedShop[] = [
  {
    id: "shop-aurelia-flagship",
    name: "Aurelia Flagship Atelier",
    slug: "aurelia-flagship",
    location: "Bandra West, Mumbai",
    rating: 4.9,
    ratingCount: 218,
    isVerified: true,
    specialty: "Couture Balayage & Ayurvedic Champi",
    description: "Our premier flagship salon featuring bespoke balayage, traditional warm oil Champi, and luxury scalp wellness.",
    logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹₹",
    timing: "10:00 AM - 09:00 PM",
    services: [
      { name: "Signature Haircut & Style", price: "₹1,500", duration: "60 mins" },
      { name: "Traditional Ayurvedic Champi", price: "₹800", duration: "45 mins" },
      { name: "Bespoke Dimensional Balayage", price: "₹6,500", duration: "180 mins" },
      { name: "Luxury Keratin Smoothing", price: "₹5,500", duration: "150 mins" }
    ]
  },
  {
    id: "shop-royale-heritage",
    name: "Royale Heritage Barber & Lounge",
    slug: "royale-heritage",
    location: "Colaba, Mumbai",
    rating: 4.9,
    ratingCount: 164,
    isVerified: true,
    specialty: "Executive Grooming & Hot Towel Shave",
    description: "Old-world elegance meets modern precision grooming, artisanal beard sculpting, and charcoal skin therapies.",
    logo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹",
    timing: "09:00 AM - 09:00 PM",
    services: [
      { name: "Executive Precision Haircut", price: "₹1,000", duration: "45 mins" },
      { name: "Royal Hot Towel Straight Shave", price: "₹600", duration: "30 mins" },
      { name: "Artisanal Beard Sculpting", price: "₹500", duration: "30 mins" },
      { name: "Detox Charcoal Facial", price: "₹1,800", duration: "50 mins" }
    ]
  },
  {
    id: "shop-opal-bridal",
    name: "Opal & Pearl Bridal Sanctuary",
    slug: "opal-bridal",
    location: "Juhu, Mumbai",
    rating: 5.0,
    ratingCount: 195,
    isVerified: true,
    specialty: "Bridal Artistry & Designer Mehndi",
    description: "Exclusive bridal suites offering HD royal bridal makeup, intricate designer mehndi, and silk saree draping.",
    logo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹₹₹",
    timing: "10:00 AM - 08:00 PM",
    services: [
      { name: "Royal Indian Bridal Makeup", price: "₹15,000", duration: "180 mins" },
      { name: "Bridal Designer Mehndi", price: "₹7,000", duration: "240 mins" },
      { name: "Silk Sari Draping & Styling", price: "₹1,800", duration: "45 mins" },
      { name: "24K Gold Revival Facial", price: "₹3,500", duration: "75 mins" }
    ]
  },
  {
    id: "shop-elysian-studio",
    name: "Elysian Glow & Balayage Bar",
    slug: "elysian-studio",
    location: "Lower Parel, Mumbai",
    rating: 4.8,
    ratingCount: 142,
    isVerified: true,
    specialty: "Diamond Facials & Keratin Therapy",
    description: "Contemporary aesthetic studio dedicated to transformative botanical facials and lustrous hair treatments.",
    logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹₹",
    timing: "10:30 AM - 09:30 PM",
    services: [
      { name: "Diamond Glow Revival Facial", price: "₹3,200", duration: "60 mins" },
      { name: "Botanical Scalp Detox Spa", price: "₹1,800", duration: "50 mins" },
      { name: "Lustre Keratin Infusion", price: "₹4,800", duration: "120 mins" }
    ]
  }
];
