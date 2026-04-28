import { fail, ok } from "@/lib/apiResponse";
import { calculateSimpleTax, type SupportedTaxRegime } from "@/lib/taxCalculator";
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
    .from("taxes")
    .select("*")
    .eq("company_id", companyId)
    .order("period_start", { ascending: false });

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

  if (!payload.company_id || !payload.tax_regime || !payload.period_start || !payload.period_end) {
    return fail("Empresa, regime e periodo sao obrigatorios.");
  }

  if (!["mei", "simples"].includes(payload.tax_regime)) {
    return fail("Regime suportado nesta base: MEI ou Simples.");
  }

  const { data: transactions, error: transactionError } = await supabase
    .from("transactions")
    .select("amount")
    .eq("company_id", payload.company_id)
    .eq("type", "income")
    .gte("transaction_date", payload.period_start)
    .lte("transaction_date", payload.period_end);

  if (transactionError) {
    return fail(transactionError.message, 500);
  }

  const revenue = (transactions ?? []).reduce(
    (total, transaction) => total + Number(transaction.amount),
    0
  );
  const calculated = calculateSimpleTax(payload.tax_regime as SupportedTaxRegime, revenue);

  const { data, error } = await supabase
    .from("taxes")
    .insert({
      company_id: payload.company_id,
      tax_name: payload.tax_name || "Imposto mensal",
      tax_regime: payload.tax_regime,
      period_start: payload.period_start,
      period_end: payload.period_end,
      revenue_amount: revenue,
      tax_rate: calculated.rate,
      calculated_amount: calculated.amount,
      due_date: payload.due_date || null,
      status: "open",
    })
    .select("*")
    .single();

  if (error) {
    return fail(error.message, 500);
  }

  return ok({ ...data, rule: calculated.rule }, 201);
}
