import { ClipItem } from '../features/clips/types';
import { ClipCard } from './ClipCard';

export function ClipGrid({ items }: { items: ClipItem[] }) {
  return (
    <div className="clip-grid">
      {items.map((clip) => (
        <ClipCard key={clip.id} clip={clip} />
      ))}
    </div>
  );
}
