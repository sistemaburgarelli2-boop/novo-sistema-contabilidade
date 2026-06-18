"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type TipoProcesso =
  | "abertura" | "alteracao" | "baixa"
  | "mudanca_cnae" | "mudanca_endereco" | "contrato_social";

type StatusKanban =
  | "solicitado" | "documentacao" | "preparacao"
  | "protocolo" | "em_analise" | "concluido" | "cancelado";

type StatusCert =
  | "valida" | "vencendo_30" | "vencendo_15" | "vencendo_7"
  | "vencida" | "pendente" | "solicitada";

type StatusProtocolo = "criado" | "protocolado" | "analisando" | "concluido" | "devolvido";

type StatusAlvara = "valido" | "vencendo" | "vencido" | "em_processo" | "pendente";

type Processo = {
  id: string; empresa: string; tipo: TipoProcesso; protocolo: string;
  responsavel: string; prazo: string; status: StatusKanban;
  criadoEm: string; obs: string;
};

type Certificado = {
  id: string; empresa: string; tipo: string; validade: string; status: StatusCert;
};

type Protocolo = {
  id: string; numero: string; orgao: string; tipo: string;
  status: StatusProtocolo; atualizacao: string; processoId: string;
  historico: { data: string; evento: string; status: StatusProtocolo }[];
};

type Alvara = {
  id: string; empresa: string; tipo: string; numero: string;
  emissao: string; validade: string; status: StatusAlvara; orgao: string;
};

type Documento = {
  id: string; nome: string; tipo: string; processoId: string;
  upload: string; tamanho: string; status: "ok" | "pendente" | "revisao";
};

type LogSoc = {
  id: string; data: string; usuario: string;
  acao: string; modulo: string; detalhe: string;
};

type Tab =
  | "dashboard" | "processos" | "constituicao" | "alteracoes"
  | "encerramento" | "alvaras" | "certificados" | "protocolos"
  | "documentos" | "historico";

/* ─── Ícone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

/* ─── Mock data ───────────────────────────────────────────────── */

const PROCESSOS_INIT: Processo[] = [
  { id: "1", empresa: "Alfa Comércio Ltda", tipo: "abertura", protocolo: "JC-2026-00451", responsavel: "Ana Lima", prazo: "2026-07-15", status: "protocolo", criadoEm: "2026-06-01", obs: "Aguardando JUCSP" },
  { id: "2", empresa: "Beta Serviços ME", tipo: "alteracao", protocolo: "JC-2026-00380", responsavel: "Carlos Souza", prazo: "2026-07-01", status: "em_analise", criadoEm: "2026-05-20", obs: "Alteração de sócio" },
  { id: "3", empresa: "Gama Tech Eireli", tipo: "mudanca_cnae", protocolo: "—", responsavel: "Ana Lima", prazo: "2026-07-20", status: "documentacao", criadoEm: "2026-06-10", obs: "Incluir CNAE 6201-5/00" },
  { id: "4", empresa: "Delta Holding S/A", tipo: "contrato_social", protocolo: "JC-2026-00301", responsavel: "João Pereira", prazo: "2026-06-30", status: "concluido", criadoEm: "2026-05-01", obs: "Atualização capital social" },
  { id: "5", empresa: "Épsilon Ltda", tipo: "abertura", protocolo: "—", responsavel: "Maria Costa", prazo: "2026-08-01", status: "solicitado", criadoEm: "2026-06-18", obs: "Cliente novo" },
  { id: "6", empresa: "Zeta Construções", tipo: "baixa", protocolo: "JC-2026-00290", responsavel: "Carlos Souza", prazo: "2026-07-10", status: "preparacao", criadoEm: "2026-05-15", obs: "Encerramento voluntário" },
];

const CERTIFICADOS_INIT: Certificado[] = [
  { id: "1", empresa: "Alfa Comércio Ltda",  tipo: "CND Federal (Receita + PGFN)", validade: "2026-08-10", status: "valida" },
  { id: "2", empresa: "Alfa Comércio Ltda",  tipo: "CND Estadual (SEFAZ)",          validade: "2026-07-30", status: "vencendo_30" },
  { id: "3", empresa: "Alfa Comércio Ltda",  tipo: "CND Municipal",                 validade: "—",          status: "pendente" },
  { id: "4", empresa: "Beta Serviços ME",    tipo: "CRF — FGTS",                    validade: "2026-06-25", status: "vencendo_7" },
  { id: "5", empresa: "Beta Serviços ME",    tipo: "CNDT — Trabalhista",            validade: "2026-09-20", status: "valida" },
  { id: "6", empresa: "Gama Tech Eireli",    tipo: "CND Federal (Receita + PGFN)", validade: "2026-07-05", status: "vencendo_15" },
  { id: "7", empresa: "Delta Holding S/A",   tipo: "CND Federal (Receita + PGFN)", validade: "2026-05-01", status: "vencida" },
  { id: "8", empresa: "Delta Holding S/A",   tipo: "CNDT — Trabalhista",            validade: "2026-10-15", status: "solicitada" },
];

const PROTOCOLOS_INIT: Protocolo[] = [
  {
    id: "1", numero: "JC-2026-00451", orgao: "JUCSP", tipo: "Abertura Ltda",
    status: "analisando", atualizacao: "2026-06-17", processoId: "1",
    historico: [
      { data: "2026-06-01", evento: "Processo criado", status: "criado" },
      { data: "2026-06-05", evento: "Documentação entregue", status: "protocolado" },
      { data: "2026-06-10", evento: "Protocolo registrado — JC-2026-00451", status: "protocolado" },
      { data: "2026-06-17", evento: "Em análise na JUCSP", status: "analisando" },
    ],
  },
  {
    id: "2", numero: "JC-2026-00380", orgao: "JUCSP", tipo: "Alteração Contratual",
    status: "concluido", atualizacao: "2026-06-12", processoId: "2",
    historico: [
      { data: "2026-05-20", evento: "Processo criado", status: "criado" },
      { data: "2026-05-25", evento: "Protocolado na JUCSP", status: "protocolado" },
      { data: "2026-06-05", evento: "Em análise", status: "analisando" },
      { data: "2026-06-12", evento: "Aprovado e arquivado", status: "concluido" },
    ],
  },
  {
    id: "3", numero: "RF-2026-01130", orgao: "Receita Federal", tipo: "Alteração CNPJ",
    status: "protocolado", atualizacao: "2026-06-14", processoId: "4",
    historico: [
      { data: "2026-06-10", evento: "DBE gerado", status: "criado" },
      { data: "2026-06-14", evento: "Transmitido à Receita Federal", status: "protocolado" },
    ],
  },
];

const ALVARAS_INIT: Alvara[] = [
  { id: "1", empresa: "Alfa Comércio Ltda",  tipo: "Alvará de Funcionamento",     numero: "ALV-2025-4521", emissao: "2025-07-01", validade: "2026-07-01", status: "vencendo", orgao: "Prefeitura SP" },
  { id: "2", empresa: "Beta Serviços ME",    tipo: "Alvará de Funcionamento",     numero: "ALV-2025-3310", emissao: "2025-08-15", validade: "2026-08-15", status: "valido",   orgao: "Prefeitura SP" },
  { id: "3", empresa: "Gama Tech Eireli",    tipo: "Licença Sanitária",           numero: "—",             emissao: "—",          validade: "—",          status: "em_processo", orgao: "Vigilância Sanitária" },
  { id: "4", empresa: "Delta Holding S/A",   tipo: "Alvará de Funcionamento",     numero: "ALV-2025-2200", emissao: "2025-06-01", validade: "2026-06-01", status: "vencido", orgao: "Prefeitura SP" },
  { id: "5", empresa: "Épsilon Ltda",        tipo: "Alvará de Funcionamento",     numero: "—",             emissao: "—",          validade: "—",          status: "pendente", orgao: "Prefeitura SP" },
];

