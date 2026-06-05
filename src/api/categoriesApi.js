import { apiRequest } from "./axiosClient";
import { API_ROUTES } from "./routes";

const MOCK_CATEGORIES = [];

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";

async function request(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg, { cause: err });
  }
}

export const categoriesApi = {
  async listCategories() {
    if (!USE_MOCK) {
      try {
        const data = await request(API_ROUTES.categories.list);
        const list = data?.data ?? (Array.isArray(data) ? data : []);
        return Array.isArray(list) ? list : [];
      } catch {
        // Fallback para categorias mockadas se a API falhar
        console.warn("Falha ao carregar categorias da API, usando mock");
        return MOCK_CATEGORIES;
      }
    }
    
    // Mock: return predefined categories
    return MOCK_CATEGORIES;
  },

  async getCategory(id) {
    if (!USE_MOCK) {
      try {
        const data = await request(API_ROUTES.categories.byId(id));
        return data?.data ?? data;
      } catch {
        return MOCK_CATEGORIES.find((c) => c.id === id) || null;
      }
    }
    
    return MOCK_CATEGORIES.find((c) => c.id === id) || null;
  },

  /** Retorna categorias agrupadas por tipo */
  getCategoriesByType() {
    return {
      tech: MOCK_CATEGORIES.filter((c) => ["cat-tech", "cat-dev", "cat-ai", "cat-cybersec"].includes(c.id)),
      business: MOCK_CATEGORIES.filter((c) => ["cat-finance", "cat-crypto", "cat-business", "cat-sales", "cat-marketing"].includes(c.id)),
      education: MOCK_CATEGORIES.filter((c) => ["cat-education", "cat-languages", "cat-career", "cat-coaching"].includes(c.id)),
      lifestyle: MOCK_CATEGORIES.filter((c) => ["cat-fitness", "cat-sports", "cat-gaming", "cat-travel", "cat-cooking", "cat-music", "cat-movies", "cat-books"].includes(c.id)),
      community: MOCK_CATEGORIES.filter((c) => ["cat-local", "cat-parents", "cat-pets", "cat-cars", "cat-home"].includes(c.id)),
      creative: MOCK_CATEGORIES.filter((c) => ["cat-design", "cat-photo", "cat-video", "cat-fashion"].includes(c.id)),
      other: MOCK_CATEGORIES.filter((c) => ["cat-misc"].includes(c.id)),
    };
  },
};
