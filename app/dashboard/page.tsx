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

const currency = new Intl.NumberFormat("pt-BR", { currency: "BRL", style: "currency" });

const marketItems = [
  { change: "0,12%", direction: "down", label: "IR/BRL", value: "R$ 5,85" },
  { change: "0,27%", direction: "down", label: "GBP/BRL", value: "R$ 6,75" },
  { change: "1,35%", direction: "down", label: "BTC/BRL", value: "R$ 380.940" },
  { change: "0,00%", direction: "neutral", label: "SELIC", value: "a.a." },
  { change: "0,01%", direction: "up", label: "USD/BRL", value: "R$ 5,00" },
  { change: "0,12%", direction: "down", label: "EUR/BRL", value: "R$ 5,85" },
];

const notices = [
  {
    badge: "Urgente",
    description: "Revisar documentos pendentes e confirmar clientes obrigados.",
    title: "IRPF 2026",
  },
  {
    badge: "Informativo",
    description: "Fluxo multiempresa, auditoria e convites seguros ativos no sistema.",
    title: "Bem-vindo ao Burgarelli C.O",
  },
];

const tasks = [
  { detail: "Conferir novas empresas sem plano ativo", title: "Validar assinaturas" },
  { detail: "Revisar permissões de usuários convidados", title: "Auditoria de acessos" },
  { detail: "Acompanhar vencimentos fiscais da semana", title: "Rotina fiscal" },
];

const news = [
  "Receita Federal atualiza regras para entrega do SPED Contábil 2026",
  "Novas alíquotas do IRPJ para empresas do Lucro Presumido em 2026",
  "eSocial: novas obrigações acessórias ampliam escopo a partir de abril",
  "Simples Nacional: mudanças que impactam MEIs e microempresas",
  "Prazo da DCTF Web prorrogado pela Receita Federal",
];

