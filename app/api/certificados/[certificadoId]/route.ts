import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
import {
  atualizarCertificado,
  buscarCertificado,
  excluirCertificado,
} from "@/modules/certificados/certificados.service";

type RouteContext = {
  params: Promise<{ certificadoId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { certificadoId } = await context.params;
    return ok(await buscarCertificado(certificadoId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao buscar certificado.";
    return fail(message, message === "Nao autenticado." ? 401 : 404);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { certificadoId } = await context.params;
    const input = await request.json();
    const before = await buscarCertificado(certificadoId);
    const certificado = await atualizarCertificado(certificadoId, input);
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "certificado.updated",
      after_data: certificado,
      before_data: before,
      empresa_id: certificado.empresa_id,
      resource_id: certificadoId,
      resource_type: "certificado",
      user_id: user?.id ?? null,
    });

    return ok(certificado);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar certificado.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { certificadoId } = await context.params;
    await excluirCertificado(certificadoId);
    return ok({ deleted: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir certificado.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
