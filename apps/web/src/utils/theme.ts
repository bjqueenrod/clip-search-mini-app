export function safeBackground(url?: string): string {
  return url ? `url(${url})` : 'linear-gradient(135deg, rgba(176,106,214,0.24), rgba(44,36,52,0.88))';
}
