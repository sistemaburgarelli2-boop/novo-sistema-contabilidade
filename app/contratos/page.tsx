"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type Tab = "dashboard" | "catalogo" | "solicitacoes" | "assinaturas" | "templates" | "historico";

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

/* ─── Estilos ─────────────────────────────────────────────────── */

const S_STATUS: Record<string, { bg: string; color: string; label: string }> = {
  rascunho:              { bg: "#f3f4f6", color: "#6b7280", label: "Rascunho" },
  aguardando_pagamento:  { bg: "#fffbeb", color: "#92400e", label: "Aguardando Pagamento" },
  pago:                  { bg: "#eff6ff", color: "#1e40af", label: "Pago" },
  pendente_assinatura:   { bg: "#f5f3ff", color: "#7c3aed", label: "Pendente Assinatura" },
  assinado:              { bg: "#f0fdf4", color: "#065f46", label: "Assinado" },
  ativo:                 { bg: "#ecfdf5", color: "#047857", label: "Ativo" },
  concluido:             { bg: "#e8f5e9", color: "#1b5e20", label: "Concluido" },
  cancelado:             { bg: "#fef2f2", color: "#b91c1c", label: "Cancelado" },
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

/* ─── Catálogo de tipos (dados de referência) ─────────────────── */

const CATALOGO: ContratoTipo[] = [
  { slug: "compra-venda",           nome: "Compra e Venda",              descricao: "Contrato para transacoes de compra e venda de bens moveis ou imoveis",                            preco: 280, categoria: "Civil",           emoji: "🛒" },
  { slug: "prestacao-servicos",     nome: "Prestacao de Servicos",       descricao: "Acordo formal para prestacao de servicos entre contratante e contratado",                          preco: 350, categoria: "Empresarial",     emoji: "🤝" },
  { slug: "contrato-social",        nome: "Contrato Social",             descricao: "Documento constitutivo de sociedade empresaria com definicao de cotas e responsabilidades",         preco: 500, categoria: "Societário",      emoji: "🏢" },
  { slug: "locacao",                nome: "Locacao",                     descricao: "Contrato de locacao de imovel comercial ou residencial conforme Lei do Inquilinato",                preco: 200, categoria: "Imobiliário",     emoji: "🏠" },
  { slug: "confissao-divida",       nome: "Confissao de Divida",         descricao: "Instrumento de reconhecimento e confissao de divida com condicoes de pagamento",                   preco: 150, categoria: "Civil",           emoji: "📋" },
  { slug: "parceria-comercial",     nome: "Parceria Comercial",          descricao: "Acordo de cooperacao comercial entre empresas para objetivos comuns",                              preco: 300, categoria: "Comercial",       emoji: "🤲" },
  { slug: "honorarios",             nome: "Honorarios Contabeis",        descricao: "Contrato de prestacao de servicos contabeis com definicao de honorarios e escopo",                  preco: 0,   categoria: "Contábil",        emoji: "📊" },
  { slug: "alteracao-contratual",   nome: "Alteracao Contratual",        descricao: "Instrumento de alteracao de contrato social ou clausulas contratuais existentes",                  preco: 400, categoria: "Societário",      emoji: "✏️" },
  { slug: "cessao-direitos",        nome: "Cessao de Direitos",          descricao: "Contrato de cessao e transferencia de direitos entre cedente e cessionario",                       preco: 180, categoria: "Civil",           emoji: "📄" },
  { slug: "comodato",               nome: "Comodato",                    descricao: "Emprestimo gratuito de bem imovel ou movel com prazo e condicoes definidas",                       preco: 120, categoria: "Imobiliário",     emoji: "🔑" },
  { slug: "distrato",               nome: "Distrato",                    descricao: "Instrumento formal de rescisao e dissolucao de contrato ou sociedade",                             preco: 200, categoria: "Empresarial",     emoji: "✂️" },
  { slug: "emprestimo",             nome: "Emprestimo",                  descricao: "Contrato de emprestimo de valores com definicao de juros e prazo de devolucao",                    preco: 150, categoria: "Civil",           emoji: "💰" },
  { slug: "termo-responsabilidade", nome: "Termo de Responsabilidade",   descricao: "Termo formal de responsabilidade sobre bens, equipamentos ou informacoes",                        preco: 90,  categoria: "Administrativo",  emoji: "📝" },
  { slug: "procuracao",             nome: "Procuracao",                  descricao: "Instrumento de procuracao com poderes especificos ou gerais para representacao",                   preco: 90,  categoria: "Administrativo",  emoji: "📜" },
  { slug: "nda",                    nome: "NDA",                         descricao: "Acordo de confidencialidade e nao divulgacao de informacoes sigilosas",                            preco: 120, categoria: "Empresarial",     emoji: "🔒" },
  { slug: "freelancer",             nome: "Contrato Freelancer",         descricao: "Acordo para prestacao de servicos autonomos com prazo e escopo definidos",                         preco: 150, categoria: "Trabalhista",     emoji: "💻" },
  { slug: "sociedade",              nome: "Sociedade",                   descricao: "Contrato de constituicao de sociedade com definicao de participacao e responsabilidades",           preco: 450, categoria: "Societário",      emoji: "👥" },
  { slug: "autonomo",               nome: "Contrato Autonomo",           descricao: "Contrato de trabalho autonomo com definicao de atividades e remuneracao",                          preco: 120, categoria: "Trabalhista",     emoji: "🧑‍💼" },
  { slug: "pj",                     nome: "Contrato PJ",                descricao: "Contrato de prestacao de servicos entre pessoas juridicas com escopo e valores",                   preco: 180, categoria: "Trabalhista",     emoji: "🏗️" },
  { slug: "recibo",                 nome: "Recibo",                      descricao: "Documento comprobatorio de recebimento de valores ou bens",                                       preco: 50,  categoria: "Administrativo",  emoji: "🧾" },
  { slug: "declaracao",             nome: "Declaracao",                  descricao: "Documento declaratorio para fins diversos com reconhecimento formal",                              preco: 60,  categoria: "Administrativo",  emoji: "📃" },
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

function EmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "60px 20px",
        color: "#94a3b8",
        fontSize: "0.95rem",
      }}
    >
      {message}
    </div>
  );
}

