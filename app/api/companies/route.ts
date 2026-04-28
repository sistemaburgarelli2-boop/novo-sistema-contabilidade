import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("Nao autenticado.", 401);
  }

  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("created_at", { ascending: false });

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

  if (!payload.legal_name || typeof payload.legal_name !== "string") {
    return fail("Razao social e obrigatoria.");
  }

  const { data, error } = await supabase
    .from("companies")
    .insert({
      owner_id: user.id,
      legal_name: payload.legal_name,
      trade_name: payload.trade_name || null,
      cnpj: payload.cnpj || null,
      tax_regime: payload.tax_regime || null,
      main_cnae: payload.main_cnae || null,
      city: payload.city || null,
      state: payload.state || null,
      lifecycle_stage: payload.lifecycle_stage || "analysis",
      status: payload.status || "analysis",
    })
    .select("*")
    .single();

  if (error) {
    return fail(error.message, 500);
  }

  return ok(data, 201);
}
