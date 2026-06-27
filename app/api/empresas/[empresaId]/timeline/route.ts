import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

type TimelineEvent = {
  id: string;
  data: string;
  tipo: "guia" | "folha" | "obrigacao" | "documento" | "sistema";
  titulo: string;
  descricao: string;
  responsavel: string;
};

type RouteContext = {
  params: Promise<{ empresaId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return fail("Nao autenticado.", 401);

  const { empresaId } = await context.params;

  const { data: empresa, error } = await supabase
    .from("empresas")
    .select("id, created_at")
    .eq("id", empresaId)
    .single();

  if (error || !empresa) return fail("Empresa nao encontrada.", 404);

  const events: TimelineEvent[] = [];

  const [auditRes, obrigacoesRes, guiasRes] = await Promise.all([
    supabase.from("audit_logs").select("id, created_at, action, resource_type").eq("empresa_id", empresaId).order("created_at", { ascending: false }).limit(20),
    supabase.from("obrigacoes_fiscais").select("id, nome, competencia, status, created_at").eq("empresa_id", empresaId).order("created_at", { ascending: false }).limit(10),
    supabase.from("guias").select("id, nome, competencia, status, created_at").eq("empresa_id", empresaId).order("created_at", { ascending: false }).limit(10),
  ]);

  if (auditRes.data) {
    for (const log of auditRes.data) {
      const actionLabels: Record<string, { titulo: string; tipo: TimelineEvent["tipo"]; responsavel: string }> = {
        "empresa.created": { titulo: "Empresa cadastrada no sistema", tipo: "sistema", responsavel: "Sistema" },
        "empresa.updated": { titulo: "Dados da empresa atualizados", tipo: "sistema", responsavel: "Sistema" },
      };
      const cfg = actionLabels[log.action];
      if (cfg) {
        events.push({
          id: `audit-${log.id}`,
          data: log.created_at.slice(0, 10),
          ...cfg,
          descricao: `Acao: ${log.action}`,
        });
      }
    }
  }

  if (obrigacoesRes.data) {
    for (const ob of obrigacoesRes.data) {
      events.push({
        id: `obrig-${ob.id}`,
        data: ob.created_at.slice(0, 10),
        tipo: "obrigacao",
        titulo: ob.nome,
        descricao: `Competencia: ${ob.competencia} — Status: ${ob.status}`,
        responsavel: "Setor Fiscal",
      });
    }
  }

  if (guiasRes.data) {
    for (const guia of guiasRes.data) {
      events.push({
        id: `guia-${guia.id}`,
        data: guia.created_at.slice(0, 10),
        tipo: "guia",
        titulo: guia.nome,
        descricao: `Competencia: ${guia.competencia} — Status: ${guia.status}`,
        responsavel: "Setor Fiscal",
      });
    }
  }

  events.push({
    id: `criacao-${empresa.id}`,
    data: empresa.created_at.slice(0, 10),
    tipo: "sistema",
    titulo: "Empresa cadastrada no sistema",
    descricao: "Cadastro inicial concluido",
    responsavel: "Sistema",
  });

  events.sort((a, b) => b.data.localeCompare(a.data));

  const unique = events.filter((e, i, arr) => arr.findIndex(x => x.id === e.id) === i);

  return ok(unique);
}
