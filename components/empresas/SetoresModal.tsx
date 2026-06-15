"use client";

import { useRouter } from "next/navigation";
import type { Empresa } from "@/modules/empresas/empresas.types";

const SETORES = [
  {
    id: "fiscal",
    cor: "#065f46",
    fundo: "#ecfdf5",
    borda: "#6ee7b7",
    icone: (
      <svg fill="none" height={22} viewBox="0 0 24 24" width={22}>
        <path d="M9 14l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
        <path d="M14 2v6h6" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
      </svg>
    ),
    nome: "Setor Fiscal",
    resumo: "Tributos e obrigações",
    descricao:
      "Responsável pela apuração de impostos, emissão de notas fiscais e cumprimento de obrigações tributárias como o envio do SPED, DCTF, EFD e demais declarações exigidas pela Receita Federal, estadual e municipal.",
  },
  {
    id: "contabil",
    cor: "#1e40af",
    fundo: "#eff6ff",
    borda: "#93c5fd",
    icone: (
      <svg fill="none" height={22} viewBox="0 0 24 24" width={22}>
        <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" stroke="currentColor" strokeWidth={2} />
        <path d="M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
        <path d="M8 7h8M8 11h8M8 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
      </svg>
    ),
    nome: "Setor Contábil",
    resumo: "Balanço e DRE",
    descricao:
      "Cuida do registro dos fatos econômicos e financeiros. Analisa e concilia contas para gerar relatórios cruciais como o Balanço Patrimonial, a Demonstração do Resultado do Exercício (DRE) e o Fluxo de Caixa.",
  },
  {
    id: "dp",
    cor: "#6b21a8",
    fundo: "#faf5ff",
    borda: "#c4b5fd",
    icone: (
      <svg fill="none" height={22} viewBox="0 0 24 24" width={22}>
        <circle cx={9} cy={7} r={4} stroke="currentColor" strokeWidth={2} />
        <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
        <path d="M16 11h6M19 8v6" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
      </svg>
    ),
    nome: "Departamento Pessoal",
    resumo: "Folha e eSocial",
    descricao:
      "Gerencia a folha de pagamento, férias, 13º salário, rescisões e vínculos trabalhistas e previdenciários. Responsável pelo eSocial, FGTS, INSS e todas as obrigações junto ao Ministério do Trabalho.",
  },
  {
    id: "societario",
    cor: "#92400e",
    fundo: "#fffbeb",
    borda: "#fcd34d",
    icone: (
      <svg fill="none" height={22} viewBox="0 0 24 24" width={22}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeLinejoin="round" strokeWidth={2} />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      </svg>
    ),
    nome: "Setor Societário (Paralegal)",
    resumo: "Abertura e encerramento",
    descricao:
      "Trata da burocracia legal. Cuida da abertura, alteração e encerramento de empresas, emissão de alvarás, certidões negativas, registros na Junta Comercial e demais órgãos competentes.",
  },
  {
    id: "financeiro",
    cor: "#0e7490",
    fundo: "#ecfeff",
    borda: "#67e8f9",
    icone: (
      <svg fill="none" height={22} viewBox="0 0 24 24" width={22}>
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
      </svg>
    ),
    nome: "Setor Financeiro",
    resumo: "Fluxo de caixa",
    descricao:
      "Controla o fluxo de caixa diário da empresa. É o setor que dialoga diretamente com o escritório de contabilidade para repassar extratos bancários, comprovantes de pagamentos e recebimentos.",
  },
];

export function SetoresModal({
  empresa,
  onClose,
}: {
  empresa: Empresa;
  onClose: () => void;
}) {
  const router = useRouter();

  function acessarSetor(id: string) {
    onClose();
    router.push(`/empresas/${empresa.id}/setores/${id}`);
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(6,23,13,0.6)", zIndex: 40, backdropFilter: "blur(2px)" }}
      />
      <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", pointerEvents: "none" }}>
        <div style={{
          width: "100%", maxWidth: 860, maxHeight: "90vh",
          background: "#fff", borderRadius: 16,
          border: "1px solid #dfece5",
          boxShadow: "0 32px 100px rgba(7,23,13,0.18)",
          display: "flex", flexDirection: "column",
          overflow: "hidden", pointerEvents: "auto",
        }}>
          {/* Header */}
          <div style={{
            padding: "1.5rem 2rem",
            borderBottom: "1px solid #dfece5",
            background: "linear-gradient(100deg, rgba(6,23,13,0.97), rgba(16,50,22,0.97))",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.3rem" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981" }} />
                <span style={{ fontSize: "0.72rem", fontWeight: 800, color: "#34d399", letterSpacing: "2px", textTransform: "uppercase" }}>
                  Setores
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: "1.1rem", color: "#fff", fontWeight: 700 }}>{empresa.nome_legal}</h2>
              <p style={{ margin: "0.25rem 0 0", fontSize: "0.8rem", color: "#6ee7b7" }}>
                {empresa.nome_fantasia ?? "Organização interna do escritório"}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#9ca3af", fontSize: "1.1rem", cursor: "pointer", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center" }}
              type="button"
            >
              ×
            </button>
          </div>

          {/* Setores grid */}
          <div style={{ overflowY: "auto", padding: "1.75rem 2rem", background: "#f8fbf9" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              {SETORES.map((setor) => (
                <div
                  key={setor.id}
                  style={{
                    background: "#fff",
                    border: `1px solid #e8f0eb`,
                    borderTop: `3px solid ${setor.borda}`,
                    borderRadius: 12,
                    padding: "1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                    boxShadow: "0 2px 8px rgba(7,23,13,0.05)",
                    transition: "box-shadow 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: setor.fundo,
                        color: setor.cor,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        border: `1px solid ${setor.borda}`,
                      }}>
                        {setor.icone}
                      </div>
                      <div>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: "0.88rem", color: "#07170d" }}>{setor.nome}</p>
                        <span style={{
                          display: "inline-block", marginTop: 3,
                          fontSize: "0.7rem", fontWeight: 700,
                          color: setor.cor, background: setor.fundo,
                          border: `1px solid ${setor.borda}`,
                          borderRadius: 999, padding: "1px 8px",
                        }}>
                          {setor.resumo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#4b7060", lineHeight: 1.6 }}>
                    {setor.descricao}
                  </p>

                  <button
                    onClick={() => acessarSetor(setor.id)}
                    style={{
                      marginTop: "auto",
                      background: setor.fundo,
                      border: `1px solid ${setor.borda}`,
                      color: setor.cor,
                      borderRadius: 8, padding: "0.45rem 1rem",
                      fontSize: "0.78rem", fontWeight: 700,
                      cursor: "pointer", alignSelf: "flex-start",
                      minHeight: 32,
                      transition: "opacity 0.15s",
                    }}
                    type="button"
                  >
                    Acessar setor →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ padding: "1rem 2rem", borderTop: "1px solid #dfece5", background: "#f3f8f5", display: "flex", justifyContent: "flex-end" }}>
            <button className="small-action" onClick={onClose} type="button">Fechar</button>
          </div>
        </div>
      </div>
    </>
  );
}
