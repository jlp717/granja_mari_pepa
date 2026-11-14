/** Optional analytics. No identifier, observer, timer or request before consent. */
export interface AnalyticsConsent {
  version: 1;
  analytics: boolean;
  updatedAt: string;
}
export const ANALYTICS_CONSENT_KEY = "gmp-kage-consent-v1";
const CONSENT_EVENT = "kage:consent-change";
let consent: AnalyticsConsent | null | undefined;
function parseConsent(raw: string | null): AnalyticsConsent | null {
  if (!raw) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== "object" || value === null) return null;
    const item = value as Record<string, unknown>;
    return item.version === 1 &&
      typeof item.analytics === "boolean" &&
      typeof item.updatedAt === "string" &&
      Number.isFinite(Date.parse(item.updatedAt))
      ? { version: 1, analytics: item.analytics, updatedAt: item.updatedAt }
      : null;
  } catch {
    return null;
  }
}
export function getAnalyticsConsent(): AnalyticsConsent | null {
  if (typeof window === "undefined") return null;
  if (consent === undefined) {
    try {
      consent = parseConsent(localStorage.getItem(ANALYTICS_CONSENT_KEY));
    } catch {
      consent = null;
    }
  }
  return consent;
}
export function hasAnalyticsConsent(): boolean {
  return (
    typeof window !== "undefined" && getAnalyticsConsent()?.analytics === true
  );
}
export function setAnalyticsConsent(analytics: boolean): {
  stored: boolean;
  choice: AnalyticsConsent;
} {
  const choice: AnalyticsConsent = {
    version: 1,
    analytics,
    updatedAt: new Date().toISOString(),
  };
  consent = choice;
  let stored = false;
  try {
    localStorage.setItem(ANALYTICS_CONSENT_KEY, JSON.stringify(choice));
    stored = true;
  } catch {
    /* Current-tab choice remains explicit; UI reports persistence failure. */
  }
  if (!analytics) {
    stopAnalytics();
    try {
      sessionStorage.removeItem("analytics_session_id");
    } catch {
      /* Storage can be unavailable. */
    }
  }
  if (typeof window !== "undefined")
    window.dispatchEvent(new Event(CONSENT_EVENT));
  return { stored, choice };
}
export function subscribeAnalyticsConsent(
  listener: (choice: AnalyticsConsent | null) => void,
): () => void {
  if (typeof window === "undefined") return () => {};
  const change = () => listener(getAnalyticsConsent());
  const storage = (event: StorageEvent) => {
    if (event.key !== ANALYTICS_CONSENT_KEY && event.key !== null) return;
    consent = undefined;
    if (!hasAnalyticsConsent()) stopAnalytics();
    change();
  };
  window.addEventListener(CONSENT_EVENT, change);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, change);
    window.removeEventListener("storage", storage);
  };
}

export type EventCategory =
  | "navigation" // Navegación entre páginas
  | "interaction" // Clics, formularios, etc.
  | "conversion" // Acciones de valor (descarga, pedido, etc.)
  | "error" // Errores capturados
  | "performance" // Métricas de rendimiento
  | "engagement" // Tiempo en página, scroll, etc.
  | "chatbot" // Interacciones con el chatbot
  | "auth" // Login, logout, etc.
  | "factura" // Acciones con facturas
  | "pedido"; // Acciones con pedidos

export interface AnalyticsEvent {
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  metadata?: Record<string, unknown>;
  timestamp?: string;
  sessionId?: string;
  userId?: string;
}

export interface PerformanceMetrics {
  pageLoadTime?: number;
  firstContentfulPaint?: number;
  largestContentfulPaint?: number;
  firstInputDelay?: number;
  cumulativeLayoutShift?: number;
  timeToInteractive?: number;
}

const eventQueue: AnalyticsEvent[] = [];
const BATCH_SIZE = 10,
  FLUSH_INTERVAL = 30000;
