"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type StatusTarefa = "nao_iniciado" | "em_andamento" | "revisao" | "concluido" | "atrasado";
type Setor = "Fiscal" | "Contábil" | "DP" | "Societário";

type Tarefa = {
  id: string;
  empresa: string;
  setor: Setor;
  atividade: string;
  prazo: string;
  responsavel: string;
  status: StatusTarefa;
};

type Automacao = {
  id: string;
  nome: string;
  ativa: boolean;
  ultimaExecucao: string;
};

/* ─── Configurações de estilo ────────────────────────────────── */

const S_STATUS: Record<StatusTarefa, { bg: string; color: string; label: string }> = {
  nao_iniciado: { bg: "#f3f4f6", color: "#6b7280", label: "Não iniciado" },
  em_andamento: { bg: "#ecfeff", color: "#0e7490", label: "Em andamento" },
  revisao:      { bg: "#fffbeb", color: "#92400e", label: "Revisão" },
  concluido:    { bg: "#f0fdf4", color: "#065f46", label: "Concluído" },
  atrasado:     { bg: "#fef2f2", color: "#b91c1c", label: "Atrasado" },
};

const S_SETOR: Record<Setor, { bg: string; color: string }> = {
  Fiscal:      { bg: "#f0fdf4", color: "#065f46" },
  Contábil:    { bg: "#eff6ff", color: "#1e40af" },
  DP:          { bg: "#f5f3ff", color: "#6b21a8" },
  Societário:  { bg: "#fffbeb", color: "#92400e" },
};

const STATUS_ORDER: StatusTarefa[] = ["nao_iniciado", "em_andamento", "revisao", "concluido", "atrasado"];

/* ─── Dados mock ─────────────────────────────────────────────── */

const TAREFAS_INIT: Tarefa[] = [
  { id: "1",  empresa: "Alfa Comércio Ltda",  setor: "Fiscal",      atividade: "Apuração ICMS Jun/2026",            prazo: "10/07/2026", responsavel: "Ana Lima",      status: "em_andamento" },
  { id: "2",  empresa: "Alfa Comércio Ltda",  setor: "Contábil",    atividade: "Fechamento contábil Mai/2026",      prazo: "05/07/2026", responsavel: "Carlos Silva",  status: "revisao" },
  { id: "3",  empresa: "Beta Serviços ME",    setor: "DP",          atividade: "Folha pagamento Jun/2026",           prazo: "05/07/2026", responsavel: "Marcos Souza",  status: "concluido" },
  { id: "4",  empresa: "Gama Tech Eireli",    setor: "Fiscal",      atividade: "Transmissão SPED Jun/2026",         prazo: "15/07/2026", responsavel: "Ana Lima",      status: "nao_iniciado" },
  { id: "5",  empresa: "Delta Holding S/A",   setor: "Fiscal",      atividade: "DCTF Jun/2026",                     prazo: "15/07/2026", responsavel: "Carlos Silva",  status: "em_andamento" },
  { id: "6",  empresa: "Épsilon Ltda",        setor: "DP",          atividade: "eSocial eventos Jun/2026",           prazo: "15/07/2026", responsavel: "Maria Costa",   status: "em_andamento" },
  { id: "7",  empresa: "Zeta Construções",    setor: "Contábil",    atividade: "Conciliação bancária Jun/2026",     prazo: "08/07/2026", responsavel: "Carlos Silva",  status: "atrasado" },
  { id: "8",  empresa: "Eta Logística",       setor: "Fiscal",      atividade: "DAS Simples Jun/2026",               prazo: "20/07/2026", responsavel: "Ana Lima",      status: "nao_iniciado" },
  { id: "9",  empresa: "Theta Indústrias",    setor: "Societário",  atividade: "Alteração contrato social",         prazo: "30/07/2026", responsavel: "Maria Costa",   status: "em_andamento" },
  { id: "10", empresa: "Alfa Comércio Ltda",  setor: "DP",          atividade: "Rescisão — João Silva",              prazo: "12/07/2026", responsavel: "Marcos Souza",  status: "revisao" },
  { id: "11", empresa: "Beta Serviços ME",    setor: "Fiscal",      atividade: "Certidão negativa federal",         prazo: "18/07/2026", responsavel: "Ana Lima",      status: "nao_iniciado" },
  { id: "12", empresa: "Gama Tech Eireli",    setor: "Contábil",    atividade: "Balancete Jun/2026",                 prazo: "10/07/2026", responsavel: "Carlos Silva",  status: "em_andamento" },
  { id: "13", empresa: "Delta Holding S/A",   setor: "DP",          atividade: "Admissão — Maria Santos",            prazo: "08/07/2026", responsavel: "Marcos Souza",  status: "concluido" },
  { id: "14", empresa: "Épsilon Ltda",        setor: "Fiscal",      atividade: "EFD-Contribuições Mai/2026",        prazo: "10/07/2026", responsavel: "Ana Lima",      status: "atrasado" },
  { id: "15", empresa: "Zeta Construções",    setor: "Societário",  atividade: "Certificado digital renovação",     prazo: "25/07/2026", responsavel: "Maria Costa",   status: "nao_iniciado" },
  { id: "16", empresa: "Eta Logística",       setor: "Contábil",    atividade: "Fechamento contábil Mai/2026",      prazo: "05/07/2026", responsavel: "Carlos Silva",  status: "atrasado" },
];

