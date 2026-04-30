import { fail, ok } from "@/lib/apiResponse";
import { listarRolesDaEmpresa } from "@/modules/usuarios/usuarios.service";

type RouteContext = {
  params: Promise<{ empresaId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    return ok(await listarRolesDaEmpresa(empresaId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar roles.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}
