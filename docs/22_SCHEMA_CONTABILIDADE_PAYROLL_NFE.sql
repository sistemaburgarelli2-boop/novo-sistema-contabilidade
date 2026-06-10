-- ============================================================
-- MIGRATION: Contabilidade, Folha de Pagamento e NF-e
-- Aplicar no Supabase SQL Editor (production ou homologação)
-- ============================================================

-- -----------------------------------------------
-- 1. PLANO DE CONTAS (partidas dobradas)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.plano_contas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  codigo        VARCHAR(20) NOT NULL,
  nome          TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN (
    'ativo_circulante','ativo_nao_circulante',
    'passivo_circulante','passivo_nao_circulante',
    'patrimonio_liquido','receita','custo',
    'despesa_operacional','despesa_financeira','outras_receitas'
  )),
  natureza      TEXT NOT NULL CHECK (natureza IN ('devedora','credora')),
  pai_id        UUID REFERENCES public.plano_contas(id),
  nivel         INT NOT NULL DEFAULT 1,
  ativo         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, codigo)
);

-- -----------------------------------------------
-- 2. LANÇAMENTOS CONTÁBEIS
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.lancamentos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id      UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  data_lancamento DATE NOT NULL,
  historico       TEXT NOT NULL,
  transaction_id  UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lancamento_partidas (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lancamento_id  UUID NOT NULL REFERENCES public.lancamentos(id) ON DELETE CASCADE,
  conta_id       UUID NOT NULL REFERENCES public.plano_contas(id),
  natureza       TEXT NOT NULL CHECK (natureza IN ('debito','credito')),
  valor          NUMERIC(14,2) NOT NULL CHECK (valor > 0)
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_lancamentos_empresa_data
  ON public.lancamentos (empresa_id, data_lancamento);
CREATE INDEX IF NOT EXISTS idx_lancamento_partidas_lancamento
  ON public.lancamento_partidas (lancamento_id);
CREATE INDEX IF NOT EXISTS idx_lancamento_partidas_conta
  ON public.lancamento_partidas (conta_id);

-- -----------------------------------------------
-- 3. FOLHA DE PAGAMENTO
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.folhas_pagamento (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id       UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  competencia      VARCHAR(7) NOT NULL,        -- YYYY-MM
  status           TEXT NOT NULL DEFAULT 'rascunho'
                     CHECK (status IN ('rascunho','calculada','aprovada','paga','cancelada')),
  total_proventos  NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_descontos  NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_liquido    NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_encargos   NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (empresa_id, competencia)
);

-- Adicionar coluna dependentes nos funcionários (se não existir)
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS dependentes INT NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.holerites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folha_id        UUID NOT NULL REFERENCES public.folhas_pagamento(id) ON DELETE CASCADE,
  funcionario_id  UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  salario_base    NUMERIC(14,2) NOT NULL,
  total_proventos NUMERIC(14,2) NOT NULL DEFAULT 0,
  total_descontos NUMERIC(14,2) NOT NULL DEFAULT 0,
  liquido         NUMERIC(14,2) NOT NULL DEFAULT 0,
  inss            NUMERIC(14,2) NOT NULL DEFAULT 0,
  irrf            NUMERIC(14,2) NOT NULL DEFAULT 0,
  fgts            NUMERIC(14,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (folha_id, funcionario_id)
);

CREATE TABLE IF NOT EXISTS public.holerite_rubricas (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holerite_id  UUID NOT NULL REFERENCES public.holerites(id) ON DELETE CASCADE,
  rubrica_id   UUID,
  descricao    TEXT NOT NULL,
  natureza     TEXT NOT NULL CHECK (natureza IN ('provento','desconto','informativo')),
  valor        NUMERIC(14,2) NOT NULL,
  referencia   NUMERIC(10,4)
);

-- -----------------------------------------------
-- 4. NOTAS FISCAIS (NF-e / NFS-e / NFC-e)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS public.notas_fiscais (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id              UUID NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  numero                  VARCHAR(20),
  serie                   VARCHAR(5),
  modelo                  TEXT NOT NULL CHECK (modelo IN ('nfse','nfe','nfce')),
  status                  TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN (
    'rascunho','aguardando_autorizacao','autorizada',
    'cancelada','rejeitada','inutilizada'
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
  natureza_operacao       TEXT NOT NULL DEFAULT 'Prestação de serviços',
  data_emissao            DATE,
  data_competencia        DATE,
  mensagem_sefaz          TEXT,
  payload                 JSONB NOT NULL DEFAULT '{}',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notas_fiscais_empresa
  ON public.notas_fiscais (empresa_id, status);

-- -----------------------------------------------
-- 5. ROW LEVEL SECURITY
-- -----------------------------------------------
ALTER TABLE public.plano_contas     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamentos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lancamento_partidas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folhas_pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holerites        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holerite_rubricas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas_fiscais    ENABLE ROW LEVEL SECURITY;

-- Política: usuário só vê dados de empresas às quais pertence
CREATE OR REPLACE FUNCTION public.usuario_pertence_empresa(eid UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios_empresas
    WHERE usuario_id = auth.uid()
    AND empresa_id = eid
    AND status = 'ativo'
  );
$$;

-- plano_contas
CREATE POLICY "plano_contas_empresa_membro" ON public.plano_contas
  FOR ALL USING (usuario_pertence_empresa(empresa_id));

-- lancamentos
CREATE POLICY "lancamentos_empresa_membro" ON public.lancamentos
  FOR ALL USING (usuario_pertence_empresa(empresa_id));

-- lancamento_partidas (herda via lancamento)
CREATE POLICY "lancamento_partidas_via_lancamento" ON public.lancamento_partidas
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.lancamentos l WHERE l.id = lancamento_id AND usuario_pertence_empresa(l.empresa_id))
  );

-- folhas_pagamento
CREATE POLICY "folhas_empresa_membro" ON public.folhas_pagamento
  FOR ALL USING (usuario_pertence_empresa(empresa_id));

-- holerites (herda via folha)
CREATE POLICY "holerites_via_folha" ON public.holerites
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.folhas_pagamento f WHERE f.id = folha_id AND usuario_pertence_empresa(f.empresa_id))
  );

