"use client";

import { useRef, useState } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type StatusFunc = "ativo" | "ferias" | "afastado" | "desligado";
type StatusFolha = "aberta" | "calculada" | "validada" | "fechada";
type StatusFerias = "solicitada" | "aprovada" | "programada" | "concluida";
type StatusEsocial = "fila" | "processando" | "transmitido" | "erro";
type StatusAdmissao = "pendente" | "conferindo" | "enviado" | "concluido";
type TipoRescisao = "sem_justa_causa" | "com_justa_causa" | "pedido_demissao" | "comum_acordo";

type Funcionario = {
  id: string; nome: string; cpf: string; cargo: string;
  setor: string; admissao: string; salario: number;
  status: StatusFunc; email: string; telefone: string;
  pis: string; ctps: string; dependentes: number;
};

type ItemFolha = {
  id: string; funcionarioId: string; nome: string;
  salarioBruto: number; inss: number; irrf: number;
  outrosDescontos: number; liquido: number;
};

type Ferias = {
  id: string; funcionarioId: string; nome: string;
  periodoAquisitivo: string; inicio: string; fim: string;
  dias: number; status: StatusFerias;
};

type EventoEsocial = {
  id: string; tipo: string; funcionario: string;
  data: string; status: StatusEsocial; protocolo: string | null; obs: string;
};

type Beneficio = {
  id: string; nome: string; tipo: string; valor: number; funcionarios: number; ativo: boolean;
};

type LogDP = {
  id: string; data: string; usuario: string; acao: string; modulo: string; detalhe: string;
};

type ItemCalendario = {
  dia: number; eventos: { label: string; tipo: "folha" | "fgts" | "inss" | "ferias" | "esocial" | "rescisao" }[];
};

/* ─── Ícone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <circle cx={9} cy={7} r={4} stroke="currentColor" strokeWidth={2} />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <path d="M16 11h6M19 8v6" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

/* ─── Dados mock ──────────────────────────────────────────────── */

const FUNC_INIT: Funcionario[] = [
  { id: "1", nome: "Carlos Silva", cpf: "123.456.789-00", cargo: "Gerente Comercial", setor: "Comercial", admissao: "2022-03-01", salario: 5800, status: "ativo", email: "carlos@empresa.com.br", telefone: "(11) 99999-0001", pis: "123.45678.90-1", ctps: "12345-6 SP", dependentes: 2 },
  { id: "2", nome: "Ana Souza", cpf: "234.567.890-11", cargo: "Auxiliar Administrativo", setor: "Administrativo", admissao: "2023-06-15", salario: 2200, status: "ativo", email: "ana@empresa.com.br", telefone: "(11) 99999-0002", pis: "234.56789.01-2", ctps: "23456-7 SP", dependentes: 0 },
  { id: "3", nome: "Pedro Lima", cpf: "345.678.901-22", cargo: "Técnico de TI", setor: "Tecnologia", admissao: "2024-01-10", salario: 3500, status: "ativo", email: "pedro@empresa.com.br", telefone: "(11) 99999-0003", pis: "345.67890.12-3", ctps: "34567-8 SP", dependentes: 1 },
  { id: "4", nome: "Juliana Costa", cpf: "456.789.012-33", cargo: "Vendedora", setor: "Comercial", admissao: "2023-09-20", salario: 1800, status: "ferias", email: "juliana@empresa.com.br", telefone: "(11) 99999-0004", pis: "456.78901.23-4", ctps: "45678-9 SP", dependentes: 1 },
];

const FOLHA_ITENS: ItemFolha[] = [
  { id: "1", funcionarioId: "1", nome: "Carlos Silva",   salarioBruto: 5800, inss: 580,  irrf: 520, outrosDescontos: 0, liquido: 4700 },
  { id: "2", funcionarioId: "2", nome: "Ana Souza",      salarioBruto: 2200, inss: 176,  irrf: 0,   outrosDescontos: 0, liquido: 2024 },
  { id: "3", funcionarioId: "3", nome: "Pedro Lima",     salarioBruto: 3500, inss: 315,  irrf: 140, outrosDescontos: 0, liquido: 3045 },
  { id: "4", funcionarioId: "4", nome: "Juliana Costa",  salarioBruto: 1800, inss: 144,  irrf: 0,   outrosDescontos: 0, liquido: 1656 },
];

const FERIAS_INIT: Ferias[] = [
  { id: "1", funcionarioId: "4", nome: "Juliana Costa", periodoAquisitivo: "Set/2023–Set/2024", inicio: "2026-07-01", fim: "2026-07-30", dias: 30, status: "aprovada" },
  { id: "2", funcionarioId: "1", nome: "Carlos Silva",  periodoAquisitivo: "Mar/2025–Mar/2026", inicio: "2026-08-15", fim: "2026-09-13", dias: 30, status: "programada" },
  { id: "3", funcionarioId: "3", nome: "Pedro Lima",    periodoAquisitivo: "Jan/2025–Jan/2026", inicio: "",           fim: "",          dias: 30, status: "solicitada" },
];

const ESOCIAL_INIT: EventoEsocial[] = [
  { id: "1", tipo: "S-1200 — Remuneração Mensal",   funcionario: "Todos", data: "2026-07-07", status: "fila",        protocolo: null,              obs: "Folha Jun/2026" },
  { id: "2", tipo: "S-2200 — Admissão",              funcionario: "Pedro Lima", data: "2026-06-15", status: "transmitido", protocolo: "PRO-SS-00123", obs: "Admissão 10/01/2024 — retificação" },
  { id: "3", tipo: "S-2306 — Trabalhador Sem Vínculo", funcionario: "RPA - João",  data: "2026-06-20", status: "erro",        protocolo: null,              obs: "CPF inválido no arquivo" },
  { id: "4", tipo: "S-2230 — Afastamento",           funcionario: "Juliana Costa", data: "2026-07-01", status: "fila",      protocolo: null,              obs: "Férias Jul/2026" },
  { id: "5", tipo: "S-5001 — Inf. INSS",             funcionario: "Todos", data: "2026-06-10", status: "transmitido", protocolo: "PRO-SS-00100", obs: "Mai/2026 concluído" },
];

const BENEFICIOS: Beneficio[] = [
  { id: "1", nome: "Vale Refeição",     tipo: "Alimentação",  valor: 580,  funcionarios: 4, ativo: true },
  { id: "2", nome: "Vale Transporte",   tipo: "Transporte",   valor: 220,  funcionarios: 3, ativo: true },
  { id: "3", nome: "Plano de Saúde",    tipo: "Saúde",        valor: 450,  funcionarios: 2, ativo: true },
  { id: "4", nome: "Seguro de Vida",    tipo: "Seguro",       valor: 35,   funcionarios: 4, ativo: true },
  { id: "5", nome: "Gympass",           tipo: "Bem-estar",    valor: 99,   funcionarios: 1, ativo: false },
];

