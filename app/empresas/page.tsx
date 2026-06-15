"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  criarEmpresaTenant,
  listarEmpresasTenant,
  setEmpresaAtivaId,
} from "@/services/empresaClientService";
import type { CriarEmpresaInput, Empresa } from "@/modules/empresas/empresas.types";

const REGIMES = [
  { label: "Simples Nacional", value: "simples_nacional" },
  { label: "Lucro Presumido", value: "lucro_presumido" },
  { label: "Lucro Real", value: "lucro_real" },
  { label: "MEI", value: "mei" },
];

const STATUS_LABEL: Record<Empresa["status"], string> = {
  ativa: "Ativa",
  cancelada: "Cancelada",
  encerrada: "Encerrada",
  suspensa: "Suspensa",
};

const STATUS_CLASS: Record<Empresa["status"], string> = {
  ativa: "badge-success",
  cancelada: "badge-danger",
  encerrada: "badge-neutral",
  suspensa: "badge-warning",
};

const EMPTY_FORM: CriarEmpresaInput = {
  nome_legal: "",
  nome_fantasia: "",
  cnpj: "",
  regime_tributario: "",
  cidade: "",
  estado: "",
};

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CriarEmpresaInput>(EMPTY_FORM);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [empresaAtiva, setEmpresaAtiva] = useState<string | null>(null);

  useEffect(() => {
    setEmpresaAtiva(localStorage.getItem("empresaAtivaId"));
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    setLoading(true);
    setErro(null);
    try {
      const data = await listarEmpresasTenant();
      setEmpresas(data);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar empresas.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome_legal.trim()) {
      setErroForm("Razão social é obrigatória.");
      return;
    }
    setSalvando(true);
    setErroForm(null);
    try {
      await criarEmpresaTenant(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await carregarEmpresas();
    } catch (e) {
      setErroForm(e instanceof Error ? e.message : "Erro ao criar empresa.");
    } finally {
      setSalvando(false);
    }
  }

  function handleAtivar(id: string) {
    setEmpresaAtivaId(id);
    setEmpresaAtiva(id);
  }

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Empresas</h1>
            <p>Gerencie as empresas cadastradas no sistema.</p>
          </div>
          <div className="hero-actions">
            <button onClick={() => { setShowForm(true); setErroForm(null); }} type="button">
              + Nova empresa
            </button>
          </div>
        </div>

        {showForm && (
          <div className="list-panel">
            <div className="list-panel-header">
              <div>
                <h2>Nova empresa</h2>
                <p>Preencha os dados para cadastrar uma nova empresa.</p>
              </div>
              <button className="small-action" onClick={() => setShowForm(false)} type="button">
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ padding: "1.5rem", display: "grid", gap: "1rem" }}>
              {erroForm && <p className="error-alert">{erroForm}</p>}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Razão social *
                  <input
                    className="input"
                    name="nome_legal"
                    onChange={handleChange}
                    placeholder="Nome legal da empresa"
                    required
                    type="text"
                    value={form.nome_legal}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Nome fantasia
                  <input
                    className="input"
                    name="nome_fantasia"
                    onChange={handleChange}
                    placeholder="Nome fantasia"
                    type="text"
                    value={form.nome_fantasia ?? ""}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  CNPJ
                  <input
                    className="input"
                    name="cnpj"
                    onChange={handleChange}
                    placeholder="00.000.000/0000-00"
                    type="text"
                    value={form.cnpj ?? ""}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Regime tributário
                  <select
                    className="input"
                    name="regime_tributario"
                    onChange={handleChange}
                    value={form.regime_tributario ?? ""}
                  >
                    <option value="">Selecione...</option>
                    {REGIMES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Cidade
                  <input
                    className="input"
                    name="cidade"
                    onChange={handleChange}
                    placeholder="Cidade"
                    type="text"
                    value={form.cidade ?? ""}
                  />
                </label>

                <label style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Estado (UF)
                  <input
                    className="input"
                    maxLength={2}
                    name="estado"
                    onChange={handleChange}
                    placeholder="SP"
                    type="text"
                    value={form.estado ?? ""}
                  />
                </label>
              </div>

              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button className="small-action" onClick={() => setShowForm(false)} type="button">
                  Cancelar
                </button>
                <button disabled={salvando} type="submit">
                  {salvando ? "Salvando..." : "Criar empresa"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Empresas cadastradas</h2>
              <p>
                {empresas.length === 0
                  ? "Nenhuma empresa cadastrada."
                  : `${empresas.length} empresa${empresas.length > 1 ? "s" : ""} encontrada${empresas.length > 1 ? "s" : ""}.`}
              </p>
            </div>
            <button className="small-action" onClick={carregarEmpresas} type="button">
              Atualizar
            </button>
          </div>

          {loading && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
              Carregando...
            </div>
          )}

          {erro && <p className="error-alert" style={{ margin: "1rem 1.5rem" }}>{erro}</p>}

          {!loading && !erro && empresas.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <p>Nenhuma empresa cadastrada ainda.</p>
              <button onClick={() => setShowForm(true)} style={{ marginTop: "1rem" }} type="button">
                + Criar primeira empresa
              </button>
            </div>
          )}

          {!loading && empresas.length > 0 && (
            <div style={{ padding: "0 1.5rem 1.5rem", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Razão social</th>
                    <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>CNPJ</th>
                    <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Regime</th>
                    <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Cidade / UF</th>
                    <th style={{ textAlign: "left", padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: "right", padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((empresa) => (
                    <tr
                      key={empresa.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: empresaAtiva === empresa.id ? "rgba(74,222,128,0.05)" : undefined,
                      }}
                    >
                      <td style={{ padding: "0.875rem 0.5rem" }}>
                        <strong>{empresa.nome_legal}</strong>
                        {empresa.nome_fantasia && (
                          <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{empresa.nome_fantasia}</div>
                        )}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {empresa.cnpj ?? "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {REGIMES.find((r) => r.value === empresa.regime_tributario)?.label ?? empresa.regime_tributario ?? "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {[empresa.cidade, empresa.estado].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem" }}>
                        <span className={`priority-badge ${STATUS_CLASS[empresa.status]}`}>
                          {STATUS_LABEL[empresa.status]}
                        </span>
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "right" }}>
                        {empresaAtiva === empresa.id ? (
                          <span style={{ fontSize: "0.8rem", color: "#4ade80", fontWeight: 600 }}>
                            ✓ Ativa
                          </span>
                        ) : (
                          <button
                            className="small-action"
                            onClick={() => handleAtivar(empresa.id)}
                            type="button"
                          >
                            Ativar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
