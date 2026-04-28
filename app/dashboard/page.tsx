"use client";

import { useEffect, useState } from "react";
import { FinancialSummary } from "@/components/dashboard/FinancialSummary";
import { MonthlyChart } from "@/components/dashboard/MonthlyChart";
import { AppShell } from "@/components/layout/AppShell";
import { getActiveCompanyId } from "@/services/companyService";
import {
  getDashboardData,
  type DashboardSummary,
  type MonthlyDashboardItem,
} from "@/services/dashboardService";

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary>({
    balance: 0,
    expense: 0,
    income: 0,
  });
  const [monthly, setMonthly] = useState<MonthlyDashboardItem[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const companyId = getActiveCompanyId();
    setActiveCompanyId(companyId);

    if (!companyId) {
      return;
    }

    getDashboardData(companyId)
      .then((data) => {
        setSummary(data.summary);
        setMonthly(data.monthly);
      })
      .catch((currentError) => {
        setError(currentError instanceof Error ? currentError.message : "Erro ao carregar dashboard.");
      });
  }, []);

  if (!activeCompanyId) {
    return (
      <AppShell>
        <h1>Dashboard</h1>
        <p>Selecione uma empresa ativa no modulo Empresas para visualizar os indicadores.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 24 }}>
        <header>
          <h1>Dashboard</h1>
          <p>Resumo financeiro da empresa ativa.</p>
        </header>

        {error ? <p>{error}</p> : null}

        <FinancialSummary summary={summary} />
        <MonthlyChart data={monthly} />
      </div>
    </AppShell>
  );
}
