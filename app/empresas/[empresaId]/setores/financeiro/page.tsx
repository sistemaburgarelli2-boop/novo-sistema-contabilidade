"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type StatusLanc = "aberto" | "pago" | "atrasado" | "cancelado" | "parcial";
type TipoMov = "receita" | "despesa" | "transferencia";
type FormaPgto = "boleto" | "pix" | "cartao" | "transferencia" | "dinheiro" | "debito";
type StatusMensal = "em_dia" | "atrasado" | "inadimplente" | "cancelado";
type Plano = "basico" | "intermediario" | "premium" | "personalizado";
type Modo = "cliente" | "escritorio";
type TabCliente = "dash_cli" | "pagar" | "receber" | "movimentos" | "conciliacao" | "rel_cli";
type TabEsc = "dash_esc" | "mensalidades" | "receber_esc" | "pagar_esc" | "comissoes" | "automacoes" | "rel_esc";

type LancamentoFin = {
  id: string; descricao: string; categoria: string;
  data: string; valor: number; tipo: TipoMov;
  status: StatusLanc; forma: FormaPgto; obs: string;
};

type MovConciliacao = {
  id: string; data: string; descricao: string;
  valor: number; tipo: "entrada" | "saida";
  status: "pendente" | "conciliado" | "ignorado"; lancId: string | null;
};

type Mensalidade = {
  id: string; cliente: string; plano: Plano;
  valor: number; vencimento: string; status: StatusMensal;
  forma: FormaPgto; email: string;
};

type Comissao = {
  id: string; colaborador: string; tipo: string;
  mes: string; valor: number; status: "pendente" | "pago";
};

type LogFin = {
  id: string; data: string; usuario: string;
  acao: string; modulo: string; detalhe: string;
};

type AutomacaoRegra = {
  id: string; nome: string; gatilho: string; acao: string;
  modulo: string; ativa: boolean; execucoes: number; ultimaExec: string | null;
};

/* ─── Ícone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M2 8h20M2 12h20" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <rect height={16} rx={3} stroke="currentColor" strokeWidth={2} width={20} x={2} y={4} />
    <path d="M6 16h4M14 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

/* ─── Mock — Financeiro Cliente ───────────────────────────────── */

const PAGAR_INIT: LancamentoFin[] = [
  { id: "p1", descricao: "Fornecedor XYZ Ltda",    categoria: "Fornecedores",  data: "2026-07-05", valor: 5600,  tipo: "despesa", status: "aberto",   forma: "boleto",      obs: "" },
  { id: "p2", descricao: "Telefonia e Internet",   categoria: "Infraestrutura",data: "2026-07-20", valor: 380,   tipo: "despesa", status: "aberto",   forma: "debito",      obs: "" },
  { id: "p3", descricao: "Seguro empresarial",     categoria: "Seguros",       data: "2026-07-30", valor: 1200,  tipo: "despesa", status: "aberto",   forma: "boleto",      obs: "" },
  { id: "p4", descricao: "Aluguel Jul/2026",       categoria: "Imóveis",       data: "2026-07-05", valor: 1800,  tipo: "despesa", status: "pago",     forma: "transferencia",obs: "" },
  { id: "p5", descricao: "Material de escritório", categoria: "Administrativo",data: "2026-06-20", valor: 350,   tipo: "despesa", status: "atrasado", forma: "pix",         obs: "Em atraso há 4 dias" },
  { id: "p6", descricao: "Software contábil",      categoria: "TI",            data: "2026-07-15", valor: 490,   tipo: "despesa", status: "aberto",   forma: "cartao",      obs: "" },
];

const RECEBER_INIT: LancamentoFin[] = [
  { id: "r1", descricao: "Honorários — Empresa Alpha", categoria: "Honorários", data: "2026-07-15", valor: 8900, tipo: "receita", status: "aberto",   forma: "boleto", obs: "" },
  { id: "r2", descricao: "Honorários — Comércio Beta", categoria: "Honorários", data: "2026-07-22", valor: 4300, tipo: "receita", status: "aberto",   forma: "pix",    obs: "" },
  { id: "r3", descricao: "Serviço pontual — Gamma",    categoria: "Avulso",     data: "2026-07-10", valor: 2100, tipo: "receita", status: "atrasado", forma: "boleto", obs: "Cliente não localizável" },
  { id: "r4", descricao: "Honorários — Delta Holding", categoria: "Honorários", data: "2026-07-28", valor: 3500, tipo: "receita", status: "aberto",   forma: "pix",    obs: "" },
  { id: "r5", descricao: "Honorários — Épsilon Ltda",  categoria: "Honorários", data: "2026-06-30", valor: 1200, tipo: "receita", status: "pago",     forma: "pix",    obs: "" },
];

const MOVIMENTOS_INIT: LancamentoFin[] = [
  { id: "m1", descricao: "Recebimento NF-001 — Honorários",   categoria: "Receita serviços", data: "2026-06-10", valor: 12500, tipo: "receita",  status: "pago",   forma: "pix",          obs: "" },
  { id: "m2", descricao: "Pagamento — Fornecedor ABC",        categoria: "Fornecedores",     data: "2026-06-08", valor: 3200,  tipo: "despesa",  status: "pago",   forma: "transferencia", obs: "" },
  { id: "m3", descricao: "Aluguel Jun/2026",                  categoria: "Imóveis",          data: "2026-06-05", valor: 1800,  tipo: "despesa",  status: "pago",   forma: "boleto",        obs: "" },
  { id: "m4", descricao: "Recebimento NF-002",                categoria: "Receita serviços", data: "2026-06-03", valor: 7800,  tipo: "receita",  status: "pago",   forma: "boleto",        obs: "" },
  { id: "m5", descricao: "Pró-labore Jun/2026",               categoria: "Pessoal",          data: "2026-06-01", valor: 4000,  tipo: "despesa",  status: "pago",   forma: "transferencia", obs: "" },
  { id: "m6", descricao: "Energia elétrica",                  categoria: "Infraestrutura",   data: "2026-06-01", valor: 450,   tipo: "despesa",  status: "pago",   forma: "debito",        obs: "" },
];

const CONC_INIT: MovConciliacao[] = [
  { id: "c1", data: "2026-06-10", descricao: "Depósito — honorários NF-001", valor: 12500, tipo: "entrada", status: "conciliado", lancId: "m1" },
  { id: "c2", data: "2026-06-08", descricao: "TED — Fornecedor ABC",         valor: 3200,  tipo: "saida",   status: "conciliado", lancId: "m2" },
  { id: "c3", data: "2026-06-15", descricao: "Crédito — origem desconhecida",valor: 850,   tipo: "entrada", status: "pendente",   lancId: null },
  { id: "c4", data: "2026-06-18", descricao: "Débito automático — TI",       valor: 490,   tipo: "saida",   status: "pendente",   lancId: null },
  { id: "c5", data: "2026-06-20", descricao: "Tarifa bancária",               valor: 45,    tipo: "saida",   status: "ignorado",   lancId: null },
];

/* ─── Mock — Financeiro Escritório ───────────────────────────── */

const MENSALIDADES_INIT: Mensalidade[] = [
  { id: "ms1", cliente: "Alfa Comércio Ltda",  plano: "premium",      valor: 1200, vencimento: "2026-07-10", status: "em_dia",     forma: "boleto",      email: "financeiro@alfa.com" },
  { id: "ms2", cliente: "Beta Serviços ME",    plano: "intermediario", valor: 650,  vencimento: "2026-07-15", status: "em_dia",     forma: "pix",         email: "admin@beta.com" },
  { id: "ms3", cliente: "Gama Tech Eireli",    plano: "basico",        valor: 350,  vencimento: "2026-07-05", status: "atrasado",   forma: "boleto",      email: "gama@email.com" },
  { id: "ms4", cliente: "Delta Holding S/A",   plano: "premium",       valor: 2500, vencimento: "2026-07-20", status: "em_dia",     forma: "cartao",      email: "df@delta.com" },
  { id: "ms5", cliente: "Épsilon Ltda",        plano: "basico",        valor: 350,  vencimento: "2026-06-10", status: "inadimplente",forma: "boleto",     email: "ep@email.com" },
  { id: "ms6", cliente: "Zeta Construções",    plano: "intermediario", valor: 650,  vencimento: "2026-07-25", status: "em_dia",     forma: "pix",         email: "fin@zeta.com" },
  { id: "ms7", cliente: "Eta Logística",       plano: "personalizado", valor: 1800, vencimento: "2026-07-01", status: "atrasado",   forma: "transferencia",email: "eta@log.com" },
  { id: "ms8", cliente: "Theta Indústrias",    plano: "premium",       valor: 1200, vencimento: "2026-07-10", status: "em_dia",     forma: "boleto",      email: "fin@theta.com" },
];

const PAGAR_ESC_INIT: LancamentoFin[] = [
  { id: "pe1", descricao: "Aluguel escritório — Jul/2026", categoria: "Imóveis",      data: "2026-07-05", valor: 3500,  tipo: "despesa", status: "pago",   forma: "boleto",       obs: "" },
  { id: "pe2", descricao: "Folha de pagamento",            categoria: "Pessoal",       data: "2026-07-05", valor: 18000, tipo: "despesa", status: "pago",   forma: "transferencia",obs: "" },
  { id: "pe3", descricao: "Softwares e sistemas",          categoria: "TI",            data: "2026-07-15", valor: 2400,  tipo: "despesa", status: "aberto", forma: "cartao",       obs: "" },
  { id: "pe4", descricao: "Marketing digital",             categoria: "Marketing",     data: "2026-07-20", valor: 1500,  tipo: "despesa", status: "aberto", forma: "boleto",       obs: "" },
  { id: "pe5", descricao: "Contabilidade própria",         categoria: "Serviços",      data: "2026-07-30", valor: 800,   tipo: "despesa", status: "aberto", forma: "pix",          obs: "" },
  { id: "pe6", descricao: "Material de escritório",        categoria: "Administrativo",data: "2026-07-10", valor: 450,   tipo: "despesa", status: "atrasado",forma: "pix",         obs: "" },
];

