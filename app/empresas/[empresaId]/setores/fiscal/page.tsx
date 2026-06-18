"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type StatusObrigacao =
  | "pendente" | "em_andamento" | "aguardando_cliente"
  | "em_revisao" | "transmitido" | "concluido" | "atrasado";

type Prioridade = "alta" | "media" | "baixa";

type Obrigacao = {
  id: string;
  nome: string;
  competencia: string;
  vencimento: string;
  responsavel: string;
  prioridade: Prioridade;
  status: StatusObrigacao;
  tipo: "federal" | "estadual" | "municipal" | "previdenciario";
};

type Imposto = {
  id: string;
  nome: string;
  base: number;
  aliquota: string;
  valor: number;
  obs: string;
  ativo: boolean;
};

type Guia = {
  id: string;
  nome: string;
  competencia: string;
  vencimento: string;
  valor: number;
  status: "pendente" | "emitida" | "enviada" | "paga" | "vencida";
  codigoBarra?: string;
};

type Certidao = {
  esfera: "federal" | "estadual" | "municipal";
  nome: string;
  validade: string | null;
  status: "valida" | "vencida" | "solicitada" | "nao_solicitada";
  numero: string | null;
};

type LogAuditoria = {
  id: string;
  data: string;
  usuario: string;
  acao: string;
  modulo: string;
  detalhe: string;
  ip: string;
};

type SpedArquivo = {
  id: string;
  tipo: string;
  competencia: string;
  status: "pendente" | "gerado" | "validado" | "transmitido" | "erro";
  protocolo: string | null;
  dataEnvio: string | null;
  tamanho: string;
};

type ItemChecklist = { id: string; label: string; feito: boolean; responsavel: string };

type Tab = "visao_geral" | "obrigacoes" | "apuracao" | "guias" | "sped" | "certidoes" | "historico";

/* ─── Ícone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M9 14l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
    <path d="M14 2v6h6" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

/* ─── Dados mock ──────────────────────────────────────────────── */

const OBRIGACOES_INIT: Obrigacao[] = [
  { id: "1", nome: "DAS — Simples Nacional", competencia: "Jun/2026", vencimento: "20/07/2026", responsavel: "Ana Lima", prioridade: "alta", status: "pendente", tipo: "federal" },
  { id: "2", nome: "DCTF Mensal", competencia: "Mai/2026", vencimento: "15/07/2026", responsavel: "Carlos Silva", prioridade: "alta", status: "em_andamento", tipo: "federal" },
  { id: "3", nome: "EFD-Contribuições", competencia: "Mai/2026", vencimento: "10/07/2026", responsavel: "Ana Lima", prioridade: "media", status: "aguardando_cliente", tipo: "federal" },
  { id: "4", nome: "SPED Fiscal (EFD-ICMS/IPI)", competencia: "Mai/2026", vencimento: "15/08/2026", responsavel: "Marcos Souza", prioridade: "alta", status: "em_revisao", tipo: "estadual" },
  { id: "5", nome: "DEFIS — Declaração Simples", competencia: "2025", vencimento: "31/03/2026", responsavel: "Carlos Silva", prioridade: "baixa", status: "concluido", tipo: "federal" },
  { id: "6", nome: "DIRF", competencia: "2025", vencimento: "28/02/2026", responsavel: "Ana Lima", prioridade: "media", status: "transmitido", tipo: "federal" },
  { id: "7", nome: "Nota Fiscal de Serviços (NFS-e)", competencia: "Jun/2026", vencimento: "05/07/2026", responsavel: "Ana Lima", prioridade: "media", status: "concluido", tipo: "municipal" },
  { id: "8", nome: "INSS (GPS)", competencia: "Jun/2026", vencimento: "20/07/2026", responsavel: "Marcos Souza", prioridade: "alta", status: "pendente", tipo: "previdenciario" },
];

const IMPOSTOS_INIT: Imposto[] = [
  { id: "1", nome: "IRPJ", base: 0, aliquota: "15%", valor: 0, obs: "Lucro Real — estimativa mensal", ativo: true },
  { id: "2", nome: "CSLL", base: 0, aliquota: "9%", valor: 0, obs: "", ativo: true },
  { id: "3", nome: "PIS", base: 0, aliquota: "0,65%", valor: 0, obs: "Regime cumulativo", ativo: true },
  { id: "4", nome: "COFINS", base: 0, aliquota: "3%", valor: 0, obs: "Regime cumulativo", ativo: true },
  { id: "5", nome: "ISS", base: 0, aliquota: "2%", valor: 0, obs: "Alíquota municipal", ativo: true },
  { id: "6", nome: "ICMS", base: 0, aliquota: "18%", valor: 0, obs: "Regime Normal", ativo: false },
  { id: "7", nome: "IPI", base: 0, aliquota: "0%", valor: 0, obs: "Não aplicável — serviços", ativo: false },
  { id: "8", nome: "Simples Nacional (DAS)", base: 12000, aliquota: "6%", valor: 720, obs: "Anexo III — Serviços", ativo: true },
];

