-- Migration: notas_fiscais.empresa_id passa a referenciar public.empresas
--
-- A tabela foi criada referenciando public.companies, mas o sistema cadastra
-- os clientes em public.empresas (criarEmpresaComBootstrap nunca escreve em
-- companies). Com isso, emitir uma nota falhava com
--   "violates foreign key constraint notas_fiscais_empresa_id_fkey".
--
-- O bloco abaixo aborta sem alterar nada se existirem notas cujo empresa_id
-- nao esteja em public.empresas — assim nenhum registro e perdido silenciosamente.

DO $$
DECLARE
  orfas INTEGER;
BEGIN
  IF to_regclass('public.empresas') IS NULL THEN
    RAISE EXCEPTION 'Tabela public.empresas nao existe neste banco.';
  END IF;

  SELECT COUNT(*) INTO orfas
  FROM public.notas_fiscais nf
  WHERE NOT EXISTS (
    SELECT 1 FROM public.empresas e WHERE e.id = nf.empresa_id
  );

  IF orfas > 0 THEN
    RAISE EXCEPTION
      'Existem % nota(s) fiscal(is) com empresa_id fora de public.empresas. Migre ou remova esses registros antes de rodar este script.',
      orfas;
  END IF;
END $$;

ALTER TABLE public.notas_fiscais
  DROP CONSTRAINT IF EXISTS notas_fiscais_empresa_id_fkey;

ALTER TABLE public.notas_fiscais
  ADD CONSTRAINT notas_fiscais_empresa_id_fkey
  FOREIGN KEY (empresa_id) REFERENCES public.empresas(id) ON DELETE CASCADE;
