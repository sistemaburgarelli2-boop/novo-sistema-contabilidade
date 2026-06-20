"use client";

import { useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type Tab = "dashboard" | "catalogo" | "solicitacoes" | "assinaturas" | "templates" | "historico";

type StatusContrato =
  | "rascunho"
  | "aguardando_pagamento"
  | "pago"
  | "pendente_assinatura"
  | "assinado"
  | "ativo"
  | "concluido"
  | "cancelado";

type ModoContrato = "Interno" | "Cliente" | "Público";

type Contrato = {
  numero: string;
  contrato: string;
  solicitante: string;
  modo: ModoContrato;
  status: StatusContrato;
  valor: number;
  data: string;
};

type CategoriaContrato =
  | "Empresarial"
  | "Civil"
  | "Imobiliário"
  | "Trabalhista"
  | "Administrativo"
  | "Societário"
  | "Contábil"
  | "Comercial";

type ContratoTipo = {
  slug: string;
  nome: string;
  descricao: string;
  preco: number;
  categoria: CategoriaContrato;
  emoji: string;
};

type Solicitacao = {
  id: string;
  solicitante: string;
  contrato: string;
  status: "Pendente" | "Em Análise" | "Aprovado" | "Rejeitado";
  valor: number;
  data: string;
};

type Assinatura = {
  contrato: string;
  partes: string;
  status: "Pendente" | "Parcial" | "Assinado" | "Expirado";
  enviado: string;
  expira: string;
};

type Template = {
  nome: string;
  categoria: CategoriaContrato;
  versao: string;
  preco: number;
  ativo: boolean;
  variaveis: string[];
};

type Historico = {
  dataHora: string;
  usuario: string;
  acao: string;
  contrato: string;
  ip: string;
};

/* ─── Estilos de status ───────────────────────────────────────── */

const S_STATUS: Record<StatusContrato, { bg: string; color: string; label: string }> = {
  rascunho:              { bg: "#f3f4f6", color: "#6b7280", label: "Rascunho" },
  aguardando_pagamento:  { bg: "#fffbeb", color: "#92400e", label: "Aguardando Pagamento" },
  pago:                  { bg: "#eff6ff", color: "#1e40af", label: "Pago" },
  pendente_assinatura:   { bg: "#f5f3ff", color: "#7c3aed", label: "Pendente Assinatura" },
  assinado:              { bg: "#f0fdf4", color: "#065f46", label: "Assinado" },
  ativo:                 { bg: "#ecfdf5", color: "#047857", label: "Ativo" },
  concluido:             { bg: "#e8f5e9", color: "#1b5e20", label: "Concluído" },
  cancelado:             { bg: "#fef2f2", color: "#b91c1c", label: "Cancelado" },
};

const S_SOLICITACAO: Record<string, { bg: string; color: string }> = {
  Pendente:    { bg: "#fffbeb", color: "#92400e" },
  "Em Análise": { bg: "#eff6ff", color: "#1e40af" },
  Aprovado:    { bg: "#f0fdf4", color: "#065f46" },
  Rejeitado:   { bg: "#fef2f2", color: "#b91c1c" },
};

const S_ASSINATURA: Record<string, { bg: string; color: string }> = {
  Pendente:  { bg: "#fffbeb", color: "#92400e" },
  Parcial:   { bg: "#eff6ff", color: "#1e40af" },
  Assinado:  { bg: "#f0fdf4", color: "#065f46" },
  Expirado:  { bg: "#fef2f2", color: "#b91c1c" },
};

const S_MODO: Record<ModoContrato, { bg: string; color: string }> = {
  Interno:  { bg: "#eff6ff", color: "#1e40af" },
  Cliente:  { bg: "#f0fdf4", color: "#065f46" },
  "Público": { bg: "#f5f3ff", color: "#7c3aed" },
};

const CATEGORIA_CORES: Record<CategoriaContrato, string> = {
  Empresarial:     "#065f46",
  Civil:           "#1e40af",
  "Imobiliário":   "#92400e",
  Trabalhista:     "#7c3aed",
  Administrativo:  "#0e7490",
  "Societário":    "#b45309",
  "Contábil":      "#059669",
  Comercial:       "#dc2626",
};

/* ─── Dados mock ─────────────────────────────────────────────── */

const CONTRATOS: Contrato[] = [
  { numero: "CTR-2026-000148", contrato: "Prestação de Serviços",      solicitante: "Alfa Comércio Ltda",      modo: "Interno",  status: "ativo",                valor: 350,  data: "20/06/2026" },
  { numero: "CTR-2026-000147", contrato: "Contrato Social",            solicitante: "Beta Serviços ME",        modo: "Cliente",  status: "assinado",             valor: 500,  data: "19/06/2026" },
  { numero: "CTR-2026-000146", contrato: "Locação Comercial",          solicitante: "Gama Tech Eireli",        modo: "Interno",  status: "pendente_assinatura",  valor: 200,  data: "18/06/2026" },
  { numero: "CTR-2026-000145", contrato: "Compra e Venda",             solicitante: "Delta Holding S/A",       modo: "Público",  status: "aguardando_pagamento", valor: 280,  data: "17/06/2026" },
  { numero: "CTR-2026-000144", contrato: "Honorários Contábeis",       solicitante: "Épsilon Ltda",            modo: "Interno",  status: "ativo",                valor: 0,    data: "16/06/2026" },
  { numero: "CTR-2026-000143", contrato: "NDA",                        solicitante: "Zeta Construções",        modo: "Cliente",  status: "pago",                 valor: 120,  data: "15/06/2026" },
  { numero: "CTR-2026-000142", contrato: "Parceria Comercial",         solicitante: "Eta Logística",           modo: "Público",  status: "rascunho",             valor: 300,  data: "14/06/2026" },
  { numero: "CTR-2026-000141", contrato: "Distrato Societário",        solicitante: "Theta Indústrias",        modo: "Interno",  status: "concluido",            valor: 200,  data: "13/06/2026" },
  { numero: "CTR-2026-000140", contrato: "Cessão de Direitos",         solicitante: "Iota Consultoria",        modo: "Cliente",  status: "cancelado",            valor: 180,  data: "12/06/2026" },
  { numero: "CTR-2026-000139", contrato: "Confissão de Dívida",        solicitante: "Kappa Distribuidora",     modo: "Interno",  status: "pendente_assinatura",  valor: 150,  data: "11/06/2026" },
];

const CATALOGO: ContratoTipo[] = [
  { slug: "compra-venda",           nome: "Compra e Venda",              descricao: "Contrato para transações de compra e venda de bens móveis ou imóveis",                            preco: 280, categoria: "Civil",           emoji: "🛒" },
  { slug: "prestacao-servicos",     nome: "Prestação de Serviços",       descricao: "Acordo formal para prestação de serviços entre contratante e contratado",                          preco: 350, categoria: "Empresarial",     emoji: "🤝" },
  { slug: "contrato-social",        nome: "Contrato Social",             descricao: "Documento constitutivo de sociedade empresária com definição de cotas e responsabilidades",         preco: 500, categoria: "Societário",      emoji: "🏢" },
  { slug: "locacao",                nome: "Locação",                     descricao: "Contrato de locação de imóvel comercial ou residencial conforme Lei do Inquilinato",                preco: 200, categoria: "Imobiliário",     emoji: "🏠" },
  { slug: "confissao-divida",       nome: "Confissão de Dívida",         descricao: "Instrumento de reconhecimento e confissão de dívida com condições de pagamento",                   preco: 150, categoria: "Civil",           emoji: "📋" },
  { slug: "parceria-comercial",     nome: "Parceria Comercial",          descricao: "Acordo de cooperação comercial entre empresas para objetivos comuns",                              preco: 300, categoria: "Comercial",       emoji: "🤲" },
  { slug: "honorarios",             nome: "Honorários Contábeis",        descricao: "Contrato de prestação de serviços contábeis com definição de honorários e escopo",                  preco: 0,   categoria: "Contábil",        emoji: "📊" },
  { slug: "alteracao-contratual",   nome: "Alteração Contratual",        descricao: "Instrumento de alteração de contrato social ou cláusulas contratuais existentes",                  preco: 400, categoria: "Societário",      emoji: "✏️" },
  { slug: "cessao-direitos",        nome: "Cessão de Direitos",          descricao: "Contrato de cessão e transferência de direitos entre cedente e cessionário",                       preco: 180, categoria: "Civil",           emoji: "📄" },
  { slug: "comodato",               nome: "Comodato",                    descricao: "Empréstimo gratuito de bem imóvel ou móvel com prazo e condições definidas",                       preco: 120, categoria: "Imobiliário",     emoji: "🔑" },
  { slug: "distrato",               nome: "Distrato",                    descricao: "Instrumento formal de rescisão e dissolução de contrato ou sociedade",                             preco: 200, categoria: "Empresarial",     emoji: "✂️" },
  { slug: "emprestimo",             nome: "Empréstimo",                  descricao: "Contrato de empréstimo de valores com definição de juros e prazo de devolução",                    preco: 150, categoria: "Civil",           emoji: "💰" },
  { slug: "termo-responsabilidade", nome: "Termo de Responsabilidade",   descricao: "Termo formal de responsabilidade sobre bens, equipamentos ou informações",                        preco: 90,  categoria: "Administrativo",  emoji: "📝" },
  { slug: "procuracao",             nome: "Procuração",                  descricao: "Instrumento de procuração com poderes específicos ou gerais para representação",                   preco: 90,  categoria: "Administrativo",  emoji: "📜" },
  { slug: "nda",                    nome: "NDA",                         descricao: "Acordo de confidencialidade e não divulgação de informações sigilosas",                            preco: 120, categoria: "Empresarial",     emoji: "🔒" },
  { slug: "freelancer",             nome: "Contrato Freelancer",         descricao: "Acordo para prestação de serviços autônomos com prazo e escopo definidos",                         preco: 150, categoria: "Trabalhista",     emoji: "💻" },
  { slug: "sociedade",              nome: "Sociedade",                   descricao: "Contrato de constituição de sociedade com definição de participação e responsabilidades",           preco: 450, categoria: "Societário",      emoji: "👥" },
  { slug: "autonomo",               nome: "Contrato Autônomo",           descricao: "Contrato de trabalho autônomo com definição de atividades e remuneração",                          preco: 120, categoria: "Trabalhista",     emoji: "🧑‍💼" },
  { slug: "pj",                     nome: "Contrato PJ",                descricao: "Contrato de prestação de serviços entre pessoas jurídicas com escopo e valores",                   preco: 180, categoria: "Trabalhista",     emoji: "🏗️" },
  { slug: "recibo",                 nome: "Recibo",                      descricao: "Documento comprobatório de recebimento de valores ou bens",                                       preco: 50,  categoria: "Administrativo",  emoji: "🧾" },
  { slug: "declaracao",             nome: "Declaração",                  descricao: "Documento declaratório para fins diversos com reconhecimento formal",                              preco: 60,  categoria: "Administrativo",  emoji: "📃" },
];

const SOLICITACOES: Solicitacao[] = [
  { id: "SOL-001", solicitante: "Alfa Comércio Ltda",   contrato: "Prestação de Serviços", status: "Pendente",    valor: 350, data: "20/06/2026" },
  { id: "SOL-002", solicitante: "Beta Serviços ME",     contrato: "Contrato Social",       status: "Em Análise",  valor: 500, data: "19/06/2026" },
  { id: "SOL-003", solicitante: "Gama Tech Eireli",     contrato: "NDA",                   status: "Aprovado",    valor: 120, data: "18/06/2026" },
  { id: "SOL-004", solicitante: "Delta Holding S/A",    contrato: "Locação",               status: "Rejeitado",   valor: 200, data: "17/06/2026" },
  { id: "SOL-005", solicitante: "Épsilon Ltda",         contrato: "Compra e Venda",        status: "Pendente",    valor: 280, data: "16/06/2026" },
];

const ASSINATURAS: Assinatura[] = [
  { contrato: "CTR-2026-000146 — Locação Comercial",    partes: "Gama Tech / Proprietário",        status: "Pendente",  enviado: "18/06/2026", expira: "25/06/2026" },
  { contrato: "CTR-2026-000145 — Compra e Venda",       partes: "Delta Holding / Vendedor",        status: "Parcial",   enviado: "17/06/2026", expira: "24/06/2026" },
  { contrato: "CTR-2026-000147 — Contrato Social",      partes: "Sócio A / Sócio B / Sócio C",    status: "Assinado",  enviado: "15/06/2026", expira: "22/06/2026" },
  { contrato: "CTR-2026-000139 — Confissão de Dívida",  partes: "Kappa Distribuidora / Credor",    status: "Expirado",  enviado: "05/06/2026", expira: "12/06/2026" },
];

const TEMPLATES: Template[] = [
  { nome: "Prestação de Serviços",   categoria: "Empresarial",    versao: "3.2", preco: 350, ativo: true,  variaveis: ["{{nome}}", "{{cpf}}", "{{servico}}", "{{valor}}"] },
  { nome: "Contrato Social",         categoria: "Societário",     versao: "2.1", preco: 500, ativo: true,  variaveis: ["{{razao_social}}", "{{cnpj}}", "{{capital}}", "{{socios}}"] },
  { nome: "Locação",                 categoria: "Imobiliário",    versao: "4.0", preco: 200, ativo: true,  variaveis: ["{{locador}}", "{{locatario}}", "{{endereco}}", "{{aluguel}}"] },
  { nome: "NDA",                     categoria: "Empresarial",    versao: "1.5", preco: 120, ativo: true,  variaveis: ["{{parte_reveladora}}", "{{parte_receptora}}", "{{prazo}}"] },
  { nome: "Honorários Contábeis",    categoria: "Contábil",       versao: "2.0", preco: 0,   ativo: true,  variaveis: ["{{escritorio}}", "{{cliente}}", "{{honorario}}", "{{cnpj}}"] },
  { nome: "Compra e Venda",          categoria: "Civil",          versao: "3.0", preco: 280, ativo: false, variaveis: ["{{comprador}}", "{{vendedor}}", "{{objeto}}", "{{preco}}"] },
];

const HISTORICO: Historico[] = [
  { dataHora: "20/06/2026 14:32", usuario: "Ana Lima",       acao: "Gerou contrato",          contrato: "CTR-2026-000148", ip: "192.168.1.10" },
  { dataHora: "20/06/2026 13:15", usuario: "Carlos Silva",   acao: "Enviou para assinatura",  contrato: "CTR-2026-000147", ip: "192.168.1.11" },
  { dataHora: "20/06/2026 11:00", usuario: "Sistema",        acao: "Pagamento confirmado",    contrato: "CTR-2026-000143", ip: "—" },
  { dataHora: "19/06/2026 17:45", usuario: "Maria Costa",    acao: "Alterou template",        contrato: "Prestação de Serviços", ip: "192.168.1.12" },
  { dataHora: "19/06/2026 16:20", usuario: "Ana Lima",       acao: "Cancelou contrato",       contrato: "CTR-2026-000140", ip: "192.168.1.10" },
  { dataHora: "19/06/2026 14:00", usuario: "Carlos Silva",   acao: "Gerou contrato",          contrato: "CTR-2026-000147", ip: "192.168.1.11" },
  { dataHora: "18/06/2026 15:30", usuario: "Ana Lima",       acao: "Gerou contrato",          contrato: "CTR-2026-000146", ip: "192.168.1.10" },
  { dataHora: "18/06/2026 10:00", usuario: "Sistema",        acao: "Lembrete enviado",        contrato: "CTR-2026-000139", ip: "—" },
  { dataHora: "17/06/2026 16:50", usuario: "Marcos Souza",   acao: "Gerou contrato",          contrato: "CTR-2026-000145", ip: "192.168.1.13" },
  { dataHora: "17/06/2026 09:20", usuario: "Maria Costa",    acao: "Ativou template",         contrato: "NDA", ip: "192.168.1.12" },
  { dataHora: "16/06/2026 14:10", usuario: "Ana Lima",       acao: "Gerou contrato",          contrato: "CTR-2026-000144", ip: "192.168.1.10" },
  { dataHora: "15/06/2026 11:30", usuario: "Carlos Silva",   acao: "Gerou contrato",          contrato: "CTR-2026-000143", ip: "192.168.1.11" },
  { dataHora: "14/06/2026 16:00", usuario: "Ana Lima",       acao: "Criou rascunho",          contrato: "CTR-2026-000142", ip: "192.168.1.10" },
  { dataHora: "13/06/2026 10:45", usuario: "Sistema",        acao: "Contrato concluído",      contrato: "CTR-2026-000141", ip: "—" },
  { dataHora: "12/06/2026 09:00", usuario: "Marcos Souza",   acao: "Gerou contrato",          contrato: "CTR-2026-000140", ip: "192.168.1.13" },
];

/* ─── Helpers ────────────────────────────────────────────────── */

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        background: bg,
        color,
        borderRadius: 999,
        padding: "3px 10px",
        fontSize: "0.73rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function TH({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th
      style={{
        padding: "10px 14px",
        textAlign: right ? "right" : "left",
        fontSize: "0.75rem",
        fontWeight: 600,
        color: "#64748b",
        textTransform: "uppercase",
        letterSpacing: "0.04em",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      {children}
    </th>
  );
}

function TD({ children, right, mono }: { children: React.ReactNode; right?: boolean; mono?: boolean }) {
  return (
    <td
      style={{
        padding: "10px 14px",
        fontSize: "0.85rem",
        color: "#334155",
        borderBottom: "1px solid #f1f5f9",
        textAlign: right ? "right" : "left",
        fontFamily: mono ? "var(--font-mono, monospace)" : "inherit",
      }}
    >
      {children}
    </td>
  );
}

function formatCurrency(v: number) {
  if (v === 0) return "Gratuito";
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

/* ─── Tabs ───────────────────────────────────────────────────── */

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard",    label: "Dashboard" },
  { key: "catalogo",     label: "Catálogo" },
  { key: "solicitacoes", label: "Solicitações" },
  { key: "assinaturas",  label: "Assinaturas" },
  { key: "templates",    label: "Templates" },
  { key: "historico",    label: "Histórico" },
];

/* ─── Componente principal ───────────────────────────────────── */

export default function ContratosPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [catFiltro, setCatFiltro] = useState<CategoriaContrato | "Todos">("Todos");

  const categorias: CategoriaContrato[] = [
    "Empresarial", "Civil", "Imobiliário", "Trabalhista",
    "Administrativo", "Societário", "Contábil", "Comercial",
  ];

  const catalogoFiltrado = catFiltro === "Todos"
    ? CATALOGO
    : CATALOGO.filter((c) => c.categoria === catFiltro);

  return (
    <AppShell>
      <div className="page-stack">
        {/* ── Hero ─────────────────────────────────── */}
        <section className="module-hero">
          <div>
            <h2 style={{ fontSize: "1.6rem", fontWeight: 700, margin: 0 }}>Contratos</h2>
            <p style={{ color: "#64748b", margin: "4px 0 0", fontSize: "0.95rem" }}>
              Geração, gestão e venda de contratos
            </p>
          </div>
          <Link
            href="/contratos/gerar"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#0f172a",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: "0.88rem",
              fontWeight: 600,
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            + Novo Contrato
          </Link>
        </section>

        {/* ── Tabs ─────────────────────────────────── */}
        <div style={{ display: "flex", gap: 4, borderBottom: "1px solid #e2e8f0", marginBottom: 8 }}>
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "10px 18px",
                fontSize: "0.85rem",
                fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? "#0f172a" : "#64748b",
                background: "none",
                border: "none",
                borderBottom: tab === t.key ? "2px solid #0f172a" : "2px solid transparent",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Conteúdo da tab ──────────────────────── */}
        {tab === "dashboard" && <TabDashboard />}
        {tab === "catalogo" && (
          <TabCatalogo
            categorias={categorias}
            catFiltro={catFiltro}
            setCatFiltro={setCatFiltro}
            itens={catalogoFiltrado}
          />
        )}
        {tab === "solicitacoes" && <TabSolicitacoes />}
        {tab === "assinaturas" && <TabAssinaturas />}
        {tab === "templates" && <TabTemplates />}
        {tab === "historico" && <TabHistorico />}
      </div>
    </AppShell>
  );
}

