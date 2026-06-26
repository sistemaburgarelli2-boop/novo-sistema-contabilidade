"use client";

import { useEffect, useState } from "react";
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

type Guia = {
  id: string;
  nome: string;
  competencia: string;
  vencimento: string;
  valor: number;
  status: "pendente" | "emitida" | "enviada" | "paga" | "vencida";
  codigo_barra?: string;
};

type Certidao = {
  id?: string;
  esfera: "federal" | "estadual" | "municipal";
  nome: string;
  validade: string | null;
  status: "valida" | "vencida" | "solicitada" | "nao_solicitada";
  numero: string | null;
};

type SpedArquivo = {
  id: string;
  tipo: string;
  competencia: string;
  status: "pendente" | "gerado" | "validado" | "transmitido" | "erro";
  protocolo: string | null;
  data_envio: string | null;
  tamanho: string;
};

type Tab = "visao_geral" | "obrigacoes" | "guias" | "sped" | "certidoes";

/* ─── Icone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M9 14l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
    <path d="M14 2v6h6" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

/* ─── Configuracoes visuais ───────────────────────────────────── */

const STATUS_OBR: Record<StatusObrigacao, { bg: string; color: string; label: string }> = {
  pendente:           { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
  em_andamento:       { bg: "#eff6ff", color: "#1d4ed8", label: "Em andamento" },
  aguardando_cliente: { bg: "#fdf4ff", color: "#7e22ce", label: "Aguard. cliente" },
  em_revisao:         { bg: "#fff7ed", color: "#c2410c", label: "Em revisao" },
  transmitido:        { bg: "#ecfdf5", color: "#065f46", label: "Transmitido" },
  concluido:          { bg: "#f0fdf4", color: "#166534", label: "Concluido" },
  atrasado:           { bg: "#fef2f2", color: "#b91c1c", label: "Atrasado" },
};

const PRIO: Record<Prioridade, { color: string; label: string }> = {
  alta:  { color: "#ef4444", label: "Alta" },
  media: { color: "#f59e0b", label: "Media" },
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
  valida:         { bg: "#f0fdf4", color: "#166534", label: "Valida", icon: "V" },
  vencida:        { bg: "#fef2f2", color: "#b91c1c", label: "Vencida", icon: "X" },
  solicitada:     { bg: "#eff6ff", color: "#1d4ed8", label: "Solicitada", icon: "..." },
  nao_solicitada: { bg: "#f3f4f6", color: "#6b7280", label: "Nao solicitada", icon: "-" },
};

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "visao_geral",  label: "Visao Geral",  icon: "O" },
  { id: "obrigacoes",   label: "Obrigacoes",   icon: "V" },
  { id: "guias",        label: "Guias",        icon: "$" },
  { id: "sped",         label: "SPED",         icon: "S" },
  { id: "certidoes",    label: "Certidoes",    icon: "+" },
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

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "3rem 1rem", color: "#9ca3af" }}>
      <p style={{ margin: 0, fontSize: "0.9rem" }}>{message}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, padding: "2rem" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ height: 48, background: "#f0f7f3", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
    </div>
  );
}

/* ─── Componente principal ────────────────────────────────────── */

