/* ─── Utilitários do Gerador de Contratos ───────────────────── */

import type { ClausulaContrato, Contrato, Parte, ParteContrato } from "./types";

/* ── Storage (localStorage) ── */
export function loadLS<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveLS<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota cheia — ignora */
  }
}

export const LS_KEYS = {
  contratos: "gerador_contratos",
  clausulas: "gerador_clausulas",
  modelos: "gerador_modelos",
  partes: "gerador_partes",
  regras: "gerador_regras",
};

export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

/* ── Máscaras ── */
export const maskCPF = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const maskCNPJ = (v: string) =>
  v.replace(/\D/g, "").slice(0, 14)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");

export const maskTelefone = (v: string) =>
  v.replace(/\D/g, "").slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})$/, "$1-$2");

export const maskCEP = (v: string) =>
  v.replace(/\D/g, "").slice(0, 8).replace(/(\d{5})(\d{1,3})$/, "$1-$2");

export const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/* ── Valor por extenso (pt-BR) ── */
const UNIDADES = ["", "um", "dois", "três", "quatro", "cinco", "seis", "sete", "oito", "nove"];
const DEZ_A_DEZENOVE = ["dez", "onze", "doze", "treze", "quatorze", "quinze", "dezesseis", "dezessete", "dezoito", "dezenove"];
const DEZENAS = ["", "", "vinte", "trinta", "quarenta", "cinquenta", "sessenta", "setenta", "oitenta", "noventa"];
const CENTENAS = ["", "cento", "duzentos", "trezentos", "quatrocentos", "quinhentos", "seiscentos", "setecentos", "oitocentos", "novecentos"];

function trioPorExtenso(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cem";
  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;
  const partes: string[] = [];
  if (c) partes.push(CENTENAS[c]);
  if (d === 1) {
    partes.push(DEZ_A_DEZENOVE[u]);
  } else {
    if (d) partes.push(DEZENAS[d]);
    if (u && d !== 1) partes.push(UNIDADES[u]);
  }
  return partes.join(" e ");
}

function inteiroPorExtenso(n: number): string {
  if (n === 0) return "zero";
  const bilhoes = Math.floor(n / 1_000_000_000);
  const milhoes = Math.floor((n % 1_000_000_000) / 1_000_000);
  const milhares = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const partes: string[] = [];
  if (bilhoes) partes.push(`${trioPorExtenso(bilhoes)} ${bilhoes === 1 ? "bilhão" : "bilhões"}`);
  if (milhoes) partes.push(`${trioPorExtenso(milhoes)} ${milhoes === 1 ? "milhão" : "milhões"}`);
  if (milhares) partes.push(milhares === 1 ? "mil" : `${trioPorExtenso(milhares)} mil`);
  if (resto) partes.push(trioPorExtenso(resto));
  return partes.join(" e ");
}

export function valorPorExtenso(valor: number): string {
  const inteiro = Math.floor(Math.abs(valor));
  const centavos = Math.round((Math.abs(valor) - inteiro) * 100);
  const partes: string[] = [];
  if (inteiro > 0) {
    partes.push(`${inteiroPorExtenso(inteiro)} ${inteiro === 1 ? "real" : "reais"}`);
  }
  if (centavos > 0) {
    partes.push(`${inteiroPorExtenso(centavos)} ${centavos === 1 ? "centavo" : "centavos"}`);
  }
  if (partes.length === 0) return "zero reais";
  return partes.join(" e ");
}

