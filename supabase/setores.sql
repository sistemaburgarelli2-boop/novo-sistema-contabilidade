-- =============================================================================
-- TABELAS PARA SETORES OPERACIONAIS (Fiscal, Contábil, DP, Societário, Financeiro)
-- Execute no SQL Editor do Supabase
-- =============================================================================

-- ===================== FISCAL =====================

CREATE TABLE IF NOT EXISTS public.obrigacoes_fiscais (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  competencia   TEXT,
  vencimento    DATE,
  responsavel   TEXT,
  prioridade    TEXT DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')),
  status        TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','aguardando_cliente','em_revisao','transmitido','concluido','atrasado')),
  tipo          TEXT DEFAULT 'federal' CHECK (tipo IN ('federal','estadual','municipal','previdenciario')),
  observacoes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.impostos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  nome          TEXT NOT NULL,
  base          NUMERIC DEFAULT 0,
  aliquota      TEXT,
  valor         NUMERIC DEFAULT 0,
  obs           TEXT,
  ativo         BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sped_arquivos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,
  competencia   TEXT,
  status        TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','gerado','validado','transmitido','erro')),
  protocolo     TEXT,
  data_envio    TIMESTAMPTZ,
  tamanho       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certidoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  esfera        TEXT NOT NULL CHECK (esfera IN ('federal','estadual','municipal')),
  nome          TEXT NOT NULL,
  validade      DATE,
  status        TEXT DEFAULT 'nao_solicitada' CHECK (status IN ('valida','vencida','solicitada','nao_solicitada')),
  numero        TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================== CONTABIL =====================

CREATE TABLE IF NOT EXISTS public.conciliacoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  data          DATE NOT NULL,
  descricao     TEXT NOT NULL,
  valor         NUMERIC NOT NULL,
  tipo          TEXT CHECK (tipo IN ('entrada','saida')),
  status        TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','conciliado','ignorado')),
  lancamento_id UUID,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================== DP =====================

CREATE TABLE IF NOT EXISTS public.dp_ferias (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  funcionario_id UUID REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  funcionario_nome TEXT,
  periodo_aquisitivo TEXT,
  inicio        DATE,
  fim           DATE,
  dias          INTEGER DEFAULT 30,
  status        TEXT DEFAULT 'programada' CHECK (status IN ('programada','em_gozo','concluida','cancelada')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.esocial_eventos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo        TEXT NOT NULL,
  descricao     TEXT NOT NULL,
  competencia   TEXT,
  tipo          TEXT DEFAULT 'periodico' CHECK (tipo IN ('periodico','nao_periodico','tabela')),
  status        TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','gerado','enviado','aceito','rejeitado')),
  protocolo     TEXT,
  data_envio    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================== SOCIETARIO =====================

CREATE TABLE IF NOT EXISTS public.processos_societarios (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,
  descricao     TEXT,
  responsavel   TEXT,
  status        TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','em_andamento','aguardando','concluido','cancelado','arquivado')),
  prioridade    TEXT DEFAULT 'media' CHECK (prioridade IN ('alta','media','baixa')),
  prazo         DATE,
  protocolo     TEXT,
  orgao         TEXT,
  observacoes   TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.alvaras (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL,
  numero        TEXT,
  orgao         TEXT,
  emissao       DATE,
  validade      DATE,
  status        TEXT DEFAULT 'vigente' CHECK (status IN ('vigente','vencido','em_renovacao','cancelado')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================== FINANCEIRO ESCRITORIO =====================

CREATE TABLE IF NOT EXISTS public.comissoes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador   TEXT NOT NULL,
  tipo          TEXT,
  mes           TEXT,
  valor         NUMERIC NOT NULL DEFAULT 0,
  status        TEXT DEFAULT 'pendente' CHECK (status IN ('pendente','pago')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================== INDICES =====================

CREATE INDEX IF NOT EXISTS idx_obrigacoes_empresa ON public.obrigacoes_fiscais(empresa_id);
CREATE INDEX IF NOT EXISTS idx_obrigacoes_vencimento ON public.obrigacoes_fiscais(vencimento);
CREATE INDEX IF NOT EXISTS idx_impostos_empresa ON public.impostos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_sped_empresa ON public.sped_arquivos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_certidoes_empresa ON public.certidoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_conciliacoes_empresa ON public.conciliacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_dp_ferias_empresa ON public.dp_ferias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_esocial_empresa ON public.esocial_eventos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_processos_soc_empresa ON public.processos_societarios(empresa_id);
CREATE INDEX IF NOT EXISTS idx_alvaras_empresa ON public.alvaras(empresa_id);

-- ===================== RLS =====================

ALTER TABLE public.obrigacoes_fiscais   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.impostos             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sped_arquivos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certidoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conciliacoes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dp_ferias            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.esocial_eventos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processos_societarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alvaras              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes            ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "obrigacoes_acesso" ON public.obrigacoes_fiscais FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "impostos_acesso" ON public.impostos FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "sped_acesso" ON public.sped_arquivos FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "certidoes_acesso" ON public.certidoes FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "conciliacoes_acesso" ON public.conciliacoes FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "dp_ferias_acesso" ON public.dp_ferias FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "esocial_acesso" ON public.esocial_eventos FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "processos_soc_acesso" ON public.processos_societarios FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "alvaras_acesso" ON public.alvaras FOR ALL USING (public.tem_acesso_empresa(empresa_id)) WITH CHECK (public.tem_acesso_empresa(empresa_id)); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "comissoes_acesso" ON public.comissoes FOR ALL USING (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ===================== TRIGGERS =====================

DROP TRIGGER IF EXISTS set_updated_at_obrigacoes ON public.obrigacoes_fiscais;
CREATE TRIGGER set_updated_at_obrigacoes BEFORE UPDATE ON public.obrigacoes_fiscais FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_sped ON public.sped_arquivos;
CREATE TRIGGER set_updated_at_sped BEFORE UPDATE ON public.sped_arquivos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_certidoes ON public.certidoes;
CREATE TRIGGER set_updated_at_certidoes BEFORE UPDATE ON public.certidoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_conciliacoes ON public.conciliacoes;
CREATE TRIGGER set_updated_at_conciliacoes BEFORE UPDATE ON public.conciliacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_dp_ferias ON public.dp_ferias;
CREATE TRIGGER set_updated_at_dp_ferias BEFORE UPDATE ON public.dp_ferias FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_esocial ON public.esocial_eventos;
CREATE TRIGGER set_updated_at_esocial BEFORE UPDATE ON public.esocial_eventos FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_processos_soc ON public.processos_societarios;
CREATE TRIGGER set_updated_at_processos_soc BEFORE UPDATE ON public.processos_societarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_alvaras ON public.alvaras;
CREATE TRIGGER set_updated_at_alvaras BEFORE UPDATE ON public.alvaras FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
DROP TRIGGER IF EXISTS set_updated_at_comissoes ON public.comissoes;
CREATE TRIGGER set_updated_at_comissoes BEFORE UPDATE ON public.comissoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
