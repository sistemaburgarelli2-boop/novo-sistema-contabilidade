"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type ConvitePublico = {
  email: string;
  empresa: { id: string; nome: string };
  role: { id: string; nome: string };
};

function AceitarConviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [convite, setConvite] = useState<ConvitePublico | null>(null);
  const [nome, setNome] = useState("");
  const [password, setPassword] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setErro("Token ausente.");
      return;
    }

    fetch(`/api/convites/aceitar?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((result) => {
        if (result.error) {
          setErro(result.error);
          return;
        }

        setConvite(result.data);
      })
      .catch(() => setErro("Nao foi possivel carregar o convite."));
  }, [token]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);

    const response = await fetch("/api/convites/aceitar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome, password, token }),
    });
    const result = await response.json();

    if (!response.ok || result.error) {
      setErro(result.error || "Erro ao aceitar convite.");
      return;
    }

    setMensagem("Convite aceito. Voce ja pode entrar no sistema.");
    setTimeout(() => {
      window.location.href = "/auth/login";
    }, 1200);
  }

  return (
    <main
      style={{
        alignItems: "center",
        background: "#f6faf8",
        display: "flex",
        minHeight: "100vh",
        padding: 24,
      }}
    >
      <section
        style={{
          background: "#ffffff",
          border: "1px solid #dfece5",
          borderRadius: 8,
          margin: "0 auto",
          maxWidth: 480,
          padding: 28,
          width: "100%",
        }}
      >
        <h1>Aceitar convite</h1>
        {convite ? (
          <p>
            Voce foi convidado para acessar <strong>{convite.empresa.nome}</strong> como{" "}
            <strong>{convite.role.nome}</strong>.
          </p>
        ) : null}

        {erro ? <p style={{ color: "#b91c1c" }}>{erro}</p> : null}
        {mensagem ? <p style={{ color: "#047857" }}>{mensagem}</p> : null}

        {convite ? (
          <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
            <input disabled value={convite.email} />
            <input
              onChange={(event) => setNome(event.target.value)}
              placeholder="Seu nome"
              required
              value={nome}
            />
            <input
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Crie uma senha"
              required
              type="password"
              value={password}
            />
            <button type="submit">Aceitar convite</button>
          </form>
        ) : null}
      </section>
    </main>
  );
}

export default function AceitarConvitePage() {
  return (
    <Suspense
      fallback={
        <main
          style={{
            alignItems: "center",
            background: "#f6faf8",
            display: "flex",
            minHeight: "100vh",
            padding: 24,
          }}
        >
          <section
            style={{
              background: "#ffffff",
              border: "1px solid #dfece5",
              borderRadius: 8,
              margin: "0 auto",
              maxWidth: 480,
              padding: 28,
              width: "100%",
            }}
          >
            <h1>Carregando convite...</h1>
          </section>
        </main>
      }
    >
      <AceitarConviteContent />
    </Suspense>
  );
}
