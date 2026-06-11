import { useState } from "react";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import styles from "./LoginForm.module.css";

// Simple SVG icons inline to avoid icon library dependency
const EmailIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="M2 7l10 7 10-7" />
  </svg>
);

const LockIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="11" width="18" height="11" rx="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const EyeIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeOffIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/**
 * Pure presentational login form.
 * @param {(email, password) => void} onSubmit
 * @param {boolean} loading
 * @param {string|null} error
 */
export default function LoginForm({ onSubmit, loading, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit(email, password, rememberMe);
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>P</span>
        <span className={styles.logoText}>Système de gestion des parcmètres</span>
      </div>

      <div className={styles.heading}>
        <h1 className={styles.title}>Bienvenue</h1>
        <p className={styles.subtitle}>Entrez vos identifiants pour accéder au tableau de bord</p>
      </div>

      <div className={styles.fields}>
        <Input
          id="email"
          label="Adresse email"
          type="email"
          placeholder="admin@parkmeter.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leftIcon={<EmailIcon />}
          required
          autoComplete="email"
        />

        <Input
          id="password"
          label="Mot de passe"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leftIcon={<LockIcon />}
          rightIcon={showPassword ? <EyeOffIcon /> : <EyeIcon />}
          onRightIconClick={() => setShowPassword((v) => !v)}
          required
          autoComplete="current-password"
        />
      </div>

      {/* <div className={styles.row}>
        <label className={styles.checkLabel}>
          <input
            type="checkbox"
            className={styles.checkbox}
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          Se souvenir de moi
        </label>
        <button type="button" className={styles.forgotLink}>
          Mot de passe oublié ?
        </button>
      </div> */}

      {error && (
        <div className={styles.errorBanner} role="alert">
          {error}
        </div>
      )}

      <Button type="submit" fullWidth loading={loading} variant="primary">
        Se connecter
      </Button>
    </form>
  );
}
