"use client";

import { use } from "react";
import { SetorShell } from "@/components/empresas/SetorShell";

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <path d="M2 8h20M2 12h20" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <rect height={16} rx={3} stroke="currentColor" strokeWidth={2} width={20} x={2} y={4} />
    <path d="M6 16h4M14 16h4" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

const TRANSACOES = [
  { descricao: "Recebimento — NF 001", data: "10/06/2026", tipo: "entrada", valor: "R$ 12.500,00", conta: "Banco Inter" },
  { descricao: "Pagamento — Fornecedor ABC", data: "08/06/2026", tipo: "saida", valor: "R$ 3.200,00", conta: "Banco Inter" },
  { descricao: "Aluguel Jun/2026", data: "05/06/2026", tipo: "saida", valor: "R$ 1.800,00", conta: "Caixa" },
  { descricao: "Recebimento — NF 002", data: "03/06/2026", tipo: "entrada", valor: "R$ 7.800,00", conta: "Nubank PJ" },
  { descricao: "Pró-labore Jun/2026", data: "01/06/2026", tipo: "saida", valor: "R$ 4.000,00", conta: "Banco Inter" },
  { descricao: "Energia elétrica", data: "01/06/2026", tipo: "saida", valor: "R$ 450,00", conta: "Caixa" },
];

const CONTAS_PAGAR = [
  { descricao: "Fornecedor XYZ Ltda", vencimento: "18/07/2026", valor: "R$ 5.600,00", status: "pendente" },
  { descricao: "Telefonia e Internet", vencimento: "20/07/2026", valor: "R$ 380,00", status: "pendente" },
  { descricao: "Seguro empresarial", vencimento: "30/07/2026", valor: "R$ 1.200,00", status: "pendente" },
  { descricao: "Aluguel Jul/2026", vencimento: "05/07/2026", valor: "R$ 1.800,00", status: "pago" },
];

const CONTAS_RECEBER = [
  { cliente: "Empresa Alpha S.A.", vencimento: "15/07/2026", valor: "R$ 8.900,00", status: "pendente" },
  { cliente: "Comércio Beta Ltda", vencimento: "22/07/2026", valor: "R$ 4.300,00", status: "pendente" },
  { cliente: "Indústria Gamma ME", vencimento: "28/07/2026", valor: "R$ 2.100,00", status: "atrasado" },
];

const TIPO_STYLE: Record<string, { cor: string; bg: string; label: string }> = {
  entrada: { cor: "#065f46", bg: "#ecfdf5", label: "Entrada" },
  saida: { cor: "#b91c1c", bg: "#fef2f2", label: "Saída" },
};

const STATUS_STYLE: Record<string, { cor: string; bg: string; label: string }> = {
  pendente: { cor: "#92400e", bg: "#fffbeb", label: "Pendente" },
  pago: { cor: "#065f46", bg: "#ecfdf5", label: "Pago" },
  atrasado: { cor: "#b91c1c", bg: "#fef2f2", label: "Atrasado" },
  recebido: { cor: "#065f46", bg: "#ecfdf5", label: "Recebido" },
};

