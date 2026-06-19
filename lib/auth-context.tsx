"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { ROLES, checkPermission, checkAnyPermission, allPermissionKeys } from "@/lib/rbac";

/* ─── Tipos ──────────────────────────────────────────────────── */

export type UserTipo = "interno" | "cliente";

export type AuthUser = {
  id: string;
  nome: string;
  email: string;
  tipo: UserTipo;
  ativo: boolean;
  ultimo_login: string;
  role_id: string;
  role_chave: string;
  role_nome: string;
  linked_company_id: string | null;
  company_ids: string[];
  permissoes: string[];
};

type AuthContextValue = {
  user: AuthUser;
  loading: boolean;
  hasPermission: (perm: string) => boolean;
  hasAnyPermission: (perms: string[]) => boolean;
  isCliente: () => boolean;
};

/* ─── Mock Users ─────────────────────────────────────────────── */

const MOCK_ADMIN: AuthUser = {
  id: "usr-admin-001",
  nome: "Administrador",
  email: "admin@burgarelli.com.br",
  tipo: "interno",
  ativo: true,
  ultimo_login: "2026-06-19T08:30:00Z",
  role_id: "role-001",
  role_chave: "administrador",
  role_nome: "Administrador",
  linked_company_id: null,
  company_ids: [
    "empresa-1", "empresa-2", "empresa-3", "empresa-4",
    "empresa-5", "empresa-6", "empresa-7", "empresa-8",
  ],
  permissoes: allPermissionKeys(),
};

const MOCK_CLIENTE: AuthUser = {
  id: "usr-cli-001",
  nome: "João Representante",
  email: "joao@alfacomercio.com.br",
  tipo: "cliente",
  ativo: true,
  ultimo_login: "2026-06-18T14:20:00Z",
  role_id: "role-011",
  role_chave: "cliente",
  role_nome: "Cliente",
  linked_company_id: "empresa-1",
  company_ids: [],
  permissoes: ROLES.cliente.permissoes,
};

/* ─── Context ────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "burgarelli:user_tipo";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser>(MOCK_ADMIN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "cliente") {
        setUser(MOCK_CLIENTE);
      } else {
        setUser(MOCK_ADMIN);
      }
    } catch {
      setUser(MOCK_ADMIN);
    }
    setLoading(false);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      hasPermission: (perm: string) => checkPermission(user.permissoes, perm),
      hasAnyPermission: (perms: string[]) => checkAnyPermission(user.permissoes, perms),
      isCliente: () => user.tipo === "cliente",
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─── Hook ───────────────────────────────────────────────────── */

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de um <AuthProvider>.");
  }
  return ctx;
}
