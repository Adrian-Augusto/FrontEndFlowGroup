import { PlatformBadge } from "./PlatformBadge";
import "./GroupCard.css";

function formatMembers(count) {
  return new Intl.NumberFormat("pt-BR").format(count);
}

function normalizeGroupLink(link) {
  if (!link || typeof link !== "string") return "";
  const trimmed = link.trim();
  if (!trimmed) return "";
  if (/^(https?:|whatsapp:|tg:|discord:)/i.test(trimmed)) return trimmed;
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

export function GroupCard({ group, showStatus = false, showFeaturedBadge = false }) {
  const statusLabel = {
    pending: "Aguardando aprovação",
    rejected: "Rejeitado",
    approved: "Aprovado",
  };

  const groupLink = normalizeGroupLink(group.link);
  const canOpen = Boolean(groupLink) && (group.status === "approved" || !showStatus);

  const openGroup = () => {
    if (!canOpen) return;
    window.open(groupLink, "_blank", "noopener,noreferrer");
  };

  const handleKeyDown = (event) => {
    if (!canOpen) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openGroup();
    }
  };

  return (
    <article
      className={`group-card ${canOpen ? "group-card--clickable" : ""} ${
        showFeaturedBadge ? "group-card--sponsored" : ""
      }`}
      role={canOpen ? "link" : undefined}
      tabIndex={canOpen ? 0 : undefined}
      onClick={openGroup}
      onKeyDown={handleKeyDown}
    >
      <div className="group-card__cover">
        <img
          src={group.photo}
          alt={group.title}
          className="group-card__photo"
          loading="lazy"
          crossOrigin="anonymous"
          onError={(e) => {
            console.error("[GroupCard] Erro ao carregar foto:", group.photo);
            e.currentTarget.src =
              "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=240&fit=crop";
            e.currentTarget.crossOrigin = "anonymous";
          }}
          onLoad={(e) => {
            console.log("[GroupCard] Foto carregada com sucesso:", group.photo?.substring(0, 50) + "...");
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
          <button
            type="button"
            className="group-card__btn"
            onClick={(event) => {
              event.stopPropagation();
              openGroup();
            }}
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
          </button>
        ) : (
          <p className="group-card__hint">
            {!group.link
              ? "Sem link disponível"
              : group.status === "pending"
                ? "Link disponível após aprovação"
                : "Grupo não disponível"}
          </p>
        )}
      </div>
    </article>
  );
}
