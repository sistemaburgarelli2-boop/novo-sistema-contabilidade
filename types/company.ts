export type CompanyLifecycleStage =
  | "analysis"
  | "opening"
  | "active"
  | "changing"
  | "closing"
  | "closed";

export type Company = {
  id: string;
  owner_id: string;
  legal_name: string;
  trade_name: string | null;
  cnpj: string | null;
  city: string | null;
  state: string | null;
  main_cnae: string | null;
  status: string;
  tax_regime: string | null;
  lifecycle_stage: CompanyLifecycleStage;
  created_at: string;
  updated_at: string;
};
