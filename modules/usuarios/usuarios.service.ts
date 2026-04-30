import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  listarRolesEmpresa,
  listarUsuariosEmpresa,
  vincularUsuarioExistente,
} from "@/modules/usuarios/usuarios.repository";
import type { VincularUsuarioInput } from "@/modules/usuarios/usuarios.types";

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

export async function listarUsuariosDaEmpresa(empresaId: string) {
  const { supabase } = await requireUser();
  return listarUsuariosEmpresa(supabase, empresaId);
}

export async function listarRolesDaEmpresa(empresaId: string) {
  const { supabase } = await requireUser();
  return listarRolesEmpresa(supabase, empresaId);
}

export async function adicionarUsuarioExistente(empresaId: string, input: VincularUsuarioInput) {
  const { user } = await requireUser();
  const admin = createSupabaseAdminClient();

  return vincularUsuarioExistente(admin, empresaId, input, user.id);
}
