"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type Setor = "contabilidade" | "fiscal" | "trabalhista" | "societario" | "financeiro" | "dp" | "legislacao";

type Anotacao = {
  id: string;
  titulo: string;
  conteudo: string;
  setor: Setor;
  criado_em: string;
  atualizado_em: string;
};

const SETORES: { key: Setor; label: string; emoji: string; cor: string }[] = [
  { key: "contabilidade", label: "Contabilidade", emoji: "📚", cor: "#1e40af" },
  { key: "fiscal", label: "Fiscal", emoji: "🏛️", cor: "#065f46" },
  { key: "trabalhista", label: "Trabalhista", emoji: "👥", cor: "#7c3aed" },
  { key: "societario", label: "Societario", emoji: "🏗️", cor: "#92400e" },
  { key: "financeiro", label: "Financeiro", emoji: "💰", cor: "#0891b2" },
  { key: "dp", label: "Dep. Pessoal", emoji: "📋", cor: "#be185d" },
  { key: "legislacao", label: "Legislacao", emoji: "⚖️", cor: "#dc2626" },
];

const STORAGE_KEY = "escola_contabil_anotacoes";

/* ─── Helpers ─────────────────────────────────────────────────── */

function gerarId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/* ─── Componente principal ────────────────────────────────────── */

