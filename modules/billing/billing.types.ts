export type Plano = {
  id: string;
  codigo: string;
  nome: string;
  preco_centavos: number;
  limite_empresas: number;
  limite_usuarios: number;
  limite_transacoes_mes: number;
  recursos: Record<string, unknown>;
  ativo: boolean;
};

export type Assinatura = {
  id: string;
  empresa_id: string;
  plano_id: string;
  status: "trial" | "active" | "past_due" | "canceled" | "blocked";
  current_period_start: string | null;
  current_period_end: string | null;
};

export type UsoPlano = {
  empresas: number;
  transacoes_mes: number;
  usuarios: number;
};
