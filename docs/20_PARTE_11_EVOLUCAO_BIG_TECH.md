# PARTE 11 - Evolucao para Big Tech

Esta parte descreve como o Burgarelli Contabil ERP pode evoluir de um monolito modular em Next.js + Supabase para uma arquitetura distribuida, event-driven, multi-regiao e preparada para milhares ou milhoes de usuarios.

## 1. Ponto de partida

O sistema atual deve permanecer como monolito modular enquanto:

- a equipe ainda e pequena;
- o dominio ainda esta mudando muito;
- os modulos ainda compartilham muitas regras;
- a operacao ainda cabe em Supabase + Vercel;
- o custo de operar microservicos seria maior que o ganho.

Arquitetura atual:

```text
Next.js App Router
  app/
  app/api/
  modules/
  services/
  lib/

Supabase
  Auth
  PostgreSQL
  RLS

Vercel
  Web app
  API routes
```

Decisao principal: primeiro estabilizar dominio e seguranca. Depois extrair servicos por carga, risco e autonomia.

## 2. Estagios de evolucao

### Estagio 1 - Monolito modular seguro

Objetivo: vender e operar com seguranca.

Caracteristicas:

- Next.js concentra frontend e backend.
- Supabase concentra Auth e banco.
- RLS isola tenants.
- Modulos DDD separam regras.
- Auditoria registra eventos criticos.
- Billing e convites ficam no backend.

Esse e o melhor estagio para MVP, validacao comercial e primeiras dezenas ou centenas de empresas.

### Estagio 2 - Monolito com workers

Objetivo: tirar tarefas pesadas da request HTTP.

Adicionar:

- fila de jobs;
- workers para tarefas assíncronas;
- processamento de webhooks;
- envio de e-mails;
- geracao de relatorios;
- importacao de planilhas;
- conciliacao bancaria;
- emissao de notas.

Fluxo:

```text
API Route
  -> valida usuario, empresa e permissao
  -> grava comando no banco
  -> publica job
  -> responde rapido ao usuario

Worker
  -> consome job
  -> executa tarefa pesada
  -> grava resultado
  -> registra audit log
```

Tecnologias possiveis:

- Supabase Edge Functions;
- Vercel Cron;
- Inngest;
- Trigger.dev;
- BullMQ + Redis;
- RabbitMQ;
- Kafka, quando a escala justificar.

### Estagio 3 - Servicos por dominio

Objetivo: separar dominios com carga, risco ou ownership diferentes.

Primeiros candidatos:

- Billing Service;
- Audit Service;
- Notification Service;
- Fiscal Service;
- Invoice Service;
- Reports Service;
- Identity/RBAC Service.

Exemplo:

```text
Web App
  -> API Gateway
    -> Auth/RBAC Service
    -> Companies Service
    -> Finance Service
    -> Billing Service
    -> Fiscal Service
    -> Audit Service
```

Regra de extracao:

- extrair somente modulo com contrato claro;
- manter banco separado quando o dominio exigir autonomia;
- publicar eventos para integracao;
- evitar chamadas sincronas profundas entre servicos.

### Estagio 4 - Event-driven architecture

Objetivo: desacoplar modulos e suportar escala operacional.

Eventos principais:

```text
empresa.criada
usuario.convidado
usuario.vinculado_empresa
transacao.criada
transacao.atualizada
assinatura.ativada
assinatura.bloqueada
nota_fiscal.emitida
relatorio.gerado
permissao.alterada
```

Padrao recomendado:

```text
Servico grava dado transacional
  -> grava evento em outbox_events
  -> worker publica evento na fila
  -> consumidores processam
  -> audit log registra acao
```

Tabela base de outbox:

```sql
create table if not exists public.outbox_events (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create index if not exists idx_outbox_events_status_created
  on public.outbox_events (status, created_at);

create index if not exists idx_outbox_events_empresa
  on public.outbox_events (empresa_id);
```

Esse padrao evita perder evento quando o banco grava com sucesso, mas a fila falha.

## 3. API Gateway

