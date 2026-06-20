"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { listarEmpresasTenant } from "@/services/empresaClientService";

/* ── Mock Data (fallback) ────────────────────────────────── */

const MOCK_KPIS = [
  { label: "Empresas ativas", value: "24", sub: "Carteira atual do escritório", color: "#065f46", bg: "#ecfdf5" },
  { label: "Empresas pendentes", value: "3", sub: "Aguardando documentação", color: "#92400e", bg: "#fffbeb", tag: "Atenção" },
  { label: "Obrigações hoje", value: "8", sub: "Entregas previstas para hoje", color: "#0e7490", bg: "#ecfeff" },
  { label: "Entregas no mês", value: "142", sub: "Obrigações concluídas em julho", color: "#065f46", bg: "#ecfdf5" },
  { label: "Tarefas atrasadas", value: "5", sub: "Pendências fora do prazo", color: "#b91c1c", bg: "#fef2f2", tag: "Urgente" },
  { label: "Certificados vencendo", value: "2", sub: "e-CNPJ / e-CPF próximos ao vencimento", color: "#92400e", bg: "#fffbeb", tag: "Atenção" },
];

const agendaItems = [
  { date: "05/07", empresa: "Tech Solutions Ltda", obrigacao: "Folha de pagamento" },
  { date: "10/07", empresa: "Comércio Alfa ME", obrigacao: "SPED Fiscal" },
  { date: "15/07", empresa: "Indústria Beta S.A.", obrigacao: "DCTF Web" },
  { date: "15/07", empresa: "Serviços Gama Ltda", obrigacao: "eSocial mensal" },
  { date: "20/07", empresa: "Restaurante Delta ME", obrigacao: "DAS Simples Nacional" },
];

const filaTrabalho = [
  { responsavel: "Ana Lima", empresa: "Tech Solutions Ltda", tarefa: "Fechamento contábil", status: "Em andamento" },
  { responsavel: "Carlos Silva", empresa: "Comércio Alfa ME", tarefa: "Apuração ICMS", status: "Pendente" },
  { responsavel: "Marcos Souza", empresa: "Indústria Beta S.A.", tarefa: "Folha de pagamento", status: "Em andamento" },
  { responsavel: "Maria Costa", empresa: "Serviços Gama Ltda", tarefa: "DCTF Web", status: "Concluído" },
  { responsavel: "Ana Lima", empresa: "Restaurante Delta ME", tarefa: "DAS - cálculo", status: "Pendente" },
];

const pendencias = [
  { tipo: "Documento", descricao: "Extratos bancários pendentes - Tech Solutions Ltda", urgencia: "alta" },
  { tipo: "Certificado", descricao: "e-CNPJ vencendo em 10 dias - Comércio Alfa ME", urgencia: "alta" },
  { tipo: "Documento", descricao: "Notas fiscais de entrada - Indústria Beta S.A.", urgencia: "media" },
  { tipo: "Contrato", descricao: "Renovação de contrato pendente - Serviços Gama Ltda", urgencia: "baixa" },
];

const calendarioEventos = [
  { periodo: "Hoje", items: [{ obrigacao: "Folha de pagamento", data: "05/07", qtd: 8 }] },
  { periodo: "Esta semana", items: [{ obrigacao: "SPED Fiscal", data: "10/07", qtd: 12 }] },
  {
    periodo: "Este mês",
    items: [
      { obrigacao: "DCTF Web", data: "15/07", qtd: 18 },
      { obrigacao: "eSocial", data: "15/07", qtd: 24 },
      { obrigacao: "DAS Simples", data: "20/07", qtd: 6 },
    ],
  },
];

const metricas = [
  { label: "Tempo médio de fechamento", value: "3.2 dias", icon: "⏱" },
  { label: "SLA cumprido", value: "94%", icon: "✓" },
  { label: "Taxa de retrabalho", value: "2.1%", icon: "↻" },
  { label: "Atrasos no mês", value: "3", icon: "!" },
  { label: "Empresas por colaborador", value: "6", icon: "◈" },
];

/* ── SVG Mini-Charts ──────────────────────────────────────── */

