"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type Tab = "dashboard" | "diagnosticos" | "tributario" | "simulacoes" | "viabilidade" | "apresentacoes" | "historico";

type StatusEstudo = "Novo" | "Em andamento" | "Aguardando" | "Concluído" | "Convertido" | "Cancelado";
type Etapa = "Diagnóstico" | "Planejamento" | "Simulação" | "Viabilidade" | "Plano" | "Apresentação" | "Aprovação";
type Atividade = "Comércio" | "Serviços" | "Indústria";

type Estudo = {
  cliente: string;
  objetivo: string;
  etapa: Etapa;
  status: StatusEstudo;
  responsavel: string;
  data: string;
};

type Diagnostico = {
  cliente: string;
  objetivo: string;
  complexidade: number;
  risco: number;
  potencial: number;
  faturamento: string;
  custos: string;
  funcionarios: number;
  regiao: string;
};

type Apresentacao = {
  cliente: string;
  objetivo: string;
  data: string;
  status: "Rascunho" | "Gerada" | "Enviada" | "Aprovada";
  paginas: number;
};

type HistoricoItem = {
  dataHora: string;
  usuario: string;
  acao: string;
  estudo: string;
  detalhe: string;
};

/* ─── Estilos de status / etapa ──────────────────────────────── */

const S_STATUS: Record<StatusEstudo, { bg: string; color: string }> = {
  Novo:           { bg: "#f3f4f6", color: "#6b7280" },
  "Em andamento": { bg: "#eff6ff", color: "#1e40af" },
  Aguardando:     { bg: "#fffbeb", color: "#92400e" },
  "Concluído":    { bg: "#f0fdf4", color: "#065f46" },
  Convertido:     { bg: "#f5f3ff", color: "#7c3aed" },
  Cancelado:      { bg: "#fef2f2", color: "#b91c1c" },
};

const S_ETAPA: Record<Etapa, { bg: string; color: string }> = {
  "Diagnóstico":   { bg: "#fef3c7", color: "#92400e" },
  Planejamento:    { bg: "#dbeafe", color: "#1e40af" },
  "Simulação":     { bg: "#e0e7ff", color: "#4338ca" },
  Viabilidade:     { bg: "#d1fae5", color: "#065f46" },
  Plano:           { bg: "#fce7f3", color: "#9d174d" },
  "Apresentação":  { bg: "#ede9fe", color: "#6b21a8" },
  "Aprovação":     { bg: "#ccfbf1", color: "#0e7490" },
};

const S_APRESENTACAO: Record<string, { bg: string; color: string }> = {
  Rascunho: { bg: "#f3f4f6", color: "#6b7280" },
  Gerada:   { bg: "#dbeafe", color: "#1e40af" },
  Enviada:  { bg: "#fffbeb", color: "#92400e" },
  Aprovada: { bg: "#f0fdf4", color: "#065f46" },
};

/* ─── Dados mock ─────────────────────────────────────────────── */

const ESTUDOS: Estudo[] = [
  { cliente: "Maria Silva",       objetivo: "Abrir empresa",        etapa: "Planejamento",   status: "Em andamento", responsavel: "Ana Lima",      data: "18/06" },
  { cliente: "João Santos",       objetivo: "Reduzir impostos",     etapa: "Simulação",      status: "Em andamento", responsavel: "Carlos Silva",  data: "17/06" },
  { cliente: "Pedro Costa",       objetivo: "Migrar regime",        etapa: "Aprovação",      status: "Aguardando",   responsavel: "Ana Lima",      data: "15/06" },
  { cliente: "Lucia Ferreira",    objetivo: "Abrir empresa",        etapa: "Apresentação",   status: "Concluído",    responsavel: "Carlos Silva",  data: "14/06" },
  { cliente: "Roberto Lima",      objetivo: "Planejar crescimento", etapa: "Diagnóstico",    status: "Em andamento", responsavel: "Marcos Souza",  data: "19/06" },
  { cliente: "Camila Torres",     objetivo: "Abrir sociedade",      etapa: "Viabilidade",    status: "Em andamento", responsavel: "Ana Lima",      data: "16/06" },
  { cliente: "Bruno Neves",       objetivo: "Formalizar operação",  etapa: "Plano",          status: "Concluído",    responsavel: "Carlos Silva",  data: "12/06" },
  { cliente: "Sandra Lopes",      objetivo: "Mudança CNAE",         etapa: "Diagnóstico",    status: "Novo",         responsavel: "Marcos Souza",  data: "20/06" },
];

