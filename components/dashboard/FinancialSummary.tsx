import type { DashboardSummary } from "@/services/dashboardService";

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export function FinancialSummary({ summary }: { summary: DashboardSummary }) {
  const items = [
    { label: "Entradas", value: summary.income },
    { label: "Saidas", value: summary.expense },
    { label: "Saldo atual", value: summary.balance },
  ];

  return (
    <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}>
      {items.map((item) => (
        <article
          key={item.label}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <span>{item.label}</span>
          <h2>{currency.format(item.value)}</h2>
        </article>
      ))}
    </section>
  );
}
