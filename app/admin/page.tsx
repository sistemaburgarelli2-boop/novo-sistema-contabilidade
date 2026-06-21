"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ──────────────────────────────────────────────────── */

type Permissao = {
  id: string;
  chave: string;
  descricao: string | null;
  modulo: string;
};

type UserStatus = "ativo" | "bloqueado" | "pendente";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  cargo_nome: string;
  tipo: string;
  empresa_vinculada: string | null;
  status: UserStatus;
  ultimo_login: string | null;
};

type AuditEntry = {
  id: string;
  data_hora: string;
  usuario: string;
  acao: string;
  modulo: string;
  detalhe: string;
  ip: string;
};

/* ─── Configuracoes de estilo ────────────────────────────────── */

const S_STATUS: Record<UserStatus, { bg: string; color: string; label: string }> = {
  ativo:     { bg: "#f0fdf4", color: "#065f46", label: "Ativo" },
  bloqueado: { bg: "#fef2f2", color: "#b91c1c", label: "Bloqueado" },
  pendente:  { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
};

/* ─── Helpers ────────────────────────────────────────────────── */

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: "0.73rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function PermBadge({ perm }: { perm: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: "#f5f7ff",
        color: "#4b5eaa",
        borderRadius: 6,
        padding: "2px 7px",
        fontSize: "0.65rem",
        fontWeight: 600,
        border: "1px solid #e0e7ff",
        whiteSpace: "nowrap",
      }}
    >
      {perm}
    </span>
  );
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        textAlign: right ? "right" : "left",
        padding: "0.7rem 0.875rem",
        color: "#4b5eaa",
        fontWeight: 700,
        fontSize: "0.72rem",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        borderBottom: "1px solid #e0e7ff",
        background: "#eef2ff",
      }}
    >
      {children}
    </th>
  );
}

function TD({ children, right, muted, bold }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean }) {
  return (
    <td
      style={{
        padding: "0.75rem 0.875rem",
        textAlign: right ? "right" : "left",
        color: muted ? "#9ca3af" : "#07170d",
        fontSize: "0.85rem",
        borderBottom: "1px solid #f5f7ff",
        fontWeight: bold ? 700 : 400,
      }}
    >
      {children}
    </td>
  );
}

/* ─── Componente principal ───────────────────────────────────── */

