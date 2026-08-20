"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalField, PortalHero, PortalLoading } from "@/components/portal/PortalUI";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const TIPOS = ["Dúvida", "Solicitação", "Alteração", "Reclamação", "Outros"];

export default function PortalChamados() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [assunto, setAssunto] = useState("");
  const [tipo, setTipo] = useState("Dúvida");
  const [descricao, setDescricao] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  const invalido = !assunto.trim() || !descricao.trim();

  function handleEnviar() {
    if (invalido) return;
    setEnviado(true);
    setMostrando(false);
    setAssunto("");
    setTipo("Dúvida");
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
              + Novo chamado
            </button>
          }
          subtitle="Abra e acompanhe atendimentos com o escritório"
          title="Chamados"
        />

        {enviado && (
          <p className="status-message">
            Chamado aberto! O escritório entrará em contato em breve.
          </p>
        )}

        {mostrando && (
          <div className="list-panel">
            <div className="list-panel-header">
              <div>
                <h2>Novo chamado</h2>
                <p>Conte para o escritório o que você precisa</p>
              </div>
            </div>
            <div className="portal-form">
              <div className="portal-form-row">
                <PortalField label="Tipo">
                  <select onChange={(event) => setTipo(event.target.value)} value={tipo}>
                    {TIPOS.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </PortalField>

                <PortalField label="Assunto" required>
                  <input
                    onChange={(event) => setAssunto(event.target.value)}
                    placeholder="Descreva brevemente o assunto"
                    value={assunto}
                  />
                </PortalField>
              </div>

              <PortalField label="Descrição" required>
                <textarea
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descreva em detalhes o que você precisa..."
                  value={descricao}
                />
              </PortalField>

              <div className="portal-form-actions">
                <button className="ghost-button" onClick={() => setMostrando(false)} type="button">
                  Cancelar
                </button>
                <button disabled={invalido} onClick={handleEnviar} type="button">
                  Enviar chamado
                </button>
              </div>
            </div>
          </div>
        )}

        <PortalEmpty
          description='Clique em "+ Novo chamado" para abrir um atendimento.'
          icon="chamados"
          title="Nenhum chamado registrado"
        />
      </div>
    </PortalShell>
  );
}
