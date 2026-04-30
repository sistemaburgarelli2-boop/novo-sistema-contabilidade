import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";

export async function GET() {
  const user = await getCurrentSessionUser();

  if (!user) {
    return fail("Nao autenticado.", 401);
  }

  return ok({ user });
}
