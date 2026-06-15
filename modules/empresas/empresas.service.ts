import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { validarPodeCriarEmpresa } from "@/modules/billing/billing.service";
import {
  atualizarEmpresa,
  buscarEmpresaPorId,
  criarEmpresaComBootstrap,
  excluirEmpresa,
  listarEmpresasDoUsuario,
} from "@/modules/empresas/empresas.repository";
import type { AtualizarEmpresaInput, CriarEmpresaInput } from "@/modules/empresas/empresas.types";

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

export async function listarEmpresas() {
  const { supabase } = await requireUser();
  return listarEmpresasDoUsuario(supabase);
}

export async function buscarEmpresa(empresaId: string) {
  const { supabase } = await requireUser();
  return buscarEmpresaPorId(supabase, empresaId);
}

export async function criarEmpresa(input: CriarEmpresaInput) {
  const { user } = await requireUser();
  const admin = createSupabaseAdminClient();

  await validarPodeCriarEmpresa(user.id);

  return criarEmpresaComBootstrap(admin, input, {
    email: user.email ?? null,
    id: user.id,
  });
}

export async function editarEmpresa(empresaId: string, input: AtualizarEmpresaInput) {
  const { supabase } = await requireUser();
  return atualizarEmpresa(supabase, empresaId, input);
}

export async function deletarEmpresa(empresaId: string) {
  const { supabase } = await requireUser();
  return excluirEmpresa(supabase, empresaId);
}
