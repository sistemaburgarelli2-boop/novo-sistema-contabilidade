import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
import { criarRenovacao, listarRenovacoes } from "@/modules/certificados/certificados.service";

export async function GET() {
  try {
    return ok(await listarRenovacoes());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar renovacoes.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const renovacao = await criarRenovacao(input);
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "certificado_renovacao.created",
      after_data: renovacao,
      empresa_id: renovacao.empresa_id,
      resource_id: renovacao.id,
      resource_type: "certificado_renovacao",
      user_id: user?.id ?? null,
    });

    return ok(renovacao, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar renovacao.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
