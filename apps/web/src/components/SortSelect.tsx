export function SortSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="sort-select">
      <span>Sort</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="newest">Newest</option>
        <option value="oldest">Oldest</option>
        <option value="price_asc">Price: low to high</option>
        <option value="price_desc">Price: high to low</option>
        <option value="title_asc">Title A-Z</option>
        <option value="title_desc">Title Z-A</option>
      </select>
    </label>
  );
}
