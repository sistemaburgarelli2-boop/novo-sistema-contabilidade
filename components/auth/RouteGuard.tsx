"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";

type UserTipo = "interno" | "cliente";

type SessionData = {
  tipo: UserTipo;
  linked_company_id: string | null;
  role_chave: string;
  permissoes: string[];
};

function getSession(): SessionData {
  if (typeof window === "undefined") {
    return { tipo: "interno", linked_company_id: null, role_chave: "administrador", permissoes: ["*"] };
  }

  const tipo = (localStorage.getItem("burgarelli:user_tipo") ?? "interno") as UserTipo;

  if (tipo === "cliente") {
    return {
      tipo: "cliente",
      linked_company_id: localStorage.getItem("burgarelli:linked_company") ?? "empresa-1",
      role_chave: "cliente",
      permissoes: ["empresa.read", "documento.read", "documento.upload", "guia.download", "solicitacao.create", "solicitacao.read", "notificacao.read"],
    };
  }

  return {
    tipo: "interno",
    linked_company_id: null,
    role_chave: localStorage.getItem("burgarelli:role") ?? "administrador",
    permissoes: ["*"],
  };
}

function hasAccess(session: SessionData, pathname: string): boolean | string {
  if (session.permissoes.includes("*")) return true;

  if (session.tipo === "cliente") {
    const companyId = session.linked_company_id;

    if (pathname.startsWith("/portal/") && companyId) {
      const portalPrefix = `/portal/${companyId}`;
      if (pathname === portalPrefix || pathname.startsWith(portalPrefix + "/")) {
        return true;
      }
      return `/portal/${companyId}`;
    }

    if (pathname.startsWith("/portal")) {
      return companyId ? `/portal/${companyId}` : "/auth/login";
    }

    if (pathname === "/dashboard" || pathname.startsWith("/empresas") || pathname.startsWith("/tarefas") || pathname.startsWith("/admin")) {
      return companyId ? `/portal/${companyId}` : "/auth/login";
    }

    return true;
  }

  return true;
}

export function RouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (pathname === "/auth/login" || pathname === "/") {
      setAuthorized(true);
      setChecking(false);
      return;
    }

    const session = getSession();
    const access = hasAccess(session, pathname);

    if (access === true) {
      setAuthorized(true);
    } else if (typeof access === "string") {
      router.replace(access);
      return;
    } else {
      router.replace("/auth/login");
      return;
    }

    setChecking(false);
  }, [pathname, router]);

  if (checking && !authorized) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", color: "#6b7280", fontSize: "0.875rem" }}>
        Verificando acesso...
      </div>
    );
  }

  if (!authorized) return null;

  return <>{children}</>;
}
