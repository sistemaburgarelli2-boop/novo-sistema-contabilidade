-- PARTE 2 - Banco de dados + RLS para ERP Contabil SaaS multi-tenant
-- Execute no SQL Editor do Supabase.
-- Este schema foi desenhado para producao: isolamento por empresa, RBAC, planos,
-- billing, convites e auditoria.

create extension if not exists "pgcrypto";

-- =========================================================
-- TIPOS
-- =========================================================

do $$
begin
  create type public.empresa_status as enum ('ativa', 'suspensa', 'cancelada', 'encerrada');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.usuario_empresa_status as enum ('ativo', 'pendente', 'bloqueado', 'removido');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.transacao_tipo as enum ('entrada', 'saida');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.assinatura_status as enum ('trial', 'active', 'past_due', 'canceled', 'blocked');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.convite_status as enum ('pendente', 'aceito', 'expirado', 'cancelado');
exception
  when duplicate_object then null;
end $$;

-- =========================================================
-- FUNCOES BASE
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.usuarios (id, email, nome)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'nome', new.raw_user_meta_data->>'full_name', '')
  )
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();

  return new;
end;
$$;

-- =========================================================
-- TABELAS
-- =========================================================

create table if not exists public.usuarios (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  email text not null,
  telefone text,
  avatar_url text,
  super_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usuarios_email_not_empty check (length(trim(email)) > 3)
);

create table if not exists public.planos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  nome text not null,
  preco_centavos integer not null default 0,
  limite_empresas integer not null default 1,
  limite_usuarios integer not null default 3,
  limite_transacoes_mes integer not null default 1000,
  recursos jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint planos_preco_check check (preco_centavos >= 0),
  constraint planos_limites_check check (
    limite_empresas > 0 and limite_usuarios > 0 and limite_transacoes_mes > 0
  )
);

create table if not exists public.empresas (
  id uuid primary key default gen_random_uuid(),
  plano_id uuid references public.planos(id) on delete restrict,
  nome_legal text not null,
  nome_fantasia text,
  cnpj text,
  regime_tributario text,
  status public.empresa_status not null default 'ativa',
  subdominio text unique,
  cidade text,
  estado text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint empresas_nome_legal_not_empty check (length(trim(nome_legal)) > 1),
  constraint empresas_subdominio_format check (
    subdominio is null or subdominio ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'
  )
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  chave text not null,
  descricao text,
  sistema boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint roles_unique_chave_empresa unique (empresa_id, chave),
  constraint roles_chave_format check (chave ~ '^[a-z0-9_.-]+$')
);

create table if not exists public.permissoes (
  id uuid primary key default gen_random_uuid(),
  chave text not null unique,
  descricao text,
  modulo text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint permissoes_chave_format check (chave ~ '^[a-z0-9_.-]+$')
);

create table if not exists public.roles_permissoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  permissao_id uuid not null references public.permissoes(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint roles_permissoes_unique unique (empresa_id, role_id, permissao_id)
);

create table if not exists public.usuarios_empresas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  usuario_id uuid not null references public.usuarios(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  status public.usuario_empresa_status not null default 'ativo',
  criado_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint usuarios_empresas_unique unique (empresa_id, usuario_id)
);

