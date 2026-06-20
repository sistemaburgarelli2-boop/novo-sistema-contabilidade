"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── CSS Variables ──────────────────────────────────────────── */
const V = {
  bg: "#f3f8f5", panel: "#ffffff", ink: "#07170d", muted: "#6f8f7c",
  green700: "#075f3c", green500: "#10b981", green400: "#18d19b",
  gold: "#d4ae4a", border: "#dfece5", danger: "#ef445f",
  blue: "#3b82f6", blueBg: "#eff6ff",
};

/* ─── Tipos de Contrato (MOCK) ──────────────────────────────── */
type TipoContrato = {
  slug: string; nome: string; categoria: string;
  preco: number; icone: string;
};

const TIPOS_CONTRATO: TipoContrato[] = [
  { slug: "compra-venda", nome: "Compra e Venda", categoria: "Comercial", preco: 250, icone: "🛒" },
  { slug: "prestacao-servicos", nome: "Prestação de Serviços", categoria: "Comercial", preco: 200, icone: "🔧" },
  { slug: "contrato-social", nome: "Contrato Social", categoria: "Societário", preco: 500, icone: "🏢" },
  { slug: "locacao", nome: "Locação", categoria: "Imobiliário", preco: 180, icone: "🏠" },
  { slug: "confissao-divida", nome: "Confissão de Dívida", categoria: "Financeiro", preco: 150, icone: "💰" },
  { slug: "parceria-comercial", nome: "Parceria Comercial", categoria: "Comercial", preco: 300, icone: "🤝" },
  { slug: "honorarios", nome: "Honorários", categoria: "Profissional", preco: 120, icone: "📋" },
  { slug: "alteracao-contratual", nome: "Alteração Contratual", categoria: "Societário", preco: 350, icone: "✏️" },
  { slug: "cessao-direitos", nome: "Cessão de Direitos", categoria: "Comercial", preco: 200, icone: "📝" },
  { slug: "comodato", nome: "Comodato", categoria: "Imobiliário", preco: 100, icone: "🔑" },
  { slug: "distrato", nome: "Distrato", categoria: "Comercial", preco: 150, icone: "❌" },
  { slug: "emprestimo", nome: "Empréstimo", categoria: "Financeiro", preco: 180, icone: "🏦" },
  { slug: "termo-responsabilidade", nome: "Termo de Responsabilidade", categoria: "Geral", preco: 80, icone: "✅" },
  { slug: "procuracao", nome: "Procuração", categoria: "Geral", preco: 100, icone: "📜" },
  { slug: "nda", nome: "NDA (Confidencialidade)", categoria: "Comercial", preco: 150, icone: "🔒" },
  { slug: "freelancer", nome: "Contrato Freelancer", categoria: "Profissional", preco: 0, icone: "💻" },
  { slug: "sociedade", nome: "Sociedade", categoria: "Societário", preco: 450, icone: "👥" },
  { slug: "autonomo", nome: "Autônomo", categoria: "Profissional", preco: 0, icone: "🧑‍💼" },
  { slug: "pj", nome: "Prestador PJ", categoria: "Profissional", preco: 0, icone: "🏭" },
  { slug: "recibo", nome: "Recibo", categoria: "Geral", preco: 0, icone: "🧾" },
  { slug: "declaracao", nome: "Declaração", categoria: "Geral", preco: 0, icone: "📃" },
];

const CATEGORIAS = [...new Set(TIPOS_CONTRATO.map((t) => t.categoria))];

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const PAPEIS = [
  "Contratante","Contratado","Comprador","Vendedor",
  "Locador","Locatário","Sócio","Testemunha",
];

const STEPS = [
  { num: 1, title: "Escolher Contrato" },
  { num: 2, title: "Dados do Solicitante" },
  { num: 3, title: "Partes" },
  { num: 4, title: "Dados Específicos" },
  { num: 5, title: "Pré-visualização" },
  { num: 6, title: "Conclusão" },
];

/* ─── Tipos ──────────────────────────────────────────────────── */
type Solicitante = {
  tipo: "PF" | "PJ";
  nome: string; cpf: string; rg: string; nascimento: string;
  estado_civil: string; profissao: string; telefone: string; email: string;
  cep: string; logradouro: string; numero: string; bairro: string;
  cidade: string; uf: string;
  razao_social: string; cnpj: string;
  nome_responsavel: string; cpf_responsavel: string;
};

type Parte = {
  id: number; nome: string; documento: string;
  email: string; telefone: string; papel: string;
};

type DadosEspecificos = Record<string, string>;

const emptySolicitante = (): Solicitante => ({
  tipo: "PF", nome: "", cpf: "", rg: "", nascimento: "",
  estado_civil: "", profissao: "", telefone: "", email: "",
  cep: "", logradouro: "", numero: "", bairro: "", cidade: "", uf: "",
  razao_social: "", cnpj: "", nome_responsavel: "", cpf_responsavel: "",
});

/* ─── Helpers ────────────────────────────────────────────────── */
const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const now = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

let parteId = 1;

/* ================================================================
   PAGE COMPONENT
   ================================================================ */
