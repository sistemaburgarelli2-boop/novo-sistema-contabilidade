import { fail, ok } from "@/lib/apiResponse";
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
    return ok(await criarEmpresa(input), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar empresa.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
