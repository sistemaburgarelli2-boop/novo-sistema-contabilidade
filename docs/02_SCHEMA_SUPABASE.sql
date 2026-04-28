-- Parte 2 - Schema Supabase PostgreSQL para ERP Contabil SaaS
-- Execute este arquivo no SQL Editor do Supabase.

create extension if not exists "pgcrypto";

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  role text not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users(id) on delete cascade,
  legal_name text not null,
  trade_name text,
  cnpj text,
  state_registration text,
  municipal_registration text,
  legal_nature text,
  company_size text,
  tax_regime text,
  main_cnae text,
  status text not null default 'analysis',
  lifecycle_stage text not null default 'analysis',
  address_line text,
  address_number text,
  address_complement text,
  district text,
  city text,
  state text,
  zip_code text,
  opened_at date,
  closed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint companies_status_check check (
    status in ('analysis', 'opening', 'active', 'changing', 'closing', 'closed', 'inactive')
  ),
  constraint companies_lifecycle_stage_check check (
    lifecycle_stage in ('analysis', 'opening', 'active', 'changing', 'closing', 'closed')
  ),
  constraint companies_tax_regime_check check (
    tax_regime is null or tax_regime in ('mei', 'simples', 'presumido', 'real')
  )
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_members_role_check check (role in ('owner', 'admin', 'accountant', 'viewer')),
  constraint company_members_unique_user unique (company_id, user_id)
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  type text not null,
  color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_type_check check (type in ('income', 'expense')),
  constraint categories_unique_name unique (company_id, name, type)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type text not null,
  description text not null,
  amount numeric(14, 2) not null,
  transaction_date date not null,
  payment_method text,
  document_number text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_type_check check (type in ('income', 'expense')),
  constraint transactions_amount_check check (amount >= 0)
);

create table if not exists public.taxes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  tax_name text not null,
  tax_regime text,
  period_start date not null,
  period_end date not null,
  revenue_amount numeric(14, 2) not null default 0,
  tax_rate numeric(7, 4) not null default 0,
  calculated_amount numeric(14, 2) not null default 0,
  due_date date,
  paid_at date,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint taxes_status_check check (status in ('open', 'paid', 'overdue', 'canceled')),
  constraint taxes_period_check check (period_end >= period_start)
);

create table if not exists public.employees (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  full_name text not null,
  cpf text,
  email text,
  phone text,
  position text,
  salary numeric(14, 2),
  admission_date date,
  termination_date date,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint employees_status_check check (status in ('active', 'inactive', 'terminated')),
  constraint employees_salary_check check (salary is null or salary >= 0)
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  transaction_id uuid references public.transactions(id) on delete set null,
  number text,
  series text,
  customer_name text,
  customer_document text,
  issue_date date not null,
  service_amount numeric(14, 2) not null default 0,
  tax_amount numeric(14, 2) not null default 0,
  total_amount numeric(14, 2) not null default 0,
  status text not null default 'draft',
  access_key text,
  xml_url text,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint invoices_status_check check (status in ('draft', 'issued', 'canceled', 'error')),
  constraint invoices_amount_check check (service_amount >= 0 and tax_amount >= 0 and total_amount >= 0)
);

create index if not exists idx_companies_owner_id on public.companies(owner_id);
create index if not exists idx_companies_cnpj on public.companies(cnpj);
create index if not exists idx_company_members_company_id on public.company_members(company_id);
create index if not exists idx_company_members_user_id on public.company_members(user_id);
create index if not exists idx_categories_company_id on public.categories(company_id);
create index if not exists idx_transactions_company_id on public.transactions(company_id);
create index if not exists idx_transactions_company_date on public.transactions(company_id, transaction_date);
create index if not exists idx_transactions_category_id on public.transactions(category_id);
create index if not exists idx_taxes_company_id on public.taxes(company_id);
create index if not exists idx_taxes_due_date on public.taxes(due_date);
create index if not exists idx_employees_company_id on public.employees(company_id);
create index if not exists idx_invoices_company_id on public.invoices(company_id);
create index if not exists idx_invoices_issue_date on public.invoices(company_id, issue_date);

