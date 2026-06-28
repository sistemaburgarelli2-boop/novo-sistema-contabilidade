import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const { searchParams } = new URL(request.url);
    const data_filtro = searchParams.get("data") || new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from("ponto_eletronico")
      .select("*")
      .eq("data", data_filtro)
      .order("hora", { ascending: true });

    if (error) throw new Error(error.message);
    return ok(data ?? []);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const input = await request.json();
    const registro = {
      user_id: input.user_id,
      user_nome: input.user_nome,
      tipo: input.tipo,
      data: input.data || new Date().toISOString().slice(0, 10),
      hora: input.hora || new Date().toISOString(),
      observacao: input.observacao || null,
    };

    const { data, error } = await supabase
      .from("ponto_eletronico")
      .insert(registro)
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return ok(data, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 400);
  }
}
