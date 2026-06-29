"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type TipoProcesso =
  | "abertura" | "alteracao" | "baixa"
  | "mudanca_cnae" | "mudanca_endereco" | "contrato_social";

type StatusKanban =
  | "solicitado" | "documentacao" | "preparacao"
  | "protocolo" | "em_analise" | "concluido" | "cancelado";

type StatusAlvara = "valido" | "vencendo" | "vencido" | "em_processo" | "pendente";

type Processo = {
  id: string; empresa: string; tipo: TipoProcesso; protocolo: string;
  responsavel: string; prazo: string; status: StatusKanban;
  criadoEm: string; obs: string;
};

type Alvara = {
  id: string; empresa: string; tipo: string; numero: string;
  emissao: string; validade: string; status: StatusAlvara; orgao: string;
};

type Documento = {
  id: string; nome: string; tipo: string; processoId: string;
  upload: string; tamanho: string; status: "ok" | "pendente" | "revisao";
  fileName?: string; file?: File;
};

type Certidao = {
  id: string; tipo: string; orgao: string; numero: string;
  emissao: string; validade: string; status: "valida" | "vencendo" | "vencida" | "solicitada";
  arquivo?: string;
};

type Socio = {
  id: string; nome: string; cpf: string; participacao: number;
  administrador: boolean; dataEntrada: string; status: "ativo" | "retirado";
};

type Procuracao = {
  id: string; outorgante: string; outorgado: string; tipo: string;
  poderes: string; dataInicio: string; dataFim: string;
  status: "ativa" | "vencida" | "revogada";
};

type LogSoc = {
  id: string; data: string; usuario: string;
  acao: string; modulo: string; detalhe: string;
};

type Tab =
  | "dashboard" | "processos" | "constituicao" | "alteracoes"
  | "encerramento" | "alvaras" | "certidoes" | "quadro_societario"
  | "procuracoes" | "documentos" | "historico";

/* ─── Ícone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

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

const S_ALVARA: Record<StatusAlvara, { bg: string; color: string; label: string }> = {
  valido:      { bg: "#f0fdf4", color: "#065f46", label: "Válido" },
  vencendo:    { bg: "#fffbeb", color: "#92400e", label: "Vencendo" },
  vencido:     { bg: "#fef2f2", color: "#b91c1c", label: "Vencido" },
  em_processo: { bg: "#eff6ff", color: "#1d4ed8", label: "Em processo" },
  pendente:    { bg: "#f3f4f6", color: "#6b7280", label: "Pendente" },
};

const S_CERTIDAO: Record<string, { bg: string; color: string; label: string }> = {
  valida:     { bg: "#f0fdf4", color: "#065f46", label: "Válida" },
  vencendo:   { bg: "#fffbeb", color: "#92400e", label: "Vencendo" },
  vencida:    { bg: "#fef2f2", color: "#b91c1c", label: "Vencida" },
  solicitada: { bg: "#eff6ff", color: "#1d4ed8", label: "Solicitada" },
};

const TIPOS_CERTIDAO = [
  "CND Federal (PGFN/RFB)", "CND Estadual (SEFAZ)", "CND Municipal",
  "CRF (FGTS)", "CNDT (Trabalhista)", "Certidão INSS",
  "Certidão Junta Comercial", "Certidão Cartório",
];

const TABS_SOC = [
  { id: "dashboard",         label: "Dashboard",       icon: "◉" },
  { id: "processos",         label: "Processos",       icon: "📋" },
  { id: "quadro_societario", label: "Quadro Societário",icon: "👥" },
  { id: "constituicao",      label: "Constituição",    icon: "🏢" },
  { id: "alteracoes",        label: "Alterações",      icon: "✏" },
  { id: "encerramento",      label: "Encerramento",    icon: "🔒" },
  { id: "certidoes",         label: "Certidões",       icon: "📋" },
  { id: "alvaras",           label: "Alvarás",         icon: "📜" },
  { id: "procuracoes",       label: "Procurações",     icon: "📝" },
  { id: "documentos",        label: "Documentos",      icon: "📁" },
  { id: "historico",         label: "Histórico",       icon: "⌛" },
] as const;

const TIPO_ICONE: Record<TipoProcesso, string> = {
  abertura: "🏢", alteracao: "✏", baixa: "🔒",
  mudanca_cnae: "🔄", mudanca_endereco: "📍", contrato_social: "📄",
};

/* ─── Helpers ─────────────────────────────────────────────────── */

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ display: "inline-block", background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ textAlign: right ? "right" : "left", padding: "0.7rem 0.875rem", color: "#6b5a3e", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #fde68a", background: "#fffbeb" }}>{children}</th>;
}

