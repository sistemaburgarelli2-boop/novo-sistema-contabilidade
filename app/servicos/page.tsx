"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type Tab = "ferramentas" | "rescisao" | "contratos" | "fgts" | "ferias" | "inss" | "irrf";

type Ferramenta = {
  id: Tab;
  nome: string;
  descricao: string;
  emoji: string;
  cor: string;
};

const FERRAMENTAS: Ferramenta[] = [
  { id: "rescisao", nome: "Calculadora de Rescisao", descricao: "Calcula verbas rescisorias com base no tipo de demissao", emoji: "🧮", cor: "#dc2626" },
  { id: "contratos", nome: "Gerador de Contratos", descricao: "Gera contratos trabalhistas, sociais e de prestacao de servico", emoji: "📝", cor: "#2563eb" },
  { id: "fgts", nome: "Simulador de FGTS", descricao: "Simula saldo e multa de FGTS do colaborador", emoji: "🏦", cor: "#0891b2" },
  { id: "ferias", nome: "Calculadora de Ferias", descricao: "Calcula ferias proporcionais, integrais e abono", emoji: "🏖️", cor: "#059669" },
  { id: "inss", nome: "Calculadora de INSS", descricao: "Calcula contribuicao previdenciaria por faixa", emoji: "🛡️", cor: "#7c3aed" },
  { id: "irrf", nome: "Calculadora de IRRF", descricao: "Calcula imposto de renda retido na fonte sobre salario", emoji: "💰", cor: "#d97706" },
];

