"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    window.location.href = "/dashboard";
  };

  return (
    <div style={{ margin: "64px auto", maxWidth: 360 }}>
      <h1>Cadastro</h1>
      <div style={{ display: "grid", gap: 12 }}>
        <input onChange={(event) => setEmail(event.target.value)} placeholder="Email" />
        <input
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha"
          type="password"
        />
        <button onClick={handleRegister}>Cadastrar</button>
        <Link href="/auth/login">Ja tenho conta</Link>
      </div>
    </div>
  );
}
