import { fail } from "@/lib/apiResponse";
import { exigirAcessoEmpresa, statusDoErroAcesso } from "@/lib/empresaAcesso";
import { gerarDanfseHtml, gerarXmlNota, nomeArquivo, type NotaDocumento } from "@/modules/notas-fiscais/documento";

type RouteContext = { params: Promise<{ empresaId: string; notaId: string }> };

export async function GET(request: Request, { params }: RouteContext) {
  try {
    const { empresaId, notaId } = await params;
    const { admin } = await exigirAcessoEmpresa(empresaId);

    const { data: nota, error } = await admin
      .from("notas_fiscais")
      .select("*")
      .eq("id", notaId)
      .eq("empresa_id", empresaId)
      .maybeSingle();

    if (error) return fail(error.message, 500);
    if (!nota) return fail("Nota fiscal nao encontrada.", 404);

    const url = new URL(request.url);
    const formato = url.searchParams.get("formato") ?? "danfse";
    const registro = nota as NotaDocumento & { xml_url?: string | null; danfe_url?: string | null };

    if (formato === "xml") {
      // O XML autorizado pela SEFAZ, quando existe, e o documento valido.
      if (registro.xml_url) {
        return Response.redirect(registro.xml_url, 302);
      }

      return new Response(gerarXmlNota(registro), {
        headers: {
          "Content-Type": "application/xml; charset=utf-8",
          "Content-Disposition": `attachment; filename="${nomeArquivo(registro, "xml")}"`,
        },
      });
    }

    if (formato === "danfse" && registro.danfe_url) {
      return Response.redirect(registro.danfe_url, 302);
    }

    // Sem PDF oficial, o espelho vai como HTML: "imprimir=1" abre direto a
    // caixa de impressao do navegador (Salvar como PDF); sem ela, so exibe.
    const imprimir = url.searchParams.get("imprimir") === "1";
    return new Response(gerarDanfseHtml(registro, { imprimir }), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return fail(msg, statusDoErroAcesso(msg));
  }
}
