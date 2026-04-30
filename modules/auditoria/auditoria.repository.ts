import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuditInput, AuditLog } from "@/modules/auditoria/auditoria.types";

export async function registrarAuditLogRepository(admin: SupabaseClient, input: AuditInput) {
  const { error } = await admin.from("audit_logs").insert({
    action: input.action,
    after_data: input.after_data ?? null,
    before_data: input.before_data ?? null,
    empresa_id: input.empresa_id ?? null,
    ip: input.ip ?? null,
    request_id: input.request_id ?? null,
    resource_id: input.resource_id ?? null,
    resource_type: input.resource_type,
    user_agent: input.user_agent ?? null,
    user_id: input.user_id ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function listarAuditLogsRepository(supabase: SupabaseClient, empresaId: string) {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as AuditLog[];
}
