"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { SetorShell } from "@/components/empresas/SetorShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type TipoNota = "emitida" | "recebida";
type StatusNota = "autorizada" | "cancelada" | "denegada" | "inutilizada";
type SituacaoNota = "pendente" | "escriturada" | "conciliada" | "ignorada";
type ModeloNota = "55" | "65" | "nfse";

type NotaFiscal = {
  id: string;
  chave_acesso: string | null;
  numero: string;
  serie: string | null;
  modelo: ModeloNota;
  tipo: TipoNota;
  natureza_operacao: string | null;
  data_emissao: string;
  emitente_cnpj: string | null;
  emitente_nome: string | null;
  destinatario_cnpj: string | null;
  destinatario_nome: string | null;
  valor_total: number;
  valor_produtos: number;
  valor_servicos: number;
  valor_desconto: number;
  valor_icms: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  valor_iss: number;
  status: StatusNota;
  situacao: SituacaoNota;
};

type Resumo = {
  total: number;
  emitidas: number;
  recebidas: number;
  valor_emitidas: number;
  valor_recebidas: number;
  pendentes: number;
  escrituradas: number;
};

type Tab = "todas" | "emitidas" | "recebidas";

/* ─── Icone ───────────────────────────────────────────────────── */

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
    <path d="M14 2v6h6" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
    <path d="M8 13h8M8 17h5" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

/* ─── Configs visuais ─────────────────────────────────────────── */

const STATUS_NF: Record<StatusNota, { bg: string; color: string; label: string }> = {
  autorizada:   { bg: "#f0fdf4", color: "#166534", label: "Autorizada" },
  cancelada:    { bg: "#fef2f2", color: "#b91c1c", label: "Cancelada" },
  denegada:     { bg: "#fffbeb", color: "#92400e", label: "Denegada" },
  inutilizada:  { bg: "#f3f4f6", color: "#6b7280", label: "Inutilizada" },
};

