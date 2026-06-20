-- =============================================================================
-- MIGRATION COMPLETA - ERP Contabil SaaS Multi-Tenant
-- =============================================================================
-- Este arquivo cria TODAS as tabelas, funcoes, triggers, RLS policies e seeds
-- necessarios para o sistema. E idempotente: pode ser executado multiplas vezes
-- sem efeito colateral graças ao uso de IF NOT EXISTS e ON CONFLICT.
--
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor).
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TIPOS ENUM
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.empresa_status AS ENUM ('ativa', 'suspensa', 'cancelada', 'encerrada');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.usuario_empresa_status AS ENUM ('ativo', 'pendente', 'bloqueado', 'removido');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transacao_tipo AS ENUM ('entrada', 'saida');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.assinatura_status AS ENUM ('trial', 'active', 'past_due', 'canceled', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.convite_status AS ENUM ('pendente', 'aceito', 'expirado', 'cancelado');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- 2. FUNCOES UTILITARIAS
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nome)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      updated_at = NOW();

  RETURN NEW;
END;
$$;

-- =============================================================================
-- 3. TABELAS PRINCIPAIS
-- =============================================================================

-- -----------------------------------------------
-- Usuarios (estende auth.users do Supabase)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  nome        TEXT,
  tipo        TEXT DEFAULT 'interno' CHECK (tipo IN ('interno', 'cliente')),
  ativo       BOOLEAN DEFAULT TRUE,
  ultimo_login TIMESTAMPTZ,
  telefone    TEXT,
  cpf         TEXT,
  avatar_url  TEXT,
  super_admin BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usuarios_email_not_empty CHECK (length(trim(email)) > 3)
);

-- -----------------------------------------------
-- Planos de assinatura
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.planos (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                TEXT NOT NULL UNIQUE,
  nome                  TEXT NOT NULL,
  descricao             TEXT,
  preco                 NUMERIC DEFAULT 0,
  preco_centavos        INTEGER NOT NULL DEFAULT 0,
  limite_transacoes     INTEGER DEFAULT 100,
  limite_empresas       INTEGER NOT NULL DEFAULT 1,
  limite_usuarios       INTEGER NOT NULL DEFAULT 3,
  limite_transacoes_mes INTEGER NOT NULL DEFAULT 1000,
  recursos              JSONB NOT NULL DEFAULT '{}'::JSONB,
  ativo                 BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT planos_preco_check CHECK (preco_centavos >= 0),
  CONSTRAINT planos_limites_check CHECK (
    limite_empresas > 0 AND limite_usuarios > 0 AND limite_transacoes_mes > 0
  )
);

-- -----------------------------------------------
-- Empresas
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.empresas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plano_id          UUID REFERENCES public.planos(id) ON DELETE RESTRICT,
  nome_legal        TEXT NOT NULL,
  nome_fantasia     TEXT,
  cnpj              TEXT,
  regime_tributario TEXT,
  status            public.empresa_status NOT NULL DEFAULT 'ativa',
  subdominio        TEXT UNIQUE,
  cidade            TEXT,
  estado            TEXT,
  responsavel       TEXT,
  metadata          JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT empresas_nome_legal_not_empty CHECK (length(trim(nome_legal)) > 1),
  CONSTRAINT empresas_subdominio_format CHECK (
    subdominio IS NULL OR subdominio ~ '^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$'
  )
);

-- -----------------------------------------------
-- Assinaturas
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.assinaturas (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id              UUID NOT NULL UNIQUE REFERENCES public.empresas(id) ON DELETE CASCADE,
  plano_id                UUID NOT NULL REFERENCES public.planos(id) ON DELETE RESTRICT,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  status                  public.assinatura_status NOT NULL DEFAULT 'trial',
  trial_ends_at           TIMESTAMPTZ,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at               TIMESTAMPTZ,
  metadata                JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- RBAC: Roles
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  chave       TEXT NOT NULL,
  nome        TEXT NOT NULL,
  descricao   TEXT,
  sistema     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT roles_unique_chave_empresa UNIQUE (empresa_id, chave),
  CONSTRAINT roles_chave_format CHECK (chave ~ '^[a-z0-9_.-]+$')
);

-- -----------------------------------------------
-- RBAC: Permissoes (catalogo global)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.permissoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave       TEXT NOT NULL UNIQUE,
  descricao   TEXT,
  modulo      TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT permissoes_chave_format CHECK (chave ~ '^[a-z0-9_.-]+$')
);

-- -----------------------------------------------
-- RBAC: Mapeamento Role <-> Permissao
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles_permissoes (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id   UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  role_id      UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permissao_id UUID NOT NULL REFERENCES public.permissoes(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT roles_permissoes_unique UNIQUE (empresa_id, role_id, permissao_id)
);

-- -----------------------------------------------
-- Vinculo Usuario <-> Empresa
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios_empresas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id  UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  role_id     UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  status      public.usuario_empresa_status NOT NULL DEFAULT 'ativo',
  criado_por  UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT usuarios_empresas_unique UNIQUE (empresa_id, usuario_id)
);

-- -----------------------------------------------
-- Convites
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.convites (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id     UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  role_id        UUID NOT NULL REFERENCES public.roles(id) ON DELETE RESTRICT,
  token          TEXT UNIQUE,
  token_hash     TEXT UNIQUE,
  status         public.convite_status NOT NULL DEFAULT 'pendente',
  convidado_por  UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  expira_em      TIMESTAMPTZ,
  expires_at     TIMESTAMPTZ,
  accepted_at    TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT convites_email_not_empty CHECK (length(trim(email)) > 3)
);

