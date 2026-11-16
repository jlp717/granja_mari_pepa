"use client";

import { useEffect, useState } from "react";

const CHECK_INTERVAL_MS = 15000;
const REQUEST_TIMEOUT_MS = 2000;

/**
 * The panel is only served from the internal network. If the VPN drops, every
 * request to the API stops working, so the UI must stop showing data at once
 * instead of waiting for the next manual action. Two consecutive failures
 * (network error, timeout or 403) lock the screen until the VPN is back.
 */
export function AdminVpnGuard() {
  const [lost, setLost] = useState(false);

  useEffect(() => {
    let failures = 0;
    let stopped = false;

    const check = async () => {
      if (stopped) return;
      const controller = new AbortController();
      const timer = window.setTimeout(
        () => controller.abort(),
        REQUEST_TIMEOUT_MS,
      );
      try {
        const response = await fetch("/api/admin/session", {
          cache: "no-store",
          credentials: "same-origin",
          signal: controller.signal,
        });
        if (response.status === 403) throw new Error("network");
        failures = 0;
        setLost(false);
      } catch {
        failures += 1;
        if (failures >= 2) setLost(true);
      } finally {
        window.clearTimeout(timer);
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };

    const interval = window.setInterval(() => void check(), CHECK_INTERVAL_MS);
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("online", onVisible);
    window.addEventListener("offline", onVisible);
    window.addEventListener("pageshow", onVisible);
    void check();

    return () => {
      stopped = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("online", onVisible);
      window.removeEventListener("offline", onVisible);
      window.removeEventListener("pageshow", onVisible);
    };
  }, []);

  if (!lost) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="vpn-lost-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2147483647,
        display: "grid",
        placeItems: "center",
        background: "#05070a",
        color: "#dfe7e0",
        padding: 24,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Helvetica Neue", sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: 460,
          border: "1px solid rgba(223,231,224,.16)",
          background: "#070b0e",
          padding: 32,
        }}
      >
        <p
          style={{
            margin: "0 0 14px",
            fontSize: 9,
            letterSpacing: ".24em",
            textTransform: "uppercase",
            color: "#78837c",
          }}
        >
          Granja Maripepa · Administración
        </p>
        <h1
          id="vpn-lost-title"
          style={{ margin: "0 0 12px", fontSize: 28, fontWeight: 300 }}
        >
          Conexión interna perdida
        </h1>
        <p style={{ margin: "0 0 10px", fontSize: 13, lineHeight: 1.65 }}>
          La VPN se ha desconectado o la red interna no responde. El panel queda
          bloqueado hasta recuperar la conexión.
        </p>
        <p style={{ margin: "0 0 20px", fontSize: 13, lineHeight: 1.65 }}>
          Vuelve a conectar la VPN y pulsa Reintentar.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "10px 18px",
            border: "1px solid rgba(223,231,224,.3)",
            background: "transparent",
            color: "#dfe7e0",
            fontSize: 11,
            letterSpacing: ".14em",
            textTransform: "uppercase",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
