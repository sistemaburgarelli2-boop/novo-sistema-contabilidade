import type {
  Certificado,
  CertificadoHistorico,
  CertificadoRenovacao,
  CriarCertificadoInput,
  CriarRenovacaoInput,
} from "@/modules/certificados/certificados.types";

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

// ── Certificados ──────────────────────────────────────────────

export async function listarCertificados() {
  const response = await fetch("/api/certificados");
  return parseResult<Certificado[]>(response);
}

export async function buscarCertificado(id: string) {
  const response = await fetch(`/api/certificados/${id}`);
  return parseResult<Certificado>(response);
}

export async function criarCertificado(payload: CriarCertificadoInput) {
  const response = await fetch("/api/certificados", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Certificado>(response);
}

export async function atualizarCertificado(id: string, payload: Partial<CriarCertificadoInput>) {
  const response = await fetch(`/api/certificados/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Certificado>(response);
}

export async function excluirCertificado(id: string) {
  const response = await fetch(`/api/certificados/${id}`, { method: "DELETE" });
  return parseResult<{ deleted: boolean }>(response);
}

// ── Renovacoes ────────────────────────────────────────────────

export async function listarRenovacoes() {
  const response = await fetch("/api/certificados/renovacoes");
  return parseResult<CertificadoRenovacao[]>(response);
}

export async function criarRenovacao(payload: CriarRenovacaoInput) {
  const response = await fetch("/api/certificados/renovacoes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<CertificadoRenovacao>(response);
}

// ── Historico ─────────────────────────────────────────────────

export async function listarHistoricoCertificados(certificadoId?: string) {
  const params = certificadoId ? `?certificado_id=${certificadoId}` : "";
  const response = await fetch(`/api/certificados/historico${params}`);
  return parseResult<CertificadoHistorico[]>(response);
}
