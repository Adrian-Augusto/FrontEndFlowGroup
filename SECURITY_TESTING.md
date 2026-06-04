# Testes de Segurança - Refatoração de Autenticação

Este documento lista todos os testes que devem ser realizados para validar as mudanças de segurança.

---

## 1. TESTES DE ARMAZENAMENTO DE TOKENS

### Teste 1.1: Token armazenado em sessionStorage
```
PROCEDIMENTO:
1. Fazer login com Google
2. Abrir Developer Tools → Application/Storage → Session Storage
3. Verificar se existe chave "accessToken"

ESPERADO:
✅ Token está em sessionStorage
❌ Token NÃO está em localStorage

FALLBACK:
Se houver erro, verificar console para ver se houver erro de token
```

### Teste 1.2: Token é removido ao fechar aba
```
PROCEDIMENTO:
1. Fazer login
2. Verificar sessionStorage tem token
3. Fechar a aba
4. Abrir nova aba e acessar a app
5. Verificar se está deslogado

ESPERADO:
✅ Usuário está deslogado (não há sessão)
✅ sessionStorage está vazio
```

### Teste 1.3: Tokens não compartilhados entre abas
```
PROCEDIMENTO:
1. Aba 1: Fazer login
2. Abrir Aba 2 no mesmo site
3. Verificar se sessionStorage tem token em cada aba

ESPERADO:
✅ Aba 1: tem token
✅ Aba 2: não tem token (cada aba tem sua própria sessionStorage)
```

---

## 2. TESTES DE PROTEÇÃO CONTRA OPEN REDIRECT

### Teste 2.1: Redirect válido funciona
```
PROCEDIMENTO:
1. Acessar: /login?from=/perfil
2. Fazer login com Google
3. Após sucesso, verificar se foi redirecionado para /perfil

ESPERADO:
✅ Redirecionado para /perfil
✅ URL é /perfil (não /login)
```

### Teste 2.2: Redirect externo é bloqueado
```
PROCEDIMENTO:
1. Acessar: /login (com state: { from: "//evil.com" })
2. Fazer login com Google
3. Verificar para onde foi redirecionado

ESPERADO:
✅ Redirecionado para / (home)
❌ NÃO redireciona para //evil.com ou evil.com
```

### Teste 2.3: Redirect com javascript protocol é bloqueado
```
PROCEDIMENTO:
1. Acessar: /login (com state: { from: "javascript:alert('xss')" })
2. Fazer login com Google
3. Verificar console para erros

ESPERADO:
✅ Redirecionado para / (home)
✅ Sem alert/XSS executado
❌ NÃO executa javascript
```

### Teste 2.4: Redirect com http:// é bloqueado
```
PROCEDIMENTO:
1. Acessar: /login (com state: { from: "http://evil.com" })
2. Fazer login com Google

ESPERADO:
✅ Redirecionado para / (home)
❌ NÃO redireciona para http://evil.com
```

---

## 3. TESTES DE SANITIZAÇÃO DE AVATAR URL

### Teste 3.1: Avatar do Google é aceito
```
PROCEDIMENTO:
1. Fazer login com Google (usando conta com foto)
2. Verificar header mostra avatar
3. Inspecionar elemento <img> de avatar
4. Verificar src é lh3.googleusercontent.com ou similar

ESPERADO:
✅ Avatar é exibido
✅ URL é de domínio confiado (google)
✅ Protocolo é HTTPS
```

### Teste 3.2: Avatar com javascript protocol é bloqueado
```
PROCEDIMENTO (Mock):
1. Simular: normalizeUser({ profileImage: "javascript:alert('xss')" })
2. Verificar resultado

ESPERADO:
✅ avatarUrl é null
❌ NÃO aceita javascript protocol
```

### Teste 3.3: Avatar com data URL é bloqueado
```
PROCEDIMENTO (Mock):
1. Simular: normalizeUser({ profileImage: "data:text/html,<script>alert('xss')</script>" })
2. Verificar resultado

ESPERADO:
✅ avatarUrl é null
❌ NÃO aceita data URLs
```

