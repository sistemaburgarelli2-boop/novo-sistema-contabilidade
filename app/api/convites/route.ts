import { fail, ok } from "@/lib/apiResponse";
import { criarConvite } from "@/modules/convites/convites.service";
import { validarCriarConvite } from "@/modules/convites/convites.validators";

export async function POST(request: Request) {
  try {
    const input = validarCriarConvite(await request.json());
    return ok(await criarConvite(input), 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar convite.";
    return fail(message, message === "Nao autenticado." ? 401 : 400);
  }
}
