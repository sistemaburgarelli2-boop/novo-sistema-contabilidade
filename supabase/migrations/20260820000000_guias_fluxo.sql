-- =============================================================================
-- Guias: fluxo de trabalho do escritorio ate o portal do cliente
--
-- A tabela nascera com os status ('pendente','disponivel','paga','vencida',
-- 'cancelada'), mas o fluxo real tem um passo intermediario: a guia e gerada
-- pelo escritorio (emitida) antes de ser publicada para o cliente
-- (disponivel). Sem esse estado nao da para separar "ja emiti mas ainda estou
-- conferindo" de "o cliente ja pode baixar e pagar".
-- =============================================================================

ALTER TABLE public.guias DROP CONSTRAINT IF EXISTS guias_status_check;

ALTER TABLE public.guias
  ADD CONSTRAINT guias_status_check
  CHECK (status IN ('pendente', 'emitida', 'disponivel', 'paga', 'vencida', 'cancelada'));

-- Data em que o pagamento foi registrado. A tela do setor fiscal ja pedia essa
-- data no modal de baixa, mas nao havia onde grava-la.
ALTER TABLE public.guias ADD COLUMN IF NOT EXISTS pago_em DATE;

-- O portal filtra por status a cada carregamento da pagina.
CREATE INDEX IF NOT EXISTS idx_guias_status ON public.guias(status);
