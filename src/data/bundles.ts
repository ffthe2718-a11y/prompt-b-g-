import { BundleServiceItem, CuratedBundle } from "@/types/bundle";

export const CATALOG_SERVICES_FOR_BUNDLING: BundleServiceItem[] = [
  {
    id: "indian-bridal-makeup",
    name: "Indian Bridal HD Makeup & Setting",
    category: "bridal",
    price: 15000,
    durationMinutes: 150,
    description: "High-definition bridal makeup with contouring, waterproof setting, eye drama, and jewelry pin placement.",
    tag: "Signature Bridal"
  },
  {
    id: "glow-revival-facial",
    name: "24K Gold Glow Revival Facial",
    category: "skin",
    price: 2500,
    durationMinutes: 60,
    description: "Deep ultrasonic pore cleansing, gold-leaf peptide infusion, and brightening cryo-globe massage.",
    tag: "Radiance Best-Seller"
  },
  {
    id: "designer-mehndi",
    name: "Designer Bridal Mehndi Artistry",
    category: "bridal",
    price: 5000,
    durationMinutes: 180,
    description: "Intricate traditional Rajasthani and Marwari henna motifs for hands and feet with clove-oil setting.",
    tag: "Artisanal Henna"
  },
  {
    id: "ayurvedic-champi",
    name: "Traditional Ayurvedic Head Massage (Champi)",
    category: "wellness",
    price: 800,
    durationMinutes: 45,
    description: "Warm botanical oil scalp massage targeting marma points for deep tension release and hair vitality.",
    tag: "Ancient Ritual"
  },
  {
    id: "luxury-sari-draping",
    name: "Couture Sari & Dupatta Draping",
    category: "bridal",
    price: 1200,
    durationMinutes: 35,
    description: "Crease-free precision draping in traditional bridal pleated, Nivi, or Bengali style with hidden pin security.",
    tag: "Couture Styling"
  },
  {
    id: "luxury-keratin",
    name: "Luxury Keratin Silk Smoothing",
    category: "hair",
    price: 8000,
    durationMinutes: 120,
    description: "Formaldehyde-free protein bonding treatment that seals cuticles, eliminates humidity frizz, and imparts mirror shine.",
    tag: "Frizz-Free Shine"
  },
  {
    id: "bespoke-balayage",
    name: "Bespoke Balayage & Glaze Melt",
    category: "hair",
    price: 5500,
    durationMinutes: 120,
    description: "Hand-painted sun-kissed contouring with customized ammonia-free toning gloss and bond protection.",
    tag: "Custom Color"
  },
  {
    id: "signature-haircut",
    name: "Signature Precision Cut & Blowout",
    category: "hair",
    price: 1500,
    durationMinutes: 50,
    description: "Face-framing shear work followed by a voluminous thermal blowout with argan gloss finish.",
    tag: "Salon Classic"
  },
  {
    id: "executive-grooming",
    name: "Executive Gentleman's Cut & Fade",
    category: "grooming",
    price: 1000,
    durationMinutes: 40,
    description: "Tailored fade, razor neck line-up, eyebrow clean, and matte texturizing finish.",
    tag: "Men's Classic"
  },
  {
    id: "beard-sculpting-hot-towel",
    name: "Beard Sculpting & Hot Towel Treatment",
    category: "grooming",
    price: 800,
    durationMinutes: 30,
    description: "Straight-razor beard outlining, sandalwood steam wrap, and organic jojoba beard butter conditioning.",
    tag: "Luxe Barbering"
  },
  {
    id: "charcoal-detox-facial",
    name: "Charcoal & Vitamin C Detox Facial",
    category: "skin",
    price: 2200,
    durationMinutes: 50,
    description: "Activated bamboo charcoal blackhead vacuum, enzymatic exfoliation, and chilled antioxidant sheet mask.",
    tag: "Pollution Defense"
  },
  {
    id: "luxury-mani-pedi",
    name: "Spa Rose & Saffron Manicure & Pedicure",
    category: "wellness",
    price: 2400,
    durationMinutes: 65,
    description: "Rose petal soak, brown sugar scrub, cuticle nourish, nail shaping, and paraffin wax moisture lock.",
    tag: "Pampering"
  }
];

