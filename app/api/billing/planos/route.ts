import { fail, ok } from "@/lib/apiResponse";
import { listarPlanos } from "@/modules/billing/billing.service";

export async function GET() {
  try {
    return ok(await listarPlanos());
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar planos.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}
