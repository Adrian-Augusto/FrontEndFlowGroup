# Exemplos de Implementação Backend (NestJS)

## 1. Payment Service

```typescript
// src/payments/payment.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './payment.entity';
import { SubscriptionService } from '../subscriptions/subscription.service';

@Injectable()
export class PaymentService {
  private readonly mpClient = axios.create({
    baseURL: 'https://api.mercadopago.com/v1',
    headers: {
      Authorization: `Bearer ${this.configService.get('MP_ACCESS_TOKEN')}`,
    },
  });

  constructor(
    private configService: ConfigService,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private subscriptionService: SubscriptionService,
  ) {}

  /**
   * POST /api/v1/payments/create
   * Criar pagamento e retornar init_point
   */
  async createPayment(userId: string, planId: string, groupId?: string) {
    // Validar planId
    const planDetails = this.getPlanDetails(planId);
    if (!planDetails) {
      throw new BadRequestException('Plano inválido');
    }

    // Criar preferência no Mercado Pago
    const preference = {
      items: [
        {
          title: `${planDetails.name} - OctoGrupos`,
          quantity: 1,
          unit_price: planDetails.price,
          currency_id: 'BRL',
        },
      ],
      payer: {
        email: 'user@example.com', // buscar do usuário autenticado
      },
      back_urls: {
        success: `${this.configService.get('FRONTEND_URL')}/payment-status`,
        failure: `${this.configService.get('FRONTEND_URL')}/payment-status`,
        pending: `${this.configService.get('FRONTEND_URL')}/payment-status`,
      },
      external_reference: `octo_${userId}_${Date.now()}`,
      notification_url: `${this.configService.get('BACKEND_URL')}/api/v1/payments/webhook`,
    };

    const response = await this.mpClient.post('/checkout/preferences', preference);

    // Salvar no banco
    const payment = this.paymentRepository.create({
      id: this.generateId(),
      userId,
      planId,
      groupId,
      mpPaymentId: response.data.id,
      status: 'pending',
      amount: planDetails.price,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.paymentRepository.save(payment);

    return {
      id: payment.id,
      init_point: response.data.init_point,
      status: 'pending',
      planId,
      userId,
      createdAt: payment.createdAt,
    };
  }

  /**
   * GET /api/v1/payments/status?payment_id=xxx
   * Verificar status do pagamento (sincronizar com MP)
   */
  async getPaymentStatus(paymentId: string, userId: string) {
    // Buscar no banco
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId, userId },
    });

    if (!payment) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Sincronizar com Mercado Pago
    const mpPayment = await this.mpClient.get(
      `/payments/search?external_reference=octo_${userId}_*`,
    );

    const latestPayment = mpPayment.data.results[0];

    if (latestPayment) {
      // Mapear status do MP para nossa convenção
      const mpStatus = this.mapMercadoPagoStatus(latestPayment.status);
      
      // Atualizar no banco
      payment.status = mpStatus;
      payment.updatedAt = new Date();

      // Se aprovado, ativar subscription
      if (mpStatus === 'approved') {
        await this.subscriptionService.activateSubscription(
          userId,
          payment.planId,
          paymentId,
        );
      }

      await this.paymentRepository.save(payment);
    }

    // Calcular expiração
    const expiresAt = this.calculateExpiresAt(payment.planId);

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      planName: this.getPlanDetails(payment.planId).name,
      planId: payment.planId,
      expiresAt,
      userId,
      createdAt: payment.createdAt,
    };
  }

  /**
   * POST /api/v1/payments/webhook
   * Webhook do Mercado Pago
   */
  async handleWebhook(data: any) {
    // Validar assinatura
    // const isValid = await this.validateMercadoPagoSignature(request);
    // if (!isValid) throw new UnauthorizedException();

    if (data.action !== 'payment.updated') {
      return { status: 'ok' };
    }

    const mpPaymentId = data.data.id;
    
    // Buscar pagamento no MP
    const mpPayment = await this.mpClient.get(`/payments/${mpPaymentId}`);
    const status = this.mapMercadoPagoStatus(mpPayment.data.status);

    // Atualizar no banco
    const payment = await this.paymentRepository.findOne({
      where: { mpPaymentId },
    });

    if (payment) {
      payment.status = status;
      payment.updatedAt = new Date();

      if (status === 'approved') {
        await this.subscriptionService.activateSubscription(
          payment.userId,
          payment.planId,
          payment.id,
        );
      }

      await this.paymentRepository.save(payment);
    }

    return { status: 'ok' };
  }

  // Helpers
  private mapMercadoPagoStatus(mpStatus: string): string {
    const mapping = {
      'approved': 'approved',
      'pending': 'pending',
      'authorized': 'pending',
      'in_process': 'pending',
      'in_mediation': 'pending',
      'rejected': 'rejected',
      'cancelled': 'rejected',
      'refunded': 'rejected',
      'charged_back': 'rejected',
    };
    return mapping[mpStatus] || 'pending';
  }

  private getPlanDetails(planId: string) {
    const plans = {
      weekly: { name: 'Semanal', price: 9.90, days: 7 },
      monthly: { name: 'Mensal', price: 29.90, days: 30 },
    };
    return plans[planId];
  }

  private calculateExpiresAt(planId: string): string {
    const details = this.getPlanDetails(planId);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + details.days);
    return expiresAt.toISOString();
  }

  private generateId(): string {
    return `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

