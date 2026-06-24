import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
import styles from "./RevenueChart.module.css";

const COLORS = [
  "#0e64c8", "#251e70", "#0e4e26", "#9d0808",
  "#0891b2", "#f59e0b", "#4e4656", "#23635b"
];

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipLabel}>{label}</p>
      <p className={styles.tooltipValue}>
        {payload[0].value.toFixed(3)} DT
      </p>
      <p className={styles.tooltipSub}>
        {payload[0].payload.transactions} transaction{payload[0].payload.transactions !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

export default function RevenueChart({ data = [] }) {
  const chartData = data.map((d) => ({
    name: d.siteName?.length > 12 ? d.siteName.slice(0, 12) + "…" : d.siteName,
    fullName: d.siteName,
    revenus: parseFloat(d.totalRevenue?.toFixed(3) ?? 0),
    transactions: d.totalTransactions ?? 0,
  }));

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenus, 0);

  // dynamic bar
  const barSize = Math.max(16, Math.min(40, Math.floor(200 / (chartData.length || 1))));

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div>
          <span className={styles.title}>Revenus par Site</span>
          <span className={styles.subtitle}>Ce mois</span>
        </div>
        <span className={styles.total}>
          {totalRevenue.toFixed(3)} DT
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className={styles.empty}>Aucune donnée de revenus</div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height="100%" minHeight={160}>
            <BarChart
              data={chartData}
              barSize={barSize}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f3f4f6"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 13, fill: "#272c36", fontWeight:600 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}`}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f9fafb" }} />
              <Bar dataKey="revenus" radius={[6, 6, 0, 0]} fill="#0e64c8" />
            </BarChart>
          </ResponsiveContainer>
        </>
      )}
    </div>
  );
}