const RECEBER_ESC_INIT: LancamentoFin[] = [
  { id: "re1", descricao: "Mensalidade — Alfa (Jul)", categoria: "Mensalidades", data: "2026-07-10", valor: 1200, tipo: "receita", status: "aberto",   forma: "boleto", obs: "" },
  { id: "re2", descricao: "Mensalidade — Delta (Jul)",categoria: "Mensalidades", data: "2026-07-20", valor: 2500, tipo: "receita", status: "aberto",   forma: "cartao", obs: "" },
  { id: "re3", descricao: "Mensalidade — Gama (Jul)", categoria: "Mensalidades", data: "2026-07-05", valor: 350,  tipo: "receita", status: "atrasado", forma: "boleto", obs: "3 dias em atraso" },
  { id: "re4", descricao: "Serviço avulso — Declaração IR", categoria: "Avulso", data: "2026-07-12", valor: 450, tipo: "receita", status: "pago",     forma: "pix",    obs: "" },
  { id: "re5", descricao: "Mensalidade — Épsilon (Jun)", categoria: "Mensalidades", data: "2026-06-10", valor: 350, tipo: "receita", status: "atrasado", forma: "boleto", obs: "38 dias em atraso" },
];

const COMISSOES_INIT: Comissao[] = [
  { id: "co1", colaborador: "Ana Lima",     tipo: "Carteira de clientes", mes: "Jun/2026", valor: 800,  status: "pendente" },
  { id: "co2", colaborador: "Carlos Souza", tipo: "Carteira de clientes", mes: "Jun/2026", valor: 600,  status: "pendente" },
  { id: "co3", colaborador: "Ana Lima",     tipo: "Indicação — Épsilon",  mes: "Mai/2026", valor: 200,  status: "pago" },
  { id: "co4", colaborador: "Maria Costa",  tipo: "Carteira de clientes", mes: "Jun/2026", valor: 500,  status: "pendente" },
  { id: "co5", colaborador: "João Pereira", tipo: "Carteira de clientes", mes: "Jun/2026", valor: 1200, status: "pago" },
];

const LOG_INIT: LogFin[] = [
  { id: "l1", data: "2026-06-18T15:00:00", usuario: "Sistema",     acao: "Automação: cobrança",    modulo: "Mensalidades", detalhe: "Gama Tech — vencimento em 3 dias" },
  { id: "l2", data: "2026-06-18T14:30:00", usuario: "Ana Lima",    acao: "Pagamento registrado",   modulo: "Contas Pagar", detalhe: "Aluguel escritório — R$ 3.500,00" },
  { id: "l3", data: "2026-06-17T11:00:00", usuario: "Sistema",     acao: "Automação: bloqueio",    modulo: "Portal",       detalhe: "Épsilon — portal bloqueado (38d inadimplente)" },
  { id: "l4", data: "2026-06-15T09:00:00", usuario: "João Pereira",acao: "Recebimento registrado", modulo: "Contas Receber",detalhe: "Serviço avulso IR — R$ 450,00" },
  { id: "l5", data: "2026-06-10T08:00:00", usuario: "Sistema",     acao: "Mensalidade gerada",     modulo: "Mensalidades", detalhe: "8 mensalidades Jul/2026 geradas automaticamente" },
];

const AUTOMACOES_INIT: AutomacaoRegra[] = [
  { id: "a1", nome: "Cobrança automática no vencimento",       gatilho: "SE mensalidade vencer",           acao: "Enviar cobrança via e-mail e WhatsApp", modulo: "Mensalidades", ativa: true,  execucoes: 24, ultimaExec: "2026-06-18T15:00:00" },
  { id: "a2", nome: "Atualizar status ao receber",             gatilho: "SE pagamento confirmado",         acao: "Marcar como pago e atualizar saldo",    modulo: "Contas Receber", ativa: true,  execucoes: 18, ultimaExec: "2026-06-15T09:00:00" },
  { id: "a3", nome: "Bloquear portal por inadimplência",       gatilho: "SE atraso > 30 dias",             acao: "Bloquear acesso ao portal do cliente",  modulo: "Portal",       ativa: true,  execucoes: 3,  ultimaExec: "2026-06-17T11:00:00" },
  { id: "a4", nome: "Gerar mensalidades do próximo mês",       gatilho: "SE dia 25 do mês",                acao: "Criar lançamentos do mês seguinte",     modulo: "Mensalidades", ativa: true,  execucoes: 6,  ultimaExec: "2026-06-25T08:00:00" },
  { id: "a5", nome: "Alerta de vencimento (3 dias antes)",     gatilho: "SE vencimento em 3 dias",         acao: "Notificar financeiro e cliente",         modulo: "Contas Pagar", ativa: true,  execucoes: 42, ultimaExec: "2026-06-18T07:00:00" },
  { id: "a6", nome: "Cobrança recorrente — cartão",            gatilho: "SE forma = cartão e dia venc.",    acao: "Processar cobrança automática",         modulo: "Mensalidades", ativa: false, execucoes: 0,  ultimaExec: null },
  { id: "a7", nome: "Relatório semanal automático",            gatilho: "SE segunda-feira às 8h",           acao: "Enviar resumo financeiro por e-mail",   modulo: "Relatórios",   ativa: true,  execucoes: 12, ultimaExec: "2026-06-16T08:00:00" },
  { id: "a8", nome: "Juros e multa por atraso",                gatilho: "SE atraso > 1 dia",                acao: "Calcular juros 2% + multa 1%",          modulo: "Contas Receber", ativa: true,  execucoes: 8,  ultimaExec: "2026-06-18T00:00:00" },
];

/* ─── Configurações visuais ───────────────────────────────────── */

const PLANO_LABEL: Record<Plano, string> = {
  basico: "Básico", intermediario: "Intermediário", premium: "Premium", personalizado: "Personalizado",
};

const PLANO_COLOR: Record<Plano, { bg: string; color: string }> = {
  basico:       { bg: "#f3f4f6", color: "#374151" },
  intermediario:{ bg: "#eff6ff", color: "#1d4ed8" },
  premium:      { bg: "#fdf4ff", color: "#7e22ce" },
  personalizado:{ bg: "#fffbeb", color: "#92400e" },
};

const S_STATUS: Record<StatusLanc, { bg: string; color: string; label: string }> = {
  aberto:   { bg: "#fffbeb", color: "#92400e", label: "Em aberto" },
  pago:     { bg: "#f0fdf4", color: "#065f46", label: "Pago" },
  atrasado: { bg: "#fef2f2", color: "#b91c1c", label: "Atrasado" },
  cancelado:{ bg: "#f3f4f6", color: "#6b7280", label: "Cancelado" },
  parcial:  { bg: "#ecfeff", color: "#0e7490", label: "Parcial" },
};

const S_MENSAL: Record<StatusMensal, { bg: string; color: string; label: string }> = {
  em_dia:      { bg: "#f0fdf4", color: "#065f46", label: "Em dia" },
  atrasado:    { bg: "#fffbeb", color: "#92400e", label: "Atrasado" },
  inadimplente:{ bg: "#fef2f2", color: "#b91c1c", label: "Inadimplente" },
  cancelado:   { bg: "#f3f4f6", color: "#6b7280", label: "Cancelado" },
};

const FORMA_ICON: Record<FormaPgto | "debito", string> = {
  boleto: "🏦", pix: "⚡", cartao: "💳", transferencia: "↔", dinheiro: "💵", debito: "🏧",
};

const TABS_CLI: { id: TabCliente; label: string; icon: string }[] = [
  { id: "dash_cli",    label: "Dashboard",    icon: "◉" },
  { id: "pagar",       label: "Contas a pagar",   icon: "↑" },
  { id: "receber",     label: "Contas a receber",  icon: "↓" },
  { id: "movimentos",  label: "Movimentos",   icon: "⇄" },
  { id: "conciliacao", label: "Conciliação",  icon: "✓" },
  { id: "rel_cli",     label: "Relatórios",   icon: "📄" },
];

const TABS_ESC: { id: TabEsc; label: string; icon: string }[] = [
  { id: "dash_esc",    label: "Dashboard",     icon: "◉" },
  { id: "mensalidades",label: "Mensalidades",  icon: "📅" },
  { id: "receber_esc", label: "A receber",     icon: "↓" },
  { id: "pagar_esc",   label: "A pagar",       icon: "↑" },
  { id: "comissoes",   label: "Comissões",     icon: "💰" },
  { id: "automacoes",  label: "Automações",    icon: "⚡" },
  { id: "rel_esc",     label: "Relatórios",    icon: "📊" },
];

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ display: "inline-block", background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ textAlign: right ? "right" : "left", padding: "0.7rem 0.875rem", color: "#4b7e8a", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #a5f3fc", background: "#ecfeff" }}>{children}</th>;
}

function TD({ children, right, muted, bold, color }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean; color?: string }) {
  return <td style={{ padding: "0.75rem 0.875rem", textAlign: right ? "right" : "left", color: color ?? (muted ? "#9ca3af" : "#07170d"), fontSize: "0.85rem", borderBottom: "1px solid #f0fdfe", fontWeight: bold ? 700 : 400 }}>{children}</td>;
}

function KpiCard({ label, value, sub, color, bg }: { label: string; value: string; sub: string; color: string; bg: string }) {
  return (
    <div style={{ background: bg, border: `1px solid ${color}33`, borderTop: `3px solid ${color}`, borderRadius: 12, padding: "0.875rem 1rem" }}>
      <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "0 0 2px", fontSize: "1.5rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{sub}</p>
    </div>
  );
}

/* ─── Componente principal ────────────────────────────────────── */

