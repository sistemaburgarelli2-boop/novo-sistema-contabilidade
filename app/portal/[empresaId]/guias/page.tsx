"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

export default function PortalGuias() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

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

  const KPI_CARDS = [
    { label: "Total guias", value: "0", bg: "rgba(99,102,241,0.08)", color: "#4338ca" },
    { label: "Disponíveis", value: "0", bg: "rgba(6,182,212,0.08)", color: "#0e7490" },
    { label: "Pagas", value: "0", bg: "rgba(16,185,129,0.08)", color: "#065f46" },
    { label: "Vencidas", value: "0", bg: "rgba(156,163,175,0.08)", color: "#6b7280" },
  ];

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Guias</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Visualize e baixe suas guias de impostos e contribuições.
          </p>
        </div>

        {/* KPI cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {KPI_CARDS.map((kpi) => (
            <div
              key={kpi.label}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {kpi.label}
              </span>
              <div style={{
                background: kpi.bg,
                borderRadius: 20,
                color: kpi.color,
                display: "inline-block",
                fontSize: 22,
                fontWeight: 800,
                marginTop: 10,
                padding: "4px 16px",
              }}>
                {kpi.value}
              </div>
            </div>
          ))}
        </div>

        {/* Empty state */}
        <div className="list-panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: 8 }}>📋</p>
          <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 4px" }}>Nenhuma guia disponível</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>As guias de impostos aparecerão aqui conforme forem emitidas.</p>
        </div>

      </div>
    </PortalShell>
  );
}
