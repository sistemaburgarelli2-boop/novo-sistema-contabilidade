"use client";

/* ─── Sistema de diálogos personalizados (substitui confirm/prompt/alert) ─── */

import { createContext, useContext, useState } from "react";

export type Dialogo =
  | { tipo: "confirm"; titulo: string; msg: string; perigo: boolean; okLabel: string; icone: string; semCancelar?: boolean; onOk: () => void }
  | { tipo: "prompt"; titulo: string; msg: string; valor: string; okLabel: string; icone: string; onOk: (v: string) => void };

export function CaixaDialogo({ dialogo, onClose }: { dialogo: Dialogo; onClose: () => void }) {
  const [valor, setValor] = useState(dialogo.tipo === "prompt" ? dialogo.valor : "");
  const confirmar = () => {
    if (dialogo.tipo === "prompt") {
      if (!valor.trim()) return;
      dialogo.onOk(valor.trim());
    } else {
      dialogo.onOk();
    }
    onClose();
  };
  const perigo = dialogo.tipo === "confirm" && dialogo.perigo;
  const corOk = perigo ? "#dc2626" : "#10b981";
  const semCancelar = dialogo.tipo === "confirm" && dialogo.semCancelar;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 400, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#fff", borderRadius: 16, width: "min(440px, 96vw)", boxShadow: "0 24px 64px rgba(0,0,0,0.28)", overflow: "hidden" }}
      >
        <div style={{ padding: "22px 24px 8px", display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: "grid", placeItems: "center",
            fontSize: "1.4rem", background: perigo ? "#fef2f2" : "#ecfdf5",
          }}>
            {dialogo.icone}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong style={{ fontSize: "1.02rem", color: "#0f172a", display: "block" }}>{dialogo.titulo}</strong>
            {dialogo.msg && <p style={{ fontSize: "0.86rem", color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>{dialogo.msg}</p>}
          </div>
        </div>

        {dialogo.tipo === "prompt" && (
          <div style={{ padding: "10px 24px 4px" }}>
            <input
              autoFocus
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") confirmar(); if (e.key === "Escape") onClose(); }}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 9, border: "1px solid #cbd5e1", fontSize: "0.9rem", color: "#0f172a", boxSizing: "border-box", outline: "none" }}
            />
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "16px 24px 20px" }}>
          {!semCancelar && (
            <button
              onClick={onClose}
              style={{ background: "#fff", color: "#334155", border: "1px solid #e2e8f0", borderRadius: 9, padding: "9px 18px", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}
            >
              Cancelar
            </button>
          )}
          <button
            onClick={confirmar}
            style={{ background: corOk, color: "#fff", border: "none", borderRadius: 9, padding: "9px 20px", fontSize: "0.85rem", fontWeight: 700, cursor: "pointer" }}
          >
            {dialogo.okLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Provider + hook para uso em qualquer subcomponente ── */

type OpcoesConfirm = { titulo?: string; perigo?: boolean; okLabel?: string; icone?: string };

type DialogoAPI = {
  confirmar: (msg: string, onOk: () => void, opts?: OpcoesConfirm) => void;
  perguntar: (titulo: string, valor: string, onOk: (v: string) => void, icone?: string) => void;
  alertar: (titulo: string, msg: string, icone?: string) => void;
};

const DialogoContext = createContext<DialogoAPI | null>(null);

export function DialogoProvider({ children }: { children: React.ReactNode }) {
  const [dialogo, setDialogo] = useState<Dialogo | null>(null);

  const api: DialogoAPI = {
    confirmar: (msg, onOk, opts) =>
      setDialogo({ tipo: "confirm", titulo: opts?.titulo ?? "Confirmar ação", msg, perigo: opts?.perigo ?? false, okLabel: opts?.okLabel ?? "Confirmar", icone: opts?.icone ?? (opts?.perigo ? "🗑️" : "❓"), onOk }),
    perguntar: (titulo, valor, onOk, icone = "✏️") =>
      setDialogo({ tipo: "prompt", titulo, msg: "", valor, okLabel: "Salvar", icone, onOk }),
    alertar: (titulo, msg, icone = "⚠️") =>
      setDialogo({ tipo: "confirm", titulo, msg, perigo: false, okLabel: "Entendi", icone, semCancelar: true, onOk: () => {} }),
  };

  return (
    <DialogoContext.Provider value={api}>
      {children}
      {dialogo && <CaixaDialogo dialogo={dialogo} onClose={() => setDialogo(null)} />}
    </DialogoContext.Provider>
  );
}

export function useDialogo(): DialogoAPI {
  const ctx = useContext(DialogoContext);
  if (!ctx) throw new Error("useDialogo deve ser usado dentro de DialogoProvider");
  return ctx;
}
