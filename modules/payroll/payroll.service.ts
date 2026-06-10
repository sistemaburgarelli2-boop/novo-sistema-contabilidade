import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { calcularHolerite } from "./payroll.calculator";
import {
  atualizarTotaisFolha,
  buscarFolha,
  criarFolha,
  listarFolhas,
  listarHoleritesDaFolha,
  salvarHolerite,
} from "./payroll.repository";
import type { CriarFolhaInput } from "./payroll.types";

export async function iniciarFolha(input: CriarFolhaInput) {
  const supabase = await createSupabaseServerClient();

  const existente = await supabase
    .from("folhas_pagamento")
    .select("id")
    .eq("empresa_id", input.empresa_id)
    .eq("competencia", input.competencia)
    .maybeSingle();

  if (existente.data) {
    throw new Error(`Folha para competência ${input.competencia} já existe.`);
  }

  return criarFolha(supabase, input);
}

export async function obterFolhas(empresaId: string) {
  const supabase = await createSupabaseServerClient();
  return listarFolhas(supabase, empresaId);
}

export async function obterHolerites(folhaId: string) {
  const supabase = await createSupabaseServerClient();
  return listarHoleritesDaFolha(supabase, folhaId);
}

export async function calcularFolha(folhaId: string) {
  const supabase = await createSupabaseServerClient();
  const folha = await buscarFolha(supabase, folhaId);

  if (folha.status !== "rascunho" && folha.status !== "calculada") {
    throw new Error("Apenas folhas em rascunho ou calculadas podem ser recalculadas.");
  }

  const { data: funcionarios, error } = await supabase
    .from("funcionarios")
    .select("id, salario, dependentes")
    .eq("empresa_id", folha.empresa_id)
    .eq("status", "ativo");

  if (error) throw new Error(error.message);

  for (const func of funcionarios ?? []) {
    const calculo = calcularHolerite(func.salario ?? 0, func.dependentes ?? 0);

    await salvarHolerite(supabase, folhaId, func.id, {
      salarioBase: func.salario ?? 0,
      inss: calculo.inss.valor,
      irrf: calculo.irrf.valor,
      fgts: calculo.fgts,
      totalProventos: calculo.totalProventos,
      totalDescontos: calculo.totalDescontos,
      liquido: calculo.liquido,
    });
  }

  await supabase.from("folhas_pagamento").update({ status: "calculada" }).eq("id", folhaId);
  await atualizarTotaisFolha(supabase, folhaId);

  return buscarFolha(supabase, folhaId);
}

export async function aprovarFolha(folhaId: string) {
  const supabase = await createSupabaseServerClient();
  const folha = await buscarFolha(supabase, folhaId);

  if (folha.status !== "calculada") {
    throw new Error("Apenas folhas calculadas podem ser aprovadas.");
  }

  await supabase.from("folhas_pagamento").update({ status: "aprovada" }).eq("id", folhaId);
  return buscarFolha(supabase, folhaId);
}
