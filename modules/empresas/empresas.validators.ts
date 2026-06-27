import type { AtualizarEmpresaInput, CriarEmpresaInput } from "@/modules/empresas/empresas.types";
import { sanitizeText } from "@/lib/sanitize";

function cleanString(value: unknown) {
  return typeof value === "string" ? sanitizeText(value) : undefined;
}

export function validarCriarEmpresa(payload: unknown): CriarEmpresaInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload invalido.");
  }

  const data = payload as Record<string, unknown>;
  const nomeLegal = cleanString(data.nome_legal);

  if (!nomeLegal || nomeLegal.length < 2) {
    throw new Error("Nome legal da empresa e obrigatorio.");
  }

  const subdominio = cleanString(data.subdominio)?.toLowerCase();

  if (subdominio && !/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(subdominio)) {
    throw new Error("Subdominio invalido.");
  }

  return {
    nome_legal: nomeLegal,
    nome_fantasia: cleanString(data.nome_fantasia),
    cnpj: cleanString(data.cnpj),
    regime_tributario: cleanString(data.regime_tributario),
    subdominio,
    cidade: cleanString(data.cidade),
    estado: cleanString(data.estado)?.toUpperCase(),
  };
}

export function validarAtualizarEmpresa(payload: unknown): AtualizarEmpresaInput {
  const data = validarCriarEmpresa({
    ...(payload as Record<string, unknown>),
    nome_legal: (payload as Record<string, unknown>)?.nome_legal || "Empresa",
  });
  const raw = payload as Record<string, unknown>;
  const status = cleanString(raw.status);

  const metadata = raw.metadata && typeof raw.metadata === "object" ? raw.metadata as Record<string, unknown> : undefined;

  return {
    ...data,
    nome_legal: cleanString(raw.nome_legal),
    status:
      status === "ativa" || status === "suspensa" || status === "cancelada" || status === "encerrada"
        ? status
        : undefined,
    metadata,
  };
}
