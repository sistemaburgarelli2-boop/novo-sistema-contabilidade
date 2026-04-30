import { fail, ok } from "@/lib/apiResponse";
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
    return ok(await criarRole(input), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar role.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
