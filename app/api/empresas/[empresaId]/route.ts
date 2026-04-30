import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
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
    const before = await buscarEmpresa(empresaId);
    const empresa = await editarEmpresa(empresaId, input);
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "empresa.updated",
      after_data: empresa,
      before_data: before,
      empresa_id: empresaId,
      resource_id: empresaId,
      resource_type: "empresa",
      user_id: user?.id ?? null,
    });

    return ok(empresa);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar empresa.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
