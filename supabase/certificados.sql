-- =============================================================================
-- MODULO CERTIFICADOS DIGITAIS
-- Execute no SQL Editor do Supabase (Dashboard > SQL Editor)
-- Idempotente: pode rodar varias vezes sem problema
-- =============================================================================

-- -----------------------------------------------
-- Certificados digitais
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificados (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('A1','A3','eCPF','eCNPJ','Representante')),
  modelo          TEXT DEFAULT 'A1',
  titular         TEXT NOT NULL,
  documento       TEXT NOT NULL,
  email           TEXT,
  telefone        TEXT,
  numero_serie    TEXT,
  fornecedor      TEXT,
  emissao         DATE NOT NULL,
  validade        DATE NOT NULL,
  dias_restantes  INTEGER GENERATED ALWAYS AS (validade - CURRENT_DATE) STORED,
  status          TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','proximo_vencimento','renovando','vencido','suspenso','revogado')),
  senha_hash      TEXT,
  observacoes     TEXT,
  arquivo_url     TEXT,
  responsavel     TEXT,
  alertas_config  JSONB DEFAULT '{"dias": [90, 60, 30, 15, 7, 1], "canais": ["sistema"]}'::JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Documentos vinculados ao certificado
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificado_documentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificado_id  UUID REFERENCES public.certificados(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  categoria       TEXT NOT NULL DEFAULT 'certificado' CHECK (categoria IN ('certificado','contrato','comprovante','recibo','termo','outros')),
  arquivo_url     TEXT,
  arquivo_nome    TEXT,
  arquivo_tipo    TEXT,
  arquivo_tam     INTEGER,
  enviado_por     UUID REFERENCES public.usuarios(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Renovacoes de certificados
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificado_renovacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificado_id  UUID REFERENCES public.certificados(id) ON DELETE CASCADE,
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','cliente_avisado','aprovado','emitido','validado','concluido','cancelado')),
  prazo           DATE,
  responsavel     TEXT,
  observacoes     TEXT,
  aprovado_em     TIMESTAMPTZ,
  aprovado_por    TEXT,
  concluido_em    TIMESTAMPTZ,
  novo_certificado_id UUID REFERENCES public.certificados(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Instalacoes de certificados (controle de dispositivos)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificado_instalacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificado_id  UUID REFERENCES public.certificados(id) ON DELETE CASCADE,
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  dispositivo     TEXT NOT NULL,
  sistema         TEXT,
  navegador       TEXT,
  responsavel     TEXT,
  instalado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacoes     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Alertas de certificados
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificado_alertas (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificado_id  UUID REFERENCES public.certificados(id) ON DELETE CASCADE,
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL DEFAULT 'sistema' CHECK (tipo IN ('sistema','email','whatsapp')),
  dias_antes      INTEGER NOT NULL,
  mensagem        TEXT,
  enviado         BOOLEAN DEFAULT FALSE,
  enviado_em      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Historico / timeline de certificados
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificado_historico (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificado_id  UUID REFERENCES public.certificados(id) ON DELETE CASCADE,
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  acao            TEXT NOT NULL,
  descricao       TEXT,
  usuario         TEXT,
  ip              TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- -----------------------------------------------
-- Solicitacoes de certificados (pedidos do cliente)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificado_solicitacoes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES public.usuarios(id),
  tipo_solicitado TEXT NOT NULL,
  titular         TEXT,
  documento       TEXT,
  motivo          TEXT,
  status          TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto','em_andamento','concluido','cancelado')),
  responsavel     TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- INDICES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_certificados_empresa ON public.certificados(empresa_id);
CREATE INDEX IF NOT EXISTS idx_certificados_validade ON public.certificados(validade);
CREATE INDEX IF NOT EXISTS idx_certificados_status ON public.certificados(status);
CREATE INDEX IF NOT EXISTS idx_certificados_tipo ON public.certificados(tipo);
CREATE INDEX IF NOT EXISTS idx_cert_docs_certificado ON public.certificado_documentos(certificado_id);
CREATE INDEX IF NOT EXISTS idx_cert_renovacoes_certificado ON public.certificado_renovacoes(certificado_id);
CREATE INDEX IF NOT EXISTS idx_cert_renovacoes_empresa ON public.certificado_renovacoes(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cert_instalacoes_certificado ON public.certificado_instalacoes(certificado_id);
CREATE INDEX IF NOT EXISTS idx_cert_alertas_certificado ON public.certificado_alertas(certificado_id);
CREATE INDEX IF NOT EXISTS idx_cert_historico_certificado ON public.certificado_historico(certificado_id);
CREATE INDEX IF NOT EXISTS idx_cert_solicitacoes_empresa ON public.certificado_solicitacoes(empresa_id);

-- =============================================================================
-- RLS (Row Level Security)
-- =============================================================================

ALTER TABLE public.certificados              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificado_documentos    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificado_renovacoes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificado_instalacoes   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificado_alertas       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificado_historico     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificado_solicitacoes  ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
CREATE POLICY "cert_acesso" ON public.certificados FOR ALL
USING (public.tem_acesso_empresa(empresa_id))
WITH CHECK (public.tem_acesso_empresa(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "cert_docs_acesso" ON public.certificado_documentos FOR ALL
USING (EXISTS (SELECT 1 FROM public.certificados c WHERE c.id = certificado_id AND public.tem_acesso_empresa(c.empresa_id)));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "cert_renovacoes_acesso" ON public.certificado_renovacoes FOR ALL
USING (public.tem_acesso_empresa(empresa_id))
WITH CHECK (public.tem_acesso_empresa(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "cert_instalacoes_acesso" ON public.certificado_instalacoes FOR ALL
USING (public.tem_acesso_empresa(empresa_id))
WITH CHECK (public.tem_acesso_empresa(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "cert_alertas_acesso" ON public.certificado_alertas FOR ALL
USING (public.tem_acesso_empresa(empresa_id))
WITH CHECK (public.tem_acesso_empresa(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "cert_historico_acesso" ON public.certificado_historico FOR ALL
USING (public.tem_acesso_empresa(empresa_id))
WITH CHECK (public.tem_acesso_empresa(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
CREATE POLICY "cert_solicitacoes_acesso" ON public.certificado_solicitacoes FOR ALL
USING (public.tem_acesso_empresa(empresa_id))
WITH CHECK (public.tem_acesso_empresa(empresa_id));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================================================
-- TRIGGERS updated_at
-- =============================================================================

DROP TRIGGER IF EXISTS set_updated_at_certificados ON public.certificados;
CREATE TRIGGER set_updated_at_certificados BEFORE UPDATE ON public.certificados FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_cert_renovacoes ON public.certificado_renovacoes;
CREATE TRIGGER set_updated_at_cert_renovacoes BEFORE UPDATE ON public.certificado_renovacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_cert_solicitacoes ON public.certificado_solicitacoes;
CREATE TRIGGER set_updated_at_cert_solicitacoes BEFORE UPDATE ON public.certificado_solicitacoes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- PERMISSOES (inserir no sistema RBAC)
-- =============================================================================

INSERT INTO public.permissoes (chave, modulo, descricao) VALUES
  ('certificado.read',     'certificados', 'Visualizar certificados'),
  ('certificado.write',    'certificados', 'Criar e editar certificados'),
  ('certificado.renew',    'certificados', 'Solicitar e processar renovacoes'),
  ('certificado.download', 'certificados', 'Baixar arquivos de certificado'),
  ('certificado.approve',  'certificados', 'Aprovar renovacoes e solicitacoes')
ON CONFLICT (chave) DO UPDATE
SET modulo = EXCLUDED.modulo,
    descricao = EXCLUDED.descricao;

-- =============================================================================
-- FUNCAO: Atualizar status automaticamente baseado na validade
-- =============================================================================

CREATE OR REPLACE FUNCTION public.atualizar_status_certificados()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.certificados
  SET status = 'vencido'
  WHERE validade < CURRENT_DATE
    AND status NOT IN ('vencido', 'revogado', 'suspenso');

  UPDATE public.certificados
  SET status = 'proximo_vencimento'
  WHERE validade >= CURRENT_DATE
    AND validade <= CURRENT_DATE + INTERVAL '30 days'
    AND status = 'ativo';
END;
$$;
