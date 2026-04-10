import { PricingEnvelope } from '../../utils/pricing';

export type TierItem = {
  id: string;
  name: string;
  shortDescription?: string;
  description?: string;
  productId?: string;
  durationDays?: number;
  tasksPerDay?: number;
  price?: number;
  pricePence?: number;
  priceLabel?: string;
  pricing?: PricingEnvelope;
  isUnlimitedTasks: boolean;
  badge?: string;
  botBuyUrl?: string;
};

export type TierListResponse = {
  items: TierItem[];
  total: number;
};
