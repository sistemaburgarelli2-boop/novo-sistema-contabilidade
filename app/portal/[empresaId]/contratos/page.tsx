"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { PortalShell } from "@/components/portal/PortalShell";

/* ───────── MOCK DATA ───────── */

const MOCK_EMPRESA = { id: "emp-001", nome: "Padaria Pão Dourado Ltda" };

const MOCK_CONTRATOS = [
  { id: "CTR-2026-001", tipo: "Contrato Social", status: "Ativo", inicio: "15/01/2026", vencimento: "15/01/2027" },
  { id: "CTR-2026-002", tipo: "Procuração", status: "Ativo", inicio: "03/02/2026", vencimento: "03/02/2027" },
  { id: "CTR-2026-003", tipo: "Alteração Contratual", status: "Concluído", inicio: "10/03/2025", vencimento: "10/03/2026" },
  { id: "CTR-2026-004", tipo: "NDA - Confidencialidade", status: "Pendente", inicio: "01/06/2026", vencimento: "01/06/2027" },
  { id: "CTR-2026-005", tipo: "Distrato Social", status: "Ativo", inicio: "20/04/2026", vencimento: "20/04/2027" },
];

const TIPOS_CONTRATO = [
  { emoji: "📝", titulo: "Alteração Contratual", descricao: "Alteração de cláusulas do contrato social ou estatuto." },
  { emoji: "📜", titulo: "Certidão Negativa", descricao: "Solicitação de certidões junto aos órgãos competentes." },
  { emoji: "🤝", titulo: "Procuração", descricao: "Outorga de poderes para representação legal da empresa." },
  { emoji: "🔒", titulo: "NDA - Confidencialidade", descricao: "Acordo de sigilo e não divulgação de informações." },
  { emoji: "❌", titulo: "Distrato Social", descricao: "Encerramento formal de sociedade empresarial." },
  { emoji: "🧾", titulo: "Recibo / Declaração", descricao: "Emissão de recibos e declarações diversas." },
];

const MOCK_ASSINATURAS = [
  { id: "ASS-001", contrato: "CTR-2026-004", titulo: "NDA - Confidencialidade", remetente: "Dr. Carlos Mendes", enviadoEm: "18/06/2026", prazo: "25/06/2026" },
  { id: "ASS-002", contrato: "CTR-2026-006", titulo: "Aditivo de Contrato Social", remetente: "Dra. Fernanda Lima", enviadoEm: "19/06/2026", prazo: "30/06/2026" },
];

/* ───────── STYLES ───────── */

const kpiRow: React.CSSProperties = { display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" };

const kpiCard = (accent: string): React.CSSProperties => ({
  flex: "1 1 200px",
  background: "#fff",
  border: "1px solid #e5e7eb",
  borderRadius: 12,
  padding: "20px 24px",
  borderLeft: `4px solid ${accent}`,
});

const kpiValue: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: "#111827" };
const kpiLabel: React.CSSProperties = { fontSize: 13, color: "#6b7280", marginTop: 4 };

const tabRow: React.CSSProperties = { display: "flex", gap: 4, marginBottom: 24, borderBottom: "2px solid #e5e7eb", paddingBottom: 0 };

const tabBtn = (active: boolean): React.CSSProperties => ({
  padding: "10px 20px",
  fontSize: 14,
  fontWeight: active ? 600 : 400,
  color: active ? "#065f46" : "#6b7280",
  background: "none",
  border: "none",
  borderBottom: active ? "2px solid #10b981" : "2px solid transparent",
  cursor: "pointer",
  marginBottom: -2,
  transition: "color 0.15s, border-color 0.15s",
});

