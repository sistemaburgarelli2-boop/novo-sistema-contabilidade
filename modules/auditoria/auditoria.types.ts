export type AuditLog = {
  id: string;
  empresa_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  ip: string | null;
  user_agent: string | null;
  request_id: string | null;
  created_at: string;
};

export type AuditInput = {
  action: string;
  after_data?: Record<string, unknown> | null;
  before_data?: Record<string, unknown> | null;
  empresa_id?: string | null;
  ip?: string | null;
  request_id?: string | null;
  resource_id?: string | null;
  resource_type: string;
  user_agent?: string | null;
  user_id?: string | null;
};
