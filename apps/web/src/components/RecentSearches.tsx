export function RecentSearches({ items, onPick }: { items: string[]; onPick: (value: string) => void }) {
  if (!items.length) return null;
  return (
    <div className="recent-searches">
      {items.map((item) => (
        <button key={item} type="button" onClick={() => onPick(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}
