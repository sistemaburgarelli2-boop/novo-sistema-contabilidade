"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";

const navigation = [
  { href: "/dashboard", icon: "dashboard", label: "Dashboard", section: "Visão geral" },
  { href: "/empresas", icon: "building", label: "Empresas", section: "Operacional" },
  { href: "/contratos", icon: "contract", label: "Contratos", section: "Operacional" },
  { href: "/consultoria", icon: "consultoria", label: "Consultoria", section: "Operacional" },
{ href: "/servicos", icon: "servicos", label: "Serviços Avulsos", section: "Ferramentas" },
  { href: "/escola", icon: "escola", label: "Escola Contábil", section: "Ferramentas" },
  { href: "/admin", icon: "admin", label: "Administração", section: "Sistema" },
];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/empresas": "Empresas",
  "/contratos": "Contratos",
  "/consultoria": "Consultoria",
"/servicos": "Serviços Avulsos",
  "/escola": "Escola Contábil",
  "/admin": "Administração",
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

  if (name === "tasks") {
    return (
      <svg {...common}>
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" stroke="currentColor" strokeWidth="2" />
        <rect height="4" rx="1" stroke="currentColor" strokeWidth="2" width="8" x="8" y="2" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
        <path d="M9 18h6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "contract") {
    return (
      <svg {...common}>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M14 2v6h6" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M16 13H8M16 17H8M10 9H8" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
      </svg>
    );
  }

  if (name === "consultoria") {
    return (
      <svg {...common}>
        <path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 0 0-7-7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M10 21h4" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
        <path d="M12 2v1M4.22 4.22l.7.7M2 12h1M4.22 19.78l.7-.7M20 12h1M19.78 4.22l-.7.7" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      </svg>
    );
  }

  if (name === "escola") {
    return (
      <svg {...common}>
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "servicos") {
    return (
      <svg {...common}>
        <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }

  if (name === "admin") {
    return (
      <svg {...common}>
        <path d="M12 2l-8 4.5v5c0 4.56 3.41 8.83 8 9.85 4.59-1.02 8-5.29 8-9.85v-5L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
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
  const pageTitle = pageTitles[pathname] ?? "Fatturati Burgarelli";
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
              Fatturati <span>Burgarelli</span>
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
              Olá, Administrador · Fatturati Burgarelli
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