create table if not exists public.assinaturas (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null unique references public.empresas(id) on delete cascade,
  plano_id uuid not null references public.planos(id) on delete restrict,
  stripe_customer_id text,
  stripe_subscription_id text,
  status public.assinatura_status not null default 'trial',
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.convites (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  email text not null,
  role_id uuid not null references public.roles(id) on delete restrict,
  token_hash text not null unique,
  status public.convite_status not null default 'pendente',
  convidado_por uuid references public.usuarios(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint convites_email_not_empty check (length(trim(email)) > 3),
  constraint convites_expiracao_check check (expires_at > created_at)
);

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  nome text not null,
  tipo public.transacao_tipo not null,
  cor text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categorias_unique_nome_tipo unique (empresa_id, nome, tipo),
  constraint categorias_nome_not_empty check (length(trim(nome)) > 0)
);

create table if not exists public.transacoes (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.empresas(id) on delete cascade,
  categoria_id uuid references public.categorias(id) on delete set null,
  tipo public.transacao_tipo not null,
  descricao text not null,
  valor numeric(14, 2) not null,
  data_transacao date not null,
  meio_pagamento text,
  documento text,
  observacoes text,
  criado_por uuid references public.usuarios(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transacoes_valor_check check (valor >= 0),
  constraint transacoes_descricao_not_empty check (length(trim(descricao)) > 0)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete set null,
  user_id uuid references public.usuarios(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  before_data jsonb,
  after_data jsonb,
  ip inet,
  user_agent text,
  request_id text,
  created_at timestamptz not null default now(),
  constraint audit_logs_action_not_empty check (length(trim(action)) > 0),
  constraint audit_logs_resource_not_empty check (length(trim(resource_type)) > 0)
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references public.empresas(id) on delete set null,
  stripe_event_id text not null unique,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz,
  created_at timestamptz not null default now()
);

-- =========================================================
-- INDICES
-- =========================================================

create index if not exists idx_empresas_plano_id on public.empresas(plano_id);
create index if not exists idx_empresas_cnpj on public.empresas(cnpj);
create index if not exists idx_usuarios_email on public.usuarios(email);
create index if not exists idx_roles_empresa_id on public.roles(empresa_id);
create index if not exists idx_roles_permissoes_empresa_id on public.roles_permissoes(empresa_id);
create index if not exists idx_roles_permissoes_role_id on public.roles_permissoes(role_id);
create index if not exists idx_usuarios_empresas_usuario_id on public.usuarios_empresas(usuario_id);
create index if not exists idx_usuarios_empresas_empresa_id on public.usuarios_empresas(empresa_id);
create index if not exists idx_assinaturas_empresa_id on public.assinaturas(empresa_id);
create index if not exists idx_convites_empresa_id on public.convites(empresa_id);
create index if not exists idx_convites_token_hash on public.convites(token_hash);
create index if not exists idx_categorias_empresa_id on public.categorias(empresa_id);
create index if not exists idx_transacoes_empresa_data on public.transacoes(empresa_id, data_transacao);
create index if not exists idx_transacoes_categoria_id on public.transacoes(categoria_id);
create index if not exists idx_audit_logs_empresa_created on public.audit_logs(empresa_id, created_at desc);
create index if not exists idx_billing_events_empresa_id on public.billing_events(empresa_id);

-- =========================================================
-- FUNCOES DE AUTORIZACAO
-- =========================================================

-- Verifica se o usuario autenticado pertence a empresa.
create or replace function public.tem_acesso_empresa(p_empresa_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios_empresas ue
    where ue.empresa_id = p_empresa_id
      and ue.usuario_id = auth.uid()
      and ue.status = 'ativo'
  );
$$;

-- Verifica permissao granular via role -> role_permissoes -> permissoes.
create or replace function public.tem_permissao(p_empresa_id uuid, p_chave text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.usuarios_empresas ue
    join public.roles r
      on r.id = ue.role_id
     and r.empresa_id = ue.empresa_id
    join public.roles_permissoes rp
      on rp.role_id = r.id
     and rp.empresa_id = ue.empresa_id
    join public.permissoes p
      on p.id = rp.permissao_id
    where ue.empresa_id = p_empresa_id
      and ue.usuario_id = auth.uid()
      and ue.status = 'ativo'
      and p.chave = p_chave
  );
$$;

-- =========================================================
-- TRIGGERS
-- =========================================================

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists set_usuarios_updated_at on public.usuarios;
create trigger set_usuarios_updated_at
before update on public.usuarios
for each row execute function public.set_updated_at();

drop trigger if exists set_planos_updated_at on public.planos;
create trigger set_planos_updated_at
before update on public.planos
for each row execute function public.set_updated_at();

drop trigger if exists set_empresas_updated_at on public.empresas;
create trigger set_empresas_updated_at
before update on public.empresas
for each row execute function public.set_updated_at();

drop trigger if exists set_roles_updated_at on public.roles;
create trigger set_roles_updated_at
before update on public.roles
for each row execute function public.set_updated_at();

drop trigger if exists set_permissoes_updated_at on public.permissoes;
create trigger set_permissoes_updated_at
before update on public.permissoes
for each row execute function public.set_updated_at();

drop trigger if exists set_usuarios_empresas_updated_at on public.usuarios_empresas;
create trigger set_usuarios_empresas_updated_at
before update on public.usuarios_empresas
for each row execute function public.set_updated_at();

drop trigger if exists set_assinaturas_updated_at on public.assinaturas;
create trigger set_assinaturas_updated_at
before update on public.assinaturas
for each row execute function public.set_updated_at();

drop trigger if exists set_convites_updated_at on public.convites;
create trigger set_convites_updated_at
before update on public.convites
for each row execute function public.set_updated_at();

drop trigger if exists set_categorias_updated_at on public.categorias;
create trigger set_categorias_updated_at
before update on public.categorias
for each row execute function public.set_updated_at();

drop trigger if exists set_transacoes_updated_at on public.transacoes;
create trigger set_transacoes_updated_at
before update on public.transacoes
for each row execute function public.set_updated_at();

-- =========================================================
-- RLS
-- =========================================================

alter table public.usuarios enable row level security;
alter table public.planos enable row level security;
alter table public.empresas enable row level security;
alter table public.roles enable row level security;
alter table public.permissoes enable row level security;
alter table public.roles_permissoes enable row level security;
alter table public.usuarios_empresas enable row level security;
alter table public.assinaturas enable row level security;
alter table public.convites enable row level security;
alter table public.categorias enable row level security;
alter table public.transacoes enable row level security;
alter table public.audit_logs enable row level security;
alter table public.billing_events enable row level security;

-- Perfis
drop policy if exists "usuarios_select_self" on public.usuarios;
create policy "usuarios_select_self"
on public.usuarios for select
using (
  id = auth.uid()
  or exists (
    select 1
    from public.usuarios_empresas ue_self
    join public.usuarios_empresas ue_other
      on ue_other.empresa_id = ue_self.empresa_id
    where ue_self.usuario_id = auth.uid()
      and ue_self.status = 'ativo'
      and ue_other.usuario_id = usuarios.id
      and ue_other.status = 'ativo'
  )
);

drop policy if exists "usuarios_insert_self" on public.usuarios;
create policy "usuarios_insert_self"
on public.usuarios for insert
with check (id = auth.uid());

drop policy if exists "usuarios_update_self" on public.usuarios;
create policy "usuarios_update_self"
on public.usuarios for update
using (id = auth.uid())
with check (id = auth.uid() and super_admin = false);

-- Planos sao catalogo publico autenticado. Escrita deve ser feita com service role/admin server-side.
drop policy if exists "planos_select_authenticated" on public.planos;
create policy "planos_select_authenticated"
on public.planos for select
to authenticated
using (ativo = true);

-- Empresas
drop policy if exists "empresas_select_member" on public.empresas;
create policy "empresas_select_member"
on public.empresas for select
using (public.tem_acesso_empresa(id));

drop policy if exists "empresas_insert_server_only" on public.empresas;
create policy "empresas_insert_server_only"
on public.empresas for insert
to authenticated
with check (false);

drop policy if exists "empresas_update_admin" on public.empresas;
create policy "empresas_update_admin"
on public.empresas for update
using (public.tem_permissao(id, 'empresa.update'))
with check (public.tem_permissao(id, 'empresa.update'));

drop policy if exists "empresas_delete_admin" on public.empresas;
create policy "empresas_delete_admin"
on public.empresas for delete
using (public.tem_permissao(id, 'empresa.delete'));

-- Roles
drop policy if exists "roles_select_member" on public.roles;
create policy "roles_select_member"
on public.roles for select
using (public.tem_acesso_empresa(empresa_id));

drop policy if exists "roles_manage_admin" on public.roles;
create policy "roles_manage_admin"
on public.roles for all
using (public.tem_permissao(empresa_id, 'rbac.manage'))
with check (public.tem_permissao(empresa_id, 'rbac.manage'));

-- Permissoes sao catalogo legivel para usuarios autenticados.
drop policy if exists "permissoes_select_authenticated" on public.permissoes;
create policy "permissoes_select_authenticated"
on public.permissoes for select
to authenticated
using (true);

-- Roles permissoes
drop policy if exists "roles_permissoes_select_member" on public.roles_permissoes;
create policy "roles_permissoes_select_member"
on public.roles_permissoes for select
using (public.tem_acesso_empresa(empresa_id));

drop policy if exists "roles_permissoes_manage_admin" on public.roles_permissoes;
create policy "roles_permissoes_manage_admin"
on public.roles_permissoes for all
using (public.tem_permissao(empresa_id, 'rbac.manage'))
with check (public.tem_permissao(empresa_id, 'rbac.manage'));

-- Usuarios empresas
drop policy if exists "usuarios_empresas_select_member" on public.usuarios_empresas;
create policy "usuarios_empresas_select_member"
on public.usuarios_empresas for select
using (public.tem_acesso_empresa(empresa_id));

drop policy if exists "usuarios_empresas_insert_admin" on public.usuarios_empresas;
create policy "usuarios_empresas_insert_admin"
on public.usuarios_empresas for insert
with check (public.tem_permissao(empresa_id, 'usuario.manage'));

drop policy if exists "usuarios_empresas_update_admin" on public.usuarios_empresas;
create policy "usuarios_empresas_update_admin"
on public.usuarios_empresas for update
using (public.tem_permissao(empresa_id, 'usuario.manage'))
with check (public.tem_permissao(empresa_id, 'usuario.manage'));

drop policy if exists "usuarios_empresas_delete_admin" on public.usuarios_empresas;
create policy "usuarios_empresas_delete_admin"
on public.usuarios_empresas for delete
using (public.tem_permissao(empresa_id, 'usuario.manage'));

-- Assinaturas
drop policy if exists "assinaturas_select_member" on public.assinaturas;
create policy "assinaturas_select_member"
on public.assinaturas for select
using (public.tem_acesso_empresa(empresa_id));

drop policy if exists "assinaturas_manage_billing" on public.assinaturas;
create policy "assinaturas_manage_billing"
on public.assinaturas for all
using (public.tem_permissao(empresa_id, 'billing.manage'))
with check (public.tem_permissao(empresa_id, 'billing.manage'));

-- Convites
drop policy if exists "convites_select_admin" on public.convites;
create policy "convites_select_admin"
on public.convites for select
using (public.tem_permissao(empresa_id, 'usuario.invite'));

drop policy if exists "convites_insert_admin" on public.convites;
create policy "convites_insert_admin"
on public.convites for insert
with check (public.tem_permissao(empresa_id, 'usuario.invite'));

drop policy if exists "convites_update_admin" on public.convites;
create policy "convites_update_admin"
on public.convites for update
using (public.tem_permissao(empresa_id, 'usuario.invite'))
with check (public.tem_permissao(empresa_id, 'usuario.invite'));

-- Categorias
drop policy if exists "categorias_select_member" on public.categorias;
create policy "categorias_select_member"
on public.categorias for select
using (public.tem_acesso_empresa(empresa_id));

drop policy if exists "categorias_manage_financeiro" on public.categorias;
create policy "categorias_manage_financeiro"
on public.categorias for all
using (public.tem_permissao(empresa_id, 'transacao.manage'))
with check (public.tem_permissao(empresa_id, 'transacao.manage'));

-- Transacoes
drop policy if exists "transacoes_select_member" on public.transacoes;
create policy "transacoes_select_member"
on public.transacoes for select
using (
  public.tem_permissao(empresa_id, 'transacao.read')
  or public.tem_permissao(empresa_id, 'transacao.manage')
);

drop policy if exists "transacoes_insert_financeiro" on public.transacoes;
create policy "transacoes_insert_financeiro"
on public.transacoes for insert
with check (
  public.tem_permissao(empresa_id, 'transacao.create')
  or public.tem_permissao(empresa_id, 'transacao.manage')
);

drop policy if exists "transacoes_update_financeiro" on public.transacoes;
create policy "transacoes_update_financeiro"
on public.transacoes for update
using (
  public.tem_permissao(empresa_id, 'transacao.update')
  or public.tem_permissao(empresa_id, 'transacao.manage')
)
with check (
  public.tem_permissao(empresa_id, 'transacao.update')
  or public.tem_permissao(empresa_id, 'transacao.manage')
);

drop policy if exists "transacoes_delete_financeiro" on public.transacoes;
create policy "transacoes_delete_financeiro"
on public.transacoes for delete
using (
  public.tem_permissao(empresa_id, 'transacao.delete')
  or public.tem_permissao(empresa_id, 'transacao.manage')
);

-- Auditoria: append-only; leitura apenas por permissao.
drop policy if exists "audit_logs_select_admin" on public.audit_logs;
create policy "audit_logs_select_admin"
on public.audit_logs for select
using (empresa_id is not null and public.tem_permissao(empresa_id, 'audit.read'));

drop policy if exists "audit_logs_insert_server_only" on public.audit_logs;
create policy "audit_logs_insert_server_only"
on public.audit_logs for insert
to authenticated
with check (false);

-- Billing events: leitura por billing admin; escrita deve ocorrer via service role/webhook.
drop policy if exists "billing_events_select_billing" on public.billing_events;
create policy "billing_events_select_billing"
on public.billing_events for select
using (empresa_id is not null and public.tem_permissao(empresa_id, 'billing.manage'));

-- =========================================================
-- SEEDS DE PERMISSOES E PLANO BASE
-- =========================================================

insert into public.permissoes (chave, modulo, descricao)
values
  ('empresa.read', 'empresas', 'Visualizar dados da empresa'),
  ('empresa.update', 'empresas', 'Editar dados da empresa'),
  ('empresa.delete', 'empresas', 'Excluir empresa'),
  ('usuario.invite', 'usuarios', 'Convidar usuarios'),
  ('usuario.manage', 'usuarios', 'Gerenciar usuarios e vinculos'),
  ('rbac.manage', 'rbac', 'Gerenciar roles e permissoes'),
  ('transacao.read', 'transacoes', 'Visualizar transacoes'),
  ('transacao.create', 'transacoes', 'Criar transacoes'),
  ('transacao.update', 'transacoes', 'Editar transacoes'),
  ('transacao.delete', 'transacoes', 'Excluir transacoes'),
  ('transacao.manage', 'transacoes', 'Gerenciar financeiro completo'),
  ('billing.manage', 'billing', 'Gerenciar plano e assinatura'),
  ('audit.read', 'auditoria', 'Visualizar auditoria')
on conflict (chave) do update
set modulo = excluded.modulo,
    descricao = excluded.descricao,
    updated_at = now();

insert into public.planos (
  codigo,
  nome,
  preco_centavos,
  limite_empresas,
  limite_usuarios,
  limite_transacoes_mes,
  recursos
)
values (
  'starter',
  'Starter',
  0,
  1,
  3,
  1000,
  '{"dashboard": true, "financeiro": true, "auditoria": true}'::jsonb
)
on conflict (codigo) do update
set nome = excluded.nome,
    limite_empresas = excluded.limite_empresas,
    limite_usuarios = excluded.limite_usuarios,
    limite_transacoes_mes = excluded.limite_transacoes_mes,
    recursos = excluded.recursos,
    updated_at = now();

-- =========================================================
-- ALERTAS OPERACIONAIS
-- =========================================================
-- 1. Criacao inicial de empresa + role admin + vinculo deve ocorrer via API server-side
--    em uma transacao controlada, usando service role ou RPC SECURITY DEFINER revisada.
-- 2. Convites devem armazenar apenas hash do token, nunca o token puro.
-- 3. Webhooks Stripe devem usar service role no backend e validar assinatura Stripe.
-- 4. INSERT direto em empresas e audit_logs esta bloqueado por RLS. Use backend.
-- 5. audit_logs nao possui policy de UPDATE/DELETE de proposito.
