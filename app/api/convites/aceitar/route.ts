import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
import { aceitarConvite, visualizarConvite } from "@/modules/convites/convites.service";
import { validarAceitarConvite } from "@/modules/convites/convites.validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token") || "";

    if (!token) {
      return fail("Token obrigatorio.", 400);
    }

    return ok(await visualizarConvite(token));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Convite invalido.";
    return fail(message, 400);
  }
}

export async function POST(request: Request) {
  try {
    const input = validarAceitarConvite(await request.json());
    const result = await aceitarConvite(input);

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "convite.accepted",
      after_data: { email: result.email },
      resource_type: "convite",
    });

    return ok(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao aceitar convite.";
    return fail(message, 400);
  }
}
