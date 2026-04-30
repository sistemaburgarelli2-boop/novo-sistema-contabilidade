import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  criarRoleRepository,
  listarPermissoesRepository,
  listarRolesComPermissoesRepository,
  substituirPermissoesRoleRepository,
} from "@/modules/rbac/rbac.repository";
import type { CriarRoleInput } from "@/modules/rbac/rbac.types";

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

export async function requirePermissao(empresaId: string, permissao: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("tem_permissao", {
    p_chave: permissao,
    p_empresa_id: empresaId,
  });

  if (error || !data) {
    throw new Error("Sem permissao.");
  }
}

export async function listarPermissoes() {
  const { supabase } = await requireUser();
  return listarPermissoesRepository(supabase);
}

export async function listarRolesEmpresa(empresaId: string) {
  await requirePermissao(empresaId, "rbac.manage");
  const { supabase } = await requireUser();
  return listarRolesComPermissoesRepository(supabase, empresaId);
}

export async function criarRole(input: CriarRoleInput) {
  await requirePermissao(input.empresa_id, "rbac.manage");
  return criarRoleRepository(createSupabaseAdminClient(), input);
}

export async function atualizarPermissoesRole(empresaId: string, roleId: string, permissaoIds: string[]) {
  await requirePermissao(empresaId, "rbac.manage");
  await substituirPermissoesRoleRepository(createSupabaseAdminClient(), empresaId, roleId, permissaoIds);
}
