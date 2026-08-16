import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { SupabaseClient } from "@supabase/supabase-js";

type ContextoEmpresa = {
  /** Client autenticado (respeita RLS) — use para leituras. */
  supabase: SupabaseClient;
  /**
   * Client service role para escritas ja autorizadas aqui. Sem a
   * SUPABASE_SERVICE_ROLE_KEY configurada cai no client autenticado, e a
   * gravacao passa a depender das policies de RLS da tabela.
   */
  admin: SupabaseClient;
  userId: string;
};

/**
 * Garante que o usuario logado tem vinculo ativo com a empresa e devolve os
 * clients prontos para uso. Lanca "Nao autenticado." ou "Sem acesso a esta
 * empresa." quando o acesso nao e permitido.
 *
 * As policies de escrita de algumas tabelas exigem permissoes granulares que
 * nem toda instalacao tem cadastradas, entao a autorizacao e feita aqui e a
 * gravacao usa o client admin — mesmo padrao dos modulos de empresas e RBAC.
 */
export async function exigirAcessoEmpresa(empresaId: string): Promise<ContextoEmpresa> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error("Nao autenticado.");

  const admin = env.supabaseServiceRoleKey ? createSupabaseAdminClient() : supabase;

  if (!(await temVinculoComEmpresa(supabase, admin, empresaId, user.id))) {
    throw new Error("Sem acesso a esta empresa.");
  }

  return { supabase, admin, userId: user.id };
}

async function temVinculoComEmpresa(
  supabase: SupabaseClient,
  leitor: SupabaseClient,
  empresaId: string,
  userId: string,
) {
  const { data: rpc, error: rpcErr } = await supabase.rpc("tem_acesso_empresa", {
    p_empresa_id: empresaId,
  });
  if (!rpcErr && rpc === true) return true;

  const { data: vinculo } = await leitor
    .from("usuarios_empresas")
    .select("id")
    .eq("empresa_id", empresaId)
    .eq("usuario_id", userId)
    .eq("status", "ativo")
    .maybeSingle();
  if (vinculo) return true;

  const { data: membro } = await leitor
    .from("company_members")
    .select("id")
    .eq("company_id", empresaId)
    .eq("user_id", userId)
    .maybeSingle();

  return !!membro;
}

/** Traduz o erro do helper para o status HTTP correspondente. */
export function statusDoErroAcesso(mensagem: string) {
  if (mensagem === "Nao autenticado.") return 401;
  if (mensagem === "Sem acesso a esta empresa.") return 403;
  return 500;
}

/**
 * Erros do Postgres chegam ao usuario final como texto cru ("violates row-level
 * security policy..."), que nao diz o que fazer. Aqui viram instrucao.
 */
export function traduzirErroBanco(mensagem: string) {
  if (/row-level security/i.test(mensagem)) {
    return "Sem permissao no banco para gravar a nota. Aplique a migracao 20260816000000_nf_rls_membros_empresa.sql no Supabase ou configure a SUPABASE_SERVICE_ROLE_KEY.";
  }

  if (/notas_fiscais_empresa_id_fkey|foreign key constraint/i.test(mensagem)) {
    return "A empresa desta nota nao existe na tabela referenciada pelo banco. Aplique a migracao 20260816000100_nf_fk_empresas.sql no Supabase.";
  }

  return mensagem;
}
