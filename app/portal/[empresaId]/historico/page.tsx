"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalFilters, PortalHero, PortalLoading } from "@/components/portal/PortalUI";
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
    return <PortalLoading />;
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">
        <PortalHero
          subtitle="Linha do tempo completa de atividades da sua empresa"
          title="Histórico"
        />

        <PortalFilters onChange={setFiltro} options={FILTROS} value={filtro} />

        <PortalEmpty
          description="As atividades aparecerão aqui conforme forem realizadas pelo escritório."
          icon="historico"
          title="Sem atividades registradas"
        />
      </div>
    </PortalShell>
  );
}
