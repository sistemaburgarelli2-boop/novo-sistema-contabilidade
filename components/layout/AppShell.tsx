import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";

const navigation = [
  { href: "/dashboard", icon: "▦", label: "Dashboard", section: "Visao geral" },
  { href: "/empresas", icon: "▤", label: "Empresas", section: "Departamentos" },
  { href: "/finance", icon: "↗", label: "Financeiro", section: "Departamentos" },
  { href: "/taxes", icon: "▧", label: "Impostos", section: "Departamentos" },
  { href: "/billing", icon: "▣", label: "Planos", section: "Sistema" },
  { href: "/rbac", icon: "⚙", label: "Permissoes", section: "Sistema" },
  { href: "/auditoria", icon: "◷", label: "Auditoria", section: "Sistema" },
];

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
  return navigation.reduce<Record<string, typeof navigation>>((accumulator, item) => {
    accumulator[item.section] = accumulator[item.section] ?? [];
    accumulator[item.section].push(item);
    return accumulator;
  }, {});
}

export function AppShell({ children }: { children: ReactNode }) {
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
              Burgarelli <span>Contabil</span>
            </strong>
            <small>Gestao contabil</small>
          </div>
        </Link>

        <div className="user-card">
          <div className="user-avatar">AD</div>
          <div>
            <strong>Administrador</strong>
            <span className="user-badge">Proprietario</span>
          </div>
        </div>

        {Object.entries(navGroups).map(([section, items]) => (
          <div className="nav-section" key={section}>
            <div className="nav-label">{section}</div>
            <nav className="app-nav">
              {items.map((item, index) => (
                <Link
                  className={index === 0 && section === "Visao geral" ? "nav-link nav-link-primary" : "nav-link"}
                  href={item.href}
                  key={item.href}
                >
                  <span className="nav-dot">{item.icon}</span>
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
            <h1>Burgarelli Contabil</h1>
            <div className="page-kicker">
              <span className="status-dot" />
              Ola, Administrador · Sistema de gestao contabil
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
