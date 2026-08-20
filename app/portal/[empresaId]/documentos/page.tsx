"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PortalIcon } from "@/components/portal/PortalIcon";
import { PortalShell } from "@/components/portal/PortalShell";
import { PortalEmpty, PortalFilters, PortalHero, PortalLoading } from "@/components/portal/PortalUI";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const CATEGORIAS = ["Todos", "Fiscal", "Contábil", "DP", "Societário"];
const FILE_TYPES = ["PDF", "XML", "ZIP", "Excel"];

export default function PortalDocumentos() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [filtro, setFiltro] = useState("Todos");
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

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
          actions={
            <button onClick={() => fileRef.current?.click()} type="button">
              Enviar documento
            </button>
          }
          subtitle="Gerencie e envie documentos para o escritório contábil"
          title="Documentos"
        />

        <PortalFilters onChange={setFiltro} options={CATEGORIAS} value={filtro} />

        <PortalEmpty
          description="Os documentos aparecerão aqui conforme forem enviados ou processados."
          icon="documentos"
          title="Nenhum documento disponível"
        />

        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Enviar documento</h2>
              <p>Arraste ou selecione arquivos para enviar ao escritório</p>
            </div>
          </div>
          <div className="portal-panel-body">
            <div
              className={dragging ? "portal-upload dragging" : "portal-upload"}
              onClick={() => fileRef.current?.click()}
              onDragLeave={() => setDragging(false)}
              onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
              onDrop={(event) => { event.preventDefault(); setDragging(false); }}
            >
              <input
                accept=".pdf,.xml,.zip,.xlsx,.xls,.csv"
                multiple
                ref={fileRef}
                type="file"
              />
              <span className="portal-upload-icon">
                <PortalIcon name="upload" size={26} />
              </span>
              <div>
                <strong>Arraste arquivos aqui ou clique para selecionar</strong>
                <p>Formatos aceitos: PDF, XML, ZIP e Excel</p>
              </div>
              <div className="portal-upload-tags">
                {FILE_TYPES.map((tipo) => (
                  <span key={tipo}>{tipo}</span>
                ))}
              </div>
            </div>

            <div className="portal-form-actions" style={{ marginTop: 16 }}>
              <button onClick={() => fileRef.current?.click()} type="button">
                Enviar documento
              </button>
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
