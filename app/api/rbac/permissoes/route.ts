import { fail, ok } from "@/lib/apiResponse";
import { listarPermissoes } from "@/modules/rbac/rbac.service";

export async function GET() {
  try {
    return ok(await listarPermissoes());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar permissoes.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}
