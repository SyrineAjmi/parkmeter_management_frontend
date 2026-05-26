import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import styles from "./RevenueChart.module.css";

const COLORS = ["#0e64c8", "#38bdf8", "#7c3aed"];

export default function RevenueChart({ data = [] }) {
  // data = [{ siteId, siteName, totalRevenue, totalTransactions }]
  const chartData = data.map((d) => ({
    name: d.siteName,
    Revenus: parseFloat(d.totalRevenue?.toFixed(2) ?? 0),
  }));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Revenus par Site (ce mois)</span>
      </div>
      {chartData.length === 0 ? (
        <div style={{ textAlign: "center", color: "#9ca3af", padding: "40px 0" }}>
          Aucune donnée de revenus
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v} DT`} />
            <Tooltip
              formatter={(value) => [`${value} DT`, "Revenus"]}
              contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
            />
            <Bar dataKey="Revenus" fill={COLORS[0]} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}