const tableWrap: React.CSSProperties = { overflowX: "auto", background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb" };

const th: React.CSSProperties = {
  padding: "12px 16px", fontSize: 12, fontWeight: 600, color: "#6b7280",
  textAlign: "left", textTransform: "uppercase", letterSpacing: "0.05em",
  background: "#f9fafb", borderBottom: "1px solid #e5e7eb",
};

const td: React.CSSProperties = { padding: "12px 16px", fontSize: 14, color: "#374151", borderBottom: "1px solid #f3f4f6" };

const badge = (status: string): React.CSSProperties => {
  const colors: Record<string, { bg: string; color: string }> = {
    Ativo: { bg: "#d1fae5", color: "#065f46" },
    Pendente: { bg: "#fef3c7", color: "#92400e" },
    Concluído: { bg: "#e0e7ff", color: "#3730a3" },
  };
  const c = colors[status] || { bg: "#f3f4f6", color: "#374151" };
  return { display: "inline-block", padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, background: c.bg, color: c.color };
};

const actionBtn: React.CSSProperties = {
  padding: "6px 14px", fontSize: 13, fontWeight: 500, borderRadius: 6,
  border: "1px solid #d1d5db", background: "#fff", color: "#374151",
  cursor: "pointer", marginRight: 6, transition: "background 0.15s",
};

const cardGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16, marginBottom: 32 };

const tipoCard: React.CSSProperties = {
  background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
  padding: 24, cursor: "pointer", transition: "box-shadow 0.2s, border-color 0.2s",
};

const tipoEmoji: React.CSSProperties = { fontSize: 32, marginBottom: 12 };
const tipoTitle: React.CSSProperties = { fontSize: 15, fontWeight: 600, color: "#111827", marginBottom: 6 };
const tipoDesc: React.CSSProperties = { fontSize: 13, color: "#6b7280", lineHeight: 1.5 };

const solicitarBtn: React.CSSProperties = {
  marginTop: 12, padding: "8px 18px", fontSize: 13, fontWeight: 600,
  borderRadius: 8, border: "none", background: "#10b981", color: "#fff",
  cursor: "pointer", transition: "background 0.15s",
};

const formSection: React.CSSProperties = {
  background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
  padding: 24, marginTop: 8,
};

const formLabel: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };

const formInput: React.CSSProperties = {
  width: "100%", padding: "10px 14px", fontSize: 14, borderRadius: 8,
  border: "1px solid #d1d5db", outline: "none", marginBottom: 16, boxSizing: "border-box",
};

const formTextarea: React.CSSProperties = { ...formInput, minHeight: 100, resize: "vertical" as const };

const submitBtn: React.CSSProperties = {
  padding: "10px 28px", fontSize: 14, fontWeight: 600, borderRadius: 8,
  border: "none", background: "#10b981", color: "#fff", cursor: "pointer",
};

const assCard: React.CSSProperties = {
  background: "#fff", borderRadius: 12, border: "1px solid #e5e7eb",
  padding: 24, marginBottom: 16,
};

const assTitle: React.CSSProperties = { fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 4 };
const assMeta: React.CSSProperties = { fontSize: 13, color: "#6b7280", marginBottom: 12 };

const assinarBtn: React.CSSProperties = {
  padding: "10px 24px", fontSize: 14, fontWeight: 600, borderRadius: 8,
  border: "none", background: "#065f46", color: "#fff", cursor: "pointer",
  transition: "background 0.15s",
};

const sigArea: React.CSSProperties = {
  marginTop: 16, border: "2px dashed #d1d5db", borderRadius: 12,
  height: 120, display: "flex", alignItems: "center", justifyContent: "center",
  color: "#9ca3af", fontSize: 14, background: "#fafafa",
};

/* ───────── COMPONENT ───────── */

type Tab = "contratos" | "solicitar" | "assinaturas";

