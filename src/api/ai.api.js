const BASE_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  const user = JSON.parse(localStorage.getItem("parkmeter_user") || "{}");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${user.token || ""}`,
  };
}

export async function generateAiReport(month, year) {
  const res = await fetch(`${BASE_URL}/api/Ai/financial-report`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ month, year }),
  });

  if (!res.ok) throw new Error("Erreur génération rapport");

  return res.json();
}