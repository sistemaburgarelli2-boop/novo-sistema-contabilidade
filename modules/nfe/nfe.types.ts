export type ModeloNF = "nfse" | "nfe" | "nfce";

export type StatusNFe =
  | "rascunho"
  | "aguardando_autorizacao"
  | "autorizada"
  | "cancelada"
  | "rejeitada"
  | "inutilizada";

export type NFeItem = {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  ncm?: string;
  cfop?: string;
  unidade?: string;
};

export type NFeDestinatario = {
  nome: string;
  cpf_cnpj: string;
  email?: string;
  endereco?: {
    logradouro: string;
    numero: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
};

export type CriarNFeInput = {
  empresa_id: string;
  modelo: ModeloNF;
  destinatario: NFeDestinatario;
  itens: NFeItem[];
  natureza_operacao?: string;
  data_competencia?: string;
  observacoes?: string;
};

export type NFe = {
  id: string;
  empresa_id: string;
  numero: string | null;
  serie: string | null;
  modelo: ModeloNF;
  status: StatusNFe;
  chave_acesso: string | null;
  focus_id: string | null;
  danfe_url: string | null;
  xml_url: string | null;
  destinatario_nome: string;
  destinatario_documento: string;
  valor_produtos: number;
  valor_servicos: number;
  valor_impostos: number;
  valor_total: number;
  natureza_operacao: string;
  data_emissao: string | null;
  data_competencia: string | null;
  mensagem_sefaz: string | null;
  payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type FocusNFePayload = {
  natureza_operacao: string;
  data_emissao: string;
  tipo_documento: 1 | 0;
  local_destino: 1 | 2 | 3;
  finalidade_emissao: "1" | "2" | "3" | "4";
  emitente: {
    nome: string;
    cnpj: string;
    endereco_logradouro: string;
    endereco_numero: string;
    endereco_bairro: string;
    endereco_municipio: string;
    endereco_uf: string;
    endereco_cep: string;
  };
  destinatario: {
    nome: string;
    cnpj?: string;
    cpf?: string;
    email?: string;
    endereco_logradouro?: string;
    endereco_numero?: string;
    endereco_bairro?: string;
    endereco_municipio?: string;
    endereco_uf?: string;
    endereco_cep?: string;
  };
  items: {
    numero_item: number;
    descricao: string;
    quantidade_comercial: number;
    valor_unitario_comercial: number;
    ncm: string;
    cfop: string;
    unidade_comercial: string;
  }[];
};

export type FocusNFeResponse = {
  status: "autorizado" | "processando_autorizacao" | "denegado" | "erro_autorizacao" | "cancelado";
  chave_nfe?: string;
  numero?: string;
  serie?: string;
  caminho_danfe?: string;
  caminho_xml_nota_fiscal?: string;
  mensagem_sefaz?: string;
  codigo_verificacao?: string;
};
