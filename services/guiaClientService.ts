import type { AtualizarGuiaInput, CriarGuiaInput, Guia } from "@/modules/guias/guias.types";

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

/** Lista as guias do escritorio (todos os status). */
export async function listarGuias(empresaId: string) {
  const response = await fetch(`/api/guias/${empresaId}`);
  return parseResult<Guia[]>(response);
}

/** Lista apenas as guias ja publicadas para o cliente. */
export async function listarGuiasCliente(empresaId: string) {
  const response = await fetch(`/api/guias/${empresaId}?escopo=cliente`);
  return parseResult<Guia[]>(response);
}

export async function criarGuia(empresaId: string, payload: CriarGuiaInput) {
  const response = await fetch(`/api/guias/${empresaId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Guia>(response);
}

export async function atualizarGuia(empresaId: string, guiaId: string, payload: AtualizarGuiaInput) {
  const response = await fetch(`/api/guias/${empresaId}/${guiaId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Guia>(response);
}

export async function anexarArquivoGuia(empresaId: string, guiaId: string, arquivo: File) {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  const response = await fetch(`/api/guias/${empresaId}/${guiaId}`, {
    method: "POST",
    body: formData,
  });

  return parseResult<Guia>(response);
}

export async function excluirGuia(empresaId: string, guiaId: string) {
  const response = await fetch(`/api/guias/${empresaId}/${guiaId}`, { method: "DELETE" });
  return parseResult<{ id: string }>(response);
}
