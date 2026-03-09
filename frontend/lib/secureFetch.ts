/**
 * ====================================================================
 * 🔐 SECURE FETCH - HttpOnly Cookie Authentication + CSRF Protection
 * ====================================================================
 * Wrapper para fetch que automáticamente incluye credentials para
 * enviar cookies HttpOnly con cada petición.
 * 
 * IMPORTANTE: Los tokens JWT ahora se almacenan en cookies HttpOnly
 * que el browser envía automáticamente. NO usar localStorage.
 * 
 * NUEVO: Detecta respuestas 401 y dispara evento de logout automático
 * NUEVO: Incluye token CSRF en requests mutantes (POST, PUT, DELETE)
 * 
 * @author Sistema de Seguridad Ultra
 * @version 3.0.0
 */

// URL base para API (vacío = rutas relativas que usa Next.js rewrites)
const API_URL = '';

// 🔐 Evento global para notificar cuando la sesión expira
export const SESSION_EXPIRED_EVENT = 'session:expired';

// 🔐 CSRF token cache
let csrfToken: string | null = null;
let csrfTokenFetching = false;

// 🔐 Silent refresh state — evitar múltiples refresh simultáneos
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

/**
 * 🔐 Obtener CSRF token del servidor
 */
async function getCSRFToken(): Promise<string | null> {
  if (csrfToken) return csrfToken;
  if (csrfTokenFetching) {
    // Wait for the other request to finish
    await new Promise(resolve => setTimeout(resolve, 100));
    return csrfToken;
  }

  csrfTokenFetching = true;
  try {
    const response = await fetch(`${API_URL}/api/security/csrf-token`, {
      credentials: 'include',
    });
    if (response.ok) {
      const data = await response.json();
      csrfToken = data.token;
      return csrfToken;
    }
  } catch (error) {
    console.warn('No se pudo obtener CSRF token:', error);
  } finally {
    csrfTokenFetching = false;
  }
  return null;
}

/**
 * Dispara evento de sesión expirada para que los listeners hagan logout
 */
function triggerSessionExpired(reason: string = 'token_expired') {
  if (typeof window !== 'undefined') {
    console.log('🔐 Disparando evento de sesión expirada:', reason);
    window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, {
      detail: { reason, timestamp: Date.now() }
    }));
  }
}

/**
 * 🔐 Intentar renovar access token silenciosamente usando refresh token
 * Si hay un refresh en progreso, espera al resultado existente.
 * @returns true si se renovó correctamente, false si falló
 */
