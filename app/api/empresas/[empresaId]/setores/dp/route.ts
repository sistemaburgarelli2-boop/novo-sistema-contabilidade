import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const [funcionarios, ferias, esocial, folhas] = await Promise.all([
      supabase.from("funcionarios").select("*").eq("empresa_id", empresaId),
      supabase.from("dp_ferias").select("*").eq("empresa_id", empresaId),
      supabase.from("esocial_eventos").select("*").eq("empresa_id", empresaId),
      supabase.from("folhas_pagamento").select("*").eq("empresa_id", empresaId),
    ]);

    return ok({
      funcionarios: funcionarios.data ?? [],
      ferias: ferias.data ?? [],
      esocial: esocial.data ?? [],
      folhas: folhas.data ?? [],
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
