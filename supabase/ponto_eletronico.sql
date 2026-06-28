-- Ponto Eletrônico dos profissionais do escritório
CREATE TABLE IF NOT EXISTS public.ponto_eletronico (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL,
  user_nome     TEXT NOT NULL,
  tipo          TEXT NOT NULL CHECK (tipo IN ('entrada', 'pausa', 'retorno', 'saida')),
  data          DATE NOT NULL DEFAULT CURRENT_DATE,
  hora          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  observacao    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ponto_user_data ON public.ponto_eletronico (user_id, data);

ALTER TABLE public.ponto_eletronico ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios autenticados podem ver pontos"
  ON public.ponto_eletronico FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuarios autenticados podem registrar ponto"
  ON public.ponto_eletronico FOR INSERT
  TO authenticated
  WITH CHECK (true);
