"use client";

/* ═══════════════════════════════════════════════════════════════
   GERADOR DE CONTRATOS
   Modelos inteligentes · Biblioteca de cláusulas · Motor de regras
   Variáveis · Numeração automática · Versionamento · Exportação
   ═══════════════════════════════════════════════════════════════ */

import { useEffect, useMemo, useState } from "react";
import type {
  CampoModelo, Clausula, ClausulaContrato, Contrato, ModeloContrato,
  OperadorRegra, PapelParte, Parte, ParteContrato, Regra, StatusContrato,
} from "./types";
import { SEED_CLAUSULAS, SEED_MODELOS, SEED_REGRAS } from "./seed";
import { ConstrutorModelo } from "./ConstrutorModelo";
import { DialogoProvider, useDialogo } from "./Dialogo";
import {
  DOC_CSS, LS_KEYS, abrirImpressao, baixarArquivo, dataBR, exportarDOCX,
  exportarHTML, exportarTXT, fmtBRL, gerarDocumentoHTML, loadLS, maskCEP,
  maskCNPJ, maskCPF, maskTelefone, montarVariaveis, ordinalClausula, saveLS,
  substituirVariaveis, uid,
} from "./utils";

/* ─── Constantes visuais ─────────────────────────────────────── */

const STATUS_INFO: Record<StatusContrato, { label: string; bg: string; color: string }> = {
  rascunho:            { label: "Rascunho",             bg: "#f3f4f6", color: "#6b7280" },
  em_revisao:          { label: "Em Revisão",           bg: "#fffbeb", color: "#92400e" },
  aprovado:            { label: "Aprovado",             bg: "#eff6ff", color: "#1e40af" },
  reprovado:           { label: "Reprovado",            bg: "#fef2f2", color: "#b91c1c" },
  pendente_assinatura: { label: "Pendente Assinatura",  bg: "#f5f3ff", color: "#7c3aed" },
  assinado:            { label: "Assinado",             bg: "#f0fdf4", color: "#065f46" },
  vencido:             { label: "Vencido",              bg: "#fff7ed", color: "#c2410c" },
  arquivado:           { label: "Arquivado",            bg: "#f8fafc", color: "#64748b" },
  cancelado:           { label: "Cancelado",            bg: "#fef2f2", color: "#b91c1c" },
};

const FLUXO_STATUS: StatusContrato[] = [
  "rascunho", "em_revisao", "aprovado", "reprovado",
  "pendente_assinatura", "assinado", "vencido", "arquivado", "cancelado",
];

const PAPEIS: PapelParte[] = [
  "Contratante", "Contratado", "Representante Legal", "Fiador",
  "Testemunha", "Responsável Financeiro", "Advogado",
];

const OPERADORES: { v: OperadorRegra; label: string }[] = [
  { v: "=", label: "igual a" },
  { v: "!=", label: "diferente de" },
  { v: ">", label: "maior que" },
  { v: ">=", label: "maior ou igual a" },
  { v: "<", label: "menor que" },
  { v: "<=", label: "menor ou igual a" },
  { v: "contem", label: "contém" },
];

const UF_LIST = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT",
  "PA","PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

type GuiaGerador = "dashboard" | "novo" | "contratos" | "modelos" | "clausulas" | "partes" | "regras";

const GUIAS: { key: GuiaGerador; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "📊" },
  { key: "novo",      label: "Novo Contrato", icon: "✨" },
  { key: "contratos", label: "Contratos", icon: "📄" },
  { key: "modelos",   label: "Modelos", icon: "🗂️" },
  { key: "clausulas", label: "Cláusulas", icon: "📑" },
  { key: "partes",    label: "Partes", icon: "👥" },
  { key: "regras",    label: "Regras", icon: "⚙️" },
];

/* ─── UI helpers ─────────────────────────────────────────────── */

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "9px 12px", borderRadius: 8,
  border: "1px solid #e2e8f0", fontSize: "0.85rem", color: "#0f172a",
  background: "#fff", boxSizing: "border-box",
};

const btnPrimary: React.CSSProperties = {
  background: "#0f172a", color: "#fff", border: "none", borderRadius: 8,
  padding: "9px 18px", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer",
};

const btnGhost: React.CSSProperties = {
  background: "#f8fafc", color: "#0f172a", border: "1px solid #e2e8f0",
  borderRadius: 8, padding: "8px 14px", fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
};

const btnSmall: React.CSSProperties = {
  background: "#fff", color: "#334155", border: "1px solid #e2e8f0",
  borderRadius: 6, padding: "4px 10px", fontSize: "0.74rem", fontWeight: 600, cursor: "pointer",
};

const cardStyle: React.CSSProperties = {
  background: "#fff", borderRadius: 10, border: "1px solid #e2e8f0", padding: 18,
};

function Badge({ bg, color, label }: { bg: string; color: string; label: string }) {
  return (
    <span style={{
      display: "inline-block", background: bg, color, borderRadius: 999,
      padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.78rem", fontWeight: 600, color: "#475569" }}>
      <span>{label}{required && <span style={{ color: "#dc2626" }}> *</span>}</span>
      {children}
    </label>
  );
}

function Vazio({ msg }: { msg: string }) {
  return <div style={{ textAlign: "center", padding: "50px 20px", color: "#94a3b8", fontSize: "0.9rem" }}>{msg}</div>;
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", zIndex: 200,
        display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff", borderRadius: 12, width: wide ? "min(960px, 96vw)" : "min(640px, 96vw)",
          maxHeight: "90vh", overflow: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        }}
      >
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px", borderBottom: "1px solid #e2e8f0", position: "sticky", top: 0, background: "#fff", zIndex: 1,
        }}>
          <strong style={{ fontSize: "0.98rem" }}>{title}</strong>
          <button onClick={onClose} style={{ ...btnSmall, border: "none", fontSize: "1rem" }}>✕</button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Motor de regras ────────────────────────────────────────── */

function regraAtende(regra: Regra, dados: Record<string, string>): boolean {
  const bruto = dados[regra.campo] ?? "";
  const numCampo = parseFloat(bruto.replace(/\./g, "").replace(",", "."));
  const numRegra = parseFloat(regra.valor.replace(",", "."));
  const ambosNumericos = !isNaN(numCampo) && !isNaN(numRegra);

  switch (regra.operador) {
    case "=": return ambosNumericos ? numCampo === numRegra : bruto.toLowerCase() === regra.valor.toLowerCase();
    case "!=": return ambosNumericos ? numCampo !== numRegra : bruto.toLowerCase() !== regra.valor.toLowerCase();
    case ">": return ambosNumericos && numCampo > numRegra;
    case ">=": return ambosNumericos && numCampo >= numRegra;
    case "<": return ambosNumericos && numCampo < numRegra;
    case "<=": return ambosNumericos && numCampo <= numRegra;
    case "contem": return bruto.toLowerCase().includes(regra.valor.toLowerCase());
    default: return false;
  }
}

/* ═══ COMPONENTE PRINCIPAL ════════════════════════════════════ */

