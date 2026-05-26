// const BASE_URL = "https://localhost:7016/api";
const BASE_URL = `${import.meta.env.VITE_API_URL}/api`;

export async function login(email, password) {
  const response = await fetch(`${BASE_URL}/Auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || "Indentifiants Incorrects");
  }

  return response.json(); // { token, role, userId, name }
}
