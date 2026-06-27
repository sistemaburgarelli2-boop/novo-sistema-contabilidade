import type { AmbienteNFSe, NFSeNacionalConsulta, NFSeNacionalResposta, NotaFiscalInsert } from "./nfse-nacional.types";

const URLS: Record<AmbienteNFSe, string> = {
  producao: "https://www.nfse.gov.br/SistemaContribuinteISSQN/api",
  homologacao: "https://www.producaorestrita.nfse.gov.br/SistemaContribuinteISSQN/api",
};

export function getBaseUrl(ambiente: AmbienteNFSe) {
  return URLS[ambiente];
}

export async function consultarNFSeEmitidas(
  config: { ambiente: AmbienteNFSe; token: string },
  consulta: NFSeNacionalConsulta,
): Promise<NFSeNacionalResposta[]> {
  const baseUrl = getBaseUrl(config.ambiente);
  const params = new URLSearchParams({
    CNPJCPFEmitente: consulta.cnpj,
    DataInicial: consulta.dataInicio,
    DataFinal: consulta.dataFim,
    Pagina: String(consulta.pagina ?? 1),
  });

  const res = await fetch(`${baseUrl}/nfse?${params}`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NFS-e Nacional API erro ${res.status}: ${text}`);
  }

  const data = await res.json();
  const nfses: NFSeNacionalResposta[] = (data.nfse ?? data.items ?? data ?? []).map(// eslint-disable-next-line @typescript-eslint/no-explicit-any
(nf: any) => ({
    chaveAcesso: (nf.chaveAcesso ?? nf.chNFSe ?? "") as string,
    numero: String(nf.nNFSe ?? nf.numero ?? ""),
    dataEmissao: (nf.dhEmissao ?? nf.dataEmissao ?? "") as string,
    competencia: (nf.competencia ?? "") as string,
    valorServicos: Number(nf.vServicos ?? nf.valorServicos ?? 0),
    valorIss: Number(nf.vISS ?? nf.valorIss ?? 0),
    valorPis: Number(nf.vPIS ?? nf.valorPis ?? 0),
    valorCofins: Number(nf.vCOFINS ?? nf.valorCofins ?? 0),
    aliquotaIss: Number(nf.aliqISS ?? nf.aliquotaIss ?? 0),
    descricaoServico: (nf.xDescServ ?? nf.descricaoServico ?? "") as string,
    tomadorCnpjCpf: (nf.tomador?.CNPJCPF ?? nf.tomadorCnpjCpf ?? null) as string | null,
    tomadorNome: (nf.tomador?.xNome ?? nf.tomadorNome ?? null) as string | null,
    prestadorCnpj: (nf.prestador?.CNPJ ?? nf.prestadorCnpj ?? consulta.cnpj) as string,
    prestadorNome: (nf.prestador?.xNome ?? nf.prestadorNome ?? "") as string,
    codigoMunicipio: (nf.cMunGeradorFG ?? nf.codigoMunicipio ?? "") as string,
    situacao: (nf.situacao ?? "normal") as "normal" | "cancelada" | "substituida",
  }));

  return nfses;
}

export async function consultarNFSeRecebidas(
  config: { ambiente: AmbienteNFSe; token: string },
  consulta: NFSeNacionalConsulta,
): Promise<NFSeNacionalResposta[]> {
  const baseUrl = getBaseUrl(config.ambiente);
  const params = new URLSearchParams({
    CNPJCPFTomador: consulta.cnpj,
    DataInicial: consulta.dataInicio,
    DataFinal: consulta.dataFim,
    Pagina: String(consulta.pagina ?? 1),
  });

  const res = await fetch(`${baseUrl}/nfse?${params}`, {
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`NFS-e Nacional API erro ${res.status}: ${text}`);
  }

  const data = await res.json();
  const nfses: NFSeNacionalResposta[] = (data.nfse ?? data.items ?? data ?? []).map(// eslint-disable-next-line @typescript-eslint/no-explicit-any
(nf: any) => ({
    chaveAcesso: (nf.chaveAcesso ?? nf.chNFSe ?? "") as string,
    numero: String(nf.nNFSe ?? nf.numero ?? ""),
    dataEmissao: (nf.dhEmissao ?? nf.dataEmissao ?? "") as string,
    competencia: (nf.competencia ?? "") as string,
    valorServicos: Number(nf.vServicos ?? nf.valorServicos ?? 0),
    valorIss: Number(nf.vISS ?? nf.valorIss ?? 0),
    valorPis: Number(nf.vPIS ?? nf.valorPis ?? 0),
    valorCofins: Number(nf.vCOFINS ?? nf.valorCofins ?? 0),
    aliquotaIss: Number(nf.aliqISS ?? nf.aliquotaIss ?? 0),
    descricaoServico: (nf.xDescServ ?? nf.descricaoServico ?? "") as string,
    tomadorCnpjCpf: (nf.tomador?.CNPJCPF ?? nf.tomadorCnpjCpf ?? null) as string | null,
    tomadorNome: (nf.tomador?.xNome ?? nf.tomadorNome ?? null) as string | null,
    prestadorCnpj: (nf.prestador?.CNPJ ?? nf.prestadorCnpj ?? "") as string,
    prestadorNome: (nf.prestador?.xNome ?? nf.prestadorNome ?? "") as string,
    codigoMunicipio: (nf.cMunGeradorFG ?? nf.codigoMunicipio ?? "") as string,
    situacao: (nf.situacao ?? "normal") as "normal" | "cancelada" | "substituida",
  }));

  return nfses;
}

export function nfseToInsert(nf: NFSeNacionalResposta, empresaId: string, tipo: "emitida" | "recebida"): NotaFiscalInsert {
  return {
    empresa_id: empresaId,
    chave_acesso: nf.chaveAcesso,
    numero: nf.numero,
    serie: null,
    modelo: "nfse",
    tipo,
    natureza_operacao: nf.descricaoServico || null,
    data_emissao: nf.dataEmissao,
    emitente_cnpj: nf.prestadorCnpj,
    emitente_nome: nf.prestadorNome,
    destinatario_cnpj: nf.tomadorCnpjCpf,
    destinatario_nome: nf.tomadorNome,
    valor_total: nf.valorServicos,
    valor_produtos: 0,
    valor_servicos: nf.valorServicos,
    valor_desconto: 0,
    valor_frete: 0,
    valor_icms: 0,
    valor_ipi: 0,
    valor_pis: nf.valorPis,
    valor_cofins: nf.valorCofins,
    valor_iss: nf.valorIss,
    status: nf.situacao === "cancelada" ? "cancelada" : "autorizada",
    situacao: "pendente",
  };
}
