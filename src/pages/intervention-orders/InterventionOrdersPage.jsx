import { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { useSignalR } from "../../hooks/useSignalR";
import { useAuth } from "../../context/AuthContext";
import styles from "./InterventionOrdersPage.module.css";
import CreateOrderModal from "./Createordermodal";
import { fetchAllParkmeters } from "../../api/dashboard.api";

// const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.VITE_API_URL}/api`;


function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function fetchAllOrders() {
  const res = await fetch(`${BASE_URL}/InterventionOrders`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
  return res.json();
}

async function fetchMyOrders(operatorId) {
  const res = await fetch(
    `${BASE_URL}/InterventionOrders/operator/${operatorId}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
  return res.json();
}

const TYPE_LABELS = {
  CASH_COLLECTION: "Collecte caisse",
  PAPER_REFILL: "Recharge papier",
  HARDWARE_REPAIR: "Réparation matérielle",
};

const TYPE_COLORS = {
  CASH_COLLECTION: { bg: "#eff6ff", text: "#1d4ed8" },
  PAPER_REFILL: { bg: "#f0fdf4", text: "#166534" },
  HARDWARE_REPAIR: { bg: "#fef2f2", text: "#991b1b" },
};

const STATUS_LABELS = {
  PENDING: "En attente",
  COMPLETED: "Terminé",
};

const STATUS_COLORS = {
  PENDING: { bg: "#fef3c7", text: "#92400e" },
  COMPLETED: { bg: "#dcfce7", text: "#166534" },
};

function TypeBadge({ type }) {
  const color = TYPE_COLORS[type] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span className={styles.badge} style={{ background: color.bg, color: color.text }}>
      {TYPE_LABELS[type] || type}
    </span>
  );
}

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span className={styles.badge} style={{ background: color.bg, color: color.text }}>
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDateTime(iso) {
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function InterventionOrdersPage() {
  const { user } = useAuth();
  const isSuperviseur = user?.role === "SUPERVISEUR";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  const [showModal, setShowModal] = useState(false);
  const [parkmeters, setParkmeters] = useState([]);


  const load = useCallback(() => {
    setError(null);
    const fetcher = isSuperviseur
      ? fetchAllOrders()
      : fetchMyOrders(user.userId);

    fetcher
      .then(setOrders)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [isSuperviseur, user?.userId]);

  useEffect(() => {
    load(); if (isSuperviseur) {
      fetchAllParkmeters().then(setParkmeters).catch(() => { });
    }
  }, [load]
  );

  // ── Real-time ─────────────────────────────────────────────
  // InterventionOrderCreated: { OperatorId, ParkmeterID, OrderId, Timestamp }
  // InterventionOrderCompleted: { OrderId, ParkmeterID, CompletedAt }

  useSignalR({
    InterventionOrderCreated: useCallback((data) => {
      // for superviseur: reload to get full order data
      // for opérateur: only reload if this order is for them
      if (isSuperviseur || data.operatorId === user?.userId) {
        const fetcher = isSuperviseur
          ? fetchAllOrders()
          : fetchMyOrders(user.userId);
        fetcher.then(setOrders).catch(() => { });
      }
    }, [isSuperviseur, user?.userId]),

    InterventionOrderCompleted: useCallback((data) => {
      // data.orderId, data.completedAt — update in place
      setOrders((prev) =>
        prev.map((o) =>
          o.id === data.orderId
            ? { ...o, status: "COMPLETED", completedAt: data.completedAt }
            : o
        )
      );
    }, []),
  });

  // ── Filtering ─────────────────────────────────────────────

  const filtered = orders.filter((o) => {
    const matchStatus = statusFilter === "ALL" || o.status === statusFilter;
    const matchType = typeFilter === "ALL" || o.type === typeFilter;
    return matchStatus && matchType;
  });

  const pendingCount = orders.filter((o) => o.status === "PENDING").length;

  return (
    <AppLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>
              {isSuperviseur ? "Ordres d'intervention" : "Mes interventions"}
            </h1>
            <p className={styles.subtitle}>
              {pendingCount > 0 ? (
                <span className={styles.pendingCount}>
                  {pendingCount} en attente
                </span>
              ) : (
                <span className={styles.allClear}>Aucune intervention en attente</span>
              )}
            </p>
          </div>
          {isSuperviseur && (
            <button
              className={styles.createBtn}
              onClick={() => setShowModal(true)}
            >
              + Nouvel ordre
            </button>
          )}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="PENDING">En attente</option>
            <option value="COMPLETED">Terminés</option>
          </select>
          <select
            className={styles.select}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="ALL">Tous les types</option>
            <option value="CASH_COLLECTION">Collecte caisse</option>
            <option value="PAPER_REFILL">Recharge papier</option>
            <option value="HARDWARE_REPAIR">Réparation matérielle</option>
          </select>
        </div>

        {showModal && (
          <CreateOrderModal
            parkmeters={parkmeters}  // you need to load parkmeters too
            onClose={() => setShowModal(false)}
            onCreated={load}
          />
        )}

        {loading && <div className={styles.state}>Chargement...</div>}
        {error && (
          <div className={styles.stateError}>
            {error}
            <button className={styles.retryBtn} onClick={load}>Réessayer</button>
          </div>
        )}

        {!loading && !error && (
          filtered.length === 0 ? (
            <div className={styles.state}>Aucun ordre d'intervention trouvé.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Parkmètre</th>
                    {isSuperviseur && <th>Opérateur</th>}
                    <th>Type</th>
                    <th>Statut</th>
                    <th>Créé le</th>
                    <th>Terminé le</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((order) => (
                    <tr
                      key={order.id}
                      className={order.status === "PENDING" ? styles.rowPending : ""}
                    >
                      <td>
                        <span className={styles.serial}>
                          {order.parkmeterSerial ||
                            order.parkmeterId?.toString().slice(0, 8)}
                        </span>
                      </td>
                      {isSuperviseur && (
                        <td className={styles.muted}>
                          {order.operatorName || "—"}
                        </td>
                      )}
                      <td><TypeBadge type={order.type} /></td>
                      <td><StatusBadge status={order.status} /></td>
                      <td className={styles.muted}>{formatDateTime(order.createdAt)}</td>
                      <td className={styles.muted}>
                        {order.completedAt ? formatDateTime(order.completedAt) : "—"}
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