async function attemptSilentRefresh(): Promise<boolean> {
  // Si ya hay un refresh en progreso, esperarlo
  if (isRefreshing && refreshPromise) {
    return refreshPromise;
  }

  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      console.log('🔐 Intentando renovar token silenciosamente...');
      const response = await fetch(`${API_URL}/api/auth/v2/refresh`, {
        method: 'POST',
        credentials: 'include', // Envía cookies HttpOnly (accessToken + refreshToken)
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          console.log('🔐 Token renovado silenciosamente ✅');
          // Limpiar CSRF token cache (el nuevo cookie podría invalidarlo)
          csrfToken = null;
          return true;
        }
      }

      console.log('🔐 No se pudo renovar el token:', response.status);
      return false;
    } catch (error) {
      console.error('🔐 Error en silent refresh:', error);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export interface SecureFetchOptions extends Omit<RequestInit, 'credentials'> {
  baseURL?: string;
  skipAuthCheck?: boolean; // Para endpoints que no requieren auth check
}

export interface SecureFetchResponse<T = unknown> {
  data: T;
  ok: boolean;
  status: number;
  statusText: string;
}

/**
 * 🔐 Fetch seguro que incluye cookies HttpOnly automáticamente
 * 
 * NUEVO: Detecta respuestas 401 y dispara logout automático
 * NUEVO: Incluye CSRF token en requests mutantes
 * 
 * @example
 * // GET request
 * const data = await secureFetch('/api/auth/perfil');
 * 
 * @example
 * // POST request con body
 * const data = await secureFetch('/api/clientes/123/contacto', {
 *   method: 'POST',
 *   body: JSON.stringify({ email: 'nuevo@email.com' })
 * });
 */
export async function secureFetch<T = unknown>(
  endpoint: string,
  options: SecureFetchOptions = {}
): Promise<SecureFetchResponse<T>> {
  const { baseURL = API_URL, headers: customHeaders, skipAuthCheck = false, ...restOptions } = options;

  // Construir URL completa
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  // Headers por defecto
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // 🔐 CSRF: Agregar token a requests mutantes (POST, PUT, PATCH, DELETE)
  const method = (restOptions.method || 'GET').toUpperCase();
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await getCSRFToken();
    if (token) {
      headers['X-CSRF-Token'] = token;
    }
  }

  // 🔐 CRÍTICO: credentials: 'include' envía cookies HttpOnly automáticamente
  const response = await fetch(url, {
    ...restOptions,
    headers,
    credentials: 'include', // 🔐 Envía cookies HttpOnly
  });

  // 🔐 Silent refresh: Si recibimos 401, intentar renovar token y reintentar
  if (response.status === 401 && !skipAuthCheck) {
    const isAuthEndpoint = endpoint.includes('/api/auth/login') ||
      endpoint.includes('/api/auth/refresh') ||
      endpoint.includes('/api/auth/v2/login') ||
      endpoint.includes('/api/auth/v2/refresh');

    if (!isAuthEndpoint) {
      console.log('🔐 secureFetch: 401 detectado, intentando silent refresh...');
      const refreshed = await attemptSilentRefresh();

      if (refreshed) {
        // Reintentar la petición original con el nuevo access token (en cookie)
        console.log('🔐 Reintentando petición original tras refresh...');
        const retryResponse = await fetch(url, {
          ...restOptions,
          headers,
          credentials: 'include',
        });

        // Parsear respuesta del reintento
        let retryData: T;
        const retryContentType = retryResponse.headers.get('content-type');

        if (retryContentType?.includes('application/json')) {
          retryData = await retryResponse.json();
        } else if (retryContentType?.includes('application/pdf') || retryContentType?.includes('application/zip') || retryContentType?.includes('application/octet-stream')) {
          retryData = await retryResponse.blob() as unknown as T;
        } else {
          retryData = await retryResponse.text() as unknown as T;
        }

        // Si el reintento también es 401, ahora sí cerrar sesión
        if (retryResponse.status === 401) {
          triggerSessionExpired('http_401_after_refresh');
        }

        return {
          data: retryData,
          ok: retryResponse.ok,
          status: retryResponse.status,
          statusText: retryResponse.statusText,
        };
      } else {
        // Refresh falló → sesión definitivamente expirada
        triggerSessionExpired('refresh_failed');
      }
    }
  }

  // Parsear respuesta
  let data: T;
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    data = await response.json();
  } else if (contentType?.includes('application/pdf') || contentType?.includes('application/zip') || contentType?.includes('application/octet-stream')) {
    // Para PDFs, ZIPs y binarios, devolver el blob
    data = await response.blob() as unknown as T;
  } else {
    data = await response.text() as unknown as T;
  }

  return {
    data,
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
  };
}

/**
 * 🔐 Fetch para descargar archivos (PDF, etc.) con autenticación
 */
export async function secureDownload(
  endpoint: string,
  filename: string
): Promise<boolean> {
  try {
    const url = endpoint.startsWith('http')
      ? endpoint
      : `${API_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include', // 🔐 Envía cookies HttpOnly
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    // Crear link temporal y disparar descarga
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Limpiar blob URL
    window.URL.revokeObjectURL(blobUrl);

    return true;
  } catch (error) {
    console.error('Error en descarga segura:', error);
    return false;
  }
}

/**
 * 🔐 Helpers para métodos HTTP comunes
 */
export const api = {
  get: <T = unknown>(endpoint: string, options?: SecureFetchOptions) =>
    secureFetch<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = unknown>(endpoint: string, body?: unknown, options?: SecureFetchOptions) =>
    secureFetch<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined
    }),

  put: <T = unknown>(endpoint: string, body?: unknown, options?: SecureFetchOptions) =>
    secureFetch<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined
    }),

  delete: <T = unknown>(endpoint: string, options?: SecureFetchOptions) =>
    secureFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default secureFetch;
