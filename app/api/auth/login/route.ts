import { fail, ok } from "@/lib/apiResponse";
import { checkRateLimit } from "@/lib/rateLimit";
import { getRequestContext } from "@/lib/requestContext";
import { logStructured } from "@/lib/logger";
import { signInWithPassword } from "@/modules/auth/auth.service";
import { validateLoginPayload } from "@/modules/auth/auth.validators";

export async function POST(request: Request) {
  try {
    const context = getRequestContext(request);
    const rateLimit = checkRateLimit({
      key: `login:${context.ip || "unknown"}`,
      limit: 8,
      windowMs: 60_000,
    });

    if (!rateLimit.allowed) {
      logStructured("warn", "auth.login.rate_limited", { ip: context.ip });
      return fail("Muitas tentativas. Aguarde e tente novamente.", 429);
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return fail("Supabase nao configurado. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.", 500);
    }

    const payload = validateLoginPayload(await request.json());
    const session = await signInWithPassword(payload);
    logStructured("info", "auth.login.success", { email: payload.email, ip: context.ip });

    return ok(session);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Nao foi possivel autenticar.";
    const status = message.includes("Credenciais") ? 401 : 400;
    logStructured("warn", "auth.login.failed", { message });

    return fail(message, status);
  }
}
