import { fail, ok } from "@/lib/apiResponse";
import { getRequestContext } from "@/lib/requestContext";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { registrarAuditLog } from "@/modules/auditoria/auditoria.service";
import {
  adicionarUsuarioExistente,
  listarUsuariosDaEmpresa,
} from "@/modules/usuarios/usuarios.service";
import { validarVincularUsuario } from "@/modules/usuarios/usuarios.validators";

type RouteContext = {
  params: Promise<{ empresaId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    return ok(await listarUsuariosDaEmpresa(empresaId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar usuarios.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { empresaId } = await context.params;
    const input = validarVincularUsuario(await request.json());
    const vinculo = await adicionarUsuarioExistente(empresaId, input);
    const user = await getCurrentSessionUser();

    await registrarAuditLog({
      ...getRequestContext(request),
      action: "usuario_empresa.created",
      after_data: vinculo,
      empresa_id: empresaId,
      resource_id: vinculo.id,
      resource_type: "usuario_empresa",
      user_id: user?.id ?? null,
    });

    return ok(vinculo, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao vincular usuario.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
