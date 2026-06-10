import type { Company } from "@/types/company";
import type { Empresa } from "@/modules/empresas/empresas.types";

export type CompanyPayload = {
  legal_name: string;
  trade_name?: string;
  cnpj?: string;
  tax_regime?: string;
  main_cnae?: string;
  city?: string;
  state?: string;
  lifecycle_stage?: string;
  status?: string;
};

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

function empresaToCompany(e: Empresa): Company {
  return {
    id: e.id,
    owner_id: "",
    legal_name: e.nome_legal,
    trade_name: e.nome_fantasia ?? null,
    cnpj: e.cnpj ?? null,
    city: e.cidade ?? null,
    state: e.estado ?? null,
    main_cnae: null,
    status: e.status,
    tax_regime: e.regime_tributario ?? null,
    lifecycle_stage: "active",
    created_at: e.created_at,
    updated_at: e.updated_at,
  };
}

function payloadToEmpresaInput(payload: CompanyPayload) {
  return {
    nome_legal: payload.legal_name,
    nome_fantasia: payload.trade_name,
    cnpj: payload.cnpj,
    regime_tributario: payload.tax_regime,
    cidade: payload.city,
    estado: payload.state,
  };
}

export async function listCompanies() {
  const response = await fetch("/api/empresas");
  const empresas = await parseResult<Empresa[]>(response);
  return empresas.map(empresaToCompany);
}

export async function createCompany(payload: CompanyPayload) {
  const response = await fetch("/api/empresas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payloadToEmpresaInput(payload)),
  });
  const empresa = await parseResult<Empresa>(response);
  return empresaToCompany(empresa);
}

export async function updateCompany(companyId: string, payload: CompanyPayload) {
  const response = await fetch(`/api/empresas/${companyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payloadToEmpresaInput(payload)),
  });
  const empresa = await parseResult<Empresa>(response);
  return empresaToCompany(empresa);
}

export function getActiveCompanyId() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem("activeCompanyId");
}

export function setActiveCompanyId(companyId: string) {
  window.localStorage.setItem("activeCompanyId", companyId);
}