---

## 2. Payment Controller

```typescript
// src/payments/payment.controller.ts
import { Controller, Post, Get, Body, Query, Req, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  /**
   * POST /api/v1/payments/create
   */
  @Post('create')
  @UseGuards(JwtAuthGuard)
  async createPayment(
    @Req() req,
    @Body() body: { planId: string; groupId?: string },
  ) {
    return this.paymentService.createPayment(
      req.user.id,
      body.planId,
      body.groupId,
    );
  }

  /**
   * GET /api/v1/payments/status?payment_id=xxx
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  async getPaymentStatus(
    @Req() req,
    @Query('payment_id') paymentId: string,
  ) {
    if (!paymentId) {
      throw new BadRequestException('payment_id é obrigatório');
    }
    return this.paymentService.getPaymentStatus(paymentId, req.user.id);
  }

  /**
   * GET /api/v1/payments/history
   */
  @Get('history')
  @UseGuards(JwtAuthGuard)
  async getPaymentHistory(@Req() req) {
    return this.paymentService.getPaymentHistory(req.user.id);
  }

  /**
   * POST /api/v1/payments/webhook
   * Sem autenticação - chamado pelo Mercado Pago
   */
  @Post('webhook')
  async webhook(@Body() body: any) {
    return this.paymentService.handleWebhook(body);
  }
}
```

---

## 3. Payment Entity

```typescript
// src/payments/payment.entity.ts
import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('payments')
export class Payment {
  @PrimaryColumn('uuid')
  id: string;

  @Column('uuid')
  userId: string;

  @Column('varchar')
  planId: string; // "weekly" | "monthly"

  @Column('bigint', { nullable: true })
  mpPaymentId: number; // ID do Mercado Pago

  @Column('varchar')
  status: string; // "pending" | "approved" | "rejected" | "cancelled"

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('uuid', { nullable: true })
  groupId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column('timestamp', { nullable: true })
  expiresAt: Date;
}
```

---

## 4. Subscription Service (atualizar)

```typescript
// src/subscriptions/subscription.service.ts
async activateSubscription(
  userId: string,
  planId: string,
  paymentId: string,
) {
  const planDetails = this.getPlanDetails(planId);
  
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + planDetails.days);

  const subscription = await this.subscriptionRepository.create({
    userId,
    planId,
    paymentId, // ← adicionar referência ao pagamento
    status: 'active',
    startedAt: new Date(),
    expiresAt,
  });

  return this.subscriptionRepository.save(subscription);
}
```

---

## 5. Module

```typescript
// src/payments/payment.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { Payment } from './payment.entity';
import { SubscriptionModule } from '../subscriptions/subscription.module';

@Module({
  imports: [TypeOrmModule.forFeature([Payment]), SubscriptionModule],
  providers: [PaymentService],
  controllers: [PaymentController],
  exports: [PaymentService],
})
export class PaymentModule {}
```

---

## 6. Environment Variables

```env
# .env
MP_PUBLIC_KEY=APP_USR-sua-public-key
MP_ACCESS_TOKEN=APP_USR-sua-access-token
MP_WEBHOOK_SECRET=sua-webhook-secret

FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8080
```

---

## Notes

- Sempre sincronizar com Mercado Pago para obter status real
- Implementar retry logic para chamadas ao MP
- Usar transações para garantir atomicidade
- Logar todas as transações para auditoria
- Em produção, usar HTTPS obrigatoriamente
