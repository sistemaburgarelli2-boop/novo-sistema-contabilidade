import { fail, ok } from "@/lib/apiResponse";
import { listarAuditLogs } from "@/modules/auditoria/auditoria.service";

type RouteContext = {
  params: Promise<{ empresaId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    return ok(await listarAuditLogs(empresaId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar auditoria.";
    return fail(message, message === "Nao autenticado." ? 401 : 403);
  }
}