/* ─── Helpers ─────────────────────────────────────────────────── */

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function InputField({ label, value, onChange, type = "text", placeholder = "" }: {
  label: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase", marginBottom: 4 }}>{label}</label>
      <input
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: "100%", padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none", boxSizing: "border-box" }}
        type={type}
        value={value}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[];
}) {
  return (
    <div style={{ flex: 1, minWidth: 180 }}>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#6f8f7c", textTransform: "uppercase", marginBottom: 4 }}>{label}</label>
      <select
        onChange={(e) => onChange(e.target.value)}
        style={{ width: "100%", padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", background: "#fff", cursor: "pointer", boxSizing: "border-box" }}
        value={value}
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function ResultCard({ label, valor, destaque }: { label: string; valor: number; destaque?: boolean }) {
  return (
    <div style={{ background: destaque ? "#eef2ff" : "#f9fafb", borderRadius: 8, padding: "0.75rem 1rem", flex: 1, minWidth: 140 }}>
      <div style={{ fontSize: "0.65rem", color: "#6f8f7c", fontWeight: 600, textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: destaque ? "1.1rem" : "0.95rem", color: destaque ? "#4f46e5" : "#07170d", fontWeight: 700, marginTop: 4 }}>{fmt(valor)}</div>
    </div>
  );
}

/* ─── Tabelas INSS e IRRF 2026 ────────────────────────────────── */

const FAIXAS_INSS = [
  { ate: 1518.00, aliq: 0.075 },
  { ate: 2793.88, aliq: 0.09 },
  { ate: 4190.83, aliq: 0.12 },
  { ate: 8157.41, aliq: 0.14 },
];

const FAIXAS_IRRF = [
  { ate: 2259.20, aliq: 0, deduz: 0 },
  { ate: 2826.65, aliq: 0.075, deduz: 169.44 },
  { ate: 3751.05, aliq: 0.15, deduz: 381.44 },
  { ate: 4664.68, aliq: 0.225, deduz: 662.77 },
  { ate: Infinity, aliq: 0.275, deduz: 896.00 },
];

const DEDUCAO_DEPENDENTE_IRRF = 189.59;

function calcINSS(salario: number) {
  let total = 0;
  let anterior = 0;
  for (const faixa of FAIXAS_INSS) {
    const base = Math.min(salario, faixa.ate) - anterior;
    if (base <= 0) break;
    total += base * faixa.aliq;
    anterior = faixa.ate;
  }
  return total;
}

function calcIRRF(salario: number, dependentes: number) {
  const inss = calcINSS(salario);
  const base = salario - inss - (dependentes * DEDUCAO_DEPENDENTE_IRRF);
  if (base <= 0) return 0;
  for (const faixa of FAIXAS_IRRF) {
    if (base <= faixa.ate) return Math.max(0, base * faixa.aliq - faixa.deduz);
  }
  return 0;
}

/* ─── Calculadora de Rescisao ─────────────────────────────────── */

function RescisaoCalc() {
  const [salario, setSalario] = useState("");
  const [mesesTrab, setMesesTrab] = useState("");
  const [tipoRescisao, setTipoRescisao] = useState("sem_justa_causa");
  const [avisoPrevio, setAvisoPrevio] = useState("indenizado");
  const [feriasVencidas, setFeriasVencidas] = useState("nao");
  const [mesesFerias, setMesesFerias] = useState("");
  const [dependentes, setDependentes] = useState("0");
  const [resultado, setResultado] = useState<Record<string, number> | null>(null);

  function calcular() {
    const sal = Number(salario) || 0;
    const meses = Number(mesesTrab) || 0;
    const deps = Number(dependentes) || 0;
    if (!sal || !meses) return;

    const salDia = sal / 30;
    const anosCompletos = Math.floor(meses / 12);
    const mesesProp13 = meses % 12;

    let saldoSalario = sal;
    let decimoTercProp = (sal / 12) * (mesesProp13 || 12);
    let feriasProp = (sal / 12) * (Number(mesesFerias) || meses % 12);
    let tercoFerias = feriasProp / 3;
    let feriasVenc = feriasVencidas === "sim" ? sal : 0;
    let tercoFeriasVenc = feriasVenc / 3;
    let avisoIndenizado = 0;
    let multaFGTS = 0;
    let fgtsMensal = sal * 0.08;
    let saldoFGTS = fgtsMensal * meses;

    if (tipoRescisao === "sem_justa_causa") {
      if (avisoPrevio === "indenizado") {
        const diasAviso = 30 + Math.min(anosCompletos * 3, 60);
        avisoIndenizado = salDia * diasAviso;
      }
      multaFGTS = saldoFGTS * 0.4;
    } else if (tipoRescisao === "acordo") {
      if (avisoPrevio === "indenizado") {
        avisoIndenizado = (salDia * 30) * 0.5;
      }
      multaFGTS = saldoFGTS * 0.2;
    } else if (tipoRescisao === "justa_causa") {
      decimoTercProp = 0;
      feriasProp = 0;
      tercoFerias = 0;
      multaFGTS = 0;
      avisoIndenizado = 0;
    } else if (tipoRescisao === "pedido_demissao") {
      multaFGTS = 0;
      avisoIndenizado = 0;
    }

    const inss = calcINSS(sal);
    const irrf = calcIRRF(sal, deps);
    const totalBruto = saldoSalario + decimoTercProp + feriasProp + tercoFerias + feriasVenc + tercoFeriasVenc + avisoIndenizado;
    const totalLiquido = totalBruto - inss - irrf;

    setResultado({
      saldo_salario: saldoSalario,
      decimo_terceiro_prop: decimoTercProp,
      ferias_proporcionais: feriasProp,
      terco_ferias: tercoFerias,
      ferias_vencidas: feriasVenc,
      terco_ferias_vencidas: tercoFeriasVenc,
      aviso_previo_inden: avisoIndenizado,
      saldo_fgts: saldoFGTS,
      multa_fgts: multaFGTS,
      inss,
      irrf,
      total_bruto: totalBruto,
      total_liquido: totalLiquido,
    });
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", color: "#07170d" }}>Calculadora de Rescisao Trabalhista</h3>
      <p style={{ color: "#6f8f7c", fontSize: "0.82rem", marginBottom: 20 }}>Preencha os dados do colaborador para calcular as verbas rescisorias.</p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: 12 }}>
        <InputField label="Salario bruto" value={salario} onChange={setSalario} type="number" placeholder="3000.00" />
        <InputField label="Meses trabalhados" value={mesesTrab} onChange={setMesesTrab} type="number" placeholder="24" />
        <InputField label="Dependentes" value={dependentes} onChange={setDependentes} type="number" placeholder="0" />
      </div>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: 12 }}>
        <SelectField label="Tipo de rescisao" value={tipoRescisao} onChange={setTipoRescisao} options={[
          { value: "sem_justa_causa", label: "Sem justa causa" },
          { value: "justa_causa", label: "Justa causa" },
          { value: "pedido_demissao", label: "Pedido de demissao" },
          { value: "acordo", label: "Acordo (art. 484-A)" },
        ]} />
        <SelectField label="Aviso previo" value={avisoPrevio} onChange={setAvisoPrevio} options={[
          { value: "indenizado", label: "Indenizado" },
          { value: "trabalhado", label: "Trabalhado" },
        ]} />
        <SelectField label="Ferias vencidas?" value={feriasVencidas} onChange={setFeriasVencidas} options={[
          { value: "nao", label: "Nao" },
          { value: "sim", label: "Sim" },
        ]} />
        <InputField label="Meses ferias proporcional" value={mesesFerias} onChange={setMesesFerias} type="number" placeholder="Auto" />
      </div>

      <button onClick={calcular} style={{ padding: "0.6rem 2rem", background: "linear-gradient(135deg, #dc2626, #ef4444)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer", marginBottom: 20 }} type="button">
        Calcular rescisao
      </button>

      {resultado && (
        <div style={{ background: "#f9fafb", borderRadius: 12, padding: "1.25rem", border: "1px solid #e8f0eb" }}>
          <h4 style={{ margin: "0 0 12px", fontSize: "0.9rem", color: "#07170d" }}>Verbas rescisorias</h4>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: 12 }}>
            <ResultCard label="Saldo de salario" valor={resultado.saldo_salario} />
            <ResultCard label="13o proporcional" valor={resultado.decimo_terceiro_prop} />
            <ResultCard label="Ferias proporcionais" valor={resultado.ferias_proporcionais} />
            <ResultCard label="1/3 ferias" valor={resultado.terco_ferias} />
          </div>
          {resultado.ferias_vencidas > 0 && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: 12 }}>
              <ResultCard label="Ferias vencidas" valor={resultado.ferias_vencidas} />
              <ResultCard label="1/3 ferias vencidas" valor={resultado.terco_ferias_vencidas} />
            </div>
          )}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: 12 }}>
            <ResultCard label="Aviso previo indenizado" valor={resultado.aviso_previo_inden} />
            <ResultCard label="Saldo FGTS" valor={resultado.saldo_fgts} />
            <ResultCard label="Multa FGTS" valor={resultado.multa_fgts} />
          </div>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: 12 }}>
            <ResultCard label="INSS" valor={resultado.inss} />
            <ResultCard label="IRRF" valor={resultado.irrf} />
          </div>
          <div style={{ borderTop: "2px solid #e8f0eb", paddingTop: 12, display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <ResultCard label="Total bruto" valor={resultado.total_bruto} destaque />
            <ResultCard label="Total liquido" valor={resultado.total_liquido} destaque />
            <ResultCard label="FGTS + Multa a receber" valor={resultado.saldo_fgts + resultado.multa_fgts} destaque />
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Gerador de Contratos ────────────────────────────────────── */

type ModeloContrato = {
  id: string;
  nome: string;
  categoria: string;
  campos: string[];
};

const MODELOS_CONTRATO: ModeloContrato[] = [
  { id: "prestacao_servico", nome: "Prestacao de Servico", categoria: "Comercial", campos: ["contratante", "contratado", "cnpj_contratante", "cnpj_contratado", "objeto", "valor", "prazo", "cidade"] },
  { id: "trabalho_clt", nome: "Contrato de Trabalho (CLT)", categoria: "Trabalhista", campos: ["empregador", "cnpj", "empregado", "cpf", "cargo", "salario", "jornada", "data_admissao", "cidade"] },
  { id: "experiencia", nome: "Contrato de Experiencia", categoria: "Trabalhista", campos: ["empregador", "cnpj", "empregado", "cpf", "cargo", "salario", "prazo_dias", "data_inicio", "cidade"] },
  { id: "social", nome: "Contrato Social", categoria: "Societario", campos: ["razao_social", "cnpj", "socio1", "cpf_socio1", "quota1", "socio2", "cpf_socio2", "quota2", "capital_social", "cidade"] },
  { id: "honorarios", nome: "Contrato de Honorarios Contabeis", categoria: "Contabil", campos: ["escritorio", "cnpj_escritorio", "cliente", "cnpj_cliente", "valor_mensal", "servicos", "cidade"] },
  { id: "confidencialidade", nome: "Termo de Confidencialidade (NDA)", categoria: "Empresarial", campos: ["parte_reveladora", "parte_receptora", "objeto", "prazo_meses", "cidade"] },
];

function GeradorContratos() {
  const [modeloId, setModeloId] = useState(MODELOS_CONTRATO[0].id);
  const [campos, setCampos] = useState<Record<string, string>>({});
  const [contratoGerado, setContratoGerado] = useState<string | null>(null);

  const modelo = MODELOS_CONTRATO.find((m) => m.id === modeloId)!;

  function setCampo(k: string, v: string) {
    setCampos((prev) => ({ ...prev, [k]: v }));
  }

  function gerarContrato() {
    const hoje = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
    const c = campos;

    let texto = "";

    if (modeloId === "prestacao_servico") {
      texto = `CONTRATO DE PRESTACAO DE SERVICOS

Pelo presente instrumento particular, de um lado ${c.contratante || "___"}, inscrita no CNPJ ${c.cnpj_contratante || "___"}, doravante denominada CONTRATANTE, e de outro lado ${c.contratado || "___"}, inscrita no CNPJ ${c.cnpj_contratado || "___"}, doravante denominada CONTRATADA, firmam o presente contrato mediante as clausulas:

CLAUSULA 1a - DO OBJETO
A CONTRATADA se compromete a prestar os seguintes servicos: ${c.objeto || "___"}.

CLAUSULA 2a - DO VALOR
O valor total dos servicos e de ${c.valor || "___"}, a ser pago conforme acordado entre as partes.

CLAUSULA 3a - DO PRAZO
O presente contrato tera vigencia de ${c.prazo || "___"}, contados a partir da assinatura.

CLAUSULA 4a - DAS OBRIGACOES
A CONTRATADA se obriga a executar os servicos com diligencia e qualidade, respeitando os prazos estabelecidos.

CLAUSULA 5a - DA RESCISAO
O contrato podera ser rescindido por qualquer das partes mediante aviso previo de 30 dias.

CLAUSULA 6a - DO FORO
As partes elegem o foro da comarca de ${c.cidade || "___"} para dirimir quaisquer duvidas.

${c.cidade || "___"}, ${hoje}.


_________________________          _________________________
CONTRATANTE                        CONTRATADA`;
    } else if (modeloId === "trabalho_clt") {
      texto = `CONTRATO INDIVIDUAL DE TRABALHO

A empresa ${c.empregador || "___"}, CNPJ ${c.cnpj || "___"}, doravante EMPREGADORA, e o(a) Sr(a). ${c.empregado || "___"}, CPF ${c.cpf || "___"}, doravante EMPREGADO(A), celebram o presente contrato de trabalho:

CLAUSULA 1a - DA FUNCAO
O(A) EMPREGADO(A) exercera a funcao de ${c.cargo || "___"}.

CLAUSULA 2a - DA REMUNERACAO
O salario mensal sera de ${c.salario || "___"}, pago ate o 5o dia util do mes subsequente.

CLAUSULA 3a - DA JORNADA
A jornada de trabalho sera de ${c.jornada || "44 horas semanais"}.

CLAUSULA 4a - DA ADMISSAO
Data de admissao: ${c.data_admissao || "___"}.

CLAUSULA 5a - DAS DISPOSICOES GERAIS
Aplicam-se a este contrato todas as disposicoes da CLT e legislacao complementar.

${c.cidade || "___"}, ${hoje}.


_________________________          _________________________
EMPREGADORA                        EMPREGADO(A)`;
    } else if (modeloId === "experiencia") {
      texto = `CONTRATO DE EXPERIENCIA

A empresa ${c.empregador || "___"}, CNPJ ${c.cnpj || "___"}, e o(a) Sr(a). ${c.empregado || "___"}, CPF ${c.cpf || "___"}, celebram contrato de experiencia:

FUNCAO: ${c.cargo || "___"}
SALARIO: ${c.salario || "___"}
PRAZO: ${c.prazo_dias || "45"} dias, a partir de ${c.data_inicio || "___"}.

O contrato podera ser prorrogado uma unica vez, desde que nao exceda 90 dias no total, conforme art. 445 da CLT.

${c.cidade || "___"}, ${hoje}.


_________________________          _________________________
EMPREGADORA                        EMPREGADO(A)`;
    } else if (modeloId === "social") {
      texto = `CONTRATO SOCIAL

RAZAO SOCIAL: ${c.razao_social || "___"}
CNPJ: ${c.cnpj || "___"}

SOCIO 1: ${c.socio1 || "___"}, CPF ${c.cpf_socio1 || "___"}, com ${c.quota1 || "___"}% das quotas.
SOCIO 2: ${c.socio2 || "___"}, CPF ${c.cpf_socio2 || "___"}, com ${c.quota2 || "___"}% das quotas.

CAPITAL SOCIAL: ${c.capital_social || "___"}

CLAUSULA 1a - Os socios acima qualificados constituem uma sociedade limitada.
CLAUSULA 2a - A administracao sera exercida por todos os socios, em conjunto ou separadamente.
CLAUSULA 3a - O pro-labore dos socios administradores sera definido em assembleia.
CLAUSULA 4a - O exercicio social coincidira com o ano civil.

${c.cidade || "___"}, ${hoje}.


_________________________          _________________________
SOCIO 1                             SOCIO 2`;
    } else if (modeloId === "honorarios") {
      texto = `CONTRATO DE PRESTACAO DE SERVICOS CONTABEIS

ESCRITORIO: ${c.escritorio || "___"}, CNPJ ${c.cnpj_escritorio || "___"}
CLIENTE: ${c.cliente || "___"}, CNPJ ${c.cnpj_cliente || "___"}

CLAUSULA 1a - DOS SERVICOS
${c.servicos || "Escrituracao contabil, fiscal, folha de pagamento e obrigacoes acessorias"}.

CLAUSULA 2a - DOS HONORARIOS
Valor mensal: ${c.valor_mensal || "___"}, com vencimento todo dia 10.

CLAUSULA 3a - DAS OBRIGACOES DO CLIENTE
Fornecer documentos e informacoes em tempo habil para cumprimento das obrigacoes.

CLAUSULA 4a - DA VIGENCIA
Contrato por prazo indeterminado, podendo ser rescindido com aviso previo de 30 dias.

${c.cidade || "___"}, ${hoje}.


_________________________          _________________________
ESCRITORIO                          CLIENTE`;
    } else if (modeloId === "confidencialidade") {
      texto = `TERMO DE CONFIDENCIALIDADE (NDA)

PARTE REVELADORA: ${c.parte_reveladora || "___"}
PARTE RECEPTORA: ${c.parte_receptora || "___"}

CLAUSULA 1a - DO OBJETO
As informacoes confidenciais referem-se a: ${c.objeto || "___"}.

CLAUSULA 2a - DAS OBRIGACOES
A PARTE RECEPTORA se compromete a manter sigilo absoluto sobre todas as informacoes recebidas.

CLAUSULA 3a - DO PRAZO
Este termo tera vigencia de ${c.prazo_meses || "24"} meses a partir da assinatura.

CLAUSULA 4a - DA PENALIDADE
O descumprimento acarretara multa equivalente a 10x o valor do dano causado.

${c.cidade || "___"}, ${hoje}.


_________________________          _________________________
PARTE REVELADORA                    PARTE RECEPTORA`;
    }

    setContratoGerado(texto);
  }

  function copiar() {
    navigator.clipboard.writeText(contratoGerado || "");
  }

  const labelCampo: Record<string, string> = {
    contratante: "Contratante", contratado: "Contratado", cnpj_contratante: "CNPJ Contratante",
    cnpj_contratado: "CNPJ Contratado", objeto: "Objeto", valor: "Valor", prazo: "Prazo",
    cidade: "Cidade", empregador: "Empregador", cnpj: "CNPJ", empregado: "Empregado",
    cpf: "CPF", cargo: "Cargo", salario: "Salario", jornada: "Jornada",
    data_admissao: "Data admissao", prazo_dias: "Prazo (dias)", data_inicio: "Data inicio",
    razao_social: "Razao social", socio1: "Socio 1", cpf_socio1: "CPF Socio 1",
    quota1: "% Quotas Socio 1", socio2: "Socio 2", cpf_socio2: "CPF Socio 2",
    quota2: "% Quotas Socio 2", capital_social: "Capital social",
    escritorio: "Escritorio", cnpj_escritorio: "CNPJ Escritorio", cliente: "Cliente",
    cnpj_cliente: "CNPJ Cliente", valor_mensal: "Valor mensal", servicos: "Servicos",
    parte_reveladora: "Parte reveladora", parte_receptora: "Parte receptora", prazo_meses: "Prazo (meses)",
  };

  return (
    <div>
      <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", color: "#07170d" }}>Gerador de Contratos</h3>
      <p style={{ color: "#6f8f7c", fontSize: "0.82rem", marginBottom: 20 }}>Selecione o modelo e preencha os dados para gerar o contrato.</p>

      <SelectField label="Modelo de contrato" value={modeloId} onChange={(v) => { setModeloId(v); setCampos({}); setContratoGerado(null); }} options={MODELOS_CONTRATO.map((m) => ({ value: m.id, label: `${m.nome} (${m.categoria})` }))} />

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginTop: 16, marginBottom: 16 }}>
        {modelo.campos.map((campo) => (
          <InputField key={campo} label={labelCampo[campo] || campo} value={campos[campo] || ""} onChange={(v) => setCampo(campo, v)} placeholder={labelCampo[campo] || campo} />
        ))}
      </div>

      <button onClick={gerarContrato} style={{ padding: "0.6rem 2rem", background: "linear-gradient(135deg, #2563eb, #3b82f6)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }} type="button">
        Gerar contrato
      </button>

      {contratoGerado && (
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: "0.9rem", color: "#07170d" }}>Contrato gerado</h4>
            <button onClick={copiar} style={{ padding: "4px 12px", background: "#f3f4f6", border: "1px solid #dfece5", borderRadius: 6, fontSize: "0.75rem", fontWeight: 600, cursor: "pointer" }} type="button">
              Copiar
            </button>
          </div>
          <pre style={{ background: "#f9fafb", border: "1px solid #e8f0eb", borderRadius: 10, padding: "1.25rem", fontSize: "0.82rem", lineHeight: 1.7, whiteSpace: "pre-wrap", fontFamily: "inherit", color: "#07170d", maxHeight: 500, overflow: "auto" }}>
            {contratoGerado}
          </pre>
        </div>
      )}
    </div>
  );
}

