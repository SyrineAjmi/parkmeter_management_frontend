import styles from "./Button.module.css";

/**
 * @param {"primary"|"secondary"|"ghost"} variant
 * @param {boolean} loading
 * @param {boolean} fullWidth
 */
export default function Button({
  children,
  variant = "primary",
  loading = false,
  fullWidth = false,
  disabled = false,
  type = "button",
  onClick,
  className = "",
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        styles.btn,
        styles[variant],
        fullWidth ? styles.fullWidth : "",
        loading ? styles.loading : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}
