import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { gerarTokenConvite, hashTokenConvite } from "@/modules/convites/convites.security";
import {
  aceitarConviteRepository,
  buscarConvitePublico,
  criarConviteRepository,
} from "@/modules/convites/convites.repository";
import type { AceitarConviteInput, CriarConviteInput } from "@/modules/convites/convites.types";

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

export async function criarConvite(input: CriarConviteInput) {
  const { supabase, user } = await requireUser();
  const { data: permitido, error } = await supabase.rpc("tem_permissao", {
    p_chave: "usuario.invite",
    p_empresa_id: input.empresa_id,
  });

  if (error || !permitido) {
    throw new Error("Sem permissao para convidar usuarios.");
  }

  const token = gerarTokenConvite();
  const tokenHash = hashTokenConvite(token);
  const convite = await criarConviteRepository(createSupabaseAdminClient(), input, user.id, tokenHash);

  return {
    convite,
    invite_url: `/convites/aceitar?token=${encodeURIComponent(token)}`,
  };
}

export async function visualizarConvite(token: string) {
  return buscarConvitePublico(createSupabaseAdminClient(), hashTokenConvite(token));
}

export async function aceitarConvite(input: AceitarConviteInput) {
  return aceitarConviteRepository(createSupabaseAdminClient(), input, hashTokenConvite(input.token));
}
