"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  listarCertificados,
  criarCertificado,
  excluirCertificado,
  listarRenovacoes,
  criarRenovacao,
  listarHistoricoCertificados,
} from "@/services/certificadoClientService";
import { listarEmpresasTenant } from "@/services/empresaClientService";
import type { Certificado, CertificadoRenovacao, CertificadoHistorico } from "@/modules/certificados/certificados.types";
import type { Empresa } from "@/modules/empresas/empresas.types";

/* ─── Tipos ───────────────────────────────────────────────────── */

type Tab = "dashboard" | "certificados" | "renovacao" | "instalacoes" | "historico";

/* ─── Estilos de status ───────────────────────────────────────── */

const S_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  ativo:                { bg: "#f0fdf4", color: "#065f46", label: "Ativo" },
  proximo_vencimento:   { bg: "#fffbeb", color: "#92400e", label: "Prox. Vencimento" },
  renovando:            { bg: "#ecfeff", color: "#0e7490", label: "Renovando" },
  vencido:              { bg: "#fef2f2", color: "#b91c1c", label: "Vencido" },
  suspenso:             { bg: "#f3f4f6", color: "#6b7280", label: "Suspenso" },
  revogado:             { bg: "#e5e7eb", color: "#374151", label: "Revogado" },
};

const S_RENOVACAO: Record<string, { bg: string; color: string }> = {
  pendente:             { bg: "#fffbeb", color: "#92400e" },
  cliente_avisado:      { bg: "#eff6ff", color: "#1e40af" },
  aprovado:             { bg: "#ecfeff", color: "#0e7490" },
  emitido:              { bg: "#f5f3ff", color: "#7c3aed" },
  validado:             { bg: "#f0fdf4", color: "#065f46" },
  concluido:            { bg: "#e8f5e9", color: "#1b5e20" },
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

function TD({ children, right, mono }: { children: React.ReactNode; right?: boolean; mono?: boolean }) {
  return (
    <td
      style={{
        padding: "10px 14px",
        fontSize: "0.85rem",
        color: "#334155",
        borderBottom: "1px solid #f1f5f9",
        textAlign: right ? "right" : "left",
        fontFamily: mono ? "var(--font-mono, monospace)" : "inherit",
      }}
    >
      {children}
    </td>
  );
}

function formatDate(dateStr: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("pt-BR");
  } catch {
    return dateStr;
  }
}

function formatDateTime(dateStr: string) {
  if (!dateStr) return "—";
  try {
    const d = new Date(dateStr);
    return d.toLocaleString("pt-BR");
  } catch {
    return dateStr;
  }
}

function diasRestantesColor(dias: number): string {
  if (dias <= 0) return "#b91c1c";
  if (dias <= 30) return "#b91c1c";
  if (dias <= 60) return "#92400e";
  return "#065f46";
}

/* ─── Tabs ───────────────────────────────────────────────────── */

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard",    label: "Dashboard" },
  { key: "certificados", label: "Certificados" },
  { key: "renovacao",    label: "Renovacao" },
  { key: "instalacoes",  label: "Instalacoes" },
  { key: "historico",    label: "Historico" },
];

/* ─── Componente principal ───────────────────────────────────── */

