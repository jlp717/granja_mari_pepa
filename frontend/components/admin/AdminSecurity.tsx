"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  KeyRound,
  LifeBuoy,
  MonitorSmartphone,
  RefreshCw,
  ShieldCheck,
  Wifi,
} from "lucide-react";
import {
  fetchSessions,
  revokeOtherSessionsRequest,
  revokeSessionRequest,
  type AdminSession,
} from "./admin-data";
import { gmailCompose } from "@/components/editorial/facts";
import styles from "./admin.module.css";

function deviceLabel(userAgent: string) {
  const value = userAgent.toLowerCase();
  if (/iphone|ipad|ios/.test(value)) return "iPhone / iPad";
  if (/android/.test(value)) return "Android";
  if (/windows/.test(value)) return "Windows";
  if (/mac os|macintosh/.test(value)) return "macOS";
  if (/linux/.test(value)) return "Linux";
  return "Navegador";
}

function formatDate(value: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AdminSecurity({
  onNotify,
}: {
  onNotify: (message: string) => void;
}) {
  const [sessions, setSessions] = useState<AdminSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setSessions(await fetchSessions());
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "No se pudieron leer las sesiones.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!confirming) return;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);

  const revoke = async (session: AdminSession) => {
    if (session.current) return;
    setBusy(true);
    try {
      await revokeSessionRequest(session);
      await load();
      onNotify("Sesión revocada");
    } catch (failure) {
      onNotify(
        failure instanceof Error ? failure.message : "No se pudo revocar la sesión",
      );
    } finally {
      setBusy(false);
    }
  };

  const revokeOthers = async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setConfirming(false);
    setBusy(true);
    try {
      await revokeOtherSessionsRequest();
      await load();
      onNotify("Se han cerrado las demás sesiones");
    } catch (failure) {
      onNotify(
        failure instanceof Error
          ? failure.message
          : "No se pudieron cerrar las otras sesiones",
      );
    } finally {
      setBusy(false);
    }
  };

  const current = sessions.find((session) => session.current);
  const activeCount = sessions.length;

  return (
    <div className={styles.security}>
      <header className={styles.pageHead}>
        <div>
          <span className={styles.kicker}>Seguridad</span>
          <h1 className={styles.pageTitle}>Sesiones y acceso.</h1>
          <p className={styles.pageDesc}>
            Controla desde dónde se ha entrado al panel, cuánto dura el acceso y
            qué hacer si algo falla. Las sesiones caducan solas a las 8 horas.
          </p>
        </div>
      </header>

      <div className={styles.securityStats}>
        <article>
          <MonitorSmartphone size={16} aria-hidden="true" />
          <b>{loading ? "—" : activeCount}</b>
          <span>sesiones activas</span>
        </article>
        <article>
          <Clock size={16} aria-hidden="true" />
          <b>8 h</b>
          <span>duración máxima</span>
        </article>
        <article>
          <ShieldCheck size={16} aria-hidden="true" />
          <b>httpOnly</b>
          <span>cookie SameSite=Strict</span>
        </article>
        <article>
          <KeyRound size={16} aria-hidden="true" />
          <b>SHA-256</b>
          <span>token guardado con hash</span>
        </article>
      </div>

      <section className={styles.securityPanel}>
        <div className={styles.panelHead}>
          <div>
            <span className={styles.panelKicker}>Accesos</span>
            <h2>Sesiones abiertas</h2>
          </div>
          <div className={styles.securityActions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => void load()}
              disabled={loading || busy}
            >
              <RefreshCw size={14} aria-hidden="true" /> Actualizar
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => void revokeOthers()}
              disabled={busy || activeCount <= 1}
            >
              {confirming ? "Confirmar cierre" : "Cerrar las demás"}
            </button>
          </div>
        </div>

        {error ? (
          <div className={styles.securityError} role="alert">
            <AlertTriangle size={15} aria-hidden="true" /> {error}
          </div>
        ) : null}

        {loading ? (
          <p className={styles.securityEmpty}>Leyendo sesiones…</p>
        ) : sessions.length === 0 ? (
          <p className={styles.securityEmpty}>No hay sesiones activas.</p>
        ) : (
          <ul className={styles.sessionList}>
            {sessions.map((session) => (
              <li key={session.token} className={session.current ? styles.sessionCurrent : undefined}>
                <span className={styles.sessionIcon}>
                  <MonitorSmartphone size={16} aria-hidden="true" />
                </span>
                <span className={styles.sessionMain}>
                  <b>
                    {deviceLabel(session.userAgent)}
                    {session.current ? <em>Esta sesión</em> : null}
                  </b>
                  <small>
                    {session.name} · {session.email}
                  </small>
                </span>
                <span className={styles.sessionMeta}>
                  <span>{session.ip || "IP interna"}</span>
                  <span>
                    Entró {formatDate(session.createdAt)} · caduca{" "}
                    {formatDate(session.expiresAt)}
                  </span>
                </span>
                <button
                  type="button"
                  className={styles.sessionRevoke}
                  onClick={() => void revoke(session)}
                  disabled={session.current || busy}
                >
                  {session.current ? "Actual" : "Revocar"}
                </button>
              </li>
            ))}
          </ul>
        )}

        {current ? (
          <p className={styles.securityHint}>
            <CheckCircle2 size={13} aria-hidden="true" /> Tu sesión actual está
            protegida. Si cambias la contraseña, se mantiene esta sesión y se
            revocan las demás.
          </p>
        ) : null}
      </section>

      <section className={styles.supportCard}>
        <div className={styles.supportIcon}>
          <LifeBuoy size={20} aria-hidden="true" />
        </div>
        <div>
          <span className={styles.panelKicker}>Si algo falla</span>
          <h2>Qué hacer antes de llamar.</h2>
          <ol className={styles.supportSteps}>
            <li>Comprueba que la VPN corporativa sigue conectada.</li>
            <li>Recarga el panel y vuelve a iniciar sesión.</li>
            <li>
              Si el error es de red, no insistas: el acceso solo funciona desde
              la red interna o la VPN.
            </li>
            <li>
              Si el error continúa, escribe a{" "}
              <a
                href={gmailCompose(
                  "javier@mari-pepa.com",
                  "Incidencia en el panel de administración",
                )}
                target="_blank"
                rel="noopener noreferrer"
              >
                javier@mari-pepa.com
              </a>{" "}
              con la hora, la pantalla y el mensaje exacto.
            </li>
          </ol>
          <div className={styles.errorCodes}>
            <span><b>NETWORK_NOT_ALLOWED</b> · VPN o red interna</span>
            <span><b>SESSION_REQUIRED</b> · vuelve a entrar</span>
            <span><b>LOGIN_LOCKED</b> · espera 15 minutos</span>
          </div>
        </div>
        <Wifi size={18} aria-hidden="true" className={styles.supportWifi} />
      </section>
    </div>
  );
}
