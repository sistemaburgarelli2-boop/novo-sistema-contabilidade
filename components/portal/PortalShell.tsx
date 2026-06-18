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
  { emoji: "🏠", href: "", label: "Dashboard" },
  { emoji: "📤", href: "/documentos", label: "Enviar documentos" },
  { emoji: "📋", href: "/impostos", label: "Impostos e guias" },
  { emoji: "🔄", href: "/solicitacoes", label: "Solicitações" },
  { emoji: "🎧", href: "/chamados", label: "Abrir chamado" },
  { emoji: "💰", href: "/financeiro", label: "Financeiro" },
  { emoji: "🔔", href: "/notificacoes", label: "Notificações" },
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
          <Link className="portal-back-link" href="/empresas">
            ← Voltar ao sistema
          </Link>
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
