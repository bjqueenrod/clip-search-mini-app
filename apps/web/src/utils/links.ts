export function toClipPath(clipId: string, search: string): string {
  return `/clips/${encodeURIComponent(clipId)}${search}`;
}
