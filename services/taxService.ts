export type TaxRecord = {
  id: string;
  company_id: string;
  tax_name: string;
  tax_regime: string | null;
  period_start: string;
  period_end: string;
  revenue_amount: number;
  tax_rate: number;
  calculated_amount: number;
  due_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type TaxPayload = {
  company_id: string;
  tax_name?: string;
  tax_regime: "mei" | "simples";
  period_start: string;
  period_end: string;
  due_date?: string;
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

export async function listTaxes(companyId: string) {
  const response = await fetch(`/api/taxes?companyId=${companyId}`);
  return parseResult<TaxRecord[]>(response);
}

export async function createTaxCalculation(payload: TaxPayload) {
  const response = await fetch("/api/taxes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<TaxRecord & { rule?: string }>(response);
}
