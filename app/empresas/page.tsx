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

const PORTES = [
  "MEI",
  "Microempresa (ME)",
  "Empresa de Pequeno Porte (EPP)",
  "Médio Porte",
  "Grande Porte",
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

const STEPS = [
  { number: 1, title: "Planejamento e Estruturação" },
  { number: 2, title: "Legalização e CNPJ" },
  { number: 3, title: "Inscrições e Licenciamento" },
];

const DRAFT_KEY = "empresas_rascunhos";

/* ─── Tipos ───────────────────────────────────────────────────── */

type FormData = {
  nome_legal: string; nome_fantasia: string;
  natureza_juridica: string; porte: string;
  cnae_principal: string; cnae_descricao: string;
  regime_tributario: string;
  certificado_digital: string;
  viabilidade_status: string; viabilidade_numero: string;
  dbe_status: string; dbe_numero: string;
  contrato_social_status: string; contrato_social_obs: string;
  registro_orgao: string; registro_numero: string; cnpj: string;
  inscricao_estadual: string; inscricao_estadual_status: string;
  inscricao_municipal: string; inscricao_municipal_status: string;
  alvara_numero: string; alvara_validade: string; alvara_status: string;
};

type Rascunho = FormData & { id: string; salvo_em: string };

const EMPTY_FORM: FormData = {
  nome_legal: "", nome_fantasia: "",
  natureza_juridica: "", porte: "",
  cnae_principal: "", cnae_descricao: "",
  regime_tributario: "",
  certificado_digital: "",
  viabilidade_status: "pendente", viabilidade_numero: "",
  dbe_status: "pendente", dbe_numero: "",
  contrato_social_status: "pendente", contrato_social_obs: "",
  registro_orgao: "", registro_numero: "", cnpj: "",
  inscricao_estadual: "", inscricao_estadual_status: "pendente",
  inscricao_municipal: "", inscricao_municipal_status: "pendente",
  alvara_numero: "", alvara_validade: "", alvara_status: "pendente",
};

/* ─── Helpers de rascunho ─────────────────────────────────────── */

function lerRascunhos(): Rascunho[] {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]"); }
  catch { return []; }
}

function salvarRascunhos(lista: Rascunho[]) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(lista));
}

/* ─── Subcomponentes ──────────────────────────────────────────── */

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 700, color: "#3a5c47" }}>
      <span>{label}{required && <span style={{ color: "#ef445f", marginLeft: 3 }}>*</span>}</span>
      {children}
    </label>
  );
}