function ChartFiscal() {
  const bars = [
    { label: "Pendente", value: 12, color: "#f59e0b" },
    { label: "Andamento", value: 18, color: "#0e7490" },
    { label: "Concluído", value: 42, color: "#10b981" },
    { label: "Atrasado", value: 5, color: "#ef4444" },
  ];
  const maxVal = Math.max(...bars.map((b) => b.value));
  return (
    <svg viewBox="0 0 200 120" style={{ width: "100%", height: "auto" }}>
      <text x="100" y="14" textAnchor="middle" fontSize="10" fontWeight="700" fill="#065f46">
        Fiscal - Obrigações por Status
      </text>
      {bars.map((bar, i) => {
        const barH = (bar.value / maxVal) * 70;
        const x = 20 + i * 46;
        return (
          <g key={bar.label}>
            <rect x={x} y={100 - barH} width="30" height={barH} rx="4" fill={bar.color} />
            <text x={x + 15} y={112} textAnchor="middle" fontSize="7" fill="#374151">
              {bar.label}
            </text>
            <text x={x + 15} y={95 - barH} textAnchor="middle" fontSize="8" fontWeight="600" fill={bar.color}>
              {bar.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ChartContabil() {
  const meses = [
    { label: "Jan", value: 20 },
    { label: "Fev", value: 22 },
    { label: "Mar", value: 19 },
    { label: "Abr", value: 24 },
    { label: "Mai", value: 23 },
    { label: "Jun", value: 21 },
  ];
  const maxVal = Math.max(...meses.map((m) => m.value));
  return (
    <svg viewBox="0 0 200 120" style={{ width: "100%", height: "auto" }}>
      <text x="100" y="14" textAnchor="middle" fontSize="10" fontWeight="700" fill="#065f46">
        Contábil - Fechamentos
      </text>
      {meses.map((mes, i) => {
        const barH = (mes.value / maxVal) * 65;
        const x = 12 + i * 30;
        return (
          <g key={mes.label}>
            <rect x={x} y={100 - barH} width="22" height={barH} rx="3" fill="#34d399" />
            <text x={x + 11} y={112} textAnchor="middle" fontSize="7" fill="#374151">
              {mes.label}
            </text>
            <text x={x + 11} y={95 - barH} textAnchor="middle" fontSize="8" fontWeight="600" fill="#065f46">
              {mes.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ChartDP() {
  const meses = [
    { label: "Jan", value: 24 },
    { label: "Fev", value: 24 },
    { label: "Mar", value: 23 },
    { label: "Abr", value: 24 },
    { label: "Mai", value: 22 },
    { label: "Jun", value: 24 },
  ];
  const maxVal = Math.max(...meses.map((m) => m.value));
  return (
    <svg viewBox="0 0 200 120" style={{ width: "100%", height: "auto" }}>
      <text x="100" y="14" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0e7490">
        DP - Folhas Processadas
      </text>
      {meses.map((mes, i) => {
        const barH = (mes.value / maxVal) * 65;
        const x = 12 + i * 30;
        return (
          <g key={mes.label}>
            <rect x={x} y={100 - barH} width="22" height={barH} rx="3" fill="#67e8f9" />
            <text x={x + 11} y={112} textAnchor="middle" fontSize="7" fill="#374151">
              {mes.label}
            </text>
            <text x={x + 11} y={95 - barH} textAnchor="middle" fontSize="8" fontWeight="600" fill="#0e7490">
              {mes.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function ChartProdutividade() {
  const colaboradores = [
    { nome: "Ana Lima", value: 38 },
    { nome: "Carlos Silva", value: 32 },
    { nome: "Marcos Souza", value: 28 },
    { nome: "Maria Costa", value: 35 },
  ];
  const maxVal = Math.max(...colaboradores.map((c) => c.value));
  return (
    <svg viewBox="0 0 200 120" style={{ width: "100%", height: "auto" }}>
      <text x="100" y="14" textAnchor="middle" fontSize="10" fontWeight="700" fill="#7c3aed">
        Produtividade por Colaborador
      </text>
      {colaboradores.map((col, i) => {
        const barW = (col.value / maxVal) * 110;
        const y = 28 + i * 22;
        return (
          <g key={col.nome}>
            <text x="4" y={y + 12} fontSize="7" fill="#374151">
              {col.nome}
            </text>
            <rect x="70" y={y + 2} width={barW} height="14" rx="3" fill="#c4b5fd" />
            <text x={72 + barW} y={y + 13} fontSize="8" fontWeight="600" fill="#7c3aed">
              {col.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── Page Component ───────────────────────────────────────── */

export default function Dashboard() {
  const [empresasAtivas, setEmpresasAtivas] = useState<number | null>(null);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadEmpresas() {
      setLoadingEmpresas(true);
      try {
        const lista = await listarEmpresasTenant();
        if (!cancelled) {
          setEmpresasAtivas(lista.filter((e) => e.status === "ativa").length);
        }
      } catch {
        // Em caso de erro, mantém null e o mock será usado como fallback
        if (!cancelled) setEmpresasAtivas(null);
      } finally {
        if (!cancelled) setLoadingEmpresas(false);
      }
    }
    loadEmpresas();
    return () => { cancelled = true; };
  }, []);

  const kpis = MOCK_KPIS.map((kpi) => {
    if (kpi.label === "Empresas ativas") {
      return {
        ...kpi,
        value: loadingEmpresas ? "..." : (empresasAtivas !== null ? String(empresasAtivas) : kpi.value),
        sub: empresasAtivas !== null ? "Dados em tempo real" : kpi.sub,
      };
    }
    return kpi;
  });

  return (
    <AppShell>
      <div className="page-stack">
        {/* Hero Header */}
        <div className="module-hero">
          <div>
            <h1>Central Operacional</h1>
            <p>Painel de controle do escritório contábil</p>
          </div>
          <div className="hero-actions">
            <button onClick={() => window.location.reload()} type="button">
              Atualizar dados
            </button>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="kpi-strip" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px" }}>
          {kpis.map((kpi) => (
            <article
              className="metric-card"
              key={kpi.label}
              style={{ borderLeft: `4px solid ${kpi.color}`, background: kpi.bg }}
            >
              <span style={{ color: kpi.color, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {kpi.label}
              </span>
              <strong className="kpi-num" style={{ color: kpi.color }}>{kpi.value}</strong>
              <p>{kpi.sub}</p>
              {kpi.tag && (
                <span
                  style={{
                    display: "inline-block",
                    marginTop: "6px",
                    padding: "2px 10px",
                    borderRadius: "999px",
                    fontSize: "10px",
                    fontWeight: 700,
                    background: kpi.color === "#b91c1c" ? "#fecaca" : "#fde68a",
                    color: kpi.color,
                  }}
                >
                  {kpi.tag}
                </span>
              )}
            </article>
          ))}
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid" style={{ gridTemplateColumns: "1.4fr 1fr" }}>
          {/* Main Column */}
          <div className="dashboard-main">
            {/* Charts Grid */}
            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Gráficos por Setor</h2>
                  <p>Visão consolidada das áreas operacionais</p>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                  padding: "20px",
                }}
              >
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "#fafafa",
                  }}
                >
                  <ChartFiscal />
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "#fafafa",
                  }}
                >
                  <ChartContabil />
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "#fafafa",
                  }}
                >
                  <ChartDP />
                </div>
                <div
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "#fafafa",
                  }}
                >
                  <ChartProdutividade />
                </div>
              </div>
            </div>

            {/* Calendario / Painel Operacional */}
            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Painel Operacional / Calendário</h2>
                  <p>Próximas obrigações e prazos do escritório</p>
                </div>
              </div>
              <div style={{ padding: "20px", display: "grid", gap: "16px" }}>
                {calendarioEventos.map((grupo) => (
                  <div key={grupo.periodo}>
                    <h3
                      style={{
                        fontSize: "13px",
                        fontWeight: 700,
                        color: "#065f46",
                        textTransform: "uppercase",
                        letterSpacing: "0.5px",
                        marginBottom: "8px",
                        paddingBottom: "6px",
                        borderBottom: "2px solid #d1fae5",
                      }}
                    >
                      {grupo.periodo}
                    </h3>
                    {grupo.items.map((item) => (
                      <div
                        key={`${item.obrigacao}-${item.data}`}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "10px 14px",
                          marginBottom: "6px",
                          borderRadius: "8px",
                          background: "#f0fdf4",
                          border: "1px solid #bbf7d0",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: "36px",
                              height: "36px",
                              borderRadius: "8px",
                              background: "#065f46",
                              color: "#fff",
                              fontSize: "11px",
                              fontWeight: 700,
                            }}
                          >
                            {item.data.split("/")[0]}
                          </span>
                          <div>
                            <strong style={{ fontSize: "13px", color: "#111827" }}>{item.obrigacao}</strong>
                            <p style={{ fontSize: "11px", color: "#6b7280", margin: 0 }}>
                              Vencimento: {item.data}
                            </p>
                          </div>
                        </div>
                        <span
                          style={{
                            padding: "3px 10px",
                            borderRadius: "999px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: "#d1fae5",
                            color: "#065f46",
                          }}
                        >
                          {item.qtd} empresas
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Métricas do Escritório */}
            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Métricas do Escritório</h2>
                  <p>Indicadores de desempenho operacional</p>
                </div>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5, 1fr)",
                  gap: "12px",
                  padding: "20px",
                }}
              >
                {metricas.map((m) => (
                  <div
                    key={m.label}
                    style={{
                      textAlign: "center",
                      padding: "16px 10px",
                      borderRadius: "10px",
                      background: "#f9fafb",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    <div style={{ fontSize: "20px", marginBottom: "6px" }}>{m.icon}</div>
                    <strong style={{ fontSize: "20px", color: "#065f46", display: "block" }}>{m.value}</strong>
                    <span style={{ fontSize: "10px", color: "#6b7280", lineHeight: 1.3, display: "block", marginTop: "4px" }}>
                      {m.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="dashboard-side">
            {/* Agenda */}
            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Agenda</h2>
                  <p>Próximos 5 vencimentos</p>
                </div>
              </div>
              <div style={{ padding: "4px 0" }}>
                {agendaItems.map((item, i) => (
                  <div
                    key={`${item.empresa}-${item.obrigacao}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 18px",
                      borderBottom: i < agendaItems.length - 1 ? "1px solid #f3f4f6" : "none",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        minWidth: "44px",
                        height: "44px",
                        borderRadius: "10px",
                        background: "#ecfdf5",
                        color: "#065f46",
                        fontSize: "12px",
                        fontWeight: 800,
                      }}
                    >
                      {item.date}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <strong style={{ fontSize: "13px", color: "#111827", display: "block" }}>
                        {item.obrigacao}
                      </strong>
                      <span style={{ fontSize: "11px", color: "#6b7280" }}>{item.empresa}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Fila de Trabalho */}
            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Fila de Trabalho</h2>
                  <p>Tarefas em execução no escritório</p>
                </div>
              </div>
              <div style={{ padding: "4px 0" }}>
                {filaTrabalho.map((item, i) => {
                  const statusColor =
                    item.status === "Concluído"
                      ? { bg: "#d1fae5", color: "#065f46" }
                      : item.status === "Em andamento"
                        ? { bg: "#dbeafe", color: "#1e40af" }
                        : { bg: "#fef3c7", color: "#92400e" };
                  return (
                    <div
                      key={`${item.empresa}-${item.tarefa}`}
                      style={{
                        padding: "12px 18px",
                        borderBottom: i < filaTrabalho.length - 1 ? "1px solid #f3f4f6" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                        <strong style={{ fontSize: "13px", color: "#111827" }}>{item.tarefa}</strong>
                        <span
                          style={{
                            padding: "2px 8px",
                            borderRadius: "999px",
                            fontSize: "10px",
                            fontWeight: 700,
                            background: statusColor.bg,
                            color: statusColor.color,
                          }}
                        >
                          {item.status}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "11px", color: "#6b7280" }}>{item.responsavel}</span>
                        <span style={{ fontSize: "11px", color: "#d1d5db" }}>·</span>
                        <span style={{ fontSize: "11px", color: "#9ca3af" }}>{item.empresa}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pendências */}
            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Pendências</h2>
                  <p>Itens que necessitam atenção</p>
                </div>
              </div>
              <div style={{ padding: "4px 0" }}>
                {pendencias.map((item, i) => {
                  const urgenciaStyle =
                    item.urgencia === "alta"
                      ? { bg: "#fef2f2", border: "#fecaca", dot: "#ef4444" }
                      : item.urgencia === "media"
                        ? { bg: "#fffbeb", border: "#fde68a", dot: "#f59e0b" }
                        : { bg: "#f9fafb", border: "#e5e7eb", dot: "#9ca3af" };
                  return (
                    <div
                      key={item.descricao}
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "12px",
                        padding: "12px 18px",
                        borderBottom: i < pendencias.length - 1 ? "1px solid #f3f4f6" : "none",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          marginTop: "5px",
                          width: "8px",
                          height: "8px",
                          borderRadius: "50%",
                          background: urgenciaStyle.dot,
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "1px 8px",
                            borderRadius: "999px",
                            fontSize: "9px",
                            fontWeight: 700,
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            background: urgenciaStyle.bg,
                            border: `1px solid ${urgenciaStyle.border}`,
                            color: urgenciaStyle.dot,
                            marginBottom: "4px",
                          }}
                        >
                          {item.tipo}
                        </span>
                        <p style={{ fontSize: "12px", color: "#374151", margin: 0, lineHeight: 1.4 }}>
                          {item.descricao}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
