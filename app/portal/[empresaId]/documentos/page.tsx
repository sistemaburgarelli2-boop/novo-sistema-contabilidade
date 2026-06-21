"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const CATEGORIAS = ["Todos", "Fiscal", "Contábil", "DP", "Societário"];
const FILE_TYPES = [
  { label: "PDF", bg: "rgba(239,68,95,0.1)", color: "#b91c1c" },
  { label: "XML", bg: "rgba(245,158,11,0.1)", color: "#92400e" },
  { label: "ZIP", bg: "rgba(99,102,241,0.1)", color: "#4338ca" },
  { label: "Excel", bg: "rgba(16,185,129,0.1)", color: "#065f46" },
];

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

        <div>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Documentos</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Gerencie e envie documentos para o escritório contábil.
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              onClick={() => setFiltro(cat)}
              style={{
                background: filtro === cat ? "var(--green-700)" : "#fff",
                border: filtro === cat ? "1px solid var(--green-700)" : "1px solid var(--border)",
                borderRadius: 20,
                color: filtro === cat ? "#fff" : "var(--muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                padding: "7px 18px",
                transition: "all 0.15s",
              }}
              type="button"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Empty state */}
        <div className="list-panel" style={{ textAlign: "center", padding: "3rem" }}>
          <p style={{ fontSize: "2rem", marginBottom: 8 }}>📄</p>
          <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 4px" }}>Nenhum documento disponível</p>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Os documentos aparecerão aqui conforme forem enviados ou processados.</p>
        </div>

        {/* Upload section */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Enviar documento</h2>
              <p>Arraste ou selecione arquivos para enviar ao escritório</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            <div
              onClick={() => fileRef.current?.click()}
              onDragLeave={() => setDragging(false)}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDrop={(e) => { e.preventDefault(); setDragging(false); }}
              style={{
                alignItems: "center",
                background: dragging ? "rgba(16,185,129,0.06)" : "rgba(249,252,250,1)",
                border: `2px dashed ${dragging ? "var(--green-400)" : "var(--border)"}`,
                borderRadius: 12,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: 12,
                justifyContent: "center",
                minHeight: 140,
                padding: "30px 20px",
                transition: "all 0.2s",
              }}
            >
              <input
                accept=".pdf,.xml,.zip,.xlsx,.xls,.csv"
                multiple
                ref={fileRef}
                style={{ display: "none" }}
                type="file"
              />
              <div style={{ fontSize: 32 }}>📤</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                  Formatos aceitos: PDF, XML, ZIP, Excel
                </p>
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                {FILE_TYPES.map((ft) => (
                  <span
                    key={ft.label}
                    style={{
                      background: ft.bg,
                      borderRadius: 6,
                      color: ft.color,
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "4px 10px",
                      letterSpacing: "0.3px",
                    }}
                  >
                    {ft.label}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 14 }}>
              <button
                onClick={() => fileRef.current?.click()}
                style={{
                  background: "var(--green-700)",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 700,
                  padding: "10px 22px",
                }}
                type="button"
              >
                Enviar documento
              </button>
            </div>
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
