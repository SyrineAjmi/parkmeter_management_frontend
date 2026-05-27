import styles from "./InterventionOrdersTable.module.css";
import {
  INTERVENTION_STATUS_COLORS,
  INTERVENTION_STATUS_LABELS,
} from "../../constants/alertTypes";

const TYPE_LABELS = {
  CASH_COLLECTION: "Collecte caisse",
  PAPER_REFILL: "Recharge papier",
  HARDWARE_REPAIR : "Réparation Materielle"
};

export default function InterventionOrdersTable({ orders }) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Ordres d'intervention</span>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Parkmètre</th>
            <th>Opérateur</th>
            <th>Type</th>
            <th>Créé à</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          {orders.length === 0 && (
            <tr>
              <td colSpan={5} className={styles.empty}>
                Aucun ordre en attente
              </td>
            </tr>
          )}
          {orders.slice(0, 5).map((order) => (
            <tr key={order.id}>
              <td className={styles.serial}>
                {order.parkmeterSerial || order.parkmeterId?.toString().slice(0, 8)}
              </td>
              <td>{order.operatorName || "—"}</td>
              <td>
                <span className={styles.typeChip}>
                  {TYPE_LABELS[order.type] || order.type}
                </span>
              </td>
              <td className={styles.time}>
                {new Date(order.createdAt).toLocaleTimeString("fr-FR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td>
                <span
                  className={styles.statusBadge}
                  style={{
                    background:
                      INTERVENTION_STATUS_COLORS[order.status] + "22",
                    color: INTERVENTION_STATUS_COLORS[order.status],
                  }}
                >
                  {INTERVENTION_STATUS_LABELS[order.status] || order.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}