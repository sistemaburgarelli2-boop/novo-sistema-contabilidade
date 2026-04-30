export type Empresa = {
  id: string;
  plano_id: string | null;
  nome_legal: string;
  nome_fantasia: string | null;
  cnpj: string | null;
  regime_tributario: string | null;
  status: "ativa" | "suspensa" | "cancelada" | "encerrada";
  subdominio: string | null;
  cidade: string | null;
  estado: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type CriarEmpresaInput = {
  nome_legal: string;
  nome_fantasia?: string;
  cnpj?: string;
  regime_tributario?: string;
  subdominio?: string;
  cidade?: string;
  estado?: string;
};

export type AtualizarEmpresaInput = Partial<CriarEmpresaInput> & {
  status?: Empresa["status"];
};
