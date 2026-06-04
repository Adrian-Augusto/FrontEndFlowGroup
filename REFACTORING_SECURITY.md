# Refatoração de Segurança - Autenticação & Autorização

## Resumo das Mudanças

Esta refatoração foca em melhorar a segurança da aplicação frontend em autenticação, autorização, armazenamento de credenciais, validação de URLs e prevenção de ataques comuns.

---

## 1. ARMAZENAMENTO DE TOKENS (Crítico)

### ✅ ANTES (Inseguro)
```javascript
// ❌ localStorage é acessível por qualquer script
localStorage.setItem("accessToken", token);
```

### ✅ DEPOIS (Seguro)
```javascript
// ✅ sessionStorage é mais seguro (limpo ao fechar aba)
// ✅ Não acessível de outras abas/janelas
sessionStorage.setItem("accessToken", token);
```

**Benefícios:**
- sessionStorage é limpo automaticamente quando a aba do navegador fecha
- Não é compartilhado entre abas/janelas (mais seguro para múltiplas sessões)
- Ainda resistente a XSS se houver CSP configurado no backend
- Recomendado: Use cookies HttpOnly no backend como primeira linha de defesa

**Arquivos Alterados:**
- `src/auth/authService.js` - Novo `tokenStorage` com sessionStorage
- `src/api/axiosClient.js` - Lê token de sessionStorage ao invés de localStorage

---

## 2. PROTEÇÃO CONTRA OPEN REDIRECT (Crítico)

### ✅ ANTES (Vulnerável)
```javascript
// ❌ Aceita qualquer URL do estado
const from = location.state?.from ?? "/";
navigate(from);
```

### ✅ DEPOIS (Protegido)
```javascript
// ✅ Valida URL antes de usar
import { isSafeRedirectUrl } from "../utils/securityValidators";

const from = (() => {
  const fromPath = location.state?.from;
  if (isSafeRedirectUrl(fromPath)) {
    return fromPath;
  }
  return "/";
})();
```

**Proteção contra:**
- `//evil.com` - Protocol-relative URLs
- `javascript:alert()` - Protocol handlers
- `http://evil.com` - External redirects
- URLs com caracteres perigosos

**Arquivos Alterados:**
- `src/utils/securityValidators.js` - Novo arquivo com validators
- `src/pages/LoginPage.jsx` - Usa `isSafeRedirectUrl()`
- `src/pages/AuthCallbackPage.jsx` - Usa `escapeHtml()` para error param

---

## 3. SANITIZAÇÃO DE URLS DE AVATAR (XSS Prevention)

### ✅ ANTES (Vulnerável a XSS)
```javascript
// ❌ Aceita qualquer URL
return {
  avatarUrl: typeof avatarUrl === "string" ? avatarUrl : null,
};
```

### ✅ DEPOIS (Protegido)
```javascript
// ✅ Valida e sanitiza URL
avatarUrl = sanitizeImageUrl(avatarUrl);

return {
  avatarUrl: avatarUrl || null, // Agora é seguro
};
```

**Proteção contra:**
- `javascript:alert()` - XSS via protocol handler
- `data:text/html,<script>` - XSS via data URL
- URLs de outros protocolos que não HTTPS
- URLs de domínios não confiáveis

**Domínios Confiados (Whitelist):**
- `lh3.googleusercontent.com` - Google avatars
- `avatars.githubusercontent.com` - GitHub avatars
- `gravatar.com` - Gravatar
- `/uploads/` - Imagens da aplicação

**Arquivos Alterados:**
- `src/utils/userNormalize.js` - Nova função `sanitizeAvatarUrl()`
- `src/utils/securityValidators.js` - Função reutilizável `sanitizeImageUrl()`
- Usa `sessionStorage` ao invés de `localStorage`

---

## 4. TRATAMENTO DE ERROS 401/403 (Autorização)

### ✅ ANTES
```javascript
// ❌ Apenas 401 era tratado
if (error.response?.status === 401 && !skipLogout) {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}
```

### ✅ DEPOIS
```javascript
// ✅ 401 (não autenticado) e 403 (não autorizado) disparam logout
if (error.response?.status === 401 && !skipLogout) {
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}

if (error.response?.status === 403 && !skipLogout) {
  console.warn("[axiosClient] Access forbidden (403) - logging out");
  window.dispatchEvent(new CustomEvent(AUTH_LOGOUT_EVENT));
}
```

