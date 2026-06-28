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

const LINKS_EXTRAS = [
  { cor: "#4f46e5", emoji: "🧾", label: "Notas Fiscais", href: (id: string) => `/empresas/${id}/notas-fiscais` },
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
  const [editForm, setEditForm] = useState({
    nome_legal: "", nome_fantasia: "", cnpj: "", regime_tributario: "", cidade: "", estado: "", status: "",
    nome_completo: "", cpf: "", rg: "", data_nascimento: "", sexo: "", estado_civil: "", profissao: "",
    telefone: "", whatsapp: "", email_principal: "", email_financeiro: "", email_fiscal: "", observacoes: "",
    cep: "", logradouro: "", numero: "", complemento: "", bairro: "",
    natureza_juridica: "", porte: "", data_abertura: "", capital_social: "", objeto_social: "",
    cnae_principal: "", telefone_empresa: "", email_empresa: "", site: "",
    cep_empresa: "", logradouro_empresa: "", numero_empresa: "", bairro_empresa: "", cidade_empresa: "", uf_empresa: "",
  });
  const [editTab, setEditTab] = useState<"cliente" | "endereco" | "empresa" | "config">("cliente");
  const [salvando, setSalvando] = useState(false);

  // Real data states
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [observacoes, setObservacoes] = useState("");
  const [documentos, setDocumentos] = useState<Array<{
    id: string; nome: string; categoria: string; setor: string; competencia: string | null;
    status: string; arquivo_url: string | null; arquivo_nome: string | null;
    arquivo_tipo: string | null; arquivo_tam: number | null; created_at: string;
  }>>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Load empresa
  useEffect(() => {
    buscarEmpresaTenant(empresaId)
      .then((e) => {
        setEmpresa(e);
      })
      .catch(() => {
        setEmpresa(null);
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

  // Load documentos when Documentos tab is active
  useEffect(() => {
    if (tab !== "documentos") return;
    setDocsLoading(true);
    fetch(`/api/documentos/${empresaId}`)
      .then((r) => r.json())
      .then((json) => setDocumentos(json.data ?? []))
      .catch(() => setDocumentos([]))
      .finally(() => setDocsLoading(false));
  }, [tab, empresaId]);

  async function uploadDocumento(file: File) {
    setUploading(true);
    try {
      const form = new FormData();
      form.append("arquivo", file);
      form.append("categoria", "outros");
      form.append("setor", "geral");
      const res = await fetch(`/api/documentos/${empresaId}`, { method: "POST", body: form });
      const json = await res.json();
      if (json.data) setDocumentos((prev) => [json.data, ...prev]);
    } finally {
      setUploading(false);
    }
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadDocumento);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    files.forEach(uploadDocumento);
    e.target.value = "";
  }

  function formatFileSize(bytes: number | null) {
    if (!bytes) return "—";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function abrirEdicao() {
    if (!empresa) return;
    const m = (empresa.metadata ?? {}) as Record<string, string>;
    setEditForm({
      nome_legal: empresa.nome_legal || "",
      nome_fantasia: empresa.nome_fantasia || "",
      cnpj: empresa.cnpj || "",
      regime_tributario: empresa.regime_tributario || "",
      cidade: empresa.cidade || "",
      estado: empresa.estado || "",
      status: empresa.status || "",
      nome_completo: m.nome_completo || "", cpf: m.cpf || "", rg: m.rg || "",
      data_nascimento: m.data_nascimento || "", sexo: m.sexo || "", estado_civil: m.estado_civil || "",
      profissao: m.profissao || "", telefone: m.telefone || "", whatsapp: m.whatsapp || "",
      email_principal: m.email_principal || "", email_financeiro: m.email_financeiro || "",
      email_fiscal: m.email_fiscal || "", observacoes: m.observacoes || "",
      cep: m.cep || "", logradouro: m.logradouro || "", numero: m.numero || "",
      complemento: m.complemento || "", bairro: m.bairro || "",
      natureza_juridica: m.natureza_juridica || "", porte: m.porte || "",
      data_abertura: m.data_abertura || "", capital_social: m.capital_social || "",
      objeto_social: m.objeto_social || "", cnae_principal: m.cnae_principal || "",
      telefone_empresa: m.telefone_empresa || "", email_empresa: m.email_empresa || "",
      site: m.site || "", cep_empresa: m.cep_empresa || "", logradouro_empresa: m.logradouro_empresa || "",
      numero_empresa: m.numero_empresa || "", bairro_empresa: m.bairro_empresa || "",
      cidade_empresa: m.cidade_empresa || "", uf_empresa: m.uf_empresa || "",
    });
    setEditTab("cliente");
    setEditando(true);
  }

  async function handleSalvar() {
    if (!empresa) return;
    setSalvando(true);
    try {
      const { nome_legal, nome_fantasia, cnpj, regime_tributario, cidade, estado, status, ...extras } = editForm;
      const metadata = { ...(empresa.metadata ?? {}), ...extras };
      const res = await fetch(`/api/empresas/${empresa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_legal: nome_legal || undefined,
          nome_fantasia: nome_fantasia || undefined,
          cnpj: cnpj || undefined,
          regime_tributario: regime_tributario || undefined,
          cidade: cidade || editForm.cidade_empresa || undefined,
          estado: estado || editForm.uf_empresa || undefined,
          status: (status as Empresa["status"]) || undefined,
          metadata,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setEmpresa(json.data);
        setEditando(false);
      }
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
            <h1 style={{ margin: 0, color: "#fff", fontSize: 22, fontWeight: 800 }}>{empresa.nome_legal}</h1>
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
              onClick={abrirEdicao}
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
                      {LINKS_EXTRAS.map((s) => (
                        <Link className="setor-nav-card" href={s.href(empresaId)} key={s.label}>
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
              {tab === "cliente" && (() => {
                const m = (empresa?.metadata ?? {}) as Record<string, string>;
                const temDados = !!(m.nome_completo || m.cpf || m.telefone || m.email_principal);
                const campos = [
                  { label: "Nome completo", value: m.nome_completo },
                  { label: "CPF", value: m.cpf },
                  { label: "RG", value: m.rg },
                  { label: "Data de nascimento", value: m.data_nascimento ? new Date(m.data_nascimento + "T12:00:00").toLocaleDateString("pt-BR") : "" },
                  { label: "Sexo", value: m.sexo === "M" ? "Masculino" : m.sexo === "F" ? "Feminino" : m.sexo },
                  { label: "Estado civil", value: m.estado_civil },
                  { label: "Profissão", value: m.profissao },
                  { label: "Escolaridade", value: m.escolaridade },
                  { label: "Nacionalidade", value: m.nacionalidade },
                  { label: "Naturalidade", value: m.naturalidade },
                  { label: "Renda aproximada", value: m.renda_aproximada },
                ];
                const contatos = [
                  { label: "Telefone", value: m.telefone },
                  { label: "WhatsApp", value: m.whatsapp },
                  { label: "E-mail principal", value: m.email_principal },
                  { label: "E-mail financeiro", value: m.email_financeiro },
                  { label: "E-mail fiscal", value: m.email_fiscal },
                  { label: "Contato de emergência", value: m.contato_emergencia },
                ];
                const endereco = [
                  { label: "CEP", value: m.cep },
                  { label: "Logradouro", value: m.logradouro },
                  { label: "Número", value: m.numero },
                  { label: "Complemento", value: m.complemento },
                  { label: "Bairro", value: m.bairro },
                  { label: "Cidade", value: empresa?.cidade },
                  { label: "UF", value: empresa?.estado },
                ];
                return (
                  <div style={{ display: "grid", gap: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                      <div>
                        <h3 style={sectionTitle}>Dados do cliente / proprietário</h3>
                        <p style={sectionSubtitle}>Informações do responsável legal da empresa</p>
                      </div>
                      <button className="small-action" type="button" onClick={abrirEdicao}>Editar dados</button>
                    </div>

                    {!temDados ? (
                      <EmptyState
                        titulo="Nenhum dado de cliente cadastrado"
                        descricao="Clique em 'Editar dados' para preencher as informações do proprietário"
                      />
                    ) : (
                      <>
                        <div>
                          <div style={{ ...infoLabel, marginBottom: 10 }}>Dados pessoais</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                            {campos.filter((c) => c.value).map((c) => (
                              <div key={c.label} style={infoCard}>
                                <div style={infoLabel}>{c.label}</div>
                                <div style={infoValue}>{c.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div style={{ ...infoLabel, marginBottom: 10 }}>Contato</div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                            {contatos.filter((c) => c.value).map((c) => (
                              <div key={c.label} style={infoCard}>
                                <div style={infoLabel}>{c.label}</div>
                                <div style={infoValue}>{c.value}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {endereco.some((c) => c.value) && (
                          <div>
                            <div style={{ ...infoLabel, marginBottom: 10 }}>Endereço</div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                              {endereco.filter((c) => c.value).map((c) => (
                                <div key={c.label} style={infoCard}>
                                  <div style={infoLabel}>{c.label}</div>
                                  <div style={infoValue}>{c.value}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {m.observacoes && (
                          <div>
                            <div style={{ ...infoLabel, marginBottom: 10 }}>Observações</div>
                            <div style={{ ...infoCard, whiteSpace: "pre-wrap" as const, fontSize: 14 }}>{m.observacoes}</div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })()}

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
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                    <div>
                      <h3 style={sectionTitle}>Documentos da empresa</h3>
                      <p style={sectionSubtitle}>Organizados por competência e setor</p>
                    </div>
                    <label style={{
                      display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
                      border: "1.5px solid var(--green-500)", borderRadius: 8, padding: "8px 16px",
                      fontSize: 13, fontWeight: 700, color: "var(--green-700)", background: "var(--panel)",
                    }}>
                      + Enviar documento
                      <input type="file" multiple accept=".pdf,.xml,.jpg,.jpeg,.png,.zip,.xlsx,.xls,.csv"
                        style={{ display: "none" }} onChange={handleFileSelect} />
                    </label>
                  </div>

                  {/* Upload area - drag and drop */}
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={handleFileDrop}
                    onClick={() => {
                      const inp = document.createElement("input");
                      inp.type = "file"; inp.multiple = true;
                      inp.accept = ".pdf,.xml,.jpg,.jpeg,.png,.zip,.xlsx,.xls,.csv";
                      inp.onchange = (e) => {
                        const files = Array.from((e.target as HTMLInputElement).files ?? []);
                        files.forEach(uploadDocumento);
                      };
                      inp.click();
                    }}
                    style={{
                      border: `2px dashed ${dragOver ? "var(--green-500)" : "var(--border)"}`,
                      borderRadius: 12, padding: "28px 20px", textAlign: "center" as const,
                      background: dragOver ? "#ecfdf5" : "var(--bg)", cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {uploading ? (
                      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--green-700)" }}>Enviando...</div>
                    ) : (
                      <>
                        <div style={{ fontSize: 28, marginBottom: 6 }}>+</div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--ink)", marginBottom: 4 }}>
                          Arraste arquivos aqui ou clique para selecionar
                        </div>
                        <div style={{ fontSize: 12, color: "var(--muted)" }}>
                          PDF, XML, imagens, Excel, ZIP — até 10 MB por arquivo
                        </div>
                      </>
                    )}
                  </div>

                  {/* Document list */}
                  {docsLoading ? (
                    <div style={{ textAlign: "center" as const, padding: 32, color: "var(--muted)" }}>Carregando...</div>
                  ) : documentos.length === 0 ? (
                    <EmptyState
                      titulo="Nenhum documento cadastrado"
                      descricao="Envie arquivos arrastando ou clicando na área acima"
                    />
                  ) : (
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Documento", "Categoria", "Setor", "Tamanho", "Status", "Data"].map((h) => (
                              <th key={h} style={thStyle}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {documentos.map((doc) => {
                            const statusColors: Record<string, { color: string; bg: string }> = {
                              recebido: { color: "#0e7490", bg: "#ecfeff" },
                              conferido: { color: "#065f46", bg: "#f0fdf4" },
                              processado: { color: "#6b21a8", bg: "#faf5ff" },
                              pendente: { color: "#92400e", bg: "#fffbeb" },
                              rejeitado: { color: "#dc2626", bg: "#fef2f2" },
                              arquivado: { color: "#6b7280", bg: "#f3f4f6" },
                            };
                            const sc = statusColors[doc.status] ?? { color: "#6b7280", bg: "#f3f4f6" };
                            return (
                              <tr key={doc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>
                                  {doc.arquivo_url ? (
                                    <a href={doc.arquivo_url} target="_blank" rel="noopener noreferrer"
                                      style={{ color: "var(--green-700)", textDecoration: "underline" }}>
                                      {doc.nome}
                                    </a>
                                  ) : doc.nome}
                                </td>
                                <td style={tdStyle}>{doc.categoria}</td>
                                <td style={tdStyle}>{doc.setor}</td>
                                <td style={tdStyle}>{formatFileSize(doc.arquivo_tam)}</td>
                                <td style={tdStyle}>
                                  <StatusBadge label={doc.status} color={sc.color} bg={sc.bg} />
                                </td>
                                <td style={tdStyle}>
                                  {new Date(doc.created_at).toLocaleDateString("pt-BR")}
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
      {/* ── Modal de edicao completo ── */}
      {editando && (() => {
        const lbl: React.CSSProperties = { display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase", marginBottom: 4 };
        const inp: React.CSSProperties = { width: "100%", padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" };
        const sel: React.CSSProperties = { ...inp, background: "#fff", cursor: "pointer" };
        const row2: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
        const row3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 };
        const ef = editForm;
        const s = (k: string, v: string) => setEditForm(prev => ({ ...prev, [k]: v }));
        const F = ({ k, label, placeholder, type }: { k: string; label: string; placeholder?: string; type?: string }) => (
          <div>
            <label style={lbl}>{label}</label>
            <input style={inp} value={(ef as Record<string, string>)[k] || ""} onChange={e => s(k, e.target.value)} placeholder={placeholder} type={type || "text"} />
          </div>
        );
        const EDIT_TABS = [
          { id: "cliente" as const, label: "Dados do Cliente" },
          { id: "endereco" as const, label: "Endereco" },
          { id: "empresa" as const, label: "Dados Empresariais" },
          { id: "config" as const, label: "Configuracoes" },
        ];
        return (
          <div onClick={() => setEditando(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
            <div onClick={(e) => e.stopPropagation()} style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 680, maxHeight: "88vh", overflow: "auto", padding: "1.75rem 2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.15rem", color: "#07170d", fontWeight: 800 }}>Editar empresa</h3>
                <button onClick={() => setEditando(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#9ca3af", cursor: "pointer" }} type="button">x</button>
              </div>

              {/* Tabs */}
              <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #dfece5", marginBottom: "1.25rem" }}>
                {EDIT_TABS.map(t => (
                  <button key={t.id} onClick={() => setEditTab(t.id)} type="button" style={{
                    padding: "0.55rem 1rem", fontSize: "0.78rem", fontWeight: editTab === t.id ? 800 : 500,
                    color: editTab === t.id ? "#065f46" : "#6f8f7c", background: "transparent", border: "none",
                    borderBottom: editTab === t.id ? "2px solid #10b981" : "2px solid transparent",
                    marginBottom: -2, cursor: "pointer",
                  }}>{t.label}</button>
                ))}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

                {/* ── DADOS DO CLIENTE ── */}
                {editTab === "cliente" && (<>
                  <div style={row2}>
                    <F k="nome_completo" label="Nome completo" placeholder="Nome completo" />
                    <F k="cpf" label="CPF" placeholder="000.000.000-00" />
                  </div>
                  <div style={row3}>
                    <F k="rg" label="RG" placeholder="RG" />
                    <F k="data_nascimento" label="Data de nascimento" type="date" />
                    <div>
                      <label style={lbl}>Sexo</label>
                      <select style={sel} value={ef.sexo} onChange={e => s("sexo", e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="M">Masculino</option>
                        <option value="F">Feminino</option>
                        <option value="Outro">Outro</option>
                      </select>
                    </div>
                  </div>
                  <div style={row2}>
                    <div>
                      <label style={lbl}>Estado civil</label>
                      <select style={sel} value={ef.estado_civil} onChange={e => s("estado_civil", e.target.value)}>
                        <option value="">Selecione</option>
                        {["Solteiro(a)","Casado(a)","Divorciado(a)","Viuvo(a)","Uniao estavel"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <F k="profissao" label="Profissao" placeholder="Profissao atual" />
                  </div>
                  <div style={row3}>
                    <F k="telefone" label="Telefone" placeholder="(00) 00000-0000" />
                    <F k="whatsapp" label="WhatsApp" placeholder="(00) 00000-0000" />
                    <F k="email_principal" label="E-mail principal" placeholder="email@exemplo.com" />
                  </div>
                  <div style={row2}>
                    <F k="email_financeiro" label="E-mail financeiro" placeholder="financeiro@..." />
                    <F k="email_fiscal" label="E-mail fiscal" placeholder="fiscal@..." />
                  </div>
                  <div>
                    <label style={lbl}>Observacoes</label>
                    <textarea style={{ ...inp, minHeight: 70, resize: "vertical" }} value={ef.observacoes} onChange={e => s("observacoes", e.target.value)} placeholder="Anotacoes sobre o cliente..." />
                  </div>
                </>)}

                {/* ── ENDERECO ── */}
                {editTab === "endereco" && (<>
                  <h4 style={{ margin: "0 0 4px", fontSize: "0.85rem", color: "#07170d" }}>Endereco do responsavel</h4>
                  <div style={row3}>
                    <F k="cep" label="CEP" placeholder="00000-000" />
                    <F k="logradouro" label="Logradouro" placeholder="Rua, Av..." />
                    <F k="numero" label="Numero" placeholder="No" />
                  </div>
                  <div style={row3}>
                    <F k="complemento" label="Complemento" placeholder="Apto, Sala..." />
                    <F k="bairro" label="Bairro" placeholder="Bairro" />
                    <F k="cidade" label="Cidade" placeholder="Cidade" />
                  </div>
                  <div style={row2}>
                    <F k="estado" label="UF" placeholder="SP" />
                    <div />
                  </div>

                  <h4 style={{ margin: "12px 0 4px", fontSize: "0.85rem", color: "#07170d", borderTop: "1px solid #dfece5", paddingTop: 12 }}>Endereco da empresa</h4>
                  <div style={row3}>
                    <F k="cep_empresa" label="CEP" placeholder="00000-000" />
                    <F k="logradouro_empresa" label="Logradouro" placeholder="Rua, Av..." />
                    <F k="numero_empresa" label="Numero" placeholder="No" />
                  </div>
                  <div style={row3}>
                    <F k="bairro_empresa" label="Bairro" placeholder="Bairro" />
                    <F k="cidade_empresa" label="Cidade" placeholder="Cidade" />
                    <F k="uf_empresa" label="UF" placeholder="SP" />
                  </div>
                </>)}

                {/* ── DADOS EMPRESARIAIS ── */}
                {editTab === "empresa" && (<>
                  <div style={row2}>
                    <F k="nome_legal" label="Razao social" placeholder="Nome legal da empresa" />
                    <F k="nome_fantasia" label="Nome fantasia" placeholder="Nome fantasia" />
                  </div>
                  <div style={row3}>
                    <F k="cnpj" label="CNPJ" placeholder="00.000.000/0001-00" />
                    <div>
                      <label style={lbl}>Natureza juridica</label>
                      <select style={sel} value={ef.natureza_juridica} onChange={e => s("natureza_juridica", e.target.value)}>
                        <option value="">Selecione</option>
                        {["MEI","EI","SLU","LTDA","S/A","Simples"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={lbl}>Porte</label>
                      <select style={sel} value={ef.porte} onChange={e => s("porte", e.target.value)}>
                        <option value="">Selecione</option>
                        {["MEI","ME","EPP","Medio","Grande"].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={row3}>
                    <div>
                      <label style={lbl}>Regime tributario</label>
                      <select style={sel} value={ef.regime_tributario} onChange={e => s("regime_tributario", e.target.value)}>
                        <option value="">Selecione</option>
                        <option value="mei">MEI</option>
                        <option value="simples">Simples Nacional</option>
                        <option value="presumido">Lucro Presumido</option>
                        <option value="real">Lucro Real</option>
                      </select>
                    </div>
                    <F k="data_abertura" label="Data de abertura" type="date" />
                    <F k="capital_social" label="Capital social" placeholder="R$ 0,00" />
                  </div>
                  <F k="objeto_social" label="Objeto social" placeholder="Descricao da atividade da empresa" />
                  <div style={row2}>
                    <F k="cnae_principal" label="CNAE principal" placeholder="0000-0/00" />
                    <F k="telefone_empresa" label="Telefone da empresa" placeholder="(00) 0000-0000" />
                  </div>
                  <div style={row2}>
                    <F k="email_empresa" label="E-mail da empresa" placeholder="contato@empresa.com" />
                    <F k="site" label="Site" placeholder="www.empresa.com.br" />
                  </div>
                </>)}

                {/* ── CONFIGURACOES ── */}
                {editTab === "config" && (<>
                  <div>
                    <label style={lbl}>Status da empresa</label>
                    <select style={sel} value={ef.status} onChange={e => s("status", e.target.value)}>
                      <option value="ativa">Ativa</option>
                      <option value="suspensa">Suspensa</option>
                      <option value="cancelada">Cancelada</option>
                      <option value="encerrada">Encerrada</option>
                    </select>
                  </div>
                </>)}

                <button
                  disabled={salvando || !editForm.nome_legal}
                  onClick={handleSalvar}
                  style={{ width: "100%", padding: "0.7rem", background: !editForm.nome_legal ? "#d1d5db" : "linear-gradient(135deg, #065f46, #10b981)", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.875rem", fontWeight: 700, cursor: !editForm.nome_legal ? "not-allowed" : "pointer", opacity: salvando ? 0.7 : 1, marginTop: 8 }}
                  type="button"
                >
                  {salvando ? "Salvando..." : "Salvar alteracoes"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </AppShell>
  );
}
