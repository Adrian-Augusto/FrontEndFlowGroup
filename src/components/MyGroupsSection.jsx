import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./MyGroupsSection.css";

export function MyGroupsSection() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <section className="my-groups-section" aria-label="Meus grupos">
      <div className="my-groups-section__inner">
        <Link to="/meus-grupos" className="my-groups-section__button" aria-label="Ver meus grupos">
          Meus grupos
        </Link>
      </div>
    </section>
  );
}
