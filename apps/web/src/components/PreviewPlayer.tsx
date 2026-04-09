import { useMemo, useState } from 'react';

export function PreviewPlayer({
  embedUrl,
  thumbnailUrl,
  previewImageUrl,
  title,
}: {
  embedUrl?: string;
  thumbnailUrl?: string;
  previewImageUrl?: string;
  title: string;
}) {
  const [active, setActive] = useState(false);
  const posterUrl = useMemo(() => thumbnailUrl || undefined, [thumbnailUrl]);
  const animatedPosterUrl = useMemo(
    () => (previewImageUrl && previewImageUrl !== thumbnailUrl ? previewImageUrl : undefined),
    [previewImageUrl, thumbnailUrl],
  );

  if (embedUrl) {
    const isEmbedUrl = embedUrl.includes('/embed');
    if (!isEmbedUrl) {
      return (
        <div className="preview-player">
          <video
            src={embedUrl}
            poster={posterUrl}
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="auto"
            controlsList="nodownload noremoteplayback"
            disablePictureInPicture
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#120f15' }}
          />
        </div>
      );
    }

    return (
      <div className="preview-player">
        <iframe
          src={`${embedUrl}${embedUrl.includes('?') ? '&' : '?'}mute=1&autoplay=1&playsinline=true&controls=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen; accelerometer; gyroscope"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }

  return (
    <div
      className="preview-player preview-player--fallback"
      style={{ backgroundImage: posterUrl ? `url(${posterUrl})` : undefined }}
      onPointerEnter={() => animatedPosterUrl && setActive(true)}
      onPointerLeave={() => setActive(false)}
      onFocus={() => animatedPosterUrl && setActive(true)}
      onBlur={() => setActive(false)}
    >
      <span>{animatedPosterUrl && active ? 'Loading preview...' : 'No public preview available yet.'}</span>
    </div>
  );
}
