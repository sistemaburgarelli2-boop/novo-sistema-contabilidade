import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const [planoContas, lancamentos, conciliacoes] = await Promise.all([
      supabase.from("plano_contas").select("*").eq("empresa_id", empresaId),
      supabase.from("lancamentos").select("*").eq("empresa_id", empresaId).order("data", { ascending: false }),
      supabase.from("conciliacoes").select("*").eq("empresa_id", empresaId),
    ]);

    return ok({
      planoContas: planoContas.data ?? [],
      lancamentos: lancamentos.data ?? [],
      conciliacoes: conciliacoes.data ?? [],
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
