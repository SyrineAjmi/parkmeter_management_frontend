import { useState } from "react";
import { login } from "../api/auth.api";
import { useAuth } from "../context/AuthContext";
import { ROLE_DEFAULT_ROUTES } from "../constants/roles";
import { decodeToken } from "../utils/jwtDecode";

export function useLogin() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(email, password, navigate) {
    setLoading(true);
    setError(null);
    try {
      const data = await login(email, password);
      const decoded = decodeToken(data.token);

      signIn({
        token: data.token,
        role: decoded.role,
        name: decoded.name,
        email: decoded.email,
        userId: decoded.userId,
      });

      const redirect = ROLE_DEFAULT_ROUTES[decoded.role] || "/dashboard";
      navigate(redirect);
    } catch (err) {
      setError(err.message || "Identifiants incorrects. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  }

  return { handleLogin, loading, error };
}