# Integração de Pagamento com Mercado Pago

## Visão Geral
O frontend foi configurado para integrar com Mercado Pago através do backend. Este documento especifica os endpoints e fluxos necessários.

## Endpoints Necessários

### 1. POST /api/v1/payments/create
**Objetivo**: Criar um pagamento e retornar o init_point para redirecionamento

**Request**:
```json
{
  "planId": "weekly" | "monthly",
  "groupId": "uuid-opcional"
}
```

**Response (201)**:
```json
{
  "id": "payment-uuid",
  "init_point": "https://www.mercadopago.com.ar/checkout/v1/...",
  "status": "pending",
  "planId": "weekly|monthly",
  "userId": "user-uuid",
  "createdAt": "2026-06-01T23:12:00.000Z"
}
```

**Implementação**:
1. Validar que o usuário está autenticado (Bearer token)
2. Validar que planId é válido ("weekly" ou "monthly")
3. Criar ordem de pagamento no Mercado Pago
4. Salvar referência do pagamento no banco com status "pending"
5. Retornar `init_point` para redirecionamento

---

### 2. GET /api/v1/payments/status?payment_id=xxx
**Objetivo**: Verificar status real do pagamento no servidor (NUNCA confiar em query params)

**Response (200)**:
```json
{
  "id": "payment-uuid",
  "status": "approved" | "pending" | "rejected",
  "amount": 29.90,
  "planName": "Mensal",
  "planId": "monthly",
  "expiresAt": "2026-07-01T23:12:00.000Z",
  "userId": "user-uuid",
  "createdAt": "2026-06-01T23:12:00.000Z"
}
```

**Implementação**:
1. Buscar pagamento no banco usando payment_id
2. **Sincronizar** com Mercado Pago para obter status real
3. Se status = approved:
   - Ativar subscription do usuário com expiração correta
   - Marcar grupo como featured (se groupId fornecido)
4. Retornar status verificado do servidor (NÃO do query param)

---

### 3. GET /api/v1/payments/history
**Objetivo**: Listar histórico de pagamentos do usuário

**Response (200)**:
```json
[
  {
    "id": "payment-uuid",
    "status": "approved",
    "amount": 29.90,
    "planName": "Mensal",
    "planId": "monthly",
    "expiresAt": "2026-07-01T23:12:00.000Z",
    "createdAt": "2026-06-01T23:12:00.000Z"
  }
]
```

---

### 4. POST /api/v1/payments/webhook
**Objetivo**: Receber notificações do Mercado Pago em tempo real

**Body** (enviado por Mercado Pago):
```json
{
  "action": "payment.updated",
  "data": {
    "id": "payment-id"
  }
}
```

**Implementação**:
1. Validar assinatura do webhook (Mercado Pago)
2. Buscar pagamento no banco
3. Sincronizar status com Mercado Pago
4. Se status = approved:
   - Ativar subscription
   - Marcar como featured
5. Retornar 200 OK

---

## Fluxo de Pagamento

```
┌─────────────────────────────────────────────────────────┐
│ Frontend: Usuário clica "Contratar - Mensal"           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ POST /api/v1/payments/create                           │
│ Body: { planId: "monthly", groupId?: "..." }           │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Backend:                                               │
│ 1. Criar ordem no Mercado Pago                         │
│ 2. Salvar com status = pending                         │
│ 3. Retornar init_point                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend: window.location.href = init_point           │
│ Usuário redirecionado para Mercado Pago               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Mercado Pago: Usuário confirma pagamento               │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Webhook: Backend recebe notificação                     │
│ Status atualizado para approved/rejected               │
└──────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Mercado Pago: Redireciona para return_url              │
│ URL: /payment-status?payment_id=xxx                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Frontend: PagePaymentStatus carrega                    │
│ GET /api/v1/payments/status?payment_id=xxx            │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│ Backend: Retorna status verificado do servidor         │
│ Frontend: Mostra "Aprovado" / "Pendente" / "Recusado"  │
└─────────────────────────────────────────────────────────┘
```

---

## Configurações do Mercado Pago

### Variables de Ambiente

```env
MP_PUBLIC_KEY=seu_public_key_aqui
MP_ACCESS_TOKEN=seu_access_token_aqui
MP_WEBHOOK_SECRET=seu_webhook_secret_aqui
```

### Return URLs (configurar no dashboard do MP)

**Success**: `https://seuapp.com/payment-status`
**Failure**: `https://seuapp.com/payment-status`

O query param `payment_id` será adicionado automaticamente pelo Mercado Pago.

---

## Estrutura de Dados Recomendada

### Tabela: payments
```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  plan_id VARCHAR(50) NOT NULL, -- "weekly" | "monthly"
  mp_payment_id BIGINT, -- ID do Mercado Pago
  status VARCHAR(20) NOT NULL, -- "pending" | "approved" | "rejected" | "cancelled"
  amount DECIMAL(10, 2) NOT NULL,
  group_id UUID REFERENCES groups(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);
```

### Tabela: subscriptions (atualizar)
```sql
ALTER TABLE subscriptions ADD COLUMN payment_id UUID REFERENCES payments(id);
```

---

## Segurança

### ✅ O que o Frontend FAZ corretamente:
- Nunca armazena dados sensíveis de pagamento
- Redireciona para Mercado Pago (backend nunca vê dados do cartão)
- Sempre verifica status no servidor (GET /api/v1/payments/status)
- Não confia em query params

### ✅ O que o Backend DEVE fazer:
- Validar que payment_id pertence ao usuário autenticado
- Sincronizar com Mercado Pago via API (não confiar em webhook sozinho)
- Usar HTTPS em produção
- Validar assinatura dos webhooks
- Implementar retry logic para chamadas ao Mercado Pago
- Registrar todas as transações (audit trail)

---

## Testing

### Endpoints para testar localmente:

```bash
# 1. Criar pagamento
curl -X POST http://localhost:8080/api/v1/payments/create \
  -H "Authorization: Bearer seu_token" \
  -H "Content-Type: application/json" \
  -d '{"planId":"weekly"}'

# 2. Verificar status
curl http://localhost:8080/api/v1/payments/status?payment_id=xxx \
  -H "Authorization: Bearer seu_token"

# 3. Histórico
curl http://localhost:8080/api/v1/payments/history \
  -H "Authorization: Bearer seu_token"
```

---

## Mercado Pago Sandbox

Para testing, use credenciais sandbox do Mercado Pago:
- Cartão teste: `4111 1111 1111 1111`
- CVV: qualquer 3 dígitos
- Data: qualquer data futura

---

## Próximas Steps

1. ✅ Frontend implementado
2. ⏳ Backend: Implementar `/api/v1/payments/create`
3. ⏳ Backend: Implementar `/api/v1/payments/status`
4. ⏳ Backend: Implementar webhook do Mercado Pago
5. ⏳ Backend: Ativar subscriptions ao pagamento ser aprovado
6. ⏳ Testar fluxo completo em sandbox
7. ⏳ Configurar URLs de retorno em produção
