import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  buscarAssinaturaPorEmpresa,
  buscarPlanoStarter,
  calcularUsoEmpresa,
  contarEmpresasDoUsuario,
  listarPlanosAtivos,
  registrarBillingEvent,
} from "@/modules/billing/billing.repository";

async function requireUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Nao autenticado.");
  }

  return { supabase, user };
}

export async function listarPlanos() {
  const { supabase } = await requireUser();
  return listarPlanosAtivos(supabase);
}

export async function buscarAssinaturaEmpresa(empresaId: string) {
  const { supabase } = await requireUser();
  return buscarAssinaturaPorEmpresa(supabase, empresaId);
}

export async function validarPodeCriarEmpresa(usuarioId: string) {
  const admin = createSupabaseAdminClient();
  const plano = await buscarPlanoStarter(admin);
  const empresasAtuais = await contarEmpresasDoUsuario(admin, usuarioId);

  if (empresasAtuais >= plano.limite_empresas) {
    throw new Error("Limite de empresas do plano atingido.");
  }
}

export async function validarPodeAdicionarUsuario(empresaId: string) {
  const { supabase } = await requireUser();
  const assinatura = await buscarAssinaturaPorEmpresa(supabase, empresaId);
  const uso = await calcularUsoEmpresa(createSupabaseAdminClient(), empresaId);

  if (uso.usuarios >= assinatura.planos.limite_usuarios) {
    throw new Error("Limite de usuarios do plano atingido.");
  }
}

export async function validarPodeCriarTransacao(empresaId: string) {
  const { supabase } = await requireUser();
  const assinatura = await buscarAssinaturaPorEmpresa(supabase, empresaId);
  const uso = await calcularUsoEmpresa(createSupabaseAdminClient(), empresaId);

  if (assinatura.status === "blocked" || assinatura.status === "canceled") {
    throw new Error("Assinatura bloqueada.");
  }

  if (uso.transacoes_mes >= assinatura.planos.limite_transacoes_mes) {
    throw new Error("Limite mensal de transacoes atingido.");
  }
}

export async function processarStripeWebhook(event: {
  id: string;
  type: string;
  data: Record<string, unknown>;
}) {
  const admin = createSupabaseAdminClient();

  await registrarBillingEvent(admin, {
    event_type: event.type,
    payload: event.data,
    stripe_event_id: event.id,
  });
}
