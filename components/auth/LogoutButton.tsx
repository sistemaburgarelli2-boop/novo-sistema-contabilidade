"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";

export function LogoutButton() {
  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });

    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch {
      // The admin login flow does not require Supabase client configuration.
    }

    window.location.href = "/auth/login";
  };

  return <button onClick={signOut}>Sair</button>;
}
