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
    clientName: "Ananya Sharma",
    location: "C-Scheme, Jaipur",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Best Hair Highlights & Layered Haircut in Jaipur!",
    content: "Royal Tresses at C-Scheme did an absolute masterpiece with my hair. The stylist took time to understand my face shape and suggested customized caramel highlights. Months later and my hair still looks soft, healthy, and shiny.",
    treatment: "Custom Hair Highlights & Keratin Care",
    serviceCategory: "Hair & Balayage",
    stylistName: "Aarav Sharma",
    shopName: "Royal Tresses - C-Scheme Executive Flagship",
    verifiedVisitDate: "Verified Visit • October 2026",
    isVerifiedClient: true,
    highlightPerk: "Complimentary Scalp Care Massage included"
  },
  {
    id: "test-2",
    clientName: "Vikram Singh Rathore",
    location: "Malviya Nagar, Jaipur",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Men's Beard Shaping & Hot Towel Razor Shave",
    content: "The hot towel razor shave and charcoal clean-up facial at World Trade Park branch was super refreshing. Great attention to detail on beard line shaping. Clean environment and courteous staff.",
    treatment: "Hot Towel Razor Shave & Beard Shaping",
    serviceCategory: "Grooming & Shave",
    stylistName: "Kabir Mehta",
    shopName: "Royal Tresses - Malviya Nagar Uptown Studio",
    verifiedVisitDate: "Verified Visit • October 2026",
    isVerifiedClient: true,
    highlightPerk: "Complimentary Masala Chai served"
  },
  {
    id: "test-3",
    clientName: "Rhea & Karan Saxena",
    location: "Vaishali Nagar, Jaipur",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Exquisite Shringar Bridal HD Makeup for our Wedding!",
    content: "For our Jaipur destination wedding, Royal Tresses bridal team worked magic! The HD makeup stayed fresh for over 14 hours in celebrations without any touch-ups, and the mehendi color was rich and deep.",
    treatment: "Shringar Bridal HD Makeup & Mehendi Package",
    serviceCategory: "Bridal & Wedding",
    stylistName: "Zara Khan",
    shopName: "Royal Tresses - C-Scheme Executive Flagship",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Private Bridal Suite & Refreshments"
  },
  {
    id: "test-4",
    clientName: "Pooja Shekhawat",
    location: "Amrapali Circle, Jaipur",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Super Relaxing Traditional Ayurvedic Champi Head Massage",
    content: "The warm herbal oil head massage completely relieved my stress and headache. The soothing herbal oil blend and neck pressure point massage at Vaishali Nagar branch was divine.",
    treatment: "Traditional Ayurvedic Champi & Scalp Care",
    serviceCategory: "Skincare & Spa",
    stylistName: "Devika Sen",
    shopName: "Royal Tresses - Vaishali Nagar Wellness Oasis",
    verifiedVisitDate: "Verified Visit • October 2026",
    isVerifiedClient: true,
    highlightPerk: "Free Herbal Hair Oil Sample"
  },
  {
    id: "test-5",
    clientName: "Aditya Vijayvergiya",
    location: "C-Scheme, Jaipur",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Outstanding Precision Haircut & Styling",
    content: "Finding a barber who understands hair texture without thinning too much is hard. The haircut was precise, and the scalp wash was super refreshing. Best salon experience in Jaipur.",
    treatment: "Men's Precision Haircut & Scalp Wash",
    serviceCategory: "Grooming & Shave",
    stylistName: "Kabir Mehta",
    shopName: "Royal Tresses - C-Scheme Executive Flagship",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Valet Parking & Priority Booking"
  }
];
