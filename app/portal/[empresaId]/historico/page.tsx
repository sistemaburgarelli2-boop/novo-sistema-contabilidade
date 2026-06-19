"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type TipoEvento = "Documentos" | "Guias" | "Solicitações" | "Operacional";

type Evento = {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  tipo: TipoEvento;
  iconColor: string;
};

const TIPO_STYLES: Record<TipoEvento, { bg: string; color: string }> = {
  Documentos: { bg: "rgba(6,182,212,0.1)", color: "#0e7490" },
  Guias: { bg: "rgba(16,185,129,0.1)", color: "#065f46" },
  "Solicitações": { bg: "rgba(245,158,11,0.12)", color: "#92400e" },
  Operacional: { bg: "rgba(99,102,241,0.1)", color: "#4338ca" },
};

const EVENTOS_MOCK: Evento[] = [
  { id: "1", titulo: "Rescisão funcionário solicitada", descricao: "Solicitação #6 aberta — Rescisão do funcionário Pedro Lima, demissão sem justa causa", data: "19/06/2026", tipo: "Solicitações", iconColor: "#f59e0b" },
  { id: "2", titulo: "Guia DAS Jun/2026 emitida", descricao: "Guia DAS — Simples Nacional disponível para pagamento. Valor: R$ 1.250,00. Vencimento: 20/07/2026", data: "18/06/2026", tipo: "Guias", iconColor: "#10b981" },
  { id: "3", titulo: "Guia INSS Jun/2026 emitida", descricao: "GPS competência Jun/2026 disponível para pagamento. Valor: R$ 2.800,00", data: "18/06/2026", tipo: "Guias", iconColor: "#10b981" },
  { id: "4", titulo: "Certidão negativa solicitada", descricao: "Solicitação #3 aberta — Certidão negativa de débitos federais para licitação", data: "18/06/2026", tipo: "Solicitações", iconColor: "#f59e0b" },
  { id: "5", titulo: "Documento recebido: Extrato bancário", descricao: "Extrato bancário Jun/2026 recebido e encaminhado para análise pelo setor Fiscal", data: "17/06/2026", tipo: "Documentos", iconColor: "#38bdf8" },
  { id: "6", titulo: "Guia FGTS Jun/2026 emitida", descricao: "Guia FGTS disponível para pagamento. Valor: R$ 1.900,00. Vencimento: 07/07/2026", data: "16/06/2026", tipo: "Guias", iconColor: "#10b981" },
  { id: "7", titulo: "Notas fiscais processadas", descricao: "Notas fiscais de saída Jun/2026 processadas e classificadas com sucesso", data: "16/06/2026", tipo: "Documentos", iconColor: "#38bdf8" },
  { id: "8", titulo: "Declaração IR 2025 concluída", descricao: "Solicitação #1 concluída — Declaração do IR 2025 entregue e disponível", data: "16/06/2026", tipo: "Solicitações", iconColor: "#f59e0b" },
  { id: "9", titulo: "Folha de pagamento Mai/2026 concluída", descricao: "Processamento da folha de pagamento finalizado. 12 colaboradores processados", data: "15/06/2026", tipo: "Operacional", iconColor: "#8b5cf6" },
  { id: "10", titulo: "Holerites Mai/2026 em análise", descricao: "Holerites do mês de maio em processo de conferência e validação", data: "14/06/2026", tipo: "Documentos", iconColor: "#38bdf8" },
  { id: "11", titulo: "Parcelamento INSS em análise", descricao: "Solicitação #5 em andamento — Análise das condições de parcelamento. Valor total: R$ 8.100,00", data: "12/06/2026", tipo: "Solicitações", iconColor: "#f59e0b" },
  { id: "12", titulo: "Certidão negativa federal emitida", descricao: "CND federal emitida com validade até 10/12/2026. Disponível para download", data: "10/06/2026", tipo: "Operacional", iconColor: "#8b5cf6" },
  { id: "13", titulo: "Contrato social recebido", descricao: "Contrato social atualizado recebido via portal e encaminhado para processamento", data: "10/06/2026", tipo: "Documentos", iconColor: "#38bdf8" },
  { id: "14", titulo: "Adiantamento férias concluído", descricao: "Solicitação #4 concluída — Recibo de férias disponível. Valor líquido: R$ 3.250,00", data: "08/06/2026", tipo: "Solicitações", iconColor: "#f59e0b" },
  { id: "15", titulo: "Fechamento contábil Mai/2026 concluído", descricao: "Balancete, DRE e demais relatórios contábeis de maio finalizados e disponíveis", data: "05/06/2026", tipo: "Operacional", iconColor: "#8b5cf6" },
];

