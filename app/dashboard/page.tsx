"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { listarEmpresasTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

export default function Dashboard() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const lista = await listarEmpresasTenant();
        if (!cancelled) setEmpresas(lista);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Erro ao carregar dados");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const ativas = empresas.filter((e) => e.status === "ativa").length;
  const pendentes = empresas.filter((e) => e.status !== "ativa").length;
  const total = empresas.length;
  const ultimaAtualizacao = empresas.length > 0
    ? empresas
        .map((e) => e.updated_at)
        .sort()
        .reverse()[0]
    : null;

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function formatCnpj(cnpj: string | null) {
    if (!cnpj) return "—";
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) return cnpj;
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }

  const statusLabel: Record<string, { text: string; bg: string; color: string }> = {
    ativa: { text: "Ativa", bg: "#d1fae5", color: "#065f46" },
    suspensa: { text: "Suspensa", bg: "#fef3c7", color: "#92400e" },
    cancelada: { text: "Cancelada", bg: "#fef2f2", color: "#b91c1c" },
    encerrada: { text: "Encerrada", bg: "#f3f4f6", color: "#6b7280" },
  };

  const kpis = [
    { label: "Empresas ativas", value: String(ativas), color: "#065f46", bg: "#ecfdf5" },
    { label: "Total de empresas", value: String(total), color: "#0e7490", bg: "#ecfeff" },
    { label: "Pendentes", value: String(pendentes), color: "#92400e", bg: "#fffbeb" },
    {
      label: "Ultima atualizacao",
      value: ultimaAtualizacao ? formatDate(ultimaAtualizacao) : "—",
      color: "#6b7280",
      bg: "#f9fafb",
    },
  ];

  const recentes = [...empresas]
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
    .slice(0, 5);

  /* ── Loading ──────────────────────────────────────────────── */

  if (loading) {
    return (
      <AppShell>
        <div className="page-stack">
          <div className="module-hero">
            <div>
              <h1>Central Operacional</h1>
              <p>Painel de controle do escritorio contabil</p>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#6b7280" }}>
            <p style={{ fontSize: "16px" }}>Carregando...</p>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Error ────────────────────────────────────────────────── */

  if (error) {
    return (
      <AppShell>
        <div className="page-stack">
          <div className="module-hero">
            <div>
              <h1>Central Operacional</h1>
              <p>Painel de controle do escritorio contabil</p>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "80px 20px", color: "#b91c1c" }}>
            <p style={{ fontSize: "16px" }}>Erro ao carregar dados: {error}</p>
            <button
              onClick={() => window.location.reload()}
              type="button"
              style={{ marginTop: "16px", padding: "8px 24px", borderRadius: "8px", border: "1px solid #d1d5db", cursor: "pointer" }}
            >
              Tentar novamente
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Empty state (no companies) ───────────────────────────── */

  if (empresas.length === 0) {
    return (
      <AppShell>
        <div className="page-stack">
          <div className="module-hero">
            <div>
              <h1>Central Operacional</h1>
              <p>Painel de controle do escritorio contabil</p>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "80px 20px" }}>
            <h2 style={{ fontSize: "24px", color: "#065f46", marginBottom: "8px" }}>
              Bem-vindo ao Fatturati Burgarelli
            </h2>
            <p style={{ fontSize: "15px", color: "#6b7280", marginBottom: "24px" }}>
              Cadastre sua primeira empresa para comecar
            </p>
            <a
              href="/empresas/novo"
              style={{
                display: "inline-block",
                padding: "10px 28px",
                borderRadius: "8px",
                background: "#065f46",
                color: "#fff",
                fontWeight: 600,
                fontSize: "14px",
                textDecoration: "none",
              }}
            >
              Cadastrar empresa
            </a>
          </div>
        </div>
      </AppShell>
    );
  }

  /* ── Main dashboard ───────────────────────────────────────── */

  return (
    <AppShell>
      <div className="page-stack">
        {/* Header */}
        <div className="module-hero">
          <div>
            <h1>Central Operacional</h1>
            <p>Painel de controle do escritorio contabil</p>
          </div>
          <div className="hero-actions">
            <button onClick={() => window.location.reload()} type="button">
              Atualizar dados
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {kpis.map((kpi) => (
            <article
              className="metric-card"
              key={kpi.label}
              style={{ borderLeft: `4px solid ${kpi.color}`, background: kpi.bg }}
            >
              <span style={{ color: kpi.color, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                {kpi.label}
              </span>
              <strong className="kpi-num" style={{ color: kpi.color }}>{kpi.value}</strong>
            </article>
          ))}
        </div>

        {/* Empresas recentes */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Empresas recentes</h2>
              <p>Ultimas {recentes.length} empresas atualizadas</p>
            </div>
          </div>
          <div style={{ padding: "4px 0" }}>
            {recentes.map((emp, i) => {
              const st = statusLabel[emp.status] ?? statusLabel.ativa;
              return (
                <div
                  key={emp.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 20px",
                    borderBottom: i < recentes.length - 1 ? "1px solid #f3f4f6" : "none",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ fontSize: "14px", color: "#111827", display: "block" }}>
                      {emp.nome_legal}
                    </strong>
                    <span style={{ fontSize: "12px", color: "#6b7280" }}>
                      CNPJ: {formatCnpj(emp.cnpj)}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <span style={{ fontSize: "11px", color: "#9ca3af" }}>
                      {formatDate(emp.updated_at)}
                    </span>
                    <span
                      style={{
                        padding: "3px 10px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: 700,
                        background: st.bg,
                        color: st.color,
                      }}
                    >
                      {st.text}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Atividade recente */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Atividade recente</h2>
              <p>Historico de acoes no sistema</p>
            </div>
          </div>
          <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
            <p style={{ fontSize: "14px" }}>Sem atividades registradas</p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
