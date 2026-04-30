import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AceitarConviteInput,
  Convite,
  ConvitePublico,
  CriarConviteInput,
} from "@/modules/convites/convites.types";

export async function criarConviteRepository(
  admin: SupabaseClient,
  input: CriarConviteInput,
  convidadoPor: string,
  tokenHash: string
) {
  const { data: role, error: roleError } = await admin
    .from("roles")
    .select("id, empresa_id")
    .eq("id", input.role_id)
    .eq("empresa_id", input.empresa_id)
    .single();

  if (roleError || !role) {
    throw new Error("Role invalida para esta empresa.");
  }

  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  const { data, error } = await admin
    .from("convites")
    .insert({
      convidado_por: convidadoPor,
      email: input.email,
      empresa_id: input.empresa_id,
      expires_at: expiresAt,
      role_id: input.role_id,
      status: "pendente",
      token_hash: tokenHash,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Convite;
}

export async function buscarConvitePublico(admin: SupabaseClient, tokenHash: string) {
  const { data, error } = await admin
    .from("convites")
    .select("email, empresas(id, nome_legal, nome_fantasia), roles(id, nome)")
    .eq("token_hash", tokenHash)
    .eq("status", "pendente")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) {
    throw new Error("Convite invalido ou expirado.");
  }

  const empresa = Array.isArray(data.empresas) ? data.empresas[0] : data.empresas;
  const role = Array.isArray(data.roles) ? data.roles[0] : data.roles;

  return {
    email: data.email,
    empresa: {
      id: empresa.id,
      nome: empresa.nome_fantasia || empresa.nome_legal,
    },
    role: {
      id: role.id,
      nome: role.nome,
    },
  } as ConvitePublico;
}

export async function aceitarConviteRepository(
  admin: SupabaseClient,
  input: AceitarConviteInput,
  tokenHash: string
) {
  const { data: convite, error: conviteError } = await admin
    .from("convites")
    .select("*")
    .eq("token_hash", tokenHash)
    .eq("status", "pendente")
    .gt("expires_at", new Date().toISOString())
    .single();

  if (conviteError || !convite) {
    throw new Error("Convite invalido ou expirado.");
  }

  const { data: usuarioExistente } = await admin
    .from("usuarios")
    .select("id, email")
    .eq("email", convite.email)
    .maybeSingle();

  let usuarioId = usuarioExistente?.id as string | undefined;

  if (!usuarioId) {
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: convite.email,
      email_confirm: true,
      password: input.password,
      user_metadata: { nome: input.nome },
    });

    if (createError || !created.user) {
      throw new Error(createError?.message || "Erro ao criar usuario.");
    }

    usuarioId = created.user.id;
  }

  await admin.from("usuarios").upsert({
    email: convite.email,
    id: usuarioId,
    nome: input.nome,
  });

  const { error: vinculoError } = await admin.from("usuarios_empresas").upsert(
    {
      criado_por: convite.convidado_por,
      empresa_id: convite.empresa_id,
      role_id: convite.role_id,
      status: "ativo",
      usuario_id: usuarioId,
    },
    { onConflict: "empresa_id,usuario_id" }
  );

  if (vinculoError) {
    throw new Error(vinculoError.message);
  }

  const { error: updateError } = await admin
    .from("convites")
    .update({
      accepted_at: new Date().toISOString(),
      status: "aceito",
    })
    .eq("id", convite.id);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return { email: convite.email };
}
