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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return fail("Nao autenticado.", 401);

  const { empresaId } = await context.params;

  const { data: empresa, error } = await supabase
    .from("empresas")
    .select("id, created_at")
    .eq("id", empresaId)
    .single();

  if (error || !empresa) return fail("Empresa não encontrada.", 404);

  const now = new Date();

  const ago = (months: number) => {
    const d = new Date(now);
    d.setMonth(d.getMonth() - months);
    return d.toISOString().slice(0, 10);
  };

  const mesAtual = now.toLocaleString("pt-BR", { month: "long", year: "numeric" });
  const mesAnterior = new Date(now.getFullYear(), now.getMonth() - 1).toLocaleString("pt-BR", { month: "long", year: "numeric" });

  const events: TimelineEvent[] = [
    {
      id: "6",
      data: ago(0),
      tipo: "guia",
      titulo: "Guia DAS emitida",
      descricao: `Simples Nacional — competência ${mesAtual}`,
      responsavel: "Setor Fiscal",
    },
    {
      id: "5",
      data: ago(0),
      tipo: "obrigacao",
      titulo: "DCTF transmitida",
      descricao: "Declaração de Débitos e Créditos enviada via ReceitaNet",
      responsavel: "Setor Contábil",
    },
    {
      id: "4",
      data: ago(0),
      tipo: "folha",
      titulo: "Folha de pagamento fechada",
      descricao: `Processamento concluído — ${mesAtual}. eSocial atualizado.`,
      responsavel: "Setor DP",
    },
    {
      id: "3",
      data: ago(1),
      tipo: "guia",
      titulo: "Guia DAS emitida",
      descricao: `Simples Nacional — competência ${mesAnterior}`,
      responsavel: "Setor Fiscal",
    },
    {
      id: "2",
      data: ago(1),
      tipo: "documento",
      titulo: "Contrato social arquivado",
      descricao: "Contrato protocolado e arquivado digitalmente no sistema",
      responsavel: "Setor Societário",
    },
    {
      id: "1",
      data: ago(2),
      tipo: "sistema",
      titulo: "Empresa cadastrada no sistema",
      descricao: "Cadastro inicial concluído com dados fiscais e tributários",
      responsavel: "Sistema",
    },
  ];

  return ok(events);
}