-- holerite_rubricas (herda via holerite)
CREATE POLICY "holerite_rubricas_via_holerite" ON public.holerite_rubricas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.holerites h
      JOIN public.folhas_pagamento f ON f.id = h.folha_id
      WHERE h.id = holerite_id AND usuario_pertence_empresa(f.empresa_id)
    )
  );

-- notas_fiscais
CREATE POLICY "notas_fiscais_empresa_membro" ON public.notas_fiscais
  FOR ALL USING (usuario_pertence_empresa(empresa_id));

-- -----------------------------------------------
-- 6. TRIGGERS updated_at
-- -----------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE FUNCTION public.set_updated_at()
    RETURNS TRIGGER LANGUAGE plpgsql AS $func$
    BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
    $func$;
  END IF;
END $$;

CREATE OR REPLACE TRIGGER trg_plano_contas_updated_at
  BEFORE UPDATE ON public.plano_contas FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_folhas_pagamento_updated_at
  BEFORE UPDATE ON public.folhas_pagamento FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE OR REPLACE TRIGGER trg_notas_fiscais_updated_at
  BEFORE UPDATE ON public.notas_fiscais FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- -----------------------------------------------
-- 7. PLANO DE CONTAS PADRÃO (opcional - execute por empresa)
-- -----------------------------------------------
-- Para inserir um plano de contas básico para uma empresa, execute:
--
-- INSERT INTO public.plano_contas (empresa_id, codigo, nome, tipo, natureza, nivel) VALUES
--   ('<EMPRESA_ID>', '1',      'ATIVO',                    'ativo_circulante',      'devedora', 1),
--   ('<EMPRESA_ID>', '1.1',    'Ativo Circulante',          'ativo_circulante',      'devedora', 2),
--   ('<EMPRESA_ID>', '1.1.01', 'Caixa',                     'ativo_circulante',      'devedora', 3),
--   ('<EMPRESA_ID>', '1.1.02', 'Banco Conta Corrente',      'ativo_circulante',      'devedora', 3),
--   ('<EMPRESA_ID>', '1.1.03', 'Contas a Receber',          'ativo_circulante',      'devedora', 3),
--   ('<EMPRESA_ID>', '2',      'PASSIVO',                   'passivo_circulante',    'credora',  1),
--   ('<EMPRESA_ID>', '2.1',    'Passivo Circulante',        'passivo_circulante',    'credora',  2),
--   ('<EMPRESA_ID>', '2.1.01', 'Fornecedores',              'passivo_circulante',    'credora',  3),
--   ('<EMPRESA_ID>', '2.1.02', 'Obrigações Trabalhistas',   'passivo_circulante',    'credora',  3),
--   ('<EMPRESA_ID>', '2.1.03', 'Impostos a Recolher',       'passivo_circulante',    'credora',  3),
--   ('<EMPRESA_ID>', '3',      'PATRIMÔNIO LÍQUIDO',        'patrimonio_liquido',    'credora',  1),
--   ('<EMPRESA_ID>', '3.1',    'Capital Social',            'patrimonio_liquido',    'credora',  2),
--   ('<EMPRESA_ID>', '3.2',    'Lucros Acumulados',         'patrimonio_liquido',    'credora',  2),
--   ('<EMPRESA_ID>', '4',      'RECEITAS',                  'receita',               'credora',  1),
--   ('<EMPRESA_ID>', '4.1',    'Receita de Serviços',       'receita',               'credora',  2),
--   ('<EMPRESA_ID>', '4.2',    'Receita de Vendas',         'receita',               'credora',  2),
--   ('<EMPRESA_ID>', '5',      'CUSTOS',                    'custo',                 'devedora', 1),
--   ('<EMPRESA_ID>', '5.1',    'Custo dos Serviços',        'custo',                 'devedora', 2),
--   ('<EMPRESA_ID>', '6',      'DESPESAS',                  'despesa_operacional',   'devedora', 1),
--   ('<EMPRESA_ID>', '6.1',    'Despesas Administrativas',  'despesa_operacional',   'devedora', 2),
--   ('<EMPRESA_ID>', '6.2',    'Despesas com Pessoal',      'despesa_operacional',   'devedora', 2),
--   ('<EMPRESA_ID>', '6.3',    'Despesas Financeiras',      'despesa_financeira',    'devedora', 2);
