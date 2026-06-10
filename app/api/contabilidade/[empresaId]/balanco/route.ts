import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { gerarBalanco } from "@/modules/contabilidade/contabilidade.service";

type Context = { params: Promise<{ empresaId: string }> };

export async function GET(req: Request, ctx: Context) {
  try {
    const { empresaId } = await ctx.params;
    await getCurrentSessionUser();
    const url = new URL(req.url);
    const data = url.searchParams.get("data") ?? new Date().toISOString().slice(0, 10);
    return ok(await gerarBalanco(empresaId, data));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao gerar balanço.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}
