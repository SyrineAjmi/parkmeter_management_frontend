export function toUTC(iso) {
  if (!iso) return null;
  return iso.endsWith("Z") ? iso : iso + "Z";
}

export function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(toUTC(iso)).toLocaleString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatDate(iso) {
  if (!iso) return "—";
  return new Date(toUTC(iso)).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

export function formatTime(iso) {
  if (!iso) return "—";
  return new Date(toUTC(iso)).toLocaleTimeString("fr-FR", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function timeAgo(timestamp) {
  if (!timestamp) return "";
  const diff = Math.floor((Date.now() - new Date(toUTC(timestamp))) / 1000);
  if (diff < 0) return "à l'instant";
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}j`;
}