const AUTOMACOES_INIT: Automacao[] = [
  { id: "a1", nome: "Gerar obrigações fiscais mensais",      ativa: true, ultimaExecucao: "01/07/2026" },
  { id: "a2", nome: "Gerar tarefas de folha de pagamento",   ativa: true, ultimaExecucao: "01/07/2026" },
  { id: "a3", nome: "Gerar fechamento contábil",             ativa: true, ultimaExecucao: "25/06/2026" },
];

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
  const [tarefas, setTarefas] = useState<Tarefa[]>(TAREFAS_INIT);
  const [automacoes, setAutomacoes] = useState<Automacao[]>(AUTOMACOES_INIT);

  /* Filtros */
  const [busca, setBusca] = useState("");
  const [filtSetor, setFiltSetor] = useState("");
  const [filtStatus, setFiltStatus] = useState("");
  const [filtResp, setFiltResp] = useState("");

  /* ── Ciclar status ── */
  function ciclarStatus(id: string) {
    setTarefas((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const idx = STATUS_ORDER.indexOf(t.status);
        const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
        return { ...t, status: next };
      }),
    );
  }

  /* ── Alternar automação ── */
  function toggleAutomacao(id: string) {
    setAutomacoes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ativa: !a.ativa } : a)),
    );
  }

  /* ── Filtragem ── */
  const tarefasFiltradas = tarefas.filter((t) => {
    if (busca && !t.empresa.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtSetor && t.setor !== filtSetor) return false;
    if (filtStatus && t.status !== filtStatus) return false;
    if (filtResp && t.responsavel !== filtResp) return false;
    return true;
  });

  /* ── KPIs ── */
  const totalTarefas = tarefas.length;
  const emAndamento = tarefas.filter((t) => t.status === "em_andamento").length;
  const atrasadas = tarefas.filter((t) => t.status === "atrasado").length;
  const concluidasMes = 86;

  return (
    <AppShell>
      {/* ── Hero Header ── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ margin: "0 0 4px", fontSize: "1.4rem", fontWeight: 900, color: "#07170d" }}>
            Central de Tarefas
          </h1>
          <p style={{ margin: 0, fontSize: "0.82rem", color: "#9ca3af" }}>
            Gestão de atividades operacionais do escritório
          </p>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: "1.5rem" }}>
        {[
          { label: "Total tarefas",     value: totalTarefas,  suffix: "tarefas cadastradas",   color: "#4338ca", bg: "#eef2ff" },
          { label: "Em andamento",       value: emAndamento,   suffix: "em execução agora",     color: "#0e7490", bg: "#ecfeff" },
          { label: "Atrasadas",          value: atrasadas,     suffix: "requerem atenção",      color: "#b91c1c", bg: "#fef2f2" },
          { label: "Concluídas (mês)",   value: concluidasMes, suffix: "finalizadas no período", color: "#065f46", bg: "#f0fdf4" },
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
          <option value="Fiscal">Fiscal</option>
          <option value="Contábil">Contábil</option>
          <option value="DP">DP</option>
          <option value="Societário">Societário</option>
        </select>
        <select className="input" onChange={(e) => setFiltStatus(e.target.value)} style={{ minWidth: 140 }} value={filtStatus}>
          <option value="">Todos os status</option>
          <option value="nao_iniciado">Não iniciado</option>
          <option value="em_andamento">Em andamento</option>
          <option value="revisao">Revisão</option>
          <option value="concluido">Concluído</option>
          <option value="atrasado">Atrasado</option>
        </select>
        <select className="input" onChange={(e) => setFiltResp(e.target.value)} style={{ minWidth: 140 }} value={filtResp}>
          <option value="">Todos os responsáveis</option>
          <option value="Ana Lima">Ana Lima</option>
          <option value="Carlos Silva">Carlos Silva</option>
          <option value="Marcos Souza">Marcos Souza</option>
          <option value="Maria Costa">Maria Costa</option>
        </select>
      </div>

      {/* ── Tabela de Tarefas ── */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e0e7ff",
          borderRadius: 12,
          overflow: "hidden",
          marginBottom: "1.5rem",
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
              {tarefasFiltradas.length} tarefa{tarefasFiltradas.length !== 1 ? "s" : ""} encontrada{tarefasFiltradas.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>Empresa</TH>
                <TH>Setor</TH>
                <TH>Atividade</TH>
                <TH>Prazo</TH>
                <TH>Responsável</TH>
                <TH>Status</TH>
              </tr>
            </thead>
            <tbody>
              {tarefasFiltradas.map((t) => {
                const isAtrasado = t.status === "atrasado";
                const st = S_STATUS[t.status];
                const se = S_SETOR[t.setor];
                return (
                  <tr key={t.id} style={{ background: isAtrasado ? "#fff8f8" : "transparent" }}>
                    <TD bold>{t.empresa}</TD>
                    <TD>
                      <Badge bg={se.bg} color={se.color} label={t.setor} />
                    </TD>
                    <TD>{t.atividade}</TD>
                    <TD color={isAtrasado ? "#b91c1c" : undefined}>
                      <span style={{ fontWeight: isAtrasado ? 700 : 400 }}>{t.prazo}</span>
                    </TD>
                    <TD>{t.responsavel}</TD>
                    <TD>
                      <Badge
                        bg={st.bg}
                        color={st.color}
                        label={st.label}
                        onClick={() => ciclarStatus(t.id)}
                      />
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
                    Nenhuma tarefa encontrada com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Total no rodapé da tabela */}
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
            Concluídas: <strong style={{ color: "#065f46" }}>{tarefasFiltradas.filter((t) => t.status === "concluido").length}</strong>
          </span>
        </div>
      </div>

      {/* ── Automação ── */}
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
            padding: "1rem 1.25rem",
            borderBottom: "1px solid #e0e7ff",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#07170d" }}>Automação</h2>
          <p style={{ margin: "4px 0 0", fontSize: "0.78rem", color: "#9ca3af" }}>
            Tarefas geradas automaticamente por competência
          </p>
        </div>

        <div style={{ padding: "1rem 1.25rem", display: "flex", flexDirection: "column", gap: 12 }}>
          {automacoes.map((a) => (
            <div
              key={a.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "0.875rem 1rem",
                background: a.ativa ? "#f0fdf4" : "#f9fafb",
                border: `1px solid ${a.ativa ? "#065f4622" : "#e5e7eb"}`,
                borderRadius: 10,
              }}
            >
              <div>
                <p style={{ margin: 0, fontSize: "0.85rem", fontWeight: 700, color: "#07170d" }}>
                  {a.nome}
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "0.75rem", color: "#9ca3af" }}>
                  Última execução: {a.ultimaExecucao}
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Badge
                  bg={a.ativa ? "#f0fdf4" : "#f3f4f6"}
                  color={a.ativa ? "#065f46" : "#6b7280"}
                  label={a.ativa ? "Ativa" : "Inativa"}
                />
                {/* Toggle switch visual */}
                <div
                  onClick={() => toggleAutomacao(a.id)}
                  style={{
                    width: 40,
                    height: 22,
                    borderRadius: 11,
                    background: a.ativa ? "#059669" : "#d1d5db",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: 2,
                      left: a.ativa ? 20 : 2,
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
