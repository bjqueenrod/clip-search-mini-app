import { PricingEnvelope } from '../../utils/pricing';

export type KeyholdingTier = {
  id: string;
  slug?: string;
  name: string;
  desc?: string;
  duration?: string;
  idealFor?: string;
  includes: string[];
  price?: string | number;
  pricePence?: number;
  priceLabel?: string | number;
  pricing?: PricingEnvelope;
  pricePerWeek?: string | number;
  pricePerWeekPence?: number;
  pricePerWeekValue?: number;
  pricePerWeekPricing?: PricingEnvelope;
  priceValue?: number;
  paymentProductPricePence?: number;
  paymentProductPricing?: PricingEnvelope;
  paymentProductId?: number;
  badge?: string;
  durationWeeksOptions: number[];
  maxQuantity?: number;
};

export type KeyholdingOption = {
  id: string;
  slug: string;
  label: string;
  tooltip?: string;
  availabilityType?: string;
  availabilityTiers: string[];
  requiresLockboxPhoto: boolean;
  priceLabel?: string;
  priceCents?: number;
  pricePence?: number;
  pricing?: PricingEnvelope;
  paymentProductId?: number;
  order?: number;
};

export type KeyholdingTierListResponse = {
  items: KeyholdingTier[];
  total: number;
};

export type KeyholdingOptionListResponse = {
  items: KeyholdingOption[];
  total: number;
};