drop trigger if exists set_users_updated_at on public.users;
create trigger set_users_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists set_companies_updated_at on public.companies;
create trigger set_companies_updated_at
before update on public.companies
for each row execute function public.set_updated_at();

drop trigger if exists set_company_members_updated_at on public.company_members;
create trigger set_company_members_updated_at
before update on public.company_members
for each row execute function public.set_updated_at();

drop trigger if exists set_categories_updated_at on public.categories;
create trigger set_categories_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists set_taxes_updated_at on public.taxes;
create trigger set_taxes_updated_at
before update on public.taxes
for each row execute function public.set_updated_at();

drop trigger if exists set_employees_updated_at on public.employees;
create trigger set_employees_updated_at
before update on public.employees
for each row execute function public.set_updated_at();

drop trigger if exists set_invoices_updated_at on public.invoices;
create trigger set_invoices_updated_at
before update on public.invoices
for each row execute function public.set_updated_at();

create or replace function public.handle_new_auth_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

alter table public.users enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.taxes enable row level security;
alter table public.employees enable row level security;
alter table public.invoices enable row level security;

create or replace function public.is_company_member(target_company_id uuid)
returns boolean as $$
  select exists (
    select 1
    from public.companies c
    where c.id = target_company_id
      and c.owner_id = auth.uid()
  )
  or exists (
    select 1
    from public.company_members cm
    where cm.company_id = target_company_id
      and cm.user_id = auth.uid()
  );
$$ language sql stable security definer;

drop policy if exists "users can read own profile" on public.users;
create policy "users can read own profile"
on public.users for select
using (id = auth.uid());

drop policy if exists "users can update own profile" on public.users;
create policy "users can update own profile"
on public.users for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "users can insert own profile" on public.users;
create policy "users can insert own profile"
on public.users for insert
with check (id = auth.uid());

drop policy if exists "users can read own companies" on public.companies;
create policy "users can read own companies"
on public.companies for select
using (owner_id = auth.uid() or public.is_company_member(id));

drop policy if exists "users can create own companies" on public.companies;
create policy "users can create own companies"
on public.companies for insert
with check (owner_id = auth.uid());

drop policy if exists "owners can update companies" on public.companies;
create policy "owners can update companies"
on public.companies for update
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

drop policy if exists "owners can delete companies" on public.companies;
create policy "owners can delete companies"
on public.companies for delete
using (owner_id = auth.uid());

drop policy if exists "members can read company members" on public.company_members;
create policy "members can read company members"
on public.company_members for select
using (public.is_company_member(company_id));

drop policy if exists "owners can manage company members" on public.company_members;
create policy "owners can manage company members"
on public.company_members for all
using (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.companies c
    where c.id = company_id and c.owner_id = auth.uid()
  )
);

drop policy if exists "members can read categories" on public.categories;
create policy "members can read categories"
on public.categories for select
using (public.is_company_member(company_id));

drop policy if exists "members can manage categories" on public.categories;
create policy "members can manage categories"
on public.categories for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "members can read transactions" on public.transactions;
create policy "members can read transactions"
on public.transactions for select
using (public.is_company_member(company_id));

drop policy if exists "members can manage transactions" on public.transactions;
create policy "members can manage transactions"
on public.transactions for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "members can read taxes" on public.taxes;
create policy "members can read taxes"
on public.taxes for select
using (public.is_company_member(company_id));

drop policy if exists "members can manage taxes" on public.taxes;
create policy "members can manage taxes"
on public.taxes for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "members can read employees" on public.employees;
create policy "members can read employees"
on public.employees for select
using (public.is_company_member(company_id));

drop policy if exists "members can manage employees" on public.employees;
create policy "members can manage employees"
on public.employees for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "members can read invoices" on public.invoices;
create policy "members can read invoices"
on public.invoices for select
using (public.is_company_member(company_id));

drop policy if exists "members can manage invoices" on public.invoices;
create policy "members can manage invoices"
on public.invoices for all
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));