export default function FinanceiroPage({ params }: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = use(params);

  return (
    <SetorShell
      borda="#67e8f9"
      cor="#0e7490"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#ecfeff"
      icone={ICONE}
      setorNome="Setor Financeiro"
      setorResumo="Controle do fluxo de caixa, contas a pagar e receber, extratos e conciliação bancária"
      stats={[
        { label: "Saldo atual", value: "R$ 24.350", cor: "#34d399" },
        { label: "Entradas (Jun)", value: "R$ 20.300", cor: "#6ee7b7" },
        { label: "Saídas (Jun)", value: "R$ 9.450", cor: "#fca5a5" },
        { label: "A receber (Jul)", value: "R$ 15.300", cor: "#67e8f9" },
      ]}
    >
      <div style={{ display: "grid", gap: "1.25rem" }}>
        {/* Fluxo de caixa + contas */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.25rem" }}>
          {/* Transações recentes */}
          <div className="list-panel">
            <div className="list-panel-header">
              <div><h2>Extrato — Jun/2026</h2><p>Movimentações financeiras do mês</p></div>
              <button type="button">+ Registrar</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e8f0eb" }}>
                    {["Descrição", "Data", "Conta", "Tipo", "Valor"].map((h, i) => (
                      <th key={h} style={{ textAlign: i >= 3 ? "center" : "left", padding: "0.7rem 1rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TRANSACOES.map((t, i) => {
                    const s = TIPO_STYLE[t.tipo];
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #f0f7f3" }}>
                        <td style={{ padding: "0.8rem 1rem", fontWeight: 600, color: "#07170d" }}>{t.descricao}</td>
                        <td style={{ padding: "0.8rem 1rem", color: "#6f8f7c", whiteSpace: "nowrap" }}>{t.data}</td>
                        <td style={{ padding: "0.8rem 1rem", color: "#4b6358", fontSize: "0.78rem" }}>{t.conta}</td>
                        <td style={{ padding: "0.8rem 1rem", textAlign: "center" }}>
                          <span style={{ background: s.bg, color: s.cor, borderRadius: 999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{s.label}</span>
                        </td>
                        <td style={{ padding: "0.8rem 1rem", textAlign: "center", fontWeight: 700, color: t.tipo === "entrada" ? "#065f46" : "#b91c1c" }}>
                          {t.tipo === "entrada" ? "+" : "−"} {t.valor}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Saldo por conta */}
          <div style={{ display: "grid", gap: "1.25rem", alignContent: "start" }}>
            <div className="list-panel">
              <div className="list-panel-header"><div><h2>Saldo por Conta</h2><p>Posição atual</p></div></div>
              <div style={{ padding: "0.5rem 0 0.75rem" }}>
                {[
                  { conta: "Banco Inter PJ", saldo: "R$ 18.650,00", cor: "#0e7490" },
                  { conta: "Nubank PJ", saldo: "R$ 4.800,00", cor: "#7c3aed" },
                  { conta: "Caixa", saldo: "R$ 900,00", cor: "#065f46" },
                  { conta: "Total disponível", saldo: "R$ 24.350,00", cor: "#07170d", destaque: true },
                ].map((item) => (
                  <div key={item.conta} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.7rem 1rem", borderBottom: "1px solid #f0f7f3", background: item.destaque ? "#f0fbff" : "transparent" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: item.destaque ? 700 : 500, color: "#4b6358" }}>{item.conta}</span>
                    <span style={{ fontSize: "0.85rem", fontWeight: 800, color: item.cor }}>{item.saldo}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini-gráfico fluxo */}
            <div className="list-panel">
              <div className="list-panel-header"><div><h2>Fluxo de Caixa</h2><p>Projeção Jul/2026</p></div></div>
              <div style={{ padding: "1rem 1.25rem" }}>
                {[
                  { label: "Saldo inicial", valor: "R$ 24.350,00", tipo: "neutro" },
                  { label: "+ Entradas previstas", valor: "R$ 15.300,00", tipo: "entrada" },
                  { label: "− Saídas previstas", valor: "R$ 8.980,00", tipo: "saida" },
                  { label: "Saldo projetado", valor: "R$ 30.670,00", tipo: "destaque" },
                ].map((linha) => (
                  <div key={linha.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.55rem 0", borderBottom: "1px solid #f0f7f3" }}>
                    <span style={{ fontSize: "0.82rem", color: "#4b6358", fontWeight: linha.tipo === "destaque" ? 800 : 400 }}>{linha.label}</span>
                    <span style={{ fontSize: "0.83rem", fontWeight: 800, color: linha.tipo === "entrada" ? "#065f46" : linha.tipo === "saida" ? "#b91c1c" : linha.tipo === "destaque" ? "#0e7490" : "#07170d" }}>{linha.valor}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Contas a pagar + receber */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
          {/* Contas a pagar */}
          <div className="list-panel">
            <div className="list-panel-header">
              <div><h2>Contas a Pagar</h2><p>Obrigações do próximo período</p></div>
              <button className="small-action" type="button">+ Lançar</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e8f0eb" }}>
                    {["Descrição", "Vencimento", "Valor", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "0.65rem 1rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTAS_PAGAR.map((c) => {
                    const s = STATUS_STYLE[c.status];
                    return (
                      <tr key={c.descricao} style={{ borderBottom: "1px solid #f0f7f3" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#07170d" }}>{c.descricao}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#6f8f7c" }}>{c.vencimento}</td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#b91c1c" }}>{c.valor}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ background: s.bg, color: s.cor, borderRadius: 999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{s.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #e8f0eb", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "#6f8f7c", fontWeight: 600 }}>Total pendente</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#b91c1c" }}>R$ 8.980,00</span>
            </div>
          </div>

          {/* Contas a receber */}
          <div className="list-panel">
            <div className="list-panel-header">
              <div><h2>Contas a Receber</h2><p>Créditos do próximo período</p></div>
              <button className="small-action" type="button">+ Lançar</button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #e8f0eb" }}>
                    {["Cliente", "Vencimento", "Valor", "Status"].map((h) => (
                      <th key={h} style={{ textAlign: "left", padding: "0.65rem 1rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {CONTAS_RECEBER.map((c) => {
                    const s = STATUS_STYLE[c.status];
                    return (
                      <tr key={c.cliente} style={{ borderBottom: "1px solid #f0f7f3" }}>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#07170d" }}>{c.cliente}</td>
                        <td style={{ padding: "0.75rem 1rem", color: "#6f8f7c" }}>{c.vencimento}</td>
                        <td style={{ padding: "0.75rem 1rem", fontWeight: 700, color: "#065f46" }}>{c.valor}</td>
                        <td style={{ padding: "0.75rem 1rem" }}>
                          <span style={{ background: s.bg, color: s.cor, borderRadius: 999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700 }}>{s.label}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ padding: "0.75rem 1rem", borderTop: "1px solid #e8f0eb", display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "0.8rem", color: "#6f8f7c", fontWeight: 600 }}>Total a receber</span>
              <span style={{ fontSize: "0.85rem", fontWeight: 800, color: "#065f46" }}>R$ 15.300,00</span>
            </div>
          </div>
        </div>
      </div>
    </SetorShell>
  );
}
