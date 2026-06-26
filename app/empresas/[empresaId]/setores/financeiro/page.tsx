"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type StatusMensal = "em_dia" | "atrasado" | "inadimplente" | "cancelado";
type Plano = "basico" | "intermediario" | "premium" | "personalizado";
type FormaPgto = "boleto" | "pix" | "cartao" | "transferencia" | "dinheiro" | "debito";
type TabEsc = "dash_esc" | "mensalidades" | "comissoes" | "rel_esc";

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

/* ─── Ícone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M2 8h20M2 12h20" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <rect height={16} rx={3} stroke="currentColor" strokeWidth={2} width={20} x={2} y={4} />
    <path d="M6 16h4M14 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

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

const S_MENSAL: Record<StatusMensal, { bg: string; color: string; label: string }> = {
  em_dia:      { bg: "#f0fdf4", color: "#065f46", label: "Em dia" },
  atrasado:    { bg: "#fffbeb", color: "#92400e", label: "Atrasado" },
  inadimplente:{ bg: "#fef2f2", color: "#b91c1c", label: "Inadimplente" },
  cancelado:   { bg: "#f3f4f6", color: "#6b7280", label: "Cancelado" },
};

const FORMA_ICON: Record<FormaPgto, string> = {
  boleto: "🏦", pix: "⚡", cartao: "💳", transferencia: "↔", dinheiro: "💵", debito: "🏧",
};

const TABS_ESC: { id: TabEsc; label: string; icon: string }[] = [
  { id: "dash_esc",    label: "Dashboard",     icon: "◉" },
  { id: "mensalidades",label: "Mensalidades",  icon: "📅" },
  { id: "comissoes",   label: "Comissões",     icon: "💰" },
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

  const [loading, setLoading] = useState(true);
  const [tabEsc, setTabEsc] = useState<TabEsc>("dash_esc");

  const [mensalidades, setMensalidades] = useState<Mensalidade[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [log, setLog] = useState<LogFin[]>([]);

  /* Filtros */
  const [filtMensalStatus, setFiltMensalStatus] = useState<StatusMensal | "">("");

  /* ── Carregar dados reais ── */
  useEffect(() => {
    fetch(`/api/empresas/${empresaId}/setores/financeiro`)
      .then(r => r.json())
      .then(json => {
        setMensalidades(json.data?.mensalidades ?? []);
        setComissoes(json.data?.comissoes ?? []);
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

  /* ── Mensalidades ── */
  function marcarMensalidadePaga(id: string) {
    setMensalidades((prev) => prev.map((m) => {
      if (m.id !== id) return m;
      audit("Mensalidade paga", "Mensalidades", `${m.cliente} — ${fmt(m.valor)}`);
      return { ...m, status: "em_dia" };
    }));
  }

  function emitirCobranca(id: string, forma: FormaPgto) {
    audit("Cobrança emitida", "Mensalidades", `${mensalidades.find((m) => m.id === id)?.cliente} — via ${forma.toUpperCase()}`);
  }

  /* ── Comissões ── */
  function pagarComissao(id: string) {
    setComissoes((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      audit("Comissão paga", "Comissões", `${c.colaborador} — ${fmt(c.valor)}`);
      return { ...c, status: "pago" };
    }));
  }

  /* ── Métricas ── */
  const mrr = mensalidades.filter((m) => m.status !== "cancelado").reduce((a, m) => a + m.valor, 0);
  const inadimplentes = mensalidades.filter((m) => m.status === "inadimplente" || m.status === "atrasado").length;
  const clientesAtivos = mensalidades.filter((m) => m.status !== "cancelado").length;
  const ticketMedio = clientesAtivos > 0 ? mrr / clientesAtivos : 0;

  const mensalFiltrada = mensalidades.filter((m) => filtMensalStatus === "" || m.status === filtMensalStatus);

  /* ── Loading ── */
  if (loading) {
    return (
      <SetorShell borda="#67e8f9" cor="#0e7490" empresaId={empresaId} empresaNome="Empresa" fundo="#ecfeff" icone={ICONE} setorNome="Financeiro do Escritório" setorResumo="Carregando..." stats={[]}>
        <div style={{ padding: "3rem", textAlign: "center", color: "#0e7490", fontSize: "1rem", fontWeight: 700 }}>Carregando...</div>
      </SetorShell>
    );
  }

  /* ─── Render ─── */
  return (
    <SetorShell
      borda="#67e8f9"
      cor="#0e7490"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#ecfeff"
      icone={ICONE}
      setorNome="Financeiro do Escritório"
      setorResumo="Gestão financeira, mensalidades, cobranças e comissões do escritório contábil"
      stats={[
        { label: "MRR",           value: fmt(mrr),              cor: "#c4b5fd" },
        { label: "Clientes ativos",value: String(clientesAtivos),cor: "#67e8f9" },
        { label: "Ticket médio",  value: fmt(ticketMedio),      cor: "#a5f3fc" },
        { label: "Inadimplentes", value: String(inadimplentes), cor: inadimplentes > 0 ? "#fca5a5" : "#34d399" },
      ]}
    >

      {/* ── Tabs ── */}
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

        {/* ════════════ DASHBOARD ════════════ */}
        {tabEsc === "dash_esc" && (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              <KpiCard label="MRR"             value={fmt(mrr)}              sub="Receita recorrente mensal" color="#7c3aed" bg="#f5f3ff" />
              <KpiCard label="Inadimplentes"    value={String(inadimplentes)} sub={`de ${clientesAtivos} clientes`} color={inadimplentes > 0 ? "#b91c1c" : "#065f46"} bg={inadimplentes > 0 ? "#fef2f2" : "#f0fdf4"} />
              <KpiCard label="Clientes ativos"  value={String(clientesAtivos)} sub="Mensalidades ativas"      color="#0e7490" bg="#ecfeff" />
              <KpiCard label="Ticket médio"     value={fmt(ticketMedio)}      sub="Por cliente ativo"         color="#92400e" bg="#fffbeb" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {/* Distribuição por plano */}
              <div className="list-panel">
                <div className="list-panel-header"><div><h2>Distribuição por plano</h2></div></div>
                <div style={{ padding: "0.5rem 1rem 0.75rem" }}>
                  {mensalidades.length === 0 ? (
                    <p style={{ textAlign: "center", color: "#9ca3af", padding: "1rem", fontSize: "0.85rem" }}>Nenhuma mensalidade cadastrada</p>
                  ) : (["premium","intermediario","basico","personalizado"] as Plano[]).map((plano) => {
                    const count = mensalidades.filter((m) => m.plano === plano && m.status !== "cancelado").length;
                    const receita = mensalidades.filter((m) => m.plano === plano && m.status !== "cancelado").reduce((a, m) => a + m.valor, 0);
                    return (
                      <div key={plano} style={{ padding: "7px 0", borderBottom: "1px solid #f5f3ff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: "0.8rem", fontWeight: 700 }}>{PLANO_LABEL[plano]}</span>
                          <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{count} cliente(s) - <strong style={{ color: "#7c3aed" }}>{fmt(receita)}</strong></span>
                        </div>
                        <div style={{ height: 5, background: "#f5f3ff", borderRadius: 999, overflow: "hidden" }}>
                          <div style={{ height: "100%", width: `${mrr > 0 ? (receita / mrr) * 100 : 0}%`, background: PLANO_COLOR[plano].color, borderRadius: 999 }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Comissões pendentes */}
              <div className="list-panel">
                <div className="list-panel-header"><div><h2>Comissões pendentes</h2></div></div>
                <div style={{ padding: "0.5rem 1rem 0.75rem" }}>
                  {comissoes.filter((c) => c.status === "pendente").length === 0 ? (
                    <p style={{ textAlign: "center", color: "#9ca3af", padding: "1rem", fontSize: "0.85rem" }}>Nenhuma comissão pendente</p>
                  ) : comissoes.filter((c) => c.status === "pendente").map((c) => (
                    <div key={c.id} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid #f5f3ff" }}>
                      <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>{c.colaborador}</span>
                      <strong style={{ fontSize: "0.82rem", color: "#7c3aed" }}>{fmt(c.valor)}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Últimos eventos */}
            <div className="list-panel">
              <div className="list-panel-header"><div><h2>Últimos eventos</h2></div></div>
              <div style={{ padding: "0.25rem 0 0.75rem" }}>
                {log.length === 0 ? (
                  <p style={{ textAlign: "center", color: "#9ca3af", padding: "1rem", fontSize: "0.85rem" }}>Nenhum evento registrado</p>
                ) : log.slice(0, 5).map((entry) => (
                  <div key={entry.id} style={{ padding: "7px 1rem", borderBottom: "1px solid #f5f3ff" }}>
                    <p style={{ margin: "0 0 1px", fontSize: "0.8rem", fontWeight: 700, color: "#07170d" }}>{entry.acao}</p>
                    <p style={{ margin: "0 0 1px", fontSize: "0.75rem", color: "#6b7280" }}>{entry.detalhe}</p>
                    <p style={{ margin: 0, fontSize: "0.68rem", color: "#9ca3af" }}>{new Date(entry.data).toLocaleString("pt-BR")}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ════════════ MENSALIDADES ════════════ */}
        {tabEsc === "mensalidades" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Mensalidades</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>MRR: <strong style={{ color: "#7c3aed" }}>{fmt(mrr)}</strong> - {clientesAtivos} clientes</p></div>
              <div style={{ display: "flex", gap: 8 }}>
                <select className="input" onChange={(e) => setFiltMensalStatus(e.target.value as StatusMensal | "")} value={filtMensalStatus}>
                  <option value="">Todos</option>
                  <option value="em_dia">Em dia</option>
                  <option value="atrasado">Atrasado</option>
                  <option value="inadimplente">Inadimplente</option>
                </select>
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

            {mensalFiltrada.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhuma mensalidade encontrada</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead><tr><TH>Cliente</TH><TH>Plano</TH><TH right>Valor</TH><TH>Vencimento</TH><TH>Forma</TH><TH>Status</TH><TH right>Cobrar</TH><TH right>Ações</TH></tr></thead>
                <tbody>
                  {mensalFiltrada.map((m) => (
                    <tr key={m.id} style={{ background: m.status === "inadimplente" ? "#fff5f5" : m.status === "atrasado" ? "#fffdf0" : "transparent" }}>
                      <TD><div><p style={{ margin: "0 0 1px", fontWeight: 700 }}>{m.cliente}</p><p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>{m.email}</p></div></TD>
                      <TD><span style={{ fontSize: "0.72rem", fontWeight: 700, borderRadius: 999, padding: "2px 8px", ...PLANO_COLOR[m.plano] }}>{PLANO_LABEL[m.plano]}</span></TD>
                      <TD right bold color="#7c3aed">{fmt(m.valor)}</TD>
                      <TD muted>{new Date(m.vencimento).toLocaleDateString("pt-BR")}</TD>
                      <TD muted><span style={{ fontSize: "0.82rem" }}>{FORMA_ICON[m.forma]} {m.forma}</span></TD>
                      <TD><Badge {...S_MENSAL[m.status]} /></TD>
                      <TD right>
                        <div style={{ display: "flex", gap: 3, justifyContent: "flex-end" }}>
                          <button className="small-action" onClick={() => emitirCobranca(m.id, "boleto")} title="Boleto" type="button">🏦</button>
                          <button className="small-action" onClick={() => emitirCobranca(m.id, "pix")} title="PIX" type="button">⚡</button>
                        </div>
                      </TD>
                      <TD right>
                        {m.status !== "em_dia" && (
                          <button className="small-action" onClick={() => marcarMensalidadePaga(m.id)} type="button">✓ Pago</button>
                        )}
                      </TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════ COMISSOES ════════════ */}
        {tabEsc === "comissoes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Comissões de Colaboradores</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>Total pendente: <strong style={{ color: "#7c3aed" }}>{fmt(comissoes.filter((c) => c.status === "pendente").reduce((a, c) => a + c.valor, 0))}</strong></p></div>
              <button type="button">+ Nova comissão</button>
            </div>

            {comissoes.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9ca3af", padding: "2rem", fontSize: "0.9rem" }}>Nenhuma comissão cadastrada</p>
            ) : (
              <>
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
                        <p style={{ margin: 0, fontSize: "0.75rem", color: "#9ca3af" }}>Total: {fmt(total)} - Pend: {fmt(pendente)}</p>
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
                        <TD><Badge {...(c.status === "pago" ? { bg: "#f0fdf4", color: "#065f46", label: "Pago" } : { bg: "#f5f3ff", color: "#7c3aed", label: "Pendente" })} /></TD>
                        <TD right>{c.status === "pendente" && <button className="small-action" onClick={() => pagarComissao(c.id)} type="button">✓ Pagar</button>}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        )}

        {/* ════════════ RELATORIOS ════════════ */}
        {tabEsc === "rel_esc" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Relatórios Executivos</h2></div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Margem operacional", value: mrr > 0 ? `${((mrr / (mrr || 1)) * 100).toFixed(1)}%` : "—", color: "#065f46", bg: "#f0fdf4" },
                { label: "Taxa inadimplência", value: clientesAtivos > 0 ? `${((inadimplentes / clientesAtivos) * 100).toFixed(1)}%` : "0%", color: inadimplentes > 0 ? "#b91c1c" : "#065f46", bg: inadimplentes > 0 ? "#fef2f2" : "#f0fdf4" },
                { label: "Ticket médio", value: fmt(ticketMedio), color: "#0e7490", bg: "#ecfeff" },
              ].map((ind) => (
                <div key={ind.label} style={{ background: ind.bg, border: `1px solid ${ind.color}22`, borderTop: `3px solid ${ind.color}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>{ind.label}</p>
                  <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: ind.color }}>{ind.value}</p>
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
                  onClick={() => audit(`Relatório: ${r.label}`, "Relatórios", "Gerado")}
                  style={{ background: "#fff", border: "1px solid #c4b5fd", borderRadius: 12, padding: "1.25rem", textAlign: "left", cursor: "pointer", display: "flex", flexDirection: "column", gap: 8 }}
                  type="button"
                >
                  <span style={{ fontSize: "1.5rem" }}>{r.icon}</span>
                  <strong style={{ fontSize: "0.9rem", color: "#7c3aed" }}>{r.label}</strong>
                  <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>{r.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

    </SetorShell>
  );
}
