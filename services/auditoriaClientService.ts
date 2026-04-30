import type { AuditLog } from "@/modules/auditoria/auditoria.types";

type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

export async function listarAuditoriaEmpresa(empresaId: string) {
  const response = await fetch(`/api/auditoria/${empresaId}`);
  const result = (await response.json()) as ApiResult<AuditLog[]>;

  if (!response.ok || result.error) {
    throw new Error(result.error || "Erro ao carregar auditoria.");
  }

  return result.data as AuditLog[];
}
