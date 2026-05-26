import { useNavigate } from "react-router-dom";
import styles from "./ParkmeterGrid.module.css";
import { METER_STATUS_COLORS, METER_STATUS_LABELS } from "../../constants/meterStatus";

function ParkmeterCard({ parkmeter }) {
  const navigate = useNavigate();
  const status = parkmeter.status;
  const statusColor = METER_STATUS_COLORS[status] || "#94a3b8";
  const cash = parkmeter.cashAmount ?? 0;
  const cashColor = cash >= 40 ? "#ef4444" : cash >= 20 ? "#f59e0b" : "#16a34a";
  const cashFill = Math.min((cash / 50) * 100, 100); // 50 DT = full bar

  return (
    <div
      className={styles.pmCard}
      style={{ "--status-color": statusColor }}
      onClick={() => navigate(`/parkmeters/${parkmeter.id}`)}
    >
      <div className={styles.pmTop}>
        <div className={styles.pmIdentity}>
          <span className={styles.statusDot} />
          <span className={styles.pmSerial}>{parkmeter.serialNumber}</span>
        </div>
        <span
          className={styles.statusBadge}
          style={{ background: statusColor + "20", color: statusColor }}
        >
          {METER_STATUS_LABELS[status] || status}
        </span>
      </div>

      {/* Site */}
      <span className={styles.pmSite}>
        Installé à :  {parkmeter.siteName || "Site non assigné"}
      </span>

      {/* Cash bar */}
      <div className={styles.cashSection}>
        <div className={styles.cashLabelRow}>
          <span className={styles.cashLabel}>Caisse</span>
          <span className={styles.cashValue} style={{ color: cashColor }}>
            {cash.toFixed(3)} DT
          </span>
        </div>
        <div className={styles.cashTrack}>
          <div
            className={styles.cashFill}
            style={{
              width: `${cashFill}%`,
              background: cashColor,
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default function ParkmeterGrid({ parkmeters }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Parcmètres</span>
        <span className={styles.count}>{parkmeters.length} parcmètres en total</span>
      </div>
      {parkmeters.length === 0 ? (
        <div className={styles.empty}>Aucun parcmètre trouvé</div>
      ) : (
        <div className={styles.grid}>
          {parkmeters.slice(0, 4).map((pm) => (
            <ParkmeterCard key={pm.id} parkmeter={pm} />
          ))}
        </div>
      )}
    </div>
  );
}