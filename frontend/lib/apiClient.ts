/**
 * 🔐 CLIENTE API ULTRA-SEGURO CON HTTPONLY COOKIES
 * 
 * Características de Seguridad:
 * - Tokens almacenados en cookies HttpOnly (NO en localStorage)
 * - credentials: 'include' para enviar cookies automáticamente
 * - CSRF token en headers para requests mutantes
 * - Renovación automática de tokens vía cookies
 * - Manejo centralizado de errores
 * - Timeout configurable
 * 
 * @version 3.0.0 - Security Edition
 */

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// URL base para API (vacío = rutas relativas que usa Next.js rewrites)
const API_URL = '';

// 🔐 SECURITY: CSRF token para requests mutantes
let csrfToken: string | null = null;

// Crear instancia de axios con cookies habilitadas
const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 segundos
  headers: {
    'Content-Type': 'application/json'
  },
  // 🔐 SECURITY: Enviar cookies automáticamente en cada request
  withCredentials: true
});

// Variable para rastrear si ya estamos renovando el token
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve();
    }
  });
  
  failedQueue = [];
};

/**
 * 🔐 SECURITY: Obtener CSRF token del servidor
 * Llamar después del login para obtener el token
 */
export const fetchCSRFToken = async (): Promise<string | null> => {
  try {
    const response = await apiClient.get('/api/security/csrf-token');
    csrfToken = response.data.token;
    return csrfToken;
  } catch (error) {
    console.warn('No se pudo obtener CSRF token:', error);
    return null;
  }
};

// Interceptor de REQUEST: Agregar CSRF token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 🔐 SECURITY: Agregar CSRF token a requests mutantes
    const mutatingMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (config.method && mutatingMethods.includes(config.method.toUpperCase())) {
      if (csrfToken && config.headers) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }
    
    // 🔐 SECURITY: Los tokens se envían automáticamente via cookies HttpOnly
    // No se necesita Authorization header - withCredentials: true maneja todo
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de RESPONSE: Renovar token si expira
apiClient.interceptors.response.use(
  (response) => {
    // 🔐 SECURITY: Los tokens ahora se manejan via cookies HttpOnly
    // No guardamos tokens en localStorage (previene XSS)
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    
    // Si el error es 401 (no autorizado) y no hemos intentado renovar aún
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // Si ya estamos renovando, agregar a la cola
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // 🔐 SECURITY: Intentar renovar el token via cookies HttpOnly
        // El refresh token está en una cookie HttpOnly, el servidor lo leerá automáticamente
        const response = await axios.post(
          `${API_URL}/api/auth/refresh`, 
          {}, // Body vacío - el refresh token va en la cookie
          { withCredentials: true } // Para cookies HttpOnly
        );

        // Verificar que la respuesta fue exitosa
        if (!response.data.success) {
          throw new Error('Error al renovar token');
        }

        // 🔐 SECURITY: Los nuevos tokens se establecen automáticamente en cookies HttpOnly
        // No necesitamos guardarlos en localStorage

        // Procesar cola de requests fallidos
        processQueue();
        isRefreshing = false;

        // Reintentar el request original
        return apiClient(originalRequest);

      } catch (refreshError) {
        // Fallo al renovar token, cerrar sesión
        processQueue(refreshError);
        isRefreshing = false;
        
        // 🔐 SECURITY: Solo limpiar localStorage de tokens legacy y redirigir
        if (typeof window !== 'undefined') {
          // Limpiar tokens legacy que puedan quedar de versiones anteriores
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;

/**
 * 🔐 SECURITY: Limpiar tokens y cerrar sesión
 */
export const clearAuthTokens = () => {
  csrfToken = null;
  // 🔐 SECURITY: Limpiar tokens legacy de localStorage (por si migración incompleta)
  if (typeof window !== 'undefined') {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }
};

/**
 * Helper para manejar errores de API de forma consistente
 */
export const handleApiError = (error: any): string => {
  console.error('API Error:', error);

  if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
    return 'La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.';
  }

  if (error.response) {
    const status = error.response.status;
    const data = error.response.data;

    if (data?.message) {
      return data.message;
    }

    switch (status) {
      case 400:
        return 'Los datos enviados no son válidos.';
      case 401:
        return 'Tu sesión ha expirado. Redirigiendo al login...';
      case 403:
        return 'No tienes permisos para realizar esta acción.';
      case 404:
        return 'El recurso solicitado no fue encontrado.';
      case 429:
        return 'Demasiadas solicitudes. Por favor, espera un momento.';
      case 500:
        return 'Error interno del servidor. Nuestro equipo ha sido notificado.';
      case 503:
        return 'El servicio no está disponible temporalmente. Intenta en unos minutos.';
      case 504:
        return 'La solicitud tardó demasiado tiempo. Por favor, intenta nuevamente.';
      default:
        return 'Ocurrió un error inesperado. Por favor, intenta nuevamente.';
    }
  }

  if (error.request) {
    return 'No se pudo conectar con el servidor. Verifica tu conexión a internet.';
  }

  return 'Error inesperado. Por favor, intenta nuevamente.';
};