const DOCS_INIT: Documento[] = [
  { id: "1", nome: "Contrato Social — Alfa Comércio.pdf",      tipo: "Contrato Social",     processoId: "1", upload: "2026-06-05", tamanho: "245 KB", status: "ok" },
  { id: "2", nome: "RG Sócios — Alfa.pdf",                     tipo: "Documentos Pessoais", processoId: "1", upload: "2026-06-05", tamanho: "1.2 MB", status: "ok" },
  { id: "3", nome: "Viabilidade JUCSP.pdf",                    tipo: "Viabilidade",         processoId: "1", upload: "2026-06-06", tamanho: "80 KB",  status: "ok" },
  { id: "4", nome: "IPTU / Contrato Imóvel — Alfa.pdf",        tipo: "Comprovante Endereço",processoId: "1", upload: "—",         tamanho: "—",      status: "pendente" },
  { id: "5", nome: "Alteração Contratual — Beta.pdf",          tipo: "Contrato Social",     processoId: "2", upload: "2026-05-22", tamanho: "310 KB", status: "ok" },
  { id: "6", nome: "Distrato Sócio — Beta Serviços.pdf",       tipo: "Distrato",            processoId: "2", upload: "2026-05-22", tamanho: "175 KB", status: "revisao" },
];

const LOG_INIT: LogSoc[] = [
  { id: "1", data: "2026-06-18T15:00:00", usuario: "Ana Lima",    acao: "Processo criado",          modulo: "Processos",   detalhe: "Abertura — Épsilon Ltda" },
  { id: "2", data: "2026-06-17T11:30:00", usuario: "Sistema",     acao: "Alerta de vencimento",     modulo: "Certificados",detalhe: "CRF Beta Serviços — vence em 7 dias" },
  { id: "3", data: "2026-06-17T10:00:00", usuario: "Carlos Souza",acao: "Status atualizado",        modulo: "Protocolos",  detalhe: "JC-2026-00451: protocolado → analisando" },
  { id: "4", data: "2026-06-15T09:00:00", usuario: "João Pereira",acao: "Processo concluído",       modulo: "Processos",   detalhe: "Contrato Social — Delta Holding" },
  { id: "5", data: "2026-06-12T16:00:00", usuario: "Sistema",     acao: "Protocolo concluído",      modulo: "Protocolos",  detalhe: "JC-2026-00380 aprovado na JUCSP" },
];

/* ─── Configurações ───────────────────────────────────────────── */

const TIPO_LABEL: Record<TipoProcesso, string> = {
  abertura: "Abertura", alteracao: "Alteração", baixa: "Baixa",
  mudanca_cnae: "Mudança CNAE", mudanca_endereco: "Mudança Endereço",
  contrato_social: "Contrato Social",
};

const KANBAN_COLS: { id: StatusKanban; label: string; cor: string; bg: string }[] = [
  { id: "solicitado",   label: "Solicitado",   cor: "#6b7280", bg: "#f3f4f6" },
  { id: "documentacao", label: "Documentação", cor: "#1d4ed8", bg: "#eff6ff" },
  { id: "preparacao",   label: "Preparação",   cor: "#7c3aed", bg: "#f5f3ff" },
  { id: "protocolo",    label: "Protocolo",    cor: "#92400e", bg: "#fffbeb" },
  { id: "em_analise",   label: "Em análise",   cor: "#0e7490", bg: "#ecfeff" },
  { id: "concluido",    label: "Concluído",    cor: "#065f46", bg: "#f0fdf4" },
];

const S_KANBAN: Record<StatusKanban, { bg: string; color: string; label: string }> = {
  solicitado:   { bg: "#f3f4f6", color: "#6b7280", label: "Solicitado" },
  documentacao: { bg: "#eff6ff", color: "#1d4ed8", label: "Documentação" },
  preparacao:   { bg: "#f5f3ff", color: "#7c3aed", label: "Preparação" },
  protocolo:    { bg: "#fffbeb", color: "#92400e", label: "Protocolo" },
  em_analise:   { bg: "#ecfeff", color: "#0e7490", label: "Em análise" },
  concluido:    { bg: "#f0fdf4", color: "#065f46", label: "Concluído" },
  cancelado:    { bg: "#fef2f2", color: "#b91c1c", label: "Cancelado" },
};

const S_CERT: Record<StatusCert, { bg: string; color: string; label: string; icon: string }> = {
  valida:       { bg: "#f0fdf4", color: "#065f46", label: "Válida",      icon: "✓" },
  vencendo_30:  { bg: "#fffbeb", color: "#92400e", label: "Vence em 30d",icon: "⚠" },
  vencendo_15:  { bg: "#fff7ed", color: "#c2410c", label: "Vence em 15d",icon: "⚠" },
  vencendo_7:   { bg: "#fef2f2", color: "#b91c1c", label: "Vence em 7d", icon: "🔴" },
  vencida:      { bg: "#fef2f2", color: "#b91c1c", label: "Vencida",     icon: "✗" },
  pendente:     { bg: "#f3f4f6", color: "#6b7280", label: "Pendente",    icon: "○" },
  solicitada:   { bg: "#eff6ff", color: "#1d4ed8", label: "Solicitada",  icon: "↻" },
};

const S_PROT: Record<StatusProtocolo, { bg: string; color: string; label: string }> = {
  criado:      { bg: "#f3f4f6", color: "#6b7280", label: "Criado" },
  protocolado: { bg: "#eff6ff", color: "#1d4ed8", label: "Protocolado" },
  analisando:  { bg: "#fffbeb", color: "#92400e", label: "Analisando" },
  concluido:   { bg: "#f0fdf4", color: "#065f46", label: "Concluído" },
  devolvido:   { bg: "#fef2f2", color: "#b91c1c", label: "Devolvido" },
};

const S_ALVARA: Record<StatusAlvara, { bg: string; color: string; label: string }> = {
  valido:      { bg: "#f0fdf4", color: "#065f46", label: "Válido" },
  vencendo:    { bg: "#fffbeb", color: "#92400e", label: "Vencendo" },
  vencido:     { bg: "#fef2f2", color: "#b91c1c", label: "Vencido" },
  em_processo: { bg: "#eff6ff", color: "#1d4ed8", label: "Em processo" },
  pendente:    { bg: "#f3f4f6", color: "#6b7280", label: "Pendente" },
};

const TABS_SOC = [
  { id: "dashboard",    label: "Dashboard",    icon: "◉" },
  { id: "processos",    label: "Processos",    icon: "📋" },
  { id: "constituicao", label: "Constituição", icon: "🏢" },
  { id: "alteracoes",   label: "Alterações",   icon: "✏" },
  { id: "encerramento", label: "Encerramento", icon: "🔒" },
  { id: "alvaras",      label: "Alvarás",      icon: "📜" },
  { id: "certificados", label: "Certificados", icon: "🏅" },
  { id: "protocolos",   label: "Protocolos",   icon: "⇄" },
  { id: "documentos",   label: "Documentos",   icon: "📁" },
  { id: "historico",    label: "Histórico",    icon: "⌛" },
] as const;

const TIPO_ICONE: Record<TipoProcesso, string> = {
  abertura: "🏢", alteracao: "✏", baixa: "🔒",
  mudanca_cnae: "🔄", mudanca_endereco: "📍", contrato_social: "📄",
};

