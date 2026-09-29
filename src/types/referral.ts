export interface ReferralRecord {
  id: string;
  referrerId: string;
  referralCode: string;
  referredUserId?: string;
  referredUserName: string;
  referredUserEmail?: string;
  appointmentId?: string;
  service: string;
  amount?: number;
  pointsEarned: number;
  status: "pending" | "completed" | "rewarded";
  createdAt: any;
}

export interface ReferralStats {
  totalInvitesSent: number;
  successfulBookings: number;
  pendingBookings: number;
  totalPointsEarned: number;
  availablePoints: number;
  conversionRate: number;
}

export interface RewardPerk {
  id: string;
  title: string;
  pointsCost: number;
  valueText: string;
  category: "service" | "discount" | "vip_perk";
  description: string;
  iconName: string;
  code: string;
}