-- -----------------------------------------------
-- Auditoria
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  usuario_id      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  user_id         UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  acao            TEXT,
  action          TEXT,
  modulo          TEXT,
  resource_type   TEXT,
  resource_id     UUID,
  detalhe         TEXT,
  dados_antes     JSONB,
  dados_depois    JSONB,
  before_data     JSONB,
  after_data      JSONB,
  ip              TEXT,
  user_agent      TEXT,
  request_id      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Billing Events (webhooks Stripe)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.billing_events (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID REFERENCES public.empresas(id) ON DELETE SET NULL,
  stripe_event_id  TEXT NOT NULL UNIQUE,
  event_type       TEXT NOT NULL,
  payload          JSONB NOT NULL,
  processed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 4. TABELAS FINANCEIRAS
-- =============================================================================

-- -----------------------------------------------
-- Categorias de transacao
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.categorias (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  tipo        public.transacao_tipo NOT NULL,
  cor         TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT categorias_unique_nome_tipo UNIQUE (empresa_id, nome, tipo),
  CONSTRAINT categorias_nome_not_empty CHECK (length(trim(nome)) > 0)
);

-- Alias em ingles para compatibilidade com modulos legados
CREATE TABLE IF NOT EXISTS public.categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT CHECK (type IN ('income', 'expense')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Transacoes financeiras
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.transacoes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  categoria_id     UUID REFERENCES public.categorias(id) ON DELETE SET NULL,
  tipo             public.transacao_tipo NOT NULL,
  descricao        TEXT NOT NULL,
  valor            NUMERIC(14,2) NOT NULL,
  data_transacao   DATE NOT NULL,
  meio_pagamento   TEXT,
  documento        TEXT,
  observacoes      TEXT,
  criado_por       UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT transacoes_valor_check CHECK (valor >= 0),
  CONSTRAINT transacoes_descricao_not_empty CHECK (length(trim(descricao)) > 0)
);

-- Alias em ingles para compatibilidade com modulos legados
CREATE TABLE IF NOT EXISTS public.transactions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id   UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  category_id  UUID,
  type         TEXT CHECK (type IN ('income', 'expense')),
  amount       NUMERIC NOT NULL,
  description  TEXT,
  date         DATE NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- 5. CONTABILIDADE
-- =============================================================================

-- -----------------------------------------------
-- Plano de Contas (partidas dobradas)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.plano_contas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo      VARCHAR(20) NOT NULL,
  nome        TEXT NOT NULL,
  tipo        TEXT NOT NULL CHECK (tipo IN (
    'ativo', 'passivo', 'receita', 'despesa', 'patrimonio',
    'ativo_circulante', 'ativo_nao_circulante',
    'passivo_circulante', 'passivo_nao_circulante',
    'patrimonio_liquido', 'custo',
    'despesa_operacional', 'despesa_financeira', 'outras_receitas'
  )),
  natureza    TEXT CHECK (natureza IN ('devedora', 'credora')),
  pai_id      UUID REFERENCES public.plano_contas(id),
  nivel       INT NOT NULL DEFAULT 1,
  ativo       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, codigo)
);

-- -----------------------------------------------
-- Lancamentos Contabeis
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  data             DATE,
  data_lancamento  DATE,
  historico        TEXT,
  numero           INTEGER,
  status           TEXT DEFAULT 'rascunho',
  transaction_id   UUID,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Partidas do lancamento (debito/credito)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.lancamento_partidas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id  UUID NOT NULL REFERENCES public.lancamentos(id) ON DELETE CASCADE,
  conta_id       UUID NOT NULL REFERENCES public.plano_contas(id),
  tipo           TEXT CHECK (tipo IN ('debito', 'credito')),
  natureza       TEXT CHECK (natureza IN ('debito', 'credito')),
  valor          NUMERIC(14,2) NOT NULL CHECK (valor > 0),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. FISCAL / IMPOSTOS / NF-e
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.taxes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  tax_name          TEXT NOT NULL,
  tax_regime        TEXT,
  period_start      DATE NOT NULL,
  period_end        DATE NOT NULL,
  revenue_amount    NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_rate          NUMERIC(7,4) NOT NULL DEFAULT 0,
  calculated_amount NUMERIC(14,2) NOT NULL DEFAULT 0,
  due_date          DATE,
  paid_at           DATE,
  status            TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'paid', 'overdue', 'canceled')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT taxes_period_check CHECK (period_end >= period_start)
);

CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id              UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero                  VARCHAR(20),
  serie                   VARCHAR(5),
  modelo                  TEXT NOT NULL CHECK (modelo IN ('nfse', 'nfe', 'nfce')),
  status                  TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
    'rascunho', 'aguardando_autorizacao', 'autorizada',
    'cancelada', 'rejeitada', 'inutilizada'
  )),
  chave_acesso            VARCHAR(60),
  focus_id                TEXT,
  danfe_url               TEXT,
  xml_url                 TEXT,
  destinatario_nome       TEXT NOT NULL,
  destinatario_documento  TEXT NOT NULL,
  valor_produtos          NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_servicos          NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_impostos          NUMERIC(14,2) NOT NULL DEFAULT 0,
  valor_total             NUMERIC(14,2) NOT NULL DEFAULT 0,
  natureza_operacao       TEXT NOT NULL DEFAULT 'Prestacao de servicos',
  data_emissao            DATE,
  data_competencia        DATE,
  mensagem_sefaz          TEXT,
  payload                 JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invoices (alias ingles legado)
CREATE TABLE IF NOT EXISTS public.invoices (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id            UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  transaction_id        UUID,
  number                TEXT,
  series                TEXT,
  customer_name         TEXT,
  customer_document     TEXT,
  issue_date            DATE NOT NULL,
  service_amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_amount            NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_amount          NUMERIC(14,2) NOT NULL DEFAULT 0,
  status                TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'canceled', 'error')),
  access_key            TEXT,
  xml_url               TEXT,
  pdf_url               TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT invoices_amount_check CHECK (service_amount >= 0 AND tax_amount >= 0 AND total_amount >= 0)
);

