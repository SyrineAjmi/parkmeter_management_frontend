import { useState, useEffect, useCallback } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { useSignalR } from "../../hooks/useSignalR";
import { useAuth } from "../../context/AuthContext";
import { fetchAllParkmeters, fetchAllSites } from "../../api/dashboard.api";
import {
  METER_STATUS_COLORS,
  METER_STATUS_LABELS,
} from "../../constants/meterStatus";
import ActionMenu from "../../components/ui/ActionMenu";
import styles from "./ParkmetersPage.module.css";
import Pagination from "../../components/ui/Pagination/Pagination";
import AddParkmeterModal from "./AddParkmeterModal";
import { useNavigate } from "react-router-dom";


//const BASE_URL = "https://localhost:7016/api";

const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}


function formatDate(iso) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function StatusBadge({ status }) {
  return (
    <span
      className={styles.statusBadge}
      style={{
        background: METER_STATUS_COLORS[status] + "22",
        color: METER_STATUS_COLORS[status],
      }}
    >
      <span
        className={styles.statusDot}
        style={{ background: METER_STATUS_COLORS[status] }}
      />
      {METER_STATUS_LABELS[status] || status}
    </span>
  );
}

function CashCell({ amount }) {
  const val = amount ?? 0;
  const color = val >= 40 ? "#ef4444" : val >= 20 ? "#f59e0b" : "#111827";
  return (
    <span style={{ color, fontWeight: val >= 20 ? 600 : 400 }}>
      {val.toFixed(3)} DT
    </span>
  );
}

export default function ParkmetersPage() {
  const { user } = useAuth();
  const isGestionnaire = user?.role === "GESTIONNAIRE_SYSTEME";

  const [parkmeters, setParkmeters] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [siteFilter, setSiteFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const isAgent = user?.role === "AGENT_INSTALLATION";
  const [showAddModal, setShowAddModal] = useState(false);

  const navigate = useNavigate();


  const load = useCallback(() => {
    Promise.all([fetchAllParkmeters(), fetchAllSites()])
      .then(([pms, sts]) => {
        setParkmeters(pms);
        setSites(sts);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, siteFilter]);




  useSignalR({
    StatusChanged: useCallback((data) => {
      setParkmeters((prev) =>
        prev.map((pm) =>
          pm.id === data.parkmeterID
            ? { ...pm, status: data.status }
            : pm
        )
      );
    }, []),

    Telemetry: useCallback((data) => {
      setParkmeters((prev) =>
        prev.map((pm) =>
          pm.id === data.parkmeterID
            ? { ...pm, cashAmount: data.cashAmount }
            : pm
        )
      );
    }, []),

    ParkmeterOnline: useCallback(() => {
      fetchAllParkmeters().then(setParkmeters).catch(() => { });
    }, []),
  });

  // fitlre

  const filtered = parkmeters.filter((pm) => {
    const matchSearch = pm.serialNumber
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStatus = statusFilter === "ALL" || pm.status === statusFilter;
    const matchSite = siteFilter === "ALL" || pm.siteId === siteFilter;
    return matchSearch && matchStatus && matchSite;
  });

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const inServiceCount = parkmeters.filter(
    (pm) => pm.status === "IN_SERVICE"
  ).length;

  return (
    <AppLayout>
      <div className={styles.page}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Liste des parcmètres</h1>
            <p className={styles.subtitle}>
              {parkmeters.length} parcmètre{parkmeters.length !== 1 ? "s" : ""}{" "}—{" "}
              <span className={styles.liveCount}>{inServiceCount} en service</span>
            </p>
          </div>
          {isAgent && (
            <button className={styles.createBtn} onClick={() => setShowAddModal(true)}>
              + Enrgistrer  Nouveau Parcmètre
            </button>
          )}
          {showAddModal && (
            <AddParkmeterModal
              onClose={() => setShowAddModal(false)}
              onCreated={load}
            />
          )}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <input
            className={styles.search}
            type="text"
            placeholder="Rechercher par numéro de série..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={styles.select}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">Tous les statuts</option>
            {Object.entries(METER_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select
            className={styles.select}
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="ALL">Tous les sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
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
          paginated.length === 0 ? (
            <div className={styles.state}>Aucun parcmètre trouvé.</div>
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Numéro de série</th>
                    <th>Site</th>
                    <th>Statut</th>
                    <th>Caisse</th>
                    <th>Ajouté le</th>
                    <th>Détails</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((pm) => (
                    <tr key={pm.id}>
                      <td>
                        <span className={styles.serial}>{pm.serialNumber}</span>
                      </td>
                      <td className={styles.muted}>{pm.siteName || "—"}</td>
                      <td><StatusBadge status={pm.status} /></td>
                      <td><CashCell amount={pm.cashAmount} /></td>
                      <td className={styles.muted}>{formatDate(pm.createdAt)}</td>
                      <td>
                        <button
                          className={styles.detailBtn}
                          onClick={() => navigate(`/parkmeters/${pm.id}`)}
                        >
                          Voir détails
                        </button>
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
          onPageChange={setCurrentPage}
        />
      </div>
    </AppLayout>
  );
}