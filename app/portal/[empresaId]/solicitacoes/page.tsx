"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Solicitacao = {
  data: string;
  descricao: string;
  id: string;
  previsao: string | null;
  responsavel: string;
  status: "aguardando" | "em_andamento" | "concluida" | "cancelada";
  tipo: string;
  titulo: string;
};

const SOLICITACOES_MOCK: Solicitacao[] = [
  {
    data: "2026-06-18",
    descricao: "Preciso da certidão negativa de débitos federais para apresentar ao banco para contratação de crédito.",
    id: "1",
    previsao: "2026-06-22",
    responsavel: "Setor Contábil",
    status: "em_andamento",
    tipo: "Certidão",
    titulo: "Certidão Negativa de Débitos Federais",
  },
  {
    data: "2026-06-15",
    descricao: "Solicitação de declaração de faturamento dos últimos 12 meses para fins de financiamento.",
    id: "2",
    previsao: "2026-06-20",
    responsavel: "Setor Contábil",
    status: "concluida",
    tipo: "Declaração",
    titulo: "Declaração de Faturamento",
  },
  {
    data: "2026-06-10",
    descricao: "Solicitação de cópia das guias DAS pagas no primeiro semestre de 2026.",
    id: "3",
    previsao: null,
    responsavel: "Setor Fiscal",
    status: "concluida",
    tipo: "Documentos",
    titulo: "Guias DAS — 1º Semestre 2026",
  },
];

const STATUS_CONFIG: Record<Solicitacao["status"], { label: string; bg: string; color: string }> = {
  aguardando: { label: "Aguardando", bg: "rgba(156,163,175,0.15)", color: "#374151" },
  em_andamento: { label: "Em andamento", bg: "rgba(245,158,11,0.12)", color: "#92400e" },
  concluida: { label: "Concluída", bg: "rgba(16,185,129,0.1)", color: "#065f46" },
  cancelada: { label: "Cancelada", bg: "rgba(239,68,95,0.1)", color: "#b91c1c" },
};

const TIPOS_SOLICITACAO = [
  "Certidão",
  "Declaração",
  "Documentos",
  "Consulta",
  "Alteração Cadastral",
  "Outros",
];

export default function PortalSolicitacoes() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [tipo, setTipo] = useState("Certidão");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  function handleEnviar() {
    if (!titulo.trim() || !descricao.trim()) return;
    setEnviado(true);
    setMostrando(false);
    setTitulo(""); setTipo("Certidão"); setDescricao("");
    setTimeout(() => setEnviado(false), 4000);
  }

  if (!empresa) {
    return (
      <div style={{ alignItems: "center", display: "flex", fontSize: 14, justifyContent: "center", minHeight: "100vh", color: "var(--muted)" }}>
        Carregando...
      </div>
    );
  }

  const nome = empresa.nome_fantasia || empresa.nome_legal;

  const solicitacoesFiltradas = filtroStatus
    ? SOLICITACOES_MOCK.filter((s) => s.status === filtroStatus)
    : SOLICITACOES_MOCK;

  const emAndamento = SOLICITACOES_MOCK.filter((s) => s.status === "em_andamento").length;
  const aguardando = SOLICITACOES_MOCK.filter((s) => s.status === "aguardando").length;
  const concluidas = SOLICITACOES_MOCK.filter((s) => s.status === "concluida").length;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Solicitações</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              Acompanhe o andamento das suas solicitações ao escritório.
            </p>
          </div>
          <button onClick={() => setMostrando(true)} type="button">+ Nova solicitação</button>
        </div>

        {enviado && (
          <div className="status-message">
            ✓ Solicitação enviada! O escritório iniciará o atendimento em breve.
          </div>
        )}

        {/* KPIs */}
        <div className="kpi-strip" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          <article className={`metric-card${emAndamento > 0 ? " kpi-warning" : ""}`}>
            <span>Em andamento</span>
            <strong className="kpi-num">{emAndamento}</strong>
            <p>Sendo processadas</p>
          </article>
          <article className="metric-card">
            <span>Aguardando</span>
            <strong className="kpi-num">{aguardando}</strong>
            <p>Na fila de atendimento</p>
          </article>
          <article className="metric-card">
            <span>Concluídas</span>
            <strong className="kpi-num">{concluidas}</strong>
            <p>Finalizadas com sucesso</p>
          </article>
        </div>

        {/* Formulário nova solicitação */}
        {mostrando && (
          <div className="list-panel" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Nova solicitação</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Tipo
                  <select className="input" onChange={(e) => setTipo(e.target.value)} value={tipo}>
                    {TIPOS_SOLICITACAO.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Título <span style={{ color: "#ef445f" }}>*</span>
                  <input
                    className="input"
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Certidão Negativa de Débitos"
                    value={titulo}
                  />
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Descrição <span style={{ color: "#ef445f" }}>*</span>
                <textarea
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva em detalhes o que você precisa, para qual finalidade, e qualquer informação relevante..."
                  rows={4}
                  style={{ border: "1.5px solid #c9dbd1", borderRadius: 8, background: "#f9fcfa", color: "var(--ink)", padding: "10px 14px", resize: "vertical", fontSize: 14, fontFamily: "inherit" }}
                  value={descricao}
                />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="small-action" onClick={() => setMostrando(false)} type="button">Cancelar</button>
                <button disabled={!titulo.trim() || !descricao.trim()} onClick={handleEnviar} type="button">Enviar solicitação</button>
              </div>
            </div>
          </div>
        )}

        {/* Lista */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Minhas solicitações</h2>
              <p>{solicitacoesFiltradas.length} solicitaç{solicitacoesFiltradas.length !== 1 ? "ões" : "ão"}</p>
            </div>
            <select
              className="input"
              onChange={(e) => setFiltroStatus(e.target.value)}
              style={{ minWidth: 160, fontSize: 13 }}
              value={filtroStatus}
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                <option key={key} value={key}>{val.label}</option>
              ))}
            </select>
          </div>

          <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
            {solicitacoesFiltradas.length === 0 && (
              <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 14, padding: "2rem 0" }}>
                Nenhuma solicitação encontrada.
              </p>
            )}
            {solicitacoesFiltradas.map((sol) => {
              const cfg = STATUS_CONFIG[sol.status];
              return (
                <div
                  key={sol.id}
                  style={{
                    background: "#fff",
                    border: "1px solid var(--border)",
                    borderRadius: 12,
                    padding: "14px 16px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                        <span style={{ background: cfg.bg, color: cfg.color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {cfg.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                          {sol.tipo}
                        </span>
                      </div>
                      <strong style={{ fontSize: 14 }}>{sol.titulo}</strong>
                      <p style={{ margin: "5px 0 0", fontSize: 13, color: "var(--muted)", lineHeight: 1.45 }}>{sol.descricao}</p>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0, minWidth: 110 }}>
                      <div style={{ fontSize: 11, color: "var(--muted)" }}>
                        {new Date(sol.data).toLocaleDateString("pt-BR")}
                      </div>
                      {sol.previsao && (
                        <div style={{ fontSize: 11, color: "#0e7490", fontWeight: 600, marginTop: 3 }}>
                          Previsão: {new Date(sol.previsao).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600, borderTop: "1px solid var(--border)", paddingTop: 8 }}>
                    Responsável: {sol.responsavel}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </PortalShell>
  );
}
