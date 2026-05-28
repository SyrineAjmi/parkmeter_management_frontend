import AppLayout from "../../components/layout/AppLayout";
import KpiCard from "./KpiCard";
import ParkmeterGrid from "./ParkmeterGrid";
import RevenueChart from "./RevenueChart";
import InterventionOrdersTable from "./InterventionOrdersTable";
import RecentAlertsFeed from "./RecentAlertsFeed";
import { useDashboard } from "../../hooks/useDashboard";
import { useAuth } from "../../context/AuthContext";
import styles from "./DashboardPage.module.css";
import DashboardMap from "./DashboardMap";
import { useState, useCallback } from "react";
import { useSignalR } from "../../hooks/useSignalR";

const ParkmetersIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="3" width="20" height="18" rx="2" />
        <path d="M8 3v18M16 3v18M2 12h20" />
    </svg>
);
const AlertIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
);
const OrdersIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);
const ChartIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

function StatDot({ color, label, value }) {
    return (
        <span className={styles.statDot}>
            <span style={{
                width: 8, height: 8, borderRadius: "50%",
                background: color, display: "inline-block", flexShrink: 0
            }} />
            {label} <strong>{value}</strong>
        </span>
    );
}

// ─── GESTIONNAIRE view ─────────────────────────────────────
function GestionnaireView({ overview, revenueBySite, parkmeters, sites }) {
    return (
        <>
            <div className={styles.kpiRow}>
                <KpiCard title="Tous les parcmètres" value={overview?.totalParkmeters ?? 0} icon={<ParkmetersIcon />} accent="#0e64c8">
                    <StatDot color="#22c55e" label="En service" value={overview?.inService ?? 0} />
                    <StatDot color="#f59e0b" label="Indisponible" value={overview?.temporarilyUnavailable ?? 0} />
                    <StatDot color="#94a3b8" label="En attente" value={overview?.pendingActivation ?? 0} />
                </KpiCard>
                <KpiCard title="Parcmètres Hors Service" value={overview?.outOfService ?? 0} icon={<ChartIcon />} accent="#ef4444">
                    <span className={styles.subText}>Parcmètres hors service</span>
                </KpiCard>
                <KpiCard title="Ordres d'intervention en Attente" value={overview?.pendingInterventionOrders ?? 0} icon={<OrdersIcon />} accent="#f59e0b">
                    <span className={styles.subText}>Interventions à traiter</span>
                </KpiCard>
                <KpiCard title="Alertes Non Résolues" value={overview?.unresolvedAlerts ?? 0} icon={<AlertIcon />} accent="#dc2626">
                    <span className={styles.subText}>Alertes actives</span>
                </KpiCard>
            </div>
            <div className={styles.middleRow}>
                <div className={styles.leftCol}>
                    <DashboardMap sites={sites} parkmeters={parkmeters} />
                </div>
                <div className={styles.rightCol}><RevenueChart data={revenueBySite} /></div>
            </div>
        </>
    );
}

// ─── SUPERVISEUR view ──────────────────────────────────────
function SuperviseurView({ overview, alertsSummary, orders, parkmeters, sites }) {
    return (
        <>
            <div className={styles.kpiRow}>
                <KpiCard title="Alertes Non Résolues" value={alertsSummary?.totalUnresolved ?? 0} icon={<AlertIcon />} accent="#dc2626">
                    <StatDot color="#ef4444" label="Critique" value={alertsSummary?.high ?? 0} />
                    <StatDot color="#f59e0b" label="Moyenne" value={alertsSummary?.normal ?? 0} />
                    <StatDot color="#3b82f6" label="Faible" value={alertsSummary?.low ?? 0} />
                </KpiCard>
                <KpiCard title="Ordres d'intervention en Attente" value={overview?.pendingInterventionOrders ?? 0} icon={<OrdersIcon />} accent="#f59e0b">
                    <span className={styles.subText}>Interventions à traiter par un opérateur</span>
                </KpiCard>
                <KpiCard title="Total Parcmètres" value={overview?.totalParkmeters ?? 0} icon={<ParkmetersIcon />} accent="#0e64c8">
                    <StatDot color="#22c55e" label="En service" value={overview?.inService ?? 0} />
                    <StatDot color="#ef4444" label="Hors service" value={overview?.outOfService ?? 0} />
                </KpiCard>
                <KpiCard title="Parcmètres Indisponibles" value={overview?.temporarilyUnavailable ?? 0} icon={<ChartIcon />} accent="#f59e0b">
                    <span className={styles.subText}>Temporairement indisponibles</span>
                </KpiCard>
            </div>
            <div className={styles.middleRow}>
                <div className={styles.leftCol}>
                    <DashboardMap sites={sites} parkmeters={parkmeters} />
                </div>                <div className={styles.rightCol}><InterventionOrdersTable orders={orders} /></div>
            </div>
        </>
    );
}

