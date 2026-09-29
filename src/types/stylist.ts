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
    name: "Aarav Sharma",
    role: "Senior Hair Stylist & Color Specialist",
    experience: "10+ Years Experience",
    bio: "Specialist in hair highlights, custom hair coloring, face-framing cuts, and smooth hair blowdrys that give lasting shine.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=800",
    specialties: ["Hair Highlights", "Hair Coloring", "Blowdry Styling", "Keratin Care"],
    instagram: "aarav_hair_mumbai",
    rating: 4.98,
    reviewCount: 142,
    availableServices: ["Expert Haircut & Blowdry", "Hair Highlights & Gloss", "Global Hair Color", "Keratin Smooth Treatment"],
    portfolio: [
      {
        id: "port-1-1",
        imageUrl: "https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&q=80&w=800",
        title: "Caramel Warm Hair Highlights",
        category: "Color & Balayage",
        description: "Natural-looking caramel highlights tailored for Indian skin tones.",
        duration: "3 hrs"
      },
      {
        id: "port-1-2",
        imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=800",
        title: "Layered Haircut & Volume Blowdry",
        category: "Cut & Style",
        description: "Cascading face-framing layers with smooth volume blowout.",
        duration: "1 hr"
      },
      {
        id: "port-1-3",
        imageUrl: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&q=80&w=800",
        title: "Keratin Smooth Shine Hair Care",
        category: "Treatments & Spa",
        description: "Deep conditioning keratin treatment to lock shine and remove frizz.",
        duration: "1.5 hrs"
      }
    ]
  },
  {
    id: "stylist-2",
    name: "Kabir Mehta",
    role: "Master Barber & Men's Grooming Specialist",
    experience: "8 Years Experience",
    bio: "Expert in men's precision haircuts, sharp beard shaping, hot towel razor shaves, and relaxing head massages.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=800",
    specialties: ["Fade Haircuts", "Beard Shaping", "Hot Towel Shave", "Head Massage"],
    instagram: "kabir_barber_mumbai",
    rating: 4.96,
    reviewCount: 128,
    availableServices: ["Men's Precision Haircut", "Beard Shaping & Line Trim", "Hot Towel Razor Shave", "Head Massage"],
    portfolio: [
      {
        id: "port-2-1",
        imageUrl: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&q=80&w=800",
        title: "Clean Low Fade & Textured Haircut",
        category: "Men's Grooming",
        description: "Sharp skin fade with styled textured top.",
        duration: "45 mins"
      },
      {
        id: "port-2-2",
        imageUrl: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=800",
        title: "Beard Line Shaping & Steam Treatment",
        category: "Men's Grooming",
        description: "Clean razor edge beard trim with warm steam towel.",
        duration: "40 mins"
      }
    ]
  },
  {
    id: "stylist-3",
    name: "Devika Sen",
    role: "Herbal Hair Therapist & Champi Specialist",
    experience: "12+ Years Experience",
    bio: "Specialist in traditional herbal oil Champi head massages, scalp detox spa, and nourishing hair fall treatments.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=800",
    specialties: ["Ayurvedic Champi", "Scalp Spa", "Hair Fall Care", "Herbal Facials"],
    instagram: "devika_champi_spa",
    rating: 5.0,
    reviewCount: 110,
    availableServices: ["Traditional Ayurvedic Champi", "Head & Shoulder Massage", "Hair Spa & Detox", "24K Gold Facial"],
    portfolio: [
      {
        id: "port-3-1",
        imageUrl: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&q=80&w=800",
        title: "Warm Herbal Oil Champi Massage",
        category: "Treatments & Spa",
        description: "Herbal oil head massage targeting stress points for deep relaxation.",
        duration: "60 mins"
      },
      {
        id: "port-3-2",
        imageUrl: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=800",
        title: "Scalp Cleanse & Steam Spa",
        category: "Treatments & Spa",
        description: "Herbal scalp scrub and steam bath to strengthen hair roots.",
        duration: "45 mins"
      }
    ]
  },
  {
    id: "stylist-4",
    name: "Zara Khan",
    role: "Senior Bridal Makeup Artist & Stylist",
    experience: "9 Years Experience",
    bio: "Specialist in HD bridal makeup, designer mehendi, saree draping, and party makeovers for weddings and celebrations.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800",
    specialties: ["Bridal HD Makeup", "Mehendi Art", "Saree Draping", "Party Makeovers"],
    instagram: "zara_bridal_mumbai",
    rating: 4.95,
    reviewCount: 105,
    availableServices: ["Shringar Bridal HD Makeup", "Designer Bridal Mehendi", "Saree & Dupatta Draping"],
    portfolio: [
      {
        id: "port-4-1",
        imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=800",
        title: "HD Bridal Makeup & Dupatta Draping",
        category: "Bridal",
        description: "Long-lasting camera-ready HD bridal makeup with traditional jewelry setting.",
        duration: "3 hrs"
      }
    ]
  }
];
