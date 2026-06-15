"use client";

import { use } from "react";
import { SetorShell } from "@/components/empresas/SetorShell";

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M9 14l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
    <path d="M14 2v6h6" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

const OBRIGACOES = [
  { nome: "DAS — Simples Nacional", vencimento: "20/07/2026", competencia: "Jun/2026", status: "pendente" },
  { nome: "DCTF Mensal", vencimento: "15/07/2026", competencia: "Mai/2026", status: "pendente" },
  { nome: "EFD-Contribuições", vencimento: "10/07/2026", competencia: "Mai/2026", status: "concluido" },
  { nome: "SPED Fiscal (EFD-ICMS/IPI)", vencimento: "15/08/2026", competencia: "Jul/2026", status: "pendente" },
  { nome: "DEFIS — Declaração Simples", vencimento: "31/03/2026", competencia: "2025", status: "concluido" },
  { nome: "DIRF", vencimento: "28/02/2026", competencia: "2025", status: "concluido" },
];

const IMPOSTOS = [
  { nome: "IRPJ", base: "R$ 0,00", aliquota: "15%", valor: "R$ 0,00" },
  { nome: "CSLL", base: "R$ 0,00", aliquota: "9%", valor: "R$ 0,00" },
  { nome: "PIS", base: "R$ 0,00", aliquota: "0,65%", valor: "R$ 0,00" },
  { nome: "COFINS", base: "R$ 0,00", aliquota: "3%", valor: "R$ 0,00" },
  { nome: "ISS", base: "R$ 0,00", aliquota: "2%–5%", valor: "R$ 0,00" },
];

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pendente: { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
  concluido: { bg: "#ecfdf5", color: "#065f46", label: "Concluído" },
  atrasado: { bg: "#fef2f2", color: "#b91c1c", label: "Atrasado" },
};

export default function FiscalPage({ params }: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = use(params);

  return (
    <SetorShell
      borda="#6ee7b7"
      cor="#065f46"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#ecfdf5"
      icone={ICONE}
      setorNome="Setor Fiscal"
      setorResumo="Apuração de impostos, emissão de notas fiscais e cumprimento de obrigações tributárias"
      stats={[
        { label: "Obrigações pendentes", value: "2", cor: "#fbbf24" },
        { label: "Concluídas no mês", value: "3", cor: "#34d399" },
        { label: "Próximo vencimento", value: "15/07", cor: "#fff" },
        { label: "Competência atual", value: "Jun/2026", cor: "#fff" },
      ]}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Obrigações acessórias */}
        <div className="list-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="list-panel-header">
            <div>
              <h2>Obrigações Acessórias</h2>
              <p>Declarações e entregas ao fisco federal, estadual e municipal</p>
            </div>
            <button type="button">+ Nova obrigação</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e8f0eb" }}>
                  {["Obrigação", "Competência", "Vencimento", "Status"].map((h, i) => (
                    <th key={h} style={{ textAlign: i === 3 ? "center" : "left", padding: "0.75rem 1rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {OBRIGACOES.map((ob) => {
                  const s = STATUS_STYLE[ob.status];
                  return (
                    <tr key={ob.nome} style={{ borderBottom: "1px solid #f0f7f3" }}>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: 600, color: "#07170d" }}>{ob.nome}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#6f8f7c" }}>{ob.competencia}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#374151", fontWeight: 500 }}>{ob.vencimento}</td>
                      <td style={{ padding: "0.875rem 1rem", textAlign: "center" }}>
                        <span style={{ display: "inline-block", background: s.bg, color: s.color, borderRadius: 999, padding: "3px 12px", fontSize: "0.75rem", fontWeight: 700 }}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Apuração de impostos */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Apuração de Impostos</h2>
              <p>Competência Jun/2026</p>
            </div>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e8f0eb" }}>
                {["Imposto", "Base de cálculo", "Alíquota", "Valor"].map((h) => (
                  <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.73rem", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IMPOSTOS.map((imp) => (
                <tr key={imp.nome} style={{ borderBottom: "1px solid #f0f7f3" }}>
                  <td style={{ padding: "0.8rem 1rem", fontWeight: 700, color: "#065f46" }}>{imp.nome}</td>
                  <td style={{ padding: "0.8rem 1rem", color: "#6f8f7c" }}>{imp.base}</td>
                  <td style={{ padding: "0.8rem 1rem", color: "#374151" }}>{imp.aliquota}</td>
                  <td style={{ padding: "0.8rem 1rem", fontWeight: 700, color: "#07170d" }}>{imp.valor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Ações rápidas */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div><h2>Ações Rápidas</h2><p>Tarefas do setor fiscal</p></div>
          </div>
          <div style={{ padding: "1rem", display: "grid", gap: "0.6rem" }}>
            {[
              { label: "Emitir guia DAS", desc: "Gerar DAS do Simples Nacional" },
              { label: "Calcular IRPJ/CSLL", desc: "Apuração estimativa mensal" },
              { label: "Enviar SPED", desc: "Transmitir escrituração digital" },
              { label: "Gerar DCTF", desc: "Declaração de créditos e débitos" },
              { label: "Certidão Negativa", desc: "Solicitar CND Federal" },
            ].map((acao) => (
              <button
                key={acao.label}
                style={{ background: "#f3f8f5", border: "1px solid #dfece5", borderRadius: 10, padding: "0.75rem 1rem", textAlign: "left", cursor: "pointer", display: "grid", gap: "0.15rem" }}
                type="button"
              >
                <span style={{ fontWeight: 700, fontSize: "0.83rem", color: "#065f46" }}>{acao.label}</span>
                <span style={{ fontSize: "0.75rem", color: "#6f8f7c" }}>{acao.desc}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </SetorShell>
  );
}
