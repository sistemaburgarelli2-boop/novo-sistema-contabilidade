import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const [processos, alvaras, documentos] = await Promise.all([
      supabase.from("processos_societarios").select("*").eq("empresa_id", empresaId),
      supabase.from("alvaras").select("*").eq("empresa_id", empresaId),
      supabase.from("documentos").select("*").eq("empresa_id", empresaId).eq("setor", "societario"),
    ]);

    return ok({
      processos: processos.data ?? [],
      alvaras: alvaras.data ?? [],
      documentos: documentos.data ?? [],
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
