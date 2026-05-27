import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSignalR } from "../hooks/useSignalR";
import { ALERT_TYPE_LABELS, ALERT_PRIORITY_LABELS, INTERVENTION_TYPE_LABELS } from "../constants/alertTypes";
import { METER_STATUS_LABELS } from "../constants/meterStatus";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const role = user?.role;
  const notifKey = `parkmeter_notifications_${user?.userId}`;
  const unreadKey = `parkmeter_unread_${user?.userId}`;


  const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

  useEffect(() => {
    if (!user?.token) return;

    fetch(`${BASE_URL}/notifications/history`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((history) => {
        console.log("History IDs:", history.map(h => String(h.id)));
        setNotifications((prev) => {
          console.log("Existing IDs:", prev.map(n => String(n.id)));
          const existingIds = new Set(prev.map((n) => String(n.id)));
          const newOnes = history.filter((h) => !existingIds.has(String(h.id)));
          console.log("New ones:", newOnes.length);
          if (newOnes.length === 0) return prev;
          const merged = [...prev, ...newOnes]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 50);
          localStorage.setItem(notifKey, JSON.stringify(merged));

          const newUnread = newOnes.filter(n => !n.read).length;
          if (newUnread > 0) {
            setUnreadCount((prev) => {
              const updated = prev + newUnread;
              localStorage.setItem(unreadKey, String(updated));
              return updated;
            });
          }

          return merged;
        });
      })
      .catch(() => { });
  }, [user?.token]);
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
        message: `[${data.serialNumber}] → ${METER_STATUS_LABELS[data.status] || data.status}`,
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
        message: `[${data.serialNumber}] ${INTERVENTION_TYPE_LABELS[data.interventionType] || data.interventionType}`,        parkmeterID: data.parkmeterID,
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