/* ─── Simulador FGTS ──────────────────────────────────────────── */

function SimuladorFGTS() {
  const [salario, setSalario] = useState("");
  const [meses, setMeses] = useState("");
  const [tipo, setTipo] = useState("sem_justa_causa");
  const [resultado, setResultado] = useState<{ saldo: number; multa: number; total: number } | null>(null);

  function calcular() {
    const sal = Number(salario) || 0;
    const m = Number(meses) || 0;
    const deposito = sal * 0.08;
    const saldo = deposito * m;
    const percentual = tipo === "sem_justa_causa" ? 0.4 : tipo === "acordo" ? 0.2 : 0;
    const multa = saldo * percentual;
    setResultado({ saldo, multa, total: saldo + multa });
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", color: "#07170d" }}>Simulador de FGTS</h3>
      <p style={{ color: "#6f8f7c", fontSize: "0.82rem", marginBottom: 20 }}>Simule o saldo de FGTS e multa rescisoria.</p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: 16 }}>
        <InputField label="Salario bruto" value={salario} onChange={setSalario} type="number" placeholder="3000.00" />
        <InputField label="Meses trabalhados" value={meses} onChange={setMeses} type="number" placeholder="24" />
        <SelectField label="Tipo de demissao" value={tipo} onChange={setTipo} options={[
          { value: "sem_justa_causa", label: "Sem justa causa (40%)" },
          { value: "acordo", label: "Acordo (20%)" },
          { value: "pedido", label: "Pedido de demissao (0%)" },
        ]} />
      </div>
      <button onClick={calcular} style={{ padding: "0.6rem 2rem", background: "linear-gradient(135deg, #0891b2, #06b6d4)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }} type="button">Calcular FGTS</button>
      {resultado && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: 16 }}>
          <ResultCard label="Saldo FGTS" valor={resultado.saldo} />
          <ResultCard label="Multa rescisoria" valor={resultado.multa} />
          <ResultCard label="Total a receber" valor={resultado.total} destaque />
        </div>
      )}
    </div>
  );
}

