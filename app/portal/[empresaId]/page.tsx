"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Notificacao = {
  id: string;
  data: string;
  descricao: string;
  lida: boolean;
  tipo: "documento_recebido" | "guia_disponivel" | "obrigacao_vencendo";
  titulo: string;
};

const NOTIFICACOES_MOCK: Notificacao[] = [
  {
    data: "2026-06-18",
    descricao: "Guia DAS — Simples Nacional de Junho/2026 está pronta para pagamento.",
    id: "1",
    lida: false,
    tipo: "guia_disponivel",
    titulo: "Guia DAS disponível",
  },
  {
    data: "2026-06-17",
    descricao: "DARF competência Junho/2026 vence em 20/06. Evite multas.",
    id: "2",
    lida: false,
    tipo: "obrigacao_vencendo",
    titulo: "Obrigação vencendo em 3 dias",
  },
  {
    data: "2026-06-10",
    descricao: "Contrato social atualizado foi recebido e está sendo processado.",
    id: "3",
    lida: true,
    tipo: "documento_recebido",
    titulo: "Documento recebido",
  },
];

const TIPO_CONFIG = {
  documento_recebido: { badge: "badge-neutral", emoji: "\u{1F4C4}", label: "Documento" },
  guia_disponivel: { badge: "badge-success", emoji: "\u{1F4CB}", label: "Guia" },
  obrigacao_vencendo: { badge: "badge-warning", emoji: "⚠️", label: "Obrigação" },
};

type TimelineEvent = {
  id: string;
  titulo: string;
  data: string;
  status: string;
  statusColor: string;
  iconColor: string;
};

const TIMELINE_EVENTS: TimelineEvent[] = [
  { id: "1", titulo: "Guia DAS Jun/2026 emitida", data: "18/06/2026", status: "Emitida", statusColor: "#059669", iconColor: "#10b981" },
  { id: "2", titulo: "Documento recebido: Extrato bancário", data: "17/06/2026", status: "Recebido", statusColor: "#0284c7", iconColor: "#38bdf8" },
  { id: "3", titulo: "Folha de pagamento Mai/2026 concluída", data: "15/06/2026", status: "Concluída", statusColor: "#059669", iconColor: "#10b981" },
  { id: "4", titulo: "Certidão negativa federal emitida", data: "10/06/2026", status: "Emitida", statusColor: "#059669", iconColor: "#8b5cf6" },
  { id: "5", titulo: "Fechamento contábil Mai/2026 concluído", data: "05/06/2026", status: "Concluído", statusColor: "#059669", iconColor: "#f59e0b" },
];

export default function PortalDashboard() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  if (!empresa) {
    return (
      <div style={{ alignItems: "center", display: "flex", fontSize: 14, justifyContent: "center", minHeight: "100vh", color: "var(--muted)" }}>
        Carregando portal...
      </div>
    );
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  const CARDS = [
    { label: "Status empresa", value: "Ativa", badgeBg: "rgba(16,185,129,0.12)", badgeColor: "#065f46", icon: "✅" },
    { label: "Último fechamento", value: "Mai/2026", badgeBg: "rgba(6,182,212,0.1)", badgeColor: "#0e7490", icon: "\u{1F4C5}" },
    { label: "Próximos vencimentos", value: "3", badgeBg: "rgba(245,158,11,0.12)", badgeColor: "#92400e", icon: "⏰" },
    { label: "Últimas entregas", value: "5", badgeBg: "rgba(99,102,241,0.1)", badgeColor: "#4338ca", icon: "\u{1F4E6}", sub: "este mês" },
  ];

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        {/* Welcome section */}
        <div style={{
          background: "linear-gradient(135deg, rgba(16,185,129,0.08), rgba(6,182,212,0.06))",
          border: "1px solid rgba(16,185,129,0.15)",
          borderRadius: 14,
          padding: "28px 32px",
        }}>
          <h2 style={{ fontSize: 22, margin: "0 0 6px", fontWeight: 800 }}>
            Bem-vindo, {nome}
          </h2>
          <p style={{ color: "var(--muted)", fontSize: 14, margin: 0 }}>
            Competência atual: <strong style={{ color: "var(--ink)" }}>Junho/2026</strong>
          </p>
        </div>

        {/* Cards (4) */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {CARDS.map((card) => (
            <div
              key={card.label}
              style={{
                background: "#fff",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "18px 20px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {card.label}
                </span>
                <span style={{ fontSize: 18 }}>{card.icon}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  background: card.badgeBg,
                  borderRadius: 20,
                  color: card.badgeColor,
                  fontSize: card.value.length <= 2 ? 22 : 15,
                  fontWeight: 800,
                  padding: card.value.length <= 2 ? "4px 14px" : "5px 14px",
                }}>
                  {card.value}
                </span>
                {card.sub && (
                  <span style={{ fontSize: 12, color: "var(--muted)" }}>{card.sub}</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Timeline */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Atividade recente</h2>
              <p>Últimos eventos da sua empresa</p>
            </div>
            <Link className="small-action" href={`/portal/${empresaId}/historico`} style={{ textDecoration: "none" }}>
              Ver histórico completo
            </Link>
          </div>
          <div style={{ padding: "0 20px 20px" }}>
            {TIMELINE_EVENTS.map((evt, idx) => (
              <div
                key={evt.id}
                style={{
                  alignItems: "flex-start",
                  display: "flex",
                  gap: 14,
                  paddingBottom: idx < TIMELINE_EVENTS.length - 1 ? 16 : 0,
                  marginBottom: idx < TIMELINE_EVENTS.length - 1 ? 16 : 0,
                  borderBottom: idx < TIMELINE_EVENTS.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
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
                }}>
                  <div style={{
                    background: evt.iconColor,
                    borderRadius: "50%",
                    height: 10,
                    width: 10,
                  }} />
                </div>
                {/* Content */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div>
                    <strong style={{ fontSize: 14, display: "block", marginBottom: 3 }}>{evt.titulo}</strong>
                    <span style={{ fontSize: 12, color: "var(--muted)" }}>{evt.data}</span>
                  </div>
                  <span style={{
                    background: `${evt.statusColor}15`,
                    borderRadius: 20,
                    color: evt.statusColor,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.3px",
                    flexShrink: 0,
                  }}>
                    {evt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Avisos recentes */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Avisos recentes</h2>
              <p>Avisos do seu escritório contábil</p>
            </div>
            <Link className="small-action" href={`/portal/${empresaId}/notificacoes`} style={{ textDecoration: "none" }}>
              Ver todos
            </Link>
          </div>
          <div className="task-list">
            {NOTIFICACOES_MOCK.map((notif) => {
              const cfg = TIPO_CONFIG[notif.tipo];
              return (
                <article
                  className="task-item"
                  key={notif.id}
                  style={{ opacity: notif.lida ? 0.6 : 1 }}
                >
                  <span className={`priority-badge ${cfg.badge}`}>{cfg.emoji} {cfg.label}</span>
                  <strong>{notif.titulo}</strong>
                  <p>{notif.descricao}</p>
                  <small style={{ color: "var(--muted)", fontSize: 11 }}>
                    {new Date(notif.data).toLocaleDateString("pt-BR")}
                    {notif.lida ? " · Lida" : " · Não lida"}
                  </small>
                </article>
              );
            })}
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
