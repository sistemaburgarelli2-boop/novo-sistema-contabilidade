import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { obterLancamentos, registrarLancamento } from "@/modules/contabilidade/contabilidade.service";

type Context = { params: Promise<{ empresaId: string }> };

export async function GET(req: Request, ctx: Context) {
  try {
    const { empresaId } = await ctx.params;
    await getCurrentSessionUser();
    const url = new URL(req.url);
    const inicio = url.searchParams.get("inicio") ?? new Date().toISOString().slice(0, 7) + "-01";
    const fim = url.searchParams.get("fim") ?? new Date().toISOString().slice(0, 10);
    return ok(await obterLancamentos(empresaId, inicio, fim));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao buscar lançamentos.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(req: Request, ctx: Context) {
  try {
    const { empresaId } = await ctx.params;
    await getCurrentSessionUser();
    const input = await req.json();
    return ok(await registrarLancamento({ ...input, empresa_id: empresaId }), 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar lançamento.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 400);
  }
}
