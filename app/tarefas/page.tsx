"use client";

import { useState, useEffect, useMemo } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type StatusTarefa = "nao_iniciado" | "em_andamento" | "revisao" | "concluido" | "atrasado";

type Tarefa = {
  id: string;
  empresa_id: string;
  setor: string;
  atividade: string;
  prazo: string;
  responsavel: string;
  status: StatusTarefa;
  empresas?: { nome_legal: string } | null;
};

/* ─── Configuracoes de estilo ────────────────────────────────── */

const S_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  nao_iniciado: { bg: "#f3f4f6", color: "#6b7280", label: "Nao iniciado" },
  em_andamento: { bg: "#ecfeff", color: "#0e7490", label: "Em andamento" },
  revisao:      { bg: "#fffbeb", color: "#92400e", label: "Revisao" },
  concluido:    { bg: "#f0fdf4", color: "#065f46", label: "Concluido" },
  atrasado:     { bg: "#fef2f2", color: "#b91c1c", label: "Atrasado" },
};

const S_SETOR: Record<string, { bg: string; color: string }> = {
  Fiscal:      { bg: "#f0fdf4", color: "#065f46" },
  "Contabil":  { bg: "#eff6ff", color: "#1e40af" },
  DP:          { bg: "#f5f3ff", color: "#6b21a8" },
  "Societario": { bg: "#fffbeb", color: "#92400e" },
};

const SETOR_DEFAULT = { bg: "#f3f4f6", color: "#6b7280" };

/* ─── Helpers ────────────────────────────────────────────────── */

function Badge({ bg, color, label, onClick }: { bg: string; color: string; label: string; onClick?: () => void }) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-block",
        background: bg,
        color,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: "0.73rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
        cursor: onClick ? "pointer" : "default",
        userSelect: "none",
        transition: "opacity 0.15s",
      }}
    >
      {label}
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

function TD({ children, right, muted, bold, color }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean; color?: string }) {
  return (
    <td
      style={{
        padding: "0.75rem 0.875rem",
        textAlign: right ? "right" : "left",
        color: color ?? (muted ? "#9ca3af" : "#07170d"),
        fontSize: "0.85rem",
        borderBottom: "1px solid #f5f7ff",
        fontWeight: bold ? 700 : 400,
      }}
    >
      {children}
    </td>
  );
}

/* ─── Componente ─────────────────────────────────────────────── */

