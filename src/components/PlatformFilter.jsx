import { GROUP_PLATFORMS } from "../data/platforms";
import "./PlatformFilter.css";

export function PlatformFilter({ value, onChange }) {
  return (
    <div className="platform-filter" role="group" aria-label="Filtrar por plataforma">
      <button
        type="button"
        className={`platform-filter__chip ${!value ? "platform-filter__chip--active" : ""}`}
        onClick={() => onChange("")}
      >
        Todas
      </button>
      {GROUP_PLATFORMS.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`platform-filter__chip ${value === p.id ? "platform-filter__chip--active" : ""}`}
          onClick={() => onChange(p.id)}
          style={value === p.id ? { "--chip-color": p.color } : undefined}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}
