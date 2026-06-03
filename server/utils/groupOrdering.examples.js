/**
 * Exemplo de uso da lógica de ordenação inteligente de grupos
 * 
 * PADRÃO DE EXIBIÇÃO: F F F L F F F L F F F L ...
 * - F = FEATURED (patrocinado)
 * - L = FREE (gratuito)
 * 
 * A cada 3 grupos FEATURED, 1 grupo FREE é exibido
 */

import { orderGroups, orderGroupsAll, validatePagination } from "./utils/groupOrdering.js";

// ============================================
// EXEMPLOS DE DADOS
// ============================================

const mockGroupsExample = [
  {
    id: "g1",
    title: "Grupo 1 - FREE",
    status: "APPROVED",
    featured: false,
    createdAt: new Date("2025-01-01"),
  },
  {
    id: "g2",
    title: "Grupo 2 - FEATURED",
    status: "APPROVED",
    featured: true,
    createdAt: new Date("2025-01-02"),
  },
  {
    id: "g3",
    title: "Grupo 3 - FEATURED",
    status: "APPROVED",
    featured: true,
    createdAt: new Date("2025-01-03"),
  },
  {
    id: "g4",
    title: "Grupo 4 - FREE",
    status: "APPROVED",
    featured: false,
    createdAt: new Date("2025-01-04"),
  },
  {
    id: "g5",
    title: "Grupo 5 - FEATURED",
    status: "APPROVED",
    featured: true,
    createdAt: new Date("2025-01-05"),
  },
  {
    id: "g6",
    title: "Grupo 6 - FREE (não aprovado)",
    status: "PENDING",
    featured: false,
    createdAt: new Date("2025-01-06"),
  },
  {
    id: "g7",
    title: "Grupo 7 - FEATURED",
    status: "APPROVED",
    featured: true,
    createdAt: new Date("2025-01-07"),
  },
  {
    id: "g8",
    title: "Grupo 8 - FEATURED",
    status: "APPROVED",
    featured: true,
    createdAt: new Date("2025-01-08"),
  },
  {
    id: "g9",
    title: "Grupo 9 - FREE",
    status: "APPROVED",
    featured: false,
    createdAt: new Date("2025-01-09"),
  },
  {
    id: "g10",
    title: "Grupo 10 - FEATURED",
    status: "APPROVED",
    featured: true,
    createdAt: new Date("2025-01-10"),
  },
];

// ============================================
// EXEMPLO 1: Sem paginação (todos os grupos)
// ============================================
console.log("\n═══════════════════════════════════════");
console.log("EXEMPLO 1: Todos os grupos (sem paginação)");
console.log("═══════════════════════════════════════\n");

const allGroups = orderGroupsAll(mockGroupsExample);
console.log("Ordem completa (padrão F F F L F F F L ...):");
allGroups.forEach((g, i) => {
  const type = g.featured ? "FEATURED 🎯" : "FREE 🆓";
  console.log(`${i + 1}. [${type}] ${g.title}`);
});

// ============================================
// EXEMPLO 2: Com paginação (página 1, 4 itens)
// ============================================
console.log("\n═══════════════════════════════════════");
console.log("EXEMPLO 2: Paginação (página 1, 4 itens por página)");
console.log("═══════════════════════════════════════\n");

const page1 = orderGroups(mockGroupsExample, 1, 4);
console.log(`Página: ${page1.page} | Total: ${page1.total} | Featured: ${page1.featuredCount} | Free: ${page1.freeCount}`);
page1.groups.forEach((g) => {
  const type = g.featured ? "FEATURED 🎯" : "FREE 🆓";
  console.log(`  - [${type}] ${g.title}`);
});

// ============================================
// EXEMPLO 3: Página 2
// ============================================
console.log("\n═══════════════════════════════════════");
console.log("EXEMPLO 3: Paginação (página 2)");
console.log("═══════════════════════════════════════\n");

const page2 = orderGroups(mockGroupsExample, 2, 4);
console.log(`Página: ${page2.page} | Total: ${page2.total} | Featured: ${page2.featuredCount} | Free: ${page2.freeCount}`);
page2.groups.forEach((g) => {
  const type = g.featured ? "FEATURED 🎯" : "FREE 🆓";
  console.log(`  - [${type}] ${g.title}`);
});

// ============================================
// EXEMPLO 4: Validação de paginação
// ============================================
console.log("\n═══════════════════════════════════════");
console.log("EXEMPLO 4: Validação de paginação");
console.log("═══════════════════════════════════════\n");

const tests = [
  { page: "abc", limit: "xyz" },
  { page: 0, limit: -5 },
  { page: 999, limit: 999 },
  { page: "1", limit: "20" },
];

tests.forEach((test) => {
  const validated = validatePagination(test.page, test.limit);
  console.log(`Input: ${JSON.stringify(test)} → Output: ${JSON.stringify(validated)}`);
});

// ============================================
// EXEMPLO 5: Padrão de alternância
// ============================================
console.log("\n═══════════════════════════════════════");
console.log("EXEMPLO 5: Verificar padrão F F F L");
console.log("═══════════════════════════════════════\n");

const patternCheck = orderGroups(mockGroupsExample, 1, 100);
let featuredCountPattern = 0;
let expectingFree = false;

patternCheck.groups.forEach((g, i) => {
  if (g.featured) {
    featuredCountPattern++;
    if (featuredCountPattern % 3 === 0) {
      expectingFree = true;
    } else {
      expectingFree = false;
    }
  } else {
    expectingFree = false;
  }

  const pattern = expectingFree ? "[OK] " : "[✓] ";
  const type = g.featured ? "F" : "L";
  console.log(`${pattern}[${type}] ${i + 1}. ${g.title}`);
});

console.log("\n✅ Exemplos concluídos!\n");
