"use client";

import Link from "next/link";
import { useState } from "react";
import { BotaoVoltar } from "@/components/ui/BotaoVoltar";

/* ═══════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════ */

const CATEGORIAS = ["Todos", "Empresarial", "Trabalhista", "Imobiliário", "Civil", "Digital", "Tributário"];

type Contrato = {
  slug: string;
  nome: string;
  descricao: string;
  preco: string;
  categoria: string;
  emoji: string;
  cor: string;
  avaliacoes: number;
  nota: number;
};

const CONTRATOS: Contrato[] = [
  { slug: "contrato-social", nome: "Contrato Social", descricao: "Constituição de empresa com cláusulas personalizadas.", preco: "R$ 149,90", categoria: "Empresarial", emoji: "🏢", cor: "#10b981", avaliacoes: 412, nota: 4.8 },
  { slug: "alteracao-contratual", nome: "Alteração Contratual", descricao: "Modificação de cláusulas do contrato social vigente.", preco: "R$ 119,90", categoria: "Empresarial", emoji: "📝", cor: "#10b981", avaliacoes: 287, nota: 4.7 },
  { slug: "distrato-social", nome: "Distrato Social", descricao: "Encerramento formal de sociedade empresarial.", preco: "R$ 129,90", categoria: "Empresarial", emoji: "❌", cor: "#10b981", avaliacoes: 198, nota: 4.6 },
  { slug: "procuracao-empresarial", nome: "Procuração Empresarial", descricao: "Outorga de poderes para representação da empresa.", preco: "R$ 89,90", categoria: "Empresarial", emoji: "🤝", cor: "#10b981", avaliacoes: 356, nota: 4.9 },
  { slug: "contrato-trabalho", nome: "Contrato de Trabalho", descricao: "Contrato CLT com todas as cláusulas obrigatórias.", preco: "R$ 79,90", categoria: "Trabalhista", emoji: "👔", cor: "#3b82f6", avaliacoes: 523, nota: 4.8 },
  { slug: "contrato-estagio", nome: "Contrato de Estágio", descricao: "Termo de compromisso de estágio conforme Lei 11.788.", preco: "R$ 59,90", categoria: "Trabalhista", emoji: "🎓", cor: "#3b82f6", avaliacoes: 189, nota: 4.7 },
  { slug: "rescisao-trabalhista", nome: "Rescisão Trabalhista", descricao: "Termo de rescisão do contrato de trabalho.", preco: "R$ 99,90", categoria: "Trabalhista", emoji: "📋", cor: "#3b82f6", avaliacoes: 267, nota: 4.6 },
  { slug: "contrato-locacao", nome: "Contrato de Locação", descricao: "Locação residencial ou comercial com garantias.", preco: "R$ 109,90", categoria: "Imobiliário", emoji: "🏠", cor: "#f59e0b", avaliacoes: 634, nota: 4.9 },
  { slug: "contrato-compra-venda", nome: "Contrato de Compra e Venda", descricao: "Promessa de compra e venda de imóvel.", preco: "R$ 159,90", categoria: "Imobiliário", emoji: "🔑", cor: "#f59e0b", avaliacoes: 445, nota: 4.8 },
  { slug: "distrato-locacao", nome: "Distrato de Locação", descricao: "Encerramento de contrato de aluguel com vistoria.", preco: "R$ 89,90", categoria: "Imobiliário", emoji: "📦", cor: "#f59e0b", avaliacoes: 201, nota: 4.5 },
  { slug: "contrato-prestacao-servico", nome: "Prestação de Serviço", descricao: "Contrato de prestação de serviços autônomos.", preco: "R$ 89,90", categoria: "Civil", emoji: "🔧", cor: "#8b5cf6", avaliacoes: 478, nota: 4.8 },
  { slug: "contrato-emprestimo", nome: "Contrato de Empréstimo", descricao: "Mútuo com ou sem garantia entre partes.", preco: "R$ 99,90", categoria: "Civil", emoji: "💰", cor: "#8b5cf6", avaliacoes: 312, nota: 4.7 },
  { slug: "acordo-extrajudicial", nome: "Acordo Extrajudicial", descricao: "Acordo entre partes para resolução amigável.", preco: "R$ 119,90", categoria: "Civil", emoji: "⚖️", cor: "#8b5cf6", avaliacoes: 245, nota: 4.6 },
  { slug: "nda-confidencialidade", nome: "NDA - Confidencialidade", descricao: "Acordo de sigilo e não divulgação de informações.", preco: "R$ 69,90", categoria: "Digital", emoji: "🔒", cor: "#ec4899", avaliacoes: 389, nota: 4.9 },
  { slug: "termos-uso", nome: "Termos de Uso", descricao: "Termos de uso para site, app ou plataforma digital.", preco: "R$ 99,90", categoria: "Digital", emoji: "📱", cor: "#ec4899", avaliacoes: 567, nota: 4.8 },
  { slug: "politica-privacidade", nome: "Política de Privacidade", descricao: "Adequação à LGPD para tratamento de dados pessoais.", preco: "R$ 109,90", categoria: "Digital", emoji: "🛡️", cor: "#ec4899", avaliacoes: 498, nota: 4.9 },
  { slug: "contrato-licenciamento", nome: "Licenciamento de Software", descricao: "Licença de uso de software SaaS ou on-premise.", preco: "R$ 139,90", categoria: "Digital", emoji: "💻", cor: "#ec4899", avaliacoes: 178, nota: 4.7 },
  { slug: "planejamento-tributario", nome: "Planejamento Tributário", descricao: "Análise fiscal para redução legal de tributos.", preco: "R$ 199,90", categoria: "Tributário", emoji: "📊", cor: "#ef4444", avaliacoes: 342, nota: 4.8 },
  { slug: "defesa-fiscal", nome: "Defesa Fiscal", descricao: "Contestação de autos de infração e multas fiscais.", preco: "R$ 249,90", categoria: "Tributário", emoji: "🛡️", cor: "#ef4444", avaliacoes: 156, nota: 4.6 },
  { slug: "consultoria-tributaria", nome: "Consultoria Tributária", descricao: "Parecer técnico sobre enquadramento tributário.", preco: "R$ 179,90", categoria: "Tributário", emoji: "📑", cor: "#ef4444", avaliacoes: 223, nota: 4.7 },
  { slug: "recibo-quitacao", nome: "Recibo de Quitação", descricao: "Comprovante formal de pagamento ou quitação de débito.", preco: "R$ 39,90", categoria: "Civil", emoji: "🧾", cor: "#8b5cf6", avaliacoes: 712, nota: 4.9 },
];

