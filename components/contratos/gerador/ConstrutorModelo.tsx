"use client";

/* ═══════════════════════════════════════════════════════════════
   CONSTRUTOR VISUAL DE CONTRATOS (CLM)
   3 colunas: Biblioteca · Contrato (capítulos) · Preview em tempo real
   Drag & drop · status coloridos · dependências · IA · regras ·
   ações em massa · numeração automática · histórico · exportação
   ═══════════════════════════════════════════════════════════════ */

import { useMemo, useState } from "react";
import type {
  CapituloModelo, Clausula, EstruturaModelo, ItemClausulaModelo,
  ModeloContrato, OperadorRegra, Regra, StatusClausulaModelo,
} from "./types";
import {
  DOC_CSS, abrirImpressao, exportarDOCX, exportarHTML, ordinalClausula,
  substituirVariaveis, uid,
} from "./utils";

/* ─── Meta de status (indicadores coloridos) ─────────────────── */

const STATUS_META: Record<StatusClausulaModelo, { emoji: string; label: string; color: string; bg: string }> = {
  obrigatoria: { emoji: "🟢", label: "Obrigatória", color: "#059669", bg: "#ecfdf5" },
  opcional:    { emoji: "🟡", label: "Opcional",    color: "#b45309", bg: "#fffbeb" },
  condicional: { emoji: "🔵", label: "Condicional", color: "#1e40af", bg: "#eff6ff" },
  ia:          { emoji: "🟣", label: "Gerada por IA", color: "#7c3aed", bg: "#f5f3ff" },
  desativada:  { emoji: "🔴", label: "Desativada",  color: "#b91c1c", bg: "#fef2f2" },
};

const STATUS_ORDEM: StatusClausulaModelo[] = ["obrigatoria", "opcional", "condicional", "ia", "desativada"];

/* ─── Ícone por categoria ────────────────────────────────────── */

function iconeCategoria(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes("objeto")) return "🎯";
  if (c.includes("financ") || c.includes("pagamento") || c.includes("valor")) return "💰";
  if (c.includes("prazo") || c.includes("vig")) return "📅";
  if (c.includes("obrig")) return "📌";
  if (c.includes("penal") || c.includes("multa")) return "⚠️";
  if (c.includes("rescis")) return "✂️";
  if (c.includes("confiden") || c.includes("sigilo")) return "🔒";
  if (c.includes("lgpd") || c.includes("dados")) return "🛡️";
  if (c.includes("garant")) return "✅";
  if (c.includes("restri") || c.includes("concorr")) return "🚫";
  if (c.includes("cancel")) return "↩️";
  if (c.includes("capac") || c.includes("responsa")) return "👤";
  if (c.includes("foro")) return "⚖️";
  return "📄";
}

/* ─── Utilidades ─────────────────────────────────────────────── */

const AGORA = () => new Date().toISOString();

function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
    [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
    [5, "V"], [4, "IV"], [1, "I"],
  ];
  let r = "", x = n;
  for (const [v, s] of map) while (x >= v) { r += s; x -= v; }
  return r || "I";
}

function extrairVariaveis(texto: string): string[] {
  const set = new Set<string>();
  const re = /\{\{\s*([A-Z0-9_]+)\s*\}\}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(texto))) set.add(m[1].toUpperCase());
  return [...set];
}

function resumo(texto: string, max = 120): string {
  const t = texto.replace(/\s+/g, " ").trim();
  return t.length > max ? t.slice(0, max) + "…" : t;
}

const SAMPLE_VARS: Record<string, string> = {
  CONTRATANTE: "MARIA DA SILVA", CONTRATADO: "EMPRESA EXEMPLO LTDA",
  CPF_CONTRATANTE: "123.456.789-00", CNPJ_CONTRATADO: "12.345.678/0001-90",
  VALOR: "R$ 12.500,00", VALOR_EXTENSO: "doze mil e quinhentos reais",
  DATA: new Date().toLocaleDateString("pt-BR"),
  DATA_EXTENSO: new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }),
  DATA_INICIO: "01/08/2026", DATA_FIM: "31/07/2027",
  PRAZO: "12 (doze) meses", CIDADE_FORO: "Uberaba/MG",
  FORMA_PAGAMENTO: "Parcelado em 10x", DESCRICAO_SERVICOS: "serviços contábeis mensais",
  OBJETO: "prestação de serviços contábeis", FORO: "Uberaba/MG",
  PERCENTUAL_MULTA: "2% (dois por cento)", PRAZO_GARANTIA: "90 (noventa) dias",
};

/* ─── IA jurídica (assistente local) ─────────────────────────── */

type AcaoIA =
  | "melhorar" | "corrigir" | "simplificar" | "expandir" | "resumir"
  | "fundamentos" | "conflitos" | "comparar" | "sugerir" | "semelhante";

const ACOES_IA: { v: AcaoIA; label: string; icon: string; muda: boolean }[] = [
  { v: "melhorar",    label: "Melhorar redação",       icon: "✍️", muda: true },
  { v: "corrigir",    label: "Corrigir juridicamente", icon: "⚖️", muda: true },
  { v: "simplificar", label: "Simplificar linguagem",  icon: "💡", muda: true },
  { v: "expandir",    label: "Expandir texto",         icon: "➕", muda: true },
  { v: "resumir",     label: "Resumir",                icon: "✂️", muda: true },
  { v: "fundamentos", label: "Adicionar fundamentos legais", icon: "📚", muda: true },
  { v: "semelhante",  label: "Criar cláusula semelhante", icon: "🧬", muda: false },
  { v: "conflitos",   label: "Localizar conflitos",    icon: "🔎", muda: false },
  { v: "comparar",    label: "Comparar com outras versões", icon: "🕘", muda: false },
  { v: "sugerir",     label: "Sugerir melhorias",      icon: "🌟", muda: false },
];

function aplicarIATexto(acao: AcaoIA, texto: string): string {
  const t = texto.replace(/\s+/g, " ").trim();
  switch (acao) {
    case "melhorar": {
      let r = t.replace(/\s+([,.;:])/g, "$1").replace(/\s{2,}/g, " ");
      if (!/[.]$/.test(r)) r += ".";
      return r.charAt(0).toUpperCase() + r.slice(1);
    }
    case "corrigir":
      return t + (/parágrafo único/i.test(t) ? "" : "\nParágrafo único. O disposto nesta cláusula observará a legislação civil vigente e os princípios da boa-fé objetiva e da função social do contrato.");
    case "simplificar":
      return t
        .replace(/doravante denominad[oa]/gi, "chamado")
        .replace(/no que tange a/gi, "sobre")
        .replace(/outrossim/gi, "além disso")
        .replace(/destarte/gi, "assim")
        .replace(/em virtude de/gi, "por causa de")
        .replace(/\bfica pactuado que\b/gi, "as partes acordam que");
    case "expandir":
      return t + "\nAs partes declaram estar cientes e de pleno acordo com o disposto nesta cláusula, comprometendo-se a cumpri-la integralmente, respondendo, aquela que lhe der causa, por eventuais perdas e danos decorrentes de seu descumprimento.";
    case "resumir": {
      const primeira = t.split(/(?<=[.;])\s/)[0] || t;
      return primeira;
    }
    case "fundamentos":
      return t + "\nFundamenta-se esta cláusula nos termos do Código Civil (Lei nº 10.406/2002) e demais normas correlatas aplicáveis à espécie.";
    default:
      return texto;
  }
}

