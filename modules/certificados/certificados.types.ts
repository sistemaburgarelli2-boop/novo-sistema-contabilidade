export type Certificado = {
  id: string;
  empresa_id: string;
  tipo: "A1" | "A3" | "eCPF" | "eCNPJ" | "Representante";
  modelo: string;
  titular: string;
  documento: string;
  email: string | null;
  telefone: string | null;
  numero_serie: string | null;
  fornecedor: string | null;
  emissao: string;
  validade: string;
  dias_restantes: number;
  status: "ativo" | "proximo_vencimento" | "renovando" | "vencido" | "suspenso" | "revogado";
  observacoes: string | null;
  arquivo_url: string | null;
  responsavel: string | null;
  alertas_config: { dias: number[]; canais: string[] };
  created_at: string;
  updated_at: string;
  // Joined fields
  empresas?: { nome_legal: string; cnpj: string | null } | null;
};

export type CriarCertificadoInput = {
  empresa_id: string;
  tipo: string;
  titular: string;
  documento: string;
  email?: string;
  telefone?: string;
  numero_serie?: string;
  fornecedor?: string;
  emissao: string;
  validade: string;
  observacoes?: string;
  responsavel?: string;
};

export type CertificadoRenovacao = {
  id: string;
  certificado_id: string;
  empresa_id: string;
  status: string;
  prazo: string | null;
  responsavel: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  certificados?: { titular: string; tipo: string; validade: string } | null;
  empresas?: { nome_legal: string } | null;
};

export type CriarRenovacaoInput = {
  certificado_id: string;
  empresa_id: string;
  status?: string;
  prazo?: string;
  responsavel?: string;
  observacoes?: string;
};

export type CertificadoInstalacao = {
  id: string;
  certificado_id: string;
  empresa_id: string;
  dispositivo: string;
  sistema: string | null;
  navegador: string | null;
  responsavel: string | null;
  instalado_em: string;
  created_at: string;
};

export type CertificadoHistorico = {
  id: string;
  certificado_id: string;
  empresa_id: string;
  acao: string;
  descricao: string | null;
  usuario: string | null;
  ip: string | null;
  created_at: string;
};

export type RegistrarHistoricoInput = {
  certificado_id: string;
  empresa_id: string;
  acao: string;
  descricao?: string;
  usuario?: string;
};