-- =============================================================================
-- 7. DEPARTAMENTO PESSOAL / FOLHA DE PAGAMENTO
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.funcionarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  cpf           TEXT,
  cargo         TEXT,
  salario_base  NUMERIC(14,2),
  dependentes   INT NOT NULL DEFAULT 0,
  ativo         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees (alias ingles legado)
CREATE TABLE IF NOT EXISTS public.employees (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id        UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  full_name         TEXT NOT NULL,
  cpf               TEXT,
  email             TEXT,
  phone             TEXT,
  position          TEXT,
  salary            NUMERIC(14,2),
  admission_date    DATE,
  termination_date  DATE,
  dependentes       INT NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT employees_salary_check CHECK (salary IS NULL OR salary >= 0)
);

CREATE TABLE IF NOT EXISTS public.folhas_pagamento (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia      VARCHAR(7) NOT NULL, -- YYYY-MM
  status           TEXT NOT NULL DEFAULT 'rascunho'
                     CHECK (status IN ('rascunho', 'calculada', 'aprovada', 'paga', 'cancelada')),
  total_proventos  NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_descontos  NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_liquido    NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_encargos   NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, competencia)
);

CREATE TABLE IF NOT EXISTS public.holerites (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folha_id         UUID NOT NULL REFERENCES public.folhas_pagamento(id) ON DELETE CASCADE,
  funcionario_id   UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  salario_base     NUMERIC(14,2) NOT NULL,
  salario_bruto    NUMERIC(14,2),
  descontos        NUMERIC(14,2) DEFAULT 0,
  salario_liquido  NUMERIC(14,2),
  total_proventos  NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_descontos  NUMERIC(14,2) NOT NULL DEFAULT 0,
  liquido          NUMERIC(14,2) NOT NULL DEFAULT 0,
  inss             NUMERIC(14,2) NOT NULL DEFAULT 0,
  irrf             NUMERIC(14,2) NOT NULL DEFAULT 0,
  fgts             NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (folha_id, funcionario_id)
);

CREATE TABLE IF NOT EXISTS public.holerite_rubricas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holerite_id  UUID NOT NULL REFERENCES public.holerites(id) ON DELETE CASCADE,
  codigo       TEXT,
  rubrica_id   UUID,
  descricao    TEXT NOT NULL,
  tipo         TEXT CHECK (tipo IN ('provento', 'desconto')),
  natureza     TEXT CHECK (natureza IN ('provento', 'desconto', 'informativo')),
  valor        NUMERIC(14,2) NOT NULL,
  referencia   NUMERIC(10,4)
);

-- =============================================================================
-- 8. COMPANIES / COMPANY MEMBERS (alias ingles legado)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT,
  email       TEXT,
  phone       TEXT,
  role        TEXT NOT NULL DEFAULT 'user',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.companies (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id                 UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  legal_name               TEXT NOT NULL,
  trade_name               TEXT,
  cnpj                     TEXT,
  state_registration       TEXT,
  municipal_registration   TEXT,
  legal_nature             TEXT,
  company_size             TEXT,
  tax_regime               TEXT,
  main_cnae                TEXT,
  status                   TEXT NOT NULL DEFAULT 'analysis',
  lifecycle_stage          TEXT NOT NULL DEFAULT 'analysis',
  address_line             TEXT,
  address_number           TEXT,
  address_complement       TEXT,
  district                 TEXT,
  city                     TEXT,
  state                    TEXT,
  zip_code                 TEXT,
  opened_at                DATE,
  closed_at                DATE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT companies_status_check CHECK (
    status IN ('analysis', 'opening', 'active', 'changing', 'closing', 'closed', 'inactive')
  ),
  CONSTRAINT companies_lifecycle_stage_check CHECK (
    lifecycle_stage IN ('analysis', 'opening', 'active', 'changing', 'closing', 'closed')
  ),
  CONSTRAINT companies_tax_regime_check CHECK (
    tax_regime IS NULL OR tax_regime IN ('mei', 'simples', 'presumido', 'real')
  )
);

CREATE TABLE IF NOT EXISTS public.company_members (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id  UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL DEFAULT 'viewer',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT company_members_role_check CHECK (role IN ('owner', 'admin', 'accountant', 'viewer')),
  CONSTRAINT company_members_unique_user UNIQUE (company_id, user_id)
);

