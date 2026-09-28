export interface StylistPortfolioItem {
  id: string;
  imageUrl: string;
  title: string;
  category: "Color & Balayage" | "Cut & Style" | "Men's Grooming" | "Treatments & Spa" | "Bridal";
  description?: string;
  duration?: string;
}

export interface StylistMember {
  id: string;
  name: string;
  role: string;
  experience: string;
  bio: string;
  avatar: string;
  specialties: string[];
  instagram?: string;
  rating?: number;
  reviewCount?: number;
  availableServices?: string[];
  portfolio: StylistPortfolioItem[];
}

export const DEFAULT_STYLISTS: StylistMember[] = [
  {
    id: "stylist-1",
    name: "Aria Patel",
    role: "Master Colorist & Creative Director",
    experience: "10+ Years Experience",
    bio: "Trained at Vidal Sassoon Academy London, Aria is celebrated for seamless lived-in balayage, face-contouring highlights, and custom toning formulations that maintain supreme hair integrity and glass-like shine.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
    specialties: ["Dimensional Balayage", "Silk Press", "Color Correction", "Curtain Bangs"],
    instagram: "aria_patel_hair",
    rating: 4.98,
    reviewCount: 142,
    availableServices: ["Signature Haircut", "Balayage & Foil Highlights", "Gloss & Blowdry", "Luxury Keratin Treatment"],
    portfolio: [
      {
        id: "port-1-1",
        imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800",
        title: "Sun-Melted Hazelnut Balayage",
        category: "Color & Balayage",
        description: "Hand-painted dimensional ribbons over natural dark base with warm gloss toner.",
        duration: "3.5 hrs"
      },
      {
        id: "port-1-2",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
        title: "Airy 90s Butterfly Layers & Framing",
        category: "Cut & Style",
        description: "Weightless cascading layers cut with Japanese shears for bouncy, voluminous movement.",
        duration: "1 hr"
      },
      {
        id: "port-1-3",
        imageUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800",
        title: "High-Gloss Botanical Silk Press",
        category: "Treatments & Spa",
        description: "Thermal infusion treatment sealing the cuticle for mirror-smooth shine without chemicals.",
        duration: "1.5 hrs"
      },
      {
        id: "port-1-4",
        imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=800",
        title: "Golden Hour Dimensional Blonde",
        category: "Color & Balayage",
        description: "Micro-babylights with root melt designed for seamless 4-month low maintenance grow-out.",
        duration: "4 hrs"
      }
    ]
  },
  {
    id: "stylist-2",
    name: "Marcus Vance",
    role: "Senior Barber & Beard Architect",
    experience: "8 Years Experience",
    bio: "Former educator at British Master Barbers. Marcus combines surgical straight-razor precision with modern low taper fades, sharp beard contouring, and invigorating hot towel essential oil treatments.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800",
    specialties: ["Skin & Taper Fades", "Beard Sculpting", "Hot Towel Shave", "Textured Crop"],
    instagram: "marcus_vance_barber",
    rating: 4.96,
    reviewCount: 128,
    availableServices: ["Signature Haircut", "Beard Sculpting", "Luxury Hot Towel Shave", "Head Massage"],
    portfolio: [
      {
        id: "port-2-1",
        imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=800",
        title: "Clean Low Drop Fade & Textured Top",
        category: "Men's Grooming",
        description: "Seamless skin fade into textured matte crop styled with sea salt spray and clay.",
        duration: "45 mins"
      },
      {
        id: "port-2-2",
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800",
        title: "Architectural Beard Alignment & Steam Ritual",
        category: "Men's Grooming",
        description: "Straight razor cheek line contouring paired with sandalwood beard butter steam infusion.",
        duration: "40 mins"
      },
      {
        id: "port-2-3",
        imageUrl: "https://images.unsplash.com/photo-1517832606589-715753d4f323?auto=format&fit=crop&q=80&w=800",
        title: "Executive Modern Pompadour Taper",
        category: "Cut & Style",
        description: "Traditional scissor-over-comb finish with refined neckline and soft natural sheen.",
        duration: "50 mins"
      }
    ]
  },
  {
    id: "stylist-3",
    name: "Devika Sen",
    role: "Holistic Hair Therapist & Ayurvedic Master",
    experience: "12+ Years Experience",
    bio: "Certified Ayurvedic therapist with deep expertise in trichology, ancestral Marma point stimulation, and botanical herbal decoctions. Devika transforms stressed scalps and revitalizes fragile curls into vibrant crown glory.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800",
    specialties: ["Traditional Champi", "Scalp Detox", "Botanical Hair Spa", "Curl Hydration"],
    instagram: "devika_hairtherapy",
    rating: 5.0,
    reviewCount: 110,
    availableServices: ["Traditional Champi", "Head Massage", "Scalp Rejuvenation Ritual", "Restorative Hair Mask"],
    portfolio: [
      {
        id: "port-3-1",
        imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800",
        title: "Warm Herbal Champi & Marma Release",
        category: "Treatments & Spa",
        description: "Hand-pressed sesame and Brahmi herb infusion targeting acupressure stress points.",
        duration: "60 mins"
      },
      {
        id: "port-3-2",
        imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800",
        title: "Deep Scalp Exfoliation & Steam Bath",
        category: "Treatments & Spa",
        description: "Volcanic clay and tea tree purifying scrub clearing buildup and activating follicles.",
        duration: "45 mins"
      },
      {
        id: "port-3-3",
        imageUrl: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&q=80&w=800",
        title: "Moisture-Locked Curl Definition",
        category: "Cut & Style",
        description: "Aloe vera and hibiscus cold-press masque defining 3B-4A curl bounce and hydration.",
        duration: "75 mins"
      }
    ]
  },
  {
    id: "stylist-4",
    name: "Siddharth Roy",
    role: "Senior Texture & Modern Cut Specialist",
    experience: "7 Years Experience",
    bio: "Renowned for effortless lived-in texture, Parisian bobs, and modern directional cutting. Siddharth crafts low-maintenance, high-impact styles designed to look striking from salon chair to everyday life.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    specialties: ["Textured Shags", "Blunt Micro-Bobs", "Lived-In Waves", "Face Contouring"],
    instagram: "siddharth_cuts",
    rating: 4.93,
    reviewCount: 89,
    availableServices: ["Signature Haircut", "Creative Styling", "Pastel & Fashion Color"],
    portfolio: [
      {
        id: "port-4-1",
        imageUrl: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&q=80&w=800",
        title: "Effortless French Textured Shag",
        category: "Cut & Style",
        description: "Internal feathering removing excess weight while enhancing natural wave formation.",
        duration: "1 hr"
      },
      {
        id: "port-4-2",
        imageUrl: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&q=80&w=800",
        title: "Cool Pearl Platinum Blonde",
        category: "Color & Balayage",
        description: "Controlled clean double-process lift finished with violet-ash iridescent toner.",
        duration: "4.5 hrs"
      },
      {
        id: "port-4-3",
        imageUrl: "https://images.unsplash.com/photo-1582095133179-bfd08e2fc6b3?auto=format&fit=crop&q=80&w=800",
        title: "Sculpted Italian Bob with Soft Fringe",
        category: "Cut & Style",
        description: "Architectural perimeter sitting right at the jaw with invisible interior layers.",
        duration: "1 hr"
      }
    ]
  }
];
