-- Migration: RLS de notas_fiscais para membros da empresa
--
-- A emissao pelo sistema falhava com
--   "new row violates row-level security policy for table notas_fiscais"
-- porque as policies de escrita existentes exigiam ou a permissao granular
-- 'fiscal.write' (roles_permissoes) ou um vinculo em company_members com role
-- owner/admin/accountant. Quem entra pelo vinculo de usuarios_empresas — o
-- caminho normal do sistema — enxergava as notas (SELECT) mas nao conseguia
-- inserir.
--
-- Aqui a escrita passa a aceitar tambem o membro ativo da empresa, mantendo as
-- policies antigas intactas (policies permissivas se somam com OR).

-- Vinculo ativo em usuarios_empresas OU membro em company_members.
CREATE OR REPLACE FUNCTION public.e_membro_empresa(p_empresa_id UUID)
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
  )
  OR EXISTS (
    SELECT 1
    FROM public.company_members cm
    WHERE cm.company_id = p_empresa_id
      AND cm.user_id = auth.uid()
  );
$$;

DROP POLICY IF EXISTS "notas_fiscais_insert_membro" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_insert_membro"
ON public.notas_fiscais FOR INSERT
WITH CHECK (public.e_membro_empresa(empresa_id));

DROP POLICY IF EXISTS "notas_fiscais_update_membro" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_update_membro"
ON public.notas_fiscais FOR UPDATE
USING (public.e_membro_empresa(empresa_id))
WITH CHECK (public.e_membro_empresa(empresa_id));

DROP POLICY IF EXISTS "notas_fiscais_select_membro" ON public.notas_fiscais;
CREATE POLICY "notas_fiscais_select_membro"
ON public.notas_fiscais FOR SELECT
USING (public.e_membro_empresa(empresa_id));
