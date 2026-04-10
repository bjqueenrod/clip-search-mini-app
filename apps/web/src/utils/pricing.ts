import { CurrencyCode, formatPrice } from './format';

export type PricingMoney = {
  amount_pence?: number | null;
  amountPence?: number | null;
  formatted?: string | null;
};

export type PricingFx = {
  rate?: number | null;
  fetched_at?: string | null;
  fetchedAt?: string | null;
};

export type PricingEnvelope = {
  gbp?: PricingMoney | null;
  usd?: PricingMoney | null;
  fx?: PricingFx | null;
};

type ResolvePriceLabelOptions = {
  currency?: CurrencyCode;
  pricings?: Array<PricingEnvelope | null | undefined>;
  defaultLabel?: string;
};

function pricingKey(currency: CurrencyCode): 'gbp' | 'usd' {
  return currency === 'USD' ? 'usd' : 'gbp';
}

function asText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value !== 'number') return undefined;
  if (!Number.isFinite(value)) return undefined;
  return value;
}

function asPence(value: unknown): number | undefined {
  const amount = asNumber(value);
  if (amount == null) return undefined;
  return Math.round(amount);
}

function pricingFormatted(
  pricing: PricingEnvelope | null | undefined,
  currency: CurrencyCode,
): string | undefined {
  const bucket = pricing?.[pricingKey(currency)];
  if (!bucket || typeof bucket !== 'object') return undefined;
  return asText(bucket.formatted);
}

function pricingAmountPence(
  pricing: PricingEnvelope | null | undefined,
  currency: CurrencyCode,
): number | undefined {
  const bucket = pricing?.[pricingKey(currency)];
  if (!bucket || typeof bucket !== 'object') return undefined;
  return asPence(bucket.amount_pence ?? bucket.amountPence);
}

function firstFormatted(
  pricings: Array<PricingEnvelope | null | undefined> | undefined,
  currency: CurrencyCode,
): string | undefined {
  for (const pricing of pricings || []) {
    const value = pricingFormatted(pricing, currency);
    if (value) return value;
  }
  return undefined;
}

function firstPricingPence(
  pricings: Array<PricingEnvelope | null | undefined> | undefined,
  currency: CurrencyCode,
): number | undefined {
  for (const pricing of pricings || []) {
    const value = pricingAmountPence(pricing, currency);
    if (value != null) return value;
  }
  return undefined;
}

export function resolvePriceLabel(options: ResolvePriceLabelOptions): string {
  const currency = options.currency || 'GBP';

  const formatted = firstFormatted(options.pricings, currency);
  if (formatted) return formatted;

  const pricingPence = firstPricingPence(options.pricings, currency);
  if (pricingPence != null) return formatPrice(pricingPence / 100, currency);

  return options.defaultLabel !== undefined ? options.defaultLabel : 'Price on request';
}

export function resolvePriceLabelOptional(options: ResolvePriceLabelOptions): string | undefined {
  const label = resolvePriceLabel({ ...options, defaultLabel: '' });
  return label || undefined;
}

type ResolvePriceAmountPenceOptions = {
  currency?: CurrencyCode;
  pricings?: Array<PricingEnvelope | null | undefined>;
};

export function resolvePriceAmountPenceOptional(options: ResolvePriceAmountPenceOptions): number | undefined {
  const currency = options.currency || 'GBP';
  return firstPricingPence(options.pricings, currency);
}
