import { createContext, useContext, useState, useCallback } from "react";
import { useSignalR } from "../hooks/useSignalR";
import { ALERT_TYPE_LABELS, ALERT_PRIORITY_LABELS } from "../constants/alertTypes";
import { METER_STATUS_LABELS } from "../constants/meterStatus";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const role = user?.role;
  const notifKey = `parkmeter_notifications_${user?.userId}`;
  const unreadKey = `parkmeter_unread_${user?.userId}`;

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(notifKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unreadCount, setUnreadCount] = useState(() => {
    try {
      const saved = localStorage.getItem(unreadKey);
      return saved ? parseInt(saved) : 0;
    } catch {
      return 0;
    }
  });

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => {
      const updated = [notif, ...prev].slice(0, 50);
      localStorage.setItem(notifKey, JSON.stringify(updated));
      return updated;
    });
    setUnreadCount((prev) => {
      const updated = prev + 1;
      localStorage.setItem(unreadKey, String(updated));
      return updated;
    });
  }, [notifKey, unreadKey]);

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    localStorage.setItem(unreadKey, "0");
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      localStorage.setItem(notifKey, JSON.stringify(updated));
      return updated;
    });
  }, [notifKey, unreadKey]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.setItem(notifKey, "[]");
    localStorage.setItem(unreadKey, "0");
  }, [notifKey, unreadKey]);

  useSignalR({
    NewAlert: (data) => {
      if (role !== "SUPERVISEUR" && role !== "GESTIONNAIRE_SYSTEME") return;
      addNotification({
        id: crypto.randomUUID(),
        type: "alert",
        title: "Nouvelle alerte",
        message: `[${data.serialNumber}] ${ALERT_TYPE_LABELS[data.alertType] || data.alertType} — ${ALERT_PRIORITY_LABELS[data.priority] || data.priority}`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#ef4444",
      });
    },

    AlertResolved: (data) => {
      if (role !== "SUPERVISEUR" && role !== "GESTIONNAIRE_SYSTEME") return;
      addNotification({
        id: crypto.randomUUID(),
        type: "resolved",
        title: "Alerte résolue",
        message: `[${data.serialNumber}] Alerte résolue`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#22c55e",
      });
    },

    StatusChanged: (data) => {
      if (role !== "GESTIONNAIRE_SYSTEME" && role !== "SUPERVISEUR" && role !== "AGENT_INSTALLATION") return;
      addNotification({
        id: crypto.randomUUID(),
        type: "status",
        title: "Statut modifié",
        message: `[${data.serialNumber}] → ${METER_STATUS_LABELS[data.status] || data.status}`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#0e64c8",
      });
    },

    ParkmeterOnline: (data) => {
      if (role !== "GESTIONNAIRE_SYSTEME" && role !== "SUPERVISEUR" && role !== "AGENT_INSTALLATION") return;
      addNotification({
        id: crypto.randomUUID(),
        type: "online",
        title: "Parcmètre en ligne",
        message: `[${data.serialNumber}] connecté`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#22c55e",
      });
    },

    InterventionOrderCreated: (data) => {
      if (role !== "SUPERVISEUR" && role !== "OPERATEUR") return;
      addNotification({
        id: crypto.randomUUID(),
        type: "order",
        title: "Nouvel ordre d'intervention",
        message: `[${data.serialNumber}] Ordre créé`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#f59e0b",
      });
    },

    InterventionOrderCompleted: (data) => {
      if (role !== "SUPERVISEUR" && role !== "OPERATEUR") return;
      addNotification({
        id: crypto.randomUUID(),
        type: "order_done",
        title: "Intervention terminée",
        message: `[${data.serialNumber}] Intervention terminée`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#22c55e",
      });
    },

    SessionClosed: (data) => {
      if (role !== "RESPONSABLE_FINANCIER") return;
      addNotification({
        id: crypto.randomUUID(),
        type: "session",
        title: "Session clôturée",
        message: `[${data.serialNumber}] ${data.totalAmount?.toFixed(3)} DT — ${data.totalTransactions} tx`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#7c3aed",
      });
    },
  });

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAllRead, clearAll }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}