import { TierItem } from './types';

export function getTierDurationLabel(tier?: TierItem): string {
  if (!tier?.durationDays) return 'Custom duration';
  return tier.durationDays === 1 ? '1 day' : `${tier.durationDays} days`;
}

export function getTierTasksLabel(tier?: TierItem): string {
  if (!tier) return 'Custom pace';
  if (tier.isUnlimitedTasks) return 'Unlimited tasks';
  if (!tier.tasksPerDay) return 'Custom pace';
  return tier.tasksPerDay === 1 ? '1 task per day' : `${tier.tasksPerDay} tasks per day`;
}

export function getTierSummary(tier: TierItem): string {
  const existing = tier.shortDescription?.trim() || tier.description?.trim();
  if (existing) return existing;

  if (tier.isUnlimitedTasks && tier.durationDays) {
    return `Unlimited personalised tasks for ${getTierDurationLabel(tier).toLowerCase()}.`;
  }

  if (tier.durationDays && tier.tasksPerDay) {
    return `Personalised obedience with ${getTierTasksLabel(tier).toLowerCase()} for ${getTierDurationLabel(tier).toLowerCase()}.`;
  }

  return 'Personalised obedience tasks built around your preferences.';
}

function getTierIntensityScore(tier: TierItem): number {
  const durationScore = tier.durationDays ?? 0;
  const paceScore = tier.isUnlimitedTasks ? 40 : (tier.tasksPerDay ?? 1) * 10;
  const priceScore = tier.price ?? 0;
  return durationScore + paceScore + priceScore / 10;
}

export function getTierGuideLabels(items: TierItem[]): Record<string, string> {
  if (items.length === 0) {
    return {};
  }

  const byPriceAsc = [...items].sort(
    (left, right) =>
      (left.price ?? Number.POSITIVE_INFINITY) - (right.price ?? Number.POSITIVE_INFINITY) ||
      (left.durationDays ?? Number.POSITIVE_INFINITY) - (right.durationDays ?? Number.POSITIVE_INFINITY) ||
      getTierIntensityScore(left) - getTierIntensityScore(right),
  );

  const byIntensityDesc = [...items].sort(
    (left, right) =>
      getTierIntensityScore(right) - getTierIntensityScore(left) ||
      (right.price ?? 0) - (left.price ?? 0),
  );

  const labels: Record<string, string> = {};
  const firstTimer = byPriceAsc[0];
  const highIntensity = byIntensityDesc[0];

  if (firstTimer) {
    labels[firstTimer.id] = 'Best for first timers';
  }

  if (highIntensity && highIntensity.id !== firstTimer?.id) {
    labels[highIntensity.id] = 'High Intensity';
  }

  const remaining = items.filter((tier) => !labels[tier.id]);
  if (remaining.length > 0) {
    const byMidpoint = [...remaining].sort(
      (left, right) =>
        (left.price ?? 0) - (right.price ?? 0) || getTierIntensityScore(left) - getTierIntensityScore(right),
    );
    const mostPopular = byMidpoint[Math.round((byMidpoint.length - 1) / 2)];
    if (mostPopular) {
      labels[mostPopular.id] = 'Most Popular';
    }
  }

  return labels;
}

export function getBotRootUrl(items: TierItem[]): string | undefined {
  const firstUrl = items.find((tier) => tier.botBuyUrl)?.botBuyUrl;
  if (!firstUrl) return undefined;

  try {
    const parsed = new URL(firstUrl);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return firstUrl.split('?')[0];
  }
}