export default function GerarContratoPage() {
  const [step, setStep] = useState(1);
  const [catFiltro, setCatFiltro] = useState<string | null>(null);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoContrato | null>(null);
  const [solicitante, setSolicitante] = useState<Solicitante>(emptySolicitante);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [dados, setDados] = useState<DadosEspecificos>({});
  const [zoom, setZoom] = useState(100);
  const [pagamento, setPagamento] = useState("PIX");
  const [cupom, setCupom] = useState("");
  const [concluido, setConcluido] = useState(false);
  const [savedAt, setSavedAt] = useState(now());

  /* Auto-save mock */
  useEffect(() => {
    const t = setInterval(() => setSavedAt(now()), 30000);
    return () => clearInterval(t);
  }, []);

  const pct = Math.round((step / STEPS.length) * 100);

  /* ── Solicitante field update ──────────────────────────── */
  const upSol = useCallback((k: keyof Solicitante, v: string) => {
    setSolicitante((p) => ({ ...p, [k]: v }));
  }, []);

  /* ── Partes helpers ────────────────────────────────────── */
  const addParte = useCallback(() => {
    setPartes((p) => [
      ...p,
      { id: parteId++, nome: "", documento: "", email: "", telefone: "", papel: "Contratante" },
    ]);
  }, []);

  const rmParte = useCallback((id: number) => {
    setPartes((p) => p.filter((x) => x.id !== id));
  }, []);

  const upParte = useCallback((id: number, k: keyof Parte, v: string) => {
    setPartes((ps) => ps.map((p) => (p.id === id ? { ...p, [k]: v } : p)));
  }, []);

  /* Pre-fill first party from solicitante */
  useEffect(() => {
    if (step === 3 && partes.length === 0) {
      const s = solicitante;
      const nome = s.tipo === "PF" ? s.nome : s.razao_social;
      const doc = s.tipo === "PF" ? s.cpf : s.cnpj;
      if (nome || doc) {
        setPartes([
          { id: parteId++, nome, documento: doc, email: s.email, telefone: s.telefone, papel: "Contratante" },
        ]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const upDados = useCallback((k: string, v: string) => {
    setDados((p) => ({ ...p, [k]: v }));
  }, []);

  /* ── Navigation ────────────────────────────────────────── */
  const canNext = (): boolean => {
    if (step === 1) return !!tipoSelecionado;
    if (step === 2) {
      const s = solicitante;
      if (s.tipo === "PF") return !!(s.nome && s.cpf && s.telefone && s.email && s.cidade && s.uf);
      return !!(s.razao_social && s.cnpj && s.nome_responsavel && s.cpf_responsavel && s.telefone && s.email);
    }
    if (step === 3) return partes.length >= 1 && partes.every((p) => p.nome && p.documento);
    return true;
  };

  const next = () => { if (canNext() && step < 6) setStep(step + 1); };
  const prev = () => { if (step > 1) setStep(step - 1); };
  const goStep = (n: number) => { if (n <= step) setStep(n); };

  /* ── Contract number mock ──────────────────────────────── */
  const contratoNum = "CTR-2026-000149";
  const contratoHash = "a7c3e91f2b...d84f";

  /* ── Specific fields config ────────────────────────────── */
  type FieldDef = { key: string; label: string; type: "text" | "textarea" | "currency" | "dropdown"; options?: string[] };

  const getSpecificFields = (): FieldDef[] => {
    const slug = tipoSelecionado?.slug;
    if (slug === "prestacao-servicos") return [
      { key: "escopo", label: "Escopo do Serviço", type: "textarea" },
      { key: "prazo", label: "Prazo", type: "text" },
      { key: "valor", label: "Valor", type: "currency" },
      { key: "forma_pagamento", label: "Forma de Pagamento", type: "dropdown", options: ["À vista","Parcelado","Mensal","Trimestral"] },
      { key: "multa", label: "Multa por Rescisão (%)", type: "text" },
      { key: "foro", label: "Foro", type: "text" },
    ];
    if (slug === "compra-venda") return [
      { key: "objeto", label: "Objeto da Compra/Venda", type: "textarea" },
      { key: "valor", label: "Valor", type: "currency" },
      { key: "forma_pagamento", label: "Forma de Pagamento", type: "dropdown", options: ["À vista","Parcelado","Financiamento","Permuta"] },
      { key: "entrega", label: "Prazo de Entrega", type: "text" },
      { key: "garantia", label: "Garantia", type: "text" },
      { key: "condicoes", label: "Condições Especiais", type: "textarea" },
    ];
    if (slug === "nda") return [
      { key: "informacoes_protegidas", label: "Informações Protegidas", type: "textarea" },
      { key: "prazo", label: "Prazo de Sigilo", type: "text" },
      { key: "penalidades", label: "Penalidades", type: "textarea" },
      { key: "excecoes", label: "Exceções", type: "textarea" },
    ];
    if (slug === "locacao") return [
      { key: "descricao_imovel", label: "Descrição do Imóvel", type: "textarea" },
      { key: "valor_aluguel", label: "Valor do Aluguel", type: "currency" },
      { key: "prazo", label: "Prazo (meses)", type: "text" },
      { key: "dia_vencimento", label: "Dia do Vencimento", type: "text" },
      { key: "indice_reajuste", label: "Índice de Reajuste", type: "dropdown", options: ["IGPM","IPCA","INPC"] },
      { key: "caucao", label: "Caução", type: "currency" },
      { key: "finalidade", label: "Finalidade", type: "text" },
    ];
    return [
      { key: "objeto", label: "Objeto", type: "textarea" },
      { key: "valor", label: "Valor", type: "currency" },
      { key: "prazo", label: "Prazo", type: "text" },
      { key: "condicoes", label: "Condições", type: "textarea" },
      { key: "observacoes", label: "Observações", type: "textarea" },
    ];
  };

  /* =============================================================
     RENDER HELPERS
     ============================================================= */

  /* ── Shared input styles ────────────────────────────────── */
  const inputSt: React.CSSProperties = {
    width: "100%", padding: "10px 12px", border: `1px solid ${V.border}`,
    borderRadius: 8, fontSize: 14, color: V.ink, background: V.panel,
    outline: "none", boxSizing: "border-box",
  };
  const labelSt: React.CSSProperties = {
    display: "block", fontSize: 13, fontWeight: 600,
    color: V.ink, marginBottom: 4,
  };
  const reqSt: React.CSSProperties = { color: V.danger, marginLeft: 2 };

  const Field = ({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelSt}>{label}{req && <span style={reqSt}>*</span>}</label>
      {children}
    </div>
  );

  /* ── Step 1: Escolher Contrato ──────────────────────────── */
  const renderStep1 = () => {
    const filtered = catFiltro
      ? TIPOS_CONTRATO.filter((t) => t.categoria === catFiltro)
      : TIPOS_CONTRATO;

    return (
      <div>
        <h2 style={{ margin: 0, fontSize: 20, color: V.ink }}>Escolher Tipo de Contrato</h2>
        <p style={{ color: V.muted, fontSize: 14, margin: "4px 0 16px" }}>
          Selecione o modelo que melhor se encaixa na sua necessidade.
        </p>

        {/* Category pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setCatFiltro(null)}
            style={{
              padding: "6px 14px", borderRadius: 20, border: `1px solid ${V.border}`,
              background: !catFiltro ? V.green700 : V.panel, color: !catFiltro ? "#fff" : V.ink,
              fontSize: 13, cursor: "pointer", fontWeight: 500,
            }}
          >
            Todos
          </button>
          {CATEGORIAS.map((c) => (
            <button
              key={c}
              onClick={() => setCatFiltro(c)}
              style={{
                padding: "6px 14px", borderRadius: 20, border: `1px solid ${V.border}`,
                background: catFiltro === c ? V.green700 : V.panel,
                color: catFiltro === c ? "#fff" : V.ink,
                fontSize: 13, cursor: "pointer", fontWeight: 500,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Cards grid */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(190px, 1fr))",
          gap: 12,
        }}>
          {filtered.map((t) => {
            const sel = tipoSelecionado?.slug === t.slug;
            return (
              <div
                key={t.slug}
                onClick={() => setTipoSelecionado(t)}
                style={{
                  padding: 16, borderRadius: 10, cursor: "pointer",
                  border: `2px solid ${sel ? V.green500 : V.border}`,
                  background: sel ? "#f0fdf4" : V.panel,
                  transition: "all .15s",
                }}
              >
                <div style={{ fontSize: 28, marginBottom: 6 }}>{t.icone}</div>
                <div style={{ fontWeight: 600, fontSize: 14, color: V.ink }}>{t.nome}</div>
                <div style={{ fontSize: 12, color: V.muted, marginTop: 2 }}>{t.categoria}</div>
                <div style={{
                  marginTop: 8, fontSize: 13, fontWeight: 700,
                  color: t.preco > 0 ? V.green700 : V.muted,
                }}>
                  {t.preco > 0 ? fmt(t.preco) : "Gratuito"}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  /* ── Step 2: Dados do Solicitante ──────────────────────── */
  const renderStep2 = () => (
    <div>
      <h2 style={{ margin: 0, fontSize: 20, color: V.ink }}>Dados do Solicitante</h2>
      <p style={{ color: V.muted, fontSize: 14, margin: "4px 0 16px" }}>
        Informe os dados de quem está solicitando o contrato.
      </p>

      {/* PF/PJ toggle */}
      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderRadius: 8, overflow: "hidden", border: `1px solid ${V.border}`, width: "fit-content" }}>
        {(["PF", "PJ"] as const).map((t) => (
          <button
            key={t}
            onClick={() => upSol("tipo", t)}
            style={{
              padding: "8px 24px", border: "none", cursor: "pointer", fontWeight: 600, fontSize: 14,
              background: solicitante.tipo === t ? V.green700 : V.panel,
              color: solicitante.tipo === t ? "#fff" : V.ink,
            }}
          >
            {t === "PF" ? "Pessoa Física" : "Pessoa Jurídica"}
          </button>
        ))}
      </div>

      {solicitante.tipo === "PF" ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Nome Completo" req>
              <input style={inputSt} value={solicitante.nome} onChange={(e) => upSol("nome", e.target.value)} />
            </Field>
            <Field label="CPF" req>
              <input style={inputSt} value={solicitante.cpf} onChange={(e) => upSol("cpf", e.target.value)} placeholder="000.000.000-00" />
            </Field>
            <Field label="RG">
              <input style={inputSt} value={solicitante.rg} onChange={(e) => upSol("rg", e.target.value)} />
            </Field>
            <Field label="Data de Nascimento">
              <input style={inputSt} type="date" value={solicitante.nascimento} onChange={(e) => upSol("nascimento", e.target.value)} />
            </Field>
            <Field label="Estado Civil">
              <select style={inputSt} value={solicitante.estado_civil} onChange={(e) => upSol("estado_civil", e.target.value)}>
                <option value="">Selecione</option>
                {["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União Estável"].map((o) => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </Field>
            <Field label="Profissão">
              <input style={inputSt} value={solicitante.profissao} onChange={(e) => upSol("profissao", e.target.value)} />
            </Field>
            <Field label="Telefone" req>
              <input style={inputSt} value={solicitante.telefone} onChange={(e) => upSol("telefone", e.target.value)} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="E-mail" req>
              <input style={inputSt} type="email" value={solicitante.email} onChange={(e) => upSol("email", e.target.value)} />
            </Field>
          </div>
          <h3 style={{ fontSize: 16, color: V.ink, margin: "20px 0 12px", borderTop: `1px solid ${V.border}`, paddingTop: 16 }}>Endereço</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="CEP">
              <input style={inputSt} value={solicitante.cep} onChange={(e) => upSol("cep", e.target.value)} placeholder="00000-000" />
            </Field>
            <Field label="Logradouro">
              <input style={inputSt} value={solicitante.logradouro} onChange={(e) => upSol("logradouro", e.target.value)} />
            </Field>
            <Field label="Número">
              <input style={inputSt} value={solicitante.numero} onChange={(e) => upSol("numero", e.target.value)} />
            </Field>
            <Field label="Bairro">
              <input style={inputSt} value={solicitante.bairro} onChange={(e) => upSol("bairro", e.target.value)} />
            </Field>
            <Field label="Cidade" req>
              <input style={inputSt} value={solicitante.cidade} onChange={(e) => upSol("cidade", e.target.value)} />
            </Field>
            <Field label="UF" req>
              <select style={inputSt} value={solicitante.uf} onChange={(e) => upSol("uf", e.target.value)}>
                <option value="">Selecione</option>
                {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
        </>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Razão Social" req>
              <input style={inputSt} value={solicitante.razao_social} onChange={(e) => upSol("razao_social", e.target.value)} />
            </Field>
            <Field label="CNPJ" req>
              <input style={inputSt} value={solicitante.cnpj} onChange={(e) => upSol("cnpj", e.target.value)} placeholder="00.000.000/0000-00" />
            </Field>
            <Field label="Nome do Responsável" req>
              <input style={inputSt} value={solicitante.nome_responsavel} onChange={(e) => upSol("nome_responsavel", e.target.value)} />
            </Field>
            <Field label="CPF do Responsável" req>
              <input style={inputSt} value={solicitante.cpf_responsavel} onChange={(e) => upSol("cpf_responsavel", e.target.value)} placeholder="000.000.000-00" />
            </Field>
            <Field label="Telefone" req>
              <input style={inputSt} value={solicitante.telefone} onChange={(e) => upSol("telefone", e.target.value)} placeholder="(00) 00000-0000" />
            </Field>
            <Field label="E-mail" req>
              <input style={inputSt} type="email" value={solicitante.email} onChange={(e) => upSol("email", e.target.value)} />
            </Field>
          </div>
          <h3 style={{ fontSize: 16, color: V.ink, margin: "20px 0 12px", borderTop: `1px solid ${V.border}`, paddingTop: 16 }}>Endereço</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="CEP">
              <input style={inputSt} value={solicitante.cep} onChange={(e) => upSol("cep", e.target.value)} placeholder="00000-000" />
            </Field>
            <Field label="Logradouro">
              <input style={inputSt} value={solicitante.logradouro} onChange={(e) => upSol("logradouro", e.target.value)} />
            </Field>
            <Field label="Número">
              <input style={inputSt} value={solicitante.numero} onChange={(e) => upSol("numero", e.target.value)} />
            </Field>
            <Field label="Bairro">
              <input style={inputSt} value={solicitante.bairro} onChange={(e) => upSol("bairro", e.target.value)} />
            </Field>
            <Field label="Cidade" req>
              <input style={inputSt} value={solicitante.cidade} onChange={(e) => upSol("cidade", e.target.value)} />
            </Field>
            <Field label="UF" req>
              <select style={inputSt} value={solicitante.uf} onChange={(e) => upSol("uf", e.target.value)}>
                <option value="">Selecione</option>
                {UF_LIST.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
          </div>
        </>
      )}
    </div>
  );

  /* ── Step 3: Partes ────────────────────────────────────── */
  const renderStep3 = () => (
    <div>
      <h2 style={{ margin: 0, fontSize: 20, color: V.ink }}>Partes do Contrato</h2>
      <p style={{ color: V.muted, fontSize: 14, margin: "4px 0 16px" }}>
        Adicione todas as partes envolvidas no contrato.
      </p>

      <button
        onClick={addParte}
        style={{
          padding: "8px 20px", borderRadius: 8, border: `1px dashed ${V.green500}`,
          background: "#f0fdf4", color: V.green700, fontWeight: 600,
          fontSize: 14, cursor: "pointer", marginBottom: 16,
        }}
      >
        + Adicionar Parte
      </button>

      {partes.length === 0 && (
        <p style={{ color: V.muted, fontSize: 14, fontStyle: "italic" }}>
          Nenhuma parte adicionada. Clique acima para adicionar.
        </p>
      )}

      {partes.map((p, i) => (
        <div
          key={p.id}
          style={{
            padding: 16, border: `1px solid ${V.border}`, borderRadius: 10,
            marginBottom: 12, background: V.panel, position: "relative",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: V.ink }}>Parte {i + 1}</span>
            <button
              onClick={() => rmParte(p.id)}
              style={{
                background: "none", border: "none", color: V.danger,
                cursor: "pointer", fontSize: 18, fontWeight: 700,
              }}
            >
              &times;
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <Field label="Nome" req>
              <input style={inputSt} value={p.nome} onChange={(e) => upParte(p.id, "nome", e.target.value)} />
            </Field>
            <Field label="Documento (CPF/CNPJ)" req>
              <input style={inputSt} value={p.documento} onChange={(e) => upParte(p.id, "documento", e.target.value)} />
            </Field>
            <Field label="E-mail">
              <input style={inputSt} type="email" value={p.email} onChange={(e) => upParte(p.id, "email", e.target.value)} />
            </Field>
            <Field label="Telefone">
              <input style={inputSt} value={p.telefone} onChange={(e) => upParte(p.id, "telefone", e.target.value)} />
            </Field>
          </div>
          <Field label="Papel">
            <select style={inputSt} value={p.papel} onChange={(e) => upParte(p.id, "papel", e.target.value)}>
              {PAPEIS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
        </div>
      ))}

      {/* Summary table */}
      {partes.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 15, color: V.ink, marginBottom: 8 }}>Resumo das Partes</h3>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8faf9", textAlign: "left" }}>
                {["Nome","Documento","E-mail","Papel"].map((h) => (
                  <th key={h} style={{ padding: "8px 10px", borderBottom: `1px solid ${V.border}`, color: V.muted, fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {partes.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${V.border}` }}>{p.nome || "—"}</td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${V.border}` }}>{p.documento || "—"}</td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${V.border}` }}>{p.email || "—"}</td>
                  <td style={{ padding: "8px 10px", borderBottom: `1px solid ${V.border}` }}>{p.papel}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ── Step 4: Dados Específicos ──────────────────────────── */
  const renderStep4 = () => {
    const fields = getSpecificFields();
    return (
      <div>
        <h2 style={{ margin: 0, fontSize: 20, color: V.ink }}>Dados Específicos</h2>
        <p style={{ color: V.muted, fontSize: 14, margin: "4px 0 16px" }}>
          Preencha os dados específicos para o contrato de <strong>{tipoSelecionado?.nome}</strong>.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: fields.some((f) => f.type === "textarea") ? "1fr" : "1fr 1fr", gap: "0 16px" }}>
          {fields.map((f) => (
            <Field key={f.key} label={f.label}>
              {f.type === "textarea" ? (
                <textarea
                  style={{ ...inputSt, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
                  value={dados[f.key] || ""}
                  onChange={(e) => upDados(f.key, e.target.value)}
                />
              ) : f.type === "dropdown" ? (
                <select style={inputSt} value={dados[f.key] || ""} onChange={(e) => upDados(f.key, e.target.value)}>
                  <option value="">Selecione</option>
                  {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "currency" ? (
                <input
                  style={inputSt}
                  value={dados[f.key] || ""}
                  onChange={(e) => upDados(f.key, e.target.value)}
                  placeholder="R$ 0,00"
                />
              ) : (
                <input
                  style={inputSt}
                  value={dados[f.key] || ""}
                  onChange={(e) => upDados(f.key, e.target.value)}
                />
              )}
            </Field>
          ))}
        </div>
      </div>
    );
  };

  /* ── Step 5: Pré-visualização ──────────────────────────── */
  const renderStep5 = () => {
    const tipoNome = (tipoSelecionado?.nome || "").toUpperCase();
    const nomeSol = solicitante.tipo === "PF" ? solicitante.nome : solicitante.razao_social;
    const docSol = solicitante.tipo === "PF" ? solicitante.cpf : solicitante.cnpj;

    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: V.ink }}>Pré-visualização do Contrato</h2>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            {[80, 100, 120].map((z) => (
              <button
                key={z}
                onClick={() => setZoom(z)}
                style={{
                  padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${V.border}`,
                  background: zoom === z ? V.green700 : V.panel,
                  color: zoom === z ? "#fff" : V.ink,
                }}
              >
                {z}%
              </button>
            ))}
          </div>
        </div>

        <div style={{
          transform: `scale(${zoom / 100})`, transformOrigin: "top left",
          width: `${10000 / zoom}%`,
        }}>
          <div style={{
            background: "#fff", border: `1px solid ${V.border}`, borderRadius: 4,
            padding: "48px 56px", maxWidth: 700, margin: "0 auto",
            boxShadow: "0 2px 12px rgba(0,0,0,.08)", fontFamily: "'Times New Roman', serif",
            fontSize: 14, lineHeight: 1.8, color: "#1a1a1a",
          }}>
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h1 style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, margin: 0 }}>
                CONTRATO DE {tipoNome}
              </h1>
              <p style={{ fontSize: 12, color: "#666", margin: "8px 0 0" }}>
                N.o {contratoNum} | Data: {new Date().toLocaleDateString("pt-BR")}
              </p>
            </div>

            {/* Clause 1 */}
            <p style={{ marginBottom: 16 }}>
              <strong>CLÁUSULA 1a - DAS PARTES</strong>
            </p>
            <p style={{ marginBottom: 8 }}>
              De um lado, <strong>{nomeSol || "[NOME DO SOLICITANTE]"}</strong>,
              inscrito no {solicitante.tipo === "PF" ? "CPF" : "CNPJ"} sob
              o n.o <strong>{docSol || "[DOCUMENTO]"}</strong>,
              {solicitante.cidade ? ` residente em ${solicitante.cidade}/${solicitante.uf}` : ""}.
            </p>
            {partes.filter((_, i) => i > 0).map((p, i) => (
              <p key={p.id} style={{ marginBottom: 8 }}>
                De outro lado ({p.papel}), <strong>{p.nome || "[NOME]"}</strong>,
                inscrito no CPF/CNPJ sob o n.o <strong>{p.documento || "[DOCUMENTO]"}</strong>
                {p.email ? `, e-mail: ${p.email}` : ""}.
              </p>
            ))}

            {/* Clause 2 */}
            <p style={{ marginTop: 20, marginBottom: 16 }}>
              <strong>CLÁUSULA 2a - DO OBJETO</strong>
            </p>
            <p>
              {dados.objeto || dados.escopo || dados.descricao_imovel || dados.informacoes_protegidas
                || `O presente contrato tem por objeto a formalização de ${tipoSelecionado?.nome || "acordo"} entre as partes acima qualificadas.`}
            </p>

            {/* Clause 3 */}
            <p style={{ marginTop: 20, marginBottom: 16 }}>
              <strong>CLÁUSULA 3a - DO VALOR E PAGAMENTO</strong>
            </p>
            <p>
              {dados.valor || dados.valor_aluguel
                ? `O valor acordado é de ${dados.valor || dados.valor_aluguel}${dados.forma_pagamento ? `, a ser pago na forma: ${dados.forma_pagamento}` : ""}.`
                : "O valor e forma de pagamento serão definidos em comum acordo entre as partes."}
            </p>

            {/* Clause 4 */}
            <p style={{ marginTop: 20, marginBottom: 16 }}>
              <strong>CLÁUSULA 4a - DO PRAZO</strong>
            </p>
            <p>
              {dados.prazo
                ? `O presente contrato terá vigência de ${dados.prazo}, podendo ser renovado mediante acordo entre as partes.`
                : "O prazo de vigência será definido em comum acordo entre as partes."}
            </p>

            {/* Clause 5 */}
            <p style={{ marginTop: 20, marginBottom: 16 }}>
              <strong>CLÁUSULA 5a - DAS CONDIÇÕES GERAIS</strong>
            </p>
            <p>
              {dados.condicoes || dados.penalidades || dados.excecoes
                || "As partes se comprometem a cumprir todas as cláusulas e condições estabelecidas neste instrumento, sob pena das sanções previstas em lei."}
            </p>

            {/* Clause 6 */}
            <p style={{ marginTop: 20, marginBottom: 16 }}>
              <strong>CLÁUSULA 6a - DO FORO</strong>
            </p>
            <p>
              Fica eleito o foro da comarca de {dados.foro || solicitante.cidade || "[CIDADE]"}/{solicitante.uf || "UF"} para
              dirimir quaisquer questões oriundas deste contrato.
            </p>

            {/* Signatures */}
            <div style={{ marginTop: 56, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
              {partes.slice(0, 4).map((p) => (
                <div key={p.id} style={{ textAlign: "center" }}>
                  <div style={{ borderTop: "1px solid #333", paddingTop: 8, marginTop: 48 }}>
                    <div style={{ fontWeight: 600 }}>{p.nome || "________________"}</div>
                    <div style={{ fontSize: 12, color: "#666" }}>{p.papel} — {p.documento || "CPF/CNPJ"}</div>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 40, textAlign: "center", fontSize: 11, color: "#999" }}>
              Testemunhas: _________________ | _________________
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── Step 6: Conclusão ─────────────────────────────────── */
  const renderStep6 = () => {
    const preco = tipoSelecionado?.preco || 0;

    if (concluido) {
      return (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%", background: "#dcfce7",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 20, fontSize: 40,
          }}>
            &#10003;
          </div>
          <h2 style={{ color: V.green700, margin: "0 0 8px", fontSize: 24 }}>Contrato gerado!</h2>
          <p style={{ color: V.muted, fontSize: 14, marginBottom: 20 }}>
            Seu contrato foi gerado com sucesso e está pronto para uso.
          </p>
          <div style={{
            background: "#f8faf9", borderRadius: 10, padding: 20,
            display: "inline-block", textAlign: "left", marginBottom: 24,
          }}>
            <div style={{ fontSize: 13, color: V.muted, marginBottom: 4 }}>Número do Contrato</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: V.ink, marginBottom: 12 }}>{contratoNum}</div>
            <div style={{ fontSize: 13, color: V.muted, marginBottom: 4 }}>Hash de Verificação</div>
            <div style={{ fontSize: 14, fontFamily: "monospace", color: V.ink }}>{contratoHash}</div>
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button style={{
              padding: "10px 24px", borderRadius: 8, border: "none",
              background: V.green700, color: "#fff", fontWeight: 600,
              fontSize: 14, cursor: "pointer",
            }}>
              Baixar PDF
            </button>
            <button style={{
              padding: "10px 24px", borderRadius: 8, border: `1px solid ${V.green700}`,
              background: V.panel, color: V.green700, fontWeight: 600,
              fontSize: 14, cursor: "pointer",
            }}>
              Solicitar Assinatura
            </button>
            <button
              onClick={() => {
                setStep(1); setConcluido(false); setTipoSelecionado(null);
                setSolicitante(emptySolicitante()); setPartes([]); setDados({});
              }}
              style={{
                padding: "10px 24px", borderRadius: 8, border: `1px solid ${V.border}`,
                background: V.panel, color: V.ink, fontWeight: 600,
                fontSize: 14, cursor: "pointer",
              }}
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      );
    }

    return (
      <div>
        <h2 style={{ margin: 0, fontSize: 20, color: V.ink }}>Conclusão</h2>
        <p style={{ color: V.muted, fontSize: 14, margin: "4px 0 20px" }}>
          {preco > 0
            ? "Revise o valor e escolha a forma de pagamento para gerar seu contrato."
            : "Tudo pronto! Clique abaixo para gerar seu contrato."}
        </p>

        {preco > 0 ? (
          <div style={{
            background: "#f8faf9", borderRadius: 12, padding: 24,
            border: `1px solid ${V.border}`, marginBottom: 24,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 14, color: V.muted }}>Contrato: {tipoSelecionado?.nome}</span>
              <span style={{ fontSize: 22, fontWeight: 700, color: V.green700 }}>{fmt(preco)}</span>
            </div>

            <Field label="Forma de Pagamento">
              <div style={{ display: "flex", gap: 8 }}>
                {["PIX", "Cartão", "Boleto"].map((m) => (
                  <button
                    key={m}
                    onClick={() => setPagamento(m)}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 8, fontWeight: 600, fontSize: 14,
                      cursor: "pointer",
                      border: pagamento === m ? `2px solid ${V.green500}` : `1px solid ${V.border}`,
                      background: pagamento === m ? "#f0fdf4" : V.panel,
                      color: pagamento === m ? V.green700 : V.ink,
                    }}
                  >
                    {m === "PIX" ? "⚡ PIX" : m === "Cartão" ? "💳 Cartão" : "📄 Boleto"}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Cupom de Desconto">
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  style={{ ...inputSt, flex: 1 }}
                  value={cupom}
                  onChange={(e) => setCupom(e.target.value)}
                  placeholder="Digite o cupom"
                />
                <button style={{
                  padding: "10px 20px", borderRadius: 8, border: `1px solid ${V.border}`,
                  background: V.panel, color: V.ink, fontWeight: 600, fontSize: 14, cursor: "pointer",
                }}>
                  Aplicar
                </button>
              </div>
            </Field>

            <button
              onClick={() => setConcluido(true)}
              style={{
                width: "100%", padding: "14px 0", borderRadius: 10, border: "none",
                background: V.green700, color: "#fff", fontWeight: 700,
                fontSize: 16, cursor: "pointer", marginTop: 8,
              }}
            >
              Pagar e Gerar Contrato
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "20px 0" }}>
            <div style={{
              background: "#f0fdf4", borderRadius: 12, padding: 24,
              border: `1px solid ${V.border}`, marginBottom: 20, display: "inline-block",
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: V.green700, marginBottom: 4 }}>
                {tipoSelecionado?.nome}
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, color: V.muted }}>Gratuito</div>
            </div>
            <br />
            <button
              onClick={() => setConcluido(true)}
              style={{
                padding: "14px 40px", borderRadius: 10, border: "none",
                background: V.green700, color: "#fff", fontWeight: 700,
                fontSize: 16, cursor: "pointer",
              }}
            >
              Gerar Contrato
            </button>
          </div>
        )}
      </div>
    );
  };

  /* ── Step renderer dispatch ────────────────────────────── */
  const renderStep = () => {
    switch (step) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      default: return null;
    }
  };

  /* ── Right panel: Live preview ─────────────────────────── */
  const renderPreview = () => {
    const nomeSol = solicitante.tipo === "PF" ? solicitante.nome : solicitante.razao_social;
    const docSol = solicitante.tipo === "PF" ? solicitante.cpf : solicitante.cnpj;

    return (
      <div style={{
        width: 280, minWidth: 280, background: V.panel, borderLeft: `1px solid ${V.border}`,
        padding: 20, display: "flex", flexDirection: "column", gap: 0,
        overflowY: "auto", height: "100%",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 14, color: V.ink }}>Resumo</h3>
          <span style={{ fontSize: 11, color: V.green500, fontWeight: 500 }}>
            &#10003; Salvo às {savedAt}
          </span>
        </div>

        {/* Tipo */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: V.muted, marginBottom: 2, textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5 }}>Tipo</div>
          <div style={{ fontSize: 13, color: V.ink, fontWeight: 500 }}>
            {tipoSelecionado ? `${tipoSelecionado.icone} ${tipoSelecionado.nome}` : "—"}
          </div>
        </div>

        {/* Preço */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: V.muted, marginBottom: 2, textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5 }}>Valor</div>
          <div style={{ fontSize: 13, color: V.ink, fontWeight: 500 }}>
            {tipoSelecionado ? (tipoSelecionado.preco > 0 ? fmt(tipoSelecionado.preco) : "Gratuito") : "—"}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${V.border}`, margin: "4px 0 14px" }} />

        {/* Solicitante */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: V.muted, marginBottom: 2, textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5 }}>Solicitante</div>
          <div style={{ fontSize: 13, color: V.ink }}>
            {nomeSol || <span style={{ color: V.muted, fontStyle: "italic" }}>Não preenchido</span>}
          </div>
          {docSol && <div style={{ fontSize: 12, color: V.muted }}>{docSol}</div>}
          {solicitante.email && <div style={{ fontSize: 12, color: V.muted }}>{solicitante.email}</div>}
          {solicitante.cidade && <div style={{ fontSize: 12, color: V.muted }}>{solicitante.cidade}/{solicitante.uf}</div>}
        </div>

        <div style={{ borderTop: `1px solid ${V.border}`, margin: "4px 0 14px" }} />

        {/* Partes */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: V.muted, marginBottom: 6, textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5 }}>
            Partes ({partes.length})
          </div>
          {partes.length === 0 ? (
            <div style={{ fontSize: 12, color: V.muted, fontStyle: "italic" }}>Nenhuma</div>
          ) : (
            partes.map((p) => (
              <div key={p.id} style={{ marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: V.ink }}>{p.nome || "—"}</div>
                <div style={{ fontSize: 11, color: V.muted }}>{p.papel} — {p.documento || "—"}</div>
              </div>
            ))
          )}
        </div>

        <div style={{ borderTop: `1px solid ${V.border}`, margin: "4px 0 14px" }} />

        {/* Dados específicos */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: V.muted, marginBottom: 6, textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5 }}>
            Dados do Contrato
          </div>
          {Object.keys(dados).length === 0 ? (
            <div style={{ fontSize: 12, color: V.muted, fontStyle: "italic" }}>Nenhum dado</div>
          ) : (
            Object.entries(dados)
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k} style={{ marginBottom: 4 }}>
                  <div style={{ fontSize: 11, color: V.muted }}>{k.replace(/_/g, " ")}</div>
                  <div style={{ fontSize: 12, color: V.ink, wordBreak: "break-word" }}>
                    {v.length > 60 ? v.slice(0, 60) + "..." : v}
                  </div>
                </div>
              ))
          )}
        </div>

        <div style={{ borderTop: `1px solid ${V.border}`, margin: "4px 0 14px" }} />

        {/* Número contrato */}
        <div>
          <div style={{ fontSize: 11, color: V.muted, marginBottom: 2, textTransform: "uppercase", fontWeight: 600, letterSpacing: 0.5 }}>Contrato</div>
          <div style={{ fontSize: 12, fontFamily: "monospace", color: V.ink }}>{contratoNum}</div>
        </div>
      </div>
    );
  };

  /* =============================================================
     MAIN RENDER
     ============================================================= */
  return (
    <AppShell>
      <div style={{
        display: "flex", height: "calc(100vh - 64px)",
        background: V.bg, fontFamily: "'Inter', -apple-system, sans-serif",
      }}>
        {/* ── LEFT: Stepper ──────────────────────────────────── */}
        <div style={{
          width: 200, minWidth: 200, background: V.panel,
          borderRight: `1px solid ${V.border}`, padding: "24px 16px",
          display: "flex", flexDirection: "column",
        }}>
          <h3 style={{ fontSize: 13, color: V.muted, margin: "0 0 20px", textTransform: "uppercase", letterSpacing: 1, fontWeight: 600 }}>
            Etapas
          </h3>

          {STEPS.map((s) => {
            const done = s.num < step;
            const active = s.num === step;
            const future = s.num > step;
            return (
              <div
                key={s.num}
                onClick={() => goStep(s.num)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 8px", borderRadius: 8, marginBottom: 4,
                  cursor: done ? "pointer" : "default",
                  background: active ? "#f0fdf4" : "transparent",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 700,
                  background: done ? V.green500 : active ? V.blue : "#e5e7eb",
                  color: done || active ? "#fff" : V.muted,
                }}>
                  {done ? "✓" : s.num}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  color: future ? V.muted : V.ink,
                }}>
                  {s.title}
                </span>
              </div>
            );
          })}

          {/* Progress bar */}
          <div style={{ marginTop: "auto", paddingTop: 20 }}>
            <div style={{ fontSize: 12, color: V.muted, marginBottom: 6, fontWeight: 500 }}>
              Progresso: {pct}%
            </div>
            <div style={{
              height: 6, borderRadius: 3, background: "#e5e7eb", overflow: "hidden",
            }}>
              <div style={{
                height: "100%", borderRadius: 3,
                background: `linear-gradient(90deg, ${V.green500}, ${V.green400})`,
                width: `${pct}%`, transition: "width .3s",
              }} />
            </div>
          </div>
        </div>

        {/* ── CENTER: Form ───────────────────────────────────── */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "28px 32px",
          display: "flex", flexDirection: "column",
        }}>
          <div style={{ flex: 1 }}>
            {renderStep()}
          </div>

          {/* Navigation buttons */}
          {!(step === 6 && concluido) && (
            <div style={{
              display: "flex", justifyContent: "space-between",
              paddingTop: 20, borderTop: `1px solid ${V.border}`, marginTop: 20,
            }}>
              <button
                onClick={prev}
                disabled={step === 1}
                style={{
                  padding: "10px 24px", borderRadius: 8, border: `1px solid ${V.border}`,
                  background: V.panel, color: step === 1 ? V.muted : V.ink,
                  fontWeight: 600, fontSize: 14, cursor: step === 1 ? "not-allowed" : "pointer",
                  opacity: step === 1 ? 0.5 : 1,
                }}
              >
                &#8592; Anterior
              </button>
              {step < 6 && (
                <button
                  onClick={next}
                  disabled={!canNext()}
                  style={{
                    padding: "10px 24px", borderRadius: 8, border: "none",
                    background: canNext() ? V.green700 : "#ccc",
                    color: "#fff", fontWeight: 600, fontSize: 14,
                    cursor: canNext() ? "pointer" : "not-allowed",
                  }}
                >
                  Próximo &#8594;
                </button>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT: Live Preview ────────────────────────────── */}
        {renderPreview()}
      </div>
    </AppShell>
  );
}
