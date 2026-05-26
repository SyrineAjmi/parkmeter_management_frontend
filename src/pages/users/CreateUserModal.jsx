import { useState, useRef } from "react";
import styles from "./CreateUserModal.module.css";

//const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${process.env.REACT_APP_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

async function createUser(name, email, password, role) {
  const res = await fetch(`${BASE_URL}/Users`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ name, email, password, role }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || "Erreur création utilisateur");
  }
  return res.json();
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

export default function CreateUserModal({ onClose, onCreated }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const overlayRef = useRef(null);

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  const isValid = name.trim() && email.trim() && password.length >= 8 && role;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setError(null);
    try {
      await createUser(name.trim(), email.trim(), password, role);
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
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Nouvel utilisateur</h2>
            <p className={styles.subtitle}>Créer un compte utilisateur</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>

          {/* Name */}
          <div className={styles.field}>
            <label className={styles.label}>Nom complet *</label>
            <input
              className={styles.input}
              type="text"
              placeholder="nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          {/* Email */}
          <div className={styles.field}>
            <label className={styles.label}>Email *</label>
            <input
              className={styles.input}
              type="email"
              placeholder="user@parkmeter.tn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {/* Password */}
          <div className={styles.field}>
            <label className={styles.label}>Mot de passe *</label>
            <div className={styles.passwordWrapper}>
              <input
                className={styles.input}
                type={showPassword ? "text" : "password"}
                placeholder="Minimum 8 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPassword((v) => !v)}
              >
                {showPassword ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                )}
              </button>
            </div>
            {password.length > 0 && password.length < 8 && (
              <span className={styles.hint}>
                {8 - password.length} caractère{8 - password.length > 1 ? "s" : ""} manquant{8 - password.length > 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Role */}
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

          {error && (
            <div className={styles.errorBanner}>{error}</div>
          )}

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
              disabled={submitting || !isValid}
            >
              {submitting ? "Création..." : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}