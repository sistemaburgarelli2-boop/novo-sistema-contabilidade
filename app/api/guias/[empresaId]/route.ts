import { fail, ok } from "@/lib/apiResponse";
import { exigirAcessoEmpresa, statusDoErroAcesso } from "@/lib/empresaAcesso";
import { traduzirErroGuia } from "@/modules/guias/guias.errors";
import { STATUS_VISIVEIS_CLIENTE, type CriarGuiaInput, type StatusGuia } from "@/modules/guias/guias.types";

const STATUS_VALIDOS: StatusGuia[] = [
  "pendente", "emitida", "disponivel", "paga", "vencida", "cancelada",
];

/**
 * `escopo=cliente` esconde as guias que ainda estao em conferencia interna.
 *
 * Isso e um filtro de apresentacao, nao de autorizacao: qualquer usuario com
 * vinculo na empresa consegue omitir o parametro e listar tudo. Separar de
 * verdade depende de papeis definidos no RBAC (hoje a tabela `roles` existe mas
 * nenhuma chave de papel esta padronizada no codigo).
 */
export async function GET(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const { supabase } = await exigirAcessoEmpresa(empresaId);

    const { searchParams } = new URL(request.url);
    const escopo = searchParams.get("escopo");
    const competencia = searchParams.get("competencia");

    let query = supabase
      .from("guias")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("vencimento", { ascending: false });

    if (escopo === "cliente") {
      query = query.in("status", STATUS_VISIVEIS_CLIENTE);
    }

    if (competencia) {
      query = query.eq("competencia", competencia);
    }

    const { data, error } = await query;
    if (error) return fail(error.message, 500);

    return ok(data ?? []);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao listar guias";
    return fail(msg, statusDoErroAcesso(msg));
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const { admin, userId } = await exigirAcessoEmpresa(empresaId);

    const body = (await request.json()) as CriarGuiaInput;

    if (!body.imposto?.trim()) return fail("Informe o imposto da guia.");
    if (!body.competencia?.trim()) return fail("Informe a competencia.");
    if (!body.vencimento) return fail("Informe o vencimento.");

    const valor = Number(body.valor ?? 0);
    if (!Number.isFinite(valor) || valor < 0) return fail("Valor invalido.");

    const status = body.status ?? "pendente";
    if (!STATUS_VALIDOS.includes(status)) return fail("Status invalido.");

    // Publicar uma guia zerada faz o cliente receber uma cobranca sem valor.
    if (status === "disponivel" && valor <= 0) {
      return fail("Uma guia sem valor apurado nao pode ser disponibilizada ao cliente.");
    }

    const { data, error } = await admin
      .from("guias")
      .insert({
        codigo_barras: body.codigo_barras?.trim() || null,
        competencia: body.competencia.trim(),
        empresa_id: empresaId,
        emitida_por: userId,
        imposto: body.imposto.trim(),
        status,
        valor,
        vencimento: body.vencimento,
      })
      .select("*")
      .single();

    if (error) return fail(traduzirErroGuia(error.message), 500);

    return ok(data, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar guia";
    return fail(msg, statusDoErroAcesso(msg));
  }
}
