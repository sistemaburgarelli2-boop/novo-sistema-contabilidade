"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type TipoConta = "ativo" | "passivo" | "pl" | "receita" | "custo" | "despesa";
type StatusLanc = "rascunho" | "conferido" | "fechado";
type StatusConc = "pendente" | "conciliado" | "ignorado" | "divergente";
type StatusFecha = "aberto" | "em_andamento" | "revisao" | "fechado";

type ContaPlano = {
  id: string; codigo: string; nome: string; tipo: TipoConta;
  nivel: number; paiId: string | null; ativo: boolean;
  saldo: number; natureza: "devedora" | "credora";
};

type Lancamento = {
  id: string; data: string; documento: string; historico: string;
  contaDebito: string; contaCredito: string; valor: number;
  centroCusto: string; status: StatusLanc;
};

type MovConciliacao = {
  id: string; data: string; descricao: string; valor: number;
  tipo: "entrada" | "saida"; status: StatusConc; lancId: string | null;
};

type LinhaBalancete = {
  codigo: string; conta: string; tipo: TipoConta;
  saldoAnterior: number; debitos: number; creditos: number; saldoAtual: number;
};

type LogContabil = {
  id: string; data: string; usuario: string; acao: string; modulo: string;
  antes: string; depois: string;
};

type Tab = "dashboard" | "plano" | "lancamentos" | "conciliacao" | "balancete" | "dre" | "balanco" | "fluxo" | "fechamento" | "relatorios" | "historico";

/* ─── Ícone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" stroke="currentColor" strokeWidth={2} />
    <path d="M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <path d="M8 7h8M8 11h8M8 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

/* ─── Mock data ───────────────────────────────────────────────── */

const PLANO_INIT: ContaPlano[] = [
  // ATIVO
  { id: "1",    codigo: "1",       nome: "ATIVO",                     tipo: "ativo",   nivel: 1, paiId: null, ativo: true,  saldo: 120000, natureza: "devedora" },
  { id: "1.1",  codigo: "1.1",     nome: "Ativo Circulante",          tipo: "ativo",   nivel: 2, paiId: "1",  ativo: true,  saldo: 85000,  natureza: "devedora" },
  { id: "1.1.1",codigo: "1.1.01",  nome: "Caixa e Equivalentes",      tipo: "ativo",   nivel: 3, paiId: "1.1",ativo: true,  saldo: 42000,  natureza: "devedora" },
  { id: "1.1.2",codigo: "1.1.02",  nome: "Contas a Receber",          tipo: "ativo",   nivel: 3, paiId: "1.1",ativo: true,  saldo: 28000,  natureza: "devedora" },
  { id: "1.1.3",codigo: "1.1.03",  nome: "Estoques",                  tipo: "ativo",   nivel: 3, paiId: "1.1",ativo: true,  saldo: 15000,  natureza: "devedora" },
  { id: "1.2",  codigo: "1.2",     nome: "Ativo Não Circulante",      tipo: "ativo",   nivel: 2, paiId: "1",  ativo: true,  saldo: 35000,  natureza: "devedora" },
  { id: "1.2.1",codigo: "1.2.01",  nome: "Imobilizado",               tipo: "ativo",   nivel: 3, paiId: "1.2",ativo: true,  saldo: 35000,  natureza: "devedora" },
  // PASSIVO
  { id: "2",    codigo: "2",       nome: "PASSIVO",                   tipo: "passivo", nivel: 1, paiId: null, ativo: true,  saldo: 22000,  natureza: "credora" },
  { id: "2.1",  codigo: "2.1",     nome: "Passivo Circulante",        tipo: "passivo", nivel: 2, paiId: "2",  ativo: true,  saldo: 22000,  natureza: "credora" },
  { id: "2.1.1",codigo: "2.1.01",  nome: "Fornecedores",              tipo: "passivo", nivel: 3, paiId: "2.1",ativo: true,  saldo: 8000,   natureza: "credora" },
  { id: "2.1.2",codigo: "2.1.02",  nome: "Obrigações Fiscais",        tipo: "passivo", nivel: 3, paiId: "2.1",ativo: true,  saldo: 7500,   natureza: "credora" },
  { id: "2.1.3",codigo: "2.1.03",  nome: "Obrigações Trabalhistas",   tipo: "passivo", nivel: 3, paiId: "2.1",ativo: true,  saldo: 6500,   natureza: "credora" },
  // PL
  { id: "3",    codigo: "3",       nome: "PATRIMÔNIO LÍQUIDO",        tipo: "pl",      nivel: 1, paiId: null, ativo: true,  saldo: 98000,  natureza: "credora" },
  { id: "3.1",  codigo: "3.1",     nome: "Capital Social",            tipo: "pl",      nivel: 2, paiId: "3",  ativo: true,  saldo: 80000,  natureza: "credora" },
  { id: "3.2",  codigo: "3.2",     nome: "Lucros Acumulados",         tipo: "pl",      nivel: 2, paiId: "3",  ativo: true,  saldo: 18000,  natureza: "credora" },
  // RECEITA
  { id: "4",    codigo: "4",       nome: "RECEITAS",                  tipo: "receita", nivel: 1, paiId: null, ativo: true,  saldo: 12500,  natureza: "credora" },
  { id: "4.1",  codigo: "4.1",     nome: "Receitas de Serviços",      tipo: "receita", nivel: 2, paiId: "4",  ativo: true,  saldo: 12500,  natureza: "credora" },
  // CUSTO/DESPESA
  { id: "5",    codigo: "5",       nome: "CUSTOS E DESPESAS",         tipo: "despesa", nivel: 1, paiId: null, ativo: true,  saldo: 5800,   natureza: "devedora" },
  { id: "5.1",  codigo: "5.1",     nome: "Despesas Administrativas",  tipo: "despesa", nivel: 2, paiId: "5",  ativo: true,  saldo: 1800,   natureza: "devedora" },
  { id: "5.2",  codigo: "5.2",     nome: "Despesas com Pessoal",      tipo: "despesa", nivel: 2, paiId: "5",  ativo: true,  saldo: 4000,   natureza: "devedora" },
];

const LANC_INIT: Lancamento[] = [
  { id: "1", data: "2026-06-10", documento: "NF-001", historico: "Honorários contábeis — cliente ABC", contaDebito: "1.1.01", contaCredito: "4.1", valor: 12500, centroCusto: "Comercial", status: "conferido" },
  { id: "2", data: "2026-06-10", documento: "REC-001", historico: "Recebimento NF-001", contaDebito: "1.1.01", contaCredito: "1.1.02", valor: 12500, centroCusto: "Financeiro", status: "conferido" },
  { id: "3", data: "2026-06-05", documento: "ALU-001", historico: "Aluguel Jun/2026", contaDebito: "5.1", contaCredito: "2.1.01", valor: 1800, centroCusto: "Administrativo", status: "fechado" },
  { id: "4", data: "2026-06-01", documento: "PRO-001", historico: "Pró-labore sócio — Jun/2026", contaDebito: "5.2", contaCredito: "2.1.03", valor: 4000, centroCusto: "Diretoria", status: "conferido" },
  { id: "5", data: "2026-06-18", documento: "RASCUNHO", historico: "Provisão INSS", contaDebito: "5.2", contaCredito: "2.1.02", valor: 800, centroCusto: "RH", status: "rascunho" },
];

