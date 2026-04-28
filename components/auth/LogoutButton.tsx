"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";

export function LogoutButton() {
  const signOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/auth/login";
  };

  return <button onClick={signOut}>Sair</button>;
}
