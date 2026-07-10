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
    return (
      <div className="empty-state">
        <h2>Nenhuma transação encontrada</h2>
        <p>Cadastre entradas e saídas para acompanhar o movimento financeiro.</p>
      </div>
    );
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table className="data-table">
        <thead>
          <tr>
            <th>Descrição</th>
            <th>Categoria</th>
            <th>Data</th>
            <th>Tipo</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.description}</td>
              <td>{transaction.categories?.name || "Sem categoria"}</td>
              <td>{new Date(`${transaction.transaction_date}T00:00:00`).toLocaleDateString("pt-BR")}</td>
              <td><span className="badge">{transaction.type === "income" ? "Entrada" : "Saída"}</span></td>
              <td>
                <strong style={{ color: transaction.type === "income" ? "#047857" : "#b91c1c" }}>
                  {currency.format(Number(transaction.amount))}
                </strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
