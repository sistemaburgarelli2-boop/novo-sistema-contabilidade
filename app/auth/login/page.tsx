"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) alert(error.message);
    else window.location.href = "/dashboard";
  };

  return (
    <div style={{ margin: "64px auto", maxWidth: 360 }}>
      <h1>Login</h1>
      <div style={{ display: "grid", gap: 12 }}>
        <input onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          type="password"
        />
        <button onClick={handleLogin}>Entrar</button>
        <Link href="/auth/register">Criar conta</Link>
      </div>
    </div>
  );
}