const FILTROS: Array<"Todos" | TipoEvento> = ["Todos", "Documentos", "Guias", "Solicitações", "Operacional"];

export default function PortalHistorico() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [filtro, setFiltro] = useState<"Todos" | TipoEvento>("Todos");

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

  const eventosFiltrados = filtro === "Todos"
    ? EVENTOS_MOCK
    : EVENTOS_MOCK.filter((e) => e.tipo === filtro);

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div>
          <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Histórico</h1>
          <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
            Linha do tempo completa de atividades da sua empresa.
          </p>
        </div>

        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {FILTROS.map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              style={{
                background: filtro === f ? "var(--green-700)" : "#fff",
                border: filtro === f ? "1px solid var(--green-700)" : "1px solid var(--border)",
                borderRadius: 20,
                color: filtro === f ? "#fff" : "var(--muted)",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                padding: "7px 18px",
                transition: "all 0.15s",
              }}
              type="button"
            >
              {f}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Atividades ({eventosFiltrados.length})</h2>
              <p>Junho/2026</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            {eventosFiltrados.map((evt, idx) => {
              const tipoStyle = TIPO_STYLES[evt.tipo];
              return (
                <div
                  key={evt.id}
                  style={{
                    alignItems: "flex-start",
                    display: "flex",
                    gap: 14,
                    paddingBottom: idx < eventosFiltrados.length - 1 ? 18 : 0,
                    marginBottom: idx < eventosFiltrados.length - 1 ? 18 : 0,
                    borderBottom: idx < eventosFiltrados.length - 1 ? "1px solid var(--border)" : "none",
                    position: "relative",
                  }}
                >
                  {/* Timeline line */}
                  {idx < eventosFiltrados.length - 1 && (
                    <div style={{
                      background: "var(--border)",
                      height: "calc(100% - 36px)",
                      left: 18,
                      position: "absolute",
                      top: 40,
                      width: 2,
                    }} />
                  )}
                  {/* Icon circle */}
                  <div style={{
                    alignItems: "center",
                    background: `${evt.iconColor}18`,
                    border: `2px solid ${evt.iconColor}`,
                    borderRadius: "50%",
                    display: "flex",
                    flexShrink: 0,
                    height: 36,
                    justifyContent: "center",
                    width: 36,
                    zIndex: 1,
                  }}>
                    <div style={{
                      background: evt.iconColor,
                      borderRadius: "50%",
                      height: 10,
                      width: 10,
                    }} />
                  </div>
                  {/* Content */}
                  <div style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4, flexWrap: "wrap" }}>
                        <strong style={{ fontSize: 14 }}>{evt.titulo}</strong>
                        <span style={{
                          background: tipoStyle.bg,
                          borderRadius: 12,
                          color: tipoStyle.color,
                          fontSize: 10,
                          fontWeight: 700,
                          letterSpacing: "0.5px",
                          padding: "2px 8px",
                          textTransform: "uppercase",
                        }}>
                          {evt.tipo}
                        </span>
                      </div>
                      <p style={{ color: "var(--muted)", fontSize: 13, margin: "2px 0 0", lineHeight: 1.45 }}>
                        {evt.descricao}
                      </p>
                    </div>
                    <span style={{ color: "var(--muted)", fontSize: 12, flexShrink: 0, marginTop: 2 }}>
                      {evt.data}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