export const CURATED_BUNDLES: CuratedBundle[] = [
  {
    id: "bridal-glow-package",
    title: "The Royal Bridal Glow Package",
    subtitle: "The ultimate head-to-toe wedding radiance ritual for the discerning bride",
    tag: "Most Popular Bridal Package",
    badge: "22% Bundle Savings",
    category: "bridal",
    categoryLabel: "Bridal & Weddings",
    description: "A meticulously orchestrated, full-day bridal transformation designed to give you luminous, camera-ready skin, majestic hair, and immaculate ceremonial makeup.",
    servicesIncluded: [
      "Indian Bridal HD Makeup & Setting",
      "24K Gold Glow Revival Facial",
      "Designer Bridal Mehndi Artistry",
      "Traditional Ayurvedic Head Massage (Champi)",
      "Couture Sari & Dupatta Draping"
    ],
    serviceDetails: [
      {
        name: "24K Gold Glow Revival Facial",
        description: "Ultrasonic deep pore preparation and 24K gold foil infusion to ensure flawless, lit-from-within bridal skin.",
        originalPrice: 2500,
        duration: "60 mins"
      },
      {
        name: "Traditional Ayurvedic Champi",
        description: "De-stressing warm brahmi & bhringraj botanical oil massage to relax bridal wedding jitters.",
        originalPrice: 800,
        duration: "45 mins"
      },
      {
        name: "Designer Bridal Mehndi Artistry",
        description: "Intricate traditional floral & jali patterns across hands, wrists, and feet with organic herbal henna.",
        originalPrice: 5000,
        duration: "180 mins"
      },
      {
        name: "Indian Bridal HD Makeup & Setting",
        description: "Airbrush HD base, precision contouring, luxury false lashes, and 16-hour sweat-proof bridal seal.",
        originalPrice: 15000,
        duration: "150 mins"
      },
      {
        name: "Couture Sari & Dupatta Draping",
        description: "Master draping of heavy bridal lehenga dupatta and zari sari with reinforce safety pinning.",
        originalPrice: 1200,
        duration: "35 mins"
      }
    ],
    originalPrice: 24500,
    bundledPrice: 18999,
    discountPercentage: 22,
    savingsAmount: 5501,
    estimatedDuration: "5.5 Hours (Can be split across 2 days)",
    image: "https://images.unsplash.com/photo-1546804784-896d0dca3805?auto=format&fit=crop&q=80&w=1200",
    recommendedFor: "Brides getting married within 1-4 weeks seeking flawless skin, relaxing prep, and couture bridal makeup.",
    perks: [
      "Private VIP Bridal Suite access with dedicated beverage service",
      "Complimentary touch-up vanity kit for the wedding evening",
      "Veil and heirloom jewelry placement assistance",
      "One complimentary glass of artisanal mocktail / champagne"
    ],
    steps: [
      {
        phase: "Phase 1: Radiance & Skin Prep",
        title: "24K Gold Facial & Warm Ayurvedic Scalp Therapy",
        duration: "105 Mins",
        detail: "Cleansing pores, replenishing skin moisture barrier, and releasing pre-wedding shoulder and neck tension."
      },
      {
        phase: "Phase 2: Ceremonial Mehndi",
        title: "Artisanal Henna Session with Herbal Infusions",
        duration: "180 Mins",
        detail: "Relax in luxury recliner while our master mehndi artists apply dark-staining traditional motifs."
      },
      {
        phase: "Phase 3: The Grand Bridal Glow",
        title: "High-Definition Makeup, Hair Sculpting & Couture Draping",
        duration: "185 Mins",
        detail: "Flawless HD airbrush contour, customized eye glamour, bridal bun or cascading waves, and dupatta security."
      }
    ]
  },
  {
    id: "pre-wedding-trousseau-ritual",
    title: "Pre-Wedding Trousseau & Gloss Package",
    subtitle: "Complete hair rehabilitation, crystal facial glow, and artisanal henna",
    tag: "Wedding Week Essential",
    badge: "Save 23%",
    category: "bridal",
    categoryLabel: "Bridal & Weddings",
    description: "Designed for the bride or immediate bridesmaids 3 to 7 days before wedding festivities kick off. Restores hair silkiness and brings back skin dewiness.",
    servicesIncluded: [
      "Luxury Keratin Silk Smoothing",
      "24K Gold Glow Revival Facial",
      "Designer Bridal Mehndi Artistry",
      "Spa Rose & Saffron Manicure & Pedicure"
    ],
    serviceDetails: [
      {
        name: "Luxury Keratin Silk Smoothing",
        description: "Deep cuticle restructuring for silky, humidity-resistant locks throughout all wedding events.",
        originalPrice: 8000,
        duration: "120 mins"
      },
      {
        name: "24K Gold Glow Revival Facial",
        description: "Intense radiance boost with micro-exfoliation and collagen sheet mask.",
        originalPrice: 2500,
        duration: "60 mins"
      },
      {
        name: "Designer Mehndi Artistry",
        description: "Artful henna styling for pre-wedding sangeet and cocktail nights.",
        originalPrice: 5000,
        duration: "180 mins"
      },
      {
        name: "Spa Rose & Saffron Mani-Pedi",
        description: "Nourishing floral soak, paraffin foot wrap, and high-shine buffing.",
        originalPrice: 2400,
        duration: "65 mins"
      }
    ],
    originalPrice: 17900,
    bundledPrice: 13799,
    discountPercentage: 23,
    savingsAmount: 4101,
    estimatedDuration: "4.5 Hours",
    image: "https://images.unsplash.com/photo-1512290900672-1f02e604f32e?auto=format&fit=crop&q=80&w=1200",
    recommendedFor: "Brides preparing their skin and hair 3-7 days prior to their sangeet and reception ceremonies.",
    perks: [
      "Complimentary take-home Keratin Aftercare mini shampoo & mask",
      "Aromatherapy relaxation lounge access",
      "Choice of floral herbal teas"
    ],
    steps: [
      {
        phase: "Step 1",
        title: "Keratin Seal & Hair Restructuring",
        duration: "120 Mins",
        detail: "Eliminates frizzy flyaways for sleek updos and open hair photographs."
      },
      {
        phase: "Step 2",
        title: "24K Gold Radiance Facial",
        duration: "60 Mins",
        detail: "Cleanses, stimulates microcirculation, and delivers long-lasting hydration."
      },
      {
        phase: "Step 3",
        title: "Rose Mani-Pedi & Henna Art",
        duration: "90 Mins",
        detail: "Synchronized hand and foot grooming for immaculate ring and jewelry close-ups."
      }
    ]
  },
  {
    id: "grooms-imperial-wedding-package",
    title: "Groom's Imperial Ceremony Bundle",
    subtitle: "Sharpened beard architecture, detox facial, and royal scalp revitalization",
    tag: "Gentleman's Signature",
    badge: "25% Bundle Discount",
    category: "groom",
    categoryLabel: "Groom's Lounge",
    description: "A comprehensive men's grooming and relaxation suite that leaves grooms looking impeccably polished, calm, and charismatic for wedding celebrations.",
    servicesIncluded: [
      "Executive Gentleman's Cut & Fade",
      "Beard Sculpting & Hot Towel Treatment",
      "Charcoal & Vitamin C Detox Facial",
      "Traditional Ayurvedic Head Massage (Champi)"
    ],
    serviceDetails: [
      {
        name: "Executive Gentleman's Cut & Fade",
        description: "Precision shear or taper fade tailored to personal face geometry with clean razor edges.",
        originalPrice: 1000,
        duration: "40 mins"
      },
      {
        name: "Beard Sculpting & Hot Towel Treatment",
        description: "Steam wrap with pure sandalwood mist, sharp cheekline detailing, and organic beard oil hydration.",
        originalPrice: 800,
        duration: "30 mins"
      },
      {
        name: "Charcoal & Vitamin C Detox Facial",
        description: "Purifies pores clogged by city pollution and restores clean, matte skin radiance.",
        originalPrice: 2200,
        duration: "50 mins"
      },
      {
        name: "Traditional Ayurvedic Champi",
        description: "Invigorating scalp acupressure with cooling herbal oils to melt fatigue.",
        originalPrice: 800,
        duration: "45 mins"
      }
    ],
    originalPrice: 4800,
    bundledPrice: 3599,
    discountPercentage: 25,
    savingsAmount: 1201,
    estimatedDuration: "2.5 Hours",
    image: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&q=80&w=1200",
    recommendedFor: "Grooms and best men wanting razor-sharp styling and stress relief before wedding receptions.",
    perks: [
      "Private Groom's lounge with espresso / cold brew bar",
      "Complimentary beard balm sample",
      "Express collar clean-up touch-up valid within 7 days"
    ],
    steps: [
      {
        phase: "Step 1",
        title: "Haircut & Beard Architecture",
        duration: "70 Mins",
        detail: "Precise tapering, line-up, and hot towel relaxation."
      },
      {
        phase: "Step 2",
        title: "Charcoal Deep Cleanse Facial",
        duration: "50 Mins",
        detail: "Removes blackheads and revitalizes tired under-eye circles."
      },
      {
        phase: "Step 3",
        title: "Royal Champi Oil Massage",
        duration: "30 Mins",
        detail: "Deep scalp pressure massage with warm Ayurvedic herbal infusions."
      }
    ]
  },
  {
    id: "head-to-toe-glow-trio",
    title: "Head-to-Toe Radiance Trio",
    subtitle: "Color glaze, 24K facial rejuvenation, and voluminous styling blowout",
    tag: "High-Society Favourite",
    badge: "Save 22%",
    category: "glow",
    categoryLabel: "Radiance & Skin",
    description: "The complete transformation package for gala events, festive parties, or personal milestone celebrations.",
    servicesIncluded: [
      "Bespoke Balayage & Glaze Melt",
      "24K Gold Glow Revival Facial",
      "Signature Precision Cut & Blowout"
    ],
    serviceDetails: [
      {
        name: "Bespoke Balayage & Glaze Melt",
        description: "Subtle dimensions with ammonia-free gloss for vibrant, multi-tonal reflection.",
        originalPrice: 5500,
        duration: "120 mins"
      },
      {
        name: "24K Gold Glow Revival Facial",
        description: "Peptide nourishment and cryo-sculpting for an instant natural facelift.",
        originalPrice: 2500,
        duration: "60 mins"
      },
      {
        name: "Signature Precision Cut & Blowout",
        description: "Weightless layering and high-volume bouncy brush styling.",
        originalPrice: 1500,
        duration: "50 mins"
      }
    ],
    originalPrice: 9500,
    bundledPrice: 7399,
    discountPercentage: 22,
    savingsAmount: 2101,
    estimatedDuration: "3.5 Hours",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1200",
    recommendedFor: "Anyone attending special celebrations seeking effortless, luminous head-to-toe transformation.",
    perks: [
      "Color protection gloss booster included",
      "Complimentary glass of sparkling refreshment",
      "Priority stylist booking"
    ],
    steps: [
      {
        phase: "Step 1",
        title: "Custom Balayage & Toner Glaze",
        duration: "120 Mins",
        detail: "Dimensional highlights and nourishing moisture seal."
      },
      {
        phase: "Step 2",
        title: "24K Gold Peptide Facial",
        duration: "60 Mins",
        detail: "Firms skin and provides an instant photogenic glow."
      },
      {
        phase: "Step 3",
        title: "Precision Cut & Bouncy Blowout",
        duration: "50 Mins",
        detail: "Dynamic layers and lasting thermal style."
      }
    ]
  },
  {
    id: "ayurvedic-scalp-glow-sanctuary",
    title: "Ayurvedic Scalp & Glow Sanctuary",
    subtitle: "Ancient botanical relaxation paired with modern skin brightening",
    tag: "Holistic Wellness",
    badge: "Save 25%",
    category: "hair-revival",
    categoryLabel: "Wellness & Hair",
    description: "A calming restorative afternoon designed to detoxify stressed scalps, boost hair root microcirculation, and leave your complexion beaming.",
    servicesIncluded: [
      "Traditional Ayurvedic Head Massage (Champi)",
      "24K Gold Glow Revival Facial",
      "Signature Precision Cut & Blowout"
    ],
    serviceDetails: [
      {
        name: "Traditional Ayurvedic Champi",
        description: "Acupressure marma therapy with warm herbal oils.",
        originalPrice: 800,
        duration: "45 mins"
      },
      {
        name: "24K Gold Glow Revival Facial",
        description: "Revives dull, tired skin with essential botanical extracts and cryo globes.",
        originalPrice: 2500,
        duration: "60 mins"
      },
      {
        name: "Signature Precision Cut & Blowout",
        description: "Split ends removal and luxurious blowout style.",
        originalPrice: 1500,
        duration: "50 mins"
      }
    ],
    originalPrice: 4800,
    bundledPrice: 3599,
    discountPercentage: 25,
    savingsAmount: 1201,
    estimatedDuration: "2.5 Hours",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200",
    recommendedFor: "Individuals dealing with screen fatigue, scalp stress, or dull skin seeking instant rejuvenation.",
    perks: [
      "Personalized oil formulation based on your Ayurvedic dosha",
      "Herbal tea infusion service",
      "Warm neck wrap during facial treatment"
    ],
    steps: [
      {
        phase: "Step 1",
        title: "Dosha Herbal Oil Scalp Therapy",
        duration: "45 Mins",
        detail: "Traditional rhythmic acupressure strokes to boost endorphins."
      },
      {
        phase: "Step 2",
        title: "24K Gold Revival Facial",
        duration: "60 Mins",
        detail: "Exfoliates, drains lymphatic fluid, and infuses hydration."
      },
      {
        phase: "Step 3",
        title: "Luxe Cut & Silk Blowout",
        duration: "45 Mins",
        detail: "Lightweight styling to showcase healthy, shiny hair."
      }
    ]
  },
  {
    id: "mother-bride-indulgence-duo",
    title: "Mother & Bride Luxury Indulgence (Duo)",
    subtitle: "Shared memory-making day of pampering for the Bride and her Mother",
    tag: "Dual VIP Suite Experience",
    badge: "Save 26%",
    category: "duo",
    categoryLabel: "Duo & Celebrations",
    description: "Celebrate the maternal bond with side-by-side treatments in our luxury private suite before wedding celebrations begin.",
    servicesIncluded: [
      "2x 24K Gold Glow Revival Facials",
      "2x Traditional Ayurvedic Champi Massages",
      "2x Couture Sari & Dupatta Draping",
      "2x Signature Precision Blowouts"
    ],
    serviceDetails: [
      {
        name: "2x 24K Gold Glow Revival Facials",
        description: "Dual customized radiance facials for both mother and daughter.",
        originalPrice: 5000,
        duration: "60 mins"
      },
      {
        name: "2x Ayurvedic Head Massages",
        description: "Warm botanical oil head and neck de-stress massages.",
        originalPrice: 1600,
        duration: "45 mins"
      },
      {
        name: "2x Couture Sari Draping",
        description: "Expert ceremonial draping for both sarees.",
        originalPrice: 2400,
        duration: "45 mins"
      },
      {
        name: "2x Signature Blowout Styling",
        description: "Glamorous, long-holding blowout and thermal setting.",
        originalPrice: 3000,
        duration: "60 mins"
      }
    ],
    originalPrice: 12000,
    bundledPrice: 8899,
    discountPercentage: 26,
    savingsAmount: 3101,
    estimatedDuration: "3 Hours Together",
    image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200",
    recommendedFor: "Bride and Mother (or Bride & Sister/Best Friend) desiring quality bonding and dual beauty preparation.",
    perks: [
      "Exclusive two-person VIP suite reservation",
      "Complimentary afternoon high-tea tier with fresh macarons and fruits",
      "Commemorative framed polaroid of the day"
    ],
    steps: [
      {
        phase: "Step 1",
        title: "Side-by-Side Facials & Scalp Therapy",
        duration: "75 Mins",
        detail: "Unwind together with soothing music, warm oil champi, and 24K glow facials."
      },
      {
        phase: "Step 2",
        title: "High-Tea & Macaron Break",
        duration: "20 Mins",
        detail: "Sip artisanal teas and enjoy gourmet refreshments in private comfort."
      },
      {
        phase: "Step 3",
        title: "Twin Blowouts & Sari Elegance",
        duration: "85 Mins",
        detail: "Synchronized hair styling and precision sari pinning for the big evening."
      }
    ]
  }
];

export function calculateCustomBundleDiscount(serviceCount: number): number {
  if (serviceCount >= 4) return 20;
  if (serviceCount === 3) return 15;
  if (serviceCount === 2) return 10;
  return 0;
}
