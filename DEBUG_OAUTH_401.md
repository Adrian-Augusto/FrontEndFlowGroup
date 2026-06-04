# 🐛 Debugging: Erro 401 Após OAuth

## Problema Observado
```
[authService] Buscando perfil do usuário...
[axiosClient] Request: { hasAuthHeader: false, withCredentials: true }
Failed to load resource: the server responded with a status of 401
```

**Significado**: Backend rejeitou a requisição (sem token + sem cookie válido)

---

## ✅ Checklist de Debugging

### 1. Verificar Cookie no Browser
```javascript
// No Console (F12):
console.log("Cookies:", document.cookie);
```

**Esperado**: Deve conter algo como:
```
sessionId=abc123; connect.sid=xyz789
```

**Se vazio** → Backend não está setando cookie

---

### 2. Verificar Network Tab
1. Abrir DevTools (F12) > Network tab
2. Fazer login com Google
3. Procurar por requisição a `/auth/google/profile`
4. Verificar:

**Request Headers:**
```
GET /api/v1/auth/google/profile
Cookie: [deve ter cookie aqui]
```

**Response Headers:**
```
Set-Cookie: sessionId=...; HttpOnly; SameSite=Lax; Path=/
```

---

### 3. Verificar CORS no Backend
```javascript
// Backend deve ter:
res.setHeader("Access-Control-Allow-Credentials", "true");
res.setHeader("Access-Control-Allow-Origin", "https://frontend.com");
```

**Se CORS está errado** → Cookie é rejeitado pelo navegador

---

### 4. Verificar Redirect do Backend
Quando você clica "Login com Google":

1. Frontend redireciona para: `backend/auth/google`
2. Backend deve redirecionar para: `frontend/auth/callback`

**Verificar**: Network tab > `/auth/google` > Response
- [ ] Status: 302 (redirect)
- [ ] Location header: aponta para frontend

---

### 5. Verificar Cookie do Google
```javascript
// No Console após login com Google:
document.cookie; // Deve ter cookies novos
```

---

## 🔧 Soluções

### Solução 1: Backend retorna Token em URL
```javascript
// Backend retorna:
/auth/callback?token=eyJhbGc...

// Frontend armazena:
authService.setAccessToken(token) // → sessionStorage
```

**Vantagem**: Sem dependência de cookie  
**Desvantagem**: Token na URL (mas limpo depois)

### Solução 2: Usar Cookie HttpOnly corretamente
```javascript
// Backend:
res.cookie("sessionId", token, {
  httpOnly: true,
  sameSite: "lax", // or "strict"
  secure: true,    // https only
  path: "/"
});

// Frontend: withCredentials: true
```

**Vantagem**: Seguro, não na URL  
**Desvantagem**: Precisa CORS correto

### Solução 3: Hybrid (Recomendado)
```
1. Backend retorna cookie HttpOnly
2. Backend também retorna token em URL (?token=...)
3. Frontend armazena token em sessionStorage
4. Token em localStorage como backup
5. Fallback: se nenhum token, usa cookie
```

---

## 📝 Teste Rápido

### Passo 1: Verificar Token na URL
```
Após login com Google, URL deve ser:
/auth/callback?token=eyJhbGc...

Se não tiver ?token=, o backend não está retornando token
```

### Passo 2: Verificar Cookie
```javascript
// No console:
document.cookie
// Deve ter algo que não estava antes
```

### Passo 3: Verificar Request
```javascript
// No Network tab:
GET /api/v1/auth/google/profile

Headers devem conter:
- Cookie: [cookie aqui]
OU
- Authorization: Bearer [token aqui]
```

---

## 🚀 Próximos Passos

### Se Token vem na URL
1. AuthCallbackPage já extrai (`tokenParam`)
2. Armazena em sessionStorage
3. Interceptor usa Bearer token
4. ✅ Funciona

### Se Token NÃO vem na URL
1. Verificar cookie em `document.cookie`
2. Se cookie existe:
   - Problema é CORS
   - Contatar backend dev
3. Se cookie NÃO existe:
   - Backend não está setando cookie
   - Contatar backend dev

### Se ambos faltam
1. Backend não está retornando nada
2. Google OAuth pode estar misconfigured
3. Contatar backend dev

---

## 📊 Checklist de Verificação

Backend:
- [ ] Google OAuth ID/Secret configurados
- [ ] Redirect URI correto
- [ ] CORS correto
- [ ] Cookie HttpOnly sendo setado
- [ ] OU token em URL sendo retornado
- [ ] /auth/google/profile aceitando cookie

Frontend:
- [ ] withCredentials: true (sem token)
- [ ] withCredentials: false (com token)
- [ ] Cookie recebido no browser
- [ ] Token em URL extraído
- [ ] sessionStorage preenchido

---

## 🎯 Resultado Esperado

```
✅ Login com Google
✅ Redireciona para /auth/callback
✅ Token em sessionStorage OU Cookie no browser
✅ authService.getAccessToken() retorna token
✅ Requisição com Authorization: Bearer <token>
✅ Backend retorna 200 com perfil
✅ Usuário logado
```

---

## 💡 Dica: Forçar Teste

Se você quer testar sem fazer login novamente:

```javascript
// No console:
sessionStorage.setItem("accessToken", "seu_token_aqui");
window.location.href = "/";
```

Isso vai simular um token e testar o resto do fluxo.
