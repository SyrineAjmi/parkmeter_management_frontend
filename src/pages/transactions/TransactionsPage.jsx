import { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { useSignalR } from "../../hooks/useSignalR";
import styles from "./Transactionspage.module.css";
import Pagination from "../../components/ui/Pagination/Pagination";
import { fetchAllParkmeters } from "../../api/dashboard.api";

//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

const STATUS_LABELS = {
  COMPLETED: "Complétée",
  FAILED: "Échouée",
  CANCELLED: "Annulée",
};

const STATUS_COLORS = {
  COMPLETED: { bg: "#dcfce7", text: "#166534" },
  FAILED: { bg: "#fee2e2", text: "#991b1b" },
  CANCELLED: { bg: "#eaeaea", text: "#676565" },
};

async function fetchTransactions({ page = 1, status = "ALL", from = "", to = "", search = "" }) {
  // priority: search > status > date > default paginated
  if (search) {
    const res = await fetch(`${BASE_URL}/Transactions/filter/serial?serial=${search}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    return { data: await res.json(), totalPages: 1 };
  }
  if (status !== "ALL") {
    const res = await fetch(`${BASE_URL}/Transactions/filter?status=${status}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    return { data: await res.json(), totalPages: 1 };
  }
  if (from || to) {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const res = await fetch(`${BASE_URL}/Transactions/filter/date?${params}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    return { data: await res.json(), totalPages: 1 };
  }
  // no filters — paginated
  const res = await fetch(`${BASE_URL}/Transactions?page=${page}&pageSize=6`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
  return res.json();
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
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(minutes) {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [parkmeters, setParkmeters] = useState([]);


  const load = useCallback((page = 1) => {
    setError(null);
    setLoading(true);
    fetchTransactions({ page, status: statusFilter, from: fromDate, to: toDate, search })
      .then((res) => {
        setTransactions(res.data);
        setTotalPages(res.totalPages || Math.ceil(res.data.length / 10));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, fromDate, toDate, search]);

  useEffect(() => {
    fetchAllParkmeters().then(setParkmeters).catch(() => { });
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    load(1);
  }, [statusFilter, fromDate, toDate, search]);

  useEffect(() => {
    if (currentPage > 1) load(currentPage);
  }, [currentPage]);

  // ── Real-time ─────────────────────────────────────────────
  // NewTransaction: { ParkmeterID, Amount, Status, Timestamp }

  useSignalR({
    NewTransaction: useCallback(() => {
      load(currentPage);
    }, [currentPage, load]),
  });

  // ── Filtering ─────────────────────────────────────────────


  const totalRevenue = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <AppLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Transactions</h1>
            <p className={styles.subtitle}>
              <span className={styles.count}>
                {transactions.length} transaction{transactions.length !== 1 ? "s" : ""}
              </span>
              {" · "}
              <span className={styles.revenue}>
                {totalRevenue.toFixed(3)} DT complétées
              </span>
            </p>
          </div>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Temps réel
          </div>
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <select
            className={styles.select}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          >
            <option value="">Tous les parcmètres</option>
            {parkmeters.map((pm) => (
              <option key={pm.id} value={pm.serialNumber}>
                {pm.serialNumber} — {pm.siteName || "Sans site"}
              </option>
            ))}
          </select>
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            <option value="COMPLETED">Complétées</option>
            <option value="FAILED">Échouées</option>
            <option value="CANCELLED">Annulées</option>
          </select>
          Du
          <input
            className={styles.dateInput}
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            title="Du"
          />
          Au
          <input
            className={styles.dateInput}
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            title="Au"
          />
          {(fromDate || toDate || search) && (
            <button
              className={styles.clearBtn}
              onClick={() => { setFromDate(""); setToDate(""); setSearch(""); }}
            >
              Effacer filtres
            </button>
          )}
        </div>

        {loading && <div className={styles.state}>Chargement...</div>}
        {error && (
          <div className={styles.stateError}>
            {error}
            <button className={styles.retryBtn} onClick={load}>Réessayer</button>
          </div>
        )}

        {!loading && !error && (
          transactions.length === 0 ? (
            <div className={styles.state}>Aucune transaction trouvée.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Parcmètre</th>
                    <th>Montant</th>
                    <th>Durée</th>
                    <th>Statut</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx.id}>
                      <td>
                        <span className={styles.serial}>
                          {tx.parkmeterSerial ||
                            tx.parkmeterId?.toString().slice(0, 8)}
                        </span>
                      </td>
                      <td className={styles.amount}>
                        {tx.amount.toFixed(3)} DT
                      </td>
                      <td className={styles.muted}>
                        {formatDuration(tx.duration)}
                      </td>
                      <td><StatusBadge status={tx.status} /></td>
                      <td className={styles.muted}>
                        {formatDateTime(tx.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </div>
    </AppLayout>
  );
}