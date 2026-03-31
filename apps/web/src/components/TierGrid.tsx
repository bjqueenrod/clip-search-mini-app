import { getTierGuideLabels } from '../features/tiers/presentation';
import { TierItem } from '../features/tiers/types';
import { TierCard } from './TierCard';

export function TierGrid({ items }: { items: TierItem[] }) {
  const guideLabels = getTierGuideLabels(items);

  return (
    <div className="tier-grid">
      {items.map((tier) => (
        <TierCard key={tier.id} tier={tier} guideLabel={guideLabels[tier.id]} />
      ))}
    </div>
  );
}
