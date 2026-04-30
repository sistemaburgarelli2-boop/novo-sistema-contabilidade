# PARTE 1 - Arquitetura Completa do ERP Contabil SaaS

## 1. Objetivo arquitetural

Construir um ERP contabil SaaS multi-tenant, seguro por padrao, evolutivo e pronto para crescer de um monolito modular em Next.js para uma arquitetura distribuida.

O sistema deve garantir:

- isolamento total de dados entre empresas;
- autorizacao reforcada no banco via RLS;
- permissoes granulares por usuario, empresa e papel;
- operacoes financeiras auditaveis;
- base para billing, convites, RBAC avancado e escalabilidade.

## 2. Stack inicial

- Next.js App Router com TypeScript
- API Routes do Next.js como backend inicial
- Supabase Auth para autenticacao
- Supabase PostgreSQL com Row Level Security
- Vercel para deploy
- Stripe para billing em fase posterior

Decisao: comecar como monolito modular. Isso reduz complexidade operacional no inicio, mas a estrutura ja separa dominios, services e repositories para futura extracao em microservicos.

## 3. Principios de seguranca

Regras obrigatorias:

- o frontend nunca define autoridade;
- o frontend nunca decide `empresa_id` final sem validacao backend/RLS;
- o banco e a ultima linha de defesa;
- toda tabela de negocio deve ter `empresa_id`;
- toda politica RLS deve validar `auth.uid()`;
- usuarios so acessam empresas onde existe vinculo ativo em `usuarios_empresas`;
- roles e permissoes nao podem ser alteradas pelo proprio usuario;
- chaves sensiveis ficam somente em ambiente server-side;
- operacoes criticas geram `audit_logs`;
- webhooks externos devem validar assinatura.

Alerta: o login super admin local deve ser tratado como bootstrap/dev. Em producao, `SUPER_ADMIN_USERNAME` e `SUPER_ADMIN_PASSWORD` precisam estar em variaveis de ambiente e o ideal e migrar para Supabase Auth com MFA.

## 4. Modelo multi-tenant

Modelo principal:

```txt
auth.users
  -> usuarios
  -> usuarios_empresas
  -> empresas
```

Entidades centrais:

- `empresas`: tenant principal;
- `usuarios`: perfil publico ligado ao Supabase Auth;
- `usuarios_empresas`: vinculo entre usuario e empresa;
- `roles`: papeis do sistema;
- `permissoes`: capacidades granulares;
- `roles_permissoes`: matriz de permissao;
- `planos`: limites comerciais;
- `assinaturas`: assinatura ativa por empresa;
- `audit_logs`: trilha de auditoria.

Decisao: nao usar apenas `owner_id` em `empresas` para autorizacao final. O modelo de producao deve usar `usuarios_empresas`, porque uma empresa pode ter varios usuarios e um usuario pode operar varias empresas.

## 5. Camadas da aplicacao

### UI

Local:

```txt
app/
components/
```

Responsabilidades:

- renderizar telas;
- coletar inputs;
- mostrar estado e erros;
- nunca confiar em dados locais para autorizacao.

### API/backend inicial

Local:

```txt
app/api/
```

Responsabilidades:

- validar sessao;
- validar payload;
- resolver tenant ativo;
- chamar services;
- retornar respostas padronizadas;
- registrar auditoria em acoes criticas.

### Modules

Local proposto:

```txt
modules/
  auth/
  empresas/
  usuarios/
  transacoes/
  billing/
  auditoria/
```

Responsabilidades:

- agrupar dominio;
- conter service, repository, validators e types do dominio;
- reduzir acoplamento entre modulos.

### Services

Responsabilidades:

- regras de negocio;
- validacao de plano;
- decisao de fluxo;
- orquestracao entre repositories;
- chamadas externas como Stripe.

### Repositories

Responsabilidades:

- acesso ao Supabase;
- queries isoladas;
- nenhum componente React deve acessar repository direto.

### Lib

Responsabilidades:

- clientes Supabase;
- configuracao de ambiente;
- respostas HTTP;
- validadores compartilhados;
- seguranca, rate limit e logs.

## 6. Estrutura final proposta

```txt
app/
  api/
    auth/
    empresas/
    usuarios/
    transacoes/
    billing/
    auditoria/
  auth/
    login/
  dashboard/
  empresas/
  transacoes/
  billing/
  layout.tsx
  page.tsx

components/
  layout/
  ui/
  dashboard/
  empresas/
  transacoes/

modules/
  auth/
    auth.service.ts
    auth.repository.ts
    auth.validators.ts
    auth.types.ts
  empresas/
    empresas.service.ts
    empresas.repository.ts
    empresas.validators.ts
    empresas.types.ts
  usuarios/
    usuarios.service.ts
    usuarios.repository.ts
    usuarios.validators.ts
    usuarios.types.ts
  transacoes/
    transacoes.service.ts
    transacoes.repository.ts
    transacoes.validators.ts
    transacoes.types.ts
  billing/
    billing.service.ts
    billing.repository.ts
    stripe.webhook.ts
    billing.types.ts
  auditoria/
    auditoria.service.ts
    auditoria.repository.ts
    auditoria.types.ts

repositories/
  supabase/

services/
  legacy/

lib/
  env.ts
  apiResponse.ts
  supabaseBrowser.ts
  supabaseServer.ts
  security.ts
  logger.ts
  rateLimit.ts
  tenant.ts

middlewares/
  tenant.ts
  securityHeaders.ts

types/
  database.ts
```

