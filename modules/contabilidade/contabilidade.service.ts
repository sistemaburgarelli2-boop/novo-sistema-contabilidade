import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import type {
  Balanco,
  CriarLancamentoInput,
  CriarPlanoContaInput,
  DRE,
  GrupoBalanco,
  LinhaDRE,
  PlanoConta,
} from "./contabilidade.types";
import {
  calcularSaldosContas,
  criarLancamento,
  criarPlanoConta,
  listarLancamentos,
  listarPlanoContas,
} from "./contabilidade.repository";

export async function obterPlanoContas(empresaId: string) {
  const supabase = await createSupabaseServerClient();
  return listarPlanoContas(supabase, empresaId);
}

export async function adicionarConta(empresaId: string, input: CriarPlanoContaInput) {
  const supabase = await createSupabaseServerClient();
  return criarPlanoConta(supabase, empresaId, input);
}

export async function registrarLancamento(input: CriarLancamentoInput) {
  const supabase = await createSupabaseServerClient();
  return criarLancamento(supabase, input);
}

export async function obterLancamentos(empresaId: string, inicio: string, fim: string) {
  const supabase = await createSupabaseServerClient();
  return listarLancamentos(supabase, empresaId, inicio, fim);
}

export async function gerarDRE(empresaId: string, inicio: string, fim: string): Promise<DRE> {
  const supabase = await createSupabaseServerClient();
  const lancamentos = await listarLancamentos(supabase, empresaId, inicio, fim);

  const saldos = new Map<string, { nome: string; tipo: string; saldo: number }>();

  for (const lanc of lancamentos) {
    for (const partida of lanc.lancamento_partidas ?? []) {
      const conta = partida.contas;
      if (!conta) continue;
      const chave = `${conta.codigo}||${conta.nome}||${conta.tipo}`;
      const atual = saldos.get(chave) ?? { nome: conta.nome, tipo: conta.tipo, saldo: 0 };
      const delta = partida.natureza === "credito" ? partida.valor : -partida.valor;
      saldos.set(chave, { ...atual, saldo: atual.saldo + delta });
    }
  }

  let receitaBruta = 0;
  let custos = 0;
  let despesasOp = 0;
  let resultadoFin = 0;
  let irCsll = 0;
  const linhas: LinhaDRE[] = [];

  for (const [chave, { nome, tipo, saldo }] of saldos) {
    const codigo = chave.split("||")[0];
    if (tipo === "receita") receitaBruta += Math.abs(saldo);
    else if (tipo === "custo") custos += Math.abs(saldo);
    else if (tipo === "despesa_operacional") despesasOp += Math.abs(saldo);
    else if (tipo === "despesa_financeira") resultadoFin += Math.abs(saldo);
    linhas.push({ conta: codigo, descricao: nome, valor: Math.abs(saldo) });
  }

  const receitaLiquida = receitaBruta;
  const lucroBruto = receitaLiquida - custos;
  const ebit = lucroBruto - despesasOp;
  const lucroAntesIR = ebit - resultadoFin;
  irCsll = lucroAntesIR > 0 ? lucroAntesIR * 0.15 : 0;
  const lucroLiquido = lucroAntesIR - irCsll;

  return {
    empresa_id: empresaId,
    periodo_inicio: inicio,
    periodo_fim: fim,
    receita_bruta: receitaBruta,
    deducoes: 0,
    receita_liquida: receitaLiquida,
    custos,
    lucro_bruto: lucroBruto,
    despesas_operacionais: despesasOp,
    ebit,
    resultado_financeiro: -resultadoFin,
    lucro_antes_ir: lucroAntesIR,
    ir_csll: irCsll,
    lucro_liquido: lucroLiquido,
    linhas,
  };
}

export async function gerarBalanco(empresaId: string, dataReferencia: string): Promise<Balanco> {
  const supabase = await createSupabaseServerClient();
  const planoContas = await listarPlanoContas(supabase, empresaId);

  // saldo por conta até a data de referência
  const saldoPorConta = new Map<string, number>();
  const lancamentos = await listarLancamentos(supabase, empresaId, "2000-01-01", dataReferencia);

  for (const lanc of lancamentos) {
    for (const partida of lanc.lancamento_partidas ?? []) {
      const atual = saldoPorConta.get(partida.conta_id) ?? 0;
      const conta = planoContas.find((c) => c.id === partida.conta_id);
      if (!conta) continue;
      const delta =
        conta.natureza === "devedora"
          ? partida.natureza === "debito"
            ? partida.valor
            : -partida.valor
          : partida.natureza === "credito"
            ? partida.valor
            : -partida.valor;
      saldoPorConta.set(partida.conta_id, atual + delta);
    }
  }

  function buildGrupo(tipo: PlanoConta["tipo"]): GrupoBalanco {
    const contas = planoContas
      .filter((c) => c.tipo === tipo && c.nivel > 0)
      .map((c) => ({ codigo: c.codigo, nome: c.nome, saldo: saldoPorConta.get(c.id) ?? 0 }))
      .filter((c) => c.saldo !== 0);
    return {
      descricao: tipo.replace(/_/g, " "),
      total: contas.reduce((s, c) => s + c.saldo, 0),
      contas,
    };
  }

  const ativoCirculante = buildGrupo("ativo_circulante");
  const ativoNaoCirculante = buildGrupo("ativo_nao_circulante");
  const passivoCirculante = buildGrupo("passivo_circulante");
  const passivoNaoCirculante = buildGrupo("passivo_nao_circulante");
  const pl = buildGrupo("patrimonio_liquido");

  const totalAtivo = ativoCirculante.total + ativoNaoCirculante.total;
  const totalPassivo = passivoCirculante.total + passivoNaoCirculante.total;

  return {
    empresa_id: empresaId,
    data_referencia: dataReferencia,
    ativo: { circulante: ativoCirculante, nao_circulante: ativoNaoCirculante, total: totalAtivo },
    passivo: {
      circulante: passivoCirculante,
      nao_circulante: passivoNaoCirculante,
      total: totalPassivo,
    },
    patrimonio_liquido: { ...pl, total: pl.total },
    total_passivo_pl: totalPassivo + pl.total,
  };
}
