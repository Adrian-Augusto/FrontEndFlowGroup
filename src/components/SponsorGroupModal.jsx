import { useEffect, useId, useState } from "react";
import { groupsApi } from "../api/groupsApi";
import "./SponsorGroupModal.css";

export function SponsorGroupModal({ isOpen, onClose, onSponsorSuccess, userGroups = [], initialGroupId = null }) {
  const titleId = useId();
  const [selectedGroupId, setSelectedGroupId] = useState(initialGroupId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sponsorshipLimits, setSponsorshipLimits] = useState(null);

  const loadSponsorshipLimits = async () => {
    try {
      const data = await groupsApi.getSponsorshipLimits();
      if (data?.data) {
        setSponsorshipLimits(data.data);
      } else if (data) {
        setSponsorshipLimits(data);
      } else {
        setSponsorshipLimits(null);
      }
    } catch (err) {
      console.error("Erro ao carregar limites:", err);
      setSponsorshipLimits(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const init = async () => {
      await Promise.resolve();
      setSelectedGroupId(initialGroupId);
      loadSponsorshipLimits();
    };
    init();
  }, [isOpen, initialGroupId]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSponsor = async () => {
    if (!selectedGroupId) {
      setError("Selecione um grupo para impulsionar");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await groupsApi.sponsorGroup(selectedGroupId);
      setSelectedGroupId(null);
      onSponsorSuccess?.();
      onClose();
    } catch (err) {
      setError(err?.message ?? "Erro ao impulsionar grupo");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  // Filter groups that are not already sponsored
  const sponsorableGroups = userGroups.filter((g) => !g.featured && g.status === "approved");

  const canSponsorMore =
    sponsorshipLimits?.canSponsor &&
    sponsorshipLimits?.sponsoredGroups?.active < sponsorshipLimits?.sponsoredGroups?.max;

  return (
    <div className="modal-backdrop" role="presentation" onClick={handleBackdropClick}>
      <div className="modal modal--medium" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            Impulsionar grupo
          </h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Fechar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </header>

        <div className="modal__content">
          {sponsorshipLimits && (
            <div className="sponsor-modal__info">
              <div className="sponsor-modal__limits">
                <p>
                  <strong>Espaço disponível:</strong>{" "}
                  {sponsorshipLimits.sponsoredGroups.max - sponsorshipLimits.sponsoredGroups.active} de{" "}
                  {sponsorshipLimits.sponsoredGroups.max}
                </p>
                <div className="sponsor-modal__progress-bar">
                  {Array.from({ length: sponsorshipLimits.sponsoredGroups.max }).map((_, i) => (
                    <div
                      key={i}
                      className={`sponsor-modal__slot ${
                        i < sponsorshipLimits.sponsoredGroups.active ? "sponsor-modal__slot--filled" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {!canSponsorMore && sponsorshipLimits && (
            <div className="modal__alert modal__alert--warning">
              <span>⚠️ Você atingiu o limite de impulsionamentos. Atualize seu plano para impulsionar mais grupos.</span>
            </div>
          )}

          {sponsorableGroups.length === 0 ? (
            <div className="sponsor-modal__empty">
              <p>
                {userGroups.length === 0
                  ? "Você não possui nenhum grupo criado."
                  : "Todos os seus grupos já estão impulsionados ou aguardando aprovação."}
              </p>
            </div>
          ) : (
            <div className="sponsor-modal__groups">
              <p className="sponsor-modal__label">Selecione o grupo para impulsionar:</p>
              <div className="sponsor-modal__list">
                {sponsorableGroups.map((group) => (
                  <label key={group.id} className="sponsor-modal__group-item">
                    <input
                      type="radio"
                      name="groupToSponsor"
                      value={group.id}
                      checked={selectedGroupId === group.id}
                      onChange={(e) => setSelectedGroupId(e.target.value)}
                      disabled={loading}
                    />
                    <span className="sponsor-modal__group-name">{group.title || group.name}</span>
                    <span className="sponsor-modal__group-status">{group.platform}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="modal__alert modal__alert--error" role="alert">
              {error}
            </div>
          )}
        </div>

        <footer className="modal__actions">
          <button type="button" className="modal__btn modal__btn--ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button
            type="button"
            className="modal__btn modal__btn--primary"
            onClick={handleSponsor}
            disabled={loading || !canSponsorMore || sponsorableGroups.length === 0}
          >
            {loading ? "Impulsionando..." : "Impulsionar"}
          </button>
        </footer>
      </div>
    </div>
  );
}
