"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type PortalShellProps = {
  children: ReactNode;
  empresaId: string;
  empresaNome: string;
};

const NAV_ITEMS = [
  { emoji: "\u{1F3E0}", href: "", label: "Visão Geral" },
  { emoji: "\u{1F4C4}", href: "/documentos", label: "Documentos" },
  { emoji: "\u{1F4CB}", href: "/guias", label: "Guias" },
  { emoji: "\u{1F504}", href: "/solicitacoes", label: "Solicitações" },
  { emoji: "\u{1F4D1}", href: "/contratos", label: "Contratos" },
  { emoji: "\u{1F4B0}", href: "/financeiro", label: "Financeiro" },
  { emoji: "\u{1F4DC}", href: "/historico", label: "Histórico" },
  { emoji: "\u{1F514}", href: "/notificacoes", label: "Notificações" },
];

export function PortalShell({ children, empresaId, empresaNome }: PortalShellProps) {
  const pathname = usePathname();
  const base = `/portal/${empresaId}`;

  const initials = empresaNome
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="portal-shell">
      <aside className="portal-sidebar">
        <div className="portal-brand">
          <div className="portal-brand-logo">{initials}</div>
          <div className="portal-brand-info">
            <strong>{empresaNome}</strong>
            <span>Portal do Cliente</span>
          </div>
        </div>

        <nav className="portal-nav">
          <div className="portal-nav-section">Menu</div>
          {NAV_ITEMS.map((item) => {
            const href = `${base}${item.href}`;
            const isActive = pathname === href;
            return (
              <Link
                className={`portal-nav-link${isActive ? " active" : ""}`}
                href={href}
                key={item.href}
              >
                <span style={{ fontSize: 16, lineHeight: 1 }}>{item.emoji}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="portal-sidebar-footer">
          <button
            onClick={() => { window.location.href = "/login"; }}
            style={{
              alignItems: "center",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: 8,
              color: "var(--muted)",
              cursor: "pointer",
              display: "flex",
              fontSize: 13,
              fontWeight: 600,
              gap: 8,
              justifyContent: "center",
              padding: "10px 16px",
              transition: "background 0.15s, color 0.15s",
              width: "100%",
            }}
            type="button"
          >
            Sair do portal
          </button>
        </div>
      </aside>

      <div className="portal-main">
        <header className="portal-topbar">
          <h1>Portal do Cliente</h1>
          <span className="portal-topbar-company">{empresaNome}</span>
        </header>
        <div className="portal-content">{children}</div>
      </div>
    </div>
  );
}
