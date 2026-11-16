"use client";
import { useEffect, useRef, useState, type ButtonHTMLAttributes } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import {
  getAnalyticsConsent,
  setAnalyticsConsent,
  subscribeAnalyticsConsent,
  type AnalyticsConsent,
} from "@/lib/analytics";
import { isolateBackground } from "./inert";
const COPY = {
  es: {
    title: "Tu privacidad",
    summary:
      "El almacenamiento necesario mantiene el acceso, el carrito y tus preferencias. La analítica opcional sólo se activa si la aceptas.",
    essential: "Esencial",
    essentialHelp:
      "Siempre activo para las funciones que solicitas y para recordar esta elección.",
    analytics: "Analítica opcional",
    analyticsHelp:
      "Permite medir visitas, interacciones y rendimiento mediante el servicio de la web.",
    accept: "Aceptar analítica",
    reject: "Rechazar analítica",
    configure: "Configurar preferencias",
    save: "Guardar preferencias",
    close: "Cerrar",
    error:
      "No se ha podido guardar en este navegador. Tu elección se aplica en esta pestaña; al volver a abrir la web tendrás que elegir de nuevo.",
    saved: "Preferencias guardadas",
  },
  en: {
    title: "Your privacy",
    summary:
      "Necessary storage supports access, the cart and your preferences. Optional analytics starts only if you accept it.",
    essential: "Essential",
    essentialHelp:
      "Always active for the functions you request and to remember this choice.",
    analytics: "Optional analytics",
    analyticsHelp:
      "Measures visits, interactions and performance through this website’s service.",
    accept: "Accept analytics",
    reject: "Reject analytics",
    configure: "Privacy preferences",
    save: "Save preferences",
    close: "Close",
    error:
      "This browser could not save the choice. It applies in this tab; you will need to choose again when you reopen the website.",
    saved: "Preferences saved",
  },
  de: {
    title: "Deine Privatsphäre",
    summary:
      "Notwendiger Speicher unterstützt Zugang, Warenkorb und Einstellungen. Optionale Analyse beginnt erst nach deiner Zustimmung.",
    essential: "Erforderlich",
    essentialHelp:
      "Immer aktiv für angeforderte Funktionen und um diese Auswahl zu speichern.",
    analytics: "Optionale Analyse",
    analyticsHelp:
      "Misst Besuche, Interaktionen und Leistung über den Dienst dieser Website.",
    accept: "Analyse akzeptieren",
    reject: "Analyse ablehnen",
    configure: "Datenschutzeinstellungen",
    save: "Einstellungen speichern",
    close: "Schließen",
    error:
      "Die Auswahl konnte nicht gespeichert werden. Sie gilt in diesem Tab; beim nächsten Öffnen musst du erneut wählen.",
    saved: "Einstellungen gespeichert",
  },
  it: {
    title: "La tua privacy",
    summary:
      "L’archiviazione necessaria supporta accesso, carrello e preferenze. L’analisi facoltativa inizia solo dopo il consenso.",
    essential: "Essenziale",
    essentialHelp:
      "Sempre attiva per le funzioni richieste e per ricordare questa scelta.",
    analytics: "Analisi facoltativa",
    analyticsHelp:
      "Misura visite, interazioni e prestazioni tramite il servizio di questo sito.",
    accept: "Accetta l’analisi",
    reject: "Rifiuta l’analisi",
    configure: "Preferenze privacy",
    save: "Salva preferenze",
    close: "Chiudi",
    error:
      "Il browser non ha salvato la scelta. Vale in questa scheda; alla prossima apertura dovrai scegliere di nuovo.",
    saved: "Preferenze salvate",
  },
  zh: {
    title: "你的隐私",
    summary:
      "必要存储用于登录、购物车和偏好设置。只有在你同意后才会启用可选分析。",
    essential: "必要存储",
    essentialHelp: "始终启用，以提供你请求的功能并记住此选择。",
    analytics: "可选分析",
    analyticsHelp: "通过本站服务衡量访问、交互和性能。",
    accept: "接受分析",
    reject: "拒绝分析",
    configure: "隐私偏好",
    save: "保存偏好",
    close: "关闭",
    error:
      "浏览器无法保存此选择。它仅在当前标签页生效；再次打开网站时需要重新选择。",
    saved: "偏好已保存",
  },
} as const;
function useCopy() {
  const locale = useLocale();
  return COPY[locale as keyof typeof COPY] || COPY.es;
}
export function CookiePreferencesButton({
  children,
  onClick,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const copy = useCopy();
  return (
    <button
      {...props}
      type="button"
      aria-haspopup="dialog"
      data-gmp-cookie-preferences-button
      onClick={(event) => {
        onClick?.(event);
        if (!event.defaultPrevented)
          window.dispatchEvent(
            new CustomEvent("gmp:cookie-preferences", {
              detail: { source: event.currentTarget },
            }),
          );
      }}
    >
      {children || copy.configure}
    </button>
  );
}

export function CookieConsent() {
  const copy = useCopy();
  const [choice, setChoice] = useState<AnalyticsConsent | null | undefined>(
    undefined,
  );
  const [open, setOpen] = useState(false),
    [enabled, setEnabled] = useState(false),
    [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null),
    bannerConfigure = useRef<HTMLButtonElement>(null),
    source = useRef<HTMLElement | null>(null),
    handoff = useRef(false),
    openRef = useRef(false);
  openRef.current = open;
  useEffect(() => {
    setChoice(getAnalyticsConsent());
    return subscribeAnalyticsConsent(setChoice);
  }, []);
  useEffect(() => {
    const show = (event: Event) => {
      source.current =
        (event as CustomEvent<{ source?: HTMLElement }>).detail?.source ||
        (document.activeElement as HTMLElement | null);
      setEnabled(getAnalyticsConsent()?.analytics === true);
      setError("");
      handoff.current = false;
      window.dispatchEvent(
        new CustomEvent("gmp:overlay-open", { detail: { id: "cookies" } }),
      );
      setOpen(true);
    };
    const other = (event: Event) => {
      const id = (event as CustomEvent<{ id?: string }>).detail?.id;
      if (id && id !== "cookies" && openRef.current) {
        handoff.current = true;
        setOpen(false);
      }
    };
    window.addEventListener("gmp:cookie-preferences", show);
    window.addEventListener("gmp:overlay-open", other);
    return () => {
      window.removeEventListener("gmp:cookie-preferences", show);
      window.removeEventListener("gmp:overlay-open", other);
    };
  }, []);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const returnTarget = source.current;
    const release = isolateBackground(
      Array.from(
        document.querySelectorAll<HTMLElement>("[data-gmp-background],#nav"),
      ),
    );
    document.documentElement.classList.add("gmp-cookie-open");
    if (typeof element.showModal === "function") element.showModal();
    else element.setAttribute("open", "");
    element
      .querySelector<HTMLInputElement>("input:not(:disabled)")
      ?.focus({ preventScroll: true });
    return () => {
      release();
      document.documentElement.classList.remove("gmp-cookie-open");
      if (element.open) {
        if (typeof element.close === "function") element.close();
        else element.removeAttribute("open");
      }
      window.dispatchEvent(
        new CustomEvent("gmp:overlay-close", { detail: { id: "cookies" } }),
      );
      const target = returnTarget?.isConnected
        ? returnTarget
        : bannerConfigure.current || document.getElementById("main-content");
      if (!handoff.current) target?.focus({ preventScroll: true });
    };
  }, [open]);
  const choose = (analytics: boolean, fromDialog = false) => {
    const result = setAnalyticsConsent(analytics);
    setChoice(result.choice);
    if (!result.stored) {
      setError(copy.error);
      return;
    }
    setError("");
    if (fromDialog) setOpen(false);
    toast.success(copy.saved);
  };
  const showPreferences = (event: React.MouseEvent<HTMLButtonElement>) =>
    window.dispatchEvent(
      new CustomEvent("gmp:cookie-preferences", {
        detail: { source: event.currentTarget },
      }),
    );
  const trap = (event: React.KeyboardEvent<HTMLDialogElement>) => {
    if (event.key !== "Tab") return;
    const elements = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "button:not(:disabled),input:not(:disabled),a[href]",
      ),
    );
    const first = elements[0],
      last = elements[elements.length - 1];
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };
  return (
    <>
      {!open && choice !== undefined && (choice === null || Boolean(error)) ? (
        <aside
          className="gmp-cookie-banner"
          data-gmp-cookie-banner
          aria-labelledby="gmp-cookie-banner-title"
          data-fx="form-feedback"
        >
          <h2 id="gmp-cookie-banner-title">{copy.title}</h2>
          <p>{copy.summary}</p>
          {error ? <p role="alert">{error}</p> : null}
          <div className="gmp-cookie-actions">
            <button type="button" onClick={() => choose(true)}>
              {copy.accept}
            </button>
            <button type="button" onClick={() => choose(false)}>
              {copy.reject}
            </button>
          </div>
          <button
            ref={bannerConfigure}
            type="button"
            className="gmp-cookie-configure"
            onClick={showPreferences}
          >
            {copy.configure}
          </button>
          {error && choice ? (
            <button
              type="button"
              className="gmp-cookie-configure"
              onClick={() => setError("")}
            >
              {copy.close}
            </button>
          ) : null}
        </aside>
      ) : null}
      <dialog
        ref={dialog}
        className="gmp-cookie-dialog"
        role="dialog"
        aria-modal={open ? true : undefined}
        aria-labelledby="gmp-cookie-title"
        aria-describedby="gmp-cookie-description"
        data-gmp-cookie-preferences
        data-state={open ? "open" : "closed"}
        data-fx="modal-motion form-feedback"
        onCancel={(event) => {
          event.preventDefault();
          setOpen(false);
        }}
        onClose={() => {
          if (!dialog.current?.open) setOpen(false);
        }}
        onKeyDown={trap}
      >
        <div className="gmp-cookie-heading">
          <h2 id="gmp-cookie-title">{copy.title}</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label={copy.close}
          >
            ×
          </button>
        </div>
        <p id="gmp-cookie-description">{copy.summary}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            choose(enabled, true);
          }}
        >
          <label className="gmp-cookie-category">
            <input type="checkbox" checked disabled readOnly />
            <span>
              <strong>{copy.essential}</strong>
              <small>{copy.essentialHelp}</small>
            </span>
          </label>
          <label className="gmp-cookie-category">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(event) => setEnabled(event.currentTarget.checked)}
            />
            <span>
              <strong>{copy.analytics}</strong>
              <small>{copy.analyticsHelp}</small>
            </span>
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <div className="gmp-cookie-actions">
            <button type="submit">{copy.save}</button>
            <button type="button" onClick={() => setOpen(false)}>
              {copy.close}
            </button>
          </div>
        </form>
      </dialog>
    </>
  );
}
