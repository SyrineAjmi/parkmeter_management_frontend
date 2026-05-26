import { useState, useRef } from "react";
import styles from "./CreateUserModal.module.css";

//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function updateUser(id, name, email, role, isActive) {
  const res = await fetch(`${BASE_URL}/Users/${id}`, {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify({ name, email, role, isActive }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Erreur modification utilisateur");
  }
}

const ROLE_OPTIONS = [
  { value: "SUPERVISEUR",           label: "Superviseur" },
  { value: "RESPONSABLE_FINANCIER", label: "Responsable financier" },
  { value: "AGENT_INSTALLATION",    label: "Agent d'installation" },
  { value: "OPERATEUR",             label: "Opérateur" },
  { value: "GESTIONNAIRE_SYSTEME",  label: "Gestionnaire système" },
];

const ROLE_COLORS = {
  GESTIONNAIRE_SYSTEME:  "#1d4ed8",
  SUPERVISEUR:           "#92400e",
  RESPONSABLE_FINANCIER: "#065f46",
  AGENT_INSTALLATION:    "#374151",
  OPERATEUR:             "#9d174d",
};

export default function EditUserModal({ user, onClose, onUpdated }) {
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [role, setRole] = useState(user.role || "");
  const [isActive, setIsActive] = useState(user.isActive ?? true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  const isValid = name.trim() && email.trim() && role;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateUser(user.id, name.trim(), email.trim(), role, isActive);
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
            <h2 className={styles.title}>Modifier l'utilisateur</h2>
            <p className={styles.subtitle}>{user.email}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          <div className={styles.field}>
            <label className={styles.label}>Nom complet *</label>
            <input className={styles.input} type="text" value={name}
              onChange={(e) => setName(e.target.value)} required autoFocus />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Email *</label>
            <input className={styles.input} type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Rôle *</label>
            <div className={styles.roleGrid}>
              {ROLE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.roleBtn} ${role === opt.value ? styles.roleBtnActive : ""}`}
                  style={role === opt.value ? {
                    borderColor: ROLE_COLORS[opt.value],
                    color: ROLE_COLORS[opt.value],
                    background: ROLE_COLORS[opt.value] + "11",
                  } : {}}
                  onClick={() => setRole(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Statut</label>
            <div className={styles.roleGrid}>
              <button
                type="button"
                className={`${styles.roleBtn} ${isActive ? styles.roleBtnActive : ""}`}
                style={isActive ? { borderColor: "#16a34a", color: "#16a34a", background: "#16a34a11" } : {}}
                onClick={() => setIsActive(true)}
              >
                Actif
              </button>
              <button
                type="button"
                className={`${styles.roleBtn} ${!isActive ? styles.roleBtnActive : ""}`}
                style={!isActive ? { borderColor: "#ef4444", color: "#ef4444", background: "#ef444411" } : {}}
                onClick={() => setIsActive(false)}
              >
                Inactif
              </button>
            </div>
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className={styles.submitBtn} disabled={submitting || !isValid}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}