Quando existirem varios servicos, adicionar API Gateway.

Responsabilidades:

- autenticar request;
- validar tenant;
- aplicar rate limit;
- aplicar WAF;
- rotear para servicos;
- padronizar logs;
- padronizar tracing;
- bloquear clientes inadimplentes;
- aplicar versao de API.

Opcoes:

- Kong;
- NGINX;
- Cloudflare;
- AWS API Gateway;
- GCP API Gateway;
- Azure API Management;
- gateway proprio em NestJS/Fastify apenas se houver motivo forte.

## 4. Cache e Redis

Adicionar cache quando houver gargalo comprovado.

Casos bons:

- permissoes RBAC por usuario/empresa;
- dados de plano e assinatura;
- configuracoes da empresa;
- listas de categorias;
- dashboard agregado;
- cotacoes e noticias contabeis;
- rate limit distribuido.

Cuidados:

- nunca usar cache como fonte final de permissao;
- invalidar cache ao alterar role/permissao;
- TTL curto para dados sensiveis;
- incluir `empresa_id` na chave de cache.

Exemplo de chave:

```text
tenant:{empresa_id}:user:{user_id}:permissions
tenant:{empresa_id}:dashboard:{yyyy-mm}
tenant:{empresa_id}:subscription
```

## 5. Banco em escala

### Fase inicial

Um PostgreSQL com RLS:

- simples;
- seguro;
- barato;
- ideal para produto inicial.

### Fase intermediaria

Separar leitura e escrita:

- read replicas;
- materialized views;
- jobs de agregacao;
- tabelas de resumo mensal;
- indices por `empresa_id` e data.

### Fase avancada

Separar por dominio:

```text
Identity DB
Companies DB
Finance DB
Billing DB
Fiscal DB
Audit DB
Reports Warehouse
```

### Sharding

Aplicar somente quando necessario.

Opcoes:

- shard por `empresa_id`;
- shard por grupo de empresas;
- shard por regiao;
- tenants enterprise em bancos dedicados.

Regra: sharding aumenta muito a complexidade operacional. Antes disso, usar bons indices, particionamento, replicas e agregacoes.

## 6. Particionamento

Tabelas grandes candidatas:

- `audit_logs`;
- `transacoes`;
- `invoices`;
- `outbox_events`;
- eventos fiscais;
- logs de integracao.

Exemplo para auditoria por mes:

```sql
create table public.audit_logs_2026_05
  partition of public.audit_logs
  for values from ('2026-05-01') to ('2026-06-01');
```

Beneficios:

- consultas mais rapidas;
- limpeza por periodo;
- arquivamento barato;
- menor impacto em indices.

## 7. Data warehouse e BI

Nao usar o banco transacional para relatorios pesados em grande escala.

Adicionar:

- pipeline CDC;
- warehouse;
- camada semantica;
- dashboards internos;
- relatorios por cliente.

Opcoes:

- BigQuery;
- Snowflake;
- Redshift;
- ClickHouse;
- PostgreSQL analitico separado no inicio.

Fluxo:

```text
PostgreSQL transacional
  -> CDC / eventos
  -> Data Lake ou Warehouse
  -> BI / relatorios / analise
```

## 8. Observabilidade Big Tech

Adicionar tres pilares:

- logs estruturados;
- metricas;
- tracing distribuido.

Padrao de log:

```json
{
  "level": "info",
  "event": "transacao.criada",
  "empresa_id": "uuid",
  "user_id": "uuid",
  "request_id": "uuid",
  "duration_ms": 42
}
```

Metricas importantes:

- latencia p95/p99 por rota;
- taxa de erro por modulo;
- jobs pendentes;
- webhooks falhos;
- convites expirados;
- tentativas de login;
- bloqueios de RLS;
- tempo de geracao de relatorios;
- volume de eventos por tenant.

Tracing:

```text
request_id
  -> API Gateway
  -> Auth Service
  -> Finance Service
  -> Audit Service
  -> Queue
  -> Worker
```

Ferramentas:

