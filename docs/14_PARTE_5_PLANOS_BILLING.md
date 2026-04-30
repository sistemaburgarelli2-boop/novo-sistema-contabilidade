# PARTE 5 - Planos + Billing

## Objetivo

Adicionar a base de planos, assinatura por empresa, validacao de limites e estrutura segura para billing com Stripe.

## Decisoes arquiteturais

- Plano pertence ao catalogo `planos`.
- Assinatura pertence a uma empresa em `assinaturas`.
- Criacao de empresa valida limite do plano.
- Vinculo de usuario valida limite de usuarios do plano.
- Criacao de transacao valida limite mensal de transacoes.
- Webhook Stripe deve ser processado server-side.
- Escrita de eventos de billing usa backend/service role.

## Arquivos criados

```txt
modules/billing/billing.types.ts
modules/billing/billing.repository.ts
modules/billing/billing.service.ts
app/api/billing/planos/route.ts
app/api/billing/assinatura/[empresaId]/route.ts
app/api/billing/webhook/route.ts
services/billingClientService.ts
app/billing/page.tsx
```

## Endpoints

### Listar planos

```txt
GET /api/billing/planos
```

Retorna planos ativos visiveis para usuarios autenticados.

### Buscar assinatura da empresa

```txt
GET /api/billing/assinatura/:empresaId
```

RLS garante que apenas usuarios da empresa acessem a assinatura.

### Webhook Stripe

```txt
POST /api/billing/webhook
```

Estrutura criada para receber eventos Stripe e registrar em `billing_events`.

Alerta: antes de usar em producao, instalar SDK Stripe e validar assinatura com `stripe.webhooks.constructEvent(rawBody, signature, secret)`. O endpoint atual exige `STRIPE_WEBHOOK_SECRET`, mas ainda nao faz validacao criptografica porque o SDK Stripe nao foi instalado nesta etapa.

## Validacoes implementadas

### Criacao de empresa

Antes de criar uma empresa, o sistema:

1. busca plano starter;
2. conta empresas ativas do usuario;
3. bloqueia se passou do limite.

### Adicionar usuario

Antes de vincular usuario:

1. busca assinatura da empresa;
2. calcula usuarios ativos;
3. bloqueia se passou do limite.

### Criar transacao

Antes de gravar transacao:

1. busca assinatura da empresa;
2. calcula transacoes do mes;
3. bloqueia se assinatura estiver cancelada/bloqueada;
4. bloqueia se passou do limite mensal.

## Tela

Nova rota:

```txt
/billing
```

Mostra:

- assinatura atual da empresa ativa;
- status da assinatura;
- limites do plano;
- catalogo de planos.

## Variaveis futuras

```env
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

## Alertas de seguranca

- Nunca confiar em status vindo do frontend.
- Webhook Stripe deve validar assinatura antes de processar qualquer evento.
- Mudanca de plano deve ser feita por backend.
- Bloqueios de plano devem existir antes de criar recursos.
- Service role deve ficar apenas no servidor.
- Idealmente, billing deve gerar eventos auditaveis na Parte 8.
