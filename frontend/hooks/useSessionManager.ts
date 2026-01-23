'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { useRouter, usePathname } from 'next/navigation';
import toast from 'react-hot-toast';
import { SESSION_EXPIRED_EVENT } from '@/lib/secureFetch';

// Configuración
const SESSION_CHECK_INTERVAL = 60 * 1000; // Verificar cada 60 segundos
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos de inactividad
const WARNING_BEFORE_LOGOUT = 2 * 60 * 1000; // Avisar 2 minutos antes

interface SessionManagerOptions {
  onSessionExpired?: () => void;
  onSessionWarning?: (secondsLeft: number) => void;
  enabled?: boolean;
}

/**
 * Hook para gestionar la sesión de usuario
 * - Detecta expiración de sesión automáticamente
 * - Monitorea inactividad del usuario
 * - Realiza verificación periódica con el backend
 * - Expulsa automáticamente cuando la sesión expira
 */
export function useSessionManager(options: SessionManagerOptions = {}) {
  const { enabled = true, onSessionExpired, onSessionWarning } = options;
  const { isAuthenticated, logout, user } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  
  const lastActivityRef = useRef<number>(Date.now());
  const sessionCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef<boolean>(false);
  const isLoggingOutRef = useRef<boolean>(false);

  /**
   * Actualizar última actividad del usuario
   */
  const updateLastActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    warningShownRef.current = false;
  }, []);

  /**
   * Ejecutar logout y limpiar sesión
   */
  const handleSessionExpired = useCallback(async (reason: string = 'session_expired') => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    console.log('🔐 Sesión expirada:', reason);
    
    // Mostrar notificación
    toast.error(
      reason === 'inactivity' 
        ? 'Tu sesión ha expirado por inactividad' 
        : 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
      { duration: 5000, id: 'session-expired' }
    );

    // Ejecutar callback personalizado
    onSessionExpired?.();

    // Logout
    await logout();

    // Redirigir al login si estamos en área protegida
    if (pathname?.includes('/area-clientes')) {
      router.push('/area-clientes');
    }

    isLoggingOutRef.current = false;
  }, [logout, router, pathname, onSessionExpired]);

  /**
   * Verificar sesión con el backend
   */
  const verifySession = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || !user) return false;

    try {
      const response = await fetch('/api/auth/perfil', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Si la respuesta es 401, la sesión expiró
      if (response.status === 401) {
        console.log('🔐 Backend devolvió 401 - sesión inválida');
        await handleSessionExpired('token_expired');
        return false;
      }

      // Verificar header de renovación de token
      const renewalRequired = response.headers.get('X-Token-Renewal-Required');
      const tokenExpiry = response.headers.get('X-Token-Expiry');
      
      if (renewalRequired === 'true' && tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry, 10);
        const timeLeft = expiryTime - Date.now();
        const secondsLeft = Math.floor(timeLeft / 1000);
        
        if (!warningShownRef.current && timeLeft > 0 && timeLeft < WARNING_BEFORE_LOGOUT) {
          warningShownRef.current = true;
          onSessionWarning?.(secondsLeft);
          toast(
            `Tu sesión expirará en ${Math.ceil(secondsLeft / 60)} minutos. Guarda tu trabajo.`,
            { duration: 10000, icon: '⚠️', id: 'session-warning' }
          );
        }

        // Intentar renovar el token
        await refreshToken();
      }

      return response.ok;
    } catch (error) {
      console.error('Error verificando sesión:', error);
      // En caso de error de red, no deslogueamos inmediatamente
      return true;
    }
  }, [isAuthenticated, user, handleSessionExpired, onSessionWarning]);

  /**
   * Intentar refrescar el token
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('🔐 Token renovado exitosamente');
        warningShownRef.current = false;
        return true;
      }

      // Si falla el refresh, la sesión expiró completamente
      if (response.status === 401) {
        await handleSessionExpired('refresh_failed');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error renovando token:', error);
      return false;
    }
  }, [handleSessionExpired]);

  /**
   * Verificar inactividad del usuario
   */
  const checkInactivity = useCallback(() => {
    if (!isAuthenticated) return;

    const now = Date.now();
    const timeSinceLastActivity = now - lastActivityRef.current;

    // Si ha pasado el tiempo de inactividad, hacer logout
    if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
      handleSessionExpired('inactivity');
      return;
    }

    // Avisar cuando quede poco tiempo
    const timeUntilExpiry = INACTIVITY_TIMEOUT - timeSinceLastActivity;
    if (!warningShownRef.current && timeUntilExpiry <= WARNING_BEFORE_LOGOUT) {
      warningShownRef.current = true;
      const minutesLeft = Math.ceil(timeUntilExpiry / 60000);
      toast(
        `Tu sesión expirará en ${minutesLeft} minutos por inactividad`,
        { duration: 10000, icon: '⚠️', id: 'inactivity-warning' }
      );
      onSessionWarning?.(Math.floor(timeUntilExpiry / 1000));
    }
  }, [isAuthenticated, handleSessionExpired, onSessionWarning]);

  // Configurar listeners de actividad del usuario
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'mousemove'];
    
    // Throttle para no actualizar en cada movimiento
    let lastUpdate = 0;
    const throttledUpdate = () => {
      const now = Date.now();
      if (now - lastUpdate > 10000) { // Actualizar máximo cada 10 segundos
        lastUpdate = now;
        updateLastActivity();
      }
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, throttledUpdate, { passive: true });
    });

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, throttledUpdate);
      });
    };
  }, [enabled, isAuthenticated, updateLastActivity]);

  // Configurar verificación periódica de sesión
  useEffect(() => {
    if (!enabled || !isAuthenticated) {
      // Limpiar intervalos si no está autenticado
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
        sessionCheckIntervalRef.current = null;
      }
      if (inactivityTimeoutRef.current) {
        clearInterval(inactivityTimeoutRef.current);
        inactivityTimeoutRef.current = null;
      }
      return;
    }

    // Verificar sesión periódicamente
    sessionCheckIntervalRef.current = setInterval(() => {
      verifySession();
    }, SESSION_CHECK_INTERVAL);

    // Verificar inactividad periódicamente
    inactivityTimeoutRef.current = setInterval(() => {
      checkInactivity();
    }, 30000); // Cada 30 segundos

    // Verificación inicial
    verifySession();

    return () => {
      if (sessionCheckIntervalRef.current) {
        clearInterval(sessionCheckIntervalRef.current);
      }
      if (inactivityTimeoutRef.current) {
        clearInterval(inactivityTimeoutRef.current);
      }
    };
  }, [enabled, isAuthenticated, verifySession, checkInactivity]);

  // Detectar cuando el usuario vuelve a la pestaña
  useEffect(() => {
    if (!enabled || !isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // El usuario volvió a la pestaña, verificar sesión
        verifySession();
        checkInactivity();
      }
    };

    const handleFocus = () => {
      verifySession();
      checkInactivity();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, isAuthenticated, verifySession, checkInactivity]);

  // 🔐 CRÍTICO: Escuchar evento global de sesión expirada desde secureFetch
  useEffect(() => {
    if (!enabled) return;

    const handleSessionExpiredEvent = (event: CustomEvent) => {
      const { reason } = event.detail || {};
      console.log('🔐 useSessionManager: Evento SESSION_EXPIRED recibido:', reason);
      
      // Solo actuar si estamos autenticados
      if (isAuthenticated) {
        handleSessionExpired(reason || 'event_triggered');
      }
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpiredEvent as EventListener);

    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpiredEvent as EventListener);
    };
  }, [enabled, isAuthenticated, handleSessionExpired]);

  return {
    updateLastActivity,
    verifySession,
    refreshToken,
    handleSessionExpired,
  };
}

export default useSessionManager;
