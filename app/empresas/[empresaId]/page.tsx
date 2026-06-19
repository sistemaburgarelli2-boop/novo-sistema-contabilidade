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

/* ── Documentos mock data ─────────────────────────────────────────── */

type DocStatus = "Recebido" | "Conferido" | "Processado" | "Arquivado";
type DocCategoria = "Extratos" | "Notas" | "Contratos" | "Guias" | "Folha";

interface MockDocumento {
  id: number;
  nome: string;
  categoria: DocCategoria;
  setor: string;
  competencia: string;
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
  { id: 1, nome: "Extrato bancário Itaú",      categoria: "Extratos",  setor: "Contábil",   competencia: "Jun/2026", status: "Recebido",   dataRecebido: "15/06/2026" },
  { id: 2, nome: "NF-e vendas Jun/2026",        categoria: "Notas",     setor: "Fiscal",     competencia: "Jun/2026", status: "Conferido",  dataRecebido: "12/06/2026" },
  { id: 3, nome: "Guia DAS Jun/2026",           categoria: "Guias",     setor: "Fiscal",     competencia: "Jun/2026", status: "Processado", dataRecebido: "10/06/2026" },
  { id: 4, nome: "Holerites Jun/2026",          categoria: "Folha",     setor: "DP",         competencia: "Jun/2026", status: "Recebido",   dataRecebido: "14/06/2026" },
  { id: 5, nome: "Contrato prestação serviços", categoria: "Contratos", setor: "Societário", competencia: "Jun/2026", status: "Arquivado",  dataRecebido: "03/06/2026" },
  { id: 6, nome: "NF-e compras Mai/2026",       categoria: "Notas",     setor: "Fiscal",     competencia: "Mai/2026", status: "Arquivado",  dataRecebido: "28/05/2026" },
  { id: 7, nome: "Extrato bancário Bradesco",   categoria: "Extratos",  setor: "Contábil",   competencia: "Mai/2026", status: "Processado", dataRecebido: "20/05/2026" },
  { id: 8, nome: "Folha pagamento Mai/2026",    categoria: "Folha",     setor: "DP",         competencia: "Mai/2026", status: "Arquivado",  dataRecebido: "05/05/2026" },
  { id: 9, nome: "Guia FGTS Mai/2026",          categoria: "Guias",     setor: "DP",         competencia: "Mai/2026", status: "Arquivado",  dataRecebido: "07/05/2026" },
  { id: 10, nome: "Recibo pró-labore Jun/2026", categoria: "Folha",     setor: "DP",         competencia: "Jun/2026", status: "Conferido",  dataRecebido: "13/06/2026" },
];

const DOC_COMPETENCIAS = ["Todos", "Jun/2026", "Mai/2026"];
const DOC_CATEGORIAS: ("Todas" | DocCategoria)[] = ["Todas", "Extratos", "Notas", "Contratos", "Guias", "Folha"];
const DOC_SETOR_FILTER = ["Todos", "Fiscal", "Contábil", "DP", "Societário"];

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
  { id: 1, atividade: "Apuração ICMS Jun/2026",        setor: "Fiscal",     prazo: "10/07/2026", responsavel: "Ana Lima",      status: "Em andamento" },
  { id: 2, atividade: "Fechamento contábil Mai/2026",  setor: "Contábil",   prazo: "05/07/2026", responsavel: "Carlos Silva",  status: "Revisão" },
  { id: 3, atividade: "Folha pagamento Jun/2026",      setor: "DP",         prazo: "05/07/2026", responsavel: "Marcos Souza",  status: "Concluído" },
  { id: 4, atividade: "Transmissão SPED Jun/2026",     setor: "Fiscal",     prazo: "15/07/2026", responsavel: "Ana Lima",      status: "Não iniciado" },
  { id: 5, atividade: "Conciliação bancária Jun/2026", setor: "Contábil",   prazo: "08/07/2026", responsavel: "Carlos Silva",  status: "Em andamento" },
  { id: 6, atividade: "Envio eSocial Jun/2026",        setor: "DP",         prazo: "07/07/2026", responsavel: "Marcos Souza",  status: "Em andamento" },
  { id: 7, atividade: "Apuração PIS/COFINS Jun/2026",  setor: "Fiscal",     prazo: "20/07/2026", responsavel: "Ana Lima",      status: "Não iniciado" },
  { id: 8, atividade: "Atualização contrato social",   setor: "Societário", prazo: "30/06/2026", responsavel: "Fernanda Reis", status: "Revisão" },
];

