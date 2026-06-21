import { fail, ok } from "@/lib/apiResponse";
import { listarHistorico } from "@/modules/certificados/certificados.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const certificadoId = searchParams.get("certificado_id") ?? undefined;
    return ok(await listarHistorico(certificadoId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar historico.";
    return fail(message, message === "Nao autenticado." ? 401 : 500);
  }
}
