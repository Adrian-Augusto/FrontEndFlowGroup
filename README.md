# OctoGrupos

Catálogo de grupos externos (WhatsApp, Telegram…) com **destaques públicos no topo** (anúncio) e login Google real.

## Setup rápido

1. Copie o ambiente:

```bash
cp .env.example .env
```

2. Backend TypeScript na **porta 8080** (OAuth Google configurado no servidor).

3. `.env` do frontend:

```env
VITE_API_URL=/api/v1
VITE_USE_MOCK=false
VITE_PROXY_TARGET=http://localhost:8080
```

4. Dois terminais:

```bash
npm install
# seu backend TS → http://localhost:8080
npm run dev       # App → http://localhost:5173 (proxy /api → :8080)
```

5. Teste: http://localhost:8080/api/health (ou rota equivalente no backend)

## Destaques vs planos

- **Grupos em destaque** na home são **públicos** (todos veem).
- **Planos** Semanal/Mensal = você **anuncia** seu grupo nesse espaço (não é paywall).

## Rotas

| Rota | Descrição |
|------|-----------|
| `/` | Home + destaques + catálogo |
| `/planos` | Contratar anúncio no topo |
| `/login` | Google → `GET /api/v1/auth/google` |
| `/auth/callback` | Após OAuth → `GET /api/v1/auth/google/profile` |
| `/admin` | Login admin (só nesta rota) |
