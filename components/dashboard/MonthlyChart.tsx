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
    <section className="list-panel" style={{ height: 380, padding: 18 }}>
      <div className="list-panel-header" style={{ border: 0, padding: "0 0 16px" }}>
        <div>
          <h2>Movimento mensal</h2>
          <p>Entradas e saídas agrupadas por competência</p>
        </div>
      </div>
      <ResponsiveContainer height="82%" width="100%">
        <BarChart data={data}>
          <CartesianGrid stroke="#dfece5" strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="income" fill="#10b981" name="Entradas" radius={[6, 6, 0, 0]} />
          <Bar dataKey="expense" fill="#ef445f" name="Saídas" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  );
}