export default function EscolaPage() {
  const [anotacoes, setAnotacoes] = useState<Anotacao[]>([]);
  const [filtroSetor, setFiltroSetor] = useState<Setor | "todos">("todos");
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Anotacao | null>(null);
  const [lendo, setLendo] = useState<Anotacao | null>(null);
  const [showNova, setShowNova] = useState(false);
  const [novoTitulo, setNovoTitulo] = useState("");
  const [novoConteudo, setNovoConteudo] = useState("");
  const [novoSetor, setNovoSetor] = useState<Setor>("contabilidade");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setAnotacoes(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const salvar = useCallback((lista: Anotacao[]) => {
    setAnotacoes(lista);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lista));
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  function criarAnotacao() {
    if (!novoTitulo.trim()) return;
    const nova: Anotacao = {
      id: gerarId(),
      titulo: novoTitulo.trim(),
      conteudo: novoConteudo,
      setor: novoSetor,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };
    salvar([nova, ...anotacoes]);
    setNovoTitulo("");
    setNovoConteudo("");
    setShowNova(false);
    showToast("Anotacao criada!");
  }

  function salvarEdicao() {
    if (!editando) return;
    salvar(anotacoes.map(a => a.id === editando.id ? { ...editando, atualizado_em: new Date().toISOString() } : a));
    setEditando(null);
    showToast("Anotacao atualizada!");
  }

  function excluir(id: string) {
    salvar(anotacoes.filter(a => a.id !== id));
    setLendo(null);
    setEditando(null);
    showToast("Anotacao excluida.");
  }

  const filtradas = anotacoes.filter(a => {
    if (filtroSetor !== "todos" && a.setor !== filtroSetor) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return a.titulo.toLowerCase().includes(q) || a.conteudo.toLowerCase().includes(q);
    }
    return true;
  });

  const contPorSetor = (s: Setor) => anotacoes.filter(a => a.setor === s).length;
  const setorCfg = (s: Setor) => SETORES.find(x => x.key === s)!;

  const inputStyle: React.CSSProperties = { width: "100%", padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase", marginBottom: 4 };

  return (
    <AppShell>
      <div className="page-stack">
        {/* ── Header ── */}
        <div style={{ borderRadius: 14, overflow: "hidden", background: "linear-gradient(110deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)", boxShadow: "0 4px 24px rgba(6,23,13,0.18)", padding: "1.5rem 2rem", color: "#fff", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: "100%", background: "radial-gradient(circle at 80% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", position: "relative", zIndex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎓</div>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Escola Contabil</h1>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", opacity: 0.7 }}>Suas anotacoes e estudos organizados por setor</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: "0.82rem", opacity: 0.6 }}>{anotacoes.length} anotacao{anotacoes.length !== 1 ? "es" : ""}</span>
              <button onClick={() => { setShowNova(true); setNovoTitulo(""); setNovoConteudo(""); setNovoSetor("contabilidade"); }} style={{ padding: "0.5rem 1rem", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", borderRadius: 8, color: "#fff", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }} type="button">
                + Nova anotacao
              </button>
            </div>
          </div>
        </div>

        {/* ── Criar nova anotacao (inline) ── */}
        {showNova ? (
          <div>
            <button onClick={() => setShowNova(false)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6f8f7c", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, marginBottom: 12, padding: 0 }} type="button">
              <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/></svg>
              Voltar
            </button>
            <div style={{ background: "#fff", border: "1.5px solid #dfece5", borderRadius: 14, padding: "1.5rem", maxWidth: 800 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700, color: "#07170d" }}>Nova anotacao</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Titulo</label>
                    <input style={inputStyle} value={novoTitulo} onChange={e => setNovoTitulo(e.target.value)} placeholder="Ex: Regras de ICMS interestadual" />
                  </div>
                  <div style={{ minWidth: 180 }}>
                    <label style={labelStyle}>Setor</label>
                    <select style={{ ...inputStyle, background: "#fff", cursor: "pointer" }} value={novoSetor} onChange={e => setNovoSetor(e.target.value as Setor)}>
                      {SETORES.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Conteudo</label>
                  <textarea style={{ ...inputStyle, minHeight: 250, resize: "vertical", lineHeight: 1.7 }} value={novoConteudo} onChange={e => setNovoConteudo(e.target.value)} placeholder="Escreva suas anotacoes aqui..." />
                </div>
                <button disabled={!novoTitulo.trim()} onClick={criarAnotacao} style={{ padding: "0.65rem 2rem", background: !novoTitulo.trim() ? "#d1d5db" : "linear-gradient(135deg, #4f46e5, #6366f1)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: !novoTitulo.trim() ? "not-allowed" : "pointer", alignSelf: "flex-start" }} type="button">
                  Criar anotacao
                </button>
              </div>
            </div>
          </div>

        ) : lendo && !editando ? (
          <div>
            <button onClick={() => setLendo(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6f8f7c", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, marginBottom: 12, padding: 0 }} type="button">
              <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/></svg>
              Voltar
            </button>
            <div style={{ background: "#fff", border: "1.5px solid #dfece5", borderRadius: 14, padding: "2rem", maxWidth: 800 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <span style={{ display: "inline-block", background: `${setorCfg(lendo.setor).cor}12`, color: setorCfg(lendo.setor).cor, borderRadius: 999, padding: "2px 10px", fontSize: "0.7rem", fontWeight: 700, marginBottom: 6 }}>{setorCfg(lendo.setor).emoji} {setorCfg(lendo.setor).label}</span>
                  <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#07170d" }}>{lendo.titulo}</h2>
                  <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>Atualizado em {fmtData(lendo.atualizado_em)}</p>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => setEditando({ ...lendo })} style={{ padding: "6px 14px", background: "#f3f4f6", border: "1px solid #dfece5", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", color: "#07170d" }} type="button">Editar</button>
                  <button onClick={() => excluir(lendo.id)} style={{ padding: "6px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", color: "#b91c1c" }} type="button">Excluir</button>
                </div>
              </div>
              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.8, color: "#1a1a2e", margin: 0 }}>
                {lendo.conteudo || "Sem conteudo."}
              </pre>
            </div>
          </div>

        ) : editando ? (
          /* ── Edicao ── */
          <div>
            <button onClick={() => setEditando(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6f8f7c", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, marginBottom: 12, padding: 0 }} type="button">
              <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/></svg>
              Cancelar
            </button>
            <div style={{ background: "#fff", border: "1.5px solid #dfece5", borderRadius: 14, padding: "1.5rem", maxWidth: 800 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700, color: "#07170d" }}>Editar anotacao</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Titulo</label>
                    <input style={inputStyle} value={editando.titulo} onChange={e => setEditando({ ...editando, titulo: e.target.value })} />
                  </div>
                  <div style={{ minWidth: 180 }}>
                    <label style={labelStyle}>Setor</label>
                    <select style={{ ...inputStyle, background: "#fff", cursor: "pointer" }} value={editando.setor} onChange={e => setEditando({ ...editando, setor: e.target.value as Setor })}>
                      {SETORES.map(s => <option key={s.key} value={s.key}>{s.emoji} {s.label}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Conteudo</label>
                  <textarea style={{ ...inputStyle, minHeight: 300, resize: "vertical", lineHeight: 1.7 }} value={editando.conteudo} onChange={e => setEditando({ ...editando, conteudo: e.target.value })} />
                </div>
                <button onClick={salvarEdicao} style={{ padding: "0.65rem 2rem", background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", alignSelf: "flex-start" }} type="button">
                  Salvar
                </button>
              </div>
            </div>
          </div>

        ) : (
          /* ── Lista de anotacoes ── */
          <>
            {/* Setores como cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(155px, 1fr))", gap: 10 }}>
              {SETORES.map(s => {
                const count = contPorSetor(s.key);
                const ativo = filtroSetor === s.key;
                return (
                  <button key={s.key} onClick={() => setFiltroSetor(ativo ? "todos" : s.key)} type="button" style={{
                    background: ativo ? `${s.cor}12` : "#fff", border: `1.5px solid ${ativo ? s.cor : "#dfece5"}`,
                    borderRadius: 12, padding: "12px 14px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 18 }}>{s.emoji}</span>
                      <span style={{ fontWeight: 700, fontSize: "0.82rem", color: ativo ? s.cor : "#07170d" }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{count} anotacao{count !== 1 ? "es" : ""}</span>
                  </button>
                );
              })}
            </div>

            {/* Busca */}
            <input onChange={e => setBusca(e.target.value)} placeholder="Buscar anotacoes..." style={{ ...inputStyle, maxWidth: 400 }} type="text" value={busca} />

            {/* Lista */}
            {filtradas.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.85rem" }}>
                {anotacoes.length === 0 ? "Nenhuma anotacao criada ainda. Clique em \"+ Nova anotacao\" para comecar." : "Nenhuma anotacao encontrada."}
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {filtradas.map(a => {
                  const sc = setorCfg(a.setor);
                  return (
                    <button key={a.id} onClick={() => setLendo(a)} type="button" style={{
                      background: "#fff", border: "1.5px solid #dfece5", borderRadius: 12, padding: "1rem 1.25rem",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", alignItems: "center", gap: 14, width: "100%",
                    }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${sc.cor}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{sc.emoji}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#07170d", marginBottom: 2 }}>{a.titulo}</div>
                        <div style={{ fontSize: "0.78rem", color: "#6f8f7c", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {a.conteudo?.slice(0, 100) || "Sem conteudo"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        <span style={{ display: "inline-block", background: `${sc.cor}12`, color: sc.cor, borderRadius: 999, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>{sc.label}</span>
                        <div style={{ fontSize: "0.68rem", color: "#9ca3af", marginTop: 4 }}>{fmtData(a.atualizado_em)}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", alignItems: "center", gap: 10, padding: "14px 20px", borderRadius: 12, background: "#065f46", color: "#fff", fontSize: "0.875rem", fontWeight: 600, boxShadow: "0 8px 30px rgba(0,0,0,0.2)", animation: "toastIn 0.3s ease" }}>
          <span style={{ fontSize: 18 }}>✓</span>{toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
        </div>
      )}
    </AppShell>
  );
}
