export interface BundleServiceItem {
  id: string;
  name: string;
  category: 'hair' | 'bridal' | 'skin' | 'wellness' | 'grooming';
  price: number;
  durationMinutes: number;
  description: string;
  tag?: string;
}

export interface CuratedBundle {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  badge?: string;
  category: 'bridal' | 'festive' | 'groom' | 'hair-revival' | 'glow' | 'duo';
  categoryLabel: string;
  description: string;
  servicesIncluded: string[];
  serviceDetails: {
    name: string;
    description: string;
    originalPrice: number;
    duration: string;
  }[];
  originalPrice: number;
  bundledPrice: number;
  discountPercentage: number;
  savingsAmount: number;
  estimatedDuration: string;
  image: string;
  perks: string[];
  recommendedFor: string;
  steps: {
    phase: string;
    title: string;
    duration: string;
    detail: string;
  }[];
}

export interface CustomBundleSelection {
  selectedServiceIds: string[];
  totalOriginalPrice: number;
  discountPercentage: number;
  savingsAmount: number;
  finalBundledPrice: number;
  estimatedTotalMinutes: number;
}
