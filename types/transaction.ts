export type TransactionType = "income" | "expense";

export type Transaction = {
  id: string;
  company_id: string;
  category_id: string | null;
  categories?: { name: string } | null;
  type: TransactionType;
  description: string;
  amount: number;
  transaction_date: string;
  payment_method: string | null;
  document_number: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};
