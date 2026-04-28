import type { TransactionType } from "@/types/transaction";

export type Category = {
  id: string;
  company_id: string;
  name: string;
  type: TransactionType;
  color: string | null;
  created_at: string;
  updated_at: string;
};
