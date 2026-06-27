"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";

/* ─── Tipos ───────────────────────────────────────────────────── */

type Categoria = "todos" | "contabilidade" | "fiscal" | "trabalhista" | "societario" | "financeiro" | "legislacao";
type Nivel = "basico" | "intermediario" | "avancado";

type Modulo = {
  id: string;
  titulo: string;
  descricao: string;
  categoria: Exclude<Categoria, "todos">;
  nivel: Nivel;
  aulas: Aula[];
  emoji: string;
};

type Aula = {
  id: string;
  titulo: string;
  conteudo: string;
  duracao: string;
};

/* ─── Conteudo ────────────────────────────────────────────────── */

const MODULOS: Modulo[] = [
  {
    id: "m1", titulo: "Fundamentos da Contabilidade", descricao: "Conceitos basicos, patrimonio, contas e lancamentos contabeis", categoria: "contabilidade", nivel: "basico", emoji: "📚",
    aulas: [
      { id: "a1", titulo: "O que e Contabilidade?", duracao: "8 min", conteudo: `A contabilidade e a ciencia que estuda, registra e controla o patrimonio das entidades economicas. Seu objetivo principal e fornecer informacoes uteis para a tomada de decisoes.

PRINCIPIOS FUNDAMENTAIS:
• Entidade — O patrimonio da empresa e distinto do patrimonio dos socios
• Continuidade — A empresa opera por tempo indeterminado
• Competencia — Receitas e despesas sao reconhecidas no periodo em que ocorrem
• Prudencia — Na duvida, adota-se o menor valor para ativos e o maior para passivos

USUARIOS DA CONTABILIDADE:
• Internos: gestores, diretores, socios
• Externos: governo, bancos, investidores, fornecedores

A contabilidade se divide em varias especialidades: fiscal, gerencial, de custos, auditoria, pericia e publica.` },
      { id: "a2", titulo: "Patrimonio: Ativo, Passivo e PL", duracao: "10 min", conteudo: `O patrimonio e o conjunto de bens, direitos e obrigacoes de uma entidade.

ATIVO (Bens + Direitos):
O que a empresa possui ou tem a receber.
• Ativo Circulante: caixa, bancos, estoques, contas a receber (curto prazo)
• Ativo Nao Circulante: imoveis, veiculos, maquinas, investimentos (longo prazo)

PASSIVO (Obrigacoes):
O que a empresa deve a terceiros.
• Passivo Circulante: fornecedores, salarios, impostos a pagar (curto prazo)
• Passivo Nao Circulante: emprestimos de longo prazo, financiamentos

PATRIMONIO LIQUIDO (PL):
A riqueza propria da empresa: PL = Ativo - Passivo
• Capital Social — investimento dos socios
• Reservas — lucros retidos
• Lucros/Prejuizos Acumulados

EQUACAO PATRIMONIAL:
Ativo = Passivo + Patrimonio Liquido (SEMPRE deve fechar)` },
      { id: "a3", titulo: "Plano de Contas e Lancamentos", duracao: "12 min", conteudo: `O plano de contas e a estrutura que organiza todas as contas contabeis da empresa.

ESTRUTURA BASICA:
1 — Ativo
2 — Passivo
3 — Patrimonio Liquido
4 — Receitas
5 — Custos e Despesas

METODO DAS PARTIDAS DOBRADAS:
Todo lancamento contabil tem no minimo um debito e um credito de mesmo valor.
"Nao ha debito sem credito, nem credito sem debito."

REGRAS:
• Ativo: aumenta no DEBITO, diminui no CREDITO
• Passivo/PL: aumenta no CREDITO, diminui no DEBITO
• Receitas: aumentam no CREDITO
• Despesas: aumentam no DEBITO

EXEMPLO DE LANCAMENTO:
Compra de mercadoria a vista por R$ 5.000:
D — Estoque (Ativo) .......... R$ 5.000
C — Caixa (Ativo) ............. R$ 5.000` },
    ],
  },
  {
    id: "m2", titulo: "Regimes Tributarios", descricao: "MEI, Simples Nacional, Lucro Presumido e Lucro Real", categoria: "fiscal", nivel: "basico", emoji: "🏛️",
    aulas: [
      { id: "a4", titulo: "MEI — Microempreendedor Individual", duracao: "7 min", conteudo: `O MEI e o regime mais simples para quem trabalha por conta propria.

REQUISITOS:
• Faturamento ate R$ 81.000/ano (R$ 6.750/mes)
• No maximo 1 funcionario
• Nao ser socio de outra empresa
• Atividade permitida na lista CNAE do MEI

IMPOSTOS (DAS-MEI fixo mensal em 2026):
• Comercio/Industria: R$ 75,90 (INSS + ICMS)
• Servicos: R$ 79,90 (INSS + ISS)
• Comercio + Servicos: R$ 80,90 (INSS + ICMS + ISS)

OBRIGACOES:
• Pagar DAS mensalmente
• Declaracao Anual (DASN-SIMEI) ate 31 de maio
• Emitir nota fiscal para PJ (opcional para PF)

VANTAGENS: simplicidade, custo baixo, aposentadoria
DESVANTAGENS: limite de faturamento, apenas 1 funcionario` },
      { id: "a5", titulo: "Simples Nacional", duracao: "10 min", conteudo: `O Simples Nacional unifica ate 8 tributos em uma unica guia (DAS).

QUEM PODE OPTAR:
• ME: faturamento ate R$ 360.000/ano
• EPP: faturamento ate R$ 4.800.000/ano
• Nao ter socios PJ ou empresa no exterior

ANEXOS DO SIMPLES (aliquotas iniciais):
• Anexo I — Comercio: a partir de 4%
• Anexo II — Industria: a partir de 4,5%
• Anexo III — Servicos (tipo 1): a partir de 6%
• Anexo IV — Servicos (tipo 2): a partir de 4,5%
• Anexo V — Servicos (tipo 3): a partir de 15,5%

FATOR R (importante!):
Se folha de pagamento >= 28% do faturamento, empresa do Anexo V migra para o Anexo III (aliquota menor).

TRIBUTOS INCLUSOS: IRPJ, CSLL, PIS, COFINS, IPI, ICMS, ISS, CPP` },
      { id: "a6", titulo: "Lucro Presumido e Lucro Real", duracao: "12 min", conteudo: `LUCRO PRESUMIDO:
A Receita Federal "presume" o lucro com base em percentuais fixos sobre o faturamento.

Margens de presuncao:
• Comercio: 8% (IRPJ) / 12% (CSLL)
• Servicos: 32% (IRPJ) / 32% (CSLL)
• Industria: 8% (IRPJ) / 12% (CSLL)

Aliquotas sobre o lucro presumido:
• IRPJ: 15% + 10% sobre excedente de R$ 20.000/mes
• CSLL: 9%
• PIS: 0,65% sobre faturamento
• COFINS: 3% sobre faturamento

Limite: faturamento ate R$ 78 milhoes/ano.

LUCRO REAL:
O imposto e calculado sobre o lucro contabil efetivo (receitas - despesas).

Obrigatorio para:
• Faturamento acima de R$ 78 milhoes/ano
• Bancos e financeiras
• Empresas com beneficios fiscais

Vantagem: se a empresa tem prejuizo, nao paga IRPJ/CSLL.
Desvantagem: exige contabilidade completa e rigorosa.` },
    ],
  },
  {
    id: "m3", titulo: "Departamento Pessoal", descricao: "Admissao, folha de pagamento, ferias, rescisao e eSocial", categoria: "trabalhista", nivel: "intermediario", emoji: "👥",
    aulas: [
      { id: "a7", titulo: "Processo de Admissao", duracao: "8 min", conteudo: `A admissao e o processo de contratacao formal de um empregado.

DOCUMENTOS NECESSARIOS:
• CTPS (Carteira de Trabalho — hoje digital)
• CPF e RG
• Titulo de eleitor
• Certificado de reservista (homens)
• Comprovante de residencia
• Certidao de nascimento dos filhos (para salario-familia)
• ASO — Atestado de Saude Ocupacional (exame admissional)

PRAZOS LEGAIS:
• Registrar na CTPS: ate 5 dias uteis
• Enviar ao eSocial (evento S-2200): ate o dia anterior ao inicio
• Exame admissional: antes do inicio das atividades

TIPOS DE CONTRATO:
• Prazo indeterminado — o mais comum
• Prazo determinado — maximo 2 anos
• Experiencia — maximo 90 dias (pode ser 45+45)
• Intermitente — convocacao por periodo
• Temporario — ate 180 dias, prorrogavel por mais 90` },
      { id: "a8", titulo: "Folha de Pagamento", duracao: "12 min", conteudo: `A folha de pagamento calcula a remuneracao liquida do empregado.

PROVENTOS (o que o empregado recebe):
• Salario base
• Horas extras (minimo 50% a mais, 100% domingos/feriados)
• Adicional noturno (20% das 22h as 5h)
• Adicional de insalubridade (10%, 20% ou 40% do salario minimo)
• Adicional de periculosidade (30% do salario base)
• Comissoes, gratificacoes, DSR

DESCONTOS:
• INSS — aliquota progressiva (7,5% a 14%)
• IRRF — aliquota progressiva (0% a 27,5%)
• Vale-transporte — ate 6% do salario base
• Faltas e atrasos
• Pensao alimenticia (se houver)

ENCARGOS DO EMPREGADOR:
• INSS patronal: 20% (ou RAT de 1% a 3%)
• FGTS: 8% do salario bruto
• Provisao de 13o e ferias

PRAZO: pagamento ate o 5o dia util do mes seguinte.` },
      { id: "a9", titulo: "Rescisao Trabalhista", duracao: "10 min", conteudo: `A rescisao encerra o contrato de trabalho.

TIPOS DE RESCISAO:

1. SEM JUSTA CAUSA (empresa demite):
Direitos: saldo salario, 13o proporcional, ferias + 1/3, aviso previo, FGTS + multa 40%, seguro-desemprego.

2. POR JUSTA CAUSA (falta grave do empregado):
Direitos: apenas saldo de salario e ferias vencidas + 1/3.
Motivos: abandono, insubordinacao, furto, embriaguez habitual (art. 482 CLT).

3. PEDIDO DE DEMISSAO (empregado pede):
Direitos: saldo salario, 13o proporcional, ferias + 1/3. Sem multa FGTS, sem seguro-desemprego.

4. ACORDO (art. 484-A CLT):
Direitos: metade do aviso previo, multa FGTS de 20%, saque de 80% do FGTS. Sem seguro-desemprego.

AVISO PREVIO:
• 30 dias + 3 dias por ano trabalhado (maximo 90 dias)
• Pode ser trabalhado ou indenizado

PRAZO PARA PAGAMENTO: ate 10 dias apos o termino.` },
    ],
  },
  {
    id: "m4", titulo: "Obrigacoes Acessorias", descricao: "SPED, ECD, ECF, DCTF, EFD e prazos fiscais", categoria: "fiscal", nivel: "intermediario", emoji: "📋",
    aulas: [
      { id: "a10", titulo: "SPED — Sistema Publico de Escrituracao Digital", duracao: "10 min", conteudo: `O SPED e o sistema do governo que digitalizou as obrigacoes fiscais e contabeis.

PRINCIPAIS MODULOS:

ECD (Escrituracao Contabil Digital):
• Substitui o Livro Diario e Razao em papel
• Obrigatoria para Lucro Real e Presumido (acima de R$ 4,8M)
• Prazo: ultimo dia util de junho

ECF (Escrituracao Contabil Fiscal):
• Substitui a DIPJ
• Demonstra a apuracao do IRPJ e CSLL
• Prazo: ultimo dia util de julho

EFD-Contribuicoes:
• Apuracao de PIS e COFINS
• Mensal, prazo: 10o dia util do 2o mes subsequente

EFD-ICMS/IPI:
• Escrituracao fiscal de ICMS e IPI
• Mensal, prazo varia por estado

EFD-Reinf:
• Retencoes e informacoes da contribuicao previdenciaria
• Substitui parte da DIRF

e-Social:
• Informacoes trabalhistas, previdenciarias e fiscais
• Eventos de admissao, folha, ferias, rescisao, SST` },
      { id: "a11", titulo: "DCTF e DCTF-Web", duracao: "8 min", conteudo: `DCTF (Declaracao de Debitos e Creditos Tributarios Federais):
Informa a a Receita os tributos federais devidos e como foram pagos.

TRIBUTOS DECLARADOS:
• IRPJ, CSLL, PIS, COFINS, IPI, IRRF, IOF, CIDE

PRAZO: ate o 15o dia util do 2o mes seguinte ao trimestre.
OBRIGADOS: PJ de Lucro Real e Presumido.

DCTF-Web:
• Versao digital integrada ao eSocial e EFD-Reinf
• Gera automaticamente a partir dos eventos enviados
• Substitui a GFIP para recolhimento previdenciario
• Prazo: ate o dia 15 do mes seguinte

DARF: o pagamento dos tributos e feito via DARF (Documento de Arrecadacao de Receitas Federais), gerado na propria DCTF-Web.

MULTA POR ATRASO: 2% ao mes sobre o valor declarado, limitada a 20%.` },
    ],
  },
  {
    id: "m5", titulo: "Constituicao de Empresas", descricao: "Tipos societarios, abertura, alteracao e encerramento", categoria: "societario", nivel: "basico", emoji: "🏗️",
    aulas: [
      { id: "a12", titulo: "Tipos de Empresa no Brasil", duracao: "10 min", conteudo: `TIPOS SOCIETARIOS:

MEI — Microempreendedor Individual:
Mais simples, 1 pessoa, ate R$ 81.000/ano.

EI — Empresario Individual:
1 titular, patrimonio pessoal nao separado (responsabilidade ilimitada).

EIRELI (extinta) → SLU — Sociedade Limitada Unipessoal:
1 socio, patrimonio separado, sem capital social minimo.

LTDA — Sociedade Limitada:
2+ socios, responsabilidade limitada ao capital social. A mais comum no Brasil.

S/A — Sociedade Anonima:
Capital dividido em acoes. Pode ser de capital aberto (bolsa) ou fechado.

SIMPLES — Sociedade Simples:
Para profissionais intelectuais (medicos, advogados, contadores).

PROCESSO DE ABERTURA:
1. Consulta de viabilidade (nome e local)
2. Registro na Junta Comercial
3. Obtencao do CNPJ (Receita Federal)
4. Inscricao Estadual (se comercio/industria)
5. Inscricao Municipal e Alvara de Funcionamento
6. Cadastro na Previdencia Social` },
    ],
  },
  {
    id: "m6", titulo: "Gestao Financeira", descricao: "Fluxo de caixa, DRE, balanco e indicadores", categoria: "financeiro", nivel: "intermediario", emoji: "💰",
    aulas: [
      { id: "a13", titulo: "Demonstracoes Contabeis", duracao: "12 min", conteudo: `As demonstracoes contabeis sao relatorios que mostram a situacao financeira da empresa.

BALANCO PATRIMONIAL (BP):
"Fotografia" do patrimonio em determinada data.
Lado esquerdo: ATIVO (bens + direitos)
Lado direito: PASSIVO + PL (obrigacoes + capital proprio)
Deve sempre fechar: Ativo = Passivo + PL

DRE — Demonstracao do Resultado do Exercicio:
Mostra se a empresa teve LUCRO ou PREJUIZO no periodo.
Estrutura:
  Receita Bruta
  (-) Deducoes (impostos sobre vendas)
  = Receita Liquida
  (-) CMV (Custo da Mercadoria Vendida)
  = Lucro Bruto
  (-) Despesas Operacionais
  = Lucro Operacional
  (+/-) Resultado Financeiro
  = Lucro Antes do IR
  (-) IRPJ e CSLL
  = Lucro Liquido

DFC — Demonstracao do Fluxo de Caixa:
Mostra as entradas e saidas de dinheiro.
• Atividades Operacionais (dia a dia)
• Atividades de Investimento (compra/venda de ativos)
• Atividades de Financiamento (emprestimos, capital)` },
      { id: "a14", titulo: "Indicadores Financeiros", duracao: "8 min", conteudo: `Indicadores ajudam a analisar a saude financeira da empresa.

LIQUIDEZ (capacidade de pagar dividas):
• Liquidez Corrente = Ativo Circulante / Passivo Circulante
  > 1 = bom | < 1 = alerta

• Liquidez Seca = (AC - Estoques) / PC
  Exclui estoques por serem menos liquidos

RENTABILIDADE (capacidade de gerar lucro):
• Margem Liquida = Lucro Liquido / Receita x 100
• ROE = Lucro Liquido / Patrimonio Liquido x 100
• ROA = Lucro Liquido / Ativo Total x 100

ENDIVIDAMENTO:
• Grau de Endividamento = Passivo / Ativo x 100
  Quanto menor, melhor

• Composicao = Passivo Circulante / Passivo Total
  Mostra se as dividas sao de curto ou longo prazo

PRAZOS MEDIOS:
• PMR (Prazo Medio de Recebimento) = Contas a Receber / Vendas x 360
• PMP (Prazo Medio de Pagamento) = Fornecedores / Compras x 360
• PME (Prazo Medio de Estoque) = Estoque / CMV x 360

Ciclo Financeiro = PMR + PME - PMP (quanto menor, melhor)` },
    ],
  },
  {
    id: "m7", titulo: "Legislacao Trabalhista", descricao: "CLT, reforma trabalhista e direitos do trabalhador", categoria: "legislacao", nivel: "avancado", emoji: "⚖️",
    aulas: [
      { id: "a15", titulo: "Principais Direitos do Trabalhador", duracao: "10 min", conteudo: `Direitos garantidos pela CLT e Constituicao Federal:

JORNADA DE TRABALHO:
• 8 horas diarias / 44 horas semanais
• Intervalo minimo de 1 hora (jornada > 6h)
• Hora extra: minimo 50% a mais (100% domingos/feriados)
• Banco de horas: compensacao em ate 6 meses (acordo individual)

FERIAS:
• 30 dias apos 12 meses de trabalho
• Remuneracao + 1/3 constitucional
• Pode ser fracionada em ate 3 periodos (minimo 14 dias em 1)
• Abono pecuniario: vender ate 10 dias

13o SALARIO:
• 1a parcela: ate 30 de novembro
• 2a parcela: ate 20 de dezembro
• Proporcional: 1/12 por mes trabalhado (acima de 15 dias)

FGTS:
• 8% do salario bruto depositado mensalmente
• Saque: demissao sem justa causa, aposentadoria, doenca grave, imovel

LICENCAS:
• Maternidade: 120 dias (pode ser 180 com empresa cidada)
• Paternidade: 5 dias (pode ser 20 com empresa cidada)
• Casamento: 3 dias
• Falecimento de familiar: 2 dias

SEGURO-DESEMPREGO:
• 3 a 5 parcelas conforme tempo trabalhado
• Apenas demissao sem justa causa` },
    ],
  },
];

