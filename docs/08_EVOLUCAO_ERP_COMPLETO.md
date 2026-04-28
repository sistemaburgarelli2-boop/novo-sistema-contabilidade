# Parte 8 - Evolucao para ERP Contabil Completo

## Objetivo

Expandir o MVP para um ERP contabil completo, mantendo a arquitetura multiempresa, segura e modular.

## Novos modulos

### Contabilidade

Funcionalidades:

- Plano de contas
- Lancamentos contabeis
- Centros de custo
- Balancete
- DRE
- Balanco patrimonial
- Livro diario
- Livro razao
- Fechamento mensal

Tabelas sugeridas:

- `chart_of_accounts`
- `accounting_entries`
- `accounting_entry_lines`
- `cost_centers`
- `accounting_periods`

APIs sugeridas:

- `GET /api/accounting/accounts`
- `POST /api/accounting/accounts`
- `GET /api/accounting/entries`
- `POST /api/accounting/entries`
- `GET /api/reports/dre`
- `GET /api/reports/balance-sheet`

### Emissao de notas fiscais

Funcionalidades:

- Cadastro de clientes
- Servicos/produtos
- Rascunho de nota
- Integracao futura com prefeitura/SEFAZ/provedor fiscal
- Armazenamento de XML/PDF
- Cancelamento

Tabelas sugeridas:

- `customers`
- `products`
- `services`
- `invoice_items`
- `invoice_events`

APIs sugeridas:

- `GET /api/invoices`
- `POST /api/invoices`
- `POST /api/invoices/[invoiceId]/issue`
- `POST /api/invoices/[invoiceId]/cancel`

### RH e folha de pagamento

Funcionalidades:

- Cadastro de funcionarios
- Cargos e salarios
- Eventos de folha
- Pro-labore
- Ferias
- Rescisao
- Encargos
- Holerites

Tabelas sugeridas:

- `payroll_runs`
- `payroll_events`
- `employee_benefits`
- `vacations`
- `terminations`

APIs sugeridas:

- `GET /api/employees`
- `POST /api/employees`
- `GET /api/payroll`
- `POST /api/payroll/run`

### Juridico e societario

Funcionalidades:

- Contratos sociais
- Alteracoes contratuais
- Procuracoes
- Certidoes
- Processos de abertura, alteracao e baixa
- Controle de prazos

Tabelas sugeridas:

- `legal_processes`
- `legal_documents`
- `company_changes`
- `signatures`
- `certificates`

APIs sugeridas:

- `GET /api/legal/processes`
- `POST /api/legal/processes`
- `PATCH /api/legal/processes/[processId]`
- `POST /api/legal/documents`

## Schema adicional sugerido

```sql
create table public.chart_of_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  code text not null,
  name text not null,
  type text not null,
  parent_id uuid references public.chart_of_accounts(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounting_entries (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  entry_date date not null,
  description text not null,
  source text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.accounting_entry_lines (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.accounting_entries(id) on delete cascade,
  account_id uuid not null references public.chart_of_accounts(id),
  debit numeric(14, 2) not null default 0,
  credit numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint accounting_entry_lines_balance_check check (debit >= 0 and credit >= 0)
);
```

## Ordem de expansao

1. Consolidar financeiro e categorias.
2. Gerar lancamentos contabeis a partir das transacoes.
3. Criar DRE com base em categorias/plano de contas.
4. Criar emissao de notas como estrutura base.
5. Evoluir folha.
6. Adicionar juridico/societario.
7. Criar auditoria e permissoes por papel.

## Regra de arquitetura

Todo novo modulo deve seguir o mesmo padrao:

- tabela com `company_id`
- RLS baseada em empresa
- API Route protegida
- service no frontend
- componentes separados por modulo
- tipos em `types/`
