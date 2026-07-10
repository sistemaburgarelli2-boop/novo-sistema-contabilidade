"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AppShell } from "@/components/layout/AppShell";

type Stat = { label: string; value: string; sub?: string; cor?: string };

export function SetorShell({
  empresaId,
  empresaNome,
  setorNome,
  setorResumo,
  cor,
  fundo,
  borda,
  icone,
  stats,
  children,
}: {
  empresaId: string;
  empresaNome: string;
  setorNome: string;
  setorResumo: string;
  cor: string;
  fundo: string;
  borda: string;
  icone: ReactNode;
  stats: Stat[];
  children: ReactNode;
}) {
  return (
    <AppShell>
      <div className="page-stack">
        {/* Breadcrumb */}
        <nav style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.8rem", color: "#6f8f7c", marginBottom: -8 }}>
          <Link href="/empresas" style={{ color: "#10b981", fontWeight: 600 }}>Empresas</Link>
          <span>›</span>
          <span style={{ color: "#0b6040", fontWeight: 600, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{empresaNome}</span>
          <span>›</span>
          <span style={{ color: "#07170d", fontWeight: 700 }}>{setorNome}</span>
        </nav>

        {/* Hero do setor */}
        <div style={{
          borderRadius: 14, overflow: "hidden",
          background: "linear-gradient(110deg, #06170d 0%, #0b2e18 60%, #0f3d20 100%)",
          boxShadow: "0 4px 24px rgba(6,23,13,0.18)",
          position: "relative",
        }}>
          <div style={{
            position: "absolute", inset: 0,
            background: "radial-gradient(ellipse at 90% 50%, rgba(212,174,74,0.10) 0%, transparent 55%)",
            pointerEvents: "none",
          }} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${cor}, ${borda})` }} />

          <div style={{ padding: "1.75rem 2rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
              <div style={{
                width: 52, height: 52, borderRadius: 14,
                background: fundo, color: cor,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1.5px solid ${borda}`, flexShrink: 0,
              }}>
                {icone}
              </div>
              <div>
                <p style={{ margin: "0 0 0.25rem", fontSize: "0.72rem", fontWeight: 800, color: "#34d399", letterSpacing: "2px", textTransform: "uppercase" }}>Setor</p>
                <h1 style={{ margin: 0, color: "#fff", fontSize: "1.35rem", fontWeight: 800 }}>{setorNome}</h1>
                <p style={{ margin: "0.3rem 0 0", color: "#7fb89a", fontSize: "0.83rem" }}>{setorResumo}</p>
              </div>
            </div>
            <Link href={`/empresas/${empresaId}`} style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#d1fae5", borderRadius: 8, padding: "0.45rem 1rem", fontSize: "0.78rem", fontWeight: 600, textDecoration: "none" }}>
              ← Voltar para empresa
            </Link>
          </div>

          {/* Stats */}
          {stats.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, borderTop: "1px solid rgba(255,255,255,0.07)" }}>
              {stats.map((stat, i) => (
                <div key={stat.label} style={{ padding: "1rem 1.5rem", borderRight: i < stats.length - 1 ? "1px solid rgba(255,255,255,0.07)" : undefined }}>
                  <p style={{ margin: "0 0 0.2rem", fontSize: "0.72rem", color: "#6ee7b7", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>{stat.label}</p>
                  <p style={{ margin: 0, fontSize: "1.4rem", fontWeight: 800, color: stat.cor ?? "#fff" }}>{stat.value}</p>
                  {stat.sub && <p style={{ margin: "0.15rem 0 0", fontSize: "0.72rem", color: "#6b9e82" }}>{stat.sub}</p>}
                </div>
              ))}
            </div>
          )}
        </div>

        {children}
      </div>
    </AppShell>
  );
}
