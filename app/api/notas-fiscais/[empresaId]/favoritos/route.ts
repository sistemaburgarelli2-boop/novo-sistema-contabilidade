import { fail, ok } from "@/lib/apiResponse";
import { exigirAcessoEmpresa, statusDoErroAcesso } from "@/lib/empresaAcesso";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Servicos favoritos ficam em empresas.metadata.servicos_favoritos: sao poucos
 * registros por empresa e o metadata ja e o lugar onde o cadastro guarda esse
 * tipo de configuracao — assim nenhuma migracao nova precisa ser aplicada.
 */
const CHAVE = "servicos_favoritos";

type ItemFavorito = {
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  codigo_servico: string;
  aliquota_iss: number;
};

type ServicoFavorito = {
  id: string;
  nome: string;
  modelo: string;
  natureza: string;
  observacoes: string;
  itens: ItemFavorito[];
  aliquota_pis: number;
  aliquota_cofins: number;
  aliquota_icms: number;
  codigo_municipio: string;
  criado_em: string;
};

type RouteContext = { params: Promise<{ empresaId: string }> };

async function lerMetadata(admin: SupabaseClient, empresaId: string) {
  const { data, error } = await admin
    .from("empresas")
    .select("metadata")
    .eq("id", empresaId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error("Empresa nao encontrada.");

  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const favoritos = Array.isArray(metadata[CHAVE]) ? (metadata[CHAVE] as ServicoFavorito[]) : [];

  return { metadata, favoritos };
}

async function gravarFavoritos(
  admin: SupabaseClient,
  empresaId: string,
  metadata: Record<string, unknown>,
  favoritos: ServicoFavorito[],
) {
  const { error } = await admin
    .from("empresas")
    .update({ metadata: { ...metadata, [CHAVE]: favoritos } })
    .eq("id", empresaId);

  if (error) throw new Error(error.message);
}

function normalizarItens(entrada: unknown): ItemFavorito[] {
  if (!Array.isArray(entrada)) return [];

  return entrada
    .map((item) => {
      const i = (item ?? {}) as Record<string, unknown>;
      return {
        descricao: String(i.descricao ?? "").trim(),
        quantidade: Number(i.quantidade) || 1,
        valor_unitario: Number(i.valor_unitario) || 0,
        codigo_servico: String(i.codigo_servico ?? "").trim(),
        aliquota_iss: Number(i.aliquota_iss) || 0,
      };
    })
    .filter((item) => item.descricao || item.valor_unitario > 0);
}

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { empresaId } = await params;
    const { admin } = await exigirAcessoEmpresa(empresaId);
    const { favoritos } = await lerMetadata(admin, empresaId);
    return ok({ favoritos });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return fail(msg, statusDoErroAcesso(msg));
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { empresaId } = await params;
    const { admin } = await exigirAcessoEmpresa(empresaId);
    const body = await request.json();

    const nome = String(body.nome ?? "").trim();
    if (!nome) return fail("Informe um nome para o servico favorito.", 400);

    const itens = normalizarItens(body.itens);
    if (itens.length === 0) return fail("O favorito precisa de pelo menos um servico com descricao ou valor.", 400);

    const { metadata, favoritos } = await lerMetadata(admin, empresaId);

    const favorito: ServicoFavorito = {
      id: crypto.randomUUID(),
      nome,
      modelo: String(body.modelo ?? "nfse"),
      natureza: String(body.natureza ?? "").trim(),
      observacoes: String(body.observacoes ?? "").trim(),
      itens,
      aliquota_pis: Number(body.aliquota_pis) || 0,
      aliquota_cofins: Number(body.aliquota_cofins) || 0,
      aliquota_icms: Number(body.aliquota_icms) || 0,
      codigo_municipio: String(body.codigo_municipio ?? "").trim(),
      criado_em: new Date().toISOString(),
    };

    // Regravar pelo nome evita duplicar o mesmo favorito a cada emissao.
    const semDuplicado = favoritos.filter(
      (f) => f.nome.trim().toLowerCase() !== nome.toLowerCase(),
    );
    const atualizados = [...semDuplicado, favorito];

    await gravarFavoritos(admin, empresaId, metadata, atualizados);

    return ok({ favorito, favoritos: atualizados }, 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return fail(msg, statusDoErroAcesso(msg));
  }
}

export async function DELETE(request: Request, { params }: RouteContext) {
  try {
    const { empresaId } = await params;
    const { admin } = await exigirAcessoEmpresa(empresaId);

    const id = new URL(request.url).searchParams.get("id");
    if (!id) return fail("Informe o id do favorito.", 400);

    const { metadata, favoritos } = await lerMetadata(admin, empresaId);
    const atualizados = favoritos.filter((f) => f.id !== id);

    if (atualizados.length === favoritos.length) return fail("Favorito nao encontrado.", 404);

    await gravarFavoritos(admin, empresaId, metadata, atualizados);

    return ok({ favoritos: atualizados });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro";
    return fail(msg, statusDoErroAcesso(msg));
  }
}