### Teste 3.4: Avatar com upload local é aceito
```
PROCEDIMENTO:
1. Usuário com foto em /uploads/avatar-123.jpg
2. Fazer login
3. Verificar header mostra avatar

ESPERADO:
✅ Avatar é exibido
✅ URL é /uploads/avatar-123.jpg (relativo)
```

---

## 4. TESTES DE LOGOUT

### Teste 4.1: Logout limpa token
```
PROCEDIMENTO:
1. Fazer login
2. Verificar token em sessionStorage
3. Clicar botão "Sair"
4. Verificar sessionStorage

ESPERADO:
✅ sessionStorage não tem "accessToken"
✅ Usuário vê página de login
```

### Teste 4.2: Logout chama backend
```
PROCEDIMENTO:
1. Fazer login
2. Abrir Network tab do DevTools
3. Clicar botão "Sair"
4. Procurar por POST /api/v1/auth/logout

ESPERADO:
✅ Requisição POST é feita para /api/v1/auth/logout
✅ Request inclui cookie (credentials: include)
```

### Teste 4.3: 401 dispara logout automático
```
PROCEDIMENTO:
1. Fazer login
2. Abrir DevTools → Network
3. Forçar erro 401 (modificar token manualmente em sessionStorage ou simular)
4. Fazer qualquer requisição autenticada (ex: /meus-grupos)

ESPERADO:
✅ Requisição retorna 401
✅ usuário é deslogado automaticamente
✅ Redirecionado para /login
✅ sessionStorage é limpo
```

### Teste 4.4: 403 dispara logout automático
```
PROCEDIMENTO:
1. Mock API para retornar 403 em requisição autenticada
2. Fazer requisição autenticada

ESPERADO:
✅ Requisição retorna 403
✅ usuário é deslogado automaticamente
✅ sessionStorage é limpo
```

---

## 5. TESTES DE ROTAS PROTEGIDAS

### Teste 5.1: Rota protegida bloqueia não autenticado
```
PROCEDIMENTO:
1. Fazer logout
2. Acessar /meus-grupos
3. Verificar redirecionamento

ESPERADO:
✅ Redirecionado para /login
✅ URL state tem from=/meus-grupos
```

### Teste 5.2: Rota admin bloqueia não admin
```
PROCEDIMENTO:
1. Fazer login com usuário comum
2. Acessar /admin
3. Verificar redirecionamento

ESPERADO:
✅ Mostra AdminLoginPage
✅ Pode fazer login admin se tiver credenciais
```

### Teste 5.3: Rota admin aceita admin
```
PROCEDIMENTO:
1. Fazer login com usuário admin
2. Acessar /admin
3. Verificar acesso

ESPERADO:
✅ Carrega AdminPage
✅ Sem redirecionamento
```

---

## 6. TESTES DE LIMPEZA DE URL

### Teste 6.1: Token removido da URL após login
```
PROCEDIMENTO:
1. Mock: Adicionar token fictício na query string
2. Fazer login com callback contendo token
3. Verificar URL após redirecionamento

ESPERADO:
✅ URL é /
✅ Sem query params com token
✅ window.history.replaceState foi chamado
```

### Teste 6.2: Error param é sanitizado
```
PROCEDIMENTO:
1. Simular callback com error param: ?error=<img src=x onerror=alert()>
2. Verificar console

ESPERADO:
✅ Error message é escapado (sem XSS)
✅ Não há alert/XSS executado
✅ Erro é exibido como texto
```

---

## 7. TESTES DE LOGS SEGUROS

### Teste 7.1: Logs não expõem tokens
```
PROCEDIMENTO:
1. Fazer login
2. Fazer requisição autenticada
3. Abrir console e procurar por "[axiosClient] Request"
4. Verificar log

ESPERADO:
✅ Log mostra URL, method, hasAuthHeader
❌ Log NÃO mostra token completo
❌ Log NÃO mostra dados sensíveis
```

### Teste 7.2: Error logs não expõem dados
```
PROCEDIMENTO:
1. Forçar erro 400 com mensagem sensível
2. Verificar console

ESPERADO:
✅ Error log mostra status, statusText, URL
❌ Error log NÃO mostra response.data completo
```

---

## 8. TESTES DE VALIDADORES

