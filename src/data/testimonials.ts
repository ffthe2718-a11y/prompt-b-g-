export interface Testimonial {
  id: string;
  clientName: string;
  location: string;
  avatar: string;
  rating: number;
  reviewTitle: string;
  content: string;
  treatment: string;
  serviceCategory: "Hair & Balayage" | "Bridal & Wedding" | "Grooming & Shave" | "Skincare & Spa";
  stylistName: string;
  shopName: string;
  verifiedVisitDate: string;
  isVerifiedClient: boolean;
  highlightPerk?: string;
}

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: "test-1",
    clientName: "Ananya Deshmukh",
    location: "Bandra West, Mumbai",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Best Hair Highlights & Haircut experience!",
    content: "Aurelia Beauty & Hair Salon did an amazing job with my hair. The hair stylist took time to understand my face shape and suggested a customized caramel highlight. 4 months later and my hair still looks soft, healthy, and shiny.",
    treatment: "Custom Hair Highlights & Keratin Care",
    serviceCategory: "Hair & Balayage",
    stylistName: "Aarav Sharma",
    shopName: "Aurelia Family Salon & Spa",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Free Scalp Care Massage included"
  },
  {
    id: "test-2",
    clientName: "Vikram Singhania",
    location: "Worli, Mumbai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Men's Beard Shaping & Razor Shave Perfection",
    content: "The hot towel razor shave and charcoal facial clean-up was super relaxing. Great attention to detail on beard line shaping. Clean environment and friendly staff.",
    treatment: "Hot Towel Razor Shave & Beard Shaping",
    serviceCategory: "Grooming & Shave",
    stylistName: "Kabir Mehta",
    shopName: "Royal Touch Barber & Men's Salon",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Complimentary Hot Coffee served"
  },
  {
    id: "test-3",
    clientName: "Rhea & Karan Malhotra",
    location: "Juhu, Mumbai",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Beautiful Bridal HD Makeup for my Wedding Day!",
    content: "For my wedding, the bridal makeup team did magic! The HD bridal makeup stayed fresh for over 14 hours in Mumbai humidity without any touch-ups, and the mehendi color was dark and long-lasting.",
    treatment: "Shringar Bridal HD Makeup & Mehendi Package",
    serviceCategory: "Bridal & Wedding",
    stylistName: "Zara Khan",
    shopName: "Shringar Bridal Studio & Beauty Parlour",
    verifiedVisitDate: "Verified Visit • August 2026",
    isVerifiedClient: true,
    highlightPerk: "Private Bridal Room & Tea Service"
  },
  {
    id: "test-4",
    clientName: "Pooja Merchant",
    location: "Lower Parel, Mumbai",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Super Relaxing Ayurvedic Oil Champi Head Massage",
    content: "The warm herbal oil head massage completely relieved my stress and headache. The soothing oil blend and neck pressure point massage was so relaxing. Highly recommended!",
    treatment: "Traditional Ayurvedic Champi & Scalp Care",
    serviceCategory: "Skincare & Spa",
    stylistName: "Devika Patel",
    shopName: "Aurelia Family Salon & Spa",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Free Herbal Oil Sample to take home"
  },
  {
    id: "test-5",
    clientName: "Aditya Roy Kapur",
    location: "Colaba, Mumbai",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Great Men's Haircut & Head Wash",
    content: "Finding a barber who understands hair texture without thinning too much is hard. The haircut was precise, and the scalp wash was super refreshing. 10/10 service.",
    treatment: "Men's Precision Haircut & Scalp Wash",
    serviceCategory: "Grooming & Shave",
    stylistName: "Kabir Mehta",
    shopName: "Royal Touch Barber & Men's Salon",
    verifiedVisitDate: "Verified Visit • August 2026",
    isVerifiedClient: true,
    highlightPerk: "Easy Advance Booking & Parking Available"
  },
  {
    id: "test-6",
    clientName: "Meera Subramanian",
    location: "Powai, Mumbai",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Instant Glow with 24K Gold Facial",
    content: "My skin felt super soft and glowing before my cousin's reception. The facial included deep cleaning and a real 24K gold mask. Natural shine with no redness!",
    treatment: "24K Gold Facial & Deep Cleaning",
    serviceCategory: "Skincare & Spa",
    stylistName: "Devika Patel",
    shopName: "Glow & Style Family Salon",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Includes Vitamin C Glow Mask"
  }
];
