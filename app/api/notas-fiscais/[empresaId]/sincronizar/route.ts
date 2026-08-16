import { fail, ok } from "@/lib/apiResponse";
import { exigirAcessoEmpresa, statusDoErroAcesso, traduzirErroBanco } from "@/lib/empresaAcesso";
import { consultarNFSeEmitidas, consultarNFSeRecebidas, nfseToInsert } from "@/modules/notas-fiscais/nfse-nacional.service";
import type { AmbienteNFSe } from "@/modules/notas-fiscais/nfse-nacional.types";

function motivo(reason: unknown) {
  return reason instanceof Error ? reason.message : String(reason);
}

export async function POST(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const { supabase, admin } = await exigirAcessoEmpresa(empresaId);

    const body = await request.json();
    const { token, dataInicio, dataFim, ambiente } = body as {
      token: string;
      dataInicio: string;
      dataFim: string;
      ambiente?: AmbienteNFSe;
    };

    if (!token) return fail("Token de autenticacao e obrigatorio.");
    if (!dataInicio || !dataFim) return fail("dataInicio e dataFim sao obrigatorios.");

    // As empresas do sistema vivem em "empresas"; "companies" e o alias legado.
    const { data: empresa } = await supabase
      .from("empresas")
      .select("cnpj")
      .eq("id", empresaId)
      .maybeSingle();

    let cnpjEmpresa = empresa?.cnpj ?? null;

    if (!cnpjEmpresa) {
      const { data: legado } = await supabase
        .from("companies")
        .select("cnpj")
        .eq("id", empresaId)
        .maybeSingle();
      cnpjEmpresa = legado?.cnpj ?? null;
    }

    if (!cnpjEmpresa) return fail("Empresa nao encontrada ou sem CNPJ.", 404);

    const cnpj = cnpjEmpresa.replace(/\D/g, "");
    const config = { ambiente: ambiente ?? "producao" as AmbienteNFSe, token };

    // Uma falha de consulta nao pode ser confundida com "nenhuma nota no periodo":
    // o usuario fecharia competencia acreditando que o periodo esta vazio.
    const [resEmitidas, resRecebidas] = await Promise.allSettled([
      consultarNFSeEmitidas(config, { cnpj, dataInicio, dataFim }),
      consultarNFSeRecebidas(config, { cnpj, dataInicio, dataFim }),
    ]);

    const falhas: string[] = [];
    if (resEmitidas.status === "rejected") {
      falhas.push(`Consulta de notas emitidas falhou: ${motivo(resEmitidas.reason)}`);
    }
    if (resRecebidas.status === "rejected") {
      falhas.push(`Consulta de notas recebidas falhou: ${motivo(resRecebidas.reason)}`);
    }
    if (falhas.length === 2) return fail(falhas.join(" | "), 502);

    const emitidas = resEmitidas.status === "fulfilled" ? resEmitidas.value : [];
    const recebidas = resRecebidas.status === "fulfilled" ? resRecebidas.value : [];

    const encontradas = [
      ...emitidas.map((nf) => nfseToInsert(nf, empresaId, "emitida")),
      ...recebidas.map((nf) => nfseToInsert(nf, empresaId, "recebida")),
    ];

    // Sem chave de acesso nao ha como deduplicar entre sincronizacoes: importar
    // geraria uma copia nova a cada execucao. Melhor reportar do que duplicar.
    const semChave = encontradas.filter((n) => !n.chave_acesso);
    const comChave = encontradas.filter((n) => n.chave_acesso);

    // Deduplica dentro do proprio lote (a mesma nota pode vir como emitida e
    // recebida quando prestador e tomador sao a mesma empresa).
    const notasParaInserir = [...new Map(comChave.map((n) => [n.chave_acesso, n])).values()];

    let inseridas = 0;
    if (notasParaInserir.length > 0) {
      // ON CONFLICT DO NOTHING ... RETURNING devolve apenas as linhas realmente
      // inseridas, entao a contagem sai exata em vez de inferida do erro.
      const { data: gravadas, error } = await admin
        .from("notas_fiscais")
        .upsert(notasParaInserir, { onConflict: "empresa_id,chave_acesso", ignoreDuplicates: true })
        .select("id");

      if (error) return fail(`Falha ao gravar notas importadas: ${traduzirErroBanco(error.message)}`, 500);
      inseridas = gravadas?.length ?? 0;
    }

    return ok({
      emitidas_encontradas: emitidas.length,
      recebidas_encontradas: recebidas.length,
      inseridas,
      duplicadas: notasParaInserir.length - inseridas,
      ignoradas_sem_chave: semChave.length,
      total: encontradas.length,
      avisos: falhas,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao sincronizar";
    return fail(msg, statusDoErroAcesso(msg));
  }
}
