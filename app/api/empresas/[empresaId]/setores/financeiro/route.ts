import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const [mensalidades, comissoes] = await Promise.all([
      supabase.from("mensalidades").select("*"),
      supabase.from("comissoes").select("*"),
    ]);

    return ok({
      mensalidades: mensalidades.data ?? [],
      comissoes: comissoes.data ?? [],
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
