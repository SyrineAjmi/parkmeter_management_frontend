import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { useSignalR } from "../../hooks/useSignalR";
import { useAuth } from "../../context/AuthContext";
import { fetchAllSites } from "../../api/dashboard.api";
import { METER_STATUS_COLORS, METER_STATUS_LABELS } from "../../constants/meterStatus";
import { ALERT_TYPE_LABELS, ALERT_PRIORITY_COLORS, ALERT_PRIORITY_LABELS } from "../../constants/alertTypes";
import styles from "./ParkmeterDetailPage.module.css";
import ConfigModal from "./Configmodal";


//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function fetchDetails(id) {
  const res = await fetch(`${BASE_URL}/Parkmeters/${id}/details`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Erreur chargement (${res.status})`);
  return res.json();
}

async function changeStatus(id, status) {
  const res = await fetch(`${BASE_URL}/Parkmeters/${id}/status`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || "Erreur changement statut");
  }
}

async function assignSite(id, siteId) {
  const res = await fetch(`${BASE_URL}/Parkmeters/${id}/assign-site`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ siteId }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || "Erreur assignation site");
  }
}

const STRATEGY_LABELS = {
  FLAT_RATE: "Tarif fixe",
  TIME_OF_DAY: "Heure de la journée",
  WEEKDAY_WEEKEND: "Semaine / Weekend",
};

const ALLOWED_TRANSITIONS = {
  IN_SERVICE: ["OUT_OF_SERVICE", "TEMPORARILY_UNAVAILABLE"],
  OUT_OF_SERVICE: ["IN_SERVICE"],
  TEMPORARILY_UNAVAILABLE: ["OUT_OF_SERVICE"],
  PENDING_ACTIVATION: [],
};

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDuration(start) {
  const mins = Math.floor((Date.now() - new Date(start)) / 60000);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

export default function ParkmeterDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isGestionnaire = user?.role === "GESTIONNAIRE_SYSTEME";
  const isAgent = user?.role === "AGENT_INSTALLATION";
  const isSuperviseur = user?.role === "SUPERVISEUR";
  const isFinancier = user?.role === "RESPONSABLE_FINANCIER";
  const isOperateur = user?.role === "OPERATEUR";

  const [data, setData] = useState(null);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState(null);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteError, setSiteError] = useState(null);
  const [showConfigModal, setShowConfigModal] = useState(false);


  const load = useCallback(() => {
    setError(null);
    Promise.all([fetchDetails(id), fetchAllSites()])
      .then(([det, sts]) => {
        setData(det);
        setSites(sts);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── Real-time ─────────────────────────────────────────────

  useSignalR({
    StatusChanged: useCallback((evt) => {
      if (evt.parkmeterID !== id) return;
      setData((prev) =>
        prev ? { ...prev, parkmeter: { ...prev.parkmeter, status: evt.status } } : prev
      );
    }, [id]),

    Telemetry: useCallback((evt) => {
      if (evt.parkmeterID !== id) return;
      setData((prev) =>
        prev ? { ...prev, parkmeter: { ...prev.parkmeter, cashAmount: evt.cashAmount } } : prev
      );
    }, [id]),

    NewAlert: useCallback((evt) => {
      if (evt.parkmeterID !== id) return;
      load();
    }, [id, load]),

    AlertResolved: useCallback((evt) => {
      if (evt.parkmeterID !== id) return;
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          activeAlerts: prev.activeAlerts.filter((a) => a.id !== evt.alertId),
        };
      });
    }, [id]),
  });

  // ── Actions ───────────────────────────────────────────────

  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    if (!newStatus) return;
    setStatusLoading(true);
    setStatusError(null);
    try {
      await changeStatus(id, newStatus);
    } catch (err) {
      setStatusError(err.message);
    } finally {
      setStatusLoading(false);
    }
  }

  async function handleSiteChange(e) {
    const newSiteId = e.target.value;
    if (!newSiteId) return;
    setSiteLoading(true);
    setSiteError(null);
    try {
      await assignSite(id, newSiteId);
      const siteName = sites.find((s) => s.id === newSiteId)?.name || "";
      setData((prev) =>
        prev ? {
          ...prev,
          parkmeter: { ...prev.parkmeter, siteId: newSiteId, siteName },
        } : prev
      );
    } catch (err) {
      setSiteError(err.message);
    } finally {
      setSiteLoading(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className={styles.loadingState}>Chargement...</div>
      </AppLayout>
    );
  }

  if (error || !data) {
    return (
      <AppLayout>
        <div className={styles.errorState}>
          {error || "Parcmètre introuvable"}
          <button onClick={load} className={styles.retryBtn}>Réessayer</button>
        </div>
      </AppLayout>
    );
  }

  const { parkmeter, config, activeAlerts, currentSession } = data;
  const statusColor = METER_STATUS_COLORS[parkmeter.status] || "#94a3b8";
  const transitions = ALLOWED_TRANSITIONS[parkmeter.status] || [];

  return (
    <AppLayout>
      <div className={styles.page}>

        {/* Back button */}
        <button className={styles.backBtn} onClick={() => navigate("/parkmeters")}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Retour aux parcmètres
        </button>

        {/* Hero header */}
        <div className={styles.hero} style={{ borderLeftColor: statusColor }}>
          <div className={styles.heroLeft}>
            <div className={styles.heroSerial}>{parkmeter.serialNumber}</div>
            <div className={styles.heroMeta}>
              <span
                className={styles.statusPill}
                style={{ background: statusColor + "22", color: statusColor }}
              >
                <span className={styles.statusDot} style={{ background: statusColor }} />
                {METER_STATUS_LABELS[parkmeter.status] || parkmeter.status}
              </span>
              <span className={styles.heroSite}>
                Site : {parkmeter.siteName || "Site non assigné"}
              </span>
            </div>
          </div>
          <div className={styles.heroRight}>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Caisse</span>
              <span
                className={styles.heroStatValue}
                style={{ color: parkmeter.cashAmount >= 40 ? "#ef4444" : parkmeter.cashAmount >= 20 ? "#f59e0b" : "#111827" }}
              >
                {(parkmeter.cashAmount ?? 0).toFixed(3)} DT
              </span>
            </div>
            <div className={styles.heroStat}>
              <span className={styles.heroStatLabel}>Ajouté le</span>
              <span className={styles.heroStatValue}>
                {new Date(parkmeter.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className={styles.grid}>

          {/* Actions card — gestionnaire only */}
          {(isGestionnaire || isAgent) && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Actions</span>
              </div>
              <div className={styles.cardBody}>

                {/* Status change */}
                {isGestionnaire && (

                  <div className={styles.actionField}>
                    <label className={styles.actionLabel}>Changer le statut</label>
                    {transitions.length === 0 ? (
                      <p className={styles.actionNote}>
                        Aucune transition disponible pour ce statut
                      </p>
                    ) : (
                      <div className={styles.actionRow}>
                        <select
                          className={styles.actionSelect}
                          value=""
                          onChange={handleStatusChange}
                          disabled={statusLoading}
                        >
                          <option value="" disabled>
                            {statusLoading ? "Envoi..." : "Sélectionner →"}
                          </option>
                          {transitions.map((s) => (
                            <option key={s} value={s}>
                              {METER_STATUS_LABELS[s] || s}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                    {statusError && <p className={styles.actionError}>{statusError}</p>}
                  </div>
                )}

                {/* Site assign */}
                <div className={styles.actionField}>
                  <label className={styles.actionLabel}>Assigner à un site</label>
                  <div className={styles.actionRow}>
                    <select
                      className={styles.actionSelect}
                      value={parkmeter.siteId || ""}
                      onChange={handleSiteChange}
                      disabled={siteLoading}
                    >
                      <option value="" disabled>Sélectionner un site...</option>
                      {sites.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  {siteError && <p className={styles.actionError}>{siteError}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Current session */}
          {(isGestionnaire || isSuperviseur || isFinancier) && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Session en cours</span>
                {currentSession && (
                  <span className={styles.liveTag}>
                    <span className={styles.liveDot} />
                    Active
                  </span>
                )}
              </div>
              <div className={styles.cardBody}>
                {!currentSession ? (
                  <p className={styles.emptyNote}>Aucune session active</p>
                ) : (
                  <div className={styles.sessionGrid}>
                    <div className={styles.sessionStat}>
                      <span className={styles.sessionLabel}>Démarré le</span>
                      <span className={styles.sessionValue}>
                        {formatDateTime(currentSession.startDateTime)}
                      </span>
                    </div>
                    <div className={styles.sessionStat}>
                      <span className={styles.sessionLabel}>Durée</span>
                      <span className={styles.sessionValue}>
                        {formatDuration(currentSession.startDateTime)}
                      </span>
                    </div>
                    <div className={styles.sessionStat}>
                      <span className={styles.sessionLabel}>Transactions</span>
                      <span className={styles.sessionValue}>
                        {currentSession.totalTransactions}
                      </span>
                    </div>
                    <div className={styles.sessionStat}>
                      <span className={styles.sessionLabel}>Montant</span>
                      <span className={`${styles.sessionValue} ${styles.sessionAmount}`}>
                        {(currentSession.totalAmount ?? 0).toFixed(3)} DT
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Config */}
          {!isFinancier && !isOperateur && (

            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Configuration</span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {!isAgent && <span className={styles.readOnlyTag}>Lecture seule</span>}
                  {isAgent && (
                    <button
                      className={styles.configBtn}
                      onClick={() => setShowConfigModal(true)}
                    >
                      {config ? "Modifier" : "Configurer"}
                    </button>
                  )}
                </div>
              </div>
              <div className={styles.cardBody}>
                {!config ? (
                  <p className={styles.emptyNote}>Aucune configuration définie</p>
                ) : (
                  <div className={styles.configGrid}>
                    <div className={styles.configRow}>
                      <span className={styles.configLabel}>Stratégie</span>
                      <span className={styles.configValue}>
                        {STRATEGY_LABELS[config.strategyType] || config.strategyType}
                      </span>
                    </div>
                    <div className={styles.configRow}>
                      <span className={styles.configLabel}>Durée max</span>
                      <span className={styles.configValue}>{config.maxDuration} min</span>
                    </div>
                    {config.pricePerHour > 0 && (
                      <div className={styles.configRow}>
                        <span className={styles.configLabel}>Tarif/heure</span>
                        <span className={styles.configValue}>{config.pricePerHour.toFixed(3)} DT</span>
                      </div>
                    )}
                    {config.peakRate > 0 && (
                      <div className={styles.configRow}>
                        <span className={styles.configLabel}>Tarif peak</span>
                        <span className={styles.configValue}>{config.peakRate.toFixed(3)} DT</span>
                      </div>
                    )}
                    {config.offPeakRate > 0 && (
                      <div className={styles.configRow}>
                        <span className={styles.configLabel}>Tarif off-peak</span>
                        <span className={styles.configValue}>{config.offPeakRate.toFixed(3)} DT</span>
                      </div>
                    )}
                    {config.weekdayRate > 0 && (
                      <div className={styles.configRow}>
                        <span className={styles.configLabel}>Tarif semaine</span>
                        <span className={styles.configValue}>{config.weekdayRate.toFixed(3)} DT</span>
                      </div>
                    )}
                    {config.weekendRate > 0 && (
                      <div className={styles.configRow}>
                        <span className={styles.configLabel}>Tarif weekend</span>
                        <span className={styles.configValue}>{config.weekendRate.toFixed(3)} DT</span>
                      </div>
                    )}
                    <div className={styles.configRow}>
                      <span className={styles.configLabel}>Mise à jour</span>
                      <span className={styles.configValue}>
                        {formatDateTime(config.updatedAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active alerts */}
          {(isGestionnaire || isSuperviseur || isOperateur) && (
            <div className={`${styles.card}`}>
              <div className={styles.cardHeader}>
                <span className={styles.cardTitle}>Alertes actives</span>
                {activeAlerts?.length > 0 && (
                  <span className={styles.alertCount}>{activeAlerts.length}</span>
                )}
              </div>
              <div className={styles.cardBody}>
                {!activeAlerts?.length ? (
                  <p className={styles.emptyNote}>Aucune alerte active</p>
                ) : (
                  <div className={styles.alertsList}>
                    {activeAlerts.map((alert) => {
                      const color = ALERT_PRIORITY_COLORS[alert.priority] || "#94a3b8";
                      return (
                        <div
                          key={alert.id}
                          className={styles.alertRow}
                          style={{ borderLeftColor: color }}
                        >
                          <div className={styles.alertInfo}>
                            <span className={styles.alertType}>
                              {ALERT_TYPE_LABELS[alert.type] || alert.type}
                            </span>
                            <span
                              className={styles.alertPriority}
                              style={{ color }}
                            >
                              {ALERT_PRIORITY_LABELS[alert.priority] || alert.priority}
                            </span>
                          </div>
                          <span className={styles.alertTime}>
                            {formatDateTime(alert.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {showConfigModal && (
          <ConfigModal
            parkmeter={parkmeter}
            existingConfig={config}
            onClose={() => setShowConfigModal(false)}
            onSaved={load}
          />
        )}
      </div>
    </AppLayout>
  );
}