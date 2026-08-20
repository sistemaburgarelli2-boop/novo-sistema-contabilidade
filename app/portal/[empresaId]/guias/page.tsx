"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalHero, PortalLoading, PortalMetric } from "@/components/portal/PortalUI";
import { STATUS_GUIA_LABEL, statusEfetivo, type Guia } from "@/modules/guias/guias.types";
import { listarGuiasCliente } from "@/services/guiaClientService";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const BADGE_STATUS: Record<string, string> = {
  disponivel: "badge badge-warning",
  paga: "badge badge-success",
  vencida: "badge badge-danger",
};

function moeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function data(iso: string | null) {
  if (!iso) return "—";
  return new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR");
}

export default function PortalGuias() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [guias, setGuias] = useState<Guia[]>([]);
  const [carregandoGuias, setCarregandoGuias] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [copiada, setCopiada] = useState<string | null>(null);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});

    listarGuiasCliente(empresaId)
      .then(setGuias)
      .catch((e) => setErro(e instanceof Error ? e.message : "Falha ao carregar as guias."))
      .finally(() => setCarregandoGuias(false));
  }, [empresaId]);

  async function copiarCodigo(guia: Guia) {
    if (!guia.codigo_barras) return;
    try {
      await navigator.clipboard.writeText(guia.codigo_barras);
      setCopiada(guia.id);
      setTimeout(() => setCopiada(null), 2500);
    } catch {
      setErro("Nao foi possivel copiar. Selecione o codigo manualmente.");
    }
  }

  if (!empresa) {
    return <PortalLoading />;
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;
  const comStatus = guias.map((guia) => ({ guia, status: statusEfetivo(guia) }));

  const aPagar = comStatus.filter((item) => item.status === "disponivel");
  const pagas = comStatus.filter((item) => item.status === "paga");
  const vencidas = comStatus.filter((item) => item.status === "vencida");
  const totalAPagar = [...aPagar, ...vencidas].reduce((soma, item) => soma + Number(item.guia.valor), 0);

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">
        <PortalHero
          subtitle="Visualize, baixe e acompanhe suas guias de impostos e contribuições"
          title="Guias"
        />

        {erro && <p className="error-alert">{erro}</p>}

        <div className="metric-grid">
          <PortalMetric hint="Aguardando pagamento" label="A pagar" tone="info" value={aPagar.length} />
          <PortalMetric hint="Soma das guias em aberto" label="Total em aberto" tone="warning" value={moeda(totalAPagar)} />
          <PortalMetric hint="Guias quitadas" label="Pagas" tone="success" value={pagas.length} />
          <PortalMetric hint="Requerem atenção" label="Vencidas" tone="danger" value={vencidas.length} />
        </div>

        {carregandoGuias ? (
          <div className="portal-empty">
            <strong>Carregando guias...</strong>
          </div>
        ) : comStatus.length === 0 ? (
          <PortalEmpty
            description="As guias de impostos aparecerão aqui assim que o escritório disponibilizá-las."
            icon="guias"
            title="Nenhuma guia disponível"
          />
        ) : (
          <div className="list-panel">
            <div className="list-panel-header">
              <div>
                <h2>Suas guias</h2>
                <p>{comStatus.length} guia(s) disponível(is)</p>
              </div>
            </div>
            <div className="portal-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Imposto</th>
                    <th>Competência</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {comStatus.map(({ guia, status }) => (
                    <tr key={guia.id}>
                      <td style={{ fontWeight: 600 }}>
                        {guia.imposto}
                        {guia.pago_em && (
                          <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 500, marginTop: 2 }}>
                            Pago em {data(guia.pago_em)}
                          </div>
                        )}
                      </td>
                      <td>{guia.competencia}</td>
                      <td>{data(guia.vencimento)}</td>
                      <td style={{ fontWeight: 700 }}>{moeda(Number(guia.valor))}</td>
                      <td>
                        <span className={BADGE_STATUS[status] ?? "badge badge-neutral"}>
                          {STATUS_GUIA_LABEL[status]}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {guia.arquivo_url && (
                            <a className="small-action" href={guia.arquivo_url} rel="noreferrer" target="_blank">
                              Baixar guia
                            </a>
                          )}
                          {guia.codigo_barras && (
                            <button className="small-action" onClick={() => copiarCodigo(guia)} type="button">
                              {copiada === guia.id ? "Copiado!" : "Copiar código"}
                            </button>
                          )}
                          {!guia.arquivo_url && !guia.codigo_barras && (
                            <span style={{ color: "var(--muted)", fontSize: 12 }}>Sem arquivo anexado</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}
