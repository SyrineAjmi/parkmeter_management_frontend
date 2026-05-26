import styles from "./KpiCard.module.css";

export default function KpiCard({ title, value, icon, children, accent }) {
  return (
    <div
      className={styles.card}
      style={{ "--accent": accent || "#0e64c8" }}
    >
      <div className={styles.topRow}>
        <span className={styles.title}>{title}</span>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.value}>{value}</div>
      {children && (
        <div className={styles.footer}>{children}</div>
      )}
    </div>
  );
}