const LOG_INIT: LogDP[] = [
  { id: "1", data: "2026-06-18T14:30:00", usuario: "Ana Lima",     acao: "Férias aprovadas",    modulo: "Férias",     detalhe: "Juliana Costa — Jul/2026 30 dias" },
  { id: "2", data: "2026-06-17T10:00:00", usuario: "Carlos Admin", acao: "Folha calculada",     modulo: "Folha",      detalhe: "Jun/2026 — Bruto R$ 13.300,00 / Líquido R$ 11.425,00" },
  { id: "3", data: "2026-06-15T09:15:00", usuario: "Sistema",      acao: "eSocial transmitido", modulo: "eSocial",    detalhe: "S-2200 Pedro Lima — protocolo PRO-SS-00123" },
  { id: "4", data: "2026-06-10T08:00:00", usuario: "Sistema",      acao: "Automação disparada", modulo: "Sistema",    detalhe: "Folha Jun/2026 aberta automaticamente" },
  { id: "5", data: "2026-06-05T16:00:00", usuario: "Ana Lima",     acao: "Benefício alterado",  modulo: "Benefícios", detalhe: "Vale Refeição — de R$ 520 para R$ 580" },
];

const DIAS_JUN: ItemCalendario[] = [
  { dia: 7,  eventos: [{ label: "eSocial S-1200",   tipo: "esocial" }] },
  { dia: 20, eventos: [{ label: "FGTS Jun/2026",     tipo: "fgts" }] },
  { dia: 20, eventos: [{ label: "INSS (GPS)",        tipo: "inss" }] },
  { dia: 25, eventos: [{ label: "Salários",          tipo: "folha" }] },
  { dia: 1,  eventos: [{ label: "Férias Juliana",    tipo: "ferias" }] },
];

/* ─── Configurações visuais ───────────────────────────────────── */

const S_FUNC: Record<StatusFunc, { bg: string; color: string; label: string }> = {
  ativo:     { bg: "#f0fdf4", color: "#166534", label: "Ativo" },
  ferias:    { bg: "#eff6ff", color: "#1d4ed8", label: "Férias" },
  afastado:  { bg: "#fff7ed", color: "#c2410c", label: "Afastado" },
  desligado: { bg: "#fef2f2", color: "#b91c1c", label: "Desligado" },
};

const S_FERIAS: Record<StatusFerias, { bg: string; color: string; label: string }> = {
  solicitada: { bg: "#fffbeb", color: "#92400e", label: "Solicitada" },
  aprovada:   { bg: "#eff6ff", color: "#1d4ed8", label: "Aprovada" },
  programada: { bg: "#fdf4ff", color: "#7e22ce", label: "Programada" },
  concluida:  { bg: "#f0fdf4", color: "#166534", label: "Concluída" },
};

const S_ESOCIAL: Record<StatusEsocial, { bg: string; color: string; label: string }> = {
  fila:         { bg: "#fffbeb", color: "#92400e", label: "Na fila" },
  processando:  { bg: "#eff6ff", color: "#1d4ed8", label: "Processando" },
  transmitido:  { bg: "#f0fdf4", color: "#166534", label: "Transmitido" },
  erro:         { bg: "#fef2f2", color: "#b91c1c", label: "Erro" },
};

const S_ADM: Record<StatusAdmissao, { bg: string; color: string; label: string }> = {
  pendente:   { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
  conferindo: { bg: "#eff6ff", color: "#1d4ed8", label: "Conferindo" },
  enviado:    { bg: "#fdf4ff", color: "#7e22ce", label: "Enviado" },
  concluido:  { bg: "#f0fdf4", color: "#166534", label: "Concluído" },
};

const COR_CAL: Record<string, string> = {
  folha: "#7c3aed", fgts: "#065f46", inss: "#1d4ed8",
  ferias: "#0e7490", esocial: "#92400e", rescisao: "#b91c1c",
};

const TABS_DP = [
  { id: "dashboard",    label: "Dashboard",    icon: "◉" },
  { id: "funcionarios", label: "Funcionários", icon: "👤" },
  { id: "admissao",     label: "Admissão",     icon: "+" },
  { id: "folha",        label: "Folha",        icon: "₿" },
  { id: "ferias",       label: "Férias",       icon: "☀" },
  { id: "rescisao",     label: "Rescisão",     icon: "✕" },
  { id: "esocial",      label: "eSocial",      icon: "⚡" },
  { id: "encargos",     label: "Encargos",     icon: "%" },
  { id: "beneficios",   label: "Benefícios",   icon: "★" },
  { id: "documentos",   label: "Documentos",   icon: "📄" },
  { id: "calendario",   label: "Calendário",   icon: "📅" },
  { id: "historico",    label: "Histórico",    icon: "⌛" },
] as const;

type TabDP = typeof TABS_DP[number]["id"];

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Avatar({ nome, size = 34, bg = "linear-gradient(135deg,#7c3aed,#6b21a8)" }: { nome: string; size?: number; bg?: string }) {
  const initials = nome.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: bg, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.3, fontWeight: 800, flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ display: "inline-block", background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ textAlign: right ? "right" : "left", padding: "0.7rem 0.875rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.73rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8e4f7" }}>{children}</th>;
}

function TD({ children, right, muted }: { children: React.ReactNode; right?: boolean; muted?: boolean }) {
  return <td style={{ padding: "0.8rem 0.875rem", textAlign: right ? "right" : "left", color: muted ? "#6f8f7c" : "#07170d", fontSize: "0.875rem", borderBottom: "1px solid #f5f3ff" }}>{children}</td>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 1rem", fontSize: "0.68rem", fontWeight: 900, color: "#7c3aed", letterSpacing: "2px", textTransform: "uppercase" }}>{children}</p>;
}

/* ─── Componente principal ────────────────────────────────────── */