const MAIS_VENDIDOS_SLUGS = ["contrato-locacao", "termos-uso", "recibo-quitacao", "procuracao-empresarial"];

const PASSOS = [
  { num: "1", emoji: "🔍", titulo: "Escolha", descricao: "Selecione o contrato ideal para a sua necessidade." },
  { num: "2", emoji: "✏️", titulo: "Preencha", descricao: "Informe os dados das partes e personalize as cláusulas." },
  { num: "3", emoji: "💳", titulo: "Pague", descricao: "Pagamento seguro via Pix, cartão ou boleto." },
  { num: "4", emoji: "📩", titulo: "Receba", descricao: "Receba seu contrato pronto por e-mail em até 15 minutos." },
];

/* ═══════════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════════ */

const pageWrap: React.CSSProperties = { minHeight: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#f8fafb" };

const topBar: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "14px 32px", background: "#06170d", position: "sticky", top: 0, zIndex: 50,
};

const logoStyle: React.CSSProperties = { display: "flex", alignItems: "center", gap: 10 };
const logoIcon: React.CSSProperties = {
  width: 36, height: 36, borderRadius: 8, background: "linear-gradient(135deg, #10b981, #065f46)",
  display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
  fontWeight: 800, fontSize: 16,
};
const logoText: React.CSSProperties = { color: "#fff", fontWeight: 700, fontSize: 16 };

