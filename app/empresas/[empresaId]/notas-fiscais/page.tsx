"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

/* ─── Servicos favoritos ──────────────────────────────────────── */

type ItemFavorito = { descricao: string; quantidade: number; valor_unitario: number };

type ServicoFavorito = {
  id: string;
  nome: string;
  modo?: "simplificada" | "completa";
  modelo: string;
  itens: ItemFavorito[];
};

function totalFavorito(f: ServicoFavorito) {
  return (f.itens ?? []).reduce((s, i) => s + (Number(i.quantidade) || 0) * (Number(i.valor_unitario) || 0), 0);
}

/* ─── Acoes do documento (XML / DANFSe / espelho) ─────────────── */

function acaoDocStyle(cor: string): React.CSSProperties {
  return {
    display: "inline-flex", alignItems: "center", gap: 6, padding: "0.5rem 0.9rem",
    background: cor, color: "#fff", border: "none", borderRadius: 6,
    fontSize: "0.78rem", fontWeight: 600, textDecoration: "none", cursor: "pointer",
  };
}

const acaoIconeStyle: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  width: 26, height: 26, borderRadius: 6, border: "1px solid #dfece5",
  color: "#37418c", background: "#fff", textDecoration: "none",
};

function IconeDanfse() {
  return (
    <svg fill="none" height={15} viewBox="0 0 24 24" width={15}>
      <path d="M7 3h7l4 4v14H7V3z" stroke="currentColor" strokeLinejoin="round" strokeWidth={1.8} />
      <path d="M9.5 12h5M9.5 15h5" stroke="currentColor" strokeLinecap="round" strokeWidth={1.6} />
    </svg>
  );
}

function IconeDownload() {
  return (
    <svg fill="none" height={15} viewBox="0 0 24 24" width={15}>
      <path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <path d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    </svg>
  );
}

function IconeOlho() {
  return (
    <svg fill="none" height={15} viewBox="0 0 24 24" width={15}>
      <path d="M2 12s3.6-6 10-6 10 6 10 6-3.6 6-10 6-10-6-10-6z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth={2} />
    </svg>
  );
}

/* ─── Componente principal ────────────────────────────────────── */

