import { createSupabaseServerClient } from "@/lib/supabaseServer";
import type {
  CriarCertificadoInput,
  CriarRenovacaoInput,
  RegistrarHistoricoInput,
} from "@/modules/certificados/certificados.types";

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

// ── Certificados ──────────────────────────────────────────────

export async function listarCertificados() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificados")
    .select("*, empresas(nome_legal, cnpj)")
    .order("validade", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function buscarCertificado(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificados")
    .select("*, empresas(nome_legal, cnpj)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function criarCertificado(input: CriarCertificadoInput) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificados")
    .insert(input)
    .select("*, empresas(nome_legal, cnpj)")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function atualizarCertificado(id: string, input: Partial<CriarCertificadoInput>) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificados")
    .update(input)
    .eq("id", id)
    .select("*, empresas(nome_legal, cnpj)")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function excluirCertificado(id: string) {
  const { supabase } = await requireUser();
  const { error } = await supabase.from("certificados").delete().eq("id", id);

  if (error) throw new Error(error.message);
}

// ── Renovacoes ────────────────────────────────────────────────

export async function listarRenovacoes() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificado_renovacoes")
    .select("*, certificados(titular, tipo, validade), empresas(nome_legal)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarRenovacao(input: CriarRenovacaoInput) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificado_renovacoes")
    .insert(input)
    .select("*, certificados(titular, tipo, validade), empresas(nome_legal)")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

// ── Instalacoes ───────────────────────────────────────────────

export async function listarInstalacoes(certificadoId: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificado_instalacoes")
    .select("*")
    .eq("certificado_id", certificadoId)
    .order("instalado_em", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── Historico ─────────────────────────────────────────────────

export async function listarHistorico(certificadoId?: string) {
  const { supabase } = await requireUser();

  let query = supabase
    .from("certificado_historico")
    .select("*")
    .order("created_at", { ascending: false });

  if (certificadoId) {
    query = query.eq("certificado_id", certificadoId);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function registrarHistorico(input: RegistrarHistoricoInput) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("certificado_historico")
    .insert(input)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return data;
}
