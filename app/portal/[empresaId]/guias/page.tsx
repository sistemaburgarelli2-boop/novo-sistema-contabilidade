"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalHero, PortalLoading, PortalMetric } from "@/components/portal/PortalUI";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const KPI_CARDS = [
  { hint: "Emitidas no período", label: "Total guias", tone: "info" as const },
  { hint: "Prontas para pagamento", label: "Disponíveis", tone: "success" as const },
  { hint: "Já quitadas", label: "Pagas", tone: "neutral" as const },
  { hint: "Requerem atenção", label: "Vencidas", tone: "danger" as const },
];

export default function PortalGuias() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  if (!empresa) {
    return <PortalLoading />;
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">
        <PortalHero
          subtitle="Visualize e baixe suas guias de impostos e contribuições"
          title="Guias"
        />

        <div className="metric-grid">
          {KPI_CARDS.map((kpi) => (
            <PortalMetric hint={kpi.hint} key={kpi.label} label={kpi.label} tone={kpi.tone} value="0" />
          ))}
        </div>

        <PortalEmpty
          description="As guias de impostos aparecerão aqui conforme forem emitidas."
          icon="guias"
          title="Nenhuma guia disponível"
        />
      </div>
    </PortalShell>
  );
}