export default function NotasFiscaisPage() {
  const params = useParams();
  const router = useRouter();
  const empresaId = params.empresaId as string;

  const [tab, setTab] = useState<Tab>("todas");
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<NotaFiscal[]>([]);
  const [resumo, setResumo] = useState<Resumo>({ total: 0, emitidas: 0, recebidas: 0, valor_emitidas: 0, valor_recebidas: 0, pendentes: 0, escrituradas: 0 });
  const [filtroSituacao, setFiltroSituacao] = useState("");
  const [filtroModelo, setFiltroModelo] = useState("");
  const [busca, setBusca] = useState("");
  const [detalhes, setDetalhes] = useState<NotaFiscal | null>(null);
  const [erroCarregar, setErroCarregar] = useState<string | null>(null);
  const [showEmitir, setShowEmitir] = useState(false);
  const [verFavoritos, setVerFavoritos] = useState(false);
  const [favoritos, setFavoritos] = useState<ServicoFavorito[]>([]);
  const [showSync, setShowSync] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ inseridas: number; duplicadas: number; ignoradas: number; total: number; avisos: string[] } | null>(null);
  const [syncErro, setSyncErro] = useState<string | null>(null);
  const [syncToken, setSyncToken] = useState("");
  const [syncDataInicio, setSyncDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split("T")[0];
  });
  const [syncDataFim, setSyncDataFim] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    fetch(`/api/notas-fiscais/${empresaId}/favoritos`)
      .then((r) => r.json())
      .then((json) => setFavoritos(json?.data?.favoritos ?? []))
      .catch(() => setFavoritos([]));
  }, [empresaId]);

  const docUrl = (notaId: string, formato: "xml" | "danfse", imprimir = false) =>
    `/api/notas-fiscais/${empresaId}/${notaId}/documento?formato=${formato}${imprimir ? "&imprimir=1" : ""}`;

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/notas-fiscais/${empresaId}`);
        const json = await res.json();
        // Uma lista vazia por falha de carregamento e indistinguivel de "nenhuma
        // nota emitida" — por isso o erro precisa aparecer na tela.
        if (!res.ok) throw new Error(json.error || `Falha ao carregar notas (HTTP ${res.status}).`);
        setNotas(json.data.notas ?? []);
        setResumo(json.data.resumo);
        setErroCarregar(null);
      } catch (e) {
        setErroCarregar(e instanceof Error ? e.message : "Falha ao carregar notas.");
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
    setSyncErro(null);
    try {
      const res = await fetch(`/api/notas-fiscais/${empresaId}/sincronizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: syncToken, dataInicio: syncDataInicio, dataFim: syncDataFim }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSyncErro(json.error || json.message || `Falha na sincronizacao (HTTP ${res.status}).`);
        return;
      }
      setSyncResult({
        inseridas: json.data.inseridas,
        duplicadas: json.data.duplicadas,
        ignoradas: json.data.ignoradas_sem_chave ?? 0,
        total: json.data.total,
        avisos: json.data.avisos ?? [],
      });
      const reload = await fetch(`/api/notas-fiscais/${empresaId}`);
      if (reload.ok) {
        const r = await reload.json();
        setNotas(r.data.notas ?? []);
        setResumo(r.data.resumo);
      }
    } catch (e) {
      setSyncErro(e instanceof Error ? e.message : "Nao foi possivel contatar o servidor.");
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

        {!loading && erroCarregar && (
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.75rem 1rem", marginBottom: "1rem", color: "#b91c1c", fontSize: "0.82rem", fontWeight: 600 }}>
            {erroCarregar}
          </div>
        )}

        {!loading && (
          <>
            {/* ── Botões de ação ── */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginBottom: "1rem" }}>
              <button
                onClick={() => { setVerFavoritos(false); setShowEmitir(true); }}
                style={{ display: "flex", alignItems: "center", gap: 6, padding: "0.5rem 1rem", background: "linear-gradient(135deg, #065f46, #10b981)", color: "#fff", border: "none", borderRadius: 8, fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}
                type="button"
              >
                <svg fill="none" height={16} viewBox="0 0 24 24" width={16}><path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth={2.5}/></svg>
                Emitir nota fiscal
              </button>
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
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
                              <a
                                href={docUrl(n.id, "xml")}
                                onClick={(e) => e.stopPropagation()}
                                style={acaoIconeStyle}
                                title="Baixar XML"
                              >
                                <IconeDownload />
                              </a>
                              <a
                                href={docUrl(n.id, "danfse", true)}
                                onClick={(e) => e.stopPropagation()}
                                rel="noreferrer"
                                style={acaoIconeStyle}
                                target="_blank"
                                title="Baixar DANFSe"
                              >
                                <IconeDanfse />
                              </a>
                              <a
                                href={docUrl(n.id, "danfse")}
                                onClick={(e) => e.stopPropagation()}
                                rel="noreferrer"
                                style={acaoIconeStyle}
                                target="_blank"
                                title="Visualizar NFS-e"
                              >
                                <IconeOlho />
                              </a>
                            </div>
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

            {/* ── Acoes do documento ── */}
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "1.25rem" }}>
              <a
                href={docUrl(detalhes.id, "xml")}
                style={acaoDocStyle("#37418c")}
              >
                <IconeDownload />
                Baixar XML
              </a>
              <a
                href={docUrl(detalhes.id, "danfse", true)}
                rel="noreferrer"
                target="_blank"
                style={acaoDocStyle("#37418c")}
              >
                <IconeDownload />
                Baixar DANFSe
              </a>
              <a
                href={docUrl(detalhes.id, "danfse")}
                rel="noreferrer"
                target="_blank"
                style={acaoDocStyle("#6b7280")}
              >
                <IconeOlho />
                Visualizar NFS-e
              </a>
            </div>
          </div>
        </div>
      )}
      {/* ── Modal: tipo de emissao ── */}
      {showEmitir && (
        <div
          onClick={() => { setShowEmitir(false); setVerFavoritos(false); }}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999, padding: "1rem" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: 14, width: "100%", maxWidth: 560, padding: "2rem", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
              <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#07170d" }}>
                {verFavoritos ? "Escolha um servico favorito" : "Como deseja emitir a nota?"}
              </h3>
              <button onClick={() => { setShowEmitir(false); setVerFavoritos(false); }} style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#9ca3af", cursor: "pointer", lineHeight: 1 }} type="button">x</button>
            </div>
            <p style={{ margin: "0 0 1.5rem", fontSize: "0.82rem", color: "#6f8f7c" }}>
              {verFavoritos
                ? "O formulario abre preenchido com o servico, no formato em que o favorito foi salvo."
                : "Escolha o formato do formulario de emissao da NFS-e."}
            </p>

            {/* ── Lista de favoritos ── */}
            {verFavoritos ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {favoritos.length === 0 ? (
                  <div style={{ padding: "1.5rem", textAlign: "center", color: "#9ca3af", fontSize: "0.82rem", background: "#f9fafb", borderRadius: 10 }}>
                    Nenhum servico favoritado ainda. Ao terminar uma emissao, use <strong>Favoritar servico</strong> para salvar.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", maxHeight: "45vh", overflowY: "auto" }}>
                    {favoritos.map((f) => {
                      const simples = f.modo === "simplificada";
                      const cor = simples ? "#065f46" : "#37418c";
                      return (
                        <button
                          key={f.id}
                          onClick={() => router.push(`/empresas/${empresaId}/notas-fiscais/emitir?modo=${simples ? "simplificada" : "completa"}&favorito=${f.id}`)}
                          style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "0.85rem 1rem", background: "#fff", border: "1.5px solid #e5e7eb", borderRadius: 10, cursor: "pointer", width: "100%" }}
                          type="button"
                        >
                          <span style={{ color: "#b7891f", flexShrink: 0 }}>
                            <svg fill="currentColor" height={18} viewBox="0 0 24 24" width={18}><path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5z"/></svg>
                          </span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ display: "block", fontSize: "0.88rem", fontWeight: 700, color: "#07170d" }}>{f.nome}</span>
                            <span style={{ display: "block", fontSize: "0.76rem", color: "#6b7280", marginTop: 2 }}>
                              {(f.itens ?? []).map((i) => i.descricao).filter(Boolean).join(" · ") || "Sem descricao"} — {fmt(totalFavorito(f))}
                            </span>
                          </span>
                          <span style={{ flexShrink: 0, fontSize: "0.68rem", fontWeight: 700, padding: "3px 8px", borderRadius: 999, color: cor, background: simples ? "#f0fdf4" : "#eef2ff", border: `1px solid ${simples ? "#86efac" : "#c7d2fe"}` }}>
                            {simples ? "Simplificada" : "Completa"}
                          </span>
                          <svg fill="none" height={16} style={{ color: "#9ca3af", flexShrink: 0 }} viewBox="0 0 24 24" width={16}><path d="M9 5l7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}/></svg>
                        </button>
                      );
                    })}
                  </div>
                )}
                <button
                  onClick={() => setVerFavoritos(false)}
                  style={{ alignSelf: "flex-start", background: "none", border: "none", color: "#6f8f7c", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer", padding: 0, marginTop: "0.25rem" }}
                  type="button"
                >
                  &lt; Voltar
                </button>
              </div>
            ) : (

            <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {[
                {
                  modo: "simplificada",
                  titulo: "Emissao simplificada",
                  desc: "Formulario rapido em uma unica tela, apenas com os campos essenciais: tomador, servico e valor.",
                  cor: "#065f46",
                  bg: "#f0fdf4",
                  borda: "#86efac",
                  icone: (
                    <svg fill="none" height={22} viewBox="0 0 24 24" width={22}><path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}/></svg>
                  ),
                },
                {
                  modo: "completa",
                  titulo: "Emissao completa",
                  desc: "Assistente em 4 etapas no padrao do portal NFS-e Nacional: pessoas, servico, valores e emissao.",
                  cor: "#37418c",
                  bg: "#eef2ff",
                  borda: "#c7d2fe",
                  icone: (
                    <svg fill="none" height={22} viewBox="0 0 24 24" width={22}><path d="M7 3h7l4 4v14H7V3z" stroke="currentColor" strokeLinejoin="round" strokeWidth={1.8}/><path d="M9.5 12h5M9.5 15h5M9.5 9h2.5" stroke="currentColor" strokeLinecap="round" strokeWidth={1.6}/></svg>
                  ),
                },
                {
                  modo: "favorito",
                  titulo: "Servico favorito",
                  desc: favoritos.length > 0
                    ? `${favoritos.length} servico(s) salvo(s). Abre a nota ja preenchida, restando emitir.`
                    : "Nenhum servico salvo ainda. Favorite um servico ao terminar uma emissao.",
                  cor: "#b7891f",
                  bg: "#fffbeb",
                  borda: "#fcd34d",
                  icone: (
                    <svg fill="currentColor" height={22} viewBox="0 0 24 24" width={22}><path d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5z"/></svg>
                  ),
                },
              ].map((op) => (
                <button
                  key={op.modo}
                  onClick={() => {
                    if (op.modo === "favorito") {
                      setVerFavoritos(true);
                      return;
                    }
                    router.push(`/empresas/${empresaId}/notas-fiscais/emitir?modo=${op.modo}`);
                  }}
                  style={{ display: "flex", alignItems: "flex-start", gap: 14, textAlign: "left", padding: "1rem 1.1rem", background: op.bg, border: `1.5px solid ${op.borda}`, borderRadius: 12, cursor: "pointer", width: "100%" }}
                  type="button"
                >
                  <span style={{ color: op.cor, flexShrink: 0, marginTop: 2 }}>{op.icone}</span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: "0.92rem", fontWeight: 700, color: op.cor, marginBottom: 3 }}>{op.titulo}</span>
                    <span style={{ display: "block", fontSize: "0.78rem", color: "#4b5563", lineHeight: 1.45 }}>{op.desc}</span>
                  </span>
                  <svg fill="none" height={18} style={{ color: op.cor, flexShrink: 0, marginTop: 4 }} viewBox="0 0 24 24" width={18}><path d="M9 5l7 7-7 7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2}/></svg>
                </button>
              ))}
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
              Para MEI: acesse o{" "}
              <a
                href="https://www.nfse.gov.br/EmissorNacional/"
                rel="noreferrer"
                style={{ color: "#4338ca", fontWeight: 700, textDecoration: "underline" }}
                target="_blank"
              >
                Emissor Nacional de NFS-e
              </a>{" "}
              com sua conta gov.br (nivel Prata ou Ouro), copie o token de acesso da API e cole abaixo.
              <div style={{ marginTop: "0.4rem", fontSize: "0.72rem", opacity: 0.85 }}>
                O endereco correto e{" "}
                <strong>www.nfse.gov.br</strong> (com &quot;www&quot;) - o dominio sem &quot;www&quot; nao existe. Portal oficial:{" "}
                <a
                  href="https://www.gov.br/nfse"
                  rel="noreferrer"
                  style={{ color: "#4338ca", textDecoration: "underline" }}
                  target="_blank"
                >
                  www.gov.br/nfse
                </a>
              </div>
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

              {syncErro && (
                <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#991b1b" }}>
                  <strong>Nao foi possivel sincronizar.</strong>
                  <div style={{ marginTop: "0.3rem", wordBreak: "break-word" }}>{syncErro}</div>
                </div>
              )}

              {syncResult && (
                <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.82rem", color: "#166534" }}>
                  {syncResult.inseridas} nota{syncResult.inseridas !== 1 ? "s" : ""} importada{syncResult.inseridas !== 1 ? "s" : ""} de {syncResult.total} encontrada{syncResult.total !== 1 ? "s" : ""}.
                  {syncResult.duplicadas > 0 && ` ${syncResult.duplicadas} ja estava${syncResult.duplicadas !== 1 ? "m" : ""} no sistema.`}
                  {syncResult.ignoradas > 0 && ` ${syncResult.ignoradas} ignorada${syncResult.ignoradas !== 1 ? "s" : ""} por falta de chave de acesso.`}
                  {syncResult.total === 0 && " Nenhuma nota no periodo consultado."}
                  {syncResult.avisos.map((aviso) => (
                    <div key={aviso} style={{ marginTop: "0.4rem", color: "#92400e" }}>Atencao: {aviso}</div>
                  ))}
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
