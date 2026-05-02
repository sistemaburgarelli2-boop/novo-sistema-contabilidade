"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { TransactionFilters } from "@/components/finance/TransactionFilters";
import { TransactionForm } from "@/components/finance/TransactionForm";
import { TransactionList } from "@/components/finance/TransactionList";
import { getActiveCompanyId } from "@/services/companyService";
import {
  createCategory,
  createTransaction,
  listCategories,
  listTransactions,
  type TransactionPayload,
} from "@/services/financeService";
import type { Category } from "@/types/category";
import type { Transaction } from "@/types/transaction";

export default function FinancePage() {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState<"income" | "expense">("income");
  const [error, setError] = useState<string | null>(null);

  const totals = useMemo(() => {
    return transactions.reduce(
      (accumulator, transaction) => {
        if (transaction.type === "income") {
          accumulator.income += Number(transaction.amount);
        } else {
          accumulator.expense += Number(transaction.amount);
        }

        return accumulator;
      },
      { expense: 0, income: 0 }
    );
  }, [transactions]);

  async function loadFinance(companyId: string) {
    const [categoryData, transactionData] = await Promise.all([
      listCategories(companyId),
      listTransactions({ companyId, endDate, startDate }),
    ]);
    setCategories(categoryData);
    setTransactions(transactionData);
  }

  useEffect(() => {
    const companyId = getActiveCompanyId();
    setActiveCompanyId(companyId);

    if (companyId) {
      loadFinance(companyId).catch((currentError) => {
        setError(currentError instanceof Error ? currentError.message : "Erro ao carregar financeiro.");
      });
    }
  }, [endDate, startDate]);

  async function handleCreateTransaction(payload: TransactionPayload) {
    const transaction = await createTransaction(payload);
    setTransactions((current) => [transaction, ...current]);
  }

  async function handleCreateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCompanyId) {
      return;
    }

    const category = await createCategory({
      company_id: activeCompanyId,
      name: newCategoryName,
      type: newCategoryType,
    });
    setCategories((current) => [...current, category]);
    setNewCategoryName("");
  }

  if (!activeCompanyId) {
    return (
      <AppShell>
        <div className="empty-state">
          <h1>Financeiro</h1>
          <p>Selecione uma empresa ativa no módulo Empresas antes de lançar transações.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Financeiro</h1>
            <p>Entradas, saídas, categorias e lançamentos por empresa.</p>
          </div>
        </div>

        <section className="panel-section">
          <h2>Resumo</h2>
          <p>
            Entradas: {totals.income.toLocaleString("pt-BR", { currency: "BRL", style: "currency" })} | Saídas:{" "}
            {totals.expense.toLocaleString("pt-BR", { currency: "BRL", style: "currency" })}
          </p>
        </section>

        {error ? <p className="error-alert">{error}</p> : null}

        <TransactionFilters
          endDate={endDate}
          setEndDate={setEndDate}
          setStartDate={setStartDate}
          startDate={startDate}
        />

        <section className="panel-section">
          <h2>Categorias</h2>
          <form className="toolbar-row" onSubmit={handleCreateCategory}>
            <input
              onChange={(event) => setNewCategoryName(event.target.value)}
              placeholder="Nova categoria"
              required
              value={newCategoryName}
            />
            <select
              onChange={(event) => setNewCategoryType(event.target.value as "income" | "expense")}
              value={newCategoryType}
            >
              <option value="income">Entrada</option>
              <option value="expense">Saida</option>
            </select>
            <button type="submit">Adicionar</button>
          </form>
        </section>

        <section className="panel-section">
          <h2>Nova transação</h2>
          <TransactionForm
            categories={categories}
            companyId={activeCompanyId}
            onSubmit={handleCreateTransaction}
          />
        </section>

        <section className="panel-section">
          <h2>Transações</h2>
          <TransactionList transactions={transactions} />
        </section>
      </div>
    </AppShell>
  );
}
