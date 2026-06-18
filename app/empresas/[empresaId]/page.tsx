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
  { cor: "#0e7490", emoji: "💵", label: "Financeiro", slug: "financeiro" },
];

type Tab = "geral" | "documentos" | "historico";

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

  useEffect(() => {
    buscarEmpresaTenant(empresaId)
      .then((e) => {
        setEmpresa(e);
        setEditNome(e.nome_legal);
      })
      .catch(() => router.push("/empresas"))
      .finally(() => setLoading(false));
  }, [empresaId, router]);

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

  return (
    <AppShell>
      <div className="page-stack">

        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--muted)" }}>
          <Link href="/empresas" style={{ color: "var(--green-700)", fontWeight: 600 }}>Empresas</Link>
          <span>›</span>
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
              {empresa.cidade && <span>📍 <strong>{[empresa.cidade, empresa.estado].filter(Boolean).join(" — ")}</strong></span>}
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
              ✏️ Editar
            </button>
            <Link
              href={`/portal/${empresaId}`}
              style={{ background: "linear-gradient(135deg,#10b981,#059669)", border: "none", borderRadius: 10, color: "#fff", cursor: "pointer", display: "inline-block", fontSize: 13, fontWeight: 700, padding: "8px 16px", textDecoration: "none" }}
            >
              🌐 Portal do Cliente
            </Link>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-strip">
          <article className="metric-card kpi-warning">
            <span>Obrigações Pendentes</span>
            <strong className="kpi-num">0</strong>
            <p>Nenhuma obrigação em aberto</p>
          </article>
          <article className="metric-card">
            <span>Guias Emitidas</span>
            <strong className="kpi-num">1</strong>
            <p>Guias disponíveis este mês</p>
          </article>
          <article className="metric-card kpi-danger">
            <span>Documentos Pendentes</span>
            <strong className="kpi-num">0</strong>
            <p>Sem documentos aguardando</p>
          </article>
          <article className="metric-card">
            <span>Última Entrega</span>
            <strong className="kpi-currency">
              {new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
            </strong>
            <p>Data da última entrega ao cliente</p>
          </article>
        </div>

        {/* Setores */}
        <div className="list-panel" style={{ padding: "18px 20px" }}>
          <div style={{ marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Setores operacionais</h2>
            <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Acesse cada área da empresa</p>
          </div>
          <div className="setor-nav-grid">
            {SETORES.map((s) => (
              <Link
                className="setor-nav-card"
                href={`/empresas/${empresaId}/setores/${s.slug}`}
                key={s.slug}
              >
                <div className="setor-nav-card-icon" style={{ background: `${s.cor}18` }}>
                  <span style={{ fontSize: 20 }}>{s.emoji}</span>
                </div>
                <span style={{ color: s.cor, fontWeight: 700 }}>{s.label}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div>
          <div className="empresa-tabs">
            <button
              className={`empresa-tab${tab === "geral" ? " active" : ""}`}
              onClick={() => setTab("geral")}
              type="button"
            >
              Visão Geral
            </button>
            <button
              className={`empresa-tab${tab === "documentos" ? " active" : ""}`}
              onClick={() => setTab("documentos")}
              type="button"
            >
              Documentos
            </button>
            <button
              className={`empresa-tab${tab === "historico" ? " active" : ""}`}
              onClick={() => setTab("historico")}
              type="button"
            >
              Histórico
            </button>
          </div>

          <div className="empresa-tab-content">

            {/* Visão Geral */}
            {tab === "geral" && (
              <div style={{ display: "grid", gap: 20 }}>
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
                    <div key={item.label} style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
                      <div style={{ color: "var(--muted)", fontSize: 11, fontWeight: 800, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 4 }}>
                        {item.label}
                      </div>
                      <div style={{ color: "var(--ink)", fontSize: 14, fontWeight: 600 }}>{item.value}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h3 style={{ margin: "0 0 16px", fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                    Timeline operacional
                  </h3>
                  <EmpresaTimeline empresaId={empresaId} />
                </div>
              </div>
            )}

            {/* Documentos */}
            {tab === "documentos" && (
              <div style={{ display: "grid", gap: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Documentos da empresa</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Arquivos vinculados a esta empresa</p>
                  </div>
                  <button className="small-action" type="button">+ Adicionar documento</button>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                  {["Contrato Social", "Certificado Digital", "Alvará", "Inscrições"].map((doc) => (
                    <div
                      key={doc}
                      style={{ background: "var(--bg)", border: "1px dashed var(--border)", borderRadius: 10, padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center" }}
                    >
                      <span style={{ fontSize: 28 }}>📄</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{doc}</span>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>Nenhum arquivo</span>
                      <button className="small-action" style={{ marginTop: 4 }} type="button">Upload</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Histórico */}
            {tab === "historico" && (
              <div>
                <div style={{ marginBottom: 16 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Histórico completo</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Todos os eventos registrados para esta empresa</p>
                </div>
                <EmpresaTimeline empresaId={empresaId} />
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
