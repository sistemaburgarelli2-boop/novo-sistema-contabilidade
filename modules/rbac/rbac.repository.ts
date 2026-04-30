import type { SupabaseClient } from "@supabase/supabase-js";
import type { CriarRoleInput, Permissao, RoleComPermissoes } from "@/modules/rbac/rbac.types";

export async function listarPermissoesRepository(supabase: SupabaseClient) {
  const { data, error } = await supabase.from("permissoes").select("*").order("modulo").order("chave");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Permissao[];
}

export async function listarRolesComPermissoesRepository(supabase: SupabaseClient, empresaId: string) {
  const { data: roles, error: rolesError } = await supabase
    .from("roles")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nome");

  if (rolesError) {
    throw new Error(rolesError.message);
  }

  const { data: links, error: linksError } = await supabase
    .from("roles_permissoes")
    .select("role_id, permissoes(id, chave, descricao, modulo)")
    .eq("empresa_id", empresaId);

  if (linksError) {
    throw new Error(linksError.message);
  }

  const permissoesPorRole = new Map<string, Permissao[]>();

  for (const link of links ?? []) {
    const permissao = Array.isArray(link.permissoes) ? link.permissoes[0] : link.permissoes;

    if (!permissao) {
      continue;
    }

    const current = permissoesPorRole.get(link.role_id) ?? [];
    current.push(permissao as Permissao);
    permissoesPorRole.set(link.role_id, current);
  }

  return (roles ?? []).map((role) => ({
    ...role,
    permissoes: permissoesPorRole.get(role.id) ?? [],
  })) as RoleComPermissoes[];
}

export async function criarRoleRepository(admin: SupabaseClient, input: CriarRoleInput) {
  const { data, error } = await admin
    .from("roles")
    .insert({
      chave: input.chave,
      descricao: input.descricao ?? null,
      empresa_id: input.empresa_id,
      nome: input.nome,
      sistema: false,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as RoleComPermissoes;
}

export async function substituirPermissoesRoleRepository(
  admin: SupabaseClient,
  empresaId: string,
  roleId: string,
  permissaoIds: string[]
) {
  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id, empresa_id")
    .eq("id", roleId)
    .eq("empresa_id", empresaId)
    .single();

  if (roleError || !role) {
    throw new Error("Role invalida para esta empresa.");
  }

  const { error: deleteError } = await admin
    .from("roles_permissoes")
    .delete()
    .eq("empresa_id", empresaId)
    .eq("role_id", roleId);

  if (deleteError) {
    throw new Error(deleteError.message);
  }

  if (permissaoIds.length === 0) {
    return;
  }

  const { data: permissoes, error: permissoesError } = await admin
    .from("permissoes")
    .select("id")
    .in("id", permissaoIds);

  if (permissoesError) {
    throw new Error(permissoesError.message);
  }

  const rows = (permissoes ?? []).map((permissao) => ({
    empresa_id: empresaId,
    permissao_id: permissao.id,
    role_id: roleId,
  }));

  const { error: insertError } = await admin.from("roles_permissoes").insert(rows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}
