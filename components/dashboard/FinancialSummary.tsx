import type { DashboardSummary } from "@/services/dashboardService";

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export function FinancialSummary({ summary }: { summary: DashboardSummary }) {
  const items = [
    { helper: "Receitas registradas", label: "Entradas", tone: "positive", value: summary.income },
    { helper: "Despesas registradas", label: "Saídas", tone: "negative", value: summary.expense },
    { helper: "Entradas menos saídas", label: "Saldo atual", tone: "neutral", value: summary.balance },
  ];

  return (
    <section className="metric-grid">
      {items.map((item) => (
        <article className="metric-card" key={item.label}>
          <span>{item.label}</span>
          <h2>{currency.format(item.value)}</h2>
          <p>{item.helper}</p>
        </article>
      ))}
    </section>
  );
}
