import type { Category } from "@/types/category";
import type { Transaction, TransactionType } from "@/types/transaction";

type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

export type TransactionPayload = {
  company_id: string;
  category_id?: string;
  type: TransactionType;
  description: string;
  amount: number;
  transaction_date: string;
  payment_method?: string;
  document_number?: string;
  notes?: string;
};

async function parseResult<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResult<T>;

  if (!response.ok || result.error) {
    throw new Error(result.error || "Erro inesperado.");
  }

  return result.data as T;
}

export async function listCategories(companyId: string) {
  const response = await fetch(`/api/categories?companyId=${companyId}`);
  return parseResult<Category[]>(response);
}

export async function createCategory(payload: {
  company_id: string;
  name: string;
  type: TransactionType;
}) {
  const response = await fetch("/api/categories", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Category>(response);
}

export async function listTransactions(filters: {
  companyId: string;
  startDate?: string;
  endDate?: string;
}) {
  const params = new URLSearchParams({ companyId: filters.companyId });

  if (filters.startDate) {
    params.set("startDate", filters.startDate);
  }

  if (filters.endDate) {
    params.set("endDate", filters.endDate);
  }

  const response = await fetch(`/api/transactions?${params.toString()}`);
  return parseResult<Transaction[]>(response);
}

export async function createTransaction(payload: TransactionPayload) {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  return parseResult<Transaction>(response);
}
