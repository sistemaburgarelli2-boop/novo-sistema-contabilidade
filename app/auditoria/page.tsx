"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { AuditLog } from "@/modules/auditoria/auditoria.types";
import { listarAuditoriaEmpresa } from "@/services/auditoriaClientService";
import { getEmpresaAtivaId } from "@/services/empresaClientService";

export default function AuditoriaPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const ativa = getEmpresaAtivaId();
    setEmpresaId(ativa);

    if (!ativa) {
      return;
    }

    listarAuditoriaEmpresa(ativa)
      .then(setLogs)
      .catch((error) => setErro(error instanceof Error ? error.message : "Erro ao carregar auditoria."));
  }, []);

  if (!empresaId) {
    return (
      <AppShell>
        <div className="empty-state">
          <h1>Auditoria</h1>
          <p>Selecione uma empresa ativa em Empresas para visualizar os logs.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Auditoria</h1>
            <p>Trilha de ações críticas por empresa, usuário e recurso.</p>
          </div>
        </div>

        {erro ? <p className="error-alert">{erro}</p> : null}

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            overflow: "hidden",
            padding: 0,
          }}
        >
          <div style={{ display: "grid", gap: 0 }}>
            {logs.length === 0 ? (
              <p style={{ padding: 18 }}>Nenhum evento de auditoria encontrado.</p>
            ) : null}

            {logs.map((log) => (
              <article
                key={log.id}
                style={{
                  border: 0,
                  borderBottom: "1px solid #e5e7eb",
                  borderRadius: 0,
                  boxShadow: "none",
                  display: "grid",
                  gap: 8,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                  <strong>{log.action}</strong>
                  <span className="muted">{new Date(log.created_at).toLocaleString("pt-BR")}</span>
                </div>
                <p style={{ margin: 0 }}>
                  Recurso: {log.resource_type} {log.resource_id ? `(${log.resource_id})` : ""}
                </p>
                <p className="muted" style={{ margin: 0 }}>
                  Usuário: {log.user_id || "sistema"} · IP: {log.ip || "-"} · Request:{" "}
                  {log.request_id || "-"}
                </p>
                {log.after_data ? (
                  <pre
                    style={{
                      background: "#f6faf8",
                      border: "1px solid #dfece5",
                      borderRadius: 8,
                      margin: 0,
                      overflow: "auto",
                      padding: 12,
                    }}
                  >
                    {JSON.stringify(log.after_data, null, 2)}
                  </pre>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
