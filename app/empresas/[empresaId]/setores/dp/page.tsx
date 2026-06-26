"use client";

import { useRef, useState, useEffect } from "react";
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

type LogDP = {
  id: string; data: string; usuario: string; acao: string; modulo: string; detalhe: string;
};

/* ─── Ícone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <circle cx={9} cy={7} r={4} stroke="currentColor" strokeWidth={2} />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <path d="M16 11h6M19 8v6" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

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

const TABS_DP = [
  { id: "dashboard",    label: "Dashboard",    icon: "◉" },
  { id: "funcionarios", label: "Funcionários", icon: "👤" },
  { id: "admissao",     label: "Admissão",     icon: "+" },
  { id: "folha",        label: "Folha",        icon: "₿" },
  { id: "ferias",       label: "Férias",       icon: "☀" },
  { id: "rescisao",     label: "Rescisão",     icon: "✕" },
  { id: "esocial",      label: "eSocial",      icon: "⚡" },
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

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabDP>("dashboard");
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [folhas, setFolhas] = useState<ItemFolha[]>([]);
  const [folhaStatus, setFolhaStatus] = useState<StatusFolha>("aberta");
  const [folhaComp] = useState("Jun/2026");
  const [ferias, setFerias] = useState<Ferias[]>([]);
  const [esocial, setEsocial] = useState<EventoEsocial[]>([]);
  const [log, setLog] = useState<LogDP[]>([]);
  const [perfil, setPerfil] = useState<Funcionario | null>(null);
  const [admStep, setAdmStep] = useState(1);
  const [rescisaoStep, setRescisaoStep] = useState(1);
  const [tipoRescisao, setTipoRescisao] = useState<TipoRescisao>("sem_justa_causa");
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [checklist, setChecklist] = useState([
    { id: "1", label: "RG — Registro Geral",         feito: false },
    { id: "2", label: "CPF — Cadastro de Pessoa Física", feito: false },
    { id: "3", label: "CTPS — Carteira de Trabalho",  feito: false },
    { id: "4", label: "Comprovante de residência",    feito: false },
    { id: "5", label: "Contrato assinado",            feito: false },
    { id: "6", label: "Exame admissional",            feito: false },
  ]);

  /* ── Carregar dados reais ── */
  useEffect(() => {
    fetch(`/api/empresas/${empresaId}/setores/dp`)
      .then(r => r.json())
      .then(json => {
        setFuncionarios(json.data?.funcionarios ?? []);
        setFerias(json.data?.ferias ?? []);
        setEsocial(json.data?.esocial ?? []);
        setFolhas(json.data?.folhas ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empresaId]);

  /* ── Auditoria ── */
  function audit(acao: string, modulo: string, detalhe: string) {
    setLog((prev) => [{
      id: crypto.randomUUID(), data: new Date().toISOString(),
      usuario: "Usuário Atual", acao, modulo, detalhe,
    }, ...prev]);
  }

  /* ── Folha ── */
  const totalBruto  = folhas.reduce((a, i) => a + i.salarioBruto, 0);
  const totalInss   = folhas.reduce((a, i) => a + i.inss, 0);
  const totalIrrf   = folhas.reduce((a, i) => a + i.irrf, 0);
  const totalLiq    = folhas.reduce((a, i) => a + i.liquido, 0);
  const totalFgts   = totalBruto * 0.08;
  const totalInssEmp = totalBruto * 0.20;

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

  /* ── Loading ── */
  if (loading) {
    return (
      <SetorShell borda="#c4b5fd" cor="#6b21a8" empresaId={empresaId} empresaNome="Empresa" fundo="#faf5ff" icone={ICONE} setorNome="Departamento Pessoal" setorResumo="Carregando..." stats={[]}>
        <div style={{ padding: "3rem", textAlign: "center", color: "#6b21a8", fontSize: "1rem", fontWeight: 700 }}>Carregando...</div>
      </SetorShell>
    );
  }

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

        {/* ════════════ DASHBOARD ════════════ */}
        {tab === "dashboard" && (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {[
                { label: "Ativos",       value: ativos,   color: "#7c3aed", bg: "#faf5ff" },
                { label: "Em férias",    value: emFerias, color: "#1d4ed8", bg: "#eff6ff" },
                { label: "eSocial pend.",value: pendESoc, color: pendESoc > 0 ? "#b91c1c" : "#065f46", bg: pendESoc > 0 ? "#fef2f2" : "#f0fdf4" },
                { label: "Férias pend.", value: feriasPend, color: "#92400e", bg: "#fff7ed" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "0.875rem 1rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem" }}>
              <div className="list-panel">
                <div className="list-panel-header">
                  <div><h2>Folha de Pagamento</h2><p>{folhaComp}</p></div>
                  <button className="small-action" onClick={() => setTab("folha")} type="button">Abrir folha</button>
                </div>
                <div style={{ padding: "0.5rem 1rem 1rem" }}>
                  {folhas.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.85rem", padding: "1rem 0" }}>Nenhuma folha disponível</p>
                  ) : (
                    [
                      { label: "Salários brutos",  val: totalBruto,   color: "#07170d" },
                      { label: "INSS empregado",   val: -totalInss,   color: "#b91c1c" },
                      { label: "IRRF",             val: -totalIrrf,   color: "#b91c1c" },
                      { label: "Líquido",          val: totalLiq,     color: "#7c3aed", bold: true },
                    ].map((row) => (
                      <div key={row.label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f3ff" }}>
                        <span style={{ fontSize: "0.82rem", color: row.bold ? "#07170d" : "#4b6358", fontWeight: row.bold ? 700 : 400 }}>{row.label}</span>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: row.color }}>{fmt(Math.abs(row.val))}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="list-panel">
                <div className="list-panel-header"><div><h2>Últimos eventos</h2></div></div>
                <div style={{ padding: "0.25rem 0 0.75rem" }}>
                  {log.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#9ca3af", fontSize: "0.85rem", padding: "1rem 0" }}>Nenhum evento registrado</p>
                  ) : log.slice(0, 5).map((entry) => (
                    <div key={entry.id} style={{ padding: "7px 1rem", borderBottom: "1px solid #f5f3ff" }}>
                      <p style={{ margin: "0 0 1px", fontSize: "0.8rem", fontWeight: 700, color: "#07170d" }}>{entry.acao}</p>
                      <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{new Date(entry.data).toLocaleString("pt-BR")} - {entry.usuario}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════ FUNCIONARIOS ════════════ */}
        {tab === "funcionarios" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Funcionários</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{funcionarios.length} colaboradores cadastrados</p>
              </div>
              <button onClick={() => { setAdmStep(1); setTab("admissao"); }} type="button">+ Admitir funcionário</button>
            </div>

            {funcionarios.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhum funcionário cadastrado</p>
            ) : perfil ? (
              <div>
                <button className="small-action" onClick={() => setPerfil(null)} style={{ marginBottom: "1rem" }} type="button">← Voltar à lista</button>
                <div style={{ background: "linear-gradient(120deg, #3b0764 0%, #581c87 100%)", borderRadius: 16, padding: "1.75rem 2rem", position: "relative", overflow: "hidden", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", gap: "1.5rem", alignItems: "flex-start" }}>
                    <Avatar nome={perfil.nome} size={60} bg="linear-gradient(135deg,#a78bfa,#7c3aed)" />
                    <div style={{ flex: 1 }}>
                      <h2 style={{ margin: "0 0 6px", color: "#fff", fontSize: "1.3rem", fontWeight: 800 }}>{perfil.nome}</h2>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <span style={{ fontSize: "0.8rem", color: "#c4b5fd" }}>{perfil.cargo}</span>
                        <Badge {...S_FUNC[perfil.status]} />
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: "#fff" }}>{fmt(perfil.salario)}</p>
                    </div>
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                  <div className="list-panel">
                    <div className="list-panel-header"><div><h2>Dados Pessoais</h2></div></div>
                    <div style={{ padding: "0.5rem 1rem 1rem", display: "grid", gap: 8 }}>
                      {[
                        { label: "CPF", value: perfil.cpf }, { label: "PIS", value: perfil.pis },
                        { label: "CTPS", value: perfil.ctps }, { label: "E-mail", value: perfil.email },
                        { label: "Telefone", value: perfil.telefone }, { label: "Dependentes", value: String(perfil.dependentes) },
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
                        { label: "Admissão", value: new Date(perfil.admissao).toLocaleDateString("pt-BR") },
                        { label: "Cargo", value: perfil.cargo }, { label: "Setor", value: perfil.setor },
                        { label: "Salário base", value: fmt(perfil.salario) },
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
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Funcionário</TH><TH>CPF</TH><TH>Cargo / Setor</TH><TH>Admissão</TH><TH right>Salário</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {funcionarios.map((f) => (
                    <tr key={f.id}>
                      <TD><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar nome={f.nome} size={34} /><strong style={{ fontSize: "0.875rem" }}>{f.nome}</strong></div></TD>
                      <TD muted>{f.cpf}</TD>
                      <TD><div style={{ fontSize: "0.85rem", fontWeight: 600 }}>{f.cargo}</div><div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{f.setor}</div></TD>
                      <TD muted>{new Date(f.admissao).toLocaleDateString("pt-BR")}</TD>
                      <TD right><strong>{fmt(f.salario)}</strong></TD>
                      <TD><Badge {...S_FUNC[f.status]} /></TD>
                      <TD right><button className="small-action" onClick={() => setPerfil(f)} type="button">Ver perfil</button></TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════ ADMISSAO ════════════ */}
        {tab === "admissao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Nova Admissão</h2><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Etapa {admStep} de 5</p></div>
            <div style={{ display: "flex", gap: 0, overflowX: "auto" }}>
              {["Dados Pessoais", "Contrato", "Documentos", "Conferência", "eSocial"].map((label, i) => {
                const num = i + 1; const ativo = num === admStep; const concluido = num < admStep;
                return (
                  <div key={label} style={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0 }}>
                    <button onClick={() => setAdmStep(num)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "0 8px", flex: 1 }} type="button">
                      <div style={{ width: 32, height: 32, borderRadius: "50%", background: concluido ? "#7c3aed" : ativo ? "#ede9fe" : "#f3f4f6", color: concluido ? "#fff" : ativo ? "#7c3aed" : "#9ca3af", border: `2px solid ${ativo ? "#7c3aed" : concluido ? "#7c3aed" : "#e5e7eb"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 800 }}>{concluido ? "✓" : num}</div>
                      <span style={{ fontSize: "0.7rem", fontWeight: ativo ? 700 : 500, color: ativo ? "#6b21a8" : "#9ca3af", textAlign: "center" }}>{label}</span>
                    </button>
                    {i < 4 && <div style={{ height: 2, flex: 1, background: concluido ? "#7c3aed" : "#e5e7eb", minWidth: 20 }} />}
                  </div>
                );
              })}
            </div>
            <div style={{ background: "#faf5ff", borderRadius: 12, padding: "1.5rem", border: "1px solid #e9d5ff" }}>
              {admStep === 1 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <SectionTitle>Dados Pessoais</SectionTitle><div />
                  {["Nome completo *", "CPF *", "RG", "Data de nascimento", "E-mail", "Telefone", "Endereço", "Cidade / UF"].map((f) => (
                    <label key={f} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>{f}<input className="input" placeholder={f.replace(" *", "")} /></label>
                  ))}
                </div>
              )}
              {admStep === 2 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <SectionTitle>Dados do Contrato</SectionTitle><div />
                  {[["Cargo *", "text"], ["Setor", "text"], ["Data de admissão *", "date"], ["Salário base *", "text"]].map(([f, t]) => (
                    <label key={f} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>{f}<input className="input" placeholder={f.replace(" *", "")} type={t} /></label>
                  ))}
                </div>
              )}
              {admStep === 3 && (
                <div><SectionTitle>Checklist de Documentos</SectionTitle>
                  <div style={{ display: "grid", gap: 8 }}>
                    {checklist.map((item) => (
                      <div key={item.id} onClick={() => setChecklist((prev) => prev.map((c) => c.id === item.id ? { ...c, feito: !c.feito } : c))} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: item.feito ? "#f5f3ff" : "#fff", border: `1px solid ${item.feito ? "#c4b5fd" : "#e9d5ff"}` }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, border: `2px solid ${item.feito ? "#7c3aed" : "#c4b5fd"}`, background: item.feito ? "#7c3aed" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{item.feito && <span style={{ color: "#fff", fontSize: 11, fontWeight: 900 }}>✓</span>}</div>
                        <span style={{ fontSize: "0.875rem", fontWeight: 600, color: item.feito ? "#6b21a8" : "#07170d" }}>{item.label}</span>
                        <Badge {...(item.feito ? S_ADM.concluido : S_ADM.pendente)} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {admStep === 4 && (<div><SectionTitle>Conferência Final</SectionTitle><p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Revise todos os dados antes de enviar ao eSocial.</p></div>)}
              {admStep === 5 && (
                <div style={{ textAlign: "center", padding: "1rem 0" }}>
                  <SectionTitle>Envio ao eSocial</SectionTitle>
                  <p style={{ fontSize: "0.875rem", color: "#6b7280", marginBottom: "1.5rem" }}>Ao confirmar, será gerado o evento <strong>S-2200</strong> e enviado ao eSocial.</p>
                  <button onClick={() => { audit("Admissão iniciada", "Admissão", "S-2200 gerado para novo funcionário"); setTab("esocial"); }} style={{ background: "linear-gradient(135deg, #7c3aed, #6b21a8)", color: "#fff", border: "none", borderRadius: 10, padding: "0.75rem 2rem", fontWeight: 800, fontSize: "0.9rem", cursor: "pointer" }} type="button">Gerar evento eSocial e concluir</button>
                </div>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button className="small-action" disabled={admStep === 1} onClick={() => setAdmStep((s) => s - 1)} style={{ opacity: admStep === 1 ? 0.4 : 1 }} type="button">← Anterior</button>
              {admStep < 5 && <button onClick={() => setAdmStep((s) => s + 1)} type="button">Próximo →</button>}
            </div>
          </div>
        )}

        {/* ════════════ FOLHA ════════════ */}
        {tab === "folha" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Folha de Pagamento</h2>
                <Badge {...(folhaStatus === "fechada" ? { bg: "#f0fdf4", color: "#166534", label: "Fechada" } : { bg: "#fffbeb", color: "#92400e", label: "Em aberto" })} />
              </div>
              <button disabled={folhaStatus === "fechada"} onClick={avancarFolha} type="button">
                {folhaStatus === "aberta" ? "Calcular folha" : folhaStatus === "calculada" ? "Validar" : folhaStatus === "validada" ? "Encerrar folha" : "Encerrada"}
              </button>
            </div>
            {folhas.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhum item de folha cadastrado</p>
            ) : (
              <>
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
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Funcionário</TH><TH right>Salário bruto</TH><TH right>INSS</TH><TH right>IRRF</TH><TH right>Líquido</TH></tr></thead>
                  <tbody>
                    {folhas.map((f) => (
                      <tr key={f.id}>
                        <TD><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar nome={f.nome} size={30} /><strong style={{ fontSize: "0.85rem" }}>{f.nome}</strong></div></TD>
                        <TD right>{fmt(f.salarioBruto)}</TD>
                        <TD right muted>{fmt(f.inss)}</TD>
                        <TD right muted>{f.irrf > 0 ? fmt(f.irrf) : "—"}</TD>
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
                      <td style={{ padding: "0.8rem 0.875rem", textAlign: "right", fontWeight: 900, fontSize: "1rem", color: "#065f46" }}>{fmt(totalLiq)}</td>
                    </tr>
                  </tfoot>
                </table>
              </>
            )}
          </div>
        )}

        {/* ════════════ FERIAS ════════════ */}
        {tab === "ferias" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Férias</h2><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{ferias.length} períodos cadastrados</p></div>
              <button type="button">+ Solicitar férias</button>
            </div>
            {ferias.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhuma férias programada</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Funcionário</TH><TH>Período aquisitivo</TH><TH>Início</TH><TH>Fim</TH><TH>Dias</TH><TH>Status</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {ferias.map((f) => (
                    <tr key={f.id}>
                      <TD><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar nome={f.nome} size={30} /><strong style={{ fontSize: "0.85rem" }}>{f.nome}</strong></div></TD>
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
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════ RESCISAO ════════════ */}
        {tab === "rescisao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Rescisão Contratual</h2><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Etapa {rescisaoStep} de 4</p></div>
            <div style={{ display: "flex", gap: 0 }}>
              {["Tipo / Funcionário", "Cálculo de Verbas", "Descontos", "Conferência"].map((label, i) => {
                const num = i + 1; const ok = num < rescisaoStep; const ativo = num === rescisaoStep;
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
                  <SectionTitle>Dados da Rescisão</SectionTitle><div />
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>
                    Funcionário *
                    <select className="input"><option value="">Selecione...</option>{funcionarios.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}</select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>
                    Tipo de rescisão *
                    <select className="input" onChange={(e) => setTipoRescisao(e.target.value as TipoRescisao)} value={tipoRescisao}>
                      <option value="sem_justa_causa">Dispensa sem justa causa</option><option value="com_justa_causa">Dispensa com justa causa</option>
                      <option value="pedido_demissao">Pedido de demissão</option><option value="comum_acordo">Distrato (acordo comum)</option>
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>Data do aviso prévio<input className="input" type="date" /></label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 700, color: "#4b5563" }}>Data da rescisão<input className="input" type="date" /></label>
                </div>
              )}
              {rescisaoStep === 2 && (<div><SectionTitle>Verbas Rescisórias</SectionTitle><p style={{ color: "#6b7280", fontSize: "0.85rem" }}>O cálculo será baseado nos dados do funcionário selecionado.</p></div>)}
              {rescisaoStep === 3 && (<div><SectionTitle>Descontos</SectionTitle><p style={{ color: "#6b7280", fontSize: "0.85rem" }}>Descontos serão aplicados conforme legislação vigente.</p></div>)}
              {rescisaoStep === 4 && (
                <div style={{ textAlign: "center", padding: "0.5rem 0" }}>
                  <SectionTitle>Conferência e Geração do TRCT</SectionTitle>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                    <button className="small-action" type="button">Gerar TRCT</button>
                    <button onClick={() => audit("Rescisão processada", "Rescisão", `${tipoRescisao} — TRCT gerado`)} type="button">Confirmar rescisão</button>
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

        {/* ════════════ eSOCIAL ════════════ */}
        {tab === "esocial" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>eSocial</h2><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Eventos, transmissões e protocolos</p></div>
              <button type="button">+ Novo evento</button>
            </div>
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
            {esocial.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhum evento eSocial cadastrado</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Evento</TH><TH>Funcionário</TH><TH>Data</TH><TH>Status</TH><TH>Protocolo</TH><TH>Obs</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {esocial.map((e) => (
                    <tr key={e.id}>
                      <TD><strong style={{ fontSize: "0.82rem" }}>{e.tipo}</strong></TD>
                      <TD muted>{e.funcionario}</TD>
                      <TD muted>{new Date(e.data).toLocaleDateString("pt-BR")}</TD>
                      <TD><Badge {...S_ESOCIAL[e.status]} /></TD>
                      <TD muted>{e.protocolo ? <span style={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{e.protocolo}</span> : "—"}</TD>
                      <TD muted>{e.obs}</TD>
                      <TD right>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {e.status === "fila" && <button className="small-action" onClick={() => audit("eSocial transmitido", "eSocial", e.tipo)} type="button">Transmitir</button>}
                          {e.status === "erro" && <button className="small-action" type="button">Retentar</button>}
                          {e.status === "transmitido" && <button className="small-action" type="button">Recibo</button>}
                        </div>
                      </TD>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Histórico de Auditoria</h2><p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{log.length} registros</p></div>
            </div>
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
                      <TD><span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#7c3aed" }}>{entry.acao}</span></TD>
                      <TD muted><span style={{ fontSize: "0.72rem", fontWeight: 700, background: "#f5f3ff", color: "#6b21a8", borderRadius: 999, padding: "2px 8px" }}>{entry.modulo}</span></TD>
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