**Por que 403 também faz logout:**
- Significa que o usuário está autenticado mas não tem permissão
- Pode indicar que permissões foram revogadas no backend
- Recomendado fazer logout para sincronizar estado

**Arquivo Alterado:**
- `src/api/axiosClient.js` - Novo tratamento para 403

---

## 5. VALIDAÇÃO DE ROTAS PROTEGIDAS

### ✅ ProtectedRoute
```javascript
// Valida autenticação E autorização
if (!authService.isAuthenticated() || !user) {
  return <Navigate to="/login" state={{ from: location.pathname }} />;
}

if (requireAdmin && !isAdmin) {
  return <Navigate to="/" />;
}
```

**Recurso:**
- Preserva path intendido em `from` state
- Redireciona para `/login` se não autenticado
- Redireciona para `/` se admin obrigatório

**Arquivo Alterado:**
- `src/components/ProtectedRoute.jsx` - Documentação melhorada

### ✅ AdminRoute
```javascript
// Valida autenticação E role admin
if (!authService.isAuthenticated() || !user || !isAdmin) {
  return <AdminLoginPage />;
}
```

**Recurso:**
- Mostra login administrativo em vez de redirecionar
- Valida consistência entre `authService` e `useAuth()`

**Arquivo Alterado:**
- `src/components/AdminRoute.jsx` - Documentação melhorada

---

## 6. LIMPEZA DE TOKENS NA URL

### ✅ Implementado em páginas de callback
```javascript
// Remove tokens/params da URL imediatamente após capturar
window.history.replaceState({}, document.title, window.location.pathname);
```

**Páginas Protegidas:**
- `src/pages/LoginSuccessPage.jsx`
- `src/pages/AuthCallbackPage.jsx`

**Proteção contra:**
- Tokens visíveis na barra de endereço
- Bookmarking/sharing de URLs com tokens
- Logs de histórico com tokens

---

## 7. NOVO UTILITÁRIO: securityValidators.js

Criado arquivo centralizado com funções de validação reutilizáveis:

```javascript
// Validação de URLs de redirect
isSafeRedirectUrl(url) 

// Sanitização de URLs de imagem/avatar
sanitizeImageUrl(url)

// Validação de URLs externas
isValidExternalUrl(url)

// Escape de HTML para prevenir XSS
escapeHtml(text)

// Sanitização de texto de usuário
sanitizeUserText(text)

// Validação de email
isValidEmail(email)

// Detecção de padrões XSS suspeitos
isSuspiciousJson(value)
```

---

## 8. LOGS DE DEBUG SEGURO

### ✅ Antes
```javascript
// ❌ Loga dados sensíveis
console.error("API Error:", {
  data: error.response?.data, // Pode conter tokens/senhas
});
```

### ✅ Depois
```javascript
// ✅ Loga apenas informações seguras
console.error("API Error:", {
  status: error.response?.status,
  statusText: error.response?.statusText,
  url: error.config?.url,
  method: error.config?.method,
  message: error.message,
});
```

**Arquivo Alterado:**
- `src/api/axiosClient.js` - Logs sem dados sensíveis

---

## FLUXO DE AUTENTICAÇÃO (Seguro)

```
1. Usuário clica "Login com Google"
   ↓
2. startGoogleLogin(from) é chamado
   - URL é validada com isSafeRedirectUrl()
   - window.location.href = getGoogleLoginUrl(from)
   ↓
3. Backend (Render) processa OAuth
   - Backend gera token/cookie HttpOnly
   - Redireciona para /auth/callback
   ↓
4. AuthCallbackPage:
   - Limpa URL imediatamente (replaceState)
   - Captura e sanitiza parametro 'error' (se houver)
   - Chama refreshProfile() via AuthContext
   - Backend valida cookie HttpOnly
   - Token não é passado na URL
   ↓
5. Token armazenado:
   - authService.login() armazena em sessionStorage
   - NÃO em localStorage (mais seguro)
   ↓
6. Requisições API:
   - axiosClient lê token de sessionStorage
   - Adiciona header Authorization: Bearer <token>
   - Se 401/403, dispara AUTH_LOGOUT_EVENT
   ↓
7. Logout:
   - authService.logout() chama backend (com cookie)
   - Remove token de sessionStorage
   - Limpa memoryUser
   - AuthContext sincroniza estado
```

---

## FLUXO DE ROTAS PROTEGIDAS

```
ProtectedRoute (requireAdmin = false)
  ↓
  loading? → Mostra "Carregando..."
  ↓
  !authService.isAuthenticated()? → /login (com from=path)
  ↓
  requireAdmin && !isAdmin? → /
  ↓
  render children
```

