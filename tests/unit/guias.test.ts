import { describe, expect, it } from "vitest";
import {
  STATUS_VISIVEIS_CLIENTE,
  podePublicar,
  statusEfetivo,
} from "@/modules/guias/guias.types";

describe("statusEfetivo", () => {
  const hoje = new Date("2026-08-20T10:00:00");

  it("marca como vencida a guia disponivel cujo vencimento ja passou", () => {
    const status = statusEfetivo({ status: "disponivel", vencimento: "2026-08-19" }, hoje);
    expect(status).toBe("vencida");
  });

  it("mantem disponivel quando vence hoje", () => {
    const status = statusEfetivo({ status: "disponivel", vencimento: "2026-08-20" }, hoje);
    expect(status).toBe("disponivel");
  });

  it("mantem disponivel quando o vencimento e futuro", () => {
    const status = statusEfetivo({ status: "disponivel", vencimento: "2026-09-20" }, hoje);
    expect(status).toBe("disponivel");
  });

  it("nao reabre guia paga com vencimento passado", () => {
    const status = statusEfetivo({ status: "paga", vencimento: "2026-01-10" }, hoje);
    expect(status).toBe("paga");
  });

  it("nao promove guia interna do escritorio a vencida", () => {
    expect(statusEfetivo({ status: "pendente", vencimento: "2026-01-10" }, hoje)).toBe("pendente");
    expect(statusEfetivo({ status: "emitida", vencimento: "2026-01-10" }, hoje)).toBe("emitida");
  });
});

describe("podePublicar", () => {
  it("recusa guia sem valor apurado", () => {
    expect(podePublicar({ valor: 0 })).toBe(false);
  });

  it("aceita guia com valor", () => {
    expect(podePublicar({ valor: 1250.5 })).toBe(true);
  });
});

describe("STATUS_VISIVEIS_CLIENTE", () => {
  it("nao expoe os status internos do escritorio", () => {
    expect(STATUS_VISIVEIS_CLIENTE).not.toContain("pendente");
    expect(STATUS_VISIVEIS_CLIENTE).not.toContain("emitida");
    expect(STATUS_VISIVEIS_CLIENTE).not.toContain("cancelada");
  });

  it("expoe o que o cliente precisa ver", () => {
    expect(STATUS_VISIVEIS_CLIENTE).toEqual(["disponivel", "paga", "vencida"]);
  });
});
