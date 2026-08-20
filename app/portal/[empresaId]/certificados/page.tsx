"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalHero, PortalLoading, PortalMetric } from "@/components/portal/PortalUI";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";
import type { Certificado } from "@/modules/certificados/certificados.types";

const STATUS_BADGE: Record<string, { className: string; label: string }> = {
  ativo:              { className: "badge badge-success", label: "Ativo" },
  proximo_vencimento: { className: "badge badge-warning", label: "Próximo vencimento" },
  renovando:          { className: "badge badge-neutral", label: "Renovando" },
  revogado:           { className: "badge badge-neutral", label: "Revogado" },
  suspenso:           { className: "badge badge-neutral", label: "Suspenso" },
  vencido:            { className: "badge badge-danger", label: "Vencido" },
};

function classeDias(dias: number): string {
  if (dias <= 0) return "badge badge-plain badge-danger";
  if (dias <= 30) return "badge badge-plain badge-warning";
  return "badge badge-plain badge-success";
}

export default function PortalCertificados() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [certificados, setCertificados] = useState<Certificado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});

    fetch("/api/certificados")
      .then((response) => response.json())
      .then((json) => {
        const todos = (json.data ?? []) as Certificado[];
        setCertificados(todos.filter((item) => item.empresa_id === empresaId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empresaId]);

  if (!empresa) {
    return <PortalLoading />;
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;
  const ativos = certificados.filter((item) => item.status === "ativo").length;
  const vencendo = certificados.filter((item) => item.dias_restantes > 0 && item.dias_restantes <= 30).length;
  const vencidos = certificados.filter((item) => item.dias_restantes <= 0).length;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">
        <PortalHero
          subtitle="Acompanhe a validade dos seus certificados digitais"
          title="Certificados Digitais"
        />

        {loading ? (
          <div className="portal-empty">
            <strong>Carregando certificados...</strong>
          </div>
        ) : certificados.length === 0 ? (
          <PortalEmpty
            description="Entre em contato com o escritório para cadastrar seus certificados digitais."
            icon="certificados"
            title="Nenhum certificado registrado"
          />
        ) : (
          <>
            <div className="metric-grid">
              <PortalMetric hint="Certificados válidos" label="Ativos" tone="success" value={ativos} />
              <PortalMetric hint="Renovação recomendada" label="Vencendo em 30 dias" tone="warning" value={vencendo} />
              <PortalMetric hint="Requerem ação imediata" label="Vencidos" tone="danger" value={vencidos} />
            </div>

            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Seus certificados</h2>
                  <p>{certificados.length} certificado(s) cadastrado(s)</p>
                </div>
              </div>
              <div className="portal-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Titular</th>
                      <th>Validade</th>
                      <th>Dias restantes</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {certificados.map((certificado) => {
                      const status = STATUS_BADGE[certificado.status] ?? STATUS_BADGE.ativo;
                      return (
                        <tr key={certificado.id}>
                          <td><span className="badge badge-neutral">{certificado.tipo}</span></td>
                          <td style={{ fontWeight: 600 }}>{certificado.titular}</td>
                          <td>{new Date(certificado.validade).toLocaleDateString("pt-BR")}</td>
                          <td>
                            <span className={classeDias(certificado.dias_restantes)}>
                              {certificado.dias_restantes > 0 ? `${certificado.dias_restantes} dias` : "Vencido"}
                            </span>
                          </td>
                          <td><span className={status.className}>{status.label}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
