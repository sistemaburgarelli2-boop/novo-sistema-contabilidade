"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Notificacao = {
  data: string;
  descricao: string;
  id: string;
  lida: boolean;
  tipo: "documento_recebido" | "guia_disponivel" | "obrigacao_vencendo" | "sistema";
  titulo: string;
};

const NOTIFS_MOCK: Notificacao[] = [
  { data: "2026-06-18", descricao: "Guia DAS — Simples Nacional de Junho/2026 está pronta para pagamento.", id: "1", lida: false, tipo: "guia_disponivel", titulo: "Guia DAS disponível" },
  { data: "2026-06-17", descricao: "DARF competência Junho/2026 vence em 20/06. Evite multas e juros.", id: "2", lida: false, tipo: "obrigacao_vencendo", titulo: "Obrigação vencendo em 3 dias" },
  { data: "2026-06-14", descricao: "Folha de pagamento do mês de Junho foi processada e está disponível.", id: "3", lida: false, tipo: "documento_recebido", titulo: "Folha de pagamento disponível" },
  { data: "2026-06-10", descricao: "Contrato social atualizado foi recebido e está sendo processado.", id: "4", lida: true, tipo: "documento_recebido", titulo: "Documento recebido" },
  { data: "2026-06-01", descricao: "Bem-vindo ao portal do cliente Burgarelli C.O. Acesse seus documentos.", id: "5", lida: true, tipo: "sistema", titulo: "Portal ativado" },
];

const TIPO_CONFIG = {
  documento_recebido: { bg: "rgba(6,182,212,0.1)", color: "#0e7490", emoji: "📄", label: "Documento" },
  guia_disponivel: { bg: "rgba(16,185,129,0.1)", color: "var(--green-700)", emoji: "📋", label: "Guia" },
  obrigacao_vencendo: { bg: "rgba(212,174,74,0.15)", color: "#7a5f18", emoji: "⚠️", label: "Obrigação" },
  sistema: { bg: "rgba(156,163,175,0.15)", color: "#4b5563", emoji: "🔔", label: "Sistema" },
};

export default function PortalNotificacoes() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [notifs, setNotifs] = useState(NOTIFS_MOCK);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  function marcarTodasLidas() {
    setNotifs((prev) => prev.map((n) => ({ ...n, lida: true })));
  }

  if (!empresa) {
    return (
      <div style={{ alignItems: "center", display: "flex", fontSize: 14, justifyContent: "center", minHeight: "100vh", color: "var(--muted)" }}>
        Carregando...
      </div>
    );
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;
  const naoLidas = notifs.filter((n) => !n.lida).length;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Notificações</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              {naoLidas > 0 ? `${naoLidas} notificação${naoLidas > 1 ? "ões" : ""} não lida${naoLidas > 1 ? "s" : ""}` : "Todas as notificações lidas"}
            </p>
          </div>
          {naoLidas > 0 && (
            <button className="small-action" onClick={marcarTodasLidas} type="button">
              ✓ Marcar todas como lidas
            </button>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {notifs.map((notif) => {
            const cfg = TIPO_CONFIG[notif.tipo];
            return (
              <div
                key={notif.id}
                onClick={() => setNotifs((prev) => prev.map((n) => n.id === notif.id ? { ...n, lida: true } : n))}
                style={{
                  alignItems: "flex-start",
                  background: "#fff",
                  border: `1px solid ${notif.lida ? "var(--border)" : "rgba(16,185,129,0.3)"}`,
                  borderLeft: notif.lida ? "3px solid var(--border)" : "3px solid var(--green-400)",
                  borderRadius: 12,
                  cursor: "pointer",
                  display: "flex",
                  gap: 14,
                  opacity: notif.lida ? 0.65 : 1,
                  padding: "14px 16px",
                  transition: "opacity 0.15s",
                }}
              >
                <div style={{ alignItems: "center", background: cfg.bg, borderRadius: 10, color: cfg.color, display: "flex", flexShrink: 0, fontSize: 18, height: 40, justifyContent: "center", width: 40 }}>
                  {cfg.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ alignItems: "center", display: "flex", gap: 10, marginBottom: 4 }}>
                    <div style={{ background: cfg.bg, borderRadius: 20, color: cfg.color, fontSize: 10, fontWeight: 800, letterSpacing: "0.5px", padding: "2px 8px", textTransform: "uppercase" }}>
                      {cfg.label}
                    </div>
                    <span style={{ color: "var(--muted)", fontSize: 11, marginLeft: "auto" }}>
                      {new Date(notif.data).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <strong style={{ fontSize: 14 }}>{notif.titulo}</strong>
                  <p style={{ color: "var(--muted)", fontSize: 13, margin: "4px 0 0" }}>{notif.descricao}</p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </PortalShell>
  );
}
