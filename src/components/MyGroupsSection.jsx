import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { groupsApi } from "../api/groupsApi";
import { useAuth } from "../context/AuthContext";
import { GroupCardSimple } from "./ui/GroupCardSimple";
import "./MyGroupsSection.css";

export function MyGroupsSection() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;

    const loadGroups = async () => {
      setLoading(true);
      try {
        const data = await groupsApi.listMine();
        setGroups(data.slice(0, 3)); // Mostrar apenas os 3 primeiros
      } catch (e) {
        console.error("Erro ao carregar meus grupos:", e);
      } finally {
        setLoading(false);
      }
    };

    loadGroups();
  }, [isAuthenticated]);

  if (!isAuthenticated || groups.length === 0) {
    return null;
  }

  return (
    <section className="my-groups-section" aria-labelledby="my-groups-heading">
      <div className="my-groups-section__inner">
        <header className="my-groups-section__header">
          <div>
            <p className="my-groups-section__eyebrow">Meus Grupos</p>
            <h2 id="my-groups-heading" className="my-groups-section__title">
              Seus grupos
            </h2>
            <p className="my-groups-section__subtitle">
              Veja os grupos que você publicou. Clique para editar, ver detalhes ou gerenciar.
            </p>
          </div>
          <Link to="/meus-grupos" className="my-groups-section__cta">
            Ver todos
          </Link>
        </header>

        {!loading && groups.length > 0 && (
          <ul className="my-groups-section__grid">
            {groups.map((group) => (
              <li key={group.id}>
                <GroupCardSimple group={group} showStatus />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