export default function AdminPage() {
  const [abaAtiva, setAbaAtiva] = useState<"usuarios" | "cargos" | "auditoria">("usuarios");

  /* Estado de dados */
  const [usuarios] = useState<Usuario[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [auditoria] = useState<AuditEntry[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);

  /* Filtros de usuarios */
  const [busca, setBusca] = useState("");
  const [filtStatus, setFiltStatus] = useState("");

  /* Carregar permissoes quando aba cargos for ativada */
  useEffect(() => {
    if (abaAtiva === "cargos" && permissoes.length === 0) {
      setLoadingPerms(true);
      fetch("/api/rbac/permissoes")
        .then((r) => r.json())
        .then((res) => setPermissoes(res.data ?? []))
        .catch(() => setPermissoes([]))
        .finally(() => setLoadingPerms(false));
    }
  }, [abaAtiva, permissoes.length]);

  /* KPIs */
  const totalUsuarios = usuarios.length;
  const internos = usuarios.filter((u) => u.tipo === "interno").length;
  const clientes = usuarios.filter((u) => u.tipo === "cliente").length;
  const bloqueados = usuarios.filter((u) => u.status === "bloqueado").length;

  /* Filtragem de usuarios */
  const usuariosFiltrados = usuarios.filter((u) => {
    if (busca && !u.nome.toLowerCase().includes(busca.toLowerCase()) && !u.email.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtStatus && u.status !== filtStatus) return false;
    return true;
  });

  /* Agrupar permissoes por modulo */
  const permissoesPorModulo = permissoes.reduce<Record<string, Permissao[]>>((acc, p) => {
    if (!acc[p.modulo]) acc[p.modulo] = [];
    acc[p.modulo].push(p);
    return acc;
  }, {});

  /* Tabs */
  const TABS: { key: typeof abaAtiva; label: string }[] = [
    { key: "usuarios",  label: "Usuarios" },
    { key: "cargos",    label: "Cargos e Permissoes" },
    { key: "auditoria", label: "Auditoria" },
  ];

  return (
    <AppShell>
      {/* ── Hero Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 900, color: "#07170d" }}>
            Administracao de Acesso
          </h1>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>
            Gerencie usuarios, cargos e permissoes do escritorio
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {[
          { label: "Total usuarios",  value: totalUsuarios, suffix: "cadastrados no sistema",  color: "#4338ca", bg: "#eef2ff" },
          { label: "Internos",        value: internos,      suffix: "colaboradores ativos",    color: "#1e40af", bg: "#eff6ff" },
          { label: "Clientes",        value: clientes,      suffix: "acessos de clientes",     color: "#6b21a8", bg: "#f5f3ff" },
          { label: "Bloqueados",      value: bloqueados,    suffix: "acessos suspensos",       color: "#b91c1c", bg: "#fef2f2" },
        ].map((k) => (
          <div
            key={k.label}
            style={{
              background: k.bg,
              border: `1px solid ${k.color}22`,
              borderTop: `3px solid ${k.color}`,
              borderRadius: 12,
              padding: "0.875rem 1rem",
            }}
          >
            <p style={{ margin: "0 0 4px", fontSize: "0.65rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase" }}>
              {k.label}
            </p>
            <p style={{ margin: "0 0 2px", fontSize: "1.6rem", fontWeight: 900, color: k.color, lineHeight: 1 }}>
              {k.value}
            </p>
            <p style={{ margin: 0, fontSize: "0.7rem", color: "#9ca3af" }}>{k.suffix}</p>
          </div>
        ))}
      </div>

      {/* ── Abas ── */}
      <div style={{ display: "flex", gap: 0, borderBottom: "2px solid #e0e7ff", marginBottom: "1.25rem" }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setAbaAtiva(tab.key)}
            style={{
              padding: "0.6rem 1.25rem",
              fontSize: "0.82rem",
              fontWeight: abaAtiva === tab.key ? 800 : 500,
              color: abaAtiva === tab.key ? "#4338ca" : "#9ca3af",
              background: "transparent",
              border: "none",
              borderBottom: abaAtiva === tab.key ? "2px solid #4338ca" : "2px solid transparent",
              marginBottom: "-2px",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* === ABA: USUARIOS === */}
      {abaAtiva === "usuarios" && (
        <div>
          <div
            style={{
              display: "flex",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "center",
              marginBottom: "1rem",
              background: "#fff",
              border: "1px solid #e0e7ff",
              borderRadius: 12,
              padding: "0.75rem 1rem",
            }}
          >
            <input
              className="input"
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por nome ou email..."
              style={{ flex: 1, minWidth: 200 }}
              type="text"
              value={busca}
            />
            <select className="input" onChange={(e) => setFiltStatus(e.target.value)} style={{ minWidth: 130 }} value={filtStatus}>
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="bloqueado">Bloqueado</option>
              <option value="pendente">Pendente</option>
            </select>
          </div>

          {usuariosFiltrados.length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e0e7ff",
                borderRadius: 14,
                padding: "3rem",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "0.85rem",
              }}
            >
              Selecione uma empresa para ver usuarios ou nenhum usuario cadastrado.
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e0e7ff", borderRadius: 14, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <TH>Usuario</TH>
                    <TH>Cargo</TH>
                    <TH>Empresa vinculada</TH>
                    <TH>Status</TH>
                    <TH>Ultimo login</TH>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((u) => (
                    <tr key={u.id}>
                      <TD>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{u.nome}</div>
                          <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{u.email}</div>
                        </div>
                      </TD>
                      <TD>{u.cargo_nome}</TD>
                      <TD muted={!u.empresa_vinculada}>{u.empresa_vinculada ?? "—"}</TD>
                      <TD>
                        <Badge {...(S_STATUS[u.status] ?? S_STATUS.ativo)} />
                      </TD>
                      <TD muted>{u.ultimo_login ?? "—"}</TD>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* === ABA: CARGOS E PERMISSOES === */}
      {abaAtiva === "cargos" && (
        <div>
          {loadingPerms ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e0e7ff",
                borderRadius: 14,
                padding: "3rem",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "0.85rem",
              }}
            >
              Carregando...
            </div>
          ) : Object.keys(permissoesPorModulo).length === 0 ? (
            <div
              style={{
                background: "#fff",
                border: "1px solid #e0e7ff",
                borderRadius: 14,
                padding: "3rem",
                textAlign: "center",
                color: "#9ca3af",
                fontSize: "0.85rem",
              }}
            >
              Nenhuma permissao configurada.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
              {Object.entries(permissoesPorModulo).map(([modulo, perms]) => (
                <div
                  key={modulo}
                  style={{
                    background: "#fff",
                    border: "1px solid #e0e7ff",
                    borderRadius: 14,
                    padding: "1rem 1.125rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#07170d" }}>
                    {modulo}
                  </h3>
                  <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                    {perms.length} {perms.length === 1 ? "permissao" : "permissoes"}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {perms.map((p) => (
                      <PermBadge key={p.id} perm={p.chave} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* === ABA: AUDITORIA === */}
      {abaAtiva === "auditoria" && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e0e7ff",
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "0.75rem 1rem",
              borderBottom: "1px solid #e0e7ff",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#07170d" }}>
              Log de atividades
            </span>
          </div>
          {auditoria.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.85rem" }}>
              Sem registros de auditoria.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Data / Hora</TH>
                  <TH>Usuario</TH>
                  <TH>Acao</TH>
                  <TH>Modulo</TH>
                  <TH>Detalhe</TH>
                  <TH>IP</TH>
                </tr>
              </thead>
              <tbody>
                {auditoria.map((entry) => (
                  <tr key={entry.id}>
                    <TD muted>{entry.data_hora}</TD>
                    <TD bold>{entry.usuario}</TD>
                    <TD>
                      <span
                        style={{
                          display: "inline-block",
                          background: entry.acao === "Login" || entry.acao === "Logout" ? "#ecfeff" : "#f5f7ff",
                          color: entry.acao === "Login" || entry.acao === "Logout" ? "#0e7490" : "#4b5eaa",
                          borderRadius: 6,
                          padding: "2px 8px",
                          fontSize: "0.72rem",
                          fontWeight: 600,
                        }}
                      >
                        {entry.acao}
                      </span>
                    </TD>
                    <TD>{entry.modulo}</TD>
                    <TD><span style={{ fontSize: "0.8rem" }}>{entry.detalhe}</span></TD>
                    <TD muted>{entry.ip}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </AppShell>
  );
}
