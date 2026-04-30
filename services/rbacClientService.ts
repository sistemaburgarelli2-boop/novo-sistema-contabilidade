import type { CriarRoleInput, Permissao, RoleComPermissoes } from "@/modules/rbac/rbac.types";

type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

async function parseResult<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResult<T>;

  if (!response.ok || result.error) {
    throw new Error(result.error || "Erro inesperado.");
  }

  return result.data as T;
}

export async function listarPermissoesRbac() {
  const response = await fetch("/api/rbac/permissoes");
  return parseResult<Permissao[]>(response);
}

export async function listarRolesRbac(empresaId: string) {
  const response = await fetch(`/api/empresas/${empresaId}/rbac/roles`);
  return parseResult<RoleComPermissoes[]>(response);
}

export async function criarRoleRbac(empresaId: string, payload: Omit<CriarRoleInput, "empresa_id">) {
  const response = await fetch(`/api/empresas/${empresaId}/rbac/roles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<RoleComPermissoes>(response);
}

export async function atualizarPermissoesRoleRbac(
  empresaId: string,
  roleId: string,
  permissaoIds: string[]
) {
  const response = await fetch(`/api/empresas/${empresaId}/rbac/roles/${roleId}/permissoes`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissao_ids: permissaoIds }),
  });

  return parseResult<{ updated: boolean }>(response);
}