/* ── Financeiro mock data ─────────────────────────────────────────── */

interface MockPagamento {
  id: number;
  competencia: string;
  valor: string;
  vencimento: string;
  status: "Pago" | "Pendente" | "Atrasado";
}

const PAGAMENTO_STATUS_COLORS: Record<string, { color: string; bg: string }> = {
  Pago:     { color: "#065f46", bg: "#f0fdf4" },
  Pendente: { color: "#92400e", bg: "#fffbeb" },
  Atrasado: { color: "#dc2626", bg: "#fef2f2" },
};

const MOCK_PAGAMENTOS: MockPagamento[] = [
  { id: 1, competencia: "Jun/2026", valor: "R$ 1.200,00", vencimento: "10/07/2026", status: "Pendente" },
  { id: 2, competencia: "Mai/2026", valor: "R$ 1.200,00", vencimento: "10/06/2026", status: "Pago" },
  { id: 3, competencia: "Abr/2026", valor: "R$ 1.200,00", vencimento: "10/05/2026", status: "Pago" },
  { id: 4, competencia: "Mar/2026", valor: "R$ 1.200,00", vencimento: "10/04/2026", status: "Pago" },
  { id: 5, competencia: "Fev/2026", valor: "R$ 1.200,00", vencimento: "10/03/2026", status: "Pago" },
  { id: 6, competencia: "Jan/2026", valor: "R$ 1.100,00", vencimento: "10/02/2026", status: "Pago" },
];

/* ── Portal mock data ─────────────────────────────────────────────── */

const PORTAL_PERMISSIONS = ["empresa.read", "documento.read", "documento.upload", "guia.download", "solicitacao.create"];

interface PortalActivity {
  id: number;
  acao: string;
  data: string;
  hora: string;
}

const MOCK_PORTAL_ACTIVITY: PortalActivity[] = [
  { id: 1, acao: "Documento enviado — NF-e Jun/2026",       data: "18/06/2026", hora: "14:30" },
  { id: 2, acao: "Guia DAS baixada — Mai/2026",             data: "17/06/2026", hora: "09:15" },
  { id: 3, acao: "Solicitação aberta — Certidão Negativa",  data: "16/06/2026", hora: "11:42" },
  { id: 4, acao: "Documento enviado — Extrato bancário",    data: "15/06/2026", hora: "16:20" },
  { id: 5, acao: "Login realizado",                          data: "15/06/2026", hora: "16:18" },
];

/* ── Histórico mock data ──────────────────────────────────────────── */

type HistoricoFilter = "Todos" | "Documentos" | "Operacional" | "Portal" | "Financeiro";

interface MockHistorico {
  id: number;
  tipo: Exclude<HistoricoFilter, "Todos">;
  descricao: string;
  usuario: string;
  data: string;
  hora: string;
}

const MOCK_HISTORICO: MockHistorico[] = [
  { id: 1,  tipo: "Documentos",   descricao: "Documento recebido: NF-e vendas Jun/2026",         usuario: "Ana Lima",       data: "18/06/2026", hora: "15:30" },
  { id: 2,  tipo: "Portal",       descricao: "Cliente enviou documento pelo portal",              usuario: "Maria Silva",    data: "18/06/2026", hora: "14:30" },
  { id: 3,  tipo: "Operacional",  descricao: "Tarefa concluída: Folha pagamento Jun/2026",       usuario: "Marcos Souza",   data: "17/06/2026", hora: "17:45" },
  { id: 4,  tipo: "Financeiro",   descricao: "Cobrança emitida: competência Jun/2026",           usuario: "Sistema",        data: "17/06/2026", hora: "08:00" },
  { id: 5,  tipo: "Documentos",   descricao: "Documento conferido: Guia DAS Jun/2026",           usuario: "Ana Lima",       data: "16/06/2026", hora: "10:20" },
  { id: 6,  tipo: "Operacional",  descricao: "Tarefa iniciada: Apuração ICMS Jun/2026",          usuario: "Ana Lima",       data: "15/06/2026", hora: "09:00" },
  { id: 7,  tipo: "Portal",       descricao: "Login no portal pelo cliente",                      usuario: "Maria Silva",    data: "15/06/2026", hora: "16:18" },
  { id: 8,  tipo: "Financeiro",   descricao: "Pagamento recebido: competência Mai/2026",         usuario: "Sistema",        data: "12/06/2026", hora: "10:00" },
  { id: 9,  tipo: "Documentos",   descricao: "Documento arquivado: Contrato prestação serviços", usuario: "Fernanda Reis",  data: "10/06/2026", hora: "14:15" },
  { id: 10, tipo: "Operacional",  descricao: "Empresa cadastrada no sistema",                    usuario: "Admin",          data: "01/01/2026", hora: "09:00" },
];

