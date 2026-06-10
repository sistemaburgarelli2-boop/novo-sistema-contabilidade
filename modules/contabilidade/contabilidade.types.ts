export type TipoConta =
  | "ativo_circulante"
  | "ativo_nao_circulante"
  | "passivo_circulante"
  | "passivo_nao_circulante"
  | "patrimonio_liquido"
  | "receita"
  | "custo"
  | "despesa_operacional"
  | "despesa_financeira"
  | "outras_receitas";

export type NaturezaConta = "devedora" | "credora";

export type PlanoConta = {
  id: string;
  empresa_id: string;
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  pai_id: string | null;
  nivel: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type CriarPlanoContaInput = {
  codigo: string;
  nome: string;
  tipo: TipoConta;
  natureza: NaturezaConta;
  pai_id?: string;
};

export type NaturezaPartida = "debito" | "credito";

export type Lancamento = {
  id: string;
  empresa_id: string;
  data_lancamento: string;
  historico: string;
  transaction_id: string | null;
  created_at: string;
};

export type LancamentoPartida = {
  id: string;
  lancamento_id: string;
  conta_id: string;
  natureza: NaturezaPartida;
  valor: number;
  contas?: Pick<PlanoConta, "codigo" | "nome" | "tipo" | "natureza">;
};

export type CriarLancamentoInput = {
  empresa_id: string;
  data_lancamento: string;
  historico: string;
  transaction_id?: string;
  partidas: {
    conta_id: string;
    natureza: NaturezaPartida;
    valor: number;
  }[];
};

export type LinhaDRE = {
  conta: string;
  descricao: string;
  valor: number;
};

export type DRE = {
  empresa_id: string;
  periodo_inicio: string;
  periodo_fim: string;
  receita_bruta: number;
  deducoes: number;
  receita_liquida: number;
  custos: number;
  lucro_bruto: number;
  despesas_operacionais: number;
  ebit: number;
  resultado_financeiro: number;
  lucro_antes_ir: number;
  ir_csll: number;
  lucro_liquido: number;
  linhas: LinhaDRE[];
};

export type GrupoBalanco = {
  descricao: string;
  total: number;
  contas: { codigo: string; nome: string; saldo: number }[];
};

export type Balanco = {
  empresa_id: string;
  data_referencia: string;
  ativo: {
    circulante: GrupoBalanco;
    nao_circulante: GrupoBalanco;
    total: number;
  };
  passivo: {
    circulante: GrupoBalanco;
    nao_circulante: GrupoBalanco;
    total: number;
  };
  patrimonio_liquido: GrupoBalanco & { total: number };
  total_passivo_pl: number;
};
