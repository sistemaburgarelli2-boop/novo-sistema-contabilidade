// Deprecated: use /api/empresas. Kept for backward-compat.
import { fail, ok } from "@/lib/apiResponse";
import { criarEmpresa, listarEmpresas } from "@/modules/empresas/empresas.service";
import { validarCriarEmpresa } from "@/modules/empresas/empresas.validators";

export async function GET() {
  try {
    return ok(await listarEmpresas());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao listar empresas.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(request: Request) {
  try {
    const input = validarCriarEmpresa(await request.json());
    return ok(await criarEmpresa(input), 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar empresa.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 400);
  }
}