/* ─── Calculadora de Ferias ───────────────────────────────────── */

function CalculadoraFerias() {
  const [salario, setSalario] = useState("");
  const [dias, setDias] = useState("30");
  const [abono, setAbono] = useState("nao");
  const [dependentes, setDependentes] = useState("0");
  const [resultado, setResultado] = useState<{ ferias: number; terco: number; abono: number; inss: number; irrf: number; liquido: number } | null>(null);

  function calcular() {
    const sal = Number(salario) || 0;
    const d = Number(dias) || 30;
    const deps = Number(dependentes) || 0;
    const ferias = (sal / 30) * d;
    const terco = ferias / 3;
    const abonoVal = abono === "sim" ? (sal / 30) * 10 + ((sal / 30) * 10) / 3 : 0;
    const base = ferias + terco;
    const inss = calcINSS(base);
    const irrf = calcIRRF(base, deps);
    const liquido = base + abonoVal - inss - irrf;
    setResultado({ ferias, terco, abono: abonoVal, inss, irrf, liquido });
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", color: "#07170d" }}>Calculadora de Ferias</h3>
      <p style={{ color: "#6f8f7c", fontSize: "0.82rem", marginBottom: 20 }}>Calcule o valor das ferias com abono e descontos.</p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: 16 }}>
        <InputField label="Salario bruto" value={salario} onChange={setSalario} type="number" placeholder="3000.00" />
        <InputField label="Dias de ferias" value={dias} onChange={setDias} type="number" placeholder="30" />
        <SelectField label="Abono pecuniario?" value={abono} onChange={setAbono} options={[{ value: "nao", label: "Nao" }, { value: "sim", label: "Sim (vender 10 dias)" }]} />
        <InputField label="Dependentes" value={dependentes} onChange={setDependentes} type="number" placeholder="0" />
      </div>
      <button onClick={calcular} style={{ padding: "0.6rem 2rem", background: "linear-gradient(135deg, #059669, #10b981)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }} type="button">Calcular ferias</button>
      {resultado && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: 16 }}>
          <ResultCard label="Ferias" valor={resultado.ferias} />
          <ResultCard label="1/3 constitucional" valor={resultado.terco} />
          {resultado.abono > 0 && <ResultCard label="Abono pecuniario" valor={resultado.abono} />}
          <ResultCard label="INSS" valor={resultado.inss} />
          <ResultCard label="IRRF" valor={resultado.irrf} />
          <ResultCard label="Liquido a receber" valor={resultado.liquido} destaque />
        </div>
      )}
    </div>
  );
}

