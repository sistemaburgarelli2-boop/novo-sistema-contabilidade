export type TipoRubrica =
  | "salario_base"
  | "hora_extra"
  | "adicional_noturno"
  | "adicional_periculosidade"
  | "adicional_insalubridade"
  | "ferias"
  | "decimo_terceiro"
  | "inss"
  | "irrf"
  | "fgts"
  | "vale_transporte"
  | "vale_refeicao"
  | "outros_proventos"
  | "outros_descontos";

export type NaturezaRubrica = "provento" | "desconto" | "informativo";

export type Rubrica = {
  id: string;
  empresa_id: string;
  nome: string;
  tipo: TipoRubrica;
  natureza: NaturezaRubrica;
  percentual: number | null;
  valor_fixo: number | null;
  ativo: boolean;
};

export type StatusFolha = "rascunho" | "calculada" | "aprovada" | "paga" | "cancelada";

export type FolhaPagamento = {
  id: string;
  empresa_id: string;
  competencia: string;
  status: StatusFolha;
  total_proventos: number;
  total_descontos: number;
  total_liquido: number;
  total_encargos: number;
  created_at: string;
  updated_at: string;
};

export type Holerite = {
  id: string;
  folha_id: string;
  funcionario_id: string;
  salario_base: number;
  total_proventos: number;
  total_descontos: number;
  liquido: number;
  inss: number;
  irrf: number;
  fgts: number;
  funcionarios?: { nome: string; cpf: string | null; cargo: string | null } | null;
  rubricas?: HoleriteRubrica[];
};

export type HoleriteRubrica = {
  id: string;
  holerite_id: string;
  rubrica_id: string;
  descricao: string;
  natureza: NaturezaRubrica;
  valor: number;
  referencia: number | null;
};

export type CriarFolhaInput = {
  empresa_id: string;
  competencia: string;
};

export type CalculoINSS = {
  base: number;
  aliquota: number;
  valor: number;
};

export type CalculoIRRF = {
  base: number;
  aliquota: number;
  deducao: number;
  valor: number;
};
