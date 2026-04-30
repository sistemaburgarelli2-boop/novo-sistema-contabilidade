import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/empresas", label: "Empresas" },
  { href: "/finance", label: "Financeiro" },
  { href: "/taxes", label: "Impostos" },
  { href: "/billing", label: "Planos" },
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          borderRight: "1px solid #e5e7eb",
          padding: 24,
          width: 240,
        }}
      >
        <strong>ERP Contabil</strong>
        <nav style={{ display: "grid", gap: 12, marginTop: 24 }}>
          {navigation.map((item) => (
            <Link href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ marginTop: 24 }}>
          <LogoutButton />
        </div>
      </aside>
      <main style={{ flex: 1, padding: 32 }}>{children}</main>
    </div>
  );
}
