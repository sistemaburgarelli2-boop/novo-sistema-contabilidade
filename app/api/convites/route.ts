import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { checkRateLimit } from "@/lib/rateLimit";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
import { criarConvite } from "@/modules/convites/convites.service";
import { validarCriarConvite } from "@/modules/convites/convites.validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rateLimit = checkRateLimit({
      key: `convite:create:${context.ip || "unknown"}`,
      limit: 20,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      return fail("Muitas tentativas de convite. Aguarde e tente novamente.", 429);
    }

    const input = validarCriarConvite(await request.json());
    const result = await criarConvite(input);
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...context,
      action: "convite.created",
      after_data: { email: input.email, role_id: input.role_id },
      empresa_id: input.empresa_id,
      resource_id: result.convite.id,
      resource_type: "convite",
      user_id: user?.id ?? null,
    });

    return ok(result, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar convite.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
