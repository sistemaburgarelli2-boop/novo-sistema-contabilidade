# PARTE 10 - Estrutura final do projeto

Esta parte consolida a organizacao final do Burgarelli Contabil ERP apos as etapas de arquitetura, banco, autenticacao, multiempresa, billing, convites, RBAC, auditoria e hardening.

## 1. Objetivo da estrutura

O projeto fica organizado como um monolito modular SaaS. Isso permite entregar rapido no Next.js/Vercel sem perder a separacao de dominio necessaria para evoluir depois para servicos independentes.

Principios:

- `app/` contem rotas, paginas e API handlers.
- `modules/` contem regras de negocio por dominio.
- `services/` contem adaptadores usados pelo frontend.
- `lib/` contem infraestrutura compartilhada.
- `components/` contem UI reutilizavel.
- `docs/` contem arquitetura, SQL e decisoes tecnicas.
- `proxy.ts` e responsavel por protecao de rotas e headers globais.

## 2. Estrutura consolidada

```text
app/
  api/
    auth/
    empresas/
    convites/
    billing/
    rbac/
    auditoria/
    health/
    companies/       # compatibilidade legada
    categories/      # compatibilidade legada
    transactions/    # compatibilidade legada
    taxes/           # compatibilidade legada
  auth/login/
  empresas/
  dashboard/
  finance/
  billing/
  rbac/
  auditoria/
  convites/aceitar/

components/
  auth/
  companies/
  dashboard/
  finance/
  layout/
  ui/

lib/
  apiResponse.ts
  env.ts
  logger.ts
  rateLimit.ts
  requestContext.ts
  sanitize.ts
  securityHeaders.ts
  supabaseAdmin.ts
  supabaseBrowser.ts
  supabaseServer.ts

modules/
  auth/
  empresas/
  usuarios/
  convites/
  billing/
  rbac/
  auditoria/

services/
  empresaClientService.ts
  billingClientService.ts
  rbacClientService.ts
  auditoriaClientService.ts
  companyService.ts       # legado
  financeService.ts       # legado
  taxService.ts           # legado
```

## 3. Responsabilidade por camada

### `app/`

Camada de entrada do Next.js.

- Paginas App Router ficam em `app/<rota>/page.tsx`.
- APIs ficam em `app/api/<modulo>/route.ts`.
- Cada API valida sessao, entrada, permissao e chama o service do modulo.
- Nenhuma regra critica deve depender somente do frontend.

### `modules/`

Camada principal de dominio.

Padrao por modulo:

```text
modules/<dominio>/
  <dominio>.types.ts
  <dominio>.validators.ts
  <dominio>.repository.ts
  <dominio>.service.ts
  <dominio>.security.ts
```

Regras:

- `types` define contratos.
- `validators` valida payloads externos.
- `repository` acessa Supabase.
- `service` orquestra regra de negocio.
- `security` concentra tokens, hashes, assinaturas ou validacoes sensiveis.

### `services/`

Adaptadores client-side para chamadas HTTP.

Exemplo:

- `empresaClientService.ts` chama `/api/empresas`.
- `billingClientService.ts` chama `/api/billing`.
- `rbacClientService.ts` chama `/api/rbac`.

Nao colocar segredo, service role ou regras de autorizacao nessa camada.

### `lib/`

Infraestrutura compartilhada.

- `env.ts`: leitura segura de variaveis.
- `supabaseServer.ts`: cliente SSR com sessao do usuario.
- `supabaseAdmin.ts`: cliente administrativo somente backend.
- `rateLimit.ts`: limitador em memoria para rotas sensiveis.
- `securityHeaders.ts`: headers de seguranca.
- `logger.ts`: logs estruturados.
- `sanitize.ts`: sanitizacao basica.
- `apiResponse.ts`: respostas padronizadas.

### `components/`

UI reutilizavel.

Componentes nao devem acessar `SUPABASE_SERVICE_ROLE_KEY`, nem tomar decisoes finais de permissao. Eles podem esconder botoes por UX, mas a autorizacao real fica no backend e no RLS.

## 4. Rotas principais

### Frontend

