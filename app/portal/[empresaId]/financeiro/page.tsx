"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Lancamento = {
  data: string;
  descricao: string;
  id: string;
  tipo: "debito" | "credito";
  valor: string;
};

const LANCAMENTOS_MOCK: Lancamento[] = [
  { data: "2026-06-18", descricao: "Honorários contábeis — Junho/2026", id: "1", tipo: "debito", valor: "R$ 850,00" },
  { data: "2026-06-15", descricao: "Serviço de DP — processamento folha", id: "2", tipo: "debito", valor: "R$ 320,00" },
  { data: "2026-06-10", descricao: "Pagamento recebido — Maio/2026", id: "3", tipo: "credito", valor: "R$ 1.170,00" },
  { data: "2026-05-20", descricao: "Honorários contábeis — Maio/2026", id: "4", tipo: "debito", valor: "R$ 850,00" },
  { data: "2026-05-10", descricao: "Pagamento recebido — Abril/2026", id: "5", tipo: "credito", valor: "R$ 1.100,00" },
];

export default function PortalFinanceiro() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

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
  const honorariosAberto = 1;
  const totalAberto = "R$ 1.170,00";
  const proximoVencimento = "30/06/2026";

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Financeiro</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Honorários, faturas e histórico de pagamentos.</p>
        </div>

        {/* KPIs */}
        <div className="kpi-strip" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <article className={`metric-card${honorariosAberto > 0 ? " kpi-warning" : ""}`}>
            <span>Faturas em aberto</span>
            <strong className="kpi-num">{honorariosAberto}</strong>
            <p>Aguardando pagamento</p>
          </article>
          <article className="metric-card">
            <span>Total em aberto</span>
            <strong className="kpi-currency">{totalAberto}</strong>
            <p>Valor total pendente</p>
          </article>
          <article className="metric-card">
            <span>Próximo vencimento</span>
            <strong style={{ display: "block", margin: "10px 0 4px", fontSize: 16, fontWeight: 800 }}>
              {proximoVencimento}
            </strong>
            <p>Data limite de pagamento</p>
          </article>
        </div>

        {/* Extrato */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Extrato de honorários</h2>
              <p>Histórico de cobranças e pagamentos</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            {LANCAMENTOS_MOCK.map((lanc) => (
              <div
                key={lanc.id}
                style={{
                  alignItems: "center",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  gap: 12,
                  justifyContent: "space-between",
                  padding: "12px 4px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{
                    alignItems: "center",
                    background: lanc.tipo === "credito" ? "rgba(16,185,129,0.1)" : "rgba(239,68,95,0.08)",
                    borderRadius: 8,
                    color: lanc.tipo === "credito" ? "var(--green-700)" : "var(--danger)",
                    display: "flex",
                    fontSize: 16,
                    height: 36,
                    justifyContent: "center",
                    width: 36,
                  }}>
                    {lanc.tipo === "credito" ? "↓" : "↑"}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{lanc.descricao}</div>
                    <div style={{ fontSize: 11, color: "var(--muted)" }}>
                      {new Date(lanc.data).toLocaleDateString("pt-BR")}
                    </div>
                  </div>
                </div>
                <div style={{
                  color: lanc.tipo === "credito" ? "var(--green-700)" : "var(--danger)",
                  fontWeight: 700,
                  fontSize: 14,
                }}>
                  {lanc.tipo === "credito" ? "+" : "-"} {lanc.valor}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