const SITUACAO_NF: Record<SituacaoNota, { bg: string; color: string; label: string }> = {
  pendente:     { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
  escriturada:  { bg: "#eff6ff", color: "#1d4ed8", label: "Escriturada" },
  conciliada:   { bg: "#f0fdf4", color: "#166534", label: "Conciliada" },
  ignorada:     { bg: "#f3f4f6", color: "#6b7280", label: "Ignorada" },
};

const MODELO_LABEL: Record<ModeloNota, string> = {
  "55": "NF-e",
  "65": "NFC-e",
  nfse: "NFS-e",
};

const TABS: { id: Tab; label: string }[] = [
  { id: "todas", label: "Todas" },
  { id: "emitidas", label: "Emitidas" },
  { id: "recebidas", label: "Recebidas" },
];

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function fmtCnpj(cnpj: string | null) {
  if (!cnpj || cnpj.length !== 14) return cnpj ?? "-";
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
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
      {[1, 2, 3, 4].map((i) => (
        <div key={i} style={{ height: 48, background: "#f0f7f3", borderRadius: 8, animation: "pulse 1.5s infinite" }} />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
    </div>
  );
}

/* ─── Componente principal ────────────────────────────────────── */

export default function NotasFiscaisPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;

  const [tab, setTab] = useState<Tab>("todas");
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [resumo, setResumo] = useState<Resumo>({ total: 0, emitidas: 0, recebidas: 0, valor_emitidas: 0, valor_recebidas: 0, pendentes: 0, escrituradas: 0 });
  const [filtroSituacao, setFiltroSituacao] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [busca, setBusca] = useState("");
  const [detalhes, setDetalhes] = useState<NotaFiscal | null>(null);
  const [showSync, setShowSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ inseridas: number; total: number } | null>(null);
  const [syncToken, setSyncToken] = useState("");
  const [syncDataInicio, setSyncDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [syncDataFim, setSyncDataFim] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/notas-fiscais/${empresaId}`);
        if (!res.ok) throw new Error("Falha ao carregar notas");
        const json = await res.json();
        setNotas(json.data.notas ?? []);
        setResumo(json.data.resumo);
      } catch {
        // keep empty
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [empresaId]);

  async function sincronizar() {
    if (!syncToken) return;
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch(`/api/notas-fiscais/${empresaId}/sincronizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: syncToken, dataInicio: syncDataInicio, dataFim: syncDataFim }),
      });
      const json = await res.json();
      if (res.ok) {
        setSyncResult({ inseridas: json.data.inseridas, total: json.data.total });
        const reload = await fetch(`/api/notas-fiscais/${empresaId}`);
        if (reload.ok) {
          const r = await reload.json();
          setNotas(r.data.notas ?? []);
          setResumo(r.data.resumo);
        }
      }
    } catch {
      // silently fail
    } finally {
      setSyncing(false);
    }
  }

  async function mudarSituacao(notaId: string, situacao: SituacaoNota) {
    const res = await fetch(`/api/notas-fiscais/${empresaId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notaId, situacao }),
    });
    if (res.ok) {
      setNotas((prev) => prev.map((n) => n.id === notaId ? { ...n, situacao } : n));
      if (detalhes?.id === notaId) setDetalhes({ ...detalhes, situacao });
    }
  }

  const notasFiltradas = notas.filter((n) => {
    if (tab === "emitidas" && n.tipo !== "emitida") return false;
    if (tab === "recebidas" && n.tipo !== "recebida") return false;
    if (filtroSituacao && n.situacao !== filtroSituacao) return false;
    if (filtroModelo && n.modelo !== filtroModelo) return false;
    if (busca) {
      const q = busca.toLowerCase();
      const match = (n.numero?.toLowerCase().includes(q))
        || (n.emitente_nome?.toLowerCase().includes(q))
        || (n.destinatario_nome?.toLowerCase().includes(q))
        || (n.emitente_cnpj?.includes(q))
        || (n.destinatario_cnpj?.includes(q))
        || (n.chave_acesso?.includes(q));
      if (!match) return false;
    }
    return true;
  });

  const totalFiltrado = notasFiltradas.reduce((s, n) => s + Number(n.valor_total), 0);

  return (
    <SetorShell
      borda="#a5b4fc"
      cor="#312e81"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#eef2ff"
      icone={ICONE}
      setorNome="Notas Fiscais"
      setorResumo="Consulta automatica de NFe, NFC-e e NFS-e emitidas e recebidas"
      stats={[
        { label: "Total", value: String(resumo.total), cor: "#fff" },
        { label: "Emitidas", value: fmt(resumo.valor_emitidas), cor: "#34d399" },
        { label: "Recebidas", value: fmt(resumo.valor_recebidas), cor: "#fbbf24" },
        { label: "Pendentes", value: String(resumo.pendentes), cor: "#f87171" },
      ]}
    >
      {/* ── Tabs ── */}
      <div style={{ background: "#fff", borderRadius: "12px 12px 0 0", border: "1px solid var(--border)", borderBottom: "none" }}>
        <div style={{ display: "flex", overflowX: "auto", padding: "0 8px" }}>
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                background: "none",
                border: "none",
                borderBottom: tab === t.id ? "2px solid #6366f1" : "2px solid transparent",
                color: tab === t.id ? "#312e81" : "#6f8f7c",
                cursor: "pointer",
                fontWeight: tab === t.id ? 800 : 500,
                fontSize: "0.82rem",
                padding: "0.9rem 1rem",
                whiteSpace: "nowrap",
                marginBottom: -2,
                transition: "color 0.15s",
              }}
              type="button"
            >
              {t.label}
              {t.id === "todas" && <span style={{ marginLeft: 6, background: "#eef2ff", color: "#4f46e5", borderRadius: 999, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>{resumo.total}</span>}
              {t.id === "emitidas" && <span style={{ marginLeft: 6, background: "#f0fdf4", color: "#166534", borderRadius: 999, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>{resumo.emitidas}</span>}
              {t.id === "recebidas" && <span style={{ marginLeft: 6, background: "#fffbeb", color: "#92400e", borderRadius: 999, padding: "1px 7px", fontSize: "0.7rem", fontWeight: 700 }}>{resumo.recebidas}</span>}
            </button>
          ))}
        </div>
      </div>

      <div style={{ background: "#fff", border: "1px solid var(--border)", borderTop: "none", borderRadius: "0 0 12px 12px", padding: "1.5rem" }}>

        {loading && <LoadingSkeleton />}

        {!loading && (
          <>
            {/* ── Botao sincronizar ── */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "1rem" }}>
              <button
                onClick={() => { setShowSync(true); setSyncResult(null); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                type="button"
              >
                <svg fill="none" height={16} viewBox="0 0 24 24" width={16}><path d="M21 12a9 9 0 1 1-3-6.7" stroke="currentColor" strokeLinecap="round" strokeWidth={2.5}/><path d="M21 3v6h-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/></svg>
                Sincronizar NFS-e
              </button>
            </div>

            {/* ── Filtros ── */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
              <input
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por numero, nome ou CNPJ..."
                style={{ flex: 1, minWidth: 200, padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none" }}
                type="text"
                value={busca}
              />
              <select
                onChange={(e) => setFiltroSituacao(e.target.value)}
                style={{ padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.82rem", background: "#fff", cursor: "pointer" }}
                value={filtroSituacao}
              >
                <option value="">Todas situacoes</option>
                <option value="pendente">Pendente</option>
                <option value="escriturada">Escriturada</option>
                <option value="conciliada">Conciliada</option>
                <option value="ignorada">Ignorada</option>
              </select>
              <select
                onChange={(e) => setFiltroModelo(e.target.value)}
                style={{ padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.82rem", background: "#fff", cursor: "pointer" }}
                value={filtroModelo}
              >
                <option value="">Todos modelos</option>
                <option value="55">NF-e</option>
                <option value="65">NFC-e</option>
                <option value="nfse">NFS-e</option>
              </select>
            </div>

            {/* ── Resumo inline ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", fontSize: "0.82rem", color: "#6f8f7c" }}>
              <span>{notasFiltradas.length} nota{notasFiltradas.length !== 1 ? "s" : ""} encontrada{notasFiltradas.length !== 1 ? "s" : ""}</span>
              <span style={{ fontWeight: 700, color: "#07170d" }}>Total: {fmt(totalFiltrado)}</span>
            </div>

            {/* ── Tabela ── */}
            {notasFiltradas.length === 0 ? (
              <EmptyState message="Nenhuma nota fiscal encontrada." />
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <TH>Numero</TH>
                      <TH>Modelo</TH>
                      <TH>Tipo</TH>
                      <TH>Emitente / Destinatario</TH>
                      <TH>Data</TH>
                      <TH right>Valor</TH>
                      <TH>Status</TH>
                      <TH>Situacao</TH>
                      <TH>Acoes</TH>
                    </tr>
                  </thead>
                  <tbody>
                    {notasFiltradas.map((n) => {
                      const parceiro = n.tipo === "recebida"
                        ? (n.emitente_nome ?? fmtCnpj(n.emitente_cnpj))
                        : (n.destinatario_nome ?? fmtCnpj(n.destinatario_cnpj));
                      return (
                        <tr key={n.id} style={{ cursor: "pointer" }} onClick={() => setDetalhes(n)}>
                          <TD><span style={{ fontWeight: 600 }}>{n.numero}</span>{n.serie ? <span style={{ color: "#6f8f7c", fontSize: "0.75rem" }}> /{n.serie}</span> : null}</TD>
                          <TD><span style={{ background: "#f3f4f6", borderRadius: 4, padding: "2px 6px", fontSize: "0.73rem", fontWeight: 600 }}>{MODELO_LABEL[n.modelo]}</span></TD>
                          <TD><span style={{ color: n.tipo === "emitida" ? "#166534" : "#92400e", fontWeight: 600, fontSize: "0.8rem" }}>{n.tipo === "emitida" ? "Emitida" : "Recebida"}</span></TD>
                          <TD>{parceiro}</TD>
                          <TD muted>{fmtData(n.data_emissao)}</TD>
                          <TD right><span style={{ fontWeight: 600 }}>{fmt(n.valor_total)}</span></TD>
                          <TD><Badge cfg={STATUS_NF[n.status]} /></TD>
                          <TD><Badge cfg={SITUACAO_NF[n.situacao]} /></TD>
                          <TD>
                            <select
                              onClick={(e) => e.stopPropagation()}
                              onChange={(e) => mudarSituacao(n.id, e.target.value as SituacaoNota)}
                              value={n.situacao}
                              style={{ padding: "4px 8px", border: "1px solid #dfece5", borderRadius: 6, fontSize: "0.75rem", background: "#fff", cursor: "pointer" }}
                            >
                              <option value="pendente">Pendente</option>
                              <option value="escriturada">Escriturada</option>
                              <option value="conciliada">Conciliada</option>
                              <option value="ignorada">Ignorada</option>
                            </select>
                          </TD>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Modal de detalhes ── */}
      {detalhes && (
        <div
          onClick={() => setDetalhes(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 620, maxHeight: "85vh", overflow: "auto", padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#07170d" }}>
                  {MODELO_LABEL[detalhes.modelo]} N.{detalhes.numero}
                  {detalhes.serie ? ` / Serie ${detalhes.serie}` : ""}
                </h3>
                <p style={{ margin: "4px 0 0", fontSize: "0.82rem", color: "#6f8f7c" }}>
                  {detalhes.natureza_operacao ?? "Sem natureza informada"}
                </p>
              </div>
              <button
                onClick={() => setDetalhes(null)}
                style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#9ca3af", cursor: "pointer", padding: "0 4px" }}
                type="button"
              >x</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
              <InfoCard label="Tipo" value={detalhes.tipo === "emitida" ? "Emitida" : "Recebida"} />
              <InfoCard label="Data Emissao" value={fmtData(detalhes.data_emissao)} />
              <InfoCard label="Emitente" value={detalhes.emitente_nome ?? "-"} sub={fmtCnpj(detalhes.emitente_cnpj)} />
              <InfoCard label="Destinatario" value={detalhes.destinatario_nome ?? "-"} sub={fmtCnpj(detalhes.destinatario_cnpj)} />
            </div>

            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#07170d", fontWeight: 700 }}>Valores</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <ValorItem label="Total" valor={detalhes.valor_total} destaque />
              <ValorItem label="Produtos" valor={detalhes.valor_produtos} />
              <ValorItem label="Servicos" valor={detalhes.valor_servicos} />
              <ValorItem label="Desconto" valor={detalhes.valor_desconto} />
            </div>

            <h4 style={{ margin: "0 0 0.75rem", fontSize: "0.85rem", color: "#07170d", fontWeight: 700 }}>Impostos</h4>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "0.5rem", marginBottom: "1.5rem" }}>
              <ValorItem label="ICMS" valor={detalhes.valor_icms} />
              <ValorItem label="IPI" valor={detalhes.valor_ipi} />
              <ValorItem label="PIS" valor={detalhes.valor_pis} />
              <ValorItem label="COFINS" valor={detalhes.valor_cofins} />
              <ValorItem label="ISS" valor={detalhes.valor_iss} />
            </div>

            <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
              <Badge cfg={STATUS_NF[detalhes.status]} />
              <Badge cfg={SITUACAO_NF[detalhes.situacao]} />
            </div>

            {detalhes.chave_acesso && (
              <div style={{ marginTop: "1rem", padding: "0.75rem", background: "#f9fafb", borderRadius: 8, fontSize: "0.73rem", color: "#6f8f7c", wordBreak: "break-all" }}>
                <strong>Chave de acesso:</strong> {detalhes.chave_acesso}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Modal de sincronizacao ── */}
      {showSync && (
        <div
          onClick={() => setShowSync(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 480, padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#07170d" }}>Sincronizar NFS-e Nacional</h3>
              <button onClick={() => setShowSync(false)} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#9ca3af", cursor: "pointer" }} type="button">x</button>
            </div>

            <div style={{ background: "#eef2ff", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1.25rem", fontSize: "0.8rem", color: "#4338ca" }}>
              Para MEI: acesse <strong>nfse.gov.br</strong> com sua conta gov.br (nivel Prata ou Ouro), copie o token de acesso da API e cole abaixo.
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase", marginBottom: 4 }}>Token de acesso</label>
                <input
                  onChange={(e) => setSyncToken(e.target.value)}
                  placeholder="Cole o token da API NFS-e Nacional"
                  style={{ width: "100%", padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                  type="password"
                  value={syncToken}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase", marginBottom: 4 }}>Data inicio</label>
                  <input
                    onChange={(e) => setSyncDataInicio(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                    type="date"
                    value={syncDataInicio}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase", marginBottom: 4 }}>Data fim</label>
                  <input
                    onChange={(e) => setSyncDataFim(e.target.value)}
                    style={{ width: "100%", padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                    type="date"
                    value={syncDataFim}
                  />
                </div>
              </div>

              {syncResult && (
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#166534" }}>
                  {syncResult.inseridas} nota{syncResult.inseridas !== 1 ? "s" : ""} importada{syncResult.inseridas !== 1 ? "s" : ""} de {syncResult.total} encontrada{syncResult.total !== 1 ? "s" : ""}.
                </div>
              )}

              <button
                disabled={!syncToken || syncing}
                onClick={sincronizar}
                style={{
                  width: "100%",
                  padding: "0.7rem",
                  background: !syncToken ? "#d1d5db" : "linear-gradient(135deg, #4f46e5, #6366f1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 8,
                  fontSize: "0.875rem",
                  fontWeight: 700,
                  cursor: !syncToken ? "not-allowed" : "pointer",
                  opacity: syncing ? 0.7 : 1,
                }}
                type="button"
              >
                {syncing ? "Sincronizando..." : "Buscar notas"}
              </button>
            </div>
          </div>
        </div>
      )}
    </SetorShell>
  );
}

/* ─── Sub-componentes do modal ────────────────────────────────── */

function InfoCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: "#f9fafb", borderRadius: 8, padding: "0.75rem" }}>
      <div style={{ fontSize: "0.7rem", color: "#6f8f7c", fontWeight: 600, textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: "0.875rem", color: "#07170d", fontWeight: 600 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function ValorItem({ label, valor, destaque }: { label: string; valor: number; destaque?: boolean }) {
  return (
    <div style={{ background: destaque ? "#eef2ff" : "#f9fafb", borderRadius: 8, padding: "0.6rem 0.75rem" }}>
      <div style={{ fontSize: "0.65rem", color: "#6f8f7c", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: destaque ? "1rem" : "0.85rem", color: destaque ? "#4f46e5" : "#07170d", fontWeight: 700, marginTop: 2 }}>
        {valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
      </div>
    </div>
  );
}
