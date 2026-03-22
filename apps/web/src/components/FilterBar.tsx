export function FilterBar({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="filter-bar">
      <button className={!value ? 'is-active' : ''} onClick={() => onChange('')} type="button">
        All
      </button>
      {items.map((item) => (
        <button
          key={item}
          className={value === item ? 'is-active' : ''}
          onClick={() => onChange(item)}
          type="button"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
