'use client';

import { useEffect, useState, useCallback } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isOnline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
}

interface UseServiceWorkerReturn extends ServiceWorkerState {
  update: () => Promise<void>;
  unregister: () => Promise<boolean>;
  clearCache: () => Promise<boolean>;
  getCacheSize: () => Promise<number>;
}

/**
 * Hook para gestionar el Service Worker
 * Proporciona estado y métodos para controlar el SW
 */
export function useServiceWorker(): UseServiceWorkerReturn {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: false,
    isRegistered: false,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    registration: null,
    updateAvailable: false,
  });

  // Registrar Service Worker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSupported = 'serviceWorker' in navigator;
    setState((prev) => ({ ...prev, isSupported }));

    if (!isSupported) return;

    // No registrar en desarrollo (excepto si se fuerza)
    const isDev = process.env.NODE_ENV === 'development';
    const forceSW = process.env.NEXT_PUBLIC_FORCE_SW === 'true';
    
    if (isDev && !forceSW) {
      console.log('[useServiceWorker] SW deshabilitado en desarrollo');
      return;
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none',
        });

        console.log('[useServiceWorker] SW registrado:', registration.scope);

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Detectar actualizaciones
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[useServiceWorker] Nueva versión disponible');
                setState((prev) => ({ ...prev, updateAvailable: true }));
              }
            });
          }
        });

        // Comprobar actualizaciones periódicamente
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Cada hora

      } catch (error) {
        console.error('[useServiceWorker] Error registrando SW:', error);
      }
    };

    // Esperar a que la página cargue
    if (document.readyState === 'complete') {
      registerSW();
    } else {
      window.addEventListener('load', registerSW);
      return () => window.removeEventListener('load', registerSW);
    }
  }, []);

  // Detectar cambios de conexión
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setState((prev) => ({ ...prev, isOnline: true }));
      console.log('[useServiceWorker] Conexión restaurada');
    };

    const handleOffline = () => {
      setState((prev) => ({ ...prev, isOnline: false }));
      console.log('[useServiceWorker] Sin conexión');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Actualizar a nueva versión
  const update = useCallback(async () => {
    if (!state.registration?.waiting) return;

    state.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Recargar cuando el nuevo SW tome control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }, [state.registration]);

  // Desregistrar Service Worker
  const unregister = useCallback(async (): Promise<boolean> => {
    if (!state.registration) return false;

    try {
      const result = await state.registration.unregister();
      if (result) {
        setState((prev) => ({
          ...prev,
          isRegistered: false,
          registration: null,
        }));
      }
      return result;
    } catch (error) {
      console.error('[useServiceWorker] Error desregistrando:', error);
      return false;
    }
  }, [state.registration]);

  // Limpiar cache
  const clearCache = useCallback(async (): Promise<boolean> => {
    if (!navigator.serviceWorker.controller) return false;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.success || false);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'CLEAR_CACHE' },
        [messageChannel.port2]
      );
    });
  }, []);

  // Obtener tamaño de cache
  const getCacheSize = useCallback(async (): Promise<number> => {
    if (!navigator.serviceWorker.controller) return 0;

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel();
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data?.size || 0);
      };

      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHE_SIZE' },
        [messageChannel.port2]
      );
    });
  }, []);

  return {
    ...state,
    update,
    unregister,
    clearCache,
    getCacheSize,
  };
}

/**
 * Componente para mostrar indicador offline
 */
export function OfflineIndicator() {
  const { isOnline } = useServiceWorker();

  if (isOnline) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 z-50 bg-amber-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 animate-pulse"
      role="alert"
      aria-live="polite"
    >
      <svg 
        className="w-5 h-5" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3" 
        />
      </svg>
      <span className="text-sm font-medium">Sin conexión</span>
    </div>
  );
}

/**
 * Componente para mostrar actualización disponible
 */
export function UpdatePrompt() {
  const { updateAvailable, update } = useServiceWorker();

  if (!updateAvailable) return null;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-green-600 text-white p-4 rounded-lg shadow-lg max-w-sm"
      role="alert"
    >
      <p className="font-medium mb-2">Nueva versión disponible</p>
      <p className="text-sm text-green-100 mb-3">
        Hay una actualización lista. Actualiza para obtener las últimas mejoras.
      </p>
      <button
        onClick={update}
        className="bg-white text-green-600 px-4 py-2 rounded font-medium text-sm hover:bg-green-50 transition-colors"
      >
        Actualizar ahora
      </button>
    </div>
  );
}

export default useServiceWorker;
