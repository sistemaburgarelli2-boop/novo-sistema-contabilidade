import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
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
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "rbac.role_permissions.updated",
      after_data: input,
      empresa_id: empresaId,
      resource_id: roleId,
      resource_type: "role",
      user_id: user?.id ?? null,
    });

    return ok({ updated: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar permissoes.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
