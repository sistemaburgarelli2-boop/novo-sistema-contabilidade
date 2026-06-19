"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Guia = {
  id: string;
  competencia: string;
  imposto: string;
  vencimento: string;
  valor: string;
  status: "Pendente" | "Disponível" | "Paga" | "Vencida";
};

const STATUS_STYLES: Record<Guia["status"], { bg: string; color: string }> = {
  Pendente: { bg: "rgba(245,158,11,0.12)", color: "#92400e" },
  "Disponível": { bg: "rgba(6,182,212,0.1)", color: "#0e7490" },
  Paga: { bg: "rgba(16,185,129,0.1)", color: "#065f46" },
  Vencida: { bg: "rgba(239,68,95,0.1)", color: "#b91c1c" },
};

const GUIAS_MOCK: Guia[] = [
  { id: "1", competencia: "Jun/2026", imposto: "DAS — Simples", vencimento: "20/07/2026", valor: "R$ 1.250,00", status: "Disponível" },
  { id: "2", competencia: "Jun/2026", imposto: "INSS (GPS)", vencimento: "20/07/2026", valor: "R$ 2.800,00", status: "Disponível" },
  { id: "3", competencia: "Jun/2026", imposto: "ISS", vencimento: "15/07/2026", valor: "R$ 450,00", status: "Pendente" },
  { id: "4", competencia: "Mai/2026", imposto: "DAS — Simples", vencimento: "20/06/2026", valor: "R$ 1.180,00", status: "Paga" },
  { id: "5", competencia: "Mai/2026", imposto: "INSS (GPS)", vencimento: "20/06/2026", valor: "R$ 2.650,00", status: "Paga" },
  { id: "6", competencia: "Mai/2026", imposto: "IRPJ", vencimento: "30/06/2026", valor: "R$ 3.200,00", status: "Paga" },
  { id: "7", competencia: "Jun/2026", imposto: "FGTS", vencimento: "07/07/2026", valor: "R$ 1.900,00", status: "Disponível" },
  { id: "8", competencia: "Abr/2026", imposto: "DAS — Simples", vencimento: "20/05/2026", valor: "R$ 1.120,00", status: "Vencida" },
];

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

  const totalGuias = GUIAS_MOCK.length;
  const disponiveis = GUIAS_MOCK.filter((g) => g.status === "Disponível").length;
  const pagas = GUIAS_MOCK.filter((g) => g.status === "Paga").length;
  const vencidas = GUIAS_MOCK.filter((g) => g.status === "Vencida").length;

  const KPI_CARDS = [
    { label: "Total guias", value: totalGuias, bg: "rgba(99,102,241,0.08)", color: "#4338ca" },
    { label: "Disponíveis", value: disponiveis, bg: "rgba(6,182,212,0.08)", color: "#0e7490" },
    { label: "Pagas", value: pagas, bg: "rgba(16,185,129,0.08)", color: "#065f46" },
    { label: "Vencidas", value: vencidas, bg: vencidas > 0 ? "rgba(239,68,95,0.08)" : "rgba(156,163,175,0.08)", color: vencidas > 0 ? "#b91c1c" : "#6b7280" },
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

        {/* Guias table */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Guias de impostos</h2>
              <p>Competências recentes</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Competência", "Imposto", "Vencimento", "Valor", "Status", "Ações"].map((h) => (
                    <th
                      key={h}
                      style={{
                        color: "var(--muted)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        padding: "10px 8px",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GUIAS_MOCK.map((guia) => {
                  const st = STATUS_STYLES[guia.status];
                  const canDownload = guia.status === "Disponível" || guia.status === "Paga";
                  return (
                    <tr key={guia.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 8px", fontWeight: 600 }}>{guia.competencia}</td>
                      <td style={{ padding: "10px 8px" }}>{guia.imposto}</td>
                      <td style={{ padding: "10px 8px", color: guia.status === "Vencida" ? "#b91c1c" : "var(--muted)" }}>
                        {guia.vencimento}
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 700 }}>{guia.valor}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{
                          background: st.bg,
                          borderRadius: 20,
                          color: st.color,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}>
                          {guia.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {canDownload ? (
                            <>
                              <button
                                style={{
                                  background: "rgba(6,182,212,0.08)",
                                  border: "none",
                                  borderRadius: 6,
                                  color: "#0e7490",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: "5px 10px",
                                }}
                                type="button"
                              >
                                Visualizar
                              </button>
                              <button
                                style={{
                                  background: "rgba(99,102,241,0.08)",
                                  border: "none",
                                  borderRadius: 6,
                                  color: "#4338ca",
                                  cursor: "pointer",
                                  fontSize: 12,
                                  fontWeight: 600,
                                  padding: "5px 10px",
                                }}
                                type="button"
                              >
                                Baixar
                              </button>
                            </>
                          ) : (
                            <span style={{ fontSize: 12, color: "var(--muted)", fontStyle: "italic" }}>
                              {guia.status === "Pendente" ? "Aguardando emissão" : "Indisponível"}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