function formatCurrency(v: number) {
  if (v === 0) return "Gratuito";
  return `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

/* ─── Tabs ───────────────────────────────────────────────────── */

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard",    label: "Dashboard" },
  { key: "catalogo",     label: "Catalogo" },
  { key: "solicitacoes", label: "Solicitacoes" },
  { key: "assinaturas",  label: "Assinaturas" },
  { key: "templates",    label: "Templates" },
  { key: "historico",    label: "Historico" },
];

/* ─── Componente principal ───────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ContratoRow = Record<string, any>;

export default function ContratosPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [catFiltro, setCatFiltro] = useState<CategoriaContrato | "Todos">("Todos");
  const [contratos, setContratos] = useState<ContratoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/contratos")
      .then((r) => r.json())
      .then((json) => setContratos(json.data ?? []))
      .catch(() => setContratos([]))
      .finally(() => setLoading(false));
  }, []);

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
              Geracao, gestao e venda de contratos
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

        {/* ── Conteudo da tab ──────────────────────── */}
        {tab === "dashboard" && <TabDashboard contratos={contratos} loading={loading} />}
        {tab === "catalogo" && (
          <TabCatalogo
            categorias={categorias}
            catFiltro={catFiltro}
            setCatFiltro={setCatFiltro}
            itens={catalogoFiltrado}
          />
        )}
        {tab === "solicitacoes" && <EmptyState message="Sem solicitacoes" />}
        {tab === "assinaturas" && <EmptyState message="Sem assinaturas pendentes" />}
        {tab === "templates" && <EmptyState message="Nenhum template cadastrado" />}
        {tab === "historico" && <EmptyState message="Sem registros" />}
      </div>
    </AppShell>
  );
}

/* ─── Tab: Dashboard ─────────────────────────────────────────── */

function TabDashboard({ contratos, loading }: { contratos: ContratoRow[]; loading: boolean }) {
  const total = contratos.length;
  const pendentes = contratos.filter((c) => c.status === "pendente_assinatura").length;
  const ativos = contratos.filter((c) => c.status === "ativo").length;
  const receita = contratos.reduce((s, c) => s + (Number(c.valor) || 0), 0);

  return (
    <>
      <div className="kpi-strip">
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Total de contratos</span>
          <strong style={{ fontSize: "1.6rem" }}>{loading ? "..." : total}</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Pendentes assinatura</span>
          <strong style={{ fontSize: "1.6rem", color: "#7c3aed" }}>{loading ? "..." : pendentes}</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Ativos</span>
          <strong style={{ fontSize: "1.6rem", color: "#059669" }}>{loading ? "..." : ativos}</strong>
        </div>
        <div className="metric-card">
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>Receita</span>
          <strong style={{ fontSize: "1.6rem", color: "#059669" }}>
            {loading ? "..." : formatCurrency(receita)}
          </strong>
        </div>
      </div>

      <div className="list-panel">
        <div className="list-panel-header">
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700 }}>Contratos recentes</h3>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            {total > 0 ? `Ultimos ${Math.min(total, 10)} contratos` : ""}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#94a3b8" }}>Carregando...</div>
        ) : contratos.length === 0 ? (
          <EmptyState message="Nenhum contrato cadastrado" />
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Tipo</TH>
                  <TH>Empresa</TH>
                  <TH>Status</TH>
                  <TH right>Valor</TH>
                  <TH>Criado em</TH>
                </tr>
              </thead>
              <tbody>
                {contratos.slice(0, 10).map((c) => {
                  const st = S_STATUS[c.status] ?? { bg: "#f3f4f6", color: "#6b7280", label: c.status };
                  return (
                    <tr key={c.id} style={{ transition: "background 0.1s" }}>
                      <TD>{c.tipo_contrato ?? c.tipo ?? "—"}</TD>
                      <TD>{c.empresas?.nome_legal ?? "—"}</TD>
                      <TD>
                        <Badge bg={st.bg} color={st.color} label={st.label} />
                      </TD>
                      <TD right>{formatCurrency(Number(c.valor) || 0)}</TD>
                      <TD>{c.created_at ? new Date(c.created_at).toLocaleDateString("pt-BR") : "—"}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ─── Tab: Catalogo ──────────────────────────────────────────── */

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