function Inp({ value, name, onChange, placeholder, type = "text" }: {
  value: string; name: string; placeholder?: string; type?: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return <input className="input" name={name} onChange={onChange} placeholder={placeholder} type={type} value={value} />;
}

function Sel({ value, name, onChange, children }: {
  value: string; name: string; children: React.ReactNode;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return <select className="input" name={name} onChange={onChange} value={value}>{children}</select>;
}

function StatusSel({ value, name, onChange }: {
  value: string; name: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}) {
  return (
    <Sel name={name} onChange={onChange} value={value}>
      <option value="pendente">Pendente</option>
      <option value="em_andamento">Em andamento</option>
      <option value="concluido">Concluído</option>
      <option value="nao_aplicavel">Não aplicável</option>
    </Sel>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#dfece5", margin: "0.25rem 0" }} />;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "0 0 0.6rem", fontWeight: 800, fontSize: "0.8rem", color: "#0b351e", letterSpacing: "0.4px", textTransform: "uppercase" }}>{children}</p>;
}

/* ─── Página ──────────────────────────────────────────────────── */

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [rascunhos, setRascunhos] = useState<Rascunho[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState<string | null>(null);
  const [empresaAtiva, setEmpresaAtiva] = useState<string | null>(null);
  const [rascunhoSalvo, setRascunhoSalvo] = useState(false);

  useEffect(() => {
    setEmpresaAtiva(localStorage.getItem("empresaAtivaId"));
    setRascunhos(lerRascunhos());
    carregarEmpresas();
  }, []);

  async function carregarEmpresas() {
    setLoading(true); setErro(null);
    try { setEmpresas(await listarEmpresasTenant()); }
    catch (e) { setErro(e instanceof Error ? e.message : "Erro ao carregar empresas."); }
    finally { setLoading(false); }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setRascunhoSalvo(false);
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function abrirModal(rascunho?: Rascunho) {
    setForm(rascunho ?? EMPTY_FORM);
    setEditingId(rascunho?.id ?? null);
    setStep(1); setErroForm(null); setRascunhoSalvo(false);
    setShowModal(true);
  }

  function fecharModal() { setShowModal(false); setEditingId(null); }

  function avancar() {
    if (step === 1 && !form.nome_legal.trim()) {
      setErroForm("Razão social é obrigatória."); return;
    }
    setErroForm(null); setStep((s) => Math.min(s + 1, 3));
  }

  function voltar() { setErroForm(null); setStep((s) => Math.max(s - 1, 1)); }

  function handleSalvarRascunho() {
    const lista = lerRascunhos();
    if (editingId) {
      const idx = lista.findIndex((r) => r.id === editingId);
      if (idx !== -1) lista[idx] = { ...form, id: editingId, salvo_em: new Date().toISOString() };
    } else {
      const id = crypto.randomUUID();
      setEditingId(id);
      lista.push({ ...form, id, salvo_em: new Date().toISOString() });
    }
    salvarRascunhos(lista);
    setRascunhos(lista);
    setRascunhoSalvo(true);
  }

  function excluirRascunho(id: string) {
    const lista = lerRascunhos().filter((r) => r.id !== id);
    salvarRascunhos(lista); setRascunhos(lista);
  }

  async function handleCriar() {
    if (!form.nome_legal.trim()) { setErroForm("Razão social é obrigatória."); return; }
    setSalvando(true); setErroForm(null);
    try {
      const payload: CriarEmpresaInput & { metadata?: Record<string, unknown> } = {
        nome_legal: form.nome_legal,
        nome_fantasia: form.nome_fantasia || undefined,
        cnpj: form.cnpj || undefined,
        regime_tributario: form.regime_tributario || undefined,
        metadata: {
          natureza_juridica: form.natureza_juridica, porte: form.porte,
          cnae_principal: form.cnae_principal, cnae_descricao: form.cnae_descricao,
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
      if (editingId) excluirRascunho(editingId);
      fecharModal();
      await carregarEmpresas();
    } catch (e) {
      setErroForm(e instanceof Error ? e.message : "Erro ao criar empresa.");
    } finally { setSalvando(false); }
  }

  function handleAtivar(id: string) { setEmpresaAtivaId(id); setEmpresaAtiva(id); }

  /* ── Render ── */
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
            <button onClick={() => abrirModal()} type="button">+ Nova empresa</button>
          </div>
        </div>

        {/* ── Empresas cadastradas ── */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Empresas cadastradas</h2>
              <p>{empresas.length === 0 ? "Nenhuma empresa cadastrada." : `${empresas.length} empresa${empresas.length > 1 ? "s" : ""} encontrada${empresas.length > 1 ? "s" : ""}.`}</p>
            </div>
            <button className="small-action" onClick={carregarEmpresas} type="button">Atualizar</button>
          </div>

          {loading && <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>Carregando...</div>}
          {erro && <p className="error-alert" style={{ margin: "1rem 1.5rem" }}>{erro}</p>}
          {!loading && !erro && empresas.length === 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "var(--text-muted)" }}>
              <p>Nenhuma empresa cadastrada ainda.</p>
              <button onClick={() => abrirModal()} style={{ marginTop: "1rem" }} type="button">+ Criar primeira empresa</button>
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
                  {empresas.map((emp) => (
                    <tr key={emp.id} style={{ borderBottom: "1px solid var(--border)", background: empresaAtiva === emp.id ? "rgba(74,222,128,0.05)" : undefined }}>
                      <td style={{ padding: "0.875rem 0.5rem" }}>
                        <strong>{emp.nome_legal}</strong>
                        {emp.nome_fantasia && <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{emp.nome_fantasia}</div>}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>{emp.cnpj ?? "—"}</td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {REGIMES.find((r) => r.value === emp.regime_tributario)?.label ?? emp.regime_tributario ?? "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {[emp.cidade, emp.estado].filter(Boolean).join(" / ") || "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem" }}>
                        <span className={`priority-badge ${STATUS_CLASS[emp.status]}`}>{STATUS_LABEL[emp.status]}</span>
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "right" }}>
                        {empresaAtiva === emp.id
                          ? <span style={{ fontSize: "0.8rem", color: "#4ade80", fontWeight: 600 }}>✓ Ativa</span>
                          : <button className="small-action" onClick={() => handleAtivar(emp.id)} type="button">Ativar</button>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Empresas salvas (rascunhos) ── */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div>
              <h2>Empresas salvas</h2>
              <p>{rascunhos.length === 0 ? "Nenhum rascunho salvo." : `${rascunhos.length} rascunho${rascunhos.length > 1 ? "s" : ""} aguardando conclusão.`}</p>
            </div>
          </div>

          {rascunhos.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)", fontSize: "0.875rem" }}>
              Rascunhos de empresas em abertura aparecerão aqui.
            </div>
          )}

          {rascunhos.length > 0 && (
            <div style={{ padding: "0 1.5rem 1.5rem", overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Razão social", "Regime", "CNAE", "Salvo em", "Ações"].map((h, i) => (
                      <th key={h} style={{ textAlign: i === 4 ? "right" : "left", padding: "0.75rem 0.5rem", color: "var(--text-muted)", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rascunhos.map((r) => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "0.875rem 0.5rem" }}>
                        <strong>{r.nome_legal || <em style={{ color: "var(--text-muted)" }}>Sem nome</em>}</strong>
                        {r.nome_fantasia && <div style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>{r.nome_fantasia}</div>}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {REGIMES.find((rg) => rg.value === r.regime_tributario)?.label ?? "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)" }}>
                        {r.cnae_principal || "—"}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", color: "var(--text-muted)", fontSize: "0.8rem" }}>
                        {new Date(r.salvo_em).toLocaleString("pt-BR")}
                      </td>
                      <td style={{ padding: "0.875rem 0.5rem", textAlign: "right", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                        <button className="small-action" onClick={() => abrirModal(r)} type="button">Editar</button>
                        <button
                          onClick={() => excluirRascunho(r.id)}
                          style={{ background: "none", border: "1px solid #f87171", color: "#f87171", borderRadius: 6, padding: "0.3rem 0.75rem", fontSize: "0.78rem", cursor: "pointer" }}
                          type="button"
                        >
                          Excluir
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ── Modal centralizado ── */}
      {showModal && (
        <>
          <div onClick={fecharModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 40 }} />

          <div style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1.5rem",
            pointerEvents: "none",
          }}>
            <div style={{
              width: "100%", maxWidth: 760,
              maxHeight: "90vh",
              background: "#ffffff",
              borderRadius: 14,
              border: "1px solid #dfece5",
              boxShadow: "0 24px 80px rgba(7,23,13,0.18)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
              pointerEvents: "auto",
            }}>

              {/* Header */}
              <div style={{ padding: "1.4rem 1.75rem", borderBottom: "1px solid #dfece5", background: "#f3f8f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.05rem", color: "#06170d" }}>{editingId ? "Editar rascunho" : "Nova empresa"}</h2>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#6f8f7c" }}>
                    Etapa {step} de 3 — {STEPS[step - 1].title}
                  </p>
                </div>
                <button onClick={fecharModal} style={{ background: "none", border: "none", color: "#6f8f7c", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1, padding: "0 4px" }} type="button">×</button>
              </div>

              {/* Steps tabs */}
              <div style={{ display: "flex", borderBottom: "1px solid #dfece5", background: "#ffffff" }}>
                {STEPS.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => { setErroForm(null); setStep(s.number); }}
                    style={{
                      flex: 1, padding: "0.85rem 0.5rem",
                      background: "none", border: "none",
                      borderBottom: step === s.number ? "2px solid #10b981" : "2px solid transparent",
                      color: step === s.number ? "#075f3c" : "#6f8f7c",
                      fontWeight: step === s.number ? 700 : 500,
                      fontSize: "0.77rem", cursor: "pointer", textAlign: "center",
                    }}
                    type="button"
                  >
                    <span style={{
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                      width: 18, height: 18, borderRadius: "50%",
                      background: step === s.number ? "#10b981" : "#dfece5",
                      color: step === s.number ? "#ffffff" : "#6f8f7c",
                      fontSize: "0.68rem", fontWeight: 700, marginRight: "0.4rem",
                    }}>{s.number}</span>
                    {s.title}
                  </button>
                ))}
              </div>

              {/* Body */}
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.75rem", background: "#fafcfb" }}>
                {erroForm && <p className="error-alert" style={{ marginBottom: "1rem" }}>{erroForm}</p>}

                {/* Step 1 */}
                {step === 1 && (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="Razão social" required>
                        <Inp name="nome_legal" onChange={handleChange} placeholder="Nome legal da empresa" value={form.nome_legal} />
                      </Field>
                      <Field label="Nome fantasia">
                        <Inp name="nome_fantasia" onChange={handleChange} placeholder="Nome fantasia" value={form.nome_fantasia} />
                      </Field>
                    </div>
                    <Divider />
                    <Field label="Natureza Jurídica">
                      <Sel name="natureza_juridica" onChange={handleChange} value={form.natureza_juridica}>
                        <option value="">Selecione...</option>
                        {NATUREZAS.map((n) => <option key={n} value={n}>{n}</option>)}
                      </Sel>
                    </Field>
                    <Field label="Porte da Empresa">
                      <Sel name="porte" onChange={handleChange} value={form.porte}>
                        <option value="">Selecione...</option>
                        {PORTES.map((p) => <option key={p} value={p}>{p}</option>)}
                      </Sel>
                    </Field>
                    <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "1rem" }}>
                      <Field label="CNAE Principal (código)">
                        <Inp name="cnae_principal" onChange={handleChange} placeholder="Ex: 6920-6/01" value={form.cnae_principal} />
                      </Field>
                      <Field label="Descrição da atividade">
                        <Inp name="cnae_descricao" onChange={handleChange} placeholder="Ex: Atividades de contabilidade" value={form.cnae_descricao} />
                      </Field>
                    </div>
                    <Field label="Regime Tributário">
                      <Sel name="regime_tributario" onChange={handleChange} value={form.regime_tributario}>
                        <option value="">Selecione...</option>
                        {REGIMES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                      </Sel>
                    </Field>
                  </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                  <div style={{ display: "grid", gap: "1.25rem" }}>
                    <Field label="Certificado Digital">
                      <Sel name="certificado_digital" onChange={handleChange} value={form.certificado_digital}>
                        <option value="">Selecione...</option>
                        <option value="a1">A1 (arquivo)</option>
                        <option value="a3">A3 (token/cartão)</option>
                        <option value="em_processo">Em processo de emissão</option>
                        <option value="nao_possui">Não possui</option>
                      </Sel>
                    </Field>
                    <Divider />
                    <div>
                      <SectionTitle>Viabilidade</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <Field label="Status"><StatusSel name="viabilidade_status" onChange={handleChange} value={form.viabilidade_status} /></Field>
                        <Field label="Número / Protocolo"><Inp name="viabilidade_numero" onChange={handleChange} placeholder="Nº do protocolo" value={form.viabilidade_numero} /></Field>
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <SectionTitle>DBE — Documento Básico de Entrada</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <Field label="Status"><StatusSel name="dbe_status" onChange={handleChange} value={form.dbe_status} /></Field>
                        <Field label="Número do DBE"><Inp name="dbe_numero" onChange={handleChange} placeholder="Número do DBE" value={form.dbe_numero} /></Field>
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <SectionTitle>Contrato Social / Requerimento</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <Field label="Status"><StatusSel name="contrato_social_status" onChange={handleChange} value={form.contrato_social_status} /></Field>
                        <Field label="Observações"><Inp name="contrato_social_obs" onChange={handleChange} placeholder="Observações" value={form.contrato_social_obs} /></Field>
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <SectionTitle>Registro no Órgão Competente</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <Field label="Órgão"><Inp name="registro_orgao" onChange={handleChange} placeholder="Ex: Junta Comercial, Cartório" value={form.registro_orgao} /></Field>
                        <Field label="Número do Registro"><Inp name="registro_numero" onChange={handleChange} placeholder="Nº do registro" value={form.registro_numero} /></Field>
                      </div>
                    </div>
                    <Divider />
                    <Field label="CNPJ (após emissão)">
                      <Inp name="cnpj" onChange={handleChange} placeholder="00.000.000/0000-00" value={form.cnpj} />
                    </Field>
                  </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                  <div style={{ display: "grid", gap: "1.25rem" }}>
                    <div>
                      <SectionTitle>Inscrição Estadual</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <Field label="Status"><StatusSel name="inscricao_estadual_status" onChange={handleChange} value={form.inscricao_estadual_status} /></Field>
                        <Field label="Número da IE"><Inp name="inscricao_estadual" onChange={handleChange} placeholder="Número da Inscrição Estadual" value={form.inscricao_estadual} /></Field>
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <SectionTitle>Inscrição Municipal</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <Field label="Status"><StatusSel name="inscricao_municipal_status" onChange={handleChange} value={form.inscricao_municipal_status} /></Field>
                        <Field label="Número da IM"><Inp name="inscricao_municipal" onChange={handleChange} placeholder="Número da Inscrição Municipal" value={form.inscricao_municipal} /></Field>
                      </div>
                    </div>
                    <Divider />
                    <div>
                      <SectionTitle>Alvará de Funcionamento</SectionTitle>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
                        <Field label="Status"><StatusSel name="alvara_status" onChange={handleChange} value={form.alvara_status} /></Field>
                        <Field label="Número do Alvará"><Inp name="alvara_numero" onChange={handleChange} placeholder="Nº do alvará" value={form.alvara_numero} /></Field>
                        <Field label="Validade"><Inp name="alvara_validade" onChange={handleChange} type="date" value={form.alvara_validade} /></Field>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div style={{
                padding: "1.1rem 1.75rem",
                borderTop: "1px solid #dfece5",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "#f3f8f5",
                gap: "0.75rem",
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

                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {STEPS.map((s) => (
                    <div key={s.number} style={{ width: 7, height: 7, borderRadius: "50%", background: step === s.number ? "#10b981" : "#c9dbd1" }} />
                  ))}
                </div>

                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <button
                    onClick={handleSalvarRascunho}
                    style={{
                      background: rascunhoSalvo ? "#ecfdf5" : "#ffffff",
                      border: `1px solid ${rascunhoSalvo ? "#a7f3d0" : "#b9d3c6"}`,
                      color: rascunhoSalvo ? "#047857" : "#0b6040",
                      borderRadius: 8,
                      padding: "0.45rem 1rem",
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      fontWeight: 600,
                      transition: "all 0.2s",
                      minHeight: 36,
                    }}
                    type="button"
                  >
                    {rascunhoSalvo ? "✓ Salvo" : "Salvar rascunho"}
                  </button>

                  {step < 3 ? (
                    <button onClick={avancar} type="button">Próximo →</button>
                  ) : (
                    <button disabled={salvando} onClick={handleCriar} type="button">
                      {salvando ? "Salvando..." : "✓ Criar empresa"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
