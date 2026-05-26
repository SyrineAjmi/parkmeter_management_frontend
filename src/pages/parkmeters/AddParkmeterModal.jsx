import { useState, useEffect, useRef } from "react";
import styles from "./AddParkmeterModal.module.css";
import { fetchAllSites } from "../../api/dashboard.api";

// const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function addParkmeter(serialNumber, siteId) {
  const res = await fetch(`${BASE_URL}/Parkmeters`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ serialNumber, siteId }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Erreur ajout parcmètre");
  }
  return res.json();
}

export default function AddParkmeterModal({ onClose, onCreated }) {
  const [serialNumber, setSerialNumber] = useState("");
  const [siteId, setSiteId] = useState("");
  const [sites, setSites] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    fetchAllSites()
      .then(setSites)
      .catch(() => {})
      .finally(() => setLoadingSites(false));
  }, []);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  const isValid = serialNumber.trim() && siteId;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await addParkmeter(serialNumber.trim().toUpperCase(), siteId);
      onCreated();
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
            <h2 className={styles.title}>Nouveau parcmètre</h2>
            <p className={styles.subtitle}>Enregistrer un nouveau parcmètre dans le système</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.field}>
            <label className={styles.label}>Numéro de série *</label>
            <input
              className={styles.input}
              type="text"
              placeholder="ex: PM005"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
              required
              autoFocus
            />
            <span className={styles.hint}>
              Le numéro de série doit correspondre exactement à celui gravé sur la machine
            </span>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Site d'installation *</label>
            {loadingSites ? (
              <div className={styles.loadingNote}>Chargement des sites...</div>
            ) : (
              <div className={styles.siteGrid}>
                {sites.length === 0 && (
                  <p className={styles.noSites}>Aucun site disponible — créez un site d'abord</p>
                )}
                {sites.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`${styles.siteBtn} ${siteId === s.id ? styles.siteBtnActive : ""}`}
                    onClick={() => setSiteId(s.id)}
                  >
                    <span className={styles.siteName}>{s.name}</span>
                    {s.address && (
                      <span className={styles.siteAddress}>{s.address}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className={styles.infoBox}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>Le parcmètre sera créé avec le statut <strong>En attente d'activation</strong>. Il passera automatiquement en service après réception de sa configuration via MQTT.</span>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting || !isValid}>
              {submitting ? "Ajout en cours..." : "Ajouter le parcmètre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}