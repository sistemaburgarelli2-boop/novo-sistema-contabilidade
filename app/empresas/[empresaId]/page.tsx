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
];

type Tab = "geral" | "documentos" | "tarefas" | "historico";

/* ── Documentos mock data ─────────────────────────────────────────── */

type DocStatus = "Recebido" | "Conferido" | "Processado" | "Arquivado";
type DocCategoria = "Extratos" | "Notas" | "Contratos" | "Guias" | "Folha";

interface MockDocumento {
  id: number;
  nome: string;
  categoria: DocCategoria;
  setor: string;
  competencia: string; // "Jun/2026"
  status: DocStatus;
  dataRecebido: string;
}

const DOC_STATUS_COLORS: Record<DocStatus, { color: string; bg: string }> = {
  Recebido:   { color: "#0e7490", bg: "#ecfeff" },
  Conferido:  { color: "#92400e", bg: "#fffbeb" },
  Processado: { color: "#065f46", bg: "#f0fdf4" },
  Arquivado:  { color: "#6b7280", bg: "#f3f4f6" },
};

const MOCK_DOCUMENTOS: MockDocumento[] = [
  { id: 1, nome: "Extrato bancário Itaú",      categoria: "Extratos",  setor: "Contábil", competencia: "Jun/2026", status: "Recebido",   dataRecebido: "15/06/2026" },
  { id: 2, nome: "NF-e vendas Jun/2026",        categoria: "Notas",     setor: "Fiscal",   competencia: "Jun/2026", status: "Conferido",  dataRecebido: "12/06/2026" },
  { id: 3, nome: "Guia DAS Jun/2026",           categoria: "Guias",     setor: "Fiscal",   competencia: "Jun/2026", status: "Processado", dataRecebido: "10/06/2026" },
  { id: 4, nome: "Holerites Jun/2026",          categoria: "Folha",     setor: "DP",       competencia: "Jun/2026", status: "Recebido",   dataRecebido: "14/06/2026" },
  { id: 5, nome: "Contrato prestação serviços", categoria: "Contratos", setor: "Societário", competencia: "Jun/2026", status: "Arquivado", dataRecebido: "03/06/2026" },
  { id: 6, nome: "NF-e compras Mai/2026",       categoria: "Notas",     setor: "Fiscal",   competencia: "Mai/2026", status: "Arquivado",  dataRecebido: "28/05/2026" },
  { id: 7, nome: "Extrato bancário Bradesco",   categoria: "Extratos",  setor: "Contábil", competencia: "Mai/2026", status: "Processado", dataRecebido: "20/05/2026" },
  { id: 8, nome: "Folha pagamento Mai/2026",    categoria: "Folha",     setor: "DP",       competencia: "Mai/2026", status: "Arquivado",  dataRecebido: "05/05/2026" },
  { id: 9, nome: "Guia FGTS Mai/2026",          categoria: "Guias",     setor: "DP",       competencia: "Mai/2026", status: "Arquivado",  dataRecebido: "07/05/2026" },
  { id: 10, nome: "Recibo pró-labore Jun/2026", categoria: "Folha",     setor: "DP",       competencia: "Jun/2026", status: "Conferido",  dataRecebido: "13/06/2026" },
];

const DOC_COMPETENCIAS = ["Todos", "Jun/2026", "Mai/2026"];
const DOC_CATEGORIAS: ("Todas" | DocCategoria)[] = ["Todas", "Extratos", "Notas", "Contratos", "Guias", "Folha"];

/* ── Tarefas mock data ────────────────────────────────────────────── */

type TarefaStatus = "Não iniciado" | "Em andamento" | "Revisão" | "Concluído";

interface MockTarefa {
  id: number;
  atividade: string;
  setor: string;
  prazo: string;
  responsavel: string;
  status: TarefaStatus;
}

