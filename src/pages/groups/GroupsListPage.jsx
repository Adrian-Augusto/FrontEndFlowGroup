import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { groupsApi } from "../../api/groupsApi";
import { useAuth } from "../../context/AuthContext";
import { GroupCardSimple } from "../../components/ui/GroupCardSimple";
import { LoadingState, EmptyState, ErrorState } from "../../components/ui/PageState";
import "./groupsPages.css";

export function GroupsListPage() {
  const { isAuthenticated } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setGroups(await groupsApi.listApproved());
    } catch (e) {
      setError(e.message);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createTo = isAuthenticated ? "/groups/create" : "/login";
  const createState = isAuthenticated ? undefined : { from: "/groups/create" };

  return (
    <div className="groups-page">
      <header className="groups-page__header">
        <div>
          <h1 className="groups-page__title">Grupos</h1>
          <p className="groups-page__subtitle">
            Feed público — somente grupos <strong>aprovados</strong>
          </p>
        </div>
        <Link to={createTo} state={createState} className="groups-page__cta">
          + Criar grupo
        </Link>
      </header>

      {loading && <LoadingState label="Carregando grupos…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && groups.length === 0 && (
        <EmptyState title="Nenhum grupo aprovado ainda.">
          <Link to={createTo} state={createState} className="groups-page__link">
            {isAuthenticated ? "Publicar o primeiro" : "Entrar e publicar"}
          </Link>
        </EmptyState>
      )}
      {!loading && !error && groups.length > 0 && (
        <ul className="groups-page__grid">
          {groups.map((g) => (
            <li key={g.id}>
              <GroupCardSimple group={g} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