/* ─── Helpers ─────────────────────────────────────────────────── */

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ display: "inline-block", background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function TH({ children, right, center }: { children: React.ReactNode; right?: boolean; center?: boolean }) {
  return <th style={{ textAlign: right ? "right" : center ? "center" : "left", padding: "0.7rem 0.875rem", color: "#6b5a3e", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #fde68a", background: "#fffbeb" }}>{children}</th>;
}

function TD({ children, right, muted, bold, color }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean; color?: string }) {
  return <td style={{ padding: "0.75rem 0.875rem", textAlign: right ? "right" : "left", color: color ?? (muted ? "#9ca3af" : "#07170d"), fontSize: "0.85rem", borderBottom: "1px solid #fef9ec", fontWeight: bold ? 700 : 400 }}>{children}</td>;
}

function diasParaVencer(validade: string): number {
  if (validade === "—") return 999;
  const diff = new Date(validade).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

/* ─── Componente principal ────────────────────────────────────── */

export default function SocietarioPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [tab, setTab] = useState<Tab>("dashboard");
  const [processos, setProcessos] = useState<Processo[]>(PROCESSOS_INIT);
  const [certificados, setCertificados] = useState<Certificado[]>(CERTIFICADOS_INIT);
  const [protocolos, setProtocolos] = useState<Protocolo[]>(PROTOCOLOS_INIT);
  const [alvaras] = useState<Alvara[]>(ALVARAS_INIT);
  const [docs] = useState<Documento[]>(DOCS_INIT);
  const [log, setLog] = useState<LogSoc[]>(LOG_INIT);

  /* Wizard Constituição */
  const [constStep, setConstStep] = useState(1);
  const [constNome, setConstNome] = useState("");
  const [constCnae, setConstCnae] = useState("");
  const [constTipo, setConstTipo] = useState("Sociedade Limitada (Ltda)");
  const [constSocios, setConstSocios] = useState([{ nome: "", cpf: "", quota: "" }]);
  const [constCapital, setConstCapital] = useState("");
  const [constRegime, setConstRegime] = useState("Simples Nacional");
  const [constCheck, setConstCheck] = useState([
    { id: "1", label: "Contrato Social redigido",       feito: false },
    { id: "2", label: "Documentos pessoais coletados",  feito: false },
    { id: "3", label: "Viabilidade aprovada na Junta",  feito: false },
    { id: "4", label: "DBE transmitido (CNPJ)",         feito: false },
    { id: "5", label: "Inscrição Estadual solicitada",  feito: false },
    { id: "6", label: "Inscrição Municipal / Alvará",   feito: false },
  ]);
  const [constFinalizado, setConstFinalizado] = useState(false);

  /* Wizard Encerramento */
  const [encerrStep, setEncerrStep] = useState(1);
  const [encerrEmp, setEncerrEmp] = useState("");
  const [encerrCheck, setEncerrCheck] = useState([
    { id: "1", label: "Guias e obrigações quitadas",      feito: false },
    { id: "2", label: "Funcionários desligados (eSocial)", feito: false },
    { id: "3", label: "Declaração de extinção transmitida",feito: false },
    { id: "4", label: "Distrato social registrado",        feito: false },
    { id: "5", label: "Baixas municipais/estaduais",       feito: false },
    { id: "6", label: "Certificado de baixa emitido",      feito: false },
  ]);

  /* Alterações */
  const [altEmp, setAltEmp] = useState("");
  const [altTipo, setAltTipo] = useState("Alteração de sócio");
  const [altObs, setAltObs] = useState("");

  /* Protocolos — selecionado para linha do tempo */
  const [protocSelecionado, setProtocSelecionado] = useState<string | null>("1");

  /* Filtro processos */
  const [filtroTipo, setFiltroTipo] = useState<TipoProcesso | "">("");
  const [filtroStatus, setFiltroStatus] = useState<StatusKanban | "">("");

  /* ── Auditoria ── */
  function audit(acao: string, modulo: string, detalhe: string) {
    setLog((prev) => [{
      id: crypto.randomUUID(), data: new Date().toISOString(),
      usuario: "Usuário Atual", acao, modulo, detalhe,
    }, ...prev]);
  }

  /* ── Helpers processos ── */
  function moverProcesso(id: string, novoStatus: StatusKanban) {
    setProcessos((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      audit("Status atualizado", "Processos", `${p.empresa}: ${S_KANBAN[p.status].label} → ${S_KANBAN[novoStatus].label}`);
      return { ...p, status: novoStatus };
    }));
  }

  function novoProcesso(tipo: TipoProcesso, empresa: string) {
    const p: Processo = {
      id: crypto.randomUUID(), empresa, tipo, protocolo: "—",
      responsavel: "Usuário Atual", prazo: "", status: "solicitado",
      criadoEm: new Date().toISOString().slice(0, 10), obs: "",
    };
    setProcessos((prev) => [p, ...prev]);
    audit("Processo criado", "Processos", `${TIPO_LABEL[tipo]} — ${empresa}`);
    /* automação: se abertura, criar estrutura */
    if (tipo === "abertura") {
      audit("Automação executada", "Processos", `Estrutura completa criada para ${empresa}`);
    }
  }

  /* ── Renovar certificado ── */
  function renovarCert(id: string) {
    setCertificados((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      audit("Renovação solicitada", "Certificados", `${c.tipo} — ${c.empresa}`);
      return { ...c, status: "solicitada" };
    }));
  }

  /* ── Avançar protocolo ── */
  function avancarProtocolo(id: string) {
    const ordem: StatusProtocolo[] = ["criado", "protocolado", "analisando", "concluido"];
    setProtocolos((prev) => prev.map((p) => {
      if (p.id !== id) return p;
      const idx = ordem.indexOf(p.status);
      if (idx >= ordem.length - 1) return p;
      const novoStatus = ordem[idx + 1];
      const novoHist = [
        ...p.historico,
        { data: new Date().toISOString().slice(0, 10), evento: `Status atualizado para: ${S_PROT[novoStatus].label}`, status: novoStatus },
      ];
      audit("Status atualizado", "Protocolos", `${p.numero}: ${S_PROT[p.status].label} → ${S_PROT[novoStatus].label}`);
      /* automação: notificar equipe */
      audit("Automação executada", "Protocolos", `Equipe notificada — ${p.numero} agora em "${S_PROT[novoStatus].label}"`);
      return { ...p, status: novoStatus, atualizacao: new Date().toISOString().slice(0, 10), historico: novoHist };
    }));
  }

  /* ── Finalizar constituição ── */
  function finalizarConst() {
    novoProcesso("abertura", constNome || "Nova Empresa");
    setConstFinalizado(true);
    audit("Constituição iniciada", "Constituição", `${constNome} — ${constTipo} — ${constRegime}`);
  }

  /* ── Estatísticas ── */
  const processosAtivos = processos.filter((p) => p.status !== "concluido" && p.status !== "cancelado").length;
  const protocolosPendentes = protocolos.filter((p) => p.status !== "concluido" && p.status !== "devolvido").length;
  const aguardandoCliente = processos.filter((p) => p.status === "documentacao").length;
  const concluidos = processos.filter((p) => p.status === "concluido").length;
  const alertasCert = certificados.filter((c) => ["vencendo_7", "vencendo_15", "vencendo_30", "vencida"].includes(c.status)).length;
  const processosFiltrados = processos.filter((p) =>
    (filtroTipo === "" || p.tipo === filtroTipo) &&
    (filtroStatus === "" || p.status === filtroStatus)
  );
  const protSelecionado = protocolos.find((p) => p.id === protocSelecionado) ?? null;

  /* ─── Render ─── */
  return (
    <SetorShell
      borda="#fcd34d"
      cor="#92400e"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#fffbeb"
      icone={ICONE}
      setorNome="Setor Societário"
      setorResumo="Processos paralegal: constituição, alterações, encerramento, alvarás e certidões"
      stats={[
        { label: "Processos ativos",  value: String(processosAtivos),     cor: "#fcd34d" },
        { label: "Protocolos pend.",  value: String(protocolosPendentes), cor: protocolosPendentes > 0 ? "#fbbf24" : "#34d399" },
        { label: "Alertas cert.",     value: String(alertasCert),         cor: alertasCert > 0 ? "#fca5a5" : "#34d399" },
        { label: "Concluídos",        value: String(concluidos),          cor: "#34d399" },
      ]}
    >
      {/* ── Tabs ── */}
      <div style={{ background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #fde68a", borderBottom: "none" }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 6px" }}>
          {TABS_SOC.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                borderBottom: tab === t.id ? "2px solid #92400e" : "2px solid transparent",
                color: tab === t.id ? "#92400e" : "#9ca3af",
                fontWeight: tab === t.id ? 800 : 500,
                fontSize: "0.8rem", padding: "0.85rem 0.875rem",
                whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "0.35rem",
                marginBottom: -2, transition: "color 0.15s",
              }}
              type="button"
            >
              <span style={{ fontSize: "0.72rem", opacity: 0.7 }}>{t.icon}</span>
              {t.label}
              {t.id === "certificados" && alertasCert > 0 && (
                <span style={{ background: "#fca5a5", color: "#b91c1c", borderRadius: 999, fontSize: "0.62rem", fontWeight: 900, padding: "1px 6px", marginLeft: 2 }}>{alertasCert}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #fde68a", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

        {/* ════════════════════════════════════
            DASHBOARD
        ════════════════════════════════════ */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: "1.5rem" }}>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 10 }}>
              {[
                { label: "Processos ativos",    value: processosAtivos,     color: "#92400e", bg: "#fffbeb" },
                { label: "Protocolos pendentes",value: protocolosPendentes, color: "#1d4ed8", bg: "#eff6ff" },
                { label: "Aguardando cliente",  value: aguardandoCliente,   color: "#7c3aed", bg: "#f5f3ff" },
                { label: "Concluídos (mês)",    value: concluidos,          color: "#065f46", bg: "#f0fdf4" },
                { label: "Alertas certidões",   value: alertasCert,         color: alertasCert > 0 ? "#b91c1c" : "#065f46", bg: alertasCert > 0 ? "#fef2f2" : "#f0fdf4" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "0.875rem 1rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Kanban */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.875rem" }}>
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#07170d" }}>Kanban — Processos em andamento</h2>
                <button onClick={() => setTab("constituicao")} type="button">+ Novo processo</button>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10, overflowX: "auto" }}>
                {KANBAN_COLS.map((col) => {
                  const itens = processos.filter((p) => p.status === col.id);
                  return (
                    <div key={col.id} style={{ background: col.bg, border: `1px solid ${col.cor}22`, borderTop: `3px solid ${col.cor}`, borderRadius: 10, padding: "0.75rem 0.625rem", minHeight: 200 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 800, color: col.cor, textTransform: "uppercase", letterSpacing: "0.5px" }}>{col.label}</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: col.cor, background: `${col.cor}20`, borderRadius: 999, padding: "1px 7px" }}>{itens.length}</span>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {itens.map((p) => (
                          <div
                            key={p.id}
                            style={{ background: "#fff", borderRadius: 8, padding: "9px 10px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6", cursor: "pointer" }}
                            onClick={() => setTab("processos")}
                          >
                            <p style={{ margin: "0 0 3px", fontSize: "0.78rem", fontWeight: 700, color: "#07170d", lineHeight: 1.3 }}>{p.empresa}</p>
                            <p style={{ margin: "0 0 5px", fontSize: "0.7rem", color: "#9ca3af" }}>{TIPO_ICONE[p.tipo]} {TIPO_LABEL[p.tipo]}</p>
                            {p.prazo && p.prazo !== "" && (
                              <p style={{ margin: 0, fontSize: "0.68rem", color: new Date(p.prazo) < new Date() ? "#b91c1c" : "#6b7280" }}>
                                ⏰ {new Date(p.prazo).toLocaleDateString("pt-BR")}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Alertas rápidos */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div className="list-panel">
                <div className="list-panel-header"><div><h2>Certificados com alerta</h2><p>Vencimentos críticos</p></div><button className="small-action" onClick={() => setTab("certificados")} type="button">Ver todos</button></div>
                <div style={{ padding: "0.25rem 0 0.75rem" }}>
                  {certificados.filter((c) => ["vencendo_7","vencendo_15","vencendo_30","vencida"].includes(c.status)).slice(0, 4).map((c) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 1rem", borderBottom: "1px solid #fef9ec" }}>
                      <div>
                        <p style={{ margin: "0 0 2px", fontSize: "0.8rem", fontWeight: 700, color: "#07170d" }}>{c.tipo}</p>
                        <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{c.empresa}</p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3 }}>
                        <Badge {...S_CERT[c.status]} />
                        {c.validade !== "—" && (
                          <span style={{ fontSize: "0.68rem", color: diasParaVencer(c.validade) <= 7 ? "#b91c1c" : "#9ca3af" }}>
                            {diasParaVencer(c.validade) > 0 ? `${diasParaVencer(c.validade)}d` : "Vencido"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {certificados.filter((c) => ["vencendo_7","vencendo_15","vencendo_30","vencida"].includes(c.status)).length === 0 && (
                    <p style={{ padding: "1rem", fontSize: "0.82rem", color: "#9ca3af", textAlign: "center" }}>Nenhum alerta no momento ✓</p>
                  )}
                </div>
              </div>

              <div className="list-panel">
                <div className="list-panel-header"><div><h2>Últimos eventos</h2></div></div>
                <div style={{ padding: "0.25rem 0 0.75rem" }}>
                  {log.slice(0, 5).map((entry) => (
                    <div key={entry.id} style={{ padding: "7px 1rem", borderBottom: "1px solid #fef9ec" }}>
                      <p style={{ margin: "0 0 1px", fontSize: "0.8rem", fontWeight: 700, color: "#07170d" }}>{entry.acao}</p>
                      <p style={{ margin: "0 0 1px", fontSize: "0.75rem", color: "#6b7280" }}>{entry.detalhe}</p>
                      <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{new Date(entry.data).toLocaleString("pt-BR")} · {entry.usuario}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            PROCESSOS
        ════════════════════════════════════ */}
        {tab === "processos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Todos os Processos</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{processosFiltrados.length} processo(s) listados</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="input" onChange={(e) => setFiltroTipo(e.target.value as TipoProcesso | "")} value={filtroTipo}>
                  <option value="">Todos os tipos</option>
                  {(Object.keys(TIPO_LABEL) as TipoProcesso[]).map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
                <select className="input" onChange={(e) => setFiltroStatus(e.target.value as StatusKanban | "")} value={filtroStatus}>
                  <option value="">Todos os status</option>
                  {KANBAN_COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <button onClick={() => setTab("constituicao")} type="button">+ Nova abertura</button>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr>
                <TH>Empresa</TH><TH>Tipo</TH><TH>Protocolo</TH>
                <TH>Responsável</TH><TH>Prazo</TH><TH>Status</TH><TH right>Mover</TH>
              </tr></thead>
              <tbody>
                {processosFiltrados.map((p) => {
                  const vencido = p.prazo && new Date(p.prazo) < new Date() && p.status !== "concluido";
                  return (
                    <tr key={p.id}>
                      <TD><div><p style={{ margin: 0, fontWeight: 700 }}>{p.empresa}</p><p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{p.obs}</p></div></TD>
                      <TD>
                        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.82rem" }}>
                          <span>{TIPO_ICONE[p.tipo]}</span>
                          <span>{TIPO_LABEL[p.tipo]}</span>
                        </span>
                      </TD>
                      <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.protocolo}</span></TD>
                      <TD muted>{p.responsavel}</TD>
                      <TD>
                        {p.prazo ? (
                          <span style={{ fontWeight: 600, color: vencido ? "#b91c1c" : "#374151", fontSize: "0.82rem" }}>
                            {vencido && "⚠ "}{new Date(p.prazo).toLocaleDateString("pt-BR")}
                          </span>
                        ) : <span style={{ color: "#9ca3af" }}>—</span>}
                      </TD>
                      <TD><Badge {...S_KANBAN[p.status]} /></TD>
                      <TD right>
                        <select
                          className="input"
                          disabled={p.status === "concluido" || p.status === "cancelado"}
                          onChange={(e) => moverProcesso(p.id, e.target.value as StatusKanban)}
                          style={{ fontSize: "0.73rem", padding: "3px 6px", minWidth: 120, opacity: (p.status === "concluido" || p.status === "cancelado") ? 0.5 : 1 }}
                          value={p.status}
                        >
                          {KANBAN_COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                          <option value="cancelado">Cancelado</option>
                        </select>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════
            CONSTITUIÇÃO — WIZARD
        ════════════════════════════════════ */}
        {tab === "constituicao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Wizard — Abertura de Empresa</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Siga as 6 etapas para constituição completa</p></div>

            {/* Stepper */}
            <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
              {["Dados", "Sócios", "Capital", "Regime", "Checklist", "Finalizar"].map((etapa, i) => {
                const ok = i + 1 < constStep;
                const ativo = i + 1 === constStep;
                return (
                  <div key={etapa} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => setConstStep(i + 1)}
                      style={{ flex: 1, textAlign: "center", padding: "0 4px", background: "none", border: "none", cursor: "pointer" }}
                      type="button"
                    >
                      <div style={{ width: 38, height: 38, borderRadius: "50%", margin: "0 auto 5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: ok ? "0.85rem" : "0.9rem", fontWeight: 800, background: ok ? "#92400e" : ativo ? "#fffbeb" : "#f3f4f6", color: ok ? "#fff" : ativo ? "#92400e" : "#9ca3af", border: `2px solid ${ok || ativo ? "#92400e" : "#e5e7eb"}` }}>
                        {ok ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: "0.68rem", fontWeight: ativo ? 800 : 400, color: ativo ? "#92400e" : ok ? "#065f46" : "#9ca3af" }}>{etapa}</span>
                    </button>
                    {i < 5 && <div style={{ height: 2, width: 20, flex: "0 0 20px", background: ok ? "#92400e" : "#e5e7eb" }} />}
                  </div>
                );
              })}
            </div>

            {/* Etapa 1 — Dados */}
            {constStep === 1 && !constFinalizado && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.5rem" }}>
                <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Etapa 1 — Dados da empresa</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                    Nome empresarial *
                    <input className="input" onChange={(e) => setConstNome(e.target.value)} placeholder="Ex: Alfa Comércio Ltda" value={constNome} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                    Tipo societário *
                    <select className="input" onChange={(e) => setConstTipo(e.target.value)} value={constTipo}>
                      {["Sociedade Limitada (Ltda)","Empresário Individual (EI)","EIRELI","Sociedade Anônima (S/A)","MEI"].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                    CNAE principal *
                    <input className="input" onChange={(e) => setConstCnae(e.target.value)} placeholder="Ex: 6201-5/00" value={constCnae} />
                  </label>
                </div>
              </div>
            )}

            {/* Etapa 2 — Sócios */}
            {constStep === 2 && !constFinalizado && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                  <p style={{ margin: 0, fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Etapa 2 — Quadro de Sócios</p>
                  <button className="small-action" onClick={() => setConstSocios((prev) => [...prev, { nome: "", cpf: "", quota: "" }])} type="button">+ Sócio</button>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {constSocios.map((s, idx) => (
                    <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 160px 100px 36px", gap: 8, alignItems: "end" }}>
                      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                        Nome completo
                        <input className="input" onChange={(e) => setConstSocios((prev) => prev.map((x, i) => i === idx ? { ...x, nome: e.target.value } : x))} placeholder="Nome do sócio" value={s.nome} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                        CPF
                        <input className="input" onChange={(e) => setConstSocios((prev) => prev.map((x, i) => i === idx ? { ...x, cpf: e.target.value } : x))} placeholder="000.000.000-00" value={s.cpf} />
                      </label>
                      <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                        Quota %
                        <input className="input" onChange={(e) => setConstSocios((prev) => prev.map((x, i) => i === idx ? { ...x, quota: e.target.value } : x))} placeholder="50%" value={s.quota} />
                      </label>
                      <button
                        disabled={constSocios.length <= 1}
                        onClick={() => setConstSocios((prev) => prev.filter((_, i) => i !== idx))}
                        style={{ height: 38, marginBottom: 0, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontWeight: 800, opacity: constSocios.length <= 1 ? 0.4 : 1 }}
                        type="button"
                      >✕</button>
                    </div>
                  ))}
                  <div style={{ padding: "8px 10px", background: "#fff", borderRadius: 8, border: "1px solid #fde68a", fontSize: "0.78rem", color: "#92400e", fontWeight: 700 }}>
                    Total quotas: {constSocios.reduce((a, s) => a + (parseFloat(s.quota) || 0), 0)}%
                    {constSocios.reduce((a, s) => a + (parseFloat(s.quota) || 0), 0) === 100
                      ? <span style={{ color: "#065f46", marginLeft: 8 }}>✓ OK</span>
                      : <span style={{ color: "#b91c1c", marginLeft: 8 }}>⚠ deve somar 100%</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Etapa 3 — Capital */}
            {constStep === 3 && !constFinalizado && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.5rem" }}>
                <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Etapa 3 — Capital Social</p>
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                    Valor do capital (R$) *
                    <input className="input" onChange={(e) => setConstCapital(e.target.value)} placeholder="Ex: 10000" value={constCapital} />
                  </label>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                    Distribuição por sócio
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "8px 0" }}>
                      {constSocios.filter((s) => s.nome).map((s) => (
                        <div key={s.nome} style={{ background: "#fff", border: "1px solid #fde68a", borderRadius: 8, padding: "6px 12px" }}>
                          <p style={{ margin: "0 0 1px", fontSize: "0.78rem", fontWeight: 700, color: "#92400e" }}>{s.nome}</p>
                          <p style={{ margin: 0, fontSize: "0.72rem", color: "#a16207" }}>
                            {s.quota}% = R$ {((parseFloat(constCapital) || 0) * (parseFloat(s.quota) || 0) / 100).toLocaleString("pt-BR")}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Etapa 4 — Regime */}
            {constStep === 4 && !constFinalizado && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.5rem" }}>
                <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Etapa 4 — Regime Tributário</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {[
                    { label: "MEI", desc: "Até R$ 81 mil/ano — Contribuição fixa" },
                    { label: "Simples Nacional", desc: "Até R$ 4,8 mi/ano — Tabela unificada" },
                    { label: "Lucro Presumido", desc: "Até R$ 78 mi/ano — Margem pré-fixada" },
                    { label: "Lucro Real", desc: "Sem limite — Tributação sobre lucro real" },
                  ].map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setConstRegime(r.label)}
                      style={{ background: constRegime === r.label ? "#92400e" : "#fff", color: constRegime === r.label ? "#fff" : "#374151", border: `2px solid ${constRegime === r.label ? "#92400e" : "#fde68a"}`, borderRadius: 10, padding: "1rem 0.875rem", cursor: "pointer", textAlign: "left", display: "flex", flexDirection: "column", gap: 5, transition: "all 0.15s" }}
                      type="button"
                    >
                      <strong style={{ fontSize: "0.875rem" }}>{r.label}</strong>
                      <span style={{ fontSize: "0.72rem", opacity: 0.8 }}>{r.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Etapa 5 — Checklist */}
            {constStep === 5 && !constFinalizado && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.5rem" }}>
                <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Etapa 5 — Checklist de Protocolos</p>
                <div style={{ display: "grid", gap: 8 }}>
                  {constCheck.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setConstCheck((prev) => prev.map((c) => c.id === item.id ? { ...c, feito: !c.feito } : c))}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, cursor: "pointer", background: item.feito ? "#fff7ed" : "#fff", border: `1px solid ${item.feito ? "#fde68a" : "#f3f4f6"}` }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.feito ? "#92400e" : "#fde68a"}`, background: item.feito ? "#92400e" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {item.feito && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: item.feito ? "#92400e" : "#374151" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: "1rem", height: 8, background: "#fde68a", borderRadius: 999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${(constCheck.filter((c) => c.feito).length / constCheck.length) * 100}%`, background: "#92400e", borderRadius: 999, transition: "width 0.3s" }} />
                </div>
                <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "#a16207" }}>{constCheck.filter((c) => c.feito).length} / {constCheck.length} concluídos</p>
              </div>
            )}

            {/* Etapa 6 — Finalização */}
            {constStep === 6 && (
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.5rem" }}>
                <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Etapa 6 — Resumo e Finalização</p>
                {!constFinalizado ? (
                  <>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
                      {[
                        { label: "Nome empresarial", value: constNome || "—" },
                        { label: "Tipo societário",  value: constTipo },
                        { label: "CNAE principal",   value: constCnae || "—" },
                        { label: "Capital social",   value: constCapital ? `R$ ${parseFloat(constCapital).toLocaleString("pt-BR")}` : "—" },
                        { label: "Regime tributário",value: constRegime },
                        { label: "Nº de sócios",     value: String(constSocios.filter((s) => s.nome).length) },
                      ].map((item) => (
                        <div key={item.label} style={{ padding: "10px 14px", background: "#fff", borderRadius: 8, border: "1px solid #fde68a" }}>
                          <p style={{ margin: "0 0 2px", fontSize: "0.68rem", fontWeight: 700, color: "#a16207", textTransform: "uppercase" }}>{item.label}</p>
                          <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "#92400e" }}>{item.value}</p>
                        </div>
                      ))}
                    </div>
                    <button
                      disabled={!constNome}
                      onClick={finalizarConst}
                      style={{ opacity: !constNome ? 0.5 : 1, background: "linear-gradient(135deg, #92400e, #b45309)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 800, fontSize: "0.875rem" }}
                      type="button"
                    >
                      🏢 Iniciar processo de abertura
                    </button>
                  </>
                ) : (
                  <div style={{ padding: "1.25rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <span style={{ fontSize: "1.5rem" }}>✓</span>
                    <div>
                      <strong style={{ color: "#065f46", fontSize: "0.95rem" }}>Processo criado com sucesso!</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b7280" }}>Empresa <strong>{constNome}</strong> adicionada ao kanban de processos. A equipe foi notificada.</p>
                      <button className="small-action" onClick={() => setTab("processos")} style={{ marginTop: 10 }} type="button">→ Ver em Processos</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botões de navegação */}
            {!constFinalizado && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button className="small-action" disabled={constStep === 1} onClick={() => setConstStep((s) => s - 1)} style={{ opacity: constStep === 1 ? 0.4 : 1 }} type="button">← Anterior</button>
                {constStep < 6 && <button onClick={() => setConstStep((s) => s + 1)} type="button">Próximo →</button>}
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            ALTERAÇÕES
        ════════════════════════════════════ */}
        {tab === "alteracoes" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Nova Alteração Contratual</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Registre alterações societárias</p></div>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                  Empresa *
                  <select className="input" onChange={(e) => setAltEmp(e.target.value)} value={altEmp}>
                    <option value="">Selecione a empresa...</option>
                    {[...new Set(processos.map((p) => p.empresa))].map((e) => <option key={e}>{e}</option>)}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                  Tipo de alteração *
                  <select className="input" onChange={(e) => setAltTipo(e.target.value)} value={altTipo}>
                    {["Alteração de sócio","Alteração de capital","Mudança de nome","Alteração de CNAE","Mudança de endereço","Alteração de administrador","Mudança de objeto social","Outra"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>
                  Observações
                  <textarea className="input" onChange={(e) => setAltObs(e.target.value)} placeholder="Descreva a alteração..." rows={3} style={{ resize: "vertical" }} value={altObs} />
                </label>
                <button
                  disabled={!altEmp}
                  onClick={() => {
                    novoProcesso("alteracao", altEmp);
                    audit("Alteração registrada", "Alterações", `${altTipo} — ${altEmp}: ${altObs}`);
                    setAltEmp(""); setAltObs("");
                  }}
                  style={{ opacity: !altEmp ? 0.5 : 1 }}
                  type="button"
                >
                  ✏ Registrar alteração
                </button>
              </div>
            </div>

            <div className="list-panel">
              <div className="list-panel-header"><div><h2>Histórico de Alterações</h2></div></div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Empresa</TH><TH>Protocolo</TH><TH>Prazo</TH><TH>Status</TH></tr></thead>
                <tbody>
                  {processos.filter((p) => p.tipo === "alteracao" || p.tipo === "mudanca_cnae" || p.tipo === "mudanca_endereco" || p.tipo === "contrato_social").map((p) => (
                    <tr key={p.id}>
                      <TD><p style={{ margin: "0 0 1px", fontWeight: 700, fontSize: "0.82rem" }}>{p.empresa}</p><p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{TIPO_LABEL[p.tipo]}</p></TD>
                      <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{p.protocolo}</span></TD>
                      <TD muted>{p.prazo ? new Date(p.prazo).toLocaleDateString("pt-BR") : "—"}</TD>
                      <TD><Badge {...S_KANBAN[p.status]} /></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            ENCERRAMENTO
        ════════════════════════════════════ */}
        {tab === "encerramento" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Processo de Encerramento</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Wizard para baixa de empresa</p></div>

            {/* Stepper encerramento */}
            <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
              {["Identificação","Quitações","Obrigações","Registro","Baixas","Certificado"].map((etapa, i) => {
                const ok = i + 1 < encerrStep;
                const ativo = i + 1 === encerrStep;
                return (
                  <div key={etapa} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <button onClick={() => setEncerrStep(i + 1)} style={{ flex: 1, textAlign: "center", padding: "0 4px", background: "none", border: "none", cursor: "pointer" }} type="button">
                      <div style={{ width: 38, height: 38, borderRadius: "50%", margin: "0 auto 5px", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, background: ok ? "#b91c1c" : ativo ? "#fef2f2" : "#f3f4f6", color: ok ? "#fff" : ativo ? "#b91c1c" : "#9ca3af", border: `2px solid ${ok || ativo ? "#b91c1c" : "#e5e7eb"}` }}>
                        {ok ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: "0.68rem", fontWeight: ativo ? 800 : 400, color: ativo ? "#b91c1c" : ok ? "#065f46" : "#9ca3af" }}>{etapa}</span>
                    </button>
                    {i < 5 && <div style={{ height: 2, width: 20, flex: "0 0 20px", background: ok ? "#b91c1c" : "#e5e7eb" }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "1.5rem" }}>
              <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.875rem", color: "#b91c1c" }}>
                Etapa {encerrStep}: {["Identificar empresa","Quitar pendências","Cumprir obrigações","Registrar distrato","Dar baixas","Emitir certificado"][encerrStep - 1]}
              </p>

              {encerrStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#7f1d1d" }}>
                    Empresa a encerrar *
                    <select className="input" onChange={(e) => setEncerrEmp(e.target.value)} value={encerrEmp}>
                      <option value="">Selecione...</option>
                      {[...new Set(processos.map((p) => p.empresa))].map((e) => <option key={e}>{e}</option>)}
                    </select>
                  </label>
                  <div style={{ padding: "10px 14px", background: "#fff", border: "1px solid #fca5a5", borderRadius: 8 }}>
                    <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#b91c1c" }}>⚠ Atenção</p>
                    <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#7f1d1d" }}>O processo de encerramento é irreversível após o registro na Junta Comercial. Confirme todas as pendências antes de prosseguir.</p>
                  </div>
                </div>
              )}

              {encerrStep >= 2 && (
                <div style={{ display: "grid", gap: 8 }}>
                  {encerrCheck.slice((encerrStep - 2) * 1, (encerrStep - 1) * 1 + 5).map((item) => (
                    <div
                      key={item.id}
                      onClick={() => setEncerrCheck((prev) => prev.map((c) => c.id === item.id ? { ...c, feito: !c.feito } : c))}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", borderRadius: 8, cursor: "pointer", background: item.feito ? "#fef2f2" : "#fff", border: `1px solid ${item.feito ? "#fca5a5" : "#f3f4f6"}` }}
                    >
                      <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.feito ? "#b91c1c" : "#fca5a5"}`, background: item.feito ? "#b91c1c" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {item.feito && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                      </div>
                      <span style={{ fontSize: "0.875rem", fontWeight: 600, color: item.feito ? "#b91c1c" : "#374151" }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="small-action" disabled={encerrStep === 1} onClick={() => setEncerrStep((s) => s - 1)} style={{ opacity: encerrStep === 1 ? 0.4 : 1 }} type="button">← Anterior</button>
              {encerrStep < 6 ? (
                <button
                  disabled={encerrStep === 1 && !encerrEmp}
                  onClick={() => { setEncerrStep((s) => s + 1); audit(`Encerramento — etapa ${encerrStep}`, "Encerramento", encerrEmp); }}
                  style={{ opacity: encerrStep === 1 && !encerrEmp ? 0.5 : 1 }}
                  type="button"
                >Próximo →</button>
              ) : (
                <button
                  onClick={() => { novoProcesso("baixa", encerrEmp); audit("Processo de baixa criado", "Encerramento", encerrEmp); }}
                  style={{ background: "linear-gradient(135deg, #b91c1c, #dc2626)" }}
                  type="button"
                >🔒 Iniciar baixa</button>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            ALVARÁS
        ════════════════════════════════════ */}
        {tab === "alvaras" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Alvarás de Funcionamento</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{alvaras.length} alvarás cadastrados</p></div>
              <button onClick={() => audit("Alvará solicitado", "Alvarás", "Nova solicitação")} type="button">+ Solicitar alvará</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Válidos",      count: alvaras.filter((a) => a.status === "valido").length, color: "#065f46", bg: "#f0fdf4" },
                { label: "Vencendo",     count: alvaras.filter((a) => a.status === "vencendo").length, color: "#92400e", bg: "#fffbeb" },
                { label: "Vencidos",     count: alvaras.filter((a) => a.status === "vencido").length, color: "#b91c1c", bg: "#fef2f2" },
                { label: "Em processo",  count: alvaras.filter((a) => a.status === "em_processo" || a.status === "pendente").length, color: "#1d4ed8", bg: "#eff6ff" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, borderTop: `3px solid ${k.color}`, borderRadius: 10, padding: "0.875rem 1rem", border: `1px solid ${k.color}22` }}>
                  <p style={{ margin: "0 0 3px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: k.color }}>{k.count}</p>
                </div>
              ))}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Empresa</TH><TH>Tipo</TH><TH>Número</TH><TH>Órgão</TH><TH>Emissão</TH><TH>Validade</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
              <tbody>
                {alvaras.map((a) => {
                  const dias = diasParaVencer(a.validade);
                  return (
                    <tr key={a.id}>
                      <TD bold>{a.empresa}</TD>
                      <TD>{a.tipo}</TD>
                      <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{a.numero}</span></TD>
                      <TD muted>{a.orgao}</TD>
                      <TD muted>{a.emissao !== "—" ? new Date(a.emissao).toLocaleDateString("pt-BR") : "—"}</TD>
                      <TD>
                        {a.validade !== "—" ? (
                          <span style={{ fontWeight: 600, color: dias <= 30 ? "#b91c1c" : "#374151", fontSize: "0.82rem" }}>
                            {dias <= 30 && "⚠ "}{new Date(a.validade).toLocaleDateString("pt-BR")}
                          </span>
                        ) : <span style={{ color: "#9ca3af" }}>—</span>}
                      </TD>
                      <TD><Badge {...S_ALVARA[a.status]} /></TD>
                      <TD right>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button className="small-action" onClick={() => audit("Renovação solicitada", "Alvarás", `${a.tipo} — ${a.empresa}`)} type="button">↻ Renovar</button>
                          <button className="small-action" onClick={() => audit("Aviso enviado", "Alvarás", `${a.empresa}`)} type="button">📧 Avisar</button>
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
            CERTIFICADOS
        ════════════════════════════════════ */}
        {tab === "certificados" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Certidões Negativas</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Controle de validade e renovação automática</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="small-action" onClick={() => { certificados.filter((c) => ["vencendo_7","vencendo_15"].includes(c.status)).forEach((c) => { audit("Automação: tarefa criada", "Certificados", `Renovação urgente — ${c.tipo} ${c.empresa}`); }); }} type="button">⚡ Criar tarefas urgentes</button>
                <button onClick={() => audit("Certidão solicitada", "Certificados", "Nova solicitação")} type="button">+ Solicitar certidão</button>
              </div>
            </div>

            {/* Alertas de vencimento */}
            {alertasCert > 0 && (
              <div style={{ padding: "12px 16px", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem" }}>🔴</span>
                  <div>
                    <strong style={{ color: "#b91c1c", fontSize: "0.875rem" }}>{alertasCert} certidão(ões) com alerta de vencimento</strong>
                    <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                      {certificados.filter((c) => c.status === "vencendo_7").length} críticas (7d) ·
                      {certificados.filter((c) => c.status === "vencendo_15").length} urgentes (15d) ·
                      {certificados.filter((c) => c.status === "vencendo_30").length} atenção (30d) ·
                      {certificados.filter((c) => c.status === "vencida").length} vencidas
                    </p>
                  </div>
                </div>
              </div>
            )}

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Empresa</TH><TH>Certidão</TH><TH>Validade</TH><TH>Restam</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
              <tbody>
                {certificados.sort((a, b) => {
                  const ord: StatusCert[] = ["vencida","vencendo_7","vencendo_15","vencendo_30","pendente","solicitada","valida"];
                  return ord.indexOf(a.status) - ord.indexOf(b.status);
                }).map((c) => {
                  const dias = diasParaVencer(c.validade);
                  return (
                    <tr key={c.id} style={{ background: c.status === "vencendo_7" || c.status === "vencida" ? "#fff8f8" : "transparent" }}>
                      <TD bold>{c.empresa}</TD>
                      <TD>{c.tipo}</TD>
                      <TD>
                        {c.validade !== "—" ? (
                          <span style={{ fontWeight: 600, color: dias <= 7 ? "#b91c1c" : dias <= 15 ? "#c2410c" : dias <= 30 ? "#92400e" : "#374151", fontSize: "0.82rem" }}>
                            {new Date(c.validade).toLocaleDateString("pt-BR")}
                          </span>
                        ) : <span style={{ color: "#9ca3af" }}>—</span>}
                      </TD>
                      <TD right>
                        {c.validade !== "—" && dias !== 999 ? (
                          <span style={{ fontWeight: 700, color: dias <= 7 ? "#b91c1c" : dias <= 30 ? "#92400e" : "#065f46", fontSize: "0.82rem" }}>
                            {dias > 0 ? `${dias}d` : "Vencido"}
                          </span>
                        ) : "—"}
                      </TD>
                      <TD>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: "0.8rem" }}>{S_CERT[c.status].icon}</span>
                          <Badge {...S_CERT[c.status]} />
                        </div>
                      </TD>
                      <TD right>
                        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                          <button className="small-action" onClick={() => renovarCert(c.id)} type="button">↻ Renovar</button>
                          <button className="small-action" onClick={() => { audit("Aviso enviado", "Certificados", `${c.tipo} — ${c.empresa}`); }} type="button">📧 Avisar</button>
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
            PROTOCOLOS
        ════════════════════════════════════ */}
        {tab === "protocolos" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1.5rem" }}>
            {/* Lista */}
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Protocolos</h2>
                <button className="small-action" onClick={() => audit("Protocolo criado", "Protocolos", "Novo protocolo")} type="button">+ Novo</button>
              </div>
              {protocolos.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setProtocSelecionado(p.id)}
                  style={{ padding: "12px 14px", borderRadius: 10, border: `2px solid ${protocSelecionado === p.id ? "#92400e" : "#fde68a"}`, cursor: "pointer", background: protocSelecionado === p.id ? "#fffbeb" : "#fff", transition: "all 0.15s" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                    <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: "0.82rem", color: "#92400e" }}>{p.numero}</span>
                    <Badge {...S_PROT[p.status]} />
                  </div>
                  <p style={{ margin: "0 0 2px", fontSize: "0.82rem", fontWeight: 600, color: "#07170d" }}>{p.tipo}</p>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{p.orgao} · {new Date(p.atualizacao).toLocaleDateString("pt-BR")}</p>
                </div>
              ))}
            </div>

            {/* Linha do tempo */}
            <div>
              {protSelecionado ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>{protSelecionado.numero}</h2>
                      <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{protSelecionado.orgao} — {protSelecionado.tipo}</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      {protSelecionado.status !== "concluido" && protSelecionado.status !== "devolvido" && (
                        <button onClick={() => avancarProtocolo(protSelecionado.id)} type="button">→ Avançar status</button>
                      )}
                    </div>
                  </div>

                  <div className="list-panel">
                    <div className="list-panel-header"><div><h2>Linha do tempo</h2></div></div>
                    <div style={{ padding: "1rem 1.5rem" }}>
                      {protSelecionado.historico.map((h, i) => {
                        const s = S_PROT[h.status];
                        const isLast = i === protSelecionado.historico.length - 1;
                        return (
                          <div key={i} style={{ display: "flex", gap: "1rem", paddingBottom: isLast ? 0 : "1.25rem", position: "relative" }}>
                            {!isLast && (
                              <div style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 2, background: "#fde68a" }} />
                            )}
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0, border: `2px solid ${s.color}`, zIndex: 1 }}>
                              {i + 1}
                            </div>
                            <div style={{ paddingTop: 4 }}>
                              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                                <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#07170d" }}>{h.evento}</span>
                                <Badge {...s} />
                              </div>
                              <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{new Date(h.data).toLocaleDateString("pt-BR")}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Barra de progresso */}
                  {(() => {
                    const ordem: StatusProtocolo[] = ["criado", "protocolado", "analisando", "concluido"];
                    const pct = ((ordem.indexOf(protSelecionado.status) + 1) / ordem.length) * 100;
                    return (
                      <div>
                        <p style={{ margin: "0 0 5px", fontSize: "0.72rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Progresso</p>
                        <div style={{ height: 8, background: "#fde68a", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${pct}%`, background: "#92400e", borderRadius: 999, transition: "width 0.4s" }} />
                        </div>
                        <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#a16207" }}>{Math.round(pct)}% concluído</p>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "#9ca3af", fontSize: "0.85rem" }}>
                  Selecione um protocolo para ver a linha do tempo
                </div>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            DOCUMENTOS
        ════════════════════════════════════ */}
        {tab === "documentos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Documentos Societários</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{docs.length} documentos · {docs.filter((d) => d.status === "pendente").length} pendentes</p></div>
              <button onClick={() => audit("Documento enviado", "Documentos", "Upload manual")} type="button">📎 Enviar documento</button>
            </div>

            {/* Zona de upload */}
            <div style={{ border: "2px dashed #fde68a", borderRadius: 12, padding: "1.5rem", textAlign: "center", background: "#fffbeb" }}>
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#a16207", fontWeight: 600 }}>🗂 Arraste arquivos aqui ou clique para selecionar</p>
              <p style={{ margin: "4px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>PDF, DOCX, JPG — máx. 25 MB por arquivo</p>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Nome</TH><TH>Tipo</TH><TH>Processo</TH><TH>Upload</TH><TH>Tamanho</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} style={{ background: d.status === "pendente" ? "#fffbf0" : d.status === "revisao" ? "#fef2f2" : "transparent" }}>
                    <TD><div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: "1.1rem" }}>{d.nome.endsWith(".pdf") ? "📄" : d.nome.endsWith(".docx") ? "📝" : "📋"}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{d.nome}</span>
                    </div></TD>
                    <TD muted>{d.tipo}</TD>
                    <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>#{d.processoId}</span></TD>
                    <TD muted>{d.upload !== "—" ? new Date(d.upload).toLocaleDateString("pt-BR") : <span style={{ color: "#fbbf24" }}>Aguardando</span>}</TD>
                    <TD muted>{d.tamanho}</TD>
                    <TD>
                      <Badge {...(
                        d.status === "ok" ? { bg: "#f0fdf4", color: "#065f46", label: "✓ OK" } :
                        d.status === "pendente" ? { bg: "#fffbeb", color: "#92400e", label: "Pendente" } :
                        { bg: "#fef2f2", color: "#b91c1c", label: "Em revisão" }
                      )} />
                    </TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                        <button className="small-action" onClick={() => audit("Documento visualizado", "Documentos", d.nome)} type="button">👁</button>
                        <button className="small-action" onClick={() => audit("Documento baixado", "Documentos", d.nome)} type="button">⬇</button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════════════
            HISTÓRICO
        ════════════════════════════════════ */}
        {tab === "historico" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Histórico de Auditoria</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{log.length} registros · toda ação é rastreada</p></div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#92400e", background: "#fffbeb", borderRadius: 999, padding: "3px 10px", border: "1px solid #fde68a" }}>⚡ Tempo real</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead><tr><TH>Data / Hora</TH><TH>Usuário</TH><TH>Ação</TH><TH>Módulo</TH><TH>Detalhe</TH></tr></thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={entry.id}>
                    <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{new Date(entry.data).toLocaleString("pt-BR")}</span></TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: entry.usuario === "Sistema" ? "#f3f4f6" : "#fffbeb", color: entry.usuario === "Sistema" ? "#6b7280" : "#92400e", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0 }}>
                          {entry.usuario === "Sistema" ? "SYS" : entry.usuario.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{entry.usuario}</span>
                      </div>
                    </TD>
                    <TD><span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#92400e" }}>{entry.acao}</span></TD>
                    <TD muted>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#fffbeb", color: "#92400e", borderRadius: 999, padding: "2px 8px" }}>{entry.modulo}</span>
                    </TD>
                    <TD><span style={{ fontSize: "0.82rem", color: "#374151" }}>{entry.detalhe}</span></TD>
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