export default function DPPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [tab, setTab] = useState<TabDP>("dashboard");
  const [funcionarios] = useState<Funcionario[]>(FUNC_INIT);
  const [folhaStatus, setFolhaStatus] = useState<StatusFolha>("calculada");
  const [folhaComp, setFolhaComp] = useState("Jun/2026");
  const [ferias, setFerias] = useState<Ferias[]>(FERIAS_INIT);
  const [esocial] = useState<EventoEsocial[]>(ESOCIAL_INIT);
  const [log, setLog] = useState<LogDP[]>(LOG_INIT);
  const [perfil, setPerfil] = useState<Funcionario | null>(null);
  const [admStep, setAdmStep] = useState(1);
  const [rescisaoStep, setRescisaoStep] = useState(1);
  const [tipoRescisao, setTipoRescisao] = useState<TipoRescisao>("sem_justa_causa");
  const [dragCat, setDragCat] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [checklist, setChecklist] = useState([
    { id: "1", label: "RG — Registro Geral",         feito: true },
    { id: "2", label: "CPF — Cadastro de Pessoa Física", feito: true },
    { id: "3", label: "CTPS — Carteira de Trabalho",  feito: false },
    { id: "4", label: "Comprovante de residência",    feito: false },
    { id: "5", label: "Contrato assinado",            feito: false },
    { id: "6", label: "Exame admissional",            feito: false },
  ]);

  /* ── Auditoria ── */
  function audit(acao: string, modulo: string, detalhe: string) {
    setLog((prev) => [{
      id: crypto.randomUUID(), data: new Date().toISOString(),
      usuario: "Usuário Atual", acao, modulo, detalhe,
    }, ...prev]);
  }

  /* ── Folha ── */
  const totalBruto  = FOLHA_ITENS.reduce((a, i) => a + i.salarioBruto, 0);
  const totalInss   = FOLHA_ITENS.reduce((a, i) => a + i.inss, 0);
  const totalIrrf   = FOLHA_ITENS.reduce((a, i) => a + i.irrf, 0);
  const totalLiq    = FOLHA_ITENS.reduce((a, i) => a + i.liquido, 0);
  const totalFgts   = totalBruto * 0.08;
  const totalInssEmp = totalBruto * 0.20;

  const FLUXO_FOLHA: { label: string; status: StatusFolha }[] = [
    { label: "1. Importar eventos",  status: "aberta" },
    { label: "2. Calcular",          status: "calculada" },
    { label: "3. Validar",           status: "validada" },
    { label: "4. Gerar recibos",     status: "validada" },
    { label: "5. Transmitir eSocial",status: "validada" },
    { label: "6. Encerrar",          status: "fechada" },
  ];

  function avancarFolha() {
    const ordem: StatusFolha[] = ["aberta", "calculada", "validada", "fechada"];
    const idx = ordem.indexOf(folhaStatus);
    if (idx < ordem.length - 1) {
      const novoStatus = ordem[idx + 1];
      setFolhaStatus(novoStatus);
      audit("Folha avançada", "Folha", `${folhaComp}: ${folhaStatus} → ${novoStatus}`);
    }
  }

  /* ── Férias ── */
  function atualizarFerias(id: string, novoStatus: StatusFerias) {
    setFerias((prev) => prev.map((f) => {
      if (f.id !== id) return f;
      audit("Férias atualizada", "Férias", `${f.nome}: ${f.status} → ${novoStatus}`);
      return { ...f, status: novoStatus };
    }));
  }

  /* ── Stats ── */
  const ativos    = funcionarios.filter((f) => f.status === "ativo").length;
  const emFerias  = funcionarios.filter((f) => f.status === "ferias").length;
  const pendESoc  = esocial.filter((e) => e.status === "fila" || e.status === "erro").length;
  const feriasPend = ferias.filter((f) => f.status === "solicitada").length;

  /* ─── Render ─── */
  return (
    <SetorShell
      borda="#c4b5fd"
      cor="#6b21a8"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#faf5ff"
      icone={ICONE}
      setorNome="Departamento Pessoal"
      setorResumo="Folha de pagamento, férias, eSocial e gestão de colaboradores"
      stats={[
        { label: "Funcionários ativos", value: String(ativos),       cor: "#a78bfa" },
        { label: "Em férias",           value: String(emFerias),     cor: "#93c5fd" },
        { label: "Total folha",         value: fmt(totalBruto),      cor: "#fbbf24" },
        { label: "eSocial pendente",    value: String(pendESoc),     cor: pendESoc > 0 ? "#fca5a5" : "#fff" },
      ]}
    >
      {/* ── Tabs ── */}
      <div style={{ background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid #e9e4f7", borderBottom: "none" }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 6px" }}>
          {TABS_DP.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "none", border: "none", cursor: "pointer",
                borderBottom: tab === t.id ? "2px solid #7c3aed" : "2px solid transparent",
                color: tab === t.id ? "#6b21a8" : "#6f8f7c",
                fontWeight: tab === t.id ? 800 : 500,
                fontSize: "0.8rem", padding: "0.85rem 0.875rem",
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

      <div style={{ background: "#fff", border: "1px solid #e9e4f7", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

        {/* ════════════════════════════
            DASHBOARD
        ════════════════════════════ */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {/* 6 KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
              {[
                { label: "Ativos",       value: ativos,           color: "#7c3aed", bg: "#faf5ff" },
                { label: "Admissões",    value: 0,                color: "#065f46", bg: "#f0fdf4" },
                { label: "Em férias",    value: emFerias,         color: "#1d4ed8", bg: "#eff6ff" },
                { label: "Folha aberta", value: folhaStatus !== "fechada" ? 1 : 0, color: "#f59e0b", bg: "#fffbeb" },
                { label: "eSocial",      value: pendESoc,         color: pendESoc > 0 ? "#b91c1c" : "#065f46", bg: pendESoc > 0 ? "#fef2f2" : "#f0fdf4" },
                { label: "Pendências",   value: feriasPend,       color: "#92400e", bg: "#fff7ed" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "0.875rem 1rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem" }}>
              {/* Resumo custo folha */}
              <div className="list-panel">
                <div className="list-panel-header">
                  <div><h2>Folha de Pagamento</h2><p>{folhaComp} — <Badge {...(folhaStatus === "fechada" ? { bg: "#f0fdf4", color: "#166534", label: "Fechada" } : { bg: "#fffbeb", color: "#92400e", label: "Em aberto" })} /></p></div>
                  <button className="small-action" onClick={() => setTab("folha")} type="button">Abrir folha</button>
                </div>
                <div style={{ padding: "0.5rem 1rem 1rem" }}>
                  {[
                    { label: "Salários brutos",  val: totalBruto,   color: "#07170d" },
                    { label: "INSS empregado",   val: -totalInss,   color: "#b91c1c" },
                    { label: "IRRF",             val: -totalIrrf,   color: "#b91c1c" },
                    { label: "Líquido",          val: totalLiq,     color: "#7c3aed", bold: true },
                    { label: "FGTS (8%)",        val: totalFgts,    color: "#065f46" },
                    { label: "INSS empresa (20%)", val: totalInssEmp, color: "#065f46" },
                    { label: "Custo total",      val: totalBruto + totalFgts + totalInssEmp, color: "#7c3aed", bold: true },
                  ].map((row) => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f3ff" }}>
                      <span style={{ fontSize: "0.82rem", color: row.bold ? "#07170d" : "#4b6358", fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: row.color }}>{fmt(Math.abs(row.val))}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Próximos eventos */}
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Agenda DP</h2><p>Próximos vencimentos</p></div></div>
                  <div style={{ padding: "0.25rem 0 0.75rem" }}>
                    {[
                      { label: "eSocial S-1200 — Folha Jun", data: "07/07", cor: "#92400e" },
                      { label: "FGTS — Jun/2026",            data: "20/07", cor: "#065f46" },
                      { label: "GPS — INSS Jun/2026",        data: "20/07", cor: "#1d4ed8" },
                      { label: "Salários — Jun/2026",        data: "25/07", cor: "#7c3aed" },
                      { label: "Férias — Juliana Costa",     data: "01/07", cor: "#0e7490" },
                    ].map((ev) => (
                      <div key={ev.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 1rem", borderBottom: "1px solid #f5f3ff" }}>
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#07170d" }}>{ev.label}</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: ev.cor, background: `${ev.cor}18`, borderRadius: 999, padding: "2px 8px" }}>{ev.data}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Automações */}
                <div className="list-panel">
                  <div className="list-panel-header"><div><h2>Automações</h2><p>Regras ativas</p></div></div>
                  <div style={{ padding: "0.5rem 1rem 1rem", display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      { icon: "👤", label: "Admissão → eSocial",         ativo: true },
                      { icon: "💰", label: "Fechar folha → gerar encargos", ativo: true },
                      { icon: "☀",  label: "Férias aprovadas → emitir docs", ativo: true },
                      { icon: "✕",  label: "Rescisão → abrir checklist",  ativo: false },
                    ].map((a) => (
                      <div key={a.label} style={{ display: "flex", gap: 8, alignItems: "center", padding: "7px 10px", borderRadius: 8, background: a.ativo ? "#faf5ff" : "#f9fafb", border: `1px solid ${a.ativo ? "#e9d5ff" : "#e5e7eb"}` }}>
                        <span>{a.icon}</span>
                        <span style={{ flex: 1, fontSize: "0.8rem", fontWeight: 600, color: "#07170d" }}>{a.label}</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, color: a.ativo ? "#7c3aed" : "#9ca3af", background: a.ativo ? "#ede9fe" : "#f3f4f6", borderRadius: 999, padding: "2px 8px" }}>
                          {a.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════
            FUNCIONÁRIOS
        ════════════════════════════ */}
        {tab === "funcionarios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Funcionários</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{funcionarios.length} colaboradores cadastrados</p>
              </div>
              <button onClick={() => { setAdmStep(1); setTab("admissao"); }} type="button">+ Admitir funcionário</button>
            </div>

            {perfil ? (
              /* ── Perfil do funcionário ── */
              <div>
                <button className="small-action" onClick={() => setPerfil(null)} style={{ marginBottom: "1rem" }} type="button">← Voltar à lista</button>
                <div style={{ background: "linear-gradient(120deg, #3b0764 0%, #581c87 100%)", borderRadius: 16, padding: "1.75rem 2rem", position: "relative", overflow: "hidden", marginBottom: "1.25rem" }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #a78bfa, #c4b5fd)" }} />
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                    <Avatar nome={perfil.nome} size={60} bg="linear-gradient(135deg,#a78bfa,#7c3aed)" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: "0 0 2px", fontSize: "0.68rem", fontWeight: 800, color: "#c4b5fd", letterSpacing: "2px", textTransform: "uppercase" }}>Funcionário</p>
                      <h2 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.3rem", fontWeight: 800 }}>{perfil.nome}</h2>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.8rem", color: "#c4b5fd" }}>{perfil.cargo}</span>
                        <span style={{ fontSize: "0.8rem", color: "#a78bfa" }}>•</span>
                        <span style={{ fontSize: "0.8rem", color: "#c4b5fd" }}>{perfil.setor}</span>
                        <Badge {...S_FUNC[perfil.status]} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 4px", fontSize: "0.68rem", color: "#c4b5fd", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" }}>Salário</p>
                      <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>{fmt(perfil.salario)}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <div className="list-panel">
                    <div className="list-panel-header"><div><h2>Dados Pessoais</h2></div></div>
                    <div style={{ padding: "0.5rem 1rem 1rem", display: "grid", gap: 8 }}>
                      {[
                        { label: "CPF",       value: perfil.cpf },
                        { label: "PIS",       value: perfil.pis },
                        { label: "CTPS",      value: perfil.ctps },
                        { label: "E-mail",    value: perfil.email },
                        { label: "Telefone",  value: perfil.telefone },
                        { label: "Dependentes", value: String(perfil.dependentes) },
                      ].map((item) => (
                        <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f3ff" }}>
                          <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>{item.label}</span>
                          <span style={{ fontSize: "0.8rem", color: "#07170d", fontWeight: 700 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="list-panel">
                    <div className="list-panel-header"><div><h2>Contrato</h2></div></div>
                    <div style={{ padding: "0.5rem 1rem 1rem", display: "grid", gap: 8 }}>
                      {[
                        { label: "Admissão",       value: new Date(perfil.admissao).toLocaleDateString("pt-BR") },
                        { label: "Cargo",          value: perfil.cargo },
                        { label: "Setor",          value: perfil.setor },
                        { label: "Salário base",   value: fmt(perfil.salario) },
                        { label: "Tipo contrato",  value: "CLT — Indeterminado" },
                        { label: "Jornada",        value: "44h semanais" },
                      ].map((item) => (
                        <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f5f3ff" }}>
                          <span style={{ fontSize: "0.8rem", color: "#6b7280", fontWeight: 600 }}>{item.label}</span>
                          <span style={{ fontSize: "0.8rem", color: "#07170d", fontWeight: 700 }}>{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ── Tabela de funcionários ── */
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Funcionário</TH>
                    <TH>CPF</TH>
                    <TH>Cargo / Setor</TH>
                    <TH>Admissão</TH>
                    <TH right>Salário</TH>
                    <TH>Status</TH>
                    <TH right>Ações</TH>
                  </tr>
                </thead>
                <tbody>
                  {funcionarios.map((f) => (
                    <tr key={f.id}>
                      <TD>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <Avatar nome={f.nome} size={34} />
                          <strong style={{ fontSize: "0.875rem" }}>{f.nome}</strong>
                        </div>
                      </TD>
                      <TD muted>{f.cpf}</TD>
                      <TD>
                        <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{f.cargo}</div>
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{f.setor}</div>
                      </TD>
                      <TD muted>{new Date(f.admissao).toLocaleDateString("pt-BR")}</TD>
                      <TD right><strong>{fmt(f.salario)}</strong></TD>
                      <TD><Badge {...S_FUNC[f.status]} /></TD>
                      <TD right>
                        <button className="small-action" onClick={() => setPerfil(f)} type="button">Ver perfil</button>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════════════════════
            ADMISSÃO (WIZARD 5 ETAPAS)
        ════════════════════════════ */}
        {tab === "admissao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Nova Admissão</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Etapa {admStep} de 5</p>
              </div>
            </div>

            {/* Stepper */}
            <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              {["Dados Pessoais", "Contrato", "Documentos", "Conferência", "eSocial"].map((label, i) => {
                const num = i + 1;
                const ativo = num === admStep;
                const concluido = num < admStep;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <button
                      onClick={() => setAdmStep(num)}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "0 8px", flex: 1 }}
                      type="button"
                    >
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: concluido ? "#7c3aed" : ativo ? "#ede9fe" : "#f3f4f6", color: concluido ? "#fff" : ativo ? "#7c3aed" : "#9ca3af", border: `2px solid ${ativo ? "#7c3aed" : concluido ? "#7c3aed" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800 }}>
                        {concluido ? "✓" : num}
                      </div>
                      <span style={{ fontSize: "0.7rem", fontWeight: ativo ? 700 : 500, color: ativo ? "#6b21a8" : "#9ca3af", textAlign: "center" }}>{label}</span>
                    </button>
                    {i < 4 && <div style={{ height: 2, flex: 1, background: concluido ? "#7c3aed" : "#e5e7eb", minWidth: 20 }} />}
                  </div>
                );
              })}
            </div>

            {/* Conteúdo por etapa */}
            <div style={{ background: "#faf5ff", borderRadius: 12, padding: "1.5rem", border: "1px solid #e9d5ff" }}>
              {admStep === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <SectionTitle>Dados Pessoais</SectionTitle>
                  <div />
                  {["Nome completo *", "CPF *", "RG", "Data de nascimento", "E-mail", "Telefone", "Endereço", "Cidade / UF"].map((f) => (
                    <label key={f} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>
                      {f}
                      <input className="input" placeholder={f.replace(" *", "")} />
                    </label>
                  ))}
                </div>
              )}
              {admStep === 2 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <SectionTitle>Dados do Contrato</SectionTitle>
                  <div />
                  {[["Cargo *", "text"], ["Setor", "text"], ["Data de admissão *", "date"], ["Salário base *", "text"], ["PIS/PASEP *", "text"], ["CTPS — Número/Série", "text"], ["Tipo de contrato", "text"], ["Jornada de trabalho", "text"]].map(([f, t]) => (
                    <label key={f} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>
                      {f}
                      <input className="input" placeholder={f.replace(" *", "")} type={t} />
                    </label>
                  ))}
                </div>
              )}
              {admStep === 3 && (
                <div>
                  <SectionTitle>Checklist de Documentos</SectionTitle>
                  <div style={{ display: "grid", gap: 8 }}>
                    {checklist.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setChecklist((prev) => prev.map((c) => c.id === item.id ? { ...c, feito: !c.feito } : c))}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: item.feito ? "#f5f3ff" : "#fff", border: `1px solid ${item.feito ? "#c4b5fd" : "#e9d5ff"}` }}
                      >
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.feito ? "#7c3aed" : "#c4b5fd"}`, background: item.feito ? "#7c3aed" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {item.feito && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                        </div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: item.feito ? "#6b21a8" : "#07170d", textDecoration: item.feito ? "line-through" : "none" }}>{item.label}</span>
                        <Badge {...(item.feito ? S_ADM.concluido : S_ADM.pendente)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {admStep === 4 && (
                <div>
                  <SectionTitle>Conferência Final</SectionTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    {[
                      { label: "Dados pessoais",     ok: true },
                      { label: "Contrato preenchido", ok: true },
                      { label: "Documentos recebidos", ok: checklist.filter((c) => c.feito).length >= 4 },
                      { label: "Exame admissional",   ok: false },
                      { label: "Contrato assinado",   ok: checklist.find((c) => c.id === "5")?.feito ?? false },
                      { label: "Dados bancários",     ok: false },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, background: item.ok ? "#f5f3ff" : "#fff7ed", border: `1px solid ${item.ok ? "#c4b5fd" : "#fcd34d"}` }}>
                        <span style={{ fontSize: "1rem" }}>{item.ok ? "✓" : "⚠"}</span>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: item.ok ? "#6b21a8" : "#92400e" }}>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {admStep === 5 && (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <SectionTitle>Envio ao eSocial</SectionTitle>
                  <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚡</div>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>
                    Ao confirmar, será gerado o evento <strong>S-2200 — Admissão de Trabalhador</strong> e enviado ao eSocial.
                  </p>
                  <button
                    onClick={() => { audit("Admissão iniciada", "Admissão", "S-2200 gerado para novo funcionário"); setTab("esocial"); }}
                    style={{ background: "linear-gradient(135deg, #7c3aed, #6b21a8)", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem 2rem", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }}
                    type="button"
                  >
                    ⚡ Gerar evento eSocial e concluir
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="small-action" disabled={admStep === 1} onClick={() => setAdmStep((s) => s - 1)} style={{ opacity: admStep === 1 ? 0.4 : 1 }} type="button">← Anterior</button>
              {admStep < 5 && <button onClick={() => setAdmStep((s) => s + 1)} type="button">Próximo →</button>}
            </div>
          </div>
        )}

        {/* ════════════════════════════
            FOLHA DE PAGAMENTO
        ════════════════════════════ */}
        {tab === "folha" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Folha de Pagamento</h2>
                <select className="input" onChange={(e) => setFolhaComp(e.target.value)} style={{ fontSize: 13 }} value={folhaComp}>
                  {["Jun/2026", "Mai/2026", "Abr/2026", "Mar/2026"].map((m) => <option key={m}>{m}</option>)}
                </select>
                <Badge {...(folhaStatus === "fechada" ? { bg: "#f0fdf4", color: "#166534", label: "Fechada" } : folhaStatus === "validada" ? { bg: "#fdf4ff", color: "#7e22ce", label: "Validada" } : folhaStatus === "calculada" ? { bg: "#eff6ff", color: "#1d4ed8", label: "Calculada" } : { bg: "#fffbeb", color: "#92400e", label: "Aberta" })} />
              </div>
              <button disabled={folhaStatus === "fechada"} onClick={avancarFolha} type="button">
                {folhaStatus === "aberta" ? "Calcular folha" : folhaStatus === "calculada" ? "Validar" : folhaStatus === "validada" ? "Encerrar folha" : "Encerrada"}
              </button>
            </div>

            {/* Fluxo */}
            <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              {FLUXO_FOLHA.map((etapa, i) => {
                const ORDEM: StatusFolha[] = ["aberta", "calculada", "validada", "fechada"];
                const idxAtual = ORDEM.indexOf(folhaStatus);
                const idxEtapa = ORDEM.indexOf(etapa.status);
                const ok = idxAtual > idxEtapa || (idxAtual === idxEtapa && i <= 1);
                return (
                  <div key={etapa.label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <div style={{ flex: 1, textAlign: "center", padding: "6px 4px" }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: ok ? "#7c3aed" : "#f3f4f6", color: ok ? "#fff" : "#9ca3af", margin: "0 auto 4px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800 }}>
                        {ok ? "✓" : i + 1}
                      </div>
                      <span style={{ fontSize: "0.68rem", color: ok ? "#6b21a8" : "#9ca3af", fontWeight: ok ? 700 : 400, display: "block" }}>{etapa.label}</span>
                    </div>
                    {i < FLUXO_FOLHA.length - 1 && <div style={{ height: 2, width: 24, background: ok ? "#7c3aed" : "#e5e7eb" }} />}
                  </div>
                );
              })}
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Total bruto",  value: fmt(totalBruto),  color: "#7c3aed" },
                { label: "Descontos",    value: fmt(totalInss + totalIrrf), color: "#b91c1c" },
                { label: "Líquido",      value: fmt(totalLiq),    color: "#065f46" },
                { label: "Encargos",     value: fmt(totalFgts + totalInssEmp), color: "#f59e0b" },
              ].map((k) => (
                <div key={k.label} style={{ background: "#faf5ff", border: "1px solid #e9d5ff", borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "0.875rem 1rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            {/* Tabela */}
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Funcionário</TH>
                  <TH right>Salário bruto</TH>
                  <TH right>INSS</TH>
                  <TH right>IRRF</TH>
                  <TH right>Outros desc.</TH>
                  <TH right>Líquido</TH>
                </tr>
              </thead>
              <tbody>
                {FOLHA_ITENS.map((f) => (
                  <tr key={f.id}>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar nome={f.nome} size={30} />
                        <strong style={{ fontSize: "0.85rem" }}>{f.nome}</strong>
                      </div>
                    </TD>
                    <TD right>{fmt(f.salarioBruto)}</TD>
                    <TD right muted>{fmt(f.inss)}</TD>
                    <TD right muted>{f.irrf > 0 ? fmt(f.irrf) : "—"}</TD>
                    <TD right muted>{f.outrosDescontos > 0 ? fmt(f.outrosDescontos) : "—"}</TD>
                    <TD right><strong style={{ color: "#065f46" }}>{fmt(f.liquido)}</strong></TD>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f5f3ff", borderTop: "2px solid #c4b5fd" }}>
                  <td style={{ padding: "0.8rem 0.875rem", fontWeight: 800, color: "#6b21a8" }}>Total</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 800 }}>{fmt(totalBruto)}</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 800, color: "#b91c1c" }}>{fmt(totalInss)}</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 800, color: "#b91c1c" }}>{fmt(totalIrrf)}</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 700, color: "#6f8f7c" }}>—</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 900, fontSize: "1rem", color: "#065f46" }}>{fmt(totalLiq)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ════════════════════════════
            FÉRIAS
        ════════════════════════════ */}
        {tab === "ferias" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Férias</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{ferias.length} períodos cadastrados</p>
              </div>
              <button type="button">+ Solicitar férias</button>
            </div>

            {/* Mini calendário visual Julho 2026 */}
            <div className="list-panel">
              <div className="list-panel-header"><div><h2>Calendário — Julho/2026</h2><p>Períodos de férias programados</p></div></div>
              <div style={{ padding: "0.75rem 1rem 1rem", display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, textAlign: "center" }}>
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} style={{ fontSize: "0.68rem", fontWeight: 800, color: "#9ca3af", padding: "4px 0" }}>{d}</div>
                ))}
                {/* Julho 2026 começa na Quarta = offset 3 */}
                {Array.from({ length: 3 }, (_, i) => <div key={`off${i}`} />)}
                {Array.from({ length: 31 }, (_, i) => {
                  const dia = i + 1;
                  const naFerias = dia >= 1 && dia <= 30; // Juliana
                  return (
                    <div key={dia} style={{ padding: "5px 2px", borderRadius: 6, background: naFerias ? "#ede9fe" : "transparent", fontSize: "0.75rem", fontWeight: naFerias ? 700 : 400, color: naFerias ? "#7c3aed" : "#374151" }}>
                      {dia}
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: "0 1rem 1rem", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 14, height: 14, borderRadius: 4, background: "#ede9fe" }} />
                <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>Juliana Costa — 01/07 a 30/07</span>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Funcionário</TH>
                  <TH>Período aquisitivo</TH>
                  <TH>Início</TH>
                  <TH>Fim</TH>
                  <TH>Dias</TH>
                  <TH>Status</TH>
                  <TH right>Ações</TH>
                </tr>
              </thead>
              <tbody>
                {ferias.map((f) => (
                  <tr key={f.id}>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar nome={f.nome} size={30} />
                        <strong style={{ fontSize: "0.85rem" }}>{f.nome}</strong>
                      </div>
                    </TD>
                    <TD muted>{f.periodoAquisitivo}</TD>
                    <TD muted>{f.inicio ? new Date(f.inicio).toLocaleDateString("pt-BR") : "—"}</TD>
                    <TD muted>{f.fim ? new Date(f.fim).toLocaleDateString("pt-BR") : "—"}</TD>
                    <TD muted>{f.dias}d</TD>
                    <TD><Badge {...S_FERIAS[f.status]} /></TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {f.status === "solicitada" && <button className="small-action" onClick={() => atualizarFerias(f.id, "aprovada")} type="button">Aprovar</button>}
                        {f.status === "aprovada"   && <button className="small-action" onClick={() => atualizarFerias(f.id, "programada")} type="button">Programar</button>}
                        {f.status === "programada" && <button className="small-action" onClick={() => atualizarFerias(f.id, "concluida")} type="button">Concluir</button>}
                        <button className="small-action" type="button">📄 Aviso</button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════
            RESCISÃO
        ════════════════════════════ */}
        {tab === "rescisao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Rescisão Contratual</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Etapa {rescisaoStep} de 4</p>
              </div>
            </div>

            {/* Stepper */}
            <div style={{ display: "flex", gap: 0 }}>
              {["Tipo / Funcionário", "Cálculo de Verbas", "Descontos", "Conferência"].map((label, i) => {
                const num = i + 1;
                const ok = num < rescisaoStep;
                const ativo = num === rescisaoStep;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", flex: 1 }}>
                    <button onClick={() => setRescisaoStep(num)} style={{ flex: 1, textAlign: "center", padding: "0 4px", background: "none", border: "none", cursor: "pointer" }} type="button">
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: ok ? "#7c3aed" : ativo ? "#ede9fe" : "#f3f4f6", color: ok ? "#fff" : ativo ? "#7c3aed" : "#9ca3af", border: `2px solid ${ativo || ok ? "#7c3aed" : "#e5e7eb"}`, margin: "0 auto 6px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.72rem", fontWeight: 800 }}>{ok ? "✓" : num}</div>
                      <span style={{ fontSize: "0.68rem", color: ativo ? "#6b21a8" : "#9ca3af", fontWeight: ativo ? 700 : 400 }}>{label}</span>
                    </button>
                    {i < 3 && <div style={{ height: 2, width: 24, background: ok ? "#7c3aed" : "#e5e7eb" }} />}
                  </div>
                );
              })}
            </div>

            <div style={{ background: "#faf5ff", borderRadius: 12, padding: "1.5rem", border: "1px solid #e9d5ff" }}>
              {rescisaoStep === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <SectionTitle>Dados da Rescisão</SectionTitle>
                  <div />
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>
                    Funcionário *
                    <select className="input">
                      <option value="">Selecione...</option>
                      {funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>
                    Tipo de rescisão *
                    <select className="input" onChange={(e) => setTipoRescisao(e.target.value as TipoRescisao)} value={tipoRescisao}>
                      <option value="sem_justa_causa">Dispensa sem justa causa</option>
                      <option value="com_justa_causa">Dispensa com justa causa</option>
                      <option value="pedido_demissao">Pedido de demissão</option>
                      <option value="comum_acordo">Distrato (acordo comum)</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>
                    Data do aviso prévio
                    <input className="input" type="date" />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>
                    Data da rescisão
                    <input className="input" type="date" />
                  </label>
                </div>
              )}
              {rescisaoStep === 2 && (
                <div>
                  <SectionTitle>Verbas Rescisórias</SectionTitle>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <TH>Verba</TH>
                        <TH right>Dias / Meses</TH>
                        <TH right>Valor</TH>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { verba: "Saldo de salário",          dias: "15 dias",  valor: 2900,  pagar: true },
                        { verba: "Aviso prévio indenizado",   dias: "30 dias",  valor: tipoRescisao === "sem_justa_causa" ? 5800 : 0, pagar: tipoRescisao === "sem_justa_causa" },
                        { verba: "13º proporcional",          dias: "6/12",     valor: 2900,  pagar: true },
                        { verba: "Férias proporcionais",      dias: "6/12",     valor: 900,   pagar: true },
                        { verba: "1/3 férias",                dias: "—",        valor: 300,   pagar: true },
                        { verba: "FGTS — multa 40%",          dias: "—",        valor: tipoRescisao === "sem_justa_causa" ? 1856 : 0, pagar: tipoRescisao === "sem_justa_causa" },
                      ].map((v) => (
                        <tr key={v.verba}>
                          <TD><span style={{ opacity: v.pagar ? 1 : 0.4 }}>{v.verba}</span></TD>
                          <TD right muted>{v.dias}</TD>
                          <TD right>
                            <strong style={{ color: v.pagar && v.valor > 0 ? "#065f46" : "#9ca3af" }}>
                              {v.pagar && v.valor > 0 ? fmt(v.valor) : "—"}
                            </strong>
                          </TD>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr style={{ background: "#f5f3ff", borderTop: "2px solid #c4b5fd" }}>
                        <td colSpan={2} style={{ padding: "0.8rem 0.875rem", fontWeight: 800, color: "#6b21a8" }}>Total bruto</td>
                        <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 900, color: "#065f46", fontSize: "1rem" }}>
                          {fmt(tipoRescisao === "sem_justa_causa" ? 14656 : 6100)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
              {rescisaoStep === 3 && (
                <div>
                  <SectionTitle>Descontos</SectionTitle>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr><TH>Desconto</TH><TH right>Valor</TH></tr></thead>
                    <tbody>
                      {[
                        { label: "INSS",             valor: 580 },
                        { label: "IRRF",             valor: 0 },
                        { label: "Vale transporte adiantado", valor: 110 },
                        { label: "Vale refeição adiantado",   valor: 290 },
                      ].map((d) => (
                        <tr key={d.label}>
                          <TD>{d.label}</TD>
                          <TD right muted>{d.valor > 0 ? fmt(d.valor) : "—"}</TD>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {rescisaoStep === 4 && (
                <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                  <SectionTitle>Conferência e Geração do TRCT</SectionTitle>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, textAlign: "left", marginBottom: "1.5rem" }}>
                    {[
                      { label: "Total de verbas",   valor: fmt(14656), ok: true },
                      { label: "Total descontos",   valor: fmt(980),   ok: true },
                      { label: "Valor líquido",     valor: fmt(13676), ok: true },
                      { label: "FGTS a sacar",      valor: fmt(4640 + 1856), ok: true },
                    ].map((item) => (
                      <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderRadius: 10, background: "#f5f3ff", border: "1px solid #c4b5fd" }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "#4b5563" }}>{item.label}</span>
                        <strong style={{ fontSize: "0.875rem", color: "#6b21a8" }}>{item.valor}</strong>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="small-action" type="button">📄 Gerar TRCT</button>
                    <button onClick={() => audit("Rescisão processada", "Rescisão", `${tipoRescisao} — TRCT gerado`)} type="button">✓ Confirmar rescisão</button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="small-action" disabled={rescisaoStep === 1} onClick={() => setRescisaoStep((s) => s - 1)} style={{ opacity: rescisaoStep === 1 ? 0.4 : 1 }} type="button">← Anterior</button>
              {rescisaoStep < 4 && <button onClick={() => setRescisaoStep((s) => s + 1)} type="button">Próximo →</button>}
            </div>
          </div>
        )}

        {/* ════════════════════════════
            eSOCIAL
        ════════════════════════════ */}
        {tab === "esocial" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>eSocial</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Eventos, transmissões e protocolos</p>
              </div>
              <button type="button">+ Novo evento</button>
            </div>

            {/* Cards resumo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {(["fila", "processando", "transmitido", "erro"] as StatusEsocial[]).map((s) => {
                const count = esocial.filter((e) => e.status === s).length;
                const cfg = S_ESOCIAL[s];
                return (
                  <div key={s} style={{ background: cfg.bg, border: `1px solid ${cfg.color}22`, borderRadius: 10, padding: "0.875rem 1rem" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: cfg.color, textTransform: "uppercase" }}>{cfg.label}</p>
                    <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: cfg.color }}>{count}</p>
                  </div>
                );
              })}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Evento</TH>
                  <TH>Funcionário</TH>
                  <TH>Data</TH>
                  <TH>Status</TH>
                  <TH>Protocolo</TH>
                  <TH>Obs</TH>
                  <TH right>Ações</TH>
                </tr>
              </thead>
              <tbody>
                {esocial.map((e) => (
                  <tr key={e.id}>
                    <TD><strong style={{ fontSize: "0.82rem" }}>{e.tipo}</strong></TD>
                    <TD muted>{e.funcionario}</TD>
                    <TD muted>{new Date(e.data).toLocaleDateString("pt-BR")}</TD>
                    <TD><Badge {...S_ESOCIAL[e.status]} /></TD>
                    <TD muted>
                      {e.protocolo
                        ? <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{e.protocolo}</span>
                        : "—"}
                    </TD>
                    <TD muted>{e.obs}</TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {e.status === "fila" && <button className="small-action" onClick={() => audit("eSocial transmitido", "eSocial", e.tipo)} type="button">⚡ Transmitir</button>}
                        {e.status === "erro" && <button className="small-action" type="button">↺ Retentar</button>}
                        {e.status === "transmitido" && <button className="small-action" type="button">📄 Recibo</button>}
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ════════════════════════════
            ENCARGOS
        ════════════════════════════ */}
        {tab === "encargos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Encargos Trabalhistas</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Competência: {folhaComp}</p></div>
              <button type="button">Gerar guias</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Encargo</TH>
                  <TH>Base de cálculo</TH>
                  <TH>Alíquota</TH>
                  <TH right>Valor</TH>
                  <TH>Vencimento</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {[
                  { nome: "INSS — Empregador (20%)",   base: fmt(totalBruto), aliq: "20%",  val: totalInssEmp, venc: "20/07/2026", status: "pendente" },
                  { nome: "INSS — Empregado",          base: fmt(totalBruto), aliq: "~9%",  val: totalInss,   venc: "20/07/2026", status: "pendente" },
                  { nome: "FGTS (8%)",                  base: fmt(totalBruto), aliq: "8%",   val: totalFgts,   venc: "20/07/2026", status: "pendente" },
                  { nome: "IRRF",                       base: "Tabela prog.", aliq: "—",    val: totalIrrf,   venc: "20/07/2026", status: "pendente" },
                  { nome: "RAT / FAP (2%)",             base: fmt(totalBruto), aliq: "2%",   val: totalBruto * 0.02, venc: "20/07/2026", status: "pendente" },
                  { nome: "Terceiros / Sistema S",      base: fmt(totalBruto), aliq: "5,8%", val: totalBruto * 0.058, venc: "20/07/2026", status: "pendente" },
                ].map((enc) => (
                  <tr key={enc.nome}>
                    <TD><strong style={{ fontSize: "0.85rem" }}>{enc.nome}</strong></TD>
                    <TD muted>{enc.base}</TD>
                    <TD muted>{enc.aliq}</TD>
                    <TD right><strong style={{ color: "#7c3aed" }}>{fmt(enc.val)}</strong></TD>
                    <TD muted>{enc.venc}</TD>
                    <TD><Badge bg="#fffbeb" color="#92400e" label={enc.status} /></TD>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f5f3ff", borderTop: "2px solid #c4b5fd" }}>
                  <td colSpan={3} style={{ padding: "0.8rem 0.875rem", fontWeight: 800, color: "#6b21a8" }}>Total encargos</td>
                  <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 900, color: "#6b21a8", fontSize: "1rem" }}>
                    {fmt(totalInssEmp + totalFgts + totalIrrf + totalBruto * 0.02 + totalBruto * 0.058)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* ════════════════════════════
            BENEFÍCIOS
        ════════════════════════════ */}
        {tab === "beneficios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Benefícios</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Gestão de benefícios corporativos</p></div>
              <button type="button">+ Novo benefício</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {BENEFICIOS.map((b) => (
                <div key={b.id} style={{ background: b.ativo ? "#faf5ff" : "#f9fafb", border: `1px solid ${b.ativo ? "#e9d5ff" : "#e5e7eb"}`, borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                    <div>
                      <p style={{ margin: "0 0 3px", fontWeight: 800, fontSize: "0.9rem", color: b.ativo ? "#07170d" : "#9ca3af" }}>{b.nome}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af", textTransform: "uppercase", fontWeight: 700 }}>{b.tipo}</p>
                    </div>
                    <Badge {...(b.ativo ? { bg: "#ede9fe", color: "#7c3aed", label: "Ativo" } : { bg: "#f3f4f6", color: "#9ca3af", label: "Inativo" })} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700 }}>VALOR / FUNC.</p>
                      <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#7c3aed" }}>{fmt(b.valor)}</p>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: "0 0 2px", fontSize: "0.68rem", color: "#9ca3af", fontWeight: 700 }}>FUNCIONÁRIOS</p>
                      <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: "#07170d" }}>{b.funcionarios}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════
            DOCUMENTOS
        ════════════════════════════ */}
        {tab === "documentos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Documentos</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Contratos, recibos, atestados e férias</p></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {[
                { cat: "contratos",  label: "Contratos",         icon: "📋", accept: ".pdf,.docx" },
                { cat: "recibos",    label: "Recibos de Férias",  icon: "📄", accept: ".pdf" },
                { cat: "atestados",  label: "Atestados Médicos",  icon: "🏥", accept: ".pdf,.jpg,.png" },
                { cat: "folhas",     label: "Holerites / Recibos de Salário", icon: "💰", accept: ".pdf" },
              ].map((cat) => (
                <div
                  key={cat.cat}
                  onDragLeave={() => setDragCat(null)}
                  onDragOver={(e) => { e.preventDefault(); setDragCat(cat.cat); }}
                  onDrop={(e) => { e.preventDefault(); setDragCat(null); audit("Arquivo enviado", "Documentos", `${cat.label} — ${e.dataTransfer.files[0]?.name ?? "arquivo"}`); }}
                  style={{ border: `2px dashed ${dragCat === cat.cat ? "#7c3aed" : "#d8d3f0"}`, borderRadius: 12, padding: "1.5rem", cursor: "pointer", background: dragCat === cat.cat ? "#f5f3ff" : "#faf5ff", textAlign: "center", transition: "all 0.15s" }}
                >
                  <input accept={cat.accept} ref={(el) => { fileRefs.current[cat.cat] = el; }} style={{ display: "none" }} type="file" onChange={(e) => { if (e.target.files?.[0]) audit("Arquivo enviado", "Documentos", `${cat.label} — ${e.target.files[0].name}`); }} />
                  <div style={{ fontSize: "2rem", marginBottom: 8 }}>{cat.icon}</div>
                  <p style={{ margin: "0 0 4px", fontWeight: 800, fontSize: "0.875rem", color: "#6b21a8" }}>{cat.label}</p>
                  <p style={{ margin: "0 0 12px", fontSize: "0.75rem", color: "#9ca3af" }}>Arraste ou clique para enviar</p>
                  <button
                    className="small-action"
                    onClick={() => fileRefs.current[cat.cat]?.click()}
                    type="button"
                  >
                    Selecionar arquivo
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════
            CALENDÁRIO
        ════════════════════════════ */}
        {tab === "calendario" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Calendário DP — Julho/2026</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Obrigações e eventos trabalhistas</p></div>

            {/* Legenda */}
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {Object.entries({ folha: "Folha/Salários", fgts: "FGTS", inss: "INSS", ferias: "Férias", esocial: "eSocial", rescisao: "Rescisão" }).map(([tipo, label]) => (
                <div key={tipo} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#374151" }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: COR_CAL[tipo] }} />
                  {label}
                </div>
              ))}
            </div>

            {/* Grid do calendário */}
            <div style={{ background: "#fff", border: "1px solid #e9e4f7", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", background: "#f5f3ff" }}>
                {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
                  <div key={d} style={{ padding: "10px 0", textAlign: "center", fontSize: "0.72rem", fontWeight: 800, color: "#6b21a8" }}>{d}</div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
                {Array.from({ length: 3 }, (_, i) => (
                  <div key={`off${i}`} style={{ minHeight: 80, border: "1px solid #f5f3ff", background: "#faf9ff" }} />
                ))}
                {Array.from({ length: 31 }, (_, i) => {
                  const dia = i + 1;
                  const evs = DIAS_JUN.filter((d) => d.dia === dia).flatMap((d) => d.eventos);
                  const hoje = dia === 18;
                  return (
                    <div key={dia} style={{ minHeight: 80, border: "1px solid #f0eeff", padding: "6px 8px", background: hoje ? "#f5f3ff" : "#fff" }}>
                      <div style={{ fontSize: "0.78rem", fontWeight: hoje ? 800 : 500, color: hoje ? "#7c3aed" : "#374151", marginBottom: 4 }}>{dia}</div>
                      {evs.map((ev, j) => (
                        <div key={j} style={{ background: COR_CAL[ev.tipo], color: "#fff", borderRadius: 4, padding: "2px 5px", fontSize: "0.65rem", fontWeight: 700, marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {ev.label}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════
            HISTÓRICO / AUDITORIA
        ════════════════════════════ */}
        {tab === "historico" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Histórico de Auditoria</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{log.length} registros — toda ação gera auditoria</p>
              </div>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#7c3aed", background: "#ede9fe", borderRadius: 999, padding: "3px 10px", border: "1px solid #c4b5fd" }}>⚡ Tempo real</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Data / Hora</TH>
                  <TH>Usuário</TH>
                  <TH>Ação</TH>
                  <TH>Módulo</TH>
                  <TH>Detalhe</TH>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={entry.id}>
                    <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{new Date(entry.data).toLocaleString("pt-BR")}</span></TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: entry.usuario === "Sistema" ? "#f3f4f6" : "#ede9fe", color: entry.usuario === "Sistema" ? "#6b7280" : "#7c3aed", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0 }}>
                          {entry.usuario === "Sistema" ? "SYS" : entry.usuario.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{entry.usuario}</span>
                      </div>
                    </TD>
                    <TD><span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#7c3aed" }}>{entry.acao}</span></TD>
                    <TD muted>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#f5f3ff", color: "#6b21a8", borderRadius: 999, padding: "2px 8px" }}>{entry.modulo}</span>
                    </TD>
                    <TD muted>{entry.detalhe}</TD>
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
