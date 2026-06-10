import { describe, expect, it } from "vitest";
import { validarCriarEmpresa, validarAtualizarEmpresa } from "@/modules/empresas/empresas.validators";

describe("validarCriarEmpresa", () => {
  it("aceita payload válido com todos os campos", () => {
    const result = validarCriarEmpresa({
      nome_legal: "Burgarelli Ltda",
      nome_fantasia: "Burgarelli",
      cnpj: "12.345.678/0001-00",
      regime_tributario: "simples",
      subdominio: "burgarelli",
      cidade: "São Paulo",
      estado: "SP",
    });
    expect(result.nome_legal).toBe("Burgarelli Ltda");
    expect(result.estado).toBe("SP");
  });

  it("aceita payload apenas com nome_legal", () => {
    const result = validarCriarEmpresa({ nome_legal: "Empresa Mínima" });
    expect(result.nome_legal).toBe("Empresa Mínima");
  });

  it("lança erro para payload nulo", () => {
    expect(() => validarCriarEmpresa(null)).toThrow("Payload invalido.");
  });

  it("lança erro para payload não-objeto", () => {
    expect(() => validarCriarEmpresa("string")).toThrow("Payload invalido.");
  });

  it("lança erro quando nome_legal é muito curto", () => {
    expect(() => validarCriarEmpresa({ nome_legal: "X" })).toThrow();
  });

  it("lança erro para subdomínio inválido (com espaço)", () => {
    expect(() =>
      validarCriarEmpresa({ nome_legal: "Empresa Teste", subdominio: "meu dominio" })
    ).toThrow("Subdominio invalido.");
  });

  it("converte estado para maiúsculas", () => {
    const result = validarCriarEmpresa({ nome_legal: "Empresa Teste", estado: "sp" });
    expect(result.estado).toBe("SP");
  });

  it("converte subdomínio para minúsculas", () => {
    const result = validarCriarEmpresa({ nome_legal: "Empresa Teste", subdominio: "minha-empresa" });
    expect(result.subdominio).toBe("minha-empresa");
  });
});

describe("validarAtualizarEmpresa", () => {
  it("aceita status válidos", () => {
    const result = validarAtualizarEmpresa({ nome_legal: "Empresa", status: "suspensa" });
    expect(result.status).toBe("suspensa");
  });

  it("ignora status inválido", () => {
    const result = validarAtualizarEmpresa({ nome_legal: "Empresa", status: "invalido" });
    expect(result.status).toBeUndefined();
  });
});
