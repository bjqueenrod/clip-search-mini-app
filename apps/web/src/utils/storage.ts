const RECENT_KEY = 'clip-mini-app-recent-searches';

export function readRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]');
  } catch {
    return [];
  }
}

export function pushRecentSearch(query: string): string[] {
  const normalized = query.trim();
  if (!normalized) return readRecentSearches();
  const next = [normalized, ...readRecentSearches().filter((item) => item !== normalized)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
