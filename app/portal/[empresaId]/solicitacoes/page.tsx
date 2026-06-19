"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Solicitacao = {
  id: number;
  assunto: string;
  categoria: string;
  data: string;
  status: "Aberto" | "Em andamento" | "Concluído";
  ultimaResposta: string | null;
  mensagens: Mensagem[];
};

type Mensagem = {
  id: string;
  autor: string;
  tipo: "cliente" | "equipe";
  texto: string;
  data: string;
};

const STATUS_STYLES: Record<Solicitacao["status"], { bg: string; color: string }> = {
  Aberto: { bg: "rgba(6,182,212,0.1)", color: "#0e7490" },
  "Em andamento": { bg: "rgba(245,158,11,0.12)", color: "#92400e" },
  "Concluído": { bg: "rgba(16,185,129,0.1)", color: "#065f46" },
};

const SOLICITACOES_MOCK: Solicitacao[] = [
  {
    id: 1,
    assunto: "Declaração IR 2025",
    categoria: "Fiscal",
    data: "15/06/2026",
    status: "Concluído",
    ultimaResposta: "16/06/2026",
    mensagens: [
      { id: "1a", autor: "Você", tipo: "cliente", texto: "Preciso da declaração do IR 2025 para apresentar ao banco.", data: "15/06/2026 09:30" },
      { id: "1b", autor: "Equipe Fiscal", tipo: "equipe", texto: "Declaração processada e disponível para download na aba Documentos.", data: "16/06/2026 14:15" },
    ],
  },
  {
    id: 2,
    assunto: "Alteração sócio",
    categoria: "Societário",
    data: "10/06/2026",
    status: "Em andamento",
    ultimaResposta: "18/06/2026",
    mensagens: [
      { id: "2a", autor: "Você", tipo: "cliente", texto: "Precisamos alterar o quadro societário. O sócio João Silva sairá da empresa.", data: "10/06/2026 10:00" },
      { id: "2b", autor: "Equipe Societário", tipo: "equipe", texto: "Recebemos a solicitação. Precisamos do documento de identidade do sócio que sairá e da nova distribuição de cotas.", data: "11/06/2026 15:30" },
      { id: "2c", autor: "Você", tipo: "cliente", texto: "Documentos enviados na aba de documentos. A distribuição será 100% para Maria Santos.", data: "18/06/2026 08:45" },
    ],
  },
  {
    id: 3,
    assunto: "Certidão negativa",
    categoria: "Fiscal",
    data: "18/06/2026",
    status: "Aberto",
    ultimaResposta: null,
    mensagens: [
      { id: "3a", autor: "Você", tipo: "cliente", texto: "Preciso de uma certidão negativa de débitos federais para apresentar em licitação.", data: "18/06/2026 16:00" },
    ],
  },
  {
    id: 4,
    assunto: "Adiantamento férias",
    categoria: "DP",
    data: "05/06/2026",
    status: "Concluído",
    ultimaResposta: "08/06/2026",
    mensagens: [
      { id: "4a", autor: "Você", tipo: "cliente", texto: "O funcionário Carlos Oliveira solicitou adiantamento de férias para julho.", data: "05/06/2026 11:00" },
      { id: "4b", autor: "Equipe DP", tipo: "equipe", texto: "Adiantamento calculado e recibo disponível. Valor líquido: R$ 3.250,00.", data: "08/06/2026 09:20" },
    ],
  },
  {
    id: 5,
    assunto: "Parcelamento INSS",
    categoria: "Financeiro",
    data: "12/06/2026",
    status: "Em andamento",
    ultimaResposta: "17/06/2026",
    mensagens: [
      { id: "5a", autor: "Você", tipo: "cliente", texto: "Gostaria de parcelar o INSS em atraso dos meses de janeiro a março.", data: "12/06/2026 14:00" },
      { id: "5b", autor: "Equipe Financeiro", tipo: "equipe", texto: "Estamos analisando as condições de parcelamento. O valor total é R$ 8.100,00. Retornamos com as opções em breve.", data: "17/06/2026 10:30" },
    ],
  },
  {
    id: 6,
    assunto: "Rescisão funcionário",
    categoria: "DP",
    data: "19/06/2026",
    status: "Aberto",
    ultimaResposta: null,
    mensagens: [
      { id: "6a", autor: "Você", tipo: "cliente", texto: "Precisamos realizar a rescisão do funcionário Pedro Lima. Demissão sem justa causa.", data: "19/06/2026 08:00" },
    ],
  },
];

