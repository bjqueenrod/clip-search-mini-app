export function safeBackground(url?: string): string {
  return url ? `url(${url})` : 'linear-gradient(135deg, rgba(216,182,106,0.25), rgba(90,64,35,0.65))';
}
