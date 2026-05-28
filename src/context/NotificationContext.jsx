import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSignalR } from "../hooks/useSignalR";
import { ALERT_TYPE_LABELS, ALERT_PRIORITY_LABELS, INTERVENTION_TYPE_LABELS } from "../constants/alertTypes";
import { METER_STATUS_LABELS } from "../constants/meterStatus";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  function getColorByType(type) {
    const colors = {
      ALERT: "#ef4444",
      ORDRE: "#f59e0b",
      SESSION: "#7c3aed",
      STATUS: "#0e64c8",
    };
    return colors[type?.toUpperCase()] || "#6366f1";
  }


  useEffect(() => {
    if (!user?.token) return;
    fetch(`${BASE_URL}/Notifications/unread-count`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(data => setUnreadCount(data.count));
  }, [user?.token]);

  useEffect(() => {
    if (!user?.token) return;
    fetch(`${BASE_URL}/Notifications`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(r => r.json())
      .then(history => {
        const mapped = history.map(h => ({
          ...h,
          timestamp: h.createdAt,
          type: h.type?.toLowerCase() || "alert",
          color: getColorByType(h.type),
          read: h.isRead,
        }));
        setNotifications(mapped);
      })
      .catch(() => { });
  }, [user?.token, BASE_URL]);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => {
      const isDuplicate = prev.some(
        (n) => n.id === notif.id ||
          (n.message === notif.message &&
            Math.abs(new Date(n.timestamp) - new Date(notif.timestamp)) < 2000)
      );
      if (isDuplicate) return prev;
      return [notif, ...prev].slice(0, 50);
    });
    setUnreadCount((prev) => prev + 1);
  }, []);

  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    await fetch(`${BASE_URL}/Notifications/read-all`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${user?.token}` }
    });
  }, [user?.token, BASE_URL]);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  useSignalR({
    NewAlert: (data) => {
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
      addNotification({
        id: crypto.randomUUID(),
        type: "status",
        title: "Statut modifié",
        message: `[${data.serialNumber}] : ${METER_STATUS_LABELS[data.status] || data.status}`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#0e64c8",
      });
    },

    ParkmeterOnline: (data) => {
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
      addNotification({
        id: crypto.randomUUID(),
        type: "order",
        title: "Nouvel ordre d'intervention",
        message: `[${data.serialNumber}] ${INTERVENTION_TYPE_LABELS[data.interventionType] || data.interventionType}`,
        parkmeterID: data.parkmeterID,
        timestamp: data.timestamp || new Date().toISOString(),
        read: false,
        color: "#f59e0b",
      });
    },

    InterventionOrderCompleted: (data) => {
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
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationProvider");
  return ctx;
}