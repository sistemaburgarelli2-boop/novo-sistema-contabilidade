"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Arquivo = {
  id: string;
  categoria: string;
  data: string;
  nome: string;
  tamanho: string;
};

const CATEGORIAS = [
  { accept: ".pdf,.csv,.ofx", descricao: "PDF, CSV ou OFX", emoji: "🏦", label: "Extratos bancários", value: "extrato" },
  { accept: ".pdf,.xml", descricao: "PDF ou XML", emoji: "🧾", label: "Notas fiscais", value: "nota" },
  { accept: ".pdf,.docx", descricao: "PDF ou Word", emoji: "📝", label: "Contratos", value: "contrato" },
  { accept: "*", descricao: "Qualquer formato", emoji: "📁", label: "Arquivos gerais", value: "geral" },
];

const ARQUIVOS_MOCK: Arquivo[] = [
  { categoria: "Extrato", data: "2026-06-10", id: "1", nome: "extrato-junho-bradesco.pdf", tamanho: "248 KB" },
  { categoria: "Nota Fiscal", data: "2026-06-08", id: "2", nome: "NF-e_2026_001234.xml", tamanho: "18 KB" },
  { categoria: "Contrato", data: "2026-05-20", id: "3", nome: "contrato-servico-2026.pdf", tamanho: "512 KB" },
];

export default function PortalDocumentos() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [dragging, setDragging] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  if (!empresa) {
    return (
      <div style={{ alignItems: "center", display: "flex", fontSize: 14, justifyContent: "center", minHeight: "100vh", color: "var(--muted)" }}>
        Carregando...
      </div>
    );
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div className="module-hero" style={{ background: "none", boxShadow: "none", padding: 0 }}>
          <div>
            <h1 style={{ fontSize: 20 }}>Enviar documentos</h1>
            <p>Faça upload de extratos, notas, contratos e outros arquivos para o escritório.</p>
          </div>
        </div>

        {/* Upload zones */}
        <div className="upload-zones-grid">
          {CATEGORIAS.map((cat) => (
            <div
              className={`upload-zone${dragging === cat.value ? " dragging" : ""}`}
              key={cat.value}
              onClick={() => fileRefs.current[cat.value]?.click()}
              onDragLeave={() => setDragging(null)}
              onDragOver={(e) => { e.preventDefault(); setDragging(cat.value); }}
              onDrop={(e) => { e.preventDefault(); setDragging(null); }}
            >
              <input
                accept={cat.accept}
                multiple
                ref={(el) => { fileRefs.current[cat.value] = el; }}
                type="file"
              />
              <div className="upload-zone-icon">{cat.emoji}</div>
              <div className="upload-zone-label">{cat.label}</div>
              <div className="upload-zone-sub">{cat.descricao} · Clique ou arraste</div>
            </div>
          ))}
        </div>

        {/* Arquivos enviados */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Arquivos enviados</h2>
              <p>Documentos recebidos pelo escritório</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Arquivo", "Categoria", "Data", "Tamanho", "Status"].map((h) => (
                    <th
                      key={h}
                      style={{ color: "var(--muted)", fontSize: 11, fontWeight: 700, letterSpacing: "0.5px", padding: "10px 8px", textAlign: "left", textTransform: "uppercase" }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ARQUIVOS_MOCK.map((arq) => (
                  <tr key={arq.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span>📄</span>
                        <strong style={{ fontSize: 13 }}>{arq.nome}</strong>
                      </div>
                    </td>
                    <td style={{ color: "var(--muted)", padding: "10px 8px" }}>{arq.categoria}</td>
                    <td style={{ color: "var(--muted)", padding: "10px 8px" }}>
                      {new Date(arq.data).toLocaleDateString("pt-BR")}
                    </td>
                    <td style={{ color: "var(--muted)", padding: "10px 8px" }}>{arq.tamanho}</td>
                    <td style={{ padding: "10px 8px" }}>
                      <span className="priority-badge badge-success">Recebido</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