- OpenTelemetry;
- Datadog;
- Grafana;
- Prometheus;
- Sentry;
- New Relic.

## 9. Multi-regiao

Evoluir para multi-regiao quando houver:

- clientes em regioes diferentes;
- exigencia de baixa latencia;
- exigencia contratual de residencia de dados;
- necessidade alta de disponibilidade.

Modelos:

### Active-passive

Uma regiao principal recebe escrita. Outra fica pronta para failover.

Mais simples e recomendado primeiro.

### Active-active

Varias regioes recebem escrita.

Mais complexo. Exige:

- resolucao de conflitos;
- clocks confiaveis;
- replicacao robusta;
- desenho cuidadoso de consistencia.

Para ERP financeiro, preferir consistencia forte nas operacoes financeiras. Nem tudo deve ser eventual.

## 10. Seguranca em escala

Adicionar:

- WAF;
- DDoS protection;
- secrets manager;
- rotacao de chaves;
- SSO/SAML para clientes enterprise;
- SCIM para provisionamento;
- device/session management;
- deteccao de anomalia;
- revisao periodica de permissoes;
- trilha de auditoria imutavel;
- backups testados;
- DR plan.

Separar ambientes:

```text
development
staging
production
production-readonly
```

Cada ambiente deve ter:

- projeto Supabase separado;
- chaves separadas;
- banco separado;
- Stripe separado;
- variaveis Vercel separadas.

## 11. Contratos entre servicos

Quando extrair servicos, definir contratos fortes.

Opcoes:

- OpenAPI para HTTP;
- AsyncAPI para eventos;
- protobuf/gRPC para chamadas internas de alta performance;
- schemas versionados para eventos Kafka.

Exemplo de versao de evento:

```json
{
  "event_id": "uuid",
  "event_type": "transacao.criada",
  "event_version": 1,
  "occurred_at": "2026-05-02T12:00:00Z",
  "empresa_id": "uuid",
  "payload": {
    "transacao_id": "uuid",
    "amount": "1000.00",
    "type": "income"
  }
}
```

Regra: nunca quebrar consumidor antigo sem periodo de compatibilidade.

## 12. Ordem recomendada de evolucao

1. Fortalecer monolito modular atual.
2. Criar testes de RLS e seguranca.
3. Adicionar observabilidade.
4. Adicionar jobs assíncronos.
5. Criar outbox events.
6. Separar notificacoes.
7. Separar billing/webhooks.
8. Separar auditoria.
9. Separar fiscal/notas.
10. Adicionar cache distribuido.
11. Adicionar data warehouse.
12. Adicionar API Gateway.
13. Avaliar sharding.
14. Avaliar multi-regiao.

## 13. Alertas de arquitetura

- Microservicos cedo demais atrasam o produto.
- Sem observabilidade, microservicos viram caixa preta.
- Sem contratos versionados, eventos quebram consumidores.
- Sem outbox, eventos podem ser perdidos.
- Sem idempotencia, webhooks e jobs duplicam efeitos.
- Sem RLS ou autorizacao central forte, multi-tenant vira risco critico.
- Sem auditoria imutavel, sistema financeiro fica fraco juridicamente.

## 14. Estado alvo

Arquitetura alvo de longo prazo:

```text
Web/Mobile
  -> CDN/WAF
  -> API Gateway
  -> Auth/RBAC
  -> Domain Services
      Companies
      Users
      Finance
      Fiscal
      Payroll
      Billing
      Audit
      Notifications
  -> Event Bus
      Kafka/RabbitMQ
  -> Workers
  -> Databases by Domain
  -> Redis Cache
  -> Object Storage
  -> Data Warehouse
  -> Observability Platform
```

## 15. Decisao final

O caminho correto para o Burgarelli Contabil ERP e evoluir em camadas:

1. produto seguro;
2. monolito modular bem separado;
3. jobs assíncronos;
4. eventos confiaveis;
5. extracao seletiva de servicos;
6. escala regional;
7. escala global.

Seguranca e isolamento entre empresas continuam sendo a base. Escala sem isolamento e apenas um vazamento maior.
