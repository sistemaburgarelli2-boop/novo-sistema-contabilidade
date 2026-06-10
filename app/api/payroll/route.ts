import { fail, ok } from "@/lib/apiResponse";
import { getCurrentSessionUser } from "@/modules/auth/auth.service";
import { iniciarFolha, obterFolhas } from "@/modules/payroll/payroll.service";

export async function GET(req: Request) {
  try {
    await getCurrentSessionUser();
    const url = new URL(req.url);
    const empresaId = url.searchParams.get("empresa_id");
    if (!empresaId) return fail("empresa_id obrigatório.", 400);
    return ok(await obterFolhas(empresaId));
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao listar folhas.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 500);
  }
}

export async function POST(req: Request) {
  try {
    await getCurrentSessionUser();
    const input = await req.json();
    if (!input.empresa_id || !input.competencia) return fail("empresa_id e competencia são obrigatórios.", 400);
    return ok(await iniciarFolha(input), 201);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro ao criar folha.";
    return fail(msg, msg === "Nao autenticado." ? 401 : 400);
  }
}
