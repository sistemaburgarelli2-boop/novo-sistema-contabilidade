"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalHero, PortalLoading, PortalMetric } from "@/components/portal/PortalUI";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const CARDS = [
  { hint: "Situação cadastral", label: "Status empresa", tone: "success" as const, value: "—" },
  { hint: "Competência encerrada", label: "Último fechamento", tone: "info" as const, value: "—" },
  { hint: "Guias a vencer", label: "Próximos vencimentos", tone: "warning" as const, value: "0" },
  { hint: "Documentos entregues", label: "Últimas entregas", tone: "neutral" as const, value: "0" },
];

export default function PortalDashboard() {
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
          subtitle="Acompanhe suas operações contábeis por aqui"
          title={`Bem-vindo, ${nome}`}
        />

        <div className="metric-grid">
          {CARDS.map((card) => (
            <PortalMetric
              hint={card.hint}
              key={card.label}
              label={card.label}
              tone={card.tone}
              value={card.value}
            />
          ))}
        </div>

        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Atividade recente</h2>
              <p>Últimos eventos da sua empresa</p>
            </div>
            <Link className="small-action" href={`/portal/${empresaId}/historico`}>
              Ver histórico completo
            </Link>
          </div>
          <div className="portal-panel-body">
            <PortalEmpty
              description="As atividades aparecerão aqui conforme forem realizadas."
              icon="atividade"
              title="Sem atividades registradas"
            />
          </div>
        </div>

        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Avisos recentes</h2>
              <p>Comunicados do seu escritório contábil</p>
            </div>
            <Link className="small-action" href={`/portal/${empresaId}/notificacoes`}>
              Ver todos
            </Link>
          </div>
          <div className="portal-panel-body">
            <PortalEmpty
              description="Você será notificado quando houver novidades."
              icon="notificacoes"
              title="Nenhum aviso"
            />
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
