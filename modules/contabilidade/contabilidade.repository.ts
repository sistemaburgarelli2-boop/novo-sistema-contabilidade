import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  CriarLancamentoInput,
  CriarPlanoContaInput,
  Lancamento,
  LancamentoPartida,
  PlanoConta,
} from "./contabilidade.types";

export async function listarPlanoContas(supabase: SupabaseClient, empresaId: string) {
  const { data, error } = await supabase
    .from("plano_contas")
    .select("*")
    .eq("empresa_id", empresaId)
    .eq("ativo", true)
    .order("codigo");

  if (error) throw new Error(error.message);
  return (data ?? []) as PlanoConta[];
}

export async function criarPlanoConta(
  supabase: SupabaseClient,
  empresaId: string,
  input: CriarPlanoContaInput
) {
  const nivel = input.pai_id ? await calcularNivel(supabase, input.pai_id) : 1;

  const { data, error } = await supabase
    .from("plano_contas")
    .insert({
      empresa_id: empresaId,
      codigo: input.codigo,
      nome: input.nome,
      tipo: input.tipo,
      natureza: input.natureza,
      pai_id: input.pai_id ?? null,
      nivel,
      ativo: true,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as PlanoConta;
}

async function calcularNivel(supabase: SupabaseClient, paiId: string): Promise<number> {
  const { data } = await supabase.from("plano_contas").select("nivel").eq("id", paiId).single();
  return ((data?.nivel as number) ?? 0) + 1;
}

export async function criarLancamento(supabase: SupabaseClient, input: CriarLancamentoInput) {
  const totalDebitos = input.partidas
    .filter((p) => p.natureza === "debito")
    .reduce((s, p) => s + p.valor, 0);
  const totalCreditos = input.partidas
    .filter((p) => p.natureza === "credito")
    .reduce((s, p) => s + p.valor, 0);

  if (Math.abs(totalDebitos - totalCreditos) > 0.01) {
    throw new Error("Partidas desequilibradas: total de débitos deve ser igual ao de créditos.");
  }

  const { data: lancamento, error: lancamentoError } = await supabase
    .from("lancamentos")
    .insert({
      empresa_id: input.empresa_id,
      data_lancamento: input.data_lancamento,
      historico: input.historico,
      transaction_id: input.transaction_id ?? null,
    })
    .select("*")
    .single();

  if (lancamentoError) throw new Error(lancamentoError.message);

  const partidas = input.partidas.map((p) => ({
    lancamento_id: lancamento.id,
    conta_id: p.conta_id,
    natureza: p.natureza,
    valor: p.valor,
  }));

  const { error: partidasError } = await supabase.from("lancamento_partidas").insert(partidas);

  if (partidasError) throw new Error(partidasError.message);
  return lancamento as Lancamento;
}

export async function listarLancamentos(
  supabase: SupabaseClient,
  empresaId: string,
  inicio: string,
  fim: string
) {
  const { data, error } = await supabase
    .from("lancamentos")
    .select(`*, lancamento_partidas(*, contas:plano_contas(codigo, nome, tipo, natureza))`)
    .eq("empresa_id", empresaId)
    .gte("data_lancamento", inicio)
    .lte("data_lancamento", fim)
    .order("data_lancamento", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as (Lancamento & { lancamento_partidas: LancamentoPartida[] })[];
}

export async function calcularSaldosContas(
  supabase: SupabaseClient,
  empresaId: string,
  ate: string
) {
  const { data, error } = await supabase
    .from("lancamento_partidas")
    .select(`valor, natureza, contas:plano_contas!inner(id, codigo, nome, tipo, natureza, empresa_id)`)
    .eq("contas.empresa_id", empresaId)
    .lte("lancamentos.data_lancamento", ate);

  if (error) throw new Error(error.message);
  return data ?? [];
}
