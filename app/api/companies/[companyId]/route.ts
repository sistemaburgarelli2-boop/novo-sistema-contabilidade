// Deprecated: use /api/empresas/[empresaId]. Kept for backward-compat.
import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import {
  buscarEmpresa,
  editarEmpresa,
} from "@/modules/empresas/empresas.service";
import { validarAtualizarEmpresa } from "@/modules/empresas/empresas.validators";

type Context = { params: Promise<{ companyId: string }> };

export async function GET(_req: Request, ctx: Context) {
  try {
    const { companyId } = await ctx.params;
    await getCurrentSessionUser();
    return ok(await buscarEmpresa(companyId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 404);
  }
}

export async function PATCH(req: Request, ctx: Context) {
  try {
    const { companyId } = await ctx.params;
    await getCurrentSessionUser();
    const input = validarAtualizarEmpresa(await req.json());
    return ok(await editarEmpresa(companyId, input));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 400);
  }
}
