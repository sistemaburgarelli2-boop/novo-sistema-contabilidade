import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { consultarNFSeEmitidas, consultarNFSeRecebidas, nfseToInsert } from "@/modules/notas-fiscais/nfse-nacional.service";
import type { AmbienteNFSe } from "@/modules/notas-fiscais/nfse-nacional.types";

export async function POST(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const body = await request.json();
    const { token, dataInicio, dataFim, ambiente } = body as {
      token: string;
      dataInicio: string;
      dataFim: string;
      ambiente?: AmbienteNFSe;
    };

    if (!token) return fail("Token de autenticacao e obrigatorio.");
    if (!dataInicio || !dataFim) return fail("dataInicio e dataFim sao obrigatorios.");

    const { data: empresa, error: empErr } = await supabase
      .from("companies")
      .select("cnpj")
      .eq("id", empresaId)
      .single();

    if (empErr || !empresa?.cnpj) return fail("Empresa nao encontrada ou sem CNPJ.", 404);

    const cnpj = empresa.cnpj.replace(/\D/g, "");
    const config = { ambiente: ambiente ?? "producao" as AmbienteNFSe, token };

    const [emitidas, recebidas] = await Promise.all([
      consultarNFSeEmitidas(config, { cnpj, dataInicio, dataFim }).catch(() => []),
      consultarNFSeRecebidas(config, { cnpj, dataInicio, dataFim }).catch(() => []),
    ]);

    const notasParaInserir = [
      ...emitidas.map((nf) => nfseToInsert(nf, empresaId, "emitida")),
      ...recebidas.map((nf) => nfseToInsert(nf, empresaId, "recebida")),
    ];

    let inseridas = 0;
    let duplicadas = 0;

    for (const nota of notasParaInserir) {
      const { error } = await supabase.from("notas_fiscais").upsert(nota, { onConflict: "chave_acesso", ignoreDuplicates: true });
      if (error) {
        duplicadas++;
      } else {
        inseridas++;
      }
    }

    return ok({
      emitidas_encontradas: emitidas.length,
      recebidas_encontradas: recebidas.length,
      inseridas,
      duplicadas,
      total: notasParaInserir.length,
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro ao sincronizar", 500);
  }
}