```text
/auth/login
/dashboard
/empresas
/finance
/billing
/rbac
/auditoria
/convites/aceitar
```

### Backend

```text
GET  /api/auth/session
POST /api/auth/login
POST /api/auth/logout

GET  /api/empresas
POST /api/empresas
GET  /api/empresas/[empresaId]
PATCH /api/empresas/[empresaId]

GET  /api/empresas/[empresaId]/usuarios
POST /api/empresas/[empresaId]/usuarios

GET  /api/empresas/[empresaId]/roles
GET  /api/rbac/permissoes
GET  /api/empresas/[empresaId]/rbac/roles
POST /api/empresas/[empresaId]/rbac/roles
PUT  /api/empresas/[empresaId]/rbac/roles/[roleId]/permissoes

POST /api/convites
POST /api/convites/aceitar

GET  /api/billing/planos
GET  /api/billing/assinatura/[empresaId]
POST /api/billing/webhook

GET  /api/auditoria/[empresaId]
```

## 5. Multi-tenant e seguranca

Fonte de verdade:

- O usuario autenticado vem do Supabase Auth.
- O vinculo empresa/usuario vem de `usuarios_empresas`.
- A permissao vem de `roles`, `permissoes` e `roles_permissoes`.
- O isolamento final vem do RLS no PostgreSQL.

Regras obrigatorias:

- Toda tabela operacional deve possuir `empresa_id`.
- Nenhuma API deve aceitar `empresa_id` sem validar vinculo.
- Inserts devem usar `WITH CHECK` no RLS.
- Updates e deletes devem validar permissao.
- Convites usam hash de token e expiracao.
- Auditoria registra acoes criticas.
- Billing deve validar assinatura antes de criar recursos limitados.

## 6. Compatibilidade legada

O projeto ainda possui algumas rotas antigas em ingles:

```text
/companies
/api/companies
/api/categories
/api/transactions
/api/taxes
```

Elas podem continuar temporariamente para nao quebrar telas ja existentes. A direcao de producao e padronizar os novos modulos em portugues e DDD:

```text
/empresas
/api/empresas
/modules/empresas
```

Antes de remover rotas legadas, validar que nenhuma tela ainda depende delas.

## 7. Como adicionar um novo modulo

Exemplo para `fiscal`:

1. Criar `modules/fiscal/fiscal.types.ts`.
2. Criar `modules/fiscal/fiscal.validators.ts`.
3. Criar `modules/fiscal/fiscal.repository.ts`.
4. Criar `modules/fiscal/fiscal.service.ts`.
5. Criar APIs em `app/api/fiscal`.
6. Criar tela em `app/fiscal/page.tsx`.
7. Criar service client-side em `services/fiscalClientService.ts`.
8. Criar componentes em `components/fiscal`.
9. Adicionar permissoes no SQL.
10. Adicionar auditoria para acoes criticas.

## 8. Checklist de producao

- Aplicar `docs/11_PARTE_2_BANCO_RLS_PRODUCAO.sql` no Supabase.
- Criar usuario real no Supabase Auth para login.
- Configurar variaveis na Vercel.
- Configurar `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.
- Configurar `STRIPE_WEBHOOK_SECRET`.
- Revisar CSP antes de integrar scripts externos.
- Ativar logs e alertas no ambiente de producao.
- Criar testes de RLS para acesso cruzado entre empresas.
- Criar testes de convite com token expirado, reutilizado e invalido.
- Criar monitoramento de erros em APIs criticas.

## 9. Decisao arquitetural

Repositories permanecem dentro de `modules/` em vez de uma pasta global `repositories/`. Isso evita uma camada generica demais e mantem cada dominio dono do seu acesso a dados.

Middlewares globais permanecem em `proxy.ts` porque este e o ponto esperado pelo Next.js para interceptar requests. Middlewares especificos de dominio devem ficar nos services ou helpers do proprio modulo.

## 10. Alerta de seguranca

Esta estrutura nao substitui RLS. Mesmo que uma API valide permissao corretamente, o banco deve continuar bloqueando acesso indevido. Em sistema financeiro multi-tenant, RLS e a barreira obrigatoria contra vazamento entre empresas.
