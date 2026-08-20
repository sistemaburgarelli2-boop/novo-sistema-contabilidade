"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalHero, PortalLoading, PortalMetric } from "@/components/portal/PortalUI";
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
    return <PortalLoading />;
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">
        <PortalHero
          subtitle="Acompanhe todas as guias emitidas pelo escritório"
          title="Impostos e Guias"
        />

        <div className="metric-grid">
          <PortalMetric hint="Aguardando pagamento" label="Guias disponíveis" tone="info" value="0" />
          <PortalMetric hint="Guias quitadas" label="Pagas este mês" tone="success" value="0" />
          <PortalMetric hint="Requerem atenção" label="Vencidas" tone="danger" value="0" />
        </div>

        <PortalEmpty
          description="As guias de impostos aparecerão aqui conforme forem emitidas pelo escritório."
          icon="guias"
          title="Nenhum imposto registrado"
        />
      </div>
    </PortalShell>
  );
}