const CONC_INIT: MovConciliacao[] = [
  { id: "1", data: "2026-06-10", descricao: "Depósito — NF-001 honorários",  valor: 12500, tipo: "entrada", status: "conciliado", lancId: "1" },
  { id: "2", data: "2026-06-05", descricao: "Débito — Aluguel",              valor: 1800,  tipo: "saida",   status: "conciliado", lancId: "3" },
  { id: "3", data: "2026-06-12", descricao: "TED — fornecedor não ident.",   valor: 950,   tipo: "saida",   status: "pendente",   lancId: null },
  { id: "4", data: "2026-06-15", descricao: "Crédito — estorno bancário",    valor: 230,   tipo: "entrada", status: "pendente",   lancId: null },
  { id: "5", data: "2026-06-18", descricao: "Débito — tarifa bancária",      valor: 45,    tipo: "saida",   status: "ignorado",   lancId: null },
];

const BALANCETE: LinhaBalancete[] = [
  { codigo: "1.1.01", conta: "Caixa e Equivalentes", tipo: "ativo",   saldoAnterior: 38000, debitos: 12500, creditos: 0,    saldoAtual: 42000 },
  { codigo: "1.1.02", conta: "Contas a Receber",     tipo: "ativo",   saldoAnterior: 40500, debitos: 0,     creditos: 12500, saldoAtual: 28000 },
  { codigo: "1.1.03", conta: "Estoques",             tipo: "ativo",   saldoAnterior: 15000, debitos: 0,     creditos: 0,    saldoAtual: 15000 },
  { codigo: "1.2.01", conta: "Imobilizado",          tipo: "ativo",   saldoAnterior: 35000, debitos: 0,     creditos: 0,    saldoAtual: 35000 },
  { codigo: "2.1.01", conta: "Fornecedores",         tipo: "passivo", saldoAnterior: 6200,  debitos: 0,     creditos: 1800, saldoAtual: 8000 },
  { codigo: "2.1.02", conta: "Obrigações Fiscais",   tipo: "passivo", saldoAnterior: 6700,  debitos: 0,     creditos: 800,  saldoAtual: 7500 },
  { codigo: "2.1.03", conta: "Obrigações Trabalhistas", tipo: "passivo", saldoAnterior: 2500, debitos: 0,   creditos: 4000, saldoAtual: 6500 },
  { codigo: "4.1",    conta: "Receitas de Serviços", tipo: "receita", saldoAnterior: 0,     debitos: 0,     creditos: 12500, saldoAtual: 12500 },
  { codigo: "5.1",    conta: "Desp. Administrativas",tipo: "despesa", saldoAnterior: 0,     debitos: 1800,  creditos: 0,    saldoAtual: 1800 },
  { codigo: "5.2",    conta: "Despesas com Pessoal", tipo: "despesa", saldoAnterior: 0,     debitos: 4800,  creditos: 0,    saldoAtual: 4800 },
];

const LOG_INIT: LogContabil[] = [
  { id: "1", data: "2026-06-18T14:30:00", usuario: "João Contador", acao: "Lançamento criado",   modulo: "Lançamentos", antes: "—", depois: "PRO-001 — R$ 4.000,00" },
  { id: "2", data: "2026-06-17T10:15:00", usuario: "Maria Supervisora", acao: "Status alterado",modulo: "Lançamentos", antes: "rascunho", depois: "conferido" },
  { id: "3", data: "2026-06-15T16:00:00", usuario: "João Contador", acao: "Conciliação",         modulo: "Conciliação", antes: "pendente", depois: "conciliado" },
  { id: "4", data: "2026-06-10T09:00:00", usuario: "Sistema",        acao: "DRE gerada",         modulo: "DRE",         antes: "—", depois: "Jun/2026 — lucro R$ 6.700" },
  { id: "5", data: "2026-06-01T08:00:00", usuario: "Sistema",        acao: "Competência aberta", modulo: "Fechamento",  antes: "Mai/2026 fechado", depois: "Jun/2026 aberto" },
];

/* ─── Configurações visuais ───────────────────────────────────── */

const TIPO_CONTA_LABEL: Record<TipoConta, string> = {
  ativo: "Ativo", passivo: "Passivo", pl: "Patr. Líquido",
  receita: "Receita", custo: "Custo", despesa: "Despesa",
};

const TIPO_CONTA_COLOR: Record<TipoConta, string> = {
  ativo: "#065f46", passivo: "#b91c1c", pl: "#7c3aed",
  receita: "#0e7490", custo: "#92400e", despesa: "#374151",
};

const S_LANC: Record<StatusLanc, { bg: string; color: string; label: string }> = {
  rascunho:  { bg: "#fffbeb", color: "#92400e", label: "Rascunho" },
  conferido: { bg: "#eff6ff", color: "#1d4ed8", label: "Conferido" },
  fechado:   { bg: "#f0fdf4", color: "#166534", label: "Fechado" },
};

