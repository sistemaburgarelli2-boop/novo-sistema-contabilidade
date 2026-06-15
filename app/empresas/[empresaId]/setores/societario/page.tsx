"use client";

import { use } from "react";
import { SetorShell } from "@/components/empresas/SetorShell";

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
    <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

const ETAPAS = [
  { titulo: "Planejamento e Estruturação", status: "concluido", data: "10/01/2026", desc: "Natureza jurídica, porte, CNAE e regime tributário definidos." },
  { titulo: "Viabilidade e DBE", status: "concluido", data: "15/01/2026", desc: "Viabilidade aprovada na Junta Comercial. DBE protocolado." },
  { titulo: "Contrato Social / Requerimento", status: "concluido", data: "20/01/2026", desc: "Contrato Social registrado — NIRE 35300000001." },
  { titulo: "CNPJ emitido", status: "concluido", data: "28/01/2026", desc: "CNPJ emitido pela Receita Federal." },
  { titulo: "Inscrição Estadual", status: "em_andamento", data: "—", desc: "Aguardando aprovação da SEFAZ." },
  { titulo: "Inscrição Municipal e Alvará", status: "pendente", data: "—", desc: "Aguarda conclusão da IE para protocolo." },
];

const CERTIDOES = [
  { nome: "CND Federal (Receita + PGFN)", validade: "10/08/2026", status: "valida" },
  { nome: "CND Estadual (SEFAZ)", validade: "30/07/2026", status: "valida" },
  { nome: "CND Municipal", validade: "—", status: "pendente" },
  { nome: "CRF — FGTS", validade: "15/07/2026", status: "vencendo" },
  { nome: "CNDT — Trabalhista", validade: "20/09/2026", status: "valida" },
];

const STEP_STYLE: Record<string, { cor: string; bg: string; label: string; icone: string }> = {
  concluido: { cor: "#065f46", bg: "#ecfdf5", label: "Concluído", icone: "✓" },
  em_andamento: { cor: "#92400e", bg: "#fffbeb", label: "Em andamento", icone: "◎" },
  pendente: { cor: "#6b7280", bg: "#f3f4f6", label: "Pendente", icone: "○" },
};

const CERT_STYLE: Record<string, { cor: string; bg: string; label: string }> = {
  valida: { cor: "#065f46", bg: "#ecfdf5", label: "Válida" },
  vencendo: { cor: "#92400e", bg: "#fffbeb", label: "Vencendo" },
  pendente: { cor: "#6b7280", bg: "#f3f4f6", label: "Pendente" },
};

export default function SocietarioPage({ params }: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = use(params);

  return (
    <SetorShell
      borda="#fcd34d"
      cor="#92400e"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#fffbeb"
      icone={ICONE}
      setorNome="Setor Societário (Paralegal)"
      setorResumo="Abertura, alteração e encerramento de empresas, alvarás e certidões negativas"
      stats={[
        { label: "Etapas concluídas", value: "4 / 6", cor: "#34d399" },
        { label: "Em andamento", value: "1", cor: "#fbbf24" },
        { label: "Certidões válidas", value: "3 / 5", cor: "#fff" },
        { label: "CRF — vence em", value: "15/07", cor: "#fca5a5" },
      ]}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "1.25rem" }}>
        {/* Timeline de abertura */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div><h2>Processo de Abertura</h2><p>Acompanhe cada etapa da legalização</p></div>
            <button type="button">Registrar evento</button>
          </div>
          <div style={{ padding: "1.25rem 1.5rem", display: "grid", gap: "0" }}>
            {ETAPAS.map((etapa, i) => {
              const s = STEP_STYLE[etapa.status];
              return (
                <div key={etapa.titulo} style={{ display: "flex", gap: "1rem", paddingBottom: i < ETAPAS.length - 1 ? "1.25rem" : 0, position: "relative" }}>
                  {i < ETAPAS.length - 1 && (
                    <div style={{ position: "absolute", left: 15, top: 32, bottom: 0, width: 2, background: etapa.status === "concluido" ? "#6ee7b7" : "#e5e7eb" }} />
                  )}
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: s.bg, color: s.cor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", fontWeight: 800, flexShrink: 0, border: `2px solid ${etapa.status === "concluido" ? "#6ee7b7" : "#e5e7eb"}`, zIndex: 1 }}>
                    {s.icone}
                  </div>
                  <div style={{ paddingTop: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#07170d" }}>{etapa.titulo}</span>
                      <span style={{ background: s.bg, color: s.cor, borderRadius: 999, padding: "1px 8px", fontSize: "0.7rem", fontWeight: 700 }}>{s.label}</span>
                      {etapa.data !== "—" && <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{etapa.data}</span>}
                    </div>
                    <p style={{ margin: "0.25rem 0 0", fontSize: "0.79rem", color: "#6f8f7c" }}>{etapa.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: "grid", gap: "1.25rem", alignContent: "start" }}>
          {/* Certidões */}
          <div className="list-panel">
            <div className="list-panel-header">
              <div><h2>Certidões Negativas</h2><p>Controle de validade</p></div>
              <button className="small-action" type="button">Solicitar</button>
            </div>
            <div style={{ padding: "0.25rem 0 0.75rem" }}>
              {CERTIDOES.map((cert) => {
                const s = CERT_STYLE[cert.status];
                return (
                  <div key={cert.nome} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem 1rem", borderBottom: "1px solid #f0f7f3" }}>
                    <span style={{ fontSize: "0.81rem", fontWeight: 600, color: "#07170d" }}>{cert.nome}</span>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
                      <span style={{ background: s.bg, color: s.cor, borderRadius: 999, padding: "2px 8px", fontSize: "0.7rem", fontWeight: 700 }}>{s.label}</span>
                      {cert.validade !== "—" && <span style={{ fontSize: "0.7rem", color: "#9ca3af" }}>{cert.validade}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ações societárias */}
          <div className="list-panel">
            <div className="list-panel-header"><div><h2>Ações Societárias</h2></div></div>
            <div style={{ padding: "0.75rem" }}>
              {[
                { label: "Alteração Contratual", desc: "Alterar dados, sócios ou capital" },
                { label: "Encerramento de Empresa", desc: "Iniciar processo de baixa" },
                { label: "Emissão de Alvará", desc: "Solicitar alvará de funcionamento" },
                { label: "Transferência de Sede", desc: "Alterar endereço da empresa" },
              ].map((acao) => (
                <button key={acao.label} style={{ width: "100%", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.65rem 0.9rem", marginBottom: "0.4rem", textAlign: "left", cursor: "pointer", display: "grid", gap: "0.1rem" }} type="button">
                  <span style={{ fontWeight: 700, fontSize: "0.82rem", color: "#92400e" }}>{acao.label}</span>
                  <span style={{ fontSize: "0.74rem", color: "#a16207" }}>{acao.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SetorShell>
  );
}
