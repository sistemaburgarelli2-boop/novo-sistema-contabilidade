"use client";

import { useAuth } from "@/components/auth/AuthProvider";

export function LogoutButton() {
  const { signOut } = useAuth();

  return <button onClick={signOut}>Sair</button>;
}
