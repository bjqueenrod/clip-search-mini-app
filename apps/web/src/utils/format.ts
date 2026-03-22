export function formatPrice(value?: number): string {
  if (typeof value !== 'number') return 'Coming soon';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
}

export function formatDuration(durationLabel?: string, durationSeconds?: number): string {
  if (durationLabel) return durationLabel;
  if (!durationSeconds) return 'Duration unavailable';
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
