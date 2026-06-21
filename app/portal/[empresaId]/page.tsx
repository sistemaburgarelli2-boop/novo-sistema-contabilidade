"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

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
    { label: "Status empresa", value: "—", icon: "✅" },
    { label: "Último fechamento", value: "—", icon: "📅" },
    { label: "Próximos vencimentos", value: "0", icon: "⏰" },
    { label: "Últimas entregas", value: "0", icon: "📦" },
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
            Acompanhe suas operações contábeis por aqui.
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
              <span style={{
                background: "rgba(156,163,175,0.1)",
                borderRadius: 20,
                color: "#6b7280",
                fontSize: card.value.length <= 2 ? 22 : 15,
                fontWeight: 800,
                padding: card.value.length <= 2 ? "4px 14px" : "5px 14px",
              }}>
                {card.value}
              </span>
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
          <div style={{ textAlign: "center", padding: "3rem 20px" }}>
            <p style={{ fontSize: "2rem", marginBottom: 8 }}>📋</p>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 4px" }}>Sem atividades registradas</p>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>As atividades aparecerão aqui conforme forem realizadas.</p>
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
          <div style={{ textAlign: "center", padding: "3rem 20px" }}>
            <p style={{ fontSize: "2rem", marginBottom: 8 }}>🔔</p>
            <p style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)", margin: "0 0 4px" }}>Nenhum aviso</p>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Você será notificado quando houver novidades.</p>
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
