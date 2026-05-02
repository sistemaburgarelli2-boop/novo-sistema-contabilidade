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
        <div className="empty-state">
          <h1>Dashboard</h1>
          <p>Selecione uma empresa ativa no módulo Empresas para visualizar os indicadores.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Dashboard</h1>
            <p>Resumo financeiro, saldo atual e evolução mensal da empresa ativa.</p>
          </div>
        </div>

        {error ? <p className="error-alert">{error}</p> : null}

        <FinancialSummary summary={summary} />
        <MonthlyChart data={monthly} />
      </div>
    </AppShell>
  );
}
