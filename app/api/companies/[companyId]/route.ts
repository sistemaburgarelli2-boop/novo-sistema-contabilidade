import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type RouteContext = {
  params: Promise<{ companyId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { companyId } = await context.params;
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
    .eq("id", companyId)
    .single();

  if (error) {
    return fail(error.message, 404);
  }

  return ok(data);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { companyId } = await context.params;
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
    .update({
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
    .eq("id", companyId)
    .select("*")
    .single();

  if (error) {
    return fail(error.message, 500);
  }

  return ok(data);
}
