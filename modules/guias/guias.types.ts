/** Status de uma guia, do lancamento pelo escritorio ate a baixa. */
export type StatusGuia =
  | "pendente"
  | "emitida"
  | "disponivel"
  | "paga"
  | "vencida"
  | "cancelada";

/**
 * Status que o cliente enxerga no portal. `pendente` e `emitida` sao etapas
 * internas do escritorio: publicar uma guia ainda em conferencia levaria o
 * cliente a pagar um valor que pode mudar.
 */
export const STATUS_VISIVEIS_CLIENTE: StatusGuia[] = ["disponivel", "paga", "vencida"];

export const STATUS_GUIA_LABEL: Record<StatusGuia, string> = {
  cancelada: "Cancelada",
  disponivel: "Disponível ao cliente",
  emitida: "Emitida",
  paga: "Paga",
  pendente: "Pendente",
  vencida: "Vencida",
};

export type Guia = {
  id: string;
  empresa_id: string;
  competencia: string;
  imposto: string;
  vencimento: string;
  valor: number;
  status: StatusGuia;
  codigo_barras: string | null;
  arquivo_url: string | null;
  pago_em: string | null;
  emitida_por: string | null;
  created_at: string;
  updated_at: string;
};

export type CriarGuiaInput = {
  competencia: string;
  imposto: string;
  vencimento: string;
  valor: number;
  codigo_barras?: string | null;
  status?: StatusGuia;
};

export type AtualizarGuiaInput = {
  status?: StatusGuia;
  pago_em?: string | null;
  valor?: number;
  vencimento?: string;
  codigo_barras?: string | null;
};

/** Uma guia so pode ser publicada ou baixada quando tem valor apurado. */
export function podePublicar(guia: Pick<Guia, "valor">) {
  return guia.valor > 0;
}

/**
 * O banco nao recalcula o vencimento sozinho: uma guia `disponivel` com
 * vencimento passado continua gravada como `disponivel`. Para o cliente ela e
 * uma guia vencida, entao a apresentacao corrige isso na leitura.
 */
export function statusEfetivo(guia: Pick<Guia, "status" | "vencimento">, hoje = new Date()): StatusGuia {
  if (guia.status !== "disponivel") return guia.status;

  const vencimento = new Date(`${guia.vencimento}T23:59:59`);
  return vencimento < hoje ? "vencida" : "disponivel";
}
