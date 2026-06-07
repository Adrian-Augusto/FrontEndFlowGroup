import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { GroupCard } from "./GroupCard";
import { apiRequest } from "../api/axiosClient";
import { API_ROUTES } from "../api/routes";
import "./FeaturedGroupsSection.css";

/** Vitrine pública na Home para grupos patrocinados ou com plano premium ativo. */
export function FeaturedGroupsSection({ groups }) {
  const [featuredGroupsFromApi, setFeaturedGroupsFromApi] = useState([]);

  useEffect(() => {
    const loadFeaturedGroups = async () => {
      try {
        const data = await apiRequest(API_ROUTES.plans.featuredGroups);
        const featured = data?.data || data || [];
        setFeaturedGroupsFromApi(featured);
      } catch (err) {
        console.error("[FeaturedGroupsSection] Erro ao carregar grupos destacados:", err);
      }
    };
    loadFeaturedGroups();
  }, []);

  const featuredGroups = groups.filter(
    (g) => g.featured || (g.hasActivePlan && g.planExpiry && new Date(g.planExpiry) > new Date())
  );

  // Combinar grupos destacados da API com grupos locais
  const allFeaturedGroups = [...featuredGroupsFromApi, ...featuredGroups];
  const uniqueFeaturedGroups = allFeaturedGroups.filter((group, index, self) =>
    index === self.findIndex((g) => g.id === group.id)
  );

  if (uniqueFeaturedGroups.length === 0) {
    return null;
  }

  return (
    <section className="featured-section" id="destaques" aria-labelledby="featured-heading">
      <div className="featured-section__inner">
        <header className="featured-section__header">
          <div>
            <p className="featured-section__eyebrow">Patrocinados</p>
            <h2 id="featured-heading" className="featured-section__title">
              Cards patrocinados
            </h2>
            <p className="featured-section__subtitle">
              Apareça em uma vitrine fixa da Home com imagem, descrição em destaque,
              badge patrocinado e acesso direto ao grupo.{" "}
              <Link to="/planos">Ver planos</Link>
            </p>
          </div>
          <Link to="/planos" className="featured-section__cta" aria-label="Ver planos para patrocinar grupo">
            Patrocinar meu grupo
          </Link>
        </header>

        <ul className="featured-section__grid">
          {uniqueFeaturedGroups.map((group) => (
            <li key={group.id}>
              <GroupCard group={group} showFeaturedBadge />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
