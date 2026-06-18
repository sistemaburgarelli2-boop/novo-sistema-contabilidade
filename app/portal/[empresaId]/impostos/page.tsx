"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Guia = {
  competencia: string;
  id: string;
  tipo: string;
  valor: string;
  vencimento: string;
  status: "disponivel" | "pago" | "vencido";
};

const GUIAS_MOCK: Guia[] = [
  { competencia: "Junho/2026", id: "1", status: "disponivel", tipo: "DAS — Simples Nacional", valor: "R$ 1.240,00", vencimento: "20/06/2026" },
  { competencia: "Junho/2026", id: "2", status: "disponivel", tipo: "DARF — IRPJ", valor: "R$ 320,00", vencimento: "30/06/2026" },
  { competencia: "Maio/2026", id: "3", status: "pago", tipo: "DAS — Simples Nacional", valor: "R$ 1.180,00", vencimento: "20/05/2026" },
  { competencia: "Maio/2026", id: "4", status: "pago", tipo: "GPS — INSS Pró-labore", valor: "R$ 245,00", vencimento: "15/05/2026" },
  { competencia: "Abril/2026", id: "5", status: "pago", tipo: "DAS — Simples Nacional", valor: "R$ 1.195,00", vencimento: "22/04/2026" },
];

const STATUS_CONFIG = {
  disponivel: { badge: "badge-warning", label: "Disponível para pagar" },
  pago: { badge: "badge-success", label: "Pago" },
  vencido: { badge: "badge-danger", label: "Vencido" },
};

export default function PortalImpostos() {
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
  const disponiveis = GUIAS_MOCK.filter((g) => g.status === "disponivel");

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div style={{ paddingBottom: 0 }}>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Impostos e guias</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Visualize e acompanhe todas as guias emitidas pelo escritório.</p>
        </div>

        {/* KPIs */}
        <div className="kpi-strip" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <article className={`metric-card${disponiveis.length > 0 ? " kpi-warning" : ""}`}>
            <span>Guias disponíveis</span>
            <strong className="kpi-num">{disponiveis.length}</strong>
            <p>Aguardando pagamento</p>
          </article>
          <article className="metric-card">
            <span>Pagas este mês</span>
            <strong className="kpi-num">{GUIAS_MOCK.filter((g) => g.status === "pago").length}</strong>
            <p>Guias quitadas</p>
          </article>
          <article className="metric-card kpi-danger">
            <span>Vencidas</span>
            <strong className="kpi-num">{GUIAS_MOCK.filter((g) => g.status === "vencido").length}</strong>
            <p>Requerem atenção</p>
          </article>
        </div>

        {/* Lista de guias */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Guias emitidas</h2>
              <p>Histórico de obrigações fiscais</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Tipo", "Competência", "Vencimento", "Valor", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", padding: "10px 8px", textAlign: "left", textTransform: "uppercase" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {GUIAS_MOCK.map((guia) => {
                  const cfg = STATUS_CONFIG[guia.status];
                  return (
                    <tr key={guia.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px 8px" }}>
                        <strong>{guia.tipo}</strong>
                      </td>
                      <td style={{ color: "var(--muted)", padding: "12px 8px" }}>{guia.competencia}</td>
                      <td style={{ color: "var(--muted)", padding: "12px 8px" }}>{guia.vencimento}</td>
                      <td style={{ fontWeight: 700, padding: "12px 8px" }}>{guia.valor}</td>
                      <td style={{ padding: "12px 8px" }}>
                        <span className={`priority-badge ${cfg.badge}`}>{cfg.label}</span>
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
