/* ─── Tipos do Gerador de Contratos ─────────────────────────── */

export type TipoCampo =
  | "texto"
  | "numero"
  | "cpf"
  | "cnpj"
  | "rg"
  | "telefone"
  | "email"
  | "cep"
  | "data"
  | "hora"
  | "valor"
  | "percentual"
  | "select"
  | "checkbox"
  | "textarea";

export type CampoModelo = {
  id: string;
  label: string;
  tipo: TipoCampo;
  variavel: string; // nome da variável gerada, ex: VALOR
  obrigatorio: boolean;
  opcoes?: string[]; // para select
  placeholder?: string;
};

export type Clausula = {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string;
  texto: string; // pode conter {{VARIAVEIS}}
  tags: string[];
  versao: number;
  autor: string;
  criadaEm: string;
  status: "ativa" | "inativa";
  favorita: boolean;
};

export type OperadorRegra = "=" | "!=" | ">" | ">=" | "<" | "<=" | "contem";

export type Regra = {
  id: string;
  nome: string;
  campo: string; // variável do campo, ex: FORMA_PAGAMENTO
  operador: OperadorRegra;
  valor: string;
  clausulaId: string; // cláusula a adicionar
  ativa: boolean;
};

/* ── Construtor visual de cláusulas do modelo (CLM) ── */

export type StatusClausulaModelo =
  | "obrigatoria" // 🟢
  | "opcional" // 🟡
  | "condicional" // 🔵
  | "ia" // 🟣
  | "desativada"; // 🔴

export type ItemClausulaModelo = {
  id: string; // id único do item dentro do modelo (permite repetição)
  clausulaId: string | null; // referência à biblioteca (null = avulsa/IA)
  titulo: string;
  categoria: string;
  texto: string;
  status: StatusClausulaModelo;
  exibirNoIndice: boolean;
  permitirExclusao: boolean;
  permitirEdicao: boolean;
  fixa: boolean; // não pode ser reordenada/removida no contrato
  podeRepetir: boolean;
  podeOcultar: boolean;
  oculta: boolean; // ocultada da renderização
  dependeDe: string[]; // ids de itens dos quais depende
  autor: string;
  versao: number;
  criadaEm: string;
  atualizadaEm: string;
};

export type CapituloModelo = {
  id: string;
  titulo: string; // ex: "Das Partes"
  itens: ItemClausulaModelo[];
};

export type EstruturaModelo = {
  capitulos: CapituloModelo[];
};

export type ModeloContrato = {
  id: string;
  nome: string;
  categoria: string;
  descricao: string;
  icone: string;
  cor: string;
  status: "ativo" | "inativo";
  versao: number;
  tituloDocumento: string;
  preambulo: string; // texto de abertura com variáveis
  fechamento: string; // texto de fechamento com variáveis
  campos: CampoModelo[];
  clausulasObrigatorias: string[]; // ids de cláusulas (compat. assistente)
  clausulasOpcionais: string[]; // ids de cláusulas (compat. assistente)
  estrutura?: EstruturaModelo; // construtor visual (capítulos + itens)
  minAssinantes: number;
};

export type PapelParte =
  | "Contratante"
  | "Contratado"
  | "Representante Legal"
  | "Fiador"
  | "Testemunha"
  | "Responsável Financeiro"
  | "Advogado";

export type Parte = {
  id: string;
  nome: string;
  tipoPessoa: "PF" | "PJ";
  documento: string; // CPF ou CNPJ
  rg?: string;
  email: string;
  telefone: string;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  uf: string;
  papelPadrao: PapelParte;
};

export type ParteContrato = {
  parteId: string;
  papel: PapelParte;
  assinou: boolean;
  assinadoEm?: string;
};

export type ClausulaContrato = {
  clausulaId: string | null; // null = cláusula avulsa criada no contrato
  titulo: string;
  texto: string; // texto no momento da montagem (editável)
  origem: "obrigatoria" | "opcional" | "regra" | "manual";
};

export type StatusContrato =
  | "rascunho"
  | "em_revisao"
  | "aprovado"
  | "reprovado"
  | "pendente_assinatura"
  | "assinado"
  | "vencido"
  | "arquivado"
  | "cancelado";

export type VersaoContrato = {
  versao: number;
  data: string;
  autor: string;
  descricao: string;
  clausulas: ClausulaContrato[];
  dados: Record<string, string>;
};

export type Contrato = {
  id: string;
  numero: string; // CTR-2026-0001
  modeloId: string;
  modeloNome: string;
  titulo: string;
  status: StatusContrato;
  dados: Record<string, string>; // variável -> valor
  partes: ParteContrato[];
  clausulas: ClausulaContrato[];
  valor: number;
  dataInicio: string;
  dataVencimento: string;
  criadoEm: string;
  atualizadoEm: string;
  versao: number;
  versoes: VersaoContrato[];
};
