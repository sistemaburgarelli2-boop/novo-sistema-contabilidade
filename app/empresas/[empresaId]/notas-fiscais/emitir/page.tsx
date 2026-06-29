"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { buscarEmpresaTenant } from "@/services/empresaClientService";
import type { Empresa } from "@/modules/empresas/empresas.types";

const V = {
  bg: "#f3f8f5", panel: "#ffffff", ink: "#07170d", muted: "#6f8f7c",
  green700: "#075f3c", green500: "#10b981", border: "#dfece5", danger: "#ef445f",
  gold: "#d4ae4a",
};

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

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", border: `1px solid ${V.border}`,
  borderRadius: 8, fontSize: 14, color: V.ink, background: V.panel, outline: "none",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 13, fontWeight: 600, color: V.ink, marginBottom: 4,
};

const gridRow = (cols: number): React.CSSProperties => ({
  display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16, marginBottom: 16,
});

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label style={labelStyle}>{label}{required && <span style={{ color: V.danger, marginLeft: 2 }}>*</span>}</label>
      {children}
    </div>
  );
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function EmitirNotaPage() {
  const params = useParams();
  const router = useRouter();
  const empresaId = params.empresaId as string;

  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [emitindo, setEmitindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<{ numero: string; chave: string; protocolo?: string; viaSefaz?: boolean; notaId?: string } | null>(null);
  const [enviandoEmail, setEnviandoEmail] = useState(false);
  const [emailEnviado, setEmailEnviado] = useState(false);
  const [erroEmail, setErroEmail] = useState<string | null>(null);

  // Dados da nota
  const [modelo, setModelo] = useState<"nfse" | "55" | "65">("nfse");
  const [natureza, setNatureza] = useState("Prestação de serviços");
  const [dataEmissao, setDataEmissao] = useState(new Date().toISOString().slice(0, 10));

  // Destinatário
  const [destNome, setDestNome] = useState("");
  const [destCnpj, setDestCnpj] = useState("");
  const [destEmail, setDestEmail] = useState("");
  const [destTelefone, setDestTelefone] = useState("");
  const [destEndereco, setDestEndereco] = useState("");
  const [destCidade, setDestCidade] = useState("");
  const [destUf, setDestUf] = useState("");

  // Itens/Serviços
  const [itens, setItens] = useState<ItemServico[]>([{ ...emptyItem }]);

  // Impostos manuais (para NF-e)
  const [aliquotaPis, setAliquotaPis] = useState(0.65);
  const [aliquotaCofins, setAliquotaCofins] = useState(3);
  const [aliquotaIcms, setAliquotaIcms] = useState(0);

  // NFS-e Nacional (gov.br)
  const [tokenGovBr, setTokenGovBr] = useState("");
  const [ambiente, setAmbiente] = useState<"homologacao" | "producao">("homologacao");
  const [inscricaoMunicipal, setInscricaoMunicipal] = useState("");
  const [codigoMunicipio, setCodigoMunicipio] = useState("");

  // Observações
  const [observacoes, setObservacoes] = useState("");

  useEffect(() => {
    buscarEmpresaTenant(empresaId)
      .then(setEmpresa)
      .catch(() => router.push("/empresas"))
      .finally(() => setCarregando(false));
  }, [empresaId, router]);

  const addItem = () => setItens(prev => [...prev, { ...emptyItem }]);

  const removeItem = (idx: number) => {
    if (itens.length <= 1) return;
    setItens(prev => prev.filter((_, i) => i !== idx));
  };

  const updateItem = useCallback((idx: number, field: keyof ItemServico, value: string | number) => {
    setItens(prev => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item));
  }, []);

  // Cálculos
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

  async function emitirNota() {
    if (!destNome || !destCnpj) {
      setErro("Preencha nome e CNPJ/CPF do destinatário.");
      return;
    }
    if (subtotal <= 0) {
      setErro("Adicione pelo menos um item com valor.");
      return;
    }

    setEmitindo(true);
    setErro(null);

    try {
      if (usandoSefaz) {
        // Emissão real via API NFS-e Nacional (gov.br)
        const res = await fetch(`/api/notas-fiscais/${empresaId}/emitir`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenGovBr.trim(),
            ambiente,
            prestador: {
              cnpj: empresa?.cnpj || "",
              nomeRazaoSocial: empresa?.nome_legal || "",
              inscricaoMunicipal: inscricaoMunicipal || undefined,
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
            competencia: dataEmissao.slice(0, 7),
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
        // Emissão apenas local (sem SEFAZ)
        const res = await fetch(`/api/notas-fiscais/${empresaId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelo,
            natureza_operacao: natureza,
            data_emissao: new Date(dataEmissao + "T12:00:00").toISOString(),
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
    return <AppShell><div style={{ textAlign: "center", padding: 60, color: V.muted }}>Carregando...</div></AppShell>;
  }

  if (sucesso) {
    return (
      <AppShell>
        <div style={{ maxWidth: 600, margin: "40px auto", textAlign: "center" }}>
          <div style={{
            width: 100, height: 100, borderRadius: "50%", background: V.green500 + "18",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 24, border: `3px solid ${V.green500}`,
          }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke={V.green500} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h2 style={{ margin: "0 0 8px", color: V.ink, fontSize: 24 }}>Nota fiscal emitida!</h2>
          <p style={{ color: V.muted, fontSize: 15, marginBottom: 8 }}>
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
            background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10,
            padding: 16, marginBottom: 24, fontSize: 12, fontFamily: "monospace",
            wordBreak: "break-all", color: V.muted,
          }}>
            Chave de acesso: {sucesso.chave}
            {sucesso.protocolo && <><br />Protocolo: {sucesso.protocolo}</>}
          </div>
          {/* Enviar por e-mail */}
          {destEmail && !emailEnviado && (
            <div style={{
              background: V.panel, border: `1px solid ${V.border}`, borderRadius: 10,
              padding: 20, marginBottom: 20, textAlign: "left",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: V.ink, marginBottom: 12 }}>
                Enviar nota por e-mail
              </div>
              <div style={{ fontSize: 13, color: V.muted, marginBottom: 12 }}>
                Destinatário: <strong style={{ color: V.ink }}>{destNome}</strong> — {destEmail}
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
                    if (!res.ok) {
                      setErroEmail(json.error || "Erro ao enviar e-mail.");
                    } else {
                      setEmailEnviado(true);
                    }
                  } catch {
                    setErroEmail("Erro de conexão.");
                  } finally {
                    setEnviandoEmail(false);
                  }
                }}
                disabled={enviandoEmail}
                style={{
                  padding: "10px 20px", background: "#1e40af", color: "#fff",
                  border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
                  opacity: enviandoEmail ? 0.7 : 1, display: "flex", alignItems: "center", gap: 8,
                }}
              >
                <svg fill="none" height={16} viewBox="0 0 24 24" width={16}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="2"/><path d="M22 6l-10 7L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
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
              <svg fill="none" height={18} viewBox="0 0 24 24" width={18}><path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              E-mail enviado para {destEmail}
            </div>
          )}

          {!destEmail && (
            <div style={{
              background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10,
              padding: "12px 16px", marginBottom: 20, fontSize: 13, color: V.muted,
            }}>
              Para enviar por e-mail, preencha o e-mail do destinatário ao emitir a nota.
            </div>
          )}

          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.push(`/empresas/${empresaId}/notas-fiscais`)}
              style={{
                padding: "10px 24px", background: V.green700, color: "#fff",
                border: "none", borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Ver notas fiscais
            </button>
            <button
              onClick={() => { setSucesso(null); setEmailEnviado(false); setItens([{ ...emptyItem }]); setDestNome(""); setDestCnpj(""); setDestEmail(""); }}
              style={{
                padding: "10px 24px", background: "transparent", color: V.green700,
                border: `1px solid ${V.border}`, borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: "pointer",
              }}
            >
              Emitir outra
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        {/* Formulário principal */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Header */}
          <div style={{
            background: "linear-gradient(135deg, #1e40af, #3b82f6)", borderRadius: 16,
            padding: "24px 32px", color: "#fff", display: "flex", justifyContent: "space-between",
            alignItems: "center", flexWrap: "wrap", gap: 16,
          }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>Emissão de Nota Fiscal</div>
              <div style={{ fontSize: 24, fontWeight: 800 }}>{empresa?.nome_legal}</div>
              <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                {empresa?.cnpj || "CNPJ não cadastrado"} · {empresa?.regime_tributario || "Regime não definido"}
              </div>
            </div>
            <button
              onClick={() => router.push(`/empresas/${empresaId}/notas-fiscais`)}
              style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: 8, color: "#fff", padding: "8px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}
            >
              ← Voltar
            </button>
          </div>

          {/* Tipo e dados gerais */}
          <div style={{ background: V.panel, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Dados da nota</h3>
            <div style={gridRow(3)}>
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
              <Field label="Data de emissão" required>
                <input style={inputStyle} type="date" value={dataEmissao} onChange={e => setDataEmissao(e.target.value)} />
              </Field>
            </div>
          </div>

          {/* Destinatário */}
          <div style={{ background: V.panel, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Destinatário / Tomador</h3>
            <div style={gridRow(2)}>
              <Field label="Nome / Razão social" required>
                <input style={inputStyle} value={destNome} onChange={e => setDestNome(e.target.value)} placeholder="Nome do cliente" />
              </Field>
              <Field label="CNPJ / CPF" required>
                <input style={inputStyle} value={destCnpj} onChange={e => setDestCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
              </Field>
            </div>
            <div style={gridRow(3)}>
              <Field label="E-mail">
                <input style={inputStyle} value={destEmail} onChange={e => setDestEmail(e.target.value)} placeholder="email@empresa.com" />
              </Field>
              <Field label="Telefone">
                <input style={inputStyle} value={destTelefone} onChange={e => setDestTelefone(e.target.value)} placeholder="(00) 0000-0000" />
              </Field>
              <Field label="UF">
                <input style={inputStyle} value={destUf} onChange={e => setDestUf(e.target.value)} placeholder="SP" maxLength={2} />
              </Field>
            </div>
            <div style={gridRow(2)}>
              <Field label="Endereço">
                <input style={inputStyle} value={destEndereco} onChange={e => setDestEndereco(e.target.value)} placeholder="Rua, nº, bairro" />
              </Field>
              <Field label="Cidade">
                <input style={inputStyle} value={destCidade} onChange={e => setDestCidade(e.target.value)} placeholder="Cidade" />
              </Field>
            </div>
          </div>

          {/* Itens / Serviços */}
          <div style={{ background: V.panel, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
                {modelo === "nfse" ? "Serviços" : "Produtos"}
              </h3>
              <button onClick={addItem} style={{
                background: V.green500 + "15", color: V.green700, border: `1px solid ${V.green500}40`,
                borderRadius: 8, padding: "6px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer",
              }}>
                + Adicionar item
              </button>
            </div>

            {itens.map((item, idx) => (
              <div key={idx} style={{
                background: V.bg, border: `1px solid ${V.border}`, borderRadius: 10,
                padding: 16, marginBottom: 12,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: V.muted }}>Item {idx + 1}</span>
                  {itens.length > 1 && (
                    <button onClick={() => removeItem(idx)} style={{
                      background: "none", border: "none", color: V.danger, fontSize: 13,
                      fontWeight: 600, cursor: "pointer",
                    }}>Remover</button>
                  )}
                </div>
                <div style={gridRow(1)}>
                  <Field label="Descrição" required>
                    <input style={inputStyle} value={item.descricao}
                      onChange={e => updateItem(idx, "descricao", e.target.value)}
                      placeholder={modelo === "nfse" ? "Descrição do serviço prestado" : "Descrição do produto"} />
                  </Field>
                </div>
                <div style={gridRow(modelo === "nfse" ? 4 : 3)}>
                  <Field label="Quantidade">
                    <input style={inputStyle} type="number" min={1} value={item.quantidade}
                      onChange={e => updateItem(idx, "quantidade", parseFloat(e.target.value) || 0)} />
                  </Field>
                  <Field label="Valor unitário (R$)">
                    <input style={inputStyle} type="number" step="0.01" min={0} value={item.valor_unitario || ""}
                      onChange={e => updateItem(idx, "valor_unitario", parseFloat(e.target.value) || 0)} />
                  </Field>
                  {modelo === "nfse" && (
                    <Field label="Cód. serviço">
                      <input style={inputStyle} value={item.codigo_servico}
                        onChange={e => updateItem(idx, "codigo_servico", e.target.value)}
                        placeholder="Ex: 01.07" />
                    </Field>
                  )}
                  {modelo === "nfse" && (
                    <Field label="Alíquota ISS (%)">
                      <input style={inputStyle} type="number" step="0.01" min={0} max={10}
                        value={item.aliquota_iss}
                        onChange={e => updateItem(idx, "aliquota_iss", parseFloat(e.target.value) || 0)} />
                    </Field>
                  )}
                  {modelo !== "nfse" && (
                    <Field label="Subtotal">
                      <div style={{ ...inputStyle, background: V.bg, display: "flex", alignItems: "center" }}>
                        {formatBRL(item.quantidade * item.valor_unitario)}
                      </div>
                    </Field>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Impostos (NF-e / NFC-e) */}
          {modelo !== "nfse" && (
            <div style={{ background: V.panel, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24 }}>
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Alíquotas de impostos</h3>
              <div style={gridRow(3)}>
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
            </div>
          )}

          {/* Integração NFS-e Nacional */}
          {modelo === "nfse" && (
            <div style={{ background: V.panel, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Integração NFS-e Nacional (gov.br)</h3>
                <span style={{
                  fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6,
                  background: tokenGovBr ? "#f0fdf4" : "#fffbeb",
                  color: tokenGovBr ? "#166534" : "#92400e",
                  border: `1px solid ${tokenGovBr ? "#86efac" : "#fcd34d"}`,
                }}>
                  {tokenGovBr ? "SEFAZ ativa" : "Apenas local"}
                </span>
              </div>
              <p style={{ fontSize: 13, color: V.muted, margin: "0 0 16px" }}>
                Para emitir via SEFAZ, informe o token de acesso do gov.br. Sem token, a nota será registrada apenas internamente.
              </p>
              <div style={gridRow(2)}>
                <Field label="Token gov.br (Bearer)">
                  <input style={inputStyle} type="password" value={tokenGovBr}
                    onChange={e => setTokenGovBr(e.target.value)}
                    placeholder="Cole o token de acesso aqui" />
                </Field>
                <Field label="Ambiente">
                  <select style={inputStyle} value={ambiente} onChange={e => setAmbiente(e.target.value as "homologacao" | "producao")}>
                    <option value="homologacao">Homologação (testes)</option>
                    <option value="producao">Produção (real)</option>
                  </select>
                </Field>
              </div>
              <div style={gridRow(2)}>
                <Field label="Inscrição Municipal">
                  <input style={inputStyle} value={inscricaoMunicipal}
                    onChange={e => setInscricaoMunicipal(e.target.value)}
                    placeholder="Número da IM" />
                </Field>
                <Field label="Código do município (IBGE)">
                  <input style={inputStyle} value={codigoMunicipio}
                    onChange={e => setCodigoMunicipio(e.target.value)}
                    placeholder="Ex: 3550308 (São Paulo)" />
                </Field>
              </div>
            </div>
          )}

          {/* Observações */}
          <div style={{ background: V.panel, border: `1px solid ${V.border}`, borderRadius: 14, padding: 24 }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Informações adicionais</h3>
            <Field label="Observações">
              <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
                value={observacoes} onChange={e => setObservacoes(e.target.value)}
                placeholder="Informações complementares da nota fiscal..." />
            </Field>
          </div>

          {/* Erro */}
          {erro && (
            <div style={{
              background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
              padding: "12px 16px", color: "#b91c1c", fontSize: 14, fontWeight: 600,
            }}>
              {erro}
            </div>
          )}

          {/* Botão emitir */}
          <button
            onClick={emitirNota}
            disabled={emitindo}
            style={{
              width: "100%", padding: "14px 24px",
              background: usandoSefaz ? "linear-gradient(135deg, #065f46, #10b981)" : "linear-gradient(135deg, #1e40af, #3b82f6)", color: "#fff",
              border: "none", borderRadius: 10, fontSize: 16, fontWeight: 700, cursor: "pointer",
              opacity: emitindo ? 0.7 : 1,
            }}
          >
            {emitindo
              ? (usandoSefaz ? "Transmitindo para a SEFAZ..." : "Emitindo nota fiscal...")
              : (usandoSefaz ? "Emitir e transmitir à SEFAZ" : "Emitir nota fiscal (apenas local)")
            }
          </button>
        </div>

        {/* Painel lateral - Resumo */}
        <div style={{
          width: 320, minWidth: 320, background: V.panel,
          border: `1px solid ${V.border}`, borderRadius: 14,
          padding: 24, position: "sticky", top: 20, alignSelf: "flex-start",
        }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>Resumo da nota</h3>

          {/* Modelo */}
          <div style={{
            background: "#1e40af12", border: "1px solid #1e40af30", borderRadius: 8,
            padding: "8px 12px", marginBottom: 16, fontSize: 13, fontWeight: 600, color: "#1e40af",
          }}>
            {modelo === "nfse" ? "NFS-e — Nota Fiscal de Serviços" :
              modelo === "55" ? "NF-e — Nota Fiscal Eletrônica" : "NFC-e — Nota Fiscal Consumidor"}
          </div>

          {/* Emitente */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Emitente</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>{empresa?.nome_legal}</div>
            <div style={{ fontSize: 12, color: V.muted }}>{empresa?.cnpj || "—"}</div>
          </div>

          {/* Destinatário */}
          {destNome && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Destinatário</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: V.ink }}>{destNome}</div>
              <div style={{ fontSize: 12, color: V.muted }}>{destCnpj || "—"}</div>
            </div>
          )}

          {/* Itens */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: V.muted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
              {itens.length} {itens.length === 1 ? "item" : "itens"}
            </div>
            {itens.filter(i => i.descricao).map((item, idx) => (
              <div key={idx} style={{
                fontSize: 13, padding: "4px 0", display: "flex", justifyContent: "space-between",
                borderBottom: `1px solid ${V.border}`,
              }}>
                <span style={{ color: V.ink, flex: 1, marginRight: 8 }}>{item.descricao}</span>
                <span style={{ fontWeight: 600, color: V.ink, whiteSpace: "nowrap" }}>
                  {formatBRL(item.quantidade * item.valor_unitario)}
                </span>
              </div>
            ))}
          </div>

          {/* Valores */}
          <div style={{ borderTop: `2px solid ${V.border}`, paddingTop: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
              <span style={{ color: V.muted }}>Subtotal</span>
              <span style={{ color: V.ink, fontWeight: 600 }}>{formatBRL(subtotal)}</span>
            </div>

            {totalISS > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: V.muted }}>ISS</span>
                <span style={{ color: "#92400e" }}>{formatBRL(totalISS)}</span>
              </div>
            )}
            {totalICMS > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: V.muted }}>ICMS</span>
                <span style={{ color: "#92400e" }}>{formatBRL(totalICMS)}</span>
              </div>
            )}
            {totalPIS > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: V.muted }}>PIS</span>
                <span style={{ color: "#92400e" }}>{formatBRL(totalPIS)}</span>
              </div>
            )}
            {totalCOFINS > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}>
                <span style={{ color: V.muted }}>COFINS</span>
                <span style={{ color: "#92400e" }}>{formatBRL(totalCOFINS)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 12, color: V.muted }}>
              <span>Total impostos</span>
              <span>{formatBRL(totalImpostos)}</span>
            </div>

            <div style={{
              display: "flex", justifyContent: "space-between", fontSize: 18,
              fontWeight: 800, color: V.ink, paddingTop: 12, borderTop: `2px solid ${V.border}`,
            }}>
              <span>Total</span>
              <span style={{ color: "#1e40af" }}>{formatBRL(valorTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
