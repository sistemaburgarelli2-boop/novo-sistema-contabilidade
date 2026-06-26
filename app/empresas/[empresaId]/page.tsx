"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { EmpresaTimeline } from "@/components/empresas/EmpresaTimeline";
import {
  atualizarEmpresaTenant,
  buscarEmpresaTenant,
} from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

/* ── Constantes ──────────────────────────────────────────────────── */

const REGIMES: Record<string, string> = {
  lucro_presumido: "Lucro Presumido",
  lucro_real: "Lucro Real",
  mei: "MEI",
  simples_nacional: "Simples Nacional",
};

const STATUS_CLASS: Record<Empresa["status"], string> = {
  ativa: "badge-success",
  cancelada: "badge-danger",
  encerrada: "badge-neutral",
  suspensa: "badge-warning",
};

const STATUS_LABEL: Record<Empresa["status"], string> = {
  ativa: "Ativa",
  cancelada: "Cancelada",
  encerrada: "Encerrada",
  suspensa: "Suspensa",
};

const SETORES = [
  { cor: "#065f46", emoji: "📄", label: "Fiscal", slug: "fiscal" },
  { cor: "#1e40af", emoji: "📚", label: "Contábil", slug: "contabil" },
  { cor: "#6b21a8", emoji: "👥", label: "DP", slug: "dp" },
  { cor: "#92400e", emoji: "🏛", label: "Societário", slug: "societario" },
];

type Tab = "geral" | "cliente" | "operacao" | "documentos" | "portal" | "financeiro" | "historico";

const TAB_LABELS: Record<Tab, string> = {
  geral: "Visão Geral",
  cliente: "Cliente",
  operacao: "Operação",
  documentos: "Documentos",
  portal: "Portal",
  financeiro: "Financeiro",
  historico: "Histórico",
};

/* ── Tipos para dados reais ──────────────────────────────────────── */

type StatusTarefa = "nao_iniciado" | "em_andamento" | "revisao" | "concluido" | "atrasado";

interface Tarefa {
  id: string;
  empresa_id: string;
  setor: string;
  atividade: string;
  prazo: string;
  responsavel: string;
  status: StatusTarefa;
  empresas?: { nome_legal: string } | null;
}

const TAREFA_STATUS_LABELS: Record<string, { color: string; bg: string; label: string }> = {
  nao_iniciado: { bg: "#f3f4f6", color: "#6b7280", label: "Não iniciado" },
  em_andamento: { bg: "#ecfeff", color: "#0e7490", label: "Em andamento" },
  revisao: { bg: "#fffbeb", color: "#92400e", label: "Revisão" },
  concluido: { bg: "#f0fdf4", color: "#065f46", label: "Concluído" },
  atrasado: { bg: "#fef2f2", color: "#dc2626", label: "Atrasado" },
};

interface Mensalidade {
  id: string;
  empresa_id: string;
  competencia: string;
  valor: number;
  vencimento: string;
  status: string;
}

const PAGAMENTO_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  pago: { color: "#065f46", bg: "#f0fdf4" },
  pendente: { color: "#92400e", bg: "#fffbeb" },
  atrasado: { color: "#dc2626", bg: "#fef2f2" },
};

/* ── Inline style helpers ─────────────────────────────────────────── */

const sectionTitle: React.CSSProperties = { margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "var(--ink)" };
const sectionSubtitle: React.CSSProperties = { margin: 0, fontSize: 13, color: "var(--muted)" };
const infoCard: React.CSSProperties = { background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" };
const infoLabel: React.CSSProperties = { color: "var(--muted)", fontSize: 11, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 4 };
const infoValue: React.CSSProperties = { color: "var(--ink)", fontSize: 14, fontWeight: 600 };
const thStyle: React.CSSProperties = {
  background: "var(--bg)", borderBottom: "2px solid var(--border)", color: "var(--muted)",
  fontSize: 11, fontWeight: 800, letterSpacing: "0.8px", padding: "10px 12px",
  textAlign: "left" as const, textTransform: "uppercase" as const, whiteSpace: "nowrap" as const,
};
const tdStyle: React.CSSProperties = { padding: "10px 12px", color: "var(--ink)" };

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span style={{
      background: bg, border: `1px solid ${color}22`, borderRadius: 6,
      color, display: "inline-block", fontSize: 11, fontWeight: 700, padding: "2px 10px",
    }}>
      {label}
    </span>
  );
}

