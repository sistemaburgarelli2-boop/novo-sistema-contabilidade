"use client";

import { use } from "react";
import { SetorShell } from "@/components/empresas/SetorShell";

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M4 19V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14" stroke="currentColor" strokeWidth={2} />
    <path d="M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <path d="M8 7h8M8 11h8M8 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

const LANCAMENTOS = [
  { data: "10/06/2026", conta: "Receitas de Serviços", debito: "—", credito: "R$ 12.500,00", historico: "NF 001 — Honorários contábeis" },
  { data: "10/06/2026", conta: "Caixa e Equivalentes", debito: "R$ 12.500,00", credito: "—", historico: "Recebimento NF 001" },
  { data: "05/06/2026", conta: "Despesas Administrativas", debito: "R$ 1.800,00", credito: "—", historico: "Aluguel Jun/2026" },
  { data: "05/06/2026", conta: "Contas a Pagar", debito: "—", credito: "R$ 1.800,00", historico: "Provisão aluguel" },
  { data: "01/06/2026", conta: "Pró-labore", debito: "R$ 4.000,00", credito: "—", historico: "Pró-labore sócio Jun/2026" },
];

const BALANCO = [
  { grupo: "ATIVO", itens: [
    { conta: "Ativo Circulante", valor: "R$ 85.000,00", nivel: 1 },
    { conta: "Caixa e Bancos", valor: "R$ 42.000,00", nivel: 2 },
    { conta: "Contas a Receber", valor: "R$ 28.000,00", nivel: 2 },
    { conta: "Estoques", valor: "R$ 15.000,00", nivel: 2 },
    { conta: "Ativo Não Circulante", valor: "R$ 35.000,00", nivel: 1 },
    { conta: "Imobilizado", valor: "R$ 35.000,00", nivel: 2 },
  ]},
  { grupo: "PASSIVO + PL", itens: [
    { conta: "Passivo Circulante", valor: "R$ 22.000,00", nivel: 1 },
    { conta: "Fornecedores", valor: "R$ 8.000,00", nivel: 2 },
    { conta: "Obrigações Fiscais", valor: "R$ 7.500,00", nivel: 2 },
    { conta: "Obrigações Trabalhistas", valor: "R$ 6.500,00", nivel: 2 },
    { conta: "Patrimônio Líquido", valor: "R$ 98.000,00", nivel: 1 },
    { conta: "Capital Social", valor: "R$ 80.000,00", nivel: 2 },
    { conta: "Lucros Acumulados", valor: "R$ 18.000,00", nivel: 2 },
  ]},
];

export default function ContabilPage({ params }: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = use(params);

  return (
    <SetorShell
      borda="#93c5fd"
      cor="#1e40af"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#eff6ff"
      icone={ICONE}
      setorNome="Setor Contábil"
      setorResumo="Registro dos fatos econômicos, conciliação de contas e geração de relatórios contábeis"
      stats={[
        { label: "Receita bruta", value: "R$ 12.500", cor: "#34d399" },
        { label: "Despesas", value: "R$ 5.800", cor: "#fca5a5" },
        { label: "Resultado", value: "R$ 6.700", cor: "#fbbf24" },
        { label: "Lançamentos", value: "5", cor: "#fff" },
      ]}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.25rem" }}>
        {/* Lançamentos recentes */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div><h2>Lançamentos Contábeis</h2><p>Diário geral — Jun/2026</p></div>
            <button type="button">+ Novo lançamento</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e8f0eb" }}>
                  {["Data", "Conta", "Débito", "Crédito", "Histórico"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0.7rem 0.75rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {LANCAMENTOS.map((l, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f0f7f3" }}>
                    <td style={{ padding: "0.75rem", color: "#6f8f7c", whiteSpace: "nowrap" }}>{l.data}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 600, color: "#1e40af" }}>{l.conta}</td>
                    <td style={{ padding: "0.75rem", color: "#b91c1c", fontWeight: 500 }}>{l.debito}</td>
                    <td style={{ padding: "0.75rem", color: "#065f46", fontWeight: 500 }}>{l.credito}</td>
                    <td style={{ padding: "0.75rem", color: "#6f8f7c", fontSize: "0.78rem" }}>{l.historico}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Balanço patrimonial simplificado */}
        <div style={{ display: "grid", gap: "1.25rem" }}>
          <div className="list-panel">
            <div className="list-panel-header">
              <div><h2>Balanço Patrimonial</h2><p>Posição em Jun/2026</p></div>
            </div>
            <div style={{ padding: "0.5rem 0 1rem" }}>
              {BALANCO.map((grupo) => (
                <div key={grupo.grupo}>
                  <div style={{ padding: "0.5rem 1rem", background: "#f3f8f5", borderTop: "1px solid #e8f0eb", borderBottom: "1px solid #e8f0eb" }}>
                    <strong style={{ fontSize: "0.72rem", fontWeight: 900, color: "#065f46", letterSpacing: "1.5px", textTransform: "uppercase" }}>{grupo.grupo}</strong>
                  </div>
                  {grupo.itens.map((item) => (
                    <div key={item.conta} style={{ display: "flex", justifyContent: "space-between", padding: `0.55rem ${item.nivel === 1 ? "1rem" : "1.75rem"}`, borderBottom: "1px solid #f5faf7" }}>
                      <span style={{ fontSize: "0.8rem", fontWeight: item.nivel === 1 ? 700 : 400, color: item.nivel === 1 ? "#07170d" : "#4b6358" }}>{item.conta}</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: item.nivel === 1 ? 700 : 400, color: item.nivel === 1 ? "#07170d" : "#6f8f7c" }}>{item.valor}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Relatórios */}
          <div className="list-panel">
            <div className="list-panel-header"><div><h2>Relatórios</h2></div></div>
            <div style={{ padding: "0.75rem" }}>
              {[
                { nome: "DRE — Demonstração do Resultado", icone: "📊" },
                { nome: "Balanço Patrimonial", icone: "📋" },
                { nome: "Fluxo de Caixa Indireto", icone: "💧" },
                { nome: "Razão Contábil", icone: "📒" },
              ].map((r) => (
                <button key={r.nome} style={{ width: "100%", background: "#f3f8f5", border: "1px solid #dfece5", borderRadius: 8, padding: "0.65rem 0.9rem", marginBottom: "0.4rem", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.6rem" }} type="button">
                  <span style={{ fontSize: "1rem" }}>{r.icone}</span>
                  <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1e40af" }}>{r.nome}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SetorShell>
  );
}
