export type AmbienteNFSe = "producao" | "homologacao";

export type ConfigNFSeNacional = {
  ambiente: AmbienteNFSe;
  certificadoBase64?: string;
  certificadoSenha?: string;
};

export type NFSeNacionalConsulta = {
  cnpj: string;
  dataInicio: string;
  dataFim: string;
  pagina?: number;
};

export type NFSeNacionalResposta = {
  chaveAcesso: string;
  numero: string;
  dataEmissao: string;
  competencia: string;
  valorServicos: number;
  valorIss: number;
  valorPis: number;
  valorCofins: number;
  aliquotaIss: number;
  descricaoServico: string;
  tomadorCnpjCpf: string | null;
  tomadorNome: string | null;
  prestadorCnpj: string;
  prestadorNome: string;
  codigoMunicipio: string;
  situacao: "normal" | "cancelada" | "substituida";
};

export type NotaFiscalInsert = {
  empresa_id: string;
  chave_acesso: string;
  numero: string;
  serie: string | null;
  modelo: "nfse";
  tipo: "emitida" | "recebida";
  natureza_operacao: string | null;
  data_emissao: string;
  emitente_cnpj: string | null;
  emitente_nome: string | null;
  destinatario_cnpj: string | null;
  destinatario_nome: string | null;
  valor_total: number;
  valor_produtos: number;
  valor_servicos: number;
  valor_desconto: number;
  valor_frete: number;
  valor_icms: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  valor_iss: number;
  status: "autorizada" | "cancelada";
  situacao: "pendente";
};
