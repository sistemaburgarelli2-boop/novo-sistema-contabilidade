"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type StatusLead = "lead" | "contato" | "proposta" | "negociacao" | "fechamento" | "perdido";
type StatusProp = "rascunho" | "enviada" | "aceita" | "recusada" | "expirada";
type StatusContrato = "ativo" | "a_vencer" | "vencido" | "cancelado";
type StatusChamado = "aberto" | "em_andamento" | "concluido" | "cancelado";
type Prioridade = "baixa" | "media" | "alta" | "critica";
type Tab = "pipeline" | "leads" | "propostas" | "contratos" | "atendimento" | "mensagens" | "historico";

type Lead = {
  id: string; nome: string; empresa: string; origem: string;
  telefone: string; email: string; valorEstimado: number;
  responsavel: string; status: StatusLead; criadoEm: string; obs: string;
};

type Proposta = {
  id: string; leadId: string; clienteNome: string; titulo: string;
  valor: number; status: StatusProp; validade: string; criada: string;
  itens: string[];
};

type Contrato = {
  id: string; clienteNome: string; tipo: string; valor: number;
  inicio: string; fim: string; status: StatusContrato;
};

type Chamado = {
  id: string; titulo: string; categoria: string; prioridade: Prioridade;
  responsavel: string; status: StatusChamado; slaHoras: number;
  abertura: string; clienteNome: string; descricao: string;
  mensagens: MsgChat[];
};

type MsgChat = {
  id: string; remetente: string; texto: string; data: string;
  tipo: "interno" | "cliente" | "sistema";
};

type LogCrm = {
  id: string; data: string; usuario: string; acao: string; modulo: string; detalhe: string;
};

/* ─── Dados iniciais (vazios — preenchidos pelo usuario) ────── */

const LEADS_INIT: Lead[] = [];
const PROPOSTAS_INIT: Proposta[] = [];
const CONTRATOS_INIT: Contrato[] = [];
const CHAMADOS_INIT: Chamado[] = [];
const LOG_INIT: LogCrm[] = [];

/* ─── Configurações ───────────────────────────────────────────── */

const PIPELINE_COLS: { id: StatusLead; label: string; cor: string; bg: string; desc: string }[] = [
  { id: "lead",       label: "Lead",        cor: "var(--muted)", bg: "var(--panel-2)",  desc: "Novo interesse" },
  { id: "contato",    label: "Contato",     cor: "#93c5fd", bg: "rgba(96,165,250,0.15)",  desc: "Primeiro contato" },
  { id: "proposta",   label: "Proposta",    cor: "#c4b5fd", bg: "rgba(196,181,253,0.15)",  desc: "Proposta enviada" },
  { id: "negociacao", label: "Negociação",  cor: "#fbbf24", bg: "rgba(251,191,36,0.15)",  desc: "Em negociação" },
  { id: "fechamento", label: "Fechamento",  cor: "#34d399", bg: "rgba(52,211,153,0.15)",  desc: "Contrato gerado" },
];

const S_LEAD: Record<StatusLead, { bg: string; color: string; label: string }> = {
  lead:       { bg: "var(--panel-2)", color: "#374151", label: "Lead" },
  contato:    { bg: "rgba(96,165,250,0.15)", color: "#93c5fd", label: "Contato" },
  proposta:   { bg: "rgba(196,181,253,0.15)", color: "#c4b5fd", label: "Proposta" },
  negociacao: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "Negociação" },
  fechamento: { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "Fechamento" },
  perdido:    { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Perdido" },
};

const S_PROP: Record<StatusProp, { bg: string; color: string; label: string }> = {
  rascunho: { bg: "rgba(148,163,184,0.15)", color: "var(--muted)", label: "Rascunho" },
  enviada:  { bg: "rgba(96,165,250,0.15)", color: "#93c5fd", label: "Enviada" },
  aceita:   { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "Aceita" },
  recusada: { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Recusada" },
  expirada: { bg: "rgba(148,163,184,0.15)", color: "#9ca3af", label: "Expirada" },
};

const S_CONT: Record<StatusContrato, { bg: string; color: string; label: string }> = {
  ativo:    { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "Ativo" },
  a_vencer: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "A vencer" },
  vencido:  { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Vencido" },
  cancelado:{ bg: "rgba(148,163,184,0.15)", color: "#9ca3af", label: "Cancelado" },
};

const S_CHAM: Record<StatusChamado, { bg: string; color: string; label: string }> = {
  aberto:       { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "Aberto" },
  em_andamento: { bg: "rgba(96,165,250,0.15)", color: "#93c5fd", label: "Em andamento" },
  concluido:    { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "Concluído" },
  cancelado:    { bg: "rgba(148,163,184,0.15)", color: "#9ca3af", label: "Cancelado" },
};

const S_PRIOR: Record<Prioridade, { bg: string; color: string; label: string; icon: string }> = {
  baixa:   { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "Baixa",   icon: "▽" },
  media:   { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "Média",   icon: "◈" },
  alta:    { bg: "rgba(251,146,60,0.15)", color: "#fb923c", label: "Alta",    icon: "△" },
  critica: { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Crítica", icon: "🔴" },
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "pipeline",    label: "Pipeline",    icon: "⬤" },
  { id: "leads",       label: "Leads",       icon: "👤" },
  { id: "propostas",   label: "Propostas",   icon: "📄" },
  { id: "contratos",   label: "Contratos",   icon: "📋" },
  { id: "atendimento", label: "Atendimento", icon: "🎧" },
  { id: "mensagens",   label: "Mensagens",   icon: "💬" },
  { id: "historico",   label: "Histórico",   icon: "⌛" },
];

const ORIGENS = ["Indicação", "Google Ads", "Site", "Instagram", "LinkedIn", "Feirão", "Parceiro", "Outro"];
const CATEGORIAS_CHAMADO = ["Fiscal", "Contábil", "DP", "Societário", "Financeiro", "TI", "Outros"];

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ display: "inline-block", background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ textAlign: right ? "right" : "left", padding: "0.7rem 0.875rem", color: "#a5b4fc", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid rgba(99,102,241,0.35)", background: "rgba(99,102,241,0.15)" }}>{children}</th>;
}