const CATEGORIAS_FORM = ["Fiscal", "DP", "Financeiro", "Societário"];

export default function PortalSolicitacoes() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [categoria, setCategoria] = useState("Fiscal");
  const [descricao, setDescricao] = useState("");
  const [prioridade, setPrioridade] = useState("Normal");
  const [enviado, setEnviado] = useState(false);
  const [selecionada, setSelecionada] = useState<number | null>(null);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  function handleEnviar() {
    if (!descricao.trim()) return;
    setEnviado(true);
    setMostrando(false);
    setDescricao("");
    setCategoria("Fiscal");
    setPrioridade("Normal");
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

  const solicitacaoSelecionada = selecionada !== null
    ? SOLICITACOES_MOCK.find((s) => s.id === selecionada)
    : null;

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Solicitações</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>
              Abra e acompanhe solicitações ao escritório contábil.
            </p>
          </div>
          <button
            onClick={() => { setMostrando(true); setSelecionada(null); }}
            style={{
              background: "var(--green-700)",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 700,
              padding: "10px 20px",
            }}
            type="button"
          >
            + Nova solicitação
          </button>
        </div>

        {enviado && (
          <div style={{
            alignItems: "center",
            background: "rgba(16,185,129,0.08)",
            border: "1px solid rgba(16,185,129,0.25)",
            borderRadius: 10,
            color: "#065f46",
            display: "flex",
            fontSize: 14,
            fontWeight: 600,
            gap: 8,
            padding: "12px 16px",
          }}>
            Solicitação enviada com sucesso! O escritório iniciará o atendimento em breve.
          </div>
        )}

        {/* New request form */}
        {mostrando && (
          <div className="list-panel" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Nova solicitação</h3>
            <div style={{ display: "grid", gap: 14 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Categoria
                  <select
                    onChange={(e) => setCategoria(e.target.value)}
                    style={{
                      background: "#f9fcfa",
                      border: "1.5px solid #c9dbd1",
                      borderRadius: 8,
                      color: "var(--ink)",
                      fontSize: 14,
                      fontFamily: "inherit",
                      padding: "10px 14px",
                    }}
                    value={categoria}
                  >
                    {CATEGORIAS_FORM.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Prioridade
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    {["Normal", "Urgente"].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrioridade(p)}
                        style={{
                          background: prioridade === p
                            ? (p === "Urgente" ? "rgba(239,68,95,0.1)" : "rgba(16,185,129,0.1)")
                            : "#fff",
                          border: prioridade === p
                            ? (p === "Urgente" ? "1.5px solid #ef445f" : "1.5px solid var(--green-400)")
                            : "1.5px solid var(--border)",
                          borderRadius: 8,
                          color: prioridade === p
                            ? (p === "Urgente" ? "#b91c1c" : "#065f46")
                            : "var(--muted)",
                          cursor: "pointer",
                          flex: 1,
                          fontSize: 13,
                          fontWeight: 600,
                          padding: "10px 14px",
                        }}
                        type="button"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Descrição <span style={{ color: "#ef445f" }}>*</span>
                <textarea
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva em detalhes o que você precisa..."
                  rows={4}
                  style={{
                    background: "#f9fcfa",
                    border: "1.5px solid #c9dbd1",
                    borderRadius: 8,
                    color: "var(--ink)",
                    fontFamily: "inherit",
                    fontSize: 14,
                    padding: "10px 14px",
                    resize: "vertical",
                  }}
                  value={descricao}
                />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setMostrando(false)}
                  style={{
                    background: "none",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    color: "var(--muted)",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "9px 18px",
                  }}
                  type="button"
                >
                  Cancelar
                </button>
                <button
                  disabled={!descricao.trim()}
                  onClick={handleEnviar}
                  style={{
                    background: !descricao.trim() ? "#c9dbd1" : "var(--green-700)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    cursor: !descricao.trim() ? "not-allowed" : "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "10px 22px",
                  }}
                  type="button"
                >
                  Enviar solicitação
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Minhas solicitações</h2>
              <p>{SOLICITACOES_MOCK.length} solicitações</p>
            </div>
          </div>
          <div style={{ padding: "0 20px 20px", overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["#", "Assunto", "Categoria", "Data", "Status", "Última resposta"].map((h) => (
                    <th
                      key={h}
                      style={{
                        color: "var(--muted)",
                        fontSize: 11,
                        fontWeight: 700,
                        letterSpacing: "0.5px",
                        padding: "10px 8px",
                        textAlign: "left",
                        textTransform: "uppercase",
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SOLICITACOES_MOCK.map((sol) => {
                  const st = STATUS_STYLES[sol.status];
                  const isSelected = selecionada === sol.id;
                  return (
                    <tr
                      key={sol.id}
                      onClick={() => { setSelecionada(isSelected ? null : sol.id); setMostrando(false); }}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        cursor: "pointer",
                        background: isSelected ? "rgba(16,185,129,0.04)" : "transparent",
                        transition: "background 0.15s",
                      }}
                    >
                      <td style={{ padding: "10px 8px", fontWeight: 700, color: "var(--muted)" }}>{sol.id}</td>
                      <td style={{ padding: "10px 8px", fontWeight: 600 }}>{sol.assunto}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{
                          background: "rgba(99,102,241,0.08)",
                          borderRadius: 12,
                          color: "#4338ca",
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                        }}>
                          {sol.categoria}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", padding: "10px 8px" }}>{sol.data}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{
                          background: st.bg,
                          borderRadius: 20,
                          color: st.color,
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 10px",
                          textTransform: "uppercase",
                          letterSpacing: "0.3px",
                        }}>
                          {sol.status}
                        </span>
                      </td>
                      <td style={{ color: "var(--muted)", padding: "10px 8px" }}>
                        {sol.ultimaResposta || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chat section */}
        {solicitacaoSelecionada && (
          <div className="list-panel">
            <div className="list-panel-header">
              <div>
                <h2>#{solicitacaoSelecionada.id} — {solicitacaoSelecionada.assunto}</h2>
                <p>Histórico de mensagens</p>
              </div>
              <span style={{
                background: STATUS_STYLES[solicitacaoSelecionada.status].bg,
                borderRadius: 20,
                color: STATUS_STYLES[solicitacaoSelecionada.status].color,
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 12px",
                textTransform: "uppercase",
              }}>
                {solicitacaoSelecionada.status}
              </span>
            </div>
            <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              {solicitacaoSelecionada.mensagens.map((msg) => {
                const isCliente = msg.tipo === "cliente";
                return (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: isCliente ? "flex-end" : "flex-start",
                      background: isCliente ? "rgba(16,185,129,0.08)" : "rgba(99,102,241,0.06)",
                      border: `1px solid ${isCliente ? "rgba(16,185,129,0.2)" : "rgba(99,102,241,0.15)"}`,
                      borderRadius: 12,
                      maxWidth: "75%",
                      padding: "12px 16px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <strong style={{ fontSize: 12, color: isCliente ? "#065f46" : "#4338ca" }}>
                        {msg.autor}
                      </strong>
                      <span style={{ fontSize: 11, color: "var(--muted)" }}>{msg.data}</span>
                    </div>
                    <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>{msg.texto}</p>
                  </div>
                );
              })}
              {/* Reply box (visual only) */}
              <div style={{
                borderTop: "1px solid var(--border)",
                display: "flex",
                gap: 10,
                marginTop: 8,
                paddingTop: 14,
              }}>
                <input
                  placeholder="Digite sua mensagem..."
                  style={{
                    background: "#f9fcfa",
                    border: "1.5px solid #c9dbd1",
                    borderRadius: 8,
                    flex: 1,
                    fontFamily: "inherit",
                    fontSize: 13,
                    padding: "10px 14px",
                  }}
                  type="text"
                />
                <button
                  style={{
                    background: "var(--green-700)",
                    border: "none",
                    borderRadius: 8,
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "10px 18px",
                  }}
                  type="button"
                >
                  Enviar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </PortalShell>
  );
}
