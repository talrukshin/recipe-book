import "./SearchBar.css";

export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <svg className="search-bar__icon" viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        className="search-bar__input"
        placeholder="חיפוש לפי שם מתכון או מרכיב…"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="חיפוש מתכונים"
      />
    </div>
  );
}
