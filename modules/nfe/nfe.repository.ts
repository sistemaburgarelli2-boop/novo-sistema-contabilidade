import type { SupabaseClient } from "@supabase/supabase-js";
import type { ModeloNF, NFe, StatusNFe } from "./nfe.types";

export async function salvarNFe(
  supabase: SupabaseClient,
  empresaId: string,
  dados: {
    modelo: ModeloNF;
    destinatarioNome: string;
    destinatarioDocumento: string;
    valorTotal: number;
    valorImpostos: number;
    naturezaOperacao: string;
    dataCompetencia: string | null;
    payload: Record<string, unknown>;
  }
) {
  const { data, error } = await supabase
    .from("notas_fiscais")
    .insert({
      empresa_id: empresaId,
      modelo: dados.modelo,
      status: "rascunho",
      destinatario_nome: dados.destinatarioNome,
      destinatario_documento: dados.destinatarioDocumento,
      valor_produtos: dados.valorTotal - dados.valorImpostos,
      valor_servicos: 0,
      valor_impostos: dados.valorImpostos,
      valor_total: dados.valorTotal,
      natureza_operacao: dados.naturezaOperacao,
      data_competencia: dados.dataCompetencia,
      payload: dados.payload,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as NFe;
}

export async function atualizarStatusNFe(
  supabase: SupabaseClient,
  nfeId: string,
  campos: {
    status: StatusNFe;
    chave_acesso?: string;
    numero?: string;
    serie?: string;
    focus_id?: string;
    danfe_url?: string;
    xml_url?: string;
    mensagem_sefaz?: string;
    data_emissao?: string;
  }
) {
  const { data, error } = await supabase
    .from("notas_fiscais")
    .update(campos)
    .eq("id", nfeId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as NFe;
}

export async function listarNFes(
  supabase: SupabaseClient,
  empresaId: string,
  filtros?: { status?: StatusNFe; modelo?: ModeloNF }
) {
  let query = supabase
    .from("notas_fiscais")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (filtros?.status) query = query.eq("status", filtros.status);
  if (filtros?.modelo) query = query.eq("modelo", filtros.modelo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []) as NFe[];
}

export async function buscarNFe(supabase: SupabaseClient, nfeId: string) {
  const { data, error } = await supabase
    .from("notas_fiscais")
    .select("*")
    .eq("id", nfeId)
    .single();

  if (error) throw new Error(error.message);
  return data as NFe;
}
