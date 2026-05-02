"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";

const navigation = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", section: "Visão geral" },
  { href: "/empresas", icon: "building", label: "Empresas", section: "Departamentos" },
  { href: "/finance", icon: "chart", label: "Financeiro", section: "Departamentos" },
  { href: "/taxes", icon: "tax", label: "Impostos", section: "Departamentos" },
  { href: "/billing", icon: "card", label: "Planos", section: "Sistema" },
  { href: "/rbac", icon: "settings", label: "Permissões", section: "Sistema" },
  { href: "/auditoria", icon: "audit", label: "Auditoria", section: "Sistema" },
];

const pageTitles: Record<string, string> = {
  "/auditoria": "Auditoria",
  "/billing": "Planos e billing",
  "/dashboard": "Dashboard",
  "/empresas": "Empresas",
  "/finance": "Financeiro",
  "/rbac": "Permissões",
  "/taxes": "Impostos",
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

function NavIcon({ name }: { name: string }) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    height: 18,
    viewBox: "0 0 24 24",
    width: 18,
    xmlns: "http://www.w3.org/2000/svg",
  };

  if (name === "building") {
    return (
      <svg {...common}>
        <path d="M4 21V5a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v16" stroke="currentColor" strokeWidth="2" />
        <path d="M9 8h3M9 12h3M9 16h3M3 21h18" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 19V5M4 19h16" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="m7 15 4-4 3 3 5-7" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "tax") {
    return (
      <svg {...common}>
        <rect height="18" rx="2" stroke="currentColor" strokeWidth="2" width="14" x="5" y="3" />
        <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "card") {
    return (
      <svg {...common}>
        <rect height="14" rx="2" stroke="currentColor" strokeWidth="2" width="18" x="3" y="5" />
        <path d="M3 10h18M7 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "settings") {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M12 3v2M12 19v2M4.2 7.5l1.7 1M18.1 15.5l1.7 1M4.2 16.5l1.7-1M18.1 8.5l1.7-1" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "audit") {
    return (
      <svg {...common}>
        <path d="M9 11h6M9 15h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M7 3h7l4 4v14H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
        <path d="M14 3v5h5" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" />
      </svg>
    );
  }

  return (
    <svg {...common}>
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="4" y="4" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="13" y="4" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="4" y="13" />
      <rect height="7" rx="1.5" stroke="currentColor" strokeWidth="2" width="7" x="13" y="13" />
    </svg>
  );
}

function groupedNavigation() {
  return navigation.reduce<Record<string, typeof navigation>>((accumulator, item) => {
    accumulator[item.section] = accumulator[item.section] ?? [];
    accumulator[item.section].push(item);
    return accumulator;
  }, {});
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Burgarelli Contábil";
  const navGroups = groupedNavigation();

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <Link className="app-brand" href="/dashboard">
          <div className="app-brand-mark">
            <BrandIcon />
          </div>
          <div>
            <strong>
              Burgarelli <span>Contábil</span>
            </strong>
            <small>Gestão contábil</small>
          </div>
        </Link>

        <div className="user-card">
          <div className="user-avatar">AD</div>
          <div>
            <strong>Administrador</strong>
            <span className="user-badge">Proprietário</span>
          </div>
        </div>

        {Object.entries(navGroups).map(([section, items]) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            <nav className="app-nav">
              {items.map((item) => (
                <Link
                  className={pathname === item.href ? "nav-link nav-link-primary" : "nav-link"}
                  href={item.href}
                  key={item.href}
                >
                  <span className="nav-dot">
                    <NavIcon name={item.icon} />
                  </span>
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}

        <div className="sidebar-footer">
          <LogoutButton />
        </div>
      </aside>

      <main className="app-main">
        <header className="app-topbar">
          <div>
            <h1>{pageTitle}</h1>
            <div className="page-kicker">
              <span className="status-dot" />
              Olá, Administrador · Sistema de gestão contábil
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
