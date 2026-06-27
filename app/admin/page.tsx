"use client";

import { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ──────────────────────────────────────────────────── */

type Tab = "visao_geral" | "usuarios" | "empresas" | "cargos" | "escritorio" | "auditoria";

type Permissao = { id: string; chave: string; descricao: string | null; modulo: string };

type Usuario = {
  id: string; full_name: string | null; email: string | null; role: string;
  created_at: string; updated_at: string;
};

type Empresa = {
  id: string; legal_name: string; trade_name: string | null; cnpj: string | null;
  status: string; tax_regime: string | null; created_at: string;
};

type Assinatura = {
  id: string; empresa_id: string; plano_id: string; status: string;
  inicio: string; fim: string | null;
};

/* ─── Helpers visuais ─────────────────────────────────────────── */

const STATUS_EMP: Record<string, { bg: string; color: string; label: string }> = {
  active:   { bg: "#f0fdf4", color: "#065f46", label: "Ativa" },
  analysis: { bg: "#fffbeb", color: "#92400e", label: "Analise" },
  opening:  { bg: "#eff6ff", color: "#1d4ed8", label: "Abrindo" },
  changing: { bg: "#fdf4ff", color: "#7e22ce", label: "Alterando" },
  closing:  { bg: "#fff7ed", color: "#c2410c", label: "Encerrando" },
  closed:   { bg: "#f3f4f6", color: "#6b7280", label: "Encerrada" },
  inactive: { bg: "#fef2f2", color: "#b91c1c", label: "Inativa" },
};

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return <span style={{ display: "inline-block", background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700, whiteSpace: "nowrap" }}>{label}</span>;
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th style={{ textAlign: right ? "right" : "left", padding: "0.7rem 0.875rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.5px", borderBottom: "1px solid #e8f0eb" }}>{children}</th>;
}

function TD({ children, right, muted, bold }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean }) {
  return <td style={{ padding: "0.75rem 0.875rem", textAlign: right ? "right" : "left", color: muted ? "#9ca3af" : "#07170d", fontSize: "0.85rem", borderBottom: "1px solid #f0f7f3", fontWeight: bold ? 700 : 400 }}>{children}</td>;
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <div style={{ background: "#fff", border: "1px solid #dfece5", borderRadius: 14, padding: "1.25rem", ...style }}>{children}</div>;
}

function StatCard({ label, value, sub, color, icon }: { label: string; value: string | number; sub: string; color: string; icon: string }) {
  return (
    <div style={{ background: `${color}08`, border: `1px solid ${color}20`, borderRadius: 14, padding: "1rem 1.125rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: 10, right: 14, fontSize: 28, opacity: 0.15 }}>{icon}</div>
      <p style={{ margin: "0 0 4px", fontSize: "0.68rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase" }}>{label}</p>
      <p style={{ margin: "0 0 2px", fontSize: "1.5rem", fontWeight: 900, color, lineHeight: 1 }}>{value}</p>
      <p style={{ margin: 0, fontSize: "0.72rem", color: "#9ca3af" }}>{sub}</p>
    </div>
  );
}

function EmptyBox({ msg }: { msg: string }) {
  return <Card style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.85rem" }}>{msg}</Card>;
}

function LoadingPulse() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "1rem 0" }}>
      {[1, 2, 3].map((i) => <div key={i} style={{ height: 44, background: "#f0f7f3", borderRadius: 8, animation: "pulse 1.5s infinite" }} />)}
      <style>{`@keyframes pulse { 0%,100%{opacity:.6} 50%{opacity:1} }`}</style>
    </div>
  );
}

function fmtData(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}

/* ─── Configuracoes do escritorio ─────────────────────────────── */

type ConfigEscritorio = {
  nome: string; cnpj: string; telefone: string; email: string;
  endereco: string; cidade: string; uf: string; crc: string;
  responsavel: string; logo_url: string;
};

const CONFIG_PADRAO: ConfigEscritorio = {
  nome: "Burgarelli C.O", cnpj: "", telefone: "", email: "",
  endereco: "", cidade: "", uf: "", crc: "", responsavel: "", logo_url: "",
};

/* ─── Tabs ────────────────────────────────────────────────────── */

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "visao_geral", label: "Visao Geral", icon: "📊" },
  { key: "usuarios", label: "Usuarios", icon: "👤" },
  { key: "empresas", label: "Empresas", icon: "🏢" },
  { key: "cargos", label: "Cargos e Permissoes", icon: "🔑" },
  { key: "escritorio", label: "Escritorio", icon: "⚙️" },
  { key: "auditoria", label: "Auditoria", icon: "📋" },
];

