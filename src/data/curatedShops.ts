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
    name: "Aurelia Family Salon & Spa",
    slug: "aurelia-flagship",
    location: "Bandra West, Mumbai",
    rating: 4.9,
    ratingCount: 218,
    isVerified: true,
    specialty: "Haircuts, Hair Highlights & Herbal Champi",
    description: "Our main salon branch offering expert haircuts, hair coloring, herbal oil Champi head massage, and smooth keratin care.",
    logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹",
    timing: "10:00 AM - 09:00 PM",
    services: [
      { name: "Expert Haircut & Blowdry", price: "₹1,500", duration: "60 mins" },
      { name: "Traditional Ayurvedic Champi", price: "₹800", duration: "45 mins" },
      { name: "Hair Highlights & Gloss", price: "₹6,500", duration: "180 mins" },
      { name: "Keratin Smooth Treatment", price: "₹5,500", duration: "150 mins" }
    ]
  },
  {
    id: "shop-royale-heritage",
    name: "Royal Touch Barber & Men's Salon",
    slug: "royale-heritage",
    location: "Colaba, Mumbai",
    rating: 4.9,
    ratingCount: 164,
    isVerified: true,
    specialty: "Men's Haircuts, Beard Shaping & Razor Shave",
    description: "Popular men's grooming salon offering precision haircuts, hot towel razor shaves, beard shaping, and detox facials.",
    logo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹",
    timing: "09:00 AM - 09:00 PM",
    services: [
      { name: "Men's Precision Haircut", price: "₹1,000", duration: "45 mins" },
      { name: "Hot Towel Razor Shave", price: "₹600", duration: "30 mins" },
      { name: "Beard Shaping & Line Trim", price: "₹500", duration: "30 mins" },
      { name: "Charcoal Clean-up Facial", price: "₹1,800", duration: "50 mins" }
    ]
  },
  {
    id: "shop-opal-bridal",
    name: "Shringar Bridal Studio & Beauty Parlour",
    slug: "opal-bridal",
    location: "Juhu, Mumbai",
    rating: 5.0,
    ratingCount: 195,
    isVerified: true,
    specialty: "Bridal Makeup, Designer Mehendi & Saree Draping",
    description: "Specialized bridal parlour offering complete HD bridal makeup packages, intricate mehendi, and saree draping.",
    logo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹₹",
    timing: "10:00 AM - 08:00 PM",
    services: [
      { name: "Shringar Bridal HD Makeup", price: "₹15,000", duration: "180 mins" },
      { name: "Bridal Designer Mehendi", price: "₹7,000", duration: "240 mins" },
      { name: "Silk Saree Draping & Styling", price: "₹1,800", duration: "45 mins" },
      { name: "24K Gold Glow Facial", price: "₹3,500", duration: "75 mins" }
    ]
  },
  {
    id: "shop-elysian-studio",
    name: "Glow & Style Family Salon",
    slug: "elysian-studio",
    location: "Lower Parel, Mumbai",
    rating: 4.8,
    ratingCount: 142,
    isVerified: true,
    specialty: "Diamond Facials & Keratin Hair Care",
    description: "Modern beauty salon for women and men offering skin facials, hair spa, and keratin smooth treatments.",
    logo: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹",
    timing: "10:30 AM - 09:30 PM",
    services: [
      { name: "Diamond Instant Glow Facial", price: "₹3,200", duration: "60 mins" },
      { name: "Herbal Scalp Hair Spa", price: "₹1,800", duration: "50 mins" },
      { name: "Keratin Smooth Hair Care", price: "₹4,800", duration: "120 mins" }
    ]
  }
];
