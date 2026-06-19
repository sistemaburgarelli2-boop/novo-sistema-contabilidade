"use client";

import Link from "next/link";

export default function AcessoNegado() {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "100vh", background: "#fafcfb", padding: "2rem", textAlign: "center",
    }}>
      <div style={{
        width: 80, height: 80, borderRadius: 20, background: "#fef2f2",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: "2.5rem", marginBottom: "1.5rem",
      }}>
        🔒
      </div>

      <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem", fontWeight: 900, color: "#b91c1c" }}>
        Acesso Negado
      </h1>

      <p style={{ margin: "0 0 0.25rem", fontSize: "1rem", color: "#374151", maxWidth: 400 }}>
        Você não tem permissão para acessar esta página.
      </p>

      <p style={{ margin: "0 0 2rem", fontSize: "0.85rem", color: "#9ca3af", maxWidth: 400 }}>
        Erro 403 — Se você acredita que isso é um erro, entre em contato com o administrador do sistema.
      </p>

      <div style={{ display: "flex", gap: "0.75rem" }}>
        <Link
          href="/dashboard"
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
            border: "none", borderRadius: 10, padding: "0.75rem 1.5rem",
            fontWeight: 700, fontSize: "0.875rem", textDecoration: "none",
          }}
        >
          Ir para o Dashboard
        </Link>
        <Link
          href="/auth/login"
          style={{
            background: "#fff", color: "#374151",
            border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.75rem 1.5rem",
            fontWeight: 600, fontSize: "0.875rem", textDecoration: "none",
          }}
        >
          Fazer login
        </Link>
      </div>
    </div>
  );
}
