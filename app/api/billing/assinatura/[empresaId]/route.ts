import { fail, ok } from "@/lib/apiResponse";
import { buscarAssinaturaEmpresa } from "@/modules/billing/billing.service";

type RouteContext = {
  params: Promise<{ empresaId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    return ok(await buscarAssinaturaEmpresa(empresaId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar assinatura.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}
