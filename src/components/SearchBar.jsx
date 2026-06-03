import "./SearchBar.css";

export function SearchBar({ value, onChange, resultCount }) {
  return (
    <div className="search-bar">
      <label className="search-bar__label" htmlFor="group-search">
        <span className="sr-only">Buscar grupos</span>
        <svg
          className="search-bar__icon"
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-3-3" strokeLinecap="round" />
        </svg>
        <input
          id="group-search"
          type="search"
          className="search-bar__input"
          placeholder="Buscar por nome ou descrição..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      </label>
      <p className="search-bar__meta" aria-live="polite">
        {resultCount === 0
          ? "Nenhum grupo encontrado"
          : `${resultCount} grupo${resultCount !== 1 ? "s" : ""}`}
      </p>
    </div>
  );
}
