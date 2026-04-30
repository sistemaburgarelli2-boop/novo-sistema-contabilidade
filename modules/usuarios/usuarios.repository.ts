import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoleEmpresa, UsuarioEmpresa, VincularUsuarioInput } from "@/modules/usuarios/usuarios.types";

export async function listarUsuariosEmpresa(supabase: SupabaseClient, empresaId: string) {
  const { data, error } = await supabase
    .from("usuarios_empresas")
    .select("*, usuarios(email, nome), roles(chave, nome)")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as UsuarioEmpresa[];
}

export async function listarRolesEmpresa(supabase: SupabaseClient, empresaId: string) {
  const { data, error } = await supabase
    .from("roles")
    .select("id, empresa_id, chave, nome, descricao")
    .eq("empresa_id", empresaId)
    .order("nome");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RoleEmpresa[];
}

export async function vincularUsuarioExistente(
  admin: SupabaseClient,
  empresaId: string,
  input: VincularUsuarioInput,
  criadoPor: string
) {
  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id, empresa_id")
    .eq("id", input.role_id)
    .eq("empresa_id", empresaId)
    .single();

  if (roleError || !role) {
    throw new Error("Role invalida para esta empresa.");
  }

  const { data: usuario, error: usuarioError } = await admin
    .from("usuarios")
    .select("id, email")
    .eq("email", input.email)
    .single();

  if (usuarioError || !usuario) {
    throw new Error("Usuario ainda nao existe. Use convite seguro na Parte 6.");
  }

  const { data, error } = await admin
    .from("usuarios_empresas")
    .upsert(
      {
        criado_por: criadoPor,
        empresa_id: empresaId,
        role_id: input.role_id,
        status: "ativo",
        usuario_id: usuario.id,
      },
      { onConflict: "empresa_id,usuario_id" }
    )
    .select("*, usuarios(email, nome), roles(chave, nome)")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as UsuarioEmpresa;
}
