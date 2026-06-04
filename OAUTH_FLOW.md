# Fluxo OAuth2 Google - Implementação Frontend Segura

## 🎯 Visão Geral

Frontend **NÃO processa o OAuth code**. Isso é responsabilidade exclusiva do backend.

**Fluxo seguro:**
1. Usuário clica "Login com Google"
2. Frontend redireciona para: `backend.com/api/v1/auth/google`
3. Backend autentica com Google
4. Backend retorna para: `frontend.com/auth/callback` (com token ou cookie)
5. Frontend lê token pronto e busca perfil do backend

---

## 🔄 Fluxo Completo

### Step 1: Usuário Clica em "Login com Google"
```jsx
// LoginPage.jsx
const handleGoogleLogin = () => {
  startGoogleLogin("/"); // Redireciona para /auth/callback após sucesso
};

// AuthContext.jsx - startGoogleLogin()
const startGoogleLogin = useCallback((returnPath = "/") => {
  const loginUrl = getGoogleLoginUrl(returnPath);
  window.location.href = loginUrl; // ← Redireciona para BACKEND
}, []);
```

**URL gerada:** `https://backend.com/api/v1/auth/google?redirect=https://frontend.com/auth/callback`

### Step 2: Backend Processa OAuth com Google

Backend:
1. Recebe redirect de `/api/v1/auth/google`
2. Redireciona usuário para Google
3. Usuário autentica em Google
4. Google redireciona de volta ao backend com `code`
5. Backend troca `code` por ID Token + Access Token
6. Backend cria sessão (HttpOnly cookie OU gera JWT)
7. Backend redireciona para frontend: `/auth/callback?token=JWT_AQUI`

### Step 3: Frontend Recebe Callback

```jsx
// AuthCallbackPage.jsx
const params = new URLSearchParams(window.location.search);
const tokenParam = params.get("token");

// Se backend enviou token, armazena
if (tokenParam) {
  authService.setAccessToken(tokenParam); // ← sessionStorage
}

// URL limpa imediatamente (remove token da URL)
window.history.replaceState({}, document.title, window.location.pathname);

// Busca perfil do backend
const user = await refreshProfile();
navigate("/"); // ← Login completado
```

### Step 4: Requisições Subsequentes

```jsx
// axiosClient.js - Interceptor
function getAccessToken() {
  return sessionStorage.getItem("accessToken"); // ← Token seguro
}

httpClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`; // ← Envia token
  }
  return config;
});
```

---

## 🔐 Segurança Implementada

### ✅ Token Storage
- **sessionStorage** (não localStorage)
  - Limpo quando aba fecha
  - Não acessível entre abas/domínios
  - Melhor proteção contra XSS se o backend usar HttpOnly cookie

### ✅ URL Limpeza Imediata
```javascript
// Após capturar token, limpa URL em <100ms
window.history.replaceState({}, document.title, window.location.pathname);
```
- Impede que token fique exposto no histórico
- Impede reload que resgataria token expirado

### ✅ Interceptor Automático
```javascript
// Bearer token adicionado automaticamente a TODA requisição
Authorization: Bearer <token>
```

### ✅ Logout em 401/403
```javascript
// axiosClient.js
if (error.response?.status === 401 && !skipLogout) {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
  // AuthContext escuta e limpa sessão
}
```

---

## 📁 Arquivos Relevantes

### `src/api/axiosClient.js`
- Configura baseURL
- Interceptor: adiciona Bearer token
- Trata 401/403 → logout automático
- **IMPORTANTE**: Lê token de `sessionStorage` (não localStorage)

### `src/auth/authService.js`
- Gerencia token em sessionStorage
- Gerencia usuário em memória
- Métodos: `setAccessToken()`, `getAccessToken()`, `clearSession()`

### `src/context/AuthContext.jsx`
- `startGoogleLogin()`: Redireciona para backend
- `refreshProfile()`: Busca usuário após OAuth
- Escuta `AUTH_LOGOUT_EVENT` → limpa sessão

### `src/pages/AuthCallbackPage.jsx`
- Página de destino após OAuth
- Extrai token de ?token= query param
- Limpa URL imediatamente
- Busca perfil e redireciona para home

### `src/pages/LoginPage.jsx`
- Botão "Login com Google"
- Chama `startGoogleLogin()`

---

## 🚀 Fluxo Passo a Passo (Técnico)

```
USUÁRIO                 FRONTEND              BACKEND             GOOGLE
  │                        │                     │                   │
  ├─ clica Login ────────── useAuth()            │                   │
  │                        │                     │                   │
  │  window.location.href = getGoogleLoginUrl()  │                   │
  │  ┌──────────────────────────────────────────►│                   │
  │  │                      │                     ├─ redireciona ───►│
  │  │                      │                     │                   │
  │  │                      │                     │◄─ autentica ─────┤
  │  │                      │                     │                   │
  │  │  ┌────────────────────────────────────────┤ troca code/token ├─┐
  │  │  │                   │                 ┌──► gera JWT ou cookie
  │  │  │                   │                 │  │                   │
  │  │  │ AuthCallbackPage.jsx ◄──────────────┘  │                   │
  │  │  │ (url: /auth/callback?token=JWT)        │                   │
  │  │  │                   │                     │                   │
  │  │  │ 1. Extrai token   │                     │                   │
  │  │  │ 2. setAccessToken(token) → sessionStorage
  │  │  │ 3. window.history.replaceState() [limpa URL]
  │  │  │ 4. refreshProfile() ──────────────────►│ busca perfil      │
  │  │  │                   │◄──────────────────┤ retorna user       │
  │  │  │ 5. navigate("/")  │                     │                   │
  │  └──┴─ home page ◄──────┴─                    │                   │
  │
  ├─ requisição ──────────► getAccessToken()     │
  │                        Authorization: Bearer  │
  │                        ├─────────────────────►│
  │                        │◄─────────────────────┤ resposta
  └────────────────────────┘                     │
```

---

## 🛠 Debugging

### Token não aparece em requisições?
```javascript
// No console
sessionStorage.getItem("accessToken") // Deve ter valor
// Ou verificar Network tab > Request Headers > Authorization
```

### Página de callback fica loading?
```javascript
// AuthCallbackPage.jsx - adicionar debug
console.log("[AuthCallbackPage] Token param:", tokenParam);
console.log("[AuthCallbackPage] Stored token:", authService.getAccessToken());
console.log("[AuthCallbackPage] Calling refreshProfile()");
```

### Logout automático?
```javascript
// AuthContext.jsx escuta AUTH_LOGOUT_EVENT
// Acionado por axiosClient quando 401 ou 403
// Verificar Network tab > Response Status
```

### "Código ausente" - DESCONTINUADO
❌ Este erro não deve mais ocorrer
- Frontend não processa "code"
- Backend que trata o "code" de Google
- Frontend apenas recebe token pronto

---

## ✅ Checklist de Implementação

- [x] Frontend redireciona para backend `/auth/google`
- [x] Backend retorna para frontend `/auth/callback?token=...`
- [x] Frontend extrai token de query params
- [x] Token armazenado em sessionStorage (seguro)
- [x] URL limpada imediatamente
- [x] Interceptor adiciona Bearer token
- [x] 401/403 dispara logout automático
- [x] Session persiste na memória + sessionStorage
- [x] Logout limpa tudo

---

## 📚 Referências

- OAuth2 Authorization Code Flow: https://tools.ietf.org/html/rfc6749#section-1.3.1
- OWASP: Secure Storage in Browser: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- HttpOnly Cookies vs Tokens: https://auth0.com/blog/auth-best-practices/
