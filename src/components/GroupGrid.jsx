import { GroupCard } from "./GroupCard";
import { SearchBar } from "./SearchBar";
import { PlatformFilter } from "./PlatformFilter";
import "./GroupGrid.css";

export function GroupGrid({
  groups,
  searchQuery,
  onSearchChange,
  platformFilter,
  onPlatformChange,
  onCreateClick,
  canCreate = true,
}) {
  return (
    <section className="groups" id="grupos" aria-labelledby="groups-heading">
      <div className="groups__inner">
        <div className="groups__toolbar">
          <div className="groups__heading-wrap">
            <h2 id="groups-heading" className="groups__heading">
              Grupos externos
            </h2>
            <p className="groups__subheading">
              WhatsApp, Telegram, Discord e mais — cada card com foto, descrição e link.
            </p>
          </div>
          {canCreate && (
            <button type="button" className="groups__create-btn" onClick={onCreateClick}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              </svg>
              Publicar grupo
            </button>
          )}
        </div>

        <PlatformFilter value={platformFilter} onChange={onPlatformChange} />

        <div className="groups__filters">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            resultCount={groups.length}
          />
        </div>

        {groups.length > 0 ? (
          <ul className="groups__grid">
            {groups.map((group) => (
              <li key={group.id}>
                <GroupCard group={group} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="groups__empty" role="status">
            <p>Nenhum grupo encontrado nesta plataforma ou busca.</p>
            <button
              type="button"
              className="groups__empty-btn"
              onClick={() => {
                onSearchChange("");
                onPlatformChange("");
              }}
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
