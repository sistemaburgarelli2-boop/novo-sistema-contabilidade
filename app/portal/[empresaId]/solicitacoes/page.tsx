"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalField, PortalHero, PortalLoading } from "@/components/portal/PortalUI";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const CATEGORIAS_FORM = ["Fiscal", "DP", "Financeiro", "Societário"];
const PRIORIDADES = ["Normal", "Urgente"];

export default function PortalSolicitacoes() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [categoria, setCategoria] = useState("Fiscal");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  function handleEnviar() {
    if (!descricao.trim()) return;
    setEnviado(true);
    setMostrando(false);
    setDescricao("");
    setCategoria("Fiscal");
    setPrioridade("Normal");
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
              + Nova solicitação
            </button>
          }
          subtitle="Abra e acompanhe solicitações ao escritório contábil"
          title="Solicitações"
        />

        {enviado && (
          <p className="status-message">
            Solicitação enviada com sucesso! O escritório iniciará o atendimento em breve.
          </p>
        )}

        {mostrando && (
          <div className="list-panel">
            <div className="list-panel-header">
              <div>
                <h2>Nova solicitação</h2>
                <p>Descreva o que você precisa do escritório</p>
              </div>
            </div>
            <div className="portal-form">
              <div className="portal-form-row">
                <PortalField label="Categoria">
                  <select onChange={(event) => setCategoria(event.target.value)} value={categoria}>
                    {CATEGORIAS_FORM.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                </PortalField>

                <PortalField label="Prioridade">
                  <div className="portal-choice">
                    {PRIORIDADES.map((item) => {
                      const ativo = prioridade === item;
                      const classe = ativo
                        ? (item === "Urgente" ? "active-danger" : "active")
                        : "";
                      return (
                        <button
                          className={classe}
                          key={item}
                          onClick={() => setPrioridade(item)}
                          type="button"
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
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
                <button disabled={!descricao.trim()} onClick={handleEnviar} type="button">
                  Enviar solicitação
                </button>
              </div>
            </div>
          </div>
        )}

        <PortalEmpty
          description='Clique em "+ Nova solicitação" para abrir um pedido ao escritório.'
          icon="solicitacoes"
          title="Nenhuma solicitação registrada"
        />
      </div>
    </PortalShell>
  );
}