export function GeradorContratos({ abrirNovoSignal }: { abrirNovoSignal?: number } = {}) {
  const [guia, setGuia] = useState<GuiaGerador>("dashboard");
  const [pronto, setPronto] = useState(false);

  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [clausulas, setClausulas] = useState<Clausula[]>([]);
  const [modelos, setModelos] = useState<ModeloContrato[]>([]);
  const [partes, setPartes] = useState<Parte[]>([]);
  const [regras, setRegras] = useState<Regra[]>([]);

  // contrato sendo editado no assistente (nova versão / rascunho)
  const [contratoEmEdicao, setContratoEmEdicao] = useState<Contrato | null>(null);

  useEffect(() => {
    setContratos(loadLS<Contrato[]>(LS_KEYS.contratos, []));
    setClausulas(loadLS<Clausula[]>(LS_KEYS.clausulas, SEED_CLAUSULAS));
    setModelos(loadLS<ModeloContrato[]>(LS_KEYS.modelos, SEED_MODELOS));
    setPartes(loadLS<Parte[]>(LS_KEYS.partes, []));
    setRegras(loadLS<Regra[]>(LS_KEYS.regras, SEED_REGRAS));
    setPronto(true);
  }, []);

  useEffect(() => { if (pronto) saveLS(LS_KEYS.contratos, contratos); }, [contratos, pronto]);
  useEffect(() => { if (pronto) saveLS(LS_KEYS.clausulas, clausulas); }, [clausulas, pronto]);
  useEffect(() => { if (pronto) saveLS(LS_KEYS.modelos, modelos); }, [modelos, pronto]);
  useEffect(() => { if (pronto) saveLS(LS_KEYS.partes, partes); }, [partes, pronto]);
  useEffect(() => { if (pronto) saveLS(LS_KEYS.regras, regras); }, [regras, pronto]);

  const editarContrato = (c: Contrato) => {
    setContratoEmEdicao(c);
    setGuia("novo");
  };

  // botão "+ Novo Contrato" do topo (fora do gerador) abre o passo "novo"
  useEffect(() => {
    if (abrirNovoSignal && abrirNovoSignal > 0) {
      setContratoEmEdicao(null);
      setGuia("novo");
    }
  }, [abrirNovoSignal]);

  if (!pronto) {
    return <div style={{ textAlign: "center", padding: 60, color: "#94a3b8" }}>Carregando gerador...</div>;
  }

  return (
    <DialogoProvider>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Sub-guias do gerador */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {GUIAS.map((g) => (
          <button
            key={g.key}
            onClick={() => { setGuia(g.key); if (g.key !== "novo") setContratoEmEdicao(null); }}
            style={{
              padding: "8px 16px", borderRadius: 999, fontSize: "0.82rem", fontWeight: 600,
              cursor: "pointer", border: "1px solid #e2e8f0",
              background: guia === g.key ? "#0f172a" : "#fff",
              color: guia === g.key ? "#fff" : "#334155",
            }}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>

      {guia === "dashboard" && (
        <GuiaDashboard contratos={contratos} modelos={modelos} irPara={setGuia} />
      )}
      {guia === "novo" && (
        <GuiaNovoContrato
          modelos={modelos}
          clausulas={clausulas}
          partes={partes}
          setPartes={setPartes}
          regras={regras}
          contratos={contratos}
          setContratos={setContratos}
          contratoEmEdicao={contratoEmEdicao}
          aoConcluir={() => { setContratoEmEdicao(null); setGuia("contratos"); }}
        />
      )}
      {guia === "contratos" && (
        <GuiaContratos
          contratos={contratos}
          setContratos={setContratos}
          modelos={modelos}
          partes={partes}
          editarContrato={editarContrato}
        />
      )}
      {guia === "modelos" && (
        <GuiaModelos
          modelos={modelos}
          setModelos={setModelos}
          clausulas={clausulas}
          setClausulas={setClausulas}
          regras={regras}
          setRegras={setRegras}
        />
      )}
      {guia === "clausulas" && (
        <GuiaClausulas clausulas={clausulas} setClausulas={setClausulas} />
      )}
      {guia === "partes" && (
        <GuiaPartes partes={partes} setPartes={setPartes} />
      )}
      {guia === "regras" && (
        <GuiaRegras regras={regras} setRegras={setRegras} clausulas={clausulas} />
      )}
    </div>
    </DialogoProvider>
  );
}

/* ═══ GUIA: DASHBOARD ═════════════════════════════════════════ */

function GuiaDashboard({
  contratos, modelos, irPara,
}: {
  contratos: Contrato[]; modelos: ModeloContrato[]; irPara: (g: GuiaGerador) => void;
}) {
  const hoje = new Date();
  const em30dias = new Date(hoje.getTime() + 30 * 24 * 3600 * 1000);

  const kpis = useMemo(() => {
    const criados = contratos.length;
    const assinados = contratos.filter((c) => c.status === "assinado").length;
    const pendentes = contratos.filter((c) => ["rascunho", "em_revisao", "pendente_assinatura"].includes(c.status)).length;
    const vencidos = contratos.filter((c) => c.status === "vencido" || (c.dataVencimento && new Date(c.dataVencimento) < hoje && !["cancelado", "arquivado"].includes(c.status))).length;
    const cancelados = contratos.filter((c) => c.status === "cancelado").length;
    const valorTotal = contratos.filter((c) => !["cancelado", "reprovado"].includes(c.status)).reduce((s, c) => s + (c.valor || 0), 0);
    return { criados, assinados, pendentes, vencidos, cancelados, valorTotal };
  }, [contratos]);

  const proximosVencimentos = contratos
    .filter((c) => c.dataVencimento && new Date(c.dataVencimento) >= hoje && new Date(c.dataVencimento) <= em30dias && !["cancelado", "arquivado"].includes(c.status))
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento));

  const porTipo = useMemo(() => {
    const mapa: Record<string, number> = {};
    for (const c of contratos) mapa[c.modeloNome] = (mapa[c.modeloNome] ?? 0) + 1;
    return Object.entries(mapa).sort((a, b) => b[1] - a[1]);
  }, [contratos]);

  const maxTipo = Math.max(1, ...porTipo.map(([, n]) => n));

  const KPI = ({ label, valor, cor }: { label: string; valor: string | number; cor?: string }) => (
    <div className="metric-card" style={{ ...cardStyle, padding: 16 }}>
      <span style={{ fontSize: "0.75rem", color: "#64748b", display: "block" }}>{label}</span>
      <strong style={{ fontSize: "1.5rem", color: cor ?? "#0f172a" }}>{valor}</strong>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <KPI label="Contratos criados" valor={kpis.criados} />
        <KPI label="Assinados" valor={kpis.assinados} cor="#065f46" />
        <KPI label="Pendentes" valor={kpis.pendentes} cor="#7c3aed" />
        <KPI label="Vencidos" valor={kpis.vencidos} cor="#c2410c" />
        <KPI label="Cancelados" valor={kpis.cancelados} cor="#b91c1c" />
        <KPI label="Valor total" valor={fmtBRL(kpis.valorTotal)} cor="#065f46" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Contratos por tipo */}
        <div style={cardStyle}>
          <strong style={{ fontSize: "0.92rem" }}>Contratos por tipo</strong>
          {porTipo.length === 0 ? (
            <Vazio msg="Nenhum contrato criado ainda" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {porTipo.map(([nome, n]) => {
                const modelo = modelos.find((m) => m.nome === nome);
                return (
                  <div key={nome} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 160, fontSize: "0.8rem", color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {modelo?.icone} {nome}
                    </span>
                    <div style={{ flex: 1, background: "#f1f5f9", borderRadius: 6, height: 18 }}>
                      <div style={{
                        width: `${(n / maxTipo) * 100}%`, height: "100%", borderRadius: 6,
                        background: modelo?.cor ?? "#0f172a", minWidth: 20,
                        display: "flex", alignItems: "center", justifyContent: "flex-end",
                        color: "#fff", fontSize: "0.68rem", fontWeight: 700, paddingRight: 6, boxSizing: "border-box",
                      }}>
                        {n}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Próximos vencimentos */}
        <div style={cardStyle}>
          <strong style={{ fontSize: "0.92rem" }}>Próximos vencimentos (30 dias)</strong>
          {proximosVencimentos.length === 0 ? (
            <Vazio msg="Nenhum vencimento nos próximos 30 dias" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
              {proximosVencimentos.slice(0, 8).map((c) => (
                <div key={c.id} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "8px 12px", background: "#fff7ed", borderRadius: 8, border: "1px solid #fed7aa",
                }}>
                  <div>
                    <strong style={{ fontSize: "0.8rem", color: "#0f172a" }}>{c.numero}</strong>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 8 }}>{c.titulo}</span>
                  </div>
                  <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#c2410c" }}>{dataBR(c.dataVencimento)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimos contratos */}
      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <strong style={{ fontSize: "0.92rem" }}>Últimos contratos</strong>
          <button style={btnGhost} onClick={() => irPara("novo")}>+ Novo contrato</button>
        </div>
        {contratos.length === 0 ? (
          <Vazio msg="Nenhum contrato criado. Clique em Novo Contrato para começar." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 12 }}>
            <thead>
              <tr>
                {["Número", "Título", "Modelo", "Status", "Valor", "Criado em"].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontSize: "0.72rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...contratos].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)).slice(0, 8).map((c) => {
                const st = STATUS_INFO[c.status];
                return (
                  <tr key={c.id}>
                    <td style={{ padding: "8px 12px", fontSize: "0.8rem", fontFamily: "monospace", borderBottom: "1px solid #f1f5f9" }}>{c.numero}</td>
                    <td style={{ padding: "8px 12px", fontSize: "0.82rem", borderBottom: "1px solid #f1f5f9" }}>{c.titulo}</td>
                    <td style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>{c.modeloNome}</td>
                    <td style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9" }}><Badge {...st} /></td>
                    <td style={{ padding: "8px 12px", fontSize: "0.8rem", borderBottom: "1px solid #f1f5f9" }}>{fmtBRL(c.valor || 0)}</td>
                    <td style={{ padding: "8px 12px", fontSize: "0.8rem", color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>{new Date(c.criadoEm).toLocaleDateString("pt-BR")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ═══ GUIA: NOVO CONTRATO (assistente) ════════════════════════ */

function GuiaNovoContrato({
  modelos, clausulas, partes, setPartes, regras, contratos, setContratos, contratoEmEdicao, aoConcluir,
}: {
  modelos: ModeloContrato[];
  clausulas: Clausula[];
  partes: Parte[];
  setPartes: React.Dispatch<React.SetStateAction<Parte[]>>;
  regras: Regra[];
  contratos: Contrato[];
  setContratos: React.Dispatch<React.SetStateAction<Contrato[]>>;
  contratoEmEdicao: Contrato | null;
  aoConcluir: () => void;
}) {
  const [passo, setPasso] = useState(contratoEmEdicao ? 2 : 1);
  const [modeloId, setModeloId] = useState<string>(contratoEmEdicao?.modeloId ?? "");
  const [dados, setDados] = useState<Record<string, string>>(contratoEmEdicao?.dados ?? {});
  const [partesSel, setPartesSel] = useState<ParteContrato[]>(contratoEmEdicao?.partes ?? []);
  const [clausulasSel, setClausulasSel] = useState<ClausulaContrato[]>(contratoEmEdicao?.clausulas ?? []);
  const [clausulasMontadas, setClausulasMontadas] = useState(!!contratoEmEdicao);
  const [mostrarNovaParte, setMostrarNovaParte] = useState(false);
  const [avisoValidacao, setAvisoValidacao] = useState("");

  const modelo = modelos.find((m) => m.id === modeloId) ?? null;

  const PASSOS = ["Modelo", "Dados", "Partes", "Cláusulas", "Revisão"];

  /* montar cláusulas iniciais (obrigatórias + regras) */
  const montarClausulas = () => {
    if (!modelo) return;
    const lista: ClausulaContrato[] = [];
    const jaAdicionada = (id: string) => lista.some((c) => c.clausulaId === id);

    for (const cid of modelo.clausulasObrigatorias) {
      const cl = clausulas.find((c) => c.id === cid);
      if (cl) lista.push({ clausulaId: cl.id, titulo: cl.titulo, texto: cl.texto, origem: "obrigatoria" });
    }
    for (const regra of regras.filter((r) => r.ativa)) {
      if (regraAtende(regra, dados) && !jaAdicionada(regra.clausulaId)) {
        const cl = clausulas.find((c) => c.id === regra.clausulaId);
        if (cl) lista.push({ clausulaId: cl.id, titulo: cl.titulo, texto: cl.texto, origem: "regra" });
      }
    }
    // manter foro no final
    const idxForo = lista.findIndex((c) => c.clausulaId === "cl-foro");
    if (idxForo >= 0 && idxForo !== lista.length - 1) {
      const [foro] = lista.splice(idxForo, 1);
      lista.push(foro);
    }
    setClausulasSel(lista);
    setClausulasMontadas(true);
  };

  const irParaPasso = (novo: number) => {
    setAvisoValidacao("");
    if (novo === 4 && !clausulasMontadas) montarClausulas();
    setPasso(novo);
  };

  const validarPasso = (): string => {
    if (passo === 1 && !modelo) return "Escolha um modelo para continuar.";
    if (passo === 2 && modelo) {
      const faltando = modelo.campos.filter((c) => c.obrigatorio && !(dados[c.variavel] ?? "").trim());
      if (faltando.length) return `Preencha os campos obrigatórios: ${faltando.map((c) => c.label).join(", ")}.`;
    }
    if (passo === 3 && modelo) {
      if (partesSel.length < modelo.minAssinantes) return `Este modelo exige pelo menos ${modelo.minAssinantes} partes.`;
    }
    if (passo === 4 && clausulasSel.length === 0) return "Adicione ao menos uma cláusula.";
    return "";
  };

  const avancar = () => {
    const erro = validarPasso();
    if (erro) { setAvisoValidacao(erro); return; }
    irParaPasso(passo + 1);
  };

  const salvarContrato = (status: StatusContrato) => {
    if (!modelo) return;
    const agora = new Date().toISOString();
    const valorNum = parseFloat((dados["VALOR"] ?? "0").replace(/\./g, "").replace(",", "."));

    if (contratoEmEdicao) {
      // nova versão
      const atualizado: Contrato = {
        ...contratoEmEdicao,
        dados, partes: partesSel, clausulas: clausulasSel,
        valor: isNaN(valorNum) ? 0 : valorNum,
        dataInicio: dados["DATA_INICIO"] ?? contratoEmEdicao.dataInicio,
        dataVencimento: dados["DATA_FIM"] ?? contratoEmEdicao.dataVencimento,
        status, atualizadoEm: agora,
        versao: contratoEmEdicao.versao + 1,
        versoes: [
          ...contratoEmEdicao.versoes,
          {
            versao: contratoEmEdicao.versao + 1, data: agora, autor: "Administrador",
            descricao: `Versão ${contratoEmEdicao.versao + 1} — edição do contrato`,
            clausulas: clausulasSel, dados,
          },
        ],
      };
      setContratos((prev) => prev.map((c) => (c.id === atualizado.id ? atualizado : c)));
    } else {
      const ano = new Date().getFullYear();
      const seq = contratos.filter((c) => c.numero.includes(`-${ano}-`)).length + 1;
      const novo: Contrato = {
        id: uid(),
        numero: `CTR-${ano}-${String(seq).padStart(4, "0")}`,
        modeloId: modelo.id,
        modeloNome: modelo.nome,
        titulo: modelo.tituloDocumento,
        status,
        dados, partes: partesSel, clausulas: clausulasSel,
        valor: isNaN(valorNum) ? 0 : valorNum,
        dataInicio: dados["DATA_INICIO"] ?? "",
        dataVencimento: dados["DATA_FIM"] ?? "",
        criadoEm: agora, atualizadoEm: agora,
        versao: 1,
        versoes: [{ versao: 1, data: agora, autor: "Administrador", descricao: "Versão inicial", clausulas: clausulasSel, dados }],
      };
      setContratos((prev) => [novo, ...prev]);
    }
    aoConcluir();
  };

  /* CEP automático em campos tipo cep é tratado no formulário de partes */

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Stepper */}
      <div style={{ display: "flex", gap: 0, alignItems: "center", flexWrap: "wrap" }}>
        {PASSOS.map((p, i) => {
          const num = i + 1;
          const ativo = passo === num;
          const feito = passo > num;
          return (
            <div key={p} style={{ display: "flex", alignItems: "center" }}>
              <button
                onClick={() => num < passo && irParaPasso(num)}
                style={{
                  display: "flex", alignItems: "center", gap: 8, background: "none",
                  border: "none", cursor: num < passo ? "pointer" : "default", padding: "6px 4px",
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: "50%", display: "inline-flex",
                  alignItems: "center", justifyContent: "center", fontSize: "0.78rem", fontWeight: 700,
                  background: ativo ? "#0f172a" : feito ? "#065f46" : "#e2e8f0",
                  color: ativo || feito ? "#fff" : "#64748b",
                }}>
                  {feito ? "✓" : num}
                </span>
                <span style={{ fontSize: "0.8rem", fontWeight: ativo ? 700 : 500, color: ativo ? "#0f172a" : "#64748b" }}>{p}</span>
              </button>
              {i < PASSOS.length - 1 && <div style={{ width: 32, height: 2, background: feito ? "#065f46" : "#e2e8f0", margin: "0 6px" }} />}
            </div>
          );
        })}
        {contratoEmEdicao && (
          <span style={{ marginLeft: "auto" }}>
            <Badge bg="#eff6ff" color="#1e40af" label={`Editando ${contratoEmEdicao.numero} (v${contratoEmEdicao.versao} → v${contratoEmEdicao.versao + 1})`} />
          </span>
        )}
      </div>

      {avisoValidacao && (
        <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", borderRadius: 8, padding: "10px 14px", fontSize: "0.82rem" }}>
          ⚠️ {avisoValidacao}
        </div>
      )}

      {/* PASSO 1 — Modelo */}
      {passo === 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(230px, 1fr))", gap: 14 }}>
          {modelos.filter((m) => m.status === "ativo").map((m) => (
            <button
              key={m.id}
              onClick={() => { setModeloId(m.id); setDados({}); setClausulasSel([]); setClausulasMontadas(false); }}
              style={{
                ...cardStyle, textAlign: "left", cursor: "pointer", padding: 0, overflow: "hidden",
                outline: modeloId === m.id ? `2px solid ${m.cor}` : "none",
              }}
            >
              <div style={{ height: 4, background: m.cor }} />
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: "1.4rem" }}>{m.icone}</span>
                  <strong style={{ fontSize: "0.9rem" }}>{m.nome}</strong>
                </div>
                <span style={{ fontSize: "0.76rem", color: "#64748b", lineHeight: 1.4 }}>{m.descricao}</span>
                <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                  <Badge bg={m.cor + "18"} color={m.cor} label={m.categoria} />
                  <Badge bg="#f1f5f9" color="#64748b" label={`${m.campos.length} campos`} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* PASSO 2 — Dados (formulário inteligente) */}
      {passo === 2 && modelo && (
        <div style={cardStyle}>
          <strong style={{ fontSize: "0.95rem" }}>{modelo.icone} {modelo.nome} — dados do contrato</strong>
          <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "4px 0 16px" }}>
            Os campos abaixo alimentam as variáveis do documento (ex: {"{{VALOR}}"}, {"{{VALOR_EXTENSO}}"}, {"{{DATA_EXTENSO}}"}).
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 14 }}>
            {modelo.campos.map((campo) => (
              <CampoInteligente
                key={campo.id}
                campo={campo}
                valor={dados[campo.variavel] ?? ""}
                onChange={(v) => { setDados((d) => ({ ...d, [campo.variavel]: v })); setClausulasMontadas(false); }}
              />
            ))}
          </div>
        </div>
      )}

      {/* PASSO 3 — Partes */}
      {passo === 3 && modelo && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={cardStyle}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <strong style={{ fontSize: "0.95rem" }}>Partes do contrato</strong>
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "2px 0 0" }}>
                  Mínimo de {modelo.minAssinantes} partes. Pessoas cadastradas podem ser reutilizadas em outros contratos.
                </p>
              </div>
              <button style={btnGhost} onClick={() => setMostrarNovaParte(true)}>+ Cadastrar pessoa</button>
            </div>

            {partes.length === 0 ? (
              <Vazio msg="Nenhuma pessoa cadastrada. Clique em Cadastrar pessoa." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {partes.map((p) => {
                  const sel = partesSel.find((ps) => ps.parteId === p.id);
                  return (
                    <div key={p.id} style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "10px 14px",
                      borderRadius: 8, border: `1px solid ${sel ? "#065f46" : "#e2e8f0"}`,
                      background: sel ? "#f0fdf4" : "#fff",
                    }}>
                      <input
                        type="checkbox"
                        checked={!!sel}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPartesSel((prev) => [...prev, { parteId: p.id, papel: p.papelPadrao, assinou: false }]);
                          } else {
                            setPartesSel((prev) => prev.filter((ps) => ps.parteId !== p.id));
                          }
                        }}
                      />
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: "0.84rem" }}>{p.nome}</strong>
                        <span style={{ fontSize: "0.75rem", color: "#64748b", marginLeft: 8 }}>
                          {p.tipoPessoa} · {p.documento} · {p.cidade}/{p.uf}
                        </span>
                      </div>
                      {sel && (
                        <select
                          value={sel.papel}
                          onChange={(e) => setPartesSel((prev) => prev.map((ps) => ps.parteId === p.id ? { ...ps, papel: e.target.value as PapelParte } : ps))}
                          style={{ ...inputStyle, width: 200 }}
                        >
                          {PAPEIS.map((papel) => <option key={papel} value={papel}>{papel}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          {mostrarNovaParte && (
            <Modal title="Cadastrar pessoa" onClose={() => setMostrarNovaParte(false)}>
              <FormParte
                onSalvar={(p) => {
                  setPartes((prev) => [...prev, p]);
                  setPartesSel((prev) => [...prev, { parteId: p.id, papel: p.papelPadrao, assinou: false }]);
                  setMostrarNovaParte(false);
                }}
              />
            </Modal>
          )}
        </div>
      )}

      {/* PASSO 4 — Construtor de cláusulas */}
      {passo === 4 && modelo && (
        <ConstrutorClausulas
          modelo={modelo}
          clausulas={clausulas}
          clausulasSel={clausulasSel}
          setClausulasSel={setClausulasSel}
          dados={dados}
          regras={regras}
        />
      )}

      {/* PASSO 5 — Revisão / preview */}
      {passo === 5 && modelo && (
        <PreviewContrato
          modelo={modelo}
          dados={dados}
          partesSel={partesSel}
          partes={partes}
          clausulasSel={clausulasSel}
        />
      )}

      {/* Navegação */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
        <button
          style={{ ...btnGhost, visibility: passo > 1 ? "visible" : "hidden" }}
          onClick={() => irParaPasso(passo - 1)}
        >
          ← Voltar
        </button>
        {passo < 5 ? (
          <button style={btnPrimary} onClick={avancar}>Avançar →</button>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnGhost} onClick={() => salvarContrato("rascunho")}>Salvar rascunho</button>
            <button style={btnGhost} onClick={() => salvarContrato("em_revisao")}>Enviar para revisão</button>
            <button style={btnPrimary} onClick={() => salvarContrato("pendente_assinatura")}>
              Finalizar → pendente assinatura
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Campo inteligente (formulário dinâmico) ────────────────── */

function CampoInteligente({
  campo, valor, onChange,
}: {
  campo: CampoModelo; valor: string; onChange: (v: string) => void;
}) {
  const props = {
    style: inputStyle,
    value: valor,
    placeholder: campo.placeholder ?? "",
  };

  let controle: React.ReactNode;
  switch (campo.tipo) {
    case "textarea":
      controle = <textarea {...props} rows={3} onChange={(e) => onChange(e.target.value)} />;
      break;
    case "select":
      controle = (
        <select {...props} onChange={(e) => onChange(e.target.value)}>
          <option value="">Selecione...</option>
          {(campo.opcoes ?? []).map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
      break;
    case "data":
      controle = <input {...props} type="date" onChange={(e) => onChange(e.target.value)} />;
      break;
    case "hora":
      controle = <input {...props} type="time" onChange={(e) => onChange(e.target.value)} />;
      break;
    case "numero":
      controle = <input {...props} type="number" onChange={(e) => onChange(e.target.value)} />;
      break;
    case "valor":
      controle = (
        <input
          {...props}
          inputMode="decimal"
          placeholder="0,00"
          onChange={(e) => {
            const digitos = e.target.value.replace(/\D/g, "");
            const num = parseInt(digitos || "0", 10) / 100;
            onChange(num.toLocaleString("pt-BR", { minimumFractionDigits: 2 }));
          }}
        />
      );
      break;
    case "percentual":
      controle = (
        <input {...props} placeholder="ex: 2% (dois por cento)" onChange={(e) => onChange(e.target.value)} />
      );
      break;
    case "cpf":
      controle = <input {...props} onChange={(e) => onChange(maskCPF(e.target.value))} />;
      break;
    case "cnpj":
      controle = <input {...props} onChange={(e) => onChange(maskCNPJ(e.target.value))} />;
      break;
    case "telefone":
      controle = <input {...props} onChange={(e) => onChange(maskTelefone(e.target.value))} />;
      break;
    case "cep":
      controle = <input {...props} onChange={(e) => onChange(maskCEP(e.target.value))} />;
      break;
    case "email":
      controle = <input {...props} type="email" onChange={(e) => onChange(e.target.value)} />;
      break;
    default:
      controle = <input {...props} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <Field label={`${campo.label}  ·  {{${campo.variavel}}}`} required={campo.obrigatorio}>
      {controle}
    </Field>
  );
}

/* ─── Formulário de parte (com CEP inteligente) ──────────────── */

function FormParte({ onSalvar, inicial }: { onSalvar: (p: Parte) => void; inicial?: Parte }) {
  const [p, setP] = useState<Parte>(
    inicial ?? {
      id: uid(), nome: "", tipoPessoa: "PF", documento: "", rg: "", email: "",
      telefone: "", cep: "", logradouro: "", numero: "", complemento: "",
      bairro: "", cidade: "", uf: "", papelPadrao: "Contratante",
    },
  );
  const [buscandoCEP, setBuscandoCEP] = useState(false);
  const [erro, setErro] = useState("");

  const set = (patch: Partial<Parte>) => setP((prev) => ({ ...prev, ...patch }));

  const buscarCEP = async (cep: string) => {
    const limpo = cep.replace(/\D/g, "");
    if (limpo.length !== 8) return;
    setBuscandoCEP(true);
    try {
      const r = await fetch(`/api/cep/${limpo}`);
      const json = await r.json();
      const d = json.data ?? json;
      if (d && !d.erro) {
        set({
          logradouro: d.logradouro ?? d.street ?? "",
          bairro: d.bairro ?? d.neighborhood ?? "",
          cidade: d.localidade ?? d.cidade ?? d.city ?? "",
          uf: d.uf ?? d.state ?? "",
        });
      }
    } catch {
      /* offline — segue preenchimento manual */
    } finally {
      setBuscandoCEP(false);
    }
  };

  const salvar = () => {
    if (!p.nome.trim() || !p.documento.trim()) {
      setErro("Nome e documento (CPF/CNPJ) são obrigatórios.");
      return;
    }
    onSalvar(p);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {erro && <div style={{ background: "#fef2f2", color: "#b91c1c", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem" }}>{erro}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="Tipo de pessoa" required>
          <select style={inputStyle} value={p.tipoPessoa} onChange={(e) => set({ tipoPessoa: e.target.value as "PF" | "PJ", documento: "" })}>
            <option value="PF">Pessoa Física</option>
            <option value="PJ">Pessoa Jurídica</option>
          </select>
        </Field>
        <Field label="Papel padrão">
          <select style={inputStyle} value={p.papelPadrao} onChange={(e) => set({ papelPadrao: e.target.value as PapelParte })}>
            {PAPEIS.map((papel) => <option key={papel} value={papel}>{papel}</option>)}
          </select>
        </Field>
      </div>
      <Field label={p.tipoPessoa === "PJ" ? "Razão social" : "Nome completo"} required>
        <input style={inputStyle} value={p.nome} onChange={(e) => set({ nome: e.target.value })} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label={p.tipoPessoa === "PJ" ? "CNPJ" : "CPF"} required>
          <input
            style={inputStyle}
            value={p.documento}
            onChange={(e) => set({ documento: p.tipoPessoa === "PJ" ? maskCNPJ(e.target.value) : maskCPF(e.target.value) })}
          />
        </Field>
        {p.tipoPessoa === "PF" ? (
          <Field label="RG">
            <input style={inputStyle} value={p.rg} onChange={(e) => set({ rg: e.target.value })} />
          </Field>
        ) : <div />}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field label="E-mail">
          <input style={inputStyle} type="email" value={p.email} onChange={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Telefone / WhatsApp">
          <input style={inputStyle} value={p.telefone} onChange={(e) => set({ telefone: maskTelefone(e.target.value) })} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "140px 1fr 90px", gap: 12 }}>
        <Field label={buscandoCEP ? "CEP (buscando...)" : "CEP"}>
          <input
            style={inputStyle}
            value={p.cep}
            onChange={(e) => {
              const v = maskCEP(e.target.value);
              set({ cep: v });
              if (v.replace(/\D/g, "").length === 8) buscarCEP(v);
            }}
          />
        </Field>
        <Field label="Logradouro">
          <input style={inputStyle} value={p.logradouro} onChange={(e) => set({ logradouro: e.target.value })} />
        </Field>
        <Field label="Número">
          <input style={inputStyle} value={p.numero} onChange={(e) => set({ numero: e.target.value })} />
        </Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 90px", gap: 12 }}>
        <Field label="Complemento">
          <input style={inputStyle} value={p.complemento} onChange={(e) => set({ complemento: e.target.value })} />
        </Field>
        <Field label="Bairro">
          <input style={inputStyle} value={p.bairro} onChange={(e) => set({ bairro: e.target.value })} />
        </Field>
        <Field label="Cidade">
          <input style={inputStyle} value={p.cidade} onChange={(e) => set({ cidade: e.target.value })} />
        </Field>
        <Field label="UF">
          <select style={inputStyle} value={p.uf} onChange={(e) => set({ uf: e.target.value })}>
            <option value="">—</option>
            {UF_LIST.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={btnPrimary} onClick={salvar}>Salvar pessoa</button>
      </div>
    </div>
  );
}

/* ─── Construtor de cláusulas ────────────────────────────────── */

function ConstrutorClausulas({
  modelo, clausulas, clausulasSel, setClausulasSel, dados, regras,
}: {
  modelo: ModeloContrato;
  clausulas: Clausula[];
  clausulasSel: ClausulaContrato[];
  setClausulasSel: React.Dispatch<React.SetStateAction<ClausulaContrato[]>>;
  dados: Record<string, string>;
  regras: Regra[];
}) {
  const [editandoIdx, setEditandoIdx] = useState<number | null>(null);
  const [mostrarBiblioteca, setMostrarBiblioteca] = useState(false);
  const [buscaBiblioteca, setBuscaBiblioteca] = useState("");

  const mover = (i: number, dir: -1 | 1) => {
    setClausulasSel((prev) => {
      const nova = [...prev];
      const j = i + dir;
      if (j < 0 || j >= nova.length) return prev;
      [nova[i], nova[j]] = [nova[j], nova[i]];
      return nova;
    });
  };

  const duplicar = (i: number) => {
    setClausulasSel((prev) => {
      const nova = [...prev];
      nova.splice(i + 1, 0, { ...prev[i], clausulaId: null, origem: "manual", titulo: prev[i].titulo + " (cópia)" });
      return nova;
    });
  };

  const remover = (i: number) => setClausulasSel((prev) => prev.filter((_, idx) => idx !== i));

  const regrasAtivadas = regras.filter((r) => r.ativa && regraAtende(r, dados));

  const opcionaisDisponiveis = clausulas.filter(
    (c) => c.status === "ativa" && !clausulasSel.some((cs) => cs.clausulaId === c.id),
  );
  const filtradas = opcionaisDisponiveis.filter(
    (c) =>
      !buscaBiblioteca ||
      c.titulo.toLowerCase().includes(buscaBiblioteca.toLowerCase()) ||
      c.texto.toLowerCase().includes(buscaBiblioteca.toLowerCase()) ||
      c.tags.some((t) => t.toLowerCase().includes(buscaBiblioteca.toLowerCase())),
  );

  const ORIGEM_INFO: Record<ClausulaContrato["origem"], { label: string; bg: string; color: string }> = {
    obrigatoria: { label: "Obrigatória", bg: "#eff6ff", color: "#1e40af" },
    regra:       { label: "Regra automática", bg: "#fdf4ff", color: "#a21caf" },
    opcional:    { label: "Opcional", bg: "#f0fdf4", color: "#065f46" },
    manual:      { label: "Manual", bg: "#f8fafc", color: "#64748b" },
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {regrasAtivadas.length > 0 && (
        <div style={{ background: "#fdf4ff", border: "1px solid #f0abfc", borderRadius: 8, padding: "10px 14px", fontSize: "0.8rem", color: "#a21caf" }}>
          ⚡ Regras aplicadas automaticamente: {regrasAtivadas.map((r) => r.nome).join(" · ")}
        </div>
      )}

      <div style={cardStyle}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div>
            <strong style={{ fontSize: "0.95rem" }}>Cláusulas do contrato ({clausulasSel.length})</strong>
            <p style={{ fontSize: "0.76rem", color: "#64748b", margin: "2px 0 0" }}>
              A numeração (CLÁUSULA PRIMEIRA, SEGUNDA...) é atualizada automaticamente ao mover ou excluir.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={btnGhost} onClick={() => setMostrarBiblioteca(true)}>+ Da biblioteca</button>
            <button
              style={btnGhost}
              onClick={() => setClausulasSel((prev) => [...prev, { clausulaId: null, titulo: "Nova cláusula", texto: "", origem: "manual" }])}
            >
              + Cláusula em branco
            </button>
          </div>
        </div>

        {clausulasSel.length === 0 ? (
          <Vazio msg="Nenhuma cláusula adicionada" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clausulasSel.map((c, i) => {
              const origem = ORIGEM_INFO[c.origem];
              return (
                <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#f8fafc" }}>
                    <strong style={{ fontSize: "0.78rem", color: "#0f172a", whiteSpace: "nowrap" }}>
                      CLÁUSULA {ordinalClausula(i)}
                    </strong>
                    <span style={{ fontSize: "0.82rem", color: "#334155", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {c.titulo}
                    </span>
                    <Badge {...origem} />
                    <div style={{ display: "flex", gap: 4 }}>
                      <button style={btnSmall} title="Mover para cima" onClick={() => mover(i, -1)} disabled={i === 0}>↑</button>
                      <button style={btnSmall} title="Mover para baixo" onClick={() => mover(i, 1)} disabled={i === clausulasSel.length - 1}>↓</button>
                      <button style={btnSmall} title="Editar" onClick={() => setEditandoIdx(editandoIdx === i ? null : i)}>✏️</button>
                      <button style={btnSmall} title="Duplicar" onClick={() => duplicar(i)}>⧉</button>
                      <button style={{ ...btnSmall, color: "#b91c1c" }} title="Excluir" onClick={() => remover(i)}>🗑️</button>
                    </div>
                  </div>
                  {editandoIdx === i ? (
                    <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                      <input
                        style={inputStyle}
                        value={c.titulo}
                        onChange={(e) => setClausulasSel((prev) => prev.map((x, idx) => idx === i ? { ...x, titulo: e.target.value } : x))}
                      />
                      <textarea
                        style={{ ...inputStyle, fontFamily: "inherit", minHeight: 110 }}
                        value={c.texto}
                        onChange={(e) => setClausulasSel((prev) => prev.map((x, idx) => idx === i ? { ...x, texto: e.target.value } : x))}
                      />
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                        Use variáveis como {"{{VALOR}}"}, {"{{VALOR_EXTENSO}}"}, {"{{CONTRATANTE}}"}, {"{{DATA_EXTENSO}}"}...
                      </span>
                    </div>
                  ) : (
                    <p style={{ padding: "10px 14px", margin: 0, fontSize: "0.8rem", color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                      {c.texto.length > 260 ? c.texto.slice(0, 260) + "…" : c.texto}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {mostrarBiblioteca && (
        <Modal title="Adicionar cláusula da biblioteca" onClose={() => setMostrarBiblioteca(false)} wide>
          <input
            style={{ ...inputStyle, marginBottom: 12 }}
            placeholder="Buscar por título, texto ou tag..."
            value={buscaBiblioteca}
            onChange={(e) => setBuscaBiblioteca(e.target.value)}
          />
          {filtradas.length === 0 ? (
            <Vazio msg="Nenhuma cláusula disponível" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtradas.map((c) => {
                const sugerida = modelo.clausulasOpcionais.includes(c.id);
                return (
                  <div key={c.id} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12, display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <strong style={{ fontSize: "0.84rem" }}>{c.favorita ? "⭐ " : ""}{c.titulo}</strong>
                        <Badge bg="#f1f5f9" color="#64748b" label={c.categoria} />
                        {sugerida && <Badge bg="#f0fdf4" color="#065f46" label="Sugerida p/ este modelo" />}
                      </div>
                      <p style={{ fontSize: "0.76rem", color: "#64748b", margin: "6px 0 0", lineHeight: 1.5 }}>
                        {c.texto.slice(0, 180)}…
                      </p>
                    </div>
                    <button
                      style={btnGhost}
                      onClick={() => {
                        setClausulasSel((prev) => [...prev, { clausulaId: c.id, titulo: c.titulo, texto: c.texto, origem: "opcional" }]);
                      }}
                    >
                      Adicionar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/* ─── Preview do contrato ────────────────────────────────────── */

function PreviewContrato({
  modelo, dados, partesSel, partes, clausulasSel,
}: {
  modelo: ModeloContrato;
  dados: Record<string, string>;
  partesSel: ParteContrato[];
  partes: Parte[];
  clausulasSel: ClausulaContrato[];
}) {
  const html = gerarDocumentoHTML(
    { titulo: modelo.tituloDocumento, dados, partes: partesSel, clausulas: clausulasSel },
    partes,
    modelo.preambulo,
    modelo.fechamento,
  );

  const vars = montarVariaveis(dados, partesSel, partes);
  const pendentes = new Set<string>();
  for (const c of clausulasSel) {
    const substituido = substituirVariaveis(c.texto, vars);
    const m = substituido.match(/\[([A-Z0-9_]+)\]/g);
    if (m) m.forEach((x) => pendentes.add(x));
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pendentes.size > 0 && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", borderRadius: 8, padding: "10px 14px", fontSize: "0.8rem" }}>
          ⚠️ Variáveis sem valor (aparecem entre colchetes no documento): {[...pendentes].join(", ")}
        </div>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button style={btnGhost} onClick={() => abrirImpressao(html, modelo.tituloDocumento)}>🖨️ Imprimir / PDF</button>
        <button style={btnGhost} onClick={() => exportarDOCX(html, modelo.tituloDocumento)}>📄 DOCX</button>
        <button style={btnGhost} onClick={() => exportarHTML(html, modelo.tituloDocumento)}>🌐 HTML</button>
        <button style={btnGhost} onClick={() => exportarTXT(html, modelo.tituloDocumento)}>📃 TXT</button>
      </div>
      <div style={{ background: "#e2e8f0", borderRadius: 12, padding: 24, display: "flex", justifyContent: "center" }}>
        <div style={{
          background: "#fff", width: "min(800px, 100%)", padding: "60px 70px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.12)", borderRadius: 4,
        }}>
          <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
          <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
      </div>
    </div>
  );
}

/* ═══ GUIA: CONTRATOS (lista, busca, status, versões) ═════════ */

function GuiaContratos({
  contratos, setContratos, modelos, partes, editarContrato,
}: {
  contratos: Contrato[];
  setContratos: React.Dispatch<React.SetStateAction<Contrato[]>>;
  modelos: ModeloContrato[];
  partes: Parte[];
  editarContrato: (c: Contrato) => void;
}) {
  const dlg = useDialogo();
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusContrato | "todos">("todos");
  const [visualizando, setVisualizando] = useState<Contrato | null>(null);
  const [historicoDe, setHistoricoDe] = useState<Contrato | null>(null);

  const filtrados = contratos.filter((c) => {
    if (filtroStatus !== "todos" && c.status !== filtroStatus) return false;
    if (!busca) return true;
    const q = busca.toLowerCase();
    const nomesPartes = c.partes
      .map((pc) => partes.find((p) => p.id === pc.parteId))
      .filter(Boolean)
      .map((p) => `${p!.nome} ${p!.documento}`)
      .join(" ")
      .toLowerCase();
    return (
      c.numero.toLowerCase().includes(q) ||
      c.titulo.toLowerCase().includes(q) ||
      c.modeloNome.toLowerCase().includes(q) ||
      nomesPartes.includes(q) ||
      String(c.valor).includes(q) ||
      c.clausulas.some((cl) => cl.titulo.toLowerCase().includes(q) || cl.texto.toLowerCase().includes(q))
    );
  });

  const mudarStatus = (id: string, status: StatusContrato) => {
    const agora = new Date().toISOString();
    setContratos((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const partesAtualizadas = status === "assinado"
        ? c.partes.map((p) => ({ ...p, assinou: true, assinadoEm: agora }))
        : c.partes;
      return { ...c, status, partes: partesAtualizadas, atualizadoEm: agora };
    }));
  };

  const excluir = (c: Contrato) => {
    dlg.confirmar(
      `Excluir o contrato ${c.numero} — "${c.titulo}"? Esta ação não pode ser desfeita.`,
      () => setContratos((prev) => prev.filter((x) => x.id !== c.id)),
      { titulo: "Excluir contrato", perigo: true, okLabel: "Excluir" },
    );
  };

  const htmlDe = (c: Contrato) => {
    const modelo = modelos.find((m) => m.id === c.modeloId);
    return gerarDocumentoHTML(c, partes, modelo?.preambulo ?? "", modelo?.fechamento ?? "");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 260 }}
          placeholder="🔍 Pesquisar por número, título, parte, CPF/CNPJ, valor, cláusula, palavra..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select style={{ ...inputStyle, width: 220 }} value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value as StatusContrato | "todos")}>
          <option value="todos">Todos os status</option>
          {FLUXO_STATUS.map((s) => <option key={s} value={s}>{STATUS_INFO[s].label}</option>)}
        </select>
      </div>

      {filtrados.length === 0 ? (
        <div style={cardStyle}><Vazio msg={contratos.length === 0 ? "Nenhum contrato criado ainda" : "Nenhum contrato encontrado para a pesquisa"} /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtrados.map((c) => {
            const st = STATUS_INFO[c.status];
            const assinaturas = c.partes.filter((p) => p.assinou).length;
            return (
              <div key={c.id} style={{ ...cardStyle, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ fontSize: "0.85rem", fontFamily: "monospace" }}>{c.numero}</strong>
                    <Badge {...st} />
                    <Badge bg="#f1f5f9" color="#64748b" label={`v${c.versao}`} />
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "#475569", marginTop: 4 }}>
                    {c.titulo} · {c.modeloNome} · {fmtBRL(c.valor || 0)}
                    {c.dataVencimento && ` · vence em ${dataBR(c.dataVencimento)}`}
                    {` · assinaturas ${assinaturas}/${c.partes.length}`}
                  </div>
                </div>
                <select
                  style={{ ...inputStyle, width: 190 }}
                  value={c.status}
                  onChange={(e) => mudarStatus(c.id, e.target.value as StatusContrato)}
                  title="Fluxo de aprovação"
                >
                  {FLUXO_STATUS.map((s) => <option key={s} value={s}>{STATUS_INFO[s].label}</option>)}
                </select>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <button style={btnSmall} onClick={() => setVisualizando(c)}>👁️ Ver</button>
                  <button style={btnSmall} onClick={() => abrirImpressao(htmlDe(c), c.numero)}>🖨️ PDF</button>
                  <button style={btnSmall} onClick={() => exportarDOCX(htmlDe(c), c.numero)}>📄 DOCX</button>
                  <button style={btnSmall} onClick={() => editarContrato(c)}>✏️ Nova versão</button>
                  <button style={btnSmall} onClick={() => setHistoricoDe(c)}>🕘 Histórico</button>
                  <button style={{ ...btnSmall, color: "#b91c1c" }} onClick={() => excluir(c)}>🗑️</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {visualizando && (
        <Modal title={`${visualizando.numero} — ${visualizando.titulo}`} onClose={() => setVisualizando(null)} wide>
          <style dangerouslySetInnerHTML={{ __html: DOC_CSS }} />
          <div dangerouslySetInnerHTML={{ __html: htmlDe(visualizando) }} />
        </Modal>
      )}

      {historicoDe && (
        <Modal title={`Histórico de versões — ${historicoDe.numero}`} onClose={() => setHistoricoDe(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[...historicoDe.versoes].reverse().map((v) => (
              <div key={v.versao} style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ fontSize: "0.84rem" }}>Versão {v.versao}</strong>
                  <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
                    {new Date(v.data).toLocaleString("pt-BR")} · {v.autor}
                  </span>
                </div>
                <p style={{ fontSize: "0.78rem", color: "#475569", margin: "4px 0 8px" }}>{v.descricao} — {v.clausulas.length} cláusulas</p>
                {v.versao !== historicoDe.versao && (
                  <button
                    style={btnSmall}
                    onClick={() => {
                      dlg.confirmar(
                        `Restaurar a versão ${v.versao}? Uma nova versão será criada com esse conteúdo.`,
                        () => {
                          const agora = new Date().toISOString();
                          setContratos((prev) => prev.map((c) => {
                            if (c.id !== historicoDe.id) return c;
                            const novaVersao = c.versao + 1;
                            return {
                              ...c,
                              dados: v.dados, clausulas: v.clausulas, versao: novaVersao, atualizadoEm: agora,
                              versoes: [...c.versoes, {
                                versao: novaVersao, data: agora, autor: "Administrador",
                                descricao: `Restauração da versão ${v.versao}`,
                                clausulas: v.clausulas, dados: v.dados,
                              }],
                            };
                          }));
                          setHistoricoDe(null);
                        },
                        { titulo: "Restaurar versão", okLabel: "Restaurar", icone: "↩️" },
                      );
                    }}
                  >
                    ↩️ Restaurar esta versão
                  </button>
                )}
              </div>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ═══ GUIA: MODELOS ═══════════════════════════════════════════ */

function GuiaModelos({
  modelos, setModelos, clausulas, setClausulas, regras, setRegras,
}: {
  modelos: ModeloContrato[];
  setModelos: React.Dispatch<React.SetStateAction<ModeloContrato[]>>;
  clausulas: Clausula[];
  setClausulas: React.Dispatch<React.SetStateAction<Clausula[]>>;
  regras: Regra[];
  setRegras: React.Dispatch<React.SetStateAction<Regra[]>>;
}) {
  const dlg = useDialogo();
  const [editando, setEditando] = useState<ModeloContrato | null>(null);

  const duplicar = (m: ModeloContrato) => {
    setModelos((prev) => [...prev, { ...m, id: uid(), nome: m.nome + " (cópia)", versao: 1 }]);
  };

  const excluir = (m: ModeloContrato) => {
    dlg.confirmar(
      `Excluir o modelo "${m.nome}"? Contratos já criados a partir dele não serão afetados.`,
      () => setModelos((prev) => prev.filter((x) => x.id !== m.id)),
      { titulo: "Excluir modelo", perigo: true, okLabel: "Excluir" },
    );
  };

  const exportarModelo = (m: ModeloContrato) => {
    const clausulasDoModelo = clausulas.filter(
      (c) => m.clausulasObrigatorias.includes(c.id) || m.clausulasOpcionais.includes(c.id),
    );
    baixarArquivo(
      JSON.stringify({ modelo: m, clausulas: clausulasDoModelo }, null, 2),
      `modelo-${m.nome.toLowerCase().replace(/\s+/g, "-")}.json`,
      "application/json",
    );
  };

  const importarModelo = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(String(reader.result));
        const m: ModeloContrato = json.modelo ?? json;
        if (!m?.nome || !Array.isArray(m.campos)) throw new Error("formato inválido");
        setModelos((prev) => [...prev, { ...m, id: uid() }]);
      } catch {
        dlg.alertar("Importação falhou", "O arquivo selecionado não é um modelo válido. Exporte um modelo pelo botão 📤 Exportar e tente novamente.", "📥");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <label style={{ ...btnGhost, display: "inline-flex", alignItems: "center" }}>
          📥 Importar modelo (JSON)
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importarModelo(f); e.target.value = ""; }}
          />
        </label>
        <button
          style={btnPrimary}
          onClick={() =>
            setEditando({
              id: uid(), nome: "Novo modelo", categoria: "Geral", descricao: "", icone: "📄",
              cor: "#0f172a", status: "ativo", versao: 1,
              tituloDocumento: "Contrato", preambulo: "", fechamento: "",
              campos: [], clausulasObrigatorias: [], clausulasOpcionais: [], minAssinantes: 2,
            })
          }
        >
          + Novo modelo
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
        {modelos.map((m) => (
          <div key={m.id} style={{ ...cardStyle, padding: 0, overflow: "hidden", opacity: m.status === "ativo" ? 1 : 0.55 }}>
            <div style={{ height: 4, background: m.cor }} />
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "1.4rem" }}>{m.icone}</span>
                <strong style={{ fontSize: "0.92rem", flex: 1 }}>{m.nome}</strong>
                <Badge
                  bg={m.status === "ativo" ? "#f0fdf4" : "#f3f4f6"}
                  color={m.status === "ativo" ? "#065f46" : "#6b7280"}
                  label={m.status === "ativo" ? "Ativo" : "Inativo"}
                />
              </div>
              <span style={{ fontSize: "0.76rem", color: "#64748b", lineHeight: 1.45 }}>{m.descricao}</span>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge bg={m.cor + "18"} color={m.cor} label={m.categoria} />
                <Badge bg="#f1f5f9" color="#64748b" label={`${m.campos.length} campos`} />
                <Badge bg="#f1f5f9" color="#64748b" label={`${m.clausulasObrigatorias.length + m.clausulasOpcionais.length} cláusulas`} />
                <Badge bg="#f1f5f9" color="#64748b" label={`v${m.versao}`} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 4 }}>
                <button style={btnSmall} onClick={() => setEditando(m)}>✏️ Editar</button>
                <button style={btnSmall} onClick={() => duplicar(m)}>⧉ Duplicar</button>
                <button style={btnSmall} onClick={() => exportarModelo(m)}>📤 Exportar</button>
                <button
                  style={btnSmall}
                  onClick={() => setModelos((prev) => prev.map((x) => x.id === m.id ? { ...x, status: x.status === "ativo" ? "inativo" : "ativo" } : x))}
                >
                  {m.status === "ativo" ? "⏸️ Desativar" : "▶️ Ativar"}
                </button>
                <button style={{ ...btnSmall, color: "#b91c1c" }} onClick={() => excluir(m)}>🗑️</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <Modal title={`Editar modelo — ${editando.nome}`} onClose={() => setEditando(null)} wide>
          <EditorModelo
            inicial={editando}
            clausulas={clausulas}
            setClausulas={setClausulas}
            regras={regras}
            setRegras={setRegras}
            onSalvar={(m) => {
              setModelos((prev) => {
                const existe = prev.some((x) => x.id === m.id);
                return existe
                  ? prev.map((x) => (x.id === m.id ? { ...m, versao: x.versao + 1 } : x))
                  : [...prev, m];
              });
              setEditando(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

const TIPOS_CAMPO: { v: CampoModelo["tipo"]; label: string }[] = [
  { v: "texto", label: "Texto" }, { v: "textarea", label: "Texto longo" },
  { v: "numero", label: "Número" }, { v: "valor", label: "Valor (R$)" },
  { v: "percentual", label: "Percentual" }, { v: "data", label: "Data" },
  { v: "hora", label: "Hora" }, { v: "cpf", label: "CPF" }, { v: "cnpj", label: "CNPJ" },
  { v: "rg", label: "RG" }, { v: "telefone", label: "Telefone" }, { v: "email", label: "E-mail" },
  { v: "cep", label: "CEP" }, { v: "select", label: "Seleção" }, { v: "checkbox", label: "Checkbox" },
];

function EditorModelo({
  inicial, clausulas, setClausulas, regras, setRegras, onSalvar,
}: {
  inicial: ModeloContrato;
  clausulas: Clausula[];
  setClausulas: React.Dispatch<React.SetStateAction<Clausula[]>>;
  regras: Regra[];
  setRegras: React.Dispatch<React.SetStateAction<Regra[]>>;
  onSalvar: (m: ModeloContrato) => void;
}) {
  const [m, setM] = useState<ModeloContrato>({ ...inicial });
  const [construtorAberto, setConstrutorAberto] = useState(false);
  const set = (patch: Partial<ModeloContrato>) => setM((prev) => ({ ...prev, ...patch }));

  const totalClausulasEstrutura = m.estrutura
    ? m.estrutura.capitulos.reduce((s, c) => s + c.itens.length, 0)
    : m.clausulasObrigatorias.length + m.clausulasOpcionais.length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 80px 90px", gap: 12 }}>
        <Field label="Nome" required>
          <input style={inputStyle} value={m.nome} onChange={(e) => set({ nome: e.target.value })} />
        </Field>
        <Field label="Categoria">
          <input style={inputStyle} value={m.categoria} onChange={(e) => set({ categoria: e.target.value })} />
        </Field>
        <Field label="Ícone">
          <input style={inputStyle} value={m.icone} onChange={(e) => set({ icone: e.target.value })} />
        </Field>
        <Field label="Cor">
          <input style={{ ...inputStyle, padding: 4, height: 38 }} type="color" value={m.cor} onChange={(e) => set({ cor: e.target.value })} />
        </Field>
      </div>
      <Field label="Descrição">
        <input style={inputStyle} value={m.descricao} onChange={(e) => set({ descricao: e.target.value })} />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 160px", gap: 12 }}>
        <Field label="Título do documento" required>
          <input style={inputStyle} value={m.tituloDocumento} onChange={(e) => set({ tituloDocumento: e.target.value })} />
        </Field>
        <Field label="Mínimo de assinantes">
          <input style={inputStyle} type="number" min={1} value={m.minAssinantes} onChange={(e) => set({ minAssinantes: Math.max(1, parseInt(e.target.value || "1", 10)) })} />
        </Field>
      </div>
      <Field label="Preâmbulo (texto de abertura, aceita variáveis)">
        <textarea style={{ ...inputStyle, minHeight: 70 }} value={m.preambulo} onChange={(e) => set({ preambulo: e.target.value })} />
      </Field>
      <Field label="Fechamento (texto final, aceita variáveis)">
        <textarea style={{ ...inputStyle, minHeight: 60 }} value={m.fechamento} onChange={(e) => set({ fechamento: e.target.value })} />
      </Field>

      {/* Campos do formulário */}
      <div style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <strong style={{ fontSize: "0.86rem" }}>Campos do formulário ({m.campos.length})</strong>
          <button
            style={btnSmall}
            onClick={() => set({
              campos: [...m.campos, { id: uid(), label: "Novo campo", tipo: "texto", variavel: `CAMPO_${m.campos.length + 1}`, obrigatorio: false }],
            })}
          >
            + Campo
          </button>
        </div>
        {m.campos.map((c, i) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "2fr 130px 1.4fr 100px 36px", gap: 8, marginBottom: 8, alignItems: "center" }}>
            <input
              style={inputStyle} value={c.label} placeholder="Rótulo"
              onChange={(e) => set({ campos: m.campos.map((x, idx) => idx === i ? { ...x, label: e.target.value } : x) })}
            />
            <select
              style={inputStyle} value={c.tipo}
              onChange={(e) => set({ campos: m.campos.map((x, idx) => idx === i ? { ...x, tipo: e.target.value as CampoModelo["tipo"] } : x) })}
            >
              {TIPOS_CAMPO.map((t) => <option key={t.v} value={t.v}>{t.label}</option>)}
            </select>
            <input
              style={{ ...inputStyle, fontFamily: "monospace" }} value={c.variavel} placeholder="VARIAVEL"
              onChange={(e) => set({ campos: m.campos.map((x, idx) => idx === i ? { ...x, variavel: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") } : x) })}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.72rem", color: "#475569" }}>
              <input
                type="checkbox" checked={c.obrigatorio}
                onChange={(e) => set({ campos: m.campos.map((x, idx) => idx === i ? { ...x, obrigatorio: e.target.checked } : x) })}
              />
              Obrig.
            </label>
            <button style={{ ...btnSmall, color: "#b91c1c" }} onClick={() => set({ campos: m.campos.filter((_, idx) => idx !== i) })}>🗑️</button>
          </div>
        ))}
        {m.campos.some((c) => c.tipo === "select") && (
          <p style={{ fontSize: "0.72rem", color: "#94a3b8", margin: "6px 0 0" }}>
            Campos de seleção usam as opções definidas no modelo original; edite via exportar/importar JSON para opções personalizadas.
          </p>
        )}
      </div>

      {/* Cláusulas do modelo — Construtor Visual (CLM) */}
      <div style={{
        border: "1px solid #e2e8f0", borderRadius: 12, padding: 18,
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#fff",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <strong style={{ fontSize: "0.98rem", display: "block" }}>🎨 Cláusulas do Modelo — Construtor Visual</strong>
            <p style={{ fontSize: "0.78rem", color: "#cbd5e1", margin: "4px 0 0", lineHeight: 1.5 }}>
              Monte o contrato arrastando cláusulas, organize em capítulos, defina status,
              dependências, regras automáticas e IA jurídica, com preview em tempo real.
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <span style={{ ...chipStyle("rgba(255,255,255,0.12)", "#fff") }}>
                {totalClausulasEstrutura} cláusula(s)
              </span>
              <span style={{ ...chipStyle("rgba(255,255,255,0.12)", "#fff") }}>
                {m.estrutura ? `${m.estrutura.capitulos.length} capítulo(s)` : "estrutura simples"}
              </span>
            </div>
          </div>
          <button
            style={{ background: "#10b981", color: "#fff", border: "none", borderRadius: 10, padding: "12px 22px", fontSize: "0.88rem", fontWeight: 700, cursor: "pointer" }}
            onClick={() => setConstrutorAberto(true)}
          >
            {totalClausulasEstrutura > 0 ? "Abrir Construtor Visual →" : "Montar contrato →"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={btnPrimary} onClick={() => onSalvar(m)}>Salvar modelo</button>
      </div>

      {construtorAberto && (
        <ConstrutorModelo
          modelo={m}
          clausulas={clausulas}
          setClausulas={setClausulas}
          regras={regras}
          setRegras={setRegras}
          onSalvar={(mm) => setM(mm)}
          onFechar={() => setConstrutorAberto(false)}
        />
      )}
    </div>
  );
}

function chipStyle(bg: string, color: string): React.CSSProperties {
  return { display: "inline-block", background: bg, color, borderRadius: 999, padding: "3px 10px", fontSize: "0.72rem", fontWeight: 700 };
}

/* ═══ GUIA: CLÁUSULAS (biblioteca + editor) ═══════════════════ */

const VARIAVEIS_SUGERIDAS = [
  "CONTRATANTE", "CONTRATADO", "CPF_CONTRATANTE", "CNPJ_CONTRATANTE",
  "CPF_CONTRATADO", "CNPJ_CONTRATADO", "ENDERECO_CONTRATANTE", "ENDERECO_CONTRATADO",
  "EMAIL_CONTRATANTE", "TELEFONE_CONTRATANTE", "VALOR", "VALOR_EXTENSO",
  "DATA", "DATA_EXTENSO", "DATA_INICIO", "DATA_FIM", "PRAZO", "CIDADE_FORO",
  "FORMA_PAGAMENTO", "DESCRICAO_SERVICOS", "PERCENTUAL_MULTA", "PRAZO_GARANTIA",
];

function GuiaClausulas({
  clausulas, setClausulas,
}: {
  clausulas: Clausula[];
  setClausulas: React.Dispatch<React.SetStateAction<Clausula[]>>;
}) {
  const dlg = useDialogo();
  const [busca, setBusca] = useState("");
  const [filtroCat, setFiltroCat] = useState("todas");
  const [soFavoritas, setSoFavoritas] = useState(false);
  const [editando, setEditando] = useState<Clausula | null>(null);

  const categorias = [...new Set(clausulas.map((c) => c.categoria))].sort();

  const filtradas = clausulas.filter((c) => {
    if (filtroCat !== "todas" && c.categoria !== filtroCat) return false;
    if (soFavoritas && !c.favorita) return false;
    if (!busca) return true;
    const q = busca.toLowerCase();
    return (
      c.titulo.toLowerCase().includes(q) ||
      c.texto.toLowerCase().includes(q) ||
      c.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  const novaClausula = (): Clausula => ({
    id: uid(), titulo: "", categoria: "Geral", descricao: "", texto: "",
    tags: [], versao: 1, autor: "Administrador", criadaEm: new Date().toISOString(),
    status: "ativa", favorita: false,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 240 }}
          placeholder="🔍 Buscar cláusula por título, texto ou tag..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select style={{ ...inputStyle, width: 180 }} value={filtroCat} onChange={(e) => setFiltroCat(e.target.value)}>
          <option value="todas">Todas as categorias</option>
          {categorias.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.8rem", color: "#475569" }}>
          <input type="checkbox" checked={soFavoritas} onChange={(e) => setSoFavoritas(e.target.checked)} />
          ⭐ Só favoritas
        </label>
        <button style={btnPrimary} onClick={() => setEditando(novaClausula())}>+ Nova cláusula</button>
      </div>

      {filtradas.length === 0 ? (
        <div style={cardStyle}><Vazio msg="Nenhuma cláusula encontrada" /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {filtradas.map((c) => (
            <div key={c.id} style={{ ...cardStyle, padding: 14, display: "flex", flexDirection: "column", gap: 8, opacity: c.status === "ativa" ? 1 : 0.55 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1rem", padding: 0 }}
                  title={c.favorita ? "Remover dos favoritos" : "Favoritar"}
                  onClick={() => setClausulas((prev) => prev.map((x) => x.id === c.id ? { ...x, favorita: !x.favorita } : x))}
                >
                  {c.favorita ? "⭐" : "☆"}
                </button>
                <strong style={{ fontSize: "0.86rem", flex: 1 }}>{c.titulo}</strong>
                <Badge bg="#f1f5f9" color="#64748b" label={`v${c.versao}`} />
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <Badge bg="#eff6ff" color="#1e40af" label={c.categoria} />
                {c.tags.slice(0, 3).map((t) => <Badge key={t} bg="#f1f5f9" color="#64748b" label={`#${t}`} />)}
              </div>
              <p style={{ fontSize: "0.76rem", color: "#64748b", margin: 0, lineHeight: 1.5, flex: 1 }}>
                {c.texto.slice(0, 150)}{c.texto.length > 150 ? "…" : ""}
              </p>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={btnSmall} onClick={() => setEditando(c)}>✏️ Editar</button>
                <button
                  style={btnSmall}
                  onClick={() => setClausulas((prev) => [...prev, { ...c, id: uid(), titulo: c.titulo + " (cópia)", versao: 1, criadaEm: new Date().toISOString() }])}
                >
                  ⧉ Duplicar
                </button>
                <button
                  style={btnSmall}
                  onClick={() => setClausulas((prev) => prev.map((x) => x.id === c.id ? { ...x, status: x.status === "ativa" ? "inativa" : "ativa" } : x))}
                >
                  {c.status === "ativa" ? "⏸️" : "▶️"}
                </button>
                <button
                  style={{ ...btnSmall, color: "#b91c1c" }}
                  onClick={() => {
                    dlg.confirmar(
                      `Excluir a cláusula "${c.titulo}" da biblioteca? Modelos que a utilizam deixarão de encontrá-la.`,
                      () => setClausulas((prev) => prev.filter((x) => x.id !== c.id)),
                      { titulo: "Excluir cláusula", perigo: true, okLabel: "Excluir" },
                    );
                  }}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editando && (
        <Modal title={editando.titulo ? `Editar cláusula — ${editando.titulo}` : "Nova cláusula"} onClose={() => setEditando(null)} wide>
          <EditorClausula
            inicial={editando}
            onSalvar={(c) => {
              setClausulas((prev) => {
                const existe = prev.some((x) => x.id === c.id);
                return existe
                  ? prev.map((x) => x.id === c.id ? { ...c, versao: x.texto !== c.texto ? x.versao + 1 : x.versao } : x)
                  : [...prev, c];
              });
              setEditando(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function EditorClausula({ inicial, onSalvar }: { inicial: Clausula; onSalvar: (c: Clausula) => void }) {
  const [c, setC] = useState<Clausula>({ ...inicial });
  const [tagsTexto, setTagsTexto] = useState(inicial.tags.join(", "));
  const [erro, setErro] = useState("");

  const inserirVariavel = (v: string) => {
    setC((prev) => ({ ...prev, texto: prev.texto + `{{${v}}}` }));
  };

  const previewVars: Record<string, string> = {
    CONTRATANTE: "MARIA DA SILVA", CONTRATADO: "EMPRESA EXEMPLO LTDA",
    VALOR: "R$ 12.500,00", VALOR_EXTENSO: "doze mil e quinhentos reais",
    DATA: new Date().toLocaleDateString("pt-BR"),
    DATA_EXTENSO: new Date().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" }),
    PRAZO: "12 (doze) meses", CIDADE_FORO: "Uberaba/MG",
    FORMA_PAGAMENTO: "Parcelado em 10x", DESCRICAO_SERVICOS: "serviços contábeis mensais",
    PERCENTUAL_MULTA: "2% (dois por cento)", PRAZO_GARANTIA: "90 (noventa) dias",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {erro && <div style={{ background: "#fef2f2", color: "#b91c1c", borderRadius: 8, padding: "8px 12px", fontSize: "0.8rem" }}>{erro}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
        <Field label="Título" required>
          <input style={inputStyle} value={c.titulo} onChange={(e) => setC({ ...c, titulo: e.target.value })} />
        </Field>
        <Field label="Categoria">
          <input style={inputStyle} value={c.categoria} onChange={(e) => setC({ ...c, categoria: e.target.value })} />
        </Field>
      </div>
      <Field label="Descrição">
        <input style={inputStyle} value={c.descricao} onChange={(e) => setC({ ...c, descricao: e.target.value })} />
      </Field>
      <Field label="Tags (separadas por vírgula)">
        <input style={inputStyle} value={tagsTexto} onChange={(e) => setTagsTexto(e.target.value)} />
      </Field>

      <div>
        <span style={{ fontSize: "0.74rem", fontWeight: 600, color: "#475569" }}>Inserir variável:</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
          {VARIAVEIS_SUGERIDAS.map((v) => (
            <button key={v} style={{ ...btnSmall, fontFamily: "monospace", fontSize: "0.68rem" }} onClick={() => inserirVariavel(v)}>
              {`{{${v}}}`}
            </button>
          ))}
        </div>
      </div>

      <Field label="Texto da cláusula" required>
        <textarea
          style={{ ...inputStyle, minHeight: 160, lineHeight: 1.6 }}
          value={c.texto}
          onChange={(e) => setC({ ...c, texto: e.target.value })}
        />
      </Field>

      {c.texto && (
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: 14 }}>
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>Pré-visualização (dados de exemplo)</span>
          <p style={{ fontSize: "0.82rem", color: "#334155", lineHeight: 1.7, margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
            {substituirVariaveis(c.texto, previewVars)}
          </p>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          style={btnPrimary}
          onClick={() => {
            if (!c.titulo.trim() || !c.texto.trim()) { setErro("Título e texto são obrigatórios."); return; }
            onSalvar({ ...c, tags: tagsTexto.split(",").map((t) => t.trim()).filter(Boolean) });
          }}
        >
          Salvar cláusula
        </button>
      </div>
    </div>
  );
}

/* ═══ GUIA: PARTES ════════════════════════════════════════════ */

function GuiaPartes({
  partes, setPartes,
}: {
  partes: Parte[];
  setPartes: React.Dispatch<React.SetStateAction<Parte[]>>;
}) {
  const dlg = useDialogo();
  const [busca, setBusca] = useState("");
  const [editando, setEditando] = useState<Parte | null>(null);
  const [criando, setCriando] = useState(false);

  const filtradas = partes.filter((p) => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return p.nome.toLowerCase().includes(q) || p.documento.includes(q) || p.cidade.toLowerCase().includes(q);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", gap: 10 }}>
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="🔍 Buscar por nome, CPF/CNPJ ou cidade..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <button style={btnPrimary} onClick={() => setCriando(true)}>+ Cadastrar pessoa</button>
      </div>

      {filtradas.length === 0 ? (
        <div style={cardStyle}><Vazio msg={partes.length === 0 ? "Nenhuma pessoa cadastrada. As pessoas ficam disponíveis para reutilização em todos os contratos." : "Ninguém encontrado"} /></div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {filtradas.map((p) => (
            <div key={p.id} style={{ ...cardStyle, padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{
                  width: 34, height: 34, borderRadius: "50%", background: "#0f172a", color: "#fff",
                  display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700,
                }}>
                  {p.nome.slice(0, 2).toUpperCase()}
                </span>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "0.86rem", display: "block" }}>{p.nome}</strong>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{p.tipoPessoa} · {p.documento}</span>
                </div>
                <Badge bg="#eff6ff" color="#1e40af" label={p.papelPadrao} />
              </div>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {[p.email, p.telefone].filter(Boolean).join(" · ") || "Sem contato"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                {[p.logradouro, p.numero, p.cidade && `${p.cidade}/${p.uf}`].filter(Boolean).join(", ") || "Sem endereço"}
              </span>
              <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                <button style={btnSmall} onClick={() => setEditando(p)}>✏️ Editar</button>
                <button
                  style={{ ...btnSmall, color: "#b91c1c" }}
                  onClick={() => {
                    dlg.confirmar(
                      `Excluir "${p.nome}" do cadastro de pessoas? Contratos existentes que usam esta pessoa perderão a referência.`,
                      () => setPartes((prev) => prev.filter((x) => x.id !== p.id)),
                      { titulo: "Excluir pessoa", perigo: true, okLabel: "Excluir" },
                    );
                  }}
                >
                  🗑️ Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(criando || editando) && (
        <Modal title={editando ? `Editar — ${editando.nome}` : "Cadastrar pessoa"} onClose={() => { setCriando(false); setEditando(null); }}>
          <FormParte
            inicial={editando ?? undefined}
            onSalvar={(p) => {
              setPartes((prev) => {
                const existe = prev.some((x) => x.id === p.id);
                return existe ? prev.map((x) => (x.id === p.id ? p : x)) : [...prev, p];
              });
              setCriando(false);
              setEditando(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

/* ═══ GUIA: REGRAS (motor de regras sem programação) ══════════ */

function GuiaRegras({
  regras, setRegras, clausulas,
}: {
  regras: Regra[];
  setRegras: React.Dispatch<React.SetStateAction<Regra[]>>;
  clausulas: Clausula[];
}) {
  const dlg = useDialogo();
  const [editando, setEditando] = useState<Regra | null>(null);

  const novaRegra = (): Regra => ({
    id: uid(), nome: "", campo: "VALOR", operador: ">", valor: "",
    clausulaId: clausulas[0]?.id ?? "", ativa: true,
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ ...cardStyle, background: "#f8fafc" }}>
        <strong style={{ fontSize: "0.9rem" }}>⚙️ Motor de regras</strong>
        <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "4px 0 0", lineHeight: 1.5 }}>
          Crie regras do tipo <strong>SE campo [condição] valor ENTÃO adicionar cláusula</strong>.
          As regras são aplicadas automaticamente ao montar as cláusulas de um novo contrato.
          Ex.: SE VALOR &gt; 5000 ENTÃO adicionar cláusula de garantia.
        </p>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={btnPrimary} onClick={() => setEditando(novaRegra())}>+ Nova regra</button>
      </div>

      {regras.length === 0 ? (
        <div style={cardStyle}><Vazio msg="Nenhuma regra criada" /></div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {regras.map((r) => {
            const cl = clausulas.find((c) => c.id === r.clausulaId);
            const op = OPERADORES.find((o) => o.v === r.operador);
            return (
              <div key={r.id} style={{ ...cardStyle, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, opacity: r.ativa ? 1 : 0.5 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: "0.84rem" }}>{r.nome || "(sem nome)"}</strong>
                  <div style={{ fontSize: "0.78rem", color: "#475569", marginTop: 2 }}>
                    <span style={{ background: "#eff6ff", color: "#1e40af", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>SE</span>
                    {" "}<code>{r.campo}</code> {op?.label} <code>{r.valor}</code>{" "}
                    <span style={{ background: "#f0fdf4", color: "#065f46", borderRadius: 4, padding: "1px 6px", fontWeight: 700 }}>ENTÃO</span>
                    {" "}adicionar <strong>{cl?.titulo ?? "cláusula removida"}</strong>
                  </div>
                </div>
                <label style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.74rem", color: "#475569" }}>
                  <input
                    type="checkbox" checked={r.ativa}
                    onChange={(e) => setRegras((prev) => prev.map((x) => x.id === r.id ? { ...x, ativa: e.target.checked } : x))}
                  />
                  Ativa
                </label>
                <button style={btnSmall} onClick={() => setEditando(r)}>✏️</button>
                <button
                  style={{ ...btnSmall, color: "#b91c1c" }}
                  onClick={() => {
                    dlg.confirmar(
                      `Excluir a regra "${r.nome}"? Ela deixará de ser aplicada em novos contratos.`,
                      () => setRegras((prev) => prev.filter((x) => x.id !== r.id)),
                      { titulo: "Excluir regra", perigo: true, okLabel: "Excluir" },
                    );
                  }}
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}

      {editando && (
        <Modal title={editando.nome ? `Editar regra — ${editando.nome}` : "Nova regra"} onClose={() => setEditando(null)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Nome da regra" required>
              <input
                style={inputStyle} value={editando.nome} placeholder="ex: Valor alto → garantia"
                onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
              />
            </Field>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <Field label="SE o campo (variável)" required>
                <input
                  style={{ ...inputStyle, fontFamily: "monospace" }} value={editando.campo} placeholder="VALOR"
                  onChange={(e) => setEditando({ ...editando, campo: e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, "_") })}
                />
              </Field>
              <Field label="Condição" required>
                <select style={inputStyle} value={editando.operador} onChange={(e) => setEditando({ ...editando, operador: e.target.value as OperadorRegra })}>
                  {OPERADORES.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
                </select>
              </Field>
              <Field label="Valor" required>
                <input style={inputStyle} value={editando.valor} onChange={(e) => setEditando({ ...editando, valor: e.target.value })} />
              </Field>
            </div>
            <Field label="ENTÃO adicionar a cláusula" required>
              <select style={inputStyle} value={editando.clausulaId} onChange={(e) => setEditando({ ...editando, clausulaId: e.target.value })}>
                {clausulas.filter((c) => c.status === "ativa").map((c) => (
                  <option key={c.id} value={c.id}>{c.titulo} ({c.categoria})</option>
                ))}
              </select>
            </Field>
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                style={btnPrimary}
                onClick={() => {
                  if (!editando.nome.trim() || !editando.campo || !editando.clausulaId) return;
                  setRegras((prev) => {
                    const existe = prev.some((x) => x.id === editando.id);
                    return existe ? prev.map((x) => (x.id === editando.id ? editando : x)) : [...prev, editando];
                  });
                  setEditando(null);
                }}
              >
                Salvar regra
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
