"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";

type TipoEvento = "documento" | "guia" | "solicitacao" | "operacional";

type Evento = {
  id: string;
  data: string;
  titulo: string;
  descricao: string;
  tipo: TipoEvento;
};

const TIPO_CONFIG: Record<TipoEvento, { bg: string; color: string; label: string; icone: string }> = {
  documento:   { bg: "#ecfeff", color: "#0e7490", label: "Documento",    icone: "📄" },
  guia:        { bg: "#f0fdf4", color: "#065f46", label: "Guia",         icone: "📋" },
  solicitacao: { bg: "#f5f3ff", color: "#7c3aed", label: "Solicitação",  icone: "🔄" },
  operacional: { bg: "#fffbeb", color: "#92400e", label: "Operacional",  icone: "⚙️" },
};

const EVENTOS: Evento[] = [
  { id: "1",  data: "2026-06-19T10:00:00", titulo: "Guia DAS Jun/2026 emitida",                descricao: "Guia do Simples Nacional disponível para pagamento — vence 20/07/2026",   tipo: "guia" },
  { id: "2",  data: "2026-06-18T16:30:00", titulo: "Documento recebido: Extrato bancário",     descricao: "Extrato bancário Jun/2026 recebido e encaminhado para o setor Fiscal",      tipo: "documento" },
  { id: "3",  data: "2026-06-18T14:00:00", titulo: "Guia INSS Jun/2026 emitida",               descricao: "GPS competência Junho disponível — valor R$ 2.800,00",                      tipo: "guia" },
  { id: "4",  data: "2026-06-17T11:00:00", titulo: "Solicitação #3 aberta",                    descricao: "Certidão negativa federal solicitada pelo cliente",                          tipo: "solicitacao" },
  { id: "5",  data: "2026-06-16T09:00:00", titulo: "Solicitação #2 atualizada",                descricao: "Alteração de sócio — documentos em análise pela equipe societária",          tipo: "solicitacao" },
  { id: "6",  data: "2026-06-15T15:00:00", titulo: "Folha de pagamento Mai/2026 concluída",    descricao: "Processamento da folha finalizado — holerites disponíveis",                  tipo: "operacional" },
  { id: "7",  data: "2026-06-14T10:00:00", titulo: "Documento processado: Notas fiscais",      descricao: "XMLs de NFe Mai/2026 processados e classificados no sistema fiscal",         tipo: "documento" },
  { id: "8",  data: "2026-06-12T08:30:00", titulo: "Guia FGTS Mai/2026 paga",                  descricao: "Confirmação de pagamento da guia FGTS competência Maio",                    tipo: "guia" },
  { id: "9",  data: "2026-06-10T14:00:00", titulo: "Certidão negativa federal emitida",        descricao: "CND federal emitida com validade até 10/12/2026",                            tipo: "operacional" },
  { id: "10", data: "2026-06-08T11:00:00", titulo: "Solicitação #1 concluída",                 descricao: "Declaração IR 2025 entregue e recibo disponível para download",              tipo: "solicitacao" },
  { id: "11", data: "2026-06-05T16:00:00", titulo: "Fechamento contábil Mai/2026 concluído",   descricao: "Balancete e DRE de Maio processados e disponíveis",                          tipo: "operacional" },
  { id: "12", data: "2026-06-03T09:00:00", titulo: "Documento enviado: Contrato social",       descricao: "Contrato social atualizado enviado pelo cliente via portal",                  tipo: "documento" },
  { id: "13", data: "2026-06-01T08:00:00", titulo: "Guia DAS Mai/2026 paga",                   descricao: "Confirmação de pagamento — DAS Simples Nacional Mai/2026",                   tipo: "guia" },
  { id: "14", data: "2026-05-28T14:00:00", titulo: "eSocial Mai/2026 transmitido",             descricao: "Eventos periódicos de Maio transmitidos com sucesso",                        tipo: "operacional" },
  { id: "15", data: "2026-05-25T10:00:00", titulo: "Documento recebido: Comprovantes INSS",    descricao: "Comprovantes de recolhimento INSS recebidos e arquivados",                   tipo: "documento" },
];

export default function HistoricoPortal() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [filtro, setFiltro] = useState<TipoEvento | "">("");

  const eventosFiltrados = filtro ? EVENTOS.filter((e) => e.tipo === filtro) : EVENTOS;

  return (
    <PortalShell empresaId={empresaId} empresaNome="Empresa">
      <div className="page-stack">
        <div style={{ marginBottom: "0.5rem" }}>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.1rem", fontWeight: 800, color: "#07170d" }}>Histórico</h2>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#9ca3af" }}>Todos os eventos e atividades da sua empresa</p>
        </div>

        {/* Filtros */}
        <div style={{ display: "flex", gap: 8, marginBottom: "1rem", flexWrap: "wrap" }}>
          {[
            { value: "" as TipoEvento | "", label: "Todos" },
            { value: "documento" as TipoEvento, label: "📄 Documentos" },
            { value: "guia" as TipoEvento, label: "📋 Guias" },
            { value: "solicitacao" as TipoEvento, label: "🔄 Solicitações" },
            { value: "operacional" as TipoEvento, label: "⚙️ Operacional" },
          ].map((f) => (
            <button
              key={f.value}
              onClick={() => setFiltro(f.value)}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                border: filtro === f.value ? "2px solid #10b981" : "1px solid #e5e7eb",
                background: filtro === f.value ? "#ecfdf5" : "#fff",
                color: filtro === f.value ? "#065f46" : "#6b7280",
              }}
              type="button"
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Linha do tempo</h2>
              <p>{eventosFiltrados.length} evento(s)</p>
            </div>
          </div>
          <div style={{ padding: "0.5rem 0" }}>
            {eventosFiltrados.map((ev, i) => {
              const cfg = TIPO_CONFIG[ev.tipo];
              return (
                <div key={ev.id} style={{ display: "flex", gap: 14, padding: "0.875rem 1.25rem", borderBottom: i < eventosFiltrados.length - 1 ? "1px solid #f3f4f6" : "none", alignItems: "flex-start" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, paddingTop: 2 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem" }}>
                      {cfg.icone}
                    </div>
                    {i < eventosFiltrados.length - 1 && (
                      <div style={{ width: 2, height: 24, background: "#e5e7eb", borderRadius: 1 }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 700, color: "#111827" }}>{ev.titulo}</p>
                      <span style={{ fontSize: "0.65rem", fontWeight: 700, background: cfg.bg, color: cfg.color, borderRadius: 999, padding: "2px 8px", whiteSpace: "nowrap" }}>
                        {cfg.label}
                      </span>
                    </div>
                    <p style={{ margin: "0 0 4px", fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.4 }}>{ev.descricao}</p>
                    <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>
                      {new Date(ev.data).toLocaleDateString("pt-BR")} às {new Date(ev.data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
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