export default function FinanceiroPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [modo, setModo] = useState<Modo>("cliente");
  const [tabCli, setTabCli] = useState<TabCliente>("dash_cli");
  const [tabEsc, setTabEsc] = useState<TabEsc>("dash_esc");

  /* Estado — cliente */
  const [pagar, setPagar] = useState<LancamentoFin[]>(PAGAR_INIT);
  const [receber, setReceber] = useState<LancamentoFin[]>(RECEBER_INIT);
  const [movimentos] = useState<LancamentoFin[]>(MOVIMENTOS_INIT);
  const [conciliacao, setConciliacao] = useState<MovConciliacao[]>(CONC_INIT);

  /* Estado — escritório */
  const [mensalidades, setMensalidades] = useState<Mensalidade[]>(MENSALIDADES_INIT);
  const [pagarEsc, setPagarEsc] = useState<LancamentoFin[]>(PAGAR_ESC_INIT);
  const [receberEsc, setReceberEsc] = useState<LancamentoFin[]>(RECEBER_ESC_INIT);
  const [comissoes, setComissoes] = useState<Comissao[]>(COMISSOES_INIT);
  const [log, setLog] = useState<LogFin[]>(LOG_INIT);
  const [automacoes, setAutomacoes] = useState<AutomacaoRegra[]>(AUTOMACOES_INIT);

  /* Filtros */
  const [filtPagarStatus, setFiltPagarStatus] = useState<StatusLanc | "">("");
  const [filtReceberStatus, setFiltReceberStatus] = useState<StatusLanc | "">("");
  const [filtMensalStatus, setFiltMensalStatus] = useState<StatusMensal | "">("");

  /* Novo lançamento rápido */
  const [novoDesc, setNovoDesc] = useState(""); const [novoValor, setNovoValor] = useState("");
  const [novoData, setNovoData] = useState(new Date().toISOString().slice(0, 10));
  const [novoCat, setNovoCat] = useState(""); const [novoTipo, setNovoTipo] = useState<TipoMov>("despesa");
  const [showNovoLanc, setShowNovoLanc] = useState(false);

  /* ── Auditoria ── */
  function audit(acao: string, modulo: string, detalhe: string) {
    setLog((prev) => [{
      id: crypto.randomUUID(), data: new Date().toISOString(),
      usuario: "Usuário Atual", acao, modulo, detalhe,
    }, ...prev]);
  }

  /* ── Pagar ── */
  function marcarPago(id: string, lista: LancamentoFin[], setter: React.Dispatch<React.SetStateAction<LancamentoFin[]>>) {
    setter((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      audit("Pagamento registrado", modo === "cliente" ? "Contas Pagar" : "Escritório — A Pagar", `${l.descricao} — ${fmt(l.valor)}`);
      return { ...l, status: "pago" };
    }));
  }

  function marcarRecebido(id: string, lista: LancamentoFin[], setter: React.Dispatch<React.SetStateAction<LancamentoFin[]>>) {
    setter((prev) => prev.map((l) => {
      if (l.id !== id) return l;
      audit("Recebimento registrado", modo === "cliente" ? "Contas Receber" : "Escritório — A Receber", `${l.descricao} — ${fmt(l.valor)}`);
      return { ...l, status: "pago" };
    }));
  }

  /* ── Mensalidades ── */
  function emitirCobranca(id: string, forma: FormaPgto) {
    audit("Cobrança emitida", "Mensalidades", `${mensalidades.find((m) => m.id === id)?.cliente} — via ${forma.toUpperCase()}`);
  }

  function marcarMensalidadePaga(id: string) {
    setMensalidades((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      audit("Mensalidade paga", "Mensalidades", `${m.cliente} — ${fmt(m.valor)}`);
      return { ...m, status: "em_dia" };
    }));
  }

  function bloquearPortal(id: string) {
    const m = mensalidades.find((x) => x.id === id);
    if (!m) return;
    audit("Automação: portal bloqueado", "Portal", `${m.cliente} — inadimplente`);
  }

  /* ── Conciliação ── */
  function conciliar(id: string) {
    setConciliacao((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      audit("Movimento conciliado", "Conciliação", `${c.descricao} — ${fmt(c.valor)}`);
      return { ...c, status: "conciliado" };
    }));
  }

  /* ── Comissões ── */
  function pagarComissao(id: string) {
    setComissoes((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      audit("Comissão paga", "Comissões", `${c.colaborador} — ${fmt(c.valor)}`);
      return { ...c, status: "pago" };
    }));
  }

  /* ── Automações ── */
  function toggleAutomacao(id: string) {
    setAutomacoes((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      const novoEstado = !a.ativa;
      audit(novoEstado ? "Automação ativada" : "Automação desativada", "Automações", a.nome);
      return { ...a, ativa: novoEstado };
    }));
  }

  function executarAutomacao(id: string) {
    setAutomacoes((prev) => prev.map((a) => {
      if (a.id !== id) return a;
      audit("Automação executada manualmente", "Automações", a.nome);
      return { ...a, execucoes: a.execucoes + 1, ultimaExec: new Date().toISOString() };
    }));
  }

  /* ── Métricas ── */
  const totalPagar = pagar.filter((l) => l.status === "aberto" || l.status === "atrasado").reduce((a, l) => a + l.valor, 0);
  const totalReceber = receber.filter((l) => l.status === "aberto" || l.status === "atrasado").reduce((a, l) => a + l.valor, 0);
  const saldo = 24350;
  const concPendentes = conciliacao.filter((c) => c.status === "pendente").length;

  const mrr = mensalidades.filter((m) => m.status !== "cancelado").reduce((a, m) => a + m.valor, 0);
  const inadimplentes = mensalidades.filter((m) => m.status === "inadimplente" || m.status === "atrasado").length;
  const clientesAtivos = mensalidades.filter((m) => m.status !== "cancelado").length;
  const ticketMedio = clientesAtivos > 0 ? mrr / clientesAtivos : 0;
  const recebimentosMes = receberEsc.filter((l) => l.status === "pago").reduce((a, l) => a + l.valor, 0);
  const custosMes = pagarEsc.reduce((a, l) => a + l.valor, 0);
  const margemMes = mrr - custosMes;

  const pagarFiltrado = pagar.filter((l) => filtPagarStatus === "" || l.status === filtPagarStatus);
  const receberFiltrado = receber.filter((l) => filtReceberStatus === "" || l.status === filtReceberStatus);
  const mensalFiltrada = mensalidades.filter((m) => filtMensalStatus === "" || m.status === filtMensalStatus);

  /* ─── Render ─── */
  return (
    <SetorShell
      borda="#67e8f9"
      cor="#0e7490"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#ecfeff"
      icone={ICONE}
      setorNome="Setor Financeiro"
      setorResumo="Finanças do cliente e gestão financeira do escritório contábil"
      stats={[
        { label: "Saldo cliente", value: fmt(saldo),         cor: "#34d399" },
        { label: "A receber",     value: fmt(totalReceber),  cor: "#67e8f9" },
        { label: "MRR escritório",value: fmt(mrr),           cor: "#a5f3fc" },
        { label: "Inadimplentes", value: String(inadimplentes), cor: inadimplentes > 0 ? "#fca5a5" : "#34d399" },
      ]}
    >

      {/* ── Alternador de modo ── */}
      <div style={{ display: "flex", gap: 8, marginBottom: "1rem" }}>
        {[
          { id: "cliente" as Modo, label: "🏢 Financeiro Cliente", desc: "Fluxo, contas e conciliação da empresa" },
          { id: "escritorio" as Modo, label: "💼 Financeiro Escritório", desc: "MRR, mensalidades e custos do escritório" },
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setModo(m.id)}
            style={{
              flex: 1, padding: "0.75rem 1.25rem", borderRadius: 12,
              border: `2px solid ${modo === m.id ? "#0e7490" : "#a5f3fc"}`,
              background: modo === m.id ? "#0e7490" : "#ecfeff",
              color: modo === m.id ? "#fff" : "#0e7490",
              cursor: "pointer", textAlign: "left", transition: "all 0.15s",
            }}
            type="button"
          >
            <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.9rem" }}>{m.label}</p>
            <p style={{ margin: 0, fontSize: "0.72rem", opacity: 0.8 }}>{m.desc}</p>
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════
          MODO: FINANCEIRO CLIENTE
      ════════════════════════════════════ */}
      {modo === "cliente" && (
        <>
          {/* Tabs */}
          <div style={{ background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #a5f3fc", borderBottom: "none" }}>
            <div style={{ display: "flex", overflowX: "auto", padding: "0 6px" }}>
              {TABS_CLI.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTabCli(t.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    borderBottom: tabCli === t.id ? "2px solid #0e7490" : "2px solid transparent",
                    color: tabCli === t.id ? "#0e7490" : "#9ca3af",
                    fontWeight: tabCli === t.id ? 800 : 500,
                    fontSize: "0.8rem", padding: "0.85rem 0.9rem",
                    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.35rem",
                    marginBottom: -2,
                  }}
                  type="button"
                >
                  <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{t.icon}</span>
                  {t.label}
                  {t.id === "conciliacao" && concPendentes > 0 && (
                    <span style={{ background: "#fbbf24", color: "#92400e", borderRadius: 999, fontSize: "0.62rem", fontWeight: 900, padding: "1px 6px" }}>{concPendentes}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #a5f3fc", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

            {/* ── Dashboard cliente ── */}
            {tabCli === "dash_cli" && (
              <div style={{ display: "grid", gap: "1.25rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  <KpiCard label="Saldo atual"       value={fmt(saldo)}          sub="Todas as contas" color="#065f46" bg="#f0fdf4" />
                  <KpiCard label="Receitas (Jun)"    value={fmt(20300)}          sub="+8% vs mai"      color="#0e7490" bg="#ecfeff" />
                  <KpiCard label="Despesas (Jun)"    value={fmt(9450)}           sub="-3% vs mai"      color="#b91c1c" bg="#fef2f2" />
                  <KpiCard label="Resultado (Jun)"   value={fmt(10850)}          sub="Lucro líquido"   color="#7c3aed" bg="#f5f3ff" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem" }}>
                  {/* Gráfico mensal SVG */}
                  <div className="list-panel">
                    <div className="list-panel-header"><div><h2>Fluxo Mensal</h2><p>Receitas vs Despesas — 2026</p></div></div>
                    <div style={{ padding: "1rem 1.25rem 1.25rem" }}>
                      <svg height={160} viewBox="0 0 360 160" width="100%" style={{ overflow: "visible" }}>
                        {[0,40,80,120,160].map((y) => <line key={y} x1={0} x2={360} y1={y} y2={y} stroke="#f0fdfe" strokeWidth={1} />)}
                        {[
                          { m: "Jan", rec: 80, dep: 50 }, { m: "Fev", rec: 95, dep: 55 },
                          { m: "Mar", rec: 75, dep: 60 }, { m: "Abr", rec: 110, dep: 58 },
                          { m: "Mai", rec: 100, dep: 52 }, { m: "Jun", rec: 130, dep: 65 },
                        ].map((d, i) => {
                          const x = i * 56 + 20;
                          return (
                            <g key={d.m}>
                              <rect x={x} y={160 - d.rec} width={20} height={d.rec} fill="#0e7490" rx={3} opacity={0.8} />
                              <rect x={x + 22} y={160 - d.dep} width={20} height={d.dep} fill="#fca5a5" rx={3} opacity={0.8} />
                              <text x={x + 11} y={175} fill="#9ca3af" fontSize={11} textAnchor="middle">{d.m}</text>
                            </g>
                          );
                        })}
                      </svg>
                      <div style={{ display: "flex", gap: 16, marginTop: 8, fontSize: "0.72rem", color: "#9ca3af" }}>
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}><span style={{ width: 10, height: 10, background: "#0e7490", borderRadius: 2, display: "inline-block" }} />Receitas</span>
                        <span style={{ display: "flex", gap: 5, alignItems: "center" }}><span style={{ width: 10, height: 10, background: "#fca5a5", borderRadius: 2, display: "inline-block" }} />Despesas</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Saldo por conta */}
                    <div className="list-panel">
                      <div className="list-panel-header"><div><h2>Saldo por Conta</h2></div></div>
                      <div style={{ padding: "0.25rem 0 0.5rem" }}>
                        {[
                          { conta: "Banco Inter PJ", saldo: 18650, cor: "#0e7490" },
                          { conta: "Nubank PJ",       saldo: 4800,  cor: "#7c3aed" },
                          { conta: "Caixa",           saldo: 900,   cor: "#065f46" },
                        ].map((c) => (
                          <div key={c.conta} style={{ display: "flex", justifyContent: "space-between", padding: "7px 1rem", borderBottom: "1px solid #f0fdfe" }}>
                            <span style={{ fontSize: "0.82rem", color: "#374151" }}>{c.conta}</span>
                            <strong style={{ fontSize: "0.85rem", color: c.cor }}>{fmt(c.saldo)}</strong>
                          </div>
                        ))}
                        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 1rem", background: "#ecfeff" }}>
                          <strong style={{ fontSize: "0.85rem", color: "#0e7490" }}>Total disponível</strong>
                          <strong style={{ fontSize: "0.9rem", color: "#0e7490" }}>{fmt(saldo)}</strong>
                        </div>
                      </div>
                    </div>
                    {/* Próximos vencimentos */}
                    <div className="list-panel">
                      <div className="list-panel-header"><div><h2>Próximos vencimentos</h2></div></div>
                      <div style={{ padding: "0.25rem 0 0.5rem" }}>
                        {[...pagar.filter((l) => l.status === "aberto"), ...pagar.filter((l) => l.status === "atrasado")]
                          .sort((a, b) => a.data.localeCompare(b.data)).slice(0, 4).map((l) => (
                          <div key={l.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 1rem", borderBottom: "1px solid #f0fdfe" }}>
                            <div>
                              <p style={{ margin: "0 0 1px", fontSize: "0.78rem", fontWeight: 700, color: "#07170d" }}>{l.descricao}</p>
                              <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{new Date(l.data).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                              <strong style={{ fontSize: "0.82rem", color: "#b91c1c" }}>{fmt(l.valor)}</strong>
                              <Badge {...S_STATUS[l.status]} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Fluxo de trabalho financeiro */}
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Fluxo Financeiro</h2><p>Etapas do processo financeiro</p></div></div>
                  <div style={{ padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "center", gap: 0 }}>
                    {[
                      { etapa: "Receber", desc: "Registrar receitas e cobranças", icone: "↓", cor: "#0e7490", bg: "#ecfeff", count: receber.filter((l) => l.status === "aberto").length },
                      { etapa: "Conciliar", desc: "Conferir extrato bancário", icone: "✓", cor: "#92400e", bg: "#fffbeb", count: concPendentes },
                      { etapa: "Fechar", desc: "Encerrar período contábil", icone: "🔒", cor: "#065f46", bg: "#f0fdf4", count: 0 },
                    ].map((f, i) => (
                      <div key={f.etapa} style={{ display: "flex", alignItems: "center" }}>
                        <div style={{ background: f.bg, border: `2px solid ${f.cor}33`, borderRadius: 14, padding: "1rem 1.5rem", textAlign: "center", minWidth: 160 }}>
                          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${f.cor}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: "1.2rem", color: f.cor, fontWeight: 900 }}>{f.icone}</div>
                          <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.9rem", color: f.cor }}>{f.etapa}</p>
                          <p style={{ margin: "0 0 6px", fontSize: "0.72rem", color: "#9ca3af" }}>{f.desc}</p>
                          {f.count > 0 && <span style={{ fontSize: "0.68rem", fontWeight: 700, background: f.cor, color: "#fff", borderRadius: 999, padding: "2px 10px" }}>{f.count} pendente(s)</span>}
                        </div>
                        {i < 2 && <div style={{ width: 40, height: 2, background: "#a5f3fc", margin: "0 -4px" }} />}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Contas a pagar ── */}
            {tabCli === "pagar" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Contas a Pagar</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Total pendente: <strong style={{ color: "#b91c1c" }}>{fmt(totalPagar)}</strong></p></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select className="input" onChange={(e) => setFiltPagarStatus(e.target.value as StatusLanc | "")} value={filtPagarStatus}>
                      <option value="">Todos</option>
                      <option value="aberto">Em aberto</option>
                      <option value="atrasado">Atrasado</option>
                      <option value="pago">Pago</option>
                    </select>
                    <button type="button">+ Nova conta</button>
                  </div>
                </div>

                {/* KPIs rápidos */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "Em aberto",   value: fmt(pagar.filter((l) => l.status === "aberto").reduce((a, l) => a + l.valor, 0)), color: "#92400e", bg: "#fffbeb" },
                    { label: "Atrasado",    value: fmt(pagar.filter((l) => l.status === "atrasado").reduce((a, l) => a + l.valor, 0)), color: "#b91c1c", bg: "#fef2f2" },
                    { label: "Pago (mês)",  value: fmt(pagar.filter((l) => l.status === "pago").reduce((a, l) => a + l.valor, 0)), color: "#065f46", bg: "#f0fdf4" },
                  ].map((k) => (
                    <div key={k.label} style={{ background: k.bg, borderTop: `3px solid ${k.color}`, borderRadius: 10, padding: "0.875rem 1rem", border: `1px solid ${k.color}22` }}>
                      <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</p>
                      <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Descrição</TH><TH>Categoria</TH><TH>Data</TH><TH right>Valor</TH><TH>Forma</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                  <tbody>
                    {pagarFiltrado.map((l) => (
                      <tr key={l.id} style={{ background: l.status === "atrasado" ? "#fff8f8" : "transparent" }}>
                        <TD><div><p style={{ margin: "0 0 1px", fontWeight: 700 }}>{l.descricao}</p>{l.obs && <p style={{ margin: 0, fontSize: "0.7rem", color: "#b91c1c" }}>{l.obs}</p>}</div></TD>
                        <TD muted>{l.categoria}</TD>
                        <TD muted>{new Date(l.data).toLocaleDateString("pt-BR")}</TD>
                        <TD right bold color="#b91c1c">{fmt(l.valor)}</TD>
                        <TD muted><span style={{ fontSize: "0.85rem" }}>{FORMA_ICON[l.forma as keyof typeof FORMA_ICON] ?? "—"} {l.forma}</span></TD>
                        <TD><Badge {...S_STATUS[l.status]} /></TD>
                        <TD right>
                          {(l.status === "aberto" || l.status === "atrasado") && (
                            <button className="small-action" onClick={() => marcarPago(l.id, pagar, setPagar)} type="button">✓ Pagar</button>
                          )}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Contas a receber ── */}
            {tabCli === "receber" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Contas a Receber</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Total a receber: <strong style={{ color: "#065f46" }}>{fmt(totalReceber)}</strong></p></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select className="input" onChange={(e) => setFiltReceberStatus(e.target.value as StatusLanc | "")} value={filtReceberStatus}>
                      <option value="">Todos</option>
                      <option value="aberto">Em aberto</option>
                      <option value="atrasado">Atrasado</option>
                      <option value="pago">Recebido</option>
                    </select>
                    <button type="button">+ Nova conta</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "A receber", value: fmt(receber.filter((l) => l.status === "aberto").reduce((a, l) => a + l.valor, 0)), color: "#0e7490", bg: "#ecfeff" },
                    { label: "Atrasado",  value: fmt(receber.filter((l) => l.status === "atrasado").reduce((a, l) => a + l.valor, 0)), color: "#b91c1c", bg: "#fef2f2" },
                    { label: "Recebido",  value: fmt(receber.filter((l) => l.status === "pago").reduce((a, l) => a + l.valor, 0)), color: "#065f46", bg: "#f0fdf4" },
                  ].map((k) => (
                    <div key={k.label} style={{ background: k.bg, borderTop: `3px solid ${k.color}`, borderRadius: 10, padding: "0.875rem 1rem", border: `1px solid ${k.color}22` }}>
                      <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</p>
                      <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Descrição</TH><TH>Categoria</TH><TH>Vencimento</TH><TH right>Valor</TH><TH>Forma</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                  <tbody>
                    {receberFiltrado.map((l) => (
                      <tr key={l.id} style={{ background: l.status === "atrasado" ? "#fff8f8" : "transparent" }}>
                        <TD><div><p style={{ margin: "0 0 1px", fontWeight: 700 }}>{l.descricao}</p>{l.obs && <p style={{ margin: 0, fontSize: "0.7rem", color: "#b91c1c" }}>{l.obs}</p>}</div></TD>
                        <TD muted>{l.categoria}</TD>
                        <TD muted>{new Date(l.data).toLocaleDateString("pt-BR")}</TD>
                        <TD right bold color="#065f46">{fmt(l.valor)}</TD>
                        <TD muted><span style={{ fontSize: "0.85rem" }}>{FORMA_ICON[l.forma as keyof typeof FORMA_ICON] ?? "—"} {l.forma}</span></TD>
                        <TD><Badge {...S_STATUS[l.status]} /></TD>
                        <TD right>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            {(l.status === "aberto" || l.status === "atrasado") && (
                              <button className="small-action" onClick={() => marcarRecebido(l.id, receber, setReceber)} type="button">✓ Receber</button>
                            )}
                            {l.status === "atrasado" && (
                              <button className="small-action" onClick={() => audit("Cobrança enviada", "Contas Receber", l.descricao)} type="button">📧 Cobrar</button>
                            )}
                          </div>
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Movimentos ── */}
            {tabCli === "movimentos" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Extrato de Movimentos</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Jun/2026 — {movimentos.length} transações</p></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="small-action" onClick={() => { setShowNovoLanc(!showNovoLanc); }} type="button">{showNovoLanc ? "✕" : "+ Novo"}</button>
                    <button className="small-action" onClick={() => audit("Extrato exportado", "Movimentos", "CSV Jun/2026")} type="button">⬇ CSV</button>
                  </div>
                </div>

                {showNovoLanc && (
                  <div style={{ background: "#ecfeff", border: "1px solid #a5f3fc", borderRadius: 12, padding: "1.25rem" }}>
                    <p style={{ margin: "0 0 0.875rem", fontWeight: 800, fontSize: "0.85rem", color: "#0e7490" }}>Novo lançamento</p>
                    <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 160px 120px 130px", gap: 10, marginBottom: 10 }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b7e8a" }}>
                        Data<input className="input" type="date" value={novoData} onChange={(e) => setNovoData(e.target.value)} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b7e8a" }}>
                        Descrição *<input className="input" value={novoDesc} onChange={(e) => setNovoDesc(e.target.value)} placeholder="Ex: Pagamento fornecedor" />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b7e8a" }}>
                        Categoria<input className="input" value={novoCat} onChange={(e) => setNovoCat(e.target.value)} placeholder="Ex: Fornecedores" />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b7e8a" }}>
                        Valor (R$) *<input className="input" value={novoValor} onChange={(e) => setNovoValor(e.target.value)} placeholder="0,00" />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b7e8a" }}>
                        Tipo
                        <select className="input" value={novoTipo} onChange={(e) => setNovoTipo(e.target.value as TipoMov)}>
                          <option value="receita">Receita</option>
                          <option value="despesa">Despesa</option>
                          <option value="transferencia">Transferência</option>
                        </select>
                      </label>
                    </div>
                    <button
                      disabled={!novoDesc || !novoValor}
                      onClick={() => {
                        audit("Movimento registrado", "Movimentos", `${novoDesc} — ${novoTipo} — R$ ${novoValor}`);
                        setShowNovoLanc(false); setNovoDesc(""); setNovoValor("");
                      }}
                      style={{ opacity: (!novoDesc || !novoValor) ? 0.5 : 1 }}
                      type="button"
                    >✓ Registrar</button>
                  </div>
                )}

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Data</TH><TH>Descrição</TH><TH>Categoria</TH><TH>Tipo</TH><TH right>Valor</TH></tr></thead>
                  <tbody>
                    {movimentos.map((m) => (
                      <tr key={m.id}>
                        <TD muted>{new Date(m.data).toLocaleDateString("pt-BR")}</TD>
                        <TD bold>{m.descricao}</TD>
                        <TD muted>{m.categoria}</TD>
                        <TD>
                          <span style={{ fontSize: "0.75rem", fontWeight: 700, color: m.tipo === "receita" ? "#065f46" : "#b91c1c", background: m.tipo === "receita" ? "#f0fdf4" : "#fef2f2", borderRadius: 999, padding: "2px 8px" }}>
                            {m.tipo === "receita" ? "↓ Receita" : "↑ Despesa"}
                          </span>
                        </TD>
                        <TD right bold color={m.tipo === "receita" ? "#065f46" : "#b91c1c"}>
                          {m.tipo === "receita" ? "+" : "−"} {fmt(m.valor)}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#ecfeff", borderTop: "2px solid #a5f3fc" }}>
                      <td colSpan={4} style={{ padding: "0.8rem 0.875rem", fontWeight: 800, color: "#0e7490" }}>Resultado do período</td>
                      <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 900, color: "#065f46", fontSize: "0.95rem" }}>
                        + {fmt(movimentos.filter((m) => m.tipo === "receita").reduce((a, m) => a + m.valor, 0) - movimentos.filter((m) => m.tipo === "despesa").reduce((a, m) => a + m.valor, 0))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ── Conciliação ── */}
            {tabCli === "conciliacao" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Conciliação Bancária</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{concPendentes} item(ns) pendentes</p></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="small-action" onClick={() => audit("Extrato importado", "Conciliação", "OFX Jun/2026")} type="button">📥 Importar OFX</button>
                    <button className="small-action" onClick={() => { conciliacao.filter((c) => c.status === "pendente").forEach((c) => audit("Sugestão automática", "Conciliação", c.descricao)); }} type="button">⚡ Sugerir</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "Saldo banco",      value: fmt(24350), color: "#065f46", bg: "#f0fdf4" },
                    { label: "Saldo sistema",    value: fmt(24350 - 850 + 490), color: "#0e7490", bg: "#ecfeff" },
                    { label: "Itens pendentes",  value: String(concPendentes), color: concPendentes > 0 ? "#92400e" : "#065f46", bg: concPendentes > 0 ? "#fffbeb" : "#f0fdf4" },
                  ].map((k) => (
                    <div key={k.label} style={{ background: k.bg, borderTop: `3px solid ${k.color}`, borderRadius: 10, padding: "0.875rem 1rem", border: `1px solid ${k.color}22` }}>
                      <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</p>
                      <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: k.color }}>{k.value}</p>
                    </div>
                  ))}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Data</TH><TH>Descrição banco</TH><TH>Tipo</TH><TH right>Valor</TH><TH>Lançamento</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                  <tbody>
                    {conciliacao.map((c) => (
                      <tr key={c.id}>
                        <TD muted>{new Date(c.data).toLocaleDateString("pt-BR")}</TD>
                        <TD>{c.descricao}</TD>
                        <TD><span style={{ fontSize: "0.75rem", fontWeight: 700, color: c.tipo === "entrada" ? "#065f46" : "#b91c1c" }}>{c.tipo === "entrada" ? "↓ Entrada" : "↑ Saída"}</span></TD>
                        <TD right bold color={c.tipo === "entrada" ? "#065f46" : "#b91c1c"}>{c.tipo === "entrada" ? "+" : "−"} {fmt(c.valor)}</TD>
                        <TD muted>{c.lancId ? <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#0e7490" }}>#{c.lancId}</span> : "—"}</TD>
                        <TD>
                          <Badge {...(c.status === "conciliado" ? { bg: "#f0fdf4", color: "#065f46", label: "Conciliado" } : c.status === "ignorado" ? { bg: "#f3f4f6", color: "#9ca3af", label: "Ignorado" } : { bg: "#fffbeb", color: "#92400e", label: "Pendente" })} />
                        </TD>
                        <TD right>
                          {c.status === "pendente" && (
                            <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                              <button className="small-action" onClick={() => conciliar(c.id)} type="button">✓ Conciliar</button>
                              <button className="small-action" onClick={() => { setConciliacao((prev) => prev.map((m) => m.id === c.id ? { ...m, status: "ignorado" } : m)); audit("Movimento ignorado", "Conciliação", c.descricao); }} type="button">— Ignorar</button>
                            </div>
                          )}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Relatórios cliente ── */}
            {tabCli === "rel_cli" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Relatórios Financeiros</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Gere demonstrativos e exporte para PDF/Excel</p></div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { icon: "📊", label: "DRE Gerencial", desc: "Resultado do exercício simplificado" },
                    { icon: "💧", label: "Fluxo de Caixa", desc: "Entradas e saídas por período" },
                    { icon: "📋", label: "Contas a Pagar", desc: "Relatório de obrigações por vencimento" },
                    { icon: "📬", label: "Contas a Receber", desc: "Créditos e inadimplência" },
                    { icon: "📈", label: "Análise Mensal", desc: "Comparativo mês a mês" },
                    { icon: "📉", label: "Análise Anual", desc: "Consolidado do exercício" },
                  ].map((r) => (
                    <button
                      key={r.label}
                      onClick={() => audit(`Relatório: ${r.label}`, "Relatórios", "Gerado")}
                      style={{ background: "#fff", border: "1px solid #a5f3fc", borderRadius: 12, padding: "1.25rem", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
                      type="button"
                    >
                      <span style={{ fontSize: "1.5rem" }}>{r.icon}</span>
                      <strong style={{ fontSize: "0.9rem", color: "#0e7490" }}>{r.label}</strong>
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{r.desc}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#0e7490", background: "#ecfeff", borderRadius: 999, padding: "2px 8px" }}>📄 PDF</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#065f46", background: "#f0fdf4", borderRadius: 999, padding: "2px 8px" }}>📊 Excel</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </div>
        </>
      )}

      {/* ════════════════════════════════════
          MODO: FINANCEIRO ESCRITÓRIO
      ════════════════════════════════════ */}
      {modo === "escritorio" && (
        <>
          {/* Tabs */}
          <div style={{ background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #c4b5fd", borderBottom: "none" }}>
            <div style={{ display: "flex", overflowX: "auto", padding: "0 6px" }}>
              {TABS_ESC.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTabEsc(t.id)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    borderBottom: tabEsc === t.id ? "2px solid #7c3aed" : "2px solid transparent",
                    color: tabEsc === t.id ? "#7c3aed" : "#9ca3af",
                    fontWeight: tabEsc === t.id ? 800 : 500,
                    fontSize: "0.8rem", padding: "0.85rem 0.9rem",
                    whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.35rem",
                    marginBottom: -2,
                  }}
                  type="button"
                >
                  <span style={{ fontSize: "0.7rem", opacity: 0.7 }}>{t.icon}</span>
                  {t.label}
                  {t.id === "mensalidades" && inadimplentes > 0 && (
                    <span style={{ background: "#fca5a5", color: "#b91c1c", borderRadius: 999, fontSize: "0.62rem", fontWeight: 900, padding: "1px 6px" }}>{inadimplentes}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#fff", border: "1px solid #c4b5fd", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

            {/* ── Dashboard executivo ── */}
            {tabEsc === "dash_esc" && (
              <div style={{ display: "grid", gap: "1.25rem" }}>
                {/* KPIs executivos */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
                  <KpiCard label="MRR"             value={fmt(mrr)}           sub="Receita recorrente mensal" color="#7c3aed" bg="#f5f3ff" />
                  <KpiCard label="Recebidos (mês)"  value={fmt(recebimentosMes)}sub="Entradas confirmadas"      color="#065f46" bg="#f0fdf4" />
                  <KpiCard label="Inadimplentes"    value={String(inadimplentes)}sub={`de ${clientesAtivos} clientes`} color={inadimplentes > 0 ? "#b91c1c" : "#065f46"} bg={inadimplentes > 0 ? "#fef2f2" : "#f0fdf4"} />
                  <KpiCard label="Clientes ativos"  value={String(clientesAtivos)}sub="Mensalidades ativas"      color="#0e7490" bg="#ecfeff" />
                  <KpiCard label="Ticket médio"     value={fmt(ticketMedio)}   sub="Por cliente ativo"         color="#92400e" bg="#fffbeb" />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "1.25rem" }}>
                  {/* MRR + resultado */}
                  <div className="list-panel">
                    <div className="list-panel-header"><div><h2>Resultado Escritório — Jun/2026</h2></div></div>
                    <div style={{ padding: "1rem 1.25rem" }}>
                      <svg height={130} viewBox="0 0 340 130" width="100%" style={{ overflow: "visible" }}>
                        {[0,32.5,65,97.5,130].map((y) => <line key={y} x1={0} x2={340} y1={y} y2={y} stroke="#f5f3ff" strokeWidth={1} />)}
                        {[
                          { m: "Jan", mrr: 78, custo: 55 }, { m: "Fev", mrr: 82, custo: 56 },
                          { m: "Mar", mrr: 85, custo: 58 }, { m: "Abr", mrr: 88, custo: 60 },
                          { m: "Mai", mrr: 90, custo: 61 }, { m: "Jun", mrr: 100, custo: 63 },
                        ].map((d, i) => {
                          const x = i * 52 + 18;
                          return (
                            <g key={d.m}>
                              <rect x={x} y={130 - d.mrr} width={18} height={d.mrr} fill="#7c3aed" rx={3} opacity={0.8} />
                              <rect x={x + 20} y={130 - d.custo} width={18} height={d.custo} fill="#fca5a5" rx={3} opacity={0.7} />
                              <text x={x + 9} y={145} fill="#9ca3af" fontSize={10} textAnchor="middle">{d.m}</text>
                            </g>
                          );
                        })}
                      </svg>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 12 }}>
                        {[
                          { label: "MRR", value: fmt(mrr), color: "#7c3aed" },
                          { label: "Custos", value: fmt(custosMes), color: "#b91c1c" },
                          { label: "Margem", value: fmt(margemMes), color: "#065f46" },
                        ].map((item) => (
                          <div key={item.label} style={{ textAlign: "center", padding: "6px", background: "#f8faff", borderRadius: 8 }}>
                            <p style={{ margin: "0 0 2px", fontSize: "0.65rem", color: "#9ca3af", fontWeight: 700, textTransform: "uppercase" }}>{item.label}</p>
                            <strong style={{ fontSize: "0.9rem", color: item.color }}>{item.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                    {/* Gráfico anual comparativo */}
                    <div className="list-panel">
                      <div className="list-panel-header"><div><h2>Anual — 2025 vs 2026</h2></div></div>
                      <div style={{ padding: "1rem 1.25rem" }}>
                        <svg height={100} viewBox="0 0 340 100" width="100%" style={{ overflow: "visible" }}>
                          {[0, 25, 50, 75, 100].map((y) => <line key={y} x1={0} x2={340} y1={y} y2={y} stroke="#f5f3ff" strokeWidth={1} />)}
                          {[
                            { m: "Jan", v25: 52, v26: 62 }, { m: "Fev", v25: 55, v26: 68 },
                            { m: "Mar", v25: 48, v26: 65 }, { m: "Abr", v25: 60, v26: 72 },
                            { m: "Mai", v25: 58, v26: 75 }, { m: "Jun", v25: 62, v26: 82 },
                            { m: "Jul", v25: 64, v26: 0 },  { m: "Ago", v25: 56, v26: 0 },
                            { m: "Set", v25: 58, v26: 0 },  { m: "Out", v25: 65, v26: 0 },
                            { m: "Nov", v25: 68, v26: 0 },  { m: "Dez", v25: 72, v26: 0 },
                          ].map((d, i) => {
                            const x = i * 27 + 6;
                            return (
                              <g key={d.m}>
                                <rect x={x} y={100 - d.v25} width={10} height={d.v25} fill="#c4b5fd" rx={2} opacity={0.6} />
                                {d.v26 > 0 && <rect x={x + 12} y={100 - d.v26} width={10} height={d.v26} fill="#7c3aed" rx={2} opacity={0.85} />}
                                <text x={x + 6} y={113} fill="#9ca3af" fontSize={8} textAnchor="middle">{d.m}</text>
                              </g>
                            );
                          })}
                        </svg>
                        <div style={{ display: "flex", gap: 14, marginTop: 8, fontSize: "0.68rem", color: "#9ca3af" }}>
                          <span style={{ display: "flex", gap: 4, alignItems: "center" }}><span style={{ width: 8, height: 8, background: "#c4b5fd", borderRadius: 2, display: "inline-block" }} />2025</span>
                          <span style={{ display: "flex", gap: 4, alignItems: "center" }}><span style={{ width: 8, height: 8, background: "#7c3aed", borderRadius: 2, display: "inline-block" }} />2026</span>
                          <span style={{ marginLeft: "auto", fontWeight: 700, color: "#065f46" }}>+32% vs 2025</span>
                        </div>
                      </div>
                    </div>

                    {/* Distribuição por plano */}
                    <div className="list-panel">
                      <div className="list-panel-header"><div><h2>Distribuição por plano</h2></div></div>
                      <div style={{ padding: "0.5rem 1rem 0.75rem" }}>
                        {(["premium","intermediario","basico","personalizado"] as Plano[]).map((plano) => {
                          const count = mensalidades.filter((m) => m.plano === plano && m.status !== "cancelado").length;
                          const receita = mensalidades.filter((m) => m.plano === plano && m.status !== "cancelado").reduce((a, m) => a + m.valor, 0);
                          return (
                            <div key={plano} style={{ padding: "7px 0", borderBottom: "1px solid #f5f3ff" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                                <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{PLANO_LABEL[plano]}</span>
                                <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{count} cliente(s) · <strong style={{ color: "#7c3aed" }}>{fmt(receita)}</strong></span>
                              </div>
                              <div style={{ height: 5, background: "#f5f3ff", borderRadius: 999, overflow: "hidden" }}>
                                <div style={{ height: "100%", width: `${mrr > 0 ? (receita / mrr) * 100 : 0}%`, background: PLANO_COLOR[plano].color, borderRadius: 999 }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    {/* Alertas executivos */}
                    <div className="list-panel">
                      <div className="list-panel-header"><div><h2>Alertas</h2></div></div>
                      <div style={{ padding: "0.25rem 0 0.5rem" }}>
                        {[
                          { msg: `${inadimplentes} cliente(s) inadimplentes`, tipo: "danger", onClick: () => setTabEsc("mensalidades") },
                          { msg: "3 cobranças com vencimento em 5 dias", tipo: "warn", onClick: () => setTabEsc("mensalidades") },
                          { msg: `Comissões pendentes: ${fmt(comissoes.filter((c) => c.status === "pendente").reduce((a, c) => a + c.valor, 0))}`, tipo: "info", onClick: () => setTabEsc("comissoes") },
                        ].map((a, i) => (
                          <button key={i} onClick={a.onClick} style={{ width: "100%", display: "flex", gap: 8, alignItems: "center", padding: "8px 1rem", borderBottom: "1px solid #f5f3ff", background: "none", border: "none", cursor: "pointer", textAlign: "left" }} type="button">
                            <span>{a.tipo === "danger" ? "🔴" : a.tipo === "warn" ? "⚠️" : "ℹ️"}</span>
                            <span style={{ fontSize: "0.82rem", color: a.tipo === "danger" ? "#b91c1c" : a.tipo === "warn" ? "#92400e" : "#7c3aed", fontWeight: 600 }}>{a.msg}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Mensalidades ── */}
            {tabEsc === "mensalidades" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Mensalidades — Jul/2026</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>MRR: <strong style={{ color: "#7c3aed" }}>{fmt(mrr)}</strong> · {clientesAtivos} clientes</p></div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <select className="input" onChange={(e) => setFiltMensalStatus(e.target.value as StatusMensal | "")} value={filtMensalStatus}>
                      <option value="">Todos</option>
                      <option value="em_dia">Em dia</option>
                      <option value="atrasado">Atrasado</option>
                      <option value="inadimplente">Inadimplente</option>
                    </select>
                    <button className="small-action" onClick={() => { mensalidades.filter((m) => m.status === "inadimplente").forEach((m) => { bloquearPortal(m.id); }); }} type="button">🔒 Bloquear inadimplentes</button>
                    <button onClick={() => audit("Mensalidades geradas", "Mensalidades", "Ago/2026 — 8 lançamentos")} type="button">⚡ Gerar próximo mês</button>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[
                    { label: "Em dia",       count: mensalidades.filter((m) => m.status === "em_dia").length,      value: mensalidades.filter((m) => m.status === "em_dia").reduce((a, m) => a + m.valor, 0), color: "#065f46", bg: "#f0fdf4" },
                    { label: "Atrasados",    count: mensalidades.filter((m) => m.status === "atrasado").length,    value: mensalidades.filter((m) => m.status === "atrasado").reduce((a, m) => a + m.valor, 0), color: "#92400e", bg: "#fffbeb" },
                    { label: "Inadimplentes",count: mensalidades.filter((m) => m.status === "inadimplente").length,value: mensalidades.filter((m) => m.status === "inadimplente").reduce((a, m) => a + m.valor, 0), color: "#b91c1c", bg: "#fef2f2" },
                    { label: "MRR total",    count: clientesAtivos,                                                 value: mrr, color: "#7c3aed", bg: "#f5f3ff" },
                  ].map((k) => (
                    <div key={k.label} style={{ background: k.bg, borderTop: `3px solid ${k.color}`, borderRadius: 10, padding: "0.875rem 1rem", border: `1px solid ${k.color}22` }}>
                      <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</p>
                      <p style={{ margin: "0 0 1px", fontSize: "1.4rem", fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.count}</p>
                      <p style={{ margin: 0, fontSize: "0.75rem", fontWeight: 700, color: k.color }}>{fmt(k.value)}</p>
                    </div>
                  ))}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Cliente</TH><TH>Plano</TH><TH right>Valor</TH><TH>Vencimento</TH><TH>Forma</TH><TH>Status</TH><TH right>Cobrar via</TH><TH right>Ações</TH></tr></thead>
                  <tbody>
                    {mensalFiltrada.map((m) => (
                      <tr key={m.id} style={{ background: m.status === "inadimplente" ? "#fff5f5" : m.status === "atrasado" ? "#fffdf0" : "transparent" }}>
                        <TD><div><p style={{ margin: "0 0 1px", fontWeight: 700 }}>{m.cliente}</p><p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>{m.email}</p></div></TD>
                        <TD>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, borderRadius: 999, padding: "2px 8px", ...PLANO_COLOR[m.plano] }}>{PLANO_LABEL[m.plano]}</span>
                        </TD>
                        <TD right bold color="#7c3aed">{fmt(m.valor)}</TD>
                        <TD muted>{new Date(m.vencimento).toLocaleDateString("pt-BR")}</TD>
                        <TD muted><span style={{ fontSize: "0.82rem" }}>{FORMA_ICON[m.forma]} {m.forma}</span></TD>
                        <TD><Badge {...S_MENSAL[m.status]} /></TD>
                        <TD right>
                          <div style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
                            <button className="small-action" onClick={() => emitirCobranca(m.id, "boleto")} title="Boleto" type="button">🏦</button>
                            <button className="small-action" onClick={() => emitirCobranca(m.id, "pix")} title="PIX" type="button">⚡</button>
                            <button className="small-action" onClick={() => emitirCobranca(m.id, "cartao")} title="Cartão" type="button">💳</button>
                          </div>
                        </TD>
                        <TD right>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                            {m.status !== "em_dia" && (
                              <button className="small-action" onClick={() => marcarMensalidadePaga(m.id)} type="button">✓ Pago</button>
                            )}
                            {m.status === "inadimplente" && (
                              <button className="small-action" onClick={() => bloquearPortal(m.id)} title="Bloquear portal" type="button">🔒</button>
                            )}
                          </div>
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── A receber escritório ── */}
            {tabEsc === "receber_esc" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>A Receber — Escritório</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Total pendente: <strong style={{ color: "#065f46" }}>{fmt(receberEsc.filter((l) => l.status !== "pago").reduce((a, l) => a + l.valor, 0))}</strong></p></div>
                  <button type="button">+ Novo</button>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Descrição</TH><TH>Categoria</TH><TH>Vencimento</TH><TH right>Valor</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                  <tbody>
                    {receberEsc.map((l) => (
                      <tr key={l.id} style={{ background: l.status === "atrasado" ? "#fff8f8" : "transparent" }}>
                        <TD bold>{l.descricao}</TD>
                        <TD muted>{l.categoria}</TD>
                        <TD muted>{new Date(l.data).toLocaleDateString("pt-BR")}</TD>
                        <TD right bold color="#065f46">{fmt(l.valor)}</TD>
                        <TD><Badge {...S_STATUS[l.status]} /></TD>
                        <TD right>
                          {(l.status === "aberto" || l.status === "atrasado") && (
                            <button className="small-action" onClick={() => marcarRecebido(l.id, receberEsc, setReceberEsc)} type="button">✓ Receber</button>
                          )}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── A pagar escritório ── */}
            {tabEsc === "pagar_esc" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>A Pagar — Escritório</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Custos operacionais: <strong style={{ color: "#b91c1c" }}>{fmt(pagarEsc.filter((l) => l.status !== "pago").reduce((a, l) => a + l.valor, 0))}</strong></p></div>
                  <button type="button">+ Nova despesa</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { label: "Pessoal",       value: pagarEsc.filter((l) => l.categoria === "Pessoal").reduce((a, l) => a + l.valor, 0), color: "#7c3aed", bg: "#f5f3ff" },
                    { label: "Operacional",   value: pagarEsc.filter((l) => ["TI","Imóveis","Administrativo"].includes(l.categoria)).reduce((a, l) => a + l.valor, 0), color: "#0e7490", bg: "#ecfeff" },
                    { label: "Marketing",     value: pagarEsc.filter((l) => l.categoria === "Marketing").reduce((a, l) => a + l.valor, 0), color: "#92400e", bg: "#fffbeb" },
                  ].map((k) => (
                    <div key={k.label} style={{ background: k.bg, borderTop: `3px solid ${k.color}`, borderRadius: 10, padding: "0.875rem 1rem", border: `1px solid ${k.color}22` }}>
                      <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</p>
                      <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: k.color }}>{fmt(k.value)}</p>
                    </div>
                  ))}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Descrição</TH><TH>Categoria</TH><TH>Vencimento</TH><TH right>Valor</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                  <tbody>
                    {pagarEsc.map((l) => (
                      <tr key={l.id} style={{ background: l.status === "atrasado" ? "#fff8f8" : "transparent" }}>
                        <TD bold>{l.descricao}</TD>
                        <TD muted>{l.categoria}</TD>
                        <TD muted>{new Date(l.data).toLocaleDateString("pt-BR")}</TD>
                        <TD right bold color="#b91c1c">{fmt(l.valor)}</TD>
                        <TD><Badge {...S_STATUS[l.status]} /></TD>
                        <TD right>
                          {(l.status === "aberto" || l.status === "atrasado") && (
                            <button className="small-action" onClick={() => marcarPago(l.id, pagarEsc, setPagarEsc)} type="button">✓ Pagar</button>
                          )}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: "#f5f3ff", borderTop: "2px solid #c4b5fd" }}>
                      <td colSpan={3} style={{ padding: "0.8rem 0.875rem", fontWeight: 800, color: "#7c3aed" }}>Total custos</td>
                      <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 900, color: "#b91c1c", fontSize: "0.95rem" }}>{fmt(pagarEsc.reduce((a, l) => a + l.valor, 0))}</td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {/* ── Comissões ── */}
            {tabEsc === "comissoes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Comissões de Colaboradores</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Total pendente: <strong style={{ color: "#7c3aed" }}>{fmt(comissoes.filter((c) => c.status === "pendente").reduce((a, c) => a + c.valor, 0))}</strong></p></div>
                  <button type="button">+ Nova comissão</button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[...new Set(comissoes.map((c) => c.colaborador))].map((col) => {
                    const total = comissoes.filter((c) => c.colaborador === col).reduce((a, c) => a + c.valor, 0);
                    const pendente = comissoes.filter((c) => c.colaborador === col && c.status === "pendente").reduce((a, c) => a + c.valor, 0);
                    return (
                      <div key={col} style={{ background: "#f5f3ff", border: "1px solid #c4b5fd", borderRadius: 10, padding: "0.875rem 1rem" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 10, background: "#7c3aed", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.75rem", marginBottom: 8 }}>
                          {col.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <p style={{ margin: "0 0 2px", fontWeight: 800, fontSize: "0.875rem", color: "#07170d" }}>{col}</p>
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>Total: {fmt(total)} · Pend: {fmt(pendente)}</p>
                      </div>
                    );
                  })}
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Colaborador</TH><TH>Tipo</TH><TH>Período</TH><TH right>Valor</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                  <tbody>
                    {comissoes.map((c) => (
                      <tr key={c.id}>
                        <TD bold>{c.colaborador}</TD>
                        <TD muted>{c.tipo}</TD>
                        <TD muted>{c.mes}</TD>
                        <TD right bold color="#7c3aed">{fmt(c.valor)}</TD>
                        <TD>
                          <Badge {...(c.status === "pago" ? { bg: "#f0fdf4", color: "#065f46", label: "Pago" } : { bg: "#f5f3ff", color: "#7c3aed", label: "Pendente" })} />
                        </TD>
                        <TD right>
                          {c.status === "pendente" && (
                            <button className="small-action" onClick={() => pagarComissao(c.id)} type="button">✓ Pagar</button>
                          )}
                        </TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── Automações ── */}
            {tabEsc === "automacoes" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Automações Financeiras</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{automacoes.filter((a) => a.ativa).length} regras ativas · {automacoes.reduce((a, r) => a + r.execucoes, 0)} execuções totais</p></div>
                </div>

                {/* Fluxo visual das automações principais */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
                  {[
                    { gatilho: "SE vencer", acao: "→ Cobrar", desc: "Envio automático de cobrança por e-mail/WhatsApp no dia do vencimento", icone: "📅", cor: "#92400e", bg: "#fffbeb", borda: "#fbbf24" },
                    { gatilho: "SE receber", acao: "→ Atualizar status", desc: "Ao confirmar pagamento, marca como pago e atualiza saldo automaticamente", icone: "✅", cor: "#065f46", bg: "#f0fdf4", borda: "#34d399" },
                    { gatilho: "SE atraso", acao: "→ Bloquear portal", desc: "Após 30 dias de inadimplência, bloqueia o acesso ao portal do cliente", icone: "🔒", cor: "#b91c1c", bg: "#fef2f2", borda: "#fca5a5" },
                  ].map((fluxo) => (
                    <div key={fluxo.gatilho} style={{ background: fluxo.bg, border: `2px solid ${fluxo.borda}`, borderRadius: 14, padding: "1.25rem", position: "relative", overflow: "hidden" }}>
                      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: fluxo.borda }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                        <span style={{ fontSize: "1.5rem" }}>{fluxo.icone}</span>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 900, color: fluxo.cor }}>{fluxo.gatilho}</p>
                          <p style={{ margin: 0, fontSize: "1rem", fontWeight: 900, color: fluxo.cor }}>{fluxo.acao}</p>
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.78rem", color: "#6b7280", lineHeight: 1.5 }}>{fluxo.desc}</p>
                    </div>
                  ))}
                </div>

                {/* Lista completa de regras */}
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Regras de Automação</h2><p>Configure gatilhos e ações automáticas</p></div></div>
                  <div style={{ padding: "0.5rem 0 0.5rem" }}>
                    {automacoes.map((regra) => (
                      <div key={regra.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "0.875rem 1.25rem", borderBottom: "1px solid #f5f3ff", background: regra.ativa ? "transparent" : "#fafafa" }}>
                        <button
                          onClick={() => toggleAutomacao(regra.id)}
                          style={{
                            width: 44, height: 24, borderRadius: 12, border: "none", cursor: "pointer", position: "relative", transition: "background 0.2s",
                            background: regra.ativa ? "#7c3aed" : "#d1d5db",
                          }}
                          type="button"
                        >
                          <span style={{
                            position: "absolute", top: 3, width: 18, height: 18, borderRadius: 9, background: "#fff", transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                            left: regra.ativa ? 23 : 3,
                          }} />
                        </button>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 3px", fontSize: "0.85rem", fontWeight: 700, color: regra.ativa ? "#07170d" : "#9ca3af" }}>{regra.nome}</p>
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#ecfeff", color: "#0e7490", borderRadius: 999, padding: "1px 7px" }}>{regra.gatilho}</span>
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, background: "#f5f3ff", color: "#7c3aed", borderRadius: 999, padding: "1px 7px" }}>{regra.acao}</span>
                            <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#9ca3af" }}>{regra.modulo}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: "right", minWidth: 100 }}>
                          <p style={{ margin: "0 0 2px", fontSize: "0.78rem", fontWeight: 700, color: "#7c3aed" }}>{regra.execucoes} exec.</p>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{regra.ultimaExec ? new Date(regra.ultimaExec).toLocaleDateString("pt-BR") : "—"}</p>
                        </div>
                        <div style={{ display: "flex", gap: 4 }}>
                          {regra.ativa && (
                            <button className="small-action" onClick={() => executarAutomacao(regra.id)} title="Executar agora" type="button">▶</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Histórico de automações */}
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Histórico de Execuções</h2><p>Últimas ações executadas pelo sistema</p></div></div>
                  <div style={{ padding: "0.25rem 0 0.75rem" }}>
                    {log.filter((e) => e.usuario === "Sistema" || e.acao.startsWith("Automação")).slice(0, 8).map((entry) => (
                      <div key={entry.id} style={{ display: "flex", gap: 12, padding: "8px 1.25rem", borderBottom: "1px solid #f5f3ff", alignItems: "center" }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: entry.acao.includes("bloqueio") ? "#fef2f2" : entry.acao.includes("cobrança") ? "#fffbeb" : "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", flexShrink: 0 }}>
                          {entry.acao.includes("bloqueio") ? "🔒" : entry.acao.includes("cobrança") ? "📧" : entry.acao.includes("gerada") ? "📅" : "⚡"}
                        </div>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: "0 0 1px", fontSize: "0.82rem", fontWeight: 700, color: "#7c3aed" }}>{entry.acao}</p>
                          <p style={{ margin: 0, fontSize: "0.75rem", color: "#6b7280" }}>{entry.detalhe}</p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>{new Date(entry.data).toLocaleDateString("pt-BR")}</p>
                          <p style={{ margin: 0, fontSize: "0.65rem", color: "#d1d5db" }}>{new Date(entry.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Relatórios executivos ── */}
            {tabEsc === "rel_esc" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Relatórios Executivos</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Indicadores de gestão do escritório</p></div>

                {/* Resumo executivo em tempo real */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  {[
                    { label: "Margem operacional", value: mrr > 0 ? `${((margemMes / mrr) * 100).toFixed(1)}%` : "—", sub: `${fmt(margemMes)} / ${fmt(mrr)}`, color: "#065f46", bg: "#f0fdf4" },
                    { label: "Taxa inadimplência", value: clientesAtivos > 0 ? `${((inadimplentes / clientesAtivos) * 100).toFixed(1)}%` : "0%", sub: `${inadimplentes} de ${clientesAtivos} clientes`, color: inadimplentes > 0 ? "#b91c1c" : "#065f46", bg: inadimplentes > 0 ? "#fef2f2" : "#f0fdf4" },
                    { label: "Custo por cliente", value: clientesAtivos > 0 ? fmt(custosMes / clientesAtivos) : "—", sub: "Custo total / clientes ativos", color: "#0e7490", bg: "#ecfeff" },
                  ].map((ind) => (
                    <div key={ind.label} style={{ background: ind.bg, border: `1px solid ${ind.color}22`, borderTop: `3px solid ${ind.color}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{ind.label}</p>
                      <p style={{ margin: "0 0 2px", fontSize: "1.4rem", fontWeight: 900, color: ind.color }}>{ind.value}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{ind.sub}</p>
                    </div>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                  {[
                    { icon: "📊", label: "DRE Escritório",     desc: "Resultado mensal do escritório" },
                    { icon: "💹", label: "Evolução MRR",       desc: "Crescimento da receita recorrente" },
                    { icon: "📅", label: "Inadimplência",      desc: "Análise de clientes inadimplentes" },
                    { icon: "💰", label: "Comissões",          desc: "Relatório de comissões por colaborador" },
                    { icon: "📈", label: "Análise anual",      desc: "Consolidado do exercício do escritório" },
                    { icon: "🎯", label: "Metas vs Realizado", desc: "KPIs versus objetivos do período" },
                  ].map((r) => (
                    <button
                      key={r.label}
                      onClick={() => audit(`Relatório: ${r.label}`, "Relatórios Esc.", "Gerado")}
                      style={{ background: "#fff", border: "1px solid #c4b5fd", borderRadius: 12, padding: "1.25rem", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
                      type="button"
                    >
                      <span style={{ fontSize: "1.5rem" }}>{r.icon}</span>
                      <strong style={{ fontSize: "0.9rem", color: "#7c3aed" }}>{r.label}</strong>
                      <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{r.desc}</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#7c3aed", background: "#f5f3ff", borderRadius: 999, padding: "2px 8px" }}>📄 PDF</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#065f46", background: "#f0fdf4", borderRadius: 999, padding: "2px 8px" }}>📊 Excel</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Log de automações */}
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Automações recentes</h2><p>Ações executadas pelo sistema</p></div></div>
                  <div style={{ padding: "0.25rem 0 0.75rem" }}>
                    {log.filter((e) => e.usuario === "Sistema").slice(0, 5).map((entry) => (
                      <div key={entry.id} style={{ display: "flex", gap: 10, padding: "8px 1rem", borderBottom: "1px solid #f5f3ff", alignItems: "flex-start" }}>
                        <span style={{ fontSize: "0.9rem", marginTop: 1 }}>⚡</span>
                        <div>
                          <p style={{ margin: "0 0 1px", fontSize: "0.8rem", fontWeight: 700, color: "#7c3aed" }}>{entry.acao}</p>
                          <p style={{ margin: "0 0 1px", fontSize: "0.75rem", color: "#374151" }}>{entry.detalhe}</p>
                          <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{new Date(entry.data).toLocaleString("pt-BR")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

          </div>
        </>
      )}

    </SetorShell>
  );
}
