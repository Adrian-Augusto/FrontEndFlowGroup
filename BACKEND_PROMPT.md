# Prompt para Ajustar Backend - Endpoint POST /api/v1/groups

Compartilhe este prompt com o dev do backend para ajustar a API conforme o frontend está enviando:

---

## 📋 PROMPT PARA O BACKEND

```
Preciso que você altere o endpoint POST /api/v1/groups para aceitar e processar 
os seguintes campos:

### BODY (FormData ou JSON)

**Campos Obrigatórios:**
- `name` (string) - Nome/título do grupo
- `description` (string) - Descrição do grupo
- `categoryId` (string) - ID da categoria do grupo

**Campos Opcionais:**
- `link` (string, URL) - Link do grupo (WhatsApp, Telegram, etc)
- `platform` (string) - Plataforma: "whatsapp", "telegram", "discord", etc
- `photo` (file) - Imagem/foto de capa do grupo (jpeg, png, webp)

### IMPLEMENTAÇÃO

1. **Validações:**
   - `name` é obrigatório e deve ser string não-vazio
   - `description` é obrigatório e deve ser string
   - `categoryId` é obrigatório e deve existir na tabela/collection de categorias
   - `link` deve ser URL válida se fornecido
   - `platform` deve estar na lista de plataformas válidas se fornecido
   - `photo` deve ser imagem válida (jpeg/png/webp) se fornecido

2. **Processamento:**
   - Se `photo` for enviado, fazer upload e armazenar a URL
   - Salvar o grupo com status "pending" (aguardando aprovação admin)
   - Associar o grupo ao usuário autenticado (createdBy)
   - Retornar o grupo criado com todos os campos

3. **Response (201 Created):**
```json
{
  "id": "group-uuid",
  "name": "Grupo de Tecnologia",
  "description": "Grupo para discutir tecnologia",
  "categoryId": "cat-tech",
  "link": "https://chat.whatsapp.com/...",
  "platform": "whatsapp",
  "photo": "https://...",
  "status": "pending",
  "createdAt": "2024-01-01T10:00:00Z",
  "createdBy": {
    "id": "user-id",
    "name": "User Name",
    "email": "user@email.com"
  },
  "members": 0
}
```

4. **Errors:**
   - 400 Bad Request - Se campos obrigatórios faltarem ou forem inválidos
   - 401 Unauthorized - Se usuário não estiver autenticado
   - 404 Not Found - Se categoryId não existir
   - 422 Unprocessable Entity - Se photo for formato inválido

### IMPORTANTE

- O endpoint deve aceitar **FormData** (multipart/form-data) para upload de arquivo
- O usuário deve estar autenticado (via token Bearer ou cookie)
- Não remova campos antigos se houver, apenas adicione suporte aos novos
- O campo `photo` é opcional - grupo pode ser criado sem foto
- Os campos `link` e `platform` são informativos/opcionais
```

---

## 🔗 ROTAS RELACIONADAS

**GET /api/v1/categories** - Listar categorias disponíveis
```json
[
  {
    "id": "cat-tech",
    "name": "Tecnologia",
    "description": "Grupos de tecnologia e programação"
  },
  {
    "id": "cat-business",
    "name": "Negócios",
    "description": "Grupos de negócios"
  }
]
```

---

## ✅ CHECKLIST

Após implementar, verifique se:

- [ ] O endpoint aceita FormData com arquivo
- [ ] Valida campos obrigatórios (name, description, categoryId)
- [ ] Retorna 201 com o grupo criado
- [ ] Retorna erros apropriados (400, 401, 404, 422)
- [ ] A foto é salva corretamente
- [ ] O grupo é associado ao usuário autenticado
- [ ] O status inicial é "pending"
- [ ] O endpoint está documentado no Swagger/OpenAPI

---

## 🧪 TESTE

Depois de implementar, o frontend vai testar com:
```
POST http://localhost:8080/api/v1/groups

FormData:
- name: "Grupo de Tecnologia"
- description: "Grupo para discutir tecnologia"
- categoryId: "cat-tech"
- link: "https://chat.whatsapp.com/..."
- platform: "whatsapp"
- photo: [File object]
```

Esperado: 201 Created com o grupo no response.
```
