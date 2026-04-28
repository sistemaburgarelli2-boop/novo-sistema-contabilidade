import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type { Transaction } from "@/types/transaction";

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
    .from("transactions")
    .select("*")
    .eq("company_id", companyId)
    .order("transaction_date", { ascending: true });

  if (error) {
    return fail(error.message, 500);
  }

  const transactions = (data ?? []) as Transaction[];
  const summary = transactions.reduce(
    (accumulator, transaction) => {
      if (transaction.type === "income") {
        accumulator.income += Number(transaction.amount);
      } else {
        accumulator.expense += Number(transaction.amount);
      }

      return accumulator;
    },
    { expense: 0, income: 0 }
  );

  const monthlyMap = new Map<string, { expense: number; income: number; month: string }>();

  transactions.forEach((transaction) => {
    const month = transaction.transaction_date.slice(0, 7);
    const current = monthlyMap.get(month) ?? { expense: 0, income: 0, month };

    if (transaction.type === "income") {
      current.income += Number(transaction.amount);
    } else {
      current.expense += Number(transaction.amount);
    }

    monthlyMap.set(month, current);
  });

  return ok({
    monthly: Array.from(monthlyMap.values()),
    summary: {
      ...summary,
      balance: summary.income - summary.expense,
    },
  });
}
