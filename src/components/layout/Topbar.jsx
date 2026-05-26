import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useNotifications } from "../../context/NotificationContext";
import styles from "./Topbar.module.css";

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

const ROLE_LABELS = {
  GESTIONNAIRE_SYSTEME: "Gestionnaire système",
  SUPERVISEUR: "Superviseur",
  RESPONSABLE_FINANCIER: "Responsable financier",
  AGENT_INSTALLATION: "Agent d'installation",
  OPERATEUR: "Opérateur",
};

const TYPE_ICONS = {
  alert:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  resolved:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  status:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>,
  online:     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="18" rx="2"/><path d="M8 3v18M16 3v18M2 12h20"/></svg>,
  order:      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  order_done: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>,
  session:    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

function timeAgo(timestamp) {
  const diff = Math.floor((Date.now() - new Date(timestamp)) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}

export default function Topbar() {
  const { user } = useAuth();
  const { notifications, unreadCount, markAllRead, clearAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleBellClick() {
    setOpen((v) => !v);
    if (!open) markAllRead();
  }

  return (
    <header className={styles.topbar}>

      {/* ── Left: greeting ── */}
      <div className={styles.left}>
        <span className={styles.greeting}>
          {getGreeting()}, <strong>{user?.name || "Utilisateur"}</strong>
        </span>
        <span className={styles.role}>
          {ROLE_LABELS[user?.role] || user?.role}
        </span>
      </div>

      {/* ── Right: bell + user ── */}
      <div className={styles.right}>

        {/* Bell */}
        <div className={styles.bellWrapper} ref={panelRef}>
          <button className={styles.bellBtn} onClick={handleBellClick}>
            <BellIcon />
            {unreadCount > 0 && (
              <span className={styles.badge}>
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>

          {open && (
            <div className={styles.panel}>
              <div className={styles.panelHeader}>
                <span className={styles.panelTitle}>Notifications</span>
                <button className={styles.clearBtn} onClick={clearAll}>
                  Tout effacer
                </button>
              </div>
              <div className={styles.panelList}>
                {notifications.length === 0 && (
                  <div className={styles.empty}>Aucune notification</div>
                )}
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`${styles.notifRow} ${!notif.read ? styles.unread : ""}`}
                    style={{ borderLeftColor: notif.color }}
                  >
                    <span className={styles.notifIcon} style={{ color: notif.color }}>
                      {TYPE_ICONS[notif.type] || (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                        </svg>
                      )}
                    </span>
                    <div className={styles.notifContent}>
                      <span className={styles.notifTitle}>{notif.title}</span>
                      <span className={styles.notifMessage}>{notif.message}</span>
                    </div>
                    <span className={styles.notifTime}>{timeAgo(notif.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Avatar only — name/role moved to left */}
        <div className={styles.avatar}>
          {(user?.name || "U").charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}