import { getTierGuideLabels } from '../features/tiers/presentation';
import { TierItem } from '../features/tiers/types';
import { CurrencyCode } from '../utils/format';
import { TierCard } from './TierCard';

export function TierGrid({ items, currency = 'GBP' }: { items: TierItem[]; currency?: CurrencyCode }) {
  const guideLabels = getTierGuideLabels(items);

  return (
    <div className="tier-grid">
      {items.map((tier) => (
        <TierCard key={tier.id} tier={tier} guideLabel={guideLabels[tier.id]} currency={currency} />
      ))}
    </div>
  );
}
