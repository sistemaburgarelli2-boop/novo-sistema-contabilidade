import { redirect } from "next/navigation";

/**
 * "Impostos e guias" e "Guias" eram duas telas com o mesmo conteudo. Agora que
 * a lista le do banco, manter as duas significaria duplicar a leitura e deixar
 * uma delas envelhecer. A rota continua existindo para nao quebrar links ja
 * enviados aos clientes.
 */
export default async function PortalImpostos({
  params,
}: {
  params: Promise<{ empresaId: string }>;
}) {
  const { empresaId } = await params;
  redirect(`/portal/${empresaId}/guias`);
}
