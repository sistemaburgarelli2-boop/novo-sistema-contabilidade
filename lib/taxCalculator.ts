export type SupportedTaxRegime = "mei" | "simples";

export function calculateSimpleTax(regime: SupportedTaxRegime, revenue: number) {
  if (regime === "mei") {
    return {
      amount: revenue > 0 ? 70 : 0,
      rate: 0,
      rule: "Valor fixo base para MEI. Ajuste conforme atividade e ano vigente.",
    };
  }

  const rate = revenue <= 180000 ? 0.06 : 0.112;

  return {
    amount: revenue * rate,
    rate,
    rule: "Calculo simplificado para Simples Nacional. Nao substitui tabela oficial.",
  };
}
