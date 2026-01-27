type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function SearchBar({ value, onChange, onSubmit }: SearchBarProps) {
  return (
    <div className="search">
      <input
        className="search__input"
        placeholder="Search files or folders"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
      />
      <button type="button" className="search__button" onClick={onSubmit}>
        Search
      </button>
    </div>
  );
}
