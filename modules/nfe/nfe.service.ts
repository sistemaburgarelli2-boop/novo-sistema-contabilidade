import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { atualizarStatusNFe, buscarNFe, listarNFes, salvarNFe } from "./nfe.repository";
import type { CriarNFeInput, FocusNFePayload, FocusNFeResponse, ModeloNF, NFe } from "./nfe.types";

const FOCUS_API_BASE = "https://homologacao.focusnfe.com.br/v2";

function buildFocusPayload(input: CriarNFeInput, emitente: {
  nome: string; cnpj: string;
  logradouro: string; numero: string; bairro: string; municipio: string; uf: string; cep: string;
}): FocusNFePayload {
  const hoje = new Date().toISOString().slice(0, 10);

  return {
    natureza_operacao: input.natureza_operacao ?? "Prestação de serviços",
    data_emissao: hoje,
    tipo_documento: 1,
    local_destino: 1,
    finalidade_emissao: "1",
    emitente: {
      nome: emitente.nome,
      cnpj: emitente.cnpj.replace(/\D/g, ""),
      endereco_logradouro: emitente.logradouro,
      endereco_numero: emitente.numero,
      endereco_bairro: emitente.bairro,
      endereco_municipio: emitente.municipio,
      endereco_uf: emitente.uf,
      endereco_cep: emitente.cep.replace(/\D/g, ""),
    },
    destinatario: {
      nome: input.destinatario.nome,
      ...(input.destinatario.cpf_cnpj.replace(/\D/g, "").length === 11
        ? { cpf: input.destinatario.cpf_cnpj.replace(/\D/g, "") }
        : { cnpj: input.destinatario.cpf_cnpj.replace(/\D/g, "") }),
      email: input.destinatario.email,
      endereco_logradouro: input.destinatario.endereco?.logradouro,
      endereco_numero: input.destinatario.endereco?.numero,
      endereco_bairro: input.destinatario.endereco?.bairro,
      endereco_municipio: input.destinatario.endereco?.municipio,
      endereco_uf: input.destinatario.endereco?.uf,
      endereco_cep: input.destinatario.endereco?.cep?.replace(/\D/g, ""),
    },
    items: input.itens.map((item, idx) => ({
      numero_item: idx + 1,
      descricao: item.descricao,
      quantidade_comercial: item.quantidade,
      valor_unitario_comercial: item.valor_unitario,
      ncm: item.ncm ?? "00000000",
      cfop: item.cfop ?? "5933",
      unidade_comercial: item.unidade ?? "UN",
    })),
  };
}

async function enviarParaFocus(
  payload: FocusNFePayload,
  token: string
): Promise<FocusNFeResponse> {
  const response = await fetch(`${FOCUS_API_BASE}/nfe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Focus NF-e API error: ${err}`);
  }

  return response.json() as Promise<FocusNFeResponse>;
}

export async function emitirNFe(input: CriarNFeInput): Promise<NFe> {
  const supabase = await createSupabaseServerClient();

  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome_legal, cnpj, metadata")
    .eq("id", input.empresa_id)
    .single();

  if (!empresa?.cnpj) throw new Error("Empresa sem CNPJ cadastrado.");

  const valorTotal = input.itens.reduce((s, i) => s + i.quantidade * i.valor_unitario, 0);
  const valorImpostos = valorTotal * 0.05;

  const nfe = await salvarNFe(supabase, input.empresa_id, {
    modelo: input.modelo,
    destinatarioNome: input.destinatario.nome,
    destinatarioDocumento: input.destinatario.cpf_cnpj,
    valorTotal,
    valorImpostos,
    naturezaOperacao: input.natureza_operacao ?? "Prestação de serviços",
    dataCompetencia: input.data_competencia ?? null,
    payload: input as unknown as Record<string, unknown>,
  });

  const focusToken = process.env.FOCUS_NFE_TOKEN;

  if (!focusToken) {
    await atualizarStatusNFe(supabase, nfe.id, { status: "aguardando_autorizacao" });
    return buscarNFe(supabase, nfe.id);
  }

  const meta = (empresa.metadata ?? {}) as Record<string, string>;
  const focusPayload = buildFocusPayload(input, {
    nome: empresa.nome_legal,
    cnpj: empresa.cnpj,
    logradouro: meta.logradouro ?? "",
    numero: meta.numero ?? "s/n",
    bairro: meta.bairro ?? "",
    municipio: meta.municipio ?? "",
    uf: meta.uf ?? "",
    cep: meta.cep ?? "",
  });

  const focusResp = await enviarParaFocus(focusPayload, focusToken);

  return atualizarStatusNFe(supabase, nfe.id, {
    status: focusResp.status === "autorizado" ? "autorizada" : "aguardando_autorizacao",
    chave_acesso: focusResp.chave_nfe,
    numero: focusResp.numero,
    serie: focusResp.serie,
    danfe_url: focusResp.caminho_danfe,
    xml_url: focusResp.caminho_xml_nota_fiscal,
    mensagem_sefaz: focusResp.mensagem_sefaz,
    data_emissao: new Date().toISOString().slice(0, 10),
  });
}

export async function cancelarNFe(nfeId: string, justificativa: string): Promise<NFe> {
  const supabase = await createSupabaseServerClient();
  const nfe = await buscarNFe(supabase, nfeId);

  if (nfe.status !== "autorizada") {
    throw new Error("Apenas NF-e autorizadas podem ser canceladas.");
  }

  const focusToken = process.env.FOCUS_NFE_TOKEN;

  if (focusToken && nfe.chave_acesso) {
    const response = await fetch(`${FOCUS_API_BASE}/nfe/${nfe.chave_acesso}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${focusToken}:`).toString("base64")}`,
      },
      body: JSON.stringify({ justificativa }),
    });

    if (!response.ok) throw new Error("Erro ao cancelar NF-e no SEFAZ.");
  }

  return atualizarStatusNFe(supabase, nfeId, { status: "cancelada" });
}

export async function listarNFesEmpresa(
  empresaId: string,
  filtros?: { status?: NFe["status"]; modelo?: ModeloNF }
) {
  const supabase = await createSupabaseServerClient();
  return listarNFes(supabase, empresaId, filtros);
}
