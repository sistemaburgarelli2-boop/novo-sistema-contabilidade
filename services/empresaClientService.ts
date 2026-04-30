import type { CriarEmpresaInput, Empresa } from "@/modules/empresas/empresas.types";
import type { RoleEmpresa, UsuarioEmpresa } from "@/modules/usuarios/usuarios.types";

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

export async function listarEmpresasTenant() {
  const response = await fetch("/api/empresas");
  return parseResult<Empresa[]>(response);
}

export async function criarEmpresaTenant(payload: CriarEmpresaInput) {
  const response = await fetch("/api/empresas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Empresa>(response);
}

export async function listarRolesEmpresa(empresaId: string) {
  const response = await fetch(`/api/empresas/${empresaId}/roles`);
  return parseResult<RoleEmpresa[]>(response);
}

export async function listarUsuariosEmpresa(empresaId: string) {
  const response = await fetch(`/api/empresas/${empresaId}/usuarios`);
  return parseResult<UsuarioEmpresa[]>(response);
}

export async function vincularUsuarioEmpresa(empresaId: string, payload: { email: string; role_id: string }) {
  const response = await fetch(`/api/empresas/${empresaId}/usuarios`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<UsuarioEmpresa>(response);
}

export function getEmpresaAtivaId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("empresaAtivaId");
}

export function setEmpresaAtivaId(empresaId: string) {
  window.localStorage.setItem("empresaAtivaId", empresaId);
  window.localStorage.setItem("activeCompanyId", empresaId);
}
