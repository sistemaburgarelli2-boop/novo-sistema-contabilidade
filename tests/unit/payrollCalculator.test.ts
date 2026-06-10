import { describe, expect, it } from "vitest";
import { calcularINSS, calcularIRRF, calcularFGTS, calcularHolerite } from "@/modules/payroll/payroll.calculator";

describe("calcularINSS", () => {
  it("aplica 7,5% na primeira faixa (até R$ 1.412)", () => {
    const r = calcularINSS(1412);
    expect(r.valor).toBeCloseTo(105.90, 1);
  });

  it("calcula progressivamente para salário R$ 5.000", () => {
    const r = calcularINSS(5000);
    expect(r.valor).toBeGreaterThan(0);
    expect(r.base).toBe(5000);
  });

  it("não ultrapassa teto do INSS (base R$ 7.786,02)", () => {
    const semTeto = calcularINSS(7786.02);
    const acimaTeto = calcularINSS(15000);
    expect(acimaTeto.valor).toBe(semTeto.valor);
  });

  it("retorna zero para salário zero", () => {
    const r = calcularINSS(0);
    expect(r.valor).toBe(0);
  });
});

describe("calcularIRRF", () => {
  it("isento para base até R$ 2.259,20", () => {
    const r = calcularIRRF(2500, 300);
    expect(r.valor).toBe(0);
  });

  it("desconta INSS da base do IRRF", () => {
    const inss = 300;
    const r = calcularIRRF(3000, inss);
    expect(r.base).toBe(2700);
  });

  it("desconta dependentes da base do IRRF", () => {
    const inss = 200;
    const r = calcularIRRF(4000, inss, 2);
    expect(r.base).toBeCloseTo(4000 - 200 - 2 * 189.59, 0);
  });

  it("nunca retorna valor negativo", () => {
    const r = calcularIRRF(1000, 100);
    expect(r.valor).toBeGreaterThanOrEqual(0);
  });
});

describe("calcularFGTS", () => {
  it("calcula 8% do salário bruto", () => {
    expect(calcularFGTS(2000)).toBeCloseTo(160, 2);
    expect(calcularFGTS(5000)).toBeCloseTo(400, 2);
  });
});

describe("calcularHolerite", () => {
  it("líquido é salário menos INSS e IRRF", () => {
    const r = calcularHolerite(3000);
    expect(r.liquido).toBeCloseTo(r.totalProventos - r.inss.valor - r.irrf.valor, 1);
  });

  it("retorna totais coerentes", () => {
    const r = calcularHolerite(5000, 1);
    expect(r.totalProventos).toBe(5000);
    expect(r.totalDescontos).toBeCloseTo(r.inss.valor + r.irrf.valor, 1);
    expect(r.liquido).toBeCloseTo(r.totalProventos - r.totalDescontos, 1);
  });
});
