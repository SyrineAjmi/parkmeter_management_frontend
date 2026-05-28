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

async function updateSite(id, name, address, description, latitude, longitude) {
  const res = await fetch(`${BASE_URL}/Sites/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name, address, description, latitude, longitude  }),
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
  const [latitude, setLatitude] = useState(site.latitude ?? "");
  const [longitude, setLongitude] = useState(site.longitude ?? "");
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
    if (!description.trim()) {
      setError("Le nom du site est obligatoire");
      return;
    }
    if (!address.trim()) {
      setError("L'adresse du site est obligatoire");
      return;
    }
    if (!latitude || !longitude) {
      setError("Les coordonnées GPS sont obligatoires");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateSite(site.id, name.trim(), address.trim(), description.trim(), latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null);
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
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
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
            <label className={styles.label}>Adresse *</label>
            <input className={styles.input} type="text" value={address}
              onChange={(e) => setAddress(e.target.value)} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Description *</label>
            <textarea className={styles.textarea} value={description}
              onChange={(e) => setDescription(e.target.value)} rows={3} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Coordonnées GPS *</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          <div style={{ flex: 1 }}>
                            <span className={styles.hint} style={{ marginBottom: 4, display: "block" }}>
                              Latitude
                            </span>
                            <input
                              className={styles.input}
                              type="number"
                              step="0.0001"
                              placeholder="ex: 36.8190"
                              value={latitude}
                              onChange={(e) => setLatitude(e.target.value)}
                              required
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <span className={styles.hint} style={{ marginBottom: 4, display: "block" }}>
                              Longitude
                            </span>
                            <input
                              className={styles.input}
                              type="number"
                              step="0.0001"
                              placeholder="ex: 10.1658"
                              value={longitude}
                              onChange={(e) => setLongitude(e.target.value)}
                              required
                            />
                          </div>
                        </div>
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