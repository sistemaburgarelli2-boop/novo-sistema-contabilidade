import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { gerarDRE } from "@/modules/contabilidade/contabilidade.service";

type Context = { params: Promise<{ empresaId: string }> };

export async function GET(req: Request, ctx: Context) {
  try {
    const { empresaId } = await ctx.params;
    await getCurrentSessionUser();
    const url = new URL(req.url);
    const ano = url.searchParams.get("ano") ?? new Date().getFullYear().toString();
    const inicio = `${ano}-01-01`;
    const fim = `${ano}-12-31`;
    return ok(await gerarDRE(empresaId, inicio, fim));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao gerar DRE.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}
