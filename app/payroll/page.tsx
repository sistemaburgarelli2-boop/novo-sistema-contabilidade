"use client";

import { useEffect, useState } from "react";
import { getActiveCompanyId } from "@/services/companyService";
import type { FolhaPagamento, Holerite } from "@/modules/payroll/payroll.types";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  calculada: "Calculada",
  aprovada: "Aprovada",
  paga: "Paga",
  cancelada: "Cancelada",
};

const STATUS_COLOR: Record<string, string> = {
  rascunho: "#6b7280",
  calculada: "#2563eb",
  aprovada: "#059669",
  paga: "#0b9e60",
  cancelada: "#dc2626",
};

export default function PayrollPage() {
  const [folhas, setFolhas] = useState<FolhaPagamento[]>([]);
  const [holerites, setHolerites] = useState<Holerite[]>([]);
  const [folhaSelecionada, setFolhaSelecionada] = useState<string | null>(null);
  const [competencia, setCompetencia] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const empresaId = getActiveCompanyId();

  async function carregarFolhas() {
    if (!empresaId) return;
    const r = await fetch(`/api/payroll?empresa_id=${empresaId}`);
    const json = await r.json();
    if (r.ok) setFolhas(json.data ?? []);
  }

  async function carregarHolerites(folhaId: string) {
    const r = await fetch(`/api/payroll/${folhaId}`);
    const json = await r.json();
    if (r.ok) {
      setHolerites(json.data ?? []);
      setFolhaSelecionada(folhaId);
    }
  }

  async function criarFolha() {
    if (!empresaId) return;
    setLoading(true);
    setErro(null);
    try {
      const r = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresa_id: empresaId, competencia }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      setMsg(`Folha ${competencia} criada.`);
      await carregarFolhas();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  async function acao(folhaId: string, acao: "calcular" | "aprovar") {
    setLoading(true);
    setErro(null);
    try {
      const r = await fetch(`/api/payroll/${folhaId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      setMsg(acao === "calcular" ? "Folha calculada." : "Folha aprovada.");
      await carregarFolhas();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregarFolhas(); }, [empresaId]);

  if (!empresaId) {
    return (
      <div className="page-stack">
        <div className="empty-state"><h2>Selecione uma empresa</h2></div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="module-hero">
        <div>
          <h1>Folha de Pagamento</h1>
          <p>Cálculo automático de INSS, IRRF e FGTS — tabelas 2024</p>
        </div>
        <div className="hero-actions" style={{ gap: 8 }}>
          <input
            type="month"
            value={competencia}
            onChange={(e) => setCompetencia(e.target.value)}
            style={{ minHeight: 36, fontSize: 13 }}
          />
          <button onClick={criarFolha} disabled={loading} style={{ minHeight: 36 }}>
            + Nova Folha
          </button>
        </div>
      </div>

      {erro && <p className="error-alert">{erro}</p>}
      {msg && <p className="status-message">{msg}</p>}

      <div className="panel-section">
        <h2>Folhas de Pagamento</h2>
        {folhas.length === 0 ? (
          <div className="empty-state"><p>Nenhuma folha criada. Crie a primeira folha acima.</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Competência</th>
                <th>Status</th>
                <th>Proventos</th>
                <th>Descontos</th>
                <th>Líquido</th>
                <th>FGTS</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {folhas.map((f) => (
                <tr key={f.id}>
                  <td>{f.competencia}</td>
                  <td>
                    <span className="badge" style={{ background: STATUS_COLOR[f.status] + "22", color: STATUS_COLOR[f.status] }}>
                      {STATUS_LABEL[f.status]}
                    </span>
                  </td>
                  <td>{fmt(f.total_proventos)}</td>
                  <td>{fmt(f.total_descontos)}</td>
                  <td><strong>{fmt(f.total_liquido)}</strong></td>
                  <td>{fmt(f.total_encargos)}</td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="small-action" onClick={() => carregarHolerites(f.id)}>Ver</button>
                    {f.status === "rascunho" && (
                      <button className="small-action" onClick={() => acao(f.id, "calcular")}>Calcular</button>
                    )}
                    {f.status === "calculada" && (
                      <button className="small-action" onClick={() => acao(f.id, "aprovar")}>Aprovar</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {folhaSelecionada && holerites.length > 0 && (
        <div className="panel-section">
          <h2>Holerites da Folha</h2>
          <table className="data-table">
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Salário Base</th>
                <th>INSS</th>
                <th>IRRF</th>
                <th>FGTS</th>
                <th>Líquido</th>
              </tr>
            </thead>
            <tbody>
              {holerites.map((h) => (
                <tr key={h.id}>
                  <td>{h.funcionarios?.nome ?? "—"}</td>
                  <td>{fmt(h.salario_base)}</td>
                  <td>{fmt(h.inss)}</td>
                  <td>{fmt(h.irrf)}</td>
                  <td>{fmt(h.fgts)}</td>
                  <td><strong>{fmt(h.liquido)}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