/* ─── Calculadora INSS ────────────────────────────────────────── */

function CalculadoraINSS() {
  const [salario, setSalario] = useState("");
  const [resultado, setResultado] = useState<{ valor: number; aliqEfetiva: number } | null>(null);

  function calcular() {
    const sal = Number(salario) || 0;
    const valor = calcINSS(sal);
    setResultado({ valor, aliqEfetiva: sal > 0 ? (valor / sal) * 100 : 0 });
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", color: "#07170d" }}>Calculadora de INSS</h3>
      <p style={{ color: "#6f8f7c", fontSize: "0.82rem", marginBottom: 20 }}>Calculo progressivo por faixa (tabela 2026).</p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: 16 }}>
        <InputField label="Salario bruto" value={salario} onChange={setSalario} type="number" placeholder="3000.00" />
      </div>
      <button onClick={calcular} style={{ padding: "0.6rem 2rem", background: "linear-gradient(135deg, #7c3aed, #8b5cf6)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }} type="button">Calcular INSS</button>
      {resultado && (
        <div style={{ marginTop: 16 }}>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: 16 }}>
            <ResultCard label="INSS a descontar" valor={resultado.valor} destaque />
          </div>
          <div style={{ fontSize: "0.82rem", color: "#6f8f7c" }}>Aliquota efetiva: <strong style={{ color: "#07170d" }}>{resultado.aliqEfetiva.toFixed(2)}%</strong></div>
          <div style={{ marginTop: 12 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
              <thead><tr>
                <th style={{ textAlign: "left", padding: "6px 10px", color: "#6f8f7c", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", borderBottom: "1px solid #e8f0eb" }}>Faixa</th>
                <th style={{ textAlign: "right", padding: "6px 10px", color: "#6f8f7c", fontWeight: 700, fontSize: "0.7rem", textTransform: "uppercase", borderBottom: "1px solid #e8f0eb" }}>Aliquota</th>
              </tr></thead>
              <tbody>
                {FAIXAS_INSS.map((f, i) => (
                  <tr key={i}><td style={{ padding: "6px 10px", borderBottom: "1px solid #f0f7f3" }}>Ate {fmt(f.ate)}</td><td style={{ textAlign: "right", padding: "6px 10px", borderBottom: "1px solid #f0f7f3" }}>{(f.aliq * 100).toFixed(1)}%</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Calculadora IRRF ────────────────────────────────────────── */

function CalculadoraIRRF() {
  const [salario, setSalario] = useState("");
  const [dependentes, setDependentes] = useState("0");
  const [resultado, setResultado] = useState<{ inss: number; baseCalculo: number; irrf: number; liquido: number } | null>(null);

  function calcular() {
    const sal = Number(salario) || 0;
    const deps = Number(dependentes) || 0;
    const inss = calcINSS(sal);
    const base = sal - inss - (deps * DEDUCAO_DEPENDENTE_IRRF);
    const irrf = calcIRRF(sal, deps);
    setResultado({ inss, baseCalculo: Math.max(0, base), irrf, liquido: sal - inss - irrf });
  }

  return (
    <div>
      <h3 style={{ margin: "0 0 4px", fontSize: "1.05rem", color: "#07170d" }}>Calculadora de IRRF</h3>
      <p style={{ color: "#6f8f7c", fontSize: "0.82rem", marginBottom: 20 }}>Imposto de renda retido na fonte sobre salario (tabela 2026).</p>
      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: 16 }}>
        <InputField label="Salario bruto" value={salario} onChange={setSalario} type="number" placeholder="5000.00" />
        <InputField label="Dependentes" value={dependentes} onChange={setDependentes} type="number" placeholder="0" />
      </div>
      <button onClick={calcular} style={{ padding: "0.6rem 2rem", background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.875rem", cursor: "pointer" }} type="button">Calcular IRRF</button>
      {resultado && (
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: 16 }}>
          <ResultCard label="INSS descontado" valor={resultado.inss} />
          <ResultCard label="Base de calculo" valor={resultado.baseCalculo} />
          <ResultCard label="IRRF" valor={resultado.irrf} destaque />
          <ResultCard label="Salario liquido" valor={resultado.liquido} destaque />
        </div>
      )}
    </div>
  );
}

/* ─── Componente principal ────────────────────────────────────── */

export default function ServicosAvulsosPage() {
  const [tab, setTab] = useState<Tab>("ferramentas");

  return (
    <AppShell>
      <div className="page-stack">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ margin: "0 0 4px", fontSize: "1.5rem", color: "#07170d", fontWeight: 800 }}>Servicos Avulsos</h1>
            <p style={{ margin: 0, fontSize: "0.875rem", color: "#6f8f7c" }}>Ferramentas e calculadoras para o dia a dia contabil e trabalhista.</p>
          </div>
        </div>

        {tab === "ferramentas" ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginTop: 16 }}>
            {FERRAMENTAS.map((f) => (
              <button
                key={f.id}
                onClick={() => setTab(f.id)}
                style={{
                  background: "#fff",
                  border: "1.5px solid #dfece5",
                  borderRadius: 12,
                  padding: "1.25rem",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "all 0.15s",
                  display: "flex",
                  gap: "1rem",
                  alignItems: "flex-start",
                }}
                type="button"
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${f.cor}12`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
                  {f.emoji}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#07170d", marginBottom: 4 }}>{f.nome}</div>
                  <div style={{ fontSize: "0.78rem", color: "#6f8f7c" }}>{f.descricao}</div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setTab("ferramentas")}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6f8f7c", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, marginBottom: 16, padding: 0 }}
              type="button"
            >
              <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/></svg>
              Voltar
            </button>

            <div style={{ background: "#fff", border: "1.5px solid #dfece5", borderRadius: 12, padding: "1.5rem" }}>
              {tab === "rescisao" && <RescisaoCalc />}
              {tab === "contratos" && <GeradorContratos />}
              {tab === "fgts" && <SimuladorFGTS />}
              {tab === "ferias" && <CalculadoraFerias />}
              {tab === "inss" && <CalculadoraINSS />}
              {tab === "irrf" && <CalculadoraIRRF />}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
