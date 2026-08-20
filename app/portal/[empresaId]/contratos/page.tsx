"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalField, PortalHero, PortalLoading } from "@/components/portal/PortalUI";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

export default function ContratosPage() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [tipoDoc, setTipoDoc] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  const invalido = !tipoDoc.trim() || !descricao.trim();

  function handleEnviar() {
    if (invalido) return;
    setEnviado(true);
    setMostrando(false);
    setTipoDoc("");
    setDescricao("");
    setTimeout(() => setEnviado(false), 4000);
  }

  if (!empresa) {
    return <PortalLoading />;
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">
        <PortalHero
          actions={
            <button onClick={() => setMostrando(true)} type="button">
              + Solicitar contrato
            </button>
          }
          subtitle="Consulte seus contratos e solicite novos documentos"
          title="Contratos"
        />

        {enviado && (
          <p className="status-message">
            Solicitação enviada com sucesso! O escritório entrará em contato em breve.
          </p>
        )}

        {mostrando && (
          <div className="list-panel">
            <div className="list-panel-header">
              <div>
                <h2>Solicitar contrato</h2>
                <p>Informe o tipo de documento que você precisa</p>
              </div>
            </div>
            <div className="portal-form">
              <PortalField label="Tipo de documento" required>
                <input
                  onChange={(event) => setTipoDoc(event.target.value)}
                  placeholder="Ex: Contrato de prestação de serviço"
                  value={tipoDoc}
                />
              </PortalField>

              <PortalField label="Descrição" required>
                <textarea
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descreva o que você precisa..."
                  value={descricao}
                />
              </PortalField>

              <div className="portal-form-actions">
                <button className="ghost-button" onClick={() => setMostrando(false)} type="button">
                  Cancelar
                </button>
                <button disabled={invalido} onClick={handleEnviar} type="button">
                  Enviar solicitação
                </button>
              </div>
            </div>
          </div>
        )}

        <PortalEmpty
          description="Os contratos aparecerão aqui conforme forem registrados pelo escritório."
          icon="contratos"
          title="Nenhum contrato disponível"
        />
      </div>
    </PortalShell>
  );
}
