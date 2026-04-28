"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { getActiveCompanyId } from "@/services/companyService";
import { createTaxCalculation, listTaxes, type TaxRecord } from "@/services/taxService";

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export default function TaxesPage() {
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(null);
  const [taxes, setTaxes] = useState<TaxRecord[]>([]);
  const [taxRegime, setTaxRegime] = useState<"mei" | "simples">("simples");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const companyId = getActiveCompanyId();
    setActiveCompanyId(companyId);

    if (companyId) {
      listTaxes(companyId).then(setTaxes).catch((error) => setMessage(error.message));
    }
  }, []);

  async function handleCalculate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeCompanyId) {
      return;
    }

    const tax = await createTaxCalculation({
      company_id: activeCompanyId,
      due_date: dueDate || undefined,
      period_end: periodEnd,
      period_start: periodStart,
      tax_regime: taxRegime,
    });

    setTaxes((current) => [tax, ...current]);
    setMessage(tax.rule ?? "Imposto calculado.");
  }

  if (!activeCompanyId) {
    return (
      <AppShell>
        <h1>Impostos</h1>
        <p>Selecione uma empresa ativa no modulo Empresas para calcular impostos.</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 24 }}>
        <header>
          <h1>Impostos</h1>
          <p>Base inicial para MEI e Simples Nacional.</p>
        </header>

        <form onSubmit={handleCalculate} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <select onChange={(event) => setTaxRegime(event.target.value as "mei" | "simples")} value={taxRegime}>
            <option value="mei">MEI</option>
            <option value="simples">Simples Nacional</option>
          </select>
          <input onChange={(event) => setPeriodStart(event.target.value)} required type="date" value={periodStart} />
          <input onChange={(event) => setPeriodEnd(event.target.value)} required type="date" value={periodEnd} />
          <input onChange={(event) => setDueDate(event.target.value)} type="date" value={dueDate} />
          <button type="submit">Calcular imposto</button>
        </form>

        {message ? <p>{message}</p> : null}

        <section>
          <h2>Apuracoes</h2>
          <div style={{ display: "grid", gap: 12 }}>
            {taxes.map((tax) => (
              <article
                key={tax.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <strong>{tax.tax_name}</strong>
                <p>
                  Periodo: {tax.period_start} a {tax.period_end}
                </p>
                <p>Faturamento: {currency.format(Number(tax.revenue_amount))}</p>
                <p>Imposto: {currency.format(Number(tax.calculated_amount))}</p>
                <p>Status: {tax.status}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
