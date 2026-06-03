import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { groupsApi } from "../api/groupsApi";
import { GROUP_STATUS } from "../data/groups";
import { GroupCard } from "../components/GroupCard";
import { StatusBadge } from "../components/ui/StatusBadge";
import { SponsorGroupModal } from "../components/SponsorGroupModal";
import { EditGroupModal } from "../components/EditGroupModal";
import { useSubscription } from "../context/SubscriptionContext";
import { useToast } from "../components/Toast";
import "./MyGroupsPage.css";

const TABS = [
  { id: "all", label: "Todos" },
  { id: GROUP_STATUS.PENDING, label: "Aguardando" },
  { id: GROUP_STATUS.APPROVED, label: "Aprovados" },
  { id: GROUP_STATUS.REJECTED, label: "Negados" },
];

const STATUS_HELP = {
  [GROUP_STATUS.PENDING]: "Seu grupo está na fila de moderação.",
  [GROUP_STATUS.APPROVED]: "Aprovado — visível para todos na home.",
  [GROUP_STATUS.REJECTED]: "Não foi aprovado. Veja o motivo abaixo, se houver.",
};

export function MyGroupsPage() {
  const { subscription, isActive } = useSubscription();
  const [groups, setGroups] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sponsorshipLimits, setSponsorshipLimits] = useState(null);
  const [sponsorModalOpen, setSponsorModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const { showToast } = useToast();
  const [editingGroup, setEditingGroup] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [mineGroups, limits] = await Promise.all([
        groupsApi.listMine(),
        groupsApi.getSponsorshipLimits()
      ]);
      setGroups(mineGroups || []);

      if (limits?.data) {
        setSponsorshipLimits(limits.data);
      } else if (limits) {
        // Caso o backend retorne os dados diretamente sem a propriedade 'data'
        setSponsorshipLimits(limits);
      } else {
        // Fallback local caso o backend real não implemente a rota (ex: 404)
        const sponsoredCount = (mineGroups || []).filter(g => g.featured).length;

        let maxAllowed = 5; // Default to 5 if no subscription
        if (isActive && subscription) {
          const planId = subscription.planId;
          if (planId === "monthly" || planId === "87e1a0c6-908b-4123-95da-9d2f7d2a308d") {
            maxAllowed = 5;
          } else if (planId === "fifteen-days" || planId === "abfdd079-7706-4efc-8b3b-5ebe10299657") {
            maxAllowed = 3;
          } else {
            maxAllowed = 1;
          }
        }

        setSponsorshipLimits({
          canSponsor: sponsoredCount < maxAllowed,
          sponsoredGroups: {
            active: sponsoredCount,
            max: maxAllowed,
            remaining: Math.max(0, maxAllowed - sponsoredCount),
          }
        });
      }
    } catch (e) {
      setError(e?.message ?? "Erro ao carregar seus grupos.");
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [isActive, subscription]);

  useEffect(() => {
    const init = async () => {
      await Promise.resolve();
      load();
    };
    init();
  }, [load]);

  const handleOpenTurbinarModal = (groupId = null) => {
    setSelectedGroupId(groupId);
    setSponsorModalOpen(true);
  };

  const handleSponsorSuccess = () => {
    load();
  };

  const handleEditClick = (group) => {
    setEditingGroup(group);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (fields) => {
    try {
      await groupsApi.update(fields.id, fields);
      showToast(`Grupo “${fields.title}” atualizado com sucesso!`);
      load();
    } catch (err) {
      showToast(err.message || "Erro ao atualizar grupo.");
      throw err;
    }
  };

  const handleDeleteClick = async (group) => {
    const confirmed = window.confirm(`Tem certeza que deseja excluir o grupo “${group.title}”? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
      await groupsApi.deleteMine(group.id);
      showToast(`Grupo “${group.title}” excluído com sucesso!`);
      load();
    } catch (err) {
      showToast(err.message || "Erro ao excluir grupo.");
    }
  };

  const filtered = useMemo(() => {
    if (tab === "all") return groups;
    return groups.filter((g) => g.status === tab);
  }, [groups, tab]);

  const maxGroups = sponsorshipLimits?.sponsoredGroups?.max ?? 5;
  const activeGroups = sponsorshipLimits?.sponsoredGroups?.active ?? 0;
  const remainingGroups = sponsorshipLimits?.sponsoredGroups?.remaining ?? (maxGroups - activeGroups);
  const canSponsorMore = Boolean(sponsorshipLimits?.canSponsor && remainingGroups > 0 && (maxGroups - activeGroups) > 0);

  return (
    <div className="my-groups">
      <header className="my-groups__header">
        <div>
          <h1 className="my-groups__title">Meus grupos</h1>
          <p className="my-groups__subtitle">
            Acompanhe se foram aprovados, estão pendentes ou negados.
          </p>
        </div>
        <Link to="/" className="my-groups__cta">
          + Publicar grupo
        </Link>
      </header>

      {/* Widget de Patrocínios */}
      {sponsorshipLimits && (
        <div className="my-groups__sponsorship-card">
          <div className="my-groups__sponsorship-info">
            <h2 className="my-groups__sponsorship-title">
              🚀 Meus Patrocínios (Destaques)
            </h2>
            <div className="my-groups__sponsorship-stats">
              <span>Créditos disponíveis:</span>
              <strong>
                {sponsorshipLimits.sponsoredGroups?.remaining || 0}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className="my-groups__sponsorship-action"
            onClick={() => handleOpenTurbinarModal()}
            disabled={!canSponsorMore}
          >
            ⭐ Turbinar Novo Grupo
          </button>
        </div>
      )}

      <div className="my-groups__tabs" role="tablist">
        {TABS.map((t) => {
          const count =
            t.id === "all" ? groups.length : groups.filter((g) => g.status === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`my-groups__tab ${tab === t.id ? "my-groups__tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="my-groups__count">{count}</span>
            </button>
          );
        })}
      </div>

      {loading && (
        <p className="my-groups__state" role="status">
          Carregando…
        </p>
      )}

      {!loading && error && (
        <div className="my-groups__alert" role="alert">
          <p>{error}</p>
          <button type="button" onClick={load}>
            Tentar novamente
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="my-groups__empty">
          <p>Nenhum grupo nesta lista.</p>
          <Link to="/">Criar um grupo na home</Link>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <ul className="my-groups__grid">
          {filtered.map((g) => (
            <li key={g.id} className="my-groups__item">
              <div className="my-groups__status-row">
                <StatusBadge status={g.status} />
                <span className="my-groups__status-hint">{STATUS_HELP[g.status]}</span>
              </div>
              <GroupCard group={g} showStatus showFeaturedBadge={g.featured} />
              
              <div className="my-groups__card-actions">
                <button
                  type="button"
                  className="my-groups__action-btn my-groups__action-btn--edit"
                  onClick={() => handleEditClick(g)}
                >
                  ✏️ Editar
                </button>
                <button
                  type="button"
                  className="my-groups__action-btn my-groups__action-btn--delete"
                  onClick={() => handleDeleteClick(g)}
                >
                  🗑️ Excluir
                </button>
                {g.status === "APPROVED" && (
                  g.featured ? (
                    <span className="my-groups__turbinado-badge" title="Este grupo já está patrocinado e aparece no topo.">
                      ⭐ Turbinado
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="my-groups__turbinar-btn"
                      onClick={() => handleOpenTurbinarModal(g.id)}
                      disabled={!canSponsorMore}
                    >
                      🚀 Turbinar Grupo
                    </button>
                  )
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <SponsorGroupModal
        isOpen={sponsorModalOpen}
        onClose={() => setSponsorModalOpen(false)}
        onSponsorSuccess={handleSponsorSuccess}
        userGroups={groups}
        initialGroupId={selectedGroupId}
      />

      <EditGroupModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        group={editingGroup}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
