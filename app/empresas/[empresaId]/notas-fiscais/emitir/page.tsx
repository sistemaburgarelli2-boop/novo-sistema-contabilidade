"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { buscarEmpresaTenant, listarEmpresasTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

/* ─────────────────────────── Paleta do portal NFS-e ─────────────────────────── */
const P = {
  azul: "#37418c",          // azul do stepper ativo / botão avançar
  azulTexto: "#3f4b96",
  verde: "#6f9a72",         // títulos das seções
  cinzaSecao: "#f5f5f5",
  borda: "#e0e0e0",
  bordaSecao: "#e4e4e4",
  input: "#e9e9e9",
  inputBorda: "#dcdcdc",
  texto: "#3c3c3c",
  labelCor: "#4a4a4a",
  inativo: "#9e9e9e",
  danger: "#c62828",
  botaoCinza: "#6f6f6f",
};

/* ─────────────────────────── Tipos ─────────────────────────── */
type ItemServico = {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  codigo_servico: string;
  aliquota_iss: number;
};

const emptyItem: ItemServico = {
  descricao: "", quantidade: 1, valor_unitario: 0,
  codigo_servico: "", aliquota_iss: 5,
};

type SimNao = "" | "sim" | "nao";

/** Servico salvo pela empresa para reemitir sem redigitar nada. */
type ServicoFavorito = {
  id: string;
  nome: string;
  modo?: "simplificada" | "completa";
  modelo: string;
  natureza: string;
  observacoes: string;
  itens: ItemServico[];
  aliquota_pis: number;
  aliquota_cofins: number;
  aliquota_icms: number;
  codigo_municipio: string;
  criado_em: string;
};

/* Cliente cadastrado (empresa do tenant) usado como tomador */
type ClienteTomador = {
  id: string;
  nome: string;
  nomeFantasia: string;
  documento: string;
  email: string;
  telefone: string;
  inscricaoMunicipal: string;
  cep: string;
  logradouro: string;
  numero: string;
  bairro: string;
  cidade: string;
  uf: string;
};

const soDigitos = (v: string) => v.replace(/\D/g, "");

function mapEmpresaParaCliente(e: Empresa): ClienteTomador {
  const m = (e.metadata || {}) as Record<string, unknown>;
  const s = (...chaves: string[]) => {
    for (const c of chaves) {
      const v = m[c];
      if (typeof v === "string" && v.trim()) return v.trim();
    }
    return "";
  };
  return {
    id: e.id,
    nome: e.nome_legal || s("razao_social", "nome_completo"),
    nomeFantasia: e.nome_fantasia || s("nome_fantasia"),
    documento: e.cnpj?.trim() || s("cnpj", "cpf"),
    email: s("email_empresa", "email_principal", "email_fiscal", "email_financeiro", "email_portal"),
    telefone: s("telefone_empresa", "telefone", "whatsapp", "telefone_portal"),
    inscricaoMunicipal: s("inscricao_municipal"),
    cep: s("cep_empresa", "cep"),
    logradouro: s("logradouro_empresa", "logradouro"),
    numero: s("numero_empresa", "numero"),
    bairro: s("bairro_empresa", "bairro"),
    cidade: s("cidade_empresa") || e.cidade || s("cidade"),
    uf: s("uf_empresa") || e.estado || s("uf"),
  };
}
type Localizacao = "brasil" | "exterior" | "nao_informado";
type Municipio = { id: number; nome: string };

/* ─────────────────────────── Estilos base ─────────────────────────── */
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", border: `1px solid ${P.inputBorda}`,
  borderRadius: 2, fontSize: 14, color: P.texto, background: P.input, outline: "none",
  boxSizing: "border-box", height: 36,
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13.5, color: P.labelCor, marginBottom: 5,
};

function Field({ label, required, hint, children }: {
  label: string; required?: boolean; hint?: string; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>
        {label}
        {required && <span style={{ color: P.danger, marginLeft: 3 }}>*</span>}
        {hint && <Ajuda titulo={hint} />}
      </label>
      {children}
    </div>
  );
}

function Ajuda({ titulo }: { titulo: string }) {
  return (
    <span title={titulo} style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 14, height: 14, borderRadius: "50%", border: `1px solid ${P.inativo}`,
      color: P.inativo, fontSize: 10, fontWeight: 700, marginLeft: 6, cursor: "help",
      verticalAlign: "middle",
    }}>?</span>
  );
}

function IconeEstrela({ preenchida }: { preenchida?: boolean }) {
  return (
    <svg width={16} height={16} viewBox="0 0 24 24" fill={preenchida ? "currentColor" : "none"}>
      <path
        d="M12 3.5l2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.9l-5.25 2.75 1-5.85L3.5 9.65l5.9-.85L12 3.5z"
        stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"
      />
    </svg>
  );
}

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section style={{
      background: P.cinzaSecao, border: `1px solid ${P.bordaSecao}`,
      borderLeft: "none", borderRight: "none", padding: "18px 26px", marginBottom: 10,
    }}>
      <h3 style={{
        margin: "0 0 14px", fontSize: 16, fontWeight: 500, color: P.verde,
        textTransform: "uppercase", letterSpacing: 0.3,
      }}>{titulo}</h3>
      {children}
    </section>
  );
}

function Radio({ label, checked, onChange, name }: {
  label: string; checked: boolean; onChange: () => void; name: string;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 8, fontSize: 13.5,
      color: P.labelCor, cursor: "pointer", marginBottom: 7,
    }}>
      <input type="radio" name={name} checked={checked} onChange={onChange}
        style={{ accentColor: P.azul, width: 14, height: 14, margin: 0, cursor: "pointer" }} />
      {label}
    </label>
  );
}