const loginBtn: React.CSSProperties = {
  padding: "8px 22px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.25)",
  background: "transparent", color: "#fff", fontSize: 14, fontWeight: 600,
  cursor: "pointer", transition: "background 0.15s",
};

const hero: React.CSSProperties = {
  background: "linear-gradient(135deg, #06170d 0%, #0d3320 50%, #064e3b 100%)",
  padding: "72px 32px 64px", textAlign: "center",
};

const heroTitle: React.CSSProperties = { fontSize: 38, fontWeight: 800, color: "#fff", margin: "0 0 12px", lineHeight: 1.2 };
const heroSub: React.CSSProperties = { fontSize: 17, color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "0 auto 32px" };

const searchWrap: React.CSSProperties = {
  maxWidth: 540, margin: "0 auto", position: "relative",
};

const searchInput: React.CSSProperties = {
  width: "100%", padding: "14px 20px 14px 48px", fontSize: 15, borderRadius: 12,
  border: "2px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)",
  color: "#fff", outline: "none", boxSizing: "border-box",
};

const searchIcon: React.CSSProperties = {
  position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
  fontSize: 18, color: "rgba(255,255,255,0.5)", pointerEvents: "none",
};

const sectionWrap: React.CSSProperties = { maxWidth: 1200, margin: "0 auto", padding: "40px 32px" };

const pillRow: React.CSSProperties = {
  display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32,
  justifyContent: "center",
};

const pill = (active: boolean): React.CSSProperties => ({
  padding: "8px 18px", borderRadius: 999, fontSize: 13, fontWeight: 600,
  border: "none", cursor: "pointer", transition: "background 0.15s, color 0.15s",
  background: active ? "#065f46" : "#e5e7eb",
  color: active ? "#fff" : "#374151",
});

const gridStyle: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 };

const card = (cor: string): React.CSSProperties => ({
  background: "#fff", borderRadius: 14, overflow: "hidden",
  border: "1px solid #e5e7eb", transition: "box-shadow 0.2s, transform 0.2s",
  cursor: "pointer", position: "relative",
});

const cardBar = (cor: string): React.CSSProperties => ({ height: 5, background: cor });

const cardBody: React.CSSProperties = { padding: "20px 22px 18px" };
const cardEmoji: React.CSSProperties = { fontSize: 28, marginBottom: 8 };
const cardNome: React.CSSProperties = { fontSize: 15, fontWeight: 700, color: "#111827", marginBottom: 6 };
const cardDesc: React.CSSProperties = { fontSize: 13, color: "#6b7280", lineHeight: 1.5, marginBottom: 14, minHeight: 40 };

const cardFooter: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between",
  borderTop: "1px solid #f3f4f6", padding: "12px 22px",
};

const cardPreco: React.CSSProperties = { fontSize: 18, fontWeight: 700, color: "#065f46" };
const cardMeta: React.CSSProperties = { fontSize: 12, color: "#9ca3af" };

const cardRating: React.CSSProperties = { fontSize: 12, color: "#d4ae4a", fontWeight: 600 };

const gerarBtn: React.CSSProperties = {
  padding: "8px 18px", borderRadius: 8, border: "none",
  background: "#10b981", color: "#fff", fontSize: 13, fontWeight: 600,
  cursor: "pointer", transition: "background 0.15s",
};

const sectionTitle: React.CSSProperties = {
  fontSize: 24, fontWeight: 700, color: "#111827", textAlign: "center", marginBottom: 8,
};

const sectionSub: React.CSSProperties = {
  fontSize: 15, color: "#6b7280", textAlign: "center", marginBottom: 32,
};

const destGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 16,
};

const destCard: React.CSSProperties = {
  background: "linear-gradient(135deg, #065f46, #10b981)", borderRadius: 14,
  padding: 24, color: "#fff", position: "relative", overflow: "hidden",
};

const destNome: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginBottom: 4 };
const destPreco: React.CSSProperties = { fontSize: 20, fontWeight: 800, color: "#d4ae4a" };
const destRating: React.CSSProperties = { fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 8 };

const stepsGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 };

const stepCard: React.CSSProperties = {
  background: "#fff", borderRadius: 14, padding: 28, textAlign: "center",
  border: "1px solid #e5e7eb",
};

const stepNum: React.CSSProperties = {
  width: 44, height: 44, borderRadius: "50%", background: "#d1fae5", color: "#065f46",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  fontSize: 18, fontWeight: 800, marginBottom: 14,
};

const stepTitle: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 6 };
const stepDesc: React.CSSProperties = { fontSize: 13, color: "#6b7280", lineHeight: 1.5 };

const footerStyle: React.CSSProperties = {
  background: "#06170d", padding: "48px 32px 24px", color: "rgba(255,255,255,0.6)",
  fontSize: 13,
};

const footerInner: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto",
  display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", gap: 32,
};

const footerBrand: React.CSSProperties = { fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8 };
const footerLinks: React.CSSProperties = { listStyle: "none", padding: 0, margin: 0 };
const footerLink: React.CSSProperties = { color: "rgba(255,255,255,0.5)", textDecoration: "none", display: "block", padding: "4px 0", fontSize: 13 };
const footerHeading: React.CSSProperties = { fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.05em" };

const footerBottom: React.CSSProperties = {
  maxWidth: 1200, margin: "0 auto", borderTop: "1px solid rgba(255,255,255,0.1)",
  paddingTop: 20, marginTop: 32, textAlign: "center", fontSize: 12,
  color: "rgba(255,255,255,0.35)",
};

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export default function CatalogoContratosPage() {
  const [categoria, setCategoria] = useState("Todos");
  const [busca, setBusca] = useState("");

  const filtrados = CONTRATOS.filter((c) => {
    const matchCat = categoria === "Todos" || c.categoria === categoria;
    const matchBusca = !busca || c.nome.toLowerCase().includes(busca.toLowerCase()) || c.descricao.toLowerCase().includes(busca.toLowerCase());
    return matchCat && matchBusca;
  });

  const maisVendidos = CONTRATOS.filter((c) => MAIS_VENDIDOS_SLUGS.includes(c.slug));

  return (
    <div style={pageWrap}>
      <div style={{ padding: "16px 24px 0" }}><BotaoVoltar href="/contratos" label="Voltar para Contratos" /></div>
      {/* ── Top Bar ── */}
      <div style={topBar}>
        <div style={logoStyle}>
          <div style={logoIcon}>B</div>
          <span style={logoText}>Fatturati Burgarelli</span>
        </div>
        <Link href="/login" style={{ textDecoration: "none" }}>
          <button style={loginBtn}>Login</button>
        </Link>
      </div>

      {/* ── Hero ── */}
      <div style={hero}>
        <h1 style={heroTitle}>Contratos Prontos para Uso</h1>
        <p style={heroSub}>
          Gere contratos profissionais em minutos. Personalize, pague e receba seu documento pronto e validado.
        </p>
        <div style={searchWrap}>
          <span style={searchIcon}>🔍</span>
          <input
            style={searchInput}
            placeholder="Buscar contrato... Ex: Locação, NDA, Prestação de serviço"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>
      </div>

      {/* ── Catálogo ── */}
      <div style={sectionWrap}>
        {/* Pills */}
        <div style={pillRow}>
          {CATEGORIAS.map((cat) => (
            <button key={cat} style={pill(categoria === cat)} onClick={() => setCategoria(cat)}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid de contratos */}
        <div style={gridStyle}>
          {filtrados.map((c) => (
            <div
              key={c.slug}
              style={card(c.cor)}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
            >
              <div style={cardBar(c.cor)} />
              <div style={cardBody}>
                <div style={cardEmoji}>{c.emoji}</div>
                <div style={cardNome}>{c.nome}</div>
                <div style={cardDesc}>{c.descricao}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                  <span style={cardRating}>⭐ {c.nota} ({c.avaliacoes})</span>
                  <span style={cardMeta}>~15 min</span>
                </div>
              </div>
              <div style={cardFooter}>
                <span style={cardPreco}>{c.preco}</span>
                <Link href={`/contratos/gerar?tipo=${c.slug}`} style={{ textDecoration: "none" }}>
                  <button style={gerarBtn}>Gerar agora</button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {filtrados.length === 0 && (
          <div style={{ textAlign: "center", padding: 48, color: "#9ca3af" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <p style={{ fontSize: 16, fontWeight: 600 }}>Nenhum contrato encontrado</p>
            <p style={{ fontSize: 14 }}>Tente buscar por outro termo ou categoria.</p>
          </div>
        )}
      </div>

      {/* ── Mais Vendidos ── */}
      <div style={{ background: "#f0fdf4", padding: "48px 32px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={sectionTitle}>Mais Vendidos</h2>
          <p style={sectionSub}>Os contratos preferidos dos nossos clientes.</p>
          <div style={destGrid}>
            {maisVendidos.map((c) => (
              <div key={c.slug} style={destCard}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{c.emoji}</div>
                <div style={destNome}>{c.nome}</div>
                <div style={destPreco}>{c.preco}</div>
                <div style={destRating}>⭐ {c.nota} ({c.avaliacoes} avaliações)</div>
                <Link href={`/contratos/gerar?tipo=${c.slug}`} style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      marginTop: 14, padding: "8px 18px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.3)",
                      background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13, fontWeight: 600,
                      cursor: "pointer", transition: "background 0.15s",
                    }}
                  >
                    Gerar agora
                  </button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Como Funciona ── */}
      <div style={{ padding: "56px 32px", background: "#f8fafb" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={sectionTitle}>Como Funciona</h2>
          <p style={sectionSub}>Em 4 passos simples você tem seu contrato pronto.</p>
          <div style={stepsGrid}>
            {PASSOS.map((p) => (
              <div key={p.num} style={stepCard}>
                <div style={stepNum}>{p.num}</div>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{p.emoji}</div>
                <div style={stepTitle}>{p.titulo}</div>
                <div style={stepDesc}>{p.descricao}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={footerStyle}>
        <div style={footerInner}>
          <div>
            <div style={footerBrand}>Fatturati Burgarelli</div>
            <p style={{ margin: 0, lineHeight: 1.6 }}>
              Soluções contábeis e jurídicas inteligentes para empresas de todos os portes.
              Contratos profissionais gerados com tecnologia e validação especializada.
            </p>
          </div>

          <div>
            <div style={footerHeading}>Contratos</div>
            <ul style={footerLinks}>
              <li><Link href="/contratos/catalogo" style={footerLink}>Catálogo</Link></li>
              <li><Link href="/contratos/gerar" style={footerLink}>Gerar contrato</Link></li>
              <li><Link href="/contratos/modelos" style={footerLink}>Modelos</Link></li>
              <li><Link href="/contratos/precos" style={footerLink}>Preços</Link></li>
            </ul>
          </div>

          <div>
            <div style={footerHeading}>Empresa</div>
            <ul style={footerLinks}>
              <li><Link href="/sobre" style={footerLink}>Sobre nós</Link></li>
              <li><Link href="/blog" style={footerLink}>Blog</Link></li>
              <li><Link href="/contato" style={footerLink}>Contato</Link></li>
              <li><Link href="/carreiras" style={footerLink}>Carreiras</Link></li>
            </ul>
          </div>

          <div>
            <div style={footerHeading}>Suporte</div>
            <ul style={footerLinks}>
              <li><Link href="/ajuda" style={footerLink}>Central de ajuda</Link></li>
              <li><Link href="/termos" style={footerLink}>Termos de uso</Link></li>
              <li><Link href="/privacidade" style={footerLink}>Privacidade</Link></li>
              <li><Link href="/lgpd" style={footerLink}>LGPD</Link></li>
            </ul>
          </div>
        </div>

        <div style={footerBottom}>
          &copy; 2026 Fatturati Burgarelli &mdash; Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
