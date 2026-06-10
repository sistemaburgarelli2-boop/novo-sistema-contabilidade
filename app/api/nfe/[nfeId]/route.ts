import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { cancelarNFe } from "@/modules/nfe/nfe.service";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type Context = { params: Promise<{ nfeId: string }> };

export async function GET(_req: Request, ctx: Context) {
  try {
    await getCurrentSessionUser();
    const { nfeId } = await ctx.params;
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.from("notas_fiscais").select("*").eq("id", nfeId).single();
    if (error) return fail("NF-e não encontrada.", 404);
    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao buscar NF-e.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}

export async function DELETE(req: Request, ctx: Context) {
  try {
    await getCurrentSessionUser();
    const { nfeId } = await ctx.params;
    const { justificativa } = await req.json();
    if (!justificativa || justificativa.length < 15) {
      return fail("Justificativa de cancelamento deve ter ao menos 15 caracteres.", 400);
    }
    return ok(await cancelarNFe(nfeId, justificativa));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao cancelar NF-e.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 400);
  }
}
