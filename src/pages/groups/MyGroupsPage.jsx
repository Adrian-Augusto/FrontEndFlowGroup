import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { groupsApi } from "../../api/groupsApi";
import { GROUP_STATUS } from "../../data/groups";
import { GroupCardSimple } from "../../components/ui/GroupCardSimple";
import { LoadingState, EmptyState, ErrorState } from "../../components/ui/PageState";
import "./groupsPages.css";

const TABS = [
  { id: "all", label: "Todos" },
  { id: GROUP_STATUS.PENDING, label: "Pendentes" },
  { id: GROUP_STATUS.APPROVED, label: "Aprovados" },
  { id: GROUP_STATUS.REJECTED, label: "Negados" },
];

export function MyGroupsPage() {
  const [groups, setGroups] = useState([]);
  const [tab, setTab] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setGroups(await groupsApi.listMine());
    } catch (e) {
      setError(e.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (tab === "all") return groups;
    return groups.filter((g) => g.status === tab);
  }, [groups, tab]);

  return (
    <div className="groups-page">
      <header className="groups-page__header">
        <div>
          <h1 className="groups-page__title">Meus grupos</h1>
          <p className="groups-page__subtitle">Todos os status da moderação</p>
        </div>
        <Link to="/groups/create" className="groups-page__cta">
          + Novo
        </Link>
      </header>

      <div className="groups-page__tabs" role="tablist">
        {TABS.map((t) => {
          const count =
            t.id === "all"
              ? groups.length
              : groups.filter((g) => g.status === t.id).length;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              className={`groups-page__tab ${tab === t.id ? "groups-page__tab--active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
              <span className="groups-page__tab-count">{count}</span>
            </button>
          );
        })}
      </div>

      {loading && <LoadingState />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && filtered.length === 0 && (
        <EmptyState title="Nenhum grupo nesta lista.">
          <Link to="/groups/create" className="groups-page__link">
            Criar grupo
          </Link>
        </EmptyState>
      )}
      {!loading && !error && filtered.length > 0 && (
        <ul className="groups-page__grid">
          {filtered.map((g) => (
            <li key={g.id}>
              <GroupCardSimple group={g} showStatus />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
