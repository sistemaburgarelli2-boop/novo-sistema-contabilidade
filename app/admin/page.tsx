"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ROLES, ALL_PERMISSIONS } from "@/lib/rbac";

/* ─── Tipos ──────────────────────────────────────────────────── */

type UserTipo = "interno" | "cliente";
type UserStatus = "ativo" | "bloqueado" | "pendente";

type MockUser = {
  id: string;
  nome: string;
  email: string;
  cargo_chave: string;
  cargo_nome: string;
  tipo: UserTipo;
  empresa_vinculada: string | null;
  status: UserStatus;
  ultimo_login: string;
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

/* ─── Configurações de estilo ────────────────────────────────── */

const S_STATUS: Record<UserStatus, { bg: string; color: string; label: string }> = {
  ativo:     { bg: "#f0fdf4", color: "#065f46", label: "Ativo" },
  bloqueado: { bg: "#fef2f2", color: "#b91c1c", label: "Bloqueado" },
  pendente:  { bg: "#fffbeb", color: "#92400e", label: "Pendente" },
};

const S_TIPO: Record<UserTipo, { bg: string; color: string; label: string }> = {
  interno: { bg: "#eff6ff", color: "#1e40af", label: "Interno" },
  cliente: { bg: "#f5f3ff", color: "#6b21a8", label: "Cliente" },
};

/* ─── Dados mock ─────────────────────────────────────────────── */

const MOCK_USERS: MockUser[] = [
  { id: "u1",  nome: "Ricardo Burgarelli",  email: "ricardo@burgarelli.com.br",      cargo_chave: "administrador",       cargo_nome: "Administrador",       tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "19/06/2026 08:30" },
  { id: "u2",  nome: "Fernanda Oliveira",   email: "fernanda@burgarelli.com.br",     cargo_chave: "diretor_operacional", cargo_nome: "Diretor Operacional", tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "19/06/2026 07:45" },
  { id: "u3",  nome: "Carlos Silva",        email: "carlos@burgarelli.com.br",       cargo_chave: "gerente_contabil",    cargo_nome: "Gerente Contábil",    tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "18/06/2026 17:20" },
  { id: "u4",  nome: "Ana Lima",            email: "ana@burgarelli.com.br",          cargo_chave: "analista_fiscal",     cargo_nome: "Analista Fiscal",     tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "19/06/2026 09:10" },
  { id: "u5",  nome: "Pedro Santos",        email: "pedro@burgarelli.com.br",        cargo_chave: "analista_fiscal",     cargo_nome: "Analista Fiscal",     tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "18/06/2026 16:50" },
  { id: "u6",  nome: "Juliana Costa",       email: "juliana@burgarelli.com.br",      cargo_chave: "analista_contabil",   cargo_nome: "Analista Contábil",   tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "19/06/2026 08:00" },
  { id: "u7",  nome: "Marcos Souza",        email: "marcos@burgarelli.com.br",       cargo_chave: "analista_dp",         cargo_nome: "Analista DP",         tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "18/06/2026 18:00" },
  { id: "u8",  nome: "Luciana Ferreira",    email: "luciana@burgarelli.com.br",      cargo_chave: "financeiro",          cargo_nome: "Financeiro",          tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "17/06/2026 15:30" },
  { id: "u9",  nome: "Roberto Almeida",     email: "roberto@burgarelli.com.br",      cargo_chave: "comercial",           cargo_nome: "Comercial",           tipo: "interno", empresa_vinculada: null,                     status: "ativo",     ultimo_login: "19/06/2026 10:00" },
  { id: "u10", nome: "João Representante",  email: "joao@alfacomercio.com.br",       cargo_chave: "cliente",             cargo_nome: "Cliente",             tipo: "cliente", empresa_vinculada: "Alfa Comércio Ltda",     status: "ativo",     ultimo_login: "18/06/2026 14:20" },
  { id: "u11", nome: "Maria Empresária",    email: "maria@betaservicos.com.br",      cargo_chave: "cliente",             cargo_nome: "Cliente",             tipo: "cliente", empresa_vinculada: "Beta Serviços ME",       status: "pendente",  ultimo_login: "—" },
  { id: "u12", nome: "Paulo Diretor",       email: "paulo@gamatech.com.br",         cargo_chave: "cliente",             cargo_nome: "Cliente",             tipo: "cliente", empresa_vinculada: "Gama Tech Eireli",       status: "bloqueado", ultimo_login: "10/06/2026 09:15" },
];

const MOCK_AUDIT: AuditEntry[] = [
  { id: "a1",  data_hora: "19/06/2026 09:12", usuario: "Ricardo Burgarelli",  acao: "Login",              modulo: "Autenticação",  detalhe: "Login realizado com sucesso",                     ip: "192.168.1.10" },
  { id: "a2",  data_hora: "19/06/2026 09:08", usuario: "Ana Lima",            acao: "Login",              modulo: "Autenticação",  detalhe: "Login realizado com sucesso",                     ip: "192.168.1.22" },
  { id: "a3",  data_hora: "19/06/2026 08:55", usuario: "Carlos Silva",        acao: "empresa.read",       modulo: "Empresa",       detalhe: "Visualizou dados de Alfa Comércio Ltda",          ip: "192.168.1.15" },
  { id: "a4",  data_hora: "19/06/2026 08:40", usuario: "Juliana Costa",       acao: "documento.download", modulo: "Documentos",    detalhe: "Download do balancete Mai/2026 — Gama Tech",      ip: "192.168.1.18" },
  { id: "a5",  data_hora: "19/06/2026 08:30", usuario: "Ricardo Burgarelli",  acao: "usuario.manage",     modulo: "Usuários",      detalhe: "Bloqueou acesso do usuário Paulo Diretor",        ip: "192.168.1.10" },
  { id: "a6",  data_hora: "18/06/2026 18:05", usuario: "Marcos Souza",        acao: "Logout",             modulo: "Autenticação",  detalhe: "Sessão encerrada pelo usuário",                   ip: "192.168.1.20" },
  { id: "a7",  data_hora: "18/06/2026 17:30", usuario: "João Representante",  acao: "documento.download", modulo: "Documentos",    detalhe: "Download de guia FGTS Jun/2026",                  ip: "200.150.30.45" },
  { id: "a8",  data_hora: "18/06/2026 17:15", usuario: "Fernanda Oliveira",   acao: "empresa.read",       modulo: "Empresa",       detalhe: "Visualizou dados de Delta Holding S/A",           ip: "192.168.1.12" },
  { id: "a9",  data_hora: "18/06/2026 16:50", usuario: "Pedro Santos",        acao: "fiscal.write",       modulo: "Fiscal",        detalhe: "Alteração na apuração ICMS — Beta Serviços ME",   ip: "192.168.1.25" },
  { id: "a10", data_hora: "18/06/2026 16:20", usuario: "Ricardo Burgarelli",  acao: "permission.manage",  modulo: "Permissões",    detalhe: "Alterou cargo de Pedro Santos para Analista Fiscal", ip: "192.168.1.10" },
  { id: "a11", data_hora: "18/06/2026 15:45", usuario: "Luciana Ferreira",    acao: "financeiro.write",   modulo: "Financeiro",    detalhe: "Registrou pagamento de honorários — Épsilon Ltda", ip: "192.168.1.30" },
  { id: "a12", data_hora: "18/06/2026 14:20", usuario: "João Representante",  acao: "Login",              modulo: "Autenticação",  detalhe: "Login via portal do cliente",                     ip: "200.150.30.45" },
  { id: "a13", data_hora: "18/06/2026 11:00", usuario: "Roberto Almeida",     acao: "crm.write",          modulo: "CRM",           detalhe: "Adicionou lead — Omega Consultoria",              ip: "192.168.1.35" },
  { id: "a14", data_hora: "18/06/2026 10:30", usuario: "Carlos Silva",        acao: "contabil.write",     modulo: "Contábil",      detalhe: "Fechamento contábil Mai/2026 — Alfa Comércio",    ip: "192.168.1.15" },
  { id: "a15", data_hora: "18/06/2026 09:00", usuario: "Ana Lima",            acao: "documento.download", modulo: "Documentos",    detalhe: "Download de SPED Fiscal Mai/2026 — Eta Logística", ip: "192.168.1.22" },
];

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

  /* Filtros de usuários */
  const [busca, setBusca] = useState("");
  const [filtTipo, setFiltTipo] = useState("");
  const [filtStatus, setFiltStatus] = useState("");

  /* Cargos expandidos */
  const [expandedRoles, setExpandedRoles] = useState<Set<string>>(new Set());

  function toggleRole(key: string) {
    setExpandedRoles((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  /* KPIs */
  const totalUsuarios = MOCK_USERS.length;
  const internos = MOCK_USERS.filter((u) => u.tipo === "interno").length;
  const clientes = MOCK_USERS.filter((u) => u.tipo === "cliente").length;
  const bloqueados = MOCK_USERS.filter((u) => u.status === "bloqueado").length;

  /* Filtragem */
  const usuariosFiltrados = MOCK_USERS.filter((u) => {
    if (busca && !u.nome.toLowerCase().includes(busca.toLowerCase()) && !u.email.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtTipo && u.tipo !== filtTipo) return false;
    if (filtStatus && u.status !== filtStatus) return false;
    return true;
  });

  /* Contagem de usuários por cargo */
  function usersInRole(roleKey: string): number {
    return MOCK_USERS.filter((u) => u.cargo_chave === roleKey).length;
  }

  /* Permissões agrupadas por módulo para um cargo */
  function permsByModule(rolePerms: string[]): { modulo: string; perms: string[] }[] {
    if (rolePerms.includes("*")) {
      return ALL_PERMISSIONS;
    }
    return ALL_PERMISSIONS
      .map((group) => ({
        modulo: group.modulo,
        perms: group.perms.filter((p) => rolePerms.includes(p)),
      }))
      .filter((g) => g.perms.length > 0);
  }

  /* ─── Tabs ─── */
  const TABS: { key: typeof abaAtiva; label: string }[] = [
    { key: "usuarios",  label: "Usuários" },
    { key: "cargos",    label: "Cargos" },
    { key: "auditoria", label: "Auditoria" },
  ];

  return (
    <AppShell>
      {/* ── Hero Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 900, color: "#07170d" }}>
            Administração de Acesso
          </h1>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>
            Gerencie usuários, cargos e permissões do escritório
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {[
          { label: "Total usuários",   value: totalUsuarios, suffix: "cadastrados no sistema",   color: "#4338ca", bg: "#eef2ff" },
          { label: "Internos",         value: internos,      suffix: "colaboradores ativos",     color: "#1e40af", bg: "#eff6ff" },
          { label: "Clientes",         value: clientes,      suffix: "acessos de clientes",      color: "#6b21a8", bg: "#f5f3ff" },
          { label: "Bloqueados",       value: bloqueados,    suffix: "acessos suspensos",        color: "#b91c1c", bg: "#fef2f2" },
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

      {/* ═══ ABA: USUÁRIOS ═══ */}
      {abaAtiva === "usuarios" && (
        <div>
          {/* Filtros */}
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
            <select className="input" onChange={(e) => setFiltTipo(e.target.value)} style={{ minWidth: 130 }} value={filtTipo}>
              <option value="">Todos os tipos</option>
              <option value="interno">Interno</option>
              <option value="cliente">Cliente</option>
            </select>
            <select className="input" onChange={(e) => setFiltStatus(e.target.value)} style={{ minWidth: 130 }} value={filtStatus}>
              <option value="">Todos os status</option>
              <option value="ativo">Ativo</option>
              <option value="bloqueado">Bloqueado</option>
              <option value="pendente">Pendente</option>
            </select>
            <button
              className="small-action"
              style={{
                background: "#4338ca",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "0.5rem 1rem",
                fontSize: "0.8rem",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              + Novo usuário
            </button>
          </div>

          {/* Tabela */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e0e7ff",
              borderRadius: 14,
              overflow: "hidden",
            }}
          >
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Usuário</TH>
                  <TH>Cargo</TH>
                  <TH>Tipo</TH>
                  <TH>Empresa vinculada</TH>
                  <TH>Status</TH>
                  <TH>Último login</TH>
                  <TH right>Ações</TH>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.map((u) => (
                  <tr key={u.id} style={{ transition: "background 0.1s" }}>
                    <TD>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{u.nome}</div>
                        <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{u.email}</div>
                      </div>
                    </TD>
                    <TD>{u.cargo_nome}</TD>
                    <TD>
                      <Badge {...S_TIPO[u.tipo]} />
                    </TD>
                    <TD muted={!u.empresa_vinculada}>
                      {u.empresa_vinculada ?? "—"}
                    </TD>
                    <TD>
                      <Badge {...S_STATUS[u.status]} />
                    </TD>
                    <TD muted>{u.ultimo_login}</TD>
                    <TD right>
                      <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                        <button
                          style={{
                            background: "#eef2ff",
                            color: "#4338ca",
                            border: "1px solid #e0e7ff",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Editar
                        </button>
                        <button
                          style={{
                            background: u.status === "bloqueado" ? "#f0fdf4" : "#fef2f2",
                            color: u.status === "bloqueado" ? "#065f46" : "#b91c1c",
                            border: `1px solid ${u.status === "bloqueado" ? "#bbf7d0" : "#fecaca"}`,
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          {u.status === "bloqueado" ? "Desbloquear" : "Bloquear"}
                        </button>
                        <button
                          style={{
                            background: "#fffbeb",
                            color: "#92400e",
                            border: "1px solid #fde68a",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Redefinir senha
                        </button>
                      </div>
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ ABA: CARGOS ═══ */}
      {abaAtiva === "cargos" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 14 }}>
          {Object.entries(ROLES).map(([key, role]) => {
            const isExpanded = expandedRoles.has(key);
            const grouped = permsByModule(role.permissoes);
            const userCount = usersInRole(key);
            const isWildcard = role.permissoes.includes("*");

            return (
              <div
                key={key}
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
                {/* Cabeçalho do cargo */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#07170d" }}>
                      {role.nome}
                    </h3>
                    <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
                      {userCount} {userCount === 1 ? "usuário" : "usuários"}
                    </span>
                  </div>
                  {isWildcard && (
                    <Badge bg="#fef2f2" color="#b91c1c" label="Acesso total" />
                  )}
                </div>

                {/* Contagem de permissões */}
                <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                  {isWildcard
                    ? `Todas as permissões (${ALL_PERMISSIONS.flatMap((g) => g.perms).length})`
                    : `${role.permissoes.length} permissões em ${grouped.length} ${grouped.length === 1 ? "módulo" : "módulos"}`
                  }
                </div>

                {/* Botão expandir */}
                <button
                  onClick={() => toggleRole(key)}
                  style={{
                    background: "#f5f7ff",
                    color: "#4b5eaa",
                    border: "1px solid #e0e7ff",
                    borderRadius: 8,
                    padding: "5px 12px",
                    fontSize: "0.73rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    alignSelf: "flex-start",
                    transition: "background 0.15s",
                  }}
                >
                  {isExpanded ? "Ocultar permissões" : "Ver permissões"}
                </button>

                {/* Permissões expandidas */}
                {isExpanded && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 4 }}>
                    {grouped.map((group) => (
                      <div key={group.modulo}>
                        <div style={{ fontSize: "0.68rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", marginBottom: 4 }}>
                          {group.modulo}
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                          {group.perms.map((p) => (
                            <PermBadge key={p} perm={p} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ ABA: AUDITORIA ═══ */}
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
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
              Últimas {MOCK_AUDIT.length} ações registradas
            </span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Data / Hora</TH>
                <TH>Usuário</TH>
                <TH>Ação</TH>
                <TH>Módulo</TH>
                <TH>Detalhe</TH>
                <TH>IP</TH>
              </tr>
            </thead>
            <tbody>
              {MOCK_AUDIT.map((entry) => (
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
                  <TD>
                    <span style={{ fontSize: "0.8rem" }}>{entry.detalhe}</span>
                  </TD>
                  <TD muted>{entry.ip}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AppShell>
  );
}
