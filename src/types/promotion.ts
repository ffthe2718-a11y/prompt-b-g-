export interface PromotionStep {
  title: string;
  duration: string;
  description: string;
}

export interface SeasonalPromotion {
  id: string;
  category: 'all' | 'bridal' | 'festive' | 'hair-skin' | 'groom' | 'wellness';
  categoryLabel: string;
  seasonTag: string;
  title: string;
  subtitle: string;
  description: string;
  originalPrice: number;
  discountedPrice: number;
  discountPercentage: number;
  promoCode: string;
  validUntil: string; // Target ISO date or relative end date
  durationMinutes: number;
  durationText: string;
  slotsRemaining: number;
  exclusivePerk: string;
  highlights: string[];
  steps: PromotionStep[];
  imageUrl: string;
  imageAlt: string;
  badgeText: string;
  targetAudience: string;
  terms: string[];
}