-- =============================================================================
-- 9. INDICES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_empresas_plano_id ON public.empresas(plano_id);
CREATE INDEX IF NOT EXISTS idx_empresas_cnpj ON public.empresas(cnpj);
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON public.usuarios(email);
CREATE INDEX IF NOT EXISTS idx_roles_empresa_id ON public.roles(empresa_id);
CREATE INDEX IF NOT EXISTS idx_roles_permissoes_empresa_id ON public.roles_permissoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_roles_permissoes_role_id ON public.roles_permissoes(role_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_usuario_id ON public.usuarios_empresas(usuario_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_empresas_empresa_id ON public.usuarios_empresas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_assinaturas_empresa_id ON public.assinaturas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convites_empresa_id ON public.convites(empresa_id);
CREATE INDEX IF NOT EXISTS idx_convites_token_hash ON public.convites(token_hash);
CREATE INDEX IF NOT EXISTS idx_categorias_empresa_id ON public.categorias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_transacoes_empresa_data ON public.transacoes(empresa_id, data_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_categoria_id ON public.transacoes(categoria_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_empresa_created ON public.audit_logs(empresa_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_events_empresa_id ON public.billing_events(empresa_id);
CREATE INDEX IF NOT EXISTS idx_lancamentos_empresa_data ON public.lancamentos(empresa_id, data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamento_partidas_lancamento ON public.lancamento_partidas(lancamento_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_partidas_conta ON public.lancamento_partidas(conta_id);
CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa ON public.notas_fiscais(empresa_id, status);
CREATE INDEX IF NOT EXISTS idx_funcionarios_empresa_id ON public.funcionarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_companies_owner_id ON public.companies(owner_id);
CREATE INDEX IF NOT EXISTS idx_companies_cnpj ON public.companies(cnpj);
CREATE INDEX IF NOT EXISTS idx_company_members_company_id ON public.company_members(company_id);
CREATE INDEX IF NOT EXISTS idx_company_members_user_id ON public.company_members(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_company_id ON public.categories(company_id);
CREATE INDEX IF NOT EXISTS idx_transactions_company_id ON public.transactions(company_id);
CREATE INDEX IF NOT EXISTS idx_taxes_company_id ON public.taxes(company_id);
CREATE INDEX IF NOT EXISTS idx_taxes_due_date ON public.taxes(due_date);
CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_company_id ON public.invoices(company_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON public.invoices(company_id, issue_date);

-- =============================================================================
-- 10. FUNCOES DE AUTORIZACAO (RBAC)
-- =============================================================================

-- Verifica se o usuario autenticado pertence a empresa
CREATE OR REPLACE FUNCTION public.tem_acesso_empresa(p_empresa_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_empresas ue
    WHERE ue.empresa_id = p_empresa_id
      AND ue.usuario_id = auth.uid()
      AND ue.status = 'ativo'
  );
$$;

-- Verifica permissao granular via role -> roles_permissoes -> permissoes
CREATE OR REPLACE FUNCTION public.tem_permissao(p_empresa_id UUID, p_chave TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.usuarios_empresas ue
    JOIN public.roles r
      ON r.id = ue.role_id
     AND r.empresa_id = ue.empresa_id
    JOIN public.roles_permissoes rp
      ON rp.role_id = r.id
     AND rp.empresa_id = ue.empresa_id
    JOIN public.permissoes p
      ON p.id = rp.permissao_id
    WHERE ue.empresa_id = p_empresa_id
      AND ue.usuario_id = auth.uid()
      AND ue.status = 'ativo'
      AND p.chave = p_chave
  );
$$;

-- Alias usado pelos RLS policies de contabilidade/folha
CREATE OR REPLACE FUNCTION public.usuario_pertence_empresa(eid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_empresas
    WHERE usuario_id = auth.uid()
      AND empresa_id = eid
      AND status = 'ativo'
  );
$$;

-- Compatibilidade com modulo legado (companies/company_members)
CREATE OR REPLACE FUNCTION public.is_company_member(target_company_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.companies c
    WHERE c.id = target_company_id
      AND c.owner_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = target_company_id
      AND cm.user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =============================================================================
-- 11. TRIGGERS
-- =============================================================================

-- Auth trigger: cria perfil automaticamente ao registrar
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- updated_at triggers
DROP TRIGGER IF EXISTS set_usuarios_updated_at ON public.usuarios;
CREATE TRIGGER set_usuarios_updated_at
BEFORE UPDATE ON public.usuarios
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_planos_updated_at ON public.planos;
CREATE TRIGGER set_planos_updated_at
BEFORE UPDATE ON public.planos
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_empresas_updated_at ON public.empresas;
CREATE TRIGGER set_empresas_updated_at
BEFORE UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_roles_updated_at ON public.roles;
CREATE TRIGGER set_roles_updated_at
BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_permissoes_updated_at ON public.permissoes;
CREATE TRIGGER set_permissoes_updated_at
BEFORE UPDATE ON public.permissoes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_usuarios_empresas_updated_at ON public.usuarios_empresas;
CREATE TRIGGER set_usuarios_empresas_updated_at
BEFORE UPDATE ON public.usuarios_empresas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_assinaturas_updated_at ON public.assinaturas;
CREATE TRIGGER set_assinaturas_updated_at
BEFORE UPDATE ON public.assinaturas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_convites_updated_at ON public.convites;
CREATE TRIGGER set_convites_updated_at
BEFORE UPDATE ON public.convites
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_categorias_updated_at ON public.categorias;
CREATE TRIGGER set_categorias_updated_at
BEFORE UPDATE ON public.categorias
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_transacoes_updated_at ON public.transacoes;
CREATE TRIGGER set_transacoes_updated_at
BEFORE UPDATE ON public.transacoes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_plano_contas_updated_at ON public.plano_contas;
CREATE TRIGGER trg_plano_contas_updated_at
BEFORE UPDATE ON public.plano_contas
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_folhas_pagamento_updated_at ON public.folhas_pagamento;
CREATE TRIGGER trg_folhas_pagamento_updated_at
BEFORE UPDATE ON public.folhas_pagamento
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_notas_fiscais_updated_at ON public.notas_fiscais;
CREATE TRIGGER trg_notas_fiscais_updated_at
BEFORE UPDATE ON public.notas_fiscais
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_funcionarios_updated_at ON public.funcionarios;
CREATE TRIGGER set_funcionarios_updated_at
BEFORE UPDATE ON public.funcionarios
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Triggers para tabelas legadas em ingles
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_company_members_updated_at ON public.company_members;
CREATE TRIGGER set_company_members_updated_at
BEFORE UPDATE ON public.company_members
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_taxes_updated_at ON public.taxes;
CREATE TRIGGER set_taxes_updated_at
BEFORE UPDATE ON public.taxes
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_employees_updated_at ON public.employees;
CREATE TRIGGER set_employees_updated_at
BEFORE UPDATE ON public.employees
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_invoices_updated_at ON public.invoices;
CREATE TRIGGER set_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 12. ROW LEVEL SECURITY
-- =============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.usuarios           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.empresas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roles_permissoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios_empresas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assinaturas        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.convites           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categorias         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transacoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plano_contas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamento_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folhas_pagamento   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holerites          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holerite_rubricas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funcionarios       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.taxes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees          ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------
-- POLICIES: Usuarios
-- -----------------------------------------------
DROP POLICY IF EXISTS "usuarios_select_self" ON public.usuarios;
CREATE POLICY "usuarios_select_self"
ON public.usuarios FOR SELECT
USING (
  id = auth.uid()
  OR EXISTS (
    SELECT 1
    FROM public.usuarios_empresas ue_self
    JOIN public.usuarios_empresas ue_other
      ON ue_other.empresa_id = ue_self.empresa_id
    WHERE ue_self.usuario_id = auth.uid()
      AND ue_self.status = 'ativo'
      AND ue_other.usuario_id = usuarios.id
      AND ue_other.status = 'ativo'
  )
);

DROP POLICY IF EXISTS "usuarios_insert_self" ON public.usuarios;
CREATE POLICY "usuarios_insert_self"
ON public.usuarios FOR INSERT
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "usuarios_update_self" ON public.usuarios;
CREATE POLICY "usuarios_update_self"
ON public.usuarios FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid() AND super_admin = FALSE);

-- -----------------------------------------------
-- POLICIES: Planos (catalogo publico autenticado)
-- -----------------------------------------------
DROP POLICY IF EXISTS "planos_select_authenticated" ON public.planos;
CREATE POLICY "planos_select_authenticated"
ON public.planos FOR SELECT
TO authenticated
USING (ativo = TRUE);

-- -----------------------------------------------
-- POLICIES: Empresas
-- -----------------------------------------------
DROP POLICY IF EXISTS "empresas_select_member" ON public.empresas;
CREATE POLICY "empresas_select_member"
ON public.empresas FOR SELECT
USING (public.tem_acesso_empresa(id));

DROP POLICY IF EXISTS "empresas_insert_server_only" ON public.empresas;
CREATE POLICY "empresas_insert_server_only"
ON public.empresas FOR INSERT
TO authenticated
WITH CHECK (FALSE); -- Somente via service role/backend

DROP POLICY IF EXISTS "empresas_update_admin" ON public.empresas;
CREATE POLICY "empresas_update_admin"
ON public.empresas FOR UPDATE
USING (public.tem_permissao(id, 'empresa.update'))
WITH CHECK (public.tem_permissao(id, 'empresa.update'));

DROP POLICY IF EXISTS "empresas_delete_admin" ON public.empresas;
CREATE POLICY "empresas_delete_admin"
ON public.empresas FOR DELETE
USING (public.tem_permissao(id, 'empresa.delete'));

-- -----------------------------------------------
-- POLICIES: Roles
-- -----------------------------------------------
DROP POLICY IF EXISTS "roles_select_member" ON public.roles;
CREATE POLICY "roles_select_member"
ON public.roles FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "roles_manage_admin" ON public.roles;
CREATE POLICY "roles_manage_admin"
ON public.roles FOR ALL
USING (public.tem_permissao(empresa_id, 'rbac.manage'))
WITH CHECK (public.tem_permissao(empresa_id, 'rbac.manage'));

-- -----------------------------------------------
-- POLICIES: Permissoes (catalogo legivel)
-- -----------------------------------------------
DROP POLICY IF EXISTS "permissoes_select_authenticated" ON public.permissoes;
CREATE POLICY "permissoes_select_authenticated"
ON public.permissoes FOR SELECT
TO authenticated
USING (TRUE);

-- -----------------------------------------------
-- POLICIES: Roles Permissoes
-- -----------------------------------------------
DROP POLICY IF EXISTS "roles_permissoes_select_member" ON public.roles_permissoes;
CREATE POLICY "roles_permissoes_select_member"
ON public.roles_permissoes FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "roles_permissoes_manage_admin" ON public.roles_permissoes;
CREATE POLICY "roles_permissoes_manage_admin"
ON public.roles_permissoes FOR ALL
USING (public.tem_permissao(empresa_id, 'rbac.manage'))
WITH CHECK (public.tem_permissao(empresa_id, 'rbac.manage'));

-- -----------------------------------------------
-- POLICIES: Usuarios Empresas
-- -----------------------------------------------
DROP POLICY IF EXISTS "usuarios_empresas_select_member" ON public.usuarios_empresas;
CREATE POLICY "usuarios_empresas_select_member"
ON public.usuarios_empresas FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "usuarios_empresas_insert_admin" ON public.usuarios_empresas;
CREATE POLICY "usuarios_empresas_insert_admin"
ON public.usuarios_empresas FOR INSERT
WITH CHECK (public.tem_permissao(empresa_id, 'usuario.manage'));

DROP POLICY IF EXISTS "usuarios_empresas_update_admin" ON public.usuarios_empresas;
CREATE POLICY "usuarios_empresas_update_admin"
ON public.usuarios_empresas FOR UPDATE
USING (public.tem_permissao(empresa_id, 'usuario.manage'))
WITH CHECK (public.tem_permissao(empresa_id, 'usuario.manage'));

DROP POLICY IF EXISTS "usuarios_empresas_delete_admin" ON public.usuarios_empresas;
CREATE POLICY "usuarios_empresas_delete_admin"
ON public.usuarios_empresas FOR DELETE
USING (public.tem_permissao(empresa_id, 'usuario.manage'));

-- -----------------------------------------------
-- POLICIES: Assinaturas
-- -----------------------------------------------
DROP POLICY IF EXISTS "assinaturas_select_member" ON public.assinaturas;
CREATE POLICY "assinaturas_select_member"
ON public.assinaturas FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "assinaturas_manage_billing" ON public.assinaturas;
CREATE POLICY "assinaturas_manage_billing"
ON public.assinaturas FOR ALL
USING (public.tem_permissao(empresa_id, 'billing.manage'))
WITH CHECK (public.tem_permissao(empresa_id, 'billing.manage'));

-- -----------------------------------------------
-- POLICIES: Convites
-- -----------------------------------------------
DROP POLICY IF EXISTS "convites_select_admin" ON public.convites;
CREATE POLICY "convites_select_admin"
ON public.convites FOR SELECT
USING (public.tem_permissao(empresa_id, 'usuario.invite'));

DROP POLICY IF EXISTS "convites_insert_admin" ON public.convites;
CREATE POLICY "convites_insert_admin"
ON public.convites FOR INSERT
WITH CHECK (public.tem_permissao(empresa_id, 'usuario.invite'));

DROP POLICY IF EXISTS "convites_update_admin" ON public.convites;
CREATE POLICY "convites_update_admin"
ON public.convites FOR UPDATE
USING (public.tem_permissao(empresa_id, 'usuario.invite'))
WITH CHECK (public.tem_permissao(empresa_id, 'usuario.invite'));

-- -----------------------------------------------
-- POLICIES: Categorias
-- -----------------------------------------------
DROP POLICY IF EXISTS "categorias_select_member" ON public.categorias;
CREATE POLICY "categorias_select_member"
ON public.categorias FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "categorias_manage_financeiro" ON public.categorias;
CREATE POLICY "categorias_manage_financeiro"
ON public.categorias FOR ALL
USING (public.tem_permissao(empresa_id, 'transacao.manage'))
WITH CHECK (public.tem_permissao(empresa_id, 'transacao.manage'));

-- -----------------------------------------------
-- POLICIES: Transacoes
-- -----------------------------------------------
DROP POLICY IF EXISTS "transacoes_select_member" ON public.transacoes;
CREATE POLICY "transacoes_select_member"
ON public.transacoes FOR SELECT
USING (
  public.tem_permissao(empresa_id, 'transacao.read')
  OR public.tem_permissao(empresa_id, 'transacao.manage')
);

DROP POLICY IF EXISTS "transacoes_insert_financeiro" ON public.transacoes;
CREATE POLICY "transacoes_insert_financeiro"
ON public.transacoes FOR INSERT
WITH CHECK (
  public.tem_permissao(empresa_id, 'transacao.create')
  OR public.tem_permissao(empresa_id, 'transacao.manage')
);

DROP POLICY IF EXISTS "transacoes_update_financeiro" ON public.transacoes;
CREATE POLICY "transacoes_update_financeiro"
ON public.transacoes FOR UPDATE
USING (
  public.tem_permissao(empresa_id, 'transacao.update')
  OR public.tem_permissao(empresa_id, 'transacao.manage')
)
WITH CHECK (
  public.tem_permissao(empresa_id, 'transacao.update')
  OR public.tem_permissao(empresa_id, 'transacao.manage')
);

DROP POLICY IF EXISTS "transacoes_delete_financeiro" ON public.transacoes;
CREATE POLICY "transacoes_delete_financeiro"
ON public.transacoes FOR DELETE
USING (
  public.tem_permissao(empresa_id, 'transacao.delete')
  OR public.tem_permissao(empresa_id, 'transacao.manage')
);

-- -----------------------------------------------
-- POLICIES: Audit Logs (append-only)
-- -----------------------------------------------
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
CREATE POLICY "audit_logs_select_admin"
ON public.audit_logs FOR SELECT
USING (empresa_id IS NOT NULL AND public.tem_permissao(empresa_id, 'audit.read'));

DROP POLICY IF EXISTS "audit_logs_insert_server_only" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_server_only"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (FALSE); -- Somente via service role

-- -----------------------------------------------
-- POLICIES: Billing Events
-- -----------------------------------------------
DROP POLICY IF EXISTS "billing_events_select_billing" ON public.billing_events;
CREATE POLICY "billing_events_select_billing"
ON public.billing_events FOR SELECT
USING (empresa_id IS NOT NULL AND public.tem_permissao(empresa_id, 'billing.manage'));

-- -----------------------------------------------
-- POLICIES: Plano de Contas
-- -----------------------------------------------
DROP POLICY IF EXISTS "plano_contas_select_member" ON public.plano_contas;
CREATE POLICY "plano_contas_select_member"
ON public.plano_contas FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "plano_contas_manage_contabil" ON public.plano_contas;
CREATE POLICY "plano_contas_manage_contabil"
ON public.plano_contas FOR ALL
USING (
  public.tem_permissao(empresa_id, 'contabil.write')
  OR public.tem_permissao(empresa_id, 'contabil.read')
)
WITH CHECK (public.tem_permissao(empresa_id, 'contabil.write'));

-- -----------------------------------------------
-- POLICIES: Lancamentos Contabeis
-- -----------------------------------------------
DROP POLICY IF EXISTS "lancamentos_select_member" ON public.lancamentos;
CREATE POLICY "lancamentos_select_member"
ON public.lancamentos FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "lancamentos_manage_contabil" ON public.lancamentos;
CREATE POLICY "lancamentos_manage_contabil"
ON public.lancamentos FOR ALL
USING (public.tem_permissao(empresa_id, 'contabil.write'))
WITH CHECK (public.tem_permissao(empresa_id, 'contabil.write'));

-- -----------------------------------------------
-- POLICIES: Lancamento Partidas (herda via lancamento)
-- -----------------------------------------------
DROP POLICY IF EXISTS "lancamento_partidas_via_lancamento" ON public.lancamento_partidas;
CREATE POLICY "lancamento_partidas_via_lancamento"
ON public.lancamento_partidas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.lancamentos l
    WHERE l.id = lancamento_id
      AND public.tem_acesso_empresa(l.empresa_id)
  )
);

-- -----------------------------------------------
-- POLICIES: Folhas de Pagamento
-- -----------------------------------------------
DROP POLICY IF EXISTS "folhas_select_member" ON public.folhas_pagamento;
CREATE POLICY "folhas_select_member"
ON public.folhas_pagamento FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "folhas_manage_dp" ON public.folhas_pagamento;
CREATE POLICY "folhas_manage_dp"
ON public.folhas_pagamento FOR ALL
USING (public.tem_permissao(empresa_id, 'dp.write'))
WITH CHECK (public.tem_permissao(empresa_id, 'dp.write'));

-- -----------------------------------------------
-- POLICIES: Funcionarios
-- -----------------------------------------------
DROP POLICY IF EXISTS "funcionarios_select_member" ON public.funcionarios;
CREATE POLICY "funcionarios_select_member"
ON public.funcionarios FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "funcionarios_manage_dp" ON public.funcionarios;
CREATE POLICY "funcionarios_manage_dp"
ON public.funcionarios FOR ALL
USING (public.tem_permissao(empresa_id, 'dp.write'))
WITH CHECK (public.tem_permissao(empresa_id, 'dp.write'));

-- -----------------------------------------------
-- POLICIES: Holerites (herda via folha)
-- -----------------------------------------------
DROP POLICY IF EXISTS "holerites_via_folha" ON public.holerites;
CREATE POLICY "holerites_via_folha"
ON public.holerites FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.folhas_pagamento f
    WHERE f.id = folha_id
      AND public.tem_acesso_empresa(f.empresa_id)
  )
);

-- -----------------------------------------------
-- POLICIES: Holerite Rubricas (herda via holerite -> folha)
-- -----------------------------------------------
DROP POLICY IF EXISTS "holerite_rubricas_via_holerite" ON public.holerite_rubricas;
CREATE POLICY "holerite_rubricas_via_holerite"
ON public.holerite_rubricas FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.holerites h
    JOIN public.folhas_pagamento f ON f.id = h.folha_id
    WHERE h.id = holerite_id
      AND public.tem_acesso_empresa(f.empresa_id)
  )
);

-- -----------------------------------------------
-- POLICIES: Notas Fiscais
-- -----------------------------------------------
DROP POLICY IF EXISTS "notas_fiscais_select_member" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_select_member"
ON public.notas_fiscais FOR SELECT
USING (public.tem_acesso_empresa(empresa_id));

DROP POLICY IF EXISTS "notas_fiscais_manage_fiscal" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_manage_fiscal"
ON public.notas_fiscais FOR ALL
USING (public.tem_permissao(empresa_id, 'fiscal.write'))
WITH CHECK (public.tem_permissao(empresa_id, 'fiscal.write'));

-- -----------------------------------------------
-- POLICIES: Taxes
-- -----------------------------------------------
DROP POLICY IF EXISTS "taxes_select_member" ON public.taxes;
CREATE POLICY "taxes_select_member"
ON public.taxes FOR SELECT
USING (public.is_company_member(company_id));

DROP POLICY IF EXISTS "taxes_manage" ON public.taxes;
CREATE POLICY "taxes_manage"
ON public.taxes FOR ALL
USING (public.is_company_member(company_id))
WITH CHECK (public.is_company_member(company_id));

-- -----------------------------------------------
-- POLICIES: Users (legado ingles)
-- -----------------------------------------------
DROP POLICY IF EXISTS "users_select_self" ON public.users;
CREATE POLICY "users_select_self"
ON public.users FOR SELECT
USING (id = auth.uid());

DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_update_self"
ON public.users FOR UPDATE
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "users_insert_self" ON public.users;
CREATE POLICY "users_insert_self"
ON public.users FOR INSERT
WITH CHECK (id = auth.uid());

-- -----------------------------------------------
-- POLICIES: Companies (legado ingles)
-- -----------------------------------------------
DROP POLICY IF EXISTS "companies_select_member" ON public.companies;
CREATE POLICY "companies_select_member"
ON public.companies FOR SELECT
USING (owner_id = auth.uid() OR public.is_company_member(id));

DROP POLICY IF EXISTS "companies_insert_owner" ON public.companies;
CREATE POLICY "companies_insert_owner"
ON public.companies FOR INSERT
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "companies_update_owner" ON public.companies;
CREATE POLICY "companies_update_owner"
ON public.companies FOR UPDATE
USING (owner_id = auth.uid())
WITH CHECK (owner_id = auth.uid());

DROP POLICY IF EXISTS "companies_delete_owner" ON public.companies;
CREATE POLICY "companies_delete_owner"
ON public.companies FOR DELETE
USING (owner_id = auth.uid());

-- -----------------------------------------------
-- POLICIES: Company Members (legado ingles)
-- -----------------------------------------------
DROP POLICY IF EXISTS "company_members_select" ON public.company_members;
CREATE POLICY "company_members_select"
ON public.company_members FOR SELECT
USING (public.is_company_member(company_id));

DROP POLICY IF EXISTS "company_members_manage" ON public.company_members;
CREATE POLICY "company_members_manage"
ON public.company_members FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_id AND c.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = company_id AND c.owner_id = auth.uid()
  )
);

-- -----------------------------------------------
-- POLICIES: Categories (legado ingles)
-- -----------------------------------------------
DROP POLICY IF EXISTS "categories_select_member" ON public.categories;
CREATE POLICY "categories_select_member"
ON public.categories FOR SELECT
USING (public.is_company_member(company_id));

DROP POLICY IF EXISTS "categories_manage" ON public.categories;
CREATE POLICY "categories_manage"
ON public.categories FOR ALL
USING (public.is_company_member(company_id))
WITH CHECK (public.is_company_member(company_id));

-- -----------------------------------------------
-- POLICIES: Transactions (legado ingles)
-- -----------------------------------------------
DROP POLICY IF EXISTS "transactions_select_member" ON public.transactions;
CREATE POLICY "transactions_select_member"
ON public.transactions FOR SELECT
USING (public.is_company_member(company_id));

DROP POLICY IF EXISTS "transactions_manage" ON public.transactions;
CREATE POLICY "transactions_manage"
ON public.transactions FOR ALL
USING (public.is_company_member(company_id))
WITH CHECK (public.is_company_member(company_id));

-- -----------------------------------------------
-- POLICIES: Employees (legado ingles)
-- -----------------------------------------------
DROP POLICY IF EXISTS "employees_select_member" ON public.employees;
CREATE POLICY "employees_select_member"
ON public.employees FOR SELECT
USING (public.is_company_member(company_id));

DROP POLICY IF EXISTS "employees_manage" ON public.employees;
CREATE POLICY "employees_manage"
ON public.employees FOR ALL
USING (public.is_company_member(company_id))
WITH CHECK (public.is_company_member(company_id));

-- -----------------------------------------------
-- POLICIES: Invoices (legado ingles)
-- -----------------------------------------------
DROP POLICY IF EXISTS "invoices_select_member" ON public.invoices;
CREATE POLICY "invoices_select_member"
ON public.invoices FOR SELECT
USING (public.is_company_member(company_id));

DROP POLICY IF EXISTS "invoices_manage" ON public.invoices;
CREATE POLICY "invoices_manage"
ON public.invoices FOR ALL
USING (public.is_company_member(company_id))
WITH CHECK (public.is_company_member(company_id));

-- =============================================================================
-- 13. SEED DATA: Permissoes
-- =============================================================================

INSERT INTO public.permissoes (chave, modulo, descricao) VALUES
  ('empresa.read',       'empresas',      'Visualizar dados da empresa'),
  ('empresa.update',     'empresas',      'Editar dados da empresa'),
  ('empresa.delete',     'empresas',      'Excluir empresa'),
  ('usuario.invite',     'usuarios',      'Convidar usuarios'),
  ('usuario.manage',     'usuarios',      'Gerenciar usuarios e vinculos'),
  ('rbac.manage',        'rbac',          'Gerenciar roles e permissoes'),
  ('transacao.read',     'transacoes',    'Visualizar transacoes'),
  ('transacao.create',   'transacoes',    'Criar transacoes'),
  ('transacao.update',   'transacoes',    'Editar transacoes'),
  ('transacao.delete',   'transacoes',    'Excluir transacoes'),
  ('transacao.manage',   'transacoes',    'Gerenciar financeiro completo'),
  ('billing.manage',     'billing',       'Gerenciar plano e assinatura'),
  ('audit.read',         'auditoria',     'Visualizar auditoria'),
  ('fiscal.read',        'fiscal',        'Visualizar fiscal'),
  ('fiscal.write',       'fiscal',        'Editar fiscal'),
  ('contabil.read',      'contabil',      'Visualizar contabil'),
  ('contabil.write',     'contabil',      'Editar contabil'),
  ('dp.read',            'dp',            'Visualizar departamento pessoal'),
  ('dp.write',           'dp',            'Editar departamento pessoal'),
  ('societario.read',    'societario',    'Visualizar societario'),
  ('societario.write',   'societario',    'Editar societario'),
  ('documento.read',     'documentos',    'Visualizar documentos'),
  ('documento.write',    'documentos',    'Editar documentos'),
  ('documento.upload',   'documentos',    'Enviar documentos'),
  ('guia.download',      'guias',         'Baixar guias'),
  ('solicitacao.create', 'solicitacoes',  'Criar solicitacao'),
  ('solicitacao.read',   'solicitacoes',  'Visualizar solicitacoes'),
  ('notificacao.read',   'notificacoes',  'Visualizar notificacoes')
ON CONFLICT (chave) DO UPDATE
SET modulo = EXCLUDED.modulo,
    descricao = EXCLUDED.descricao,
    updated_at = NOW();

-- =============================================================================
-- 14. SEED DATA: Planos
-- =============================================================================

INSERT INTO public.planos (
  codigo, nome, descricao, preco, preco_centavos,
  limite_empresas, limite_usuarios, limite_transacoes, limite_transacoes_mes,
  recursos, ativo
) VALUES
  (
    'starter', 'Starter', 'Plano inicial gratuito', 0, 0,
    1, 3, 100, 1000,
    '{"dashboard": true, "financeiro": true, "auditoria": true}'::JSONB, TRUE
  ),
  (
    'basico', 'Basico', 'Plano basico', 350, 35000,
    3, 10, 500, 5000,
    '{"dashboard": true, "financeiro": true, "auditoria": true, "fiscal": true}'::JSONB, TRUE
  ),
  (
    'intermediario', 'Intermediario', 'Plano intermediario', 650, 65000,
    10, 25, 2000, 20000,
    '{"dashboard": true, "financeiro": true, "auditoria": true, "fiscal": true, "contabil": true, "dp": true}'::JSONB, TRUE
  ),
  (
    'premium', 'Premium', 'Plano premium', 1200, 120000,
    50, 100, 10000, 100000,
    '{"dashboard": true, "financeiro": true, "auditoria": true, "fiscal": true, "contabil": true, "dp": true, "societario": true, "nfe": true}'::JSONB, TRUE
  )
ON CONFLICT (codigo) DO UPDATE
SET nome = EXCLUDED.nome,
    descricao = EXCLUDED.descricao,
    preco = EXCLUDED.preco,
    preco_centavos = EXCLUDED.preco_centavos,
    limite_empresas = EXCLUDED.limite_empresas,
    limite_usuarios = EXCLUDED.limite_usuarios,
    limite_transacoes = EXCLUDED.limite_transacoes,
    limite_transacoes_mes = EXCLUDED.limite_transacoes_mes,
    recursos = EXCLUDED.recursos,
    updated_at = NOW();

-- =============================================================================
-- FIM DA MIGRATION
-- =============================================================================
-- NOTAS OPERACIONAIS:
-- 1. Criacao inicial de empresa + role admin + vinculo deve ocorrer via API
--    server-side em uma transacao, usando service role ou RPC SECURITY DEFINER.
-- 2. Convites devem armazenar apenas hash do token, nunca o token puro.
-- 3. Webhooks Stripe devem usar service role no backend e validar assinatura.
-- 4. INSERT direto em empresas e audit_logs esta bloqueado por RLS. Use backend.
-- 5. audit_logs nao possui policy de UPDATE/DELETE de proposito (append-only).
