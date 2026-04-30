import { fail, ok } from "@/lib/apiResponse";
import { signInWithPassword } from "@/modules/auth/auth.service";
import { validateLoginPayload } from "@/modules/auth/auth.validators";

export async function POST(request: Request) {
  try {
    const payload = validateLoginPayload(await request.json());
    const session = await signInWithPassword(payload);

    return ok(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel autenticar.";
    const status = message.includes("Credenciais") ? 401 : 400;

    return fail(message, status);
  }
}
