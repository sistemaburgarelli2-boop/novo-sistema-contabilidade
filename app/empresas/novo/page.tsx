"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── CSS Variables ──────────────────────────────────────────── */
const V = {
  bg: "#f3f8f5", panel: "#ffffff", ink: "#07170d", muted: "#6f8f7c",
  green700: "#075f3c", green500: "#10b981", green400: "#18d19b",
  gold: "#d4ae4a", border: "#dfece5", danger: "#ef445f",
};

/* ─── Constantes ─────────────────────────────────────────────── */
const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const NATUREZAS = ["EI","MEI","EIRELI","LTDA","SLU","SA","Simples"];
const PORTES = ["MEI","ME","EPP","Médio","Grande"];
const REGIMES = ["MEI","Simples Nacional","Lucro Presumido","Lucro Real"];
const FAIXAS_RENDA = ["Até R$ 3.000","R$ 3.000 – 10.000","R$ 10.000 – 30.000","R$ 30.000 – 100.000","Acima de R$ 100.000"];
const FAIXAS_FATURAMENTO = ["Até R$ 81.000","R$ 81.000 – 360.000","R$ 360.000 – 4.800.000","Acima de R$ 4.800.000"];

const DOC_CATEGORIES = [
  { key: "rg", label: "RG", icon: "🪪" },
  { key: "cpf", label: "CPF", icon: "📄" },
  { key: "comp_residencia", label: "Comprovante de Residência", icon: "🏠" },
  { key: "contrato_social", label: "Contrato Social", icon: "📑" },
  { key: "cartao_cnpj", label: "Cartão CNPJ", icon: "🏢" },
  { key: "certificado_digital", label: "Certificado Digital", icon: "🔐" },
  { key: "extratos", label: "Extratos", icon: "🏦" },
  { key: "outros", label: "Outros", icon: "📁" },
];

const STEPS = [
  { num: 1, title: "Dados do Cliente" },
  { num: 2, title: "Endereço" },
  { num: 3, title: "Dados Empresariais" },
  { num: 4, title: "Constituição Societária" },
  { num: 5, title: "Fiscal + Tributação" },
  { num: 6, title: "Documentos" },
  { num: 7, title: "Criação do Portal" },
  { num: 8, title: "Revisão" },
  { num: 9, title: "Conclusão" },
];

/* ─── Tipos ──────────────────────────────────────────────────── */
type Socio = {
  nome_socio: string; cpf_socio: string; participacao: string;
  administrador: boolean; telefone_socio: string; email_socio: string;
};

type DocStatus = "pendente" | "recebido" | "conferido" | "aprovado";
type DocItem = { key: string; status: DocStatus; fileName: string };

type FormState = {
  /* step 1 */
  nome_completo: string; cpf: string; rg: string; data_nascimento: string;
  sexo: string; estado_civil: string; profissao: string; telefone: string;
  whatsapp: string; email_principal: string; email_financeiro: string;
  email_fiscal: string; observacoes: string;
  /* step 2 */
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; cidade: string; uf: string; escolaridade: string;
  nacionalidade: string; naturalidade: string; renda_aproximada: string;
  possui_socios: boolean; qtd_socios: number; contato_emergencia: string;
  /* step 3 */
  razao_social: string; nome_fantasia: string; natureza_juridica: string;
  porte: string; regime_tributario: string; data_abertura: string;
  capital_social: string; objeto_social: string; descricao_atividade: string;
  cnae_principal: string; cnaes_secundarios: string; telefone_empresa: string;
  email_empresa: string; site: string; cep_empresa: string;
  logradouro_empresa: string; numero_empresa: string; bairro_empresa: string;
  cidade_empresa: string; uf_empresa: string; funcionarios_previstos: number;
  faturamento_estimado: string; possui_certificado: boolean;
  possui_contador_anterior: boolean;
  /* step 5 */
  inscricao_estadual: string; inscricao_municipal: string;
  necessita_alvara: boolean; emite_nota: boolean; tem_funcionarios: boolean;
  tem_estoque: boolean; responsavel_fiscal: string;
  /* step 7 */
  nome_portal: string; email_portal: string; telefone_portal: string;
  senha_portal: string; enviar_email: boolean; enviar_whatsapp: boolean;
};

const initialForm: FormState = {
  nome_completo: "", cpf: "", rg: "", data_nascimento: "", sexo: "",
  estado_civil: "", profissao: "", telefone: "", whatsapp: "",
  email_principal: "", email_financeiro: "", email_fiscal: "", observacoes: "",
  cep: "", logradouro: "", numero: "", complemento: "", bairro: "",
  cidade: "", uf: "", escolaridade: "", nacionalidade: "Brasileira",
  naturalidade: "", renda_aproximada: "", possui_socios: false,
  qtd_socios: 0, contato_emergencia: "",
  razao_social: "", nome_fantasia: "", natureza_juridica: "",
  porte: "", regime_tributario: "", data_abertura: "", capital_social: "",
  objeto_social: "", descricao_atividade: "", cnae_principal: "",
  cnaes_secundarios: "", telefone_empresa: "", email_empresa: "", site: "",
  cep_empresa: "", logradouro_empresa: "", numero_empresa: "",
  bairro_empresa: "", cidade_empresa: "", uf_empresa: "",
  funcionarios_previstos: 0, faturamento_estimado: "",
  possui_certificado: false, possui_contador_anterior: false,
  inscricao_estadual: "", inscricao_municipal: "", necessita_alvara: false,
  emite_nota: true, tem_funcionarios: false, tem_estoque: false,
  responsavel_fiscal: "",
  nome_portal: "", email_portal: "", telefone_portal: "",
  senha_portal: "", enviar_email: true, enviar_whatsapp: false,
};

/* ─── Estilos utilitários ────────────────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: `1px solid ${V.border}`,
  borderRadius: 8, fontSize: 14, color: V.ink, background: V.panel,
  outline: "none", transition: "border-color .2s",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: V.ink,
  marginBottom: 4,
};

const gridRow = (cols: number): React.CSSProperties => ({
  display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`,
  gap: 16, marginBottom: 16,
});

/* ─── Componentes auxiliares ─────────────────────────────────── */
function Req() {
  return <span style={{ color: V.danger, marginLeft: 2 }}>*</span>;
}