const DIAGNOSTICOS: Diagnostico[] = [
  { cliente: "Roberto Lima",    objetivo: "Planejar crescimento", complexidade: 7,  risco: 4, potencial: 9,  faturamento: "R$ 480.000/ano",  custos: "R$ 320.000/ano",  funcionarios: 8,  regiao: "São Paulo - SP" },
  { cliente: "Sandra Lopes",    objetivo: "Mudança CNAE",         complexidade: 5,  risco: 6, potencial: 7,  faturamento: "R$ 200.000/ano",  custos: "R$ 140.000/ano",  funcionarios: 3,  regiao: "Campinas - SP" },
  { cliente: "Maria Silva",     objetivo: "Abrir empresa",        complexidade: 3,  risco: 2, potencial: 8,  faturamento: "R$ 360.000/ano",  custos: "R$ 180.000/ano",  funcionarios: 2,  regiao: "São Paulo - SP" },
  { cliente: "Camila Torres",   objetivo: "Abrir sociedade",      complexidade: 6,  risco: 5, potencial: 8,  faturamento: "R$ 600.000/ano",  custos: "R$ 400.000/ano",  funcionarios: 5,  regiao: "Guarulhos - SP" },
];

const APRESENTACOES: Apresentacao[] = [
  { cliente: "Lucia Ferreira",  objetivo: "Abrir empresa",        data: "14/06/2026", status: "Aprovada",  paginas: 12 },
  { cliente: "João Santos",     objetivo: "Reduzir impostos",     data: "17/06/2026", status: "Gerada",    paginas: 10 },
  { cliente: "Pedro Costa",     objetivo: "Migrar regime",        data: "15/06/2026", status: "Enviada",   paginas: 8 },
  { cliente: "Bruno Neves",     objetivo: "Formalizar operação",  data: "12/06/2026", status: "Rascunho",  paginas: 6 },
];

const HISTORICO_DATA: HistoricoItem[] = [
  { dataHora: "20/06/2026 14:30", usuario: "Marcos Souza",  acao: "Criou estudo",              estudo: "Sandra Lopes — Mudança CNAE",       detalhe: "Diagnóstico inicial" },
  { dataHora: "19/06/2026 16:45", usuario: "Marcos Souza",  acao: "Iniciou diagnóstico",       estudo: "Roberto Lima — Crescimento",        detalhe: "Coleta de dados financeiros" },
  { dataHora: "18/06/2026 11:20", usuario: "Ana Lima",      acao: "Avançou etapa",             estudo: "Maria Silva — Abrir empresa",       detalhe: "Diagnóstico → Planejamento" },
  { dataHora: "17/06/2026 15:00", usuario: "Carlos Silva",  acao: "Gerou simulação",           estudo: "João Santos — Reduzir impostos",    detalhe: "4 regimes comparados" },
  { dataHora: "16/06/2026 10:30", usuario: "Ana Lima",      acao: "Iniciou viabilidade",       estudo: "Camila Torres — Abrir sociedade",   detalhe: "Análise CNAE e endereço" },
  { dataHora: "15/06/2026 14:15", usuario: "Ana Lima",      acao: "Enviou para aprovação",     estudo: "Pedro Costa — Migrar regime",       detalhe: "Apresentação anexada" },
  { dataHora: "14/06/2026 17:30", usuario: "Carlos Silva",  acao: "Gerou apresentação",        estudo: "Lucia Ferreira — Abrir empresa",    detalhe: "12 páginas — PDF gerado" },
  { dataHora: "14/06/2026 09:00", usuario: "Carlos Silva",  acao: "Aprovou apresentação",      estudo: "Lucia Ferreira — Abrir empresa",    detalhe: "Cliente confirmou por e-mail" },
  { dataHora: "13/06/2026 16:00", usuario: "Carlos Silva",  acao: "Finalizou plano",           estudo: "Bruno Neves — Formalizar operação", detalhe: "Plano de ação completo" },
  { dataHora: "12/06/2026 11:45", usuario: "Carlos Silva",  acao: "Criou estudo",              estudo: "Bruno Neves — Formalizar operação", detalhe: "Solicitação via portal" },
  { dataHora: "11/06/2026 10:00", usuario: "Sistema",       acao: "Lembrete automático",       estudo: "Pedro Costa — Migrar regime",       detalhe: "Prazo de aprovação em 5 dias" },
  { dataHora: "10/06/2026 14:20", usuario: "Ana Lima",      acao: "Atualizou dados",           estudo: "Maria Silva — Abrir empresa",       detalhe: "Faturamento estimado revisado" },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: "0.73rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        padding: "10px 14px",
        textAlign: right ? "right" : "left",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {children}
    </th>
  );
}

