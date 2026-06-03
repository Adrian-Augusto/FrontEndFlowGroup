import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Hero } from "../components/Hero";
import { FeaturedGroupsSection } from "../components/FeaturedGroupsSection";
import { CategoriesSection } from "../components/CategoriesSection";
import { GroupGrid } from "../components/GroupGrid";
import { CreateGroupModal } from "../components/CreateGroupModal";
import { useGroups } from "../context/GroupsContext";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";

function normalize(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

function filterGroups(groups, query, platform, categoryId, { excludeFeatured = false } = {}) {
  let result = groups;
  if (excludeFeatured) result = result.filter((g) => !g.featured);
  if (platform) result = result.filter((g) => g.platform === platform);
  if (categoryId) result = result.filter((g) => g.categoryId === categoryId);
  const q = normalize(query.trim());
  if (q) {
    result = result.filter(
      (g) =>
        normalize(g.title).includes(q) ||
        normalize(g.description).includes(q),
    );
  }
  return result;
}

export function HomePage() {
  const { approvedGroups, createGroup } = useGroups();
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [searchQuery, setSearchQuery] = useState("");
  const [platformFilter, setPlatformFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    if (location.state?.focusGrupos) {
      requestAnimationFrame(() => {
        document.getElementById("grupos")?.scrollIntoView({ behavior: "smooth" });
      });
      navigate("/", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  useEffect(() => {
    if (window.location.hash === "#destaques") {
      requestAnimationFrame(() => {
        document.getElementById("destaques")?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, []);

  const filteredGroups = useMemo(
    () =>
      filterGroups(approvedGroups, searchQuery, platformFilter, categoryFilter, {
        excludeFeatured: true,
      }),
    [approvedGroups, searchQuery, platformFilter, categoryFilter],
  );

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      showToast("Faça login para publicar um grupo.");
      navigate("/login", { state: { from: "/" } });
      return;
    }
    setModalOpen(true);
  };

  const handleCreate = async (payload) => {
    await createGroup(payload);
    showToast(`“${payload.title}” enviado — aguardando moderação.`);
  };

  return (
    <>
      <CategoriesSection groups={approvedGroups} onCategorySelect={setCategoryFilter} selectedCategory={categoryFilter} />
      <Hero />
      <FeaturedGroupsSection groups={approvedGroups} />
      <GroupGrid
        groups={filteredGroups}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        platformFilter={platformFilter}
        onPlatformChange={setPlatformFilter}
        onCreateClick={handleCreateClick}
        canCreate
      />
      <CreateGroupModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
