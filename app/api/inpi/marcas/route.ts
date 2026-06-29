import { ok, fail } from "@/lib/apiResponse";

// API pública do INPI — Busca de Marcas
// Swagger: https://buscaapi.inpi.gov.br/swagger-ui/index.html
const INPI_BASE = "https://buscaapi.inpi.gov.br";

function normalizar(m: Record<string, unknown>) {
  const titulares = Array.isArray(m.titulares)
    ? (m.titulares as Array<Record<string, unknown>>).map((t) => t.nome ?? t.razaoSocial ?? "").join(", ")
    : String(m.titular ?? m.titularNome ?? "—");

  const classes = Array.isArray(m.classes)
    ? (m.classes as Array<Record<string, unknown>>).map((c) => String(c.codigoClasse ?? c.codigo ?? c.classe ?? "")).join(", ")
    : String(m.classeNice ?? m.classeNCL ?? m.codigoClasse ?? "—");

  const despachos = Array.isArray(m.despachos) ? (m.despachos as Array<Record<string, unknown>>) : [];
  const ultimoDespacho = despachos[0];

  return {
    numero_pedido: String(m.numeroPedido ?? m.numeroPedidoFormatado ?? m.pedido ?? "—"),
    numero_registro: String(m.numeroRegistro ?? "—"),
    nome_marca: String(m.marcaNome ?? m.nome ?? m.nomeMarca ?? "—"),
    titular: titulares || "—",
    natureza: String(m.naturezaMarca ?? m.natureza ?? "—"),
    classe_ncl: classes || "—",
    situacao: String(m.situacaoDescricao ?? m.situacao ?? m.status ?? "—"),
    data_deposito: String(m.dataDeposito ?? m.dataProtocolo ?? "—"),
    data_concessao: String(m.dataConcessao ?? "—"),
    data_vencimento: String(m.dataVencimento ?? m.dataExpiracao ?? "—"),
    ultimo_despacho: ultimoDespacho
      ? `${ultimoDespacho.codigoDespacho ?? ""} — ${ultimoDespacho.descricaoDespacho ?? ultimoDespacho.descricao ?? ""}`.replace(/^— /, "").trim()
      : "—",
    data_ultimo_despacho: ultimoDespacho ? String(ultimoDespacho.dataDespacho ?? "—") : "—",
  };
}

async function tentarEndpoints(urls: string[]): Promise<{ ok: boolean; data: unknown; status: number }> {
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "FattturatiBurgarelli/1.0",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, data, status: res.status };
      }
    } catch {
      // tenta próximo endpoint
    }
  }
  return { ok: false, data: null, status: 0 };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pedidoRaw = searchParams.get("pedido");
  const termo = searchParams.get("termo");

  if (!pedidoRaw && !termo) {
    return fail("Informe o número do pedido ou termo de busca.", 400);
  }

  try {
    let resultado: { ok: boolean; data: unknown; status: number };

    if (pedidoRaw) {
      const pedido = pedidoRaw.replace(/\D/g, "");
      // Tenta diferentes variações do endpoint do INPI
      resultado = await tentarEndpoints([
        `${INPI_BASE}/api/v2/marcas/pesquisa?numeroPedido=${pedido}&pagina=1&quantidade=1`,
        `${INPI_BASE}/api/v1/marcas/pesquisa?numeroPedido=${pedido}&pagina=1&quantidade=1`,
        `${INPI_BASE}/api/v2/marcas/${pedido}`,
        `${INPI_BASE}/api/v1/marcas/${pedido}`,
      ]);
    } else {
      const termoEnc = encodeURIComponent(termo!.trim());
      resultado = await tentarEndpoints([
        `${INPI_BASE}/api/v2/marcas/pesquisa?termo=${termoEnc}&pagina=1&quantidade=10`,
        `${INPI_BASE}/api/v1/marcas/pesquisa?termo=${termoEnc}&pagina=1&quantidade=10`,
        `${INPI_BASE}/api/v2/marcas/pesquisa?nomeMarca=${termoEnc}&pagina=1&quantidade=10`,
        `${INPI_BASE}/api/v1/marcas/pesquisa?nomeMarca=${termoEnc}&pagina=1&quantidade=10`,
      ]);
    }

    if (!resultado.ok || !resultado.data) {
      return fail(
        "Não foi possível obter resposta da API do INPI. O serviço pode estar temporariamente indisponível. Tente novamente em alguns minutos.",
        502
      );
    }

    const data = resultado.data as Record<string, unknown>;

    // A resposta pode ser um objeto único (busca por pedido) ou uma lista
    let lista: Record<string, unknown>[] = [];
    if (Array.isArray(data)) {
      lista = data;
    } else if (Array.isArray(data.marcas)) {
      lista = data.marcas as Record<string, unknown>[];
    } else if (Array.isArray(data.content)) {
      lista = data.content as Record<string, unknown>[];
    } else if (data.numeroPedido || data.nome || data.marcaNome) {
      // resposta de objeto único
      lista = [data];
    }

    const marcas = lista.map(normalizar);
    const total = Number(data.totalElements ?? data.total ?? marcas.length);

    return ok({ total, marcas });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro desconhecido";
    if (msg.includes("TimeoutError") || msg.includes("timeout")) {
      return fail("A API do INPI demorou para responder. Tente novamente.", 504);
    }
    return fail(`Erro ao consultar INPI: ${msg}`, 500);
  }
}
