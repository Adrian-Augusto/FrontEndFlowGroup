import { apiRequest } from "./axiosClient";
import { API_ROUTES } from "./routes";
import { getApiOrigin } from "./routes";

async function request(path, options = {}) {
  try {
    return await apiRequest(path, options);
  } catch (err) {
    const msg = err.response?.data?.message ?? err.message ?? "Erro de rede";
    throw new Error(msg, { cause: err });
  }
}

function normalizeUploadUrl(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http")) return trimmed;
  if (trimmed.startsWith("/")) return `${getApiOrigin().replace(/\/$/, "")}${trimmed}`;
  return `${getApiOrigin().replace(/\/$/, "")}/${trimmed}`;
}

export const uploadApi = {
  /** POST /api/v1/upload/group-photo - Upload de foto do grupo */
  async uploadGroupPhoto(file) {
    if (!file || !(file instanceof File)) {
      throw new Error("Arquivo inválido");
    }

    // Validar tamanho do arquivo (5MB = 5 * 1024 * 1024 bytes)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new Error(`A foto não pode exceder 5MB. Arquivo selecionado: ${sizeInMB}MB`);
    }

    const formData = new FormData();
    formData.append("photo", file);

    try {
      const data = await request(API_ROUTES.upload.groupPhoto, {
        method: "POST",
        body: formData,
      });

      const url = normalizeUploadUrl(data?.fullUrl ?? data?.photoUrl ?? data?.url);

      if (!url) {
        console.error("[uploadApi] URL não recebida na resposta:", data);
        throw new Error("Servidor não retornou URL de foto");
      }

      return url;
    } catch (err) {
      console.error("[uploadApi] Erro durante upload:", err);
      throw err;
    }
  },
};

