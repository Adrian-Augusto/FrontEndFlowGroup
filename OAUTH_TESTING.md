# Guia de Testes - OAuth2 Google Frontend

## 🧪 Testes Manual End-to-End

### Teste 1: Fluxo Completo de Login

**Pré-requisitos:**
- Backend rodando em `https://allgrops.onrender.com` (ou localhost:8080)
- Frontend em `http://localhost:5173` (dev mode) ou produção
- Google OAuth configurado no backend

**Passos:**
1. Abrir console do navegador (F12)
2. Ir para página de login: `http://localhost:5173/login`
3. Clicar em "Login com Google"
4. **Esperado:** Redireciona para Google (URL começa com `accounts.google.com`)
5. Autenticar com Google
6. **Esperado:** Volta para `http://localhost:5173/auth/callback?token=...` (podem faltarVisível por <100ms)
7. **Esperado:** URL limpa automaticamente (sem token na URL)
8. **Esperado:** Redireciona para home (`/`)
9. **Esperado:** Usuário logado aparece (ex: foto + nome no menu)

**Verificações no Console:**
```javascript
// No console, verificar:
sessionStorage.getItem("accessToken")
// Deve retornar: string com JWT (começa com "eyJ...")

// Verificar memória do auth service
// (Abrir DevTools > React tab se tiver React DevTools instalado)
```

### Teste 2: Verificar Token em Requisições

**Passos:**
1. Fazer login (Teste 1)
2. Abrir DevTools (F12) > Network tab
3. Fazer qualquer ação autenticada (ex: clicar em "Meus Grupos")
4. Verificar requisição HTTP

**Esperado no Network:**
```
Headers > Request Headers:
Authorization: Bearer eyJhbGc...
```

### Teste 3: Token Limpo no Logout

**Passos:**
1. Fazer login (Teste 1)
2. Clicar em logout (avatar > Sair)
3. No console, verificar:
```javascript
sessionStorage.getItem("accessToken")
// Deve retornar: null
```

### Teste 4: 401 Dispara Logout Automático

**Pré-requisito:** Ter acesso ao backend para forçar 401

**Passos:**
1. Fazer login (Teste 1)
2. No console, remover token manual:
```javascript
sessionStorage.removeItem("accessToken")
```
3. Fazer requisição autenticada (ex: GET /api/v1/groups/me)
4. **Esperado:** Recebe 401
5. **Esperado:** Logout automático acontece
6. **Esperado:** Redireciona para `/login`

### Teste 5: Sessão Persiste (Tab Aberta)

**Passos:**
1. Fazer login (Teste 1)
2. Refresh a página (F5)
3. **Esperado:** Mantém login, sem redirecionar para login page
4. Verificar que usuário aparece no menu

### Teste 6: Sessão NÃO Persiste (Nova Tab)

**Passos:**
1. Fazer login em Tab 1 (Teste 1)
2. Abrir nova tab: `http://localhost:5173`
3. **Esperado:** Nova tab não está logada (sessionStorage é per-tab)
4. Refresh em Tab 1
5. **Esperado:** Tab 1 mantém login (authService.getUser() recupera da memória)

### Teste 7: Fechar Tab Limpa Token

**Passos:**
1. Fazer login (Teste 1)
2. Fechar a tab/navegador
3. Reabrir navegador
4. Ir para `http://localhost:5173`
5. **Esperado:** Não está logado (sessionStorage limpou)
6. **Esperado:** Redireciona para `/login` ou exibe como não autenticado

---

## 🐛 Debugging

### "Código ausente na URL" (DESCONTINUADO)

Se você vir esse erro:
- ❌ **Significa:** Frontend antigo tentando processar "code"
- ✅ **Solução:** Usar nova versão - frontend recebe token pronto do backend

### Token não aparece em requisições

**Causa Possível:** Token não está em sessionStorage

**Debug:**
```javascript
// Console
const token = sessionStorage.getItem("accessToken");
console.log("Token:", token);

// Se null ou undefined → token não foi armazenado
// Verificar AuthCallbackPage.jsx e authService.setAccessToken()
```

### Logout automático acontece imediatamente

**Causa Possível:** Token expirado ou inválido

**Debug:**
```javascript
// Console
const token = sessionStorage.getItem("accessToken");
console.log("Token:", token);

// Decodificar token (use site https://jwt.io)
// Verificar se "exp" (expires) já passou
```

### Backend retorna 500 em /auth/google

**Causa Possível:** 
- Google OAuth credentials não configuradas
- Redirect URI não está em backend whitelist

**Debug:**
```
Backend logs:
- Verificar se GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET estão set
- Verificar se FRONTEND_URL está correto (usado para redirect)
```

---

## 📊 Teste de Performance

### Tempo de Login

Usar DevTools > Performance:
1. Abrir DevTools > Performance tab
2. Clicar Record
3. Fazer login completo até home page
4. Clicar Stop
5. Analisar timeline

**Esperado:** <3 segundos total (incluindo network)

### Token Storage Speed

```javascript
console.time("setToken");
sessionStorage.setItem("accessToken", "token_aqui");
console.timeEnd("setToken");
// Esperado: <1ms
```

---

## ✅ Checklist de Validação

- [ ] Frontend redireciona para `/auth/google`
- [ ] Google OAuth popup/redirect funciona
- [ ] Backend retorna `?token=JWT` ou cookie
- [ ] Token armazenado em sessionStorage
- [ ] URL limpada (sem token visível)
- [ ] Interceptor adiciona Bearer token
- [ ] Requisições têm Authorization header
- [ ] 401 dispara logout automático
- [ ] Logout limpa sessionStorage
- [ ] sessionStorage + memória sincronizados
- [ ] Session não persiste entre abas
- [ ] Session limpa ao fechar tab
- [ ] Build sem erros
- [ ] No console errors/warnings

---

## 🔍 Ferramentas Úteis

### JWT Decoder (Browser Extension)
- https://chrome.google.com/webstore/detail/jwt-token-debugger
- Mostra claims do token diretamente no DevTools

### Network Monitor
- DevTools > Network tab
- Filtrar por "auth", "profile", etc.
- Verificar Headers e Status

### React DevTools
- https://chrome.google.com/webstore/detail/react-developer-tools
- Debugar AuthContext, props, state
- Ver atualização de `user` em tempo real

### Console Commands
```javascript
// Simular logout
sessionStorage.removeItem("accessToken");
window.dispatchEvent(new CustomEvent("auth:logout"));

// Verificar auth status
console.log({
  token: sessionStorage.getItem("accessToken"),
  user: window.localStorage.getItem("user"), // se houver
});

// Listar todos storage
console.log("sessionStorage:", Object.entries(sessionStorage));
```
