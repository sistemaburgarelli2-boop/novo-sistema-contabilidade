"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

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

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Impostos e guias</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Visualize e acompanhe todas as guias emitidas pelo escritório.</p>
        </div>

        {/* KPIs */}
        <div className="kpi-strip" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <article className="metric-card">
            <span>Guias disponíveis</span>
            <strong className="kpi-num">0</strong>
            <p>Aguardando pagamento</p>
          </article>
          <article className="metric-card">
            <span>Pagas este mês</span>
            <strong className="kpi-num">0</strong>
            <p>Guias quitadas</p>
          </article>
          <article className="metric-card">
            <span>Vencidas</span>
            <strong className="kpi-num">0</strong>
            <p>Requerem atenção</p>
          </article>
        </div>

        {/* Empty state */}
        <div className="list-panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: 8 }}>🧾</p>
          <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 4px" }}>Nenhum imposto registrado</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>As guias de impostos aparecerão aqui conforme forem emitidas pelo escritório.</p>
        </div>

      </div>
    </PortalShell>
  );
}
