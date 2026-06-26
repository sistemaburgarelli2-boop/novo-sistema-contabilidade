"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type TipoConta = "ativo" | "passivo" | "pl" | "receita" | "custo" | "despesa";
type StatusLanc = "rascunho" | "conferido" | "fechado";
type StatusConc = "pendente" | "conciliado" | "ignorado" | "divergente";

type ContaPlano = {
  id: string; codigo: string; nome: string; tipo: TipoConta;
  nivel: number; pai_id: string | null; ativo: boolean;
  saldo: number; natureza: "devedora" | "credora";
};

type Lancamento = {
  id: string; data: string; documento: string; historico: string;
  conta_debito: string; conta_credito: string; valor: number;
  centro_custo: string; status: StatusLanc;
};

type MovConciliacao = {
  id: string; data: string; descricao: string; valor: number;
  tipo: "entrada" | "saida"; status: StatusConc; lanc_id: string | null;
};

type Tab = "dashboard" | "plano" | "lancamentos" | "conciliacao";

/* ─── Icone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" stroke="currentColor" strokeWidth={2} />
    <path d="M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <path d="M8 7h8M8 11h8M8 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

/* ─── Configuracoes visuais ───────────────────────────────────── */

const TIPO_CONTA_LABEL: Record<TipoConta, string> = {
  ativo: "Ativo", passivo: "Passivo", pl: "Patr. Liquido",
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
  { id: "dashboard",    label: "Dashboard",   icon: "O" },
  { id: "plano",        label: "Plano",       icon: "P" },
  { id: "lancamentos",  label: "Lancamentos", icon: "L" },
  { id: "conciliacao",  label: "Conciliacao", icon: "C" },
] as const;

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmt(v: number) {
  return Math.abs(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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
        <div key={i} style={{ height: 48, background: "#e8f0ff", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
    </div>
  );
}

/* ─── Componente principal ────────────────────────────────────── */

export default function ContabilPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [tab, setTab] = useState<Tab>("dashboard");
  const [loading, setLoading] = useState(true);
  const [plano, setPlano] = useState<ContaPlano[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [conciliacao, setConciliacao] = useState<MovConciliacao[]>([]);
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [novoLanc, setNovoLanc] = useState(false);
  const [ldebito, setLdebito] = useState(""); const [lcredito, setLcredito] = useState("");
  const [lvalor, setLvalor] = useState(""); const [lhist, setLhist] = useState("");
  const [ldata, setLdata] = useState(new Date().toISOString().slice(0, 10));
  const [ldoc, setLdoc] = useState(""); const [lcc, setLcc] = useState("");

  /* ── Fetch real data from API ── */
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/empresas/${empresaId}/setores/contabil`);
        if (!res.ok) throw new Error("Falha ao carregar dados contabeis");
        const json = await res.json();
        const d = json.data;
        const contas = d.planoContas ?? [];
        setPlano(contas);
        setLancamentos(d.lancamentos ?? []);
        setConciliacao(d.conciliacoes ?? []);
        // auto-expand top level accounts
        const topIds = new Set<string>(contas.filter((c: ContaPlano) => c.nivel <= 2).map((c: ContaPlano) => c.id));
        setExpandidos(topIds);
      } catch {
        // keep empty arrays on error
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [empresaId]);

  /* ── Adicionar lancamento ── */
  function handleAddLanc() {
    const v = parseFloat(lvalor.replace(",", "."));
    if (!lhist || !ldebito || !lcredito || isNaN(v)) return;
    const id = crypto.randomUUID();
    const novo: Lancamento = { id, data: ldata, documento: ldoc || "-", historico: lhist, conta_debito: ldebito, conta_credito: lcredito, valor: v, centro_custo: lcc || "-", status: "rascunho" };
    setLancamentos((prev) => [novo, ...prev]);
    setNovoLanc(false);
    setLdebito(""); setLcredito(""); setLvalor(""); setLhist(""); setLdoc(""); setLcc("");
  }

  function mudarStatusLanc(id: string, novo: StatusLanc) {
    setLancamentos((prev) => prev.map((l) => l.id !== id ? l : { ...l, status: novo }));
  }

  /* ── Conciliacao ── */
  function conciliar(id: string) {
    setConciliacao((prev) => prev.map((m) => m.id !== id ? m : { ...m, status: "conciliado" as const }));
  }
  function ignorar(id: string) {
    setConciliacao((prev) => prev.map((m) => m.id !== id ? m : { ...m, status: "ignorado" as const }));
  }

  /* ── Arvore plano de contas ── */
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
      plano.filter((c) => c.pai_id === paiId).forEach((c) => {
        resultado.push(c);
        if (expandidos.has(c.id)) visitar(c.id);
      });
    }
    visitar(null);
    return resultado;
  }

  /* ── Stats dinamicos ── */
  const totalLanc = lancamentos.length;
  const pendencias = lancamentos.filter((l) => l.status === "rascunho").length;
  const concAbertas = conciliacao.filter((c) => c.status === "pendente").length;

  const receita = lancamentos
    .filter((l) => plano.find((p) => p.codigo === l.conta_credito && p.tipo === "receita"))
    .reduce((acc, l) => acc + l.valor, 0);
  const despesa = lancamentos
    .filter((l) => plano.find((p) => p.codigo === l.conta_debito && (p.tipo === "despesa" || p.tipo === "custo")))
    .reduce((acc, l) => acc + l.valor, 0);
  const resultado = receita - despesa;

  /* ─── Render ─── */
  return (
    <SetorShell
      borda="#93c5fd"
      cor="#1e40af"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#eff6ff"
      icone={ICONE}
      setorNome="Setor Contabil"
      setorResumo="Escrituracao, conciliacao, demonstracoes financeiras e fechamento contabil"
      stats={[
        { label: "Lancamentos",    value: String(totalLanc), cor: "#93c5fd" },
        { label: "Pendencias",     value: String(pendencias), cor: pendencias > 0 ? "#fbbf24" : "#34d399" },
        { label: "Resultado",      value: fmt(resultado),     cor: resultado >= 0 ? "#34d399" : "#fca5a5" },
        { label: "Conciliacoes",   value: `${concAbertas} abertas`, cor: "#fff" },
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

        {loading && <LoadingSkeleton />}

        {/* ════════════════════════════════════
            DASHBOARD
        ════════════════════════════════════ */}
        {!loading && tab === "dashboard" && (
          <div style={{ display: "grid", gap: "1.25rem" }}>
            {/* KPI Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { label: "Lancamentos do mes", value: totalLanc, suffix: "registros", color: "#1e40af", bg: "#eff6ff" },
                { label: "Pendencias",          value: pendencias, suffix: "rascunhos", color: pendencias > 0 ? "#92400e" : "#065f46", bg: pendencias > 0 ? "#fffbeb" : "#f0fdf4" },
                { label: "Conciliacoes abertas",value: concAbertas, suffix: "pendentes", color: concAbertas > 0 ? "#92400e" : "#065f46", bg: concAbertas > 0 ? "#fffbeb" : "#f0fdf4" },
                { label: "Resultado",           value: resultado >= 0 ? fmt(resultado) : `(${fmt(resultado)})`, suffix: resultado >= 0 ? "lucro" : "prejuizo", color: resultado >= 0 ? "#065f46" : "#b91c1c", bg: resultado >= 0 ? "#f0fdf4" : "#fef2f2" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "1rem 1.25rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{k.label}</p>
                  <p style={{ margin: "0 0 2px", fontSize: typeof k.value === "number" ? "1.8rem" : "1.1rem", fontWeight: 800, color: k.color }}>{k.value}</p>
                  <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{k.suffix}</p>
                </div>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              {/* Alertas */}
              <div className="list-panel">
                <div className="list-panel-header"><div><h2>Alertas e Pendencias</h2></div></div>
                <div style={{ padding: "0.5rem 0 0.75rem" }}>
                  {pendencias === 0 && concAbertas === 0 && (
                    <div style={{ padding: "1rem", textAlign: "center", color: "#065f46", fontSize: "0.85rem" }}>Nenhuma pendencia!</div>
                  )}
                  {pendencias > 0 && (
                    <button
                      onClick={() => setTab("lancamentos")}
                      style={{ width: "100%", display: "flex", gap: 10, alignItems: "center", padding: "8px 1rem", borderBottom: "1px solid #f0f6ff", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                      type="button"
                    >
                      <span style={{ fontSize: "0.82rem", color: "#92400e", fontWeight: 600 }}>{pendencias} lancamento(s) em rascunho</span>
                    </button>
                  )}
                  {concAbertas > 0 && (
                    <button
                      onClick={() => setTab("conciliacao")}
                      style={{ width: "100%", display: "flex", gap: 10, alignItems: "center", padding: "8px 1rem", borderBottom: "1px solid #f0f6ff", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                      type="button"
                    >
                      <span style={{ fontSize: "0.82rem", color: "#92400e", fontWeight: 600 }}>{concAbertas} movimentos nao conciliados</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Ultimos lancamentos */}
              <div className="list-panel">
                <div className="list-panel-header">
                  <div><h2>Ultimos lancamentos</h2></div>
                  <button className="small-action" onClick={() => setTab("lancamentos")} type="button">Ver todos</button>
                </div>
                <div style={{ padding: "0.25rem 0 0.75rem" }}>
                  {lancamentos.length === 0 && <EmptyState message="Nenhum lancamento registrado." />}
                  {lancamentos.slice(0, 5).map((entry) => (
                    <div key={entry.id} style={{ padding: "7px 1rem", borderBottom: "1px solid #f0f6ff" }}>
                      <p style={{ margin: "0 0 1px", fontSize: "0.8rem", fontWeight: 700, color: "#07170d" }}>{entry.historico}</p>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>
                        {new Date(entry.data).toLocaleDateString("pt-BR")} - {fmt(entry.valor)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════
            PLANO DE CONTAS
        ════════════════════════════════════ */}
        {!loading && tab === "plano" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Plano de Contas</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>{plano.length} contas cadastradas - estrutura hierarquica</p>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="small-action" onClick={() => setExpandidos(new Set(plano.map((c) => c.id)))} type="button">Expandir tudo</button>
                <button className="small-action" onClick={() => setExpandidos(new Set())} type="button">Recolher tudo</button>
              </div>
            </div>

            {plano.length === 0 && <EmptyState message="Nenhuma conta cadastrada no plano de contas." />}

            {plano.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Codigo</TH>
                    <TH>Conta</TH>
                    <TH>Tipo</TH>
                    <TH>Natureza</TH>
                    <TH right>Saldo</TH>
                    <TH>Status</TH>
                  </tr>
                </thead>
                <tbody>
                  {contasVisiveis().map((conta) => {
                    const temFilhos = plano.some((c) => c.pai_id === conta.id);
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
                                {expanded ? "v" : ">"}
                              </button>
                            ) : <span style={{ display: "inline-block", width: 16 }} />}
                            <span style={{ fontWeight: conta.nivel === 1 ? 800 : conta.nivel === 2 ? 600 : 400, fontSize: conta.nivel === 1 ? "0.9rem" : "0.85rem", color: conta.nivel === 1 ? "#07170d" : "#374151" }}>
                              {conta.nome}
                            </span>
                          </div>
                        </TD>
                        <TD>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: TIPO_CONTA_COLOR[conta.tipo] ?? "#6b7280", background: `${TIPO_CONTA_COLOR[conta.tipo] ?? "#6b7280"}18`, borderRadius: 999, padding: "2px 8px" }}>
                            {TIPO_CONTA_LABEL[conta.tipo] ?? conta.tipo}
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            LANCAMENTOS
        ════════════════════════════════════ */}
        {!loading && tab === "lancamentos" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Lancamentos Contabeis</h2>
                <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>{lancamentos.length} lancamentos - diario geral</p>
              </div>
              <button onClick={() => setNovoLanc(!novoLanc)} type="button">{novoLanc ? "X Cancelar" : "+ Novo lancamento"}</button>
            </div>

            {/* Editor rapido */}
            {novoLanc && (
              <div style={{ background: "#f8faff", border: "1px solid #bfdbfe", borderRadius: 12, padding: "1.25rem" }}>
                <p style={{ margin: "0 0 1rem", fontWeight: 800, fontSize: "0.875rem", color: "#1e40af" }}>Novo lancamento</p>
                <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 1fr 100px 140px", gap: 10, marginBottom: 10 }}>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Data *
                    <input className="input" onChange={(e) => setLdata(e.target.value)} type="date" value={ldata} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Conta debito *
                    <select className="input" onChange={(e) => setLdebito(e.target.value)} value={ldebito}>
                      <option value="">Selecione...</option>
                      {plano.filter((c) => c.nivel >= 2).map((c) => <option key={c.id} value={c.codigo}>{c.codigo} - {c.nome}</option>)}
                    </select>
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Conta credito *
                    <select className="input" onChange={(e) => setLcredito(e.target.value)} value={lcredito}>
                      <option value="">Selecione...</option>
                      {plano.filter((c) => c.nivel >= 2).map((c) => <option key={c.id} value={c.codigo}>{c.codigo} - {c.nome}</option>)}
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
                    Historico / Descricao *
                    <input className="input" onChange={(e) => setLhist(e.target.value)} placeholder="Descreva o lancamento..." value={lhist} />
                  </label>
                  <label style={{ display: "flex", flexDirection: "column", gap: 3, fontSize: "0.75rem", fontWeight: 700, color: "#4b6e8e" }}>
                    Centro de custo
                    <input className="input" onChange={(e) => setLcc(e.target.value)} placeholder="Ex: Comercial" value={lcc} />
                  </label>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 20, fontSize: "0.8rem" }}>
                    <span style={{ color: "#1e40af" }}>D: <strong>{ldebito || "-"}</strong></span>
                    <span style={{ color: "#065f46" }}>C: <strong>{lcredito || "-"}</strong></span>
                    <span style={{ color: lvalor ? "#065f46" : "#9ca3af" }}>Valor: <strong>{lvalor ? fmt(parseFloat(lvalor.replace(",", ".")) || 0) : "-"}</strong></span>
                  </div>
                  <button
                    disabled={!lhist || !ldebito || !lcredito || !lvalor}
                    onClick={handleAddLanc}
                    style={{ opacity: (!lhist || !ldebito || !lcredito || !lvalor) ? 0.5 : 1 }}
                    type="button"
                  >
                    Registrar lancamento
                  </button>
                </div>
              </div>
            )}

            {lancamentos.length === 0 && !novoLanc && <EmptyState message="Nenhum lancamento registrado." />}

            {lancamentos.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Data</TH>
                    <TH>Documento</TH>
                    <TH>Historico</TH>
                    <TH>Debito</TH>
                    <TH>Credito</TH>
                    <TH right>Valor</TH>
                    <TH>Centro</TH>
                    <TH>Status</TH>
                    <TH right>Acoes</TH>
                  </tr>
                </thead>
                <tbody>
                  {lancamentos.map((l) => (
                    <tr key={l.id} style={{ background: l.status === "rascunho" ? "#fffbf0" : "transparent" }}>
                      <TD muted>{new Date(l.data).toLocaleDateString("pt-BR")}</TD>
                      <TD muted><span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{l.documento}</span></TD>
                      <TD>{l.historico}</TD>
                      <TD><span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#b91c1c", fontWeight: 600 }}>{l.conta_debito}</span></TD>
                      <TD><span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#065f46", fontWeight: 600 }}>{l.conta_credito}</span></TD>
                      <TD right bold>{fmt(l.valor)}</TD>
                      <TD muted>{l.centro_custo}</TD>
                      <TD><Badge {...(S_LANC[l.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: l.status })} /></TD>
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
            )}
          </div>
        )}

        {/* ════════════════════════════════════
            CONCILIACAO BANCARIA
        ════════════════════════════════════ */}
        {!loading && tab === "conciliacao" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div><h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800 }}>Conciliacao Bancaria</h2>
              <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#6b8faa" }}>{conciliacao.length} movimentos</p></div>
            </div>

            {/* KPIs */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { label: "Total movimentos", value: String(conciliacao.length), color: "#1e40af", bg: "#eff6ff" },
                { label: "Conciliados", value: String(conciliacao.filter((c) => c.status === "conciliado").length), color: "#065f46", bg: "#f0fdf4" },
                { label: "Itens pendentes", value: String(concAbertas), color: concAbertas > 0 ? "#92400e" : "#065f46", bg: concAbertas > 0 ? "#fffbeb" : "#f0fdf4" },
              ].map((k) => (
                <div key={k.label} style={{ background: k.bg, border: `1px solid ${k.color}22`, borderTop: `3px solid ${k.color}`, borderRadius: 12, padding: "0.875rem 1rem" }}>
                  <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6b7280", textTransform: "uppercase" }}>{k.label}</p>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 800, color: k.color }}>{k.value}</p>
                </div>
              ))}
            </div>

            {conciliacao.length === 0 && <EmptyState message="Nenhum movimento para conciliar." />}

            {conciliacao.length > 0 && (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Data</TH>
                    <TH>Descricao (banco)</TH>
                    <TH>Tipo</TH>
                    <TH right>Valor</TH>
                    <TH>Lancamento</TH>
                    <TH>Status</TH>
                    <TH right>Acoes</TH>
                  </tr>
                </thead>
                <tbody>
                  {conciliacao.map((m) => (
                    <tr key={m.id}>
                      <TD muted>{new Date(m.data).toLocaleDateString("pt-BR")}</TD>
                      <TD>{m.descricao}</TD>
                      <TD>
                        <span style={{ fontSize: "0.75rem", fontWeight: 700, color: m.tipo === "entrada" ? "#065f46" : "#b91c1c" }}>
                          {m.tipo === "entrada" ? "Entrada" : "Saida"}
                        </span>
                      </TD>
                      <TD right>
                        <strong style={{ color: m.tipo === "entrada" ? "#065f46" : "#b91c1c" }}>
                          {m.tipo === "entrada" ? "+" : "-"} {fmt(m.valor)}
                        </strong>
                      </TD>
                      <TD muted>
                        {m.lanc_id
                          ? <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "#1e40af" }}>Lanc. #{m.lanc_id}</span>
                          : "-"}
                      </TD>
                      <TD><Badge {...(S_CONC[m.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: m.status })} /></TD>
                      <TD right>
                        <div style={{ display: "flex", gap: 5, justifyContent: "flex-end" }}>
                          {m.status === "pendente" && (
                            <>
                              <button className="small-action" onClick={() => conciliar(m.id)} type="button">Conciliar</button>
                              <button className="small-action" onClick={() => ignorar(m.id)} type="button">Ignorar</button>
                            </>
                          )}
                        </div>
                      </TD>
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
