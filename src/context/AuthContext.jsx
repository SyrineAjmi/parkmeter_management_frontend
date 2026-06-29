import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {

const [user, setUser] = useState(() => {
  try {
    const stored = localStorage.getItem("parkmeter_user");
    if (!stored) return null;
    const userData = JSON.parse(stored);
    // check token expiry
    const decoded = JSON.parse(atob(userData.token.split('.')[1]));
    if (decoded.exp * 1000 < Date.now()) {
      localStorage.removeItem("parkmeter_user");
      return null; 
    }
    return {
      ...userData,
      siteId: decoded.siteId || null,
    };
  } catch {
    return null;
  }
});

const signIn = useCallback((userData) => {
  const decoded = JSON.parse(atob(userData.token.split('.')[1]));
  const enriched = {
    ...userData,
    siteId: decoded.siteId || null,
  };
  localStorage.setItem("parkmeter_user", JSON.stringify(enriched));
  setUser(enriched);
}, []);

  const signOut = useCallback(() => {
    const stored = localStorage.getItem("parkmeter_user");
    if (stored) {
      const userData = JSON.parse(stored);
    }
    localStorage.removeItem("parkmeter_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}