/* ── Data por extenso ── */
const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function dataPorExtenso(iso?: string): string {
  const d = iso ? new Date(iso + "T12:00:00") : new Date();
  if (isNaN(d.getTime())) return "";
  return `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

export function dataBR(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso + "T12:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

/* ── Numeração ordinal de cláusulas ── */
const ORDINAIS = [
  "PRIMEIRA", "SEGUNDA", "TERCEIRA", "QUARTA", "QUINTA", "SEXTA", "SÉTIMA",
  "OITAVA", "NONA", "DÉCIMA", "DÉCIMA PRIMEIRA", "DÉCIMA SEGUNDA",
  "DÉCIMA TERCEIRA", "DÉCIMA QUARTA", "DÉCIMA QUINTA", "DÉCIMA SEXTA",
  "DÉCIMA SÉTIMA", "DÉCIMA OITAVA", "DÉCIMA NONA", "VIGÉSIMA",
  "VIGÉSIMA PRIMEIRA", "VIGÉSIMA SEGUNDA", "VIGÉSIMA TERCEIRA",
  "VIGÉSIMA QUARTA", "VIGÉSIMA QUINTA", "VIGÉSIMA SEXTA", "VIGÉSIMA SÉTIMA",
  "VIGÉSIMA OITAVA", "VIGÉSIMA NONA", "TRIGÉSIMA",
];

export function ordinalClausula(index: number): string {
  return ORDINAIS[index] ?? `Nº ${index + 1}`;
}

/* ── Motor de variáveis ── */
export function montarVariaveis(
  dados: Record<string, string>,
  partesContrato: ParteContrato[],
  partes: Parte[],
): Record<string, string> {
  const vars: Record<string, string> = { ...dados };

  // Datas
  const hoje = new Date();
  vars["DATA"] = hoje.toLocaleDateString("pt-BR");
  vars["DATA_EXTENSO"] = dataPorExtenso();

  // Valor por extenso, se houver campo VALOR numérico
  const valorNum = parseFloat((dados["VALOR"] ?? "").replace(/\./g, "").replace(",", "."));
  if (!isNaN(valorNum)) {
    vars["VALOR"] = fmtBRL(valorNum);
    vars["VALOR_EXTENSO"] = valorPorExtenso(valorNum);
  }

  // Datas em extenso para campos tipo data
  for (const [k, v] of Object.entries(dados)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      vars[k] = dataBR(v);
      vars[`${k}_EXTENSO`] = dataPorExtenso(v);
    }
  }

  // Partes por papel
  const byPapel: Record<string, Parte[]> = {};
  for (const pc of partesContrato) {
    const p = partes.find((x) => x.id === pc.parteId);
    if (!p) continue;
    const key = pc.papel.toUpperCase().replace(/\s+/g, "_").normalize("NFD").replace(/[̀-ͯ]/g, "");
    byPapel[key] = byPapel[key] ?? [];
    byPapel[key].push(p);
  }
  for (const [papel, lista] of Object.entries(byPapel)) {
    const p = lista[0];
    const endereco = [p.logradouro, p.numero, p.complemento, p.bairro, `${p.cidade}/${p.uf}`, `CEP ${p.cep}`]
      .filter(Boolean).join(", ");
    vars[papel] = p.nome;
    vars[`DOCUMENTO_${papel}`] = p.documento;
    vars[p.tipoPessoa === "PJ" ? `CNPJ_${papel}` : `CPF_${papel}`] = p.documento;
    vars[`EMAIL_${papel}`] = p.email;
    vars[`TELEFONE_${papel}`] = p.telefone;
    vars[`ENDERECO_${papel}`] = endereco;
    vars[`CIDADE_${papel}`] = p.cidade;
    vars[`ESTADO_${papel}`] = p.uf;
    if (lista.length > 1) {
      vars[`${papel}S`] = lista.map((x) => x.nome).join(", ");
    }
  }

  return vars;
}

export function substituirVariaveis(texto: string, vars: Record<string, string>): string {
  return texto.replace(/\{\{\s*([A-Z0-9_]+)\s*\}\}/gi, (_m, nome: string) => {
    const key = nome.toUpperCase();
    const v = vars[key];
    return v !== undefined && v !== "" ? v : `[${key}]`;
  });
}

/* ── Qualificação de parte (para preâmbulo) ── */
export function qualificacaoParte(p: Parte, papel: string): string {
  const endereco = [p.logradouro, p.numero, p.complemento, p.bairro, p.cidade && `${p.cidade}/${p.uf}`, p.cep && `CEP ${p.cep}`]
    .filter(Boolean).join(", ");
  if (p.tipoPessoa === "PJ") {
    return `${p.nome.toUpperCase()}, pessoa jurídica de direito privado, inscrita no CNPJ sob o nº ${p.documento}${endereco ? `, com sede na ${endereco}` : ""}, doravante denominada ${papel.toUpperCase()}`;
  }
  return `${p.nome.toUpperCase()}, pessoa física, inscrita no CPF sob o nº ${p.documento}${p.rg ? `, RG nº ${p.rg}` : ""}${endereco ? `, residente e domiciliada na ${endereco}` : ""}, doravante denominada ${papel.toUpperCase()}`;
}

/* ── Geração do documento final ── */
export function gerarDocumentoHTML(
  contrato: Pick<Contrato, "titulo" | "dados" | "partes" | "clausulas">,
  partes: Parte[],
  preambulo: string,
  fechamento: string,
): string {
  const vars = montarVariaveis(contrato.dados, contrato.partes, partes);

  const qualificacoes = contrato.partes
    .map((pc) => {
      const p = partes.find((x) => x.id === pc.parteId);
      return p ? qualificacaoParte(p, pc.papel) : null;
    })
    .filter(Boolean)
    .join(";</p><p>");

  const clausulasHTML = contrato.clausulas
    .map((c: ClausulaContrato, i: number) => {
      const texto = substituirVariaveis(c.texto, vars);
      return `<h3>CLÁUSULA ${ordinalClausula(i)} — ${c.titulo.toUpperCase()}</h3><p>${texto.replace(/\n/g, "</p><p>")}</p>`;
    })
    .join("\n");

  const assinaturas = contrato.partes
    .map((pc) => {
      const p = partes.find((x) => x.id === pc.parteId);
      if (!p) return "";
      return `<div class="assinatura"><div class="linha"></div><strong>${p.nome}</strong><br/><span>${pc.papel} — ${p.documento}</span></div>`;
    })
    .join("\n");

  return `
<div class="contrato-doc">
  <h1>${substituirVariaveis(contrato.titulo, vars).toUpperCase()}</h1>
  <p>${qualificacoes ? `Pelo presente instrumento particular, de um lado ${qualificacoes}` : ""};</p>
  <p>${substituirVariaveis(preambulo, vars).replace(/\n/g, "</p><p>")}</p>
  ${clausulasHTML}
  <p>${substituirVariaveis(fechamento, vars).replace(/\n/g, "</p><p>")}</p>
  <p class="local-data">${vars["CIDADE_CONTRATANTE"] ?? ""}${vars["CIDADE_CONTRATANTE"] ? ", " : ""}${vars["DATA_EXTENSO"]}.</p>
  <div class="assinaturas">${assinaturas}</div>
</div>`;
}

export const DOC_CSS = `
.contrato-doc { font-family: 'Times New Roman', Georgia, serif; color: #111; line-height: 1.8; font-size: 12pt; text-align: justify; }
.contrato-doc h1 { text-align: center; font-size: 14pt; margin-bottom: 24pt; text-decoration: underline; }
.contrato-doc h3 { font-size: 12pt; margin: 18pt 0 6pt; }
.contrato-doc p { margin: 0 0 10pt; text-indent: 2em; }
.contrato-doc .local-data { text-align: right; margin-top: 30pt; text-indent: 0; }
.contrato-doc .assinaturas { display: flex; flex-wrap: wrap; gap: 40pt; justify-content: space-around; margin-top: 50pt; }
.contrato-doc .assinatura { text-align: center; min-width: 220px; font-size: 11pt; }
.contrato-doc .assinatura .linha { border-top: 1px solid #111; margin-bottom: 4pt; padding-top: 4pt; }
`;

/* ── Exportações ── */
export function abrirImpressao(html: string, titulo: string) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titulo}</title><style>${DOC_CSS} body{margin:40px 60px;}</style></head><body>${html}</body></html>`);
  w.document.close();
  w.focus();
  setTimeout(() => w.print(), 400);
}

export function baixarArquivo(conteudo: string, nome: string, mime: string) {
  const blob = new Blob([conteudo], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportarDOCX(html: string, titulo: string) {
  const doc = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset="utf-8"><title>${titulo}</title><style>${DOC_CSS}</style></head><body>${html}</body></html>`;
  baixarArquivo(doc, `${titulo}.doc`, "application/msword");
}

export function exportarHTML(html: string, titulo: string) {
  baixarArquivo(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${titulo}</title><style>${DOC_CSS}</style></head><body>${html}</body></html>`,
    `${titulo}.html`,
    "text/html",
  );
}

export function exportarTXT(html: string, titulo: string) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html.replace(/<\/(p|h1|h3|div)>/g, "\n").replace(/<br\s*\/?>/g, "\n");
  baixarArquivo(tmp.textContent ?? "", `${titulo}.txt`, "text/plain");
}
