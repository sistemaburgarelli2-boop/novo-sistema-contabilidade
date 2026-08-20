"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalHero, PortalLoading, PortalMetric } from "@/components/portal/PortalUI";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

export default function PortalFinanceiro() {
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
          subtitle="Honorários, faturas e histórico de pagamentos"
          title="Financeiro"
        />

        <div className="metric-grid">
          <PortalMetric hint="Aguardando pagamento" label="Faturas em aberto" tone="info" value="0" />
          <PortalMetric hint="Valor total pendente" label="Total em aberto" tone="success" value="R$ 0,00" />
          <PortalMetric hint="Data limite de pagamento" label="Próximo vencimento" tone="warning" value="—" />
        </div>

        <PortalEmpty
          description="O extrato de honorários aparecerá aqui conforme as cobranças forem registradas."
          icon="financeiro"
          title="Sem informações financeiras"
        />
      </div>
    </PortalShell>
  );
}
