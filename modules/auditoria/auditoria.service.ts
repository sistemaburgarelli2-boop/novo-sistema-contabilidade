import { createSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import {
  listarAuditLogsRepository,
  registrarAuditLogRepository,
} from "@/modules/auditoria/auditoria.repository";
import type { AuditInput } from "@/modules/auditoria/auditoria.types";

export async function registrarAuditLog(input: AuditInput) {
  try {
    await registrarAuditLogRepository(createSupabaseAdminClient(), input);
  } catch (error) {
    console.error("audit_log_failed", error);
  }
}

export async function listarAuditLogs(empresaId: string) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Nao autenticado.");
  }

  return listarAuditLogsRepository(supabase, empresaId);
}