function TD({ children, right, muted, bold, color }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean; color?: string }) {
  return <td style={{ padding: "0.75rem 0.875rem", textAlign: right ? "right" : "left", color: color ?? (muted ? "#9ca3af" : "var(--ink)"), fontSize: "0.85rem", borderBottom: "1px solid rgba(99,102,241,0.12)", fontWeight: bold ? 700 : 400 }}>{children}</td>;
}

function slaLabel(abertura: string, slaHoras: number, status: StatusChamado) {
  if (status === "concluido" || status === "cancelado") return null;
  const limite = new Date(new Date(abertura).getTime() + slaHoras * 3600000);
  const restante = Math.ceil((limite.getTime() - Date.now()) / 3600000);
  if (restante < 0) return { text: `SLA vencido há ${Math.abs(restante)}h`, color: "#f87171", bg: "rgba(248,113,113,0.15)" };
  if (restante < 4) return { text: `${restante}h restantes`, color: "#f87171", bg: "rgba(248,113,113,0.15)" };
  if (restante < 12) return { text: `${restante}h restantes`, color: "#fbbf24", bg: "rgba(251,191,36,0.15)" };
  return { text: `${restante}h restantes`, color: "#34d399", bg: "rgba(52,211,153,0.15)" };
}

/* ─── Componente ─────────────────────────────────────────────── */