const CATEGORIAS: { key: Categoria; label: string; cor: string }[] = [
  { key: "todos", label: "Todos", cor: "#07170d" },
  { key: "contabilidade", label: "Contabilidade", cor: "#1e40af" },
  { key: "fiscal", label: "Fiscal", cor: "#065f46" },
  { key: "trabalhista", label: "Trabalhista", cor: "#7c3aed" },
  { key: "societario", label: "Societario", cor: "#92400e" },
  { key: "financeiro", label: "Financeiro", cor: "#0891b2" },
  { key: "legislacao", label: "Legislacao", cor: "#dc2626" },
];

const NIVEL_CFG: Record<Nivel, { bg: string; color: string; label: string }> = {
  basico: { bg: "#f0fdf4", color: "#065f46", label: "Basico" },
  intermediario: { bg: "#eff6ff", color: "#1d4ed8", label: "Intermediario" },
  avancado: { bg: "#fef2f2", color: "#b91c1c", label: "Avancado" },
};

/* ─── Componente principal ────────────────────────────────────── */

export default function EscolaPage() {
  const [categoria, setCategoria] = useState<Categoria>("todos");
  const [busca, setBusca] = useState("");
  const [moduloAberto, setModuloAberto] = useState<Modulo | null>(null);
  const [aulaAberta, setAulaAberta] = useState<Aula | null>(null);
  const [aulasLidas, setAulasLidas] = useState<Set<string>>(new Set());

  function marcarLida(aulaId: string) {
    setAulasLidas(prev => { const n = new Set(prev); n.add(aulaId); return n; });
  }

  const modulosFiltrados = MODULOS.filter(m => {
    if (categoria !== "todos" && m.categoria !== categoria) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return m.titulo.toLowerCase().includes(q) || m.descricao.toLowerCase().includes(q)
        || m.aulas.some(a => a.titulo.toLowerCase().includes(q));
    }
    return true;
  });

  const totalAulas = MODULOS.reduce((s, m) => s + m.aulas.length, 0);
  const progresso = totalAulas > 0 ? Math.round((aulasLidas.size / totalAulas) * 100) : 0;

  return (
    <AppShell>
      <div className="page-stack">
        {/* ── Header ── */}
        <div style={{ borderRadius: 14, overflow: "hidden", background: "linear-gradient(110deg, #0f172a 0%, #1e3a5f 50%, #1e40af 100%)", boxShadow: "0 4px 24px rgba(6,23,13,0.18)", padding: "1.5rem 2rem", color: "#fff", position: "relative" }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: "100%", background: "radial-gradient(circle at 80% 50%, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🎓</div>
              <div>
                <h1 style={{ margin: 0, fontSize: "1.35rem", fontWeight: 800 }}>Escola Contabil</h1>
                <p style={{ margin: "2px 0 0", fontSize: "0.82rem", opacity: 0.7 }}>Area de estudos — contabilidade, fiscal, trabalhista e mais</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "0.7rem", opacity: 0.6, marginBottom: 4 }}>Seu progresso</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 120, height: 8, borderRadius: 4, background: "rgba(255,255,255,0.15)", overflow: "hidden" }}>
                  <div style={{ width: `${progresso}%`, height: "100%", background: "#6366f1", borderRadius: 4, transition: "width 0.3s" }} />
                </div>
                <span style={{ fontSize: "0.85rem", fontWeight: 700 }}>{progresso}%</span>
              </div>
              <div style={{ fontSize: "0.7rem", opacity: 0.5, marginTop: 2 }}>{aulasLidas.size}/{totalAulas} aulas concluidas</div>
            </div>
          </div>
        </div>

        {/* ── Leitura de aula ── */}
        {aulaAberta && moduloAberto ? (
          <div>
            <button onClick={() => setAulaAberta(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6f8f7c", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, marginBottom: 12, padding: 0 }} type="button">
              <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/></svg>
              Voltar para {moduloAberto.titulo}
            </button>

            <div style={{ background: "#fff", border: "1.5px solid #dfece5", borderRadius: 14, padding: "2rem", maxWidth: 800 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: "0.7rem", color: "#6f8f7c", fontWeight: 600 }}>{moduloAberto.titulo}</span>
                  <h2 style={{ margin: "4px 0 0", fontSize: "1.2rem", fontWeight: 800, color: "#07170d" }}>{aulaAberta.titulo}</h2>
                </div>
                <span style={{ fontSize: "0.75rem", color: "#9ca3af", background: "#f3f4f6", padding: "3px 10px", borderRadius: 999 }}>{aulaAberta.duracao}</span>
              </div>

              <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: 1.8, color: "#1a1a2e", margin: 0 }}>
                {aulaAberta.conteudo}
              </pre>

              <div style={{ borderTop: "1px solid #dfece5", marginTop: 24, paddingTop: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {aulasLidas.has(aulaAberta.id) ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 6, color: "#059669", fontSize: "0.85rem", fontWeight: 600 }}>
                    <span style={{ fontSize: 18 }}>✓</span> Aula concluida
                  </span>
                ) : (
                  <button onClick={() => marcarLida(aulaAberta.id)} style={{ padding: "0.6rem 1.5rem", background: "linear-gradient(135deg, #4f46e5, #6366f1)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 700, fontSize: "0.85rem", cursor: "pointer" }} type="button">
                    Marcar como concluida
                  </button>
                )}

                {(() => {
                  const aulas = moduloAberto.aulas;
                  const idx = aulas.findIndex(a => a.id === aulaAberta.id);
                  const next = idx < aulas.length - 1 ? aulas[idx + 1] : null;
                  return next ? (
                    <button onClick={() => { marcarLida(aulaAberta.id); setAulaAberta(next); }} style={{ padding: "0.6rem 1.5rem", background: "#f3f4f6", border: "1px solid #dfece5", borderRadius: 8, fontWeight: 600, fontSize: "0.85rem", cursor: "pointer", color: "#07170d" }} type="button">
                      Proxima aula →
                    </button>
                  ) : null;
                })()}
              </div>
            </div>
          </div>
        ) : moduloAberto ? (
          /* ── Detalhes do modulo ── */
          <div>
            <button onClick={() => setModuloAberto(null)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#6f8f7c", cursor: "pointer", fontSize: "0.82rem", fontWeight: 600, marginBottom: 12, padding: 0 }} type="button">
              <svg fill="none" height={14} viewBox="0 0 24 24" width={14}><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}/></svg>
              Voltar
            </button>

            <div style={{ background: "#fff", border: "1.5px solid #dfece5", borderRadius: 14, padding: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: `${CATEGORIAS.find(c => c.key === moduloAberto.categoria)?.cor ?? "#6366f1"}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>{moduloAberto.emoji}</div>
                <div>
                  <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#07170d" }}>{moduloAberto.titulo}</h2>
                  <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "#6f8f7c" }}>{moduloAberto.descricao}</p>
                </div>
                <div style={{ marginLeft: "auto" }}>
                  <span style={{ ...NIVEL_CFG[moduloAberto.nivel], display: "inline-block", borderRadius: 999, padding: "3px 10px", fontSize: "0.73rem", fontWeight: 700 }}>{NIVEL_CFG[moduloAberto.nivel].label}</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {moduloAberto.aulas.map((aula, i) => {
                  const lida = aulasLidas.has(aula.id);
                  return (
                    <button key={aula.id} onClick={() => setAulaAberta(aula)} type="button" style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                      background: lida ? "#f0fdf4" : "#f9fafb", border: `1.5px solid ${lida ? "#bbf7d0" : "#dfece5"}`,
                      borderRadius: 10, cursor: "pointer", textAlign: "left", transition: "all 0.15s", width: "100%",
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                        background: lida ? "#059669" : "#e5e7eb", color: lida ? "#fff" : "#6f8f7c", fontSize: "0.8rem", fontWeight: 700, flexShrink: 0,
                      }}>
                        {lida ? "✓" : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#07170d" }}>{aula.titulo}</div>
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>{aula.duracao}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ── Lista de modulos ── */
          <>
            {/* Filtros */}
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
              <input onChange={e => setBusca(e.target.value)} placeholder="Buscar conteudo..." style={{ flex: 1, minWidth: 200, padding: "0.55rem 0.875rem", border: "1.5px solid #dfece5", borderRadius: 8, fontSize: "0.85rem", outline: "none" }} type="text" value={busca} />
            </div>

            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {CATEGORIAS.map(c => (
                <button key={c.key} onClick={() => setCategoria(c.key)} type="button" style={{
                  padding: "5px 14px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  background: categoria === c.key ? c.cor : "#f3f4f6", color: categoria === c.key ? "#fff" : "#6f8f7c",
                  border: "none",
                }}>
                  {c.label}
                </button>
              ))}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 14 }}>
              {modulosFiltrados.map(m => {
                const aulasDoModulo = m.aulas.length;
                const lidasDoModulo = m.aulas.filter(a => aulasLidas.has(a.id)).length;
                const catCfg = CATEGORIAS.find(c => c.key === m.categoria);
                return (
                  <button key={m.id} onClick={() => setModuloAberto(m)} type="button" style={{
                    background: "#fff", border: "1.5px solid #dfece5", borderRadius: 14, padding: "1.25rem",
                    cursor: "pointer", textAlign: "left", transition: "all 0.15s", display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 12, background: `${catCfg?.cor ?? "#6366f1"}10`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, flexShrink: 0 }}>{m.emoji}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#07170d", marginBottom: 2 }}>{m.titulo}</div>
                        <div style={{ fontSize: "0.78rem", color: "#6f8f7c", lineHeight: 1.4 }}>{m.descricao}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ ...NIVEL_CFG[m.nivel], display: "inline-block", borderRadius: 999, padding: "2px 8px", fontSize: "0.65rem", fontWeight: 700 }}>{NIVEL_CFG[m.nivel].label}</span>
                        <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>{aulasDoModulo} aula{aulasDoModulo !== 1 ? "s" : ""}</span>
                      </div>
                      {lidasDoModulo > 0 && (
                        <span style={{ fontSize: "0.72rem", color: lidasDoModulo === aulasDoModulo ? "#059669" : "#6f8f7c", fontWeight: 600 }}>
                          {lidasDoModulo === aulasDoModulo ? "✓ Completo" : `${lidasDoModulo}/${aulasDoModulo}`}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {modulosFiltrados.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af", fontSize: "0.85rem" }}>Nenhum conteudo encontrado.</div>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