const requests = new Set<AbortController>();
let cleanupAnalytics: (() => void) | null = null;
let volatileSession: string | undefined;
const getSessionId = (): string => {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = sessionStorage.getItem("analytics_session_id");
    if (!id) {
      id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      sessionStorage.setItem("analytics_session_id", id);
    }
    return id;
  } catch {
    volatileSession ??= `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    return volatileSession;
  }
};
const getUserId = (): string | undefined => {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("auth-storage");
    if (raw) return JSON.parse(raw)?.state?.user?.id;
  } catch {
    return;
  }
  return;
};
const flushEvents = async (): Promise<void> => {
  if (!hasAnalyticsConsent()) {
    eventQueue.length = 0;
    return;
  }
  if (eventQueue.length === 0) return;
  const events = eventQueue.splice(0, eventQueue.length),
    controller = new AbortController();
  requests.add(controller);
  try {
    await fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events }),
      credentials: "include",
      keepalive: true,
      signal: controller.signal,
    });
  } catch {
    /* Optional telemetry never blocks the product. */
  } finally {
    requests.delete(controller);
  }
};
export const trackEvent = (event: AnalyticsEvent): void => {
  if (!hasAnalyticsConsent()) return;
  eventQueue.push({
    ...event,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    userId: getUserId(),
  });
  if (eventQueue.length >= BATCH_SIZE) void flushEvents();
};
export function stopAnalytics(): void {
  const stop = cleanupAnalytics;
  cleanupAnalytics = null;
  stop?.();
  eventQueue.length = 0;
  requests.forEach((controller) => controller.abort());
  requests.clear();
  volatileSession = undefined;
  if (typeof window !== "undefined" && !hasAnalyticsConsent()) {
    try {
      sessionStorage.removeItem("analytics_session_id");
    } catch {
      /* Optional identifier unavailable. */
    }
  }
}

export const trackNavigation = (pageName: string, referrer?: string): void => {
  trackEvent({
    category: "navigation",
    action: "page_view",
    label: pageName,
    metadata: {
      referrer:
        referrer || (typeof document !== "undefined" ? document.referrer : ""),
      url: typeof window !== "undefined" ? window.location.href : "",
    },
  });
};

/**
 * 👆 Trackear interacción
 */
export const trackInteraction = (
  action: string,
  element: string,
  value?: number,
): void => {
  trackEvent({
    category: "interaction",
    action,
    label: element,
    value,
  });
};

/**
 * 💰 Trackear conversión (acciones de alto valor)
 */
export const trackConversion = (
  action: string,
  label?: string,
  value?: number,
  metadata?: Record<string, unknown>,
): void => {
  trackEvent({
    category: "conversion",
    action,
    label,
    value,
    metadata,
  });
};

/**
 * 🤖 Trackear uso del chatbot
 */
export const trackChatbot = (
  action:
    | "open"
    | "close"
    | "message_sent"
    | "message_received"
    | "quick_action",
  label?: string,
): void => {
  trackEvent({
    category: "chatbot",
    action,
    label,
  });
};

/**
 * 🔐 Trackear autenticación
 */
export const trackAuth = (
  action:
    | "login_attempt"
    | "login_success"
    | "login_failed"
    | "logout"
    | "session_expired",
  metadata?: Record<string, unknown>,
): void => {
  trackEvent({
    category: "auth",
    action,
    metadata,
  });
};

/**
 * 📄 Trackear acciones con facturas
 */
export const trackFactura = (
  action:
    | "view"
    | "download"
    | "preview"
    | "share_whatsapp"
    | "share_email"
    | "filter",
  facturaId?: string,
  metadata?: Record<string, unknown>,
): void => {
  trackEvent({
    category: "factura",
    action,
    label: facturaId,
    metadata,
  });
};

/**
 * ❌ Trackear errores
 */
export const trackError = (
  errorMessage: string,
  errorStack?: string,
  metadata?: Record<string, unknown>,
): void => {
  trackEvent({
    category: "error",
    action: "error_occurred",
    label: errorMessage,
    metadata: {
      stack: errorStack,
      ...metadata,
    },
  });
};

/**
 * ⚡ Trackear métricas de rendimiento
 */
export const trackPerformance = (metrics: PerformanceMetrics): void => {
  trackEvent({
    category: "performance",
    action: "web_vitals",
    metadata: metrics as Record<string, unknown>,
  });
};

export const initWebVitals = (): (() => void) => {
  if (!hasAnalyticsConsent() || typeof PerformanceObserver === "undefined")
    return () => {};
  const observers: PerformanceObserver[] = [];
  const observe = (type: string, callback: PerformanceObserverCallback) => {
    const observer = new PerformanceObserver(callback);
    try {
      observer.observe({ type, buffered: true });
      observers.push(observer);
    } catch {
      observer.disconnect();
    }
  };
  observe("largest-contentful-paint", (list) => {
    const entries = list.getEntries(),
      last = entries[entries.length - 1];
    if (last) trackPerformance({ largestContentfulPaint: last.startTime });
  });
  observe("first-input", (list) => {
    for (const entry of list.getEntries()) {
      const input = entry as PerformanceEntry & { processingStart: number };
      trackPerformance({
        firstInputDelay: input.processingStart - input.startTime,
      });
    }
  });
  let cls = 0;
  observe("layout-shift", (list) => {
    for (const entry of list.getEntries()) {
      const shift = entry as PerformanceEntry & {
        hadRecentInput: boolean;
        value: number;
      };
      if (!shift.hadRecentInput) cls += shift.value;
    }
  });
  const unload = () => trackPerformance({ cumulativeLayoutShift: cls });
  const load = () => {
    const timing = performance.timing,
      fcp = performance.getEntriesByName("first-contentful-paint")[0];
    if (timing)
      trackPerformance({
        pageLoadTime: timing.loadEventEnd - timing.navigationStart,
        firstContentfulPaint: fcp?.startTime,
      });
  };
  window.addEventListener("beforeunload", unload);
  window.addEventListener("load", load);
  return () => {
    observers.forEach((observer) => observer.disconnect());
    window.removeEventListener("beforeunload", unload);
    window.removeEventListener("load", load);
  };
};
export const initEngagementTracking = (): (() => void) => {
  if (!hasAnalyticsConsent()) return () => {};
  const start = Date.now();
  let maximum = 0;
  const scroll = () => {
    const range = document.body.scrollHeight - window.innerHeight;
    const percent = range > 0 ? Math.round((window.scrollY / range) * 100) : 0;
    maximum = Math.max(maximum, Math.min(100, Math.max(0, percent)));
  };
  const unload = () => {
    const seconds = Math.round((Date.now() - start) / 1000);
    trackEvent({
      category: "engagement",
      action: "page_engagement",
      value: seconds,
      metadata: {
        timeOnPageSeconds: seconds,
        maxScrollPercent: maximum,
        url: window.location.pathname,
      },
    });
  };
  window.addEventListener("scroll", scroll, { passive: true });
  window.addEventListener("beforeunload", unload);
  return () => {
    window.removeEventListener("scroll", scroll);
    window.removeEventListener("beforeunload", unload);
  };
};
export const initAnalytics = (): (() => void) => {
  if (!hasAnalyticsConsent()) return () => {};
  if (cleanupAnalytics) return cleanupAnalytics;
  const stopVitals = initWebVitals(),
    stopEngagement = initEngagementTracking();
  const flush = () => {
    void flushEvents();
  };
  const timer = setInterval(flush, FLUSH_INTERVAL);
  window.addEventListener("beforeunload", flush);
  window.addEventListener("pagehide", flush);
  const stop = () => {
    clearInterval(timer);
    stopVitals();
    stopEngagement();
    window.removeEventListener("beforeunload", flush);
    window.removeEventListener("pagehide", flush);
    if (cleanupAnalytics === stop) cleanupAnalytics = null;
    eventQueue.length = 0;
    requests.forEach((controller) => controller.abort());
    requests.clear();
  };
  cleanupAnalytics = stop;
  trackNavigation(window.location.pathname);
  return stop;
};
export default {
  trackEvent,
  trackNavigation,
  trackInteraction,
  trackConversion,
  trackChatbot,
  trackAuth,
  trackFactura,
  trackError,
  trackPerformance,
  initAnalytics,
};