/* ─── Estilos base ───────────────────────────────────────────── */

const input: React.CSSProperties = {
  width: "100%", padding: "8px 11px", borderRadius: 8, border: "1px solid #e2e8f0",
  fontSize: "0.82rem", color: "#0f172a", background: "#fff", boxSizing: "border-box",
};
const btn: React.CSSProperties = {
  background: "#0f172a", color: "#fff", border: "none", borderRadius: 8,
  padding: "9px 16px", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
};
const btnGhost: React.CSSProperties = {
  background: "#fff", color: "#0f172a", border: "1px solid #e2e8f0",
  borderRadius: 8, padding: "8px 13px", fontSize: "0.79rem", fontWeight: 600, cursor: "pointer",
};
const btnMini: React.CSSProperties = {
  background: "#fff", color: "#334155", border: "1px solid #e2e8f0",
  borderRadius: 6, padding: "3px 8px", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer",
  lineHeight: 1.4,
};
const chip = (bg: string, color: string): React.CSSProperties => ({
  display: "inline-block", background: bg, color, borderRadius: 999,
  padding: "2px 9px", fontSize: "0.68rem", fontWeight: 700, whiteSpace: "nowrap",
});

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", color: "#334155", cursor: "pointer", padding: "3px 0" }}>
      <span
        onClick={() => onChange(!checked)}
        style={{
          width: 34, height: 20, borderRadius: 999, background: checked ? "#10b981" : "#cbd5e1",
          position: "relative", transition: "background 0.15s", flexShrink: 0,
        }}
      >
        <span style={{
          position: "absolute", top: 2, left: checked ? 16 : 2, width: 16, height: 16,
          borderRadius: "50%", background: "#fff", transition: "left 0.15s", boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
        }} />
      </span>
      {label}
    </label>
  );
}

/* ═══ COMPONENTE ══════════════════════════════════════════════ */

type PayloadDrag =
  | { kind: "lib"; clausulaId: string }
  | { kind: "item"; itemId: string }
  | { kind: "chapter"; capId: string };