// ─── RESPONSABLE FINANCIER view ────────────────────────────
function FinancierView({ revenueSummary, revenueBySite, revenueByParkmeter }) {
    const totalRevenue = revenueSummary?.totalRevenue ?? 0;
    const completedTx = revenueSummary?.completedTransactions ?? 0;
    const failedTx = revenueSummary?.failedTransactions ?? 0;
    const cancelledTx = revenueSummary?.cancelledTransactions ?? 0;
    const totalTx = revenueSummary?.totalTransactions ?? 0;
    const successRate = totalTx > 0
        ? ((completedTx / totalTx) * 100).toFixed(1)
        : "0.0";

    return (
        <>
            {/* KPI row */}
            <div className={styles.kpiRow}>
                <KpiCard
                    title="Revenu Total"
                    value={`${totalRevenue.toFixed(3)} DT`}
                    icon={<ChartIcon />}
                    accent="#16a34a"
                >
                    <span className={styles.subText}>Ce mois</span>
                </KpiCard>
                <KpiCard
                    title="Transactions"
                    value={totalTx}
                    icon={<ChartIcon />}
                    accent="#0e64c8"
                >
                    <StatDot color="#22c55e" label="Complétées" value={completedTx} />
                    <StatDot color="#ef4444" label="Échouées" value={failedTx} />
                    <StatDot color="#6b7280" label="Annulées" value={cancelledTx} />
                </KpiCard>
                <KpiCard
                    title="Taux de succès"
                    value={`${successRate}%`}
                    icon={<ChartIcon />}
                    accent="#7c3aed"
                >
                    <span className={styles.subText}>Transactions complétées</span>
                </KpiCard>
                <KpiCard
                    title="Sites actifs"
                    value={revenueBySite.length}
                    icon={<ChartIcon />}
                    accent="#0891b2"
                >
                    <span className={styles.subText}>Avec revenus ce mois</span>
                </KpiCard>
            </div>

            {/* Revenue charts row */}
            <div className={styles.middleRow}>
                <div className={styles.leftCol}>
                    <RevenueChart data={revenueBySite} />
                </div>
                <div className={styles.rightCol}>
                    <RevenueByParkmeterTable data={revenueByParkmeter} />
                </div>
                 <div className={styles.rightCol}>
                    <LiveTransactionsFeed/>
                </div>
            </div>
        </>
    );
}

