import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function GET(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const url = new URL(request.url);
    const tipo = url.searchParams.get("tipo");
    const situacao = url.searchParams.get("situacao");
    const mes = url.searchParams.get("mes");

    let query = supabase
      .from("notas_fiscais")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("data_emissao", { ascending: false });

    if (tipo) query = query.eq("tipo", tipo);
    if (situacao) query = query.eq("situacao", situacao);
    if (mes) {
      const inicio = `${mes}-01`;
      const [y, m] = mes.split("-").map(Number);
      const fim = new Date(y, m, 0).toISOString().split("T")[0];
      query = query.gte("data_emissao", inicio).lte("data_emissao", fim + "T23:59:59");
    }

    const { data, error } = await query;
    if (error) return fail(error.message, 500);

    const emitidas = (data ?? []).filter((n) => n.tipo === "emitida");
    const recebidas = (data ?? []).filter((n) => n.tipo === "recebida");

    return ok({
      notas: data ?? [],
      resumo: {
        total: (data ?? []).length,
        emitidas: emitidas.length,
        recebidas: recebidas.length,
        valor_emitidas: emitidas.reduce((s, n) => s + Number(n.valor_total), 0),
        valor_recebidas: recebidas.reduce((s, n) => s + Number(n.valor_total), 0),
        pendentes: (data ?? []).filter((n) => n.situacao === "pendente").length,
        escrituradas: (data ?? []).filter((n) => n.situacao === "escriturada").length,
      },
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const body = await request.json();
    const { notaId, situacao } = body;
    if (!notaId || !situacao) return fail("notaId e situacao sao obrigatorios.");

    const validos = ["pendente", "escriturada", "conciliada", "ignorada"];
    if (!validos.includes(situacao)) return fail("Situacao invalida.");

    const { data, error } = await supabase
      .from("notas_fiscais")
      .update({ situacao })
      .eq("id", notaId)
      .eq("empresa_id", empresaId)
      .select()
      .single();

    if (error) return fail(error.message, 500);
    return ok(data);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
