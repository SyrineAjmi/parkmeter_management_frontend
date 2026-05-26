import { useState, useRef } from "react";
import styles from "./ConfigModal.module.css";

//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function saveConfig(parkmeterId, data, isUpdate) {
  const url = isUpdate
    ? `${BASE_URL}/ParkmeterConfiguration/update`
    : `${BASE_URL}/ParkmeterConfiguration/create`;
  const method = isUpdate ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: authHeaders(),
    body: JSON.stringify({ parkmeterId, ...data }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || "Erreur sauvegarde configuration");
  }
}

const STRATEGIES = [
  { value: "FLAT_RATE",       label: "Tarif fixe",            desc: "Un seul tarif à l'heure" },
  { value: "TIME_OF_DAY",     label: "Heure de la journée",   desc: "Tarif peak / off-peak" },
  { value: "WEEKDAY_WEEKEND", label: "Semaine / Weekend",     desc: "Tarif différent le weekend" },
];

export default function ConfigModal({ parkmeter, existingConfig, onClose, onSaved }) {
  const isUpdate = !!existingConfig;

  const [maxDuration, setMaxDuration] = useState(existingConfig?.maxDuration ?? 120);
  const [strategyType, setStrategyType] = useState(existingConfig?.strategyType ?? "FLAT_RATE");
  const [pricePerHour, setPricePerHour] = useState(existingConfig?.pricePerHour ?? "");
  const [peakRate, setPeakRate] = useState(existingConfig?.peakRate ?? "");
  const [offPeakRate, setOffPeakRate] = useState(existingConfig?.offPeakRate ?? "");
  const [weekdayRate, setWeekdayRate] = useState(existingConfig?.weekdayRate ?? "");
  const [weekendRate, setWeekendRate] = useState(existingConfig?.weekendRate ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  function isValid() {
    if (!maxDuration || maxDuration <= 0) return false;
    if (strategyType === "FLAT_RATE") return pricePerHour > 0;
    if (strategyType === "TIME_OF_DAY") return peakRate > 0 && offPeakRate > 0;
    if (strategyType === "WEEKDAY_WEEKEND") return weekdayRate > 0 && weekendRate > 0;
    return false;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid()) return;
    setSubmitting(true);
    setError(null);

    const data = {
      maxDuration: parseInt(maxDuration),
      strategyType,
      pricePerHour:  strategyType === "FLAT_RATE"       ? parseFloat(pricePerHour)  : null,
      peakRate:      strategyType === "TIME_OF_DAY"     ? parseFloat(peakRate)      : null,
      offPeakRate:   strategyType === "TIME_OF_DAY"     ? parseFloat(offPeakRate)   : null,
      weekdayRate:   strategyType === "WEEKDAY_WEEKEND" ? parseFloat(weekdayRate)   : null,
      weekendRate:   strategyType === "WEEKDAY_WEEKEND" ? parseFloat(weekendRate)   : null,
    };

    try {
      await saveConfig(parkmeter.id, data, isUpdate);
      onSaved();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className={styles.overlay} ref={overlayRef} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>
              {isUpdate ? "Modifier la configuration" : "Configurer le parcmètre"}
            </h2>
            <p className={styles.subtitle}>{parkmeter.serialNumber}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Max duration */}
          <div className={styles.field}>
            <label className={styles.label}>Durée maximale (minutes) *</label>
            <input
              className={styles.input}
              type="number"
              min="1"
              max="480"
              value={maxDuration}
              onChange={(e) => setMaxDuration(e.target.value)}
              required
            />
          </div>

          {/* Strategy */}
          <div className={styles.field}>
            <label className={styles.label}>Stratégie tarifaire *</label>
            <div className={styles.strategyGrid}>
              {STRATEGIES.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  className={`${styles.strategyBtn} ${strategyType === s.value ? styles.strategyBtnActive : ""}`}
                  onClick={() => setStrategyType(s.value)}
                >
                  <span className={styles.strategyLabel}>{s.label}</span>
                  <span className={styles.strategyDesc}>{s.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic rate fields */}
          {strategyType === "FLAT_RATE" && (
            <div className={styles.field}>
              <label className={styles.label}>Tarif à l'heure (DT) *</label>
              <input
                className={styles.input}
                type="number"
                min="0.001"
                step="0.001"
                placeholder="ex: 1.000"
                value={pricePerHour}
                onChange={(e) => setPricePerHour(e.target.value)}
                required
              />
            </div>
          )}

          {strategyType === "TIME_OF_DAY" && (
            <div className={styles.rateRow}>
              <div className={styles.field}>
                <label className={styles.label}>Tarif peak (DT) *</label>
                <input className={styles.input} type="number" min="0.001" step="0.001"
                  placeholder="ex: 2.500" value={peakRate}
                  onChange={(e) => setPeakRate(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tarif off-peak (DT) *</label>
                <input className={styles.input} type="number" min="0.001" step="0.001"
                  placeholder="ex: 1.000" value={offPeakRate}
                  onChange={(e) => setOffPeakRate(e.target.value)} required />
              </div>
            </div>
          )}

          {strategyType === "WEEKDAY_WEEKEND" && (
            <div className={styles.rateRow}>
              <div className={styles.field}>
                <label className={styles.label}>Tarif semaine (DT) *</label>
                <input className={styles.input} type="number" min="0.001" step="0.001"
                  placeholder="ex: 1.500" value={weekdayRate}
                  onChange={(e) => setWeekdayRate(e.target.value)} required />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Tarif weekend (DT) *</label>
                <input className={styles.input} type="number" min="0.001" step="0.001"
                  placeholder="ex: 0.500" value={weekendRate}
                  onChange={(e) => setWeekendRate(e.target.value)} required />
              </div>
            </div>
          )}

          {/* Info box */}
          <div className={styles.infoBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>La configuration sera envoyée au parcmètre via MQTT immédiatement après la sauvegarde.</span>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting || !isValid()}>
              {submitting ? "Envoi en cours..." : isUpdate ? "Mettre à jour" : "Créer la configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}