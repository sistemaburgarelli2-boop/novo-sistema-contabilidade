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
  documento_recebido: { badge: "badge-neutral", emoji: "📄", label: "Documento" },
  guia_disponivel: { badge: "badge-success", emoji: "📋", label: "Guia" },
  obrigacao_vencendo: { badge: "badge-warning", emoji: "⚠️", label: "Obrigação" },
};

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
  const pendencias = NOTIFICACOES_MOCK.filter((n) => !n.lida).length;
  const guias = NOTIFICACOES_MOCK.filter((n) => n.tipo === "guia_disponivel").length;
  const mensagens = 0;

  const ACOES = [
    { emoji: "📤", href: `/portal/${empresaId}/documentos`, label: "Enviar documentos" },
    { emoji: "📋", href: `/portal/${empresaId}/impostos`, label: "Ver impostos" },
    { emoji: "🎧", href: `/portal/${empresaId}/chamados`, label: "Abrir chamado" },
    { emoji: "💰", href: `/portal/${empresaId}/financeiro`, label: "Financeiro" },
  ];

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        {/* Boas-vindas */}
        <div className="portal-welcome">
          <h2>Bem-vindo ao seu portal!</h2>
          <p>Acompanhe obrigações, guias e documentos em um só lugar.</p>
        </div>

        {/* KPIs */}
        <div className="kpi-strip" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <article className={`metric-card${pendencias > 0 ? " kpi-warning" : ""}`}>
            <span>Pendências</span>
            <strong className="kpi-num">{pendencias}</strong>
            <p>{pendencias === 0 ? "Nada pendente" : "Itens aguardando sua ação"}</p>
          </article>
          <article className="metric-card">
            <span>Guias disponíveis</span>
            <strong className="kpi-num">{guias}</strong>
            <p>Prontas para pagamento</p>
          </article>
          <article className="metric-card">
            <span>Mensagens</span>
            <strong className="kpi-num">{mensagens}</strong>
            <p>{mensagens === 0 ? "Nenhuma mensagem nova" : "Não lidas"}</p>
          </article>
        </div>

        {/* Ações rápidas */}
        <div>
          <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 700 }}>Ações rápidas</h3>
          <div className="portal-actions-grid">
            {ACOES.map((a) => (
              <Link className="portal-action-card" href={a.href} key={a.href}>
                <span>{a.emoji}</span>
                <strong>{a.label}</strong>
              </Link>
            ))}
          </div>
        </div>

        {/* Notificações */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Notificações recentes</h2>
              <p>Avisos do seu escritório contábil</p>
            </div>
            <Link className="small-action" href={`/portal/${empresaId}/notificacoes`} style={{ textDecoration: "none" }}>
              Ver todas
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