function Check({ label, checked, onChange }: {
  label: string; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <label style={{
      display: "flex", alignItems: "center", gap: 8, fontSize: 13.5,
      color: P.labelCor, cursor: "pointer",
    }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        style={{ accentColor: P.azul, width: 14, height: 14, margin: 0, cursor: "pointer" }} />
      {label}
    </label>
  );
}

const grid = (cols: number): React.CSSProperties => ({
  display: "grid", gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: "0 28px",
});

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/* ─────────────────────────── Stepper ─────────────────────────── */
const ETAPAS = [
  { n: 1, nome: "Pessoas" },
  { n: 2, nome: "Serviço" },
  { n: 3, nome: "Valores" },
  { n: 4, nome: "Emitir NFS-e" },
];

function IconeEtapa({ n, ativo }: { n: number; ativo: boolean }) {
  const cor = ativo ? "#fff" : "#8a8a8a";
  const props = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none" as const };
  if (n === 1) return (
    <svg {...props}><path d="M17 20v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87m0 0a3 3 0 100-6 3 3 0 000 6zM6.5 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm11 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke={cor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  if (n === 2) return (
    <svg {...props}><path d="M14.7 6.3a4 4 0 01-5.4 5.4L5 16l3 3 4.3-4.3a4 4 0 015.4-5.4l-2.5 2.5-2.1-2.1L14.7 6.3z" stroke={cor} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  );
  if (n === 3) return (
    <svg {...props}><path d="M12 4v16M15.5 8.5c0-1.4-1.6-2.2-3.5-2.2s-3.5.8-3.5 2.2 1.6 2 3.5 2.4 3.5 1 3.5 2.6-1.6 2.3-3.5 2.3-3.5-.9-3.5-2.3" stroke={cor} strokeWidth="1.6" strokeLinecap="round" /></svg>
  );
  return (
    <svg {...props}><path d="M7 3h7l4 4v14H7V3z" stroke={cor} strokeWidth="1.6" strokeLinejoin="round" /><path d="M9.5 12h5M9.5 15h5M9.5 9h2.5" stroke={cor} strokeWidth="1.4" strokeLinecap="round" /></svg>
  );
}

function Stepper({ atual, onIr }: { atual: number; onIr: (n: number) => void }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", padding: "24px 40px 18px", background: "#fff" }}>
      {ETAPAS.map((e, i) => (
        <div key={e.n} style={{ display: "flex", alignItems: "flex-start", flex: i < ETAPAS.length - 1 ? 1 : "0 0 auto" }}>
          <div
            onClick={() => e.n < atual && onIr(e.n)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              minWidth: 96, cursor: e.n < atual ? "pointer" : "default",
            }}
          >
            <div style={{
              width: 46, height: 46, borderRadius: "50%",
              background: e.n === atual ? P.azul : "#fff",
              border: `2px solid ${e.n === atual ? P.azul : "#bdbdbd"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconeEtapa n={e.n} ativo={e.n === atual} />
            </div>
            <span style={{
              fontSize: 13.5, color: e.n === atual ? P.azulTexto : "#6f6f6f",
              fontWeight: e.n === atual ? 600 : 400, whiteSpace: "nowrap",
            }}>{e.nome}</span>
          </div>
          {i < ETAPAS.length - 1 && (
            <div style={{ flex: 1, height: 1, background: "#d8d8d8", marginTop: 23 }} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────── Página ─────────────────────────── */
export default function EmitirNotaPage() {
  return (
    <Suspense fallback={<AppShell><div style={{ textAlign: "center", padding: 60, color: P.inativo }}>Carregando...</div></AppShell>}>
      <EmitirNotaConteudo />
    </Suspense>
  );
}

function EmitirNotaConteudo() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const empresaId = params.empresaId as string;
  const simplificada = searchParams.get("modo") === "simplificada";

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [etapa, setEtapa] = useState(1);
  const [emitindo, setEmitindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ numero: string; chave: string; protocolo?: string; viaSefaz?: boolean; notaId?: string } | null>(null);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [erroEmail, setErroEmail] = useState<string | null>(null);

  /* ── Etapa 1: Informações gerais ── */
  const [preencherIbsCbs, setPreencherIbsCbs] = useState<SimNao>("");
  const [dataCompetencia, setDataCompetencia] = useState(new Date().toISOString().slice(0, 10));
  const [informarDps, setInformarDps] = useState(false);
  const [serieDps, setSerieDps] = useState("");
  const [numeroDps, setNumeroDps] = useState("");

  /* ── Etapa 1: Emitente ── */
  const [emitenteComo, setEmitenteComo] = useState<"prestador" | "tomador" | "intermediario">("prestador");
  const [codigoMunicipio, setCodigoMunicipio] = useState("");
  const [indicadorMunicipalEmit, setIndicadorMunicipalEmit] = useState("");
  const [cpfEmitente, setCpfEmitente] = useState("");
  const [nomeEmitente, setNomeEmitente] = useState("");
  const [detalhesEmitente, setDetalhesEmitente] = useState(false);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [erroMunicipios, setErroMunicipios] = useState(false);

  /* ── Etapa 1: Compras governamentais ── */
  const [compraGov, setCompraGov] = useState<SimNao>("");

  /* ── Etapa 1: Tomador / Adquirente ── */
  const [tomadorLocal, setTomadorLocal] = useState<Localizacao>("brasil");
  const [destCnpj, setDestCnpj] = useState("");
  const [indicadorMunicipalTom, setIndicadorMunicipalTom] = useState("");
  const [destNome, setDestNome] = useState("");
  const [destTelefone, setDestTelefone] = useState("");
  const [destEmail, setDestEmail] = useState("");
  const [informarEndereco, setInformarEndereco] = useState(false);
  const [destEndereco, setDestEndereco] = useState("");
  const [destNumero, setDestNumero] = useState("");
  const [destBairro, setDestBairro] = useState("");
  const [destCep, setDestCep] = useState("");
  const [destCidade, setDestCidade] = useState("");
  const [destUf, setDestUf] = useState("");

  /* ── Clientes cadastrados (para preencher o tomador) ── */
  const [clientes, setClientes] = useState<ClienteTomador[]>([]);
  const [carregandoClientes, setCarregandoClientes] = useState(true);
  const [modalClientes, setModalClientes] = useState(false);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [sugestoesAbertas, setSugestoesAbertas] = useState(false);
  const [clienteVinculado, setClienteVinculado] = useState<ClienteTomador | null>(null);

  /* ── Etapa 1: Destinatário / Intermediário ── */
  const [destProprioAdquirente, setDestProprioAdquirente] = useState<SimNao>("");
  const [intermediarioLocal, setIntermediarioLocal] = useState<Localizacao>("nao_informado");
  const [intermediarioCnpj, setIntermediarioCnpj] = useState("");
  const [intermediarioNome, setIntermediarioNome] = useState("");

  /* ── Etapas 2 a 4 ── */
  const [modelo, setModelo] = useState<"nfse" | "55" | "65">("nfse");
  const [natureza, setNatureza] = useState("Prestação de serviços");
  const [itens, setItens] = useState<ItemServico[]>([{ ...emptyItem }]);
  const [observacoes, setObservacoes] = useState("");
  const [aliquotaPis, setAliquotaPis] = useState(0.65);
  const [aliquotaCofins, setAliquotaCofins] = useState(3);
  const [aliquotaIcms, setAliquotaIcms] = useState(0);
  const [tokenGovBr, setTokenGovBr] = useState("");
  const [ambiente, setAmbiente] = useState<"homologacao" | "producao">("homologacao");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");

  /* ── Serviços favoritos ── */
  const [favoritos, setFavoritos] = useState<ServicoFavorito[]>([]);
  const [favoritoId, setFavoritoId] = useState("");
  const [modalFavoritar, setModalFavoritar] = useState(false);
  const [nomeFavorito, setNomeFavorito] = useState("");
  const [salvandoFavorito, setSalvandoFavorito] = useState(false);
  const [erroFavorito, setErroFavorito] = useState<string | null>(null);
  const [favoritoSalvo, setFavoritoSalvo] = useState<string | null>(null);

  useEffect(() => {
    buscarEmpresaTenant(empresaId)
      .then(emp => {
        setEmpresa(emp);
        setNomeEmitente(emp?.nome_legal || "");
        setCpfEmitente(emp?.cnpj || "");
      })
      .catch(() => router.push("/empresas"))
      .finally(() => setCarregando(false));
  }, [empresaId, router]);

  // Municípios do estado da empresa (IBGE)
  useEffect(() => {
    const uf = empresa?.estado;
    if (!uf) return;
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((lista: Municipio[]) => setMunicipios(lista.map(m => ({ id: m.id, nome: m.nome }))))
      .catch(() => setErroMunicipios(true));
  }, [empresa?.estado]);

  // Clientes cadastrados no sistema (exceto a própria empresa emitente)
  useEffect(() => {
    listarEmpresasTenant()
      .then(lista => setClientes(
        lista.filter(e => e.id !== empresaId).map(mapEmpresaParaCliente)
      ))
      .catch(() => setClientes([]))
      .finally(() => setCarregandoClientes(false));
  }, [empresaId]);

  /** Preenche o bloco Tomador/Adquirente com os dados do cadastro do cliente. */
  const aplicarCliente = useCallback((c: ClienteTomador) => {
    setDestCnpj(c.documento);
    setDestNome(c.nome);
    setDestEmail(c.email);
    setDestTelefone(c.telefone);
    if (c.inscricaoMunicipal) setIndicadorMunicipalTom("1");
    const temEndereco = !!(c.cep || c.logradouro || c.cidade || c.uf);
    if (temEndereco) {
      setInformarEndereco(true);
      setDestCep(c.cep);
      setDestEndereco(c.logradouro);
      setDestNumero(c.numero);
      setDestBairro(c.bairro);
      setDestCidade(c.cidade);
      setDestUf(c.uf.toUpperCase());
    }
    setClienteVinculado(c);
    setModalClientes(false);
    setSugestoesAbertas(false);
    setBuscaCliente("");
    setErro(null);
  }, []);

  const limparCliente = () => {
    setClienteVinculado(null);
    setDestCnpj(""); setDestNome(""); setDestEmail(""); setDestTelefone("");
    setIndicadorMunicipalTom("");
    setDestCep(""); setDestEndereco(""); setDestNumero("");
    setDestBairro(""); setDestCidade(""); setDestUf("");
  };

  const clientesFiltrados = (termo: string) => {
    const t = termo.trim().toLowerCase();
    if (!t) return clientes;
    const digitos = soDigitos(termo);
    return clientes.filter(c =>
      c.nome.toLowerCase().includes(t) ||
      c.nomeFantasia.toLowerCase().includes(t) ||
      (!!digitos && soDigitos(c.documento).includes(digitos))
    );
  };

  const sugestoes = destCnpj.trim().length >= 2 && !clienteVinculado
    ? clientesFiltrados(destCnpj).slice(0, 6)
    : [];

  /** Aplica um favorito: o serviço fica pronto, restando emitir. */
  const aplicarFavorito = useCallback((fav: ServicoFavorito) => {
    setModelo((fav.modelo as "nfse" | "55" | "65") || "nfse");
    if (fav.natureza) setNatureza(fav.natureza);
    setItens(fav.itens.length ? fav.itens.map(i => ({ ...i })) : [{ ...emptyItem }]);
    setObservacoes(fav.observacoes || "");
    if (fav.aliquota_pis) setAliquotaPis(fav.aliquota_pis);
    if (fav.aliquota_cofins) setAliquotaCofins(fav.aliquota_cofins);
    if (fav.aliquota_icms) setAliquotaIcms(fav.aliquota_icms);
    if (fav.codigo_municipio) setCodigoMunicipio(fav.codigo_municipio);
    setFavoritoId(fav.id);
    setErro(null);
  }, []);

  // Serviços favoritos da empresa. Quando a URL traz ?favorito=<id> — escolha
  // feita no modal da listagem — ele ja entra aplicado.
  const favoritoDaUrl = searchParams.get("favorito");

  useEffect(() => {
    fetch(`/api/notas-fiscais/${empresaId}/favoritos`)
      .then(r => r.json())
      .then(json => {
        const lista: ServicoFavorito[] = json?.data?.favoritos ?? [];
        setFavoritos(lista);
        const escolhido = favoritoDaUrl ? lista.find(f => f.id === favoritoDaUrl) : null;
        if (escolhido) aplicarFavorito(escolhido);
      })
      .catch(() => setFavoritos([]));
  }, [empresaId, favoritoDaUrl, aplicarFavorito]);

  async function salvarFavorito() {
    const nome = nomeFavorito.trim();
    if (!nome) { setErroFavorito("Dê um nome ao serviço favorito."); return; }

    setSalvandoFavorito(true);
    setErroFavorito(null);
    try {
      const res = await fetch(`/api/notas-fiscais/${empresaId}/favoritos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          modo: simplificada ? "simplificada" : "completa",
          modelo,
          natureza,
          observacoes,
          itens,
          aliquota_pis: aliquotaPis,
          aliquota_cofins: aliquotaCofins,
          aliquota_icms: aliquotaIcms,
          codigo_municipio: codigoMunicipio,
        }),
      });
      const json = await res.json();
      if (!res.ok) { setErroFavorito(json.error || "Erro ao salvar favorito."); return; }
      setFavoritos(json.data.favoritos ?? []);
      setFavoritoSalvo(nome);
      setModalFavoritar(false);
      setNomeFavorito("");
    } catch {
      setErroFavorito("Erro de conexão.");
    } finally {
      setSalvandoFavorito(false);
    }
  }

  async function removerFavorito(id: string) {
    const res = await fetch(`/api/notas-fiscais/${empresaId}/favoritos?id=${id}`, { method: "DELETE" });
    const json = await res.json();
    if (res.ok) {
      setFavoritos(json.data.favoritos ?? []);
      if (favoritoId === id) setFavoritoId("");
    }
  }

  /** Seletor de serviço favorito, mostrado no topo dos dois formulários. */
  const blocoFavoritos = () => (
    <Secao titulo="Serviço favorito">
      {favoritos.length === 0 ? (
        <p style={{ margin: 0, fontSize: 13, color: P.inativo }}>
          Nenhum serviço favorito ainda. Ao terminar uma emissão, use <strong>Favoritar serviço</strong> para
          salvar os dados e reaproveitá-los aqui — bastando emitir na próxima vez.
        </p>
      ) : (
        <>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 260, marginBottom: 14 }}>
              <label style={labelStyle}>
                Preencher com um serviço salvo
                <Ajuda titulo="Preenche serviço, valores e observações do favorito escolhido." />
              </label>
              <select
                style={inputStyle}
                value={favoritoId}
                onChange={e => {
                  const fav = favoritos.find(f => f.id === e.target.value);
                  if (fav) aplicarFavorito(fav);
                  else setFavoritoId("");
                }}
              >
                <option value="">Selecione...</option>
                {favoritos.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.nome} — {formatBRL(f.itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0))}
                  </option>
                ))}
              </select>
            </div>
            {favoritoId && (
              <button
                type="button"
                onClick={() => removerFavorito(favoritoId)}
                style={{
                  marginBottom: 14, padding: "8px 14px", background: "#fff", color: P.danger,
                  border: `1px solid ${P.borda}`, borderRadius: 3, fontSize: 13.5, cursor: "pointer",
                }}
              >
                Remover favorito
              </button>
            )}
          </div>
          {favoritoId && (
            <div style={{ fontSize: 12.5, color: "#1b7a4b", display: "flex", alignItems: "center", gap: 8 }}>
              <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Serviço preenchido pelo favorito. Informe o tomador (se ainda não informou) e emita.
            </div>
          )}
        </>
      )}
    </Secao>
  );

  /** Modal que nomeia o favorito — aparece na tela de sucesso. */
  const modalFavorito = () => {
    if (!modalFavoritar) return null;
    return (
      <div
        onClick={() => setModalFavoritar(false)}
        style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
        }}
      >
        <div
          onClick={e => e.stopPropagation()}
          style={{ background: "#fff", borderRadius: 8, width: "100%", maxWidth: 460, padding: 24, textAlign: "left" }}
        >
          <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 700, color: P.texto }}>
            Favoritar serviço
          </h3>
          <p style={{ margin: "0 0 16px", fontSize: 13, color: P.inativo }}>
            Serão salvos: descrição, quantidade, valor, código do serviço, alíquotas, natureza e observações.
          </p>

          <Field label="Nome do favorito" required>
            <input
              autoFocus
              style={{ ...inputStyle, background: "#fff" }}
              value={nomeFavorito}
              onChange={e => setNomeFavorito(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") salvarFavorito(); }}
              placeholder="Ex: Honorários contábeis mensais"
              maxLength={80}
            />
          </Field>

          <div style={{
            background: P.cinzaSecao, border: `1px solid ${P.borda}`, borderRadius: 4,
            padding: 12, fontSize: 12.5, color: P.labelCor, marginBottom: 16,
          }}>
            {itens.filter(i => i.descricao).map((i, idx) => (
              <div key={idx} style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                <span>{i.descricao}</span>
                <span style={{ fontWeight: 600 }}>{formatBRL(i.quantidade * i.valor_unitario)}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, paddingTop: 6, borderTop: `1px solid ${P.borda}`, fontWeight: 700 }}>
              <span>Total</span>
              <span>{formatBRL(valorTotal)}</span>
            </div>
          </div>

          {erroFavorito && (
            <div style={{
              background: "#fdecea", border: "1px solid #f5c6c3", borderRadius: 4,
              padding: "8px 12px", color: "#b71c1c", fontSize: 13, marginBottom: 12,
            }}>
              {erroFavorito}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={() => setModalFavoritar(false)}
              style={{
                padding: "9px 18px", background: "#fff", color: "#5a5a5a",
                border: `1px solid ${P.borda}`, borderRadius: 4, fontSize: 14, cursor: "pointer",
              }}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={salvarFavorito}
              disabled={salvandoFavorito}
              style={{
                padding: "9px 20px", background: "#b7891f", color: "#fff", border: "none",
                borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer",
                opacity: salvandoFavorito ? 0.7 : 1,
              }}
            >
              {salvandoFavorito ? "Salvando..." : "Salvar favorito"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  /** Campo CPF/CNPJ do tomador com sugestões e busca nos clientes cadastrados. */
  const campoDocumentoTomador = () => (
    <>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <input style={{ ...inputStyle, paddingRight: 34 }} value={destCnpj}
            onChange={e => {
              setDestCnpj(e.target.value);
              setClienteVinculado(null);
              setSugestoesAbertas(true);
            }}
            onFocus={() => setSugestoesAbertas(true)}
            onBlur={() => setTimeout(() => setSugestoesAbertas(false), 150)}
            autoComplete="off"
            placeholder={tomadorLocal === "exterior" ? "Número de identificação" : "00.000.000/0000-00"} />
          <svg width={15} height={15} viewBox="0 0 24 24" fill="none" style={{ position: "absolute", right: 10, top: 10, pointerEvents: "none" }}>
            <circle cx="11" cy="11" r="7" stroke={P.inativo} strokeWidth="2" />
            <path d="M20 20l-3.5-3.5" stroke={P.inativo} strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Sugestões dos clientes cadastrados */}
          {sugestoesAbertas && sugestoes.length > 0 && (
            <div style={{
              position: "absolute", top: 38, left: 0, right: 0, zIndex: 30,
              background: "#fff", border: `1px solid ${P.borda}`, borderRadius: 3,
              boxShadow: "0 6px 18px rgba(0,0,0,.12)", maxHeight: 240, overflowY: "auto",
            }}>
              {sugestoes.map(c => (
                <div key={c.id}
                  onMouseDown={() => aplicarCliente(c)}
                  style={{ padding: "8px 12px", cursor: "pointer", borderBottom: `1px solid ${P.borda}` }}
                  onMouseEnter={e => (e.currentTarget.style.background = "#f0f3fb")}
                  onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                >
                  <div style={{ fontSize: 13.5, color: P.texto, fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: P.inativo }}>
                    {c.documento || "sem documento"}{c.cidade ? ` · ${c.cidade}/${c.uf}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => { setBuscaCliente(""); setModalClientes(true); }}
          title="Buscar em clientes cadastrados"
          style={{
            width: 38, height: 36, background: "#dcdcdc", border: `1px solid ${P.inputBorda}`,
            borderRadius: 2, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
          }}>
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <path d="M17 20v-2a4 4 0 00-3-3.87M9 20v-2a4 4 0 013-3.87m0 0a3 3 0 100-6 3 3 0 000 6zM6.5 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm11 0a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="#6f6f6f" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      {clienteVinculado && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginTop: 6,
          fontSize: 12.5, color: "#1b7a4b",
        }}>
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Dados carregados do cadastro de <strong>{clienteVinculado.nome}</strong>
          <button type="button" onClick={limparCliente} style={{
            background: "none", border: "none", color: P.danger, fontSize: 12.5,
            cursor: "pointer", textDecoration: "underline", padding: 0,
          }}>limpar</button>
        </div>
      )}
    </>
  );

  const addItem = () => setItens(prev => [...prev, { ...emptyItem }]);
  const removeItem = (idx: number) => {
    if (itens.length <= 1) return;
    setItens(prev => prev.filter((_, i) => i !== idx));
  };
  const updateItem = useCallback((idx: number, field: keyof ItemServico, value: string | number) => {
    setItens(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }, []);

  /* ── Cálculos ── */
  const subtotal = itens.reduce((s, item) => s + item.quantidade * item.valor_unitario, 0);
  const totalISS = modelo === "nfse"
    ? itens.reduce((s, item) => s + (item.quantidade * item.valor_unitario * item.aliquota_iss / 100), 0)
    : 0;
  const totalICMS = modelo !== "nfse" ? subtotal * aliquotaIcms / 100 : 0;
  const totalPIS = subtotal * aliquotaPis / 100;
  const totalCOFINS = subtotal * aliquotaCofins / 100;
  const totalImpostos = totalISS + totalICMS + totalPIS + totalCOFINS;
  const valorTotal = subtotal;
  const usandoSefaz = modelo === "nfse" && !!tokenGovBr.trim();

  /* ── Validação da etapa 1 (emissão completa) ── */
  function validarEtapa1(): string | null {
    if (simplificada) return validarSimplificada();
    if (!preencherIbsCbs) return "Informe se deseja preencher as informações IBS/CBS.";
    if (!dataCompetencia) return "Informe a data de competência.";
    if (informarDps && (!serieDps.trim() || !numeroDps.trim())) return "Informe a série e o número da DPS.";
    if (!codigoMunicipio) return "Selecione o município do emitente.";
    if (!compraGov) return "Informe se a operação é uma compra governamental.";
    if (tomadorLocal !== "nao_informado") {
      if (!destCnpj.trim()) return "Informe o CPF/CNPJ do tomador/adquirente.";
      if (!destNome.trim()) return "Informe o nome/razão social do tomador/adquirente.";
    }
    if (preencherIbsCbs === "sim" && !destProprioAdquirente) {
      return "Informe se o destinatário é o próprio adquirente.";
    }
    return null;
  }

  /* ── Validação da emissão simplificada ── */
  function validarSimplificada(): string | null {
    if (!dataCompetencia) return "Informe a data de competência.";
    if (!destCnpj.trim()) return "Informe o CPF/CNPJ do tomador.";
    if (!destNome.trim()) return "Informe o nome/razão social do tomador.";
    if (!itens.some(i => i.descricao.trim())) return "Descreva o serviço prestado.";
    if (subtotal <= 0) return "Informe o valor do serviço.";
    return null;
  }

  function avancar() {
    if (etapa === 1) {
      const e = validarEtapa1();
      if (e) { setErro(e); return; }
    }
    if (etapa === 2 && subtotal <= 0) {
      setErro("Adicione pelo menos um item com valor.");
      return;
    }
    setErro(null);
    setEtapa(n => Math.min(4, n + 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function voltar() {
    setErro(null);
    setEtapa(n => Math.max(1, n - 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function emitirNota() {
    if (simplificada) {
      const eSimples = validarSimplificada();
      if (eSimples) { setErro(eSimples); return; }
    } else {
      const e1 = validarEtapa1();
      if (e1) { setErro(e1); setEtapa(1); return; }
      if (subtotal <= 0) { setErro("Adicione pelo menos um item com valor."); setEtapa(2); return; }
    }

    setEmitindo(true);
    setErro(null);

    try {
      if (usandoSefaz) {
        const res = await fetch(`/api/notas-fiscais/${empresaId}/emitir`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenGovBr.trim(),
            ambiente,
            prestador: {
              cnpj: empresa?.cnpj || "",
              nomeRazaoSocial: empresa?.nome_legal || "",
              inscricaoMunicipal: inscricaoMunicipal || indicadorMunicipalEmit || undefined,
              codigoMunicipio: codigoMunicipio || "3550308",
              uf: empresa?.estado || "SP",
            },
            tomador: {
              cnpjCpf: destCnpj,
              nomeRazaoSocial: destNome,
              email: destEmail || undefined,
              telefone: destTelefone || undefined,
              endereco: destEndereco || undefined,
              cidade: destCidade || undefined,
              uf: destUf || undefined,
            },
            servicos: itens.map(item => ({
              codigoServico: item.codigo_servico,
              descricao: item.descricao,
              quantidade: item.quantidade,
              valorUnitario: item.valor_unitario,
              valorTotal: item.quantidade * item.valor_unitario,
              aliquotaISS: item.aliquota_iss,
            })),
            competencia: dataCompetencia.slice(0, 7),
            natureza_operacao: natureza,
            observacoes: observacoes || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setErro(json.error || "Erro ao emitir nota na SEFAZ.");
          return;
        }
        setSucesso({
          numero: json.data.nfse?.numero || json.data.nota?.numero || "",
          chave: json.data.nfse?.chaveAcesso || json.data.nota?.chave_acesso || "",
          protocolo: json.data.nfse?.protocolo || "",
          viaSefaz: true,
          notaId: json.data.nota?.id || "",
        });
      } else {
        const res = await fetch(`/api/notas-fiscais/${empresaId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelo,
            natureza_operacao: natureza,
            data_emissao: new Date(dataCompetencia + "T12:00:00").toISOString(),
            emitente_cnpj: empresa?.cnpj || "",
            emitente_nome: empresa?.nome_legal || "",
            destinatario_cnpj: destCnpj,
            destinatario_nome: destNome,
            valor_total: valorTotal,
            valor_produtos: modelo !== "nfse" ? subtotal : 0,
            valor_servicos: modelo === "nfse" ? subtotal : 0,
            valor_desconto: 0,
            valor_icms: totalICMS,
            valor_ipi: 0,
            valor_pis: totalPIS,
            valor_cofins: totalCOFINS,
            valor_iss: totalISS,
            valor_frete: 0,
          }),
        });
        const json = await res.json();
        if (!res.ok) {
          setErro(json.error || "Erro ao emitir nota.");
          return;
        }
        setSucesso({ numero: json.data.numero, chave: json.data.chave_acesso, viaSefaz: false, notaId: json.data.id });
      }
    } catch {
      setErro("Erro de conexão.");
    } finally {
      setEmitindo(false);
    }
  }

  if (carregando) {
    return <AppShell><div style={{ textAlign: "center", padding: 60, color: P.inativo }}>Carregando...</div></AppShell>;
  }

  /* ── Tela de sucesso ── */
  if (sucesso) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%", background: "#10b98118",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24, border: "3px solid #10b981",
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ margin: "0 0 8px", color: P.texto, fontSize: 24 }}>Nota fiscal emitida!</h2>
          <p style={{ color: P.inativo, fontSize: 15, marginBottom: 8 }}>
            Nota nº <strong>{sucesso.numero}</strong> emitida com sucesso.
          </p>
          {sucesso.viaSefaz ? (
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8,
              padding: "8px 14px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#166534",
            }}>
              Autorizada pela SEFAZ via NFS-e Nacional (gov.br)
            </div>
          ) : (
            <div style={{
              background: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 8,
              padding: "8px 14px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#92400e",
            }}>
              Registro interno — não transmitida à SEFAZ
            </div>
          )}
          <div style={{
            background: P.cinzaSecao, border: `1px solid ${P.borda}`, borderRadius: 10,
            padding: 16, marginBottom: 24, fontSize: 12, fontFamily: "monospace",
            wordBreak: "break-all", color: P.inativo,
          }}>
            Chave de acesso: {sucesso.chave}
            {sucesso.protocolo && <><br />Protocolo: {sucesso.protocolo}</>}
          </div>

          {/* ── Favoritar o serviço desta nota ── */}
          {favoritoSalvo ? (
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, fontSize: 14, fontWeight: 600, color: "#166534",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              <IconeEstrela preenchida />
              Serviço salvo como favorito: {favoritoSalvo}
            </div>
          ) : (
            <div style={{
              background: "#fff", border: `1px solid ${P.borda}`, borderRadius: 10,
              padding: 20, marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: P.texto, marginBottom: 6 }}>
                Favoritar serviço
              </div>
              <div style={{ fontSize: 13, color: P.inativo, marginBottom: 12 }}>
                Salve os dados deste serviço para as próximas emissões: basta escolher o favorito e emitir.
              </div>
              <button
                type="button"
                onClick={() => {
                  setNomeFavorito(itens.find(i => i.descricao)?.descricao?.slice(0, 60) || "");
                  setErroFavorito(null);
                  setModalFavoritar(true);
                }}
                style={{
                  padding: "10px 20px", background: "#b7891f", color: "#fff", border: "none",
                  borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <IconeEstrela />
                Favoritar serviço
              </button>
            </div>
          )}

          {destEmail && !emailEnviado && (
            <div style={{
              background: "#fff", border: `1px solid ${P.borda}`, borderRadius: 10,
              padding: 20, marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: P.texto, marginBottom: 12 }}>
                Enviar nota por e-mail
              </div>
              <div style={{ fontSize: 13, color: P.inativo, marginBottom: 12 }}>
                Destinatário: <strong style={{ color: P.texto }}>{destNome}</strong> — {destEmail}
              </div>
              {erroEmail && (
                <div style={{ background: "#fef2f2", color: "#b91c1c", padding: "8px 12px", borderRadius: 6, fontSize: 13, marginBottom: 12 }}>
                  {erroEmail}
                </div>
              )}
              <button
                onClick={async () => {
                  setEnviandoEmail(true);
                  setErroEmail(null);
                  try {
                    const res = await fetch(`/api/notas-fiscais/${empresaId}/enviar-email`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        notaId: sucesso.notaId,
                        emailDestinatario: destEmail,
                        assunto: `Nota Fiscal nº ${sucesso.numero} — ${empresa?.nome_legal || ""}`,
                      }),
                    });
                    const json = await res.json();
                    if (!res.ok) setErroEmail(json.error || "Erro ao enviar e-mail.");
                    else setEmailEnviado(true);
                  } catch {
                    setErroEmail("Erro de conexão.");
                  } finally {
                    setEnviandoEmail(false);
                  }
                }}
                disabled={enviandoEmail}
                style={{
                  padding: "10px 20px", background: P.azul, color: "#fff",
                  border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  opacity: enviandoEmail ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <svg fill="none" height={16} viewBox="0 0 24 24" width={16}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2" /><path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
                {enviandoEmail ? "Enviando..." : `Enviar para ${destEmail}`}
              </button>
            </div>
          )}

          {emailEnviado && (
            <div style={{
              background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, fontSize: 14, fontWeight: 600, color: "#166534",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <svg fill="none" height={18} viewBox="0 0 24 24" width={18}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              E-mail enviado para {destEmail}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.push(`/empresas/${empresaId}/notas-fiscais`)}
              style={{
                padding: "10px 24px", background: P.azul, color: "#fff",
                border: "none", borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Ver notas fiscais
            </button>
            <button
              onClick={() => {
                setSucesso(null); setEmailEnviado(false); setEtapa(1);
                setItens([{ ...emptyItem }]); setDestNome(""); setDestCnpj(""); setDestEmail("");
              }}
              style={{
                padding: "10px 24px", background: "transparent", color: P.azul,
                border: `1px solid ${P.borda}`, borderRadius: 4, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Emitir outra
            </button>
          </div>
        </div>

        {modalFavorito()}
      </AppShell>
    );
  }

  /* ─────────────────────────── Render ─────────────────────────── */
  return (
    <AppShell>
      <div style={{ background: "#fff", border: `1px solid ${P.borda}`, borderRadius: 4, maxWidth: 1180, margin: "0 auto" }}>
        {simplificada ? (
          <div style={{
            padding: "22px 26px 4px", display: "flex", justifyContent: "space-between",
            alignItems: "center", gap: 16, flexWrap: "wrap",
          }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: P.texto }}>Emissão simplificada</h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: P.inativo }}>
                Apenas os campos essenciais. Para o formulário no padrão do portal nacional, use a emissão completa.
              </p>
            </div>
            <button
              type="button"
              onClick={() => router.push(`/empresas/${empresaId}/notas-fiscais/emitir?modo=completa`)}
              style={{
                padding: "8px 16px", background: "#fff", color: P.azul, border: `1px solid ${P.azul}`,
                borderRadius: 3, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              }}
            >
              Trocar para emissão completa
            </button>
          </div>
        ) : (
          <Stepper atual={etapa} onIr={setEtapa} />
        )}

        {/* ═══════════ EMISSÃO SIMPLIFICADA ═══════════ */}
        {simplificada && (
          <>
            {blocoFavoritos()}

            <Secao titulo="Dados da nota">
              <div style={grid(3)}>
                <Field label="Data de competência" required>
                  <input style={inputStyle} type="date" value={dataCompetencia}
                    onChange={e => setDataCompetencia(e.target.value)} />
                </Field>
                <Field label="Modelo" required>
                  <select style={inputStyle} value={modelo} onChange={e => setModelo(e.target.value as "nfse" | "55" | "65")}>
                    <option value="nfse">NFS-e (Serviços)</option>
                    <option value="55">NF-e (Produtos)</option>
                    <option value="65">NFC-e (Consumidor)</option>
                  </select>
                </Field>
                <Field label="Natureza da operação">
                  <input style={inputStyle} value={natureza} onChange={e => setNatureza(e.target.value)}
                    placeholder={modelo === "nfse" ? "Prestação de serviços" : "Venda de mercadorias"} />
                </Field>
              </div>
            </Secao>

            <Secao titulo="Tomador">
              <div style={grid(2)}>
                <Field label="CPF/CNPJ" required>
                  {campoDocumentoTomador()}
                </Field>
                <Field label="Nome/Razão Social" required>
                  <input style={inputStyle} value={destNome} onChange={e => setDestNome(e.target.value)}
                    placeholder="Nome ou razão social do tomador" />
                </Field>
              </div>
              <div style={grid(2)}>
                <Field label="Telefone">
                  <input style={inputStyle} value={destTelefone} onChange={e => setDestTelefone(e.target.value)}
                    placeholder="(00) 00000-0000" />
                </Field>
                <Field label="E-mail">
                  <input style={inputStyle} type="email" value={destEmail} onChange={e => setDestEmail(e.target.value)}
                    placeholder="email@empresa.com" />
                </Field>
              </div>
            </Secao>

            <Secao titulo={modelo === "nfse" ? "Serviço" : "Produtos"}>
              {itens.map((item, idx) => (
                <div key={idx} style={{
                  background: "#fff", border: `1px solid ${P.borda}`, borderRadius: 3,
                  padding: 16, marginBottom: 12,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: P.inativo }}>Item {idx + 1}</span>
                    {itens.length > 1 && (
                      <button type="button" onClick={() => removeItem(idx)} style={{
                        background: "none", border: "none", color: P.danger, fontSize: 13,
                        fontWeight: 600, cursor: "pointer",
                      }}>Remover</button>
                    )}
                  </div>
                  <Field label="Descrição" required>
                    <input style={inputStyle} value={item.descricao}
                      onChange={e => updateItem(idx, "descricao", e.target.value)}
                      placeholder={modelo === "nfse" ? "Descrição do serviço prestado" : "Descrição do produto"} />
                  </Field>
                  <div style={grid(modelo === "nfse" ? 4 : 3)}>
                    <Field label="Quantidade">
                      <input style={inputStyle} type="number" min={1} value={item.quantidade}
                        onChange={e => updateItem(idx, "quantidade", parseFloat(e.target.value) || 0)} />
                    </Field>
                    <Field label="Valor unitário (R$)" required>
                      <input style={inputStyle} type="number" step="0.01" min={0} value={item.valor_unitario || ""}
                        onChange={e => updateItem(idx, "valor_unitario", parseFloat(e.target.value) || 0)} />
                    </Field>
                    {modelo === "nfse" ? (
                      <>
                        <Field label="Cód. serviço">
                          <input style={inputStyle} value={item.codigo_servico}
                            onChange={e => updateItem(idx, "codigo_servico", e.target.value)} placeholder="Ex: 01.07" />
                        </Field>
                        <Field label="Alíquota ISS (%)">
                          <input style={inputStyle} type="number" step="0.01" min={0} max={10} value={item.aliquota_iss}
                            onChange={e => updateItem(idx, "aliquota_iss", parseFloat(e.target.value) || 0)} />
                        </Field>
                      </>
                    ) : (
                      <Field label="Subtotal">
                        <div style={{ ...inputStyle, display: "flex", alignItems: "center" }}>
                          {formatBRL(item.quantidade * item.valor_unitario)}
                        </div>
                      </Field>
                    )}
                  </div>
                </div>
              ))}
              <button type="button" onClick={addItem} style={{
                background: "#fff", color: P.azul, border: `1px solid ${P.azul}`,
                borderRadius: 3, padding: "8px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              }}>
                + Adicionar item
              </button>

              <div style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                marginTop: 18, paddingTop: 14, borderTop: `2px solid ${P.borda}`,
                fontSize: 17, fontWeight: 800, color: P.texto,
              }}>
                <span>Valor total</span>
                <span style={{ color: P.azul }}>{formatBRL(valorTotal)}</span>
              </div>
            </Secao>

            <Secao titulo="Emissão">
              <Field label="Observações">
                <textarea style={{ ...inputStyle, minHeight: 70, height: "auto", resize: "vertical" }}
                  value={observacoes} onChange={e => setObservacoes(e.target.value)}
                  placeholder="Informações complementares..." />
              </Field>
              {modelo === "nfse" && (
                <div style={grid(2)}>
                  <Field label="Token gov.br (opcional)" hint="Sem token a nota é registrada apenas internamente.">
                    <input style={inputStyle} type="password" value={tokenGovBr}
                      onChange={e => setTokenGovBr(e.target.value)} placeholder="Cole o token para transmitir à SEFAZ" />
                  </Field>
                  <Field label="Ambiente">
                    <select style={inputStyle} value={ambiente} onChange={e => setAmbiente(e.target.value as "homologacao" | "producao")}>
                      <option value="homologacao">Homologação (testes)</option>
                      <option value="producao">Produção (real)</option>
                    </select>
                  </Field>
                </div>
              )}
            </Secao>
          </>
        )}

        {/* ═══════════ ETAPA 1 — PESSOAS ═══════════ */}
        {!simplificada && etapa === 1 && (
          <>
            {blocoFavoritos()}

            <Secao titulo="Informações gerais">
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Preencher as informações IBS/CBS?<span style={{ color: P.danger, marginLeft: 3 }}>*</span>
                </label>
                <Radio name="ibscbs" label="Sim" checked={preencherIbsCbs === "sim"} onChange={() => setPreencherIbsCbs("sim")} />
                <Radio name="ibscbs" label="Não" checked={preencherIbsCbs === "nao"} onChange={() => setPreencherIbsCbs("nao")} />
              </div>

              <div style={{ maxWidth: 390 }}>
                <Field label="Data de Competência" required hint="Mês/ano de competência da prestação do serviço.">
                  <input style={inputStyle} type="date" value={dataCompetencia}
                    onChange={e => setDataCompetencia(e.target.value)} />
                </Field>
              </div>

              <Check label="Informar série e número da DPS" checked={informarDps} onChange={setInformarDps} />

              {informarDps && (
                <div style={{ ...grid(2), maxWidth: 700, marginTop: 14 }}>
                  <Field label="Série da DPS" required>
                    <input style={inputStyle} value={serieDps} onChange={e => setSerieDps(e.target.value)}
                      placeholder="Ex: 00001" maxLength={5} />
                  </Field>
                  <Field label="Número da DPS" required>
                    <input style={inputStyle} value={numeroDps} onChange={e => setNumeroDps(e.target.value)}
                      placeholder="Ex: 000000001" maxLength={15} />
                  </Field>
                </div>
              )}
            </Secao>

            <Secao titulo="Emitente da NFS-e">
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Você irá emitir esta NFS-e como?<span style={{ color: P.danger, marginLeft: 3 }}>*</span>
                  <Ajuda titulo="Define o papel do emitente na operação." />
                </label>
                <Radio name="emitcomo" label="Prestador/Fornecedor" checked={emitenteComo === "prestador"} onChange={() => setEmitenteComo("prestador")} />
                <Radio name="emitcomo" label="Tomador/Adquirente" checked={emitenteComo === "tomador"} onChange={() => setEmitenteComo("tomador")} />
                <Radio name="emitcomo" label="Intermediário" checked={emitenteComo === "intermediario"} onChange={() => setEmitenteComo("intermediario")} />
              </div>

              <div style={grid(2)}>
                <Field label="Município" required>
                  {municipios.length > 0 ? (
                    <select style={inputStyle} value={codigoMunicipio} onChange={e => setCodigoMunicipio(e.target.value)}>
                      <option value="">Selecione...</option>
                      {municipios.map(m => (
                        <option key={m.id} value={String(m.id)}>{m.nome}</option>
                      ))}
                    </select>
                  ) : (
                    <input style={inputStyle} value={codigoMunicipio}
                      onChange={e => setCodigoMunicipio(e.target.value.replace(/\D/g, ""))}
                      placeholder={erroMunicipios ? "Código IBGE (ex: 3550308)" : "Carregando municípios..."}
                      maxLength={7} />
                  )}
                </Field>
                <Field label="Indicador Municipal">
                  <select style={inputStyle} value={indicadorMunicipalEmit} onChange={e => setIndicadorMunicipalEmit(e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="1">Inscrição Municipal</option>
                    <option value="2">Sem Inscrição Municipal</option>
                    <option value="3">Isento de Inscrição Municipal</option>
                  </select>
                </Field>
              </div>

              <div style={grid(2)}>
                <Field label="CPF">
                  <input style={inputStyle} value={cpfEmitente} onChange={e => setCpfEmitente(e.target.value)}
                    placeholder="000.000.000-00" />
                </Field>
                <Field label="Nome">
                  <input style={inputStyle} value={nomeEmitente} onChange={e => setNomeEmitente(e.target.value)}
                    placeholder="Nome do emitente" />
                </Field>
              </div>

              <button
                onClick={() => setDetalhesEmitente(v => !v)}
                style={{
                  padding: "9px 18px", background: P.botaoCinza, color: "#fff", border: "none",
                  borderRadius: 3, fontSize: 14, cursor: "pointer", marginTop: 4,
                }}
              >
                {detalhesEmitente ? "Ocultar detalhes do emitente" : "Exibir detalhes do emitente"}
              </button>

              {detalhesEmitente && (
                <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${P.borda}` }}>
                  <div style={grid(2)}>
                    <Field label="Razão social">
                      <input style={{ ...inputStyle, background: "#f0f0f0" }} value={empresa?.nome_legal || ""} readOnly />
                    </Field>
                    <Field label="CNPJ">
                      <input style={{ ...inputStyle, background: "#f0f0f0" }} value={empresa?.cnpj || ""} readOnly />
                    </Field>
                  </div>
                  <div style={grid(3)}>
                    <Field label="Inscrição Municipal">
                      <input style={inputStyle} value={inscricaoMunicipal}
                        onChange={e => setInscricaoMunicipal(e.target.value)} placeholder="Número da IM" />
                    </Field>
                    <Field label="Regime tributário">
                      <input style={{ ...inputStyle, background: "#f0f0f0" }} value={empresa?.regime_tributario || "—"} readOnly />
                    </Field>
                    <Field label="UF">
                      <input style={{ ...inputStyle, background: "#f0f0f0" }} value={empresa?.estado || "—"} readOnly />
                    </Field>
                  </div>
                </div>
              )}
            </Secao>

            <Secao titulo="Compras governamentais">
              <label style={labelStyle}>
                A operação se trata de uma compra governamental?
                <Ajuda titulo="Operações destinadas a órgãos da administração pública." />
              </label>
              <Radio name="compragov" label="Sim" checked={compraGov === "sim"} onChange={() => setCompraGov("sim")} />
              <Radio name="compragov" label="Não" checked={compraGov === "nao"} onChange={() => setCompraGov("nao")} />
            </Secao>

            <Secao titulo="Tomador/Adquirente do serviço">
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>
                  Onde está localizado o estabelecimento/domicílio?<span style={{ color: P.danger, marginLeft: 3 }}>*</span>
                </label>
                <Radio name="tomloc" label="Brasil" checked={tomadorLocal === "brasil"} onChange={() => setTomadorLocal("brasil")} />
                <Radio name="tomloc" label="Exterior" checked={tomadorLocal === "exterior"} onChange={() => setTomadorLocal("exterior")} />
                <Radio name="tomloc" label="Tomador/Adquirente não informado" checked={tomadorLocal === "nao_informado"} onChange={() => setTomadorLocal("nao_informado")} />
              </div>

              {tomadorLocal !== "nao_informado" && (
                <>
                  <div style={grid(2)}>
                    <Field label={tomadorLocal === "brasil" ? "CPF/CNPJ" : "Identificação (NIF)"} required>
                      {campoDocumentoTomador()}
                    </Field>
                    <Field label="Indicador Municipal">
                      <select style={inputStyle} value={indicadorMunicipalTom} onChange={e => setIndicadorMunicipalTom(e.target.value)}>
                        <option value="">Selecione...</option>
                        <option value="1">Inscrição Municipal</option>
                        <option value="2">Sem Inscrição Municipal</option>
                        <option value="3">Isento de Inscrição Municipal</option>
                      </select>
                    </Field>
                  </div>

                  <Field label="Nome/Razão Social" required>
                    <input style={inputStyle} value={destNome} onChange={e => setDestNome(e.target.value)}
                      placeholder="Nome ou razão social do tomador" />
                  </Field>

                  <div style={grid(2)}>
                    <Field label="Telefone">
                      <input style={inputStyle} value={destTelefone} onChange={e => setDestTelefone(e.target.value)}
                        placeholder="(00) 00000-0000" />
                    </Field>
                    <Field label="E-mail">
                      <input style={inputStyle} type="email" value={destEmail} onChange={e => setDestEmail(e.target.value)}
                        placeholder="email@empresa.com" />
                    </Field>
                  </div>

                  <Check label="Informar endereço" checked={informarEndereco} onChange={setInformarEndereco} />

                  {informarEndereco && (
                    <div style={{ marginTop: 14 }}>
                      <div style={grid(3)}>
                        <Field label="CEP">
                          <input style={inputStyle} value={destCep} onChange={e => setDestCep(e.target.value)} placeholder="00000-000" />
                        </Field>
                        <Field label="Logradouro">
                          <input style={inputStyle} value={destEndereco} onChange={e => setDestEndereco(e.target.value)} placeholder="Rua / Avenida" />
                        </Field>
                        <Field label="Número">
                          <input style={inputStyle} value={destNumero} onChange={e => setDestNumero(e.target.value)} placeholder="Nº" />
                        </Field>
                      </div>
                      <div style={grid(3)}>
                        <Field label="Bairro">
                          <input style={inputStyle} value={destBairro} onChange={e => setDestBairro(e.target.value)} placeholder="Bairro" />
                        </Field>
                        <Field label="Município">
                          <input style={inputStyle} value={destCidade} onChange={e => setDestCidade(e.target.value)} placeholder="Cidade" />
                        </Field>
                        <Field label="UF">
                          <input style={inputStyle} value={destUf} onChange={e => setDestUf(e.target.value.toUpperCase())} placeholder="SP" maxLength={2} />
                        </Field>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Secao>

            <Secao titulo="Destinatário do serviço">
              <label style={labelStyle}>
                Para fins de apuração do IBS/CBS, o destinatário é o próprio adquirente?
                <Ajuda titulo="Marque 'Não' quando o serviço for prestado a terceiro diferente do adquirente." />
              </label>
              <Radio name="destadq" label="Sim" checked={destProprioAdquirente === "sim"} onChange={() => setDestProprioAdquirente("sim")} />
              <Radio name="destadq" label="Não" checked={destProprioAdquirente === "nao"} onChange={() => setDestProprioAdquirente("nao")} />
            </Secao>

            <Secao titulo="Intermediário do serviço">
              <label style={labelStyle}>
                Onde está localizado o estabelecimento/domicílio?<span style={{ color: P.danger, marginLeft: 3 }}>*</span>
              </label>
              <Radio name="interloc" label="Brasil" checked={intermediarioLocal === "brasil"} onChange={() => setIntermediarioLocal("brasil")} />
              <Radio name="interloc" label="Exterior" checked={intermediarioLocal === "exterior"} onChange={() => setIntermediarioLocal("exterior")} />
              <Radio name="interloc" label="Intermediário não informado" checked={intermediarioLocal === "nao_informado"} onChange={() => setIntermediarioLocal("nao_informado")} />

              {intermediarioLocal !== "nao_informado" && (
                <div style={{ ...grid(2), marginTop: 14 }}>
                  <Field label={intermediarioLocal === "brasil" ? "CPF/CNPJ" : "Identificação (NIF)"}>
                    <input style={inputStyle} value={intermediarioCnpj} onChange={e => setIntermediarioCnpj(e.target.value)}
                      placeholder="00.000.000/0000-00" />
                  </Field>
                  <Field label="Nome/Razão Social">
                    <input style={inputStyle} value={intermediarioNome} onChange={e => setIntermediarioNome(e.target.value)}
                      placeholder="Nome do intermediário" />
                  </Field>
                </div>
              )}
            </Secao>
          </>
        )}

        {/* ═══════════ ETAPA 2 — SERVIÇO ═══════════ */}
        {!simplificada && etapa === 2 && (
          <>
            <Secao titulo="Dados do serviço">
              <div style={grid(2)}>
                <Field label="Modelo do documento" required>
                  <select style={inputStyle} value={modelo} onChange={e => setModelo(e.target.value as "nfse" | "55" | "65")}>
                    <option value="nfse">NFS-e (Serviços)</option>
                    <option value="55">NF-e (Produtos)</option>
                    <option value="65">NFC-e (Consumidor)</option>
                  </select>
                </Field>
                <Field label="Natureza da operação">
                  <input style={inputStyle} value={natureza} onChange={e => setNatureza(e.target.value)}
                    placeholder={modelo === "nfse" ? "Prestação de serviços" : "Venda de mercadorias"} />
                </Field>
              </div>
            </Secao>

            <Secao titulo={modelo === "nfse" ? "Serviços prestados" : "Produtos"}>
              {itens.map((item, idx) => (
                <div key={idx} style={{
                  background: "#fff", border: `1px solid ${P.borda}`, borderRadius: 3,
                  padding: 16, marginBottom: 12,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: P.inativo }}>Item {idx + 1}</span>
                    {itens.length > 1 && (
                      <button onClick={() => removeItem(idx)} style={{
                        background: "none", border: "none", color: P.danger, fontSize: 13,
                        fontWeight: 600, cursor: "pointer",
                      }}>Remover</button>
                    )}
                  </div>
                  <Field label="Descrição" required>
                    <input style={inputStyle} value={item.descricao}
                      onChange={e => updateItem(idx, "descricao", e.target.value)}
                      placeholder={modelo === "nfse" ? "Descrição do serviço prestado" : "Descrição do produto"} />
                  </Field>
                  <div style={grid(modelo === "nfse" ? 4 : 3)}>
                    <Field label="Quantidade">
                      <input style={inputStyle} type="number" min={1} value={item.quantidade}
                        onChange={e => updateItem(idx, "quantidade", parseFloat(e.target.value) || 0)} />
                    </Field>
                    <Field label="Valor unitário (R$)">
                      <input style={inputStyle} type="number" step="0.01" min={0} value={item.valor_unitario || ""}
                        onChange={e => updateItem(idx, "valor_unitario", parseFloat(e.target.value) || 0)} />
                    </Field>
                    {modelo === "nfse" ? (
                      <>
                        <Field label="Cód. serviço">
                          <input style={inputStyle} value={item.codigo_servico}
                            onChange={e => updateItem(idx, "codigo_servico", e.target.value)} placeholder="Ex: 01.07" />
                        </Field>
                        <Field label="Alíquota ISS (%)">
                          <input style={inputStyle} type="number" step="0.01" min={0} max={10} value={item.aliquota_iss}
                            onChange={e => updateItem(idx, "aliquota_iss", parseFloat(e.target.value) || 0)} />
                        </Field>
                      </>
                    ) : (
                      <Field label="Subtotal">
                        <div style={{ ...inputStyle, display: "flex", alignItems: "center" }}>
                          {formatBRL(item.quantidade * item.valor_unitario)}
                        </div>
                      </Field>
                    )}
                  </div>
                </div>
              ))}
              <button onClick={addItem} style={{
                background: "#fff", color: P.azul, border: `1px solid ${P.azul}`,
                borderRadius: 3, padding: "8px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer",
              }}>
                + Adicionar item
              </button>
            </Secao>

            <Secao titulo="Informações complementares">
              <Field label="Observações">
                <textarea style={{ ...inputStyle, minHeight: 90, height: "auto", resize: "vertical" }}
                  value={observacoes} onChange={e => setObservacoes(e.target.value)}
                  placeholder="Informações complementares da nota fiscal..." />
              </Field>
            </Secao>
          </>
        )}

        {/* ═══════════ ETAPA 3 — VALORES ═══════════ */}
        {!simplificada && etapa === 3 && (
          <>
            {modelo !== "nfse" && (
              <Secao titulo="Alíquotas de impostos">
                <div style={grid(3)}>
                  <Field label="ICMS (%)">
                    <input style={inputStyle} type="number" step="0.01" min={0} value={aliquotaIcms}
                      onChange={e => setAliquotaIcms(parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field label="PIS (%)">
                    <input style={inputStyle} type="number" step="0.01" min={0} value={aliquotaPis}
                      onChange={e => setAliquotaPis(parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field label="COFINS (%)">
                    <input style={inputStyle} type="number" step="0.01" min={0} value={aliquotaCofins}
                      onChange={e => setAliquotaCofins(parseFloat(e.target.value) || 0)} />
                  </Field>
                </div>
              </Secao>
            )}

            {modelo === "nfse" && (
              <Secao titulo="Tributos federais">
                <div style={grid(2)}>
                  <Field label="PIS (%)">
                    <input style={inputStyle} type="number" step="0.01" min={0} value={aliquotaPis}
                      onChange={e => setAliquotaPis(parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field label="COFINS (%)">
                    <input style={inputStyle} type="number" step="0.01" min={0} value={aliquotaCofins}
                      onChange={e => setAliquotaCofins(parseFloat(e.target.value) || 0)} />
                  </Field>
                </div>
              </Secao>
            )}

            <Secao titulo="Resumo dos valores">
              <div style={{ background: "#fff", border: `1px solid ${P.borda}`, borderRadius: 3, padding: 18, maxWidth: 480 }}>
                {[
                  ["Subtotal", subtotal],
                  ...(totalISS > 0 ? [["ISS", totalISS] as [string, number]] : []),
                  ...(totalICMS > 0 ? [["ICMS", totalICMS] as [string, number]] : []),
                  ...(totalPIS > 0 ? [["PIS", totalPIS] as [string, number]] : []),
                  ...(totalCOFINS > 0 ? [["COFINS", totalCOFINS] as [string, number]] : []),
                  ["Total de impostos", totalImpostos],
                ].map(([nome, valor]) => (
                  <div key={nome as string} style={{
                    display: "flex", justifyContent: "space-between", fontSize: 13.5, marginBottom: 8, color: P.labelCor,
                  }}>
                    <span>{nome as string}</span>
                    <span style={{ fontWeight: 600 }}>{formatBRL(valor as number)}</span>
                  </div>
                ))}
                <div style={{
                  display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 800,
                  color: P.texto, paddingTop: 12, borderTop: `2px solid ${P.borda}`, marginTop: 6,
                }}>
                  <span>Valor total</span>
                  <span style={{ color: P.azul }}>{formatBRL(valorTotal)}</span>
                </div>
              </div>
            </Secao>
          </>
        )}

        {/* ═══════════ ETAPA 4 — EMITIR NFS-e ═══════════ */}
        {!simplificada && etapa === 4 && (
          <>
            {modelo === "nfse" && (
              <Secao titulo="Integração NFS-e Nacional (gov.br)">
                <div style={{ marginBottom: 12 }}>
                  <span style={{
                    fontSize: 11.5, fontWeight: 700, padding: "3px 9px", borderRadius: 3,
                    background: tokenGovBr ? "#f0fdf4" : "#fffbeb",
                    color: tokenGovBr ? "#166534" : "#92400e",
                    border: `1px solid ${tokenGovBr ? "#86efac" : "#fcd34d"}`,
                  }}>
                    {tokenGovBr ? "SEFAZ ativa" : "Apenas local"}
                  </span>
                </div>
                <p style={{ fontSize: 13, color: "#7a7a7a", margin: "0 0 14px" }}>
                  Para emitir via SEFAZ, informe o token de acesso do gov.br. Sem token, a nota será registrada apenas internamente.
                </p>
                <div style={grid(2)}>
                  <Field label="Token gov.br (Bearer)">
                    <input style={inputStyle} type="password" value={tokenGovBr}
                      onChange={e => setTokenGovBr(e.target.value)} placeholder="Cole o token de acesso aqui" />
                  </Field>
                  <Field label="Ambiente">
                    <select style={inputStyle} value={ambiente} onChange={e => setAmbiente(e.target.value as "homologacao" | "producao")}>
                      <option value="homologacao">Homologação (testes)</option>
                      <option value="producao">Produção (real)</option>
                    </select>
                  </Field>
                </div>
                <div style={grid(2)}>
                  <Field label="Inscrição Municipal">
                    <input style={inputStyle} value={inscricaoMunicipal}
                      onChange={e => setInscricaoMunicipal(e.target.value)} placeholder="Número da IM" />
                  </Field>
                  <Field label="Código do município (IBGE)">
                    <input style={{ ...inputStyle, background: "#f0f0f0" }} value={codigoMunicipio} readOnly />
                  </Field>
                </div>
              </Secao>
            )}

            <Secao titulo="Revisão">
              <div style={{ background: "#fff", border: `1px solid ${P.borda}`, borderRadius: 3, padding: 18, fontSize: 13.5, color: P.labelCor }}>
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: P.texto }}>Emitente:</strong> {nomeEmitente || empresa?.nome_legal} — {cpfEmitente || empresa?.cnpj || "—"}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: P.texto }}>Tomador:</strong>{" "}
                  {tomadorLocal === "nao_informado" ? "Não informado" : `${destNome} — ${destCnpj}`}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: P.texto }}>Competência:</strong> {dataCompetencia.split("-").reverse().join("/")}
                </div>
                <div style={{ marginBottom: 10 }}>
                  <strong style={{ color: P.texto }}>Itens:</strong> {itens.filter(i => i.descricao).length || itens.length}
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: P.azul, marginTop: 14 }}>
                  Total: {formatBRL(valorTotal)}
                </div>
              </div>
            </Secao>
          </>
        )}

        {/* ── Erro ── */}
        {erro && (
          <div style={{
            margin: "0 26px 12px", background: "#fdecea", border: "1px solid #f5c6c3",
            borderRadius: 3, padding: "10px 14px", color: "#b71c1c", fontSize: 13.5,
          }}>
            {erro}
          </div>
        )}

        {/* ── Navegação ── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "18px 26px 26px", gap: 12,
        }}>
          <button
            onClick={() => (simplificada || etapa === 1) ? router.push(`/empresas/${empresaId}/notas-fiscais`) : voltar()}
            style={{
              padding: "10px 22px", background: "#fff", color: "#5a5a5a",
              border: `1px solid ${P.borda}`, borderRadius: 3, fontSize: 14.5, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8,
            }}
          >
            <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
              <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {(simplificada || etapa === 1) ? "Cancelar" : "Voltar"}
          </button>

          {!simplificada && etapa < 4 ? (
            <button
              onClick={avancar}
              style={{
                padding: "10px 24px", background: P.azul, color: "#fff", border: "none",
                borderRadius: 3, fontSize: 14.5, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              Avançar
              <svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <button
              onClick={emitirNota}
              disabled={emitindo}
              style={{
                padding: "10px 26px", background: usandoSefaz ? "#1b7a4b" : P.azul, color: "#fff",
                border: "none", borderRadius: 3, fontSize: 14.5, fontWeight: 600, cursor: "pointer",
                opacity: emitindo ? 0.7 : 1,
              }}
            >
              {emitindo
                ? (usandoSefaz ? "Transmitindo para a SEFAZ..." : "Emitindo nota fiscal...")
                : (usandoSefaz ? "Emitir e transmitir à SEFAZ" : "Emitir NFS-e (apenas local)")}
            </button>
          )}
        </div>
      </div>

      {/* ── Modal: clientes cadastrados ── */}
      {modalClientes && (
        <div
          onClick={() => setModalClientes(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,.45)", zIndex: 999,
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 4, width: "100%", maxWidth: 640,
              maxHeight: "80vh", display: "flex", flexDirection: "column", overflow: "hidden",
            }}
          >
            <div style={{
              padding: "16px 20px", borderBottom: `1px solid ${P.borda}`,
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: P.texto }}>
                Selecionar cliente cadastrado
              </h3>
              <button type="button" onClick={() => setModalClientes(false)} style={{
                background: "none", border: "none", fontSize: 22, lineHeight: 1,
                color: P.inativo, cursor: "pointer",
              }}>×</button>
            </div>

            <div style={{ padding: "14px 20px", borderBottom: `1px solid ${P.borda}` }}>
              <input
                autoFocus
                style={{ ...inputStyle, background: "#fff" }}
                value={buscaCliente}
                onChange={e => setBuscaCliente(e.target.value)}
                placeholder="Buscar por nome, razão social ou CPF/CNPJ..."
              />
            </div>

            <div style={{ overflowY: "auto", flex: 1 }}>
              {carregandoClientes ? (
                <div style={{ padding: 30, textAlign: "center", color: P.inativo, fontSize: 13.5 }}>
                  Carregando clientes...
                </div>
              ) : clientesFiltrados(buscaCliente).length === 0 ? (
                <div style={{ padding: 30, textAlign: "center", color: P.inativo, fontSize: 13.5 }}>
                  {clientes.length === 0
                    ? "Nenhum cliente cadastrado ainda. Cadastre em Empresas → Novo cliente."
                    : "Nenhum cliente encontrado para essa busca."}
                </div>
              ) : (
                clientesFiltrados(buscaCliente).map(c => (
                  <div
                    key={c.id}
                    onClick={() => aplicarCliente(c)}
                    style={{
                      padding: "12px 20px", borderBottom: `1px solid ${P.borda}`, cursor: "pointer",
                      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = "#f0f3fb")}
                    onMouseLeave={e => (e.currentTarget.style.background = "#fff")}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: P.texto }}>{c.nome}</div>
                      <div style={{ fontSize: 12.5, color: P.inativo, marginTop: 2 }}>
                        {c.documento || "sem documento"}
                        {c.cidade ? ` · ${c.cidade}${c.uf ? "/" + c.uf : ""}` : ""}
                        {c.email ? ` · ${c.email}` : ""}
                      </div>
                    </div>
                    <span style={{ fontSize: 12.5, color: P.azul, fontWeight: 600, whiteSpace: "nowrap" }}>
                      Selecionar
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
