import { Link, useLocation } from 'react-router-dom';
import { ClipItem } from '../features/clips/types';
import { formatDuration, formatPrice } from '../utils/format';
import { safeBackground } from '../utils/theme';

export function ClipCard({ clip }: { clip: ClipItem }) {
  const location = useLocation();
  return (
    <Link className="clip-card" to={`/clips/${clip.id}${location.search}`}>
      <div className="clip-card__media" style={{ backgroundImage: safeBackground(clip.thumbnailUrl) }} />
      <div className="clip-card__body">
        <div className="clip-card__eyebrow">
          <span>{clip.category || 'Library'}</span>
          <span>{formatDuration(clip.durationLabel, clip.durationSeconds)}</span>
        </div>
        <h3>{clip.title}</h3>
        <p>{clip.shortDescription || clip.description || 'Preview this clip in Telegram.'}</p>
        <div className="clip-card__footer">
          <span>{formatPrice(clip.streamPrice ?? clip.price)}</span>
          <span>{clip.tags.slice(0, 2).map((tag) => `#${tag}`).join(' ')}</span>
        </div>
      </div>
    </Link>
  );
}
