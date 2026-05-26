import { useState, useRef } from "react";
import styles from "./CreateSiteModal.module.css";

//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function updateSite(id, name, address, description) {
  const res = await fetch(`${BASE_URL}/Sites/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name, address, description }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Erreur modification site");
  }
}

export default function EditSiteModal({ site, onClose, onUpdated }) {
  const [name, setName] = useState(site.name || "");
  const [address, setAddress] = useState(site.address || "");
  const [description, setDescription] = useState(site.description || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Le nom du site est obligatoire");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateSite(site.id, name.trim(), address.trim(), description.trim());
      onUpdated();
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
            <h2 className={styles.title}>Modifier le site</h2>
            <p className={styles.subtitle}>{site.name}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label className={styles.label}>Nom du site *</label>
            <input className={styles.input} type="text" value={name}
              onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Adresse</label>
            <input className={styles.input} type="text" value={address}
              onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.textarea} value={description}
              onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          {error && <div className={styles.errorBanner}>{error}</div>}
          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Annuler</button>
            <button type="submit" className={styles.submitBtn} disabled={submitting || !name.trim()}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}