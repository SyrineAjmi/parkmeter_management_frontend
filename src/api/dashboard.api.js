// const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

function authHeaders() {
  const user = JSON.parse(
    localStorage.getItem("parkmeter_user") || "{}"
  );
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

export async function fetchOverview() {
  const res = await fetch(`${BASE_URL}/Stats/overview`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur chargement overview");
  return res.json();
}

export async function fetchAlertsSummary() {
  const res = await fetch(`${BASE_URL}/Stats/alerts`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur chargement alertes");
  return res.json();
}

export async function fetchRevenueBySite(from, to) {
  const params = new URLSearchParams();
  if (from) params.append("from", from);
  if (to) params.append("to", to);
  const res = await fetch(
    `${BASE_URL}/Stats/revenue/sites?${params}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Erreur chargement revenus");
  return res.json();
}

export async function fetchAllParkmeters() {
  const res = await fetch(`${BASE_URL}/Parkmeters`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur chargement parkmètres");
  return res.json();
}

export async function fetchPendingOrders() {
  const res = await fetch(`${BASE_URL}/InterventionOrders/pending`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur chargement ordres");
  return res.json();
}

export async function fetchAllSites() {
  const res = await fetch(`${BASE_URL}/Sites`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur chargement sites");
  return res.json();
}

// for fin 
export async function fetchRevenueSummary() {
  const res = await fetch(`${BASE_URL}/Stats/revenue`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur chargement résumé revenus");
  return res.json();
}

export async function fetchRevenueByParkmeter() {
  const res = await fetch(`${BASE_URL}/Stats/revenue/parkmeters`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error("Erreur chargement revenus parcmètres");
  return res.json();
}