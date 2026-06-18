"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PortalShell } from "@/components/portal/PortalShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

type Chamado = {
  id: string;
  assunto: string;
  data: string;
  descricao: string;
  responsavel: string;
  status: "aberto" | "em_andamento" | "resolvido";
  tipo: string;
};

const CHAMADOS_MOCK: Chamado[] = [
  {
    assunto: "Dúvida sobre guia DAS",
    data: "2026-06-15",
    descricao: "Preciso entender como foi calculado o valor da guia de junho.",
    id: "1",
    responsavel: "Setor Fiscal",
    status: "resolvido",
    tipo: "Dúvida",
  },
  {
    assunto: "Solicitação de certidão negativa",
    data: "2026-06-17",
    descricao: "Necessito da certidão negativa de débitos para apresentar ao banco.",
    id: "2",
    responsavel: "Setor Contábil",
    status: "em_andamento",
    tipo: "Solicitação",
  },
  {
    assunto: "Alteração no quadro societário",
    data: "2026-06-18",
    descricao: "Preciso incluir um novo sócio na empresa.",
    id: "3",
    responsavel: "Setor Societário",
    status: "aberto",
    tipo: "Alteração",
  },
];

const STATUS_LABEL = {
  aberto: "Aberto",
  em_andamento: "Em andamento",
  resolvido: "Resolvido",
};

export default function PortalChamados() {
  const params = useParams();
  const empresaId = params.empresaId as string;
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [mostrando, setMostrando] = useState(false);
  const [assunto, setAssunto] = useState("");
  const [tipo, setTipo] = useState("Dúvida");
  const [descricao, setDescricao] = useState("");
  const [enviado, setEnviado] = useState(false);

  useEffect(() => {
    buscarEmpresaTenant(empresaId).then(setEmpresa).catch(() => {});
  }, [empresaId]);

  function handleEnviar() {
    if (!assunto.trim() || !descricao.trim()) return;
    setEnviado(true);
    setMostrando(false);
    setAssunto(""); setTipo("Dúvida"); setDescricao("");
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

  return (
    <PortalShell empresaId={empresaId} empresaNome={nome}>
      <div className="page-stack">

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, margin: "0 0 4px" }}>Chamados</h1>
            <p style={{ color: "var(--muted)", fontSize: 13, margin: 0 }}>Abra e acompanhe solicitações ao escritório.</p>
          </div>
          <button onClick={() => setMostrando(true)} type="button">+ Novo chamado</button>
        </div>

        {enviado && (
          <p className="status-message">✓ Chamado aberto! O escritório entrará em contato em breve.</p>
        )}

        {/* Formulário novo chamado */}
        {mostrando && (
          <div className="list-panel" style={{ padding: 20 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700 }}>Novo chamado</h3>
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Tipo
                  <select
                    className="input"
                    onChange={(e) => setTipo(e.target.value)}
                    value={tipo}
                  >
                    {["Dúvida", "Solicitação", "Alteração", "Reclamação", "Outros"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Assunto <span style={{ color: "#ef445f" }}>*</span>
                  <input
                    className="input"
                    onChange={(e) => setAssunto(e.target.value)}
                    placeholder="Descreva brevemente o assunto"
                    value={assunto}
                  />
                </label>
              </div>
              <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Descrição <span style={{ color: "#ef445f" }}>*</span>
                <textarea
                  onChange={(e) => setDescricao(e.target.value)}
                  placeholder="Descreva em detalhes o que você precisa..."
                  rows={4}
                  style={{ border: "1.5px solid #c9dbd1", borderRadius: 8, background: "#f9fcfa", color: "var(--ink)", padding: "10px 14px", resize: "vertical", fontSize: 14, fontFamily: "inherit" }}
                  value={descricao}
                />
              </label>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="small-action" onClick={() => setMostrando(false)} type="button">Cancelar</button>
                <button disabled={!assunto.trim() || !descricao.trim()} onClick={handleEnviar} type="button">Enviar chamado</button>
              </div>
            </div>
          </div>
        )}

        {/* Lista de chamados */}
        <div className="chamado-list">
          {CHAMADOS_MOCK.map((chamado) => (
            <div className="chamado-card" key={chamado.id}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <span className={`chamado-status ${chamado.status}`}>
                    {STATUS_LABEL[chamado.status]}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {chamado.tipo}
                  </span>
                  <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: "auto" }}>
                    {new Date(chamado.data).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <strong style={{ fontSize: 14 }}>{chamado.assunto}</strong>
                <p style={{ margin: "4px 0 6px", fontSize: 13, color: "var(--muted)" }}>{chamado.descricao}</p>
                <div style={{ fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
                  Responsável: {chamado.responsavel}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </PortalShell>
  );
}