export function ConstrutorModelo({
  modelo, clausulas, setClausulas, regras, setRegras, onSalvar, onFechar,
}: {
  modelo: ModeloContrato;
  clausulas: Clausula[];
  setClausulas: React.Dispatch<React.SetStateAction<Clausula[]>>;
  regras: Regra[];
  setRegras: React.Dispatch<React.SetStateAction<Regra[]>>;
  onSalvar: (m: ModeloContrato) => void;
  onFechar: () => void;
}) {
  /* estrutura inicial (migra de clausulasObrigatorias/opcionais se necessário) */
  const estruturaInicial = (): CapituloModelo[] => {
    if (modelo.estrutura?.capitulos?.length) return modelo.estrutura.capitulos;
    const mk = (ids: string[], status: StatusClausulaModelo): ItemClausulaModelo[] =>
      ids.map((cid) => {
        const cl = clausulas.find((c) => c.id === cid);
        return {
          id: uid(), clausulaId: cid,
          titulo: cl?.titulo ?? "Cláusula", categoria: cl?.categoria ?? "Geral",
          texto: cl?.texto ?? "", status,
          exibirNoIndice: true, permitirExclusao: true, permitirEdicao: true,
          fixa: false, podeRepetir: false, podeOcultar: true, oculta: false,
          dependeDe: [], autor: cl?.autor ?? "Sistema", versao: cl?.versao ?? 1,
          criadaEm: AGORA(), atualizadaEm: AGORA(),
        };
      });
    const itens = [...mk(modelo.clausulasObrigatorias, "obrigatoria"), ...mk(modelo.clausulasOpcionais, "opcional")];
    return [{ id: uid(), titulo: "Cláusulas Gerais", itens }];
  };

  const [capitulos, setCapitulos] = useState<CapituloModelo[]>(estruturaInicial);
  const [selId, setSelId] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [iaMenu, setIaMenu] = useState<{ itemId: string; x: number; y: number } | null>(null);
  const [showRegras, setShowRegras] = useState(false);
  const [showHist, setShowHist] = useState(false);
  const [aviso, setAviso] = useState<string>("");
  const [previewVisivel, setPreviewVisivel] = useState(true);

  /* histórico de versões da estrutura */
  type Snap = { id: string; ts: string; desc: string; caps: CapituloModelo[] };
  const [historico, setHistorico] = useState<Snap[]>([
    { id: uid(), ts: AGORA(), desc: "Estado inicial", caps: estruturaInicial() },
  ]);

  const snapshot = (desc: string, caps: CapituloModelo[]) =>
    setHistorico((h) => [...h.slice(-30), { id: uid(), ts: AGORA(), desc, caps: JSON.parse(JSON.stringify(caps)) }]);

  const commit = (caps: CapituloModelo[], desc: string) => {
    setCapitulos(caps);
    snapshot(desc, caps);
  };

  /* biblioteca — filtros */
  const [busca, setBusca] = useState("");
  const [fCat, setFCat] = useState("todas");
  const [fFav, setFFav] = useState(false);

  const categorias = useMemo(() => [...new Set(clausulas.map((c) => c.categoria))].sort(), [clausulas]);

  /* contagem de uso na estrutura */
  const usoPorClausula = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cap of capitulos) for (const it of cap.itens) if (it.clausulaId) map[it.clausulaId] = (map[it.clausulaId] ?? 0) + 1;
    return map;
  }, [capitulos]);

  const bibliotecaFiltrada = clausulas.filter((c) => {
    if (fCat !== "todas" && c.categoria !== fCat) return false;
    if (fFav && !c.favorita) return false;
    if (!busca) return true;
    const q = busca.toLowerCase();
    return c.titulo.toLowerCase().includes(q) || c.texto.toLowerCase().includes(q) || c.tags.some((t) => t.toLowerCase().includes(q));
  });

  /* flatten com numeração automática */
  const flat = useMemo(() => {
    const arr: { capId: string; item: ItemClausulaModelo; numero: number | null }[] = [];
    let n = 0;
    for (const cap of capitulos) {
      for (const it of cap.itens) {
        const conta = !it.oculta && it.status !== "desativada";
        arr.push({ capId: cap.id, item: it, numero: conta ? n++ : null });
      }
    }
    return arr;
  }, [capitulos]);

  const itemById = (id: string) => flat.find((f) => f.item.id === id);

  /* estatísticas */
  const stats = useMemo(() => {
    const todos = capitulos.flatMap((c) => c.itens);
    const porStatus = (s: StatusClausulaModelo) => todos.filter((i) => i.status === s).length;
    const cats = new Set(todos.map((i) => i.categoria));
    const maisUsada = Object.entries(usoPorClausula).sort((a, b) => b[1] - a[1])[0];
    const maisUsadaNome = maisUsada ? clausulas.find((c) => c.id === maisUsada[0])?.titulo : null;
    return {
      total: todos.length,
      obrigatoria: porStatus("obrigatoria"), opcional: porStatus("opcional"),
      condicional: porStatus("condicional"), ia: porStatus("ia"), desativada: porStatus("desativada"),
      categorias: cats.size, favoritas: clausulas.filter((c) => c.favorita).length,
      maisUsada: maisUsadaNome, maisUsadaQtd: maisUsada?.[1] ?? 0,
    };
  }, [capitulos, usoPorClausula, clausulas]);

  /* ── operações imutáveis ── */
  const novoItemDeClausula = (cl: Clausula, status: StatusClausulaModelo = "obrigatoria"): ItemClausulaModelo => ({
    id: uid(), clausulaId: cl.id, titulo: cl.titulo, categoria: cl.categoria, texto: cl.texto, status,
    exibirNoIndice: true, permitirExclusao: true, permitirEdicao: true,
    fixa: false, podeRepetir: false, podeOcultar: true, oculta: false,
    dependeDe: [], autor: cl.autor || "Administrador", versao: cl.versao || 1,
    criadaEm: AGORA(), atualizadaEm: AGORA(),
  });

  const insertBefore = (itens: ItemClausulaModelo[], beforeId: string | null, novo: ItemClausulaModelo) => {
    if (!beforeId) return [...itens, novo];
    const i = itens.findIndex((x) => x.id === beforeId);
    return i < 0 ? [...itens, novo] : [...itens.slice(0, i), novo, ...itens.slice(i)];
  };

  const dropPayload = (targetCapId: string, beforeId: string | null, payload: PayloadDrag) => {
    if (payload.kind === "lib") {
      const cl = clausulas.find((c) => c.id === payload.clausulaId);
      if (!cl) return;
      const jaUsada = !!usoPorClausula[cl.id];
      const novo = novoItemDeClausula(cl);
      const caps = capitulos.map((cap) => cap.id === targetCapId ? { ...cap, itens: insertBefore(cap.itens, beforeId, novo) } : cap);
      commit(caps, `Adicionada "${cl.titulo}"`);
      if (jaUsada) setAviso(`A cláusula "${cl.titulo}" já estava no contrato — foi adicionada uma cópia.`);
    } else if (payload.kind === "item") {
      let capturado: ItemClausulaModelo | undefined;
      const semItem = capitulos.map((cap) => ({
        ...cap,
        itens: cap.itens.filter((it) => {
          if (it.id === payload.itemId) { capturado = it; return false; }
          return true;
        }),
      }));
      const mov = capturado;
      if (!mov) return;
      if (mov.fixa) { setAviso("Cláusula fixa não pode ser movida."); return; }
      const caps = semItem.map((cap) => cap.id === targetCapId ? { ...cap, itens: insertBefore(cap.itens, beforeId, mov) } : cap);
      commit(caps, `Cláusula reordenada`);
    }
  };

  const dropChapter = (targetCapId: string, payload: PayloadDrag) => {
    if (payload.kind !== "chapter" || payload.capId === targetCapId) return;
    const from = capitulos.findIndex((c) => c.id === payload.capId);
    const to = capitulos.findIndex((c) => c.id === targetCapId);
    if (from < 0 || to < 0) return;
    const caps = [...capitulos];
    const [mov] = caps.splice(from, 1);
    caps.splice(to, 0, mov);
    commit(caps, "Capítulo reordenado");
  };

  const updateItem = (itemId: string, patch: Partial<ItemClausulaModelo>, desc = "Cláusula editada") => {
    const caps = capitulos.map((cap) => ({
      ...cap,
      itens: cap.itens.map((it) => it.id === itemId ? { ...it, ...patch, atualizadaEm: AGORA() } : it),
    }));
    commit(caps, desc);
  };

  const removerItem = (itemId: string) => {
    const alvo = itemById(itemId)?.item;
    if (!alvo) return;
    if (!alvo.permitirExclusao) { setAviso("Esta cláusula está protegida contra exclusão."); return; }
    // dependências: alguém depende deste?
    const dependentes = capitulos.flatMap((c) => c.itens).filter((i) => i.dependeDe.includes(itemId));
    if (dependentes.length && !window.confirm(`${dependentes.length} cláusula(s) dependem de "${alvo.titulo}". Remover mesmo assim?`)) return;
    const caps = capitulos.map((cap) => ({
      ...cap,
      itens: cap.itens.filter((it) => it.id !== itemId).map((it) => ({ ...it, dependeDe: it.dependeDe.filter((d) => d !== itemId) })),
    }));
    commit(caps, `Removida "${alvo.titulo}"`);
    if (selId === itemId) setSelId(null);
  };

  const duplicarItem = (itemId: string) => {
    const f = itemById(itemId);
    if (!f) return;
    const copia: ItemClausulaModelo = { ...f.item, id: uid(), titulo: f.item.titulo + " (cópia)", dependeDe: [], criadaEm: AGORA(), atualizadaEm: AGORA() };
    const caps = capitulos.map((cap) => cap.id === f.capId
      ? { ...cap, itens: insertBefore(cap.itens, null, copia) }
      : cap);
    // insere logo após o original
    const capIdx = caps.findIndex((c) => c.id === f.capId);
    const arr = caps[capIdx].itens.filter((x) => x.id !== copia.id);
    const oi = arr.findIndex((x) => x.id === itemId);
    arr.splice(oi + 1, 0, copia);
    caps[capIdx] = { ...caps[capIdx], itens: arr };
    commit(caps, `Duplicada "${f.item.titulo}"`);
  };

  const addCapitulo = () => {
    const titulo = window.prompt("Nome do capítulo:", `Capítulo ${capitulos.length + 1}`);
    if (!titulo) return;
    commit([...capitulos, { id: uid(), titulo, itens: [] }], `Capítulo "${titulo}" criado`);
  };

  const renomearCapitulo = (capId: string) => {
    const cap = capitulos.find((c) => c.id === capId);
    const titulo = window.prompt("Nome do capítulo:", cap?.titulo ?? "");
    if (!titulo) return;
    commit(capitulos.map((c) => c.id === capId ? { ...c, titulo } : c), "Capítulo renomeado");
  };

  const removerCapitulo = (capId: string) => {
    const cap = capitulos.find((c) => c.id === capId);
    if (!cap) return;
    if (cap.itens.length && !window.confirm(`O capítulo "${cap.titulo}" tem ${cap.itens.length} cláusula(s). Excluir capítulo e suas cláusulas?`)) return;
    if (capitulos.length === 1) { setAviso("É necessário ao menos um capítulo."); return; }
    commit(capitulos.filter((c) => c.id !== capId), `Capítulo "${cap.titulo}" removido`);
  };

  /* ── ações IA ── */
  const executarIA = (itemId: string, acao: AcaoIA) => {
    setIaMenu(null);
    const f = itemById(itemId);
    if (!f) return;
    const info = ACOES_IA.find((a) => a.v === acao)!;
    if (info.muda) {
      const novo = aplicarIATexto(acao, f.item.texto);
      updateItem(itemId, { texto: novo, status: "ia", versao: f.item.versao + 1 }, `IA: ${info.label} em "${f.item.titulo}"`);
      setAviso(`✨ IA aplicou "${info.label}" na cláusula "${f.item.titulo}".`);
      return;
    }
    if (acao === "semelhante") {
      const copia: ItemClausulaModelo = {
        ...f.item, id: uid(), titulo: f.item.titulo + " (variação)",
        texto: aplicarIATexto("melhorar", f.item.texto), status: "ia", dependeDe: [],
        criadaEm: AGORA(), atualizadaEm: AGORA(),
      };
      const caps = capitulos.map((cap) => cap.id === f.capId ? { ...cap, itens: insertBefore(cap.itens, null, copia) } : cap);
      commit(caps, `IA criou variação de "${f.item.titulo}"`);
      setAviso(`✨ IA criou uma cláusula semelhante a "${f.item.titulo}".`);
      return;
    }
    if (acao === "conflitos") {
      const titulos = capitulos.flatMap((c) => c.itens).map((i) => i.titulo.toLowerCase());
      const dups = titulos.filter((t, i) => titulos.indexOf(t) !== i);
      setAviso(dups.length ? `🔎 Possíveis conflitos: cláusulas repetidas — ${[...new Set(dups)].join(", ")}.` : "🔎 Nenhum conflito evidente encontrado entre as cláusulas.");
      return;
    }
    if (acao === "comparar") {
      setAviso(f.item.versao > 1 ? `🕘 "${f.item.titulo}" está na versão ${f.item.versao}. Use o Histórico para restaurar versões anteriores.` : "🕘 Esta cláusula ainda está na versão 1 — sem versões anteriores para comparar.");
      return;
    }
    if (acao === "sugerir") {
      const vars = extrairVariaveis(f.item.texto);
      setAviso(`🌟 Sugestões para "${f.item.titulo}": ${vars.length ? `confirme os valores das variáveis (${vars.join(", ")})` : "considere adicionar variáveis dinâmicas ({{VALOR}}, {{PRAZO}})"}; verifique fundamentação legal e cláusula de foro.`);
      return;
    }
  };

  /* ── ações em massa ── */
  const toggleSel = (itemId: string) => {
    setSelecionados((prev) => {
      const s = new Set(prev);
      s.has(itemId) ? s.delete(itemId) : s.add(itemId);
      return s;
    });
  };
  const limparSel = () => setSelecionados(new Set());

  const massaStatus = (status: StatusClausulaModelo) => {
    const caps = capitulos.map((cap) => ({ ...cap, itens: cap.itens.map((it) => selecionados.has(it.id) ? { ...it, status, atualizadaEm: AGORA() } : it) }));
    commit(caps, `Ações em massa: status → ${STATUS_META[status].label}`);
    limparSel();
  };
  const massaExcluir = () => {
    if (!window.confirm(`Excluir ${selecionados.size} cláusula(s) selecionada(s)?`)) return;
    const caps = capitulos.map((cap) => ({ ...cap, itens: cap.itens.filter((it) => !selecionados.has(it.id) || !it.permitirExclusao) }));
    commit(caps, `Ações em massa: excluídas ${selecionados.size}`);
    limparSel();
  };
  const massaDuplicar = () => {
    const caps = capitulos.map((cap) => {
      const arr: ItemClausulaModelo[] = [];
      for (const it of cap.itens) {
        arr.push(it);
        if (selecionados.has(it.id)) arr.push({ ...it, id: uid(), titulo: it.titulo + " (cópia)", dependeDe: [], criadaEm: AGORA(), atualizadaEm: AGORA() });
      }
      return { ...cap, itens: arr };
    });
    commit(caps, `Ações em massa: duplicadas ${selecionados.size}`);
    limparSel();
  };

  /* ── documento (preview + export) ── */
  const gerarHTML = useMemo(() => {
    const partes: string[] = [`<div class="contrato-doc"><h1>${(modelo.tituloDocumento || "Contrato").toUpperCase()}</h1>`];
    if (modelo.preambulo) partes.push(`<p>${substituirVariaveis(modelo.preambulo, SAMPLE_VARS)}</p>`);
    let n = 0;
    capitulos.forEach((cap, ci) => {
      const visiveis = cap.itens.filter((i) => !i.oculta && i.status !== "desativada");
      if (!visiveis.length && !cap.titulo) return;
      partes.push(`<h2 style="text-align:center;margin-top:22pt;">CAPÍTULO ${toRoman(ci + 1)} — ${cap.titulo.toUpperCase()}</h2>`);
      for (const it of visiveis) {
        const texto = substituirVariaveis(it.texto, SAMPLE_VARS).replace(/\n/g, "</p><p>");
        partes.push(`<h3>CLÁUSULA ${ordinalClausula(n)} — ${it.titulo.toUpperCase()}</h3><p>${texto}</p>`);
        n++;
      }
    });
    if (modelo.fechamento) partes.push(`<p>${substituirVariaveis(modelo.fechamento, SAMPLE_VARS)}</p>`);
    partes.push("</div>");
    return partes.join("\n");
  }, [capitulos, modelo]);

  /* ── salvar/fechar ── */
  const salvar = (fechar: boolean) => {
    const todos = capitulos.flatMap((c) => c.itens);
    const obrig = [...new Set(todos.filter((i) => i.status === "obrigatoria" && i.clausulaId).map((i) => i.clausulaId!))];
    const opc = [...new Set(todos.filter((i) => (i.status === "opcional" || i.status === "condicional") && i.clausulaId).map((i) => i.clausulaId!))];
    const estrutura: EstruturaModelo = { capitulos };
    onSalvar({ ...modelo, estrutura, clausulasObrigatorias: obrig, clausulasOpcionais: opc });
    setAviso("✅ Estrutura salva no modelo.");
    if (fechar) onFechar();
  };

  const selItem = selId ? itemById(selId)?.item ?? null : null;
  const selCap = selId ? itemById(selId)?.capId ?? null : null;
  const todosItens = capitulos.flatMap((c) => c.itens);

  /* ── UI: KPI ── */
  const KPI = ({ label, valor, cor }: { label: string; valor: string | number; cor?: string }) => (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", minWidth: 92 }}>
      <div style={{ fontSize: "0.66rem", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
      <div style={{ fontSize: "1.15rem", fontWeight: 800, color: cor ?? "#0f172a" }}>{valor}</div>
    </div>
  );

  return (
    <div style={{ position: "fixed", inset: 0, background: "#f1f5f9", zIndex: 300, display: "flex", flexDirection: "column" }}>
      {/* ═══ Topbar ═══ */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "12px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "1.4rem" }}>{modelo.icone}</span>
          <div style={{ minWidth: 0 }}>
            <strong style={{ fontSize: "1rem", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Construtor Visual — {modelo.nome}
            </strong>
            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>Monte o contrato arrastando cláusulas · numeração automática · preview em tempo real</span>
          </div>
        </div>
        <button style={btnGhost} onClick={() => setShowRegras(true)}>⚙️ Regras</button>
        <button style={btnGhost} onClick={() => setShowHist(true)}>🕘 Histórico</button>
        <button style={btnGhost} onClick={() => setPreviewVisivel((v) => !v)}>{previewVisivel ? "🙈 Ocultar preview" : "👁️ Mostrar preview"}</button>
        <div style={{ display: "flex", gap: 6 }}>
          <button style={btnMini} onClick={() => abrirImpressao(gerarHTML, modelo.tituloDocumento)}>🖨️ PDF</button>
          <button style={btnMini} onClick={() => exportarDOCX(gerarHTML, modelo.tituloDocumento)}>📄 DOCX</button>
          <button style={btnMini} onClick={() => exportarHTML(gerarHTML, modelo.tituloDocumento)}>🌐 HTML</button>
        </div>
        <button style={btnGhost} onClick={() => salvar(false)}>💾 Salvar</button>
        <button style={btn} onClick={() => salvar(true)}>Salvar e fechar</button>
        <button style={{ ...btnGhost, color: "#b91c1c" }} onClick={onFechar}>✕</button>
      </div>

      {/* ═══ Estatísticas ═══ */}
      <div style={{ display: "flex", gap: 8, padding: "10px 20px", background: "#fff", borderBottom: "1px solid #e2e8f0", overflowX: "auto" }}>
        <KPI label="Cláusulas" valor={stats.total} />
        <KPI label="🟢 Obrig." valor={stats.obrigatoria} cor="#059669" />
        <KPI label="🟡 Opc." valor={stats.opcional} cor="#b45309" />
        <KPI label="🔵 Cond." valor={stats.condicional} cor="#1e40af" />
        <KPI label="🟣 IA" valor={stats.ia} cor="#7c3aed" />
        <KPI label="🔴 Desat." valor={stats.desativada} cor="#b91c1c" />
        <KPI label="Categorias" valor={stats.categorias} />
        <KPI label="⭐ Favoritas" valor={stats.favoritas} />
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, padding: "8px 12px", flex: 1, minWidth: 180 }}>
          <div style={{ fontSize: "0.66rem", color: "#64748b", textTransform: "uppercase" }}>Mais utilizada</div>
          <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {stats.maisUsada ? `${stats.maisUsada} (${stats.maisUsadaQtd}×)` : "—"}
          </div>
        </div>
      </div>

      {aviso && (
        <div style={{ padding: "8px 20px", background: "#eff6ff", borderBottom: "1px solid #bfdbfe", color: "#1e40af", fontSize: "0.8rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>{aviso}</span>
          <button style={{ ...btnMini, border: "none", background: "transparent" }} onClick={() => setAviso("")}>✕</button>
        </div>
      )}

      {/* barra de ações em massa */}
      {selecionados.size > 0 && (
        <div style={{ padding: "8px 20px", background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <strong style={{ fontSize: "0.82rem" }}>{selecionados.size} selecionada(s):</strong>
          <button style={btnMini} onClick={massaDuplicar}>⧉ Duplicar</button>
          <button style={btnMini} onClick={() => massaStatus("obrigatoria")}>🟢 Obrigatória</button>
          <button style={btnMini} onClick={() => massaStatus("opcional")}>🟡 Opcional</button>
          <button style={btnMini} onClick={() => massaStatus("condicional")}>🔵 Condicional</button>
          <button style={btnMini} onClick={() => massaStatus("desativada")}>🔴 Desativar</button>
          <button style={{ ...btnMini, color: "#b91c1c" }} onClick={massaExcluir}>🗑️ Excluir</button>
          <button style={{ ...btnMini, marginLeft: "auto" }} onClick={limparSel}>Limpar seleção</button>
        </div>
      )}

      {/* ═══ 3 colunas ═══ */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: previewVisivel ? "300px minmax(0,1fr) 360px" : "300px minmax(0,1fr)", gap: 12, padding: 12, overflow: "hidden" }}>

        {/* ── COLUNA 1: BIBLIOTECA ── */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0" }}>
            <strong style={{ fontSize: "0.88rem" }}>📚 Biblioteca de Cláusulas</strong>
            <input style={{ ...input, marginTop: 8 }} placeholder="🔍 Pesquisar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <select style={{ ...input, flex: 1 }} value={fCat} onChange={(e) => setFCat(e.target.value)}>
                <option value="todas">Todas categorias</option>
                {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                style={{ ...btnMini, background: fFav ? "#fef3c7" : "#fff", borderColor: fFav ? "#fcd34d" : "#e2e8f0" }}
                onClick={() => setFFav((v) => !v)}
                title="Somente favoritas"
              >
                ⭐
              </button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {bibliotecaFiltrada.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 30, fontSize: "0.82rem" }}>Nenhuma cláusula</div>}
            {bibliotecaFiltrada.map((c) => (
              <div
                key={c.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("application/json", JSON.stringify({ kind: "lib", clausulaId: c.id } as PayloadDrag))}
                style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, cursor: "grab", background: "#fff", boxShadow: "0 1px 2px rgba(0,0,0,0.03)" }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontSize: "1.05rem" }}>{iconeCategoria(c.categoria)}</span>
                  <strong style={{ fontSize: "0.8rem", flex: 1, lineHeight: 1.2 }}>{c.favorita ? "⭐ " : ""}{c.titulo}</strong>
                  <span style={chip("#f1f5f9", "#64748b")}>v{c.versao}</span>
                </div>
                <div style={{ fontSize: "0.7rem", color: "#94a3b8", margin: "4px 0" }}>{c.categoria} · usada {usoPorClausula[c.id] ?? 0}×</div>
                <p style={{ fontSize: "0.72rem", color: "#64748b", margin: "0 0 6px", lineHeight: 1.4 }}>{resumo(c.descricao || c.texto, 80)}</p>
                {c.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                    {c.tags.slice(0, 3).map((t) => <span key={t} style={chip("#f8fafc", "#94a3b8")}>#{t}</span>)}
                  </div>
                )}
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                  <button style={btnMini} title="Adicionar ao 1º capítulo" onClick={() => dropPayload(capitulos[0]?.id, null, { kind: "lib", clausulaId: c.id })}>➕</button>
                  <button style={btnMini} title="Favoritar" onClick={() => setClausulas((prev) => prev.map((x) => x.id === c.id ? { ...x, favorita: !x.favorita } : x))}>{c.favorita ? "★" : "☆"}</button>
                  <button style={btnMini} title="Duplicar na biblioteca" onClick={() => setClausulas((prev) => [...prev, { ...c, id: uid(), titulo: c.titulo + " (cópia)", versao: 1, criadaEm: AGORA() }])}>⧉</button>
                  <span style={{ fontSize: "0.64rem", color: "#cbd5e1", marginLeft: "auto" }}>arraste →</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COLUNA 2: CONTRATO ── */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.88rem" }}>📃 Contrato — {stats.total} cláusula(s) · {capitulos.length} capítulo(s)</strong>
            <button style={btnGhost} onClick={addCapitulo}>+ Capítulo</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 14 }}>
            {capitulos.map((cap, ci) => (
              <div
                key={cap.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const raw = e.dataTransfer.getData("application/json");
                  if (!raw) return;
                  const payload = JSON.parse(raw) as PayloadDrag;
                  if (payload.kind === "chapter") dropChapter(cap.id, payload);
                  else dropPayload(cap.id, null, payload);
                }}
                style={{ border: "1px dashed #cbd5e1", borderRadius: 10, padding: 10, background: "#fafcfb" }}
              >
                {/* cabeçalho do capítulo */}
                <div
                  draggable
                  onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("application/json", JSON.stringify({ kind: "chapter", capId: cap.id } as PayloadDrag)); }}
                  style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "grab" }}
                >
                  <span style={{ color: "#94a3b8" }}>⠿</span>
                  <strong style={{ fontSize: "0.82rem", color: "#0f172a", flex: 1 }}>CAPÍTULO {toRoman(ci + 1)} — {cap.titulo}</strong>
                  <button style={btnMini} onClick={() => renomearCapitulo(cap.id)}>✏️</button>
                  <button style={{ ...btnMini, color: "#b91c1c" }} onClick={() => removerCapitulo(cap.id)}>🗑️</button>
                </div>

                {cap.itens.length === 0 && (
                  <div style={{ textAlign: "center", color: "#94a3b8", padding: "18px 10px", fontSize: "0.78rem", border: "1px dashed #e2e8f0", borderRadius: 8 }}>
                    Arraste cláusulas da biblioteca para cá
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {cap.itens.map((it) => {
                    const num = itemById(it.id)?.numero ?? null;
                    const sm = STATUS_META[it.status];
                    const sel = selecionados.has(it.id);
                    const depFaltando = it.dependeDe.filter((d) => !todosItens.some((x) => x.id === d));
                    return (
                      <div
                        key={it.id}
                        draggable
                        onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData("application/json", JSON.stringify({ kind: "item", itemId: it.id } as PayloadDrag)); }}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onDrop={(e) => {
                          e.preventDefault(); e.stopPropagation();
                          const raw = e.dataTransfer.getData("application/json");
                          if (!raw) return;
                          const payload = JSON.parse(raw) as PayloadDrag;
                          if (payload.kind !== "chapter") dropPayload(cap.id, it.id, payload);
                        }}
                        onClick={() => setSelId(it.id)}
                        style={{
                          border: `1px solid ${sel ? "#0f172a" : selId === it.id ? sm.color : "#e2e8f0"}`,
                          borderLeft: `4px solid ${sm.color}`,
                          borderRadius: 9, padding: "9px 11px", background: it.oculta ? "#f8fafc" : "#fff",
                          opacity: it.status === "desativada" ? 0.55 : 1, cursor: "pointer",
                          boxShadow: selId === it.id ? `0 0 0 2px ${sm.color}22` : "none",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <input type="checkbox" checked={sel} onClick={(e) => e.stopPropagation()} onChange={() => toggleSel(it.id)} />
                          <span style={{ color: "#cbd5e1", cursor: "grab" }}>⠿</span>
                          <span style={{ fontSize: "0.72rem", fontWeight: 800, color: sm.color, whiteSpace: "nowrap" }}>
                            {num !== null ? `CLÁUSULA ${ordinalClausula(num)}` : (it.oculta ? "OCULTA" : "—")}
                          </span>
                          <strong style={{ fontSize: "0.82rem", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {it.fixa ? "📌 " : ""}{it.titulo}
                          </strong>
                          <span title={sm.label} style={{ fontSize: "0.9rem" }}>{sm.emoji}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, margin: "5px 0", flexWrap: "wrap" }}>
                          <span style={chip("#f1f5f9", "#64748b")}>{iconeCategoria(it.categoria)} {it.categoria}</span>
                          <span style={chip(sm.bg, sm.color)}>{sm.label}</span>
                          {it.dependeDe.length > 0 && <span style={chip("#fef3c7", "#92400e")}>🔗 {it.dependeDe.length} dep.</span>}
                          {depFaltando.length > 0 && <span style={chip("#fef2f2", "#b91c1c")}>⚠️ dependência ausente</span>}
                        </div>
                        <p style={{ fontSize: "0.74rem", color: "#64748b", margin: "0 0 6px", lineHeight: 1.4 }}>{resumo(it.texto)}</p>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }} onClick={(e) => e.stopPropagation()}>
                          <button style={btnMini} title="Editar" onClick={() => setSelId(it.id)}>✏️ Editar</button>
                          <button style={btnMini} title="Visualizar" onClick={() => setSelId(it.id)}>👁️</button>
                          <button style={{ ...btnMini, background: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" }} title="IA jurídica" onClick={(e) => setIaMenu({ itemId: it.id, x: e.clientX, y: e.clientY })}>✨ IA</button>
                          <button style={btnMini} title="Duplicar" onClick={() => duplicarItem(it.id)}>⧉</button>
                          <button style={btnMini} title={it.oculta ? "Mostrar" : "Ocultar"} onClick={() => it.podeOcultar ? updateItem(it.id, { oculta: !it.oculta }) : setAviso("Esta cláusula não pode ser ocultada.")}>{it.oculta ? "🙈" : "👁️‍🗨️"}</button>
                          <button style={btnMini} title={it.fixa ? "Desafixar" : "Fixar"} onClick={() => updateItem(it.id, { fixa: !it.fixa })}>{it.fixa ? "📌" : "📍"}</button>
                          <button style={{ ...btnMini, color: "#b91c1c" }} title="Excluir" onClick={() => removerItem(it.id)}>🗑️</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── COLUNA 3: PREVIEW ── */}
        {previewVisivel && (
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "0.88rem" }}>👁️ Preview em tempo real</strong>
              <span style={{ fontSize: "0.68rem", color: "#94a3b8" }}>valores de exemplo</span>
            </div>
            <div style={{ flex: 1, overflow: "auto", padding: 16, background: "#eef2f5" }}>
              <div style={{ background: "#fff", padding: "34px 38px", borderRadius: 4, boxShadow: "0 2px 12px rgba(0,0,0,0.08)", fontSize: "0.72rem" }}>
                <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
                <div dangerouslySetInnerHTML={{ __html: gerarHTML }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ═══ PAINEL LATERAL (config da cláusula) ═══ */}
      {selItem && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "min(420px, 94vw)", background: "#fff", boxShadow: "-8px 0 32px rgba(0,0,0,0.18)", zIndex: 320, display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong style={{ fontSize: "0.92rem" }}>{STATUS_META[selItem.status].emoji} Detalhes da cláusula</strong>
            <button style={btnMini} onClick={() => setSelId(null)}>✕</button>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: 18, display: "flex", flexDirection: "column", gap: 14 }}>
            <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569" }}>
              Título
              <input style={{ ...input, marginTop: 4 }} value={selItem.titulo} onChange={(e) => updateItem(selItem.id, { titulo: e.target.value })} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569" }}>
                Categoria
                <input style={{ ...input, marginTop: 4 }} value={selItem.categoria} onChange={(e) => updateItem(selItem.id, { categoria: e.target.value })} />
              </label>
              <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569" }}>
                Status
                <select style={{ ...input, marginTop: 4 }} value={selItem.status} onChange={(e) => updateItem(selItem.id, { status: e.target.value as StatusClausulaModelo })}>
                  {STATUS_ORDEM.map((s) => <option key={s} value={s}>{STATUS_META[s].emoji} {STATUS_META[s].label}</option>)}
                </select>
              </label>
            </div>
            <label style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569" }}>
              Texto {selItem.permitirEdicao ? "" : "(protegido)"}
              <textarea
                style={{ ...input, marginTop: 4, minHeight: 150, lineHeight: 1.6, fontFamily: "inherit" }}
                value={selItem.texto}
                disabled={!selItem.permitirEdicao}
                onChange={(e) => updateItem(selItem.id, { texto: e.target.value })}
              />
            </label>

            {/* variáveis */}
            <div>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Variáveis utilizadas</div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {extrairVariaveis(selItem.texto).length === 0
                  ? <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Nenhuma variável</span>
                  : extrairVariaveis(selItem.texto).map((v) => <span key={v} style={chip("#eff6ff", "#1e40af")}>{`{{${v}}}`}</span>)}
              </div>
            </div>

            {/* configurações */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Configurações</div>
              <Toggle label="Exibir no índice" checked={selItem.exibirNoIndice} onChange={(v) => updateItem(selItem.id, { exibirNoIndice: v })} />
              <Toggle label="Permitir edição no contrato" checked={selItem.permitirEdicao} onChange={(v) => updateItem(selItem.id, { permitirEdicao: v })} />
              <Toggle label="Permitir exclusão" checked={selItem.permitirExclusao} onChange={(v) => updateItem(selItem.id, { permitirExclusao: v })} />
              <Toggle label="Fixa (não reordenável)" checked={selItem.fixa} onChange={(v) => updateItem(selItem.id, { fixa: v })} />
              <Toggle label="Pode repetir" checked={selItem.podeRepetir} onChange={(v) => updateItem(selItem.id, { podeRepetir: v })} />
              <Toggle label="Pode ser ocultada" checked={selItem.podeOcultar} onChange={(v) => updateItem(selItem.id, { podeOcultar: v })} />
              <Toggle label="Ocultada" checked={selItem.oculta} onChange={(v) => updateItem(selItem.id, { oculta: v })} />
            </div>

            {/* dependências */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12 }}>
              <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#475569", marginBottom: 6 }}>Depende de</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 140, overflow: "auto" }}>
                {todosItens.filter((x) => x.id !== selItem.id).length === 0 && <span style={{ fontSize: "0.74rem", color: "#94a3b8" }}>Nenhuma outra cláusula</span>}
                {todosItens.filter((x) => x.id !== selItem.id).map((x) => (
                  <label key={x.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.76rem", color: "#334155" }}>
                    <input
                      type="checkbox"
                      checked={selItem.dependeDe.includes(x.id)}
                      onChange={(e) => {
                        const dep = e.target.checked ? [...selItem.dependeDe, x.id] : selItem.dependeDe.filter((d) => d !== x.id);
                        updateItem(selItem.id, { dependeDe: dep });
                      }}
                    />
                    {x.titulo}
                  </label>
                ))}
              </div>
            </div>

            {/* metadados */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, fontSize: "0.72rem", color: "#64748b", display: "grid", gap: 3 }}>
              <div>Nº no documento: <strong>{itemById(selItem.id)?.numero !== null && itemById(selItem.id)?.numero !== undefined ? `CLÁUSULA ${ordinalClausula(itemById(selItem.id)!.numero!)}` : "não numerada"}</strong></div>
              <div>Capítulo: <strong>{capitulos.find((c) => c.id === selCap)?.titulo ?? "—"}</strong></div>
              <div>Autor: <strong>{selItem.autor}</strong> · Versão: <strong>{selItem.versao}</strong></div>
              <div>Criada: {new Date(selItem.criadaEm).toLocaleString("pt-BR")}</div>
              <div>Atualizada: {new Date(selItem.atualizadaEm).toLocaleString("pt-BR")}</div>
            </div>

            <div style={{ display: "flex", gap: 6 }}>
              <button style={{ ...btnGhost, background: "#f5f3ff", borderColor: "#ddd6fe", color: "#7c3aed" }} onClick={(e) => setIaMenu({ itemId: selItem.id, x: (e.clientX || 400) - 200, y: e.clientY || 300 })}>✨ IA jurídica</button>
              <button style={{ ...btnGhost, color: "#b91c1c" }} onClick={() => removerItem(selItem.id)}>🗑️ Excluir</button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MENU IA ═══ */}
      {iaMenu && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 340 }} onClick={() => setIaMenu(null)} />
          <div style={{
            position: "fixed", left: Math.min(iaMenu.x, (typeof window !== "undefined" ? window.innerWidth : 1000) - 250),
            top: Math.min(iaMenu.y, (typeof window !== "undefined" ? window.innerHeight : 700) - 380),
            zIndex: 341, background: "#fff", borderRadius: 12, boxShadow: "0 12px 40px rgba(0,0,0,0.22)",
            border: "1px solid #e2e8f0", width: 240, overflow: "hidden",
          }}>
            <div style={{ padding: "10px 14px", background: "linear-gradient(135deg,#7c3aed,#a855f7)", color: "#fff", fontWeight: 700, fontSize: "0.82rem" }}>✨ IA Jurídica</div>
            <div style={{ maxHeight: 320, overflow: "auto" }}>
              {ACOES_IA.map((a) => (
                <button
                  key={a.v}
                  onClick={() => executarIA(iaMenu.itemId, a.v)}
                  style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", background: "#fff", border: "none", borderBottom: "1px solid #f1f5f9", padding: "9px 14px", fontSize: "0.8rem", color: "#334155", cursor: "pointer", textAlign: "left" }}
                >
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ═══ MODAL REGRAS ═══ */}
      {showRegras && (
        <PainelRegras
          regras={regras}
          setRegras={setRegras}
          clausulas={clausulas}
          onClose={() => setShowRegras(false)}
        />
      )}

      {/* ═══ MODAL HISTÓRICO ═══ */}
      {showHist && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 330, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setShowHist(false)}>
          <div style={{ background: "#fff", borderRadius: 12, width: "min(560px,96vw)", maxHeight: "84vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong>🕘 Histórico de versões ({historico.length})</strong>
              <button style={btnMini} onClick={() => setShowHist(false)}>✕</button>
            </div>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              {[...historico].reverse().map((h, i) => (
                <div key={h.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <strong style={{ fontSize: "0.82rem" }}>{h.desc}</strong>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{new Date(h.ts).toLocaleString("pt-BR")} · {h.caps.flatMap((c) => c.itens).length} cláusulas</div>
                  </div>
                  {i !== 0 && (
                    <button style={btnMini} onClick={() => { setCapitulos(JSON.parse(JSON.stringify(h.caps))); setShowHist(false); setAviso("↩️ Versão restaurada."); }}>↩️ Restaurar</button>
                  )}
                  {i === 0 && <span style={chip("#ecfdf5", "#059669")}>atual</span>}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Painel de Regras (motor sem programação) ───────────────── */

const OPERADORES: { v: OperadorRegra; label: string }[] = [
  { v: "=", label: "igual a" }, { v: "!=", label: "diferente de" },
  { v: ">", label: "maior que" }, { v: ">=", label: "maior ou igual a" },
  { v: "<", label: "menor que" }, { v: "<=", label: "menor ou igual a" },
  { v: "contem", label: "contém" },
];

function PainelRegras({
  regras, setRegras, clausulas, onClose,
}: {
  regras: Regra[];
  setRegras: React.Dispatch<React.SetStateAction<Regra[]>>;
  clausulas: Clausula[];
  onClose: () => void;
}) {
  const nova = (): Regra => ({ id: uid(), nome: "", campo: "TIPO_CONTRATO", operador: "=", valor: "", clausulaId: clausulas[0]?.id ?? "", ativa: true });
  const [edit, setEdit] = useState<Regra | null>(null);

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.5)", zIndex: 330, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={onClose}>
      <div style={{ background: "#fff", borderRadius: 12, width: "min(640px,96vw)", maxHeight: "86vh", overflow: "auto" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: "14px 18px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong>⚙️ Motor de Regras</strong>
          <button style={btnMini} onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ background: "#f8fafc", borderRadius: 8, padding: 12, fontSize: "0.78rem", color: "#64748b", lineHeight: 1.5 }}>
            Crie regras <strong>SE campo [condição] valor ENTÃO adicionar cláusula</strong>. Aplicadas automaticamente ao gerar um contrato deste modelo. Ex.: SE <code>FORMA_PAGAMENTO</code> contém <code>Parcelado</code> ENTÃO adicionar inadimplência.
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button style={btn} onClick={() => setEdit(nova())}>+ Nova regra</button>
          </div>
          {regras.length === 0 && <div style={{ textAlign: "center", color: "#94a3b8", padding: 24, fontSize: "0.82rem" }}>Nenhuma regra criada</div>}
          {regras.map((r) => {
            const cl = clausulas.find((c) => c.id === r.clausulaId);
            const op = OPERADORES.find((o) => o.v === r.operador);
            return (
              <div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, opacity: r.ativa ? 1 : 0.5 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "0.82rem" }}>{r.nome || "(sem nome)"}</strong>
                  <div style={{ fontSize: "0.76rem", color: "#475569", marginTop: 2 }}>
                    <span style={chip("#eff6ff", "#1e40af")}>SE</span> <code>{r.campo}</code> {op?.label} <code>{r.valor}</code>{" "}
                    <span style={chip("#ecfdf5", "#059669")}>ENTÃO</span> {cl?.titulo ?? "cláusula removida"}
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem" }}>
                  <input type="checkbox" checked={r.ativa} onChange={(e) => setRegras((prev) => prev.map((x) => x.id === r.id ? { ...x, ativa: e.target.checked } : x))} /> Ativa
                </label>
                <button style={btnMini} onClick={() => setEdit(r)}>✏️</button>
                <button style={{ ...btnMini, color: "#b91c1c" }} onClick={() => setRegras((prev) => prev.filter((x) => x.id !== r.id))}>🗑️</button>
              </div>
            );
          })}
        </div>

        {edit && (
          <div style={{ borderTop: "1px solid #e2e8f0", padding: 16, background: "#f8fafc", display: "flex", flexDirection: "column", gap: 10 }}>
            <input style={input} placeholder="Nome da regra (ex: Parcelado → inadimplência)" value={edit.nome} onChange={(e) => setEdit({ ...edit, nome: e.target.value })} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <input style={{ ...input, fontFamily: "monospace" }} placeholder="CAMPO" value={edit.campo} onChange={(e) => setEdit({ ...edit, campo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })} />
              <select style={input} value={edit.operador} onChange={(e) => setEdit({ ...edit, operador: e.target.value as OperadorRegra })}>
                {OPERADORES.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
              </select>
              <input style={input} placeholder="valor" value={edit.valor} onChange={(e) => setEdit({ ...edit, valor: e.target.value })} />
            </div>
            <select style={input} value={edit.clausulaId} onChange={(e) => setEdit({ ...edit, clausulaId: e.target.value })}>
              {clausulas.filter((c) => c.status === "ativa").map((c) => <option key={c.id} value={c.id}>ENTÃO adicionar: {c.titulo}</option>)}
            </select>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button style={btnGhost} onClick={() => setEdit(null)}>Cancelar</button>
              <button style={btn} onClick={() => {
                if (!edit.nome.trim() || !edit.clausulaId) return;
                setRegras((prev) => prev.some((x) => x.id === edit.id) ? prev.map((x) => x.id === edit.id ? edit : x) : [...prev, edit]);
                setEdit(null);
              }}>Salvar regra</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
