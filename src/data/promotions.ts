import { SeasonalPromotion } from "@/types/promotion";

export const SEASONAL_PROMOTIONS: SeasonalPromotion[] = [
  {
    id: "royal-bridal-couturier",
    category: "bridal",
    categoryLabel: "Bridal & Trousseau",
    seasonTag: "Wedding Season 2026",
    title: "The Royal Bridal Couturier Ritual",
    subtitle: "Complete pre-bridal radiance with 24K gold cellular therapy, couture hair artistry, and champagne high tea.",
    description: "An opulent multi-stage beauty pilgrimage curated specifically for brides, sisters, and bridal entourages. Features deep micro-cellular gold infusion, bespoke bridal hair sculpting, customized Sabyasachi-compatible saree draping consultation, and stress-melting aromatic hot oil therapy.",
    originalPrice: 24500,
    discountedPrice: 18500,
    discountPercentage: 25,
    promoCode: "ROYALBRIDE25",
    validUntil: "2026-11-15T23:59:59",
    durationMinutes: 240,
    durationText: "4 Hours · Full Immersion",
    slotsRemaining: 4,
    exclusivePerk: "Complimentary Hair & Makeup Trial Session + Luxury Champagne High Tea for 2",
    highlights: [
      "24K Gold Cellular Oxygen Facial & Neck Detox",
      "Kérastase Caviar Scalp & Hair Restoration Spa",
      "Bespoke Bridal Updo or Textured Hollywood Waves",
      "Rose Quartz Paraffin Hand & Foot Ritual",
      "Signature Aurelia Bridal Glow Gift Hamper"
    ],
    steps: [
      {
        title: "Dermatological & Scalp Analysis",
        duration: "30 Mins",
        description: "High-definition dermal scan and hair strand porosity test to tailor custom elixirs."
      },
      {
        title: "24K Nano-Gold Rejuvenation",
        duration: "60 Mins",
        description: "Pure gold leaf micro-infusion paired with cold-hammer lymphatic drainage."
      },
      {
        title: "Kérastase Chronologiste Caviar Ritual",
        duration: "60 Mins",
        description: "Caviar pearls mixed with abyssine concentrate to resurrect luster and root strength."
      },
      {
        title: "Bridal Couture Styling & Draping Prep",
        duration: "60 Mins",
        description: "Precision blowout, crown volume setting, and jewelry placement consultation."
      },
      {
        title: "Rose Petal Hand & Foot Hydrotherapy",
        duration: "30 Mins",
        description: "Exfoliating Himalayan salt buff followed by warm paraffin wrap."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Royal Indian Bride in golden attire and exquisite jewelry",
    badgeText: "Only 4 Bridal Slots Left This Month",
    targetAudience: "Brides & Wedding Entourages",
    terms: [
      "Requires minimum 48 hours advance reservation",
      "Trial session must be scheduled at least 7 days prior to wedding date",
      "Valid at Aurelia Luxe Flagship & Partner Salons",
      "Non-refundable but freely transferable"
    ]
  },
  {
    id: "festive-shimmer-glow",
    category: "festive",
    categoryLabel: "Festive Splendor",
    seasonTag: "Diwali & Festive Gala",
    title: "Diwali & Festive Shimmer Glow",
    subtitle: "Illuminate your presence for grand evenings with Diamond microdermabrasion and mirror-shine glass hair.",
    description: "Designed for high-wattage festive soirées, card parties, and family banquets. Combines non-invasive diamond microdermabrasion with an ultra-glossy Korean glass hair laminate that withstands Mumbai humidity.",
    originalPrice: 9500,
    discountedPrice: 6800,
    discountPercentage: 28,
    promoCode: "FESTIVEGLOW",
    validUntil: "2026-11-20T23:59:59",
    durationMinutes: 150,
    durationText: "2.5 Hours · Instant Radiance",
    slotsRemaining: 7,
    exclusivePerk: "Complimentary Saffron & 24K Gold Body Shimmer Mist + Hand Crafted Diya Set",
    highlights: [
      "Diamond Tip Microdermabrasion & AHA Peel",
      "Korean Liquid Glass Hair Glossing Infusion",
      "Ayurvedic Champi Head & Neck De-stress Massage",
      "Express Shimmer Eye & Brow Sculpting",
      "Luxe Silk Heat Shield Finish"
    ],
    steps: [
      {
        title: "Purifying Ultrasonic Skin Cleanse",
        duration: "25 Mins",
        description: "Deep pore evacuation with ultrasonic blade and botanical steam."
      },
      {
        title: "Diamond Microdermabrasion",
        duration: "35 Mins",
        description: "Gently removes dead epidermal cells to unlock instant light-reflective glow."
      },
      {
        title: "Liquid Glass Hair Glaze",
        duration: "45 Mins",
        description: "Acidic color gloss sealant that locks cuticle layers for brilliant mirror shine."
      },
      {
        title: "Traditional Champi & Pressure Points",
        duration: "30 Mins",
        description: "Warm brass vessel oil pour targeting marma points for deep festive decompression."
      },
      {
        title: "Festive Glow Setting",
        duration: "15 Mins",
        description: "Finishing mist with light-diffusing pearl minerals and UV protection."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Festive beauty makeover with luminous skin and cascading hair",
    badgeText: "High Demand · 7 Slots Remaining",
    targetAudience: "Festive Party & Gala Guests",
    terms: [
      "Applicable for appointment dates through end of festive season",
      "Cannot be combined with student or senior discounts",
      "Includes complimentary beverage & festive sweet tasting"
    ]
  },
  {
    id: "monsoon-keratin-shield",
    category: "hair-skin",
    categoryLabel: "Hair Restoration",
    seasonTag: "Climate Defense 2026",
    title: "Monsoon Humidity & Keratin Shield",
    subtitle: "Complete anti-frizz armor with organic nano-keratin infusion and botanical scalp detox.",
    description: "Tame uncontrollable flyaways and protect damaged strands against coastal humidity. Formulated with 0% formaldehyde botanical amino acids, deep thermal sealing, and ocean mineral scalp cleansing.",
    originalPrice: 11000,
    discountedPrice: 8200,
    discountPercentage: 25,
    promoCode: "MONSOON25",
    validUntil: "2026-10-31T23:59:59",
    durationMinutes: 180,
    durationText: "3 Hours · 4-Month Protection",
    slotsRemaining: 6,
    exclusivePerk: "Full-Size Sulfate-Free Post-Treatment Shampoo & Thermal Silk Oil (Value ₹3,200)",
    highlights: [
      "Brazilian Nano-Keratin Botanical Protein Infusion",
      "Therapeutic Tea Tree & Sea Salt Scalp Scrub",
      "Split-End Cauterization with Infrared Iron",
      "Split-Level Cut & Layer Balancing",
      "4 Months Guaranteed Zero-Frizz Resilience"
    ],
    steps: [
      {
        title: "Clarifying Scalp Clarification",
        duration: "30 Mins",
        description: "Removes sebum buildup, hard water deposits, and environmental pollutants."
      },
      {
        title: "Micro-Molecular Keratin Bond Application",
        duration: "60 Mins",
        description: "Deep penetration of amino acids to reinforce fractured hair cortex."
      },
      {
        title: "Infrared Heat Cauterization",
        duration: "50 Mins",
        description: "Low-heat multi-pass sealing that seals the cuticle without sulfur odors."
      },
      {
        title: "Restorative Trim & Shape Refresh",
        duration: "40 Mins",
        description: "Dry cut technique to remove frayed ends while preserving length and fullness."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Mirror glossy smooth straight and wavy hair treatment",
    badgeText: "Includes ₹3,200 Free Aftercare Set",
    targetAudience: "Frizz-prone, colored, or treated hair",
    terms: [
      "Wash hair only after 48 hours of treatment",
      "Complimentary touch-up blowout within 7 days",
      "Valid with Master Hair Specialists only"
    ]
  },
  {
    id: "maharajah-groom-ritual",
    category: "groom",
    categoryLabel: "Men & Grooming",
    seasonTag: "Regal Groom 2026",
    title: "The Maharajah Groom's Regal Package",
    subtitle: "Precision charcoal beard sculpting, hot lather straight-razor shave, and energizing scalp restoration.",
    description: "The definitive executive grooming ritual for modern grooms, best men, and high-profile gentlemen. Combines classic vintage barbering techniques with modern derma-aesthetics, single-barrel whiskey service, and deep tension release.",
    originalPrice: 7500,
    discountedPrice: 5500,
    discountPercentage: 27,
    promoCode: "REGALGROOM",
    validUntil: "2026-11-30T23:59:59",
    durationMinutes: 120,
    durationText: "2 Hours · Executive Pampering",
    slotsRemaining: 5,
    exclusivePerk: "Artisanal Cedarwood & Oud Beard Oil Flacon + Executive Shoe Polish Service",
    highlights: [
      "Traditional 3-Stage Hot Towel & Straight-Razor Shave",
      "Activated Charcoal Beard Contouring & Detailing",
      "Cold-Pressed Moroccan Argan Scalp Invigoration",
      "Executive Hand & Nail Grooming",
      "Complimentary Single-Barrel Scotch or Espresso"
    ],
    steps: [
      {
        title: "Hot Towel Steaming & Botanical Oil Prep",
        duration: "20 Mins",
        description: "Eucalyptus essential steam to soften coarse stubble and open pores."
      },
      {
        title: "Japanese Steel Straight-Razor Shave",
        duration: "30 Mins",
        description: "Dual-pass artisan shave with badger brush and sandalwood lather."
      },
      {
        title: "Beard Architecture & Razor Edge Fading",
        duration: "25 Mins",
        description: "Symmetrical caliper shaping for a clean, chiseled jawline."
      },
      {
        title: "Argan Oil High-Pressure Scalp Therapy",
        duration: "30 Mins",
        description: "Deep tissue shoulder and cervical neck mobilization."
      },
      {
        title: "Executive Matte Buff & Cologne Splash",
        duration: "15 Mins",
        description: "Natural buff manicure and custom fragrance spritz."
      }
    ],
    imageUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200",
    imageAlt: "Polished modern gentleman with sharp beard styling and suit",
    badgeText: "Gentlemen's VIP Favorite",
    targetAudience: "Grooms, Executives, & Modern Gentlemen",
    terms: [
      "Valid Monday through Sunday",
      "Complimentary groom consultation before wedding day",
      "Available across all men's grooming lounges"
    ]
  },
  {
    id: "eid-celebration-duo",
    category: "wellness",
    categoryLabel: "Celebration Duo",
    seasonTag: "Festive Duo Experience",
    title: "Festive Radiance Sanctuary for Two",
    subtitle: "Share the luxury with a synchronized dual session featuring Vitamin C infusions and private VIP suite access.",
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