function TD({ children, right, muted, bold }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean }) {
  return <td style={{ padding: "0.75rem 0.875rem", textAlign: right ? "right" : "left", color: muted ? "#9ca3af" : "#07170d", fontSize: "0.85rem", borderBottom: "1px solid #fef9ec", fontWeight: bold ? 700 : 400 }}>{children}</td>;
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

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("dashboard");
  const [processos, setProcessos] = useState<Processo[]>([]);
  const [alvaras, setAlvaras] = useState<Alvara[]>([]);
  const [docs, setDocumentos] = useState<Documento[]>([]);
  const [log, setLog] = useState<LogSoc[]>([]);

  /* Wizard Constituição */
  const [constStep, setConstStep] = useState(1);
  const [constNome, setConstNome] = useState("");
  const [constCnae, setConstCnae] = useState("");
  const [constTipo, setConstTipo] = useState("Sociedade Limitada (Ltda)");
  const [constSocios, setConstSocios] = useState([{ nome: "", cpf: "", quota: "" }]);
  const [constCapital, setConstCapital] = useState("");
  const [constRegime, setConstRegime] = useState("Simples Nacional");
  const [constFinalizado, setConstFinalizado] = useState(false);

  /* Wizard Encerramento */
  const [encerrStep, setEncerrStep] = useState(1);
  const [encerrEmp, setEncerrEmp] = useState("");

  /* Alterações */
  const [altEmp, setAltEmp] = useState("");
  const [altTipo, setAltTipo] = useState("Alteração de sócio");
  const [altObs, setAltObs] = useState("");

  /* Certidões */
  const [certidoes, setCertidoes] = useState<Certidao[]>([]);
  const [novaCertTipo, setNovaCertTipo] = useState(TIPOS_CERTIDAO[0]);
  const [novaCertOrgao, setNovaCertOrgao] = useState("");
  const [novaCertNumero, setNovaCertNumero] = useState("");
  const [novaCertValidade, setNovaCertValidade] = useState("");

  /* Quadro Societário */
  const [socios, setSocios] = useState<Socio[]>([]);
  const [novoSocNome, setNovoSocNome] = useState("");
  const [novoSocCpf, setNovoSocCpf] = useState("");
  const [novoSocPart, setNovoSocPart] = useState("");
  const [novoSocAdmin, setNovoSocAdmin] = useState(false);

  /* Procurações */
  const [procuracoes, setProcuracoes] = useState<Procuracao[]>([]);
  const [novaProcOutorgado, setNovaProcOutorgado] = useState("");
  const [novaProcTipo, setNovaProcTipo] = useState("Plenos poderes");
  const [novaProcPoderes, setNovaProcPoderes] = useState("");
  const [novaProcFim, setNovaProcFim] = useState("");

  /* Filtro processos */
  const [filtroTipo, setFiltroTipo] = useState<TipoProcesso | "">("");
  const [filtroStatus, setFiltroStatus] = useState<StatusKanban | "">("");

  /* ── Carregar dados reais ── */
  useEffect(() => {
    Promise.all([
      fetch(`/api/empresas/${empresaId}/setores/societario`).then(r => r.json()).catch(() => ({ data: {} })),
      fetch(`/api/empresas/${empresaId}`).then(r => r.json()).catch(() => ({ data: null })),
    ]).then(([setorJson, empresaJson]) => {
      setProcessos(setorJson.data?.processos ?? []);
      setAlvaras(setorJson.data?.alvaras ?? []);
      setDocumentos(setorJson.data?.documentos ?? []);
      // Carregar sócios do metadata
      const m = empresaJson.data?.metadata ?? {};
      if (Array.isArray(m.socios)) {
        setSocios(m.socios.map((s: Record<string, unknown>, i: number) => ({
          id: String(i + 1),
          nome: (s.nome_socio as string) || (s.nome as string) || "",
          cpf: (s.cpf_socio as string) || (s.cpf as string) || "",
          participacao: parseFloat(String(s.participacao ?? s.quota ?? 0)),
          administrador: !!(s.administrador),
          dataEntrada: (s.dataEntrada as string) || new Date().toISOString().slice(0, 10),
          status: "ativo" as const,
        })));
      }
    }).finally(() => setLoading(false));
  }, [empresaId]);

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
  }

  function finalizarConst() {
    novoProcesso("abertura", constNome || "Nova Empresa");
    setConstFinalizado(true);
    audit("Constituição iniciada", "Constituição", `${constNome} — ${constTipo} — ${constRegime}`);
  }

  /* ── Estatísticas ── */
  const processosAtivos = processos.filter((p) => p.status !== "concluido" && p.status !== "cancelado").length;
  const aguardandoCliente = processos.filter((p) => p.status === "documentacao").length;
  const concluidos = processos.filter((p) => p.status === "concluido").length;
  const processosFiltrados = processos.filter((p) =>
    (filtroTipo === "" || p.tipo === filtroTipo) &&
    (filtroStatus === "" || p.status === filtroStatus)
  );

  /* ── Loading ── */
  if (loading) {
    return (
      <SetorShell borda="#fcd34d" cor="#92400e" empresaId={empresaId} empresaNome="Empresa" fundo="#fffbeb" icone={ICONE} setorNome="Setor Societário" setorResumo="Carregando..." stats={[]}>
        <div style={{ padding: "3rem", textAlign: "center", color: "#92400e", fontSize: "1rem", fontWeight: 700 }}>Carregando...</div>
      </SetorShell>
    );
  }

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
        { label: "Sócios",            value: String(socios.filter(s => s.status === "ativo").length), cor: "#fbbf24" },
        { label: "Certidões",         value: String(certidoes.length),    cor: "#34d399" },
        { label: "Procurações",       value: String(procuracoes.filter(p => p.status === "ativa").length), cor: "#34d399" },
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
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid #fde68a", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

        {/* ════════════ DASHBOARD ════════════ */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Processos ativos",    value: processosAtivos,   color: "#92400e", bg: "#fffbeb" },
                { label: "Sócios ativos",       value: socios.filter(s => s.status === "ativo").length, color: "#7c3aed", bg: "#f5f3ff" },
                { label: "Certidões",           value: certidoes.length,  color: "#1d4ed8", bg: "#eff6ff" },
                { label: "Concluídos",          value: concluidos,        color: "#065f46", bg: "#f0fdf4" },
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
                <h2 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#07170d" }}>Kanban — Processos</h2>
                <button onClick={() => setTab("constituicao")} type="button">+ Novo processo</button>
              </div>
              {processos.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhum processo cadastrado</p>
              ) : (
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
                            <div key={p.id} onClick={() => setTab("processos")} style={{ background: "#fff", borderRadius: 8, padding: "9px 10px", boxShadow: "0 1px 3px rgba(0,0,0,0.07)", border: "1px solid #f3f4f6", cursor: "pointer" }}>
                              <p style={{ margin: "0 0 3px", fontSize: "0.78rem", fontWeight: 700, color: "#07170d", lineHeight: 1.3 }}>{p.empresa}</p>
                              <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>{TIPO_ICONE[p.tipo]} {TIPO_LABEL[p.tipo]}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div className="list-panel">
                <div className="list-panel-header"><div><h2>Últimos eventos</h2></div></div>
                <div style={{ padding: "0.25rem 0 0.75rem" }}>
                  {log.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#9ca3af", padding: "1rem", fontSize: "0.85rem" }}>Nenhum evento registrado</p>
                  ) : log.slice(0, 5).map((entry) => (
                    <div key={entry.id} style={{ padding: "7px 1rem", borderBottom: "1px solid #fef9ec" }}>
                      <p style={{ margin: "0 0 1px", fontSize: "0.8rem", fontWeight: 700, color: "#07170d" }}>{entry.acao}</p>
                      <p style={{ margin: "0 0 1px", fontSize: "0.75rem", color: "#6b7280" }}>{entry.detalhe}</p>
                      <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{new Date(entry.data).toLocaleString("pt-BR")} - {entry.usuario}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="list-panel">
                <div className="list-panel-header"><div><h2>Documentos recentes</h2></div></div>
                <div style={{ padding: "0.25rem 0 0.75rem" }}>
                  {docs.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#9ca3af", padding: "1rem", fontSize: "0.85rem" }}>Nenhum documento cadastrado</p>
                  ) : docs.slice(0, 5).map((d) => (
                    <div key={d.id} style={{ padding: "7px 1rem", borderBottom: "1px solid #fef9ec" }}>
                      <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#07170d" }}>{d.nome}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{d.tipo}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ PROCESSOS ════════════ */}
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
            {processosFiltrados.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhum processo encontrado</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Empresa</TH><TH>Tipo</TH><TH>Protocolo</TH><TH>Responsável</TH><TH>Prazo</TH><TH>Status</TH><TH right>Mover</TH></tr></thead>
                <tbody>
                  {processosFiltrados.map((p) => {
                    const vencido = p.prazo && new Date(p.prazo) < new Date() && p.status !== "concluido";
                    return (
                      <tr key={p.id}>
                        <TD><div><p style={{ margin: 0, fontWeight: 700 }}>{p.empresa}</p><p style={{ margin: "1px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{p.obs}</p></div></TD>
                        <TD><span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.82rem" }}><span>{TIPO_ICONE[p.tipo]}</span><span>{TIPO_LABEL[p.tipo]}</span></span></TD>
                        <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{p.protocolo}</span></TD>
                        <TD muted>{p.responsavel}</TD>
                        <TD>{p.prazo ? <span style={{ fontWeight: 600, color: vencido ? "#b91c1c" : "#374151", fontSize: "0.82rem" }}>{new Date(p.prazo).toLocaleDateString("pt-BR")}</span> : <span style={{ color: "#9ca3af" }}>—</span>}</TD>
                        <TD><Badge {...S_KANBAN[p.status]} /></TD>
                        <TD right>
                          <select className="input" disabled={p.status === "concluido" || p.status === "cancelado"} onChange={(e) => moverProcesso(p.id, e.target.value as StatusKanban)} style={{ fontSize: "0.73rem", padding: "3px 6px", minWidth: 120, opacity: (p.status === "concluido" || p.status === "cancelado") ? 0.5 : 1 }} value={p.status}>
                            {KANBAN_COLS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                            <option value="cancelado">Cancelado</option>
                          </select>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════ CONSTITUICAO ════════════ */}
        {tab === "constituicao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Wizard — Abertura de Empresa</h2></div>
            <div style={{ display: "flex", alignItems: "center", gap: 0, overflowX: "auto" }}>
              {["Dados", "Sócios", "Capital", "Regime", "Finalizar"].map((etapa, i) => {
                const ok = i + 1 < constStep; const ativo = i + 1 === constStep;
                return (
                  <div key={etapa} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <button onClick={() => setConstStep(i + 1)} style={{ flex: 1, textAlign: "center", padding: "0 4px", background: "none", border: "none", cursor: "pointer" }} type="button">
                      <div style={{ width: 38, height: 38, borderRadius: "50%", margin: "0 auto 5px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.9rem", fontWeight: 800, background: ok ? "#92400e" : ativo ? "#fffbeb" : "#f3f4f6", color: ok ? "#fff" : ativo ? "#92400e" : "#9ca3af", border: `2px solid ${ok || ativo ? "#92400e" : "#e5e7eb"}` }}>{ok ? "✓" : i + 1}</div>
                      <span style={{ fontSize: "0.68rem", fontWeight: ativo ? 800 : 400, color: ativo ? "#92400e" : "#9ca3af" }}>{etapa}</span>
                    </button>
                    {i < 4 && <div style={{ height: 2, width: 20, flex: "0 0 20px", background: ok ? "#92400e" : "#e5e7eb" }} />}
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.5rem" }}>
              {constStep === 1 && !constFinalizado && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Nome empresarial *<input className="input" onChange={(e) => setConstNome(e.target.value)} placeholder="Ex: Alfa Comércio Ltda" value={constNome} /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Tipo societário *
                    <select className="input" onChange={(e) => setConstTipo(e.target.value)} value={constTipo}>{["Sociedade Limitada (Ltda)","Empresário Individual (EI)","EIRELI","Sociedade Anônima (S/A)","MEI"].map((t) => <option key={t}>{t}</option>)}</select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>CNAE principal *<input className="input" onChange={(e) => setConstCnae(e.target.value)} placeholder="Ex: 6201-5/00" value={constCnae} /></label>
                </div>
              )}
              {constStep === 2 && !constFinalizado && (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                    <p style={{ margin: 0, fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Quadro de Sócios</p>
                    <button className="small-action" onClick={() => setConstSocios((prev) => [...prev, { nome: "", cpf: "", quota: "" }])} type="button">+ Sócio</button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {constSocios.map((s, idx) => (
                      <div key={idx} style={{ display: "grid", gridTemplateColumns: "1fr 160px 100px 36px", gap: 8, alignItems: "end" }}>
                        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Nome<input className="input" onChange={(e) => setConstSocios((prev) => prev.map((x, i) => i === idx ? { ...x, nome: e.target.value } : x))} value={s.nome} /></label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>CPF<input className="input" onChange={(e) => setConstSocios((prev) => prev.map((x, i) => i === idx ? { ...x, cpf: e.target.value } : x))} value={s.cpf} /></label>
                        <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Quota %<input className="input" onChange={(e) => setConstSocios((prev) => prev.map((x, i) => i === idx ? { ...x, quota: e.target.value } : x))} value={s.quota} /></label>
                        <button disabled={constSocios.length <= 1} onClick={() => setConstSocios((prev) => prev.filter((_, i) => i !== idx))} style={{ height: 38, background: "#fef2f2", color: "#b91c1c", border: "1px solid #fca5a5", borderRadius: 8, cursor: "pointer", fontWeight: 800, opacity: constSocios.length <= 1 ? 0.4 : 1 }} type="button">✕</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {constStep === 3 && !constFinalizado && (
                <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Capital (R$) *<input className="input" onChange={(e) => setConstCapital(e.target.value)} placeholder="Ex: 10000" value={constCapital} /></label>
                  <div />
                </div>
              )}
              {constStep === 4 && !constFinalizado && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                  {["MEI", "Simples Nacional", "Lucro Presumido", "Lucro Real"].map((r) => (
                    <button key={r} onClick={() => setConstRegime(r)} style={{ background: constRegime === r ? "#92400e" : "#fff", color: constRegime === r ? "#fff" : "#374151", border: `2px solid ${constRegime === r ? "#92400e" : "#fde68a"}`, borderRadius: 10, padding: "1rem 0.875rem", cursor: "pointer", fontWeight: 700, fontSize: "0.85rem" }} type="button">{r}</button>
                  ))}
                </div>
              )}
              {constStep === 5 && (
                <>
                  {!constFinalizado ? (
                    <div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: "1.25rem" }}>
                        {[{ label: "Nome", value: constNome || "—" }, { label: "Tipo", value: constTipo }, { label: "CNAE", value: constCnae || "—" }, { label: "Capital", value: constCapital ? `R$ ${parseFloat(constCapital).toLocaleString("pt-BR")}` : "—" }, { label: "Regime", value: constRegime }].map((item) => (
                          <div key={item.label} style={{ padding: "10px 14px", background: "#fff", borderRadius: 8, border: "1px solid #fde68a" }}>
                            <p style={{ margin: "0 0 2px", fontSize: "0.68rem", fontWeight: 700, color: "#a16207", textTransform: "uppercase" }}>{item.label}</p>
                            <p style={{ margin: 0, fontWeight: 700, fontSize: "0.9rem", color: "#92400e" }}>{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <button disabled={!constNome} onClick={finalizarConst} style={{ opacity: !constNome ? 0.5 : 1, background: "linear-gradient(135deg, #92400e, #b45309)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 800, fontSize: "0.875rem" }} type="button">Iniciar processo de abertura</button>
                    </div>
                  ) : (
                    <div style={{ padding: "1.25rem", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10 }}>
                      <strong style={{ color: "#065f46" }}>Processo criado com sucesso!</strong>
                      <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b7280" }}>Empresa <strong>{constNome}</strong> adicionada ao kanban.</p>
                      <button className="small-action" onClick={() => setTab("processos")} style={{ marginTop: 10 }} type="button">→ Ver em Processos</button>
                    </div>
                  )}
                </>
              )}
            </div>
            {!constFinalizado && (
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button className="small-action" disabled={constStep === 1} onClick={() => setConstStep((s) => s - 1)} style={{ opacity: constStep === 1 ? 0.4 : 1 }} type="button">← Anterior</button>
                {constStep < 5 && <button onClick={() => setConstStep((s) => s + 1)} type="button">Próximo →</button>}
              </div>
            )}
          </div>
        )}

        {/* ════════════ ALTERACOES ════════════ */}
        {tab === "alteracoes" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1.5rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Nova Alteração Contratual</h2></div>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Empresa *
                  <select className="input" onChange={(e) => setAltEmp(e.target.value)} value={altEmp}><option value="">Selecione...</option>{[...new Set(processos.map((p) => p.empresa))].map((e) => <option key={e}>{e}</option>)}</select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Tipo *
                  <select className="input" onChange={(e) => setAltTipo(e.target.value)} value={altTipo}>{["Alteração de sócio","Alteração de capital","Mudança de nome","Alteração de CNAE","Mudança de endereço"].map((t) => <option key={t}>{t}</option>)}</select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Observações
                  <textarea className="input" onChange={(e) => setAltObs(e.target.value)} rows={3} style={{ resize: "vertical" }} value={altObs} />
                </label>
                <button disabled={!altEmp} onClick={() => { novoProcesso("alteracao", altEmp); audit("Alteração registrada", "Alterações", `${altTipo} — ${altEmp}`); setAltEmp(""); setAltObs(""); }} style={{ opacity: !altEmp ? 0.5 : 1 }} type="button">Registrar alteração</button>
              </div>
            </div>
            <div className="list-panel">
              <div className="list-panel-header"><div><h2>Histórico de Alterações</h2></div></div>
              {processos.filter((p) => ["alteracao", "mudanca_cnae", "mudanca_endereco", "contrato_social"].includes(p.tipo)).length === 0 ? (
                <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.85rem" }}>Nenhuma alteração registrada</p>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Empresa</TH><TH>Protocolo</TH><TH>Status</TH></tr></thead>
                  <tbody>
                    {processos.filter((p) => ["alteracao", "mudanca_cnae", "mudanca_endereco", "contrato_social"].includes(p.tipo)).map((p) => (
                      <tr key={p.id}><TD bold>{p.empresa}</TD><TD muted>{p.protocolo}</TD><TD><Badge {...S_KANBAN[p.status]} /></TD></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* ════════════ ENCERRAMENTO ════════════ */}
        {tab === "encerramento" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Processo de Encerramento</h2></div>
            <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 12, padding: "1.5rem" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#7f1d1d" }}>Empresa a encerrar *
                <select className="input" onChange={(e) => setEncerrEmp(e.target.value)} value={encerrEmp}><option value="">Selecione...</option>{[...new Set(processos.map((p) => p.empresa))].map((e) => <option key={e}>{e}</option>)}</select>
              </label>
              <div style={{ padding: "10px 14px", background: "#fff", border: "1px solid #fca5a5", borderRadius: 8, marginTop: 12 }}>
                <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 700, color: "#b91c1c" }}>Atenção</p>
                <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#7f1d1d" }}>O processo de encerramento é irreversível após o registro na Junta Comercial.</p>
              </div>
              <button disabled={!encerrEmp} onClick={() => { novoProcesso("baixa", encerrEmp); audit("Processo de baixa criado", "Encerramento", encerrEmp); }} style={{ marginTop: 12, opacity: !encerrEmp ? 0.5 : 1, background: "linear-gradient(135deg, #b91c1c, #dc2626)", color: "#fff", border: "none", borderRadius: 10, padding: "10px 20px", cursor: "pointer", fontWeight: 800 }} type="button">Iniciar baixa</button>
            </div>
          </div>
        )}

        {/* ════════════ ALVARAS ════════════ */}
        {tab === "alvaras" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Alvarás de Funcionamento</h2><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{alvaras.length} alvarás cadastrados</p></div>
              <button onClick={() => audit("Alvará solicitado", "Alvarás", "Nova solicitação")} type="button">+ Solicitar alvará</button>
            </div>
            {alvaras.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhum alvará cadastrado</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Empresa</TH><TH>Tipo</TH><TH>Número</TH><TH>Órgão</TH><TH>Validade</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {alvaras.map((a) => (
                    <tr key={a.id}>
                      <TD bold>{a.empresa}</TD><TD>{a.tipo}</TD>
                      <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{a.numero}</span></TD>
                      <TD muted>{a.orgao}</TD>
                      <TD>{a.validade !== "—" ? <span style={{ fontWeight: 600, color: diasParaVencer(a.validade) <= 30 ? "#b91c1c" : "#374151", fontSize: "0.82rem" }}>{new Date(a.validade).toLocaleDateString("pt-BR")}</span> : <span style={{ color: "#9ca3af" }}>—</span>}</TD>
                      <TD><Badge {...S_ALVARA[a.status]} /></TD>
                      <TD right><button className="small-action" onClick={() => audit("Renovação solicitada", "Alvarás", `${a.tipo} — ${a.empresa}`)} type="button">Renovar</button></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════ CERTIDÕES ════════════ */}
        {tab === "certidoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Certidões Negativas</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{certidoes.length} certidões cadastradas · {certidoes.filter(c => c.status === "vencida").length} vencidas</p></div>
            </div>

            {/* Formulário nova certidão */}
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.25rem" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Registrar certidão</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Tipo *
                  <select className="input" value={novaCertTipo} onChange={e => setNovaCertTipo(e.target.value)}>{TIPOS_CERTIDAO.map(t => <option key={t}>{t}</option>)}</select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Órgão emissor
                  <input className="input" value={novaCertOrgao} onChange={e => setNovaCertOrgao(e.target.value)} placeholder="Ex: Receita Federal" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Número
                  <input className="input" value={novaCertNumero} onChange={e => setNovaCertNumero(e.target.value)} placeholder="Nº da certidão" />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Validade
                  <input className="input" type="date" value={novaCertValidade} onChange={e => setNovaCertValidade(e.target.value)} />
                </label>
              </div>
              <button onClick={() => {
                if (!novaCertTipo) return;
                const dias = novaCertValidade ? diasParaVencer(novaCertValidade) : 999;
                setCertidoes(prev => [...prev, {
                  id: crypto.randomUUID(), tipo: novaCertTipo, orgao: novaCertOrgao || novaCertTipo,
                  numero: novaCertNumero || "—", emissao: new Date().toISOString().slice(0, 10),
                  validade: novaCertValidade || "—",
                  status: dias <= 0 ? "vencida" : dias <= 30 ? "vencendo" : "valida",
                }]);
                audit("Certidão registrada", "Certidões", novaCertTipo);
                setNovaCertOrgao(""); setNovaCertNumero(""); setNovaCertValidade("");
              }} style={{ marginTop: 12 }} type="button">Registrar certidão</button>
            </div>

            {/* Tabela de certidões */}
            {certidoes.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhuma certidão cadastrada</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Tipo</TH><TH>Órgão</TH><TH>Número</TH><TH>Emissão</TH><TH>Validade</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {certidoes.map(c => {
                    const dias = c.validade !== "—" ? diasParaVencer(c.validade) : 999;
                    return (
                      <tr key={c.id}>
                        <TD bold>{c.tipo}</TD><TD muted>{c.orgao}</TD>
                        <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{c.numero}</span></TD>
                        <TD muted>{c.emissao !== "—" ? new Date(c.emissao).toLocaleDateString("pt-BR") : "—"}</TD>
                        <TD>{c.validade !== "—" ? <span style={{ fontWeight: 600, color: dias <= 0 ? "#b91c1c" : dias <= 30 ? "#92400e" : "#374151" }}>{new Date(c.validade).toLocaleDateString("pt-BR")}{dias > 0 && dias <= 60 && <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}> ({dias}d)</span>}</span> : "—"}</TD>
                        <TD><Badge {...(S_CERTIDAO[c.status] ?? S_CERTIDAO.solicitada)} /></TD>
                        <TD right>
                          <button className="small-action" onClick={() => { audit("Renovação solicitada", "Certidões", c.tipo); setCertidoes(prev => prev.map(x => x.id === c.id ? { ...x, status: "solicitada" } : x)); }} type="button">Renovar</button>
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════ QUADRO SOCIETÁRIO ════════════ */}
        {tab === "quadro_societario" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Quadro Societário Atual</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{socios.filter(s => s.status === "ativo").length} sócio(s) ativo(s) · Total: {socios.filter(s => s.status === "ativo").reduce((s, x) => s + x.participacao, 0).toFixed(1)}%</p></div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderTop: "3px solid #92400e", borderRadius: 12, padding: "0.875rem 1rem" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Sócios ativos</p>
                <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#92400e" }}>{socios.filter(s => s.status === "ativo").length}</p>
              </div>
              <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderTop: "3px solid #065f46", borderRadius: 12, padding: "0.875rem 1rem" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Administradores</p>
                <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#065f46" }}>{socios.filter(s => s.status === "ativo" && s.administrador).length}</p>
              </div>
              <div style={{ background: "#eff6ff", border: "1px solid #93c5fd", borderTop: "3px solid #1d4ed8", borderRadius: 12, padding: "0.875rem 1rem" }}>
                <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Participação total</p>
                <p style={{ margin: 0, fontSize: "1.8rem", fontWeight: 900, color: "#1d4ed8" }}>{socios.filter(s => s.status === "ativo").reduce((s, x) => s + x.participacao, 0).toFixed(1)}%</p>
              </div>
            </div>

            {/* Tabela sócios */}
            {socios.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Sócio</TH><TH>CPF</TH><TH right>Participação</TH><TH>Administrador</TH><TH>Entrada</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {socios.map(s => (
                    <tr key={s.id}>
                      <TD bold>{s.nome}</TD><TD muted>{s.cpf}</TD>
                      <TD right><span style={{ fontWeight: 800, fontSize: "1rem", color: "#92400e" }}>{s.participacao}%</span></TD>
                      <TD>{s.administrador ? <Badge bg="#f0fdf4" color="#065f46" label="Sim" /> : <span style={{ color: "#9ca3af", fontSize: "0.82rem" }}>Não</span>}</TD>
                      <TD muted>{s.dataEntrada ? new Date(s.dataEntrada).toLocaleDateString("pt-BR") : "—"}</TD>
                      <TD><Badge {...(s.status === "ativo" ? { bg: "#f0fdf4", color: "#065f46", label: "Ativo" } : { bg: "#f3f4f6", color: "#6b7280", label: "Retirado" })} /></TD>
                      <TD right>
                        {s.status === "ativo" && <button className="small-action" onClick={() => { setSocios(prev => prev.map(x => x.id === s.id ? { ...x, status: "retirado" } : x)); audit("Sócio retirado", "Quadro Societário", s.nome); }} type="button">Retirar</button>}
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* Adicionar sócio */}
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.25rem" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Adicionar novo sócio</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 160px 100px auto", gap: 10, alignItems: "end" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Nome *<input className="input" value={novoSocNome} onChange={e => setNovoSocNome(e.target.value)} placeholder="Nome completo" /></label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>CPF *<input className="input" value={novoSocCpf} onChange={e => setNovoSocCpf(e.target.value)} placeholder="000.000.000-00" /></label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Quota %<input className="input" type="number" value={novoSocPart} onChange={e => setNovoSocPart(e.target.value)} placeholder="%" /></label>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", cursor: "pointer" }}><input type="checkbox" checked={novoSocAdmin} onChange={e => setNovoSocAdmin(e.target.checked)} /> Admin</label>
                  <button disabled={!novoSocNome || !novoSocCpf} onClick={() => {
                    setSocios(prev => [...prev, { id: crypto.randomUUID(), nome: novoSocNome, cpf: novoSocCpf, participacao: parseFloat(novoSocPart) || 0, administrador: novoSocAdmin, dataEntrada: new Date().toISOString().slice(0, 10), status: "ativo" }]);
                    audit("Sócio adicionado", "Quadro Societário", novoSocNome);
                    setNovoSocNome(""); setNovoSocCpf(""); setNovoSocPart(""); setNovoSocAdmin(false);
                  }} style={{ opacity: (!novoSocNome || !novoSocCpf) ? 0.5 : 1 }} type="button">+ Adicionar</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ PROCURAÇÕES ════════════ */}
        {tab === "procuracoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Procurações</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{procuracoes.filter(p => p.status === "ativa").length} ativa(s) · {procuracoes.length} total</p></div>

            {/* Nova procuração */}
            <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "1.25rem" }}>
              <p style={{ margin: "0 0 12px", fontWeight: 800, fontSize: "0.875rem", color: "#92400e" }}>Nova procuração</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Outorgado (procurador) *<input className="input" value={novaProcOutorgado} onChange={e => setNovaProcOutorgado(e.target.value)} placeholder="Nome do procurador" /></label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Tipo
                  <select className="input" value={novaProcTipo} onChange={e => setNovaProcTipo(e.target.value)}>{["Plenos poderes", "Poderes específicos", "Ad judicia", "Substabelecimento"].map(t => <option key={t}>{t}</option>)}</select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e" }}>Validade<input className="input" type="date" value={novaProcFim} onChange={e => setNovaProcFim(e.target.value)} /></label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#6b5a3e", marginTop: 10 }}>Poderes
                <textarea className="input" value={novaProcPoderes} onChange={e => setNovaProcPoderes(e.target.value)} rows={2} style={{ resize: "vertical" }} placeholder="Descreva os poderes concedidos..." />
              </label>
              <button disabled={!novaProcOutorgado} onClick={() => {
                setProcuracoes(prev => [...prev, {
                  id: crypto.randomUUID(), outorgante: "Empresa", outorgado: novaProcOutorgado,
                  tipo: novaProcTipo, poderes: novaProcPoderes || novaProcTipo,
                  dataInicio: new Date().toISOString().slice(0, 10), dataFim: novaProcFim || "",
                  status: "ativa",
                }]);
                audit("Procuração emitida", "Procurações", `${novaProcTipo} — ${novaProcOutorgado}`);
                setNovaProcOutorgado(""); setNovaProcPoderes(""); setNovaProcFim("");
              }} style={{ marginTop: 12, opacity: !novaProcOutorgado ? 0.5 : 1 }} type="button">Registrar procuração</button>
            </div>

            {/* Tabela procurações */}
            {procuracoes.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhuma procuração cadastrada</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Outorgado</TH><TH>Tipo</TH><TH>Poderes</TH><TH>Início</TH><TH>Validade</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {procuracoes.map(p => {
                    const vencida = p.dataFim && new Date(p.dataFim) < new Date();
                    const statusReal = vencida && p.status === "ativa" ? "vencida" : p.status;
                    return (
                      <tr key={p.id}>
                        <TD bold>{p.outorgado}</TD><TD muted>{p.tipo}</TD>
                        <TD muted><span style={{ fontSize: "0.78rem", maxWidth: 200, display: "inline-block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.poderes}</span></TD>
                        <TD muted>{new Date(p.dataInicio).toLocaleDateString("pt-BR")}</TD>
                        <TD>{p.dataFim ? <span style={{ fontWeight: 600, color: vencida ? "#b91c1c" : "#374151" }}>{new Date(p.dataFim).toLocaleDateString("pt-BR")}</span> : <span style={{ color: "#9ca3af" }}>Indeterminada</span>}</TD>
                        <TD><Badge {...(statusReal === "ativa" ? { bg: "#f0fdf4", color: "#065f46", label: "Ativa" } : statusReal === "vencida" ? { bg: "#fef2f2", color: "#b91c1c", label: "Vencida" } : { bg: "#f3f4f6", color: "#6b7280", label: "Revogada" })} /></TD>
                        <TD right>
                          {statusReal === "ativa" && <button className="small-action" onClick={() => { setProcuracoes(prev => prev.map(x => x.id === p.id ? { ...x, status: "revogada" } : x)); audit("Procuração revogada", "Procurações", p.outorgado); }} type="button">Revogar</button>}
                        </TD>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════ DOCUMENTOS ════════════ */}
        {tab === "documentos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Documentos Societários</h2><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{docs.length} documentos</p></div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", background: "linear-gradient(135deg, #92400e, #b45309)", color: "#fff", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                Enviar documento
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xml,.zip" style={{ display: "none" }} onChange={e => {
                  Array.from(e.target.files ?? []).forEach(f => {
                    setDocumentos(prev => [...prev, {
                      id: crypto.randomUUID(), nome: f.name,
                      tipo: f.name.split(".").pop()?.toUpperCase() || "PDF",
                      processoId: "", upload: new Date().toISOString().slice(0, 10),
                      tamanho: `${(f.size / 1024).toFixed(0)} KB`, status: "ok",
                      fileName: f.name, file: f,
                    }]);
                    audit("Documento enviado", "Documentos", f.name);
                  });
                  e.target.value = "";
                }} />
              </label>
            </div>

            {/* Drag-and-drop */}
            <div
              onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#92400e"; }}
              onDragLeave={e => { e.currentTarget.style.borderColor = "#fde68a"; }}
              onDrop={e => { e.preventDefault(); e.currentTarget.style.borderColor = "#fde68a"; Array.from(e.dataTransfer.files).forEach(f => {
                setDocumentos(prev => [...prev, { id: crypto.randomUUID(), nome: f.name, tipo: f.name.split(".").pop()?.toUpperCase() || "PDF", processoId: "", upload: new Date().toISOString().slice(0, 10), tamanho: `${(f.size / 1024).toFixed(0)} KB`, status: "ok", fileName: f.name, file: f }]);
                audit("Documento enviado", "Documentos", f.name);
              }); }}
              onClick={() => { const inp = document.createElement("input"); inp.type = "file"; inp.multiple = true; inp.accept = ".pdf,.jpg,.jpeg,.png,.doc,.docx,.xml,.zip"; inp.onchange = (ev) => { Array.from((ev.target as HTMLInputElement).files ?? []).forEach(f => { setDocumentos(prev => [...prev, { id: crypto.randomUUID(), nome: f.name, tipo: f.name.split(".").pop()?.toUpperCase() || "PDF", processoId: "", upload: new Date().toISOString().slice(0, 10), tamanho: `${(f.size / 1024).toFixed(0)} KB`, status: "ok", fileName: f.name, file: f }]); audit("Documento enviado", "Documentos", f.name); }); }; inp.click(); }}
              style={{ border: "2px dashed #fde68a", borderRadius: 10, padding: 24, textAlign: "center", cursor: "pointer", background: "#fffbeb", transition: "border-color 0.2s" }}
            >
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#92400e", marginBottom: 4 }}>Arraste documentos aqui ou clique para selecionar</div>
              <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>Contrato social, atas, procurações, certidões — PDF, imagens, Word</div>
            </div>

            {docs.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhum documento cadastrado</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Nome</TH><TH>Tipo</TH><TH>Upload</TH><TH>Tamanho</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {docs.map((d) => (
                    <tr key={d.id}>
                      <TD bold>{d.nome}</TD><TD muted>{d.tipo}</TD>
                      <TD muted>{d.upload !== "—" ? new Date(d.upload).toLocaleDateString("pt-BR") : "Aguardando"}</TD>
                      <TD muted>{d.tamanho}</TD>
                      <TD><Badge {...(d.status === "ok" ? { bg: "#f0fdf4", color: "#065f46", label: "OK" } : d.status === "pendente" ? { bg: "#fffbeb", color: "#92400e", label: "Pendente" } : { bg: "#fef2f2", color: "#b91c1c", label: "Revisão" })} /></TD>
                      <TD right><button className="small-action" onClick={() => { setDocumentos(prev => prev.filter(x => x.id !== d.id)); audit("Documento removido", "Documentos", d.nome); }} type="button">Remover</button></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════ HISTORICO ════════════ */}
        {tab === "historico" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Histórico de Auditoria</h2><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>{log.length} registros</p></div>
            {log.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhum registro de auditoria</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Data / Hora</TH><TH>Usuário</TH><TH>Ação</TH><TH>Módulo</TH><TH>Detalhe</TH></tr></thead>
                <tbody>
                  {log.map((entry) => (
                    <tr key={entry.id}>
                      <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{new Date(entry.data).toLocaleString("pt-BR")}</span></TD>
                      <TD><span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{entry.usuario}</span></TD>
                      <TD><span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#92400e" }}>{entry.acao}</span></TD>
                      <TD muted><span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#fffbeb", color: "#92400e", borderRadius: 999, padding: "2px 8px" }}>{entry.modulo}</span></TD>
                      <TD muted>{entry.detalhe}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </div>
    </SetorShell>
  );
}
