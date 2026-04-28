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
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");

  if (!companyId) {
    return fail("Empresa obrigatoria.");
  }

  let query = supabase
    .from("transactions")
    .select("*, categories(name)")
    .eq("company_id", companyId)
    .order("transaction_date", { ascending: false });

  if (startDate) {
    query = query.gte("transaction_date", startDate);
  }

  if (endDate) {
    query = query.lte("transaction_date", endDate);
  }

  const { data, error } = await query;

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

  if (!payload.company_id || !payload.description || !payload.type || !payload.amount) {
    return fail("Empresa, descricao, tipo e valor sao obrigatorios.");
  }

  if (!["income", "expense"].includes(payload.type)) {
    return fail("Tipo de transacao invalido.");
  }

  const amount = Number(payload.amount);

  if (Number.isNaN(amount) || amount < 0) {
    return fail("Valor invalido.");
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      company_id: payload.company_id,
      category_id: payload.category_id || null,
      type: payload.type,
      description: payload.description,
      amount,
      transaction_date: payload.transaction_date,
      payment_method: payload.payment_method || null,
      document_number: payload.document_number || null,
      notes: payload.notes || null,
    })
    .select("*, categories(name)")
    .single();

  if (error) {
    return fail(error.message, 500);
  }

  return ok(data, 201);
}
