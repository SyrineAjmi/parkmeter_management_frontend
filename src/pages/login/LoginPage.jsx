import { useNavigate } from "react-router-dom";
import { useLogin } from "../../hooks/useLogin";
import LoginForm from "./LoginForm";
import styles from "./LoginPage.module.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { handleLogin, loading, error } = useLogin();

  function onSubmit(email, password) {
    handleLogin(email, password, navigate);
  }

  return (
    <div className={styles.page}>
      {/* Left panel — hero */}
      <div className={styles.hero}>
        <div className={styles.heroOverlay} />
        <div className={styles.heroContent}>
          <h2 className={styles.heroTitle}>
            Surveillance, configuration et gestion centralisée des parcmètres.<br />
          </h2>
        </div>
      </div>

      {/* Right panel — form */}
      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <LoginForm onSubmit={onSubmit} loading={loading} error={error} />
        </div>
      </div>

    </div>
  );
}
