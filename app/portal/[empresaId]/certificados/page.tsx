"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";
import type { Certificado } from "@/modules/certificados/certificados.types";

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  ativo:                { bg: "rgba(52,211,153,0.15)", color: "#34d399", label: "Ativo" },
  proximo_vencimento:   { bg: "rgba(251,191,36,0.15)", color: "#fbbf24", label: "Próximo vencimento" },
  renovando:            { bg: "#ecfeff", color: "#67e8f9", label: "Renovando" },
  vencido:              { bg: "rgba(248,113,113,0.15)", color: "#f87171", label: "Vencido" },
  suspenso:             { bg: "rgba(148,163,184,0.15)", color: "var(--muted)", label: "Suspenso" },
  revogado:             { bg: "rgba(148,163,184,0.15)", color: "#374151", label: "Revogado" },
};

function diasColor(dias: number): string {
  if (dias <= 0) return "#f87171";
  if (dias <= 30) return "#fbbf24";
  if (dias <= 60) return "#67e8f9";
  return "#34d399";
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
      .then((r) => r.json())
      .then((json) => {
        const all = (json.data ?? []) as Certificado[];
        setCertificados(all.filter((c) => c.empresa_id === empresaId));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empresaId]);

  if (!empresa) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "var(--muted)", fontSize: 14 }}>
        Carregando...
      </div>
    );
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">
        <div>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Certificados Digitais</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Acompanhe seus certificados digitais</p>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "var(--muted)", fontSize: 14 }}>Carregando...</div>
        ) : certificados.length === 0 ? (
          <div className="list-panel" style={{ textAlign: "center", padding: "3rem" }}>
            <p style={{ fontSize: "2rem", marginBottom: 8 }}>🔐</p>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 4px" }}>Nenhum certificado registrado</p>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Entre em contato com o escritório para cadastrar seus certificados digitais.</p>
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              <div style={{ background: "rgba(52,211,153,0.15)", border: "1px solid rgba(74,222,128,0.25)", borderTop: "3px solid #34d399", borderRadius: 10, padding: "0.875rem 1rem" }}>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Ativos</p>
                <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#34d399" }}>{certificados.filter((c) => c.status === "ativo").length}</p>
              </div>
              <div style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.35)", borderTop: "3px solid #fbbf24", borderRadius: 10, padding: "0.875rem 1rem" }}>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Vencendo em 30 dias</p>
                <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#fbbf24" }}>{certificados.filter((c) => c.dias_restantes > 0 && c.dias_restantes <= 30).length}</p>
              </div>
              <div style={{ background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.35)", borderTop: "3px solid #f87171", borderRadius: 10, padding: "0.875rem 1rem" }}>
                <p style={{ margin: "0 0 2px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>Vencidos</p>
                <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 900, color: "#f87171" }}>{certificados.filter((c) => c.dias_restantes <= 0).length}</p>
              </div>
            </div>

            <div className="list-panel">
              <div className="list-panel-header">
                <div>
                  <h2>Seus certificados</h2>
                  <p>{certificados.length} certificado(s)</p>
                </div>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "2px solid var(--border)" }}>
                      {["Tipo", "Titular", "Validade", "Dias restantes", "Status"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "0.7rem 0.75rem", color: "var(--muted)", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {certificados.map((cert) => {
                      const s = STATUS_STYLES[cert.status] ?? STATUS_STYLES.ativo;
                      return (
                        <tr key={cert.id} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "0.75rem" }}>
                            <span style={{ background: "#ecfeff", color: "#67e8f9", borderRadius: 6, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 700 }}>{cert.tipo}</span>
                          </td>
                          <td style={{ padding: "0.75rem", fontWeight: 600 }}>{cert.titular}</td>
                          <td style={{ padding: "0.75rem", color: "var(--muted)" }}>{new Date(cert.validade).toLocaleDateString("pt-BR")}</td>
                          <td style={{ padding: "0.75rem" }}>
                            <span style={{ fontWeight: 800, color: diasColor(cert.dias_restantes) }}>
                              {cert.dias_restantes > 0 ? `${cert.dias_restantes} dias` : "Vencido"}
                            </span>
                          </td>
                          <td style={{ padding: "0.75rem" }}>
                            <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{s.label}</span>
                          </td>
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
