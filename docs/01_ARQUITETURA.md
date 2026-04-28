# Parte 1 - Arquitetura do ERP Contabil SaaS

## Stack definida

- Frontend: Next.js com App Router
- Backend: API Routes do Next.js
- Banco de dados: Supabase PostgreSQL
- Autenticacao: Supabase Auth
- Deploy: Vercel
- Modelo: SaaS multiempresa, onde um usuario pode gerenciar varias empresas

## Estrutura de pastas recomendada

```txt
app/
  api/
    health/
      route.ts
    companies/
      route.ts
      [companyId]/
        route.ts
    transactions/
      route.ts
    dashboard/
      route.ts
  auth/
    login/
      page.tsx
    register/
      page.tsx
  dashboard/
    page.tsx
  companies/
    page.tsx
    [companyId]/
      page.tsx
  finance/
    page.tsx
  taxes/
    page.tsx
  layout.tsx
  page.tsx

components/
  layout/
    AppShell.tsx
    Sidebar.tsx
    Topbar.tsx
  ui/
    Button.tsx
    Card.tsx
    EmptyState.tsx
    Input.tsx
  companies/
    CompanyForm.tsx
    CompanyList.tsx
    ActiveCompanySelector.tsx
  finance/
    TransactionForm.tsx
    TransactionList.tsx
    TransactionFilters.tsx
  dashboard/
    FinancialSummary.tsx
    MonthlyChart.tsx

lib/
  supabaseClient.ts
  supabaseServer.ts
  env.ts
  apiResponse.ts
  validators.ts

services/
  companyService.ts
  transactionService.ts
  taxService.ts
  userService.ts

types/
  company.ts
  transaction.ts
  tax.ts
  user.ts

docs/
  01_ARQUITETURA.md
  02_SCHEMA_SUPABASE.sql
```

## Responsabilidade de cada camada

### `app/`

Camada de rotas do Next.js. As telas ficam em `page.tsx`, os layouts em `layout.tsx` e o backend interno em `app/api/**/route.ts`.

### `components/`

Camada visual reutilizavel. Componentes de UI nao devem conter regra pesada de banco; eles recebem dados por props ou chamam hooks/services.

### `lib/`

Infraestrutura compartilhada: clientes Supabase, validacao de ambiente, respostas padronizadas de API e validadores comuns.

### `services/`

Camada de regras de negocio e acesso a dados. API Routes e telas chamam services para evitar duplicacao de regra.

### `types/`

Tipos TypeScript compartilhados entre frontend, backend e services.

## Modelo multi-tenant

O sistema deve considerar que:

- Um usuario pode ter varias empresas.
- Uma empresa pertence a um usuario dono ou a varios usuarios por permissao futura.
- Toda tabela operacional deve possuir `company_id`.
- Consultas devem filtrar sempre por empresa e usuario autenticado.
- O Supabase deve aplicar Row Level Security para impedir acesso cruzado entre empresas.

No MVP, o relacionamento pode ser:

```txt
auth.users 1 -> N companies
companies 1 -> N transactions
companies 1 -> N categories
companies 1 -> N employees
companies 1 -> N invoices
companies 1 -> N taxes
```

Para uma fase mais avancada, criar `company_members` para permitir varios usuarios na mesma empresa com papeis como `owner`, `admin`, `accountant` e `viewer`.

## Fluxo tecnico principal

1. Usuario autentica pelo Supabase Auth.
2. Middleware protege rotas privadas.
3. Frontend chama API Routes.
4. API Route valida sessao, payload e permissao.
5. API Route chama service.
6. Service consulta Supabase.
7. Supabase RLS reforca seguranca no banco.
8. Frontend renderiza os dados.

## Configuracao inicial

### Variaveis de ambiente

Criar `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` nunca deve ser usada no frontend. Use apenas em rotas server-side quando for realmente necessario.

### Scripts

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  }
}
```

### Deploy na Vercel

No painel da Vercel:

- adicionar `NEXT_PUBLIC_SUPABASE_URL`
- adicionar `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- adicionar `SUPABASE_SERVICE_ROLE_KEY`, se APIs administrativas forem usadas
- conectar o repositorio
- usar build padrao do Next.js

## Padroes de codigo

- Nomes em ingles para codigo: `companies`, `transactions`, `taxes`
- Textos da interface em portugues
- Services com funcoes pequenas e previsiveis
- API Routes retornando JSON padronizado
- Validacao de payload antes de gravar no banco
- Tratamento consistente de erros
- Separacao clara entre UI, API, regra de negocio e banco

## Proxima etapa

A Parte 2 deve criar o schema SQL completo do Supabase com tabelas, relacionamentos, RLS, politicas e indices.