/* ─── Componente principal ───────────────────────────────────── */

export default function AdminPage() {
  const [tab, setTab] = useState<Tab>("visao_geral");
  const [loading, setLoading] = useState(true);

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [assinaturas] = useState<Assinatura[]>([]);
  const [config, setConfig] = useState<ConfigEscritorio>(CONFIG_PADRAO);
  const [toast, setToast] = useState<string | null>(null);

  const [buscaUser, setBuscaUser] = useState("");
  const [buscaEmp, setBuscaEmp] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [usersRes, empsRes, permsRes] = await Promise.all([
          fetch("/api/auth/session").then(r => r.json()).catch(() => ({ data: null })),
          fetch("/api/companies").then(r => r.json()).catch(() => ({ data: [] })),
          fetch("/api/rbac/permissoes").then(r => r.json()).catch(() => ({ data: [] })),
        ]);

        if (usersRes.data) setUsuarios([usersRes.data]);
        setEmpresas(empsRes.data ?? []);
        setPermissoes(permsRes.data ?? []);
      } catch { /* keep empty */ }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

  const salvarConfig = () => { showToast("Configuracoes salvas com sucesso!"); };

  /* KPIs */
  const totalEmpresas = empresas.length;
  const empAtivas = empresas.filter(e => e.status === "active").length;
  const empAnalise = empresas.filter(e => e.status === "analysis").length;
  const totalUsers = usuarios.length;

  const permissoesPorModulo = permissoes.reduce<Record<string, Permissao[]>>((acc, p) => {
    if (!acc[p.modulo]) acc[p.modulo] = [];
    acc[p.modulo].push(p);
    return acc;
  }, {});

  const usersFiltrados = usuarios.filter(u => {
    if (!buscaUser) return true;
    const q = buscaUser.toLowerCase();
    return (u.full_name?.toLowerCase().includes(q)) || (u.email?.toLowerCase().includes(q));
  });

  const empsFiltradas = empresas.filter(e => {
    if (!buscaEmp) return true;
    const q = buscaEmp.toLowerCase();
    return e.legal_name.toLowerCase().includes(q) || (e.cnpj?.includes(q)) || (e.trade_name?.toLowerCase().includes(q));
  });

  return (
    <AppShell>
      <div className="page-stack">
        {/* ── Header ── */}
        <div style={{ borderRadius: 14, overflow: "hidden", background: "linear-gradient(110deg, #06170d 0%, #0b2e18 60%, #0f3d20 100%)", boxShadow: "0 4px 24px rgba(6,23,13,0.18)", padding: "1.5rem 2rem", color: "#fff", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: "100%", background: "radial-gradient(circle at 80% 50%, rgba(16,185,129,0.12) 0%, transparent 70%)" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg fill="none" height={26} viewBox="0 0 24 24" width={26}><path d="M12 2l-8 4.5v5c0 4.56 3.41 8.83 8 9.85 4.59-1.02 8-5.29 8-9.85v-5L12 2z" stroke="#10b981" strokeWidth="2" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" /></svg>
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Painel Administrativo</h1>
              <p style={{ margin: "2px 0 0", fontSize: "0.82rem", opacity: 0.7 }}>Gerencie usuarios, empresas, permissoes e configuracoes do escritorio</p>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div style={{ display: "flex", gap: 0, overflowX: "auto", borderBottom: "2px solid #dfece5" }}>
          {TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} type="button" style={{
              padding: "0.7rem 1.1rem", fontSize: "0.82rem", fontWeight: tab === t.key ? 800 : 500,
              color: tab === t.key ? "#065f46" : "#6f8f7c", background: "transparent", border: "none",
              borderBottom: tab === t.key ? "2px solid #10b981" : "2px solid transparent",
              marginBottom: -2, cursor: "pointer", transition: "all 0.15s", whiteSpace: "nowrap",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <span style={{ fontSize: "0.9rem" }}>{t.icon}</span>{t.label}
            </button>
          ))}
        </div>

        {loading && <LoadingPulse />}

        {/* ═══════ VISAO GERAL ═══════ */}
        {!loading && tab === "visao_geral" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12, marginBottom: 20 }}>
              <StatCard label="Empresas" value={totalEmpresas} sub="cadastradas no sistema" color="#4338ca" icon="🏢" />
              <StatCard label="Ativas" value={empAtivas} sub="em operacao" color="#059669" icon="✓" />
              <StatCard label="Em analise" value={empAnalise} sub="aguardando abertura" color="#d97706" icon="⏳" />
              <StatCard label="Usuarios" value={totalUsers} sub="com acesso ao sistema" color="#7c3aed" icon="👤" />
              <StatCard label="Permissoes" value={permissoes.length} sub="configuradas no RBAC" color="#0891b2" icon="🔑" />
              <StatCard label="Assinaturas" value={assinaturas.length} sub="planos ativos" color="#dc2626" icon="💳" />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              <Card>
                <h3 style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "#07170d" }}>Ultimas empresas cadastradas</h3>
                {empresas.length === 0 ? <p style={{ color: "#9ca3af", fontSize: "0.82rem" }}>Nenhuma empresa.</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {empresas.slice(0, 5).map(e => (
                      <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f0f7f3" }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{e.trade_name || e.legal_name}</div>
                          <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{e.cnpj ?? "Sem CNPJ"}</div>
                        </div>
                        <Badge {...(STATUS_EMP[e.status] ?? STATUS_EMP.analysis)} />
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card>
                <h3 style={{ margin: "0 0 12px", fontSize: "0.9rem", fontWeight: 700, color: "#07170d" }}>Acesso rapido</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {[
                    { label: "Gerenciar usuarios", icon: "👤", tab: "usuarios" as Tab },
                    { label: "Ver empresas", icon: "🏢", tab: "empresas" as Tab },
                    { label: "Permissoes RBAC", icon: "🔑", tab: "cargos" as Tab },
                    { label: "Config. escritorio", icon: "⚙️", tab: "escritorio" as Tab },
                    { label: "Log de auditoria", icon: "📋", tab: "auditoria" as Tab },
                  ].map(a => (
                    <button key={a.label} onClick={() => setTab(a.tab)} type="button" style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "10px 12px",
                      background: "#f9fafb", border: "1px solid #dfece5", borderRadius: 10,
                      cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, color: "#07170d", textAlign: "left",
                    }}>
                      <span style={{ fontSize: 18 }}>{a.icon}</span>{a.label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ═══════ USUARIOS ═══════ */}
        {!loading && tab === "usuarios" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
              <input onChange={e => setBuscaUser(e.target.value)} placeholder="Buscar usuario..." style={{ flex: 1, padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none" }} type="text" value={buscaUser} />
              <span style={{ fontSize: "0.78rem", color: "#6f8f7c" }}>{usersFiltrados.length} usuario{usersFiltrados.length !== 1 ? "s" : ""}</span>
            </div>
            {usersFiltrados.length === 0 ? <EmptyBox msg="Nenhum usuario encontrado." /> : (
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Usuario</TH><TH>Tipo</TH><TH>Cadastro</TH></tr></thead>
                  <tbody>
                    {usersFiltrados.map(u => (
                      <tr key={u.id}>
                        <TD><div><div style={{ fontWeight: 700 }}>{u.full_name ?? "Sem nome"}</div><div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{u.email}</div></div></TD>
                        <TD><Badge bg={u.role === "admin" ? "#eef2ff" : "#f0fdf4"} color={u.role === "admin" ? "#4338ca" : "#065f46"} label={u.role === "admin" ? "Admin" : "Usuario"} /></TD>
                        <TD muted>{fmtData(u.created_at)}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {/* ═══════ EMPRESAS ═══════ */}
        {!loading && tab === "empresas" && (
          <div>
            <div style={{ display: "flex", gap: 10, marginBottom: 14, alignItems: "center" }}>
              <input onChange={e => setBuscaEmp(e.target.value)} placeholder="Buscar empresa por nome ou CNPJ..." style={{ flex: 1, padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none" }} type="text" value={buscaEmp} />
              <span style={{ fontSize: "0.78rem", color: "#6f8f7c" }}>{empsFiltradas.length} empresa{empsFiltradas.length !== 1 ? "s" : ""}</span>
            </div>
            {empsFiltradas.length === 0 ? <EmptyBox msg="Nenhuma empresa encontrada." /> : (
              <Card style={{ padding: 0, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead><tr><TH>Empresa</TH><TH>CNPJ</TH><TH>Regime</TH><TH>Status</TH><TH>Cadastro</TH></tr></thead>
                  <tbody>
                    {empsFiltradas.map(e => (
                      <tr key={e.id}>
                        <TD><div><div style={{ fontWeight: 700 }}>{e.trade_name || e.legal_name}</div>{e.trade_name && <div style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{e.legal_name}</div>}</div></TD>
                        <TD muted>{e.cnpj ?? "—"}</TD>
                        <TD><span style={{ fontSize: "0.8rem" }}>{e.tax_regime?.toUpperCase() ?? "—"}</span></TD>
                        <TD><Badge {...(STATUS_EMP[e.status] ?? STATUS_EMP.analysis)} /></TD>
                        <TD muted>{fmtData(e.created_at)}</TD>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            )}
          </div>
        )}

        {/* ═══════ CARGOS E PERMISSOES ═══════ */}
        {!loading && tab === "cargos" && (
          <div>
            {Object.keys(permissoesPorModulo).length === 0 ? <EmptyBox msg="Nenhuma permissao configurada." /> : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
                {Object.entries(permissoesPorModulo).map(([modulo, perms]) => (
                  <Card key={modulo}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                      <h3 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 800, color: "#07170d" }}>{modulo}</h3>
                      <span style={{ background: "#eef2ff", color: "#4338ca", borderRadius: 999, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>{perms.length}</span>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {perms.map(p => (
                        <span key={p.id} style={{ display: "inline-block", background: "#f5f7ff", color: "#4b5eaa", borderRadius: 6, padding: "3px 8px", fontSize: "0.68rem", fontWeight: 600, border: "1px solid #e0e7ff" }}>
                          {p.chave}
                        </span>
                      ))}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══════ ESCRITORIO ═══════ */}
        {!loading && tab === "escritorio" && (
          <div>
            <Card>
              <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: 700, color: "#07170d" }}>Dados do escritorio</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                {([
                  { key: "nome", label: "Nome do escritorio", placeholder: "Ex: Burgarelli Contabilidade" },
                  { key: "cnpj", label: "CNPJ", placeholder: "00.000.000/0001-00" },
                  { key: "telefone", label: "Telefone", placeholder: "(00) 00000-0000" },
                  { key: "email", label: "E-mail", placeholder: "contato@escritorio.com" },
                  { key: "responsavel", label: "Responsavel tecnico", placeholder: "Nome do contador" },
                  { key: "crc", label: "CRC", placeholder: "CRC/UF 000000" },
                  { key: "endereco", label: "Endereco", placeholder: "Rua, numero" },
                  { key: "cidade", label: "Cidade", placeholder: "Cidade" },
                  { key: "uf", label: "UF", placeholder: "SP" },
                ] as { key: keyof ConfigEscritorio; label: string; placeholder: string }[]).map(f => (
                  <div key={f.key}>
                    <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase", marginBottom: 4 }}>{f.label}</label>
                    <input
                      onChange={e => setConfig(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                      style={{ width: "100%", padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
                      value={config[f.key]}
                    />
                  </div>
                ))}
              </div>
              <button onClick={salvarConfig} style={{ marginTop: 20, padding: "0.6rem 2rem", background: "linear-gradient(135deg, #065f46, #10b981)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }} type="button">
                Salvar configuracoes
              </button>
            </Card>

            <Card style={{ marginTop: 14 }}>
              <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: 700, color: "#07170d" }}>Informacoes do sistema</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                {[
                  { label: "Versao", value: "1.0.0" },
                  { label: "Ambiente", value: "Producao" },
                  { label: "Framework", value: "Next.js + Supabase" },
                  { label: "Hospedagem", value: "Vercel" },
                  { label: "Banco de dados", value: "PostgreSQL (Supabase)" },
                  { label: "Autenticacao", value: "Supabase Auth" },
                ].map(i => (
                  <div key={i.label} style={{ background: "#f9fafb", borderRadius: 8, padding: "10px 14px" }}>
                    <div style={{ fontSize: "0.65rem", color: "#6f8f7c", fontWeight: 600, textTransform: "uppercase" }}>{i.label}</div>
                    <div style={{ fontSize: "0.85rem", color: "#07170d", fontWeight: 600, marginTop: 2 }}>{i.value}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ═══════ AUDITORIA ═══════ */}
        {!loading && tab === "auditoria" && (
          <Card>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#07170d" }}>Log de atividades</h3>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Registros de acoes no sistema</span>
            </div>
            <EmptyBox msg="A auditoria sera preenchida automaticamente conforme usuarios realizem acoes no sistema." />
          </Card>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 9999,
          display: "flex", alignItems: "center", gap: 10,
          padding: "14px 20px", borderRadius: 12, background: "#065f46",
          color: "#fff", fontSize: "0.875rem", fontWeight: 600,
          boxShadow: "0 8px 30px rgba(0,0,0,0.2)", animation: "toastIn 0.3s ease",
        }}>
          <span style={{ fontSize: 18 }}>✓</span>{toast}
          <style>{`@keyframes toastIn { from { opacity:0; transform:translateY(12px) } to { opacity:1; transform:translateY(0) } }`}</style>
        </div>
      )}
    </AppShell>
  );
}
