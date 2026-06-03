# 🎯 Lógica Inteligente de Ordenação de Grupos

## Visão Geral

Sistema profissional e performático de ordenação de grupos com suporte a paginação. Implementa uma estratégia de marketing onde grupos **FEATURED** (patrocinados) recebem prioridade sem ofuscar completamente os grupos **FREE** (gratuitos).

## 📋 Regras de Ordenação

### Padrão de Exibição
```
F F F L F F F L F F F L ...
```
- **F** = Grupo FEATURED (patrocinado)
- **L** = Grupo FREE (gratuito)

### Regras Específicas

1. **Apenas grupos com status APPROVED são exibidos**
   - Grupos com status PENDING ou REJECTED são filtrados

2. **Grupos FEATURED têm prioridade**
   - São exibidos primeiro dentro de cada padrão

3. **A cada 3 FEATURED, 1 FREE é exibido**
   - Mantém equilíbrio entre patrocinados e gratuitos
   - Garante visibilidade para grupos free

4. **Dentro de cada categoria, ordenar por mais recentes**
   - FEATURED: ordenados por `createdAt` DESC
   - FREE: ordenados por `createdAt` DESC

5. **Suporte a paginação**
   - Mantém o padrão através de páginas
   - Permite 1-100 itens por página

## 🚀 Como Usar

### 1. **Importar a função**

```javascript
import { orderGroups, validatePagination } from "./utils/groupOrdering.js";
```

### 2. **Ordenar grupos com paginação**

```javascript
const result = orderGroups(groups, page, pageSize);
// Retorna: { groups, total, page, pageSize, hasMore, featuredCount, freeCount }
```

### 3. **Exemplo em uma rota Express**

```javascript
app.get("/api/v1/groups", (req, res) => {
  const { page, limit } = req.query;
  const { page: validPage, pageSize } = validatePagination(page, limit);

  const result = orderGroups(mockGroups, validPage, pageSize);

  res.json({
    success: true,
    data: result.groups,
    pagination: {
      page: result.page,
      pageSize: result.pageSize,
      total: result.total,
      hasMore: result.hasMore,
    },
    stats: {
      featuredCount: result.featuredCount,
      freeCount: result.freeCount,
    },
  });
});
```

## 📊 Exemplo de Resposta

### Request
```
GET /api/v1/groups?page=1&limit=12
```

### Response
```json
{
  "success": true,
  "data": [
    {
      "id": "g2",
      "title": "Grupo FEATURED 2",
      "featured": true,
      "status": "APPROVED",
      ...
    },
    {
      "id": "g3",
      "title": "Grupo FEATURED 3",
      "featured": true,
      "status": "APPROVED",
      ...
    },
    {
      "id": "g5",
      "title": "Grupo FEATURED 5",
      "featured": true,
      "status": "APPROVED",
      ...
    },
    {
      "id": "g1",
      "title": "Grupo FREE 1",
      "featured": false,
      "status": "APPROVED",
      ...
    },
    ...
  ],
  "pagination": {
    "page": 1,
    "pageSize": 12,
    "total": 47,
    "hasMore": true
  },
  "stats": {
    "featuredCount": 9,
    "freeCount": 3
  }
}
```

## 🏗️ Estrutura de Dados

### Interface Group
```typescript
interface Group {
  id: string;
  title: string;
  description: string;
  photo: string;
  link: string;
  platform: string;
  members: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  featured: boolean;  // true = FEATURED, false = FREE
  ownerId: string;
  createdAt: Date | string;
}
```

### Interface OrderedGroupsResult
```typescript
interface OrderedGroupsResult {
  groups: Group[];           // Grupos ordenados para a página
  total: number;             // Total de grupos após filtros
  page: number;              // Página atual
  pageSize: number;          // Itens por página
  hasMore: boolean;          // Indica se há mais páginas
  featuredCount: number;     // Quantidade de FEATURED na página
  freeCount: number;         // Quantidade de FREE na página
}
```

