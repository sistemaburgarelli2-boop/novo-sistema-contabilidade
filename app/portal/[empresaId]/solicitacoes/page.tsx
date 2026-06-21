"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const CATEGORIAS_FORM = ["Fiscal", "DP", "Financeiro", "Societário"];

export default function PortalSolicitacoes() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [categoria, setCategoria] = useState("Fiscal");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  function handleEnviar() {
    if (!descricao.trim()) return;
    setEnviado(true);
    setMostrando(false);
    setDescricao("");
    setCategoria("Fiscal");
    setPrioridade("Normal");
    setTimeout(() => setEnviado(false), 4000);
  }

  if (!empresa) {
    return (
      <div style={{ alignItems: "center", display: "flex", fontSize: 14, justifyContent: "center", minHeight: "100vh", color: "var(--muted)" }}>
        Carregando...
      </div>
    );
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Solicitações</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              Abra e acompanhe solicitações ao escritório contábil.
            </p>
          </div>
          <button
            onClick={() => setMostrando(true)}
            style={{
              background: "var(--green-700)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              padding: "10px 20px",
            }}
            type="button"
          >
            + Nova solicitação
          </button>
        </div>

        {enviado && (
          <div style={{
            alignItems: "center",
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 10,
            color: "#065f46",
            display: "flex",
            fontSize: 14,
            fontWeight: 600,
            gap: 8,
            padding: "12px 16px",
          }}>
            Solicitação enviada com sucesso! O escritório iniciará o atendimento em breve.
          </div>
        )}

        {/* New request form */}
        {mostrando && (
          <div className="list-panel" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Nova solicitação</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Categoria
                  <select
                    onChange={(e) => setCategoria(e.target.value)}
                    style={{
                      background: "#f9fcfa",
                      border: "1.5px solid #c9dbd1",
                      borderRadius: 8,
                      color: "var(--ink)",
                      fontSize: 14,
                      fontFamily: "inherit",
                      padding: "10px 14px",
                    }}
                    value={categoria}
                  >
                    {CATEGORIAS_FORM.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Prioridade
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {["Normal", "Urgente"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrioridade(p)}
                        style={{
                          background: prioridade === p
                            ? (p === "Urgente" ? "rgba(239,68,95,0.1)" : "rgba(16,185,129,0.1)")
                            : "#fff",
                          border: prioridade === p
                            ? (p === "Urgente" ? "1.5px solid #ef445f" : "1.5px solid var(--green-400)")
                            : "1.5px solid var(--border)",
                          borderRadius: 8,
                          color: prioridade === p
                            ? (p === "Urgente" ? "#b91c1c" : "#065f46")
                            : "var(--muted)",
                          cursor: "pointer",
                          flex: 1,
                          fontSize: 13,
                          fontWeight: 600,
                          padding: "10px 14px",
                        }}
                        type="button"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Descrição <span style={{ color: "#ef445f" }}>*</span>
                <textarea
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva em detalhes o que você precisa..."
                  rows={4}
                  style={{
                    background: "#f9fcfa",
                    border: "1.5px solid #c9dbd1",
                    borderRadius: 8,
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 14,
                    padding: "10px 14px",
                    resize: "vertical",
                  }}
                  value={descricao}
                />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setMostrando(false)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--muted)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "9px 18px",
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  disabled={!descricao.trim()}
                  onClick={handleEnviar}
                  style={{
                    background: !descricao.trim() ? "#c9dbd1" : "var(--green-700)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    cursor: !descricao.trim() ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "10px 22px",
                  }}
                  type="button"
                >
                  Enviar solicitação
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty state */}
        <div className="list-panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: 8 }}>📨</p>
          <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 4px" }}>Nenhuma solicitação registrada</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Clique em "+ Nova solicitação" para abrir um pedido ao escritório.</p>
        </div>

      </div>
    </PortalShell>
  );
}
