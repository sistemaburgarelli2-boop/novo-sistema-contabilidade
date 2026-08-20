import { fail, ok } from "@/lib/apiResponse";
import { exigirAcessoEmpresa, statusDoErroAcesso } from "@/lib/empresaAcesso";
import { traduzirErroGuia } from "@/modules/guias/guias.errors";
import type { AtualizarGuiaInput, Guia, StatusGuia } from "@/modules/guias/guias.types";

const STATUS_VALIDOS: StatusGuia[] = [
  "pendente", "emitida", "disponivel", "paga", "vencida", "cancelada",
];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ empresaId: string; guiaId: string }> },
) {
  try {
    const { empresaId, guiaId } = await params;
    const { supabase, admin } = await exigirAcessoEmpresa(empresaId);

    // Confere que a guia pertence a empresa da URL antes de gravar: sem isso um
    // id de outra empresa passaria, ja que a escrita usa o client admin.
    const { data: atual } = await supabase
      .from("guias")
      .select("*")
      .eq("id", guiaId)
      .eq("empresa_id", empresaId)
      .maybeSingle<Guia>();

    if (!atual) return fail("Guia nao encontrada nesta empresa.", 404);

    const body = (await request.json()) as AtualizarGuiaInput;
    const patch: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!STATUS_VALIDOS.includes(body.status)) return fail("Status invalido.");

      const valorFinal = body.valor ?? atual.valor;
      if (body.status === "disponivel" && Number(valorFinal) <= 0) {
        return fail("Uma guia sem valor apurado nao pode ser disponibilizada ao cliente.");
      }

      patch.status = body.status;

      // Baixa sem data vira um "pago em algum momento" que ninguem consegue
      // conciliar depois. Na duvida, hoje.
      if (body.status === "paga" && body.pago_em === undefined && !atual.pago_em) {
        patch.pago_em = new Date().toISOString().slice(0, 10);
      }

      // Reabrir a guia precisa limpar a data, senao ela fica "nao paga, paga em 12/08".
      if (body.status !== "paga") {
        patch.pago_em = null;
      }
    }

    if (body.pago_em !== undefined) patch.pago_em = body.pago_em;

    if (body.valor !== undefined) {
      const valor = Number(body.valor);
      if (!Number.isFinite(valor) || valor < 0) return fail("Valor invalido.");
      patch.valor = valor;
    }

    if (body.vencimento !== undefined) patch.vencimento = body.vencimento;
    if (body.codigo_barras !== undefined) patch.codigo_barras = body.codigo_barras?.trim() || null;

    if (Object.keys(patch).length === 0) return fail("Nada para atualizar.");

    const { data, error } = await admin
      .from("guias")
      .update(patch)
      .eq("id", guiaId)
      .eq("empresa_id", empresaId)
      .select("*")
      .single();

    if (error) return fail(traduzirErroGuia(error.message), 500);

    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao atualizar guia";
    return fail(msg, statusDoErroAcesso(msg));
  }
}

/**
 * Anexa o PDF da guia (o boleto baixado do e-CAC ou da prefeitura).
 *
 * Reaproveita o bucket `documentos`, ja usado pelo upload de documentos do
 * portal, com prefixo proprio — evita depender de um bucket novo criado a mao
 * no Supabase.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ empresaId: string; guiaId: string }> },
) {
  try {
    const { empresaId, guiaId } = await params;
    const { supabase, admin } = await exigirAcessoEmpresa(empresaId);

    const { data: atual } = await supabase
      .from("guias")
      .select("id")
      .eq("id", guiaId)
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (!atual) return fail("Guia nao encontrada nesta empresa.", 404);

    const formData = await request.formData();
    const file = formData.get("arquivo") as File | null;

    if (!file) return fail("Arquivo e obrigatorio.");
    if (file.size > 10 * 1024 * 1024) return fail("Arquivo excede 10 MB.");

    const storagePath = `guias/${empresaId}/${guiaId}_${Date.now()}_${file.name}`;

    const { error: uploadErr } = await supabase.storage
      .from("documentos")
      .upload(storagePath, file, { contentType: file.type, upsert: false });

    if (uploadErr) return fail(`Falha ao enviar o arquivo: ${uploadErr.message}`, 502);

    const { data: urlData } = supabase.storage.from("documentos").getPublicUrl(storagePath);

    const { data, error } = await admin
      .from("guias")
      .update({ arquivo_url: urlData.publicUrl })
      .eq("id", guiaId)
      .eq("empresa_id", empresaId)
      .select("*")
      .single();

    if (error) return fail(traduzirErroGuia(error.message), 500);

    return ok(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao anexar arquivo";
    return fail(msg, statusDoErroAcesso(msg));
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ empresaId: string; guiaId: string }> },
) {
  try {
    const { empresaId, guiaId } = await params;
    const { admin } = await exigirAcessoEmpresa(empresaId);

    const { error } = await admin
      .from("guias")
      .delete()
      .eq("id", guiaId)
      .eq("empresa_id", empresaId);

    if (error) return fail(traduzirErroGuia(error.message), 500);

    return ok({ id: guiaId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao excluir guia";
    return fail(msg, statusDoErroAcesso(msg));
  }
}
