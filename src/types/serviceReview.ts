export interface ServiceReviewItem {
  id: string;
  shopId?: string;
  service: string; // Service name (e.g., "Expert Haircut & Blowdry")
  serviceId?: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  tags?: string[];
  recommend?: boolean;
  verifiedBooking?: boolean;
  helpfulCount?: number;
  createdAt: any;
}

export interface ServiceRatingAggregate {
  serviceName: string;
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}
