import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
import { criarRole, listarRolesEmpresa } from "@/modules/rbac/rbac.service";
import { validarCriarRole } from "@/modules/rbac/rbac.validators";

type RouteContext = {
  params: Promise<{ empresaId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    return ok(await listarRolesEmpresa(empresaId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar roles.";
    return fail(message, message === "Nao autenticado." ? 401 : 403);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    const input = validarCriarRole({ ...(await request.json()), empresa_id: empresaId });
    const role = await criarRole(input);
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "rbac.role.created",
      after_data: role,
      empresa_id: empresaId,
      resource_id: role.id,
      resource_type: "role",
      user_id: user?.id ?? null,
    });

    return ok(role, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar role.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
