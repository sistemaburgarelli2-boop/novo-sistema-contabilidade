import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const [obrigacoes, guias, certidoes, sped] = await Promise.all([
      supabase.from("obrigacoes_fiscais").select("*").eq("empresa_id", empresaId).order("vencimento"),
      supabase.from("guias").select("*").eq("empresa_id", empresaId).order("vencimento"),
      supabase.from("certidoes").select("*").eq("empresa_id", empresaId),
      supabase.from("sped_arquivos").select("*").eq("empresa_id", empresaId).order("created_at", { ascending: false }),
    ]);

    return ok({
      obrigacoes: obrigacoes.data ?? [],
      guias: guias.data ?? [],
      certidoes: certidoes.data ?? [],
      sped: sped.data ?? [],
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
