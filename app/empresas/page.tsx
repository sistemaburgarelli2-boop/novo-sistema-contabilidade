"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import {
  atualizarEmpresaTenant,
  criarEmpresaTenant,
  excluirEmpresaTenant,
  listarEmpresasTenant,
  setEmpresaAtivaId,
} from "@/services/empresaClientService";
import type { CriarEmpresaInput, Empresa } from "@/modules/empresas/empresas.types";
import { SetoresModal } from "@/components/empresas/SetoresModal";
import { CnaeSelect } from "@/components/empresas/CnaeSelect";

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

/* ─── Mock Data: Onboarding Fields ───────────────────────────── */

type ProcessStatus = "Rascunho" | "Aguardando Cliente" | "Documentação Recebida" | "Pronto para Ativação" | "Ativa" | "Suspensa" | "Encerrada" | "Em Abertura";

type MockEmpresa = {
  id: string;
  razao: string;
  fantasia: string;
  cnpj: string;
  cliente: string;
  responsavel: string;
  regime: string;
  processStatus: ProcessStatus;
  pendencias: string;
  ultimoAcesso: string;
  progresso: number;
  proximaAcao: string;
  ultimaAtualizacao: string;
};

const MOCK_EMPRESAS: MockEmpresa[] = [
  { id: "1", razao: "Alfa Comércio Ltda", fantasia: "Alfa Comércio", cnpj: "12.345.678/0001-01", cliente: "Maria Silva", responsavel: "Ana Lima", regime: "Simples", processStatus: "Ativa", pendencias: "0", ultimoAcesso: "18/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "18/06/2026" },
  { id: "2", razao: "Beta Serviços ME", fantasia: "Beta Serviços", cnpj: "23.456.789/0001-02", cliente: "João Santos", responsavel: "Carlos Silva", regime: "MEI", processStatus: "Ativa", pendencias: "1 doc", ultimoAcesso: "15/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "15/06/2026" },
  { id: "3", razao: "Gama Tech Eireli", fantasia: "Gama Tech", cnpj: "34.567.890/0001-03", cliente: "Pedro Costa", responsavel: "Ana Lima", regime: "Presumido", processStatus: "Ativa", pendencias: "0", ultimoAcesso: "17/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "17/06/2026" },
  { id: "4", razao: "Delta Holding S/A", fantasia: "Delta Holding", cnpj: "45.678.901/0001-04", cliente: "André Oliveira", responsavel: "Ana Lima", regime: "Real", processStatus: "Ativa", pendencias: "2 docs", ultimoAcesso: "10/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "10/06/2026" },
  { id: "5", razao: "Épsilon Ltda", fantasia: "Épsilon", cnpj: "56.789.012/0001-05", cliente: "Lucia Ferreira", responsavel: "Carlos Silva", regime: "Simples", processStatus: "Ativa", pendencias: "0", ultimoAcesso: "19/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "19/06/2026" },
  { id: "6", razao: "Zeta Construções", fantasia: "Zeta", cnpj: "67.890.123/0001-06", cliente: "Roberto Lima", responsavel: "Marcos Souza", regime: "Presumido", processStatus: "Ativa", pendencias: "0", ultimoAcesso: "12/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "12/06/2026" },
  { id: "7", razao: "Eta Logística", fantasia: "Eta Log", cnpj: "78.901.234/0001-07", cliente: "Carlos Mendes", responsavel: "Ana Lima", regime: "Simples", processStatus: "Ativa", pendencias: "1 guia", ultimoAcesso: "16/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "16/06/2026" },
  { id: "8", razao: "Theta Indústrias", fantasia: "Theta", cnpj: "89.012.345/0001-08", cliente: "Fernanda Alves", responsavel: "Carlos Silva", regime: "Real", processStatus: "Ativa", pendencias: "0", ultimoAcesso: "14/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "14/06/2026" },
  { id: "9", razao: "Iota Seguros", fantasia: "Iota", cnpj: "90.123.456/0001-09", cliente: "Ricardo Pinto", responsavel: "Ana Lima", regime: "Presumido", processStatus: "Ativa", pendencias: "0", ultimoAcesso: "11/06/2026", progresso: 100, proximaAcao: "", ultimaAtualizacao: "11/06/2026" },
  { id: "10", razao: "Kappa Digital", fantasia: "Kappa", cnpj: "", cliente: "Juliana Ramos", responsavel: "Marcos Souza", regime: "Simples", processStatus: "Em Abertura", pendencias: "3 docs pendentes", ultimoAcesso: "—", progresso: 40, proximaAcao: "Enviar documentação", ultimaAtualizacao: "17/06/2026" },
  { id: "11", razao: "Lambda Foods", fantasia: "Lambda", cnpj: "", cliente: "Marcelo Dias", responsavel: "Ana Lima", regime: "MEI", processStatus: "Em Abertura", pendencias: "Contrato", ultimoAcesso: "—", progresso: 60, proximaAcao: "Assinar contrato", ultimaAtualizacao: "16/06/2026" },
  { id: "12", razao: "Mu Consultoria", fantasia: "Mu", cnpj: "", cliente: "Patricia Souza", responsavel: "Carlos Silva", regime: "Simples", processStatus: "Em Abertura", pendencias: "CNAE", ultimoAcesso: "—", progresso: 25, proximaAcao: "Definir CNAE", ultimaAtualizacao: "15/06/2026" },
  { id: "13", razao: "Nu Design", fantasia: "Nu", cnpj: "", cliente: "Camila Torres", responsavel: "Ana Lima", regime: "MEI", processStatus: "Aguardando Cliente", pendencias: "CPF, Contrato", ultimoAcesso: "—", progresso: 15, proximaAcao: "Aguardar envio de CPF", ultimaAtualizacao: "14/06/2026" },
  { id: "14", razao: "Xi Marketing", fantasia: "Xi", cnpj: "", cliente: "Bruno Neves", responsavel: "Marcos Souza", regime: "Simples", processStatus: "Aguardando Cliente", pendencias: "Certificado", ultimoAcesso: "—", progresso: 50, proximaAcao: "Aguardar certificado", ultimaAtualizacao: "13/06/2026" },
  { id: "15", razao: "Omicron Têxtil", fantasia: "Omicron", cnpj: "", cliente: "Sandra Lopes", responsavel: "Carlos Silva", regime: "Presumido", processStatus: "Rascunho", pendencias: "—", ultimoAcesso: "—", progresso: 5, proximaAcao: "Completar cadastro", ultimaAtualizacao: "10/06/2026" },
];

const PROCESS_STATUS_STYLES: Record<ProcessStatus, { bg: string; color: string }> = {
  "Rascunho": { bg: "#f3f4f6", color: "#6b7280" },
  "Aguardando Cliente": { bg: "#fffbeb", color: "#92400e" },
  "Documentação Recebida": { bg: "#ecfeff", color: "#0e7490" },
  "Pronto para Ativação": { bg: "#f5f3ff", color: "#7c3aed" },
  "Ativa": { bg: "#f0fdf4", color: "#065f46" },
  "Suspensa": { bg: "#fef2f2", color: "#b91c1c" },
  "Encerrada": { bg: "#f3f4f6", color: "#6b7280" },
  "Em Abertura": { bg: "#ecfeff", color: "#0e7490" },
};

type SideTab = "Todas" | "Ativas" | "Em Abertura" | "Aguardando Cliente" | "Rascunhos" | "Arquivadas";

const SIDE_TABS: { label: SideTab; count: number }[] = [
  { label: "Todas", count: 24 },
  { label: "Ativas", count: 18 },
  { label: "Em Abertura", count: 3 },
  { label: "Aguardando Cliente", count: 2 },
  { label: "Rascunhos", count: 1 },
  { label: "Arquivadas", count: 0 },
];

const TAB_STATUS_MAP: Record<SideTab, ProcessStatus[] | null> = {
  "Todas": null,
  "Ativas": ["Ativa"],
  "Em Abertura": ["Em Abertura"],
  "Aguardando Cliente": ["Aguardando Cliente"],
  "Rascunhos": ["Rascunho"],
  "Arquivadas": ["Encerrada"],
};

const RESPONSAVEIS = ["Ana Lima", "Carlos Silva", "Marcos Souza"];

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

/* ─── Helpers ─────────────────────────────────────────────────── */

function lerRascunhos(): Rascunho[] {
  try { return JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "[]"); }
  catch { return []; }
}

function salvarRascunhos(lista: Rascunho[]) {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(lista));
}

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

function getInitials(name: string): string {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div style={{ width: 60, height: 6, borderRadius: 3, background: "#e5e7eb", overflow: "hidden", display: "inline-block", verticalAlign: "middle", marginLeft: 6 }}>
      <div style={{ width: `${percent}%`, height: "100%", borderRadius: 3, background: percent === 100 ? "#10b981" : percent >= 50 ? "#3b82f6" : "#f59e0b", transition: "width 0.3s" }} />
    </div>
  );
}

function StatusBadge({ status }: { status: ProcessStatus }) {
  const s = PROCESS_STATUS_STYLES[status];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap" }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.color, display: "inline-block", opacity: 0.7 }} />
      {status}
    </span>
  );
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
  const [setoresEmpresa, setSetoresEmpresa] = useState<Empresa | null>(null);
  const [visualizando, setVisualizando] = useState<Empresa | null>(null);
  const [confirmandoExcluir, setConfirmandoExcluir] = useState<Empresa | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [confirmandoArquivar, setConfirmandoArquivar] = useState<Empresa | null>(null);
  const [arquivando, setArquivando] = useState(false);
  const [editandoEmpresa, setEditandoEmpresa] = useState<Empresa | null>(null);
  const [editForm, setEditForm] = useState<Partial<CriarEmpresaInput>>({});
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState<string | null>(null);

  // New filters
  const [activeTab, setActiveTab] = useState<SideTab>("Todas");
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroRegime, setFiltroRegime] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");

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

  function abrirEditar(emp: Empresa) {
    setEditandoEmpresa(emp);
    setEditForm({
      nome_legal: emp.nome_legal,
      nome_fantasia: emp.nome_fantasia ?? "",
      cnpj: emp.cnpj ?? "",
      regime_tributario: emp.regime_tributario ?? "",
      cidade: emp.cidade ?? "",
      estado: emp.estado ?? "",
    });
    setErroEdicao(null);
  }

  async function handleSalvarEdicao() {
    if (!editandoEmpresa) return;
    setSalvandoEdicao(true); setErroEdicao(null);
    try {
      await atualizarEmpresaTenant(editandoEmpresa.id, editForm);
      setEditandoEmpresa(null);
      await carregarEmpresas();
    } catch (e) {
      setErroEdicao(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally { setSalvandoEdicao(false); }
  }

  async function handleExcluir() {
    if (!confirmandoExcluir) return;
    setExcluindo(true);
    try {
      await excluirEmpresaTenant(confirmandoExcluir.id);
      if (empresaAtiva === confirmandoExcluir.id) { setEmpresaAtivaId(""); setEmpresaAtiva(null); }
      setConfirmandoExcluir(null);
      await carregarEmpresas();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir.");
    } finally { setExcluindo(false); }
  }

  async function handleArquivarConfirmado() {
    if (!confirmandoArquivar) return;
    setArquivando(true);
    try {
      await atualizarEmpresaTenant(confirmandoArquivar.id, { status: "encerrada" });
      setConfirmandoArquivar(null);
      await carregarEmpresas();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao arquivar.");
    } finally { setArquivando(false); }
  }

  /* ── Filtered mock data ── */
  const filteredMock = MOCK_EMPRESAS.filter((m) => {
    const tabStatuses = TAB_STATUS_MAP[activeTab];
    if (tabStatuses && !tabStatuses.includes(m.processStatus)) return false;
    if (filtroNome) {
      const search = filtroNome.toLowerCase();
      const matchName = m.razao.toLowerCase().includes(search) || m.fantasia.toLowerCase().includes(search);
      const matchCnpj = m.cnpj.includes(filtroNome);
      if (!matchName && !matchCnpj) return false;
    }
    if (filtroRegime && m.regime !== filtroRegime) return false;
    if (filtroResponsavel && m.responsavel !== filtroResponsavel) return false;
    if (filtroStatus && m.processStatus !== filtroStatus) return false;
    return true;
  });

  const enrichedMock = filteredMock.map((m, i) => ({
    ...m,
    realId: empresas[i]?.id ?? m.id,
  }));

  const processosEmAndamento = MOCK_EMPRESAS.filter((m) =>
    m.processStatus === "Em Abertura" || m.processStatus === "Aguardando Cliente" || m.processStatus === "Rascunho"
  );

  const temFiltro = !!(filtroNome || filtroRegime || filtroResponsavel || filtroStatus);

  /* ── KPIs ── */
  const kpis = [
    { label: "Empresas Ativas", value: 18, color: "#065f46", bg: "#f0fdf4", border: "#bbf7d0" },
    { label: "Em Abertura", value: 3, color: "#0e7490", bg: "#ecfeff", border: "#a5f3fc" },
    { label: "Aguardando Cliente", value: 2, color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
    { label: "Sem Portal", value: 1, color: "#7c3aed", bg: "#f5f3ff", border: "#c4b5fd" },
    { label: "Inadimplentes", value: 1, color: "#b91c1c", bg: "#fef2f2", border: "#fecaca" },
  ];

  /* ── Render ── */
  return (
    <AppShell>
      <div className="page-stack">

        {/* Hero Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "2rem 2.5rem 1.5rem", background: "linear-gradient(135deg, #06170d 0%, #0b2e18 60%, #0f3d20 100%)", borderRadius: 16, margin: "0 0 1.5rem", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 80% 30%, rgba(16,185,129,0.1) 0%, transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 900, color: "#ffffff", letterSpacing: "-0.3px" }}>Empresas</h1>
            <p style={{ margin: "0.3rem 0 0", fontSize: "0.88rem", color: "#7fb89a", fontWeight: 500 }}>Gestao de clientes e processos de abertura</p>
          </div>
          <a
            href="/empresas/novo"
            style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: 10, padding: "0.65rem 1.4rem", fontWeight: 700, fontSize: "0.88rem", cursor: "pointer", textDecoration: "none", boxShadow: "0 4px 16px rgba(16,185,129,0.25)" }}
          >
            + Novo Cliente
          </a>
        </div>

        {/* KPI Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "1rem", marginBottom: "1.5rem" }}>
          {kpis.map((kpi) => (
            <div key={kpi.label} style={{ background: kpi.bg, border: `1px solid ${kpi.border}`, borderRadius: 12, padding: "1.1rem 1.2rem", display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: "0.72rem", fontWeight: 700, color: kpi.color, textTransform: "uppercase", letterSpacing: "0.5px", opacity: 0.85 }}>{kpi.label}</span>
              <strong style={{ fontSize: "1.6rem", fontWeight: 900, color: kpi.color, lineHeight: 1.1 }}>{kpi.value}</strong>
            </div>
          ))}
        </div>

        {/* Main Content: Side Tabs + Table */}
        <div style={{ display: "flex", gap: "1.5rem", minHeight: 500 }}>

          {/* Side Tabs */}
          <div style={{ width: 200, flexShrink: 0 }}>
            <div style={{ background: "#ffffff", border: "1px solid #e6f0ea", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "0.85rem 1rem 0.5rem", borderBottom: "1px solid #e6f0ea" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 800, color: "#6f8f7c", textTransform: "uppercase", letterSpacing: "1px" }}>Filtrar por status</span>
              </div>
              {SIDE_TABS.map((tab) => {
                const isActive = activeTab === tab.label;
                return (
                  <button
                    key={tab.label}
                    onClick={() => setActiveTab(tab.label)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      width: "100%", padding: "0.7rem 1rem", border: "none",
                      background: isActive ? "#f0fdf4" : "transparent",
                      borderLeft: isActive ? "3px solid #10b981" : "3px solid transparent",
                      color: isActive ? "#065f46" : "#4b6358",
                      fontWeight: isActive ? 700 : 500, fontSize: "0.82rem",
                      cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}
                    type="button"
                  >
                    <span>{tab.label}</span>
                    <span style={{
                      background: isActive ? "#d1fae5" : "#f3f4f6",
                      color: isActive ? "#065f46" : "#6b7280",
                      borderRadius: 999, padding: "1px 8px", fontSize: "0.72rem", fontWeight: 700,
                      minWidth: 22, textAlign: "center",
                    }}>{tab.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Content */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Filters Bar */}
            <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                className="input"
                onChange={(e) => setFiltroNome(e.target.value)}
                placeholder="Buscar por nome ou CNPJ..."
                style={{ flex: 1, minWidth: 200 }}
                type="text"
                value={filtroNome}
              />
              <select
                className="input"
                onChange={(e) => setFiltroRegime(e.target.value)}
                style={{ minWidth: 140 }}
                value={filtroRegime}
              >
                <option value="">Todos os regimes</option>
                <option value="MEI">MEI</option>
                <option value="Simples">Simples</option>
                <option value="Presumido">Presumido</option>
                <option value="Real">Real</option>
              </select>
              <select
                className="input"
                onChange={(e) => setFiltroResponsavel(e.target.value)}
                style={{ minWidth: 150 }}
                value={filtroResponsavel}
              >
                <option value="">Todos os responsaveis</option>
                {RESPONSAVEIS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <select
                className="input"
                onChange={(e) => setFiltroStatus(e.target.value)}
                style={{ minWidth: 160 }}
                value={filtroStatus}
              >
                <option value="">Todos os status</option>
                {Object.keys(PROCESS_STATUS_STYLES).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              {temFiltro && (
                <button
                  className="small-action"
                  onClick={() => { setFiltroNome(""); setFiltroRegime(""); setFiltroResponsavel(""); setFiltroStatus(""); }}
                  style={{ whiteSpace: "nowrap" }}
                  type="button"
                >
                  Limpar filtros
                </button>
              )}
            </div>

            {/* Main Table */}
            <div style={{ background: "#ffffff", border: "1px solid #e6f0ea", borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #e6f0ea", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 800, color: "#06170d" }}>Empresas cadastradas</h2>
                  <p style={{ margin: "0.15rem 0 0", fontSize: "0.78rem", color: "#6f8f7c" }}>
                    {filteredMock.length} empresa{filteredMock.length !== 1 ? "s" : ""}{temFiltro ? " filtrada" + (filteredMock.length !== 1 ? "s" : "") : ""}
                  </p>
                </div>
                <button className="small-action" onClick={carregarEmpresas} type="button">Atualizar</button>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #e6f0ea" }}>
                      {["Empresa", "Cliente", "Responsavel", "Regime", "Status do Processo", "Pendencias", "Ultimo acesso", "Acoes"].map((h, i) => (
                        <th
                          key={h}
                          style={{
                            textAlign: i === 7 ? "right" : "left",
                            padding: "0.75rem 0.75rem",
                            color: "#6f8f7c",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedMock.map((emp) => (
                      <tr
                        key={emp.id}
                        style={{ borderBottom: "1px solid #f0f4f2", transition: "background 0.1s" }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#fafcfb")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      >
                        {/* Empresa */}
                        <td style={{ padding: "0.75rem", minWidth: 200 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                              width: 36, height: 36, borderRadius: 10,
                              background: "linear-gradient(135deg, #10b981, #065f46)",
                              color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: "0.72rem", fontWeight: 800, flexShrink: 0,
                            }}>
                              {getInitials(emp.razao)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: "#06170d", fontSize: "0.84rem", lineHeight: 1.25 }}>{emp.razao}</div>
                              <div style={{ color: "#6f8f7c", fontSize: "0.75rem" }}>{emp.fantasia}</div>
                            </div>
                          </div>
                        </td>
                        {/* Cliente */}
                        <td style={{ padding: "0.75rem", color: "#374151", fontWeight: 500, whiteSpace: "nowrap" }}>{emp.cliente}</td>
                        {/* Responsavel */}
                        <td style={{ padding: "0.75rem", color: "#6f8f7c", fontSize: "0.8rem", whiteSpace: "nowrap" }}>{emp.responsavel}</td>
                        {/* Regime */}
                        <td style={{ padding: "0.75rem" }}>
                          <span style={{ background: "#f3f8f5", color: "#3a5c47", borderRadius: 6, padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600 }}>{emp.regime}</span>
                        </td>
                        {/* Status do Processo */}
                        <td style={{ padding: "0.75rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            <StatusBadge status={emp.processStatus} />
                            {emp.processStatus !== "Ativa" && emp.processStatus !== "Encerrada" && (
                              <ProgressBar percent={emp.progresso} />
                            )}
                          </div>
                        </td>
                        {/* Pendencias */}
                        <td style={{ padding: "0.75rem", color: emp.pendencias !== "0" && emp.pendencias !== "—" ? "#b45309" : "#9ca3af", fontSize: "0.8rem", fontWeight: emp.pendencias !== "0" && emp.pendencias !== "—" ? 600 : 400 }}>
                          {emp.pendencias}
                        </td>
                        {/* Ultimo acesso */}
                        <td style={{ padding: "0.75rem", color: "#6f8f7c", fontSize: "0.78rem" }}>{emp.ultimoAcesso}</td>
                        {/* Acoes */}
                        <td style={{ padding: "0.75rem", textAlign: "right" }}>
                          <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", flexWrap: "nowrap" }}>
                            <a
                              href={`/empresas/${emp.realId ?? emp.id}`}
                              style={{ minHeight: 28, border: "1px solid #10b981", background: "#ecfdf5", color: "#065f46", borderRadius: 6, padding: "0 8px", fontSize: "0.72rem", cursor: "pointer", fontWeight: 700, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                            >
                              Abrir
                            </a>
                            <a
                              href={`/portal/${emp.realId ?? emp.id}`}
                              style={{ minHeight: 28, border: "1px solid #c4b5fd", background: "#f5f3ff", color: "#7c3aed", borderRadius: 6, padding: "0 8px", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                            >
                              Portal
                            </a>
                            <button
                              style={{ minHeight: 28, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", borderRadius: 6, padding: "0 8px", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600 }}
                              type="button"
                            >
                              Docs
                            </button>
                            <button
                              style={{ minHeight: 28, border: "1px solid #e5e7eb", background: "#f9fafb", color: "#374151", borderRadius: 6, padding: "0 8px", fontSize: "0.72rem", cursor: "pointer", fontWeight: 600 }}
                              type="button"
                            >
                              Hist.
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredMock.length === 0 && (
                <div style={{ padding: "3rem", textAlign: "center", color: "#6f8f7c", fontSize: "0.88rem" }}>
                  Nenhuma empresa encontrada com os filtros aplicados.
                </div>
              )}
            </div>

            {/* Processos em Andamento */}
            <div style={{ marginTop: "2rem" }}>
              <h2 style={{ margin: "0 0 1rem", fontSize: "1.05rem", fontWeight: 800, color: "#06170d" }}>Processos em Andamento</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
                {processosEmAndamento.map((proc) => (
                  <div
                    key={proc.id}
                    style={{
                      background: "#ffffff", border: "1px solid #e6f0ea", borderRadius: 14,
                      padding: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem",
                      transition: "box-shadow 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.06)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
                  >
                    {/* Card header */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 700, color: "#06170d", fontSize: "0.9rem" }}>{proc.cliente}</div>
                        <div style={{ color: "#6f8f7c", fontSize: "0.78rem" }}>{proc.razao}</div>
                      </div>
                      <StatusBadge status={proc.processStatus} />
                    </div>

                    {/* Progress */}
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#6f8f7c" }}>Progresso</span>
                        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#374151" }}>{proc.progresso}%</span>
                      </div>
                      <div style={{ width: "100%", height: 8, borderRadius: 4, background: "#e5e7eb", overflow: "hidden" }}>
                        <div style={{
                          width: `${proc.progresso}%`, height: "100%", borderRadius: 4,
                          background: proc.progresso >= 50 ? "linear-gradient(90deg, #3b82f6, #10b981)" : "linear-gradient(90deg, #f59e0b, #eab308)",
                          transition: "width 0.3s",
                        }} />
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.78rem" }}>
                      <div>
                        <span style={{ color: "#6f8f7c" }}>Responsavel: </span>
                        <span style={{ fontWeight: 600, color: "#374151" }}>{proc.responsavel}</span>
                      </div>
                      <div>
                        <span style={{ color: "#6f8f7c" }}>Atualizado: </span>
                        <span style={{ fontWeight: 500, color: "#374151" }}>{proc.ultimaAtualizacao}</span>
                      </div>
                    </div>

                    {/* Pendencias */}
                    {proc.pendencias !== "—" && (
                      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "0.4rem 0.65rem", fontSize: "0.75rem", color: "#92400e", fontWeight: 600 }}>
                        Pendencias: {proc.pendencias}
                      </div>
                    )}

                    {/* Action */}
                    <a
                      href={`/empresas/${proc.id}`}
                      style={{
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff",
                        border: "none", borderRadius: 8, padding: "0.5rem 1rem",
                        fontWeight: 700, fontSize: "0.82rem", cursor: "pointer",
                        textDecoration: "none", textAlign: "center",
                      }}
                    >
                      {proc.proximaAcao || "Ver detalhes"}
                    </a>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal Nova Empresa ── */}
      {showModal && (
        <>
          <div onClick={fecharModal} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 40 }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", pointerEvents: "none" }}>
            <div style={{ width: "100%", maxWidth: 760, maxHeight: "90vh", background: "#ffffff", borderRadius: 14, border: "1px solid #dfece5", boxShadow: "0 24px 80px rgba(7,23,13,0.18)", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "auto" }}>
              <div style={{ padding: "1.4rem 1.75rem", borderBottom: "1px solid #dfece5", background: "#f3f8f5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.05rem", color: "#06170d" }}>{editingId ? "Editar rascunho" : "Nova empresa"}</h2>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#6f8f7c" }}>Etapa {step} de 3 — {STEPS[step - 1].title}</p>
                </div>
                <button onClick={fecharModal} style={{ background: "none", border: "none", color: "#6f8f7c", fontSize: "1.5rem", cursor: "pointer", lineHeight: 1, padding: "0 4px" }} type="button">×</button>
              </div>
              <div style={{ display: "flex", borderBottom: "1px solid #dfece5", background: "#ffffff" }}>
                {STEPS.map((s) => (
                  <button
                    key={s.number}
                    onClick={() => { setErroForm(null); setStep(s.number); }}
                    style={{ flex: 1, padding: "0.85rem 0.5rem", background: "none", border: "none", borderBottom: step === s.number ? "2px solid #10b981" : "2px solid transparent", color: step === s.number ? "#075f3c" : "#6f8f7c", fontWeight: step === s.number ? 700 : 500, fontSize: "0.77rem", cursor: "pointer", textAlign: "center" }}
                    type="button"
                  >
                    <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 18, height: 18, borderRadius: "50%", background: step === s.number ? "#10b981" : "#dfece5", color: step === s.number ? "#ffffff" : "#6f8f7c", fontSize: "0.68rem", fontWeight: 700, marginRight: "0.4rem" }}>{s.number}</span>
                    {s.title}
                  </button>
                ))}
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: "1.5rem 1.75rem", background: "#fafcfb" }}>
                {erroForm && <p className="error-alert" style={{ marginBottom: "1rem" }}>{erroForm}</p>}
                {step === 1 && (
                  <div style={{ display: "grid", gap: "1rem" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <Field label="Razão social" required><Inp name="nome_legal" onChange={handleChange} placeholder="Nome legal da empresa" value={form.nome_legal} /></Field>
                      <Field label="Nome fantasia"><Inp name="nome_fantasia" onChange={handleChange} placeholder="Nome fantasia" value={form.nome_fantasia} /></Field>
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
                    <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "1rem" }}>
                      <Field label="CNAE Principal">
                        <CnaeSelect value={form.cnae_principal} onChange={(code, desc) => setForm((p) => ({ ...p, cnae_principal: code, cnae_descricao: desc }))} />
                      </Field>
                      <Field label="Descrição da atividade">
                        <input className="input" placeholder="Preenchido automaticamente" readOnly style={{ background: "#f8fdfb", color: "#4b6358", cursor: "default" }} value={form.cnae_descricao} />
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
                    <Field label="CNPJ (após emissão)"><Inp name="cnpj" onChange={handleChange} placeholder="00.000.000/0000-00" value={form.cnpj} /></Field>
                  </div>
                )}
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
              <div style={{ padding: "1.1rem 1.75rem", borderTop: "1px solid #dfece5", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f3f8f5", gap: "0.75rem" }}>
                <button className="small-action" disabled={step === 1} onClick={voltar} style={{ opacity: step === 1 ? 0.4 : 1 }} type="button">Anterior</button>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {STEPS.map((s) => <div key={s.number} style={{ width: 7, height: 7, borderRadius: "50%", background: step === s.number ? "#10b981" : "#c9dbd1" }} />)}
                </div>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center" }}>
                  <button
                    onClick={handleSalvarRascunho}
                    style={{ background: rascunhoSalvo ? "#ecfdf5" : "#ffffff", border: `1px solid ${rascunhoSalvo ? "#a7f3d0" : "#b9d3c6"}`, color: rascunhoSalvo ? "#047857" : "#0b6040", borderRadius: 8, padding: "0.45rem 1rem", fontSize: "0.82rem", cursor: "pointer", fontWeight: 600, transition: "all 0.2s", minHeight: 36 }}
                    type="button"
                  >
                    {rascunhoSalvo ? "Salvo" : "Salvar rascunho"}
                  </button>
                  {step < 3
                    ? <button onClick={avancar} type="button">Proximo</button>
                    : <button disabled={salvando} onClick={handleCriar} type="button">{salvando ? "Salvando..." : "Criar empresa"}</button>}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal Setores ── */}
      {setoresEmpresa && <SetoresModal empresa={setoresEmpresa} onClose={() => setSetoresEmpresa(null)} />}

      {/* ── Modal Visualizar ── */}
      {visualizando && (() => {
        const initials = visualizando.nome_legal.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
        const regimeLabel = REGIMES.find((r) => r.value === visualizando.regime_tributario)?.label ?? visualizando.regime_tributario;
        const statusColors: Record<Empresa["status"], { bg: string; cor: string; dot: string }> = {
          ativa: { bg: "#ecfdf5", cor: "#065f46", dot: "#10b981" },
          suspensa: { bg: "#fffbeb", cor: "#92400e", dot: "#f59e0b" },
          cancelada: { bg: "#fef2f2", cor: "#b91c1c", dot: "#ef4444" },
          encerrada: { bg: "#f3f4f6", cor: "#374151", dot: "#9ca3af" },
        };
        const sc = statusColors[visualizando.status];
        return (
          <>
            <div onClick={() => setVisualizando(null)} style={{ position: "fixed", inset: 0, background: "rgba(6,23,13,0.6)", backdropFilter: "blur(2px)", zIndex: 40 }} />
            <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", pointerEvents: "none" }}>
              <div style={{ width: "100%", maxWidth: 640, background: "#fff", borderRadius: 18, boxShadow: "0 32px 100px rgba(6,23,13,0.22)", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "auto" }}>
                <div style={{ background: "linear-gradient(120deg, #06170d 0%, #0b2e18 70%, #0f3d20 100%)", padding: "2rem 2rem 1.75rem", position: "relative", overflow: "hidden" }}>
                  <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 85% 40%, rgba(16,185,129,0.12) 0%, transparent 60%)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, #10b981, #34d399, #6ee7b7)" }} />
                  <button onClick={() => setVisualizando(null)} style={{ position: "absolute", top: "1.1rem", right: "1.25rem", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.14)", color: "#a7c4b4", borderRadius: 8, width: 32, height: 32, cursor: "pointer", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center" }} type="button">x</button>
                  <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
                    <div style={{ width: 60, height: 60, borderRadius: 16, background: "linear-gradient(135deg, #10b981, #065f46)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", fontWeight: 900, flexShrink: 0, border: "2px solid rgba(255,255,255,0.15)" }}>{initials}</div>
                    <div>
                      <p style={{ margin: "0 0 0.2rem", fontSize: "0.68rem", fontWeight: 800, color: "#34d399", letterSpacing: "2px", textTransform: "uppercase" }}>Empresa</p>
                      <h2 style={{ margin: "0 0 0.35rem", color: "#fff", fontSize: "1.2rem", fontWeight: 800, lineHeight: 1.2 }}>{visualizando.nome_legal}</h2>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                        {visualizando.nome_fantasia && <span style={{ fontSize: "0.8rem", color: "#7fb89a" }}>{visualizando.nome_fantasia}</span>}
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", background: sc.bg, color: sc.cor, borderRadius: 999, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 800 }}>
                          <span style={{ width: 6, height: 6, borderRadius: "50%", background: sc.dot, display: "inline-block" }} />
                          {STATUS_LABEL[visualizando.status]}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "1.75rem 2rem", display: "grid", gap: "1.5rem" }}>
                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.68rem", fontWeight: 900, color: "#10b981", letterSpacing: "2px", textTransform: "uppercase" }}>Dados Cadastrais</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      {[{ label: "CNPJ", value: visualizando.cnpj }, { label: "Regime Tributário", value: regimeLabel }].map((item) => (
                        <div key={item.label} style={{ background: "#f8fdfb", border: "1px solid #e6f0ea", borderRadius: 10, padding: "0.85rem 1rem" }}>
                          <p style={{ margin: "0 0 0.3rem", fontSize: "0.68rem", fontWeight: 800, color: "#6f8f7c", textTransform: "uppercase", letterSpacing: "1px" }}>{item.label}</p>
                          <p style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, color: "#07170d" }}>{item.value || "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p style={{ margin: "0 0 0.75rem", fontSize: "0.68rem", fontWeight: 900, color: "#10b981", letterSpacing: "2px", textTransform: "uppercase" }}>Localização</p>
                    <div style={{ background: "#f8fdfb", border: "1px solid #e6f0ea", borderRadius: 10, padding: "0.85rem 1rem" }}>
                      <span style={{ fontSize: "0.9rem", fontWeight: 600, color: "#07170d" }}>
                        {visualizando.cidade && visualizando.estado ? `${visualizando.cidade} — ${visualizando.estado}` : visualizando.cidade || visualizando.estado || "—"}
                      </span>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    {[
                      { label: "Criado em", value: new Date(visualizando.created_at).toLocaleString("pt-BR") },
                      { label: "Atualizado em", value: new Date(visualizando.updated_at).toLocaleString("pt-BR") },
                    ].map((item) => (
                      <div key={item.label} style={{ background: "#f8fdfb", border: "1px solid #e6f0ea", borderRadius: 10, padding: "0.75rem 1rem" }}>
                        <p style={{ margin: "0 0 0.25rem", fontSize: "0.68rem", fontWeight: 800, color: "#6f8f7c", textTransform: "uppercase", letterSpacing: "1px" }}>{item.label}</p>
                        <p style={{ margin: 0, fontSize: "0.8rem", fontWeight: 600, color: "#4b6358" }}>{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: "1rem 2rem 1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                  <button className="small-action" onClick={() => { setVisualizando(null); window.location.href = `/empresas/${visualizando.id}`; }} type="button">Ver detalhes</button>
                  <button className="small-action" onClick={() => { setVisualizando(null); abrirEditar(visualizando); }} type="button">Editar</button>
                  <button onClick={() => setVisualizando(null)} style={{ background: "linear-gradient(135deg, #10b981, #059669)", color: "#fff", border: "none", borderRadius: 8, padding: "0.55rem 1.4rem", fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }} type="button">Fechar</button>
                </div>
              </div>
            </div>
          </>
        );
      })()}

      {/* ── Modal Editar ── */}
      {editandoEmpresa && (
        <>
          <div onClick={() => setEditandoEmpresa(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", pointerEvents: "none" }}>
            <div style={{ width: "100%", maxWidth: 680, maxHeight: "85vh", background: "#fff", borderRadius: 14, border: "1px solid #dfece5", boxShadow: "0 24px 80px rgba(7,23,13,0.15)", display: "flex", flexDirection: "column", overflow: "hidden", pointerEvents: "auto" }}>
              <div style={{ padding: "1.25rem 1.75rem", borderBottom: "1px solid #dfece5", background: "#f3f8f5", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1rem", color: "#06170d" }}>Editar empresa</h2>
                  <p style={{ margin: "0.2rem 0 0", fontSize: "0.78rem", color: "#6f8f7c" }}>{editandoEmpresa.nome_legal}</p>
                </div>
                <button onClick={() => setEditandoEmpresa(null)} style={{ background: "none", border: "none", color: "#6f8f7c", fontSize: "1.4rem", cursor: "pointer" }} type="button">x</button>
              </div>
              <div style={{ overflowY: "auto", padding: "1.5rem 1.75rem", display: "grid", gap: "1rem", background: "#fafcfb" }}>
                {erroEdicao && <p className="error-alert">{erroEdicao}</p>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <Field label="Razão social" required>
                    <input className="input" onChange={(e) => setEditForm((p) => ({ ...p, nome_legal: e.target.value }))} value={editForm.nome_legal ?? ""} />
                  </Field>
                  <Field label="Nome fantasia">
                    <input className="input" onChange={(e) => setEditForm((p) => ({ ...p, nome_fantasia: e.target.value }))} value={editForm.nome_fantasia ?? ""} />
                  </Field>
                  <Field label="CNPJ">
                    <input className="input" onChange={(e) => setEditForm((p) => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" value={editForm.cnpj ?? ""} />
                  </Field>
                  <Field label="Regime Tributário">
                    <select className="input" onChange={(e) => setEditForm((p) => ({ ...p, regime_tributario: e.target.value }))} value={editForm.regime_tributario ?? ""}>
                      <option value="">Selecione...</option>
                      {REGIMES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Cidade">
                    <input className="input" onChange={(e) => setEditForm((p) => ({ ...p, cidade: e.target.value }))} value={editForm.cidade ?? ""} />
                  </Field>
                  <Field label="Estado (UF)">
                    <input className="input" maxLength={2} onChange={(e) => setEditForm((p) => ({ ...p, estado: e.target.value }))} placeholder="SP" value={editForm.estado ?? ""} />
                  </Field>
                </div>
              </div>
              <div style={{ padding: "1rem 1.75rem", borderTop: "1px solid #dfece5", background: "#f3f8f5", display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button className="small-action" onClick={() => setEditandoEmpresa(null)} type="button">Cancelar</button>
                <button disabled={salvandoEdicao} onClick={handleSalvarEdicao} type="button">{salvandoEdicao ? "Salvando..." : "Salvar alterações"}</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal Confirmar Arquivamento ── */}
      {confirmandoArquivar && (
        <>
          <div onClick={() => setConfirmandoArquivar(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", zIndex: 40 }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", pointerEvents: "none" }}>
            <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "0 32px 80px rgba(0,0,0,0.18)", overflow: "hidden", pointerEvents: "auto" }}>
              <div style={{ padding: "1.5rem 1.75rem 1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", flexShrink: 0 }}>
                  A
                </div>
                <div>
                  <h2 style={{ margin: "0 0 0.3rem", fontSize: "1rem", fontWeight: 800, color: "#111827" }}>Arquivar empresa</h2>
                  <p style={{ margin: 0, fontSize: "0.875rem", color: "#6b7280", lineHeight: 1.5 }}>
                    A empresa <strong style={{ color: "#111827" }}>{confirmandoArquivar.nome_legal}</strong> será marcada como <strong style={{ color: "#374151" }}>encerrada</strong> e ficará oculta nas listas ativas.
                  </p>
                </div>
              </div>
              <div style={{ margin: "0 1.75rem 1.25rem", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10, padding: "0.75rem 1rem", display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
                <span style={{ fontSize: "0.9rem", flexShrink: 0 }}>i</span>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "#6b7280", lineHeight: 1.45 }}>
                  Esta ação pode ser revertida editando o status da empresa posteriormente.
                </p>
              </div>
              <div style={{ padding: "1rem 1.75rem 1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button className="small-action" onClick={() => setConfirmandoArquivar(null)} type="button">Cancelar</button>
                <button
                  disabled={arquivando}
                  onClick={handleArquivarConfirmado}
                  style={{ background: "linear-gradient(135deg, #4b5563, #374151)", color: "#fff", border: "none", borderRadius: 8, padding: "0.55rem 1.4rem", fontWeight: 700, fontSize: "0.85rem", cursor: arquivando ? "not-allowed" : "pointer", opacity: arquivando ? 0.7 : 1, display: "flex", alignItems: "center", gap: "0.4rem" }}
                  type="button"
                >
                  {arquivando ? "Arquivando..." : "Arquivar empresa"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal Confirmar Exclusão ── */}
      {confirmandoExcluir && (
        <>
          <div onClick={() => setConfirmandoExcluir(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.55)", zIndex: 40 }} />
          <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem", pointerEvents: "none" }}>
            <div style={{ width: "100%", maxWidth: 460, background: "#fff", borderRadius: 14, border: "1px solid #fecaca", boxShadow: "0 24px 80px rgba(7,23,13,0.15)", overflow: "hidden", pointerEvents: "auto" }}>
              <div style={{ padding: "1.5rem 1.75rem", borderBottom: "1px solid #fecaca", background: "#fff5f5" }}>
                <h2 style={{ margin: 0, fontSize: "1rem", color: "#b91c1c" }}>Excluir empresa</h2>
              </div>
              <div style={{ padding: "1.5rem 1.75rem" }}>
                <p style={{ margin: 0, color: "#374151", fontSize: "0.9rem" }}>
                  Tem certeza que deseja excluir <strong>{confirmandoExcluir.nome_legal}</strong>? Esta ação não pode ser desfeita.
                </p>
              </div>
              <div style={{ padding: "1rem 1.75rem", borderTop: "1px solid #fecaca", background: "#fff5f5", display: "flex", justifyContent: "flex-end", gap: "0.6rem" }}>
                <button className="small-action" onClick={() => setConfirmandoExcluir(null)} type="button">Cancelar</button>
                <button disabled={excluindo} onClick={handleExcluir} style={{ background: "linear-gradient(100deg,#dc2626,#b91c1c)" }} type="button">
                  {excluindo ? "Excluindo..." : "Sim, excluir"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}
