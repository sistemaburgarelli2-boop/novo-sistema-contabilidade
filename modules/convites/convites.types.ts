export type Convite = {
  id: string;
  empresa_id: string;
  email: string;
  role_id: string;
  status: "pendente" | "aceito" | "expirado" | "cancelado";
  convidado_por: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CriarConviteInput = {
  empresa_id: string;
  email: string;
  role_id: string;
};

export type AceitarConviteInput = {
  nome: string;
  password: string;
  token: string;
};

export type ConvitePublico = {
  email: string;
  empresa: {
    id: string;
    nome: string;
  };
  role: {
    id: string;
    nome: string;
  };
};