const TAREFA_STATUS_COLORS: Record<TarefaStatus, { color: string; bg: string }> = {
  "Não iniciado": { color: "#6b7280", bg: "#f3f4f6" },
  "Em andamento": { color: "#0e7490", bg: "#ecfeff" },
  "Revisão":      { color: "#92400e", bg: "#fffbeb" },
  "Concluído":    { color: "#065f46", bg: "#f0fdf4" },
};

const MOCK_TAREFAS: MockTarefa[] = [
  { id: 1, atividade: "Apuração ICMS Jun/2026",            setor: "Fiscal",     prazo: "10/07/2026", responsavel: "Ana Lima",      status: "Em andamento" },
  { id: 2, atividade: "Fechamento contábil Mai/2026",      setor: "Contábil",   prazo: "05/07/2026", responsavel: "Carlos Silva",  status: "Revisão" },
  { id: 3, atividade: "Folha pagamento Jun/2026",          setor: "DP",         prazo: "05/07/2026", responsavel: "Marcos Souza",  status: "Concluído" },
  { id: 4, atividade: "Transmissão SPED Jun/2026",         setor: "Fiscal",     prazo: "15/07/2026", responsavel: "Ana Lima",      status: "Não iniciado" },
  { id: 5, atividade: "Conciliação bancária Jun/2026",     setor: "Contábil",   prazo: "08/07/2026", responsavel: "Carlos Silva",  status: "Em andamento" },
  { id: 6, atividade: "Envio eSocial Jun/2026",            setor: "DP",         prazo: "07/07/2026", responsavel: "Marcos Souza",  status: "Em andamento" },
  { id: 7, atividade: "Apuração PIS/COFINS Jun/2026",     setor: "Fiscal",     prazo: "20/07/2026", responsavel: "Ana Lima",      status: "Não iniciado" },
  { id: 8, atividade: "Atualização contrato social",       setor: "Societário", prazo: "30/06/2026", responsavel: "Fernanda Reis", status: "Revisão" },
];

/* ── Documentos tree builder ──────────────────────────────────────── */

interface TreeNode {
  ano: string;
  meses: { mes: string; setores: { setor: string; count: number }[] }[];
}

