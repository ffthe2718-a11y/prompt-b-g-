import { SeasonalPromotion } from "@/types/promotion";

export const SEASONAL_PROMOTIONS: SeasonalPromotion[] = [
  {
    id: "royal-bridal-couturier",
    category: "bridal",
    categoryLabel: "Bridal & Wedding",
    seasonTag: "Wedding Season Special",
    title: "Royal Bridal Beauty Package",
    subtitle: "Complete pre-bridal glow with 24K gold facial, bridal hair styling, and tea & snacks.",
    description: "Special beauty and makeup package for brides and family. Includes 24K gold facial, bridal hair styling, saree draping, and relaxing oil head massage.",
    originalPrice: 24500,
    discountedPrice: 18500,
    discountPercentage: 25,
    promoCode: "ROYALBRIDE25",
    validUntil: "2026-11-15T23:59:59",
    durationMinutes: 240,
    durationText: "4 Hours · Full Package",
    slotsRemaining: 4,
    exclusivePerk: "Complimentary Hair & Makeup Trial Session + Tea & Snacks for 2",
    highlights: [
      "24K Gold Facial & Neck Cleansing",
      "Keratin Scalp & Hair Repair Spa",
      "Bridal Hair Styling & Bun Setup",
      "Soft Paraffin Hand & Foot Care",
      "Free Bridal Glow Gift Box"
    ],
    steps: [
      {
        title: "Skin & Hair Check",
        duration: "30 Mins",
        description: "Checking skin type and hair porosity to choose the best natural products."
      },
      {
        title: "24K Gold Glow Facial",
        duration: "60 Mins",
        description: "Real gold leaf facial massage to clear tan and boost instant wedding glow."
      },
      {
        title: "Hair Repair & Conditioning Spa",
        duration: "60 Mins",
        description: "Deep conditioning treatment to make hair soft and shiny."
      },
      {
        title: "Bridal Hair Styling & Draping",
        duration: "60 Mins",
        description: "Professional hairstyling, dupatta setting, and jewelry placement."
      },
      {
        title: "Hand & Foot Care",
        duration: "30 Mins",
        description: "Exfoliating salt scrub and warm paraffin dip for smooth hands and feet."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Royal Indian Bride in golden attire and exquisite jewelry",
    badgeText: "Only 4 Booking Slots Left",
    targetAudience: "Brides & Wedding Guests",
    terms: [
      "Please book at least 48 hours in advance",
      "Trial session can be scheduled 7 days before wedding date",
      "Valid at all partner salons in Mumbai",
      "Booking amount is 25% Advance Payment"
    ]
  },
  {
    id: "festive-shimmer-glow",
    category: "festive",
    categoryLabel: "Festive Offer",
    seasonTag: "Diwali Special Offer",
    title: "Diwali & Festive Glow Package",
    subtitle: "Get instant party glow with Diamond facial and smooth shiny hair.",
    description: "Designed for festive parties and family functions. Combines diamond skin polishing with smooth hair glossing treatment.",
    originalPrice: 9500,
    discountedPrice: 6800,
    discountPercentage: 28,
    promoCode: "FESTIVEGLOW",
    validUntil: "2026-11-20T23:59:59",
    durationMinutes: 150,
    durationText: "2.5 Hours · Instant Party Glow",
    slotsRemaining: 7,
    exclusivePerk: "Complimentary Saffron Body Shimmer Spray + Festive Diya Gift Box",
    highlights: [
      "Diamond Skin Polishing & Cleansing",
      "Smooth Shiny Hair Gloss Treatment",
      "Ayurvedic Head & Neck Champi Massage",
      "Eye & Eyebrow Shaping",
      "Professional Hair Blowdry Finish"
    ],
    steps: [
      {
        title: "Deep Skin Cleansing",
        duration: "25 Mins",
        description: "Steam and ultrasonic cleansing to remove dirt and blackheads."
      },
      {
        title: "Diamond Skin Polishing",
        duration: "35 Mins",
        description: "Removes dead skin cells for instant radiant skin."
      },
      {
        title: "Smooth Hair Shine Treatment",
        duration: "45 Mins",
        description: "Nourishing gloss treatment for shiny, manageable hair."
      },
      {
        title: "Relaxing Champi Massage",
        duration: "30 Mins",
        description: "Warm herbal oil head and neck massage to relieve stress."
      },
      {
        title: "Final Glow & Styling",
        duration: "15 Mins",
        description: "Moisturizer application and light setting spray."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Festive beauty makeover with luminous skin and cascading hair",
    badgeText: "High Demand · 7 Slots Remaining",
    targetAudience: "Festive Party Guests",
    terms: [
      "Valid till the end of the festive season",
      "Cannot be combined with other discount codes",
      "Includes free festive drink & sweets"
    ]
  },
  {
    id: "monsoon-keratin-shield",
    category: "hair-skin",
    categoryLabel: "Hair Care",
    seasonTag: "Anti-Frizz Offer",
    title: "Monsoon Anti-Frizz Keratin Treatment",
    subtitle: "Complete anti-frizz keratin treatment with scalp detox and free home care kit.",
    description: "Control frizzy hair and protect strands against Mumbai humidity. Formulated with organic amino acids for smooth, shiny hair.",
    originalPrice: 11000,
    discountedPrice: 8200,
    discountPercentage: 25,
    promoCode: "MONSOON25",
    validUntil: "2026-10-31T23:59:59",
    durationMinutes: 180,
    durationText: "3 Hours · 4-Month Smooth Hair",
    slotsRemaining: 6,
    exclusivePerk: "Free Full-Size Sulfate-Free Shampoo & Hair Serum Kit (Worth ₹3,200)",
    highlights: [
      "Organic Keratin Smooth Treatment",
      "Scalp Scrub & Sea Salt Cleanse",
      "Infrared Heat Hair Sealing",
      "Hair Trim & Layer Adjustment",
      "4 Months Guaranteed Zero-Frizz Hair"
    ],
    steps: [
      {
        title: "Scalp Deep Cleaning",
        duration: "30 Mins",
        description: "Removes oil buildup, dirt, and pollution particles."
      },
      {
        title: "Organic Keratin Application",
        duration: "60 Mins",
        description: "Nourishing keratin proteins applied to repair weak hair strands."
      },
      {
        title: "Smooth Sealing",
        duration: "50 Mins",
        description: "Safe low-heat iron passes to lock keratin into hair cuticles."
      },
      {
        title: "Hair Trim & Finishing",
        duration: "40 Mins",
        description: "Trimming split ends to maintain healthy length and volume."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Mirror glossy smooth straight and wavy hair treatment",
    badgeText: "Free ₹3,200 Home Care Kit Included",
    targetAudience: "Frizzy, dry, or color-treated hair",
    terms: [
      "Wash hair only after 48 hours of treatment",
      "Includes free touch-up blowdry within 7 days",
      "Performed by expert hair stylists"
    ]
  },
  {
    id: "maharajah-groom-ritual",
    category: "groom",
    categoryLabel: "Men's Grooming",
    seasonTag: "Groom Special 2026",
    title: "Executive Groom Special Package",
    subtitle: "Precision beard shaping, hot towel razor shave, and relaxing head massage.",
    description: "Complete grooming package for grooms, best men, and businessmen. Combines razor shave, facial massage, beard shaping, and head massage.",
    originalPrice: 7500,
    discountedPrice: 5500,
    discountPercentage: 27,
    promoCode: "REGALGROOM",
    validUntil: "2026-11-30T23:59:59",
    durationMinutes: 120,
    durationText: "2 Hours · Complete Grooming",
    slotsRemaining: 5,
    exclusivePerk: "Free Cedarwood Beard Oil Bottle + Shoe Polish Service",
    highlights: [
      "Hot Towel & Smooth Razor Shave",
      "Charcoal Facial & Beard Shaping",
      "Argan Oil Head & Shoulder Massage",
      "Hand & Nail Grooming",
      "Complimentary Coffee or Cold Drink"
    ],
    steps: [
      {
        title: "Hot Towel Steam",
        duration: "20 Mins",
        description: "Warm steam to soften beard hair and open pores."
      },
      {
        title: "Smooth Straight-Razor Shave",
        duration: "30 Mins",
        description: "Clean shave with rich sandalwood lather."
      },
      {
        title: "Beard Shaping & Line Trim",
        duration: "25 Mins",
        description: "Precise razor edge shaping for a sharp jawline."
      },
      {
        title: "Argan Oil Head Massage",
        duration: "30 Mins",
        description: "Relaxing pressure point massage for head and neck."
      },
      {
        title: "Nail Care & Fragrance Splash",
        duration: "15 Mins",
        description: "Nail cleaning and fresh cologne spray."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Polished modern gentleman with sharp beard styling and suit",
    badgeText: "Groom's Favorite Choice",
    targetAudience: "Grooms, Executives, & Gentlemen",
    terms: [
      "Valid Monday through Sunday",
      "Free style consultation before wedding day",
      "Available across all partner salons"
    ]
  },
  {
    id: "eid-celebration-duo",
    category: "wellness",
    categoryLabel: "Combo Package",
    seasonTag: "Special Couple Offer",
    title: "Glow & Relax Package for Two",
    subtitle: "Bring a friend or partner for a dual spa session with Vitamin C facial and private room.",
    description: "An indulgent retreat for couples, best friends, or mother-daughter pairs. Enjoy a private two-chair luxury sanctuary complete with synchronized aromatherapy massage, deep cellular Vitamin C skin awakening, and custom high-gloss styling.",
    originalPrice: 16000,
    discountedPrice: 11900,
    discountPercentage: 26,
    promoCode: "CELEBRATEDUO",
    validUntil: "2026-11-25T23:59:59",
    durationMinutes: 180,
    durationText: "3 Hours · Dual Suite Reservation",
    slotsRemaining: 3,
    exclusivePerk: "VIP Private Suite Reservation + Gourmet Macarons & Artisanal Cold Brew",
    highlights: [
      "Synchronized Aromatherapy Back & Shoulder Relief for 2",
      "Radiant Stabilized 20% Vitamin C Infusion Peels",
      "Custom Signature Blowouts or Precision Beard Detailing",
      "Private Soundproof Suite with Ambient Lighting",
      "Twin Take-Home Aurelia Silk Sleep Eye Masks"
    ],
    steps: [
      {
        title: "Private Suite Welcome & Tea Ceremony",
        duration: "20 Mins",
        description: "Sip soothing hibiscus infusion while choosing signature aroma blends."
      },
      {
        title: "Synchronized Aromatherapy Massage",
        duration: "50 Mins",
        description: "Four-hand coordinated pressure technique to release metropolitan fatigue."
      },
      {
        title: "Dual Vitamin C Cellular Awakening",
        duration: "50 Mins",
        description: "Antioxidant facial bath to banish dullness and promote collagen bounce."
      },
      {
        title: "His & Hers Hair Finishing & Styling",
        duration: "45 Mins",
        description: "Simultaneous couture styling, blowout, and beard refinement."
      },
      {
        title: "Gourmet Refreshment & Photo Moment",
        duration: "15 Mins",
        description: "Celebrate together with French macarons in the VIP lounge."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Luxury spa duo relaxation sanctuary with warm candle ambiance",
    badgeText: "Only 3 Private Suites Left",
    targetAudience: "Couples, Friends, & Mother-Daughter Pairs",
    terms: [
      "Covers complete services for 2 people",
      "Private suite subject to booking availability",
      "72-hour cancellation notice required"
    ]
  }
];
