export type UsuarioEmpresa = {
  id: string;
  empresa_id: string;
  usuario_id: string;
  role_id: string;
  status: "ativo" | "pendente" | "bloqueado" | "removido";
  usuarios?: {
    email: string;
    nome: string | null;
  } | null;
  roles?: {
    chave: string;
    nome: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type RoleEmpresa = {
  id: string;
  empresa_id: string;
  chave: string;
  nome: string;
  descricao: string | null;
};

export type VincularUsuarioInput = {
  email: string;
  role_id: string;
};
