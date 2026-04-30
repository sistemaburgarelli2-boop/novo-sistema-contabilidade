import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
import { criarEmpresa, listarEmpresas } from "@/modules/empresas/empresas.service";
import { validarCriarEmpresa } from "@/modules/empresas/empresas.validators";

export async function GET() {
  try {
    return ok(await listarEmpresas());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar empresas.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = validarCriarEmpresa(await request.json());
    const empresa = await criarEmpresa(input);
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "empresa.created",
      after_data: empresa,
      empresa_id: empresa.id,
      resource_id: empresa.id,
      resource_type: "empresa",
      user_id: user?.id ?? null,
    });

    return ok(empresa, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar empresa.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
