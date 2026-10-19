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
    id: "shop-jaipur-cscheme",
    name: "Royal Tresses - C-Scheme Executive Flagship",
    slug: "jaipur-cscheme",
    location: "C-Scheme, Near Statue Circle, Jaipur",
    rating: 4.95,
    ratingCount: 342,
    isVerified: true,
    specialty: "Executive Haircuts, Balayage Color & Bridal Suite",
    description: "Our premier flagship salon in the heart of C-Scheme offering luxury hair styling, advanced facials, and private bridal makeup suites.",
    logo: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹₹",
    timing: "09:30 AM - 09:00 PM",
    services: [
      { name: "Expert Haircut & Blowdry", price: "₹1,200", duration: "60 mins" },
      { name: "Shringar Bridal HD Makeup", price: "₹15,000", duration: "180 mins" },
      { name: "Hair Coloring & Balayage", price: "₹4,800", duration: "150 mins" },
      { name: "24K Gold Glow Facial", price: "₹2,800", duration: "60 mins" }
    ]
  },
  {
    id: "shop-jaipur-malviyanagar",
    name: "Royal Tresses - Malviya Nagar Uptown Studio",
    slug: "jaipur-malviyanagar",
    location: "Malviya Nagar, Near World Trade Park, Jaipur",
    rating: 4.90,
    ratingCount: 285,
    isVerified: true,
    specialty: "Men's Precision Grooming, Beard Styling & Facials",
    description: "Uptown Jaipur salon near WTP featuring expert men's fades, hot towel razor shaves, herbal Champi, and skin treatments.",
    logo: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹",
    timing: "09:00 AM - 09:30 PM",
    services: [
      { name: "Men's Precision Fade Haircut", price: "₹850", duration: "45 mins" },
      { name: "Beard Shaping & Razor Trim", price: "₹500", duration: "30 mins" },
      { name: "Ayurvedic Champi Head Massage", price: "₹750", duration: "45 mins" },
      { name: "Charcoal Clean-up Facial", price: "₹1,500", duration: "45 mins" }
    ]
  },
  {
    id: "shop-jaipur-vaishalinagar",
    name: "Royal Tresses - Vaishali Nagar Wellness Oasis",
    slug: "jaipur-vaishalinagar",
    location: "Vaishali Nagar, Amrapali Circle, Jaipur",
    rating: 4.92,
    ratingCount: 210,
    isVerified: true,
    specialty: "Ayurvedic Champi, Herbal Spa & Bridal Mehendi",
    description: "Relaxing wellness oasis at Amrapali Circle offering traditional oil massages, scalp detox, and designer bridal mehendi.",
    logo: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=400",
    coverImage: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=1200",
    priceRange: "₹₹",
    timing: "10:00 AM - 08:30 PM",
    services: [
      { name: "Traditional Ayurvedic Champi", price: "₹750", duration: "45 mins" },
      { name: "Designer Bridal Mehendi", price: "₹5,000", duration: "180 mins" },
      { name: "Herbal Scalp Hair Spa", price: "₹1,600", duration: "60 mins" },
      { name: "Diamond Instant Glow Facial", price: "₹2,500", duration: "60 mins" }
    ]
  }
];
