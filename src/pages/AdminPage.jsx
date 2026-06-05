import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../api/adminApi";
import { useToast } from "../components/Toast";
import { PlatformBadge } from "../components/PlatformBadge";
import { GROUP_STATUS } from "../data/groups";
import "./AdminPage.css";

function formatNumber(n) {
  return new Intl.NumberFormat("pt-BR").format(n);
}

export function AdminPage() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [groupsLoading, setGroupsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);
  const [stats, setStats] = useState(null);
  const [statusFilter, setStatusFilter] = useState(GROUP_STATUS.PENDING);
  const [actionId, setActionId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadStats = useCallback(async () => {
    const data = await adminApi.getStats();
    setStats(data);
  }, []);

  const loadGroups = useCallback(async () => {
    setGroupsLoading(true);
    setApiError(null);
    try {
      const data = await adminApi.listGroups({ status: statusFilter });
      setGroups(Array.isArray(data) ? data : []);
    } catch (err) {
      setGroups([]);
      setApiError(err?.message ?? "Erro ao carregar grupos do admin.");
    } finally {
      setGroupsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    Promise.resolve().then(loadStats).catch((err) => {
      setStats(null);
      setApiError(err?.message ?? "Erro ao carregar estatísticas do admin.");
    });
  }, [loadStats]);

  useEffect(() => {
    Promise.resolve().then(loadGroups);
  }, [loadGroups]);

  const filtered = useMemo(
    () => groups.filter((g) => g.status === statusFilter),
    [groups, statusFilter],
  );

  const handleApprove = async (id, title) => {
    setActionId(id);
    try {
      await adminApi.approve(id);
      showToast(`“${title}” aprovado — link liberado na vitrine.`);
      await loadStats();
      await loadGroups();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id, title) => {
    const reason = window.prompt(`Motivo da rejeição (opcional) — ${title}:`);
    if (reason === null) return;
    setActionId(id);
    try {
      await adminApi.reject(id, reason);
      showToast(`“${title}” rejeitado.`);
      await loadStats();
      await loadGroups();
    } finally {
      setActionId(null);
    }
  };
  const handleDelete = async (id, title) => {
    setActionId(id);
    try {
      await adminApi.delete(id);
      showToast(`"${title}" deletado permanentemente.`);
      setDeleteConfirm(null);
      await loadStats();
      await loadGroups();
    } finally {
      setActionId(null);
    }
  };
  return (
    <div className="admin-dashboard">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">⚙️</span>
          <h3 className="admin-sidebar__title">FlowGroup Admin</h3>
        </div>
        <nav className="admin-sidebar__nav">
          <Link to="/admin" className="admin-sidebar__link admin-sidebar__link--active">
            🛡️ Moderação
          </Link>
          <Link to="/admin/online-users" className="admin-sidebar__link">
            👥 Usuários Online
          </Link>
          <hr className="admin-sidebar__divider" />
          <Link to="/" className="admin-sidebar__link admin-sidebar__link--back">
            🏠 Voltar ao Site
          </Link>
        </nav>
      </aside>

      <main className="admin-content">
        <header className="admin-content__header">
          <div>
            <p className="admin-content__eyebrow">Painel administrativo</p>
            <h1 className="admin-content__title">Moderação de grupos externos</h1>
            <p className="admin-content__subtitle">
              Revise título, foto, descrição e link (WhatsApp, Telegram, etc.) antes de
              publicar no catálogo.
            </p>
          </div>
        </header>

        {apiError && (
          <div className="admin__api-error" role="alert">
            <span>{apiError}</span>
            <button
              type="button"
              onClick={() => {
                loadStats();
                loadGroups();
              }}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {stats && (
          <div className="admin__stats">
            <article className="admin-stat">
              <span className="admin-stat__label">Usuários na plataforma</span>
              <strong className="admin-stat__value">{formatNumber(stats.totalUsers)}</strong>
              <span className="admin-stat__hint">
                {formatNumber(stats.activeUsers30d)} ativos (30d)
              </span>
            </article>
            <article className="admin-stat">
              <span className="admin-stat__label">Usuários online</span>
              <strong className="admin-stat__value">{formatNumber(stats.onlineUsers || 0)}</strong>
            </article>
            <article className="admin-stat admin-stat--approved">
              <span className="admin-stat__label">Aprovados</span>
              <strong className="admin-stat__value">{stats.groups.approved}</strong>
            </article>
            <article className="admin-stat admin-stat--pending">
              <span className="admin-stat__label">Pendentes</span>
              <strong className="admin-stat__value">{stats.groups.pending}</strong>
            </article>
            <article className="admin-stat admin-stat--rejected">
              <span className="admin-stat__label">Rejeitados</span>
              <strong className="admin-stat__value">{stats.groups.rejected}</strong>
            </article>
          </div>
        )}

        <div className="admin__tabs-row">
          <div className="admin__tabs" role="tablist">
            {[
              { id: GROUP_STATUS.PENDING, label: "Pendentes" },
              { id: GROUP_STATUS.APPROVED, label: "Aprovados" },
              { id: GROUP_STATUS.REJECTED, label: "Rejeitados" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                className={`admin__tab ${statusFilter === tab.id ? "admin__tab--active" : ""}`}
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {groupsLoading ? (
          <div className="admin-loading-container">
            <p className="admin__loading">Carregando grupos…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="admin-empty-container">
            <p className="admin__empty">Nenhum grupo neste status.</p>
          </div>
        ) : (
          <div className="admin__table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Post</th>
                  <th>Plataforma</th>
                  <th>Link</th>
                  <th>Criador</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <div className="admin-table__post">
                        <img src={g.photo} alt="" className="admin-table__thumb" crossOrigin="anonymous" />
                        <div>
                          <strong>{g.title}</strong>
                          <span className="admin-table__desc">{g.description}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <PlatformBadge platformId={g.platform} />
                    </td>
                    <td>
                      <a
                        href={g.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="admin-table__link"
                      >
                        Abrir link
                      </a>
                    </td>
                    <td>
                      {g.createdBy ? (
                        <>
                          <span className="admin-table__creator-name">{g.createdBy.name}</span>
                          <span className="admin-table__email">{g.createdBy.email}</span>
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td>
                      <span className={`admin-table__badge admin-table__badge--${g.status.toLowerCase()}`}>
                        {g.status}
                      </span>
                    </td>
                    <td className="admin-table__actions">
                      <div className="admin-table__actions-row">
                        {g.status === GROUP_STATUS.PENDING ? (
                          <>
                            <button
                              type="button"
                              className="admin-table__btn admin-table__btn--approve"
                              disabled={actionId === g.id}
                              onClick={() => handleApprove(g.id, g.title)}
                            >
                              Aprovar
                            </button>
                            <button
                              type="button"
                              className="admin-table__btn admin-table__btn--reject"
                              disabled={actionId === g.id}
                              onClick={() => handleReject(g.id, g.title)}
                            >
                              Rejeitar
                            </button>
                          </>
                        ) : (
                          <span className="admin-table__muted">—</span>
                        )}
                        <button
                          type="button"
                          className="admin-table__btn admin-table__btn--delete"
                          disabled={actionId === g.id}
                          onClick={() => setDeleteConfirm({ id: g.id, title: g.title })}
                        >
                          Deletar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {deleteConfirm && (
        <div className="admin__modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Deletar grupo?</h3>
            <p>Tem certeza que deseja deletar <strong>{deleteConfirm.title}</strong>?</p>
            <p className="admin__modal-warning">Esta ação não pode ser desfeita.</p>
            <div className="admin__modal-actions">
              <button
                type="button"
                className="admin-table__btn admin-table__btn--secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={actionId === deleteConfirm.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-table__btn admin-table__btn--delete"
                onClick={() => handleDelete(deleteConfirm.id, deleteConfirm.title)}
                disabled={actionId === deleteConfirm.id}
              >
                {actionId === deleteConfirm.id ? "Deletando..." : "Deletar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
