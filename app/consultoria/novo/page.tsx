"use client";

import { useState, useMemo, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Cores ─────────────────────────────────────────────────── */
const V = {
  bg: "#f3f8f5", panel: "#ffffff", ink: "#07170d", muted: "#6f8f7c",
  green700: "#075f3c", green500: "#10b981", green400: "#18d19b",
  gold: "#d4ae4a", border: "#dfece5", danger: "#ef445f",
  amber: "#f59e0b", red: "#ef4444",
};

/* ─── Formatter ─────────────────────────────────────────────── */
const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmt = (v: number) => BRL.format(v);

/* ─── Constantes ────────────────────────────────────────────── */
const STEPS = [
  { num: 1, key: "cliente", title: "Cliente" },
  { num: 2, key: "objetivo", title: "Objetivo" },
  { num: 3, key: "diagnostico", title: "Diagnóstico" },
  { num: 4, key: "tributacao", title: "Tributação" },
  { num: 5, key: "viabilidade", title: "Viabilidade" },
  { num: 6, key: "plano", title: "Plano" },
  { num: 7, key: "apresentacao", title: "Apresentação" },
  { num: 8, key: "aprovacao", title: "Aprovação" },
];

const FAIXAS_RENDA = ["Até R$ 3.000", "R$ 3.000 – 10.000", "R$ 10.000 – 30.000", "R$ 30.000 – 100.000", "Acima de R$ 100.000"];
const OBJETIVOS = ["Abrir empresa", "Reduzir impostos", "Migrar regime", "Formalizar operação", "Planejar crescimento", "Abrir filial", "Mudança CNAE", "Abrir sociedade"];
const REGIOES = ["Sul", "Sudeste", "Centro-Oeste", "Nordeste", "Norte"];
const NATUREZAS = ["EI", "MEI", "EIRELI", "LTDA", "SLU", "SA"];
const RESPONSAVEIS = ["Ana Lima", "Carlos Silva", "Marcos Souza"];

type RoadmapItem = { titulo: string; descricao: string; responsavel: string; prazo: string; status: string };
type ViabItem = { label: string; valor: string; checked: boolean };

type FormState = {
  /* step 1 */
  nome_completo: string; telefone: string; email: string; cpf: string;
  cidade: string; profissao: string; renda_atual: string; empresa_atual: string;
  ja_possui_cnpj: boolean; objetivo_principal: string; status_cliente: string;
  /* step 2 */
  objetivos: string[]; cenario_atual: string; prazo_desejado: string; meta_principal: string;
  /* step 3 */
  faturamento_estimado: number; custos_mensais: number; num_funcionarios: number;
  num_socios: number; pro_labore: number; tipo_produto: string; regiao: string;
  atende: string[];
  /* step 4 */
  regime_selecionado: string;
  /* step 5 */
  nome_empresarial: string; nome_empresarial_ok: boolean;
  cnae_principal: string; cnae_ok: boolean;
  natureza_juridica: string; capital_social: number;
  endereco_comercial: string; necessita_alvara: boolean;
  inscricao_estadual: boolean; licencas_especiais: string;
  viab_items: ViabItem[];
  /* step 6 */
  roadmap: RoadmapItem[];
  /* step 8 */
  status_aprovacao: string; observacao_aprovacao: string; data_aprovacao: string;
};

const today = () => { const d = new Date(); return d.toISOString().slice(0, 10); };
const addDays = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

const defaultRoadmap: RoadmapItem[] = [
  { titulo: "Definir atividade e CNAE", descricao: "Análise de atividades e enquadramento CNAE", responsavel: "Ana Lima", prazo: addDays(7), status: "Pendente" },
  { titulo: "Escolher regime tributário", descricao: "Simulação e definição do melhor regime", responsavel: "Ana Lima", prazo: addDays(14), status: "Pendente" },
  { titulo: "Documentação e contrato social", descricao: "Elaboração de contrato social e documentos", responsavel: "Carlos Silva", prazo: addDays(21), status: "Pendente" },
  { titulo: "Abrir empresa no órgão competente", descricao: "Registro na Junta Comercial / Cartório", responsavel: "Carlos Silva", prazo: addDays(28), status: "Pendente" },
  { titulo: "Conta bancária e certificado digital", descricao: "Abertura de conta PJ e emissão de certificado", responsavel: "Marcos Souza", prazo: addDays(35), status: "Pendente" },
  { titulo: "Primeira emissão de nota fiscal", descricao: "Configuração e teste de emissão de NF", responsavel: "Ana Lima", prazo: addDays(42), status: "Pendente" },
];

const initialForm: FormState = {
  nome_completo: "", telefone: "", email: "", cpf: "", cidade: "", profissao: "",
  renda_atual: "", empresa_atual: "", ja_possui_cnpj: false, objetivo_principal: "",
  status_cliente: "Novo",
  objetivos: [], cenario_atual: "", prazo_desejado: "", meta_principal: "",
  faturamento_estimado: 0, custos_mensais: 0, num_funcionarios: 0, num_socios: 1,
  pro_labore: 0, tipo_produto: "Serviços", regiao: "", atende: [],
  regime_selecionado: "",
  nome_empresarial: "", nome_empresarial_ok: false,
  cnae_principal: "", cnae_ok: false, natureza_juridica: "LTDA",
  capital_social: 0, endereco_comercial: "", necessita_alvara: false,
  inscricao_estadual: false, licencas_especiais: "",
  viab_items: [],
  roadmap: defaultRoadmap.map(r => ({ ...r })),
  status_aprovacao: "", observacao_aprovacao: "", data_aprovacao: today(),
};

/* ─── Styles helpers ────────────────────────────────────────── */
const sLabel: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: V.ink, marginBottom: 4 };
const sInput: React.CSSProperties = {
  width: "100%", padding: "8px 12px", border: `1px solid ${V.border}`, borderRadius: 8,
  fontSize: 14, color: V.ink, background: V.panel, outline: "none", boxSizing: "border-box",
};
const sTextarea: React.CSSProperties = { ...sInput, minHeight: 80, resize: "vertical" as const };
const sRow: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 };
const sRow3: React.CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 };
const sField: React.CSSProperties = { marginBottom: 16 };
const sSection: React.CSSProperties = { marginBottom: 24 };
const sCard: React.CSSProperties = {
  background: V.panel, border: `1px solid ${V.border}`, borderRadius: 12, padding: 20, marginBottom: 16,
};
const sBtnPrimary: React.CSSProperties = {
  padding: "10px 24px", background: V.green700, color: "#fff", border: "none",
  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
};
const sBtnSecondary: React.CSSProperties = {
  ...sBtnPrimary, background: "transparent", color: V.green700, border: `1px solid ${V.green700}`,
};

