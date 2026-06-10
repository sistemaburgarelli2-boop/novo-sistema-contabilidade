import type { CalculoINSS, CalculoIRRF } from "./payroll.types";

// Tabela INSS 2024 (progressiva)
const FAIXAS_INSS = [
  { limite: 1412.0, aliquota: 0.075 },
  { limite: 2666.68, aliquota: 0.09 },
  { limite: 4000.03, aliquota: 0.12 },
  { limite: 7786.02, aliquota: 0.14 },
];

// Tabela IRRF 2024
const FAIXAS_IRRF = [
  { limite: 2259.2, aliquota: 0, deducao: 0 },
  { limite: 2826.65, aliquota: 0.075, deducao: 169.44 },
  { limite: 3751.05, aliquota: 0.15, deducao: 381.44 },
  { limite: 4664.68, aliquota: 0.225, deducao: 662.77 },
  { limite: Infinity, aliquota: 0.275, deducao: 896.0 },
];

const DEDUCAO_DEPENDENTE_IRRF = 189.59;

export function calcularINSS(salarioBruto: number): CalculoINSS {
  let inss = 0;
  let base = 0;
  let aliquotaFinal = 0;

  let resto = Math.min(salarioBruto, 7786.02);

  for (const faixa of FAIXAS_INSS) {
    if (resto <= 0) break;
    const limiteAnterior = base;
    const parcela = Math.min(resto, faixa.limite - limiteAnterior);
    inss += parcela * faixa.aliquota;
    aliquotaFinal = faixa.aliquota;
    base += parcela;
    resto -= parcela;
  }

  return { base: salarioBruto, aliquota: aliquotaFinal, valor: Math.round(inss * 100) / 100 };
}

export function calcularIRRF(salarioBruto: number, inss: number, dependentes = 0): CalculoIRRF {
  const deducaoDependentes = dependentes * DEDUCAO_DEPENDENTE_IRRF;
  const base = Math.max(0, salarioBruto - inss - deducaoDependentes);

  const faixa = FAIXAS_IRRF.find((f) => base <= f.limite) ?? FAIXAS_IRRF[FAIXAS_IRRF.length - 1];

  const valor = Math.max(0, base * faixa.aliquota - faixa.deducao);

  return {
    base,
    aliquota: faixa.aliquota,
    deducao: faixa.deducao,
    valor: Math.round(valor * 100) / 100,
  };
}

export function calcularFGTS(salarioBruto: number): number {
  return Math.round(salarioBruto * 0.08 * 100) / 100;
}

export function calcularHolerite(salarioBase: number, dependentes = 0) {
  const inss = calcularINSS(salarioBase);
  const irrf = calcularIRRF(salarioBase, inss.valor, dependentes);
  const fgts = calcularFGTS(salarioBase);

  const totalProventos = salarioBase;
  const totalDescontos = inss.valor + irrf.valor;
  const liquido = totalProventos - totalDescontos;

  return { inss, irrf, fgts, totalProventos, totalDescontos, liquido };
}
