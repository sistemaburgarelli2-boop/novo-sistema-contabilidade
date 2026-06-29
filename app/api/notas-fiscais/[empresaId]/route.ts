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

export async function POST(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const body = await request.json();

    // Gerar número sequencial
    const { data: ultima } = await supabase
      .from("notas_fiscais")
      .select("numero")
      .eq("empresa_id", empresaId)
      .eq("tipo", "emitida")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const proximoNumero = ultima ? String(Number(ultima.numero) + 1).padStart(6, "0") : "000001";

    // Gerar chave de acesso simulada (44 dígitos)
    const chave = Array.from({ length: 44 }, () => Math.floor(Math.random() * 10)).join("");

    const registro = {
      empresa_id: empresaId,
      tipo: "emitida",
      numero: proximoNumero,
      serie: body.serie || "1",
      modelo: body.modelo || "nfse",
      chave_acesso: chave,
      natureza_operacao: body.natureza_operacao || "Prestação de serviços",
      data_emissao: body.data_emissao || new Date().toISOString(),
      emitente_cnpj: body.emitente_cnpj || null,
      emitente_nome: body.emitente_nome || null,
      destinatario_cnpj: body.destinatario_cnpj || null,
      destinatario_nome: body.destinatario_nome || null,
      valor_total: body.valor_total || 0,
      valor_produtos: body.valor_produtos || 0,
      valor_servicos: body.valor_servicos || 0,
      valor_desconto: body.valor_desconto || 0,
      valor_icms: body.valor_icms || 0,
      valor_ipi: body.valor_ipi || 0,
      valor_pis: body.valor_pis || 0,
      valor_cofins: body.valor_cofins || 0,
      valor_iss: body.valor_iss || 0,
      valor_frete: body.valor_frete || 0,
      status: "autorizada",
      situacao: "pendente",
    };

    const { data, error } = await supabase
      .from("notas_fiscais")
      .insert(registro)
      .select("*")
      .single();

    if (error) return fail(error.message, 500);
    return ok(data, 201);
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