const S_CONC: Record<StatusConc, { bg: string; color: string; label: string }> = {
  pendente:    { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
  conciliado:  { bg: "#f0fdf4", color: "#166534", label: "Conciliado" },
  ignorado:    { bg: "#f3f4f6", color: "#6b7280", label: "Ignorado" },
  divergente:  { bg: "#fef2f2", color: "#b91c1c", label: "Divergente" },
};

const TABS_CONT = [
  { id: "dashboard",    label: "Dashboard",   icon: "◉" },
  { id: "plano",        label: "Plano",       icon: "🌳" },
  { id: "lancamentos",  label: "Lançamentos", icon: "✎" },
  { id: "conciliacao",  label: "Conciliação", icon: "⇄" },
  { id: "balancete",    label: "Balancete",   icon: "▤" },
  { id: "dre",          label: "DRE",         icon: "📊" },
  { id: "balanco",      label: "Balanço",     icon: "⚖" },
  { id: "fluxo",        label: "Fluxo de Caixa", icon: "💧" },
  { id: "fechamento",   label: "Fechamento",  icon: "🔒" },
  { id: "relatorios",   label: "Relatórios",  icon: "📄" },
  { id: "historico",    label: "Histórico",   icon: "⌛" },
] as const;

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmt(v: number, neg = false) {
  const s = Math.abs(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  return neg && v < 0 ? `(${s})` : s;
}

function pct(val: number, total: number) {
  if (!total) return "0%";
  return `${((val / total) * 100).toFixed(1)}%`;
}

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ display: "inline-block", background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function TH({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return <th style={{ textAlign: right ? "right" : center ? "center" : "left", padding: "0.7rem 0.875rem", color: "#4b6e8e", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #dbeafe", background: "#f8faff" }}>{children}</th>;
}

function TD({ children, right, muted, bold, color }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean; color?: string }) {
  return <td style={{ padding: "0.75rem 0.875rem", textAlign: right ? "right" : "left", color: color ?? (muted ? "#6b8faa" : "#07170d"), fontSize: "0.85rem", borderBottom: "1px solid #f0f6ff", fontWeight: bold ? 700 : 400 }}>{children}</td>;
}

/* ─── Componente principal ────────────────────────────────────── */

export default function ContabilPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [tab, setTab] = useState<Tab>("dashboard");
  const [plano] = useState<ContaPlano[]>(PLANO_INIT);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>(LANC_INIT);
  const [conciliacao, setConciliacao] = useState<MovConciliacao[]>(CONC_INIT);
  const [log, setLog] = useState<LogContabil[]>(LOG_INIT);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set(["1", "1.1", "2", "2.1", "3", "4", "5"]));
  const [fechaStep, setFechaStep] = useState(1);
  const [fechaStatus, setFechaStatus] = useState<StatusFecha>("em_andamento");
  const [novoLanc, setNovoLanc] = useState(false);
  const [ldebito, setLdebito] = useState(""); const [lcredito, setLcredito] = useState("");
  const [lvalor, setLvalor] = useState(""); const [lhist, setLhist] = useState("");
  const [ldata, setLdata] = useState(new Date().toISOString().slice(0, 10));
  const [ldoc, setLdoc] = useState(""); const [lcc, setLcc] = useState("");
  const [balanceteComp, setBalanceteComp] = useState("Jun/2026");
  const [dreComp, setDreComp] = useState("Jun/2026");
  const [checkFecha, setCheckFecha] = useState([
    { id: "1", label: "Documentos recebidos do cliente",  feito: true },
    { id: "2", label: "Conciliação bancária concluída",   feito: true },
    { id: "3", label: "Lançamentos conferidos",           feito: false },
    { id: "4", label: "Pendências resolvidas",            feito: false },
    { id: "5", label: "DRE e Balanço gerados",            feito: false },
    { id: "6", label: "Revisão pelo supervisor",          feito: false },
  ]);

  /* ── Auditoria ── */
  function audit(acao: string, modulo: string, antes: string, depois: string) {
    setLog((prev) => [{
      id: crypto.randomUUID(), data: new Date().toISOString(),
      usuario: "Usuário Atual", acao, modulo, antes, depois,
    }, ...prev]);
  }

  /* ── Adicionar lançamento ── */
  function handleAddLanc() {
    const v = parseFloat(lvalor.replace(",", "."));
    if (!lhist || !ldebito || !lcredito || isNaN(v)) return;
    const id = crypto.randomUUID();
    const novo: Lancamento = { id, data: ldata, documento: ldoc || "—", historico: lhist, contaDebito: ldebito, contaCredito: lcredito, valor: v, centroCusto: lcc || "—", status: "rascunho" };
    setLancamentos((prev) => [novo, ...prev]);
    audit("Lançamento criado", "Lançamentos", "—", `${lhist} — ${fmt(v)}`);
    setNovoLanc(false);
    setLdebito(""); setLcredito(""); setLvalor(""); setLhist(""); setLdoc(""); setLcc("");
  }

  function mudarStatusLanc(id: string, novo: StatusLanc) {
    setLancamentos((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      audit("Status alterado", "Lançamentos", l.status, novo);
      return { ...l, status: novo };
    }));
  }

  /* ── Conciliação ── */
  function conciliar(id: string) {
    setConciliacao((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      audit("Movimento conciliado", "Conciliação", "pendente", "conciliado");
      return { ...m, status: "conciliado" };
    }));
  }
  function ignorar(id: string) {
    setConciliacao((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      audit("Movimento ignorado", "Conciliação", m.status, "ignorado");
      return { ...m, status: "ignorado" };
    }));
  }

  /* ── Árvore plano de contas ── */
  function toggleExpand(id: string) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function contasVisiveis(): ContaPlano[] {
    const resultado: ContaPlano[] = [];
    function visitar(paiId: string | null) {
      plano.filter((c) => c.paiId === paiId).forEach((c) => {
        resultado.push(c);
        if (expandidos.has(c.id)) visitar(c.id);
      });
    }
    visitar(null);
    return resultado;
  }

  /* ── Stats dinâmicos ── */
  const totalLanc = lancamentos.length;
  const pendencias = lancamentos.filter((l) => l.status === "rascunho").length;
  const concAbertas = conciliacao.filter((c) => c.status === "pendente").length;
  const receita = 12500; const despesa = 5800;
  const resultado = receita - despesa;
  const saldoBanco = 42000; const saldoSistema = 42000 - 950 + 230; // ajuste pend

  /* ─── Render ─── */
  return (
    <SetorShell
      borda="#93c5fd"
      cor="#1e40af"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#eff6ff"
      icone={ICONE}
      setorNome="Setor Contábil"
      setorResumo="Escrituração, conciliação, demonstrações financeiras e fechamento contábil"
      stats={[
        { label: "Lançamentos",    value: String(totalLanc), cor: "#93c5fd" },
        { label: "Pendências",     value: String(pendencias), cor: pendencias > 0 ? "#fbbf24" : "#34d399" },
        { label: "Resultado",      value: fmt(resultado),     cor: resultado >= 0 ? "#34d399" : "#fca5a5" },
        { label: "Fechamento",     value: fechaStatus === "fechado" ? "Fechado" : "Em aberto", cor: "#fff" },
      ]}
    >
      {/* ── Tabs ── */}
      <div style={{ background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #dbeafe", borderBottom: "none" }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 6px" }}>
          {TABS_CONT.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                borderBottom: tab === t.id ? "2px solid #1e40af" : "2px solid transparent",
                color: tab === t.id ? "#1e40af" : "#6b8faa",
                fontWeight: tab === t.id ? 800 : 500,
                fontSize: "0.8rem", padding: "0.85rem 0.9rem",
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.35rem",
                marginBottom: -2, transition: "color 0.15s",
              }}
              type="button"
            >
              <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #dbeafe", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

        {/* ════════════════════════════════════
            DASHBOARD
        ════════════════════════════════════ */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: "1.25rem" }}>

            {/* Header da competência */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "#f8faff", borderRadius: 12, border: "1px solid #dbeafe" }}>
              <div>
                <p style={{ margin: "0 0 3px", fontSize: "0.68rem", fontWeight: 800, color: "#1e40af", textTransform: "uppercase", letterSpacing: "1.5px" }}>Competência atual</p>
                <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#07170d" }}>Junho / 2026</h2>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge {...(fechaStatus === "fechado" ? { bg: "#f0fdf4", color: "#166534", label: "Fechado" } : { bg: "#fffbeb", color: "#92400e", label: "Em andamento" })} />
                <button className="small-action" onClick={() => setTab("lancamentos")} type="button">+ Lançamento</button>
                <button className="small-action" onClick={() => setTab("fechamento")} type="button">Fechar mês</button>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { label: "Lançamentos do mês", value: totalLanc, suffix: "registros", color: "#1e40af", bg: "#eff6ff" },
                { label: "Pendências",          value: pendencias, suffix: "rascunhos", color: pendencias > 0 ? "#92400e" : "#065f46", bg: pendencias > 0 ? "#fffbeb" : "#f0fdf4" },
                { label: "Conciliações abertas",value: concAbertas, suffix: "pendentes", color: concAbertas > 0 ? "#92400e" : "#065f46", bg: concAbertas > 0 ? "#fffbeb" : "#f0fdf4" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{k.label}</p>
                  <p style={{ margin: "0 0 2px", fontSize: "1.8rem", fontWeight: 800, color: k.color }}>{k.value}</p>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{k.suffix}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "1.25rem" }}>
              {/* Gráfico de barras SVG */}
              <div className="list-panel">
                <div className="list-panel-header">
                  <div><h2>Resultado Mensal</h2><p>Receitas, Despesas e Resultado — Jun/2026</p></div>
                </div>
                <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
                  {/* Barras SVG simples */}
                  <svg height={140} style={{ overflow: "visible" }} viewBox="0 0 340 140" width="100%">
                    {/* Grid */}
                    {[0, 35, 70, 105, 140].map((y) => (
                      <line key={y} stroke="#f0f6ff" strokeWidth={1} x1={0} x2={340} y1={y} y2={y} />
                    ))}
                    {/* Barras Receita */}
                    <rect fill="#3b82f6" height={105} rx={6} width={60} x={30} y={35} />
                    <text fill="#1e40af" fontSize={11} fontWeight={700} textAnchor="middle" x={60} y={27}>R$ 12.500</text>
                    {/* Barras Despesa */}
                    <rect fill="#fca5a5" height={43} rx={6} width={60} x={140} y={97} />
                    <text fill="#b91c1c" fontSize={11} fontWeight={700} textAnchor="middle" x={170} y={89}>R$ 5.800</text>
                    {/* Barras Resultado */}
                    <rect fill="#34d399" height={62} rx={6} width={60} x={250} y={78} />
                    <text fill="#065f46" fontSize={11} fontWeight={700} textAnchor="middle" x={280} y={70}>R$ 6.700</text>
                    {/* Labels */}
                    <text fill="#6b7280" fontSize={11} textAnchor="middle" x={60} y={155}>Receita</text>
                    <text fill="#6b7280" fontSize={11} textAnchor="middle" x={170} y={155}>Despesa</text>
                    <text fill="#6b7280" fontSize={11} textAnchor="middle" x={280} y={155}>Resultado</text>
                  </svg>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
                    {[
                      { label: "Receita bruta",  value: fmt(receita),   color: "#1e40af" },
                      { label: "Despesas",        value: fmt(despesa),   color: "#b91c1c" },
                      { label: "Resultado líq.",  value: fmt(resultado), color: "#065f46" },
                    ].map((item) => (
                      <div key={item.label} style={{ textAlign: "center", padding: "8px 0" }}>
                        <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</p>
                        <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: item.color }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Painel lateral */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Alertas e Pendências</h2></div></div>
                  <div style={{ padding: "0.5rem 0 0.75rem" }}>
                    {[
                      { msg: `${pendencias} lançamento(s) em rascunho`, tipo: "warn", onClick: () => setTab("lancamentos") },
                      { msg: `${concAbertas} movimentos não conciliados`, tipo: "warn", onClick: () => setTab("conciliacao") },
                      { msg: "Fechamento Jun/2026 em andamento", tipo: "info", onClick: () => setTab("fechamento") },
                    ].map((a, i) => (
                      <button
                        key={i}
                        onClick={a.onClick}
                        style={{ width: "100%", display: "flex", gap: 10, alignItems: "center", padding: "8px 1rem", borderBottom: "1px solid #f0f6ff", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                        type="button"
                      >
                        <span style={{ fontSize: "0.9rem" }}>{a.tipo === "warn" ? "⚠️" : "ℹ️"}</span>
                        <span style={{ fontSize: "0.82rem", color: a.tipo === "warn" ? "#92400e" : "#1e40af", fontWeight: 600 }}>{a.msg}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Últimos eventos</h2></div></div>
                  <div style={{ padding: "0.25rem 0 0.75rem" }}>
                    {log.slice(0, 4).map((entry) => (
                      <div key={entry.id} style={{ padding: "7px 1rem", borderBottom: "1px solid #f0f6ff" }}>
                        <p style={{ margin: "0 0 1px", fontSize: "0.8rem", fontWeight: 700, color: "#07170d" }}>{entry.acao}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{new Date(entry.data).toLocaleString("pt-BR")} · {entry.usuario}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            PLANO DE CONTAS
        ════════════════════════════════════ */}
        {tab === "plano" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Plano de Contas</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>{plano.length} contas cadastradas — estrutura hierárquica</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="small-action" onClick={() => { setExpandidos(new Set(plano.map((c) => c.id))); }} type="button">Expandir tudo</button>
                <button className="small-action" onClick={() => setExpandidos(new Set())} type="button">Recolher tudo</button>
                <button type="button">+ Nova conta</button>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Código</TH>
                  <TH>Conta</TH>
                  <TH>Tipo</TH>
                  <TH>Natureza</TH>
                  <TH right>Saldo</TH>
                  <TH>Status</TH>
                  <TH right>Ações</TH>
                </tr>
              </thead>
              <tbody>
                {contasVisiveis().map((conta) => {
                  const temFilhos = plano.some((c) => c.paiId === conta.id);
                  const expanded = expandidos.has(conta.id);
                  return (
                    <tr key={conta.id} style={{ background: conta.nivel === 1 ? "#f8faff" : "transparent" }}>
                      <TD muted>
                        <span style={{ fontFamily: "monospace", fontSize: "0.82rem", fontWeight: conta.nivel === 1 ? 800 : 400 }}>
                          {conta.codigo}
                        </span>
                      </TD>
                      <TD>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, paddingLeft: (conta.nivel - 1) * 20 }}>
                          {temFilhos ? (
                            <button
                              onClick={() => toggleExpand(conta.id)}
                              style={{ background: "none", border: "none", cursor: "pointer", color: "#1e40af", fontSize: "0.7rem", padding: "0 2px", fontWeight: 800 }}
                              type="button"
                            >
                              {expanded ? "▼" : "▶"}
                            </button>
                          ) : <span style={{ display: "inline-block", width: 16 }} />}
                          <span style={{ fontWeight: conta.nivel === 1 ? 800 : conta.nivel === 2 ? 600 : 400, fontSize: conta.nivel === 1 ? "0.9rem" : "0.85rem", color: conta.nivel === 1 ? "#07170d" : "#374151" }}>
                            {conta.nome}
                          </span>
                        </div>
                      </TD>
                      <TD>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: TIPO_CONTA_COLOR[conta.tipo], background: `${TIPO_CONTA_COLOR[conta.tipo]}18`, borderRadius: 999, padding: "2px 8px" }}>
                          {TIPO_CONTA_LABEL[conta.tipo]}
                        </span>
                      </TD>
                      <TD muted>
                        <span style={{ fontSize: "0.75rem", textTransform: "capitalize" }}>{conta.natureza}</span>
                      </TD>
                      <TD right>
                        <strong style={{ color: conta.tipo === "ativo" || conta.tipo === "despesa" || conta.tipo === "custo" ? "#1e40af" : "#065f46" }}>
                          {conta.nivel >= 2 ? fmt(conta.saldo) : ""}
                        </strong>
                      </TD>
                      <TD>
                        <Badge {...(conta.ativo ? { bg: "#eff6ff", color: "#1d4ed8", label: "Ativa" } : { bg: "#f3f4f6", color: "#9ca3af", label: "Inativa" })} />
                      </TD>
                      <TD right>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button className="small-action" type="button">✏️</button>
                          <button className="small-action" type="button">⊕</button>
                        </div>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════
            LANÇAMENTOS
        ════════════════════════════════════ */}
        {tab === "lancamentos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Lançamentos Contábeis</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>{lancamentos.length} lançamentos — diário geral</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="small-action" type="button">📥 Importar CSV</button>
                <button className="small-action" type="button">📥 Importar OFX</button>
                <button onClick={() => setNovoLanc(!novoLanc)} type="button">{novoLanc ? "✕ Cancelar" : "+ Novo lançamento"}</button>
              </div>
            </div>

            {/* Editor rápido */}
            {novoLanc && (
              <div style={{ background: "#f8faff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "1.25rem" }}>
                <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.875rem", color: "#1e40af" }}>Novo lançamento</p>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 100px 140px", gap: 10, marginBottom: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Data *
                    <input className="input" onChange={(e) => setLdata(e.target.value)} type="date" value={ldata} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Conta débito *
                    <select className="input" onChange={(e) => setLdebito(e.target.value)} value={ldebito}>
                      <option value="">Selecione...</option>
                      {plano.filter((c) => c.nivel >= 2).map((c) => <option key={c.id} value={c.codigo}>{c.codigo} — {c.nome}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Conta crédito *
                    <select className="input" onChange={(e) => setLcredito(e.target.value)} value={lcredito}>
                      <option value="">Selecione...</option>
                      {plano.filter((c) => c.nivel >= 2).map((c) => <option key={c.id} value={c.codigo}>{c.codigo} — {c.nome}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Valor *
                    <input className="input" onChange={(e) => setLvalor(e.target.value)} placeholder="0,00" value={lvalor} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Documento
                    <input className="input" onChange={(e) => setLdoc(e.target.value)} placeholder="NF-001" value={ldoc} />
                  </label>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 180px", gap: 10, marginBottom: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Histórico / Descrição *
                    <input className="input" onChange={(e) => setLhist(e.target.value)} placeholder="Descreva o lançamento..." value={lhist} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Centro de custo
                    <input className="input" onChange={(e) => setLcc(e.target.value)} placeholder="Ex: Comercial" value={lcc} />
                  </label>
                </div>
                {/* Validação D = C */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 20, fontSize: "0.8rem" }}>
                    <span style={{ color: "#1e40af" }}>D: <strong>{ldebito || "—"}</strong></span>
                    <span style={{ color: "#065f46" }}>C: <strong>{lcredito || "—"}</strong></span>
                    <span style={{ color: lvalor ? "#065f46" : "#9ca3af" }}>Valor: <strong>{lvalor ? fmt(parseFloat(lvalor.replace(",", ".")) || 0) : "—"}</strong></span>
                    <span style={{ color: "#34d399", fontWeight: 700 }}>✓ D = C (partida dobrada validada)</span>
                  </div>
                  <button
                    disabled={!lhist || !ldebito || !lcredito || !lvalor}
                    onClick={handleAddLanc}
                    style={{ opacity: (!lhist || !ldebito || !lcredito || !lvalor) ? 0.5 : 1 }}
                    type="button"
                  >
                    ✓ Registrar lançamento
                  </button>
                </div>
              </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Data</TH>
                  <TH>Documento</TH>
                  <TH>Histórico</TH>
                  <TH>Débito</TH>
                  <TH>Crédito</TH>
                  <TH right>Valor</TH>
                  <TH>Centro</TH>
                  <TH>Status</TH>
                  <TH right>Ações</TH>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((l) => (
                  <tr key={l.id} style={{ background: l.status === "rascunho" ? "#fffbf0" : "transparent" }}>
                    <TD muted>{new Date(l.data).toLocaleDateString("pt-BR")}</TD>
                    <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{l.documento}</span></TD>
                    <TD>{l.historico}</TD>
                    <TD><span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#b91c1c", fontWeight: 600 }}>{l.contaDebito}</span></TD>
                    <TD><span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#065f46", fontWeight: 600 }}>{l.contaCredito}</span></TD>
                    <TD right bold>{fmt(l.valor)}</TD>
                    <TD muted>{l.centroCusto}</TD>
                    <TD><Badge {...S_LANC[l.status]} /></TD>
                    <TD right>
                      <select
                        className="input"
                        disabled={l.status === "fechado"}
                        onChange={(e) => mudarStatusLanc(l.id, e.target.value as StatusLanc)}
                        style={{ fontSize: "0.73rem", padding: "3px 6px", minWidth: 110, opacity: l.status === "fechado" ? 0.5 : 1 }}
                        value={l.status}
                      >
                        {(["rascunho", "conferido", "fechado"] as StatusLanc[]).map((s) => (
                          <option key={s} value={s}>{S_LANC[s].label}</option>
                        ))}
                      </select>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════
            CONCILIAÇÃO BANCÁRIA
        ════════════════════════════════════ */}
        {tab === "conciliacao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Conciliação Bancária</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>Conta Corrente — Banco X — Jun/2026</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="small-action" type="button">📥 Importar extrato</button>
                <button className="small-action" onClick={() => { conciliacao.filter((c) => c.status === "pendente").forEach((c) => audit("Sugestão automática", "Conciliação", "pendente", "sugerido")); }} type="button">⚡ Sugerir conciliação</button>
              </div>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Saldo banco",     value: fmt(saldoBanco),  color: "#065f46", bg: "#f0fdf4" },
                { label: "Saldo sistema",   value: fmt(saldoSistema), color: "#1e40af", bg: "#eff6ff" },
                { label: "Diferença",       value: fmt(Math.abs(saldoBanco - saldoSistema)), color: Math.abs(saldoBanco - saldoSistema) < 1 ? "#065f46" : "#b91c1c", bg: "#f8faff" },
                { label: "Itens pendentes", value: String(concAbertas), color: concAbertas > 0 ? "#92400e" : "#065f46", bg: concAbertas > 0 ? "#fffbeb" : "#f0fdf4" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "0.875rem 1rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Data</TH>
                  <TH>Descrição (banco)</TH>
                  <TH>Tipo</TH>
                  <TH right>Valor</TH>
                  <TH>Lançamento</TH>
                  <TH>Status</TH>
                  <TH right>Ações</TH>
                </tr>
              </thead>
              <tbody>
                {conciliacao.map((m) => (
                  <tr key={m.id}>
                    <TD muted>{new Date(m.data).toLocaleDateString("pt-BR")}</TD>
                    <TD>{m.descricao}</TD>
                    <TD>
                      <span style={{ fontSize: "0.75rem", fontWeight: 700, color: m.tipo === "entrada" ? "#065f46" : "#b91c1c" }}>
                        {m.tipo === "entrada" ? "↓ Entrada" : "↑ Saída"}
                      </span>
                    </TD>
                    <TD right>
                      <strong style={{ color: m.tipo === "entrada" ? "#065f46" : "#b91c1c" }}>
                        {m.tipo === "entrada" ? "+" : "-"} {fmt(m.valor)}
                      </strong>
                    </TD>
                    <TD muted>
                      {m.lancId
                        ? <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#1e40af" }}>Lanç. #{m.lancId}</span>
                        : "—"}
                    </TD>
                    <TD><Badge {...S_CONC[m.status]} /></TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                        {m.status === "pendente" && (
                          <>
                            <button className="small-action" onClick={() => conciliar(m.id)} type="button">✓ Conciliar</button>
                            <button className="small-action" onClick={() => ignorar(m.id)} type="button">— Ignorar</button>
                            <button className="small-action" onClick={() => { setTab("lancamentos"); setNovoLanc(true); }} type="button">+ Lançar</button>
                          </>
                        )}
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════
            BALANCETE
        ════════════════════════════════════ */}
        {tab === "balancete" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Balancete de Verificação</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>Período: {balanceteComp}</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="input" onChange={(e) => setBalanceteComp(e.target.value)} style={{ fontSize: 13 }} value={balanceteComp}>
                  {["Jun/2026", "Mai/2026", "Abr/2026", "Mar/2026"].map((m) => <option key={m}>{m}</option>)}
                </select>
                <button className="small-action" onClick={() => audit("Balancete exportado", "Balancete", "—", `PDF ${balanceteComp}`)} type="button">📄 PDF</button>
                <button className="small-action" onClick={() => audit("Balancete exportado", "Balancete", "—", `Excel ${balanceteComp}`)} type="button">📊 Excel</button>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Código</TH>
                  <TH>Conta</TH>
                  <TH>Tipo</TH>
                  <TH right>Saldo anterior</TH>
                  <TH right>Débitos</TH>
                  <TH right>Créditos</TH>
                  <TH right>Saldo atual</TH>
                </tr>
              </thead>
              <tbody>
                {BALANCETE.map((linha) => (
                  <tr key={linha.codigo}>
                    <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{linha.codigo}</span></TD>
                    <TD bold>{linha.conta}</TD>
                    <TD>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, color: TIPO_CONTA_COLOR[linha.tipo], background: `${TIPO_CONTA_COLOR[linha.tipo]}15`, borderRadius: 999, padding: "2px 8px" }}>
                        {TIPO_CONTA_LABEL[linha.tipo]}
                      </span>
                    </TD>
                    <TD right muted>{fmt(linha.saldoAnterior)}</TD>
                    <TD right color="#b91c1c">{linha.debitos > 0 ? fmt(linha.debitos) : "—"}</TD>
                    <TD right color="#065f46">{linha.creditos > 0 ? fmt(linha.creditos) : "—"}</TD>
                    <TD right bold>{fmt(linha.saldoAtual)}</TD>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f8faff", borderTop: "2px solid #bfdbfe" }}>
                  <td colSpan={3} style={{ padding: "0.8rem 0.875rem", fontWeight: 800, color: "#1e40af" }}>TOTAIS</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 800 }}>{fmt(BALANCETE.reduce((a, l) => a + l.saldoAnterior, 0))}</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 800, color: "#b91c1c" }}>{fmt(BALANCETE.reduce((a, l) => a + l.debitos, 0))}</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 800, color: "#065f46" }}>{fmt(BALANCETE.reduce((a, l) => a + l.creditos, 0))}</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 900, color: "#1e40af", fontSize: "1rem" }}>{fmt(BALANCETE.reduce((a, l) => a + l.saldoAtual, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════
            DRE
        ════════════════════════════════════ */}
        {tab === "dre" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Demonstração do Resultado — DRE</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>Competência: {dreComp}</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="input" onChange={(e) => setDreComp(e.target.value)} style={{ fontSize: 13 }} value={dreComp}>
                  {["Jun/2026", "Mai/2026", "Abr/2026", "Mar/2026"].map((m) => <option key={m}>{m}</option>)}
                </select>
                <button className="small-action" onClick={() => audit("DRE exportada", "DRE", "—", `PDF ${dreComp}`)} type="button">📄 PDF</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem" }}>
              {/* Árvore financeira */}
              <div>
                {[
                  { label: "RECEITA BRUTA",           valor: 12500,  indent: 0, tipo: "positivo", destaque: true },
                  { label: "(-) Deduções e impostos",  valor: -720,   indent: 1, tipo: "negativo", destaque: false },
                  { label: "= RECEITA LÍQUIDA",        valor: 11780,  indent: 0, tipo: "positivo", destaque: true },
                  { label: "(-) Custos dos serviços",  valor: 0,      indent: 1, tipo: "negativo", destaque: false },
                  { label: "= LUCRO BRUTO",            valor: 11780,  indent: 0, tipo: "positivo", destaque: true },
                  { label: "(-) Desp. Administrativas",valor: -1800,  indent: 1, tipo: "negativo", destaque: false },
                  { label: "(-) Desp. com Pessoal",    valor: -4000,  indent: 1, tipo: "negativo", destaque: false },
                  { label: "(-) Outras despesas",      valor: 0,      indent: 1, tipo: "negativo", destaque: false },
                  { label: "= EBIT (Resultado operac.)",valor: 5980,  indent: 0, tipo: "positivo", destaque: true },
                  { label: "(-) Resultado financeiro", valor: 0,      indent: 1, tipo: "negativo", destaque: false },
                  { label: "= LUCRO ANTES IR/CSLL",    valor: 5980,   indent: 0, tipo: "positivo", destaque: true },
                  { label: "(-) IRPJ e CSLL",          valor: -720,   indent: 1, tipo: "negativo", destaque: false },
                  { label: "= LUCRO LÍQUIDO",          valor: 5260,   indent: 0, tipo: "resultado", destaque: true },
                ].map((linha, i) => (
                  <div
                    key={i}
                    style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: `${linha.destaque ? "10px" : "7px"} ${linha.indent * 16 + 12}px`,
                      borderBottom: "1px solid #f0f6ff",
                      background: linha.tipo === "resultado" ? "#eff6ff" : linha.destaque ? "#f8faff" : "transparent",
                      borderRadius: linha.tipo === "resultado" ? 6 : 0,
                    }}
                  >
                    <span style={{ fontSize: linha.destaque ? "0.875rem" : "0.82rem", fontWeight: linha.destaque ? 800 : 400, color: linha.destaque ? "#07170d" : "#4b6358" }}>
                      {linha.label}
                    </span>
                    <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af", minWidth: 50, textAlign: "right" }}>
                        {linha.valor !== 0 ? pct(Math.abs(linha.valor), 12500) : "—"}
                      </span>
                      <span style={{ fontWeight: linha.destaque ? 800 : 600, fontSize: linha.tipo === "resultado" ? "1rem" : "0.875rem", color: linha.tipo === "resultado" ? "#1e40af" : linha.tipo === "negativo" ? "#b91c1c" : "#065f46", minWidth: 90, textAlign: "right" }}>
                        {linha.valor !== 0 ? fmt(linha.valor, true) : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparações */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Comparativo</h2><p>Mês atual vs. anterior</p></div></div>
                  <div style={{ padding: "0.5rem 1rem 1rem" }}>
                    {[
                      { label: "Receita bruta",  atual: 12500, anterior: 11800 },
                      { label: "Despesas",       atual: 5800,  anterior: 6200 },
                      { label: "Lucro líquido",  atual: 5260,  anterior: 4320 },
                    ].map((item) => {
                      const delta = ((item.atual - item.anterior) / item.anterior) * 100;
                      return (
                        <div key={item.label} style={{ padding: "8px 0", borderBottom: "1px solid #f0f6ff" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#374151" }}>{item.label}</span>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, color: delta >= 0 ? "#065f46" : "#b91c1c" }}>
                              {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(1)}%
                            </span>
                          </div>
                          <div style={{ height: 6, background: "#f0f6ff", borderRadius: 999, overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${Math.min(100, (item.atual / 15000) * 100)}%`, background: "#3b82f6", borderRadius: 999 }} />
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                            <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>Mai: {fmt(item.anterior)}</span>
                            <span style={{ fontSize: "0.7rem", color: "#1e40af", fontWeight: 700 }}>Jun: {fmt(item.atual)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Indicadores</h2></div></div>
                  <div style={{ padding: "0.5rem 1rem 1rem" }}>
                    {[
                      { label: "Margem bruta",    value: pct(11780, 12500), color: "#065f46" },
                      { label: "Margem operac.",  value: pct(5980, 12500),  color: "#1e40af" },
                      { label: "Margem líquida",  value: pct(5260, 12500),  color: "#7c3aed" },
                    ].map((ind) => (
                      <div key={ind.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #f0f6ff" }}>
                        <span style={{ fontSize: "0.82rem", color: "#374151" }}>{ind.label}</span>
                        <strong style={{ fontSize: "0.875rem", color: ind.color }}>{ind.value}</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            BALANÇO PATRIMONIAL
        ════════════════════════════════════ */}
        {tab === "balanco" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Balanço Patrimonial</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>Posição em 30/Jun/2026</p></div>
              <button className="small-action" onClick={() => audit("Balanço exportado", "Balanço", "—", "PDF Jun/2026")} type="button">📄 PDF</button>
            </div>

            {/* Indicadores */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Liquidez corrente", value: (85000 / 22000).toFixed(2), color: "#065f46", tip: "AC / PC — ideal > 1" },
                { label: "Capital de giro",    value: fmt(85000 - 22000), color: "#1e40af", tip: "AC − PC" },
                { label: "Endividamento",      value: pct(22000, 120000), color: "#92400e", tip: "Passivo / Ativo total" },
                { label: "Retorno PL",         value: pct(5260, 98000),   color: "#7c3aed", tip: "Lucro / PL" },
              ].map((ind) => (
                <div key={ind.label} style={{ background: "#f8faff", border: "1px solid #dbeafe", borderRadius: 10, padding: "0.875rem 1rem" }} title={ind.tip}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{ind.label}</p>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: ind.color }}>{ind.value}</p>
                  <p style={{ margin: "2px 0 0", fontSize: "0.68rem", color: "#9ca3af" }}>{ind.tip}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {/* ATIVO */}
              <div style={{ background: "#f8faff", border: "1px solid #dbeafe", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: "#1e40af", padding: "10px 1rem" }}>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: "0.9rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>ATIVO</h3>
                </div>
                <div style={{ padding: "0.5rem 0 0.5rem" }}>
                  {[
                    { label: "Ativo Circulante",    val: 85000, nivel: 1 },
                    { label: "Caixa e Bancos",       val: 42000, nivel: 2 },
                    { label: "Contas a Receber",     val: 28000, nivel: 2 },
                    { label: "Estoques",             val: 15000, nivel: 2 },
                    { label: "Ativo Não Circulante", val: 35000, nivel: 1 },
                    { label: "Imobilizado",          val: 35000, nivel: 2 },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: `${item.nivel === 1 ? "8px" : "6px"} ${item.nivel === 1 ? "1rem" : "1.75rem"}`, borderBottom: "1px solid #e8f2ff" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: item.nivel === 1 ? 700 : 400, color: item.nivel === 1 ? "#07170d" : "#374151" }}>{item.label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: item.nivel === 1 ? 700 : 400, color: "#1e40af" }}>{fmt(item.val)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 1rem", background: "#dbeafe" }}>
                    <strong style={{ fontSize: "0.9rem", color: "#1e40af" }}>TOTAL ATIVO</strong>
                    <strong style={{ fontSize: "0.9rem", color: "#1e40af" }}>R$ 120.000,00</strong>
                  </div>
                </div>
              </div>

              {/* PASSIVO + PL */}
              <div style={{ background: "#fdf8f0", border: "1px solid #fed7aa", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ background: "#b45309", padding: "10px 1rem" }}>
                  <h3 style={{ margin: 0, color: "#fff", fontSize: "0.9rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" }}>PASSIVO + PL</h3>
                </div>
                <div style={{ padding: "0.5rem 0 0.5rem" }}>
                  {[
                    { label: "Passivo Circulante",     val: 22000, nivel: 1, tipo: "passivo" },
                    { label: "Fornecedores",            val: 8000,  nivel: 2, tipo: "passivo" },
                    { label: "Obrigações Fiscais",      val: 7500,  nivel: 2, tipo: "passivo" },
                    { label: "Obrigações Trabalhistas", val: 6500,  nivel: 2, tipo: "passivo" },
                    { label: "Patrimônio Líquido",      val: 98000, nivel: 1, tipo: "pl" },
                    { label: "Capital Social",          val: 80000, nivel: 2, tipo: "pl" },
                    { label: "Lucros Acumulados",       val: 18000, nivel: 2, tipo: "pl" },
                  ].map((item) => (
                    <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: `${item.nivel === 1 ? "8px" : "6px"} ${item.nivel === 1 ? "1rem" : "1.75rem"}`, borderBottom: "1px solid #fde8c8" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: item.nivel === 1 ? 700 : 400, color: item.nivel === 1 ? "#07170d" : "#374151" }}>{item.label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: item.nivel === 1 ? 700 : 400, color: item.tipo === "pl" ? "#7c3aed" : "#b45309" }}>{fmt(item.val)}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 1rem", background: "#fed7aa" }}>
                    <strong style={{ fontSize: "0.9rem", color: "#92400e" }}>TOTAL PASSIVO + PL</strong>
                    <strong style={{ fontSize: "0.9rem", color: "#92400e" }}>R$ 120.000,00</strong>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontWeight: 800, color: "#065f46", fontSize: "0.875rem" }}>✓ Balanço equlibrado — Ativo = Passivo + PL (R$ 120.000,00)</span>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            FLUXO DE CAIXA
        ════════════════════════════════════ */}
        {tab === "fluxo" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Fluxo de Caixa</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>Método indireto — Jun/2026</p></div>
              <button className="small-action" onClick={() => audit("Fluxo exportado", "Fluxo de Caixa", "—", "PDF Jun/2026")} type="button">📄 PDF</button>
            </div>

            {[
              {
                titulo: "ATIVIDADES OPERACIONAIS", cor: "#1e40af", bg: "#eff6ff",
                itens: [
                  { label: "Lucro líquido do exercício", val: 5260 },
                  { label: "(±) Variação em contas a receber", val: -2000 },
                  { label: "(±) Variação em estoques", val: 0 },
                  { label: "(±) Variação em fornecedores", val: 1800 },
                  { label: "(±) Variação em obrigações fiscais", val: 800 },
                ],
                total: 5860,
              },
              {
                titulo: "ATIVIDADES DE INVESTIMENTO", cor: "#7c3aed", bg: "#faf5ff",
                itens: [
                  { label: "Aquisição de imobilizado", val: 0 },
                  { label: "Venda de ativos", val: 0 },
                ],
                total: 0,
              },
              {
                titulo: "ATIVIDADES DE FINANCIAMENTO", cor: "#92400e", bg: "#fffbeb",
                itens: [
                  { label: "Distribuição de lucros", val: 0 },
                  { label: "Integralização de capital", val: 0 },
                ],
                total: 0,
              },
            ].map((grupo) => (
              <div key={grupo.titulo} className="list-panel" style={{ overflow: "hidden" }}>
                <div style={{ background: grupo.bg, padding: "10px 1.25rem", borderBottom: "1px solid #f0f6ff" }}>
                  <h3 style={{ margin: 0, fontSize: "0.82rem", fontWeight: 900, color: grupo.cor, letterSpacing: "0.5px", textTransform: "uppercase" }}>{grupo.titulo}</h3>
                </div>
                {grupo.itens.map((item) => (
                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 1.5rem", borderBottom: "1px solid #f0f6ff" }}>
                    <span style={{ fontSize: "0.82rem", color: "#374151" }}>{item.label}</span>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: item.val > 0 ? "#065f46" : item.val < 0 ? "#b91c1c" : "#9ca3af" }}>
                      {item.val !== 0 ? fmt(item.val, true) : "—"}
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 1.5rem", background: grupo.bg }}>
                  <strong style={{ fontSize: "0.85rem", color: grupo.cor }}>Subtotal {grupo.titulo.split(" ")[0].toLowerCase()}</strong>
                  <strong style={{ fontSize: "0.875rem", color: grupo.total >= 0 ? "#065f46" : "#b91c1c" }}>{fmt(grupo.total, true)}</strong>
                </div>
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 1.5rem", background: "#eff6ff", border: "2px solid #bfdbfe", borderRadius: 10 }}>
              <strong style={{ color: "#1e40af", fontSize: "0.9rem" }}>VARIAÇÃO LÍQUIDA DO CAIXA</strong>
              <strong style={{ color: "#065f46", fontSize: "1rem" }}>{fmt(5860)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 1.5rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
              <span style={{ color: "#374151", fontSize: "0.85rem" }}>Saldo inicial (01/Jun)</span>
              <strong style={{ color: "#065f46" }}>{fmt(36140)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 1.5rem", background: "#f0fdf4", border: "2px solid #34d399", borderRadius: 10 }}>
              <strong style={{ color: "#065f46", fontSize: "0.9rem" }}>SALDO FINAL (30/Jun)</strong>
              <strong style={{ color: "#065f46", fontSize: "1rem" }}>{fmt(42000)}</strong>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            FECHAMENTO
        ════════════════════════════════════ */}
        {tab === "fechamento" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Fechamento Contábil — Jun/2026</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>Etapa {fechaStep} de 6</p></div>
              <Badge {...(fechaStatus === "fechado" ? { bg: "#f0fdf4", color: "#166534", label: "✓ Fechado" } : fechaStatus === "revisao" ? { bg: "#fdf4ff", color: "#7e22ce", label: "Em revisão" } : { bg: "#fffbeb", color: "#92400e", label: "Em andamento" })} />
            </div>

            {/* Fluxo visual */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto", padding: "0.25rem 0" }}>
              {[
                { label: "Receber docs", icon: "📥" },
                { label: "Conciliar bancos", icon: "⇄" },
                { label: "Validar lanç.", icon: "✓" },
                { label: "Gerar demonstrações", icon: "📊" },
                { label: "Revisar", icon: "👁" },
                { label: "Fechar", icon: "🔒" },
              ].map((etapa, i) => {
                const ok = i + 1 < fechaStep;
                const ativo = i + 1 === fechaStep;
                return (
                  <div key={etapa.label} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => setFechaStep(i + 1)}
                      style={{ flex: 1, textAlign: "center", padding: "0 4px", background: "none", border: "none", cursor: "pointer" }}
                      type="button"
                    >
                      <div style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.1rem", background: ok ? "#1e40af" : ativo ? "#eff6ff" : "#f3f4f6", border: `2px solid ${ok || ativo ? "#1e40af" : "#e5e7eb"}` }}>
                        {ok ? "✓" : etapa.icon}
                      </div>
                      <span style={{ fontSize: "0.68rem", fontWeight: ativo ? 700 : 400, color: ativo ? "#1e40af" : ok ? "#065f46" : "#9ca3af", display: "block" }}>{etapa.label}</span>
                    </button>
                    {i < 5 && <div style={{ height: 2, width: 24, flex: "0 0 24px", background: ok ? "#1e40af" : "#e5e7eb" }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#f8faff", borderRadius: 12, padding: "1.5rem", border: "1px solid #dbeafe" }}>
              <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.85rem", color: "#1e40af" }}>
                Etapa {fechaStep}: {["Receber documentos do cliente", "Conciliação bancária", "Validar lançamentos", "Gerar demonstrações financeiras", "Revisão pelo supervisor", "Encerrar competência"][fechaStep - 1]}
              </p>

              {/* Checklist */}
              <div style={{ display: "grid", gap: 8, marginBottom: "1.25rem" }}>
                {checkFecha.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setCheckFecha((prev) => prev.map((c) => c.id === item.id ? { ...c, feito: !c.feito } : c))}
                    style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, cursor: "pointer", background: item.feito ? "#f0fdf4" : "#fff", border: `1px solid ${item.feito ? "#bbf7d0" : "#dbeafe"}` }}
                  >
                    <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.feito ? "#10b981" : "#93c5fd"}`, background: item.feito ? "#10b981" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {item.feito && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: "0.875rem", fontWeight: 600, color: item.feito ? "#065f46" : "#07170d", textDecoration: item.feito ? "line-through" : "none" }}>{item.label}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontSize: "0.8rem", color: "#6b8faa" }}>
                  {checkFecha.filter((c) => c.feito).length} / {checkFecha.length} itens concluídos
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {fechaStep < 6 ? (
                    <button
                      onClick={() => { setFechaStep((s) => s + 1); audit(`Etapa ${fechaStep} concluída`, "Fechamento", "—", `Avançou para etapa ${fechaStep + 1}`); }}
                      type="button"
                    >
                      Próxima etapa →
                    </button>
                  ) : (
                    <button
                      disabled={fechaStatus === "fechado"}
                      onClick={() => {
                        setFechaStatus("fechado");
                        setLancamentos((prev) => prev.map((l) => l.status === "conferido" ? { ...l, status: "fechado" } : l));
                        audit("Competência encerrada", "Fechamento", "em_andamento", `Jun/2026 FECHADO — snapshot gerado`);
                      }}
                      style={{ background: fechaStatus === "fechado" ? "#9ca3af" : "linear-gradient(135deg, #1e40af, #1d4ed8)" }}
                      type="button"
                    >
                      {fechaStatus === "fechado" ? "✓ Jun/2026 encerrado" : "🔒 Encerrar competência"}
                    </button>
                  )}
                </div>
              </div>

              {fechaStatus === "fechado" && (
                <div style={{ marginTop: "1rem", padding: "10px 14px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8, display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔒</span>
                  <div>
                    <strong style={{ fontSize: "0.875rem", color: "#065f46" }}>Competência Jun/2026 encerrada com sucesso</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>Snapshot criado · Lançamentos bloqueados · Auditoria registrada</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            RELATÓRIOS
        ════════════════════════════════════ */}
        {tab === "relatorios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Relatórios Contábeis</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>Gere e exporte demonstrações e relatórios analíticos</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                { icon: "📊", label: "DRE",                    desc: "Demonstração do Resultado do Exercício", aba: "dre" as Tab },
                { icon: "⚖",  label: "Balanço Patrimonial",   desc: "Posição patrimonial e financeira", aba: "balanco" as Tab },
                { icon: "▤",  label: "Balancete",             desc: "Verificação de saldos por conta", aba: "balancete" as Tab },
                { icon: "💧", label: "Fluxo de Caixa",        desc: "Método indireto — entradas e saídas", aba: "fluxo" as Tab },
                { icon: "📒", label: "Razão Contábil",        desc: "Movimentação detalhada por conta", aba: "lancamentos" as Tab },
                { icon: "📋", label: "Diário Geral",          desc: "Todos os lançamentos em ordem cronológica", aba: "lancamentos" as Tab },
              ].map((rel) => (
                <button
                  key={rel.label}
                  onClick={() => setTab(rel.aba)}
                  style={{ background: "#fff", border: "1px solid #dbeafe", borderRadius: 12, padding: "1.25rem", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8, transition: "all 0.15s" }}
                  type="button"
                >
                  <span style={{ fontSize: "1.5rem" }}>{rel.icon}</span>
                  <strong style={{ fontSize: "0.9rem", color: "#1e40af" }}>{rel.label}</strong>
                  <span style={{ fontSize: "0.78rem", color: "#6b8faa" }}>{rel.desc}</span>
                  <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#1e40af", background: "#eff6ff", borderRadius: 999, padding: "2px 8px" }}>📄 PDF</span>
                    <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#065f46", background: "#f0fdf4", borderRadius: 999, padding: "2px 8px" }}>📊 Excel</span>
                  </div>
                </button>
              ))}
            </div>
            <div className="list-panel">
              <div className="list-panel-header"><div><h2>Integrações futuras</h2><p>Conexões preparadas para expansão</p></div></div>
              <div style={{ padding: "0.75rem 1rem 1rem", display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                {["Banco (OFX/API)", "XML fiscal", "ERP externo", "Receita Federal", "SPED Contábil"].map((int) => (
                  <div key={int} style={{ padding: "10px 12px", background: "#f8faff", border: "1px dashed #bfdbfe", borderRadius: 8, textAlign: "center" }}>
                    <p style={{ margin: "0 0 2px", fontSize: "0.78rem", fontWeight: 700, color: "#1e40af" }}>{int}</p>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>Em breve</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            HISTÓRICO / AUDITORIA
        ════════════════════════════════════ */}
        {tab === "historico" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Histórico de Auditoria</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>{log.length} registros · toda ação gera auditoria com antes e depois</p>
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#1e40af", background: "#eff6ff", borderRadius: 999, padding: "3px 10px", border: "1px solid #bfdbfe" }}>⚡ Tempo real</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Data / Hora</TH>
                  <TH>Usuário</TH>
                  <TH>Ação</TH>
                  <TH>Módulo</TH>
                  <TH>Antes</TH>
                  <TH>Depois</TH>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={entry.id}>
                    <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{new Date(entry.data).toLocaleString("pt-BR")}</span></TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: entry.usuario === "Sistema" ? "#f3f4f6" : "#eff6ff", color: entry.usuario === "Sistema" ? "#6b7280" : "#1e40af", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0 }}>
                          {entry.usuario === "Sistema" ? "SYS" : entry.usuario.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{entry.usuario}</span>
                      </div>
                    </TD>
                    <TD><span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e40af" }}>{entry.acao}</span></TD>
                    <TD muted>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#eff6ff", color: "#1e40af", borderRadius: 999, padding: "2px 8px" }}>{entry.modulo}</span>
                    </TD>
                    <TD muted>{entry.antes || "—"}</TD>
                    <TD>
                      <span style={{ fontSize: "0.82rem", color: "#065f46", fontWeight: 600 }}>{entry.depois}</span>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </SetorShell>
  );
}
