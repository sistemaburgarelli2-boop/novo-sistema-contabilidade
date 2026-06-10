import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { aprovarFolha, calcularFolha, obterHolerites } from "@/modules/payroll/payroll.service";

type Context = { params: Promise<{ folhaId: string }> };

export async function GET(_req: Request, ctx: Context) {
  try {
    await getCurrentSessionUser();
    const { folhaId } = await ctx.params;
    return ok(await obterHolerites(folhaId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao buscar holerites.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(req: Request, ctx: Context) {
  try {
    await getCurrentSessionUser();
    const { folhaId } = await ctx.params;
    const { acao } = await req.json();

    if (acao === "calcular") return ok(await calcularFolha(folhaId));
    if (acao === "aprovar") return ok(await aprovarFolha(folhaId));

    return fail("Ação inválida. Use 'calcular' ou 'aprovar'.", 400);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao processar folha.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 400);
  }
}