function TD({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <td
      style={{
        padding: "10px 14px",
        fontSize: "0.85rem",
        borderBottom: "1px solid #f1f5f9",
        textAlign: right ? "right" : "left",
      }}
    >
      {children}
    </td>
  );
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#0f172a" }}>{value}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: 2 }}>{sub}</div>}
    </Card>
  );
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 6, background: "#e2e8f0", borderRadius: 3 }}>
        <div style={{ width: `${(value / max) * 100}%`, height: "100%", background: color, borderRadius: 3 }} />
      </div>
      <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#475569", minWidth: 18 }}>{value}</span>
    </div>
  );
}

function SmallBtn({ children, onClick, primary }: { children: React.ReactNode; onClick?: () => void; primary?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px",
        fontSize: "0.78rem",
        fontWeight: 600,
        borderRadius: 6,
        border: primary ? "none" : "1px solid #e2e8f0",
        background: primary ? "#0f172a" : "#fff",
        color: primary ? "#fff" : "#334155",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ─── Tabs config ────────────────────────────────────────────── */

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard",      label: "Dashboard" },
  { key: "diagnosticos",   label: "Diagnósticos" },
  { key: "tributario",     label: "Planejamento Tributário" },
  { key: "simulacoes",     label: "Simulações" },
  { key: "viabilidade",    label: "Viabilidade" },
  { key: "apresentacoes",  label: "Apresentações" },
  { key: "historico",      label: "Histórico" },
];

/* ─── Tab: Dashboard ─────────────────────────────────────────── */

function TabDashboard() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 16 }}>
        <KpiCard label="Estudos ativos" value={8} sub="em andamento" />
        <KpiCard label="Em aprovação" value={3} sub="aguardando cliente" />
        <KpiCard label="Convertidos (mês)" value={5} sub="jun/2026" />
        <KpiCard label="Receita estimada" value="R$ 45.200" sub="consultoria + implantação" />
        <KpiCard label="Prazo médio" value="12 dias" sub="diagnóstico → entrega" />
      </div>

      <Card style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 14px" }}>Estudos em andamento</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Cliente</TH>
                <TH>Objetivo</TH>
                <TH>Etapa</TH>
                <TH>Status</TH>
                <TH>Responsável</TH>
                <TH>Data</TH>
              </tr>
            </thead>
            <tbody>
              {ESTUDOS.map((e, i) => (
                <tr key={i} style={{ cursor: "pointer" }}>
                  <TD><strong>{e.cliente}</strong></TD>
                  <TD>{e.objetivo}</TD>
                  <TD><Badge bg={S_ETAPA[e.etapa].bg} color={S_ETAPA[e.etapa].color} label={e.etapa} /></TD>
                  <TD><Badge bg={S_STATUS[e.status].bg} color={S_STATUS[e.status].color} label={e.status} /></TD>
                  <TD>{e.responsavel}</TD>
                  <TD>{e.data}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* ─── Tab: Diagnósticos ──────────────────────────────────────── */

function TabDiagnosticos() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
      {DIAGNOSTICOS.map((d, i) => (
        <Card key={i}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
            <div>
              <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{d.cliente}</h4>
              <p style={{ margin: "2px 0 0", fontSize: "0.85rem", color: "#64748b" }}>{d.objetivo}</p>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Complexidade</span>
              <ProgressBar value={d.complexidade} max={10} color="#f59e0b" />
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Risco</span>
              <ProgressBar value={d.risco} max={10} color="#ef4444" />
            </div>
            <div>
              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Potencial</span>
              <ProgressBar value={d.potencial} max={10} color="#22c55e" />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: "0.8rem", marginBottom: 14 }}>
            <div><span style={{ color: "#94a3b8" }}>Faturamento:</span> <strong>{d.faturamento}</strong></div>
            <div><span style={{ color: "#94a3b8" }}>Custos:</span> <strong>{d.custos}</strong></div>
            <div><span style={{ color: "#94a3b8" }}>Funcionários:</span> <strong>{d.funcionarios}</strong></div>
            <div><span style={{ color: "#94a3b8" }}>Região:</span> <strong>{d.regiao}</strong></div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <SmallBtn primary>Continuar análise</SmallBtn>
            <SmallBtn>Ver detalhes</SmallBtn>
          </div>
        </Card>
      ))}
    </div>
  );
}

