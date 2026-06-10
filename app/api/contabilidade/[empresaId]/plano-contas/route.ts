import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { adicionarConta, obterPlanoContas } from "@/modules/contabilidade/contabilidade.service";

type Context = { params: Promise<{ empresaId: string }> };

export async function GET(_req: Request, ctx: Context) {
  try {
    const { empresaId } = await ctx.params;
    await getCurrentSessionUser();
    return ok(await obterPlanoContas(empresaId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao buscar plano de contas.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(req: Request, ctx: Context) {
  try {
    const { empresaId } = await ctx.params;
    await getCurrentSessionUser();
    const input = await req.json();
    return ok(await adicionarConta(empresaId, input), 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar conta.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 400);
  }
}
