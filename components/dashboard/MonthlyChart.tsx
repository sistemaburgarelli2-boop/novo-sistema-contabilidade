"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { MonthlyDashboardItem } from "@/services/dashboardService";

export function MonthlyChart({ data }: { data: MonthlyDashboardItem[] }) {
  return (
    <section
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        height: 360,
        padding: 16,
      }}
    >
      <h2>Movimento mensal</h2>
      <ResponsiveContainer height="85%" width="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#047857" name="Entradas" />
          <Bar dataKey="expense" fill="#b91c1c" name="Saidas" />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