const GUIAS_INIT: Guia[] = [
  { id: "1", nome: "DAS — Simples Nacional", competencia: "Jun/2026", vencimento: "20/07/2026", valor: 720, status: "emitida", codigoBarra: "85890000001-4 72000000000-7 00000000000-6 11111111111-1" },
  { id: "2", nome: "DARF — IRPJ Estimativa", competencia: "Jun/2026", vencimento: "31/07/2026", valor: 0, status: "pendente" },
  { id: "3", nome: "GPS — INSS", competencia: "Jun/2026", vencimento: "20/07/2026", valor: 1200, status: "enviada" },
  { id: "4", nome: "DAS — Simples Nacional", competencia: "Mai/2026", vencimento: "20/06/2026", valor: 685, status: "paga" },
  { id: "5", nome: "GPS — INSS", competencia: "Mai/2026", vencimento: "20/06/2026", valor: 1150, status: "paga" },
  { id: "6", nome: "DARF — PIS/COFINS", competencia: "Abr/2026", vencimento: "25/05/2026", valor: 0, status: "vencida" },
];

const CERTIDOES_INIT: Certidao[] = [
  { esfera: "federal", nome: "CND Federal (Receita + PGFN)", validade: "2026-09-10", status: "valida", numero: "CND-2026-0001" },
  { esfera: "federal", nome: "CRF — FGTS", validade: "2026-07-01", status: "valida", numero: "CRF-2026-0087" },
  { esfera: "estadual", nome: "Certidão Estadual — SEFAZ", validade: null, status: "nao_solicitada", numero: null },
  { esfera: "municipal", nome: "Certidão Municipal — ISS", validade: "2026-06-15", status: "vencida", numero: "ISS-2025-0423" },
];

const SPED_INIT: SpedArquivo[] = [
  { id: "1", tipo: "EFD-Contribuições (PIS/COFINS)", competencia: "Mai/2026", status: "transmitido", protocolo: "PRO-2026-PIS-000123", dataEnvio: "2026-06-10T14:32:00", tamanho: "1,2 MB" },
  { id: "2", tipo: "SPED Fiscal (EFD-ICMS/IPI)", competencia: "Mai/2026", status: "validado", protocolo: null, dataEnvio: null, tamanho: "3,8 MB" },
  { id: "3", tipo: "ECD (Escrituração Contábil Digital)", competencia: "2025", status: "transmitido", protocolo: "PRO-2026-ECD-000044", dataEnvio: "2026-03-15T09:00:00", tamanho: "8,4 MB" },
  { id: "4", tipo: "ECF (Escrituração Contábil Fiscal)", competencia: "2025", status: "pendente", protocolo: null, dataEnvio: null, tamanho: "—" },
];

const LOG_INIT: LogAuditoria[] = [
  { id: "1", data: "2026-06-18T14:30:00", usuario: "Ana Lima", acao: "Status alterado", modulo: "Obrigações", detalhe: "DAS Jun/2026: pendente → em_andamento", ip: "192.168.1.10" },
  { id: "2", data: "2026-06-17T10:15:00", usuario: "Carlos Silva", acao: "Guia emitida", modulo: "Guias", detalhe: "DAS — Simples Nacional Jun/2026 — R$ 720,00", ip: "192.168.1.11" },
  { id: "3", data: "2026-06-15T16:45:00", usuario: "Marcos Souza", acao: "SPED gerado", modulo: "SPED", detalhe: "EFD-Contribuições Mai/2026 — 1,2 MB", ip: "192.168.1.12" },
  { id: "4", data: "2026-06-14T09:00:00", usuario: "Ana Lima", acao: "Obrigação criada", modulo: "Obrigações", detalhe: "INSS (GPS) Jun/2026 — vencimento 20/07/2026", ip: "192.168.1.10" },
  { id: "5", data: "2026-06-10T11:20:00", usuario: "Carlos Silva", acao: "Transmissão", modulo: "SPED", detalhe: "EFD-Contribuições Mai/2026 — protocolo PRO-2026-PIS-000123", ip: "192.168.1.11" },
  { id: "6", data: "2026-06-08T08:00:00", usuario: "Sistema", acao: "Automação disparada", modulo: "Sistema", detalhe: "Competência Jun/2026 aberta — 3 tarefas geradas automaticamente", ip: "—" },
];

const CHECKLIST_INIT: ItemChecklist[] = [
  { id: "1", label: "Receber documentos do cliente (notas, extratos, contratos)", feito: true, responsavel: "Ana Lima" },
  { id: "2", label: "Conciliar movimentações bancárias", feito: true, responsavel: "Carlos Silva" },
  { id: "3", label: "Calcular tributos da competência", feito: false, responsavel: "Ana Lima" },
  { id: "4", label: "Conferir cálculos com supervisor", feito: false, responsavel: "Marcos Souza" },
  { id: "5", label: "Emitir guias (DAS, GPS, DARF)", feito: false, responsavel: "Ana Lima" },
  { id: "6", label: "Enviar guias ao cliente para pagamento", feito: false, responsavel: "Ana Lima" },
  { id: "7", label: "Transmitir obrigações acessórias (DCTF, EFD)", feito: false, responsavel: "Carlos Silva" },
  { id: "8", label: "Registrar pagamentos confirmados", feito: false, responsavel: "Carlos Silva" },
  { id: "9", label: "Arquivar documentação do mês", feito: false, responsavel: "Marcos Souza" },
];

