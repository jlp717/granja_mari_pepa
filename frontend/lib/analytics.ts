/**
 * ====================================================================
 * 📊 ANALYTICS SERVICE - Sistema de Monitorización de Acciones
 * ====================================================================
 * Tracking completo de acciones del usuario, métricas de rendimiento,
 * y eventos de negocio para análisis y mejora continua.
 * 
 * @version 2.0.0
 * @author Granja Mari Pepa - Sistema de Monitorización
 */

// Tipos de eventos que podemos trackear
export type EventCategory = 
  | 'navigation'      // Navegación entre páginas
  | 'interaction'     // Clics, formularios, etc.
  | 'conversion'      // Acciones de valor (descarga, pedido, etc.)
  | 'error'          // Errores capturados
  | 'performance'    // Métricas de rendimiento
  | 'engagement'     // Tiempo en página, scroll, etc.
  | 'chatbot'        // Interacciones con el chatbot
  | 'auth'           // Login, logout, etc.
  | 'factura'        // Acciones con facturas
  | 'pedido';        // Acciones con pedidos

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

// Almacén de eventos en memoria (batch sending)
const eventQueue: AnalyticsEvent[] = [];
const BATCH_SIZE = 10;
const FLUSH_INTERVAL = 30000; // 30 segundos

// Session ID único
const getSessionId = (): string => {
  if (typeof window === 'undefined') return 'ssr';
  
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// User ID desde store (si está autenticado)
const getUserId = (): string | undefined => {
  if (typeof window === 'undefined') return undefined;
  
  try {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const parsed = JSON.parse(authStorage);
      return parsed?.state?.user?.id;
    }
  } catch {
    return undefined;
  }
  return undefined;
};

/**
 * 📤 Enviar eventos al backend
 */
const flushEvents = async (): Promise<void> => {
  if (eventQueue.length === 0) return;
  
  const eventsToSend = eventQueue.splice(0, eventQueue.length);
  
  try {
    await fetch('/api/analytics/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: eventsToSend }),
      credentials: 'include',
      keepalive: true, // Permite enviar aunque la página se cierre
    }).catch(() => {
      // Silenciar errores de red - los eventos se pierden pero no bloqueamos
      console.debug('[Analytics] No se pudieron enviar eventos al backend');
    });
  } catch {
    // Silenciar
  }
};

// Configurar flush automático
if (typeof window !== 'undefined') {
  // Flush periódico
  setInterval(flushEvents, FLUSH_INTERVAL);
  
  // Flush al cerrar/cambiar página
  window.addEventListener('beforeunload', flushEvents);
  window.addEventListener('pagehide', flushEvents);
}

/**
 * 📊 FUNCIÓN PRINCIPAL - Trackear evento
 */
export const trackEvent = (event: AnalyticsEvent): void => {
  const enrichedEvent: AnalyticsEvent = {
    ...event,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
    userId: getUserId(),
  };

  // Log en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [Analytics] ${event.category}:${event.action}`, enrichedEvent);
  }

  // Añadir a la cola
  eventQueue.push(enrichedEvent);

  // Flush si alcanzamos el batch size
  if (eventQueue.length >= BATCH_SIZE) {
    flushEvents();
  }
};

// ============================================================================
// HELPERS ESPECÍFICOS POR CATEGORÍA
// ============================================================================

/**
 * 🧭 Trackear navegación
 */
export const trackNavigation = (pageName: string, referrer?: string): void => {
  trackEvent({
    category: 'navigation',
    action: 'page_view',
    label: pageName,
    metadata: {
      referrer: referrer || (typeof document !== 'undefined' ? document.referrer : ''),
      url: typeof window !== 'undefined' ? window.location.href : '',
    },
  });
};

/**
 * 👆 Trackear interacción
 */
