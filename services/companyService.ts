import type { Company } from "@/types/company";

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

export async function listCompanies() {
  const response = await fetch("/api/companies");
  return parseResult<Company[]>(response);
}

export async function createCompany(payload: CompanyPayload) {
  const response = await fetch("/api/companies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Company>(response);
}

export async function updateCompany(companyId: string, payload: CompanyPayload) {
  const response = await fetch(`/api/companies/${companyId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Company>(response);
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