/* ─── Configurações visuais ───────────────────────────────────── */

const STATUS_OBR: Record<StatusObrigacao, { bg: string; color: string; label: string }> = {
  pendente:           { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
  em_andamento:       { bg: "#eff6ff", color: "#1d4ed8", label: "Em andamento" },
  aguardando_cliente: { bg: "#fdf4ff", color: "#7e22ce", label: "Aguard. cliente" },
  em_revisao:         { bg: "#fff7ed", color: "#c2410c", label: "Em revisão" },
  transmitido:        { bg: "#ecfdf5", color: "#065f46", label: "Transmitido" },
  concluido:          { bg: "#f0fdf4", color: "#166534", label: "Concluído" },
  atrasado:           { bg: "#fef2f2", color: "#b91c1c", label: "Atrasado" },
};

const PRIO: Record<Prioridade, { color: string; label: string }> = {
  alta:  { color: "#ef4444", label: "Alta" },
  media: { color: "#f59e0b", label: "Média" },
  baixa: { color: "#10b981", label: "Baixa" },
};

const STATUS_GUIA: Record<Guia["status"], { bg: string; color: string; label: string }> = {
  pendente: { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
  emitida:  { bg: "#eff6ff", color: "#1d4ed8", label: "Emitida" },
  enviada:  { bg: "#fdf4ff", color: "#7e22ce", label: "Enviada" },
  paga:     { bg: "#f0fdf4", color: "#166534", label: "Paga" },
  vencida:  { bg: "#fef2f2", color: "#b91c1c", label: "Vencida" },
};

const STATUS_SPED: Record<SpedArquivo["status"], { bg: string; color: string; label: string }> = {
  pendente:    { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
  gerado:      { bg: "#eff6ff", color: "#1d4ed8", label: "Gerado" },
  validado:    { bg: "#fff7ed", color: "#c2410c", label: "Validado" },
  transmitido: { bg: "#f0fdf4", color: "#166534", label: "Transmitido" },
  erro:        { bg: "#fef2f2", color: "#b91c1c", label: "Erro" },
};

const STATUS_CERT: Record<Certidao["status"], { bg: string; color: string; label: string; icon: string }> = {
  valida:         { bg: "#f0fdf4", color: "#166534", label: "Válida", icon: "✓" },
  vencida:        { bg: "#fef2f2", color: "#b91c1c", label: "Vencida", icon: "✕" },
  solicitada:     { bg: "#eff6ff", color: "#1d4ed8", label: "Solicitada", icon: "⏳" },
  nao_solicitada: { bg: "#f3f4f6", color: "#6b7280", label: "Não solicitada", icon: "—" },
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "visao_geral",  label: "Visão Geral",  icon: "◉" },
  { id: "obrigacoes",   label: "Obrigações",   icon: "☑" },
  { id: "apuracao",     label: "Apuração",     icon: "%" },
  { id: "guias",        label: "Guias",        icon: "₿" },
  { id: "sped",         label: "SPED",         icon: "⚡" },
  { id: "certidoes",    label: "Certidões",    icon: "⊕" },
  { id: "historico",    label: "Histórico",    icon: "⌛" },
];

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Badge({ cfg }: { cfg: { bg: string; color: string; label: string } }) {
  return (
    <span style={{ display: "inline-block", background: cfg.bg, color: cfg.color, borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>
      {cfg.label}
    </span>
  );
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{ textAlign: right ? "right" : "left", padding: "0.7rem 0.875rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.73rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8f0eb" }}>
      {children}
    </th>
  );
}

function TD({ children, right, muted }: { children: React.ReactNode; right?: boolean; muted?: boolean }) {
  return (
    <td style={{ padding: "0.8rem 0.875rem", textAlign: right ? "right" : "left", color: muted ? "#6f8f7c" : "#07170d", fontSize: "0.875rem", borderBottom: "1px solid #f0f7f3" }}>
      {children}
    </td>
  );
}

/* ─── Componente principal ────────────────────────────────────── */

export default function FiscalPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [tab, setTab] = useState<Tab>("visao_geral");
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>(OBRIGACOES_INIT);
  const [impostos] = useState<Imposto[]>(IMPOSTOS_INIT);
  const [guias, setGuias] = useState<Guia[]>(GUIAS_INIT);
  const [certidoes] = useState<Certidao[]>(CERTIDOES_INIT);
  const [sped] = useState<SpedArquivo[]>(SPED_INIT);
  const [log, setLog] = useState<LogAuditoria[]>(LOG_INIT);
  const [checklist, setChecklist] = useState<ItemChecklist[]>(CHECKLIST_INIT);
  const [filtroStatusOb, setFiltroStatusOb] = useState<string>("");
  const [filtroPrioOb, setFiltroPrioOb] = useState<string>("");
  const [periodoApuracao, setPeriodoApuracao] = useState("Jun/2026");
  const [registrandoPag, setRegistrandoPag] = useState<string | null>(null);

  /* ── Auditoria ── */
  function auditoria(acao: string, modulo: string, detalhe: string) {
    const entry: LogAuditoria = {
      id: crypto.randomUUID(),
      data: new Date().toISOString(),
      usuario: "Usuário Atual",
      acao,
      modulo,
      detalhe,
      ip: "—",
    };
    setLog((prev) => [entry, ...prev]);
  }

  /* ── Obrigações ── */
  function mudarStatus(id: string, novoStatus: StatusObrigacao) {
    setObrigacoes((prev) =>
      prev.map((ob) => {
        if (ob.id !== id) return ob;
        auditoria("Status alterado", "Obrigações", `${ob.nome}: ${ob.status} → ${novoStatus}`);
        return { ...ob, status: novoStatus };
      })
    );
  }

  /* ── Guias ── */
  function emitirGuia(id: string) {
    const guia = guias.find((g) => g.id === id);
    if (!guia) return;
    setGuias((prev) => prev.map((g) => g.id === id ? { ...g, status: "emitida" } : g));
    auditoria("Guia emitida", "Guias", `${guia.nome} ${guia.competencia} — ${fmt(guia.valor)}`);
  }

  function enviarCliente(id: string) {
    const guia = guias.find((g) => g.id === id);
    if (!guia) return;
    setGuias((prev) => prev.map((g) => g.id === id ? { ...g, status: "enviada" } : g));
    auditoria("Guia enviada ao cliente", "Guias", `${guia.nome} ${guia.competencia}`);
  }

  function registrarPagamento(id: string) {
    const guia = guias.find((g) => g.id === id);
    if (!guia) return;
    setGuias((prev) => prev.map((g) => g.id === id ? { ...g, status: "paga" } : g));
    auditoria("Pagamento registrado", "Guias", `${guia.nome} ${guia.competencia} — ${fmt(guia.valor)}`);
    setRegistrandoPag(null);
  }

  /* ── Checklist ── */
  function toggleChecklist(id: string) {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const novoEstado = !item.feito;
        auditoria(novoEstado ? "Checklist marcado" : "Checklist desmarcado", "Checklist", item.label);
        return { ...item, feito: novoEstado };
      })
    );
  }

  /* ── Stats dinâmicos ── */
  const pendentes = obrigacoes.filter((o) => ["pendente", "em_andamento", "aguardando_cliente", "em_revisao"].includes(o.status)).length;
  const entregues = obrigacoes.filter((o) => ["transmitido", "concluido"].includes(o.status)).length;
  const aVencer = obrigacoes.filter((o) => o.status === "pendente").length;
  const guiasEmitidas = guias.filter((g) => ["emitida", "enviada", "paga"].includes(g.status)).length;
  const totalImpostos = impostos.filter((i) => i.ativo).reduce((acc, i) => acc + i.valor, 0);
  const checkFeitos = checklist.filter((c) => c.feito).length;

  /* ── Filtros obrigações ── */
  const obsFiltradas = obrigacoes.filter((ob) => {
    const matchStatus = !filtroStatusOb || ob.status === filtroStatusOb;
    const matchPrio = !filtroPrioOb || ob.prioridade === filtroPrioOb;
    return matchStatus && matchPrio;
  });

  return (
    <SetorShell
      borda="#6ee7b7"
      cor="#065f46"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#ecfdf5"
      icone={ICONE}
      setorNome="Setor Fiscal"
      setorResumo="Apuração, obrigações tributárias, guias e escrituração digital"
      stats={[
        { label: "Pendentes", value: String(pendentes), cor: "#fbbf24" },
        { label: "Entregues", value: String(entregues), cor: "#34d399" },
        { label: "Guias emitidas", value: String(guiasEmitidas), cor: "#fff" },
        { label: "Impostos est.", value: fmt(totalImpostos), cor: "#fff" },
      ]}
    >
      {/* ── Tabs internas ── */}
      <div style={{ background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid var(--border)", borderBottom: "none" }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 8px" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #10b981" : "2px solid transparent",
                color: tab === t.id ? "#065f46" : "#6f8f7c",
                cursor: "pointer",
                fontWeight: tab === t.id ? 800 : 500,
                fontSize: "0.82rem",
                padding: "0.9rem 1rem",
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                marginBottom: -2,
                transition: "color 0.15s",
              }}
              type="button"
            >
              <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

        {/* ════════════════════════════════════════
            TAB: VISÃO GERAL
        ════════════════════════════════════════ */}
        {tab === "visao_geral" && (
          <div style={{ display: "grid", gap: "1.25rem" }}>

            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
              {[
                { label: "Obrigações pendentes", value: pendentes, color: "#fbbf24", bg: "#fffbeb" },
                { label: "Entregues no mês", value: entregues, color: "#10b981", bg: "#f0fdf4" },
                { label: "A vencer (7 dias)", value: aVencer, color: "#f59e0b", bg: "#fff7ed" },
                { label: "Guias emitidas", value: guiasEmitidas, color: "#3b82f6", bg: "#eff6ff" },
                { label: "Impostos estimados", value: fmt(totalImpostos), color: "#065f46", bg: "#ecfdf5" },
              ].map((kpi) => (
                <div key={kpi.label} style={{ background: kpi.bg, border: `1px solid ${kpi.color}22`, borderRadius: 12, padding: "1rem 1.25rem", borderTop: `3px solid ${kpi.color}` }}>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{kpi.label}</p>
                  <p style={{ margin: 0, fontSize: typeof kpi.value === "number" ? "1.75rem" : "1.1rem", fontWeight: 800, color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>

              {/* Checklist mensal */}
              <div className="list-panel">
                <div className="list-panel-header">
                  <div>
                    <h2>Checklist mensal</h2>
                    <p>{checkFeitos} de {checklist.length} tarefas concluídas — {periodoApuracao}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>
                      {Math.round((checkFeitos / checklist.length) * 100)}%
                    </div>
                    <div style={{ width: 80, height: 6, background: "#e8f0eb", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ width: `${(checkFeitos / checklist.length) * 100}%`, height: "100%", background: "#10b981", borderRadius: 999, transition: "width 0.3s" }} />
                    </div>
                  </div>
                </div>
                <div style={{ padding: "0.5rem 1rem 1rem", display: "flex", flexDirection: "column", gap: 6 }}>
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklist(item.id)}
                      style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 10px", borderRadius: 8, cursor: "pointer", background: item.feito ? "#f0fdf4" : "#fff", border: `1px solid ${item.feito ? "#bbf7d0" : "#e8f0eb"}`, transition: "all 0.15s" }}
                    >
                      <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${item.feito ? "#10b981" : "#c9dbd1"}`, background: item.feito ? "#10b981" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        {item.feito && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: item.feito ? "#6f8f7c" : "#07170d", textDecoration: item.feito ? "line-through" : "none" }}>{item.label}</p>
                        <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{item.responsavel}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {/* Próximas obrigações */}
                <div className="list-panel">
                  <div className="list-panel-header">
                    <div><h2>Próximas obrigações</h2><p>Vencimentos em aberto</p></div>
                    <button className="small-action" onClick={() => setTab("obrigacoes")} type="button">Ver todas</button>
                  </div>
                  <div style={{ padding: "0 12px 12px" }}>
                    {obrigacoes.filter((o) => !["transmitido", "concluido"].includes(o.status)).slice(0, 4).map((ob) => (
                      <div key={ob.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid #f0f7f3" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#07170d" }}>{ob.nome}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{ob.competencia}</p>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: "0.75rem", color: "#374151", fontWeight: 600 }}>{ob.vencimento}</span>
                          <Badge cfg={STATUS_OBR[ob.status]} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Automações */}
                <div className="list-panel">
                  <div className="list-panel-header">
                    <div><h2>Automações ativas</h2><p>Regras configuradas</p></div>
                  </div>
                  <div style={{ padding: "0.5rem 1rem 1rem", display: "flex", flexDirection: "column", gap: 8 }}>
                    {[
                      { icon: "⚡", label: "Abrir competência", desc: "Cria tarefas automaticamente ao iniciar novo mês", ativo: true },
                      { icon: "🔔", label: "Vencimento próximo", desc: "Notifica 7 dias antes do prazo", ativo: true },
                      { icon: "✅", label: "Documento enviado", desc: "Valida e atualiza status automaticamente", ativo: false },
                    ].map((auto) => (
                      <div key={auto.label} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "8px 10px", borderRadius: 8, background: auto.ativo ? "#f0fdf4" : "#f9fafb", border: `1px solid ${auto.ativo ? "#bbf7d0" : "#e5e7eb"}` }}>
                        <span style={{ fontSize: "1rem" }}>{auto.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 700, color: "#07170d" }}>{auto.label}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#6b7280" }}>{auto.desc}</p>
                        </div>
                        <span style={{ fontSize: "0.7rem", fontWeight: 800, color: auto.ativo ? "#065f46" : "#9ca3af", background: auto.ativo ? "#dcfce7" : "#f3f4f6", borderRadius: 999, padding: "2px 8px" }}>
                          {auto.ativo ? "Ativa" : "Inativa"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: OBRIGAÇÕES
        ════════════════════════════════════════ */}
        {tab === "obrigacoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Obrigações fiscais</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{obsFiltradas.length} obrigaç{obsFiltradas.length !== 1 ? "ões" : "ão"}</p>
              </div>
              <button type="button">+ Nova obrigação</button>
            </div>

            {/* Filtros */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <select
                className="input"
                onChange={(e) => setFiltroStatusOb(e.target.value)}
                style={{ minWidth: 170, fontSize: 13 }}
                value={filtroStatusOb}
              >
                <option value="">Todos os status</option>
                {(Object.keys(STATUS_OBR) as StatusObrigacao[]).map((s) => (
                  <option key={s} value={s}>{STATUS_OBR[s].label}</option>
                ))}
              </select>
              <select
                className="input"
                onChange={(e) => setFiltroPrioOb(e.target.value)}
                style={{ minWidth: 140, fontSize: 13 }}
                value={filtroPrioOb}
              >
                <option value="">Todas as prioridades</option>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </select>
              {(filtroStatusOb || filtroPrioOb) && (
                <button
                  className="small-action"
                  onClick={() => { setFiltroStatusOb(""); setFiltroPrioOb(""); }}
                  type="button"
                >✕ Limpar</button>
              )}
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Obrigação</TH>
                    <TH>Competência</TH>
                    <TH>Vencimento</TH>
                    <TH>Responsável</TH>
                    <TH>Prioridade</TH>
                    <TH>Status</TH>
                    <TH right>Ações</TH>
                  </tr>
                </thead>
                <tbody>
                  {obsFiltradas.map((ob) => (
                    <tr key={ob.id} style={{ background: ob.status === "atrasado" ? "#fff5f5" : undefined }}>
                      <TD>
                        <strong style={{ fontSize: "0.85rem" }}>{ob.nome}</strong>
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af", marginTop: 2, textTransform: "capitalize" }}>{ob.tipo}</div>
                      </TD>
                      <TD muted>{ob.competencia}</TD>
                      <TD>
                        <span style={{ fontSize: "0.83rem", fontWeight: 600 }}>{ob.vencimento}</span>
                      </TD>
                      <TD muted>{ob.responsavel}</TD>
                      <TD>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 700, color: PRIO[ob.prioridade].color }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", background: PRIO[ob.prioridade].color, display: "inline-block" }} />
                          {PRIO[ob.prioridade].label}
                        </span>
                      </TD>
                      <TD><Badge cfg={STATUS_OBR[ob.status]} /></TD>
                      <TD right>
                        <select
                          className="input"
                          onChange={(e) => mudarStatus(ob.id, e.target.value as StatusObrigacao)}
                          style={{ fontSize: "0.75rem", minWidth: 130, padding: "4px 8px" }}
                          value={ob.status}
                        >
                          {(Object.keys(STATUS_OBR) as StatusObrigacao[]).map((s) => (
                            <option key={s} value={s}>{STATUS_OBR[s].label}</option>
                          ))}
                        </select>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: APURAÇÃO
        ════════════════════════════════════════ */}
        {tab === "apuracao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Apuração de Impostos</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Competência: {periodoApuracao}</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <select
                  className="input"
                  onChange={(e) => setPeriodoApuracao(e.target.value)}
                  style={{ fontSize: 13 }}
                  value={periodoApuracao}
                >
                  {["Jun/2026", "Mai/2026", "Abr/2026", "Mar/2026", "Fev/2026", "Jan/2026"].map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <button type="button">Calcular</button>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Imposto</TH>
                  <TH right>Base de Cálculo</TH>
                  <TH>Alíquota</TH>
                  <TH right>Valor</TH>
                  <TH>Observações</TH>
                  <TH>Ativo</TH>
                </tr>
              </thead>
              <tbody>
                {impostos.map((imp) => (
                  <tr key={imp.id} style={{ opacity: imp.ativo ? 1 : 0.45 }}>
                    <TD><strong style={{ color: "#065f46" }}>{imp.nome}</strong></TD>
                    <TD right muted>{imp.base > 0 ? fmt(imp.base) : "—"}</TD>
                    <TD muted>{imp.aliquota}</TD>
                    <TD right>
                      <strong style={{ color: imp.valor > 0 ? "#065f46" : "#9ca3af" }}>
                        {imp.valor > 0 ? fmt(imp.valor) : "—"}
                      </strong>
                    </TD>
                    <TD muted>{imp.obs || "—"}</TD>
                    <TD>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, color: imp.ativo ? "#065f46" : "#9ca3af", background: imp.ativo ? "#dcfce7" : "#f3f4f6", borderRadius: 999, padding: "2px 8px" }}>
                        {imp.ativo ? "Ativo" : "N/A"}
                      </span>
                    </TD>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: "#f0fdf4", borderTop: "2px solid #bbf7d0" }}>
                  <td colSpan={3} style={{ padding: "0.9rem 0.875rem", fontWeight: 800, fontSize: "0.9rem", color: "#065f46" }}>Total estimado</td>
                  <td style={{ padding: "0.9rem 0.875rem", textAlign: "right", fontWeight: 900, fontSize: "1rem", color: "#065f46" }}>
                    {fmt(totalImpostos)}
                  </td>
                  <td colSpan={2} />
                </tr>
              </tfoot>
            </table>

            <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
              * Valores calculados com base nas informações cadastradas. Confirme com a equipe antes de emitir guias.
            </p>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: GUIAS
        ════════════════════════════════════════ */}
        {tab === "guias" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Guias de Recolhimento</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{guias.length} guias cadastradas</p>
              </div>
              <button type="button">+ Emitir guia</button>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Guia</TH>
                  <TH>Competência</TH>
                  <TH>Vencimento</TH>
                  <TH right>Valor</TH>
                  <TH>Status</TH>
                  <TH right>Ações</TH>
                </tr>
              </thead>
              <tbody>
                {guias.map((g) => (
                  <tr key={g.id}>
                    <TD>
                      <strong style={{ fontSize: "0.85rem" }}>{g.nome}</strong>
                      {g.codigoBarra && (
                        <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 2, fontFamily: "monospace" }}>
                          {g.codigoBarra.slice(0, 30)}…
                        </div>
                      )}
                    </TD>
                    <TD muted>{g.competencia}</TD>
                    <TD muted>{g.vencimento}</TD>
                    <TD right>
                      <strong style={{ color: g.valor > 0 ? "#07170d" : "#9ca3af" }}>
                        {g.valor > 0 ? fmt(g.valor) : "—"}
                      </strong>
                    </TD>
                    <TD><Badge cfg={STATUS_GUIA[g.status]} /></TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {g.status === "pendente" && (
                          <button className="small-action" onClick={() => emitirGuia(g.id)} type="button">Emitir</button>
                        )}
                        {g.status === "emitida" && (
                          <>
                            <button
                              className="small-action"
                              onClick={() => { auditoria("PDF baixado", "Guias", `${g.nome} ${g.competencia}`); }}
                              type="button"
                            >📄 PDF</button>
                            <button className="small-action" onClick={() => enviarCliente(g.id)} type="button">📤 Enviar</button>
                          </>
                        )}
                        {(g.status === "emitida" || g.status === "enviada") && (
                          <button
                            className="small-action"
                            onClick={() => setRegistrandoPag(g.id)}
                            type="button"
                          >✓ Pago</button>
                        )}
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Modal registro de pagamento */}
            {registrandoPag && (() => {
              const g = guias.find((x) => x.id === registrandoPag);
              if (!g) return null;
              return (
                <>
                  <div onClick={() => setRegistrandoPag(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)", zIndex: 40 }} />
                  <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                    <div style={{ background: "#fff", borderRadius: 16, padding: "1.75rem", maxWidth: 420, width: "90%", boxShadow: "0 24px 80px rgba(0,0,0,0.18)", pointerEvents: "auto" }}>
                      <h3 style={{ margin: "0 0 0.5rem", fontSize: "1rem", fontWeight: 800 }}>Registrar pagamento</h3>
                      <p style={{ margin: "0 0 1.25rem", fontSize: "0.875rem", color: "#6b7280" }}>
                        <strong>{g.nome}</strong> — {g.competencia} — <strong>{fmt(g.valor)}</strong>
                      </p>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                        Data do pagamento
                      </label>
                      <input className="input" defaultValue={new Date().toISOString().slice(0, 10)} style={{ marginBottom: "1rem" }} type="date" />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button className="small-action" onClick={() => setRegistrandoPag(null)} type="button">Cancelar</button>
                        <button onClick={() => registrarPagamento(g.id)} type="button">✓ Confirmar pagamento</button>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: SPED
        ════════════════════════════════════════ */}
        {tab === "sped" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>SPED — Escrituração Digital</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Status de envio e protocolos</p>
              </div>
              <button type="button">+ Gerar arquivo</button>
            </div>

            {/* Status cards resumo */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {(["transmitido", "validado", "pendente", "erro"] as SpedArquivo["status"][]).map((s) => {
                const count = sped.filter((x) => x.status === s).length;
                const cfg = STATUS_SPED[s];
                return (
                  <div key={s} style={{ background: cfg.bg, border: `1px solid ${cfg.color}22`, borderRadius: 10, padding: "0.875rem 1rem" }}>
                    <p style={{ margin: "0 0 4px", fontSize: "0.72rem", fontWeight: 700, color: cfg.color, textTransform: "uppercase", letterSpacing: "0.5px" }}>{cfg.label}</p>
                    <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 800, color: cfg.color }}>{count}</p>
                  </div>
                );
              })}
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Tipo de arquivo</TH>
                  <TH>Competência</TH>
                  <TH>Tamanho</TH>
                  <TH>Status</TH>
                  <TH>Protocolo</TH>
                  <TH>Data envio</TH>
                  <TH right>Ações</TH>
                </tr>
              </thead>
              <tbody>
                {sped.map((arq) => (
                  <tr key={arq.id}>
                    <TD><strong style={{ fontSize: "0.85rem" }}>{arq.tipo}</strong></TD>
                    <TD muted>{arq.competencia}</TD>
                    <TD muted>{arq.tamanho}</TD>
                    <TD><Badge cfg={STATUS_SPED[arq.status]} /></TD>
                    <TD muted>
                      {arq.protocolo
                        ? <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{arq.protocolo}</span>
                        : "—"}
                    </TD>
                    <TD muted>
                      {arq.dataEnvio
                        ? new Date(arq.dataEnvio).toLocaleString("pt-BR")
                        : "—"}
                    </TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        {arq.status === "pendente" && (
                          <button className="small-action" type="button">Gerar</button>
                        )}
                        {arq.status === "gerado" && (
                          <button className="small-action" type="button">Validar</button>
                        )}
                        {arq.status === "validado" && (
                          <button
                            className="small-action"
                            onClick={() => auditoria("SPED transmitido", "SPED", `${arq.tipo} ${arq.competencia}`)}
                            type="button"
                          >
                            ⚡ Transmitir
                          </button>
                        )}
                        {arq.status === "transmitido" && (
                          <button className="small-action" type="button">📄 Recibo</button>
                        )}
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Logs do SPED */}
            <div className="list-panel">
              <div className="list-panel-header">
                <div><h2>Log de transmissões</h2><p>Últimas operações registradas</p></div>
              </div>
              <div style={{ padding: "0 1rem 1rem" }}>
                {log.filter((l) => l.modulo === "SPED").map((entry) => (
                  <div key={entry.id} style={{ display: "flex", gap: 12, padding: "8px 4px", borderBottom: "1px solid #f0f7f3", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "0.72rem", color: "#9ca3af", whiteSpace: "nowrap", marginTop: 2 }}>
                      {new Date(entry.data).toLocaleString("pt-BR")}
                    </span>
                    <div>
                      <strong style={{ fontSize: "0.82rem", color: "#065f46" }}>{entry.acao}</strong>
                      <span style={{ fontSize: "0.82rem", color: "#6f8f7c" }}> — {entry.detalhe}</span>
                    </div>
                  </div>
                ))}
                {log.filter((l) => l.modulo === "SPED").length === 0 && (
                  <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", padding: "1rem 0" }}>Nenhum log de SPED.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: CERTIDÕES
        ════════════════════════════════════════ */}
        {tab === "certidoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Certidões Negativas</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Situação fiscal federal, estadual e municipal</p>
              </div>
              <button type="button">+ Solicitar certidão</button>
            </div>

            {(["federal", "estadual", "municipal"] as Certidao["esfera"][]).map((esfera) => {
              const certs = certidoes.filter((c) => c.esfera === esfera);
              const label = { federal: "Federal", estadual: "Estadual", municipal: "Municipal" }[esfera];
              return (
                <div className="list-panel" key={esfera}>
                  <div className="list-panel-header">
                    <div><h2>{label}</h2><p>{certs.length} certidão{certs.length !== 1 ? "ões" : ""}</p></div>
                  </div>
                  <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: 8 }}>
                    {certs.map((cert) => {
                      const cfg = STATUS_CERT[cert.status];
                      const vencendoEm7 = cert.validade && new Date(cert.validade) <= new Date(Date.now() + 7 * 86400000);
                      return (
                        <div
                          key={cert.nome}
                          style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 14px", borderRadius: 10,
                            background: cfg.bg,
                            border: `1px solid ${cert.status === "vencida" ? "#fca5a5" : cert.status === "valida" ? "#bbf7d0" : "#e5e7eb"}`,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <span style={{ width: 32, height: 32, borderRadius: 8, background: cert.status === "valida" ? "#dcfce7" : cert.status === "vencida" ? "#fee2e2" : "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 700, color: cfg.color }}>
                              {cfg.icon}
                            </span>
                            <div>
                              <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#07170d" }}>{cert.nome}</p>
                              <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "#6b7280" }}>
                                {cert.numero ? `Nº ${cert.numero}` : "Sem número"}
                                {cert.validade && ` • Validade: ${new Date(cert.validade).toLocaleDateString("pt-BR")}`}
                                {vencendoEm7 && cert.status === "valida" && <span style={{ color: "#f59e0b", fontWeight: 700 }}> ⚠ Vencendo em breve</span>}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <Badge cfg={cfg} />
                            <button
                              className="small-action"
                              onClick={() => auditoria("Certidão solicitada", "Certidões", cert.nome)}
                              type="button"
                            >
                              {cert.status === "nao_solicitada" ? "Solicitar" : "Renovar"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: HISTÓRICO / AUDITORIA
        ════════════════════════════════════════ */}
        {tab === "historico" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Histórico de auditoria</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{log.length} registros — toda ação gera auditoria automática</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#10b981", background: "#f0fdf4", borderRadius: 999, padding: "3px 10px", border: "1px solid #bbf7d0" }}>
                  ⚡ Tempo real
                </span>
              </div>
            </div>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Data / Hora</TH>
                  <TH>Usuário</TH>
                  <TH>Ação</TH>
                  <TH>Módulo</TH>
                  <TH>Detalhe</TH>
                  <TH>IP</TH>
                </tr>
              </thead>
              <tbody>
                {log.map((entry) => (
                  <tr key={entry.id}>
                    <TD muted>
                      <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>
                        {new Date(entry.data).toLocaleString("pt-BR")}
                      </span>
                    </TD>
                    <TD>
                      <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 8, background: entry.usuario === "Sistema" ? "#f3f4f6" : "#ecfdf5", color: entry.usuario === "Sistema" ? "#6b7280" : "#065f46", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 800, flexShrink: 0 }}>
                          {entry.usuario === "Sistema" ? "SYS" : entry.usuario.split(" ").map((w) => w[0]).join("").slice(0, 2)}
                        </div>
                        <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{entry.usuario}</span>
                      </div>
                    </TD>
                    <TD>
                      <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#065f46" }}>{entry.acao}</span>
                    </TD>
                    <TD muted>
                      <span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#f3f4f6", color: "#4b5563", borderRadius: 999, padding: "2px 8px" }}>
                        {entry.modulo}
                      </span>
                    </TD>
                    <TD muted>{entry.detalhe}</TD>
                    <TD muted>
                      <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{entry.ip}</span>
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
