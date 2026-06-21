"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const FILTROS = ["Todos", "Documentos", "Guias", "Solicitações", "Operacional"];

export default function PortalHistorico() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [filtro, setFiltro] = useState("Todos");

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

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

        <div>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Histórico</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Linha do tempo completa de atividades da sua empresa.
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                background: filtro === f ? "var(--green-700)" : "#fff",
                border: filtro === f ? "1px solid var(--green-700)" : "1px solid var(--border)",
                borderRadius: 20,
                color: filtro === f ? "#fff" : "var(--muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                padding: "7px 18px",
                transition: "all 0.15s",
              }}
              type="button"
            >
              {f}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="list-panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: 8 }}>📋</p>
          <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 4px" }}>Sem atividades registradas</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>As atividades aparecerão aqui conforme forem realizadas.</p>
        </div>

      </div>
    </PortalShell>
  );
}
