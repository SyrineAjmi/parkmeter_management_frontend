import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useSignalR } from "../hooks/useSignalR";
import { ALERT_TYPE_LABELS, ALERT_PRIORITY_LABELS, INTERVENTION_TYPE_LABELS } from "../constants/alertTypes";
import { METER_STATUS_LABELS } from "../constants/meterStatus";
import { useAuth } from "./AuthContext";

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const notifKey = `parkmeter_notifications_${user?.userId}`;
  const unreadKey = `parkmeter_unread_${user?.userId}`;
  const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

  // Initialize state cleanly as empty
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. Dynamic Watcher: Sync states dynamically from localStorage whenever the User ID changes
  useEffect(() => {
    if (user?.userId) {
      try {
        const savedNotifs = localStorage.getItem(notifKey);
        const savedUnread = localStorage.getItem(unreadKey);
        setNotifications(savedNotifs ? JSON.parse(savedNotifs) : []);
        setUnreadCount(savedUnread ? parseInt(savedUnread, 10) : 0);
      } catch {
        setNotifications([]);
        setUnreadCount(0);
      }
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user?.userId, notifKey, unreadKey]);

  // 2. Fetch history and securely map read flags + fix UTC time zone parsing
  useEffect(() => {
    if (!user?.token || !user?.userId) return;

    fetch(`${BASE_URL}/notifications/history`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
        "Content-Type": "application/json",
      },
    })
      .then((res) => res.json())
      .then((history) => {
        setNotifications((prev) => {
          const existingMap = new Map(prev.map((n) => [String(n.id).toLowerCase(), n]));

          const processedHistory = history.map((h) => {
            const matched = existingMap.get(String(h.id).toLowerCase());
            
            // Timezone Fix: Ensure the string is treated as explicit UTC if it lacks an offset identifier
            let cleanTimestamp = h.timestamp;
            if (cleanTimestamp && !cleanTimestamp.endsWith("Z") && !cleanTimestamp.includes("+")) {
              cleanTimestamp = `${cleanTimestamp}Z`;
            }

            return {
              ...h,
              timestamp: cleanTimestamp,
              // Keep local user's read flag if seen before; otherwise default to API value or false
              read: matched ? matched.read : (h.read !== undefined ? h.read : false),
            };
          });

          const existingIds = new Set(prev.map((n) => String(n.id).toLowerCase()));
          const newOnes = processedHistory.filter((h) => !existingIds.has(String(h.id).toLowerCase()));

          if (newOnes.length === 0 && prev.length === processedHistory.length) return prev;

          const merged = [...prev, ...newOnes]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, 50);

          localStorage.setItem(notifKey, JSON.stringify(merged));

          // Set the unread badge dot count precisely based on genuine unread new additions
          const newUnread = newOnes.filter((n) => !n.read).length;
          if (newUnread > 0) {
            setUnreadCount((prevUnread) => {
              const updated = prevUnread + newUnread;
              localStorage.setItem(unreadKey, String(updated));
              return updated;
            });
          }

          return merged;
        });
      })
      .catch(() => {});
  }, [user?.token, user?.userId, BASE_URL, notifKey, unreadKey]);

  const addNotification = useCallback((notif) => {
    setNotifications((prev) => {
      // De-duplication check
      const isDuplicate = prev.some(
        (n) => n.id === notif.id || (n.message === notif.message && Math.abs(new Date(n.timestamp) - new Date(notif.timestamp)) < 2000)
      );
      if (isDuplicate) return prev;

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