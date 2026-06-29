"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

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

const STEPS = [
  { num: 1, title: "Dados do Cliente" },
  { num: 2, title: "Endereço" },
  { num: 3, title: "Dados Empresariais" },
  { num: 4, title: "Constituição Societária" },
  { num: 5, title: "Fiscal + Tributação" },
  { num: 6, title: "Portal do Cliente" },
  { num: 7, title: "Revisão" },
];

/* ─── Tipos ──────────────────────────────────────────────────── */
type Socio = {
  nome_socio: string; cpf_socio: string; participacao: string;
  administrador: boolean; telefone_socio: string; email_socio: string;
};

type FormState = {
  nome_completo: string; cpf: string; rg: string; data_nascimento: string;
  sexo: string; estado_civil: string; profissao: string; telefone: string;
  whatsapp: string; email_principal: string; email_financeiro: string;
  email_fiscal: string; observacoes: string;
  cep: string; logradouro: string; numero: string; complemento: string;
  bairro: string; cidade: string; uf: string; escolaridade: string;
  nacionalidade: string; naturalidade: string; renda_aproximada: string;
  possui_socios: boolean; qtd_socios: number; contato_emergencia: string;
  razao_social: string; nome_fantasia: string; natureza_juridica: string;
  porte: string; regime_tributario: string; data_abertura: string;
  capital_social: string; objeto_social: string; descricao_atividade: string;
  cnae_principal: string; cnaes_secundarios: string; telefone_empresa: string;
  email_empresa: string; site: string; cep_empresa: string;
  logradouro_empresa: string; numero_empresa: string; bairro_empresa: string;
  cidade_empresa: string; uf_empresa: string; funcionarios_previstos: number;
  faturamento_estimado: string; possui_certificado: boolean;
  possui_contador_anterior: boolean;
  inscricao_estadual: string; inscricao_municipal: string;
  necessita_alvara: boolean; emite_nota: boolean; tem_funcionarios: boolean;
  tem_estoque: boolean; responsavel_fiscal: string;
  nome_portal: string; email_portal: string; telefone_portal: string;
  senha_portal: string; enviar_email: boolean; enviar_whatsapp: boolean;
  status: string;
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
  status: "ativa",
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
export default function EditarEmpresaPage() {
  const params = useParams();
  const router = useRouter();
  const empresaId = params.empresaId as string;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(initialForm);
  const [socios, setSocios] = useState<Socio[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [newSocio, setNewSocio] = useState<Socio>({
    nome_socio: "", cpf_socio: "", participacao: "",
    administrador: false, telefone_socio: "", email_socio: "",
  });

  // Carregar dados da empresa
  useEffect(() => {
    buscarEmpresaTenant(empresaId)
      .then((empresa: Empresa) => {
        const m = (empresa.metadata ?? {}) as Record<string, unknown>;
        setForm({
          ...initialForm,
          nome_completo: (m.nome_completo as string) || "",
          cpf: (m.cpf as string) || "",
          rg: (m.rg as string) || "",
          data_nascimento: (m.data_nascimento as string) || "",
          sexo: (m.sexo as string) || "",
          estado_civil: (m.estado_civil as string) || "",
          profissao: (m.profissao as string) || "",
          telefone: (m.telefone as string) || "",
          whatsapp: (m.whatsapp as string) || "",
          email_principal: (m.email_principal as string) || "",
          email_financeiro: (m.email_financeiro as string) || "",
          email_fiscal: (m.email_fiscal as string) || "",
          observacoes: (m.observacoes as string) || "",
          cep: (m.cep as string) || "",
          logradouro: (m.logradouro as string) || "",
          numero: (m.numero as string) || "",
          complemento: (m.complemento as string) || "",
          bairro: (m.bairro as string) || "",
          cidade: empresa.cidade || "",
          uf: empresa.estado || "",
          escolaridade: (m.escolaridade as string) || "",
          nacionalidade: (m.nacionalidade as string) || "Brasileira",
          naturalidade: (m.naturalidade as string) || "",
          renda_aproximada: (m.renda_aproximada as string) || "",
          contato_emergencia: (m.contato_emergencia as string) || "",
          possui_socios: Array.isArray(m.socios) && (m.socios as Socio[]).length > 0,
          qtd_socios: Array.isArray(m.socios) ? (m.socios as Socio[]).length : 0,
          razao_social: empresa.nome_legal || "",
          nome_fantasia: empresa.nome_fantasia || "",
          natureza_juridica: (m.natureza_juridica as string) || "",
          porte: (m.porte as string) || "",
          regime_tributario: empresa.regime_tributario || "",
          data_abertura: (m.data_abertura as string) || "",
          capital_social: (m.capital_social as string) || "",
          objeto_social: (m.objeto_social as string) || "",
          descricao_atividade: (m.descricao_atividade as string) || "",
          cnae_principal: (m.cnae_principal as string) || "",
          cnaes_secundarios: (m.cnaes_secundarios as string) || "",
          telefone_empresa: (m.telefone_empresa as string) || "",
          email_empresa: (m.email_empresa as string) || "",
          site: (m.site as string) || "",
          cep_empresa: (m.cep_empresa as string) || "",
          logradouro_empresa: (m.logradouro_empresa as string) || "",
          numero_empresa: (m.numero_empresa as string) || "",
          bairro_empresa: (m.bairro_empresa as string) || "",
          cidade_empresa: (m.cidade_empresa as string) || "",
          uf_empresa: (m.uf_empresa as string) || "",
          funcionarios_previstos: Number(m.funcionarios_previstos) || 0,
          faturamento_estimado: (m.faturamento_estimado as string) || "",
          possui_certificado: !!m.possui_certificado,
          possui_contador_anterior: !!m.possui_contador_anterior,
          inscricao_estadual: (m.inscricao_estadual as string) || "",
          inscricao_municipal: (m.inscricao_municipal as string) || "",
          necessita_alvara: !!m.necessita_alvara,
          emite_nota: m.emite_nota !== false,
          tem_funcionarios: !!m.tem_funcionarios,
          tem_estoque: !!m.tem_estoque,
          responsavel_fiscal: (m.responsavel_fiscal as string) || "",
          nome_portal: (m.nome_portal as string) || "",
          email_portal: (m.email_portal as string) || "",
          telefone_portal: (m.telefone_portal as string) || "",
          senha_portal: "",
          enviar_email: true,
          enviar_whatsapp: false,
          status: empresa.status || "ativa",
        });
        if (Array.isArray(m.socios)) {
          setSocios(m.socios as Socio[]);
        }
      })
      .catch(() => router.push("/empresas"))
      .finally(() => setCarregando(false));
  }, [empresaId, router]);

  const set = useCallback(<K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(prev => ({ ...prev, [k]: v }));
  }, []);

  const buscarCep = useCallback(async (cep: string, tipo: "pessoal" | "empresa" = "pessoal") => {
    const limpo = cep.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    try {
      let data: Record<string, string> | null = null;
      try {
        const res = await fetch(`/api/cep/${limpo}`);
        if (res.ok) data = await res.json();
      } catch { /* fallback */ }
      if (!data || data.erro) {
        const res2 = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
        data = await res2.json();
      }
      if (!data || data.erro) return;
      if (tipo === "empresa") {
        setForm(prev => ({
          ...prev,
          logradouro_empresa: data!.logradouro || prev.logradouro_empresa,
          bairro_empresa: data!.bairro || prev.bairro_empresa,
          cidade_empresa: data!.localidade || prev.cidade_empresa,
          uf_empresa: data!.uf || prev.uf_empresa,
        }));
      } else {
        setForm(prev => ({
          ...prev,
          logradouro: data!.logradouro || prev.logradouro,
          bairro: data!.bairro || prev.bairro,
          cidade: data!.localidade || prev.cidade,
          uf: data!.uf || prev.uf,
        }));
      }
    } catch { /* silently fail */ }
  }, []);

  const obrigacoesFiscais = (): string[] => {
    const r = form.regime_tributario;
    if (r === "MEI") return ["DAS-MEI", "DASN-SIMEI"];
    if (r === "Simples Nacional") return ["DAS", "DEFIS", "PGDAS-D", "eSocial"];
    if (r === "Lucro Presumido") return ["DCTF", "ECD", "ECF", "IRPJ", "CSLL", "PIS", "COFINS", "eSocial", "SPED"];
    if (r === "Lucro Real") return ["DCTF", "ECD", "ECF", "IRPJ", "CSLL", "PIS", "COFINS", "eSocial", "SPED", "EFD-ICMS/IPI", "EFD-Contribuições"];
    return [];
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

  const salvar = async () => {
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
        contato_emergencia: form.contato_emergencia,
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
        possui_certificado: form.possui_certificado,
        possui_contador_anterior: form.possui_contador_anterior,
        inscricao_estadual: form.inscricao_estadual,
        inscricao_municipal: form.inscricao_municipal,
        necessita_alvara: form.necessita_alvara,
        emite_nota: form.emite_nota,
        tem_funcionarios: form.tem_funcionarios,
        tem_estoque: form.tem_estoque,
        responsavel_fiscal: form.responsavel_fiscal,
        email_portal: form.email_portal, nome_portal: form.nome_portal,
        telefone_portal: form.telefone_portal,
        socios: socios,
      };
      const res = await fetch(`/api/empresas/${empresaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome_legal: form.razao_social,
          nome_fantasia: form.nome_fantasia,
          regime_tributario: form.regime_tributario || undefined,
          cidade: form.cidade_empresa || form.cidade || undefined,
          estado: form.uf_empresa || form.uf || undefined,
          status: form.status || undefined,
          metadata,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        setErroSalvar(json.error || "Erro ao salvar.");
        return;
      }
      router.push(`/empresas/${empresaId}`);
    } catch { setErroSalvar("Erro de conexão. Tente novamente."); }
    finally { setSalvando(false); }
  };

  const goNext = () => {
    if (step === 7) {
      salvar();
    } else {
      setStep(step + 1);
    }
  };
  const goPrev = () => { if (step > 1) setStep(step - 1); };

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

  /* ── Step Renderers ───────────────────────────────────────── */

  const renderStep1 = () => (
    <div>
      <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Dados do Cliente</h2>
      <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Informações pessoais do responsável / titular.</p>

      <div style={gridRow(2)}>
        <Field label="Nome completo" required>
          <input style={inputStyle} value={form.nome_completo} onChange={e => set("nome_completo", e.target.value)} placeholder="Nome completo" />
        </Field>
        <Field label="CPF" required>
          <input style={inputStyle} value={form.cpf} onChange={e => set("cpf", e.target.value)} placeholder="000.000.000-00" />
        </Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="RG"><input style={inputStyle} value={form.rg} onChange={e => set("rg", e.target.value)} placeholder="RG" /></Field>
        <Field label="Data de nascimento"><input style={inputStyle} type="date" value={form.data_nascimento} onChange={e => set("data_nascimento", e.target.value)} /></Field>
        <Field label="Sexo">
          <select style={inputStyle} value={form.sexo} onChange={e => set("sexo", e.target.value)}>
            <option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option><option value="Outro">Outro</option>
          </select>
        </Field>
      </div>

      <div style={gridRow(2)}>
        <Field label="Estado civil">
          <select style={inputStyle} value={form.estado_civil} onChange={e => set("estado_civil", e.target.value)}>
            <option value="">Selecione</option>
            {["Solteiro(a)","Casado(a)","Divorciado(a)","Viúvo(a)","União estável"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Profissão"><input style={inputStyle} value={form.profissao} onChange={e => set("profissao", e.target.value)} placeholder="Ex: Engenheiro" /></Field>
      </div>

      <div style={gridRow(3)}>
        <Field label="Telefone" required><input style={inputStyle} value={form.telefone} onChange={e => set("telefone", e.target.value)} placeholder="(00) 00000-0000" /></Field>
        <Field label="WhatsApp"><input style={inputStyle} value={form.whatsapp} onChange={e => set("whatsapp", e.target.value)} placeholder="(00) 00000-0000" /></Field>
        <Field label="E-mail principal" required><input style={inputStyle} type="email" value={form.email_principal} onChange={e => set("email_principal", e.target.value)} placeholder="email@exemplo.com" /></Field>
      </div>

      <div style={gridRow(2)}>
        <Field label="E-mail financeiro"><input style={inputStyle} value={form.email_financeiro} onChange={e => set("email_financeiro", e.target.value)} placeholder="financeiro@..." /></Field>
        <Field label="E-mail fiscal"><input style={inputStyle} value={form.email_fiscal} onChange={e => set("email_fiscal", e.target.value)} placeholder="fiscal@..." /></Field>
      </div>

      <Field label="Observações">
        <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.observacoes} onChange={e => set("observacoes", e.target.value)} placeholder="Anotações sobre o cliente..." />
      </Field>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Endereço + Dados Pessoais</h2>
      <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Endereço residencial e informações complementares.</p>

      <div style={gridRow(3)}>
        <Field label="CEP"><input style={inputStyle} value={form.cep} onChange={e => { set("cep", e.target.value); const v = e.target.value.replace(/\D/g, ""); if (v.length === 8) buscarCep(v); }} onBlur={() => buscarCep(form.cep)} placeholder="00000-000" /></Field>
        <Field label="Logradouro"><input style={inputStyle} value={form.logradouro} onChange={e => set("logradouro", e.target.value)} placeholder="Rua, Av..." /></Field>
        <Field label="Número"><input style={inputStyle} value={form.numero} onChange={e => set("numero", e.target.value)} placeholder="Nº" /></Field>
      </div>
      <div style={gridRow(3)}>
        <Field label="Complemento"><input style={inputStyle} value={form.complemento} onChange={e => set("complemento", e.target.value)} placeholder="Apto, Sala..." /></Field>
        <Field label="Bairro"><input style={inputStyle} value={form.bairro} onChange={e => set("bairro", e.target.value)} placeholder="Bairro" /></Field>
        <Field label="Cidade"><input style={inputStyle} value={form.cidade} onChange={e => set("cidade", e.target.value)} placeholder="Cidade" /></Field>
      </div>
      <div style={gridRow(3)}>
        <Field label="UF">
          <select style={inputStyle} value={form.uf} onChange={e => set("uf", e.target.value)}>
            <option value="">Selecione</option>{UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Escolaridade">
          <select style={inputStyle} value={form.escolaridade} onChange={e => set("escolaridade", e.target.value)}>
            <option value="">Selecione</option>{["Fundamental","Médio","Superior","Pós-graduação","Mestrado","Doutorado"].map(o => <option key={o} value={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Nacionalidade"><input style={inputStyle} value={form.nacionalidade} onChange={e => set("nacionalidade", e.target.value)} /></Field>
      </div>
      <div style={gridRow(3)}>
        <Field label="Naturalidade"><input style={inputStyle} value={form.naturalidade} onChange={e => set("naturalidade", e.target.value)} placeholder="Cidade natal" /></Field>
        <Field label="Renda aproximada">
          <select style={inputStyle} value={form.renda_aproximada} onChange={e => set("renda_aproximada", e.target.value)}>
            <option value="">Selecione</option>{FAIXAS_RENDA.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
        <Field label="Contato de emergência"><input style={inputStyle} value={form.contato_emergencia} onChange={e => set("contato_emergencia", e.target.value)} placeholder="Nome e telefone" /></Field>
      </div>
      <Toggle checked={form.possui_socios} onChange={v => set("possui_socios", v)} label="Possui sócios?" />
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Dados Empresariais</h2>
      <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Informações da empresa.</p>

      <div style={gridRow(2)}>
        <Field label="Razão social" required><input style={inputStyle} value={form.razao_social} onChange={e => set("razao_social", e.target.value)} placeholder="Razão social" /></Field>
        <Field label="Nome fantasia" required><input style={inputStyle} value={form.nome_fantasia} onChange={e => set("nome_fantasia", e.target.value)} placeholder="Nome fantasia" /></Field>
      </div>
      <div style={gridRow(3)}>
        <Field label="Natureza jurídica">
          <select style={inputStyle} value={form.natureza_juridica} onChange={e => set("natureza_juridica", e.target.value)}>
            <option value="">Selecione</option>{NATUREZAS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </Field>
        <Field label="Porte">
          <select style={inputStyle} value={form.porte} onChange={e => set("porte", e.target.value)}>
            <option value="">Selecione</option>{PORTES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Regime tributário">
          <select style={inputStyle} value={form.regime_tributario} onChange={e => set("regime_tributario", e.target.value)}>
            <option value="">Selecione</option>{REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <div style={gridRow(3)}>
        <Field label="Data de abertura"><input style={inputStyle} type="date" value={form.data_abertura} onChange={e => set("data_abertura", e.target.value)} /></Field>
        <Field label="Capital social"><input style={inputStyle} value={form.capital_social} onChange={e => set("capital_social", e.target.value)} placeholder="R$ 0,00" /></Field>
        <Field label="CNAE principal" required><input style={inputStyle} value={form.cnae_principal} onChange={e => set("cnae_principal", e.target.value)} placeholder="0000-0/00" /></Field>
      </div>
      <Field label="Objeto social"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={form.objeto_social} onChange={e => set("objeto_social", e.target.value)} placeholder="Descrição do objeto social..." /></Field>
      <div style={{ height: 16 }} />
      <Field label="Descrição da atividade"><input style={inputStyle} value={form.descricao_atividade} onChange={e => set("descricao_atividade", e.target.value)} placeholder="Atividade principal" /></Field>
      <div style={{ height: 16 }} />
      <Field label="CNAEs secundários"><textarea style={{ ...inputStyle, minHeight: 50, resize: "vertical" }} value={form.cnaes_secundarios} onChange={e => set("cnaes_secundarios", e.target.value)} placeholder="0000-0/00, 0000-0/00" /></Field>
      <div style={{ height: 16 }} />
      <div style={gridRow(3)}>
        <Field label="Telefone da empresa"><input style={inputStyle} value={form.telefone_empresa} onChange={e => set("telefone_empresa", e.target.value)} placeholder="(00) 0000-0000" /></Field>
        <Field label="E-mail da empresa"><input style={inputStyle} value={form.email_empresa} onChange={e => set("email_empresa", e.target.value)} placeholder="contato@empresa.com" /></Field>
        <Field label="Site"><input style={inputStyle} value={form.site} onChange={e => set("site", e.target.value)} placeholder="www.empresa.com.br" /></Field>
      </div>

      <h3 style={{ fontSize: 16, color: V.ink, margin: "20px 0 12px", borderTop: `1px solid ${V.border}`, paddingTop: 16 }}>Endereço da empresa</h3>
      <div style={gridRow(3)}>
        <Field label="CEP"><input style={inputStyle} value={form.cep_empresa} onChange={e => { set("cep_empresa", e.target.value); const v = e.target.value.replace(/\D/g, ""); if (v.length === 8) buscarCep(v, "empresa"); }} onBlur={() => buscarCep(form.cep_empresa, "empresa")} placeholder="00000-000" /></Field>
        <Field label="Logradouro"><input style={inputStyle} value={form.logradouro_empresa} onChange={e => set("logradouro_empresa", e.target.value)} placeholder="Rua, Av..." /></Field>
        <Field label="Número"><input style={inputStyle} value={form.numero_empresa} onChange={e => set("numero_empresa", e.target.value)} placeholder="Nº" /></Field>
      </div>
      <div style={gridRow(3)}>
        <Field label="Bairro"><input style={inputStyle} value={form.bairro_empresa} onChange={e => set("bairro_empresa", e.target.value)} placeholder="Bairro" /></Field>
        <Field label="Cidade"><input style={inputStyle} value={form.cidade_empresa} onChange={e => set("cidade_empresa", e.target.value)} placeholder="Cidade" /></Field>
        <Field label="UF">
          <select style={inputStyle} value={form.uf_empresa} onChange={e => set("uf_empresa", e.target.value)}>
            <option value="">Selecione</option>{UF_LIST.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </Field>
      </div>

      <h3 style={{ fontSize: 16, color: V.ink, margin: "20px 0 12px", borderTop: `1px solid ${V.border}`, paddingTop: 16 }}>Indicadores</h3>
      <div style={gridRow(2)}>
        <Field label="Funcionários previstos"><input style={{ ...inputStyle, width: 160 }} type="number" min={0} value={form.funcionarios_previstos || ""} onChange={e => set("funcionarios_previstos", parseInt(e.target.value) || 0)} /></Field>
        <Field label="Faturamento estimado (anual)">
          <select style={inputStyle} value={form.faturamento_estimado} onChange={e => set("faturamento_estimado", e.target.value)}>
            <option value="">Selecione</option>{FAIXAS_FATURAMENTO.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", gap: 32, marginTop: 8 }}>
        <Toggle checked={form.possui_certificado} onChange={v => set("possui_certificado", v)} label="Possui certificado digital?" />
        <Toggle checked={form.possui_contador_anterior} onChange={v => set("possui_contador_anterior", v)} label="Possui contador anterior?" />
      </div>

      <h3 style={{ fontSize: 16, color: V.ink, margin: "20px 0 12px", borderTop: `1px solid ${V.border}`, paddingTop: 16 }}>Status</h3>
      <Field label="Status da empresa">
        <select style={inputStyle} value={form.status} onChange={e => set("status", e.target.value)}>
          <option value="ativa">Ativa</option><option value="suspensa">Suspensa</option>
          <option value="cancelada">Cancelada</option><option value="encerrada">Encerrada</option>
        </select>
      </Field>
    </div>
  );

  const renderStep4 = () => {
    if (!form.possui_socios) {
      return (
        <div>
          <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Constituição Societária</h2>
          <div style={{ padding: 32, textAlign: "center", background: V.bg, borderRadius: 12, border: `1px dashed ${V.border}`, marginTop: 24 }}>
            <p style={{ fontSize: 16, color: V.muted }}>Empresa sem sócios — próxima etapa.</p>
          </div>
        </div>
      );
    }
    const totalPct = socios.reduce((sum, s) => sum + (parseFloat(s.participacao) || 0), 0);
    return (
      <div>
        <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Constituição Societária</h2>
        <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Sócios e suas participações.</p>

        <div style={{ background: V.bg, border: `1px solid ${V.border}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
          <h4 style={{ margin: "0 0 12px", color: V.ink, fontSize: 15 }}>Adicionar sócio</h4>
          <div style={gridRow(3)}>
            <Field label="Nome" required><input style={inputStyle} value={newSocio.nome_socio} onChange={e => setNewSocio(p => ({ ...p, nome_socio: e.target.value }))} placeholder="Nome completo" /></Field>
            <Field label="CPF" required><input style={inputStyle} value={newSocio.cpf_socio} onChange={e => setNewSocio(p => ({ ...p, cpf_socio: e.target.value }))} placeholder="000.000.000-00" /></Field>
            <Field label="Participação (%)" required><input style={inputStyle} type="number" min={0} max={100} value={newSocio.participacao} onChange={e => setNewSocio(p => ({ ...p, participacao: e.target.value }))} placeholder="%" /></Field>
          </div>
          <div style={gridRow(3)}>
            <Field label="Telefone"><input style={inputStyle} value={newSocio.telefone_socio} onChange={e => setNewSocio(p => ({ ...p, telefone_socio: e.target.value }))} placeholder="Telefone" /></Field>
            <Field label="E-mail"><input style={inputStyle} value={newSocio.email_socio} onChange={e => setNewSocio(p => ({ ...p, email_socio: e.target.value }))} placeholder="email@..." /></Field>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, cursor: "pointer" }}>
                <input type="checkbox" checked={newSocio.administrador} onChange={e => setNewSocio(p => ({ ...p, administrador: e.target.checked }))} /> Administrador
              </label>
              <button style={btnPrimary} onClick={addSocio}>+ Adicionar</button>
            </div>
          </div>
        </div>

        {socios.length > 0 && (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${V.border}`, textAlign: "left" }}>
                <th style={{ padding: "8px 12px", color: V.muted }}>Sócio</th><th style={{ padding: "8px 12px", color: V.muted }}>CPF</th>
                <th style={{ padding: "8px 12px", color: V.muted }}>%</th><th style={{ padding: "8px 12px", color: V.muted }}>Admin</th>
                <th style={{ padding: "8px 12px", color: V.muted }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {socios.map((s, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${V.border}` }}>
                  <td style={{ padding: "10px 12px" }}>{s.nome_socio}</td><td style={{ padding: "10px 12px" }}>{s.cpf_socio}</td>
                  <td style={{ padding: "10px 12px" }}>{s.participacao}%</td>
                  <td style={{ padding: "10px 12px" }}>{s.administrador ? <Badge text="Sim" color={V.green500} /> : "Não"}</td>
                  <td style={{ padding: "10px 12px" }}>
                    <button onClick={() => removeSocio(i)} style={{ background: "transparent", border: "none", color: V.danger, cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Remover</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: Math.abs(totalPct - 100) < 0.01 ? V.green500 + "15" : V.gold + "20", border: `1px solid ${Math.abs(totalPct - 100) < 0.01 ? V.green500 : V.gold}`, fontSize: 14, fontWeight: 600 }}>
          Total: {totalPct.toFixed(1)}%
          {Math.abs(totalPct - 100) >= 0.01 && <span style={{ color: V.danger, marginLeft: 12, fontWeight: 400 }}>A soma deve ser 100%.</span>}
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
        {form.regime_tributario && <div style={{ marginBottom: 20 }}><Badge text={form.regime_tributario} color={V.green700} /></div>}
        <div style={gridRow(2)}>
          <Field label="Inscrição estadual"><input style={inputStyle} value={form.inscricao_estadual} onChange={e => set("inscricao_estadual", e.target.value)} placeholder="Isento ou número" /></Field>
          <Field label="Inscrição municipal"><input style={inputStyle} value={form.inscricao_municipal} onChange={e => set("inscricao_municipal", e.target.value)} placeholder="Número" /></Field>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24, margin: "12px 0 20px" }}>
          <Toggle checked={form.necessita_alvara} onChange={v => set("necessita_alvara", v)} label="Necessita alvará?" />
          <Toggle checked={form.emite_nota} onChange={v => set("emite_nota", v)} label="Emite nota fiscal?" />
          <Toggle checked={form.tem_funcionarios} onChange={v => set("tem_funcionarios", v)} label="Tem funcionários?" />
          <Toggle checked={form.tem_estoque} onChange={v => set("tem_estoque", v)} label="Tem estoque?" />
        </div>
        <Field label="Responsável fiscal"><input style={inputStyle} value={form.responsavel_fiscal} onChange={e => set("responsavel_fiscal", e.target.value)} placeholder="Nome do responsável" /></Field>
        {obrigacoes.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, color: V.ink, marginBottom: 12 }}>Obrigações acessórias ({form.regime_tributario})</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {obrigacoes.map(o => <span key={o} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 14px", borderRadius: 8, fontSize: 13, background: V.green500 + "12", color: V.green700, border: `1px solid ${V.green500}30`, fontWeight: 500 }}><span style={{ color: V.green500 }}>&#10003;</span> {o}</span>)}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStep6 = () => (
    <div>
      <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Portal do Cliente</h2>
      <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Configurações de acesso ao portal.</p>
      <div style={gridRow(3)}>
        <Field label="Nome no portal"><input style={inputStyle} value={form.nome_portal} onChange={e => set("nome_portal", e.target.value)} /></Field>
        <Field label="E-mail do portal"><input style={inputStyle} value={form.email_portal} onChange={e => set("email_portal", e.target.value)} /></Field>
        <Field label="Telefone do portal"><input style={inputStyle} value={form.telefone_portal} onChange={e => set("telefone_portal", e.target.value)} /></Field>
      </div>
    </div>
  );

  const renderStep7 = () => {
    const section = (title: string, targetStep: number, rows: [string, string][]) => (
      <div style={{ background: V.panel, border: `1px solid ${V.border}`, borderRadius: 12, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h3 style={{ margin: 0, fontSize: 16, color: V.ink }}>{title}</h3>
          <button onClick={() => setStep(targetStep)} style={{ background: "transparent", border: `1px solid ${V.border}`, borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: 13, color: V.green700 }}>&#9998; Editar</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 24px" }}>
          {rows.map(([label, value], i) => (
            <div key={i} style={{ fontSize: 14, padding: "4px 0" }}>
              <span style={{ color: V.muted }}>{label}: </span><span style={{ color: V.ink, fontWeight: 500 }}>{value || "---"}</span>
            </div>
          ))}
        </div>
      </div>
    );
    return (
      <div>
        <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 22 }}>Revisão das Alterações</h2>
        <p style={{ color: V.muted, fontSize: 14, marginBottom: 24 }}>Confira os dados antes de salvar.</p>
        {section("Dados do Cliente", 1, [["Nome", form.nome_completo], ["CPF", form.cpf], ["E-mail", form.email_principal], ["Telefone", form.telefone]])}
        {section("Endereço", 2, [["Logradouro", `${form.logradouro}${form.numero ? ", " + form.numero : ""}`], ["Cidade", form.cidade], ["UF", form.uf]])}
        {section("Empresa", 3, [["Razão social", form.razao_social], ["Nome fantasia", form.nome_fantasia], ["Regime", form.regime_tributario], ["CNAE", form.cnae_principal], ["Status", form.status]])}
        {socios.length > 0 && section("Sócios", 4, socios.map(s => [s.nome_socio, `${s.participacao}%`]))}
        {section("Tributação", 5, [["Regime", form.regime_tributario], ["Obrigações", obrigacoesFiscais().join(", ") || "---"]])}
        {section("Portal", 6, [["E-mail", form.email_portal], ["Nome", form.nome_portal]])}
      </div>
    );
  };

  const stepRenderers: Record<number, () => React.ReactNode> = {
    1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4,
    5: renderStep5, 6: renderStep6, 7: renderStep7,
  };

  /* ── Summary panel ────────────────────────────────────────── */
  const renderSummary = () => {
    const item = (label: string, value: string) => value ? (
      <div style={{ fontSize: 13, padding: "3px 0" }}><span style={{ color: V.muted }}>{label}</span><div style={{ color: V.ink, fontWeight: 500 }}>{value}</div></div>
    ) : null;
    return (
      <>
        <h4 style={{ margin: "0 0 12px", fontSize: 14, color: V.ink }}>Editando empresa</h4>
        {form.nome_completo && (
          <div style={{ background: V.green700 + "08", borderRadius: 10, padding: 12, marginBottom: 16, borderLeft: `3px solid ${V.green700}` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: V.green700 }}>{form.nome_completo}</div>
            {form.cpf && <div style={{ fontSize: 12, color: V.muted }}>{form.cpf}</div>}
          </div>
        )}
        {item("E-mail", form.email_principal)}
        {item("Telefone", form.telefone)}
        {(form.razao_social || form.nome_fantasia) && (
          <>
            <div style={{ height: 1, background: V.border, margin: "10px 0" }} />
            <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Empresa</div>
            {item("Razão social", form.razao_social)}
            {item("Nome fantasia", form.nome_fantasia)}
            {form.regime_tributario && <Badge text={form.regime_tributario} color={V.green700} />}
          </>
        )}
      </>
    );
  };

  if (carregando) {
    return <AppShell><div style={{ textAlign: "center", padding: 60, color: V.muted }}>Carregando dados da empresa...</div></AppShell>;
  }

  const completedSteps = STEPS.filter(s => s.num < step).map(s => s.num);
  const progressPct = Math.round((completedSteps.length / (STEPS.length - 1)) * 100);

  return (
    <AppShell>
      <div style={wrapperStyle}>
        {/* LEFT - Stepper */}
        <div style={leftStyle}>
          <div style={{ marginBottom: 12 }}>
            <button onClick={() => router.push(`/empresas/${empresaId}`)} style={{ ...btnSecondary, width: "100%", fontSize: 13, padding: "8px 12px", marginBottom: 16 }}>
              ← Voltar para empresa
            </button>
            <div style={{ fontSize: 11, fontWeight: 700, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Progresso</div>
            <div style={{ height: 6, borderRadius: 3, background: V.border, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${V.green700}, ${V.green400})`, width: `${progressPct}%`, transition: "width .4s ease" }} />
            </div>
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
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: isCompleted ? V.green500 : isActive ? V.green700 : V.border,
                  color: (isCompleted || isActive) ? "#fff" : V.muted,
                }}>{isCompleted ? "✓" : s.num}</div>
                <span style={{ fontSize: 13, fontWeight: isActive ? 700 : 500, color: isActive ? V.green700 : isPast ? V.ink : V.muted, lineHeight: 1.2 }}>{s.title}</span>
              </div>
            );
          })}
        </div>

        {/* CENTER - Form */}
        <div style={centerStyle}>
          <div style={{ flex: 1 }}>{stepRenderers[step]?.()}</div>
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            paddingTop: 24, marginTop: 32, borderTop: `1px solid ${V.border}`, position: "relative" as const,
          }}>
            <button style={step === 1 ? { ...btnSecondary, opacity: 0.4, cursor: "default" } : btnSecondary} onClick={goPrev} disabled={step === 1}>Anterior</button>
            <div style={{ fontSize: 13, color: V.muted }}>Etapa {step} de {STEPS.length}</div>
            {erroSalvar && step === 7 && (
              <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 8, background: "#fef2f2", color: "#b91c1c", padding: "8px 14px", borderRadius: 8, fontSize: "0.8rem", fontWeight: 600 }}>{erroSalvar}</div>
            )}
            {step === 7 ? (
              <button style={{ ...btnPrimary, opacity: salvando ? 0.7 : 1 }} onClick={goNext} disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar alterações"}
              </button>
            ) : (
              <button style={btnPrimary} onClick={goNext}>Próximo</button>
            )}
          </div>
        </div>

        {/* RIGHT - Summary */}
        <div style={rightStyle}>{renderSummary()}</div>
      </div>
    </AppShell>
  );
}
