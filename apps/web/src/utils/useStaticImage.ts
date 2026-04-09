import { useEffect, useMemo, useState } from 'react';

type CacheEntry = { still: string | null; status: 'idle' | 'done' | 'error' };

const cache = new Map<string, CacheEntry>();

export function useStaticImage(src?: string) {
  const [still, setStill] = useState<string | null>(null);

  const key = useMemo(() => src ?? '', [src]);

  useEffect(() => {
    if (!src) {
      setStill(null);
      return;
    }

    const cached = cache.get(key);
    if (cached?.status === 'done') {
      setStill(cached.still);
      return;
    }
    if (cached?.status === 'error') {
      setStill(null);
      return;
    }

    cache.set(key, { still: null, status: 'idle' });

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL('image/png');
          cache.set(key, { still: dataUrl, status: 'done' });
          setStill(dataUrl);
          return;
        }
      } catch {
        cache.set(key, { still: null, status: 'error' });
      }
      setStill(null);
    };
    img.onerror = () => {
      cache.set(key, { still: null, status: 'error' });
      setStill(null);
    };
    img.src = src;

    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [key, src]);

  return still;
}
