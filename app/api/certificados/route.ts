import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
import { criarCertificado, listarCertificados } from "@/modules/certificados/certificados.service";

export async function GET() {
  try {
    return ok(await listarCertificados());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar certificados.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = await request.json();
    const certificado = await criarCertificado(input);
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "certificado.created",
      after_data: certificado,
      empresa_id: certificado.empresa_id,
      resource_id: certificado.id,
      resource_type: "certificado",
      user_id: user?.id ?? null,
    });

    return ok(certificado, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar certificado.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
