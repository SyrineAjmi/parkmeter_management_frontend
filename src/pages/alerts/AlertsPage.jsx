import { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { useSignalR } from "../../hooks/useSignalR";
import styles from "./Alertspage.module.css";
import {
  ALERT_TYPE_LABELS,
  ALERT_PRIORITY_COLORS,
  ALERT_PRIORITY_LABELS,
} from "../../constants/alertTypes";

// const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function fetchAlerts() {
  const res = await fetch(`${BASE_URL}/Alerts`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
  return res.json();
}

async function resolveAlert(id) {
  const res = await fetch(`${BASE_URL}/Alerts/${id}/resolve`, {
    method: "PUT",
    headers: authHeaders(),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || "Impossible de résoudre cette alerte");
  }
}

const ALERT_STATUS_LABELS = {
  NOT_RESOLVED: "Non résolue",
  RESOLVED:"Résolue",
};

const ALERT_STATUS_COLORS = {
  NOT_RESOLVED: { bg: "#fee2e2", text: "#991b1b" },
  RESOLVED:     { bg: "#dcfce7", text: "#166534" },
};

function PriorityBadge({ priority }) {
  const color = ALERT_PRIORITY_COLORS[priority] || "#94a3b8";
  return (
    <span className={styles.badge} style={{ background: color + "22", color }}>
      {ALERT_PRIORITY_LABELS[priority] || priority}
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = ALERT_STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span className={styles.badge} style={{ background: colors.bg, color: colors.text }}>
      {ALERT_STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("NOT_RESOLVED");
  const [resolving, setResolving] = useState(null);
  const [resolveError, setResolveError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    fetchAlerts()
      .then(setAlerts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Real-time ─────────────────────────────────────────────
  // NewAlert payload:    { ParkmeterID, AlertType, Priority, Timestamp }
  // AlertResolved payload: { AlertId, ParkmeterID, Timestamp }

  useSignalR({
    NewAlert: useCallback(() => {
      // payload has no alertId or serial — reload to get full data from DB
      fetchAlerts().then(setAlerts).catch(() => {});
    }, []),

AlertResolved: useCallback(() => {
  fetchAlerts().then(setAlerts).catch(() => {});
}, []),
  });

  // ── Manual resolve ────────────────────────────────────────

  async function handleResolve(alertId) {
    setResolving(alertId);
    setResolveError(null);
    try {
      await resolveAlert(alertId);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === alertId
            ? { ...a, status: "RESOLVED", resolvedAt: new Date().toISOString() }
            : a
        )
      );
    } catch (e) {
      setResolveError(e.message);
    } finally {
      setResolving(null);
    }
  }

  // ── Filtering ─────────────────────────────────────────────

  const filtered = alerts.filter((a) => {
    const matchPriority = priorityFilter === "ALL" || a.priority === priorityFilter;
    const matchStatus   = statusFilter   === "ALL" || a.status   === statusFilter;
    return matchPriority && matchStatus;
  });

  const unresolvedCount = alerts.filter((a) => a.status === "NOT_RESOLVED").length;

  return (
    <AppLayout>
      <div className={styles.page}>

        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Alertes</h1>
            <p className={styles.subtitle}>
              {unresolvedCount > 0 ? (
                <span className={styles.urgentCount}>
                  {unresolvedCount} alerte{unresolvedCount !== 1 ? "s" : ""} non résolue{unresolvedCount !== 1 ? "s" : ""}
                </span>
              ) : (
                <span className={styles.allClear}>Tout est en ordre </span>
              )}
            </p>
          </div>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Temps réel
          </div>
        </div>

        {resolveError && (
          <div className={styles.errorBanner}>{resolveError}</div>
        )}

        <div className={styles.toolbar}>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="NOT_RESOLVED">Non résolues</option>
            <option value="RESOLVED">Résolues</option>
          </select>
          <select
            className={styles.select}
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="ALL">Toutes les priorités</option>
            <option value="HIGH">Élevée</option>
            <option value="NORMAL">Moyenne</option>
            <option value="LOW">Faible</option>
          </select>
        </div>

        {loading && <div className={styles.state}>Chargement...</div>}
        {error && (
          <div className={styles.stateError}>
            {error}
            <button className={styles.retryBtn} onClick={load}>Réessayer</button>
          </div>
        )}

        {!loading && !error && (
          filtered.length === 0 ? (
            <div className={styles.state}>Aucune alerte trouvée.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Parcmètre</th>
                    <th>Type</th>
                    <th>Priorité</th>
                    <th>Statut</th>
                    <th>Créée le</th>
                    <th>Résolue le</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((alert) => (
                    <tr
                      key={alert.id}
                      className={
                        alert.status === "NOT_RESOLVED" && alert.priority === "HIGH"
                          ? styles.rowUrgent : ""
                      }
                    >
                      <td>
                        <span className={styles.serial}>
                          {alert.parkmeterSerial ||
                            alert.parkmeterId?.toString().slice(0, 8)}
                        </span>
                      </td>
                      <td>{ALERT_TYPE_LABELS[alert.type] || alert.type}</td>
                      <td><PriorityBadge priority={alert.priority} /></td>
                      <td><StatusBadge status={alert.status} /></td>
                      <td className={styles.muted}>{formatDateTime(alert.createdAt)}</td>
                      <td className={styles.muted}>
                        {alert.resolvedAt ? formatDateTime(alert.resolvedAt) : "—"}
                      </td>
                      <td>
                        {alert.status === "NOT_RESOLVED" &&
                        alert.type === "HARDWARE_FAILURE" ? (
                          <button
                            className={styles.resolveBtn}
                            disabled={resolving === alert.id}
                            onClick={() => handleResolve(alert.id)}
                          >
                            {resolving === alert.id ? "..." : "Résoudre"}
                          </button>
                        ) : (
                          <span className={styles.noAction}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </AppLayout>
  );
}