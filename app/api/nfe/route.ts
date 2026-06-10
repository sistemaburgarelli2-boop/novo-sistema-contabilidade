import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { emitirNFe, listarNFesEmpresa } from "@/modules/nfe/nfe.service";
import type { NFe } from "@/modules/nfe/nfe.types";

export async function GET(req: Request) {
  try {
    await getCurrentSessionUser();
    const url = new URL(req.url);
    const empresaId = url.searchParams.get("empresa_id");
    if (!empresaId) return fail("empresa_id obrigatório.", 400);
    const status = url.searchParams.get("status") as NFe["status"] | null;
    return ok(await listarNFesEmpresa(empresaId, status ? { status } : undefined));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao listar NF-e.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    await getCurrentSessionUser();
    const input = await req.json();
    if (!input.empresa_id || !input.destinatario || !input.itens?.length) {
      return fail("empresa_id, destinatario e itens são obrigatórios.", 400);
    }
    return ok(await emitirNFe(input), 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao emitir NF-e.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 400);
  }
}
