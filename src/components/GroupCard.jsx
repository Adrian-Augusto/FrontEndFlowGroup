import { PlatformBadge } from "./PlatformBadge";
import "./GroupCard.css";

function formatMembers(count) {
  return new Intl.NumberFormat("pt-BR").format(count);
}

export function GroupCard({ group, showStatus = false, showFeaturedBadge = false }) {
  const statusLabel = {
    pending: "Aguardando aprovação",
    rejected: "Rejeitado",
    approved: "Aprovado",
  };

  // Para grupos na página pública: mostrar link se existe (backend retorna apenas aprovados)
  // Para grupos no admin: mostrar link apenas se aprovado
  const canOpen = group.link && (group.status === "approved" || !showStatus);

  return (
    <article className={`group-card ${showFeaturedBadge ? "group-card--sponsored" : ""}`}>
      <div className="group-card__cover">
        <img
          src={group.photo}
          alt={group.title}
          className="group-card__photo"
          loading="lazy"
          crossOrigin="anonymous"
          onError={(e) => {
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=240&fit=crop";
            e.currentTarget.crossOrigin = "anonymous";
          }}
        />
        <div className="group-card__cover-overlay">
          <div className="group-card__badges">
            {showFeaturedBadge && (
              <span className="group-card__featured">Patrocinado</span>
            )}
            <PlatformBadge platformId={group.platform} />
          </div>
          {showStatus && group.status !== "approved" && (
            <span className={`group-card__status group-card__status--${group.status}`}>
              {statusLabel[group.status]}
            </span>
          )}
        </div>
      </div>

      <div className="group-card__body">
        <h3 className="group-card__title">{group.title}</h3>
        <p className="group-card__description">{group.description}</p>
        {group.members != null && (
          <p className="group-card__members">
            ~{formatMembers(group.members)} membros na plataforma
          </p>
        )}

        {canOpen ? (
          <a
            href={group.link}
            target="_blank"
            rel="noopener noreferrer"
            className="group-card__btn"
          >
            Abrir grupo
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </a>
        ) : (
          <p className="group-card__hint">
            {!group.link ? "Sem link disponível" : group.status === "pending" ? "Link disponível após aprovação" : "Grupo não disponível"}
          </p>
        )}
      </div>
    </article>
  );
}
