import { useEffect, useRef } from "react";
import * as signalR from "@microsoft/signalr";

// const HUB_URL = "https://localhost:7016/hubs/parkmeter";

const HUB_URL =`${process.env.REACT_APP_SIGNALR_URL}/hubs/parkmeter`;

export function useSignalR(handlers = {}) {
  const connectionRef = useRef(null);
  const handlersRef = useRef(handlers);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    const user = JSON.parse(
      localStorage.getItem("parkmeter_user") || "{}"
    );

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(HUB_URL, {
        accessTokenFactory: () => {
          const u = JSON.parse(
            localStorage.getItem("parkmeter_user") || "{}"
          );
          return u.token || "";
        },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 15000, 30000])
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    const events = [
      "NewAlert",
      "AlertResolved",
      "StatusChanged",
      "ParkmeterOnline", 
      "NewTransaction",
      "SessionClosed",
      "InterventionOrderCreated",
      "InterventionOrderCompleted",
      "Telemetry"
    ];

    events.forEach((event) => {
      connection.on(event, (data) => {
        const handler = handlersRef.current[event];
        if (handler) handler(data);
      });
    });

    // retry initial connection with backoff
    let retryTimeout;
    async function startWithRetry() {
      try {
        await connection.start();
        console.log("✅ SignalR connected");
      } catch {
        console.warn("SignalR initial connection failed — retrying in 5s");
        retryTimeout = setTimeout(startWithRetry, 5000);
      }
    }

    startWithRetry();
    connectionRef.current = connection;

    return () => {
      clearTimeout(retryTimeout);
      connection.stop();
    };
  }, []);

  return connectionRef;
}