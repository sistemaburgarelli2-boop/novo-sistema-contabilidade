import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Nao autenticado.", 401);
  }

  const { searchParams } = new URL(request.url);
  const companyId = searchParams.get("companyId");

  if (!companyId) {
    return fail("Empresa obrigatoria.");
  }

  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("company_id", companyId)
    .order("name");

  if (error) {
    return fail(error.message, 500);
  }

  return ok(data);
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Nao autenticado.", 401);
  }

  const payload = await request.json();

  if (!payload.company_id || !payload.name || !payload.type) {
    return fail("Empresa, nome e tipo sao obrigatorios.");
  }

  const { data, error } = await supabase
    .from("categories")
    .insert({
      company_id: payload.company_id,
      name: payload.name,
      type: payload.type,
      color: payload.color || null,
    })
    .select("*")
    .single();

  if (error) {
    return fail(error.message, 500);
  }

  return ok(data, 201);
}