export default function FiscalPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [tab, setTab] = useState<Tab>("visao_geral");
  const [loading, setLoading] = useState(true);
  const [obrigacoes, setObrigacoes] = useState<Obrigacao[]>([]);
  const [guias, setGuias] = useState<Guia[]>([]);
  const [certidoes, setCertidoes] = useState<Certidao[]>([]);
  const [sped, setSped] = useState<SpedArquivo[]>([]);
  const [filtroStatusOb, setFiltroStatusOb] = useState<string>("");
  const [filtroPrioOb, setFiltroPrioOb] = useState<string>("");
  const [registrandoPag, setRegistrandoPag] = useState<string | null>(null);

  /* ── Fetch real data from API ── */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/empresas/${empresaId}/setores/fiscal`);
        if (!res.ok) throw new Error("Falha ao carregar dados fiscais");
        const json = await res.json();
        const d = json.data;
        setObrigacoes(d.obrigacoes ?? []);
        setGuias(d.guias ?? []);
        setCertidoes(d.certidoes ?? []);
        setSped(d.sped ?? []);
      } catch {
        // keep empty arrays on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [empresaId]);

  /* ── Obrigacoes ── */
  function mudarStatus(id: string, novoStatus: StatusObrigacao) {
    setObrigacoes((prev) =>
      prev.map((ob) => ob.id !== id ? ob : { ...ob, status: novoStatus })
    );
  }

  /* ── Guias ── */
  function emitirGuia(id: string) {
    setGuias((prev) => prev.map((g) => g.id === id ? { ...g, status: "emitida" as const } : g));
  }

  function enviarCliente(id: string) {
    setGuias((prev) => prev.map((g) => g.id === id ? { ...g, status: "enviada" as const } : g));
  }

  function registrarPagamento(id: string) {
    setGuias((prev) => prev.map((g) => g.id === id ? { ...g, status: "paga" as const } : g));
    setRegistrandoPag(null);
  }

  /* ── Stats dinamicos ── */
  const pendentes = obrigacoes.filter((o) => ["pendente", "em_andamento", "aguardando_cliente", "em_revisao"].includes(o.status)).length;
  const entregues = obrigacoes.filter((o) => ["transmitido", "concluido"].includes(o.status)).length;
  const aVencer = obrigacoes.filter((o) => o.status === "pendente").length;
  const guiasEmitidas = guias.filter((g) => ["emitida", "enviada", "paga"].includes(g.status)).length;
  const totalGuias = guias.filter((g) => g.status !== "paga").reduce((acc, g) => acc + (g.valor ?? 0), 0);

  /* ── Filtros obrigacoes ── */
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
      setorResumo="Apuracao, obrigacoes tributarias, guias e escrituracao digital"
      stats={[
        { label: "Pendentes", value: String(pendentes), cor: "#fbbf24" },
        { label: "Entregues", value: String(entregues), cor: "#34d399" },
        { label: "Guias emitidas", value: String(guiasEmitidas), cor: "#fff" },
        { label: "Total guias", value: fmt(totalGuias), cor: "#fff" },
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

        {loading && <LoadingSkeleton />}

        {/* ════════════════════════════════════════
            TAB: VISAO GERAL
        ════════════════════════════════════════ */}
        {!loading && tab === "visao_geral" && (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Obrigacoes pendentes", value: pendentes, color: "#fbbf24", bg: "#fffbeb" },
                { label: "Entregues no mes", value: entregues, color: "#10b981", bg: "#f0fdf4" },
                { label: "A vencer", value: aVencer, color: "#f59e0b", bg: "#fff7ed" },
                { label: "Guias emitidas", value: guiasEmitidas, color: "#3b82f6", bg: "#eff6ff" },
              ].map((kpi) => (
                <div key={kpi.label} style={{ background: kpi.bg, border: `1px solid ${kpi.color}22`, borderRadius: 12, padding: "1rem 1.25rem", borderTop: `3px solid ${kpi.color}` }}>
                  <p style={{ margin: "0 0 0.5rem", fontSize: "0.72rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.5px" }}>{kpi.label}</p>
                  <p style={{ margin: 0, fontSize: "1.75rem", fontWeight: 800, color: kpi.color }}>{kpi.value}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {/* Proximas obrigacoes */}
              <div className="list-panel">
                <div className="list-panel-header">
                  <div><h2>Proximas obrigacoes</h2><p>Vencimentos em aberto</p></div>
                  <button className="small-action" onClick={() => setTab("obrigacoes")} type="button">Ver todas</button>
                </div>
                <div style={{ padding: "0 12px 12px" }}>
                  {obrigacoes.filter((o) => !["transmitido", "concluido"].includes(o.status)).length === 0 && (
                    <EmptyState message="Nenhuma obrigacao pendente." />
                  )}
                  {obrigacoes.filter((o) => !["transmitido", "concluido"].includes(o.status)).slice(0, 5).map((ob) => (
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

              {/* Certidoes resumo */}
              <div className="list-panel">
                <div className="list-panel-header">
                  <div><h2>Certidoes</h2><p>Situacao fiscal</p></div>
                  <button className="small-action" onClick={() => setTab("certidoes")} type="button">Ver todas</button>
                </div>
                <div style={{ padding: "0 12px 12px" }}>
                  {certidoes.length === 0 && <EmptyState message="Nenhuma certidao cadastrada." />}
                  {certidoes.slice(0, 4).map((cert, i) => {
                    const cfg = STATUS_CERT[cert.status];
                    return (
                      <div key={cert.id ?? i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", borderBottom: "1px solid #f0f7f3" }}>
                        <div>
                          <p style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "#07170d" }}>{cert.nome}</p>
                          <p style={{ margin: "2px 0 0", fontSize: "0.72rem", color: "#9ca3af" }}>{cert.esfera}</p>
                        </div>
                        <Badge cfg={cfg} />
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: OBRIGACOES
        ════════════════════════════════════════ */}
        {!loading && tab === "obrigacoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Obrigacoes fiscais</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{obsFiltradas.length} obrigac{obsFiltradas.length !== 1 ? "oes" : "ao"}</p>
              </div>
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
                <option value="media">Media</option>
                <option value="baixa">Baixa</option>
              </select>
              {(filtroStatusOb || filtroPrioOb) && (
                <button
                  className="small-action"
                  onClick={() => { setFiltroStatusOb(""); setFiltroPrioOb(""); }}
                  type="button"
                >X Limpar</button>
              )}
            </div>

            {obsFiltradas.length === 0 && <EmptyState message="Nenhuma obrigacao encontrada." />}

            {obsFiltradas.length > 0 && (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <TH>Obrigacao</TH>
                      <TH>Competencia</TH>
                      <TH>Vencimento</TH>
                      <TH>Responsavel</TH>
                      <TH>Prioridade</TH>
                      <TH>Status</TH>
                      <TH right>Acoes</TH>
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
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.78rem", fontWeight: 700, color: PRIO[ob.prioridade]?.color ?? "#6b7280" }}>
                            <span style={{ width: 7, height: 7, borderRadius: "50%", background: PRIO[ob.prioridade]?.color ?? "#6b7280", display: "inline-block" }} />
                            {PRIO[ob.prioridade]?.label ?? ob.prioridade}
                          </span>
                        </TD>
                        <TD><Badge cfg={STATUS_OBR[ob.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: ob.status }} /></TD>
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
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: GUIAS
        ════════════════════════════════════════ */}
        {!loading && tab === "guias" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Guias de Recolhimento</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>{guias.length} guias cadastradas</p>
              </div>
            </div>

            {guias.length === 0 && <EmptyState message="Nenhuma guia cadastrada." />}

            {guias.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Guia</TH>
                    <TH>Competencia</TH>
                    <TH>Vencimento</TH>
                    <TH right>Valor</TH>
                    <TH>Status</TH>
                    <TH right>Acoes</TH>
                  </tr>
                </thead>
                <tbody>
                  {guias.map((g) => (
                    <tr key={g.id}>
                      <TD>
                        <strong style={{ fontSize: "0.85rem" }}>{g.nome}</strong>
                        {g.codigo_barra && (
                          <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 2, fontFamily: "monospace" }}>
                            {g.codigo_barra.slice(0, 30)}...
                          </div>
                        )}
                      </TD>
                      <TD muted>{g.competencia}</TD>
                      <TD muted>{g.vencimento}</TD>
                      <TD right>
                        <strong style={{ color: g.valor > 0 ? "#07170d" : "#9ca3af" }}>
                          {g.valor > 0 ? fmt(g.valor) : "-"}
                        </strong>
                      </TD>
                      <TD><Badge cfg={STATUS_GUIA[g.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: g.status }} /></TD>
                      <TD right>
                        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                          {g.status === "pendente" && (
                            <button className="small-action" onClick={() => emitirGuia(g.id)} type="button">Emitir</button>
                          )}
                          {g.status === "emitida" && (
                            <button className="small-action" onClick={() => enviarCliente(g.id)} type="button">Enviar</button>
                          )}
                          {(g.status === "emitida" || g.status === "enviada") && (
                            <button
                              className="small-action"
                              onClick={() => setRegistrandoPag(g.id)}
                              type="button"
                            >Pago</button>
                          )}
                        </div>
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

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
                        <strong>{g.nome}</strong> - {g.competencia} - <strong>{fmt(g.valor)}</strong>
                      </p>
                      <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#374151", marginBottom: 6 }}>
                        Data do pagamento
                      </label>
                      <input className="input" defaultValue={new Date().toISOString().slice(0, 10)} style={{ marginBottom: "1rem" }} type="date" />
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <button className="small-action" onClick={() => setRegistrandoPag(null)} type="button">Cancelar</button>
                        <button onClick={() => registrarPagamento(g.id)} type="button">Confirmar pagamento</button>
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
        {!loading && tab === "sped" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>SPED - Escrituracao Digital</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Status de envio e protocolos</p>
              </div>
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

            {sped.length === 0 && <EmptyState message="Nenhum arquivo SPED cadastrado." />}

            {sped.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Tipo de arquivo</TH>
                    <TH>Competencia</TH>
                    <TH>Tamanho</TH>
                    <TH>Status</TH>
                    <TH>Protocolo</TH>
                    <TH>Data envio</TH>
                  </tr>
                </thead>
                <tbody>
                  {sped.map((arq) => (
                    <tr key={arq.id}>
                      <TD><strong style={{ fontSize: "0.85rem" }}>{arq.tipo}</strong></TD>
                      <TD muted>{arq.competencia}</TD>
                      <TD muted>{arq.tamanho ?? "-"}</TD>
                      <TD><Badge cfg={STATUS_SPED[arq.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: arq.status }} /></TD>
                      <TD muted>
                        {arq.protocolo
                          ? <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{arq.protocolo}</span>
                          : "-"}
                      </TD>
                      <TD muted>
                        {arq.data_envio
                          ? new Date(arq.data_envio).toLocaleString("pt-BR")
                          : "-"}
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════
            TAB: CERTIDOES
        ════════════════════════════════════════ */}
        {!loading && tab === "certidoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Certidoes Negativas</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6f8f7c" }}>Situacao fiscal federal, estadual e municipal</p>
              </div>
            </div>

            {certidoes.length === 0 && <EmptyState message="Nenhuma certidao cadastrada." />}

            {(["federal", "estadual", "municipal"] as Certidao["esfera"][]).map((esfera) => {
              const certs = certidoes.filter((c) => c.esfera === esfera);
              if (certs.length === 0) return null;
              const label = { federal: "Federal", estadual: "Estadual", municipal: "Municipal" }[esfera];
              return (
                <div className="list-panel" key={esfera}>
                  <div className="list-panel-header">
                    <div><h2>{label}</h2><p>{certs.length} certida{certs.length !== 1 ? "o(oes)" : "o"}</p></div>
                  </div>
                  <div style={{ padding: "0 1rem 1rem", display: "flex", flexDirection: "column", gap: 8 }}>
                    {certs.map((cert, i) => {
                      const cfg = STATUS_CERT[cert.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: cert.status, icon: "?" };
                      const vencendoEm7 = cert.validade && new Date(cert.validade) <= new Date(Date.now() + 7 * 86400000);
                      return (
                        <div
                          key={cert.id ?? i}
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
                                {cert.numero ? `No ${cert.numero}` : "Sem numero"}
                                {cert.validade && ` - Validade: ${new Date(cert.validade).toLocaleDateString("pt-BR")}`}
                                {vencendoEm7 && cert.status === "valida" && <span style={{ color: "#f59e0b", fontWeight: 700 }}> Vencendo em breve</span>}
                              </p>
                            </div>
                          </div>
                          <Badge cfg={cfg} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    </SetorShell>
  );
}
