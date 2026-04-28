"use client";

import { useState } from "react";
import type { Category } from "@/types/category";
import type { TransactionPayload } from "@/services/financeService";
import type { TransactionType } from "@/types/transaction";

type TransactionFormProps = {
  categories: Category[];
  companyId: string;
  onSubmit: (payload: TransactionPayload) => Promise<void>;
};

export function TransactionForm({ categories, companyId, onSubmit }: TransactionFormProps) {
  const [type, setType] = useState<TransactionType>("income");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter((category) => category.type === type);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        company_id: companyId,
        category_id: categoryId || undefined,
        type,
        description,
        amount: Number(amount),
        transaction_date: transactionDate,
      });

      setDescription("");
      setAmount("");
      setCategoryId("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <select onChange={(event) => setType(event.target.value as TransactionType)} value={type}>
        <option value="income">Entrada</option>
        <option value="expense">Saida</option>
      </select>
      <input
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descricao"
        required
        value={description}
      />
      <input
        min="0"
        onChange={(event) => setAmount(event.target.value)}
        placeholder="Valor"
        required
        step="0.01"
        type="number"
        value={amount}
      />
      <input
        onChange={(event) => setTransactionDate(event.target.value)}
        required
        type="date"
        value={transactionDate}
      />
      <select onChange={(event) => setCategoryId(event.target.value)} value={categoryId}>
        <option value="">Sem categoria</option>
        {filteredCategories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <button disabled={loading} type="submit">
        {loading ? "Salvando..." : "Salvar transacao"}
      </button>
    </form>
  );
}
