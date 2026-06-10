import type { SupabaseClient } from "@supabase/supabase-js";
import type { CriarFolhaInput, FolhaPagamento, Holerite } from "./payroll.types";

export async function criarFolha(supabase: SupabaseClient, input: CriarFolhaInput) {
  const { data, error } = await supabase
    .from("folhas_pagamento")
    .insert({
      empresa_id: input.empresa_id,
      competencia: input.competencia,
      status: "rascunho",
      total_proventos: 0,
      total_descontos: 0,
      total_liquido: 0,
      total_encargos: 0,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as FolhaPagamento;
}

export async function listarFolhas(supabase: SupabaseClient, empresaId: string) {
  const { data, error } = await supabase
    .from("folhas_pagamento")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("competencia", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as FolhaPagamento[];
}

export async function buscarFolha(supabase: SupabaseClient, folhaId: string) {
  const { data, error } = await supabase
    .from("folhas_pagamento")
    .select("*")
    .eq("id", folhaId)
    .single();

  if (error) throw new Error(error.message);
  return data as FolhaPagamento;
}

export async function listarHoleritesDaFolha(supabase: SupabaseClient, folhaId: string) {
  const { data, error } = await supabase
    .from("holerites")
    .select(`*, funcionarios(nome, cpf, cargo), holerite_rubricas(*)`)
    .eq("folha_id", folhaId);

  if (error) throw new Error(error.message);
  return (data ?? []) as Holerite[];
}

export async function salvarHolerite(
  supabase: SupabaseClient,
  folhaId: string,
  funcionarioId: string,
  calculo: {
    salarioBase: number;
    inss: number;
    irrf: number;
    fgts: number;
    totalProventos: number;
    totalDescontos: number;
    liquido: number;
  }
) {
  const { data, error } = await supabase
    .from("holerites")
    .upsert(
      {
        folha_id: folhaId,
        funcionario_id: funcionarioId,
        salario_base: calculo.salarioBase,
        total_proventos: calculo.totalProventos,
        total_descontos: calculo.totalDescontos,
        liquido: calculo.liquido,
        inss: calculo.inss,
        irrf: calculo.irrf,
        fgts: calculo.fgts,
      },
      { onConflict: "folha_id,funcionario_id" }
    )
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data as Holerite;
}

export async function atualizarTotaisFolha(supabase: SupabaseClient, folhaId: string) {
  const holerites = await listarHoleritesDaFolha(supabase, folhaId);

  const totais = holerites.reduce(
    (acc, h) => ({
      total_proventos: acc.total_proventos + h.total_proventos,
      total_descontos: acc.total_descontos + h.total_descontos,
      total_liquido: acc.total_liquido + h.liquido,
      total_encargos: acc.total_encargos + h.fgts,
    }),
    { total_proventos: 0, total_descontos: 0, total_liquido: 0, total_encargos: 0 }
  );

  await supabase.from("folhas_pagamento").update(totais).eq("id", folhaId);
}