function buildDocTree(docs: MockDocumento[]): TreeNode[] {
  const map = new Map<string, Map<string, Map<string, number>>>();
  for (const d of docs) {
    const [mes, ano] = d.competencia.split("/");
    if (!map.has(ano)) map.set(ano, new Map());
    const anoMap = map.get(ano)!;
    if (!anoMap.has(mes)) anoMap.set(mes, new Map());
    const mesMap = anoMap.get(mes)!;
    mesMap.set(d.setor, (mesMap.get(d.setor) ?? 0) + 1);
  }
  const result: TreeNode[] = [];
  for (const [ano, meses] of map) {
    const mesesArr: TreeNode["meses"][number][] = [];
    for (const [mes, setores] of meses) {
      const setoresArr: { setor: string; count: number }[] = [];
      for (const [setor, count] of setores) {
        setoresArr.push({ setor, count });
      }
      mesesArr.push({ mes, setores: setoresArr });
    }
    result.push({ ano, meses: mesesArr });
  }
  return result;
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

  // Documentos filters
  const [docFiltroComp, setDocFiltroComp] = useState("Todos");
  const [docFiltroCat, setDocFiltroCat] = useState<"Todas" | DocCategoria>("Todas");

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

  // Filtered documents
  const docsFiltrados = MOCK_DOCUMENTOS.filter((d) => {
    if (docFiltroComp !== "Todos" && d.competencia !== docFiltroComp) return false;
    if (docFiltroCat !== "Todas" && d.categoria !== docFiltroCat) return false;
    return true;
  });

  const docTree = buildDocTree(MOCK_DOCUMENTOS);

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
              <span>Responsável: <strong>Ana Lima</strong></span>
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

        {/* Operational KPI Cards */}
        <div className="kpi-strip">
          <article className="metric-card kpi-warning">
            <span>Pendências</span>
            <strong className="kpi-num">3</strong>
            <p>Obrigações pendentes</p>
          </article>
          <article className="metric-card">
            <span>Último Fechamento</span>
            <strong className="kpi-currency">Mai/2026</strong>
            <p>Contabilidade encerrada</p>
          </article>
          <article className="metric-card">
            <span>Documentos Recebidos</span>
            <strong className="kpi-num">12</strong>
            <p>Recebidos este mês</p>
          </article>
          <article className="metric-card">
            <span>Risco Operacional</span>
            <strong className="kpi-currency" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, color: "#065f46", display: "inline-block", fontSize: 12, fontWeight: 700, padding: "2px 10px" }}>Baixo</span>
            </strong>
            <p>Nível de risco atual</p>
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
              className={`empresa-tab${tab === "tarefas" ? " active" : ""}`}
              onClick={() => setTab("tarefas")}
              type="button"
            >
              Tarefas
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

            {/* ── Visão Geral ──────────────────────────────────── */}
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

            {/* ── Documentos ───────────────────────────────────── */}
            {tab === "documentos" && (
              <div style={{ display: "grid", gap: 20 }}>
                {/* Header + action */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Documentos da empresa</h3>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Organizados por competência e setor</p>
                  </div>
                  <button className="small-action" type="button">+ Receber documento</button>
                </div>

                {/* Document tree */}
                <div style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 10, padding: "16px 18px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 12 }}>
                    Estrutura por competência
                  </div>
                  {docTree.map((anoNode) => (
                    <div key={anoNode.ano} style={{ marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 6 }}>
                        📁 {anoNode.ano}
                      </div>
                      {anoNode.meses.map((mesNode) => (
                        <div key={mesNode.mes} style={{ marginLeft: 20, marginBottom: 6 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ color: "var(--muted)", fontSize: 13 }}>└──</span>
                            <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{mesNode.mes}</span>
                          </div>
                          {mesNode.setores.map((setorNode, idx) => (
                            <div key={setorNode.setor} style={{ marginLeft: 32, display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <span style={{ color: "var(--muted)", fontSize: 12 }}>{idx === mesNode.setores.length - 1 ? "└──" : "├──"}</span>
                              <span style={{ fontSize: 13, color: "var(--ink)" }}>{setorNode.setor}</span>
                              <span style={{ fontSize: 11, color: "var(--muted)", background: "var(--border)", borderRadius: 4, padding: "1px 6px", fontWeight: 600 }}>
                                {setorNode.count} {setorNode.count === 1 ? "doc" : "docs"}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Filters */}
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Competência:</label>
                    <select
                      onChange={(e) => setDocFiltroComp(e.target.value)}
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ink)", fontSize: 13, padding: "6px 10px", cursor: "pointer" }}
                      value={docFiltroComp}
                    >
                      {DOC_COMPETENCIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Categoria:</label>
                    <select
                      onChange={(e) => setDocFiltroCat(e.target.value as "Todas" | DocCategoria)}
                      style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ink)", fontSize: 13, padding: "6px 10px", cursor: "pointer" }}
                      value={docFiltroCat}
                    >
                      {DOC_CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Documents table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                    <thead>
                      <tr>
                        {["Documento", "Categoria", "Setor", "Competência", "Status", "Data recebido"].map((h) => (
                          <th
                            key={h}
                            style={{
                              background: "var(--bg)",
                              borderBottom: "2px solid var(--border)",
                              color: "var(--muted)",
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: "0.8px",
                              padding: "10px 12px",
                              textAlign: "left",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {docsFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                            Nenhum documento encontrado com os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        docsFiltrados.map((doc) => {
                          const sc = DOC_STATUS_COLORS[doc.status];
                          return (
                            <tr key={doc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink)" }}>{doc.nome}</td>
                              <td style={{ padding: "10px 12px", color: "var(--ink)" }}>{doc.categoria}</td>
                              <td style={{ padding: "10px 12px", color: "var(--ink)" }}>{doc.setor}</td>
                              <td style={{ padding: "10px 12px", color: "var(--ink)" }}>{doc.competencia}</td>
                              <td style={{ padding: "10px 12px" }}>
                                <span style={{
                                  background: sc.bg,
                                  border: `1px solid ${sc.color}22`,
                                  borderRadius: 6,
                                  color: sc.color,
                                  display: "inline-block",
                                  fontSize: 11,
                                  fontWeight: 700,
                                  padding: "2px 10px",
                                }}>
                                  {doc.status}
                                </span>
                              </td>
                              <td style={{ padding: "10px 12px", color: "var(--muted)" }}>{doc.dataRecebido}</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Tarefas ──────────────────────────────────────── */}
            {tab === "tarefas" && (
              <div style={{ display: "grid", gap: 20 }}>
                {/* Header */}
                <div>
                  <h3 style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700 }}>Tarefas da empresa</h3>
                  <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>Atividades operacionais vinculadas a esta empresa</p>
                </div>

                {/* Quick KPI cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                  {[
                    { label: "Total tarefas", valor: "8", cor: "var(--ink)" },
                    { label: "Em andamento", valor: "3", cor: "#0e7490" },
                    { label: "Atrasadas", valor: "1", cor: "#dc2626" },
                    { label: "Concluídas (mês)", valor: "12", cor: "#065f46" },
                  ].map((kpi) => (
                    <div
                      key={kpi.label}
                      style={{
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: "12px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>
                        {kpi.label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: kpi.cor }}>
                        {kpi.valor}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Tasks table */}
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                    <thead>
                      <tr>
                        {["Atividade", "Setor", "Prazo", "Responsável", "Status"].map((h) => (
                          <th
                            key={h}
                            style={{
                              background: "var(--bg)",
                              borderBottom: "2px solid var(--border)",
                              color: "var(--muted)",
                              fontSize: 11,
                              fontWeight: 800,
                              letterSpacing: "0.8px",
                              padding: "10px 12px",
                              textAlign: "left",
                              textTransform: "uppercase",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_TAREFAS.map((t) => {
                        const sc = TAREFA_STATUS_COLORS[t.status];
                        // Highlight overdue tasks
                        const prazoDate = t.prazo.split("/").reverse().join("-");
                        const isAtrasado = t.status !== "Concluído" && new Date(prazoDate) < new Date();
                        return (
                          <tr key={t.id} style={{ borderBottom: "1px solid var(--border)" }}>
                            <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--ink)" }}>
                              {t.atividade}
                              {isAtrasado && (
                                <span style={{
                                  background: "#fef2f2",
                                  border: "1px solid #fecaca",
                                  borderRadius: 4,
                                  color: "#dc2626",
                                  display: "inline-block",
                                  fontSize: 10,
                                  fontWeight: 700,
                                  marginLeft: 8,
                                  padding: "1px 6px",
                                }}>
                                  ATRASADA
                                </span>
                              )}
                            </td>
                            <td style={{ padding: "10px 12px", color: "var(--ink)" }}>{t.setor}</td>
                            <td style={{ padding: "10px 12px", color: isAtrasado ? "#dc2626" : "var(--ink)", fontWeight: isAtrasado ? 700 : 400 }}>
                              {t.prazo}
                            </td>
                            <td style={{ padding: "10px 12px", color: "var(--ink)" }}>{t.responsavel}</td>
                            <td style={{ padding: "10px 12px" }}>
                              <span style={{
                                background: sc.bg,
                                border: `1px solid ${sc.color}22`,
                                borderRadius: 6,
                                color: sc.color,
                                display: "inline-block",
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 10px",
                              }}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── Histórico ────────────────────────────────────── */}
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
