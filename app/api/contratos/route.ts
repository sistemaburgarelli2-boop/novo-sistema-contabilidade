import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);
    const { data, error } = await supabase
      .from("contratos")
      .select("*, empresas(nome_legal)")
      .order("created_at", { ascending: false });
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
    const { data, error } = await supabase.from("contratos").insert({ ...input, criado_por: user.id }).select("*").single();
    if (error) throw new Error(error.message);
    return ok(data, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 400);
  }
}
