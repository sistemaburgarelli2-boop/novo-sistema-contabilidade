import type { SupabaseClient } from "@supabase/supabase-js";
import type { Assinatura, Plano, UsoPlano } from "@/modules/billing/billing.types";

export async function listarPlanosAtivos(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("planos")
    .select("*")
    .eq("ativo", true)
    .order("preco_centavos", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Plano[];
}

export async function buscarPlanoStarter(admin: SupabaseClient) {
  const { data, error } = await admin.from("planos").select("*").eq("codigo", "starter").single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Plano;
}

export async function buscarAssinaturaPorEmpresa(supabase: SupabaseClient, empresaId: string) {
  const { data, error } = await supabase
    .from("assinaturas")
    .select("*, planos(*)")
    .eq("empresa_id", empresaId)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Assinatura & { planos: Plano };
}

export async function calcularUsoEmpresa(admin: SupabaseClient, empresaId: string): Promise<UsoPlano> {
  const [{ count: usuarios }, { count: transacoes }] = await Promise.all([
    admin
      .from("usuarios_empresas")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .eq("status", "ativo"),
    admin
      .from("transacoes")
      .select("id", { count: "exact", head: true })
      .eq("empresa_id", empresaId)
      .gte("data_transacao", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10)),
  ]);

  return {
    empresas: 1,
    transacoes_mes: transacoes ?? 0,
    usuarios: usuarios ?? 0,
  };
}

export async function contarEmpresasDoUsuario(admin: SupabaseClient, usuarioId: string) {
  const { count, error } = await admin
    .from("usuarios_empresas")
    .select("empresa_id", { count: "exact", head: true })
    .eq("usuario_id", usuarioId)
    .eq("status", "ativo");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