export default function TarefasPage() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [loading, setLoading] = useState(true);

  /* Filtros */
  const [busca, setBusca] = useState("");
  const [filtSetor, setFiltSetor] = useState("");
  const [filtStatus, setFiltStatus] = useState("");
  const [filtResp, setFiltResp] = useState("");

  /* ── Carregar tarefas da API ── */
  useEffect(() => {
    fetch("/api/tarefas")
      .then((r) => r.json())
      .then((res) => setTarefas(res.data ?? []))
      .catch(() => setTarefas([]))
      .finally(() => setLoading(false));
  }, []);

  /* ── Listas dinamicas para filtros ── */
  const setores = useMemo(() => [...new Set(tarefas.map((t) => t.setor).filter(Boolean))].sort(), [tarefas]);
  const responsaveis = useMemo(() => [...new Set(tarefas.map((t) => t.responsavel).filter(Boolean))].sort(), [tarefas]);

  /* ── Filtragem ── */
  const tarefasFiltradas = tarefas.filter((t) => {
    const nomeEmpresa = t.empresas?.nome_legal ?? "";
    if (busca && !nomeEmpresa.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtSetor && t.setor !== filtSetor) return false;
    if (filtStatus && t.status !== filtStatus) return false;
    if (filtResp && t.responsavel !== filtResp) return false;
    return true;
  });

  /* ── KPIs ── */
  const totalTarefas = tarefas.length;
  const emAndamento = tarefas.filter((t) => t.status === "em_andamento").length;
  const atrasadas = tarefas.filter((t) => t.status === "atrasado").length;
  const concluidas = tarefas.filter((t) => t.status === "concluido").length;

  return (
    <AppShell>
      {/* ── Hero Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 900, color: "#07170d" }}>
            Central de Tarefas
          </h1>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>
            Gestao de atividades operacionais do escritorio
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {[
          { label: "Total tarefas",   value: totalTarefas, suffix: "tarefas cadastradas",    color: "#4338ca", bg: "#eef2ff" },
          { label: "Em andamento",    value: emAndamento,  suffix: "em execucao agora",       color: "#0e7490", bg: "#ecfeff" },
          { label: "Atrasadas",       value: atrasadas,    suffix: "requerem atencao",        color: "#b91c1c", bg: "#fef2f2" },
          { label: "Concluidas",      value: concluidas,   suffix: "finalizadas",             color: "#065f46", bg: "#f0fdf4" },
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

      {/* ── Filtros ── */}
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
          placeholder="Buscar empresa..."
          style={{ flex: 1, minWidth: 180 }}
          type="text"
          value={busca}
        />
        <select className="input" onChange={(e) => setFiltSetor(e.target.value)} style={{ minWidth: 130 }} value={filtSetor}>
          <option value="">Todos os setores</option>
          {setores.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className="input" onChange={(e) => setFiltStatus(e.target.value)} style={{ minWidth: 140 }} value={filtStatus}>
          <option value="">Todos os status</option>
          <option value="nao_iniciado">Nao iniciado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="revisao">Revisao</option>
          <option value="concluido">Concluido</option>
          <option value="atrasado">Atrasado</option>
        </select>
        <select className="input" onChange={(e) => setFiltResp(e.target.value)} style={{ minWidth: 140 }} value={filtResp}>
          <option value="">Todos os responsaveis</option>
          {responsaveis.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* ── Tabela de Tarefas ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e7ff",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #e0e7ff",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#07170d" }}>Tarefas</h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#9ca3af" }}>
              {loading ? "Carregando..." : `${tarefasFiltradas.length} tarefa${tarefasFiltradas.length !== 1 ? "s" : ""} encontrada${tarefasFiltradas.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.85rem" }}>
            Carregando...
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Empresa</TH>
                  <TH>Setor</TH>
                  <TH>Atividade</TH>
                  <TH>Prazo</TH>
                  <TH>Responsavel</TH>
                  <TH>Status</TH>
                </tr>
              </thead>
              <tbody>
                {tarefasFiltradas.map((t) => {
                  const isAtrasado = t.status === "atrasado";
                  const st = S_STATUS[t.status] ?? S_STATUS.nao_iniciado;
                  const se = S_SETOR[t.setor] ?? SETOR_DEFAULT;
                  const nomeEmpresa = t.empresas?.nome_legal ?? "—";
                  return (
                    <tr key={t.id} style={{ background: isAtrasado ? "#fff8f8" : "transparent" }}>
                      <TD bold>{nomeEmpresa}</TD>
                      <TD>
                        <Badge bg={se.bg} color={se.color} label={t.setor ?? "—"} />
                      </TD>
                      <TD>{t.atividade}</TD>
                      <TD color={isAtrasado ? "#b91c1c" : undefined}>
                        <span style={{ fontWeight: isAtrasado ? 700 : 400 }}>
                          {t.prazo ? new Date(t.prazo).toLocaleDateString("pt-BR") : "—"}
                        </span>
                      </TD>
                      <TD>{t.responsavel ?? "—"}</TD>
                      <TD>
                        <Badge bg={st.bg} color={st.color} label={st.label} />
                      </TD>
                    </tr>
                  );
                })}
                {tarefasFiltradas.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "2rem",
                        color: "#9ca3af",
                        fontSize: "0.85rem",
                      }}
                    >
                      {tarefas.length === 0 ? "Nenhuma tarefa cadastrada." : "Nenhuma tarefa encontrada com os filtros selecionados."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Total no rodape da tabela */}
        {!loading && tarefasFiltradas.length > 0 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.75rem 1.25rem",
              borderTop: "1px solid #e0e7ff",
              background: "#f9fafb",
              fontSize: "0.78rem",
              color: "#6b7280",
            }}
          >
            <span>
              Total: <strong style={{ color: "#07170d" }}>{tarefasFiltradas.length}</strong> tarefa{tarefasFiltradas.length !== 1 ? "s" : ""}
            </span>
            <span>
              Atrasadas: <strong style={{ color: "#b91c1c" }}>{tarefasFiltradas.filter((t) => t.status === "atrasado").length}</strong>
              {" | "}
              Em andamento: <strong style={{ color: "#0e7490" }}>{tarefasFiltradas.filter((t) => t.status === "em_andamento").length}</strong>
              {" | "}
              Concluidas: <strong style={{ color: "#065f46" }}>{tarefasFiltradas.filter((t) => t.status === "concluido").length}</strong>
            </span>
          </div>
        )}
      </div>
    </AppShell>
  );
}
