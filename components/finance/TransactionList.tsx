"use client";

import type { Transaction } from "@/types/transaction";

type TransactionListProps = {
  transactions: Transaction[];
};

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export function TransactionList({ transactions }: TransactionListProps) {
  if (transactions.length === 0) {
    return <p>Nenhuma transacao encontrada.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 8 }}>
      {transactions.map((transaction) => (
        <article
          key={transaction.id}
          style={{
            alignItems: "center",
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            display: "grid",
            gap: 8,
            gridTemplateColumns: "1fr auto",
            padding: 12,
          }}
        >
          <div>
            <strong>{transaction.description}</strong>
            <p>
              {transaction.transaction_date} - {transaction.categories?.name || "Sem categoria"}
            </p>
          </div>
          <strong style={{ color: transaction.type === "income" ? "#047857" : "#b91c1c" }}>
            {currency.format(Number(transaction.amount))}
          </strong>
        </article>
      ))}
    </div>
  );
}
