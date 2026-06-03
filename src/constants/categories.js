/**
 * Categorias predefinidas organizadas por seção
 */

export const CATEGORIES_SECTIONS = [
  {
    title: "📖 Educação & Aprendizado",
    icon: "📖",
    categories: [
      { id: "cat-ebook", name: "Livros em PDF/ebook" },
      { id: "cat-courses", name: "Cursos" },
      { id: "cat-education", name: "Educação" },
    ],
  },
  {
    title: "🎮 Entretenimento",
    icon: "🎮",
    categories: [
      { id: "cat-animes", name: "Animes" },
      { id: "cat-series", name: "Filmes e séries" },
      { id: "cat-games", name: "Games" },
      { id: "cat-betting", name: "Apostas" },
    ],
  },
  {
    title: "💕 Relacionamentos",
    icon: "💕",
    categories: [
      { id: "cat-dating", name: "Namoro" },
      { id: "cat-friends", name: "Fazer amigos" },
    ],
  },
  {
    title: "💪 Lifestyle & Bem-estar",
    icon: "💪",
    categories: [
      { id: "cat-fitness", name: "Fitness" },
      { id: "cat-pets", name: "Animais" },
    ],
  },
  {
    title: "💰 Finanças",
    icon: "💰",
    categories: [
      { id: "cat-sideincome", name: "Renda extra" },
      { id: "cat-investments", name: "Investimentos" },
    ],
  },
  {
    title: "🛍️ Compras",
    icon: "🛍️",
    categories: [
      { id: "cat-coupons", name: "Cupons de descontos em produtos" },
    ],
  },
  {
    title: "🔞 Conteúdo Adulto",
    icon: "🔞",
    categories: [
      { id: "cat-adult18", name: "Adultos 18+" },
    ],
  },
];

/**
 * Obter todas as categorias em um array plano
 */
export const getAllCategories = () => {
  return CATEGORIES_SECTIONS.flatMap((section) => 
    section.categories.map(cat => typeof cat === 'string' ? cat : cat.name)
  );
};

/**
 * Encontrar a categoria pelo ID ou Nome (suporta IDs do frontend e do backend)
 */
export const findCategoryByIdOrName = (val) => {
  if (!val) return null;
  const lowerVal = String(val).toLowerCase().trim();
  
  // Mapeamento de IDs diferentes entre front/back
  const idMap = {
    "livros-pdf": "cat-ebook",
    "cursos": "cat-courses",
    "educacao": "cat-education",
    "animes": "cat-animes",
    "filmes-series": "cat-series",
    "games": "cat-games",
    "apostas": "cat-betting",
    "namoro": "cat-dating",
    "fazer-amigos": "cat-friends",
    "fitness": "cat-fitness",
    "animais": "cat-pets",
    "renda-extra": "cat-sideincome",
    "investimentos": "cat-investments",
    "cupons": "cat-coupons",
    "adultos-18": "cat-adult18"
  };

  const normalizedId = idMap[lowerVal] || lowerVal;

  for (const section of CATEGORIES_SECTIONS) {
    for (const cat of section.categories) {
      if (
        cat.id.toLowerCase() === normalizedId ||
        cat.name.toLowerCase() === lowerVal
      ) {
        return cat;
      }
    }
  }
  return null;
};

/**
 * Encontrar a seção de uma categoria
 */
export const getCategorySection = (categoryName) => {
  for (const section of CATEGORIES_SECTIONS) {
    for (const cat of section.categories) {
      const catName = typeof cat === 'string' ? cat : cat.name;
      if (catName === categoryName) {
        return section;
      }
    }
  }
  return null;
};

/**
 * Contar grupos por categoria
 */
export const countGroupsByCategory = (groups = []) => {
  const counts = {};
  
  groups.forEach((group) => {
    const catObj = findCategoryByIdOrName(group.categoryId) || 
                   findCategoryByIdOrName(group.category?.name) || 
                   findCategoryByIdOrName(group.category);
    const cat = catObj ? catObj.name : "Outros";
    counts[cat] = (counts[cat] || 0) + 1;
  });
  
  return counts;
};
