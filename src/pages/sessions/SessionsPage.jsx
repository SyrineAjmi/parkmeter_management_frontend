import { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { useSignalR } from "../../hooks/useSignalR";
import styles from "./SessionsPage.module.css";
import Pagination from "../../components/ui/Pagination/Pagination";
import { fetchAllParkmeters } from "../../api/dashboard.api";

//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function fetchSessions({ page = 1, status = "ALL", from = "", to = "", search = "" }) {
  if (search) {
    const res = await fetch(`${BASE_URL}/Sessions/filter/serial?serial=${search}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    return { data: await res.json(), totalPages: 1 };
  }
  if (status !== "ALL") {
    const res = await fetch(`${BASE_URL}/Sessions/filter/status?status=${status}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    return { data: await res.json(), totalPages: 1 };
  }
  if (from || to) {
    const params = new URLSearchParams();
    if (from) params.append("from", from);
    if (to) params.append("to", to);
    const res = await fetch(`${BASE_URL}/Sessions/filter/date?${params}`, { headers: authHeaders() });
    if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
    return { data: await res.json(), totalPages: 1 };
  }
  const res = await fetch(`${BASE_URL}/Sessions?page=${page}&pageSize=6`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Erreur serveur (${res.status})`);
  return res.json();
}


const STATUS_LABELS = {
  ACTIVE: "Active",
  CLOSED: "Clôturée",
};

const STATUS_COLORS = {
  ACTIVE: { bg: "#dcfce7", text: "#166534" },
  CLOSED: { bg: "#f3f4f6", text: "#374151" },
};

function StatusBadge({ status }) {
  const color = STATUS_COLORS[status] || { bg: "#f3f4f6", text: "#374151" };
  return (
    <span className={styles.badge} style={{ background: color.bg, color: color.text }}>
      {status === "ACTIVE" && <span className={styles.activeDot} />}
      {STATUS_LABELS[status] || status}
    </span>
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(start, end) {
  const from = new Date(start);
  const to = end ? new Date(end) : new Date();
  const mins = Math.floor((to - from) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [parkmeters, setParkmeters] = useState([]);
  useEffect(() => {
    fetchAllParkmeters().then(setParkmeters).catch(() => { });
  }, []);

  const load = useCallback((page = 1) => {
    setError(null);
    setLoading(true);
    fetchSessions({ page, status: statusFilter, from: fromDate, to: toDate, search })
      .then((res) => {
        setSessions(res.data);
        setTotalPages(res.totalPages || Math.ceil(res.data.length / 6));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [statusFilter, fromDate, toDate, search]);

  useEffect(() => {
    setCurrentPage(1);
    load(1);
  }, [statusFilter, fromDate, toDate, search]);

  useEffect(() => {
    if (currentPage > 1) load(currentPage);
  }, [currentPage]);

  // ── Real-time ─────────────────────────────────────────────
  // SessionClosed: { ParkmeterID, TotalAmount, TotalTransactions, Timestamp }
  // NewTransaction: { ParkmeterID, Amount, Status, Timestamp }

  useSignalR({
    SessionClosed: useCallback(() => {
      load(currentPage);
    }, [currentPage, load]),

    NewTransaction: useCallback((data) => {
      setSessions((prev) =>
        prev.map((s) =>
          s.parkmeterId === data.parkmeterID && s.status === "ACTIVE"
            ? {
              ...s,
              totalTransactions: s.totalTransactions + 1,
              totalAmount: s.totalAmount + data.amount,
            }
            : s
        )
      );
    }, []),
  });

  // ── Filtering ─────────────────────────────────────────────

  const filtered = sessions.filter((s) => {
    const matchStatus = statusFilter === "ALL" || s.status === statusFilter;
    const matchSearch = !search ||
      (s.parkmeterSerial || "").toLowerCase().includes(search.toLowerCase());
    const matchFrom = !fromDate || new Date(s.startDateTime) >= new Date(fromDate);
    const matchTo = !toDate || new Date(s.startDateTime) <= new Date(toDate + "T23:59:59");
    return matchStatus && matchSearch && matchFrom && matchTo;
  });

  const activeCount = sessions.filter((s) => s.status === "ACTIVE").length;
  const totalRevenue = sessions.reduce((sum, s) => sum + s.totalAmount, 0);

  return (
    <AppLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Sessions</h1>
            <p className={styles.subtitle}>
              <span className={styles.activeCount}>
                {activeCount} session{activeCount !== 1 ? "s" : ""} active{activeCount !== 1 ? "s" : ""}
              </span>
              {" · "}
              {/* <span className={styles.revenue}>
                {totalRevenue.toFixed(3)} DT (résultats filtrés)
              </span> */}
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
            <option value="ACTIVE">Actives</option>
            <option value="CLOSED">Clôturées</option>
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
          sessions.length === 0 ? (
            <div className={styles.state}>Aucune session trouvée.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Parcmètre</th>
                    <th>Statut</th>
                    <th>Début</th>
                    <th>Fin</th>
                    <th>Durée</th>
                    <th>Transactions</th>
                    <th>Montant total</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr
                      key={session.id}
                      className={session.status === "ACTIVE" ? styles.rowActive : ""}
                    >
                      <td>
                        <span className={styles.serial}>
                          {session.parkmeterSerial ||
                            session.parkmeterId?.toString().slice(0, 8)}
                        </span>
                      </td>
                      <td><StatusBadge status={session.status} /></td>
                      <td className={styles.muted}>
                        {formatDateTime(session.startDateTime)}
                      </td>
                      <td className={styles.muted}>
                        {formatDateTime(session.endDateTime)}
                      </td>
                      <td className={styles.muted}>
                        {formatDuration(session.startDateTime, session.endDateTime)}
                      </td>
                      <td className={styles.number}>
                        {session.totalTransactions}
                      </td>
                      <td className={styles.amount}>
                        {session.totalAmount.toFixed(3)} DT
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