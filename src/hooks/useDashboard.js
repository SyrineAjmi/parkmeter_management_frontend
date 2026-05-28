import { useState, useEffect, useCallback } from "react";
import {
  fetchOverview,
  fetchAlertsSummary,
  fetchRevenueBySite,
  fetchAllParkmeters,
  fetchPendingOrders,
  fetchRevenueSummary,
  fetchRevenueByParkmeter,
  fetchAllSites
} from "../api/dashboard.api";
import { useSignalR } from "./useSignalR";


export function useDashboard(role) {
  const [overview, setOverview] = useState(null);
  const [alertsSummary, setAlertsSummary] = useState(null);
  const [revenueBySite, setRevenueBySite] = useState([]);
  const [revenueSummary, setRevenueSummary] = useState(null);
  const [revenueByParkmeter, setRevenueByParkmeter] = useState([]);
  const [parkmeters, setParkmeters] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sites, setSites] = useState([]);

  // ── individual refresh functions ──────────────────────────

  const refreshOverview = useCallback(async () => {
    try {
      const ov = await fetchOverview();
      setOverview(ov);
    } catch (err) {
      console.warn("refreshOverview failed:", err.message);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    try {
      const al = await fetchAlertsSummary();
      setAlertsSummary(al);
    } catch (err) {
      console.warn("refreshAlerts failed:", err.message);
    }
  }, []);

  const refreshParkmeters = useCallback(async () => {
    try {
      const pm = await fetchAllParkmeters();
      setParkmeters(pm);
    } catch (err) {
      console.warn("refreshParkmeters failed:", err.message);
    }
  }, []);

  const refreshOrders = useCallback(async () => {
    try {
      const ord = await fetchPendingOrders();
      setOrders(ord);
    } catch (err) {
      console.warn("refreshOrders failed:", err.message);
    }
  }, []);

  const refreshRevenue = useCallback(async () => {
    try {
      const [rev, summary, byPm] = await Promise.all([
        fetchRevenueBySite(),
        fetchRevenueSummary(),
        fetchRevenueByParkmeter(),
      ]);
      setRevenueBySite(rev);
      setRevenueSummary(summary);
      setRevenueByParkmeter(byPm);
    } catch (err) {
      console.warn("refreshRevenue failed:", err.message);
    }
  }, []);

  // ── initial load ──────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const pm = await fetchAllParkmeters();
      setParkmeters(pm);

      if (role === "GESTIONNAIRE_SYSTEME") {
        const [ov, rev, sts] = await Promise.all([
          fetchOverview(),
          fetchRevenueBySite(),
          fetchAllSites(),         
        ]);
        setOverview(ov);
        setRevenueBySite(rev);
        setSites(sts);         
      }

      if (role === "SUPERVISEUR") {
        const [ov, al, ord, sts] = await Promise.all([
          fetchOverview(),
          fetchAlertsSummary(),
          fetchPendingOrders(),
          fetchAllSites(),        

        ]);
        setOverview(ov);
        setAlertsSummary(al);
        setOrders(ord);
        setSites(sts);           

      }

      if (role === "RESPONSABLE_FINANCIER") {
        const [rev, summary, byPm] = await Promise.all([
          fetchRevenueBySite(),
          fetchRevenueSummary(),
          fetchRevenueByParkmeter(),
        ]);
        setRevenueBySite(rev);
        setRevenueSummary(summary);
        setRevenueByParkmeter(byPm);
      }
      

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // ── SignalR live updates ───────────────────────────────────

  useSignalR({
    NewAlert: useCallback(() => {
      if (role === "GESTIONNAIRE_SYSTEME" || role === "SUPERVISEUR") {
        refreshOverview();
        refreshAlerts();
      }
    }, [role, refreshOverview, refreshAlerts]),

    AlertResolved: useCallback(() => {
      if (role === "GESTIONNAIRE_SYSTEME" || role === "SUPERVISEUR") {
        refreshOverview();
        refreshAlerts();
      }
    }, [role, refreshOverview, refreshAlerts]),

    StatusChanged: useCallback(() => {
      refreshParkmeters();
      if (role === "GESTIONNAIRE_SYSTEME" || role === "SUPERVISEUR") {
        refreshOverview();
      }
    }, [role, refreshParkmeters, refreshOverview]),

    ParkmeterOnline: useCallback(() => {
      refreshParkmeters();
      if (role === "GESTIONNAIRE_SYSTEME" || role === "SUPERVISEUR") {
        refreshOverview();
      }
    }, [role, refreshParkmeters, refreshOverview]),

    InterventionOrderCreated: useCallback(() => {
      if (role === "SUPERVISEUR") {
        refreshOrders();
      }
      if (role === "GESTIONNAIRE_SYSTEME" || role === "SUPERVISEUR") {
        refreshOverview();
      }
    }, [role, refreshOrders, refreshOverview]),

    InterventionOrderCompleted: useCallback(() => {
      if (role === "SUPERVISEUR") {
        refreshOrders();
      }
      if (role === "GESTIONNAIRE_SYSTEME" || role === "SUPERVISEUR") {
        refreshOverview();
      }
    }, [role, refreshOrders, refreshOverview]),


    // fixed: use cashAmount not cashLevel/paperLevel
    Telemetry: useCallback((data) => {
      setParkmeters((prev) =>
        prev.map((pm) =>
          pm.id === data.parkmeterID
            ? { ...pm, cashAmount: data.cashAmount }
            : pm
        )
      );
    }, []),

    NewTransaction: useCallback(() => {
      if (
        role === "GESTIONNAIRE_SYSTEME" ||
        role === "RESPONSABLE_FINANCIER"
      ) {
        refreshRevenue();
      }
    }, [role, refreshRevenue]),

    SessionClosed: useCallback(() => {
      if (
        role === "GESTIONNAIRE_SYSTEME" ||
        role === "RESPONSABLE_FINANCIER"
      ) {
        refreshRevenue();
      }
    }, [role, refreshRevenue]),
  });

  return {
    overview,
    alertsSummary,
    revenueBySite,
    revenueSummary,
    revenueByParkmeter,
    parkmeters,
    orders,
    loading,
    error,   
    sites
  };
}