function RevenueByParkmeterTable({ data = [] }) {
    return (
        <div className={styles.card}>
            <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Revenus par Parcmètre</span>
            </div>
            <table className={styles.miniTable}>
                <thead>
                    <tr>
                        <th>Parcmètre</th>
                        <th>Transactions</th>
                        <th>Revenu</th>
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 && (
                        <tr>
                            <td colSpan={3} className={styles.empty}>Aucune donnée</td>
                        </tr>
                    )}
                    {data.map((row) => (
                        <tr key={row.parkmeterID}>
                            <td className={styles.serial}>{row.serialNumber}</td>
                            <td>{row.totalTransactions}</td>
                            <td className={styles.amount}>{row.totalRevenue.toFixed(3)} DT</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}


function LiveTransactionsFeed() {
  const [txs, setTxs] = useState([]);

  useSignalR({
    NewTransaction: useCallback((data) => {
      setTxs((prev) => [{
        id: crypto.randomUUID(),
        parkmeterID: data.parkmeterID,
        amount: data.amount,
        status: data.status,
        timestamp: data.timestamp || new Date().toISOString(),
      }, ...prev].slice(0, 20));
    }, []),
  });

  const STATUS_COLORS = {
    COMPLETED: "#16a34a",
    FAILED:    "#ef4444",
    CANCELLED: "#6b7280",
  };

  const STATUS_LABELS = {
    COMPLETED: "Complétée",
    FAILED:    "Échouée",
    CANCELLED: "Annulée",
  };

  return (
    <div className={styles.card} style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className={styles.cardHeader}>
        <span className={styles.cardTitle}>Transactions en direct</span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: "0.72rem", color: "#16a34a", fontWeight: 600 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#16a34a", animation: "pulse 1.5s infinite", display: "inline-block" }} />
          Live
        </span>
      </div>
      {txs.length === 0 ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#9ca3af", fontSize: "0.85rem", flexDirection: "column", gap: 8 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          En attente de transactions...
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {txs.map((tx) => (
            <div key={tx.id} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 16px", borderBottom: "1px solid #f9fafb", animation: "fadeIn 0.3s ease"
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: "0.78rem", color: "#9ca3af" }}>
                  {new Date(tx.timestamp).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>
              <span style={{
                fontSize: "0.75rem", fontWeight: 600, padding: "2px 8px",
                borderRadius: 999, background: STATUS_COLORS[tx.status] + "20",
                color: STATUS_COLORS[tx.status]
              }}>
                {STATUS_LABELS[tx.status] || tx.status}
              </span>
              <span style={{ fontSize: "0.95rem", fontWeight: 700, color: tx.status === "COMPLETED" ? "#04172c" : "#9ca3af" }}>
                {tx.status === "COMPLETED" ? `${tx.amount?.toFixed(3)} DT` : "—"}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
// ─── AGENT INSTALLATION view ───────────────────────────────
function AgentView({ parkmeters }) {
    return (
        <div className={styles.middleRow}>
            <div className={styles.leftCol}>
                <ParkmeterGrid parkmeters={parkmeters} />
            </div>
        </div>
    );
}

// ─── MAIN PAGE ─────────────────────────────────────────────
export default function DashboardPage() {
    const { user } = useAuth();
    const role = user?.role;

    const {
        overview,
        alertsSummary,
        revenueBySite,
        revenueSummary,
        revenueByParkmeter,
        parkmeters,
        orders,
        loading,
        error,
        sites
    } = useDashboard(role);

    if (loading) {
        return (
            <AppLayout>
                <div className={styles.loading}>Chargement du tableau de bord...</div>
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <div className={styles.error}>Erreur: {error}</div>
            </AppLayout>
        );
    }

    return (
        <AppLayout alertCount={alertsSummary?.totalUnresolved || overview?.unresolvedAlerts || 0}>
            {role === "GESTIONNAIRE_SYSTEME" && (
                <GestionnaireView
                    overview={overview}
                    revenueBySite={revenueBySite}
                    parkmeters={parkmeters}
                    sites={sites}
                />
            )}
            {role === "SUPERVISEUR" && (
                <SuperviseurView
                    overview={overview}
                    alertsSummary={alertsSummary}
                    orders={orders}
                    parkmeters={parkmeters}
                    sites={sites}
                />
            )}
            {role === "RESPONSABLE_FINANCIER" && (
                <FinancierView
                    revenueSummary={revenueSummary}
                    revenueBySite={revenueBySite}
                    revenueByParkmeter={revenueByParkmeter}
                />
            )}
            {role === "AGENT_INSTALLATION" && (
                <AgentView parkmeters={parkmeters} />
            )}
        </AppLayout>
    );
}