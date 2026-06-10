"use client";

import { useEffect, useState } from "react";
import { getActiveCompanyId } from "@/services/companyService";
import type { DRE, Balanco } from "@/modules/contabilidade/contabilidade.types";

type Aba = "dre" | "balanco" | "lancamentos" | "plano-contas";

function fmt(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtSinal(valor: number) {
  const cor = valor >= 0 ? "var(--green-500)" : "var(--danger)";
  return <strong style={{ color: cor }}>{fmt(valor)}</strong>;
}

export default function ContabilidadePage() {
  const [aba, setAba] = useState<Aba>("dre");
  const [ano, setAno] = useState(new Date().getFullYear().toString());
  const [dre, setDre] = useState<DRE | null>(null);
  const [balanco, setBalanco] = useState<Balanco | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const empresaId = getActiveCompanyId();

  async function carregarDRE() {
    if (!empresaId) return;
    setLoading(true);
    setErro(null);
    try {
      const r = await fetch(`/api/contabilidade/${empresaId}/dre?ano=${ano}`);
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      setDre(json.data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar DRE.");
    } finally {
      setLoading(false);
    }
  }

  async function carregarBalanco() {
    if (!empresaId) return;
    setLoading(true);
    setErro(null);
    try {
      const data = `${ano}-12-31`;
      const r = await fetch(`/api/contabilidade/${empresaId}/balanco?data=${data}`);
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      setBalanco(json.data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar balanço.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (aba === "dre") carregarDRE();
    if (aba === "balanco") carregarBalanco();
  }, [aba, ano, empresaId]);

  if (!empresaId) {
    return (
      <div className="page-stack">
        <div className="empty-state">
          <h2>Nenhuma empresa selecionada</h2>
          <p>Selecione uma empresa ativa para acessar a contabilidade.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <div className="module-hero">
        <div>
          <h1>Contabilidade</h1>
          <p>DRE, Balanço Patrimonial, Lançamentos e Plano de Contas</p>
        </div>
        <div className="hero-actions">
          <select
            style={{ minHeight: 36, fontSize: 13, padding: "0 12px" }}
            value={ano}
            onChange={(e) => setAno(e.target.value)}
          >
            {[2022, 2023, 2024, 2025, 2026].map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="tab-bar" style={{ display: "flex", gap: 8, borderBottom: "1px solid var(--border)", paddingBottom: 0 }}>
        {(["dre", "balanco", "lancamentos", "plano-contas"] as Aba[]).map((t) => (
          <button
            key={t}
            onClick={() => setAba(t)}
            style={{
              minHeight: 36,
              background: aba === t ? "var(--green-500)" : "transparent",
              color: aba === t ? "#fff" : "var(--muted)",
              border: "none",
              borderRadius: "8px 8px 0 0",
              fontSize: 13,
              fontWeight: 600,
              padding: "0 16px",
              cursor: "pointer",
            }}
          >
            {t === "dre" ? "DRE" : t === "balanco" ? "Balanço Patrimonial" : t === "lancamentos" ? "Lançamentos" : "Plano de Contas"}
          </button>
        ))}
      </div>

      {erro && <p className="error-alert">{erro}</p>}
      {loading && <p className="status-message">Carregando...</p>}

      {aba === "dre" && dre && !loading && (
        <div className="panel-section">
          <h2>DRE — {dre.periodo_inicio.slice(0, 4)}</h2>
          <table className="data-table">
            <tbody>
              <tr><td>Receita Bruta</td><td>{fmtSinal(dre.receita_bruta)}</td></tr>
              <tr><td>(-) Deduções</td><td>{fmtSinal(-dre.deducoes)}</td></tr>
              <tr style={{ fontWeight: 700 }}><td>= Receita Líquida</td><td>{fmtSinal(dre.receita_liquida)}</td></tr>
              <tr><td>(-) Custos</td><td>{fmtSinal(-dre.custos)}</td></tr>
              <tr style={{ fontWeight: 700 }}><td>= Lucro Bruto</td><td>{fmtSinal(dre.lucro_bruto)}</td></tr>
              <tr><td>(-) Desp. Operacionais</td><td>{fmtSinal(-dre.despesas_operacionais)}</td></tr>
              <tr style={{ fontWeight: 700 }}><td>= EBIT</td><td>{fmtSinal(dre.ebit)}</td></tr>
              <tr><td>Resultado Financeiro</td><td>{fmtSinal(dre.resultado_financeiro)}</td></tr>
              <tr><td>(-) IR/CSLL</td><td>{fmtSinal(-dre.ir_csll)}</td></tr>
              <tr style={{ fontWeight: 800, borderTop: "2px solid var(--border)" }}>
                <td>= Lucro Líquido</td>
                <td>{fmtSinal(dre.lucro_liquido)}</td>
              </tr>
            </tbody>
          </table>
          {dre.linhas.length === 0 && (
            <div className="empty-state" style={{ marginTop: 12 }}>
              <p>Nenhum lançamento encontrado para o período. Cadastre lançamentos contábeis para gerar o DRE.</p>
            </div>
          )}
        </div>
      )}

      {aba === "balanco" && balanco && !loading && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="panel-section">
            <h2>Ativo — {fmt(balanco.ativo.total)}</h2>
            <strong style={{ fontSize: 13 }}>Circulante — {fmt(balanco.ativo.circulante.total)}</strong>
            {balanco.ativo.circulante.contas.map((c) => (
              <div key={c.codigo} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                <span>{c.codigo} — {c.nome}</span><span>{fmt(c.saldo)}</span>
              </div>
            ))}
            <strong style={{ fontSize: 13, marginTop: 8 }}>Não Circulante — {fmt(balanco.ativo.nao_circulante.total)}</strong>
            {balanco.ativo.nao_circulante.contas.map((c) => (
              <div key={c.codigo} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                <span>{c.codigo} — {c.nome}</span><span>{fmt(c.saldo)}</span>
              </div>
            ))}
          </div>
          <div className="panel-section">
            <h2>Passivo + PL — {fmt(balanco.total_passivo_pl)}</h2>
            <strong style={{ fontSize: 13 }}>Passivo Circulante — {fmt(balanco.passivo.circulante.total)}</strong>
            {balanco.passivo.circulante.contas.map((c) => (
              <div key={c.codigo} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                <span>{c.codigo} — {c.nome}</span><span>{fmt(c.saldo)}</span>
              </div>
            ))}
            <strong style={{ fontSize: 13, marginTop: 8 }}>Patrimônio Líquido — {fmt(balanco.patrimonio_liquido.total)}</strong>
            {balanco.patrimonio_liquido.contas.map((c) => (
              <div key={c.codigo} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 13 }}>
                <span>{c.codigo} — {c.nome}</span><span>{fmt(c.saldo)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {(aba === "lancamentos" || aba === "plano-contas") && !loading && (
        <div className="empty-state">
          <h2>{aba === "lancamentos" ? "Lançamentos Contábeis" : "Plano de Contas"}</h2>
          <p>
            {aba === "lancamentos"
              ? "Use a API POST /api/contabilidade/[empresaId]/lancamentos para registrar lançamentos por partidas dobradas."
              : "Use a API POST /api/contabilidade/[empresaId]/plano-contas para cadastrar as contas contábeis da empresa."}
          </p>
        </div>
      )}
    </div>
  );
}