export default function CertificadosPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [renovacoes, setRenovacoes] = useState<CertificadoRenovacao[]>([]);
  const [historico, setHistorico] = useState<CertificadoHistorico[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingRenovacoes, setLoadingRenovacoes] = useState(false);
  const [loadingHistorico, setLoadingHistorico] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("Todos");
  const [filtroStatus, setFiltroStatus] = useState("Todos");

  // Form state
  const [formStep, setFormStep] = useState(1);
  const [formData, setFormData] = useState({
    empresa_id: "",
    tipo: "A1",
    titular: "",
    documento: "",
    email: "",
    telefone: "",
    numero_serie: "",
    fornecedor: "",
    emissao: "",
    validade: "",
    observacoes: "",
    responsavel: "",
  });
  const [alertDias, setAlertDias] = useState<number[]>([30, 15, 7]);
  const [alertCanais, setAlertCanais] = useState<string[]>(["Sistema"]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Load certificados
  useEffect(() => {
    loadCertificados();
  }, []);

  // Load tab-specific data
  useEffect(() => {
    if (tab === "renovacao" && renovacoes.length === 0 && !loadingRenovacoes) {
      loadRenovacoes();
    }
    if (tab === "historico" && historico.length === 0 && !loadingHistorico) {
      loadHistorico();
    }
  }, [tab]);

  async function loadCertificados() {
    setLoading(true);
    setError(null);
    try {
      const data = await listarCertificados();
      setCertificados(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar certificados.");
    } finally {
      setLoading(false);
    }
  }

  async function loadRenovacoes() {
    setLoadingRenovacoes(true);
    try {
      const data = await listarRenovacoes();
      setRenovacoes(data);
    } catch (err) {
      console.error("Erro ao carregar renovacoes:", err);
    } finally {
      setLoadingRenovacoes(false);
    }
  }

  async function loadHistorico() {
    setLoadingHistorico(true);
    try {
      const data = await listarHistoricoCertificados();
      setHistorico(data);
    } catch (err) {
      console.error("Erro ao carregar historico:", err);
    } finally {
      setLoadingHistorico(false);
    }
  }

  async function loadEmpresas() {
    try {
      const data = await listarEmpresasTenant();
      setEmpresas(data);
    } catch (err) {
      console.error("Erro ao carregar empresas:", err);
    }
  }

  function handleOpenForm() {
    setShowForm(true);
    setFormStep(1);
    setFormData({
      empresa_id: "",
      tipo: "A1",
      titular: "",
      documento: "",
      email: "",
      telefone: "",
      numero_serie: "",
      fornecedor: "",
      emissao: "",
      validade: "",
      observacoes: "",
      responsavel: "",
    });
    setAlertDias([30, 15, 7]);
    setAlertCanais(["Sistema"]);
    setFormError(null);
    loadEmpresas();
  }

  async function handleSubmitForm() {
    if (!formData.titular || !formData.documento || !formData.emissao || !formData.validade || !formData.empresa_id) {
      setFormError("Preencha todos os campos obrigatorios: empresa, titular, documento, emissao e validade.");
      return;
    }
    setSubmitting(true);
    setFormError(null);
    try {
      await criarCertificado({
        empresa_id: formData.empresa_id,
        tipo: formData.tipo,
        titular: formData.titular,
        documento: formData.documento,
        email: formData.email || undefined,
        telefone: formData.telefone || undefined,
        numero_serie: formData.numero_serie || undefined,
        fornecedor: formData.fornecedor || undefined,
        emissao: formData.emissao,
        validade: formData.validade,
        observacoes: formData.observacoes || undefined,
        responsavel: formData.responsavel || undefined,
      });
      setShowForm(false);
      await loadCertificados();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Erro ao criar certificado.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleExcluir(id: string) {
    if (!confirm("Tem certeza que deseja excluir este certificado?")) return;
    try {
      await excluirCertificado(id);
      await loadCertificados();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao excluir.");
    }
  }

  async function handleSolicitarRenovacao(cert: Certificado) {
    try {
      await criarRenovacao({
        certificado_id: cert.id,
        empresa_id: cert.empresa_id,
        status: "pendente",
        responsavel: cert.responsavel || undefined,
      });
      alert("Renovacao solicitada com sucesso!");
      await loadRenovacoes();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao solicitar renovacao.");
    }
  }

  // KPI calculations
  const kpiAtivos = certificados.filter((c) => c.status === "ativo").length;
  const kpiVencendo30 = certificados.filter((c) => c.dias_restantes <= 30 && c.dias_restantes > 0).length;
  const kpiVencendo7 = certificados.filter((c) => c.dias_restantes <= 7 && c.dias_restantes > 0).length;
  const kpiVencidos = certificados.filter((c) => c.dias_restantes <= 0).length;
  const kpiRenovando = certificados.filter((c) => c.status === "renovando").length;

  // Filtered certificados
  const certificadosFiltrados = certificados.filter((c) => {
    const matchSearch =
      !search ||
      c.titular.toLowerCase().includes(search.toLowerCase()) ||
      c.documento.toLowerCase().includes(search.toLowerCase()) ||
      (c.empresas?.nome_legal ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.fornecedor ?? "").toLowerCase().includes(search.toLowerCase());
    const matchTipo = filtroTipo === "Todos" || c.tipo === filtroTipo;
    const matchStatus = filtroStatus === "Todos" || c.status === filtroStatus;
    return matchSearch && matchTipo && matchStatus;
  });

  // Sorted by validade for dashboard
  const certsSortedByValidade = [...certificados].sort(
    (a, b) => new Date(a.validade).getTime() - new Date(b.validade).getTime(),
  );

  return (
    <AppShell>
      <div className="page-stack">
        {/* ── Hero ─────────────────────────────────── */}
        <section className="module-hero">
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Certificados Digitais</h2>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.95rem" }}>
              Gestao, renovacao e monitoramento de certificados digitais
            </p>
          </div>
          <button
            onClick={handleOpenForm}
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
            }}
          >
            + Novo Certificado
          </button>
        </section>

        {/* ── Inline form ─────────────────────────── */}
        {showForm && (
          <FormNovoCertificado
            empresas={empresas}
            formStep={formStep}
            setFormStep={setFormStep}
            formData={formData}
            setFormData={setFormData}
            alertDias={alertDias}
            setAlertDias={setAlertDias}
            alertCanais={alertCanais}
            setAlertCanais={setAlertCanais}
            submitting={submitting}
            formError={formError}
            onSubmit={handleSubmitForm}
            onCancel={() => setShowForm(false)}
          />
        )}

        {/* ── Tabs ─────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e2e8f0", marginBottom: 8 }}>
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
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Error ────────────────────────────────── */}
        {error && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              padding: "12px 16px",
              color: "#b91c1c",
              fontSize: "0.85rem",
              marginBottom: 12,
            }}
          >
            {error}
          </div>
        )}

        {/* ── Tab content ─────────────────────────── */}
        {tab === "dashboard" && (
          <TabDashboard
            loading={loading}
            certificados={certsSortedByValidade}
            kpiAtivos={kpiAtivos}
            kpiVencendo30={kpiVencendo30}
            kpiVencendo7={kpiVencendo7}
            kpiVencidos={kpiVencidos}
            kpiRenovando={kpiRenovando}
            onNovoCertificado={handleOpenForm}
          />
        )}
        {tab === "certificados" && (
          <TabCertificados
            loading={loading}
            certificados={certificadosFiltrados}
            search={search}
            setSearch={setSearch}
            filtroTipo={filtroTipo}
            setFiltroTipo={setFiltroTipo}
            filtroStatus={filtroStatus}
            setFiltroStatus={setFiltroStatus}
            onExcluir={handleExcluir}
            onSolicitarRenovacao={handleSolicitarRenovacao}
            onNovoCertificado={handleOpenForm}
          />
        )}
        {tab === "renovacao" && (
          <TabRenovacao loading={loadingRenovacoes} renovacoes={renovacoes} />
        )}
        {tab === "instalacoes" && <TabInstalacoes />}
        {tab === "historico" && (
          <TabHistorico loading={loadingHistorico} historico={historico} />
        )}
      </div>
    </AppShell>
  );
}

