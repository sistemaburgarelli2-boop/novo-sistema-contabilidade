import type { Assinatura, Plano } from "@/modules/billing/billing.types";

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

export async function listarPlanosBilling() {
  const response = await fetch("/api/billing/planos");
  return parseResult<Plano[]>(response);
}

export async function buscarAssinaturaBilling(empresaId: string) {
  const response = await fetch(`/api/billing/assinatura/${empresaId}`);
  return parseResult<Assinatura & { planos: Plano }>(response);
}
