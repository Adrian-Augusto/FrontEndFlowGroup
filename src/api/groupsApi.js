import { API_ROUTES } from "./routes";
import { apiRequest } from "./axiosClient";
import { GROUP_STATUS, INITIAL_GROUPS } from "../data/groups";
import { normalizeGroups, normalizeGroup } from "../utils/groupNormalize";
import { filterMyGroups } from "../utils/matchGroupOwner";
import { authService } from "../auth/authService";
import { fileToDataUrl } from "../utils/fileToDataUrl";

const USE_MOCK = import.meta.env.VITE_USE_MOCK === "true";
const STORAGE_KEY = "octo_groups_v5";

if (!USE_MOCK && typeof localStorage !== "undefined") {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

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
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groups));
  } catch (err) {
    console.warn("[groupsApi] Não foi possível salvar grupos mock no localStorage:", err);
  }
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
    throw new Error(msg, { cause: err });
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

  async create({ name, description, categoryId, title, link, platform, photoFile }) {
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
      if (!user) {
        throw new Error("Usuário não autenticado");
      }

      // Validar e converter foto para base64
      if (!(photoFile instanceof File) || photoFile.size === 0) {
        throw new Error("Foto é obrigatória");
      }

      // Validar tamanho do arquivo (5MB)
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (photoFile.size > MAX_FILE_SIZE) {
        const sizeInMB = (photoFile.size / (1024 * 1024)).toFixed(2);
        throw new Error(`A foto não pode exceder 5MB. Arquivo selecionado: ${sizeInMB}MB`);
      }

      let photoUrl;
      try {
        console.log("[groupsApi] Convertendo foto para base64:", photoFile.name);
        photoUrl = await fileToDataUrl(photoFile);
        console.log("[groupsApi] Foto convertida para base64:", {
          hasData: !!photoUrl,
          isString: typeof photoUrl === "string",
          length: photoUrl?.length,
          startsWithData: photoUrl?.startsWith("data:image/")
        });
        if (!photoUrl || !photoUrl.startsWith("data:image/")) {
          throw new Error("Erro ao converter foto para base64");
        }
      } catch (err) {
        console.error("[groupsApi] Erro ao converter foto:", err);
        throw new Error("Erro ao processar a foto", { cause: err });
      }

      const payload = {
        title: nameValue,
        description: descriptionValue,
        link: linkValue,
        platform: platformValue,
        photoUrl,
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
        photoUrl: `${photoUrl.substring(0, 50)}...`,
        category: payload.category,
      });

      const data = await request(API_ROUTES.groups.create, { method: "POST", body: payload });
      return normalizeGroup(data?.data ?? data);
    }

    // Mock mode
    await delay();
    const user = authService.getUser();
    const groups = loadMock();
    
    if (!(photoFile instanceof File) || photoFile.size === 0) {
      throw new Error("Foto é obrigatória");
    }

    const photo = "";
    
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

  async update(id, { name, description, categoryId, title, link, platform, photoFile, photoUrl }) {
    const nameValue = name || title;

    if (!USE_MOCK) {
      let finalPhotoUrl = photoUrl;
      if (photoFile instanceof File && photoFile.size > 0) {
        // Validar tamanho do arquivo (5MB)
        const MAX_FILE_SIZE = 5 * 1024 * 1024;
        if (photoFile.size > MAX_FILE_SIZE) {
          const sizeInMB = (photoFile.size / (1024 * 1024)).toFixed(2);
          throw new Error(`A foto não pode exceder 5MB. Arquivo selecionado: ${sizeInMB}MB`);
        }

        try {
          console.log("[groupsApi] Convertendo foto para base64 no update:", photoFile.name);
          finalPhotoUrl = await fileToDataUrl(photoFile);
          console.log("[groupsApi] Foto convertida para base64 no update:", {
            hasData: !!finalPhotoUrl,
            isString: typeof finalPhotoUrl === "string",
            startsWithData: finalPhotoUrl?.startsWith("data:image/")
          });
          if (!finalPhotoUrl || !finalPhotoUrl.startsWith("data:image/")) {
            throw new Error("Erro ao converter foto para base64");
          }
        } catch (err) {
          console.error("[groupsApi] Erro ao converter foto no update:", err);
          throw new Error("Erro ao processar a foto", { cause: err });
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
      photo = "";
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
        const data = await request(API_ROUTES.groups.feature(groupId), {
          method: "POST",
        });
        return data;
      } catch (err) {
        throw new Error(err?.response?.data?.message ?? err.message ?? "Erro ao patrocinar grupo", { cause: err });
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