function getCurrentMonthData(monthly: MonthlyDashboardItem[]) {
  const now = new Date();
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return monthly.find((m) => m.month === key) ?? { expense: 0, income: 0, month: key };
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary>({ balance: 0, expense: 0, income: 0 });
  const [monthly, setMonthly] = useState<MonthlyDashboardItem[]>([]);
  const [clientesAtivos, setClientesAtivos] = useState(0);
  const [obrigacoesHoje, setObrigacoesHoje] = useState(0);
  const [tarefasAtrasadas, setTarefasAtrasadas] = useState(0);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const companyId = getActiveCompanyId();
    setActiveCompanyId(companyId);

    if (!companyId) return;

    getDashboardData(companyId)
      .then((data) => {
        setSummary(data.summary);
        setMonthly(data.monthly);
        setClientesAtivos(data.clientesAtivos ?? 0);
        setObrigacoesHoje(data.obrigacoesHoje ?? 0);
        setTarefasAtrasadas(data.tarefasAtrasadas ?? 0);
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

  const mesAtual = getCurrentMonthData(monthly);
  const resultadoMes = mesAtual.income - mesAtual.expense;
  const ticketMedio = clientesAtivos > 0 ? mesAtual.income / clientesAtivos : 0;
  const nomeMes = new Date().toLocaleString("pt-BR", { month: "long" });

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Dashboard</h1>
            <p>Visão geral do escritório: clientes, obrigações e indicadores financeiros.</p>
          </div>
          <div className="hero-actions">
            <button onClick={() => window.location.reload()} type="button">Atualizar dados</button>
            <button className="small-action" onClick={() => { window.location.href = "/auditoria"; }} type="button">
              Ver auditoria
            </button>
          </div>
        </div>

        {error ? <p className="error-alert">{error}</p> : null}

        <div className="market-ticker">
          <div className="ticker-item">
            <span>Ao vivo</span>
          </div>
          {marketItems.map((item) => (
            <div className="ticker-item" key={item.label}>
              <span>{item.label}</span>
              <strong>{item.value}</strong>
              <em className={item.direction === "up" ? "ticker-up" : "ticker-down"}>{item.change}</em>
            </div>
          ))}
        </div>

        <div className="kpi-strip">
          <article className="metric-card">
            <span>Clientes Ativos</span>
            <strong className="kpi-num">{clientesAtivos}</strong>
            <p>Empresas cadastradas no escritório</p>
          </article>

          <article className="metric-card kpi-warning">
            <span>Obrigações Vencendo Hoje</span>
            <strong className="kpi-num">{obrigacoesHoje}</strong>
            <p>{obrigacoesHoje === 0 ? "Nenhuma obrigação vencendo hoje" : "Requerem atenção imediata"}</p>
            {obrigacoesHoje > 0 && <span className="kpi-tag kpi-tag-warning">Atenção necessária</span>}
          </article>

          <article className="metric-card kpi-danger">
            <span>Tarefas Atrasadas</span>
            <strong className="kpi-num">{tarefasAtrasadas}</strong>
            <p>{tarefasAtrasadas === 0 ? "Sem atrasos pendentes" : "Tarefas em atraso"}</p>
            {tarefasAtrasadas > 0 && <span className="kpi-tag kpi-tag-danger">Requer atenção</span>}
          </article>

          <article className="metric-card kpi-info">
            <span>Receita em {nomeMes}</span>
            <strong className="kpi-currency">{currency.format(mesAtual.income)}</strong>
            <p>Entradas registradas no mês corrente</p>
          </article>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-main">
            <FinancialSummary summary={summary} />

            <section className="office-financials">
              <div className="office-financials-header">
                <div>
                  <h2>Indicadores Financeiros do Escritório</h2>
                  <p>Desempenho consolidado do mês de {nomeMes}</p>
                </div>
              </div>
              <div className="office-kpi-grid">
                <article className="office-kpi-card">
                  <span>Receita do Mês</span>
                  <strong>{currency.format(mesAtual.income)}</strong>
                  <p>Entradas no mês corrente</p>
                </article>
                <article className="office-kpi-card">
                  <span>Despesas do Mês</span>
                  <strong className="value-negative">{currency.format(mesAtual.expense)}</strong>
                  <p>Saídas no mês corrente</p>
                </article>
                <article className="office-kpi-card">
                  <span>Resultado do Mês</span>
                  <strong className={resultadoMes >= 0 ? "value-positive" : "value-negative"}>
                    {currency.format(resultadoMes)}
                  </strong>
                  <p>Receita menos despesas</p>
                </article>
                <article className="office-kpi-card">
                  <span>Ticket Médio</span>
                  <strong>{currency.format(ticketMedio)}</strong>
                  <p>Receita média por cliente</p>
                </article>
              </div>
            </section>

            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Avisos e anúncios</h2>
                  <p>Comunicados internos e rotinas críticas</p>
                </div>
                <button className="small-action" type="button">Ver todos</button>
              </div>
              <div className="task-list">
                {notices.map((notice) => (
                  <article className="task-item" key={notice.title}>
                    <span className="priority-badge">{notice.badge}</span>
                    <strong>{notice.title}</strong>
                    <p>{notice.description}</p>
                  </article>
                ))}
              </div>
            </div>

            <MonthlyChart data={monthly} />
          </div>

          <aside className="dashboard-side">
            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Notícias contábeis</h2>
                  <p>Leis, mudanças e atualizações fiscais</p>
                </div>
              </div>
              <div className="news-list">
                {news.map((item, index) => (
                  <article className="news-item" key={item}>
                    <strong>{String(index + 1).padStart(2, "0")} · {item}</strong>
                    <p>Atualização para acompanhamento preventivo</p>
                  </article>
                ))}
              </div>
            </div>

            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Tarefas pendentes</h2>
                  <p>Operação da empresa ativa</p>
                </div>
              </div>
              <div className="task-list">
                {tasks.map((task) => (
                  <article className="task-item" key={task.title}>
                    <strong>{task.title}</strong>
                    <p>{task.detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