/* ─── Tab: Dashboard ─────────────────────────────────────────── */

function TabDashboard({
  loading,
  certificados,
  kpiAtivos,
  kpiVencendo30,
  kpiVencendo7,
  kpiVencidos,
  kpiRenovando,
  onNovoCertificado,
}: {
  loading: boolean;
  certificados: Certificado[];
  kpiAtivos: number;
  kpiVencendo30: number;
  kpiVencendo7: number;
  kpiVencidos: number;
  kpiRenovando: number;
  onNovoCertificado: () => void;
}) {
  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Carregando...</div>;
  }

  return (
    <>
      {/* KPIs */}
      <div className="kpi-strip">
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Ativos</span>
          <strong style={{ fontSize: "1.6rem", color: "#065f46" }}>{kpiAtivos}</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Vencendo 30d</span>
          <strong style={{ fontSize: "1.6rem", color: "#92400e" }}>{kpiVencendo30}</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Vencendo 7d</span>
          <strong style={{ fontSize: "1.6rem", color: "#b91c1c" }}>{kpiVencendo7}</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Vencidos</span>
          <strong style={{ fontSize: "1.6rem", color: "#b91c1c" }}>{kpiVencidos}</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Renovando</span>
          <strong style={{ fontSize: "1.6rem", color: "#0e7490" }}>{kpiRenovando}</strong>
        </div>
      </div>

      {/* Table */}
      {certificados.length === 0 ? (
        <div className="list-panel" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "#64748b", margin: "0 0 16px" }}>Nenhum certificado cadastrado</p>
          <button
            onClick={onNovoCertificado}
            style={{
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Novo Certificado
          </button>
        </div>
      ) : (
        <div className="list-panel">
          <div className="list-panel-header">
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Todos os certificados</h3>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
              Ordenados por validade (mais proximos primeiro)
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Empresa</TH>
                  <TH>Titular</TH>
                  <TH>Tipo</TH>
                  <TH>Validade</TH>
                  <TH right>Dias</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {certificados.map((c) => {
                  const st = S_STATUS[c.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: c.status };
                  return (
                    <tr key={c.id} style={{ transition: "background 0.1s" }}>
                      <TD>{c.empresas?.nome_legal ?? "—"}</TD>
                      <TD>{c.titular}</TD>
                      <TD>
                        <Badge bg="#eff6ff" color="#1e40af" label={c.tipo} />
                      </TD>
                      <TD>{formatDate(c.validade)}</TD>
                      <TD right>
                        <span style={{ fontWeight: 700, color: diasRestantesColor(c.dias_restantes) }}>
                          {c.dias_restantes}
                        </span>
                      </TD>
                      <TD>
                        <Badge bg={st.bg} color={st.color} label={st.label} />
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Tab: Certificados ──────────────────────────────────────── */

function TabCertificados({
  loading,
  certificados,
  search,
  setSearch,
  filtroTipo,
  setFiltroTipo,
  filtroStatus,
  setFiltroStatus,
  onExcluir,
  onSolicitarRenovacao,
  onNovoCertificado,
}: {
  loading: boolean;
  certificados: Certificado[];
  search: string;
  setSearch: (v: string) => void;
  filtroTipo: string;
  setFiltroTipo: (v: string) => void;
  filtroStatus: string;
  setFiltroStatus: (v: string) => void;
  onExcluir: (id: string) => void;
  onSolicitarRenovacao: (cert: Certificado) => void;
  onNovoCertificado: () => void;
}) {
  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Carregando...</div>;
  }

  const tipos = ["Todos", "A1", "A3", "eCPF", "eCNPJ", "Representante"];
  const statuses = ["Todos", "ativo", "proximo_vencimento", "renovando", "vencido", "suspenso", "revogado"];

  return (
    <>
      {/* Filters */}
      <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Buscar por titular, documento, empresa..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: "1 1 250px",
            padding: "8px 14px",
            fontSize: "0.85rem",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            outline: "none",
          }}
        />
        <select
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
          style={{
            padding: "8px 14px",
            fontSize: "0.85rem",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {tipos.map((t) => (
            <option key={t} value={t}>{t === "Todos" ? "Tipo: Todos" : t}</option>
          ))}
        </select>
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          style={{
            padding: "8px 14px",
            fontSize: "0.85rem",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            background: "#fff",
            cursor: "pointer",
          }}
        >
          {statuses.map((s) => (
            <option key={s} value={s}>
              {s === "Todos" ? "Status: Todos" : (S_STATUS[s]?.label ?? s)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {certificados.length === 0 ? (
        <div className="list-panel" style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: "#64748b", margin: "0 0 16px" }}>Nenhum certificado encontrado</p>
          <button
            onClick={onNovoCertificado}
            style={{
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            + Novo Certificado
          </button>
        </div>
      ) : (
        <div className="list-panel">
          <div className="list-panel-header">
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Certificados</h3>
            <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
              {certificados.length} certificado{certificados.length !== 1 ? "s" : ""}
            </span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Empresa</TH>
                  <TH>Titular</TH>
                  <TH>Documento</TH>
                  <TH>Tipo</TH>
                  <TH>Fornecedor</TH>
                  <TH>Emissao</TH>
                  <TH>Validade</TH>
                  <TH right>Dias</TH>
                  <TH>Status</TH>
                  <TH>Acoes</TH>
                </tr>
              </thead>
              <tbody>
                {certificados.map((c) => {
                  const st = S_STATUS[c.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: c.status };
                  return (
                    <tr key={c.id} style={{ transition: "background 0.1s" }}>
                      <TD>{c.empresas?.nome_legal ?? "—"}</TD>
                      <TD>{c.titular}</TD>
                      <TD mono>{c.documento}</TD>
                      <TD>
                        <Badge bg="#eff6ff" color="#1e40af" label={c.tipo} />
                      </TD>
                      <TD>{c.fornecedor ?? "—"}</TD>
                      <TD>{formatDate(c.emissao)}</TD>
                      <TD>{formatDate(c.validade)}</TD>
                      <TD right>
                        <span style={{ fontWeight: 700, color: diasRestantesColor(c.dias_restantes) }}>
                          {c.dias_restantes}
                        </span>
                      </TD>
                      <TD>
                        <Badge bg={st.bg} color={st.color} label={st.label} />
                      </TD>
                      <TD>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            onClick={() => onSolicitarRenovacao(c)}
                            style={{
                              padding: "4px 10px",
                              fontSize: "0.73rem",
                              fontWeight: 600,
                              border: "1px solid #e2e8f0",
                              borderRadius: 6,
                              background: "#f8fafc",
                              color: "#0f172a",
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Renovar
                          </button>
                          <button
                            onClick={() => onExcluir(c.id)}
                            style={{
                              padding: "4px 10px",
                              fontSize: "0.73rem",
                              fontWeight: 600,
                              border: "1px solid #fecaca",
                              borderRadius: 6,
                              background: "#fef2f2",
                              color: "#b91c1c",
                              cursor: "pointer",
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

/* ─── Tab: Renovacao ─────────────────────────────────────────── */

function TabRenovacao({
  loading,
  renovacoes,
}: {
  loading: boolean;
  renovacoes: CertificadoRenovacao[];
}) {
  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Carregando...</div>;
  }

  if (renovacoes.length === 0) {
    return (
      <div className="list-panel" style={{ textAlign: "center", padding: 40 }}>
        <p style={{ color: "#64748b", margin: 0 }}>Nenhuma renovacao registrada</p>
      </div>
    );
  }

  const statusLabels: Record<string, string> = {
    pendente: "Pendente",
    cliente_avisado: "Cliente avisado",
    aprovado: "Aprovado",
    emitido: "Emitido",
    validado: "Validado",
    concluido: "Concluido",
  };

  return (
    <div className="list-panel">
      <div className="list-panel-header">
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Renovacoes de certificados</h3>
        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
          Acompanhe o fluxo de renovacao
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>Empresa</TH>
              <TH>Certificado</TH>
              <TH>Prazo</TH>
              <TH>Responsavel</TH>
              <TH>Status</TH>
            </tr>
          </thead>
          <tbody>
            {renovacoes.map((r) => {
              const st = S_RENOVACAO[r.status] ?? { bg: "#f3f4f6", color: "#6b7280" };
              const label = statusLabels[r.status] ?? r.status;
              return (
                <tr key={r.id}>
                  <TD>{r.empresas?.nome_legal ?? "—"}</TD>
                  <TD>
                    {r.certificados
                      ? `${r.certificados.titular} (${r.certificados.tipo})`
                      : "—"}
                  </TD>
                  <TD>{r.prazo ? formatDate(r.prazo) : "—"}</TD>
                  <TD>{r.responsavel ?? "—"}</TD>
                  <TD>
                    <Badge bg={st.bg} color={st.color} label={label} />
                  </TD>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tab: Instalacoes ───────────────────────────────────────── */

function TabInstalacoes() {
  return (
    <div className="list-panel" style={{ textAlign: "center", padding: 40 }}>
      <p style={{ color: "#64748b", margin: 0 }}>Nenhuma instalacao registrada</p>
    </div>
  );
}

/* ─── Tab: Historico ─────────────────────────────────────────── */

function TabHistorico({
  loading,
  historico,
}: {
  loading: boolean;
  historico: CertificadoHistorico[];
}) {
  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>Carregando...</div>;
  }

  if (historico.length === 0) {
    return (
      <div className="list-panel" style={{ textAlign: "center", padding: 40 }}>
        <p style={{ color: "#64748b", margin: 0 }}>Nenhum registro no historico</p>
      </div>
    );
  }

  return (
    <div className="list-panel">
      <div className="list-panel-header">
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Historico de certificados</h3>
        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
          Timeline de acoes realizadas
        </span>
      </div>
      <div style={{ padding: "16px 20px" }}>
        {historico.map((h, i) => (
          <div
            key={h.id}
            style={{
              display: "flex",
              gap: 16,
              padding: "14px 0",
              borderBottom: i < historico.length - 1 ? "1px solid #f1f5f9" : "none",
            }}
          >
            {/* Timeline dot */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 20 }}>
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: "#0f172a",
                  marginTop: 4,
                }}
              />
              {i < historico.length - 1 && (
                <div style={{ width: 2, flex: 1, background: "#e2e8f0", marginTop: 4 }} />
              )}
            </div>
            {/* Content */}
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <strong style={{ fontSize: "0.88rem", color: "#0f172a" }}>{h.acao}</strong>
                {h.usuario && (
                  <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>por {h.usuario}</span>
                )}
              </div>
              {h.descricao && (
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "2px 0 0" }}>{h.descricao}</p>
              )}
              <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                {formatDateTime(h.created_at)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Form: Novo Certificado ─────────────────────────────────── */

function FormNovoCertificado({
  empresas,
  formStep,
  setFormStep,
  formData,
  setFormData,
  alertDias,
  setAlertDias,
  alertCanais,
  setAlertCanais,
  submitting,
  formError,
  onSubmit,
  onCancel,
}: {
  empresas: Empresa[];
  formStep: number;
  setFormStep: (v: number) => void;
  formData: {
    empresa_id: string;
    tipo: string;
    titular: string;
    documento: string;
    email: string;
    telefone: string;
    numero_serie: string;
    fornecedor: string;
    emissao: string;
    validade: string;
    observacoes: string;
    responsavel: string;
  };
  setFormData: (v: typeof formData) => void;
  alertDias: number[];
  setAlertDias: (v: number[]) => void;
  alertCanais: string[];
  setAlertCanais: (v: string[]) => void;
  submitting: boolean;
  formError: string | null;
  onSubmit: () => void;
  onCancel: () => void;
}) {
  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.8rem",
    fontWeight: 600,
    color: "#374151",
    marginBottom: 4,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    fontSize: "0.85rem",
    border: "1px solid #e2e8f0",
    borderRadius: 8,
    outline: "none",
    boxSizing: "border-box",
  };

  function toggleDia(d: number) {
    setAlertDias(
      alertDias.includes(d) ? alertDias.filter((x) => x !== d) : [...alertDias, d],
    );
  }

  function toggleCanal(c: string) {
    setAlertCanais(
      alertCanais.includes(c) ? alertCanais.filter((x) => x !== c) : [...alertCanais, c],
    );
  }

  const stepIndicator = (step: number, label: string) => (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        cursor: "pointer",
      }}
      onClick={() => setFormStep(step)}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: formStep >= step ? "#0f172a" : "#e2e8f0",
          color: formStep >= step ? "#fff" : "#64748b",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "0.78rem",
          fontWeight: 700,
        }}
      >
        {step}
      </div>
      <span
        style={{
          fontSize: "0.82rem",
          fontWeight: formStep === step ? 700 : 500,
          color: formStep === step ? "#0f172a" : "#64748b",
        }}
      >
        {label}
      </span>
    </div>
  );

  return (
    <div
      style={{
        background: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: 12,
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700 }}>Novo Certificado Digital</h3>
        <button
          onClick={onCancel}
          style={{
            background: "none",
            border: "1px solid #e2e8f0",
            borderRadius: 6,
            padding: "6px 14px",
            fontSize: "0.8rem",
            fontWeight: 600,
            color: "#64748b",
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </div>

      {/* Steps indicator */}
      <div style={{ display: "flex", gap: 32, marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
        {stepIndicator(1, "Empresa")}
        <div style={{ width: 40, borderTop: "2px solid #e2e8f0", alignSelf: "center" }} />
        {stepIndicator(2, "Dados do certificado")}
        <div style={{ width: 40, borderTop: "2px solid #e2e8f0", alignSelf: "center" }} />
        {stepIndicator(3, "Alertas")}
      </div>

      {/* Step 1: Select empresa */}
      {formStep === 1 && (
        <div>
          <label style={labelStyle}>Empresa *</label>
          <select
            value={formData.empresa_id}
            onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
            style={{ ...inputStyle, marginBottom: 16 }}
          >
            <option value="">Selecione uma empresa...</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nome_legal} {emp.cnpj ? `(${emp.cnpj})` : ""}
              </option>
            ))}
          </select>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() => {
                if (!formData.empresa_id) {
                  alert("Selecione uma empresa.");
                  return;
                }
                setFormStep(2);
              }}
              style={{
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Proximo
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Certificate data */}
      {formStep === 2 && (
        <div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Tipo *</label>
              <select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                style={inputStyle}
              >
                <option value="A1">A1</option>
                <option value="A3">A3</option>
                <option value="eCPF">eCPF</option>
                <option value="eCNPJ">eCNPJ</option>
                <option value="Representante">Representante</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Numero de serie</label>
              <input
                value={formData.numero_serie}
                onChange={(e) => setFormData({ ...formData, numero_serie: e.target.value })}
                style={inputStyle}
                placeholder="Ex: 1234567890"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Titular *</label>
              <input
                value={formData.titular}
                onChange={(e) => setFormData({ ...formData, titular: e.target.value })}
                style={inputStyle}
                placeholder="Nome do titular"
              />
            </div>
            <div>
              <label style={labelStyle}>Documento *</label>
              <input
                value={formData.documento}
                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                style={inputStyle}
                placeholder="CPF ou CNPJ"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
                type="email"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                style={inputStyle}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Emissao *</label>
              <input
                value={formData.emissao}
                onChange={(e) => setFormData({ ...formData, emissao: e.target.value })}
                style={inputStyle}
                type="date"
              />
            </div>
            <div>
              <label style={labelStyle}>Validade *</label>
              <input
                value={formData.validade}
                onChange={(e) => setFormData({ ...formData, validade: e.target.value })}
                style={inputStyle}
                type="date"
              />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Fornecedor</label>
              <input
                value={formData.fornecedor}
                onChange={(e) => setFormData({ ...formData, fornecedor: e.target.value })}
                style={inputStyle}
                placeholder="Ex: Certisign, Serasa, etc."
              />
            </div>
            <div>
              <label style={labelStyle}>Responsavel</label>
              <input
                value={formData.responsavel}
                onChange={(e) => setFormData({ ...formData, responsavel: e.target.value })}
                style={inputStyle}
                placeholder="Nome do responsavel"
              />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Observacoes</label>
            <textarea
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              style={{ ...inputStyle, minHeight: 80, resize: "vertical" as const }}
              placeholder="Observacoes adicionais..."
            />
          </div>

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => setFormStep(1)}
              style={{
                background: "none",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Voltar
            </button>
            <button
              onClick={() => setFormStep(3)}
              style={{
                background: "#0f172a",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: "0.85rem",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Proximo
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Alerts config */}
      {formStep === 3 && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>Alertar com antecedencia de:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {[90, 60, 30, 15, 7, 1].map((d) => (
                <label
                  key={d}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: alertDias.includes(d) ? "#f0fdf4" : "#fff",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={alertDias.includes(d)}
                    onChange={() => toggleDia(d)}
                    style={{ accentColor: "#065f46" }}
                  />
                  {d} dia{d !== 1 ? "s" : ""}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ ...labelStyle, marginBottom: 10 }}>Canais de notificacao:</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {["Sistema", "Email", "WhatsApp"].map((c) => (
                <label
                  key={c}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 14px",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    cursor: "pointer",
                    background: alertCanais.includes(c) ? "#eff6ff" : "#fff",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={alertCanais.includes(c)}
                    onChange={() => toggleCanal(c)}
                    style={{ accentColor: "#1e40af" }}
                  />
                  {c}
                </label>
              ))}
            </div>
          </div>

          {formError && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: 8,
                padding: "10px 14px",
                color: "#b91c1c",
                fontSize: "0.82rem",
                marginBottom: 16,
              }}
            >
              {formError}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button
              onClick={() => setFormStep(2)}
              style={{
                background: "none",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: "0.85rem",
                fontWeight: 600,
                color: "#64748b",
                cursor: "pointer",
              }}
            >
              Voltar
            </button>
            <button
              onClick={onSubmit}
              disabled={submitting}
              style={{
                background: submitting ? "#94a3b8" : "#065f46",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: "0.88rem",
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Salvando..." : "Salvar Certificado"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
