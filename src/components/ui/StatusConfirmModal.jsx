// StatusConfirmModal.jsx
import { useState, useRef } from "react";
import styles from "./StatusConfirmModal.module.css";

export default function StatusConfirmModal({ status, serialNumber, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);
  const isOn = status === "IN_SERVICE";

  async function handleConfirm() {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  }

  return (
    <div className={styles.overlay} ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}>
      <div className={styles.modal}>
        <div className={styles.icon} style={{ background: isOn ? "#dcfce7" : "#fee2e2" }}>
          {isOn ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
            </svg>
          )}
        </div>
        <h2 className={styles.title}>
          {isOn ? "Mettre en service ?" : "Mettre hors service ?"}
        </h2>
        <p className={styles.message}>
          {isOn
            ? `Envoyer la commande au parcmètre ${serialNumber} ? La machine évaluera ses conditions avant de confirmer.`
            : `Mettre ${serialNumber} hors service ? Il ne pourra plus accepter de transactions.`}
        </p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={loading}>
            Annuler
          </button>
          <button
            className={styles.confirmBtn}
            style={{ background: isOn ? "#16a34a" : "#ef4444" }}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "..." : isOn ? "Mettre en service" : "Mettre hors service"}
          </button>
        </div>
      </div>
    </div>
  );
}