export const trackInteraction = (
  action: string,
  element: string,
  value?: number
): void => {
  trackEvent({
    category: 'interaction',
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
  metadata?: Record<string, unknown>
): void => {
  trackEvent({
    category: 'conversion',
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
  action: 'open' | 'close' | 'message_sent' | 'message_received' | 'quick_action',
  label?: string
): void => {
  trackEvent({
    category: 'chatbot',
    action,
    label,
  });
};

/**
 * 🔐 Trackear autenticación
 */
export const trackAuth = (
  action: 'login_attempt' | 'login_success' | 'login_failed' | 'logout' | 'session_expired',
  metadata?: Record<string, unknown>
): void => {
  trackEvent({
    category: 'auth',
    action,
    metadata,
  });
};

/**
 * 📄 Trackear acciones con facturas
 */
export const trackFactura = (
  action: 'view' | 'download' | 'preview' | 'share_whatsapp' | 'share_email' | 'filter',
  facturaId?: string,
  metadata?: Record<string, unknown>
): void => {
  trackEvent({
    category: 'factura',
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
  metadata?: Record<string, unknown>
): void => {
  trackEvent({
    category: 'error',
    action: 'error_occurred',
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
    category: 'performance',
    action: 'web_vitals',
    metadata: metrics as Record<string, unknown>,
  });
};

// ============================================================================
// WEB VITALS - Métricas automáticas de rendimiento
// ============================================================================

/**
 * 📈 Inicializar tracking de Web Vitals
 */
export const initWebVitals = (): void => {
  if (typeof window === 'undefined') return;

  // Usar Performance Observer para métricas
  try {
    // Largest Contentful Paint
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number };
      trackPerformance({ largestContentfulPaint: lastEntry.startTime });
    });
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay
    const fidObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      entries.forEach((entry) => {
        const fidEntry = entry as PerformanceEntry & { processingStart: number; startTime: number };
        trackPerformance({ firstInputDelay: fidEntry.processingStart - fidEntry.startTime });
      });
    });
    fidObserver.observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const layoutShiftEntry = entry as PerformanceEntry & { hadRecentInput: boolean; value: number };
        if (!layoutShiftEntry.hadRecentInput) {
          clsValue += layoutShiftEntry.value;
        }
      }
    });
    clsObserver.observe({ type: 'layout-shift', buffered: true });

    // Enviar CLS al descargar página
    window.addEventListener('beforeunload', () => {
      trackPerformance({ cumulativeLayoutShift: clsValue });
    });

    // Page Load Time
    window.addEventListener('load', () => {
      const timing = performance.timing;
      const pageLoadTime = timing.loadEventEnd - timing.navigationStart;
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      
      trackPerformance({
        pageLoadTime,
        firstContentfulPaint: fcp ? (fcp as PerformanceEntry).startTime : undefined,
      });
    });

  } catch (error) {
    console.debug('[Analytics] Web Vitals no soportado en este navegador');
  }
};

// ============================================================================
// ENGAGEMENT TRACKING
// ============================================================================

/**
 * 📱 Trackear tiempo en página y scroll
 */
export const initEngagementTracking = (): void => {
  if (typeof window === 'undefined') return;

  const startTime = Date.now();
  let maxScroll = 0;

  // Trackear scroll máximo
  window.addEventListener('scroll', () => {
    const scrollPercent = Math.round(
      (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
    );
    maxScroll = Math.max(maxScroll, scrollPercent);
  });

  // Enviar engagement al salir
  window.addEventListener('beforeunload', () => {
    const timeOnPage = Math.round((Date.now() - startTime) / 1000);
    
    trackEvent({
      category: 'engagement',
      action: 'page_engagement',
      value: timeOnPage,
      metadata: {
        timeOnPageSeconds: timeOnPage,
        maxScrollPercent: maxScroll,
        url: window.location.pathname,
      },
    });
  });
};

// ============================================================================
// EXPORTAR INICIALIZACIÓN GLOBAL
// ============================================================================

/**
 * 🚀 Inicializar todo el sistema de analytics
 */
export const initAnalytics = (): void => {
  if (typeof window === 'undefined') return;

  // Inicializar Web Vitals
  initWebVitals();

  // Inicializar Engagement
  initEngagementTracking();

  // Trackear visita inicial
  trackNavigation(window.location.pathname);

  console.log('📊 [Analytics] Sistema de monitorización iniciado');
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
