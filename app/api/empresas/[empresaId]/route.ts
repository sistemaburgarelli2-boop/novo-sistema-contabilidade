import { fail, ok } from "@/lib/apiResponse";
import { buscarEmpresa, editarEmpresa } from "@/modules/empresas/empresas.service";
import { validarAtualizarEmpresa } from "@/modules/empresas/empresas.validators";

type RouteContext = {
  params: Promise<{ empresaId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    return ok(await buscarEmpresa(empresaId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar empresa.";
    return fail(message, message === "Nao autenticado." ? 401 : 404);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    const input = validarAtualizarEmpresa(await request.json());
    return ok(await editarEmpresa(empresaId, input));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar empresa.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