export default function CrmPage() {
  const [tab, setTab] = useState<Tab>("pipeline");
  const [leads, setLeads] = useState<Lead[]>(LEADS_INIT);
  const [propostas] = useState<Proposta[]>(PROPOSTAS_INIT);
  const [contratos] = useState<Contrato[]>(CONTRATOS_INIT);
  const [chamados, setChamados] = useState<Chamado[]>(CHAMADOS_INIT);
  const [log, setLog] = useState<LogCrm[]>(LOG_INIT);

  /* Lead form */
  const [novoLead, setNovoLead] = useState(false);
  const [lNome, setLNome] = useState(""); const [lEmpresa, setLEmpresa] = useState("");
  const [lOrigem, setLOrigem] = useState("Indicação"); const [lValor, setLValor] = useState("");
  const [lResp, setLResp] = useState(""); const [lTel, setLTel] = useState("");
  const [lEmail, setLEmail] = useState("");

  /* Chamado selecionado para chat */
  const [chamadoSel, setChamadoSel] = useState<string | null>("ch1");
  const [novaMsgTexto, setNovaMsgTexto] = useState("");
  const [novaChamadoTitulo, setNovaChamadoTitulo] = useState("");
  const [novaChamadoCat, setNovaChamadoCat] = useState("Fiscal");
  const [novaChamadoPrior, setNovaChamadoPrior] = useState<Prioridade>("media");
  const [novaChamadoDesc, setNovaChamadoDesc] = useState("");
  const [novaChamadoCliente, setNovaChamadoCliente] = useState("");
  const [showNovoChamado, setShowNovoChamado] = useState(false);

  /* Filtros */
  const [filtLeadStatus, setFiltLeadStatus] = useState<StatusLead | "">("");
  const [filtChamadoStatus, setFiltChamadoStatus] = useState<StatusChamado | "">("");

  /* ── Auditoria ── */
  function audit(acao: string, modulo: string, detalhe: string) {
    setLog((prev) => [{ id: crypto.randomUUID(), data: new Date().toISOString(), usuario: "Usuário Atual", acao, modulo, detalhe }, ...prev]);
  }

  /* ── Lead actions ── */
  function criarLead() {
    if (!lNome || !lEmpresa) return;
    const l: Lead = { id: crypto.randomUUID(), nome: lNome, empresa: lEmpresa, origem: lOrigem, telefone: lTel, email: lEmail, valorEstimado: parseFloat(lValor) || 0, responsavel: lResp, status: "lead", criadoEm: new Date().toISOString().slice(0, 10), obs: "" };
    setLeads((prev) => [l, ...prev]);
    audit("Lead criado", "Leads", `${lNome} — ${lEmpresa}`);
    setNovoLead(false); setLNome(""); setLEmpresa(""); setLValor(""); setLResp(""); setLTel(""); setLEmail("");
  }

  function moverLead(id: string, novoStatus: StatusLead) {
    setLeads((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      audit("Lead movido", "Pipeline", `${l.nome}: ${S_LEAD[l.status].label} → ${S_LEAD[novoStatus].label}`);
      return { ...l, status: novoStatus };
    }));
  }

  function converterLead(id: string) {
    moverLead(id, "fechamento");
    audit("Lead convertido", "Pipeline", `${leads.find((l) => l.id === id)?.nome} → cliente`);
  }

  /* ── Chamado actions ── */
  function criarChamado() {
    if (!novaChamadoTitulo || !novaChamadoCliente) return;
    const c: Chamado = {
      id: crypto.randomUUID(), titulo: novaChamadoTitulo, categoria: novaChamadoCat,
      prioridade: novaChamadoPrior, responsavel: "Não atribuído", status: "aberto",
      slaHoras: novaChamadoPrior === "critica" ? 4 : novaChamadoPrior === "alta" ? 24 : 48,
      abertura: new Date().toISOString(), clienteNome: novaChamadoCliente,
      descricao: novaChamadoDesc,
      mensagens: [{ id: crypto.randomUUID(), remetente: "Sistema", texto: "Chamado aberto.", data: new Date().toISOString(), tipo: "sistema" }],
    };
    setChamados((prev) => [c, ...prev]);
    audit("Chamado criado", "Atendimento", `${novaChamadoTitulo} — ${novaChamadoCliente}`);
    setShowNovoChamado(false); setNovaChamadoTitulo(""); setNovaChamadoDesc(""); setNovaChamadoCliente("");
    setChamadoSel(c.id);
  }

  function enviarMsg(chamadoId: string) {
    if (!novaMsgTexto.trim()) return;
    setChamados((prev) => prev.map((c) => {
      if (c.id !== chamadoId) return c;
      const msg: MsgChat = { id: crypto.randomUUID(), remetente: "Atendente", texto: novaMsgTexto, data: new Date().toISOString(), tipo: "interno" };
      audit("Mensagem enviada", "Atendimento", `${c.titulo} — ${novaMsgTexto.slice(0, 40)}`);
      return { ...c, mensagens: [...c.mensagens, msg] };
    }));
    setNovaMsgTexto("");
  }

  function avancarChamado(id: string) {
    const ordem: StatusChamado[] = ["aberto", "em_andamento", "concluido"];
    setChamados((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const idx = ordem.indexOf(c.status);
      if (idx >= ordem.length - 1) return c;
      const novo = ordem[idx + 1];
      const msg: MsgChat = { id: crypto.randomUUID(), remetente: "Sistema", texto: `Status atualizado para: ${S_CHAM[novo].label}`, data: new Date().toISOString(), tipo: "sistema" };
      audit("Status chamado", "Atendimento", `${c.titulo}: ${S_CHAM[c.status].label} → ${S_CHAM[novo].label}`);
      return { ...c, status: novo, mensagens: [...c.mensagens, msg] };
    }));
  }

  /* ── Métricas ── */
  const leadsAtivos = leads.filter((l) => l.status !== "perdido").length;
  const taxaConversao = leads.length > 0 ? Math.round((leads.filter((l) => l.status === "fechamento").length / leads.length) * 100) : 0;
  const receitaPipeline = leads.filter((l) => l.status !== "perdido").reduce((a, l) => a + l.valorEstimado, 0);
  const chamadosAbertos = chamados.filter((c) => c.status === "aberto" || c.status === "em_andamento").length;
  const chamadoSelecionado = chamados.find((c) => c.id === chamadoSel) ?? null;

  const leadsFiltrados = leads.filter((l) => filtLeadStatus === "" || l.status === filtLeadStatus);
  const chamadosFiltrados = chamados.filter((c) => filtChamadoStatus === "" || c.status === filtChamadoStatus);

  return (
    <AppShell>
      {/* ── Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 900, color: "var(--ink)" }}>CRM & Atendimento</h1>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>Pipeline de vendas, propostas, contratos e suporte ao cliente</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => { setTab("leads"); setNovoLead(true); }} type="button">+ Novo lead</button>
          <button onClick={() => { setTab("atendimento"); setShowNovoChamado(true); }} type="button" style={{ background: "linear-gradient(135deg, #4338ca, #6366f1)" }}>+ Chamado</button>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {[
          { label: "Leads ativos",       value: leadsAtivos,           suffix: "em andamento",      color: "#a5b4fc", bg: "rgba(99,102,241,0.15)" },
          { label: "Taxa de conversão",  value: `${taxaConversao}%`,   suffix: "leads → clientes",  color: "#34d399", bg: "rgba(52,211,153,0.15)" },
          { label: "Receita pipeline",   value: fmt(receitaPipeline),  suffix: "potencial mensal",  color: "#c4b5fd", bg: "rgba(196,181,253,0.15)" },
          { label: "Propostas ativas",   value: propostas.filter((p) => p.status === "enviada").length, suffix: "aguardando retorno", color: "#67e8f9", bg: "#ecfeff" },
          { label: "Chamados abertos",   value: chamadosAbertos,       suffix: "aguardam atend.",   color: chamadosAbertos > 0 ? "#fbbf24" : "#34d399", bg: chamadosAbertos > 0 ? "rgba(251,191,36,0.15)" : "rgba(52,211,153,0.15)" },
        ].map((k) => (
          <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "0.875rem 1rem" }}>
            <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</p>
            <p style={{ margin: "0 0 2px", fontSize: typeof k.value === "string" && k.value.length > 5 ? "1rem" : "1.6rem", fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>{k.suffix}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ background: "var(--panel)", borderRadius: "12px 12px 0 0", border: "1px solid rgba(99,102,241,0.35)", borderBottom: "none" }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 6px" }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{ background: "none", border: "none", cursor: "pointer", borderBottom: tab === t.id ? "2px solid #a5b4fc" : "2px solid transparent", color: tab === t.id ? "#a5b4fc" : "#9ca3af", fontWeight: tab === t.id ? 800 : 500, fontSize: "0.8rem", padding: "0.85rem 0.9rem", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.35rem", marginBottom: -2, transition: "color 0.15s" }}
              type="button">
              <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>{t.icon}</span>
              {t.label}
              {t.id === "atendimento" && chamadosAbertos > 0 && (
                <span style={{ background: "rgba(251,191,36,0.2)", color: "#fbbf24", borderRadius: 999, fontSize: "0.62rem", fontWeight: 900, padding: "1px 6px" }}>{chamadosAbertos}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "var(--panel)", border: "1px solid rgba(99,102,241,0.35)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

        {/* ════════════════ PIPELINE ════════════════ */}
        {tab === "pipeline" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Pipeline de Vendas</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{fmt(receitaPipeline)} em potencial — {leadsAtivos} leads ativos</p>
              </div>
              <button onClick={() => { setTab("leads"); setNovoLead(true); }} type="button">+ Novo lead</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10, overflowX: "auto" }}>
              {PIPELINE_COLS.map((col) => {
                const itens = leads.filter((l) => l.status === col.id);
                const totalCol = itens.reduce((a, l) => a + l.valorEstimado, 0);
                return (
                  <div key={col.id} style={{ background: col.bg, border: `1px solid ${col.cor}22`, borderTop: `3px solid ${col.cor}`, borderRadius: 10, padding: "0.75rem", minHeight: 220 }}>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: col.cor, textTransform: "uppercase", letterSpacing: "0.5px" }}>{col.label}</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 900, background: `${col.cor}20`, color: col.cor, borderRadius: 999, padding: "1px 7px" }}>{itens.length}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{fmt(totalCol)}</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {itens.map((l) => (
                        <div key={l.id} style={{ background: "var(--panel)", borderRadius: 8, padding: "10px 10px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid rgba(148,163,184,0.15)", cursor: "pointer" }} onClick={() => setTab("leads")}>
                          <p style={{ margin: "0 0 2px", fontSize: "0.8rem", fontWeight: 800, color: "var(--ink)", lineHeight: 1.3 }}>{l.nome}</p>
                          <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "#9ca3af" }}>{l.empresa}</p>
                          <p style={{ margin: "0 0 5px", fontSize: "0.72rem", color: "#9ca3af" }}>via {l.origem}</p>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <strong style={{ fontSize: "0.8rem", color: "#a5b4fc" }}>{fmt(l.valorEstimado)}/mês</strong>
                            <button className="small-action" onClick={(e) => { e.stopPropagation(); const ordem: StatusLead[] = ["lead","contato","proposta","negociacao","fechamento"]; const idx = ordem.indexOf(l.status); if (idx < ordem.length - 1) moverLead(l.id, ordem[idx + 1]); }} style={{ padding: "2px 7px", fontSize: "0.65rem" }} type="button">→</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ════════════════ LEADS ════════════════ */}
        {tab === "leads" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Leads</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{leadsFiltrados.length} leads · {fmt(leads.filter((l) => l.status !== "perdido").reduce((a, l) => a + l.valorEstimado, 0))} em potencial</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="input" onChange={(e) => setFiltLeadStatus(e.target.value as StatusLead | "")} value={filtLeadStatus}>
                  <option value="">Todos os status</option>
                  {(["lead","contato","proposta","negociacao","fechamento","perdido"] as StatusLead[]).map((s) => <option key={s} value={s}>{S_LEAD[s].label}</option>)}
                </select>
                <button onClick={() => setNovoLead(!novoLead)} type="button">{novoLead ? "✕ Cancelar" : "+ Novo lead"}</button>
              </div>
            </div>

            {novoLead && (
              <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 12, padding: "1.25rem" }}>
                <p style={{ margin: "0 0 0.875rem", fontWeight: 800, fontSize: "0.875rem", color: "#a5b4fc" }}>Novo lead</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 160px 130px", gap: 10, marginBottom: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Nome completo *<input className="input" value={lNome} onChange={(e) => setLNome(e.target.value)} placeholder="Ex: Roberto Mendes" />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Empresa *<input className="input" value={lEmpresa} onChange={(e) => setLEmpresa(e.target.value)} placeholder="Ex: Mendes Transportes" />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Origem
                    <select className="input" value={lOrigem} onChange={(e) => setLOrigem(e.target.value)}>
                      {ORIGENS.map((o) => <option key={o}>{o}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Valor est. (R$/mês)<input className="input" value={lValor} onChange={(e) => setLValor(e.target.value)} placeholder="Ex: 1200" />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    E-mail<input className="input" value={lEmail} onChange={(e) => setLEmail(e.target.value)} placeholder="email@empresa.com" />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Telefone<input className="input" value={lTel} onChange={(e) => setLTel(e.target.value)} placeholder="(11) 99999-0000" />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Responsável<input className="input" value={lResp} onChange={(e) => setLResp(e.target.value)} placeholder="Ex: Ana Lima" />
                  </label>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button disabled={!lNome || !lEmpresa} onClick={criarLead} style={{ opacity: (!lNome || !lEmpresa) ? 0.5 : 1 }} type="button">✓ Cadastrar lead</button>
                </div>
              </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Contato</TH><TH>Empresa</TH><TH>Origem</TH><TH>Responsável</TH><TH right>Valor est.</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
              <tbody>
                {leadsFiltrados.map((l) => (
                  <tr key={l.id} style={{ background: l.status === "fechamento" ? "#f8fff8" : l.status === "perdido" ? "#fff8f8" : "transparent" }}>
                    <TD>
                      <div>
                        <p style={{ margin: "0 0 1px", fontWeight: 700 }}>{l.nome}</p>
                        <p style={{ margin: "0 0 1px", fontSize: "0.72rem", color: "#9ca3af" }}>{l.email}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{l.telefone}</p>
                      </div>
                    </TD>
                    <TD>{l.empresa}</TD>
                    <TD muted>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc", background: "rgba(99,102,241,0.15)", borderRadius: 999, padding: "2px 8px" }}>{l.origem}</span>
                    </TD>
                    <TD muted>{l.responsavel || "—"}</TD>
                    <TD right bold color="#a5b4fc">{fmt(l.valorEstimado)}/mês</TD>
                    <TD><Badge {...S_LEAD[l.status]} /></TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <select className="input" onChange={(e) => moverLead(l.id, e.target.value as StatusLead)} value={l.status} style={{ fontSize: "0.72rem", padding: "3px 6px", minWidth: 110 }}>
                          {(["lead","contato","proposta","negociacao","fechamento","perdido"] as StatusLead[]).map((s) => <option key={s} value={s}>{S_LEAD[s].label}</option>)}
                        </select>
                        {l.status !== "fechamento" && l.status !== "perdido" && (
                          <button className="small-action" onClick={() => converterLead(l.id)} title="Converter em cliente" type="button">✓</button>
                        )}
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════ PROPOSTAS ════════════════ */}
        {tab === "propostas" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Propostas Comerciais</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{propostas.length} propostas · {fmt(propostas.filter((p) => p.status === "aceita").reduce((a, p) => a + p.valor, 0))} aceitas</p></div>
              <button onClick={() => audit("Proposta criada", "Propostas", "Nova proposta")} type="button">+ Nova proposta</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {(["rascunho","enviada","aceita","recusada","expirada"] as StatusProp[]).map((s) => {
                const count = propostas.filter((p) => p.status === s).length;
                const total = propostas.filter((p) => p.status === s).reduce((a, p) => a + p.valor, 0);
                return (
                  <div key={s} style={{ background: S_PROP[s].bg, borderTop: `3px solid ${S_PROP[s].color}`, borderRadius: 10, padding: "0.875rem 1rem", border: `1px solid ${S_PROP[s].color}22` }}>
                    <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{S_PROP[s].label}</p>
                    <p style={{ margin: "0 0 1px", fontSize: "1.4rem", fontWeight: 900, color: S_PROP[s].color, lineHeight: 1 }}>{count}</p>
                    <p style={{ margin: 0, fontSize: "0.72rem", fontWeight: 700, color: S_PROP[s].color }}>{fmt(total)}/mês</p>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {propostas.map((p) => (
                <div key={p.id} style={{ background: "var(--panel)", border: `1px solid ${S_PROP[p.status].color}33`, borderLeft: `4px solid ${S_PROP[p.status].color}`, borderRadius: 10, padding: "1rem 1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <Badge {...S_PROP[p.status]} />
                        <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>#{p.id}</span>
                      </div>
                      <h3 style={{ margin: "0 0 3px", fontSize: "0.9rem", fontWeight: 800, color: "var(--ink)" }}>{p.titulo}</h3>
                      <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "#9ca3af" }}>{p.clienteNome} · Válida até {new Date(p.validade).toLocaleDateString("pt-BR")}</p>
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                        {p.itens.map((item) => (
                          <span key={item} style={{ fontSize: "0.7rem", fontWeight: 700, color: "#a5b4fc", background: "rgba(99,102,241,0.15)", borderRadius: 999, padding: "2px 8px" }}>{item}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "1.2rem", fontWeight: 900, color: "#a5b4fc" }}>{fmt(p.valor)}</p>
                      <p style={{ margin: "0 0 8px", fontSize: "0.72rem", color: "#9ca3af" }}>por mês</p>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="small-action" onClick={() => audit("Proposta enviada", "Propostas", `${p.titulo} — ${p.clienteNome}`)} type="button">📧 Enviar</button>
                        <button className="small-action" onClick={() => audit("Proposta exportada", "Propostas", `${p.titulo} PDF`)} type="button">📄 PDF</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════ CONTRATOS ════════════════ */}
        {tab === "contratos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Contratos Ativos</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>MRR contratado: <strong style={{ color: "#a5b4fc" }}>{fmt(contratos.filter((c) => c.status === "ativo").reduce((a, c) => a + c.valor, 0))}</strong></p></div>
              <button onClick={() => audit("Contrato gerado", "Contratos", "Novo contrato")} type="button">+ Novo contrato</button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Cliente</TH><TH>Tipo</TH><TH right>Valor mensal</TH><TH>Início</TH><TH>Fim</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
              <tbody>
                {contratos.map((c) => (
                  <tr key={c.id} style={{ background: c.status === "a_vencer" ? "#fffbf0" : c.status === "vencido" ? "#fff8f8" : "transparent" }}>
                    <TD bold>{c.clienteNome}</TD>
                    <TD muted>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc", background: "rgba(99,102,241,0.15)", borderRadius: 999, padding: "2px 8px" }}>{c.tipo}</span>
                    </TD>
                    <TD right bold color="#a5b4fc">{fmt(c.valor)}/mês</TD>
                    <TD muted>{new Date(c.inicio).toLocaleDateString("pt-BR")}</TD>
                    <TD>
                      <span style={{ fontWeight: 600, color: c.status === "a_vencer" ? "#fbbf24" : c.status === "vencido" ? "#f87171" : "#374151", fontSize: "0.82rem" }}>
                        {c.status === "a_vencer" && "⚠ "}{new Date(c.fim).toLocaleDateString("pt-BR")}
                      </span>
                    </TD>
                    <TD><Badge {...S_CONT[c.status]} /></TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button className="small-action" onClick={() => audit("Contrato renovado", "Contratos", c.clienteNome)} type="button">↻ Renovar</button>
                        <button className="small-action" onClick={() => audit("Contrato exportado", "Contratos", c.clienteNome)} type="button">📄 PDF</button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════ ATENDIMENTO ════════════════ */}
        {tab === "atendimento" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Central de Atendimento</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{chamadosAbertos} abertos · {chamados.filter((c) => c.status === "concluido").length} concluídos</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="input" onChange={(e) => setFiltChamadoStatus(e.target.value as StatusChamado | "")} value={filtChamadoStatus}>
                  <option value="">Todos</option>
                  <option value="aberto">Aberto</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluido">Concluído</option>
                </select>
                <button onClick={() => setShowNovoChamado(!showNovoChamado)} type="button">{showNovoChamado ? "✕" : "+ Novo chamado"}</button>
              </div>
            </div>

            {showNovoChamado && (
              <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: 12, padding: "1.25rem" }}>
                <p style={{ margin: "0 0 0.875rem", fontWeight: 800, fontSize: "0.875rem", color: "#a5b4fc" }}>Novo chamado</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 140px 160px", gap: 10, marginBottom: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Título *<input className="input" value={novaChamadoTitulo} onChange={(e) => setNovaChamadoTitulo(e.target.value)} placeholder="Ex: Dúvida sobre DAS" />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Categoria
                    <select className="input" value={novaChamadoCat} onChange={(e) => setNovaChamadoCat(e.target.value)}>
                      {CATEGORIAS_CHAMADO.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Prioridade
                    <select className="input" value={novaChamadoPrior} onChange={(e) => setNovaChamadoPrior(e.target.value as Prioridade)}>
                      {(["baixa","media","alta","critica"] as Prioridade[]).map((p) => <option key={p} value={p}>{S_PRIOR[p].label}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc" }}>
                    Cliente *<input className="input" value={novaChamadoCliente} onChange={(e) => setNovaChamadoCliente(e.target.value)} placeholder="Nome do cliente" />
                  </label>
                </div>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#a5b4fc", marginBottom: 12 }}>
                  Descrição<textarea className="input" value={novaChamadoDesc} onChange={(e) => setNovaChamadoDesc(e.target.value)} rows={2} style={{ resize: "vertical" }} />
                </label>
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button disabled={!novaChamadoTitulo || !novaChamadoCliente} onClick={criarChamado} style={{ opacity: (!novaChamadoTitulo || !novaChamadoCliente) ? 0.5 : 1 }} type="button">✓ Abrir chamado</button>
                </div>
              </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Título</TH><TH>Cliente</TH><TH>Categoria</TH><TH>Prioridade</TH><TH>Responsável</TH><TH>SLA</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
              <tbody>
                {chamadosFiltrados.map((c) => {
                  const sla = slaLabel(c.abertura, c.slaHoras, c.status);
                  return (
                    <tr key={c.id} style={{ background: c.prioridade === "critica" ? "#fff5f5" : "transparent" }}>
                      <TD>
                        <button onClick={() => { setChamadoSel(c.id); setTab("mensagens"); }} style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }} type="button">
                          <p style={{ margin: "0 0 2px", fontWeight: 700, color: "#a5b4fc", fontSize: "0.85rem" }}>{c.titulo}</p>
                          <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>{new Date(c.abertura).toLocaleDateString("pt-BR")}</p>
                        </button>
                      </TD>
                      <TD muted>{c.clienteNome}</TD>
                      <TD muted>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a5b4fc", background: "rgba(99,102,241,0.15)", borderRadius: 999, padding: "2px 8px" }}>{c.categoria}</span>
                      </TD>
                      <TD>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, ...S_PRIOR[c.prioridade], borderRadius: 999, padding: "2px 9px", display: "inline-block" }}>
                          {S_PRIOR[c.prioridade].icon} {S_PRIOR[c.prioridade].label}
                        </span>
                      </TD>
                      <TD muted>{c.responsavel}</TD>
                      <TD>
                        {sla ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, background: sla.bg, color: sla.color, borderRadius: 999, padding: "2px 8px" }}>{sla.text}</span>
                        ) : <span style={{ color: "#9ca3af" }}>—</span>}
                      </TD>
                      <TD><Badge {...S_CHAM[c.status]} /></TD>
                      <TD right>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button className="small-action" onClick={() => { setChamadoSel(c.id); setTab("mensagens"); }} type="button">💬</button>
                          {c.status !== "concluido" && <button className="small-action" onClick={() => avancarChamado(c.id)} type="button">→</button>}
                        </div>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════ MENSAGENS / CHAT ════════════════ */}
        {tab === "mensagens" && (
          <div style={{ display: "grid", gridTemplateColumns: "280px 1fr", gap: "1.25rem", minHeight: 500 }}>
            {/* Lista de chamados */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <p style={{ margin: "0 0 8px", fontSize: "0.75rem", fontWeight: 800, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "1px" }}>Chamados com mensagens</p>
              {chamados.map((c) => {
                const sel = chamadoSel === c.id;
                const naoLidas = c.mensagens.filter((m) => m.tipo === "cliente").length;
                return (
                  <div
                    key={c.id}
                    onClick={() => setChamadoSel(c.id)}
                    style={{ padding: "10px 12px", borderRadius: 10, border: `2px solid ${sel ? "#a5b4fc" : "rgba(99,102,241,0.35)"}`, cursor: "pointer", background: sel ? "rgba(99,102,241,0.15)" : "var(--panel)", transition: "all 0.15s" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 3 }}>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: "0.82rem", color: sel ? "#a5b4fc" : "var(--ink)", lineHeight: 1.3 }}>{c.titulo}</p>
                      {naoLidas > 0 && <span style={{ background: "#a5b4fc", color: "#ffffff", borderRadius: 999, fontSize: "0.65rem", fontWeight: 900, padding: "1px 6px", flexShrink: 0 }}>{naoLidas}</span>}
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: "0.72rem", color: "#9ca3af" }}>{c.clienteNome}</p>
                    <Badge {...S_CHAM[c.status]} />
                  </div>
                );
              })}
            </div>

            {/* Chat */}
            {chamadoSelecionado ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 0, border: "1px solid rgba(99,102,241,0.35)", borderRadius: 12, overflow: "hidden" }}>
                {/* Header chamado */}
                <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.15)", borderBottom: "1px solid rgba(99,102,241,0.35)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.9rem", color: "#a5b4fc" }}>{chamadoSelecionado.titulo}</p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{chamadoSelecionado.clienteNome} · {chamadoSelecionado.categoria} · Responsável: {chamadoSelecionado.responsavel}</p>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <Badge {...S_PRIOR[chamadoSelecionado.prioridade]} />
                    <Badge {...S_CHAM[chamadoSelecionado.status]} />
                    {chamadoSelecionado.status !== "concluido" && (
                      <button className="small-action" onClick={() => avancarChamado(chamadoSelecionado.id)} type="button">→ Avançar</button>
                    )}
                  </div>
                </div>

                {/* Mensagens */}
                <div style={{ flex: 1, overflowY: "auto", padding: "1rem", display: "flex", flexDirection: "column", gap: 10, minHeight: 300, maxHeight: 380, background: "#fafbff" }}>
                  {chamadoSelecionado.mensagens.map((msg) => {
                    const isCliente = msg.tipo === "cliente";
                    const isSistema = msg.tipo === "sistema";
                    if (isSistema) {
                      return (
                        <div key={msg.id} style={{ textAlign: "center" }}>
                          <span style={{ fontSize: "0.72rem", color: "#9ca3af", background: "rgba(148,163,184,0.15)", borderRadius: 999, padding: "2px 10px" }}>{msg.texto} · {new Date(msg.data).toLocaleString("pt-BR")}</span>
                        </div>
                      );
                    }
                    return (
                      <div key={msg.id} style={{ display: "flex", justifyContent: isCliente ? "flex-start" : "flex-end" }}>
                        <div style={{ maxWidth: "70%" }}>
                          <p style={{ margin: "0 0 3px", fontSize: "0.68rem", color: "#9ca3af", textAlign: isCliente ? "left" : "right" }}>{msg.remetente}</p>
                          <div style={{ background: isCliente ? "var(--panel)" : "#a5b4fc", color: isCliente ? "var(--ink)" : "var(--panel)", borderRadius: isCliente ? "4px 12px 12px 12px" : "12px 4px 12px 12px", padding: "8px 12px", border: isCliente ? "1px solid rgba(99,102,241,0.35)" : "none", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}>
                            <p style={{ margin: 0, fontSize: "0.85rem", lineHeight: 1.5 }}>{msg.texto}</p>
                          </div>
                          <p style={{ margin: "2px 0 0", fontSize: "0.65rem", color: "#c4cadf", textAlign: isCliente ? "left" : "right" }}>{new Date(msg.data).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Input envio */}
                {chamadoSelecionado.status !== "concluido" && (
                  <div style={{ padding: "12px 16px", background: "var(--panel)", borderTop: "1px solid rgba(99,102,241,0.35)", display: "flex", gap: 10 }}>
                    <input
                      className="input"
                      onChange={(e) => setNovaMsgTexto(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && enviarMsg(chamadoSelecionado.id)}
                      placeholder="Digite uma mensagem para o cliente... (Enter para enviar)"
                      style={{ flex: 1 }}
                      value={novaMsgTexto}
                    />
                    <button className="small-action" onClick={() => audit("Arquivo anexado", "Atendimento", chamadoSelecionado.titulo)} type="button">📎</button>
                    <button disabled={!novaMsgTexto.trim()} onClick={() => enviarMsg(chamadoSelecionado.id)} style={{ opacity: !novaMsgTexto.trim() ? 0.5 : 1 }} type="button">Enviar →</button>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#f8faff", borderRadius: 12, border: "1px solid rgba(99,102,241,0.35)", color: "#9ca3af", fontSize: "0.85rem" }}>
                Selecione um chamado para ver as mensagens
              </div>
            )}
          </div>
        )}

        {/* ════════════════ HISTÓRICO ════════════════ */}
        {tab === "historico" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Histórico de Auditoria</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{log.length} registros · rastreamento completo</p></div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#a5b4fc", background: "rgba(99,102,241,0.15)", borderRadius: 999, padding: "3px 10px", border: "1px solid rgba(99,102,241,0.35)" }}>⚡ Tempo real</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Data / Hora</TH><TH>Usuário</TH><TH>Ação</TH><TH>Módulo</TH><TH>Detalhe</TH></tr></thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={entry.id}>
                    <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{new Date(entry.data).toLocaleString("pt-BR")}</span></TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: entry.usuario === "Sistema" ? "rgba(148,163,184,0.15)" : "rgba(99,102,241,0.15)", color: entry.usuario === "Sistema" ? "var(--muted)" : "#a5b4fc", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0 }}>
                          {entry.usuario === "Sistema" ? "SYS" : entry.usuario.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{entry.usuario}</span>
                      </div>
                    </TD>
                    <TD bold color="#a5b4fc">{entry.acao}</TD>
                    <TD muted>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "rgba(99,102,241,0.15)", color: "#a5b4fc", borderRadius: 999, padding: "2px 8px" }}>{entry.modulo}</span>
                    </TD>
                    <TD muted>{entry.detalhe}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </AppShell>
  );
}
