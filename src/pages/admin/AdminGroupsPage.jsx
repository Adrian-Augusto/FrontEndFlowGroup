import { useCallback, useEffect, useMemo, useState } from "react";
import { groupsApi } from "../../api/groupsApi";
import { GROUP_STATUS } from "../../data/groups";
import { GroupCardSimple } from "../../components/ui/GroupCardSimple";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { RejectReasonModal } from "../../components/admin/RejectReasonModal";
import { LoadingState, EmptyState, ErrorState } from "../../components/ui/PageState";
import "./AdminGroupsPage.css";

const FILTERS = [
  { id: GROUP_STATUS.PENDING, label: "Pendentes" },
  { id: GROUP_STATUS.APPROVED, label: "Aprovados" },
  { id: GROUP_STATUS.REJECTED, label: "Negados" },
  { id: "all", label: "Todos" },
];

export function AdminGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState(GROUP_STATUS.PENDING);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const status = filter === "all" ? undefined : filter;
      setGroups(await groupsApi.listAdmin({ status }));
    } catch (e) {
      setError(e.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const pending = useMemo(
    () => groups.filter((g) => g.status === GROUP_STATUS.PENDING),
    [groups],
  );

  const handleApprove = async (id) => {
    setActionId(id);
    try {
      await groupsApi.approve(id);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const handleRejectConfirm = async (reason) => {
    if (!rejectTarget) return;
    setActionId(rejectTarget.id);
    try {
      await groupsApi.reject(rejectTarget.id, reason);
      setRejectTarget(null);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id) => {
    setActionId(id);
    try {
      await groupsApi.delete(id);
      setDeleteConfirm(null);
      await load();
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="admin-groups">
      <header className="admin-groups__header">
        <h1 className="admin-groups__title">Painel admin — grupos</h1>
        <p className="admin-groups__subtitle">Moderação: aprovar ou rejeitar envios</p>
      </header>

      {filter === GROUP_STATUS.PENDING && !loading && pending.length > 0 && (
        <section className="admin-groups__section">
          <h2 className="admin-groups__section-title">Fila de aprovação</h2>
          <ul className="admin-groups__pending-list">
            {pending.map((g) => (
              <li key={g.id} className="admin-groups__pending-item">
                <GroupCardSimple group={g} showStatus />
                <div className="admin-groups__actions">
                  <button
                    type="button"
                    className="admin-groups__btn admin-groups__btn--approve"
                    disabled={actionId === g.id}
                    onClick={() => handleApprove(g.id)}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="admin-groups__btn admin-groups__btn--reject"
                    disabled={actionId === g.id}
                    onClick={() =>
                      setRejectTarget({ id: g.id, title: g.title ?? g.name })
                    }
                  >
                    Reject
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="admin-groups__filters" role="tablist">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={`admin-groups__filter ${filter === f.id ? "admin-groups__filter--active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState label="Carregando…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && groups.length === 0 && (
        <EmptyState title="Nenhum grupo neste filtro." />
      )}

      {!loading && !error && groups.length > 0 && (
        <div className="admin-groups__table-wrap">
          <table className="admin-groups__table">
            <thead>
              <tr>
                <th>Grupo</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.id}>
                  <td>
                    <strong>{g.title ?? g.name}</strong>
                    <p className="admin-groups__desc">{g.description}</p>
                    {g.rejectReason && (
                      <p className="admin-groups__reason">Motivo: {g.rejectReason}</p>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={g.status} />
                  </td>
                  <td>
                    {g.status === GROUP_STATUS.PENDING ? (
                      <div className="admin-groups__row-actions">
                        <button
                          type="button"
                          className="admin-groups__btn admin-groups__btn--approve"
                          disabled={actionId === g.id}
                          onClick={() => handleApprove(g.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="admin-groups__btn admin-groups__btn--reject"
                          disabled={actionId === g.id}
                          onClick={() =>
                            setRejectTarget({ id: g.id, title: g.title ?? g.name })
                          }
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="admin-groups__muted">—</span>
                    )}
                    <button
                      type="button"
                      className="admin-groups__btn admin-groups__btn--delete"
                      disabled={actionId === g.id}
                      onClick={() => setDeleteConfirm({ id: g.id, title: g.title ?? g.name })}
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <RejectReasonModal
        open={Boolean(rejectTarget)}
        groupTitle={rejectTarget?.title ?? ""}
        loading={Boolean(actionId && rejectTarget)}
        onClose={() => setRejectTarget(null)}
        onConfirm={handleRejectConfirm}
      />

      {deleteConfirm && (
        <div className="admin-groups__modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="admin-groups__modal" onClick={(e) => e.stopPropagation()}>
            <h3>Deletar grupo?</h3>
            <p>Tem certeza que deseja deletar <strong>{deleteConfirm.title}</strong>?</p>
            <p className="admin-groups__modal-warning">Esta ação não pode ser desfeita.</p>
            <div className="admin-groups__modal-actions">
              <button
                type="button"
                className="admin-groups__btn admin-groups__btn--secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={actionId === deleteConfirm.id}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="admin-groups__btn admin-groups__btn--delete"
                onClick={() => handleDelete(deleteConfirm.id)}
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
