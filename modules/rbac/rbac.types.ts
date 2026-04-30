export type Permissao = {
  id: string;
  chave: string;
  descricao: string | null;
  modulo: string;
};

export type RoleComPermissoes = {
  id: string;
  empresa_id: string;
  chave: string;
  nome: string;
  descricao: string | null;
  sistema: boolean;
  permissoes: Permissao[];
};

export type CriarRoleInput = {
  empresa_id: string;
  chave: string;
  nome: string;
  descricao?: string;
};

export type AtualizarPermissoesRoleInput = {
  permissao_ids: string[];
};
