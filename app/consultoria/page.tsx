"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type Tab = "dashboard" | "diagnosticos" | "tributario" | "simulacoes" | "viabilidade" | "apresentacoes" | "historico";
type Atividade = "Comercio" | "Servicos" | "Industria";

/* ─── Estilos de status / etapa ──────────────────────────────── */

const S_STATUS: Record<string, { bg: string; color: string }> = {
  novo:           { bg: "rgba(148,163,184,0.15)", color: "var(--muted)" },
  em_andamento:   { bg: "rgba(96,165,250,0.15)", color: "#93c5fd" },
  aguardando:     { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  concluido:      { bg: "rgba(52,211,153,0.15)", color: "#34d399" },
  convertido:     { bg: "rgba(196,181,253,0.15)", color: "#c4b5fd" },
  cancelado:      { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
};

const S_ETAPA: Record<string, { bg: string; color: string }> = {
  diagnostico:    { bg: "rgba(251,191,36,0.18)", color: "#fbbf24" },
  planejamento:   { bg: "rgba(96,165,250,0.18)", color: "#93c5fd" },
  simulacao:      { bg: "rgba(99,102,241,0.35)", color: "#a5b4fc" },
  viabilidade:    { bg: "rgba(52,211,153,0.2)", color: "#34d399" },
  plano:          { bg: "#fce7f3", color: "#9d174d" },
  apresentacao:   { bg: "rgba(196,181,253,0.18)", color: "#6b21a8" },
  aprovacao:      { bg: "#ccfbf1", color: "#67e8f9" },
};

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
        color: "var(--muted)",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        borderBottom: "1px solid var(--border)",
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
        borderBottom: "1px solid var(--panel-2)",
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
        background: "var(--panel)",
        borderRadius: 12,
        border: "1px solid var(--border)",
        padding: 20,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "var(--muted)",
        fontSize: "0.95rem",
      }}
    >
      {message}
    </div>
  );
}

/* ─── Tabs config ────────────────────────────────────────────── */

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard",      label: "Dashboard" },
  { key: "diagnosticos",   label: "Diagnosticos" },
  { key: "tributario",     label: "Planejamento Tributario" },
  { key: "simulacoes",     label: "Simulacoes" },
  { key: "viabilidade",    label: "Viabilidade" },
  { key: "apresentacoes",  label: "Apresentacoes" },
  { key: "historico",      label: "Historico" },
];

/* ─── Tab: Dashboard ─────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EstudoRow = Record<string, any>;

function TabDashboard({ estudos, loading }: { estudos: EstudoRow[]; loading: boolean }) {
  const total = estudos.length;
  const emAndamento = estudos.filter((e) => e.status === "em_andamento").length;
  const concluidos = estudos.filter((e) => e.status === "concluido").length;
  const aguardando = estudos.filter((e) => e.status === "aguardando").length;

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 }}>
        <Card>
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>Total de estudos</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--ink)" }}>{loading ? "..." : total}</div>
        </Card>
        <Card>
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>Em andamento</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#93c5fd" }}>{loading ? "..." : emAndamento}</div>
        </Card>
        <Card>
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>Concluidos</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#34d399" }}>{loading ? "..." : concluidos}</div>
        </Card>
        <Card>
          <div style={{ fontSize: "0.78rem", color: "var(--muted)", fontWeight: 600, marginBottom: 4 }}>Aguardando</div>
          <div style={{ fontSize: "1.5rem", fontWeight: 700, color: "#fbbf24" }}>{loading ? "..." : aguardando}</div>
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 14px" }}>Estudos recentes</h3>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--muted)" }}>Carregando...</div>
        ) : estudos.length === 0 ? (
          <EmptyState message="Nenhum estudo cadastrado" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Cliente / Empresa</TH>
                  <TH>Objetivo</TH>
                  <TH>Etapa</TH>
                  <TH>Status</TH>
                  <TH>Criado em</TH>
                </tr>
              </thead>
              <tbody>
                {estudos.slice(0, 10).map((e) => {
                  const st = S_STATUS[e.status] ?? { bg: "rgba(148,163,184,0.15)", color: "var(--muted)" };
                  const et = S_ETAPA[e.etapa] ?? { bg: "rgba(148,163,184,0.15)", color: "var(--muted)" };
                  return (
                    <tr key={e.id} style={{ cursor: "pointer" }}>
                      <TD><strong>{e.cliente ?? e.empresa ?? "—"}</strong></TD>
                      <TD>{e.objetivo ?? "—"}</TD>
                      <TD><Badge bg={et.bg} color={et.color} label={e.etapa ?? "—"} /></TD>
                      <TD><Badge bg={st.bg} color={st.color} label={e.status ?? "—"} /></TD>
                      <TD>{e.created_at ? new Date(e.created_at).toLocaleDateString("pt-BR") : "—"}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}

/* ─── Tab: Planejamento Tributario ────────────────────────────── */

