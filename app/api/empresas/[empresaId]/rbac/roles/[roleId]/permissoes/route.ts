import { fail, ok } from "@/lib/apiResponse";
import { atualizarPermissoesRole } from "@/modules/rbac/rbac.service";
import { validarAtualizarPermissoes } from "@/modules/rbac/rbac.validators";

type RouteContext = {
  params: Promise<{ empresaId: string; roleId: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { empresaId, roleId } = await context.params;
    const input = validarAtualizarPermissoes(await request.json());
    await atualizarPermissoesRole(empresaId, roleId, input.permissao_ids);

    return ok({ updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar permissoes.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