/* ─── Componentes auxiliares (fora do componente para evitar perda de foco) ── */
function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={sField}>
      <label style={sLabel}>{label}{required && <span style={{ color: V.danger }}> *</span>}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }} onClick={() => onChange(!checked)}>
      <div style={{
        width: 40, height: 22, borderRadius: 11, background: checked ? V.green500 : V.border,
        position: "relative", transition: "background .2s",
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: 9, background: "#fff", position: "absolute",
          top: 2, left: checked ? 20 : 2, transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,.2)",
        }} />
      </div>
      <span style={{ fontSize: 13, color: V.ink }}>{label}</span>
    </div>
  );
}

/* ─── COMPONENT ─────────────────────────────────────────────── */
export default function ConsultoriaNovaPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({ ...initialForm });
  const [saved, setSaved] = useState(false);

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
    setSaved(false);
  }, []);

  const setN = useCallback((k: keyof FormState, raw: string) => {
    const v = parseFloat(raw.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
    set(k, v as never);
  }, [set]);

  /* ─── Indicadores Step 3 ──────────────────────────────────── */
  const indicators = useMemo(() => {
    const f = form.faturamento_estimado;
    const fRange = f < 10000 ? 1 : f < 50000 ? 3 : f < 200000 ? 5 : f < 500000 ? 7 : 9;
    const complexity = Math.min(10, Math.round((form.num_funcionarios * 0.3 + form.num_socios * 1.5 + fRange) / 1.2));
    const risk = Math.min(10, Math.round((form.num_socios * 1.2 + (form.custos_mensais / Math.max(f, 1)) * 8 + (form.atende.includes("Exterior") ? 3 : 0))));
    const potential = Math.min(10, Math.max(1, 10 - Math.round(form.custos_mensais / Math.max(f, 1) * 10) + (form.atende.length)));
    return { complexity, risk, potential };
  }, [form.faturamento_estimado, form.custos_mensais, form.num_funcionarios, form.num_socios, form.atende]);

  /* ─── Tributação Step 4 ───────────────────────────────────── */
  const tributacao = useMemo(() => {
    const f = form.faturamento_estimado;
    const anual = f * 12;
    const isSvc = form.tipo_produto !== "Produtos";
    const isProd = form.tipo_produto === "Produtos";

    const meiValid = anual <= 81000;
    const meiImposto = meiValid ? 75.60 : null;
    const simplesRate = isProd ? 0.06 : 0.072;
    const presumidoRate = isProd ? 0.0586 : 0.108;
    const realRate = isProd ? 0.094 : 0.156;

    const inss = form.pro_labore * 0.11;

    const regimes = [
      {
        nome: "MEI", receita: f, imposto: meiImposto, valid: meiValid,
        carga: meiValid && f > 0 ? (75.60 / f * 100) : null,
        proLabore: form.pro_labore, inss: meiValid ? form.pro_labore * 0.05 : null,
        custoTotal: meiValid ? (75.60 + form.pro_labore * 0.05) : null,
        margem: meiValid && f > 0 ? f - 75.60 - form.pro_labore * 0.05 - form.custos_mensais : null,
      },
      {
        nome: "Simples", receita: f, imposto: f * simplesRate, valid: anual <= 4800000,
        carga: f > 0 ? simplesRate * 100 : 0,
        proLabore: form.pro_labore, inss,
        custoTotal: f * simplesRate + inss,
        margem: f > 0 ? f - f * simplesRate - inss - form.custos_mensais : 0,
      },
      {
        nome: "Presumido", receita: f, imposto: f * presumidoRate, valid: true,
        carga: f > 0 ? presumidoRate * 100 : 0,
        proLabore: form.pro_labore, inss,
        custoTotal: f * presumidoRate + inss,
        margem: f > 0 ? f - f * presumidoRate - inss - form.custos_mensais : 0,
      },
      {
        nome: "Real", receita: f, imposto: f * realRate, valid: true,
        carga: f > 0 ? realRate * 100 : 0,
        proLabore: form.pro_labore, inss,
        custoTotal: f * realRate + inss,
        margem: f > 0 ? f - f * realRate - inss - form.custos_mensais : 0,
      },
    ];

    const validRegimes = regimes.filter(r => r.valid && r.custoTotal !== null);
    const economico = validRegimes.length ? validRegimes.reduce((a, b) => ((a.custoTotal ?? Infinity) < (b.custoTotal ?? Infinity) ? a : b)).nome : "Simples";
    const seguro = anual <= 4800000 ? "Simples" : "Presumido";
    const escalavel = "Presumido";

    return { regimes, economico, seguro, escalavel };
  }, [form.faturamento_estimado, form.custos_mensais, form.pro_labore, form.tipo_produto]);

  /* ─── Viabilidade Step 5 ──────────────────────────────────── */
  const viabilidadeScore = useMemo(() => {
    const items = [
      form.nome_empresarial_ok, form.cnae_ok, !!form.natureza_juridica,
      form.capital_social > 0, !!form.endereco_comercial,
    ];
    const checked = items.filter(Boolean).length;
    if (checked >= 5) return "viavel";
    if (checked >= 3) return "ajustes";
    return "nao_recomendado";
  }, [form.nome_empresarial_ok, form.cnae_ok, form.natureza_juridica, form.capital_social, form.endereco_comercial]);

  /* ─── Roadmap progress ────────────────────────────────────── */
  const roadmapProgress = useMemo(() => {
    const total = form.roadmap.length;
    const done = form.roadmap.filter(r => r.status === "Concluído").length;
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [form.roadmap]);

  /* ─── Progress ────────────────────────────────────────────── */
  const progress = Math.round((step / STEPS.length) * 100);

  /* ─── Auto-save mock ──────────────────────────────────────── */
  const handleAutoSave = useCallback(() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }, []);

  /* ─── Navigation ──────────────────────────────────────────── */
  const next = () => { if (step < 8) { setStep(step + 1); handleAutoSave(); } };
  const prev = () => { if (step > 1) setStep(step - 1); };

  /* ─── Render helpers ──────────────────────────────────────── */
  const ProgressBar = ({ value, max, color, label }: { value: number; max: number; color: string; label: string }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
        <span style={{ color: V.ink, fontWeight: 600 }}>{label}</span>
        <span style={{ color: V.muted }}>{value}/{max}</span>
      </div>
      <div style={{ height: 8, background: V.border, borderRadius: 4, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(value / max) * 100}%`, background: color, borderRadius: 4, transition: "width .3s" }} />
      </div>
    </div>
  );

  /* ═════════════════════════════════════════════════════════════ */
  /* STEP 1 — Dados do Cliente                                   */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStep1 = () => (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: V.ink, marginBottom: 4 }}>Dados do Cliente</h2>
      <p style={{ fontSize: 13, color: V.muted, marginBottom: 24 }}>Informações pessoais e de contato</p>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {["Novo", "Cliente existente"].map(s => (
          <button key={s} onClick={() => set("status_cliente", s)} style={{
            padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
            border: `1px solid ${form.status_cliente === s ? V.green700 : V.border}`,
            background: form.status_cliente === s ? V.green700 : V.panel,
            color: form.status_cliente === s ? "#fff" : V.ink,
          }}>{s}</button>
        ))}
      </div>

      <div style={sRow}>
        <Field label="Nome completo" required>
          <input style={sInput} value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} placeholder="Nome do cliente" />
        </Field>
        <Field label="Telefone" required>
          <input style={sInput} value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
        </Field>
      </div>
      <div style={sRow}>
        <Field label="E-mail" required>
          <input style={sInput} type="email" value={form.email} onChange={e => set("email", e.target.value)} placeholder="email@exemplo.com" />
        </Field>
        <Field label="CPF">
          <input style={sInput} value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" />
        </Field>
      </div>
      <div style={sRow}>
        <Field label="Cidade">
          <input style={sInput} value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
        </Field>
        <Field label="Profissão">
          <input style={sInput} value={form.profissao} onChange={e => set("profissao", e.target.value)} placeholder="Profissão atual" />
        </Field>
      </div>
      <div style={sRow}>
        <Field label="Renda atual">
          <select style={sInput} value={form.renda_atual} onChange={e => set("renda_atual", e.target.value)}>
            <option value="">Selecione...</option>
            {FAIXAS_RENDA.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Empresa atual">
          <input style={sInput} value={form.empresa_atual} onChange={e => set("empresa_atual", e.target.value)} placeholder="Nome da empresa (se houver)" />
        </Field>
      </div>

      <Toggle checked={form.ja_possui_cnpj} onChange={v => set("ja_possui_cnpj", v)} label="Já possui CNPJ" />

      <Field label="Objetivo principal" required>
        <select style={sInput} value={form.objetivo_principal} onChange={e => set("objetivo_principal", e.target.value)}>
          <option value="">Selecione...</option>
          {OBJETIVOS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </Field>
    </div>
  );

  /* ═════════════════════════════════════════════════════════════ */
  /* STEP 2 — Objetivo                                           */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStep2 = () => (
    <div>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: V.ink, marginBottom: 4 }}>Objetivo</h2>
      <p style={{ fontSize: 13, color: V.muted, marginBottom: 24 }}>Selecione os objetivos e descreva o cenário</p>

      <div style={sSection}>
        <label style={sLabel}>Objetivos (selecione todos que se aplicam)</label>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {OBJETIVOS.map(o => {
            const checked = form.objetivos.includes(o);
            return (
              <label key={o} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 8,
                border: `1px solid ${checked ? V.green500 : V.border}`, background: checked ? "#edf7f1" : V.panel,
                cursor: "pointer", fontSize: 13,
              }}>
                <input type="checkbox" checked={checked} onChange={() => {
                  set("objetivos", checked ? form.objetivos.filter(x => x !== o) : [...form.objetivos, o]);
                }} style={{ accentColor: V.green700 }} />
                {o}
              </label>
            );
          })}
        </div>
      </div>

      <Field label="Cenário atual" required>
        <textarea style={sTextarea} value={form.cenario_atual} onChange={e => set("cenario_atual", e.target.value)}
          placeholder="Explique seu cenário atual..." />
      </Field>
      <div style={sRow}>
        <Field label="Prazo desejado">
          <input style={sInput} value={form.prazo_desejado} onChange={e => set("prazo_desejado", e.target.value)} placeholder="Ex: 30 dias" />
        </Field>
        <Field label="Meta principal">
          <textarea style={{ ...sTextarea, minHeight: 60 }} value={form.meta_principal} onChange={e => set("meta_principal", e.target.value)}
            placeholder="Qual a meta principal?" />
        </Field>
      </div>
    </div>
  );

  /* ═════════════════════════════════════════════════════════════ */
  /* STEP 3 — Diagnóstico                                        */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStep3 = () => {
    const barColor = (val: number, inverse?: boolean) => {
      if (inverse) return val > 7 ? V.green500 : val > 3 ? V.amber : V.red;
      return val < 4 ? V.green500 : val < 8 ? V.amber : V.red;
    };
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: V.ink, marginBottom: 4 }}>Diagnóstico</h2>
        <p style={{ fontSize: 13, color: V.muted, marginBottom: 24 }}>Dados financeiros e indicadores</p>

        <div style={sRow}>
          <Field label="Faturamento estimado/mês" required>
            <input style={sInput} value={form.faturamento_estimado || ""} onChange={e => setN("faturamento_estimado", e.target.value)}
              placeholder="R$ 0,00" />
          </Field>
          <Field label="Custos mensais">
            <input style={sInput} value={form.custos_mensais || ""} onChange={e => setN("custos_mensais", e.target.value)}
              placeholder="R$ 0,00" />
          </Field>
        </div>
        <div style={sRow3}>
          <Field label="Funcionários">
            <input style={sInput} type="number" min={0} value={form.num_funcionarios} onChange={e => set("num_funcionarios", parseInt(e.target.value) || 0)} />
          </Field>
          <Field label="Sócios">
            <input style={sInput} type="number" min={1} value={form.num_socios} onChange={e => set("num_socios", parseInt(e.target.value) || 1)} />
          </Field>
          <Field label="Pró-labore">
            <input style={sInput} value={form.pro_labore || ""} onChange={e => setN("pro_labore", e.target.value)} placeholder="R$ 0,00" />
          </Field>
        </div>

        <div style={sSection}>
          <label style={sLabel}>Tipo de produto/serviço</label>
          <div style={{ display: "flex", gap: 12 }}>
            {["Produtos", "Serviços", "Ambos"].map(t => (
              <label key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                <input type="radio" name="tipo_produto" checked={form.tipo_produto === t}
                  onChange={() => set("tipo_produto", t)} style={{ accentColor: V.green700 }} />
                {t}
              </label>
            ))}
          </div>
        </div>

        <div style={sRow}>
          <Field label="Região">
            <select style={sInput} value={form.regiao} onChange={e => set("regiao", e.target.value)}>
              <option value="">Selecione...</option>
              {REGIOES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <div>
            <label style={sLabel}>Atende</label>
            <div style={{ display: "flex", gap: 12 }}>
              {["PF", "PJ", "Exterior"].map(a => {
                const checked = form.atende.includes(a);
                return (
                  <label key={a} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, cursor: "pointer" }}>
                    <input type="checkbox" checked={checked} onChange={() => {
                      set("atende", checked ? form.atende.filter(x => x !== a) : [...form.atende, a]);
                    }} style={{ accentColor: V.green700 }} />
                    {a}
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ ...sCard, marginTop: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: V.ink, marginBottom: 16 }}>Indicadores Auto-Gerados</h3>
          <ProgressBar value={indicators.complexity} max={10} color={barColor(indicators.complexity)} label="Complexidade" />
          <ProgressBar value={indicators.risk} max={10} color={barColor(indicators.risk)} label="Risco" />
          <ProgressBar value={indicators.potential} max={10} color={barColor(indicators.potential, true)} label="Potencial" />
        </div>
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════ */
  /* STEP 4 — Planejamento Tributário                            */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStep4 = () => {
    const { regimes, economico, seguro, escalavel } = tributacao;
    const maxCarga = Math.max(...regimes.filter(r => r.valid).map(r => r.carga ?? 0), 1);

    const rankings = [
      { title: "Mais Econômico", desc: "Menor custo total", regime: economico, icon: "$" },
      { title: "Mais Seguro", desc: "Menor risco fiscal", regime: seguro, icon: "S" },
      { title: "Mais Escalável", desc: "Melhor para crescimento", regime: escalavel, icon: "E" },
    ];

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: V.ink, marginBottom: 4 }}>Planejamento Tributário</h2>
        <p style={{ fontSize: 13, color: V.muted, marginBottom: 24 }}>Comparativo de regimes tributários</p>

        {/* Tabela comparativa */}
        <div style={{ overflowX: "auto", marginBottom: 24 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: V.green700, color: "#fff" }}>
                <th style={{ padding: "10px 12px", textAlign: "left", borderRadius: "8px 0 0 0" }}>Item</th>
                {regimes.map((r, i) => (
                  <th key={r.nome} style={{
                    padding: "10px 12px", textAlign: "right",
                    borderRadius: i === regimes.length - 1 ? "0 8px 0 0" : 0,
                    opacity: r.valid ? 1 : 0.4,
                  }}>{r.nome}{!r.valid && " *"}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Receita", key: "receita" },
                { label: "Impostos/mês", key: "imposto" },
                { label: "Carga tributária %", key: "carga" },
                { label: "Pró-labore", key: "proLabore" },
                { label: "INSS", key: "inss" },
                { label: "Custo total", key: "custoTotal" },
                { label: "Margem líquida", key: "margem" },
              ].map((row, ri) => (
                <tr key={row.key} style={{ background: ri % 2 === 0 ? "#f8fdf9" : V.panel }}>
                  <td style={{ padding: "8px 12px", fontWeight: 600, color: V.ink }}>{row.label}</td>
                  {regimes.map(r => {
                    const val = r[row.key as keyof typeof r];
                    const display = val === null ? "N/A" : row.key === "carga" ? `${(val as number).toFixed(1)}%` : fmt(val as number);
                    return (
                      <td key={r.nome} style={{ padding: "8px 12px", textAlign: "right", color: r.valid ? V.ink : V.muted, opacity: r.valid ? 1 : 0.5 }}>
                        {display}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {regimes.some(r => !r.valid) && (
            <p style={{ fontSize: 11, color: V.muted, marginTop: 8 }}>* Regime indisponível para o faturamento informado</p>
          )}
        </div>

        {/* SVG Bar chart */}
        <div style={{ ...sCard, padding: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: V.ink, marginBottom: 16 }}>Carga Tributária Comparativa</h3>
          <svg width="100%" viewBox="0 0 500 180" style={{ display: "block" }}>
            {regimes.filter(r => r.valid).map((r, i, arr) => {
              const barW = 400 / arr.length - 20;
              const x = 60 + i * (400 / arr.length);
              const barH = ((r.carga ?? 0) / maxCarga) * 120;
              const colors = [V.gold, V.green500, V.green700, "#2563eb"];
              return (
                <g key={r.nome}>
                  <rect x={x} y={140 - barH} width={barW} height={barH} rx={4} fill={colors[i % 4]} />
                  <text x={x + barW / 2} y={155} textAnchor="middle" fontSize={11} fill={V.ink}>{r.nome}</text>
                  <text x={x + barW / 2} y={135 - barH} textAnchor="middle" fontSize={10} fill={V.muted}>{(r.carga ?? 0).toFixed(1)}%</text>
                </g>
              );
            })}
            <line x1="50" y1="140" x2="480" y2="140" stroke={V.border} strokeWidth={1} />
          </svg>
        </div>

        {/* Rankings */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 24 }}>
          {rankings.map(rk => {
            const isBest = rk.regime === economico;
            return (
              <div key={rk.title} style={{
                ...sCard, textAlign: "center", position: "relative",
                border: isBest ? `2px solid ${V.green500}` : `1px solid ${V.border}`,
              }}>
                {isBest && (
                  <span style={{
                    position: "absolute", top: -10, left: "50%", transform: "translateX(-50%)",
                    background: V.green500, color: "#fff", fontSize: 10, fontWeight: 700,
                    padding: "2px 10px", borderRadius: 10,
                  }}>RECOMENDADO</span>
                )}
                <div style={{
                  width: 36, height: 36, borderRadius: 18, background: isBest ? V.green500 : V.border,
                  color: isBest ? "#fff" : V.ink, display: "flex", alignItems: "center", justifyContent: "center",
                  margin: "8px auto 8px", fontSize: 16, fontWeight: 700,
                }}>{rk.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: V.ink }}>{rk.title}</div>
                <div style={{ fontSize: 12, color: V.muted, marginBottom: 8 }}>{rk.desc}</div>
                <div style={{ fontSize: 16, fontWeight: 700, color: V.green700 }}>{rk.regime}</div>
              </div>
            );
          })}
        </div>

        {/* Seleção de regime */}
        <div style={sSection}>
          <label style={sLabel}>Selecione o regime recomendado</label>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {regimes.filter(r => r.valid).map(r => (
              <label key={r.nome} style={{
                display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 8,
                border: `1px solid ${form.regime_selecionado === r.nome ? V.green500 : V.border}`,
                background: form.regime_selecionado === r.nome ? "#edf7f1" : V.panel,
                cursor: "pointer", fontSize: 13, fontWeight: 600,
              }}>
                <input type="radio" name="regime" checked={form.regime_selecionado === r.nome}
                  onChange={() => set("regime_selecionado", r.nome)} style={{ accentColor: V.green700 }} />
                {r.nome}
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════ */
  /* STEP 5 — Viabilidade Empresarial                            */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStep5 = () => {
    const result = viabilidadeScore;
    const resultMap = {
      viavel: { label: "Viável", color: V.green500, bg: "#edf7f1" },
      ajustes: { label: "Viável com ajustes", color: V.amber, bg: "#fef9ee" },
      nao_recomendado: { label: "Não recomendado", color: V.red, bg: "#fef2f2" },
    };
    const r = resultMap[result];

    const pendingItems = [];
    if (!form.nome_empresarial_ok) pendingItems.push("Nome empresarial não verificado");
    if (!form.cnae_ok) pendingItems.push("CNAE não verificado");
    if (!form.natureza_juridica) pendingItems.push("Natureza jurídica não definida");
    if (form.capital_social <= 0) pendingItems.push("Capital social não informado");
    if (!form.endereco_comercial) pendingItems.push("Endereço comercial não informado");

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: V.ink, marginBottom: 4 }}>Viabilidade Empresarial</h2>
        <p style={{ fontSize: 13, color: V.muted, marginBottom: 24 }}>Verifique os requisitos para abertura</p>

        <div style={sCard}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Field label="Nome empresarial">
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...sInput, flex: 1 }} value={form.nome_empresarial}
                  onChange={e => set("nome_empresarial", e.target.value)} placeholder="Razão social desejada" />
                <Toggle checked={form.nome_empresarial_ok} onChange={v => set("nome_empresarial_ok", v)}
                  label={form.nome_empresarial_ok ? "Disponível" : "Indisponível"} />
              </div>
            </Field>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Field label="CNAE principal">
              <div style={{ display: "flex", gap: 8 }}>
                <input style={{ ...sInput, flex: 1 }} value={form.cnae_principal}
                  onChange={e => set("cnae_principal", e.target.value)} placeholder="Ex: 6201-5/00" />
                <Toggle checked={form.cnae_ok} onChange={v => set("cnae_ok", v)}
                  label={form.cnae_ok ? "Disponível" : "Indisponível"} />
              </div>
            </Field>
          </div>

          <div style={sRow}>
            <Field label="Natureza jurídica">
              <select style={sInput} value={form.natureza_juridica} onChange={e => set("natureza_juridica", e.target.value)}>
                <option value="">Selecione...</option>
                {NATUREZAS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
            <Field label="Capital social">
              <input style={sInput} value={form.capital_social || ""} onChange={e => setN("capital_social", e.target.value)}
                placeholder="R$ 0,00" />
            </Field>
          </div>

          <Field label="Endereço comercial">
            <input style={sInput} value={form.endereco_comercial} onChange={e => set("endereco_comercial", e.target.value)}
              placeholder="Endereço completo" />
          </Field>

          <Toggle checked={form.necessita_alvara} onChange={v => set("necessita_alvara", v)} label="Necessita alvará" />
          <Toggle checked={form.inscricao_estadual} onChange={v => set("inscricao_estadual", v)} label="Necessita inscrição estadual" />

          <Field label="Licenças especiais">
            <textarea style={sTextarea} value={form.licencas_especiais} onChange={e => set("licencas_especiais", e.target.value)}
              placeholder="Descreva licenças necessárias..." />
          </Field>
        </div>

        {/* Resultado */}
        <div style={{ ...sCard, background: r.bg, border: `2px solid ${r.color}`, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: r.color, marginBottom: 8 }}>{r.label}</div>
          <div style={{ fontSize: 13, color: V.muted }}>
            {result === "viavel" ? "Todos os requisitos atendidos" :
              result === "ajustes" ? "Alguns itens pendentes de verificação" :
                "Requisitos insuficientes para prosseguir"}
          </div>
          {pendingItems.length > 0 && (
            <div style={{ marginTop: 16, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: V.ink, marginBottom: 8 }}>Itens pendentes:</div>
              {pendingItems.map(item => (
                <div key={item} style={{ fontSize: 12, color: V.muted, padding: "4px 0", display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ color: V.amber }}>&#9679;</span> {item}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════ */
  /* STEP 6 — Plano de Execução (Roadmap)                        */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStep6 = () => {
    const updateRoadmap = (idx: number, key: keyof RoadmapItem, val: string) => {
      const updated = form.roadmap.map((r, i) => i === idx ? { ...r, [key]: val } : r);
      set("roadmap", updated);
    };
    const addWeek = () => {
      set("roadmap", [...form.roadmap, {
        titulo: `Semana ${form.roadmap.length + 1}`,
        descricao: "", responsavel: "Ana Lima",
        prazo: addDays((form.roadmap.length + 1) * 7), status: "Pendente",
      }]);
    };
    const removeWeek = (idx: number) => {
      set("roadmap", form.roadmap.filter((_, i) => i !== idx));
    };

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: V.ink, marginBottom: 4 }}>Plano de Execução</h2>
        <p style={{ fontSize: 13, color: V.muted, marginBottom: 24 }}>Roadmap de implementação por semana</p>

        {/* Timeline visual */}
        <div style={{ position: "relative", paddingLeft: 32, marginBottom: 24 }}>
          <div style={{ position: "absolute", left: 14, top: 0, bottom: 0, width: 2, background: V.border }} />
          {form.roadmap.map((item, idx) => {
            const statusColors: Record<string, string> = { "Pendente": V.muted, "Em andamento": V.gold, "Concluído": V.green500 };
            const dotColor = statusColors[item.status] || V.muted;
            return (
              <div key={idx} style={{ position: "relative", marginBottom: 16 }}>
                <div style={{
                  position: "absolute", left: -24, top: 8, width: 12, height: 12,
                  borderRadius: 6, background: dotColor, border: `2px solid ${V.panel}`,
                  boxShadow: `0 0 0 2px ${dotColor}`,
                }} />
                <div style={{ ...sCard, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: V.green700 }}>Semana {idx + 1}</span>
                    <button onClick={() => removeWeek(idx)} style={{
                      background: "transparent", border: "none", color: V.danger, fontSize: 18, cursor: "pointer", padding: "0 4px",
                    }} title="Remover">&times;</button>
                  </div>
                  <div style={sRow}>
                    <Field label="Título">
                      <input style={sInput} value={item.titulo} onChange={e => updateRoadmap(idx, "titulo", e.target.value)} />
                    </Field>
                    <Field label="Descrição">
                      <input style={sInput} value={item.descricao} onChange={e => updateRoadmap(idx, "descricao", e.target.value)} />
                    </Field>
                  </div>
                  <div style={sRow3}>
                    <Field label="Responsável">
                      <select style={sInput} value={item.responsavel} onChange={e => updateRoadmap(idx, "responsavel", e.target.value)}>
                        {RESPONSAVEIS.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </Field>
                    <Field label="Prazo">
                      <input style={sInput} type="date" value={item.prazo} onChange={e => updateRoadmap(idx, "prazo", e.target.value)} />
                    </Field>
                    <Field label="Status">
                      <select style={sInput} value={item.status} onChange={e => updateRoadmap(idx, "status", e.target.value)}>
                        {["Pendente", "Em andamento", "Concluído"].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </Field>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={addWeek} style={{ ...sBtnSecondary, width: "100%" }}>+ Adicionar semana</button>
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════ */
  /* STEP 7 — Apresentação Executiva                             */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStep7 = () => {
    const viabLabel = { viavel: "Viável", ajustes: "Viável com ajustes", nao_recomendado: "Não recomendado" }[viabilidadeScore];
    const sections = [
      {
        title: "Situação Atual", content: (
          <div style={{ fontSize: 13, color: V.ink, lineHeight: 1.7 }}>
            <p><strong>Faturamento estimado:</strong> {fmt(form.faturamento_estimado)}/mês</p>
            <p><strong>Custos mensais:</strong> {fmt(form.custos_mensais)}</p>
            <p><strong>Funcionários:</strong> {form.num_funcionarios} | <strong>Sócios:</strong> {form.num_socios}</p>
            <p><strong>Tipo:</strong> {form.tipo_produto} | <strong>Região:</strong> {form.regiao}</p>
            <p><strong>Atende:</strong> {form.atende.join(", ") || "Não informado"}</p>
          </div>
        ),
      },
      {
        title: "Cenários Tributários", content: (
          <div style={{ fontSize: 13 }}>
            {tributacao.regimes.filter(r => r.valid).map(r => (
              <div key={r.nome} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${V.border}` }}>
                <span style={{ fontWeight: 600 }}>{r.nome}</span>
                <span style={{ color: V.muted }}>Carga: {(r.carga ?? 0).toFixed(1)}% | Custo: {fmt(r.custoTotal ?? 0)}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: "Recomendação", content: (
          <div style={{ textAlign: "center", padding: 16 }}>
            <div style={{ fontSize: 24, fontWeight: 700, color: V.green700 }}>{form.regime_selecionado || "Não selecionado"}</div>
            <p style={{ fontSize: 13, color: V.muted, marginTop: 8 }}>Regime tributário recomendado para o cenário apresentado</p>
          </div>
        ),
      },
      {
        title: "Passo a Passo", content: (
          <div style={{ fontSize: 13 }}>
            {form.roadmap.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "6px 0", borderBottom: `1px solid ${V.border}` }}>
                <span style={{ fontWeight: 700, color: V.green700, minWidth: 24 }}>{i + 1}.</span>
                <span style={{ flex: 1 }}>{r.titulo}</span>
                <span style={{ color: V.muted }}>{r.responsavel}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: "Custos Estimados", content: (
          <div style={{ fontSize: 13 }}>
            {form.regime_selecionado && tributacao.regimes.filter(r => r.nome === form.regime_selecionado).map(r => (
              <div key={r.nome}>
                <p><strong>Impostos/mês:</strong> {fmt(r.imposto ?? 0)}</p>
                <p><strong>INSS:</strong> {fmt(r.inss ?? 0)}</p>
                <p><strong>Custo total:</strong> {fmt(r.custoTotal ?? 0)}</p>
                <p><strong>Margem líquida est.:</strong> {fmt(r.margem ?? 0)}</p>
              </div>
            ))}
            {!form.regime_selecionado && <p style={{ color: V.muted }}>Selecione um regime na etapa 4</p>}
          </div>
        ),
      },
      {
        title: "Cronograma", content: (
          <div style={{ fontSize: 13 }}>
            {form.roadmap.map((r, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: `1px solid ${V.border}` }}>
                <span>Semana {i + 1}: {r.titulo}</span>
                <span style={{
                  fontSize: 11, padding: "2px 8px", borderRadius: 10,
                  background: r.status === "Concluído" ? "#edf7f1" : r.status === "Em andamento" ? "#fef9ee" : "#f3f4f6",
                  color: r.status === "Concluído" ? V.green700 : r.status === "Em andamento" ? V.gold : V.muted,
                  fontWeight: 600,
                }}>{r.status}</span>
              </div>
            ))}
          </div>
        ),
      },
      {
        title: "Conclusão", content: (
          <div style={{ fontSize: 13, color: V.ink, textAlign: "center", padding: 16 }}>
            <p>Com base na análise realizada, recomendamos o regime <strong>{form.regime_selecionado || "—"}</strong> para
              o cliente <strong>{form.nome_completo || "—"}</strong>.</p>
            <p style={{ marginTop: 8 }}>Viabilidade: <strong>{viabLabel}</strong></p>
            <p style={{ marginTop: 8, color: V.muted }}>Prazo estimado de implementação: {form.roadmap.length} semanas</p>
          </div>
        ),
      },
    ];

    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: V.ink, marginBottom: 4 }}>Apresentação Executiva</h2>
        <p style={{ fontSize: 13, color: V.muted, marginBottom: 24 }}>Preview do documento de consultoria</p>

        {/* Capa */}
        <div style={{
          ...sCard, textAlign: "center", padding: "40px 24px",
          background: `linear-gradient(135deg, ${V.green700} 0%, #0a3d2a 100%)`, color: "#fff", borderRadius: 16,
        }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: V.gold, marginBottom: 8, letterSpacing: 2, textTransform: "uppercase" }}>
            Burgarelli C.O
          </div>
          <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>Estudo de Consultoria</div>
          <div style={{ fontSize: 16, opacity: 0.9 }}>{form.nome_completo || "Nome do Cliente"}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 8 }}>
            {form.objetivo_principal || "Objetivo"} &mdash; {new Date().toLocaleDateString("pt-BR")}
          </div>
        </div>

        {/* Seções */}
        {sections.map((sec, i) => (
          <div key={i} style={{ ...sCard, marginTop: 12 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: V.green700, marginBottom: 12, paddingBottom: 8, borderBottom: `1px solid ${V.border}` }}>
              {i + 1}. {sec.title}
            </h3>
            {sec.content}
          </div>
        ))}

        {/* Botões */}
        <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
          <button style={sBtnPrimary} onClick={() => alert("PDF gerado (mock)")}>Gerar PDF</button>
          <button style={sBtnSecondary} onClick={() => alert("E-mail enviado (mock)")}>Compartilhar via email</button>
          <button style={{ ...sBtnSecondary, borderColor: V.gold, color: V.gold }} onClick={() => alert("Enviado ao portal (mock)")}>
            Enviar ao portal
          </button>
        </div>
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════ */
  /* STEP 8 — Aprovação                                          */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStep8 = () => {
    const approved = form.status_aprovacao === "Aprovado";
    return (
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: V.ink, marginBottom: 4 }}>Aprovação</h2>
        <p style={{ fontSize: 13, color: V.muted, marginBottom: 24 }}>Decisão final sobre o estudo de consultoria</p>

        <div style={sSection}>
          <label style={sLabel}>Decisão</label>
          <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
            {[
              { label: "Aprovar", value: "Aprovado", color: V.green500, bg: "#edf7f1" },
              { label: "Solicitar ajustes", value: "Ajustes", color: V.amber, bg: "#fef9ee" },
              { label: "Rejeitar", value: "Rejeitado", color: V.red, bg: "#fef2f2" },
            ].map(opt => (
              <button key={opt.value} onClick={() => set("status_aprovacao", opt.value)} style={{
                flex: 1, padding: "14px 16px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                cursor: "pointer", transition: "all .2s",
                border: form.status_aprovacao === opt.value ? `2px solid ${opt.color}` : `1px solid ${V.border}`,
                background: form.status_aprovacao === opt.value ? opt.bg : V.panel,
                color: form.status_aprovacao === opt.value ? opt.color : V.ink,
              }}>{opt.label}</button>
            ))}
          </div>
        </div>

        <Field label="Observações de aprovação">
          <textarea style={sTextarea} value={form.observacao_aprovacao} onChange={e => set("observacao_aprovacao", e.target.value)}
            placeholder="Observações, condições ou motivos..." />
        </Field>

        <Field label="Data de aprovação">
          <input style={sInput} type="date" value={form.data_aprovacao} onChange={e => set("data_aprovacao", e.target.value)} />
        </Field>

        {/* Mock assinatura */}
        <div style={{
          border: `2px dashed ${V.border}`, borderRadius: 12, padding: 32, textAlign: "center",
          marginTop: 20, marginBottom: 24, color: V.muted, fontSize: 14,
        }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>&#9997;</div>
          Assinatura do cliente
          <div style={{ marginTop: 12, borderTop: `1px solid ${V.border}`, paddingTop: 8, fontSize: 12 }}>
            {form.nome_completo || "Nome do cliente"} &mdash; {form.data_aprovacao}
          </div>
        </div>

        {/* Conversão */}
        {approved && (
          <div style={{ ...sCard, background: "#edf7f1", border: `2px solid ${V.green500}`, textAlign: "center", padding: 32 }}>
            <a href="/empresas/novo" style={{
              display: "inline-block", padding: "16px 48px", background: V.green500, color: "#fff",
              borderRadius: 12, fontSize: 18, fontWeight: 700, textDecoration: "none",
              boxShadow: "0 4px 16px rgba(16,185,129,.3)",
            }}>
              CONVERTER EM EMPRESA
            </a>
            <div style={{ marginTop: 24, textAlign: "left", maxWidth: 360, margin: "24px auto 0" }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: V.ink, marginBottom: 12 }}>Checklist de conversão:</div>
              {[
                "Criar cliente", "Criar empresa", "Criar portal", "Criar setores", "Gerar onboarding",
              ].map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", fontSize: 13, color: V.green700 }}>
                  <span style={{ color: V.green500, fontSize: 16 }}>&#10003;</span> {item}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════ */
  /* LEFT PANEL — Stepper                                        */
  /* ═════════════════════════════════════════════════════════════ */
  const renderStepper = () => (
    <div style={{ width: 200, minHeight: "100%", background: V.panel, borderRight: `1px solid ${V.border}`, padding: "24px 16px", boxSizing: "border-box" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: V.green700, marginBottom: 20 }}>Consultoria</div>

      {/* Progress bar */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: V.muted, marginBottom: 4 }}>
          <span>Progresso</span><span>{progress}%</span>
        </div>
        <div style={{ height: 6, background: V.border, borderRadius: 3, overflow: "hidden" }}>
          <div style={{ height: "100%", width: `${progress}%`, background: V.green500, borderRadius: 3, transition: "width .3s" }} />
        </div>
      </div>

      {/* Steps */}
      {STEPS.map(s => {
        const isActive = s.num === step;
        const isDone = s.num < step;
        return (
          <div key={s.num} onClick={() => setStep(s.num)} style={{
            display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
            cursor: "pointer", marginBottom: 4, transition: "background .15s",
            background: isActive ? "#edf7f1" : "transparent",
          }}>
            <div style={{
              width: 24, height: 24, borderRadius: 12, fontSize: 11, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              background: isDone ? V.green500 : isActive ? V.green700 : V.border,
              color: isDone || isActive ? "#fff" : V.muted,
            }}>
              {isDone ? "✓" : s.num}
            </div>
            <span style={{
              fontSize: 12, fontWeight: isActive ? 700 : 500,
              color: isActive ? V.green700 : isDone ? V.ink : V.muted,
            }}>{s.title}</span>
          </div>
        );
      })}
    </div>
  );

  /* ═════════════════════════════════════════════════════════════ */
  /* RIGHT PANEL — Live summary                                  */
  /* ═════════════════════════════════════════════════════════════ */
  const renderSummary = () => {
    const viabLabel = { viavel: "Viável", ajustes: "Com ajustes", nao_recomendado: "Não recomendado" }[viabilidadeScore];
    const viabColor = { viavel: V.green500, ajustes: V.amber, nao_recomendado: V.red }[viabilidadeScore];

    return (
      <div style={{
        width: 280, minHeight: "100%", background: V.panel, borderLeft: `1px solid ${V.border}`,
        padding: "24px 16px", boxSizing: "border-box", fontSize: 13,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: V.green700, marginBottom: 20 }}>Resumo</div>

        {/* Cliente */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Cliente</div>
          <div style={{ fontWeight: 700, color: V.ink }}>{form.nome_completo || "—"}</div>
          <div style={{ color: V.muted }}>{form.email || "—"}</div>
          <div style={{ color: V.muted }}>{form.telefone || "—"}</div>
        </div>

        {/* Objetivo */}
        {form.objetivo_principal && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Objetivo</div>
            <div style={{
              display: "inline-block", padding: "4px 10px", borderRadius: 12, fontSize: 12,
              background: "#edf7f1", color: V.green700, fontWeight: 600,
            }}>{form.objetivo_principal}</div>
          </div>
        )}

        {/* Indicadores */}
        {form.faturamento_estimado > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Indicadores</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { label: "C", value: indicators.complexity, color: indicators.complexity < 4 ? V.green500 : indicators.complexity < 8 ? V.amber : V.red },
                { label: "R", value: indicators.risk, color: indicators.risk < 4 ? V.green500 : indicators.risk < 8 ? V.amber : V.red },
                { label: "P", value: indicators.potential, color: indicators.potential > 7 ? V.green500 : indicators.potential > 3 ? V.amber : V.red },
              ].map(ind => (
                <div key={ind.label} style={{
                  flex: 1, textAlign: "center", padding: "8px 4px", borderRadius: 8,
                  background: `${ind.color}15`, border: `1px solid ${ind.color}30`,
                }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: ind.color }}>{ind.value}</div>
                  <div style={{ fontSize: 10, color: V.muted }}>{ind.label === "C" ? "Complex." : ind.label === "R" ? "Risco" : "Potenc."}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Faturamento */}
        {form.faturamento_estimado > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Faturamento</div>
            <div style={{ fontWeight: 700, color: V.ink }}>{fmt(form.faturamento_estimado)}/mês</div>
          </div>
        )}

        {/* Regime */}
        {form.regime_selecionado && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Regime</div>
            <div style={{
              display: "inline-block", padding: "6px 12px", borderRadius: 8, fontSize: 13,
              background: V.green700, color: "#fff", fontWeight: 700,
            }}>{form.regime_selecionado}</div>
          </div>
        )}

        {/* Viabilidade */}
        {step >= 5 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Viabilidade</div>
            <div style={{ fontWeight: 700, color: viabColor }}>{viabLabel}</div>
          </div>
        )}

        {/* Roadmap progress */}
        {step >= 6 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Roadmap</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, height: 6, background: V.border, borderRadius: 3, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${roadmapProgress}%`, background: V.green500, borderRadius: 3 }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: V.ink }}>{roadmapProgress}%</span>
            </div>
            <div style={{ fontSize: 11, color: V.muted, marginTop: 4 }}>
              {form.roadmap.filter(r => r.status === "Concluído").length}/{form.roadmap.length} etapas concluídas
            </div>
          </div>
        )}

        {/* Aprovação */}
        {form.status_aprovacao && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Status</div>
            <div style={{
              display: "inline-block", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
              background: form.status_aprovacao === "Aprovado" ? "#edf7f1" : form.status_aprovacao === "Ajustes" ? "#fef9ee" : "#fef2f2",
              color: form.status_aprovacao === "Aprovado" ? V.green500 : form.status_aprovacao === "Ajustes" ? V.amber : V.red,
            }}>{form.status_aprovacao}</div>
          </div>
        )}

        {/* Auto-save */}
        <div style={{
          marginTop: 32, padding: "8px 12px", borderRadius: 8, fontSize: 11,
          background: saved ? "#edf7f1" : "#f9fafb",
          color: saved ? V.green500 : V.muted,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 14 }}>{saved ? "✓" : "○"}</span>
          {saved ? "Salvo automaticamente" : "Alterações não salvas"}
        </div>
      </div>
    );
  };

  /* ═════════════════════════════════════════════════════════════ */
  /* RENDER                                                      */
  /* ═════════════════════════════════════════════════════════════ */
  const stepRenderers: Record<number, () => React.ReactNode> = {
    1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4,
    5: renderStep5, 6: renderStep6, 7: renderStep7, 8: renderStep8,
  };

  return (
    <AppShell>
      <div style={{ display: "flex", height: "calc(100vh - 64px)", background: V.bg, overflow: "hidden" }}>
        {/* LEFT — Stepper */}
        {renderStepper()}

        {/* CENTER — Form */}
        <div style={{ flex: 1, overflow: "auto", padding: "32px 40px" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            {stepRenderers[step]?.()}

            {/* Navigation */}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32, paddingTop: 20, borderTop: `1px solid ${V.border}` }}>
              <button onClick={prev} disabled={step === 1} style={{
                ...sBtnSecondary, opacity: step === 1 ? 0.4 : 1, cursor: step === 1 ? "default" : "pointer",
              }}>Voltar</button>
              {step < 8 ? (
                <button onClick={next} style={sBtnPrimary}>Próximo</button>
              ) : (
                <button onClick={() => { handleAutoSave(); alert("Consultoria finalizada (mock)"); }} style={{
                  ...sBtnPrimary, background: V.gold, color: V.ink,
                }}>Finalizar</button>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT — Summary */}
        {renderSummary()}
      </div>
    </AppShell>
  );
}