### Teste 8.1: isSafeRedirectUrl funciona
```
JAVASCRIPT:
isSafeRedirectUrl("/") → true
isSafeRedirectUrl("/perfil") → true
isSafeRedirectUrl("//evil.com") → false
isSafeRedirectUrl("javascript:alert()") → false
isSafeRedirectUrl("http://evil.com") → false

ESPERADO:
✅ Todos os casos acima funcionam
```

### Teste 8.2: sanitizeImageUrl funciona
```
JAVASCRIPT:
sanitizeImageUrl("https://lh3.googleusercontent.com/x") → URL
sanitizeImageUrl("/uploads/avatar.jpg") → "/uploads/avatar.jpg"
sanitizeImageUrl("javascript:alert()") → null
sanitizeImageUrl("data:text/html,...") → null
sanitizeImageUrl("http://evil.com/x.jpg") → null

ESPERADO:
✅ Todos os casos acima funcionam
```

### Teste 8.3: escapeHtml funciona
```
JAVASCRIPT:
escapeHtml("<img src=x onerror=alert()>") → "&lt;img src=x onerror=alert()&gt;"
escapeHtml("normal text") → "normal text"

ESPERADO:
✅ HTML é escapado
✅ XSS patterns são neutralizados
```

---

## 9. TESTES INTEGRADOS

### Teste 9.1: Fluxo completo de login seguro
```
PROCEDIMENTO:
1. Acessar /login
2. Clicar "Login com Google"
3. Fazer autenticação no Google
4. Redireciona para /auth/callback
5. Callback limpa URL e busca perfil
6. Redireciona para /
7. Verificar estado

ESPERADO:
✅ Cada passo funciona corretamente
✅ Sem erros em console
✅ Token em sessionStorage
✅ usuário logado em AuthContext
✅ Header mostra avatar e nome
```

### Teste 9.2: Fluxo completo de logout seguro
```
PROCEDIMENTO:
1. Usuário logado
2. Clicar "Sair"
3. Verificar comportamento

ESPERADO:
✅ Backend logout endpoint é chamado
✅ Token removido de sessionStorage
✅ AuthContext.user é null
✅ Redirecionado para login
✅ Sem dados sensíveis em storage
```

### Teste 9.3: Recuperação de sessão expirada
```
PROCEDIMENTO:
1. Fazer login
2. Esperar sessão expirar ou forçar 401
3. Tentar acessar /meus-grupos
4. Verificar comportamento

ESPERADO:
✅ 401 é recebido
✅ Logout automático é acionado
✅ Redirecionado para /login
✅ Sem dados no localStorage/sessionStorage
```

---

## CHECKLIST DE EXECUÇÃO

- [ ] Todos os testes de armazenamento de tokens passam
- [ ] Todos os testes de open redirect passam
- [ ] Todos os testes de sanitização de avatar passam
- [ ] Todos os testes de logout passam
- [ ] Todos os testes de rotas protegidas passam
- [ ] Todos os testes de limpeza de URL passam
- [ ] Todos os testes de logs passam
- [ ] Todos os testes de validadores passam
- [ ] Todos os testes integrados passam
- [ ] Nenhum erro em console
- [ ] Performance não foi degradada
- [ ] Experiência do usuário não foi afetada

---

## FERRAMENTAS RECOMENDADAS

- **DevTools Network Tab**: Monitorar requisições
- **DevTools Application/Storage**: Verificar localStorage/sessionStorage
- **Console**: Verificar logs e erros
- **Jest/Vitest**: Testes unitários dos validadores
- **Playwright/Cypress**: Testes E2E
- **OWASP ZAP**: Scanner de segurança

---

## PRÓXIMOS PASSOS

1. Executar todos os testes listados
2. Documentar resultados
3. Corrigir qualquer falha encontrada
4. Fazer code review com foco em segurança
5. Deploy para staging
6. Testes de penetração (opcional)
7. Deploy para produção

---

## Notas

- Alguns testes podem ser automatizados com ferramentas como Playwright
- Recomendado usar staging/desenvolvimento antes de produção
- Consultar OWASP Top 10 para mais contexto
- Revisar certificados HTTPS em produção
- Considerar adicionar CSP headers no backend
