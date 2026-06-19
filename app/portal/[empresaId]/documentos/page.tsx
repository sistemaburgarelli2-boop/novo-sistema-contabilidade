"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Documento = {
  id: string;
  nome: string;
  categoria: "Fiscal" | "Contábil" | "DP" | "Societário";
  setor: string;
  data: string;
  status: "Recebido" | "Analisando" | "Processado";
};

const STATUS_STYLES: Record<Documento["status"], { bg: string; color: string }> = {
  Recebido: { bg: "rgba(6,182,212,0.1)", color: "#0e7490" },
  Analisando: { bg: "rgba(245,158,11,0.12)", color: "#92400e" },
  Processado: { bg: "rgba(16,185,129,0.1)", color: "#065f46" },
};

const DOCUMENTOS_MOCK: Documento[] = [
  { id: "1", nome: "Extrato bancário Jun/2026", categoria: "Fiscal", setor: "Financeiro", data: "2026-06-18", status: "Recebido" },
  { id: "2", nome: "Notas fiscais saída Jun/2026", categoria: "Fiscal", setor: "Fiscal", data: "2026-06-17", status: "Processado" },
  { id: "3", nome: "Balancete Mai/2026", categoria: "Contábil", setor: "Contábil", data: "2026-06-15", status: "Processado" },
  { id: "4", nome: "DRE Mai/2026", categoria: "Contábil", setor: "Contábil", data: "2026-06-14", status: "Processado" },
  { id: "5", nome: "Folha Mai/2026", categoria: "DP", setor: "Pessoal", data: "2026-06-12", status: "Processado" },
  { id: "6", nome: "Holerites Mai/2026", categoria: "DP", setor: "Pessoal", data: "2026-06-11", status: "Analisando" },
  { id: "7", nome: "Contrato social atualizado", categoria: "Societário", setor: "Societário", data: "2026-06-10", status: "Recebido" },
  { id: "8", nome: "Comprovantes INSS", categoria: "DP", setor: "Pessoal", data: "2026-06-08", status: "Recebido" },
  { id: "9", nome: "XML NFe Jun/2026", categoria: "Fiscal", setor: "Fiscal", data: "2026-06-06", status: "Analisando" },
  { id: "10", nome: "Recibo férias", categoria: "DP", setor: "Pessoal", data: "2026-06-04", status: "Processado" },
];

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

  const documentosFiltrados = filtro === "Todos"
    ? DOCUMENTOS_MOCK
    : DOCUMENTOS_MOCK.filter((d) => d.categoria === filtro);

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

        {/* Documents table */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Documentos ({documentosFiltrados.length})</h2>
              <p>Todos os documentos da empresa</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Documento", "Categoria", "Setor", "Data", "Status", "Ações"].map((h) => (
                    <th
                      key={h}
                      style={{
                        color: "var(--muted)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        padding: "10px 8px",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {documentosFiltrados.map((doc) => {
                  const st = STATUS_STYLES[doc.status];
                  return (
                    <tr key={doc.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span>{"\u{1F4C4}"}</span>
                          <strong style={{ fontSize: 13 }}>{doc.nome}</strong>
                        </div>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{
                          background: "rgba(99,102,241,0.08)",
                          borderRadius: 12,
                          color: "#4338ca",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                        }}>
                          {doc.categoria}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", padding: "10px 8px" }}>{doc.setor}</td>
                      <td style={{ color: "var(--muted)", padding: "10px 8px" }}>
                        {new Date(doc.data).toLocaleDateString("pt-BR")}
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{
                          background: st.bg,
                          borderRadius: 20,
                          color: st.color,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}>
                          {doc.status}
                        </span>
                      </td>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            style={{
                              background: "rgba(6,182,212,0.08)",
                              border: "none",
                              borderRadius: 6,
                              color: "#0e7490",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "5px 10px",
                            }}
                            type="button"
                          >
                            Visualizar
                          </button>
                          <button
                            style={{
                              background: "rgba(99,102,241,0.08)",
                              border: "none",
                              borderRadius: 6,
                              color: "#4338ca",
                              cursor: "pointer",
                              fontSize: 12,
                              fontWeight: 600,
                              padding: "5px 10px",
                            }}
                            type="button"
                          >
                            Baixar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
              <div style={{ fontSize: 32 }}>{"\u{1F4E4}"}</div>
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
                  Arraste arquivos aqui ou clique para selecionar
                </p>
                <p style={{ fontSize: 12, color: "var(--muted)", margin: 0 }}>
                  Formatos aceitos: PDF, XML, ZIP, Excel
                </p>
              </div>
              {/* File type badges */}
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
