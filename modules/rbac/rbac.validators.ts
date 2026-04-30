import type { AtualizarPermissoesRoleInput, CriarRoleInput } from "@/modules/rbac/rbac.types";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function validarCriarRole(payload: unknown): CriarRoleInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload invalido.");
  }

  const data = payload as Record<string, unknown>;
  const empresaId = clean(data.empresa_id);
  const nome = clean(data.nome);
  const chave = clean(data.chave).toLowerCase();
  const descricao = clean(data.descricao);

  if (!empresaId) {
    throw new Error("Empresa obrigatoria.");
  }

  if (!nome || nome.length < 2) {
    throw new Error("Nome da role obrigatorio.");
  }

  if (!chave || !/^[a-z0-9_.-]+$/.test(chave)) {
    throw new Error("Chave da role invalida.");
  }

  return {
    chave,
    descricao: descricao || undefined,
    empresa_id: empresaId,
    nome,
  };
}

export function validarAtualizarPermissoes(payload: unknown): AtualizarPermissoesRoleInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload invalido.");
  }

  const data = payload as Record<string, unknown>;
  const permissaoIds = Array.isArray(data.permissao_ids)
    ? data.permissao_ids.filter((id): id is string => typeof id === "string" && id.length > 0)
    : [];

  return {
    permissao_ids: Array.from(new Set(permissaoIds)),
  };
}
