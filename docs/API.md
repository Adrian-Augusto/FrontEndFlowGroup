# OctoGrupos — API Backend

## Modelo GroupPost (grupo externo)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `title` | string | Título do post |
| `description` | string | Texto explicativo |
| `photo` | string (URL) | Capa — upload no POST |
| `link` | string (URL) | Invite WhatsApp, Telegram, Discord… |
| `platform` | string | `whatsapp`, `telegram`, `discord`, … |
| `status` | enum | `pending` \| `approved` \| `rejected` |
| `members` | number? | Estimativa opcional |

## POST /api/v1/groups

**Content-Type:** `multipart/form-data`  
**Auth:** cookie `access_token` (HttpOnly)

| Campo | Obrigatório |
|-------|-------------|
| `title` | sim |
| `description` | não |
| `link` | sim |
| `platform` | sim |
| `photo` | não (jpeg/png/webp) |

Resposta `201`:

```json
{
  "data": {
    "id": "uuid",
    "title": "...",
    "description": "...",
    "photo": "https://cdn.../covers/abc.jpg",
    "link": "https://chat.whatsapp.com/...",
    "platform": "whatsapp",
    "status": "pending"
  }
}
```

O backend processa o arquivo, persiste URL pública e **não** devolve o binário.

## Autenticação

Cookies HttpOnly — ver seção anterior no README. Todas as rotas autenticadas: `credentials: include`.

## Plataformas

`GET /api/v1/platforms` → lista para filtros no frontend.
