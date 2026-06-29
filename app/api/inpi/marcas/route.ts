import { ok, fail } from "@/lib/apiResponse";

// Proxy para a API pública de busca de marcas do INPI
// Documentação: https://buscaapi.inpi.gov.br/swagger-ui/index.html
const INPI_BASE = "https://buscaapi.inpi.gov.br";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pedido = searchParams.get("pedido")?.replace(/\D/g, "");
  const termo = searchParams.get("termo");

  if (!pedido && !termo) return fail("Informe o número do pedido ou termo de busca.", 400);

  try {
    let url: string;

    if (pedido) {
      // Busca por número de pedido específico
      url = `${INPI_BASE}/api/v1/marcas/pesquisa?numeroPedido=${pedido}&pagina=1&quantidade=1`;
    } else {
      // Busca por nome de marca
      url = `${INPI_BASE}/api/v1/marcas/pesquisa?termo=${encodeURIComponent(termo!)}&pagina=1&quantidade=10`;
    }

    const res = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "FattturatiBurgarelli/1.0",
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      return fail(`INPI retornou erro ${res.status}. Verifique o número do pedido.`, 502);
    }

    const data = await res.json();

    // Normaliza a resposta do INPI para o nosso formato
    const marcas = (data?.marcas ?? data?.content ?? []).map((m: Record<string, unknown>) => ({
      numero_pedido: m.numeroPedido ?? m.numeroPedidoFormatado ?? "—",
      numero_registro: m.numeroRegistro ?? "—",
      nome_marca: m.marcaNome ?? m.nome ?? "—",
      titular: Array.isArray(m.titulares)
        ? (m.titulares as Array<Record<string, unknown>>).map((t) => t.nome ?? t.razaoSocial).join(", ")
        : (m.titular ?? "—"),
      natureza: m.naturezaMarca ?? m.natureza ?? "—",
      classe_ncl: Array.isArray(m.classes)
        ? (m.classes as Array<Record<string, unknown>>).map((c) => c.codigoClasse ?? c.classe).join(", ")
        : (m.classeNice ?? "—"),
      situacao: m.situacaoDescricao ?? m.situacao ?? m.status ?? "—",
      data_deposito: m.dataDeposito ?? m.dataProtocolo ?? "—",
      data_concessao: m.dataConcessao ?? "—",
      data_vencimento: m.dataVencimento ?? m.dataExpiracao ?? "—",
      ultimo_despacho: Array.isArray(m.despachos) && (m.despachos as unknown[]).length > 0
        ? (() => {
            const d = (m.despachos as Array<Record<string, unknown>>)[0];
            return `${d.codigoDespacho ?? ""} — ${d.descricaoDespacho ?? d.descricao ?? ""}`.trim();
          })()
        : "—",
      data_ultimo_despacho: Array.isArray(m.despachos) && (m.despachos as unknown[]).length > 0
        ? ((m.despachos as Array<Record<string, unknown>>)[0].dataDespacho ?? "—")
        : "—",
    }));

    return ok({ total: data?.totalElements ?? data?.total ?? marcas.length, marcas });
  } catch (e) {
    if (e instanceof Error && e.name === "TimeoutError") {
      return fail("A API do INPI demorou para responder. Tente novamente.", 504);
    }
    return fail(e instanceof Error ? e.message : "Erro ao consultar INPI.", 500);
  }
}