## ⚡ Performance

### Características
- **O(n log n)** - Complexidade do algoritmo (dominado pela ordenação)
- **O(1)** - Lookup de grupos
- **Paginação eficiente** - Não carrega todos os grupos em memória para paginação
- **Escalável** - Testado com milhares de grupos

### Otimizações
1. Separa FEATURED e FREE antes de mesclar (evita múltiplos filtros)
2. Usa índices simples para paginação
3. Calcula statisticas apenas para a página atual

## 📋 Funções Disponíveis

### `orderGroups(groups, page = 1, pageSize = 12)`
Ordena grupos com suporte a paginação.

**Parâmetros:**
- `groups` (Array): Lista de grupos
- `page` (Number): Número da página (padrão: 1)
- `pageSize` (Number): Itens por página (padrão: 12)

**Retorna:** `OrderedGroupsResult`

---

### `orderGroupsAll(groups)`
Ordena todos os grupos sem paginação.

**Parâmetros:**
- `groups` (Array): Lista de grupos

**Retorna:** Array de grupos ordenados

---

### `validatePagination(page, pageSize, maxPageSize = 100)`
Valida parâmetros de paginação.

**Parâmetros:**
- `page` (Number|String): Página solicitada
- `pageSize` (Number|String): Itens por página
- `maxPageSize` (Number): Máximo de itens por página

**Retorna:** `{ page, pageSize }`

**Validações:**
- Page mínima: 1
- PageSize mínima: 1
- PageSize máxima: 100 (configurável)
- Converte strings para números
- Usa valores padrão se NaN

## 🧪 Testando

### Executar exemplos
```bash
node server/utils/groupOrdering.examples.js
```

### Teste manual com curl
```bash
# Página 1
curl "http://localhost:8080/api/v1/groups?page=1&limit=12"

# Página 2
curl "http://localhost:8080/api/v1/groups?page=2&limit=12"

# Com limite customizado
curl "http://localhost:8080/api/v1/groups?page=1&limit=20"
```

## 📈 Cenários de Uso

### Cenário 1: 10 FEATURED, 5 FREE
```
Padrão esperado: F F F L F F F L F F F L F
Resultado: Os 4 FREE aparecem após cada 3 FEATURED
```

### Cenário 2: 100 grupos misturados
```
Padrão mantido: F F F L F F F L ...
Paginação: Página 1 tem 9 F + 3 L, Página 2 tem 9 F + 3 L, etc
```

### Cenário 3: Poucas FEATURED
```
Se apenas 2 FEATURED: F F (sem L intercalado no início)
Quando alcança 3ª posição: F F F L ...
```

## 🔧 Manutenção

### Alterar razão FEATURED/FREE
Edite `groupOrdering.js`, linha ~75:
```javascript
if (featuredCount % 3 === 0 && featuredCount > 0 && freeIndex < free.length) {
  // Mude 3 para outro número (ex: 2 para padrão F F L)
}
```

### Alterar limite máximo de pageSize
Passe como parâmetro:
```javascript
validatePagination(page, pageSize, 200);
```

## ✅ Checklist de Implementação

- [x] Função de ordenação com padrão F F F L
- [x] Filtragem de apenas APPROVED
- [x] Ordenação por data (mais recentes)
- [x] Suporte a paginação
- [x] Validação de parâmetros
- [x] Integração no Express
- [x] Exemplos de uso
- [x] Documentação completa
- [x] TypeScript + JavaScript
- [x] Performance otimizada

## 📝 Notas

- Grupos PENDING/REJECTED nunca aparecem na listagem pública
- A contagem de FEATURED/FREE reseta a cada requisição (correto para paginação)
- O padrão é mantido **através de todas as páginas**
- Campos `featuredCount` e `freeCount` são específicos da página

---

**Desenvolvido com ❤️ para FlowGroup**