function Field({ label, required, children }: {
  label: string; required?: boolean; children: React.ReactNode;
}) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <Req />}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}
      onClick={() => onChange(!checked)}>
      <div style={{
        width: 44, height: 24, borderRadius: 12,
        background: checked ? V.green500 : V.border,
        position: "relative", transition: "background .2s",
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: "50%", background: V.panel,
          position: "absolute", top: 3,
          left: checked ? 22 : 4, transition: "left .2s",
          boxShadow: "0 1px 3px rgba(0,0,0,.15)",
        }} />
      </div>
      <span style={{ fontSize: 14, color: V.ink }}>{label}</span>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 12,
      fontSize: 12, fontWeight: 600, background: color + "18",
      color, marginRight: 6, marginBottom: 4,
    }}>{text}</span>
  );
}

/* ─── Componente principal ───────────────────────────────────── */
export default function NovaEmpresaPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [docs, setDocs] = useState<DocItem[]>([
    { key: "cpf", status: "recebido", fileName: "cpf_cliente.pdf" },
    { key: "rg", status: "recebido", fileName: "rg_frente_verso.pdf" },
    { key: "contrato_social", status: "recebido", fileName: "contrato_social_v2.pdf" },
  ]);
  const [savedAt, setSavedAt] = useState<string>("");
  const [empresaCriadaId, setEmpresaCriadaId] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [newSocio, setNewSocio] = useState<Socio>({
    nome_socio: "", cpf_socio: "", participacao: "",
    administrador: false, telefone_socio: "", email_socio: "",
  });

  /* helpers */
  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  const buscarCep = useCallback(async (cep: string, tipo: "pessoal" | "empresa" = "pessoal") => {
    const limpo = cep.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    try {
      const res = await fetch(`/api/cep/${limpo}`);
      const data = await res.json();
      if (data.erro || !res.ok) return;
      if (tipo === "empresa") {
        setForm(prev => ({
          ...prev,
          logradouro_empresa: data.logradouro || prev.logradouro_empresa,
          bairro_empresa: data.bairro || prev.bairro_empresa,
          cidade_empresa: data.localidade || prev.cidade_empresa,
          uf_empresa: data.uf || prev.uf_empresa,
        }));
      } else {
        setForm(prev => ({
          ...prev,
          logradouro: data.logradouro || prev.logradouro,
          bairro: data.bairro || prev.bairro,
          cidade: data.localidade || prev.cidade,
          uf: data.uf || prev.uf,
        }));
      }
    } catch { /* silently fail */ }
  }, []);

  /* auto-save timestamp */
  useEffect(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    setSavedAt(`${hh}:${mm}`);
  }, [form, socios, docs]);

  /* pre-fill portal from step 1 */
  useEffect(() => {
    if (step === 7) {
      setForm(prev => ({
        ...prev,
        nome_portal: prev.nome_portal || prev.nome_completo,
        email_portal: prev.email_portal || prev.email_principal,
        telefone_portal: prev.telefone_portal || prev.telefone,
      }));
    }
  }, [step]);

  /* ── Validation ───────────────────────────────────────────── */
  const isStepValid = (s: number): boolean => {
    switch (s) {
      case 1: return !!(form.nome_completo && form.cpf && form.telefone && form.email_principal);
      case 2: return !!(form.cep && form.logradouro && form.cidade && form.uf);
      case 3: return !!(form.razao_social && form.nome_fantasia && form.cnae_principal);
      case 4:
        if (!form.possui_socios) return true;
        if (socios.length === 0) return false;
        const total = socios.reduce((s, sc) => s + (parseFloat(sc.participacao) || 0), 0);
        return Math.abs(total - 100) < 0.01;
      case 5: return true;
      case 6: return docs.length >= 3;
      case 7: return !!(form.email_portal);
      case 8: return true;
      case 9: return true;
      default: return true;
    }
  };

  const completedSteps = STEPS.filter(s => s.num < step && isStepValid(s.num)).map(s => s.num);
  const progressPct = Math.round((completedSteps.length / (STEPS.length - 1)) * 100);

  const goNext = async () => {
    if (step === 8) {
      setSalvando(true);
      setErroSalvar(null);
      try {
        const metadata = {
          nome_completo: form.nome_completo, cpf: form.cpf, rg: form.rg,
          data_nascimento: form.data_nascimento, sexo: form.sexo,
          estado_civil: form.estado_civil, profissao: form.profissao,
          telefone: form.telefone, whatsapp: form.whatsapp,
          email_principal: form.email_principal, email_financeiro: form.email_financeiro,
          email_fiscal: form.email_fiscal, observacoes: form.observacoes,
          cep: form.cep, logradouro: form.logradouro, numero: form.numero,
          complemento: form.complemento, bairro: form.bairro,
          escolaridade: form.escolaridade, nacionalidade: form.nacionalidade,
          naturalidade: form.naturalidade, renda_aproximada: form.renda_aproximada,
          natureza_juridica: form.natureza_juridica, porte: form.porte,
          data_abertura: form.data_abertura, capital_social: form.capital_social,
          objeto_social: form.objeto_social, descricao_atividade: form.descricao_atividade,
          cnae_principal: form.cnae_principal, cnaes_secundarios: form.cnaes_secundarios,
          telefone_empresa: form.telefone_empresa, email_empresa: form.email_empresa,
          site: form.site, cep_empresa: form.cep_empresa,
          logradouro_empresa: form.logradouro_empresa, numero_empresa: form.numero_empresa,
          bairro_empresa: form.bairro_empresa, cidade_empresa: form.cidade_empresa,
          uf_empresa: form.uf_empresa, funcionarios_previstos: form.funcionarios_previstos,
          faturamento_estimado: form.faturamento_estimado,
          inscricao_estadual: form.inscricao_estadual,
          inscricao_municipal: form.inscricao_municipal,
          email_portal: form.email_portal, nome_portal: form.nome_portal,
          telefone_portal: form.telefone_portal,
        };
        const res = await fetch("/api/empresas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nome_legal: form.razao_social,
            nome_fantasia: form.nome_fantasia,
            regime_tributario: form.regime_tributario || undefined,
            cidade: form.cidade_empresa || form.cidade || undefined,
            estado: form.uf_empresa || form.uf || undefined,
            metadata,
          }),
        });
        const json = await res.json();
        if (!res.ok) { setErroSalvar(json.error || "Erro ao criar empresa."); return; }
        setEmpresaCriadaId(json.data?.id ?? null);
        setStep(9);
      } catch { setErroSalvar("Erro de conexao. Tente novamente."); }
      finally { setSalvando(false); }
    } else if (step < 9) {
      setStep(step + 1);
    }
  };
  const goPrev = () => { if (step > 1) setStep(step - 1); };

  const genPassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
    let pw = "Burg@2026!";
    for (let i = 0; i < 4; i++) pw += chars[Math.floor(Math.random() * chars.length)];
    set("senha_portal", pw);
  };

  const addSocio = () => {
    if (!newSocio.nome_socio || !newSocio.cpf_socio || !newSocio.participacao) return;
    setSocios(prev => [...prev, { ...newSocio }]);
    setNewSocio({ nome_socio: "", cpf_socio: "", participacao: "",
      administrador: false, telefone_socio: "", email_socio: "" });
  };

  const removeSocio = (idx: number) => {
    setSocios(prev => prev.filter((_, i) => i !== idx));
  };

  const getDocStatus = (key: string): DocItem | undefined => docs.find(d => d.key === key);

  const toggleDoc = (key: string) => {
    const existing = docs.find(d => d.key === key);
    if (existing) {
      setDocs(prev => prev.filter(d => d.key !== key));
    } else {
      setDocs(prev => [...prev, { key, status: "recebido", fileName: `${key}_upload.pdf` }]);
    }
  };

  const obrigacoesFiscais = (): string[] => {
    const r = form.regime_tributario;
    if (r === "MEI") return ["DAS-MEI", "DASN-SIMEI"];
    if (r === "Simples Nacional") return ["DAS", "DEFIS", "PGDAS-D", "eSocial"];
    if (r === "Lucro Presumido") return ["DCTF", "ECD", "ECF", "IRPJ", "CSLL", "PIS", "COFINS", "eSocial", "SPED"];
    if (r === "Lucro Real") return ["DCTF", "ECD", "ECF", "IRPJ", "CSLL", "PIS", "COFINS", "eSocial", "SPED", "EFD-ICMS/IPI", "EFD-Contribuições"];
    return [];
  };

  const resetForm = () => {
    setForm(initialForm);
    setSocios([]);
    setDocs([
      { key: "cpf", status: "recebido", fileName: "cpf_cliente.pdf" },
      { key: "rg", status: "recebido", fileName: "rg_frente_verso.pdf" },
      { key: "contrato_social", status: "recebido", fileName: "contrato_social_v2.pdf" },
    ]);
    setStep(1);
  };

  /* ── Styles ───────────────────────────────────────────────── */
  const wrapperStyle: React.CSSProperties = {
    display: "flex", gap: 0, minHeight: "calc(100vh - 80px)",
    background: V.bg, borderRadius: 12, overflow: "hidden",
    border: `1px solid ${V.border}`,
  };

  const leftStyle: React.CSSProperties = {
    width: 220, minWidth: 220, background: V.panel,
    borderRight: `1px solid ${V.border}`, padding: "24px 16px",
    display: "flex", flexDirection: "column", gap: 4,
  };

  const centerStyle: React.CSSProperties = {
    flex: 1, padding: "32px 40px", overflowY: "auto",
    display: "flex", flexDirection: "column",
  };

  const rightStyle: React.CSSProperties = {
    width: 280, minWidth: 280, background: V.panel,
    borderLeft: `1px solid ${V.border}`, padding: "24px 16px",
    position: "sticky", top: 0, alignSelf: "flex-start",
    maxHeight: "calc(100vh - 80px)", overflowY: "auto",
  };

  const btnPrimary: React.CSSProperties = {
    padding: "10px 28px", background: V.green700, color: "#fff",
    border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600,
    cursor: "pointer", transition: "opacity .2s",
  };

  const btnSecondary: React.CSSProperties = {
    ...btnPrimary, background: "transparent", color: V.green700,
    border: `1px solid ${V.border}`,
  };

  const btnMuted: React.CSSProperties = {
    ...btnPrimary, opacity: 0.5,
  };

  /* ── Step Renderers ───────────────────────────────────────── */

  const renderStep1 = () => (
    <div>
      <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Dados do Cliente</h2>
      <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Informações pessoais do responsável / titular.</p>

      <div style={gridRow(2)}>
        <Field label="Nome completo" required>
          <input style={inputStyle} value={form.nome_completo}
            onChange={e => set("nome_completo", e.target.value)} placeholder="Nome completo" />
        </Field>
        <Field label="CPF" required>
          <input style={inputStyle} value={form.cpf}
            onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" />
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="RG">
          <input style={inputStyle} value={form.rg}
            onChange={e => set("rg", e.target.value)} placeholder="RG" />
        </Field>
        <Field label="Data de nascimento">
          <input style={inputStyle} type="date" value={form.data_nascimento}
            onChange={e => set("data_nascimento", e.target.value)} />
        </Field>
        <Field label="Sexo">
          <select style={inputStyle} value={form.sexo}
            onChange={e => set("sexo", e.target.value)}>
            <option value="">Selecione</option>
            <option value="M">Masculino</option>
            <option value="F">Feminino</option>
            <option value="Outro">Outro</option>
          </select>
        </Field>
      </div>

      <div style={gridRow(2)}>
        <Field label="Estado civil">
          <select style={inputStyle} value={form.estado_civil}
            onChange={e => set("estado_civil", e.target.value)}>
            <option value="">Selecione</option>
            {["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União estável"].map(o =>
              <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Profissão">
          <input style={inputStyle} value={form.profissao}
            onChange={e => set("profissao", e.target.value)} placeholder="Ex: Engenheiro" />
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="Telefone" required>
          <input style={inputStyle} value={form.telefone}
            onChange={e => set("telefone", e.target.value)} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="WhatsApp">
          <input style={inputStyle} value={form.whatsapp}
            onChange={e => set("whatsapp", e.target.value)} placeholder="(00) 00000-0000" />
        </Field>
        <Field label="E-mail principal" required>
          <input style={inputStyle} type="email" value={form.email_principal}
            onChange={e => set("email_principal", e.target.value)} placeholder="email@exemplo.com" />
        </Field>
      </div>

      <div style={gridRow(2)}>
        <Field label="E-mail financeiro">
          <input style={inputStyle} value={form.email_financeiro}
            onChange={e => set("email_financeiro", e.target.value)} placeholder="financeiro@..." />
        </Field>
        <Field label="E-mail fiscal">
          <input style={inputStyle} value={form.email_fiscal}
            onChange={e => set("email_fiscal", e.target.value)} placeholder="fiscal@..." />
        </Field>
      </div>

      <Field label="Observações">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.observacoes}
          onChange={e => set("observacoes", e.target.value)} placeholder="Anotações sobre o cliente..." />
      </Field>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Endereço + Dados Pessoais</h2>
      <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Endereço residencial e informações complementares.</p>

      <div style={gridRow(3)}>
        <Field label="CEP">
          <input style={inputStyle} value={form.cep}
            onChange={e => { set("cep", e.target.value); const v = e.target.value.replace(/\D/g, ""); if (v.length === 8) buscarCep(v); }}
            onBlur={() => buscarCep(form.cep)}
            placeholder="00000-000" />
        </Field>
        <Field label="Logradouro">
          <input style={inputStyle} value={form.logradouro}
            onChange={e => set("logradouro", e.target.value)} placeholder="Rua, Av..." />
        </Field>
        <Field label="Número">
          <input style={inputStyle} value={form.numero}
            onChange={e => set("numero", e.target.value)} placeholder="Nº" />
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="Complemento">
          <input style={inputStyle} value={form.complemento}
            onChange={e => set("complemento", e.target.value)} placeholder="Apto, Sala..." />
        </Field>
        <Field label="Bairro">
          <input style={inputStyle} value={form.bairro}
            onChange={e => set("bairro", e.target.value)} placeholder="Bairro" />
        </Field>
        <Field label="Cidade">
          <input style={inputStyle} value={form.cidade}
            onChange={e => set("cidade", e.target.value)} placeholder="Cidade" />
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="UF">
          <select style={inputStyle} value={form.uf}
            onChange={e => set("uf", e.target.value)}>
            <option value="">Selecione</option>
            {UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Escolaridade">
          <select style={inputStyle} value={form.escolaridade}
            onChange={e => set("escolaridade", e.target.value)}>
            <option value="">Selecione</option>
            {["Fundamental","Médio","Superior","Pós-graduação","Mestrado","Doutorado"].map(o =>
              <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Nacionalidade">
          <input style={inputStyle} value={form.nacionalidade}
            onChange={e => set("nacionalidade", e.target.value)} />
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="Naturalidade">
          <input style={inputStyle} value={form.naturalidade}
            onChange={e => set("naturalidade", e.target.value)} placeholder="Cidade natal" />
        </Field>
        <Field label="Renda aproximada">
          <select style={inputStyle} value={form.renda_aproximada}
            onChange={e => set("renda_aproximada", e.target.value)}>
            <option value="">Selecione</option>
            {FAIXAS_RENDA.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Contato de emergência">
          <input style={inputStyle} value={form.contato_emergencia}
            onChange={e => set("contato_emergencia", e.target.value)} placeholder="Nome e telefone" />
        </Field>
      </div>

      <div style={{ marginTop: 8 }}>
        <Toggle checked={form.possui_socios}
          onChange={v => set("possui_socios", v)} label="Possui sócios?" />
      </div>
      {form.possui_socios && (
        <div style={{ marginTop: 12 }}>
          <Field label="Quantidade de sócios">
            <input style={{ ...inputStyle, width: 120 }} type="number" min={1}
              value={form.qtd_socios || ""}
              onChange={e => set("qtd_socios", parseInt(e.target.value) || 0)} />
          </Field>
        </div>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Dados Empresariais</h2>
      <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Informações da empresa a ser constituída ou migrada.</p>

      <div style={gridRow(2)}>
        <Field label="Razão social" required>
          <input style={inputStyle} value={form.razao_social}
            onChange={e => set("razao_social", e.target.value)} placeholder="Razão social" />
        </Field>
        <Field label="Nome fantasia" required>
          <input style={inputStyle} value={form.nome_fantasia}
            onChange={e => set("nome_fantasia", e.target.value)} placeholder="Nome fantasia" />
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="Natureza jurídica">
          <select style={inputStyle} value={form.natureza_juridica}
            onChange={e => set("natureza_juridica", e.target.value)}>
            <option value="">Selecione</option>
            {NATUREZAS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Porte">
          <select style={inputStyle} value={form.porte}
            onChange={e => set("porte", e.target.value)}>
            <option value="">Selecione</option>
            {PORTES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Regime tributário">
          <select style={inputStyle} value={form.regime_tributario}
            onChange={e => set("regime_tributario", e.target.value)}>
            <option value="">Selecione</option>
            {REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="Data de abertura">
          <input style={inputStyle} type="date" value={form.data_abertura}
            onChange={e => set("data_abertura", e.target.value)} />
        </Field>
        <Field label="Capital social">
          <input style={inputStyle} value={form.capital_social}
            onChange={e => set("capital_social", e.target.value)} placeholder="R$ 0,00" />
        </Field>
        <Field label="CNAE principal" required>
          <input style={inputStyle} value={form.cnae_principal}
            onChange={e => set("cnae_principal", e.target.value)} placeholder="0000-0/00" />
        </Field>
      </div>

      <Field label="Objeto social">
        <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }}
          value={form.objeto_social}
          onChange={e => set("objeto_social", e.target.value)} placeholder="Descrição do objeto social..." />
      </Field>
      <div style={{ height: 16 }} />

      <Field label="Descrição da atividade">
        <input style={inputStyle} value={form.descricao_atividade}
          onChange={e => set("descricao_atividade", e.target.value)} placeholder="Atividade principal" />
      </Field>
      <div style={{ height: 16 }} />

      <Field label="CNAEs secundários (separados por vírgula)">
        <textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }}
          value={form.cnaes_secundarios}
          onChange={e => set("cnaes_secundarios", e.target.value)} placeholder="0000-0/00, 0000-0/00" />
      </Field>
      <div style={{ height: 16 }} />

      <div style={gridRow(3)}>
        <Field label="Telefone da empresa">
          <input style={inputStyle} value={form.telefone_empresa}
            onChange={e => set("telefone_empresa", e.target.value)} placeholder="(00) 0000-0000" />
        </Field>
        <Field label="E-mail da empresa">
          <input style={inputStyle} value={form.email_empresa}
            onChange={e => set("email_empresa", e.target.value)} placeholder="contato@empresa.com" />
        </Field>
        <Field label="Site">
          <input style={inputStyle} value={form.site}
            onChange={e => set("site", e.target.value)} placeholder="www.empresa.com.br" />
        </Field>
      </div>

      <h3 style={{ fontSize: 16, color: V.ink, margin: "20px 0 12px", borderTop: `1px solid ${V.border}`, paddingTop: 16 }}>
        Endereço da empresa
      </h3>

      <div style={gridRow(3)}>
        <Field label="CEP">
          <input style={inputStyle} value={form.cep_empresa}
            onChange={e => { set("cep_empresa", e.target.value); const v = e.target.value.replace(/\D/g, ""); if (v.length === 8) buscarCep(v, "empresa"); }}
            onBlur={() => buscarCep(form.cep_empresa, "empresa")}
            placeholder="00000-000" />
        </Field>
        <Field label="Logradouro">
          <input style={inputStyle} value={form.logradouro_empresa}
            onChange={e => set("logradouro_empresa", e.target.value)} placeholder="Rua, Av..." />
        </Field>
        <Field label="Número">
          <input style={inputStyle} value={form.numero_empresa}
            onChange={e => set("numero_empresa", e.target.value)} placeholder="Nº" />
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="Bairro">
          <input style={inputStyle} value={form.bairro_empresa}
            onChange={e => set("bairro_empresa", e.target.value)} placeholder="Bairro" />
        </Field>
        <Field label="Cidade">
          <input style={inputStyle} value={form.cidade_empresa}
            onChange={e => set("cidade_empresa", e.target.value)} placeholder="Cidade" />
        </Field>
        <Field label="UF">
          <select style={inputStyle} value={form.uf_empresa}
            onChange={e => set("uf_empresa", e.target.value)}>
            <option value="">Selecione</option>
            {UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
      </div>

      <h3 style={{ fontSize: 16, color: V.ink, margin: "20px 0 12px", borderTop: `1px solid ${V.border}`, paddingTop: 16 }}>
        Indicadores
      </h3>

      <div style={gridRow(2)}>
        <Field label="Funcionários previstos">
          <input style={{ ...inputStyle, width: 160 }} type="number" min={0}
            value={form.funcionarios_previstos || ""}
            onChange={e => set("funcionarios_previstos", parseInt(e.target.value) || 0)} />
        </Field>
        <Field label="Faturamento estimado (anual)">
          <select style={inputStyle} value={form.faturamento_estimado}
            onChange={e => set("faturamento_estimado", e.target.value)}>
            <option value="">Selecione</option>
            {FAIXAS_FATURAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 32, marginTop: 8 }}>
        <Toggle checked={form.possui_certificado}
          onChange={v => set("possui_certificado", v)} label="Possui certificado digital?" />
        <Toggle checked={form.possui_contador_anterior}
          onChange={v => set("possui_contador_anterior", v)} label="Possui contador anterior?" />
      </div>
    </div>
  );

  const renderStep4 = () => {
    if (!form.possui_socios) {
      return (
        <div>
          <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Constituição Societária</h2>
          <div style={{
            padding: 32, textAlign: "center", background: V.bg, borderRadius: 12,
            border: `1px dashed ${V.border}`, marginTop: 24,
          }}>
            <p style={{ fontSize: 16, color: V.muted }}>Empresa sem sócios -- próxima etapa.</p>
          </div>
        </div>
      );
    }

    const totalPct = socios.reduce((sum, s) => sum + (parseFloat(s.participacao) || 0), 0);

    return (
      <div>
        <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Constituição Societária</h2>
        <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>
          Adicione os sócios da empresa e suas respectivas participações.
        </p>

        <div style={{
          background: V.bg, border: `1px solid ${V.border}`, borderRadius: 12,
          padding: 20, marginBottom: 24,
        }}>
          <h4 style={{ margin: "0 0 12px", color: V.ink, fontSize: 15 }}>Adicionar sócio</h4>
          <div style={gridRow(3)}>
            <Field label="Nome do sócio" required>
              <input style={inputStyle} value={newSocio.nome_socio}
                onChange={e => setNewSocio(p => ({ ...p, nome_socio: e.target.value }))} placeholder="Nome completo" />
            </Field>
            <Field label="CPF do sócio" required>
              <input style={inputStyle} value={newSocio.cpf_socio}
                onChange={e => setNewSocio(p => ({ ...p, cpf_socio: e.target.value }))} placeholder="000.000.000-00" />
            </Field>
            <Field label="Participação (%)" required>
              <input style={inputStyle} type="number" min={0} max={100}
                value={newSocio.participacao}
                onChange={e => setNewSocio(p => ({ ...p, participacao: e.target.value }))} placeholder="%" />
            </Field>
          </div>
          <div style={gridRow(3)}>
            <Field label="Telefone">
              <input style={inputStyle} value={newSocio.telefone_socio}
                onChange={e => setNewSocio(p => ({ ...p, telefone_socio: e.target.value }))} placeholder="Telefone" />
            </Field>
            <Field label="E-mail">
              <input style={inputStyle} value={newSocio.email_socio}
                onChange={e => setNewSocio(p => ({ ...p, email_socio: e.target.value }))} placeholder="email@..." />
            </Field>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={newSocio.administrador}
                  onChange={e => setNewSocio(p => ({ ...p, administrador: e.target.checked }))} />
                Administrador
              </label>
              <button style={btnPrimary} onClick={addSocio}>+ Adicionar</button>
            </div>
          </div>
        </div>

        {socios.length > 0 && (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${V.border}`, textAlign: "left" }}>
                  <th style={{ padding: "8px 12px", color: V.muted, fontWeight: 600 }}>Sócio</th>
                  <th style={{ padding: "8px 12px", color: V.muted, fontWeight: 600 }}>CPF</th>
                  <th style={{ padding: "8px 12px", color: V.muted, fontWeight: 600 }}>%</th>
                  <th style={{ padding: "8px 12px", color: V.muted, fontWeight: 600 }}>Administrador</th>
                  <th style={{ padding: "8px 12px", color: V.muted, fontWeight: 600 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {socios.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${V.border}` }}>
                    <td style={{ padding: "10px 12px", color: V.ink }}>{s.nome_socio}</td>
                    <td style={{ padding: "10px 12px", color: V.ink }}>{s.cpf_socio}</td>
                    <td style={{ padding: "10px 12px", color: V.ink }}>{s.participacao}%</td>
                    <td style={{ padding: "10px 12px" }}>
                      {s.administrador ? <Badge text="Sim" color={V.green500} /> : <span style={{ color: V.muted }}>Não</span>}
                    </td>
                    <td style={{ padding: "10px 12px" }}>
                      <button onClick={() => removeSocio(i)} style={{
                        background: "transparent", border: "none", color: V.danger,
                        cursor: "pointer", fontSize: 13, fontWeight: 600,
                      }}>Remover</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{
          marginTop: 16, padding: "12px 16px", borderRadius: 8,
          background: Math.abs(totalPct - 100) < 0.01 ? V.green500 + "15" : V.gold + "20",
          border: `1px solid ${Math.abs(totalPct - 100) < 0.01 ? V.green500 : V.gold}`,
          fontSize: 14, color: V.ink, fontWeight: 600,
        }}>
          Total: {totalPct.toFixed(1)}%
          {Math.abs(totalPct - 100) >= 0.01 && (
            <span style={{ color: V.danger, marginLeft: 12, fontWeight: 400 }}>
              A soma das participações deve ser 100%.
            </span>
          )}
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    const obrigacoes = obrigacoesFiscais();
    return (
      <div>
        <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Fiscal + Tributação</h2>
        <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Configuração fiscal e obrigações acessórias.</p>

        {form.regime_tributario && (
          <div style={{ marginBottom: 20 }}>
            <Badge text={form.regime_tributario} color={V.green700} />
          </div>
        )}

        <div style={gridRow(2)}>
          <Field label="Inscrição estadual">
            <input style={inputStyle} value={form.inscricao_estadual}
              onChange={e => set("inscricao_estadual", e.target.value)} placeholder="Isento ou número" />
          </Field>
          <Field label="Inscrição municipal">
            <input style={inputStyle} value={form.inscricao_municipal}
              onChange={e => set("inscricao_municipal", e.target.value)} placeholder="Número" />
          </Field>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, margin: "12px 0 20px" }}>
          <Toggle checked={form.necessita_alvara} onChange={v => set("necessita_alvara", v)} label="Necessita alvará?" />
          <Toggle checked={form.emite_nota} onChange={v => set("emite_nota", v)} label="Emite nota fiscal?" />
          <Toggle checked={form.tem_funcionarios} onChange={v => set("tem_funcionarios", v)} label="Tem funcionários?" />
          <Toggle checked={form.tem_estoque} onChange={v => set("tem_estoque", v)} label="Tem estoque?" />
        </div>

        <Field label="Responsável fiscal">
          <input style={inputStyle} value={form.responsavel_fiscal}
            onChange={e => set("responsavel_fiscal", e.target.value)} placeholder="Nome do responsável" />
        </Field>

        {obrigacoes.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, color: V.ink, marginBottom: 12 }}>
              Obrigações acessórias ({form.regime_tributario})
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {obrigacoes.map(o => (
                <span key={o} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 8, fontSize: 13,
                  background: V.green500 + "12", color: V.green700,
                  border: `1px solid ${V.green500}30`, fontWeight: 500,
                }}>
                  <span style={{ color: V.green500 }}>&#10003;</span> {o}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep6 = () => {
    const statusColors: Record<DocStatus, string> = {
      pendente: V.muted, recebido: V.gold, conferido: "#3b82f6", aprovado: V.green500,
    };
    const statusLabels: Record<DocStatus, string> = {
      pendente: "Pendente", recebido: "Recebido", conferido: "Conferido", aprovado: "Aprovado",
    };

    return (
      <div>
        <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Documentos</h2>
        <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>
          Gerencie os documentos necessários para a constituição.
        </p>

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap: 12, marginBottom: 24,
        }}>
          {DOC_CATEGORIES.map(cat => {
            const doc = getDocStatus(cat.key);
            const status: DocStatus = doc?.status ?? "pendente";
            return (
              <div key={cat.key} onClick={() => toggleDoc(cat.key)} style={{
                padding: 16, borderRadius: 12, cursor: "pointer",
                border: `1px solid ${doc ? statusColors[status] + "60" : V.border}`,
                background: doc ? statusColors[status] + "08" : V.panel,
                transition: "all .2s",
              }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{cat.icon}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: V.ink, marginBottom: 4 }}>{cat.label}</div>
                <Badge text={statusLabels[status]} color={statusColors[status]} />
                {doc && (
                  <div style={{ fontSize: 12, color: V.muted, marginTop: 6 }}>{doc.fileName}</div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{
          border: `2px dashed ${V.border}`, borderRadius: 12, padding: 40,
          textAlign: "center", color: V.muted, cursor: "pointer",
          background: V.bg, transition: "border-color .2s",
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>&#128449;</div>
          <p style={{ fontSize: 15, marginBottom: 8 }}>Arraste arquivos aqui ou clique para selecionar</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
            {["PDF","XML","ZIP","Excel"].map(f =>
              <span key={f} style={{
                padding: "2px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600,
                background: V.green700 + "12", color: V.green700,
              }}>{f}</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep7 = () => {
    const permissions = ["empresa.read","documento.read","documento.upload","guia.download","solicitacao.create"];
    return (
      <div>
        <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Criação do Portal</h2>
        <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Configure o acesso do cliente ao portal Burgarelli C.O.</p>

        <div style={gridRow(3)}>
          <Field label="Nome no portal">
            <input style={inputStyle} value={form.nome_portal}
              onChange={e => set("nome_portal", e.target.value)} />
          </Field>
          <Field label="E-mail do portal" required>
            <input style={inputStyle} value={form.email_portal}
              onChange={e => set("email_portal", e.target.value)} />
          </Field>
          <Field label="Telefone do portal">
            <input style={inputStyle} value={form.telefone_portal}
              onChange={e => set("telefone_portal", e.target.value)} />
          </Field>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 12, marginBottom: 20 }}>
          <div style={{ flex: 1 }}>
            <Field label="Senha">
              <input style={inputStyle} value={form.senha_portal} readOnly
                placeholder="Clique em gerar" />
            </Field>
          </div>
          <button style={{ ...btnPrimary, background: V.gold, marginBottom: 0, whiteSpace: "nowrap" }}
            onClick={genPassword}>Gerar senha segura</button>
        </div>

        <div style={{ display: "flex", gap: 24, marginBottom: 24 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.enviar_email}
              onChange={e => set("enviar_email", e.target.checked)} /> Enviar por e-mail
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, cursor: "pointer" }}>
            <input type="checkbox" checked={form.enviar_whatsapp}
              onChange={e => set("enviar_whatsapp", e.target.checked)} /> Enviar por WhatsApp
          </label>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Permissões</label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {permissions.map(p =>
              <span key={p} style={{
                padding: "4px 12px", borderRadius: 6, fontSize: 12, fontWeight: 500,
                background: V.green700 + "10", color: V.green700,
                border: `1px solid ${V.green700}25`,
              }}>{p}</span>
            )}
          </div>
        </div>

        {form.senha_portal && (
          <div style={{
            background: V.bg, border: `1px solid ${V.border}`, borderRadius: 12,
            padding: 20, fontFamily: "monospace", fontSize: 13, lineHeight: 1.8,
            color: V.ink, whiteSpace: "pre-wrap",
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: V.green700, fontFamily: "inherit" }}>
              Pré-visualização da mensagem de boas-vindas
            </div>
{`Olá ${form.nome_portal || "{nome}"},
Seu acesso ao portal Burgarelli C.O foi criado.
Link: portal.burgarelli.com.br
Login: ${form.email_portal || "{email}"}
Senha: ${form.senha_portal || "{senha}"}`}
          </div>
        )}
      </div>
    );
  };

  const renderStep8 = () => {
    const section = (title: string, targetStep: number, rows: [string, string][]) => (
      <div style={{
        background: V.panel, border: `1px solid ${V.border}`, borderRadius: 12,
        padding: 20, marginBottom: 16,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: V.ink }}>{title}</h3>
          <button onClick={() => setStep(targetStep)} style={{
            background: "transparent", border: `1px solid ${V.border}`, borderRadius: 6,
            padding: "4px 10px", cursor: "pointer", fontSize: 13, color: V.green700,
            display: "flex", alignItems: "center", gap: 4,
          }}>&#9998; Editar</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
          {rows.map(([label, value], i) => (
            <div key={i} style={{ fontSize: 14, padding: "4px 0" }}>
              <span style={{ color: V.muted }}>{label}: </span>
              <span style={{ color: V.ink, fontWeight: 500 }}>{value || "---"}</span>
            </div>
          ))}
        </div>
      </div>
    );

    const checkItem = (label: string, ok: boolean, amber?: boolean) => (
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 14 }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%", display: "inline-flex",
          alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700,
          background: ok ? (amber ? V.gold + "20" : V.green500 + "20") : V.border,
          color: ok ? (amber ? V.gold : V.green500) : V.muted,
        }}>{ok ? "✓" : "•"}</span>
        <span style={{ color: V.ink }}>{label}</span>
      </div>
    );

    const docsReceived = docs.length;

    return (
      <div>
        <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Revisão</h2>
        <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>
          Confira todos os dados antes de concluir o onboarding.
        </p>

        {section("Dados do Cliente", 1, [
          ["Nome", form.nome_completo], ["CPF", form.cpf],
          ["E-mail", form.email_principal], ["Telefone", form.telefone],
        ])}

        {section("Endereço", 2, [
          ["Logradouro", `${form.logradouro}${form.numero ? ", " + form.numero : ""}`],
          ["Cidade", form.cidade], ["UF", form.uf],
        ])}

        {section("Empresa", 3, [
          ["Razão social", form.razao_social], ["Nome fantasia", form.nome_fantasia],
          ["Regime", form.regime_tributario], ["CNAE", form.cnae_principal],
        ])}

        {form.possui_socios && socios.length > 0 && (
          <div style={{
            background: V.panel, border: `1px solid ${V.border}`, borderRadius: 12,
            padding: 20, marginBottom: 16,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 16, color: V.ink }}>Sócios</h3>
              <button onClick={() => setStep(4)} style={{
                background: "transparent", border: `1px solid ${V.border}`, borderRadius: 6,
                padding: "4px 10px", cursor: "pointer", fontSize: 13, color: V.green700,
                display: "flex", alignItems: "center", gap: 4,
              }}>&#9998; Editar</button>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${V.border}` }}>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: V.muted }}>Sócio</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: V.muted }}>CPF</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: V.muted }}>%</th>
                  <th style={{ padding: "6px 8px", textAlign: "left", color: V.muted }}>Admin</th>
                </tr>
              </thead>
              <tbody>
                {socios.map((s, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${V.border}` }}>
                    <td style={{ padding: "6px 8px", color: V.ink }}>{s.nome_socio}</td>
                    <td style={{ padding: "6px 8px", color: V.ink }}>{s.cpf_socio}</td>
                    <td style={{ padding: "6px 8px", color: V.ink }}>{s.participacao}%</td>
                    <td style={{ padding: "6px 8px" }}>{s.administrador ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {section("Tributação", 5, [
          ["Regime", form.regime_tributario],
          ["Obrigações", obrigacoesFiscais().join(", ") || "---"],
        ])}

        {section("Documentos", 6, [
          ["Recebidos", `${docsReceived} de ${DOC_CATEGORIES.length}`],
        ])}

        {section("Portal", 7, [
          ["E-mail", form.email_portal],
          ["Permissões", "5 atribuídas"],
        ])}

        <div style={{
          background: V.panel, border: `1px solid ${V.border}`, borderRadius: 12,
          padding: 20, marginTop: 8,
        }}>
          <h3 style={{ margin: "0 0 12px", fontSize: 16, color: V.ink }}>Checklist final</h3>
          {checkItem("Cliente cadastrado", !!(form.nome_completo && form.cpf))}
          {checkItem("Empresa cadastrada", !!form.razao_social)}
          {checkItem("Acesso ao portal", !!form.email_portal)}
          {checkItem(`Documentos (${docsReceived} recebidos)`, docsReceived >= 3, docsReceived < 3)}
        </div>
      </div>
    );
  };

  const renderStep9 = () => (
    <div style={{ textAlign: "center", paddingTop: 40 }}>
      <div style={{
        width: 120, height: 120, borderRadius: "50%", background: V.green500 + "18",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 24, border: `3px solid ${V.green500}`,
      }}>
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none">
          <path d="M5 13l4 4L19 7" stroke={V.green500} strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 26 }}>Empresa criada com sucesso!</h2>
      <p style={{ color: V.muted, fontSize: 15, marginBottom: 32 }}>
        O onboarding foi concluído. Todos os dados foram registrados.
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 32 }}>
        <Badge text="Cliente cadastrado" color={V.green500} />
        <Badge text="Portal ativo" color={V.green500} />
      </div>

      {form.razao_social && (
        <div style={{
          fontSize: 20, fontWeight: 700, color: V.green700, marginBottom: 32,
          padding: "12px 24px", background: V.green500 + "10", borderRadius: 12,
          display: "inline-block",
        }}>{form.razao_social}</div>
      )}

      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <a href={empresaCriadaId ? `/empresas/${empresaCriadaId}` : "/empresas"} style={{
          ...btnPrimary, textDecoration: "none", display: "inline-block",
        }}>Abrir empresa</a>
        <button style={btnSecondary}>Enviar acesso</button>
        <button style={{ ...btnSecondary, color: V.muted, borderColor: V.border }}
          onClick={resetForm}>Criar nova empresa</button>
      </div>
    </div>
  );

  const stepRenderers: Record<number, () => React.ReactNode> = {
    1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4,
    5: renderStep5, 6: renderStep6, 7: renderStep7, 8: renderStep8,
    9: renderStep9,
  };

  /* ── Summary panel ────────────────────────────────────────── */
  const renderSummary = () => {
    const item = (label: string, value: string) => value ? (
      <div style={{ fontSize: 13, padding: "3px 0" }}>
        <span style={{ color: V.muted }}>{label}</span>
        <div style={{ color: V.ink, fontWeight: 500 }}>{value}</div>
      </div>
    ) : null;

    return (
      <>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, fontSize: 12,
          color: V.green500, marginBottom: 16,
        }}>
          <span>&#10003;</span> Salvo automaticamente{savedAt ? ` às ${savedAt}` : ""}
        </div>

        <h4 style={{ margin: "0 0 12px", fontSize: 14, color: V.ink }}>Resumo do cadastro</h4>

        {form.nome_completo && (
          <div style={{
            background: V.green700 + "08", borderRadius: 10, padding: 12, marginBottom: 16,
            borderLeft: `3px solid ${V.green700}`,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: V.green700 }}>{form.nome_completo}</div>
            {form.cpf && <div style={{ fontSize: 12, color: V.muted }}>{form.cpf}</div>}
          </div>
        )}

        {item("E-mail", form.email_principal)}
        {item("Telefone", form.telefone)}

        {(form.logradouro || form.cidade) && (
          <>
            <div style={{ height: 1, background: V.border, margin: "10px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Endereço</div>
            {item("Logradouro", form.logradouro ? `${form.logradouro}${form.numero ? ", " + form.numero : ""}` : "")}
            {item("Cidade/UF", form.cidade ? `${form.cidade}${form.uf ? " - " + form.uf : ""}` : "")}
          </>
        )}

        {(form.razao_social || form.nome_fantasia) && (
          <>
            <div style={{ height: 1, background: V.border, margin: "10px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Empresa</div>
            {item("Razão social", form.razao_social)}
            {item("Nome fantasia", form.nome_fantasia)}
            {form.regime_tributario && <Badge text={form.regime_tributario} color={V.green700} />}
            {item("CNAE", form.cnae_principal)}
          </>
        )}

        {socios.length > 0 && (
          <>
            <div style={{ height: 1, background: V.border, margin: "10px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Sócios ({socios.length})
            </div>
            {socios.map((s, i) => (
              <div key={i} style={{ fontSize: 13, padding: "2px 0", color: V.ink }}>
                {s.nome_socio} <span style={{ color: V.muted }}>({s.participacao}%)</span>
              </div>
            ))}
          </>
        )}

        {docs.length > 0 && (
          <>
            <div style={{ height: 1, background: V.border, margin: "10px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Documentos ({docs.length}/{DOC_CATEGORIES.length})
            </div>
            {docs.map((d, i) => (
              <div key={i} style={{ fontSize: 12, color: V.green500, padding: "2px 0" }}>
                &#10003; {DOC_CATEGORIES.find(c => c.key === d.key)?.label}
              </div>
            ))}
          </>
        )}

        {form.email_portal && (
          <>
            <div style={{ height: 1, background: V.border, margin: "10px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Portal</div>
            {item("E-mail", form.email_portal)}
            {form.senha_portal && item("Senha", "********")}
          </>
        )}
      </>
    );
  };

  /* ── Main Render ──────────────────────────────────────────── */
  return (
    <AppShell>
      <div style={wrapperStyle}>
        {/* LEFT - Stepper */}
        <div style={leftStyle}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Progresso
            </div>
            <div style={{ height: 6, borderRadius: 3, background: V.border, overflow: "hidden" }}>
              <div style={{
                height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${V.green700}, ${V.green400})`,
                width: `${progressPct}%`, transition: "width .4s ease",
              }} />
            </div>
            <div style={{ fontSize: 12, color: V.muted, marginTop: 4, textAlign: "right" }}>{progressPct}%</div>
          </div>

          {STEPS.map(s => {
            const isActive = s.num === step;
            const isCompleted = completedSteps.includes(s.num);
            const isPast = s.num < step;
            return (
              <div key={s.num} onClick={() => setStep(s.num)} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                borderRadius: 8, cursor: "pointer", transition: "background .2s",
                background: isActive ? V.green700 + "10" : "transparent",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", fontSize: 13, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  background: isCompleted ? V.green500 : isActive ? V.green700 : V.border,
                  color: (isCompleted || isActive) ? "#fff" : V.muted,
                  transition: "all .2s",
                }}>
                  {isCompleted ? "✓" : s.num}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: isActive ? 700 : 500,
                  color: isActive ? V.green700 : isPast ? V.ink : V.muted,
                  lineHeight: 1.2,
                }}>{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* CENTER - Form */}
        <div style={centerStyle}>
          <div style={{ flex: 1 }}>
            {stepRenderers[step]?.()}
          </div>

          {step < 9 && (
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              paddingTop: 24, marginTop: 32, borderTop: `1px solid ${V.border}`, position: "relative" as const,
            }}>
              <button style={step === 1 ? { ...btnSecondary, opacity: 0.4, cursor: "default" } : btnSecondary}
                onClick={goPrev} disabled={step === 1}>Anterior</button>

              <div style={{ fontSize: 13, color: V.muted }}>
                Etapa {step} de {STEPS.length}
              </div>

              {erroSalvar && step === 8 && (
                <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 8, background: "#fef2f2", color: "#b91c1c", padding: "8px 14px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600, whiteSpace: "nowrap" }}>{erroSalvar}</div>
              )}
              {step === 8 ? (
                <button style={{ ...btnPrimary, opacity: salvando ? 0.7 : 1 }} onClick={goNext} disabled={salvando}>
                  {salvando ? "Salvando..." : "Concluir"}
                </button>
              ) : (
                <button style={isStepValid(step) ? btnPrimary : btnMuted}
                  onClick={goNext}>
                  Próximo
                </button>
              )}
            </div>
          )}
        </div>

        {/* RIGHT - Summary */}
        <div style={rightStyle}>
          {renderSummary()}
        </div>
      </div>
    </AppShell>
  );
}
