/**
 * Lógica inteligente de ordenação de grupos
 * - Grupos FEATURED (patrocinados) com prioridade
 * - A cada 3 FEATURED, exibir 1 grupo FREE
 * - Dentro de cada categoria, ordenar por mais recentes
 * - Apenas grupos com status APPROVED
 * - Otimizado para performance com paginação
 */

export interface Group {
  id: string;
  title: string;
  description: string;
  photo: string;
  link: string;
  platform: string;
  members: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  featured: boolean; // false = FREE, true = FEATURED (patrocinado)
  ownerId: string;
  createdAt: Date | string;
}

export interface OrderedGroupsResult {
  groups: Group[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  featuredCount: number;
  freeCount: number;
}

/**
 * Ordena grupos seguindo regras de negócio
 * Regra: A cada 3 FEATURED, mostrar 1 FREE
 * Padrão: F F F L F F F L F F F L ...
 */
export function orderGroups(
  groups: Group[],
  page: number = 1,
  pageSize: number = 12
): OrderedGroupsResult {
  // Validações
  if (!Array.isArray(groups) || groups.length === 0) {
    return {
      groups: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
      featuredCount: 0,
      freeCount: 0,
    };
  }

  // 1. Filtrar apenas grupos APPROVED
  const approved = groups.filter((g) => g.status === "APPROVED");

  if (approved.length === 0) {
    return {
      groups: [],
      total: 0,
      page,
      pageSize,
      hasMore: false,
      featuredCount: 0,
      freeCount: 0,
    };
  }

  // 2. Separar FEATURED e FREE
  const featured = approved
    .filter((g) => g.featured === true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const free = approved
    .filter((g) => g.featured !== true)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // 3. Mesclar seguindo padrão: F F F L F F F L ...
  const ordered: Group[] = [];
  let featuredIndex = 0;
  let freeIndex = 0;
  let featuredCount = 0;

  while (featuredIndex < featured.length || freeIndex < free.length) {
    // A cada 3 FEATURED, adicionar 1 FREE (se disponível)
    if (featuredCount % 3 === 0 && featuredCount > 0 && freeIndex < free.length) {
      ordered.push(free[freeIndex++]);
    } else if (featuredIndex < featured.length) {
      ordered.push(featured[featuredIndex++]);
      featuredCount++;
    } else if (freeIndex < free.length) {
      ordered.push(free[freeIndex++]);
    }
  }

  // 4. Aplicar paginação
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedGroups = ordered.slice(startIndex, endIndex);

  // Contar FEATURED e FREE na página
  const pageStats = paginatedGroups.reduce(
    (acc, g) => ({
      featured: acc.featured + (g.featured ? 1 : 0),
      free: acc.free + (g.featured ? 0 : 1),
    }),
    { featured: 0, free: 0 }
  );

  return {
    groups: paginatedGroups,
    total: ordered.length,
    page,
    pageSize,
    hasMore: endIndex < ordered.length,
    featuredCount: pageStats.featured,
    freeCount: pageStats.free,
  };
}

/**
 * Ordena grupos sem paginação (para busca/filtros)
 */
export function orderGroupsAll(groups: Group[]): Group[] {
  const result = orderGroups(groups, 1, groups.length);
  return result.groups;
}

/**
 * Validação de página
 */
export function validatePagination(
  page: number | undefined,
  pageSize: number | undefined,
  maxPageSize: number = 100
): { page: number; pageSize: number } {
  let p = parseInt(String(page), 10) || 1;
  let ps = parseInt(String(pageSize), 10) || 12;

  p = Math.max(1, p);
  ps = Math.min(Math.max(1, ps), maxPageSize);

  return { page: p, pageSize: ps };
}
