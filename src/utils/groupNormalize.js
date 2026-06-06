import { DEFAULT_PHOTO } from "../data/groups";
import { findCategoryByIdOrName } from "../constants/categories";
import { getApiOrigin } from "../api/routes";

const SAMPLE_GROUP_DESCRIPTIONS = {
  g1: "Promoções de eletrônicos, cupons e oportunidades para comprar melhor em São Paulo.",
  g2: "Comunidade no Telegram para tirar dúvidas, divulgar vagas e compartilhar projetos JavaScript.",
  g3: "Discord para partidas, voice chat, campeonatos rápidos e novidades de jogos indie.",
  g8: "Grupo Signal para quem prefere mensagens cifradas, privacidade e conversas sem algoritmo.",
};

function hasBrokenEncoding(text) {
  return typeof text === "string" && /[\u00c3\u00c2\u00e2]/.test(text);
}

function normalizeDescription(raw) {
  const description = raw.description?.trim?.() || "";

  if (!description || hasBrokenEncoding(description)) {
    return (
      SAMPLE_GROUP_DESCRIPTIONS[raw.id] ||
      "Grupo patrocinado com descrição em destaque e acesso direto para novos membros."
    );
  }

  return description;
}

function normalizePhotoUrl(url) {
  if (!url) return DEFAULT_PHOTO;

  // Se já for uma data URL (base64), retorna como está
  if (url.startsWith("data:image/")) return url;

  if (url.startsWith("http")) return url;

  if (url.startsWith("uploads/") || url.startsWith("/uploads/")) {
    const cleanUrl = url.startsWith("/") ? url.substring(1) : url;
    return `${getApiOrigin().replace(/\/$/, "")}/uploads/${cleanUrl.replace(/^uploads\//, "")}`;
  }

  if (url.startsWith("/")) return url;

  return "/" + url;
}

/** Compatibilidade com dados antigos (name -> title, category -> platform). */
export function normalizeGroup(raw) {
  if (!raw) return raw;

  let photoUrl = raw.photo ?? raw.photoUrl ?? raw.fullUrl ?? DEFAULT_PHOTO;
  photoUrl = normalizePhotoUrl(photoUrl);

  const catObj = findCategoryByIdOrName(raw.categoryId) || 
                 findCategoryByIdOrName(raw.category?.name) || 
                 findCategoryByIdOrName(raw.category);
  const categoryId = catObj ? catObj.id : (raw.categoryId || null);

  return {
    ...raw,
    title: raw.title ?? raw.name ?? "Sem título",
    description: normalizeDescription(raw),
    photo: photoUrl,
    link: raw.link ?? "",
    platform: raw.platform ?? raw.category ?? "outros",
    status: (raw.status ?? "approved").toLowerCase(),
    featured: Boolean(raw.featured ?? raw.isFeatured),
    categoryId,
  };
}

export function normalizeGroups(list) {
  return list.map(normalizeGroup);
}
