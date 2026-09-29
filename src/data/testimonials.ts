export interface Testimonial {
  id: string;
  clientName: string;
  location: string;
  avatar: string;
  rating: number;
  reviewTitle: string;
  content: string;
  treatment: string;
  serviceCategory: "Hair & Balayage" | "Bridal & Couture" | "Grooming & Shave" | "Skincare & Spa";
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
    reviewTitle: "The most luminous Balayage I have ever had!",
    content: "Aurelia Luxe completely elevated my hair. The master colorist took time to understand my skin tone before creating the bespoke caramel balayage. 4 months later and the blend is still seamless and healthy. Truly world-class salon artistry in Bandra.",
    treatment: "Bespoke Dimensional Balayage & Keratin Infusion",
    serviceCategory: "Hair & Balayage",
    stylistName: "Aarav Sharma",
    shopName: "Aurelia Flagship Atelier",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Complimentary Olaplex Scalp Shield included"
  },
  {
    id: "test-2",
    clientName: "Vikram Singhania",
    location: "Worli, Mumbai",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Executive Beard Sculpting & Straight Razor Perfection",
    content: "The hot towel straight razor shave paired with the charcoal skin therapy was top tier. The attention to detail on the beard fading is razor sharp. The private lounge atmosphere makes it my weekly ritual before corporate meetings.",
    treatment: "Royal Hot Towel Shave & Beard Sculpting",
    serviceCategory: "Grooming & Shave",
    stylistName: "Kabir Mehta",
    shopName: "Royale Heritage Barber & Lounge",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Artisanal Single-Origin Espresso served"
  },
  {
    id: "test-3",
    clientName: "Rhea & Karan Malhotra",
    location: "Juhu, Mumbai",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Flawless Royal Bridal Artistry for our Wedding Weekend",
    content: "For my wedding at the Taj Mahal Palace, the bridal team worked pure magic. The HD makeup stayed pristine for over 14 hours in Mumbai humidity without a single touch-up, and the organic Rajasthani mehndi stain was breathtakingly deep.",
    treatment: "Royal Heritage Bridal Package & HD Airbrush",
    serviceCategory: "Bridal & Couture",
    stylistName: "Zara Khan",
    shopName: "Opal & Pearl Bridal Sanctuary",
    verifiedVisitDate: "Verified Visit • August 2026",
    isVerifiedClient: true,
    highlightPerk: "Private Bridal Suite & Champagne High Tea"
  },
  {
    id: "test-4",
    clientName: "Pooja Merchant",
    location: "Lower Parel, Mumbai",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Pure Zen: Ayurvedic Warm Oil Champi",
    content: "The Kansa wand pressure point massage and warm Brahmi oil infusion melted away weeks of corporate burnout. The aromatic herbs and calming environment make this the best wellness sanctuary in the city.",
    treatment: "Traditional Ayurvedic Champi & Scalp Detox",
    serviceCategory: "Skincare & Spa",
    stylistName: "Devika Patel",
    shopName: "Aurelia Flagship Atelier",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Custom Botanical Oil blend to take home"
  },
  {
    id: "test-5",
    clientName: "Aditya Roy Kapur",
    location: "Colaba, Mumbai",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Precision Scissor Work & Scalp Rejuvenation",
    content: "Finding a stylist who understands texture and movement without over-thinning is rare. The consultation alone was worth it, and the peppermint scalp wash was deeply invigorating. 10/10 service.",
    treatment: "Signature Executive Haircut & Charcoal Scalp Wash",
    serviceCategory: "Grooming & Shave",
    stylistName: "Kabir Mehta",
    shopName: "Royale Heritage Barber & Lounge",
    verifiedVisitDate: "Verified Visit • August 2026",
    isVerifiedClient: true,
    highlightPerk: "VIP Express Booking & Reserved Valet"
  },
  {
    id: "test-6",
    clientName: "Meera Subramanian",
    location: "Powai, Mumbai",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200",
    rating: 5,
    reviewTitle: "Instant Glass Skin with 24K Gold Revival",
    content: "My skin was radiant and deeply nourished before an international gala. The facialist used ultrasonic infusion and pure 24K leaf masks. No redness, only pure luxury glow.",
    treatment: "24K Gold Revival Facial & Ultrasonic Infusion",
    serviceCategory: "Skincare & Spa",
    stylistName: "Devika Patel",
    shopName: "Elysian Glow & Balayage Bar",
    verifiedVisitDate: "Verified Visit • September 2026",
    isVerifiedClient: true,
    highlightPerk: "Includes LED Collagen therapy session"
  }
];