function EmptyState({ titulo, descricao }: { titulo: string; descricao?: string }) {
  return (
    <div style={{
      textAlign: "center" as const, padding: "40px 20px",
      background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 12,
    }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>{titulo}</div>
      {descricao && <div style={{ fontSize: 13, color: "var(--muted)" }}>{descricao}</div>}
    </div>
  );
}

/* ── Component ────────────────────────────────────────────────────── */

export default function EmpresaDetalhe() {
  const params = useParams();
  const router = useRouter();
  const empresaId = params.empresaId as string;

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("geral");
  const [editando, setEditando] = useState(false);
  const [editNome, setEditNome] = useState("");
  const [salvando, setSalvando] = useState(false);

  // Real data states
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [observacoes, setObservacoes] = useState("");

  // Load empresa
  useEffect(() => {
    buscarEmpresaTenant(empresaId)
      .then((e) => {
        setEmpresa(e);
        setEditNome(e.nome_legal);
      })
      .catch(() => {
        setEmpresa({
          id: empresaId,
          plano_id: null,
          nome_legal: "Empresa Demo",
          nome_fantasia: "Demo",
          cnpj: "00.000.000/0001-00",
          regime_tributario: "simples_nacional",
          status: "ativa",
          subdominio: null,
          cidade: "São Paulo",
          estado: "SP",
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setEditNome("Empresa Demo");
      })
      .finally(() => setLoading(false));
  }, [empresaId, router]);

  // Load tarefas when Operação tab is active
  useEffect(() => {
    if (tab !== "operacao") return;
    fetch("/api/tarefas")
      .then((r) => r.json())
      .then((json) => {
        const all: Tarefa[] = json.data ?? [];
        setTarefas(all.filter((t) => t.empresa_id === empresaId));
      })
      .catch(() => setTarefas([]));
  }, [tab, empresaId]);

  // Load financeiro when Financeiro tab is active
  useEffect(() => {
    if (tab !== "financeiro") return;
    fetch(`/api/empresas/${empresaId}/setores/financeiro`)
      .then((r) => r.json())
      .then((json) => {
        const all: Mensalidade[] = json.data?.mensalidades ?? [];
        setMensalidades(all.filter((m) => m.empresa_id === empresaId));
      })
      .catch(() => setMensalidades([]));
  }, [tab, empresaId]);

  async function handleSalvarNome() {
    if (!empresa) return;
    setSalvando(true);
    try {
      const updated = await atualizarEmpresaTenant(empresa.id, { nome_legal: editNome });
      setEmpresa(updated);
      setEditando(false);
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <div className="empty-state">
          <p>Carregando empresa...</p>
        </div>
      </AppShell>
    );
  }

  if (!empresa) return null;

  const initials = empresa.nome_legal
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const regimeLabel = REGIMES[empresa.regime_tributario ?? ""] ?? empresa.regime_tributario ?? "—";

  // Computed KPIs from real tarefas
  const tarefasPendentes = tarefas.filter((t) => t.status === "nao_iniciado").length;
  const tarefasAndamento = tarefas.filter((t) => t.status === "em_andamento").length;
  const tarefasAtrasadas = tarefas.filter((t) => t.status === "atrasado").length;
  const tarefasConcluidas = tarefas.filter((t) => t.status === "concluido").length;

  return (
    <AppShell>
      <div className="page-stack">

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
          <Link href="/empresas" style={{ color: "var(--green-700)", fontWeight: 600 }}>Empresas</Link>
          <span>&rsaquo;</span>
          <span>{empresa.nome_legal}</span>
        </nav>

        {/* Header card */}
        <div className="empresa-header-card">
          <div className="empresa-header-avatar">{initials}</div>
          <div className="empresa-header-info">
            {editando ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  autoFocus
                  onChange={(e) => setEditNome(e.target.value)}
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, color: "#fff", fontSize: 18, fontWeight: 700, padding: "6px 12px", minWidth: 260 }}
                  value={editNome}
                />
                <button
                  disabled={salvando}
                  onClick={handleSalvarNome}
                  style={{ background: "#10b981", border: "none", borderRadius: 8, color: "#fff", cursor: "pointer", fontWeight: 700, padding: "6px 14px" }}
                  type="button"
                >
                  {salvando ? "..." : "Salvar"}
                </button>
                <button
                  onClick={() => setEditando(false)}
                  style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, color: "#fff", cursor: "pointer", padding: "6px 12px" }}
                  type="button"
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <h1 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 800 }}>{empresa.nome_legal}</h1>
            )}
            {empresa.nome_fantasia && (
              <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 2 }}>{empresa.nome_fantasia}</div>
            )}
            <div className="empresa-header-meta">
              {empresa.cnpj && <span>CNPJ: <strong>{empresa.cnpj}</strong></span>}
              {empresa.regime_tributario && <span>Regime: <strong>{regimeLabel}</strong></span>}
              <span className={`priority-badge ${STATUS_CLASS[empresa.status]}`}>
                {STATUS_LABEL[empresa.status]}
              </span>
            </div>
          </div>
          <div className="empresa-header-actions">
            <button
              onClick={() => setEditando(true)}
              style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 10, color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "8px 16px" }}
              type="button"
            >
              Editar
            </button>
            <Link
              href={`/portal/${empresaId}`}
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", display: "inline-block", fontSize: 13, fontWeight: 700, padding: "8px 16px", textDecoration: "none" }}
            >
              Portal do Cliente
            </Link>
          </div>
        </div>

        {/* Main content with sidebar */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "start" }}>

          {/* Left: tabs + content */}
          <div style={{ minWidth: 0 }}>

            {/* Tabs */}
            <div className="empresa-tabs">
              {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
                <button
                  key={t}
                  className={`empresa-tab${tab === t ? " active" : ""}`}
                  onClick={() => setTab(t)}
                  type="button"
                >
                  {TAB_LABELS[t]}
                </button>
              ))}
            </div>

            <div className="empresa-tab-content">

              {/* ── Tab 1: Visao Geral ─────────────────────────── */}
              {tab === "geral" && (
                <div style={{ display: "grid", gap: 20 }}>
                  {/* Company info grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    {[
                      { label: "Razão Social", value: empresa.nome_legal },
                      { label: "Nome Fantasia", value: empresa.nome_fantasia ?? "—" },
                      { label: "CNPJ", value: empresa.cnpj ?? "—" },
                      { label: "Regime Tributário", value: regimeLabel },
                      { label: "Cidade", value: empresa.cidade ?? "—" },
                      { label: "Estado", value: empresa.estado ?? "—" },
                      { label: "Cadastrado em", value: new Date(empresa.created_at).toLocaleDateString("pt-BR") },
                      { label: "Última atualização", value: new Date(empresa.updated_at).toLocaleDateString("pt-BR") },
                    ].map((item) => (
                      <div key={item.label} style={infoCard}>
                        <div style={infoLabel}>{item.label}</div>
                        <div style={infoValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* KPI Cards — all real/empty */}
                  <div className="kpi-strip">
                    <article className="metric-card">
                      <span>Pendências</span>
                      <strong className="kpi-num">0</strong>
                      <p>Obrigações pendentes</p>
                    </article>
                    <article className="metric-card">
                      <span>Último Fechamento</span>
                      <strong className="kpi-currency">&mdash;</strong>
                      <p>Contabilidade encerrada</p>
                    </article>
                    <article className="metric-card">
                      <span>Documentos Recebidos</span>
                      <strong className="kpi-num">0</strong>
                      <p>Recebidos este mês</p>
                    </article>
                    <article className="metric-card">
                      <span>Risco Operacional</span>
                      <strong className="kpi-currency">&mdash;</strong>
                      <p>Nível de risco atual</p>
                    </article>
                  </div>

                  {/* Setores */}
                  <div className="list-panel" style={{ padding: "18px 20px" }}>
                    <div style={{ marginBottom: 14 }}>
                      <h2 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Setores operacionais</h2>
                      <p style={sectionSubtitle}>Acesse cada área da empresa</p>
                    </div>
                    <div className="setor-nav-grid">
                      {SETORES.map((s) => (
                        <Link className="setor-nav-card" href={`/empresas/${empresaId}/setores/${s.slug}`} key={s.slug}>
                          <div className="setor-nav-card-icon" style={{ background: `${s.cor}18` }}>
                            <span style={{ fontSize: 20 }}>{s.emoji}</span>
                          </div>
                          <span style={{ color: s.cor, fontWeight: 700 }}>{s.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 style={{ ...sectionTitle, marginBottom: 16 }}>Timeline operacional</h3>
                    <EmpresaTimeline empresaId={empresaId} />
                  </div>
                </div>
              )}

              {/* ── Tab 2: Cliente ─────────────────────────────── */}
              {tab === "cliente" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Dados do cliente / proprietário</h3>
                    <p style={sectionSubtitle}>Informações do responsável legal da empresa</p>
                  </div>
                  <EmptyState
                    titulo="Nenhum dado de cliente cadastrado"
                    descricao="Os dados do proprietário serão preenchidos no onboarding"
                  />
                </div>
              )}

              {/* ── Tab 3: Operação ────────────────────────────── */}
              {tab === "operacao" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Tarefas operacionais</h3>
                    <p style={sectionSubtitle}>Atividades vinculadas a esta empresa</p>
                  </div>

                  {/* KPI cards computed from real data */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                    {[
                      { label: "Pendentes", valor: String(tarefasPendentes), cor: "#92400e" },
                      { label: "Em andamento", valor: String(tarefasAndamento), cor: "#0e7490" },
                      { label: "Atrasadas", valor: String(tarefasAtrasadas), cor: "#dc2626" },
                      { label: "Concluídas", valor: String(tarefasConcluidas), cor: "#065f46" },
                    ].map((kpi) => (
                      <div key={kpi.label} style={{ ...infoCard, textAlign: "center" as const }}>
                        <div style={{ ...infoLabel, marginBottom: 4 }}>{kpi.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: kpi.cor }}>{kpi.valor}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tasks table or empty state */}
                  {tarefas.length === 0 ? (
                    <EmptyState
                      titulo="Nenhuma tarefa cadastrada para esta empresa"
                      descricao="As tarefas serão criadas conforme as obrigações forem registradas"
                    />
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Atividade", "Setor", "Prazo", "Responsável", "Status"].map((h) => (
                              <th key={h} style={thStyle}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tarefas.map((t) => {
                            const sc = TAREFA_STATUS_LABELS[t.status] ?? { color: "#6b7280", bg: "#f3f4f6", label: t.status };
                            const isAtrasado = t.status === "atrasado";
                            return (
                              <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>
                                  {t.atividade}
                                  {isAtrasado && (
                                    <span style={{
                                      background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4,
                                      color: "#dc2626", display: "inline-block", fontSize: 10, fontWeight: 700,
                                      marginLeft: 8, padding: "1px 6px",
                                    }}>
                                      ATRASADA
                                    </span>
                                  )}
                                </td>
                                <td style={tdStyle}>{t.setor}</td>
                                <td style={{ ...tdStyle, color: isAtrasado ? "#dc2626" : "var(--ink)", fontWeight: isAtrasado ? 700 : 400 }}>
                                  {t.prazo ? new Date(t.prazo).toLocaleDateString("pt-BR") : "—"}
                                </td>
                                <td style={tdStyle}>{t.responsavel ?? "—"}</td>
                                <td style={tdStyle}>
                                  <StatusBadge label={sc.label} color={sc.color} bg={sc.bg} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 4: Documentos ──────────────────────────── */}
              {tab === "documentos" && (
                <div style={{ display: "grid", gap: 20 }}>
                  {/* Header + action */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h3 style={sectionTitle}>Documentos da empresa</h3>
                      <p style={sectionSubtitle}>Organizados por competência e setor</p>
                    </div>
                    <button className="small-action" type="button">+ Receber documento</button>
                  </div>

                  {/* Upload area */}
                  <div style={{
                    border: "2px dashed var(--border)", borderRadius: 12, padding: "28px 20px",
                    textAlign: "center" as const, background: "var(--bg)", cursor: "pointer",
                  }}>
                    <div style={{ fontSize: 28, marginBottom: 6 }}>+</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                      Arraste arquivos aqui ou clique para selecionar
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)" }}>
                      PDF, XML, imagens — até 10 MB por arquivo
                    </div>
                  </div>

                  <EmptyState
                    titulo="Nenhum documento cadastrado"
                    descricao="Os documentos serão organizados conforme recebidos"
                  />
                </div>
              )}

              {/* ── Tab 5: Portal ──────────────────────────────── */}
              {tab === "portal" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Portal do cliente</h3>
                    <p style={sectionSubtitle}>Acesso e atividades do cliente no portal</p>
                  </div>
                  <EmptyState
                    titulo="Portal não configurado"
                    descricao="O acesso ao portal será criado durante o onboarding"
                  />
                </div>
              )}

              {/* ── Tab 6: Financeiro ──────────────────────────── */}
              {tab === "financeiro" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Relacionamento financeiro</h3>
                    <p style={sectionSubtitle}>Cobrança e pagamentos desta empresa</p>
                  </div>

                  {mensalidades.length === 0 ? (
                    <EmptyState
                      titulo="Sem informações financeiras"
                      descricao="As mensalidades serão registradas conforme o plano contratado"
                    />
                  ) : (
                    <div>
                      <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Mensalidades</h3>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                          <thead>
                            <tr>
                              {["Competência", "Valor", "Vencimento", "Status"].map((h) => (
                                <th key={h} style={thStyle}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {mensalidades.map((m) => {
                              const statusKey = (m.status ?? "").toLowerCase();
                              const sc = PAGAMENTO_STATUS_COLORS[statusKey] ?? { color: "#6b7280", bg: "#f3f4f6" };
                              return (
                                <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                  <td style={{ ...tdStyle, fontWeight: 600 }}>{m.competencia ?? "—"}</td>
                                  <td style={tdStyle}>
                                    {typeof m.valor === "number"
                                      ? m.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                                      : "—"}
                                  </td>
                                  <td style={tdStyle}>
                                    {m.vencimento ? new Date(m.vencimento).toLocaleDateString("pt-BR") : "—"}
                                  </td>
                                  <td style={tdStyle}>
                                    <StatusBadge label={m.status ?? "—"} color={sc.color} bg={sc.bg} />
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── Tab 7: Histórico ───────────────────────────── */}
              {tab === "historico" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Histórico completo</h3>
                    <p style={sectionSubtitle}>Todos os eventos registrados para esta empresa</p>
                  </div>

                  {/* Audit info */}
                  <div style={{ ...infoCard, padding: "16px 18px" }}>
                    <div style={{ ...infoLabel, marginBottom: 10 }}>Auditoria</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>Data de criação</div>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>
                          {new Date(empresa.created_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>Última alteração</div>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>
                          {new Date(empresa.updated_at).toLocaleDateString("pt-BR")}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* EmpresaTimeline — loads its own real data */}
                  <div>
                    <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Timeline do sistema</h3>
                    <EmpresaTimeline empresaId={empresaId} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <aside style={{
            display: "flex", flexDirection: "column" as const, gap: 16,
            position: "sticky" as const, top: 20, alignSelf: "start",
          }}>
            {/* Observações */}
            <div style={{ ...infoCard, padding: "16px 18px" }}>
              <div style={{ ...infoLabel, marginBottom: 8 }}>Observações</div>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Adicione observações sobre esta empresa..."
                style={{
                  width: "100%", minHeight: 80, resize: "vertical" as const,
                  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
                  color: "var(--ink)", fontSize: 13, padding: "8px 10px", fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Últimos eventos */}
            <div style={{ ...infoCard, padding: "16px 18px" }}>
              <div style={{ ...infoLabel, marginBottom: 10 }}>Últimos eventos</div>
              <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" as const, padding: "12px 0" }}>
                Sem eventos recentes
              </div>
            </div>

            {/* Próximo prazo */}
            <div style={{ ...infoCard, padding: "16px 18px" }}>
              <div style={{ ...infoLabel, marginBottom: 6 }}>Próximo prazo</div>
              <div style={{ fontSize: 13, color: "var(--muted)", textAlign: "center" as const, padding: "12px 0" }}>
                Sem prazos registrados
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
