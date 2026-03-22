import { ChangeEvent } from 'react';

export function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <label className="search-bar">
      <span className="search-bar__label">Search</span>
      <input
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)}
        placeholder="Search title, tags, or category"
      />
    </label>
  );
}