const HISTORICO_TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  Documentos:  { color: "#0e7490", bg: "#ecfeff" },
  Operacional: { color: "#92400e", bg: "#fffbeb" },
  Portal:      { color: "#6b21a8", bg: "#faf5ff" },
  Financeiro:  { color: "#065f46", bg: "#f0fdf4" },
};

/* ── Sócios mock data ─────────────────────────────────────────────── */

interface MockSocio {
  nome: string;
  cpf: string;
  percentual: string;
  administrador: boolean;
}

const MOCK_SOCIOS: MockSocio[] = [
  { nome: "Maria Silva",   cpf: "123.456.789-00", percentual: "60%", administrador: true },
  { nome: "João Oliveira",  cpf: "987.654.321-00", percentual: "40%", administrador: false },
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
const actionBtn: React.CSSProperties = {
  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
  color: "var(--ink)", cursor: "pointer", fontSize: 13, fontWeight: 600, padding: "8px 16px",
};

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
  const [docFiltroSetor, setDocFiltroSetor] = useState("Todos");

  // Histórico filter
  const [histFiltro, setHistFiltro] = useState<HistoricoFilter>("Todos");

  // Observações
  const [observacoes, setObservacoes] = useState("Cliente pontual. Preferência por contato via WhatsApp.");

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
    if (docFiltroSetor !== "Todos" && d.setor !== docFiltroSetor) return false;
    return true;
  });

  const docTree = buildDocTree(MOCK_DOCUMENTOS);

  // Filtered histórico
  const historicoFiltrado = MOCK_HISTORICO.filter((h) => histFiltro === "Todos" || h.tipo === histFiltro);

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

        {/* Main content with optional sidebar */}
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

              {/* ── Tab 1: Visão Geral ─────────────────────────── */}
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

                  {/* Personal info */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                    {[
                      { label: "Nome", value: "Maria Silva" },
                      { label: "CPF", value: "123.456.789-00" },
                      { label: "RG", value: "12.345.678-9" },
                      { label: "E-mail", value: "maria@email.com" },
                      { label: "Telefone", value: "(11) 98765-4321" },
                      { label: "WhatsApp", value: "(11) 98765-4321" },
                    ].map((item) => (
                      <div key={item.label} style={infoCard}>
                        <div style={infoLabel}>{item.label}</div>
                        <div style={infoValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Address */}
                  <div style={{ ...infoCard, padding: "16px 18px" }}>
                    <div style={{ ...infoLabel, marginBottom: 8 }}>Endereço</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                      {[
                        { label: "Logradouro", value: "Rua das Flores, 100" },
                        { label: "Bairro", value: "Centro" },
                        { label: "Cidade / UF", value: "São Paulo — SP" },
                        { label: "CEP", value: "01001-000" },
                      ].map((a) => (
                        <div key={a.label}>
                          <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>{a.label}</div>
                          <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>{a.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Additional info */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    {[
                      { label: "Profissão", value: "Empresária" },
                      { label: "Estado civil", value: "Casada" },
                      { label: "Nacionalidade", value: "Brasileira" },
                    ].map((item) => (
                      <div key={item.label} style={infoCard}>
                        <div style={infoLabel}>{item.label}</div>
                        <div style={infoValue}>{item.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Sócios table */}
                  <div>
                    <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Quadro societário</h3>
                    <div style={{ overflowX: "auto" }}>
                      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                        <thead>
                          <tr>
                            {["Nome", "CPF", "Participação", "Administrador"].map((h) => (
                              <th key={h} style={thStyle}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {MOCK_SOCIOS.map((s) => (
                            <tr key={s.cpf} style={{ borderBottom: "1px solid var(--border)" }}>
                              <td style={{ ...tdStyle, fontWeight: 600 }}>{s.nome}</td>
                              <td style={tdStyle}>{s.cpf}</td>
                              <td style={tdStyle}>{s.percentual}</td>
                              <td style={tdStyle}>
                                <StatusBadge
                                  label={s.administrador ? "Sim" : "Não"}
                                  color={s.administrador ? "#065f46" : "#6b7280"}
                                  bg={s.administrador ? "#f0fdf4" : "#f3f4f6"}
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Tab 3: Operação ────────────────────────────── */}
              {tab === "operacao" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Tarefas operacionais</h3>
                    <p style={sectionSubtitle}>Atividades vinculadas a esta empresa</p>
                  </div>

                  {/* KPI cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                    {[
                      { label: "Pendentes", valor: "5", cor: "#92400e" },
                      { label: "Em andamento", valor: "3", cor: "#0e7490" },
                      { label: "Atrasadas", valor: "1", cor: "#dc2626" },
                      { label: "Concluídas (mês)", valor: "12", cor: "#065f46" },
                    ].map((kpi) => (
                      <div key={kpi.label} style={{ ...infoCard, textAlign: "center" as const }}>
                        <div style={{ ...infoLabel, marginBottom: 4 }}>{kpi.label}</div>
                        <div style={{ fontSize: 22, fontWeight: 800, color: kpi.cor }}>{kpi.valor}</div>
                      </div>
                    ))}
                  </div>

                  {/* Tasks table */}
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
                        {MOCK_TAREFAS.map((t) => {
                          const sc = TAREFA_STATUS_COLORS[t.status];
                          const prazoDate = t.prazo.split("/").reverse().join("-");
                          const isAtrasado = t.status !== "Concluído" && new Date(prazoDate) < new Date();
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
                                {t.prazo}
                              </td>
                              <td style={tdStyle}>{t.responsavel}</td>
                              <td style={tdStyle}>
                                <StatusBadge label={t.status} color={sc.color} bg={sc.bg} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
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

                  {/* Status flow */}
                  <div style={{ display: "flex", alignItems: "center", gap: 0, justifyContent: "center", flexWrap: "wrap" }}>
                    {(["Recebido", "Conferido", "Processado", "Arquivado"] as DocStatus[]).map((s, i) => {
                      const sc = DOC_STATUS_COLORS[s];
                      return (
                        <div key={s} style={{ display: "flex", alignItems: "center" }}>
                          <div style={{
                            background: sc.bg, border: `1px solid ${sc.color}33`, borderRadius: 8,
                            color: sc.color, fontSize: 12, fontWeight: 700, padding: "6px 14px",
                          }}>
                            {s}
                          </div>
                          {i < 3 && (
                            <span style={{ color: "var(--muted)", fontSize: 16, margin: "0 6px" }}>→</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Document tree */}
                  <div style={{ ...infoCard, padding: "16px 18px" }}>
                    <div style={{ ...infoLabel, marginBottom: 12 }}>Estrutura por competência</div>
                    {docTree.map((anoNode) => (
                      <div key={anoNode.ano} style={{ marginBottom: 8 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)", marginBottom: 6 }}>
                          {anoNode.ano}
                        </div>
                        {anoNode.meses.map((mesNode) => (
                          <div key={mesNode.mes} style={{ marginLeft: 20, marginBottom: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                              <span style={{ color: "var(--muted)", fontSize: 13 }}>|--</span>
                              <span style={{ fontWeight: 600, fontSize: 13, color: "var(--ink)" }}>{mesNode.mes}</span>
                            </div>
                            {mesNode.setores.map((setorNode, idx) => (
                              <div key={setorNode.setor} style={{ marginLeft: 32, display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                                <span style={{ color: "var(--muted)", fontSize: 12 }}>{idx === mesNode.setores.length - 1 ? "|__" : "|--"}</span>
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
                    {[
                      { label: "Competência", value: docFiltroComp, options: DOC_COMPETENCIAS, onChange: (v: string) => setDocFiltroComp(v) },
                      { label: "Categoria", value: docFiltroCat, options: DOC_CATEGORIAS, onChange: (v: string) => setDocFiltroCat(v as "Todas" | DocCategoria) },
                      { label: "Setor", value: docFiltroSetor, options: DOC_SETOR_FILTER, onChange: (v: string) => setDocFiltroSetor(v) },
                    ].map((f) => (
                      <div key={f.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <label style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" as const }}>{f.label}:</label>
                        <select
                          onChange={(e) => f.onChange(e.target.value)}
                          style={{ background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8, color: "var(--ink)", fontSize: 13, padding: "6px 10px", cursor: "pointer" }}
                          value={f.value}
                        >
                          {f.options.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>

                  {/* Documents table */}
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, fontSize: 13 }}>
                      <thead>
                        <tr>
                          {["Documento", "Categoria", "Setor", "Competência", "Status", "Data recebido"].map((h) => (
                            <th key={h} style={thStyle}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {docsFiltrados.length === 0 ? (
                          <tr>
                            <td colSpan={6} style={{ padding: 24, textAlign: "center" as const, color: "var(--muted)" }}>
                              Nenhum documento encontrado com os filtros selecionados.
                            </td>
                          </tr>
                        ) : (
                          docsFiltrados.map((doc) => {
                            const sc = DOC_STATUS_COLORS[doc.status];
                            return (
                              <tr key={doc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>{doc.nome}</td>
                                <td style={tdStyle}>{doc.categoria}</td>
                                <td style={tdStyle}>{doc.setor}</td>
                                <td style={tdStyle}>{doc.competencia}</td>
                                <td style={tdStyle}>
                                  <StatusBadge label={doc.status} color={sc.color} bg={sc.bg} />
                                </td>
                                <td style={{ ...tdStyle, color: "var(--muted)" }}>{doc.dataRecebido}</td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ── Tab 5: Portal ──────────────────────────────── */}
              {tab === "portal" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Portal do cliente</h3>
                    <p style={sectionSubtitle}>Acesso e atividades do cliente no portal</p>
                  </div>

                  {/* Access info card */}
                  <div style={{ ...infoCard, padding: "18px 20px" }}>
                    <div style={{ ...infoLabel, marginBottom: 12 }}>Informações de acesso</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>E-mail de login</div>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>maria@email.com</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>Último acesso</div>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>18/06/2026 14:30</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>Status</div>
                        <StatusBadge label="Ativo" color="#065f46" bg="#f0fdf4" />
                      </div>
                    </div>
                  </div>

                  {/* Permissions */}
                  <div style={{ ...infoCard, padding: "18px 20px" }}>
                    <div style={{ ...infoLabel, marginBottom: 12 }}>Permissões</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {PORTAL_PERMISSIONS.map((perm) => (
                        <span key={perm} style={{
                          background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: 6,
                          color: "#0369a1", fontSize: 12, fontWeight: 600, padding: "4px 10px",
                          fontFamily: "monospace",
                        }}>
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Activity log */}
                  <div>
                    <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Atividades recentes no portal</h3>
                    <div style={{ display: "grid", gap: 0 }}>
                      {MOCK_PORTAL_ACTIVITY.map((a) => (
                        <div key={a.id} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          padding: "12px 14px", borderBottom: "1px solid var(--border)",
                        }}>
                          <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{a.acao}</div>
                          <div style={{ fontSize: 12, color: "var(--muted)", whiteSpace: "nowrap" as const }}>{a.data} {a.hora}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["Redefinir senha", "Bloquear acesso", "Enviar credenciais"].map((label) => (
                      <button key={label} type="button" style={actionBtn}>{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab 6: Financeiro ──────────────────────────── */}
              {tab === "financeiro" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Relacionamento financeiro</h3>
                    <p style={sectionSubtitle}>Cobrança e pagamentos desta empresa</p>
                  </div>

                  {/* Billing info cards */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
                    <div style={infoCard}>
                      <div style={infoLabel}>Plano</div>
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge label="Premium" color="#6b21a8" bg="#faf5ff" />
                      </div>
                    </div>
                    <div style={infoCard}>
                      <div style={infoLabel}>Valor mensalidade</div>
                      <div style={{ ...infoValue, color: "#065f46", fontSize: 18 }}>R$ 1.200,00</div>
                    </div>
                    <div style={infoCard}>
                      <div style={infoLabel}>Forma de pagamento</div>
                      <div style={infoValue}>Boleto</div>
                    </div>
                    <div style={infoCard}>
                      <div style={infoLabel}>Situação</div>
                      <div style={{ marginTop: 4 }}>
                        <StatusBadge label="Em dia" color="#065f46" bg="#f0fdf4" />
                      </div>
                    </div>
                  </div>

                  {/* Payment history */}
                  <div>
                    <h3 style={{ ...sectionTitle, marginBottom: 12 }}>Histórico de pagamentos</h3>
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
                          {MOCK_PAGAMENTOS.map((p) => {
                            const sc = PAGAMENTO_STATUS_COLORS[p.status];
                            return (
                              <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                                <td style={{ ...tdStyle, fontWeight: 600 }}>{p.competencia}</td>
                                <td style={tdStyle}>{p.valor}</td>
                                <td style={tdStyle}>{p.vencimento}</td>
                                <td style={tdStyle}>
                                  <StatusBadge label={p.status} color={sc.color} bg={sc.bg} />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {["Emitir cobrança", "Alterar plano"].map((label) => (
                      <button key={label} type="button" style={actionBtn}>{label}</button>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Tab 7: Histórico ───────────────────────────── */}
              {tab === "historico" && (
                <div style={{ display: "grid", gap: 20 }}>
                  <div>
                    <h3 style={sectionTitle}>Histórico completo</h3>
                    <p style={sectionSubtitle}>Todos os eventos registrados para esta empresa</p>
                  </div>

                  {/* Type filter */}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(["Todos", "Documentos", "Operacional", "Portal", "Financeiro"] as HistoricoFilter[]).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setHistFiltro(f)}
                        style={{
                          background: histFiltro === f ? "var(--ink)" : "var(--bg)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          color: histFiltro === f ? "#fff" : "var(--ink)",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          padding: "6px 14px",
                        }}
                      >
                        {f}
                      </button>
                    ))}
                  </div>

                  {/* Timeline entries */}
                  <div style={{ display: "grid", gap: 0 }}>
                    {historicoFiltrado.map((h) => {
                      const tc = HISTORICO_TYPE_COLORS[h.tipo];
                      return (
                        <div key={h.id} style={{
                          display: "flex", alignItems: "flex-start", gap: 12,
                          padding: "14px 16px", borderBottom: "1px solid var(--border)",
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%", marginTop: 5,
                            background: tc.color, flexShrink: 0,
                          }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                              <StatusBadge label={h.tipo} color={tc.color} bg={tc.bg} />
                              <span style={{ fontSize: 12, color: "var(--muted)" }}>{h.data} {h.hora}</span>
                            </div>
                            <div style={{ fontSize: 13, color: "var(--ink)", fontWeight: 500 }}>{h.descricao}</div>
                            <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>por {h.usuario}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Audit info */}
                  <div style={{ ...infoCard, padding: "16px 18px" }}>
                    <div style={{ ...infoLabel, marginBottom: 10 }}>Auditoria</div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>Criado por</div>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>Admin</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>Data de criação</div>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>{new Date(empresa.created_at).toLocaleDateString("pt-BR")} 09:00</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>Última alteração</div>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>{new Date(empresa.updated_at).toLocaleDateString("pt-BR")}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 700, marginBottom: 2 }}>Total de eventos</div>
                        <div style={{ fontSize: 14, color: "var(--ink)", fontWeight: 600 }}>{MOCK_HISTORICO.length}</div>
                      </div>
                    </div>
                  </div>

                  {/* Original EmpresaTimeline */}
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
                style={{
                  width: "100%", minHeight: 80, resize: "vertical" as const,
                  background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
                  color: "var(--ink)", fontSize: 13, padding: "8px 10px", fontFamily: "inherit",
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Quick timeline */}
            <div style={{ ...infoCard, padding: "16px 18px" }}>
              <div style={{ ...infoLabel, marginBottom: 10 }}>Últimos eventos</div>
              {MOCK_HISTORICO.slice(0, 3).map((h) => {
                const tc = HISTORICO_TYPE_COLORS[h.tipo];
                return (
                  <div key={h.id} style={{
                    display: "flex", alignItems: "flex-start", gap: 8,
                    marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--border)",
                  }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: "50%", marginTop: 5,
                      background: tc.color, flexShrink: 0,
                    }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: "var(--ink)", fontWeight: 500, lineHeight: 1.4 }}>{h.descricao}</div>
                      <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>{h.data}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Next deadline */}
            <div style={{
              ...infoCard, padding: "16px 18px",
              background: "#fffbeb", border: "1px solid #fde68a",
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#92400e", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 6 }}>
                Próximo prazo
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#92400e", marginBottom: 2 }}>
                30/06/2026
              </div>
              <div style={{ fontSize: 12, color: "#b45309" }}>
                Atualização contrato social
              </div>
              <div style={{ fontSize: 11, color: "#92400e", marginTop: 4 }}>
                Responsável: Fernanda Reis
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
