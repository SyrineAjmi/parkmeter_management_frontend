import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import RoleProtectedRoute from "./components/layout/RoleProtectedRoute";
import LoginPage from "./pages/login/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import SitesPage from "./pages/sites/SitesPage";
import UsersPage from "./pages/users/UsersPage";
import ParkmetersPage from "./pages/parkmeters/ParkmetersPage";
import AlertsPage from "./pages/alerts/AlertsPage";
import InterventionOrdersPage from "./pages/intervention-orders/InterventionOrdersPage";
import SessionsPage from "./pages/sessions/SessionsPage";
import TransactionsPage from "./pages/transactions/TransactionsPage";
import ParkmeterDetailPage from "./pages/parkmeters/ParkmeterDetailPage";
import SettingsPage from "./pages/settings/SettingsPage";
import AiReportPage from "./pages/ai/AiReportPage";


const ComingSoon = ({ page }) => (
    <div style={{ padding: 32, fontFamily: "sans-serif", color: "#6b7280" }}>
        <h2>{page} — coming soon</h2>
    </div>
);

function AppRoutes() {
    return (
        <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route path="/dashboard" element={
                <RoleProtectedRoute path="/dashboard">
                    <DashboardPage />
                </RoleProtectedRoute>
            } />
            <Route path="/parkmeters" element={
                <RoleProtectedRoute path="/parkmeters">
                    <ParkmetersPage />
                </RoleProtectedRoute>
            } />
            <Route path="/parkmeters/:id" element={
                <RoleProtectedRoute path="/parkmeters">
                    <ParkmeterDetailPage />
                </RoleProtectedRoute>
            } />
            <Route path="/sites" element={
                <RoleProtectedRoute path="/sites">
                    <SitesPage />
                </RoleProtectedRoute>
            } />
            <Route path="/alerts" element={
                <RoleProtectedRoute path="/alerts">
                    <AlertsPage />
                </RoleProtectedRoute>
            } />
            <Route path="/sessions" element={
                <RoleProtectedRoute path="/sessions">
                    <SessionsPage />
                </RoleProtectedRoute>
            } />
            <Route path="/transactions" element={
                <RoleProtectedRoute path="/transactions">
                    <TransactionsPage />
                </RoleProtectedRoute>
            } />
            <Route path="/intervention-orders" element={
                <RoleProtectedRoute path="/intervention-orders">
                    <InterventionOrdersPage />
                </RoleProtectedRoute>
            } />

            <Route path="/users" element={
                <RoleProtectedRoute path="/users">
                    <UsersPage />
                </RoleProtectedRoute>
            } />

            <Route path="/settings" element={
                <RoleProtectedRoute path="/settings">
                    <SettingsPage />
                </RoleProtectedRoute>
            } />

            <Route path="/ai-report" element={
                <RoleProtectedRoute path="/ai-report">
                    <AiReportPage />
                </RoleProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <NotificationProviderWrapper />
            </BrowserRouter>
        </AuthProvider>
    );
}

function NotificationProviderWrapper() {
    const { isAuthenticated } = useAuth();

    // Only start SignalR connection when logged in
    if (!isAuthenticated) {
        return (
            <Routes>
                <Route path="*" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
            </Routes>
        );
    }
    return (
        <NotificationProvider>
            <AppRoutes />
        </NotificationProvider>
    );
}