/* ─── Tab: Dashboard ─────────────────────────────────────────── */

function TabDashboard() {
  return (
    <>
      <div className="kpi-strip">
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Contratos gerados</span>
          <strong style={{ fontSize: "1.6rem" }}>148</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Pendentes assinatura</span>
          <strong style={{ fontSize: "1.6rem", color: "#7c3aed" }}>12</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Receita</span>
          <strong style={{ fontSize: "1.6rem", color: "#059669" }}>R$ 32.450</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Mais vendido</span>
          <strong style={{ fontSize: "1.05rem" }}>Prestação Serviços</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Hoje</span>
          <strong style={{ fontSize: "1.6rem" }}>3</strong>
        </div>
      </div>

      <div className="list-panel">
        <div className="list-panel-header">
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Contratos recentes</h3>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Últimos 10 contratos gerados</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <TH>N°</TH>
                <TH>Contrato</TH>
                <TH>Solicitante</TH>
                <TH>Modo</TH>
                <TH>Status</TH>
                <TH right>Valor</TH>
                <TH>Data</TH>
              </tr>
            </thead>
            <tbody>
              {CONTRATOS.map((c) => (
                <tr key={c.numero} style={{ transition: "background 0.1s" }}>
                  <TD mono>{c.numero}</TD>
                  <TD>{c.contrato}</TD>
                  <TD>{c.solicitante}</TD>
                  <TD>
                    <Badge bg={S_MODO[c.modo].bg} color={S_MODO[c.modo].color} label={c.modo} />
                  </TD>
                  <TD>
                    <Badge
                      bg={S_STATUS[c.status].bg}
                      color={S_STATUS[c.status].color}
                      label={S_STATUS[c.status].label}
                    />
                  </TD>
                  <TD right>{formatCurrency(c.valor)}</TD>
                  <TD>{c.data}</TD>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/* ─── Tab: Catálogo ──────────────────────────────────────────── */

function TabCatalogo({
  categorias,
  catFiltro,
  setCatFiltro,
  itens,
}: {
  categorias: CategoriaContrato[];
  catFiltro: CategoriaContrato | "Todos";
  setCatFiltro: (v: CategoriaContrato | "Todos") => void;
  itens: ContratoTipo[];
}) {
  return (
    <>
      {/* Category filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setCatFiltro("Todos")}
          style={{
            padding: "6px 14px",
            borderRadius: 999,
            border: "1px solid #e2e8f0",
            background: catFiltro === "Todos" ? "#0f172a" : "#fff",
            color: catFiltro === "Todos" ? "#fff" : "#334155",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Todos
        </button>
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCatFiltro(cat)}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #e2e8f0",
              background: catFiltro === cat ? CATEGORIA_CORES[cat] : "#fff",
              color: catFiltro === cat ? "#fff" : CATEGORIA_CORES[cat],
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid de contratos */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
        }}
      >
        {itens.map((item) => (
          <div
            key={item.slug}
            style={{
              background: "#fff",
              borderRadius: 10,
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Color bar */}
            <div style={{ height: 4, background: CATEGORIA_CORES[item.categoria] }} />

            <div style={{ padding: "16px 16px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.3rem" }}>{item.emoji}</span>
                <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{item.nome}</strong>
              </div>

              <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, lineHeight: 1.45, flex: 1 }}>
                {item.descricao}
              </p>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontWeight: 700, fontSize: "0.95rem", color: item.preco === 0 ? "#059669" : "#0f172a" }}>
                  {formatCurrency(item.preco)}
                </span>
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>~15 min</span>
              </div>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 4 }}>
                <Badge bg={CATEGORIA_CORES[item.categoria] + "18"} color={CATEGORIA_CORES[item.categoria]} label={item.categoria} />
                <Link
                  href={`/contratos/gerar?tipo=${item.slug}`}
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "#0f172a",
                    textDecoration: "none",
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: "1px solid #e2e8f0",
                    background: "#f8fafc",
                    cursor: "pointer",
                  }}
                >
                  Gerar contrato
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

/* ─── Tab: Solicitações ──────────────────────────────────────── */

function TabSolicitacoes() {
  return (
    <div className="list-panel">
      <div className="list-panel-header">
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Solicitações de contratos</h3>
        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Solicitações recebidas do portal do cliente</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>#</TH>
              <TH>Solicitante</TH>
              <TH>Contrato</TH>
              <TH>Status</TH>
              <TH right>Valor</TH>
              <TH>Data</TH>
            </tr>
          </thead>
          <tbody>
            {SOLICITACOES.map((s) => (
              <tr key={s.id}>
                <TD mono>{s.id}</TD>
                <TD>{s.solicitante}</TD>
                <TD>{s.contrato}</TD>
                <TD>
                  <Badge
                    bg={S_SOLICITACAO[s.status]?.bg ?? "#f3f4f6"}
                    color={S_SOLICITACAO[s.status]?.color ?? "#6b7280"}
                    label={s.status}
                  />
                </TD>
                <TD right>{formatCurrency(s.valor)}</TD>
                <TD>{s.data}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tab: Assinaturas ───────────────────────────────────────── */

function TabAssinaturas() {
  return (
    <div className="list-panel">
      <div className="list-panel-header">
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Assinaturas digitais</h3>
        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Acompanhamento de assinaturas eletrônicas</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>Contrato</TH>
              <TH>Partes</TH>
              <TH>Status</TH>
              <TH>Enviado</TH>
              <TH>Expira</TH>
              <TH>Ações</TH>
            </tr>
          </thead>
          <tbody>
            {ASSINATURAS.map((a, i) => (
              <tr key={i}>
                <TD mono>{a.contrato}</TD>
                <TD>{a.partes}</TD>
                <TD>
                  <Badge
                    bg={S_ASSINATURA[a.status]?.bg ?? "#f3f4f6"}
                    color={S_ASSINATURA[a.status]?.color ?? "#6b7280"}
                    label={a.status}
                  />
                </TD>
                <TD>{a.enviado}</TD>
                <TD>{a.expira}</TD>
                <TD>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        background: "#f8fafc",
                        color: "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      Reenviar
                    </button>
                    <button
                      style={{
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        border: "1px solid #fecaca",
                        borderRadius: 6,
                        background: "#fef2f2",
                        color: "#b91c1c",
                        cursor: "pointer",
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Tab: Templates ─────────────────────────────────────────── */

function TabTemplates() {
  return (
    <>
      <div className="list-panel-header" style={{ marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Templates de contratos</h3>
        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Modelos configuráveis com variáveis dinâmicas</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {TEMPLATES.map((t, i) => {
          const cor = CATEGORIA_CORES[t.categoria];
          return (
            <div
              key={i}
              style={{
                background: "#fff",
                borderRadius: 10,
                border: "1px solid #e2e8f0",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{t.nome}</strong>
                <div
                  style={{
                    width: 36,
                    height: 20,
                    borderRadius: 10,
                    background: t.ativo ? "#059669" : "#d1d5db",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      background: "#fff",
                      position: "absolute",
                      top: 2,
                      left: t.ativo ? 18 : 2,
                      transition: "left 0.2s",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <Badge bg={cor + "18"} color={cor} label={t.categoria} />
                <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>v{t.versao}</span>
              </div>

              <span style={{ fontWeight: 700, fontSize: "0.9rem", color: t.preco === 0 ? "#059669" : "#0f172a" }}>
                {formatCurrency(t.preco)}
              </span>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {t.variaveis.map((v) => (
                  <code
                    key={v}
                    style={{
                      padding: "2px 8px",
                      background: "#f1f5f9",
                      borderRadius: 4,
                      fontSize: "0.72rem",
                      color: "#475569",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    {v}
                  </code>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/* ─── Tab: Histórico ─────────────────────────────────────────── */

function TabHistorico() {
  return (
    <div className="list-panel">
      <div className="list-panel-header">
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Histórico de auditoria</h3>
        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Registro completo de ações no módulo de contratos</span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>Data/Hora</TH>
              <TH>Usuário</TH>
              <TH>Ação</TH>
              <TH>Contrato</TH>
              <TH>IP</TH>
            </tr>
          </thead>
          <tbody>
            {HISTORICO.map((h, i) => (
              <tr key={i}>
                <TD mono>{h.dataHora}</TD>
                <TD>{h.usuario}</TD>
                <TD>{h.acao}</TD>
                <TD mono>{h.contrato}</TD>
                <TD mono>{h.ip}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