```
AdminRoute
  ↓
  loading? → Mostra "Carregando..."
  ↓
  !authService.isAuthenticated()? → AdminLoginPage
  ↓
  !isAdmin? → AdminLoginPage
  ↓
  <Outlet />
```

---

## CHECKLIST DE SEGURANÇA

- ✅ Tokens em sessionStorage (não localStorage)
- ✅ Tokens removidos da URL (replaceState)
- ✅ Open redirect prevenido (isSafeRedirectUrl)
- ✅ XSS em URLs de avatar prevenido (sanitizeImageUrl)
- ✅ XSS em parametros de erro prevenido (escapeHtml)
- ✅ 401 dispara logout
- ✅ 403 dispara logout
- ✅ Rotas protegidas validam auth + user
- ✅ Logs sem dados sensíveis
- ✅ Error param sanitizado
- ✅ Whitelist de domínios para avatars
- ✅ sessionStorage para avatar fallback
- ✅ Proteção contra path traversal

---

## RECOMENDAÇÕES ADICIONAIS (Backend)

1. **HttpOnly Cookies**
   - Defina o cookie de sessão com flag HttpOnly
   - Evita acesso via JavaScript
   - É a primeira linha de defesa

2. **Secure Cookies**
   - Use flag Secure em produção (HTTPS only)

3. **SameSite**
   - Use `SameSite=Strict` ou `SameSite=Lax`
   - Protege contra CSRF

4. **Refresh Token**
   - Implemente refresh token com expiry curto
   - Access token com expiry ainda mais curto (opcional)

5. **Rate Limiting**
   - Rate limit em /auth/login
   - Rate limit em /auth/google endpoints

6. **CORS**
   - Configure CORS apenas para origem da app
   - Não use `*` em produção

---

## TESTES RECOMENDADOS

### Teste de Open Redirect
```javascript
// Estes devem ser bloqueados:
navigate("/login", { state: { from: "//evil.com" } })
navigate("/login", { state: { from: "javascript:alert()" } })
navigate("/login", { state: { from: "http://evil.com" } })

// Estes devem funcionar:
navigate("/login", { state: { from: "/" } })
navigate("/login", { state: { from: "/perfil" } })
```

### Teste de XSS em Avatar
```javascript
// Estes devem ser bloqueados:
normalizeUser({ profileImage: "javascript:alert()" })
normalizeUser({ profileImage: "data:text/html,<script>" })
normalizeUser({ profileImage: "http://evil.com/x.jpg" })

// Estes devem funcionar:
normalizeUser({ profileImage: "https://lh3.googleusercontent.com/x" })
normalizeUser({ profileImage: "/uploads/avatar.jpg" })
```

### Teste de Logout em 403
```javascript
// Mock API que retorna 403
// Verificar que AUTH_LOGOUT_EVENT é disparado
// Verificar que useAuth().user é null após
```

---

## Arquivos Alterados

1. ✅ `src/auth/authService.js` - tokenStorage com sessionStorage
2. ✅ `src/api/axiosClient.js` - sessionStorage + 403 handling
3. ✅ `src/utils/userNormalize.js` - sanitizeAvatarUrl() + sessionStorage
4. ✅ `src/utils/securityValidators.js` - Novo arquivo
5. ✅ `src/pages/LoginPage.jsx` - isSafeRedirectUrl()
6. ✅ `src/pages/AuthCallbackPage.jsx` - escapeHtml() + replaceState
7. ✅ `src/pages/LoginSuccessPage.jsx` - Logs melhorados
8. ✅ `src/context/AuthContext.jsx` - Logs melhorados
9. ✅ `src/components/ProtectedRoute.jsx` - Documentação + validações
10. ✅ `src/components/AdminRoute.jsx` - Documentação + validações

---

## Próximos Passos (Opcionais)

1. Implementar CSRF token se POST/PUT/DELETE sem auth
2. Implementar refresh token logic
3. Adicionar CSP headers (Content-Security-Policy)
4. Adicionar HSTS header (HTTP Strict-Transport-Security)
5. Implementar password hashing para admin login (bcrypt)
6. Adicionar 2FA/MFA
7. Implementar rate limiting no frontend
8. Adicionar error boundary melhorado
9. Implementar audit logging
10. Adicionar security headers via backend

---

## Suporte

Para dúvidas sobre a implementação, consulte os comentários no código ou revise os commits desta refatoração.
