"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  criarEmpresaTenant,
  listarEmpresasTenant,
  setEmpresaAtivaId,
} from "@/services/empresaClientService";
import type { CriarEmpresaInput, Empresa } from "@/modules/empresas/empresas.types";

/* ─── Constantes ──────────────────────────────────────────────── */

const REGIMES = [
  { label: "Simples Nacional", value: "simples_nacional" },
  { label: "Lucro Presumido", value: "lucro_presumido" },
  { label: "Lucro Real", value: "lucro_real" },
  { label: "MEI", value: "mei" },
];

const NATUREZAS = [
  "Empresário Individual (EI)",
  "Microempreendedor Individual (MEI)",
  "Empresa Individual de Responsabilidade Limitada (EIRELI)",
  "Sociedade Limitada (LTDA)",
  "Sociedade Limitada Unipessoal (SLU)",
  "Sociedade Anônima (S.A.)",
  "Sociedade Simples",
];

const PORTES = ["MEI", "Microempresa (ME)", "Empresa de Pequeno Porte (EPP)", "Médio Porte", "Grande Porte"];

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

const STEPS = [
  { number: 1, title: "Planejamento e Estruturação" },
  { number: 2, title: "Legalização e CNPJ" },
  { number: 3, title: "Inscrições e Licenciamento" },
];

/* ─── Tipos do formulário ─────────────────────────────────────── */

type FormData = {
  // Step 1
  nome_legal: string;
  nome_fantasia: string;
  natureza_juridica: string;
  porte: string;
  cnae_principal: string;
  cnae_descricao: string;
  regime_tributario: string;
  // Step 2
  certificado_digital: string;
  viabilidade_status: string;
  viabilidade_numero: string;
  dbe_status: string;
  dbe_numero: string;
  contrato_social_status: string;
  contrato_social_obs: string;
  registro_orgao: string;
  registro_numero: string;
  cnpj: string;
  // Step 3
  inscricao_estadual: string;
  inscricao_estadual_status: string;
  inscricao_municipal: string;
  inscricao_municipal_status: string;
  alvara_numero: string;
  alvara_validade: string;
  alvara_status: string;
};

const EMPTY_FORM: FormData = {
  nome_legal: "",
  nome_fantasia: "",
  natureza_juridica: "",
  porte: "",
  cnae_principal: "",
  cnae_descricao: "",
  regime_tributario: "",
  certificado_digital: "",
  viabilidade_status: "pendente",
  viabilidade_numero: "",
  dbe_status: "pendente",
  dbe_numero: "",
  contrato_social_status: "pendente",
  contrato_social_obs: "",
  registro_orgao: "",
  registro_numero: "",
  cnpj: "",
  inscricao_estadual: "",
  inscricao_estadual_status: "pendente",
  inscricao_municipal: "",
  inscricao_municipal_status: "pendente",
  alvara_numero: "",
  alvara_validade: "",
  alvara_status: "pendente",
};

/* ─── Componentes auxiliares ──────────────────────────────────── */

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary, #ccc)" }}>
      {label}{required && <span style={{ color: "#f87171", marginLeft: 2 }}>*</span>}
      {children}
    </label>
  );
}

function Input({ value, onChange, name, placeholder, type = "text" }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      className="input"
      name={name}
      onChange={onChange}
      placeholder={placeholder}
      style={{ marginTop: 2 }}
      type={type}
      value={value}
    />
  );
}

function Select({ value, onChange, name, children }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name: string;
  children: React.ReactNode;
}) {
  return (
    <select
      className="input"
      name={name}
      onChange={onChange}
      style={{ marginTop: 2 }}
      value={value}
    >
      {children}
    </select>
  );
}

function StatusSelect({ value, onChange, name }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  name: string;
}) {
  return (
    <Select name={name} onChange={onChange} value={value}>
      <option value="pendente">Pendente</option>
      <option value="em_andamento">Em andamento</option>
      <option value="concluido">Concluído</option>
      <option value="nao_aplicavel">Não aplicável</option>
    </Select>
  );
}

