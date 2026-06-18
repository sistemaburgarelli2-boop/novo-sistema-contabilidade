export type DashboardSummary = {
  income: number;
  expense: number;
  balance: number;
};

export type MonthlyDashboardItem = {
  month: string;
  income: number;
  expense: number;
};

type DashboardData = {
  summary: DashboardSummary;
  monthly: MonthlyDashboardItem[];
  clientesAtivos: number;
  obrigacoesHoje: number;
  tarefasAtrasadas: number;
};

type ApiResult<T> = {
  data: T | null;
  error: string | null;
};

export async function getDashboardData(companyId: string) {
  const response = await fetch(`/api/dashboard?companyId=${companyId}`);
  const result = (await response.json()) as ApiResult<DashboardData>;

  if (!response.ok || result.error) {
    throw new Error(result.error || "Erro ao carregar dashboard.");
  }

  return result.data as DashboardData;
}
