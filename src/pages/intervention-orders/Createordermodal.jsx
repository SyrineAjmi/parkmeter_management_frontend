import { useState, useEffect, useRef } from "react";
import styles from "./Createordermodal.module.css";

// const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function fetchOperators() {
  const res = await fetch(`${BASE_URL}/Users/operators`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur chargement opérateurs");
  return res.json();
}

async function createOrder(parkmeterId, operatorId, type) {
  const res = await fetch(`${BASE_URL}/InterventionOrders`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ parkmeterId, operatorId, type }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Erreur création ordre");
  }
  return res.json();
}

const TYPE_OPTIONS = [
  { value: "CASH_COLLECTION", label: "Collecte caisse" },
  { value: "PAPER_REFILL",    label: "Recharge papier" },
  { value: "HARDWARE_REPAIR", label: "Réparation matérielle" },
];

export default function CreateOrderModal({ parkmeters, onClose, onCreated }) {
  const [operators, setOperators] = useState([]);
  const [loadingOps, setLoadingOps] = useState(true);
  const [parkmeterId, setParkmeterId] = useState("");
  const [operatorId, setOperatorId] = useState("");
  const [type, setType] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  useEffect(() => {
    fetchOperators()
      .then(setOperators)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingOps(false));
  }, []);

  // close on overlay click
  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!parkmeterId || !operatorId || !type) {
      setError("Veuillez remplir tous les champs");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createOrder(parkmeterId, operatorId, type);
      onCreated();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={styles.overlay}
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className={styles.modal}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Nouvel ordre d'intervention</h2>
            <p className={styles.subtitle}>
              Créer et assigner une intervention à un opérateur
            </p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Parkmeter */}
          <div className={styles.field}>
            <label className={styles.label}>Parkmètre</label>
            <select
              className={styles.select}
              value={parkmeterId}
              onChange={(e) => setParkmeterId(e.target.value)}
              required
            >
              <option value="">Sélectionner un parkmètre...</option>
              {parkmeters.map((pm) => (
                <option key={pm.id} value={pm.id}>
                  {pm.serialNumber} — {pm.siteName || "Sans site"}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className={styles.field}>
            <label className={styles.label}>Type d'intervention</label>
            <div className={styles.typeGrid}>
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.typeBtn} ${type === opt.value ? styles.typeBtnActive : ""}`}
                  onClick={() => setType(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Operator */}
          <div className={styles.field}>
            <label className={styles.label}>Opérateur assigné</label>
            {loadingOps ? (
              <div className={styles.loadingOps}>Chargement...</div>
            ) : (
              <div className={styles.operatorGrid}>
                {operators.length === 0 && (
                  <div className={styles.noOps}>Aucun opérateur actif</div>
                )}
                {operators.map((op) => (
                  <button
                    key={op.id}
                    type="button"
                    className={`${styles.operatorBtn} ${operatorId === op.id ? styles.operatorBtnActive : ""}`}
                    onClick={() => setOperatorId(op.id)}
                  >
                    <span className={styles.opAvatar}>
                      {op.name.charAt(0).toUpperCase()}
                    </span>
                    <span className={styles.opName}>{op.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {error && (
            <div className={styles.errorBanner}>{error}</div>
          )}

          {/* Actions */}
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.cancelBtn}
              onClick={onClose}
            >
              Annuler
            </button>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !parkmeterId || !operatorId || !type}
            >
              {submitting ? "Création..." : "Créer l'ordre"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}