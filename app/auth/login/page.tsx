"use client";

import { useState } from "react";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, username }),
      });
      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || "Nao foi possivel entrar.");
        return;
      }

      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      style={{
        alignItems: "center",
        background: "#f8fafc",
        display: "flex",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          boxShadow: "0 20px 45px rgba(15, 23, 42, 0.08)",
          margin: "0 auto",
          maxWidth: 420,
          padding: 32,
          width: "100%",
        }}
      >
        <div style={{ display: "grid", gap: 6, marginBottom: 24 }}>
          <span style={{ color: "#64748b", fontSize: 14 }}>ERP Contabil</span>
          <h1 style={{ fontSize: 28, margin: 0 }}>Acesso administrativo</h1>
          <p style={{ color: "#475569", margin: 0 }}>
            Entre com suas credenciais para acessar o sistema.
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#334155", fontSize: 14 }}>Usuario</span>
            <input
              autoComplete="username"
              onChange={(event) => setUsername(event.target.value)}
              placeholder="admin"
              required
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 16,
                padding: "12px 14px",
              }}
              value={username}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ color: "#334155", fontSize: 14 }}>Senha</span>
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              required
              style={{
                border: "1px solid #cbd5e1",
                borderRadius: 8,
                fontSize: 16,
                padding: "12px 14px",
              }}
              type="password"
              value={password}
            />
          </label>

          {error ? <p style={{ color: "#b91c1c", margin: 0 }}>{error}</p> : null}

          <button
            disabled={loading}
            style={{
              background: "#0f172a",
              border: 0,
              borderRadius: 8,
              color: "#ffffff",
              cursor: loading ? "not-allowed" : "pointer",
              fontSize: 16,
              fontWeight: 700,
              marginTop: 6,
              padding: "12px 16px",
            }}
            type="submit"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}