/* ─── Página principal ────────────────────────────────────────── */

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
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

  function abrirDrawer() {
    setForm(EMPTY_FORM);
    setStep(1);
    setErroForm(null);
    setShowDrawer(true);
  }

  function fecharDrawer() {
    setShowDrawer(false);
  }

  function avancar() {
    if (step === 1 && !form.nome_legal.trim()) {
      setErroForm("Razão social é obrigatória.");
      return;
    }
    setErroForm(null);
    setStep((s) => Math.min(s + 1, 3));
  }

  function voltar() {
    setErroForm(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  async function handleSubmit() {
    setSalvando(true);
    setErroForm(null);
    try {
      const payload: CriarEmpresaInput & { metadata?: Record<string, unknown> } = {
        nome_legal: form.nome_legal,
        nome_fantasia: form.nome_fantasia || undefined,
        cnpj: form.cnpj || undefined,
        regime_tributario: form.regime_tributario || undefined,
        metadata: {
          natureza_juridica: form.natureza_juridica,
          porte: form.porte,
          cnae_principal: form.cnae_principal,
          cnae_descricao: form.cnae_descricao,
          certificado_digital: form.certificado_digital,
          viabilidade: { status: form.viabilidade_status, numero: form.viabilidade_numero },
          dbe: { status: form.dbe_status, numero: form.dbe_numero },
          contrato_social: { status: form.contrato_social_status, obs: form.contrato_social_obs },
          registro_orgao: { orgao: form.registro_orgao, numero: form.registro_numero },
          inscricao_estadual: { numero: form.inscricao_estadual, status: form.inscricao_estadual_status },
          inscricao_municipal: { numero: form.inscricao_municipal, status: form.inscricao_municipal_status },
          alvara: { numero: form.alvara_numero, validade: form.alvara_validade, status: form.alvara_status },
        },
      };

      await criarEmpresaTenant(payload);
      setShowDrawer(false);
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
        {/* Cabeçalho */}
        <div className="module-hero">
          <div>
            <h1>Empresas</h1>
            <p>Gerencie as empresas cadastradas no sistema.</p>
          </div>
          <div className="hero-actions">
            <button onClick={abrirDrawer} type="button">+ Nova empresa</button>
          </div>
        </div>

        {/* Lista */}
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
            <button className="small-action" onClick={carregarEmpresas} type="button">Atualizar</button>
          </div>

          {loading && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Carregando...</div>
          )}
          {erro && <p className="error-alert" style={{ margin: "1rem 1.5rem" }}>{erro}</p>}

          {!loading && !erro && empresas.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <p>Nenhuma empresa cadastrada ainda.</p>
              <button onClick={abrirDrawer} style={{ marginTop: "1rem" }} type="button">+ Criar primeira empresa</button>
            </div>
          )}

          {!loading && empresas.length > 0 && (
            <div style={{ padding: "0 1.5rem 1.5rem", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Razão social", "CNPJ", "Regime", "Cidade / UF", "Status", "Ação"].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 5 ? "right" : "left", padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {empresas.map((empresa) => (
                    <tr key={empresa.id} style={{ borderBottom: "1px solid var(--border)", background: empresaAtiva === empresa.id ? "rgba(74,222,128,0.05)" : undefined }}>
                      <td style={{ padding: "0.875rem 0.5rem" }}>
                        <strong>{empresa.nome_legal}</strong>
                        {empresa.nome_fantasia && <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{empresa.nome_fantasia}</div>}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>{empresa.cnpj ?? "—"}</td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {REGIMES.find((r) => r.value === empresa.regime_tributario)?.label ?? empresa.regime_tributario ?? "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {[empresa.cidade, empresa.estado].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem" }}>
                        <span className={`priority-badge ${STATUS_CLASS[empresa.status]}`}>{STATUS_LABEL[empresa.status]}</span>
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "right" }}>
                        {empresaAtiva === empresa.id ? (
                          <span style={{ fontSize: "0.8rem", color: "#4ade80", fontWeight: 600 }}>✓ Ativa</span>
                        ) : (
                          <button className="small-action" onClick={() => handleAtivar(empresa.id)} type="button">Ativar</button>
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

      {/* Overlay + Drawer */}
      {showDrawer && (
        <>
          {/* Fundo escuro */}
          <div
            onClick={fecharDrawer}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 40,
            }}
          />

          {/* Painel lateral */}
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0,
            width: "min(720px, 100vw)",
            background: "var(--surface, #1a1f2e)",
            borderLeft: "1px solid var(--border)",
            zIndex: 50,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}>
            {/* Cabeçalho do drawer */}
            <div style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Nova empresa</h2>
                <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)" }}>
                  Etapa {step} de 3 — {STEPS[step - 1].title}
                </p>
              </div>
              <button
                onClick={fecharDrawer}
                style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "1.4rem", cursor: "pointer", padding: "0.25rem 0.5rem" }}
                type="button"
              >
                ×
              </button>
            </div>

            {/* Steps */}
            <div style={{ display: "flex", borderBottom: "1px solid var(--border)" }}>
              {STEPS.map((s) => (
                <button
                  key={s.number}
                  onClick={() => { setErroForm(null); setStep(s.number); }}
                  style={{
                    flex: 1,
                    padding: "0.85rem 0.5rem",
                    background: "none",
                    border: "none",
                    borderBottom: step === s.number ? "2px solid #4ade80" : "2px solid transparent",
                    color: step === s.number ? "#4ade80" : "var(--text-muted)",
                    fontWeight: step === s.number ? 700 : 400,
                    fontSize: "0.78rem",
                    cursor: "pointer",
                    textAlign: "center",
                    transition: "all 0.15s",
                  }}
                  type="button"
                >
                  <span style={{
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                    width: 20, height: 20, borderRadius: "50%",
                    background: step === s.number ? "#4ade80" : "var(--border)",
                    color: step === s.number ? "#000" : "var(--text-muted)",
                    fontSize: "0.72rem", fontWeight: 700,
                    marginRight: "0.4rem",
                  }}>{s.number}</span>
                  {s.title}
                </button>
              ))}
            </div>

            {/* Corpo do formulário */}
            <div style={{ flex: 1, overflowY: "auto", padding: "1.75rem 2rem" }}>
              {erroForm && <p className="error-alert" style={{ marginBottom: "1rem" }}>{erroForm}</p>}

              {/* ── STEP 1 ── */}
              {step === 1 && (
                <div style={{ display: "grid", gap: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <Field label="Razão social" required>
                      <Input name="nome_legal" onChange={handleChange} placeholder="Nome legal da empresa" value={form.nome_legal} />
                    </Field>
                    <Field label="Nome fantasia">
                      <Input name="nome_fantasia" onChange={handleChange} placeholder="Nome fantasia" value={form.nome_fantasia} />
                    </Field>
                  </div>

                  <div style={{ height: 1, background: "var(--border)", margin: "0.25rem 0" }} />

                  <Field label="Natureza Jurídica">
                    <Select name="natureza_juridica" onChange={handleChange} value={form.natureza_juridica}>
                      <option value="">Selecione...</option>
                      {NATUREZAS.map((n) => <option key={n} value={n}>{n}</option>)}
                    </Select>
                  </Field>

                  <Field label="Porte da Empresa">
                    <Select name="porte" onChange={handleChange} value={form.porte}>
                      <option value="">Selecione...</option>
                      {PORTES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </Select>
                  </Field>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                    <Field label="CNAE Principal (código)">
                      <Input name="cnae_principal" onChange={handleChange} placeholder="Ex: 6920-6/01" value={form.cnae_principal} />
                    </Field>
                    <Field label="Descrição da atividade">
                      <Input name="cnae_descricao" onChange={handleChange} placeholder="Ex: Atividades de contabilidade" value={form.cnae_descricao} />
                    </Field>
                  </div>

                  <Field label="Regime Tributário">
                    <Select name="regime_tributario" onChange={handleChange} value={form.regime_tributario}>
                      <option value="">Selecione...</option>
                      {REGIMES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </Select>
                  </Field>
                </div>
              )}

              {/* ── STEP 2 ── */}
              {step === 2 && (
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <Field label="Certificado Digital">
                    <Select name="certificado_digital" onChange={handleChange} value={form.certificado_digital}>
                      <option value="">Selecione...</option>
                      <option value="a1">A1 (arquivo)</option>
                      <option value="a3">A3 (token/cartão)</option>
                      <option value="nao_possui">Não possui</option>
                      <option value="em_processo">Em processo de emissão</option>
                    </Select>
                  </Field>

                  <div style={{ height: 1, background: "var(--border)" }} />

                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.85rem" }}>Viabilidade</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="Status">
                        <StatusSelect name="viabilidade_status" onChange={handleChange} value={form.viabilidade_status} />
                      </Field>
                      <Field label="Número / Protocolo">
                        <Input name="viabilidade_numero" onChange={handleChange} placeholder="Nº do protocolo" value={form.viabilidade_numero} />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.85rem" }}>DBE — Documento Básico de Entrada</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="Status">
                        <StatusSelect name="dbe_status" onChange={handleChange} value={form.dbe_status} />
                      </Field>
                      <Field label="Número do DBE">
                        <Input name="dbe_numero" onChange={handleChange} placeholder="Número do DBE" value={form.dbe_numero} />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.85rem" }}>Contrato Social / Requerimento</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="Status">
                        <StatusSelect name="contrato_social_status" onChange={handleChange} value={form.contrato_social_status} />
                      </Field>
                      <Field label="Observações">
                        <Input name="contrato_social_obs" onChange={handleChange} placeholder="Observações" value={form.contrato_social_obs} />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.85rem" }}>Registro no Órgão Competente</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="Órgão">
                        <Input name="registro_orgao" onChange={handleChange} placeholder="Ex: Junta Comercial, Cartório" value={form.registro_orgao} />
                      </Field>
                      <Field label="Número do Registro">
                        <Input name="registro_numero" onChange={handleChange} placeholder="Nº do registro" value={form.registro_numero} />
                      </Field>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "var(--border)" }} />

                  <Field label="CNPJ (após emissão)">
                    <Input name="cnpj" onChange={handleChange} placeholder="00.000.000/0000-00" value={form.cnpj} />
                  </Field>
                </div>
              )}

              {/* ── STEP 3 ── */}
              {step === 3 && (
                <div style={{ display: "grid", gap: "1.5rem" }}>
                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.85rem" }}>Inscrição Estadual</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="Status">
                        <StatusSelect name="inscricao_estadual_status" onChange={handleChange} value={form.inscricao_estadual_status} />
                      </Field>
                      <Field label="Número da Inscrição Estadual">
                        <Input name="inscricao_estadual" onChange={handleChange} placeholder="Número da IE" value={form.inscricao_estadual} />
                      </Field>
                    </div>
                  </div>

                  <div style={{ height: 1, background: "var(--border)" }} />

                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.85rem" }}>Inscrição Municipal e Alvará</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="Status da Inscrição Municipal">
                        <StatusSelect name="inscricao_municipal_status" onChange={handleChange} value={form.inscricao_municipal_status} />
                      </Field>
                      <Field label="Número da Inscrição Municipal">
                        <Input name="inscricao_municipal" onChange={handleChange} placeholder="Número da IM" value={form.inscricao_municipal} />
                      </Field>
                    </div>
                  </div>

                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontWeight: 700, fontSize: "0.85rem" }}>Alvará de Funcionamento</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                      <Field label="Status">
                        <StatusSelect name="alvara_status" onChange={handleChange} value={form.alvara_status} />
                      </Field>
                      <Field label="Número do Alvará">
                        <Input name="alvara_numero" onChange={handleChange} placeholder="Nº do alvará" value={form.alvara_numero} />
                      </Field>
                      <Field label="Validade">
                        <Input name="alvara_validade" onChange={handleChange} type="date" value={form.alvara_validade} />
                      </Field>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé com navegação */}
            <div style={{
              padding: "1.25rem 2rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "var(--surface)",
            }}>
              <button
                className="small-action"
                disabled={step === 1}
                onClick={voltar}
                style={{ opacity: step === 1 ? 0.4 : 1 }}
                type="button"
              >
                ← Anterior
              </button>

              <div style={{ display: "flex", gap: 6 }}>
                {STEPS.map((s) => (
                  <div key={s.number} style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: step === s.number ? "#4ade80" : "var(--border)",
                    transition: "background 0.2s",
                  }} />
                ))}
              </div>

              {step < 3 ? (
                <button onClick={avancar} type="button">Próximo →</button>
              ) : (
                <button disabled={salvando} onClick={handleSubmit} type="button">
                  {salvando ? "Salvando..." : "✓ Criar empresa"}
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
