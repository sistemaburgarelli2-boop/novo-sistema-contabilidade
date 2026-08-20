"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { PortalIcon } from "@/components/portal/PortalIcon";

type PortalShellProps = {
  children: ReactNode;
  empresaId: string;
  empresaNome: string;
};

const NAV_ITEMS = [
  { href: "", icon: "dashboard", label: "Visão Geral", section: "Visão geral" },
  { href: "/documentos", icon: "documentos", label: "Documentos", section: "Documentos" },
  { href: "/guias", icon: "guias", label: "Guias", section: "Documentos" },
  { href: "/contratos", icon: "contratos", label: "Contratos", section: "Documentos" },
  { href: "/certificados", icon: "certificados", label: "Certificados", section: "Documentos" },
  { href: "/solicitacoes", icon: "solicitacoes", label: "Solicitações", section: "Atendimento" },
  { href: "/chamados", icon: "chamados", label: "Chamados", section: "Atendimento" },
  { href: "/financeiro", icon: "financeiro", label: "Financeiro", section: "Acompanhamento" },
  { href: "/historico", icon: "historico", label: "Histórico", section: "Acompanhamento" },
  { href: "/notificacoes", icon: "notificacoes", label: "Notificações", section: "Acompanhamento" },
];

const PAGE_TITLES: Record<string, string> = {
  "": "Visão Geral",
  "/certificados": "Certificados Digitais",
  "/chamados": "Chamados",
  "/contratos": "Contratos",
  "/documentos": "Documentos",
  "/financeiro": "Financeiro",
  "/guias": "Guias",
  "/historico": "Histórico",
  "/impostos": "Impostos e Guias",
  "/notificacoes": "Notificações",
  "/solicitacoes": "Solicitações",
};

function BrandIcon() {
  return (
    <svg aria-hidden="true" fill="none" height="24" viewBox="0 0 24 24" width="24">
      <path d="M4 10h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M6 10v7M10 10v7M14 10v7M18 10v7" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M3 19h18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      <path d="M12 4 4.5 8h15L12 4Z" fill="currentColor" />
    </svg>
  );
}

function groupedNavigation() {
  return NAV_ITEMS.reduce<Record<string, typeof NAV_ITEMS>>((accumulator, item) => {
    accumulator[item.section] = accumulator[item.section] ?? [];
    accumulator[item.section].push(item);
    return accumulator;
  }, {});
}

export function PortalShell({ children, empresaId, empresaNome }: PortalShellProps) {
  const pathname = usePathname();
  const base = `/portal/${empresaId}`;
  const navGroups = groupedNavigation();

  const subRota = pathname.startsWith(base) ? pathname.slice(base.length) : "";
  const pageTitle = PAGE_TITLES[subRota] ?? "Portal do Cliente";

  const initials = empresaNome
    .split(" ")
    .map((word) => word[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="app-brand" href={base}>
          <div className="app-brand-mark">
            <BrandIcon />
          </div>
          <div>
            <strong>
              Fatturati <span>Burgarelli</span>
            </strong>
            <small>Portal do cliente</small>
          </div>
        </Link>

        <div className="user-card user-card-portal">
          <div className="user-avatar user-avatar-portal">{initials}</div>
          <div>
            <strong>{empresaNome}</strong>
            <span className="user-badge user-badge-portal">Cliente</span>
          </div>
        </div>

        {Object.entries(navGroups).map(([section, items]) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            <nav className="app-nav">
              {items.map((item) => {
                const href = `${base}${item.href}`;
                const isActive = pathname === href;
                return (
                  <Link
                    className={isActive ? "nav-link nav-link-primary" : "nav-link"}
                    href={href}
                    key={item.href}
                  >
                    <span className="nav-dot">
                      <PortalIcon name={item.icon} />
                    </span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}

        <div className="sidebar-footer">
          <button
            className="logout-button"
            onClick={() => { window.location.href = "/auth/login"; }}
            type="button"
          >
            Sair do portal
          </button>
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <h1>{pageTitle}</h1>
            <div className="page-kicker">
              <span className="status-dot" />
              Portal do Cliente · {empresaNome}
            </div>
          </div>
          <div className="topbar-actions">
            <span className="icon-pill">?</span>
            <span className="icon-pill">!</span>
          </div>
        </header>

        <div className="content-wrap">{children}</div>
      </main>
    </div>
  );
}