Decisao: os arquivos atuais em `services/` podem ser migrados gradualmente para `modules/*`. Nao precisa reescrever tudo de uma vez; a migracao deve acontecer por dominio.

## 7. Tenant ativo

O tenant ativo pode ser resolvido por:

1. subdominio: `empresa.app.com`;
2. header interno: `x-empresa-id`;
3. cookie seguro: `empresa_ativa`;
4. parametro controlado apenas para telas administrativas.

Fluxo seguro:

```txt
request
  -> proxy/middleware identifica usuario
  -> backend resolve empresa solicitada
  -> backend verifica usuarios_empresas
  -> repository executa query
  -> RLS valida novamente no banco
```

Alerta: `localStorage` pode guardar apenas preferencia visual de empresa ativa. Ele nao pode ser fonte de autorizacao.

## 8. RBAC

Papeis iniciais:

- `admin`
- `user`
- `financeiro`
- `contador`

Permissoes granulares:

- `empresa.read`
- `empresa.update`
- `usuario.invite`
- `usuario.manage_roles`
- `transacao.read`
- `transacao.create`
- `transacao.update`
- `transacao.delete`
- `billing.manage`
- `audit.read`

Decisao: roles simplificam UX, permissoes sustentam escala. O backend deve checar permissoes sensiveis, e o banco deve reforcar com RLS.

## 9. Billing e planos

Plano controla limites:

- maximo de usuarios;
- maximo de empresas;
- maximo de transacoes mensais;
- recursos habilitados;
- status de assinatura.

Fluxo:

```txt
usuario tenta criar recurso
  -> API valida permissao
  -> API valida plano
  -> repository grava
  -> audit log registra
```

Stripe entra como provedor externo, mas o estado operacional fica em tabelas internas: `planos`, `assinaturas`, `billing_events`.

## 10. Convites seguros

Convite deve conter:

- token unico com hash armazenado;
- expiracao;
- empresa vinculada;
- role pretendida;
- status;
- data de uso.

Nunca armazenar token puro. O link envia token puro ao usuario, mas o banco guarda somente hash.

## 11. Auditoria

Toda acao critica deve registrar:

- `user_id`;
- `empresa_id`;
- `action`;
- `resource_type`;
- `resource_id`;
- `before`;
- `after`;
- `ip`;
- `user_agent`;
- `created_at`.

A auditoria deve ser append-only. Usuario comum nao pode editar nem apagar logs.

## 12. Observabilidade

No monolito:

- logs estruturados em JSON;
- `request_id` por chamada;
- captura de erro em API Routes;
- metricas de latencia por modulo.

Na evolucao:

- tracing distribuido;
- OpenTelemetry;
- dashboards por dominio;
- alertas para erros 5xx, falhas de webhook e negacoes RLS inesperadas.

## 13. Hardening

Obrigatorio antes de producao:

- rate limit em login, convites e webhooks;
- headers de seguranca;
- CSP;
- validacao de payload;
- protecao contra brute force;
- cookies `httpOnly`, `sameSite` e `secure`;
- segredo de webhook Stripe;
- service role key somente server-side;
- revisao de todas as politicas RLS.

## 14. Design system baseado nos prints

O layout de produto deve seguir:

- sidebar fixa verde escuro;
- marca no topo;
- usuario logado com badge de papel;
- navegacao por departamentos;
- header branco com titulo e data;
- cards brancos com borda suave;
- faixa hero verde escuro por modulo;
- botoes primarios em verde/dourado;
- indicadores financeiros e fiscais em cards compactos.

Funcoes aproveitaveis dos prints:

- Dashboard com avisos, noticias e alertas;
- Departamento Principal para clientes/setores;
- Departamento Contabil;
- Departamento Fiscal;
- IRPF;
- Departamento Pessoal;
- Comercial;
- SAP;
- Legal/Societario;
- Configuracoes;
- Avisos/Anuncios.

Decisao: criar `AppShell` como componente central visual e evoluir paginas por modulo sem duplicar sidebar/header.

## 15. Evolucao arquitetural

### Fase 1 - Monolito modular

- Next.js + API Routes;
- Supabase Auth/Postgres/RLS;
- modulos internos bem separados.

### Fase 2 - Backend dedicado

- extrair APIs sensiveis para servico Node/Nest/Fastify;
- manter Next.js como frontend/BFF;
- workers para billing, emails e auditoria.

### Fase 3 - Event-driven

- eventos de dominio;
- fila para tarefas assíncronas;
- webhooks processados por workers;
- audit logs e billing via eventos.

### Fase 4 - Big Tech scale

- API Gateway;
- servicos por dominio;
- Redis para cache e rate limit;
- Kafka/RabbitMQ para eventos;
- sharding por empresa;
- multi-regiao;
- replicacao e disaster recovery.

## 16. Alertas de arquitetura

- Nao manter super admin hardcoded em producao.
- Nao usar `owner_id` como unico modelo de permissao.
- Nao depender de `localStorage` para tenant.
- Nao usar service role em componentes ou browser.
- Nao criar API que aceite `empresa_id` sem validar vinculo.
- Nao confiar em filtros do frontend para isolamento de dados.
- Nao liberar telas financeiras sem auditoria.

## 17. Proxima parte

A Parte 2 deve substituir o schema inicial por um SQL de producao com:

- `empresas`;
- `usuarios`;
- `usuarios_empresas`;
- `roles`;
- `permissoes`;
- `roles_permissoes`;
- `transacoes`;
- `planos`;
- `assinaturas`;
- `convites`;
- `audit_logs`;
- RLS completa em todas as tabelas;
- indices, constraints e funcoes auxiliares.
