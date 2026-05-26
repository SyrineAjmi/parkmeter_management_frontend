import styles from "./RecentAlertsFeed.module.css";
import { ALERT_PRIORITY_COLORS, ALERT_PRIORITY_LABELS, ALERT_TYPE_LABELS } from "../../constants/alertTypes";

export default function RecentAlertsFeed({ alerts, onResolve }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Alertes Récentes</span>
        <button className={styles.viewAll}>Voir tout</button>
      </div>

      <div className={styles.list}>
        {alerts.length === 0 && (
          <div className={styles.empty}>Aucune alerte active </div>
        )}
        {alerts.slice(0, 5).map((alert) => (
          <div
            key={alert.id}
            className={styles.alertRow}
            style={{ borderLeftColor: ALERT_PRIORITY_COLORS[alert.priority] }}
          >
            <div className={styles.alertInfo}>
              <div className={styles.alertTop}>
                <span className={styles.parkmeter}>
                  {alert.parkmeterId?.toString().slice(0, 8) || "PM-????"}
                </span>
                <span
                  className={styles.priorityBadge}
                  style={{ background: ALERT_PRIORITY_COLORS[alert.priority] }}
                >
                  {ALERT_PRIORITY_LABELS[alert.priority]}
                </span>
              </div>
              <span className={styles.alertType}>
                {ALERT_TYPE_LABELS[alert.type] || alert.type}
              </span>
              <span className={styles.time}>
                {new Date(alert.createdAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <button
              className={styles.resolveBtn}
              onClick={() => onResolve(alert.id)}
            >
              Résoudre
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}