function TabTributario() {
  return (
    <>
      <Card style={{ marginBottom: 16, background: "var(--panel-2)" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--muted)", fontWeight: 600 }}>
          Selecione um estudo para ver a comparacao tributaria
        </p>
      </Card>

      <Card>
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 14px" }}>Comparativo de regimes tributarios</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>{""}</TH>
                {["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"].map((nome) => (
                  <th
                    key={nome}
                    style={{
                      padding: "10px 14px",
                      textAlign: "center",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "var(--ink)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                "Receita anual",
                "Impostos/mes",
                "Carga tributaria",
                "Pro-labore",
                "INSS pro-labore",
                "Custo total/mes",
                "Margem liquida",
              ].map((label) => (
                <tr key={label}>
                  <td style={{ padding: "10px 14px", fontSize: "0.82rem", fontWeight: 600, color: "var(--ink-2)", borderBottom: "1px solid var(--panel-2)" }}>
                    {label}
                  </td>
                  {[0, 1, 2, 3].map((i) => (
                    <td
                      key={i}
                      style={{
                        padding: "10px 14px",
                        textAlign: "center",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        borderBottom: "1px solid var(--panel-2)",
                        color: "var(--muted)",
                      }}
                    >
                      —
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

/* ─── Tab: Simulacoes (ferramenta interativa) ────────────────── */

function TabSimulacoes() {
  const [faturamento, setFaturamento] = useState(30000);
  const [funcionarios, setFuncionarios] = useState(2);
  const [proLabore, setProLabore] = useState(3000);
  const [atividade, setAtividade] = useState<Atividade>("Servicos");
  const [temSocios, setTemSocios] = useState(false);

  const meiDisponivel = faturamento <= 6750;
  const meiImposto = 75.60;

  const taxaSimples = atividade === "Comercio" ? 0.06 : atividade === "Industria" ? 0.055 : 0.072;
  const simplesImposto = faturamento * taxaSimples;

  const taxaPresumido = atividade === "Servicos" ? 0.108 : 0.0586;
  const presumidoImposto = faturamento * taxaPresumido;

  const taxaReal = atividade === "Servicos" ? 0.156 : 0.094;
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
        <h3 style={{ fontSize: "1rem", fontWeight: 700, margin: "0 0 16px" }}>Simulador de regimes tributarios</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
              Faturamento mensal
            </label>
            <input
              type="number"
              value={faturamento}
              onChange={(e) => setFaturamento(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: "0.88rem",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
              Numero funcionarios
            </label>
            <input
              type="number"
              value={funcionarios}
              onChange={(e) => setFuncionarios(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: "0.88rem",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginBottom: 4 }}>
              Pro-labore
            </label>
            <input
              type="number"
              value={proLabore}
              onChange={(e) => setProLabore(Number(e.target.value) || 0)}
              style={{
                width: "100%",
                padding: "8px 12px",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: "0.88rem",
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginRight: 8 }}>Tipo atividade:</span>
            {(["Comercio", "Servicos", "Industria"] as Atividade[]).map((a) => (
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
            <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--muted)", marginRight: 8 }}>Tem socios:</span>
            <label style={{ marginRight: 12, fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="radio" name="socios" checked={temSocios} onChange={() => setTemSocios(true)} style={{ marginRight: 4 }} />
              Sim
            </label>
            <label style={{ fontSize: "0.85rem", cursor: "pointer" }}>
              <input type="radio" name="socios" checked={!temSocios} onChange={() => setTemSocios(false)} style={{ marginRight: 4 }} />
              Nao
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
              borderColor: r.disponivel ? "var(--border)" : "rgba(248,113,113,0.35)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "0.95rem", fontWeight: 700 }}>{r.nome}</h4>
            {r.disponivel ? (
              <>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: 4 }}>Impostos estimados</div>
                <div style={{ fontSize: "1.2rem", fontWeight: 700, color: "var(--ink)" }}>{fmt(r.imposto!)}</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 8 }}>Carga tributaria</div>
                <div style={{ fontSize: "1rem", fontWeight: 700 }}>{r.carga}%</div>
                <div style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: 8 }}>Custo total/mes</div>
                <div style={{ fontSize: "1rem", fontWeight: 700, color: "var(--ink-2)" }}>{fmt(r.custoTotal!)}</div>
              </>
            ) : (
              <div style={{ fontSize: "0.82rem", color: "#f87171", fontWeight: 600 }}>
                Indisponivel - faturamento excede R$ 6.750/mes
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
            const colors = ["var(--muted)", "#3b82f6", "#f59e0b", "#ef4444"];
            return (
              <g key={r.nome}>
                <rect x={x} y={170 - barHeight} width={barWidth} height={barHeight} rx={4} fill={colors[i]} opacity={r.disponivel ? 0.85 : 0.25} />
                <text x={x + barWidth / 2} y={185} textAnchor="middle" fontSize="11" fill="var(--ink-2)" fontWeight="600">
                  {r.nome.length > 12 ? r.nome.slice(0, 12) + "..." : r.nome}
                </text>
                {r.disponivel && (
                  <text x={x + barWidth / 2} y={165 - barHeight} textAnchor="middle" fontSize="10" fill="var(--ink)" fontWeight="700">
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

/* ─── Componente principal ───────────────────────────────────── */

export default function ConsultoriaPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [estudos, setEstudos] = useState<EstudoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/consultoria")
      .then((r) => r.json())
      .then((json) => setEstudos(json.data ?? []))
      .catch(() => setEstudos([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="page-stack">
        {/* ── Hero ─────────────────────────────────── */}
        <section className="module-hero">
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Consultoria Empresarial</h2>
            <p style={{ color: "var(--muted)", margin: "4px 0 0", fontSize: "0.95rem" }}>
              Diagnostico, planejamento tributario e viabilidade
            </p>
          </div>
          <Link
            href="/consultoria/novo"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "var(--green-500)",
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
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border)", marginBottom: 8, overflowX: "auto" }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "10px 18px",
                fontSize: "0.85rem",
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? "var(--ink)" : "var(--muted)",
                background: "none",
                border: "none",
                borderBottom: tab === t.key ? "2px solid var(--green-400)" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
                whiteSpace: "nowrap",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Conteudo da tab ──────────────────────── */}
        {tab === "dashboard" && <TabDashboard estudos={estudos} loading={loading} />}
        {tab === "diagnosticos" && <EmptyState message="Sem diagnosticos em andamento" />}
        {tab === "tributario" && <TabTributario />}
        {tab === "simulacoes" && <TabSimulacoes />}
        {tab === "viabilidade" && <EmptyState message="Sem analise de viabilidade" />}
        {tab === "apresentacoes" && <EmptyState message="Nenhuma apresentacao gerada" />}
        {tab === "historico" && <EmptyState message="Sem registros" />}
      </div>
    </AppShell>
  );
}
