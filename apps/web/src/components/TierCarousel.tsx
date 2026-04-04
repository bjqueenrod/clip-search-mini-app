import { Link } from 'react-router-dom';
import { getTierArtwork, getTierArtworkVariant } from '../features/tiers/artwork';
import {
  getTierDurationLabel,
  getTierGuideLabels,
  getTierSummary,
  getTierTasksLabel,
} from '../features/tiers/presentation';
import { TierItem } from '../features/tiers/types';
import { formatPrice } from '../utils/format';
import { toTierPath } from '../utils/links';

function priceLabel(tier: TierItem): string {
  return tier.priceLabel || formatPrice(tier.price);
}

function descriptorLabel(tier: TierItem, badgeLabel?: string): string {
  if (tier.shortDescription?.trim()) {
    return tier.shortDescription.trim();
  }

  switch (badgeLabel) {
    case 'Best for first timers':
      return 'A softer place to start with clear structure and guided delivery.';
    case 'Most Popular':
      return 'A balanced package when you want a fuller experience without overwhelm.';
    case 'High Intensity':
      return 'A deeper, more immersive option for buyers who want a heavier pace.';
    default:
      if (tier.isUnlimitedTasks) {
        return 'An open-ended guided flow built for a more immersive obedience session.';
      }
      if ((tier.durationDays ?? 0) >= 5) {
        return 'Extended guidance with more room to build momentum and structure.';
      }
      return 'A premium custom obedience package shaped around your submitted preferences.';
  }
}

export function TierCarousel({
  items,
  title,
  loading = false,
}: {
  items: TierItem[];
  title?: string;
  loading?: boolean;
}) {
  if (!items.length && !loading) {
    return null;
  }

  const guideLabels = getTierGuideLabels(items);

  return (
    <section className="top-sellers top-sellers--tiers">
      {title ? (
        <div className="top-sellers__header">
          <p className="hero__eyebrow">{title}</p>
        </div>
      ) : null}
      <div className="top-sellers__track">
        {loading
          ? Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="top-sellers__card top-sellers__card--skeleton" aria-hidden="true">
                <div className="top-sellers__media top-sellers__media--skeleton" />
                <div className="top-sellers__body top-sellers__body--tier">
                  <div className="top-sellers__eyebrow">
                    <span className="top-sellers__line top-sellers__line--small" />
                    <span className="top-sellers__line top-sellers__line--small" />
                  </div>
                  <span className="top-sellers__line top-sellers__line--title" />
                  <span className="top-sellers__line top-sellers__line--body top-sellers__line--short" />
                  <div className="top-sellers__meta-grid">
                    <span className="top-sellers__line top-sellers__line--body" />
                    <span className="top-sellers__line top-sellers__line--body" />
                  </div>
                  <span className="top-sellers__line top-sellers__line--price" />
                  <span className="top-sellers__line top-sellers__line--body" />
                  <span className="top-sellers__line top-sellers__line--body top-sellers__line--short" />
                </div>
              </div>
            ))
          : items.map((tier, index) => {
              const badgeLabel = guideLabels[tier.id] || tier.badge;
              const artworkVariant = getTierArtworkVariant(index);
              const descriptor = descriptorLabel(tier, badgeLabel);
              const valueSummary = getTierSummary(tier);

              return (
                <Link
                  key={tier.id}
                  className={[
                    'top-sellers__card',
                    'top-sellers__card--tier',
                    artworkVariant === 'light' ? 'top-sellers__card--light' : 'top-sellers__card--base',
                    badgeLabel === 'Most Popular' ? 'top-sellers__card--featured' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  to={toTierPath(tier.id)}
                >
                  <div className="top-sellers__media top-sellers__media--tier">
                    <img src={getTierArtwork(tier, badgeLabel, artworkVariant)} alt={`${tier.name} package artwork`} loading="lazy" />
                  </div>
                  <div className="top-sellers__body top-sellers__body--tier">
                    <div className="top-sellers__eyebrow">
                      {badgeLabel ? (
                        <span className="top-sellers__tier-badge top-sellers__tier-badge--inline">{badgeLabel}</span>
                      ) : (
                        <span />
                      )}
                    </div>
                    <h3>{tier.name}</h3>
                    <p className="top-sellers__descriptor">{descriptor}</p>
                    <div className="top-sellers__meta-grid">
                      <div className="top-sellers__meta-item">
                        <span className="top-sellers__meta-label">Duration</span>
                        <strong>{getTierDurationLabel(tier)}</strong>
                      </div>
                      <div className="top-sellers__meta-item">
                        <span className="top-sellers__meta-label">Pace</span>
                        <strong>{getTierTasksLabel(tier)}</strong>
                      </div>
                    </div>
                    <div className="top-sellers__price-block">
                      <span className="top-sellers__meta-label">Price</span>
                      <strong>{priceLabel(tier)}</strong>
                    </div>
                    <p className="top-sellers__value-copy">{valueSummary}</p>
                    <span className="top-sellers__cta">Open Package</span>
                  </div>
                </Link>
              );
            })}
      </div>
    </section>
  );
}
