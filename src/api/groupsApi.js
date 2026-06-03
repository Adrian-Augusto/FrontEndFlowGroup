import { endpoints } from "./endpoints";
import { API_ROUTES } from "./routes";
import { apiRequest } from "./axiosClient";
import { GROUP_STATUS, INITIAL_GROUPS, DEFAULT_PHOTO } from "../data/groups";
import { normalizeGroups, normalizeGroup } from "../utils/groupNormalize";
import { filterMyGroups } from "../utils/matchGroupOwner";
import { fileToDataUrl } from "../utils/fileToDataUrl";
import { authService } from "../auth/authService";
import { uploadApi } from "./uploadApi";

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== "false";
const STORAGE_KEY = "octo_groups_v5";

function delay(ms = 200) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadMock() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return normalizeGroups(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return normalizeGroups(structuredClone(INITIAL_GROUPS));
}

function saveMock(groups) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
}

function unwrapList(data) {
  const list = data?.data ?? (Array.isArray(data) ? data : []);
  return normalizeGroups(Array.isArray(list) ? list : []);
}

async function request(path, options) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg);
  }
}

export const groupsApi = {
  /** Usuário comum — catálogo público GET /api/v1/groups */
  async listApproved() {
    if (!USE_MOCK) {
      const data = await request(API_ROUTES.groups.list);
      return unwrapList(data);
    }
    await delay();
    return loadMock().filter((g) => g.status === GROUP_STATUS.APPROVED);
  },

  /** Usuário logado — GET /api/v1/groups/me */
  async listMine() {
    const user = authService.getUser();
    if (!user) return [];

    if (!USE_MOCK) {
      const data = await request(API_ROUTES.groups.mine, { skipAuthLogout: true });
      return unwrapList(data);
    }
    await delay();
    return filterMyGroups(loadMock(), user);
  },

  async create({ name, description, categoryId, title, link, platform, photoFile, ...rest }) {
    /**
     * Backend API expects JSON: { name, description, link, platform, photoUrl, categoryId }
     * Frontend sends: { title/name, description, categoryId, link, platform, photoFile }
     */
    const nameValue = name || title;
    const descriptionValue = description || "";
    const linkValue = link || "";
    const platformValue = platform || "";

    if (!USE_MOCK) {
      // Check if user is authenticated
      const user = authService.getUser();
      const token = localStorage.getItem("accessToken");
      console.log("User auth check:", { user: user?.id, hasToken: !!token });

      // Upload photo using multipart/form-data
      let photoUrl = DEFAULT_PHOTO;
      if (photoFile instanceof File && photoFile.size > 0) {
        try {
          console.log("[groupsApi] Tentando upload de foto:", photoFile.name);
          photoUrl = await uploadApi.uploadGroupPhoto(photoFile);
          console.log("[groupsApi] Upload retornou:", {
            hasUrl: !!photoUrl,
            isString: typeof photoUrl === "string",
            urlLength: photoUrl?.length
          });
          if (!photoUrl) {
            console.warn("[groupsApi] Upload retornou URL vazia, usando padrão");
            photoUrl = DEFAULT_PHOTO;
          }
        } catch (err) {
          console.error("[groupsApi] Erro ao fazer upload da foto:", err);
          // Propagar o erro para que a UI possa exibir mensagem adequada
          throw new Error(err.message || "Erro ao fazer upload da foto");
        }
      }

      console.log("[groupsApi] PhotoUrl final:", {
        isDefault: photoUrl === DEFAULT_PHOTO,
        urlLength: photoUrl?.length
      });

      // Backend API expects JSON with these fields
      // Gerar UUID aleatório para categoria se não fornecida
      const generateUUID = () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      };

      const payload = {
        title: nameValue,
        description: descriptionValue,
        link: linkValue,
        platform: platformValue,
        photoUrl: photoUrl || DEFAULT_PHOTO,
        category: categoryId,
      };

      // Validar antes de enviar
      if (!payload.title || typeof payload.title !== "string") {
        throw new Error("Título é obrigatório");
      }
      if (!payload.photoUrl || typeof payload.photoUrl !== "string") {
        throw new Error("Foto é obrigatória");
      }
      if (!payload.category) {
        throw new Error("Categoria é obrigatória");
      }

      console.log("Creating group with payload:", {
        title: nameValue,
        description: descriptionValue,
        link: linkValue,
        platform: platformValue,
        photoUrl: photoUrl ? `${photoUrl.substring(0, 50)}...` : "using default",
        category: payload.category,
      });

      const data = await request(API_ROUTES.groups.create, { method: "POST", body: payload });
      return normalizeGroup(data?.data ?? data);
    }

    // Mock mode
    await delay();
    const user = authService.getUser();
    const groups = loadMock();
    
    // Convert photo for mock
    let photo = DEFAULT_PHOTO;
    if (photoFile instanceof File && photoFile.size > 0) {
      try {
        photo = await fileToDataUrl(photoFile);
      } catch (err) {
        photo = DEFAULT_PHOTO;
      }
    }
    
    const created = normalizeGroup({
      id: `g${Date.now().toString(36)}`,
      title: nameValue,
      description: descriptionValue,
      category: categoryId,
      link: linkValue,
      platform: platformValue,
      status: GROUP_STATUS.PENDING,
      photo,
      createdAt: new Date().toISOString(),
      createdBy: user
        ? { id: user.id, googleId: user.googleId, name: user.name, email: user.email }
        : null,
    });
    groups.unshift(created);
    saveMock(groups);
    return created;
  },

  /** Admin — delega para adminApi */
  async listAdmin({ status } = {}) {
    const { adminApi } = await import("./adminApi");
    return adminApi.listGroups({ status: status === "all" ? undefined : status });
  },

  async approve(id) {
    const { adminApi } = await import("./adminApi");
    return adminApi.approve(id);
  },

  async reject(id, reason) {
    const { adminApi } = await import("./adminApi");
    return adminApi.reject(id, reason);
  },

  async delete(id) {
    const { adminApi } = await import("./adminApi");
    return adminApi.delete(id);
  },

  async deleteMine(id) {
    if (!USE_MOCK) {
      await request(API_ROUTES.groups.delete(id), { method: "DELETE" });
      return;
    }
    // Mock mode
    await delay();
    const groups = loadMock();
    const index = groups.findIndex((g) => g.id === id);
    if (index !== -1) {
      groups.splice(index, 1);
      saveMock(groups);
    }
  },

  async update(id, { name, description, categoryId, title, link, platform, photoFile, photoUrl, ...rest }) {
    const nameValue = name || title;

    if (!USE_MOCK) {
      let finalPhotoUrl = photoUrl;
      if (photoFile instanceof File && photoFile.size > 0) {
        try {
          console.log("[groupsApi] Tentando upload de foto no update:", photoFile.name);
          finalPhotoUrl = await uploadApi.uploadGroupPhoto(photoFile);
        } catch (err) {
          console.error("[groupsApi] Erro ao fazer upload da foto no update:", err);
          throw new Error(err.message || "Erro ao fazer upload da foto");
        }
      }

      const payload = {
        title: nameValue,
        description: description || "",
        link: link || "",
        platform: platform || "",
        photoUrl: finalPhotoUrl,
        category: categoryId,
      };

      const data = await request(API_ROUTES.groups.update(id), { 
        method: "PATCH", 
        body: payload 
      });
      return normalizeGroup(data?.data ?? data);
    }

    // Mock mode
    await delay();
    const groups = loadMock();
    const group = groups.find((g) => g.id === id);
    if (!group) throw new Error("Grupo não encontrado");

    let photo = photoUrl || group.photo;
    if (photoFile instanceof File && photoFile.size > 0) {
      try {
        photo = await fileToDataUrl(photoFile);
      } catch (err) {
        // ignore
      }
    }

    group.title = nameValue ?? group.title;
    group.description = description ?? group.description;
    group.category = categoryId ?? group.category;
    group.categoryId = categoryId ?? group.categoryId;
    group.link = link ?? group.link;
    group.platform = platform ?? group.platform;
    group.photo = photo;

    saveMock(groups);
    return normalizeGroup(group);
  },

  /** GET /api/v1/groups/limits - Obter limites de patrocínio do usuário */
  async getSponsorshipLimits() {
    try {
      const data = await request(API_ROUTES.groups.limits);
      return data;
    } catch (err) {
      console.warn("Erro ao carregar limites:", err.message);
      return null;
    }
  },

  /** POST /api/v1/groups/{id}/feature - Patrocinar um grupo */
  async sponsorGroup(groupId) {
    if (!USE_MOCK) {
      try {
        const data = await request(`${API_ROUTES.groups.list}/${groupId}/feature`, {
          method: "POST",
        });
        return data;
      } catch (err) {
        throw new Error(err?.response?.data?.message ?? err.message ?? "Erro ao patrocinar grupo");
      }
    }

    // Mock mode
    await delay();
    const user = authService.getUser();
    if (!user) throw new Error("Usuário não autenticado");

    const groups = loadMock();
    const group = groups.find((g) => g.id === groupId);
    
    if (!group) {
      throw new Error("Grupo não encontrado");
    }

    if (group.createdBy?.id !== user.id) {
      throw new Error("Você não tem permissão para patrocinar este grupo");
    }

    const userGroups = groups.filter((g) => g.createdBy?.id === user.id);
    const sponsoredGroups = userGroups.filter((g) => g.featured);
    const MAX_SPONSORED = 5;

    if (sponsoredGroups.length >= MAX_SPONSORED) {
      throw new Error("Você atingiu o limite de grupos patrocinados");
    }

    group.featured = true;
    saveMock(groups);
    
    return normalizeGroup(group);
  },
};
