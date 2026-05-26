import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLE_NAV_ACCESS, ROLE_DEFAULT_ROUTES } from "../../constants/roles";

export default function RoleProtectedRoute({ path, children }) {
  const { user, isAuthenticated } = useAuth();

  // Not logged in → go to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if this role can access this path
  const allowedRoutes = ROLE_NAV_ACCESS[user?.role] || [];
  const canAccess = allowedRoutes.includes(path);

  if (!canAccess) {
    // Redirect to their default page
    const defaultRoute = ROLE_DEFAULT_ROUTES[user?.role] || "/login";
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
}