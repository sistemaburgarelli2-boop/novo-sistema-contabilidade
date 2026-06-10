import { describe, expect, it } from "vitest";
import { calculateSimpleTax } from "@/lib/taxCalculator";

describe("calculateSimpleTax — MEI", () => {
  it("retorna valor fixo de 70 para receita positiva", () => {
    const result = calculateSimpleTax("mei", 5000);
    expect(result.amount).toBe(70);
  });

  it("retorna 0 para receita zero", () => {
    const result = calculateSimpleTax("mei", 0);
    expect(result.amount).toBe(0);
  });

  it("a taxa (rate) do MEI é sempre 0", () => {
    const result = calculateSimpleTax("mei", 10000);
    expect(result.rate).toBe(0);
  });

  it("inclui texto da regra no retorno", () => {
    const result = calculateSimpleTax("mei", 1000);
    expect(result.rule).toBeTruthy();
  });
});

describe("calculateSimpleTax — Simples Nacional", () => {
  it("aplica alíquota de 6% para receita até R$ 180.000", () => {
    const result = calculateSimpleTax("simples", 100000);
    expect(result.rate).toBe(0.06);
    expect(result.amount).toBeCloseTo(6000);
  });

  it("aplica alíquota de 11,2% para receita acima de R$ 180.000", () => {
    const result = calculateSimpleTax("simples", 200000);
    expect(result.rate).toBe(0.112);
    expect(result.amount).toBeCloseTo(22400);
  });

  it("receita exatamente em R$ 180.000 usa a faixa menor (6%)", () => {
    const result = calculateSimpleTax("simples", 180000);
    expect(result.rate).toBe(0.06);
  });

  it("receita de R$ 180.001 usa a faixa maior (11,2%)", () => {
    const result = calculateSimpleTax("simples", 180001);
    expect(result.rate).toBe(0.112);
  });

  it("receita zero resulta em imposto zero", () => {
    const result = calculateSimpleTax("simples", 0);
    expect(result.amount).toBe(0);
  });

  it("inclui texto da regra no retorno", () => {
    const result = calculateSimpleTax("simples", 50000);
    expect(result.rule).toBeTruthy();
  });
});
