import { describe, expect, it } from 'vitest';
import { resolvePriceLabel, resolvePriceLabelOptional } from './pricing';

describe('resolvePriceLabel', () => {
  it('prefers formatted pricing for selected currency', () => {
    const label = resolvePriceLabel({
      currency: 'USD',
      pricings: [
        {
          usd: { formatted: '$24.50', amount_pence: 2450 },
          gbp: { formatted: '£19.00', amount_pence: 1900 },
        },
      ],
      fallbackAmountPence: 1900,
    });
    expect(label).toBe('$24.50');
  });

  it('uses pricing amount_pence when formatted is missing', () => {
    const label = resolvePriceLabel({
      currency: 'GBP',
      pricings: [{ gbp: { amount_pence: 1299 } }],
    });
    expect(label).toBe('£12.99');
  });

  it('falls back to legacy values when pricing object is absent', () => {
    const label = resolvePriceLabel({
      currency: 'GBP',
      fallbackAmountCandidates: [9.99],
      fallbackLabelCandidates: ['£9.99 legacy'],
    });
    expect(label).toBe('£9.99');
  });

  it('returns optional undefined when no values are present', () => {
    const label = resolvePriceLabelOptional({ currency: 'GBP' });
    expect(label).toBeUndefined();
  });
});