/* ─── Tab: Planejamento Tributário ────────────────────────────── */

function TabTributario() {
  const regimes = [
    {
      nome: "MEI",
      recomendado: false,
      receita: "R$ 81.000 (limite)",
      impostosMes: "R$ 75,60",
      carga: "1,12%",
      proLabore: "N/A",
      inss: "N/A",
      custoTotal: "R$ 75,60",
      margem: "99%",
    },
    {
      nome: "Simples Nacional",
      recomendado: true,
      receita: "R$ 360.000",
      impostosMes: "R$ 2.160",
      carga: "7,20%",
      proLabore: "R$ 3.000",
      inss: "R$ 330",
      custoTotal: "R$ 2.490",
      margem: "91,7%",
    },
    {
      nome: "Lucro Presumido",
      recomendado: false,
      receita: "R$ 360.000",
      impostosMes: "R$ 3.240",
      carga: "10,80%",
      proLabore: "R$ 3.000",
      inss: "R$ 330",
      custoTotal: "R$ 3.570",
      margem: "88,1%",
    },
    {
      nome: "Lucro Real",
      recomendado: false,
      receita: "R$ 360.000",
      impostosMes: "R$ 4.680",
      carga: "15,60%",
      proLabore: "R$ 3.000",
      inss: "R$ 330",
      custoTotal: "R$ 5.010",
      margem: "83,3%",
    },
  ];

  const linhas = [
    { label: "Receita anual",     key: "receita" as const },
    { label: "Impostos/mês",      key: "impostosMes" as const },
    { label: "Carga tributária",   key: "carga" as const },
    { label: "Pró-labore",        key: "proLabore" as const },
    { label: "INSS pró-labore",   key: "inss" as const },
    { label: "Custo total/mês",   key: "custoTotal" as const },
    { label: "Margem líquida",    key: "margem" as const },
  ];

  return (
    <>
      <Card style={{ marginBottom: 16, background: "#f8fafc" }}>
        <div style={{ display: "flex", gap: 24, fontSize: "0.88rem", fontWeight: 600 }}>
          <span>Faturamento: <strong>R$ 360.000/ano</strong></span>
          <span>Funcionários: <strong>2</strong></span>
          <span>Atividade: <strong>Serviços</strong></span>
        </div>
      </Card>

      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 14px" }}>Comparativo de regimes tributários</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>{""}</TH>
                {regimes.map((r) => (
                  <th
                    key={r.nome}
                    style={{
                      padding: "10px 14px",
                      textAlign: "center",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: r.recomendado ? "#065f46" : "#0f172a",
                      borderBottom: "1px solid #e2e8f0",
                      background: r.recomendado ? "#f0fdf4" : "transparent",
                    }}
                  >
                    {r.nome}
                    {r.recomendado && (
                      <div style={{ marginTop: 4 }}>
                        <Badge bg="#065f46" color="#fff" label="RECOMENDADO" />
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.key}>
                  <td style={{ padding: "10px 14px", fontSize: "0.82rem", fontWeight: 600, color: "#475569", borderBottom: "1px solid #f1f5f9" }}>
                    {l.label}
                  </td>
                  {regimes.map((r) => (
                    <td
                      key={r.nome}
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        borderBottom: "1px solid #f1f5f9",
                        background: r.recomendado ? "#f0fdf4" : "transparent",
                        color: r.recomendado ? "#065f46" : "#0f172a",
                      }}
                    >
                      {r[l.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        <Card style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: 6 }}>&#127942;</div>
          <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>Mais Econômico</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#065f46", fontWeight: 700 }}>Simples Nacional</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#64748b" }}>Economia de R$ 12.960/ano vs Presumido</p>
        </Card>
        <Card style={{ borderLeft: "4px solid #3b82f6" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: 6 }}>&#128737;&#65039;</div>
          <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>Mais Seguro</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#1e40af", fontWeight: 700 }}>Lucro Presumido</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#64748b" }}>Menor risco de autuação</p>
        </Card>
        <Card style={{ borderLeft: "4px solid #22c55e" }}>
          <div style={{ fontSize: "1.2rem", marginBottom: 6 }}>&#128200;</div>
          <h4 style={{ margin: "0 0 4px", fontSize: "0.95rem", fontWeight: 700 }}>Mais Escalável</h4>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#065f46", fontWeight: 700 }}>Lucro Presumido</p>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#64748b" }}>Sem limite de faturamento</p>
        </Card>
      </div>
    </>
  );
}

/* ─── Tab: Simulações ────────────────────────────────────────── */

function TabSimulacoes() {
  const [faturamento, setFaturamento] = useState(30000);
  const [funcionarios, setFuncionarios] = useState(2);
  const [proLabore, setProLabore] = useState(3000);
  const [atividade, setAtividade] = useState<Atividade>("Serviços");
  const [temSocios, setTemSocios] = useState(false);

  const meiDisponivel = faturamento <= 6750;
  const meiImposto = 75.60;

  const taxaSimples = atividade === "Comércio" ? 0.06 : atividade === "Indústria" ? 0.055 : 0.072;
  const simplesImposto = faturamento * taxaSimples;

  const taxaPresumido = atividade === "Serviços" ? 0.108 : 0.0586;
  const presumidoImposto = faturamento * taxaPresumido;

  const taxaReal = atividade === "Serviços" ? 0.156 : 0.094;
  const realImposto = faturamento * taxaReal;

  const regimes = [
    {
      nome: "MEI",
      imposto: meiDisponivel ? meiImposto : null,
      carga: meiDisponivel ? ((meiImposto / faturamento) * 100).toFixed(2) : null,
      custoTotal: meiDisponivel ? meiImposto : null,
      disponivel: meiDisponivel,
    },
    {
      nome: "Simples Nacional",
      imposto: simplesImposto,
      carga: ((simplesImposto / faturamento) * 100).toFixed(2),
      custoTotal: simplesImposto + (proLabore * 0.11),
      disponivel: true,
    },
    {
      nome: "Lucro Presumido",
      imposto: presumidoImposto,
      carga: ((presumidoImposto / faturamento) * 100).toFixed(2),
      custoTotal: presumidoImposto + (proLabore * 0.11),
      disponivel: true,
    },
    {
      nome: "Lucro Real",
      imposto: realImposto,
      carga: ((realImposto / faturamento) * 100).toFixed(2),
      custoTotal: realImposto + (proLabore * 0.11),
      disponivel: true,
    },
  ];

  const maxImposto = Math.max(...regimes.filter((r) => r.disponivel).map((r) => r.imposto ?? 0));

  const fmt = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 16px" }}>Simulador de regimes tributários</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              Faturamento mensal
            </label>
            <input
              type="number"
              value={faturamento}
              onChange={(e) => setFaturamento(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: "0.88rem",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              Número funcionários
            </label>
            <input
              type="number"
              value={funcionarios}
              onChange={(e) => setFuncionarios(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: "0.88rem",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#64748b", marginBottom: 4 }}>
              Pró-labore
            </label>
            <input
              type="number"
              value={proLabore}
              onChange={(e) => setProLabore(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: "0.88rem",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", marginRight: 8 }}>Tipo atividade:</span>
            {(["Comércio", "Serviços", "Indústria"] as Atividade[]).map((a) => (
              <label key={a} style={{ marginRight: 12, fontSize: "0.85rem", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="atividade"
                  checked={atividade === a}
                  onChange={() => setAtividade(a)}
                  style={{ marginRight: 4 }}
                />
                {a}
              </label>
            ))}
          </div>
          <div>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#64748b", marginRight: 8 }}>Tem sócios:</span>
            <label style={{ marginRight: 12, fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="radio" name="socios" checked={temSocios} onChange={() => setTemSocios(true)} style={{ marginRight: 4 }} />
              Sim
            </label>
            <label style={{ fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="radio" name="socios" checked={!temSocios} onChange={() => setTemSocios(false)} style={{ marginRight: 4 }} />
              Não
            </label>
          </div>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16 }}>
        {regimes.map((r) => (
          <Card
            key={r.nome}
            style={{
              opacity: r.disponivel ? 1 : 0.5,
              borderColor: r.disponivel ? "#e2e8f0" : "#fecaca",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 700 }}>{r.nome}</h4>
            {r.disponivel ? (
              <>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: 4 }}>Impostos estimados</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>{fmt(r.imposto!)}</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>Carga tributária</div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>{r.carga}%</div>
                <div style={{ fontSize: "0.8rem", color: "#64748b", marginTop: 8 }}>Custo total/mês</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "#475569" }}>{fmt(r.custoTotal!)}</div>
              </>
            ) : (
              <div style={{ fontSize: "0.82rem", color: "#b91c1c", fontWeight: 600 }}>
                Indisponível — faturamento excede R$ 6.750/mês
              </div>
            )}
          </Card>
        ))}
      </div>

      <Card>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 14px" }}>Comparativo visual</h3>
        <svg viewBox="0 0 600 200" style={{ width: "100%", maxHeight: 220 }}>
          {regimes.map((r, i) => {
            const barWidth = 100;
            const x = 50 + i * 140;
            const barHeight = r.disponivel && maxImposto > 0 ? ((r.imposto ?? 0) / maxImposto) * 140 : 0;
            const colors = ["#94a3b8", "#3b82f6", "#f59e0b", "#ef4444"];
            return (
              <g key={r.nome}>
                <rect x={x} y={170 - barHeight} width={barWidth} height={barHeight} rx={4} fill={colors[i]} opacity={r.disponivel ? 0.85 : 0.25} />
                <text x={x + barWidth / 2} y={185} textAnchor="middle" fontSize="11" fill="#475569" fontWeight="600">
                  {r.nome.length > 12 ? r.nome.slice(0, 12) + "..." : r.nome}
                </text>
                {r.disponivel && (
                  <text x={x + barWidth / 2} y={165 - barHeight} textAnchor="middle" fontSize="10" fill="#0f172a" fontWeight="700">
                    {fmt(r.imposto!)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </Card>
    </>
  );
}

/* ─── Tab: Viabilidade ───────────────────────────────────────── */

function TabViabilidade() {
  const itens = [
    { label: "Nome empresarial",    status: "ok"    as const, detalhe: "Disponível",                         icon: "✅" },
    { label: "CNAE",                status: "ok"    as const, detalhe: "4711-3/02 — Compatível",             icon: "✅" },
    { label: "Natureza jurídica",   status: "alerta" as const, detalhe: "LTDA — Requer contrato",            icon: "⚠️" },
    { label: "Capital social",      status: "ok"    as const, detalhe: "R$ 50.000 — Adequado",               icon: "✅" },
    { label: "Endereço",            status: "erro"  as const, detalhe: "Necessita alvará",                   icon: "❌" },
    { label: "Inscrição estadual",  status: "ok"    as const, detalhe: "Não necessária (serviços)",          icon: "✅" },
    { label: "Licenças",            status: "alerta" as const, detalhe: "Verificar licença sanitária",       icon: "⚠️" },
  ];

  const borderColors: Record<string, string> = {
    ok: "#22c55e",
    alerta: "#f59e0b",
    erro: "#ef4444",
  };

  const pendentes = [
    "Elaborar contrato social para natureza jurídica LTDA",
    "Obter alvará de funcionamento junto à prefeitura",
    "Verificar necessidade de licença sanitária com a vigilância",
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 20 }}>
        {itens.map((item, i) => (
          <Card key={i} style={{ borderLeft: `4px solid ${borderColors[item.status]}`, padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "1.2rem" }}>{item.icon}</span>
              <div>
                <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>{item.label}</div>
                <div style={{ fontSize: "0.82rem", color: "#64748b" }}>{item.detalhe}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card style={{ border: "2px solid #f59e0b", background: "#fffbeb" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <Badge bg="#f59e0b" color="#fff" label="VIÁVEL COM AJUSTES" />
          </div>
          <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", fontWeight: 700 }}>Pendências a resolver</h4>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: "0.82rem", color: "#475569", lineHeight: 1.8 }}>
            {pendentes.map((p, i) => (
              <li key={i}>{p}</li>
            ))}
          </ul>
        </Card>

        <Card>
          <h4 style={{ margin: "0 0 14px", fontSize: "0.95rem", fontWeight: 700 }}>Avaliação de risco</h4>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            {["Baixo", "Médio", "Alto"].map((nivel) => {
              const cores: Record<string, string> = { Baixo: "#22c55e", "Médio": "#f59e0b", Alto: "#ef4444" };
              const ativo = nivel === "Médio";
              return (
                <div
                  key={nivel}
                  style={{
                    flex: 1,
                    textAlign: "center",
                    padding: "12px 8px",
                    borderRadius: 8,
                    background: ativo ? cores[nivel] + "20" : "#f8fafc",
                    border: ativo ? `2px solid ${cores[nivel]}` : "1px solid #e2e8f0",
                  }}
                >
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: ativo ? cores[nivel] : "#94a3b8" }}>{nivel}</div>
                </div>
              );
            })}
          </div>
          <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
            Risco médio devido à necessidade de alvará e verificação de licenças. Prazo estimado para resolução: 15 dias úteis.
          </p>
        </Card>
      </div>
    </>
  );
}

/* ─── Tab: Apresentações ─────────────────────────────────────── */

function TabApresentacoes() {
  const secoes = [
    "1. Capa",
    "2. Situação Atual",
    "3. Cenários",
    "4. Recomendação",
    "5. Passo a Passo",
    "6. Custos",
    "7. Cronograma",
    "8. Conclusão",
  ];

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 20 }}>
        {APRESENTACOES.map((a, i) => {
          const s = S_APRESENTACAO[a.status];
          return (
            <Card key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>{a.cliente}</h4>
                  <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#64748b" }}>{a.objetivo}</p>
                </div>
                <Badge bg={s.bg} color={s.color} label={a.status} />
              </div>
              <div style={{ display: "flex", gap: 16, fontSize: "0.8rem", color: "#64748b", marginBottom: 12 }}>
                <span>Data: <strong>{a.data}</strong></span>
                <span>Páginas: <strong>{a.paginas}</strong></span>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <SmallBtn primary>Visualizar</SmallBtn>
                <SmallBtn>Gerar PDF</SmallBtn>
                <SmallBtn>Enviar ao cliente</SmallBtn>
              </div>
            </Card>
          );
        })}
      </div>

      <Card>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 4px" }}>Preview — Lucia Ferreira: Abrir empresa</h3>
        <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 14px" }}>12 páginas - Aprovada em 14/06/2026</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
          {secoes.map((sec, i) => (
            <div
              key={i}
              style={{
                padding: "14px 12px",
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                fontSize: "0.82rem",
                fontWeight: 600,
                color: "#475569",
                textAlign: "center",
              }}
            >
              {sec}
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

/* ─── Tab: Histórico ─────────────────────────────────────────── */

function TabHistorico() {
  return (
    <Card>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 14px" }}>Registro de atividades</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>Data/Hora</TH>
              <TH>Usuário</TH>
              <TH>Ação</TH>
              <TH>Estudo</TH>
              <TH>Detalhe</TH>
            </tr>
          </thead>
          <tbody>
            {HISTORICO_DATA.map((h, i) => (
              <tr key={i}>
                <TD>{h.dataHora}</TD>
                <TD><strong>{h.usuario}</strong></TD>
                <TD>{h.acao}</TD>
                <TD>{h.estudo}</TD>
                <TD><span style={{ color: "#64748b" }}>{h.detalhe}</span></TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ─── Componente principal ───────────────────────────────────── */

export default function ConsultoriaPage() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <AppShell>
      <div className="page-stack">
        {/* ── Hero ─────────────────────────────────── */}
        <section className="module-hero">
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Consultoria Empresarial</h2>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.95rem" }}>
              Diagnóstico, planejamento tributário e viabilidade
            </p>
          </div>
          <Link
            href="/consultoria/novo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            + Novo Estudo
          </Link>
        </section>

        {/* ── Tabs ─────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e2e8f0", marginBottom: 8, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "10px 18px",
                fontSize: "0.85rem",
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? "#0f172a" : "#64748b",
                background: "none",
                border: "none",
                borderBottom: tab === t.key ? "2px solid #0f172a" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Conteúdo da tab ──────────────────────── */}
        {tab === "dashboard" && <TabDashboard />}
        {tab === "diagnosticos" && <TabDiagnosticos />}
        {tab === "tributario" && <TabTributario />}
        {tab === "simulacoes" && <TabSimulacoes />}
        {tab === "viabilidade" && <TabViabilidade />}
        {tab === "apresentacoes" && <TabApresentacoes />}
        {tab === "historico" && <TabHistorico />}
      </div>
    </AppShell>
  );
}