export default function ContratosPage() {
  const params = useParams();
  const empresaId = (params?.empresaId as string) || MOCK_EMPRESA.id;
  const [tab, setTab] = useState<Tab>("contratos");
  const [assinado, setAssinado] = useState<Record<string, boolean>>({});

  const handleAssinar = (id: string) => {
    setAssinado((prev) => ({ ...prev, [id]: true }));
  };

  return (
    <PortalShell empresaId={empresaId} empresaNome={MOCK_EMPRESA.nome}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", margin: 0 }}>Meus Contratos</h2>
          <p style={{ fontSize: 14, color: "#6b7280", margin: "4px 0 0" }}>
            Gerencie contratos, solicite novos documentos e assine pendências.
          </p>
        </div>

        {/* KPIs */}
        <div style={kpiRow}>
          <div style={kpiCard("#10b981")}>
            <div style={kpiValue}>3</div>
            <div style={kpiLabel}>Contratos Ativos</div>
          </div>
          <div style={kpiCard("#f59e0b")}>
            <div style={kpiValue}>1</div>
            <div style={kpiLabel}>Pendentes Assinatura</div>
          </div>
          <div style={kpiCard("#6366f1")}>
            <div style={kpiValue}>1</div>
            <div style={kpiLabel}>Solicitações em Andamento</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={tabRow}>
          <button style={tabBtn(tab === "contratos")} onClick={() => setTab("contratos")}>Meus Contratos</button>
          <button style={tabBtn(tab === "solicitar")} onClick={() => setTab("solicitar")}>Solicitar</button>
          <button style={tabBtn(tab === "assinaturas")} onClick={() => setTab("assinaturas")}>Assinaturas</button>
        </div>

        {/* ── Tab: Meus Contratos ── */}
        {tab === "contratos" && (
          <div style={tableWrap}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Contrato</th>
                  <th style={th}>Tipo</th>
                  <th style={th}>Status</th>
                  <th style={th}>Início</th>
                  <th style={th}>Vencimento</th>
                  <th style={th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_CONTRATOS.map((c) => (
                  <tr key={c.id}>
                    <td style={{ ...td, fontWeight: 600 }}>{c.id}</td>
                    <td style={td}>{c.tipo}</td>
                    <td style={td}><span style={badge(c.status)}>{c.status}</span></td>
                    <td style={td}>{c.inicio}</td>
                    <td style={td}>{c.vencimento}</td>
                    <td style={td}>
                      <button style={actionBtn} onClick={() => alert(`Visualizando ${c.id}`)}>Visualizar</button>
                      <button style={actionBtn} onClick={() => alert(`Baixando ${c.id}`)}>Baixar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Tab: Solicitar ── */}
        {tab === "solicitar" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>Tipos de Contrato</h3>
            <div style={cardGrid}>
              {TIPOS_CONTRATO.map((t) => (
                <div
                  key={t.titulo}
                  style={tipoCard}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#10b981"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px rgba(16,185,129,0.12)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#e5e7eb"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
                >
                  <div style={tipoEmoji}>{t.emoji}</div>
                  <div style={tipoTitle}>{t.titulo}</div>
                  <div style={tipoDesc}>{t.descricao}</div>
                  <button style={solicitarBtn} onClick={() => alert(`Solicitando: ${t.titulo}`)}>
                    Solicitar
                  </button>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>Solicitação Personalizada</h3>
            <div style={formSection}>
              <label style={formLabel}>Tipo de documento</label>
              <input style={formInput} placeholder="Ex: Contrato de prestação de serviço" />

              <label style={formLabel}>Descrição detalhada</label>
              <textarea style={formTextarea} placeholder="Descreva o que você precisa..." />

              <label style={formLabel}>Prazo desejado</label>
              <input style={formInput} type="date" />

              <button style={submitBtn} onClick={() => alert("Solicitação enviada com sucesso!")}>
                Enviar Solicitação
              </button>
            </div>
          </>
        )}

        {/* ── Tab: Assinaturas ── */}
        {tab === "assinaturas" && (
          <>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "#111827", marginBottom: 16 }}>
              Pendentes de Assinatura ({MOCK_ASSINATURAS.length})
            </h3>

            {MOCK_ASSINATURAS.map((a) => (
              <div key={a.id} style={assCard}>
                <div style={assTitle}>{a.titulo}</div>
                <div style={assMeta}>
                  Contrato: {a.contrato} &middot; Enviado por {a.remetente} em {a.enviadoEm} &middot; Prazo: {a.prazo}
                </div>

                {assinado[a.id] ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#065f46", fontWeight: 600, fontSize: 14 }}>
                    <span style={{ fontSize: 20 }}>✅</span> Documento assinado com sucesso
                  </div>
                ) : (
                  <>
                    <div style={sigArea}>
                      Clique em &quot;Assinar&quot; para aplicar sua assinatura digital
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                      <button style={assinarBtn} onClick={() => handleAssinar(a.id)}>Assinar</button>
                      <button style={{ ...actionBtn, padding: "10px 20px" }} onClick={() => alert(`Visualizando ${a.contrato}`)}>
                        Visualizar documento
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </>
        )}
      </div>
    </PortalShell>
  );
}
