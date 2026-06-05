import { useState, useEffect } from "react";
import { CATEGORIES_SECTIONS, countGroupsByCategory } from "../constants/categories";
import "./CategoriesSection.css";

/**
 * Sidebar de categorias com botão hamburger
 * Exibe categorias predefinidas organizadas por seção
 */
export function CategoriesSection({ groups = [], onCategorySelect = () => {}, selectedCategory = "" }) {
  const [expandedSections, setExpandedSections] = useState({});
  const [categoryCounts, setCategoryCounts] = useState({});
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Contar grupos por categoria
  useEffect(() => {
    const counts = countGroupsByCategory(groups);
    setCategoryCounts(counts);
    
    // Expandir primeira seção por padrão
    setExpandedSections({
      [CATEGORIES_SECTIONS[0].title]: true,
    });
  }, [groups]);

  // Fechar sidebar ao clicar fora
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && sidebarOpen) {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [sidebarOpen]);

  const handleCloseSidebar = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSidebarOpen(false);
  };

  const toggleSection = (sectionTitle) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionTitle]: !prev[sectionTitle],
    }));
  };

  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      onCategorySelect("");
    } else {
      onCategorySelect(categoryId);
    }
    setSidebarOpen(false);
  };

  return (
    <div className="categories-container">
      {/* Botão Hamburger para mobile */}
      <button
        className={`categories-hamburger ${sidebarOpen ? "active" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Abrir menu de categorias"
        type="button"
      >
        <div className="hamburger-icon">
          <span></span>
          <span></span>
          <span></span>
        </div>
        <span className="hamburger-label">MENU</span>
      </button>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="categories-overlay"
          onClick={() => setSidebarOpen(false)}
          role="presentation"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`categories-sidebar ${sidebarOpen ? "open" : ""}`}
        aria-labelledby="categories-heading"
      >
        <header className="categories-sidebar__header">
          <h2 id="categories-heading" className="categories-sidebar__title">
            Categorias
          </h2>
          <button
            className="categories-sidebar__close"
            onClick={handleCloseSidebar}
            onMouseDown={handleCloseSidebar}
            aria-label="Fechar menu de categorias"
            type="button"
          >
            ✕
          </button>
        </header>

        <div className="categories-sidebar__list">
          {CATEGORIES_SECTIONS.map((section) => (
            <div key={section.title} className="category-section">
              <button
                className={`category-section__header ${
                  expandedSections[section.title] ? "active" : ""
                }`}
                onClick={() => toggleSection(section.title)}
                aria-expanded={expandedSections[section.title]}
                type="button"
              >
                <span className="category-section__title">
                  {section.title}
                </span>
                <span className="category-section__icon" aria-hidden="true">
                  ▼
                </span>
              </button>

              {expandedSections[section.title] && (
                <div className="category-section__content">
                  {section.categories.map((category) => {
                      const catName = typeof category === 'string' ? category : category.name;
                      const catId = typeof category === 'string' ? category : category.id;

                      return (
                        <button
                          key={catId}
                          className={`category-link ${selectedCategory === catId ? "active" : ""}`}
                          onClick={() => handleCategoryClick(catId)}
                          type="button"
                        >
                          <span className="category-link__name">{catName}</span>
                          <span className="category-link__count">
                            {categoryCounts[catName] || 0}
                          </span>
                        </button>
                      );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* Botão para abrir quando minimizado */}
      {!sidebarOpen && (
        <button
          className="categories-reopen"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menu de categorias"
          type="button"
        >
          &gt;
        </button>
      )}
    </div>
  );
}
