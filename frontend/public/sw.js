/**
 * Service Worker - Granja Mari Pepa
 * Proporciona funcionalidad offline y caching inteligente
 * 
 * Estrategias de caching:
 * - Stale While Revalidate: Contenido que puede estar ligeramente desactualizado
 * - Cache First: Assets estáticos (imágenes, fuentes, CSS, JS)
 * - Network First: API calls y contenido dinámico
 */

const CACHE_VERSION = 'granja-mari-pepa-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const IMAGE_CACHE = `${CACHE_VERSION}-images`;

// Archivos esenciales para funcionamiento offline
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/productos',
  '/contacto',
  '/acerca',
];

// Tiempo máximo de espera para respuestas de red (ms)
const NETWORK_TIMEOUT = 5000;

// Tamaño máximo de cache dinámica (items)
const MAX_DYNAMIC_CACHE_SIZE = 50;
const MAX_IMAGE_CACHE_SIZE = 100;

/**
 * Instalación del Service Worker
 * Pre-carga los assets estáticos esenciales
 */
self.addEventListener('install', (event) => {
  console.log('[SW] Instalando Service Worker v1');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Pre-cargando assets estáticos');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        // Forzar activación inmediata
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Error durante instalación:', error);
      })
  );
});

/**
 * Activación del Service Worker
 * Limpia caches antiguas
 */
self.addEventListener('activate', (event) => {
  console.log('[SW] Service Worker activado');
  
  event.waitUntil(
    Promise.all([
      // Limpiar caches antiguas
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name.startsWith('granja-mari-pepa-') && name !== CACHE_VERSION)
            .map((name) => {
              console.log('[SW] Eliminando cache antigua:', name);
              return caches.delete(name);
            })
        );
      }),
      // Tomar control de todos los clientes inmediatamente
      self.clients.claim()
    ])
  );
});

/**
 * Interceptar peticiones de red
 * Aplica diferentes estrategias según el tipo de recurso
 */
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Solo manejar peticiones GET
  if (request.method !== 'GET') {
    return;
  }

  // No cachear requests de desarrollo
  if (url.hostname === 'localhost' && url.port === '3001') {
    return;
  }

  // Estrategia según tipo de recurso
  if (isImageRequest(request)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE, MAX_IMAGE_CACHE_SIZE));
  } else if (isStaticAsset(request)) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else if (isApiRequest(request)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isNavigationRequest(request)) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE));
  } else {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE));
  }
});

/**
 * Determina si es una petición de imagen
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    request.destination === 'image' ||
    /\.(jpg|jpeg|png|gif|svg|webp|avif|ico)$/i.test(url.pathname)
  );
}

/**
 * Determina si es un asset estático
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    /\.(css|js|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
    url.pathname.startsWith('/_next/static/')
  );
}

/**
 * Determina si es una petición a la API
 */
function isApiRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('api.') ||
    url.hostname.includes('backend')
  );
}

/**
 * Determina si es una petición de navegación
 */
function isNavigationRequest(request) {
  return request.mode === 'navigate';
}

/**
 * Estrategia: Cache First
 * Intenta primero desde cache, si no existe va a la red
 * Ideal para: assets estáticos, imágenes
 */
async function cacheFirstStrategy(request, cacheName, maxItems = null) {
  try {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      
      if (maxItems) {
        trimCache(cacheName, maxItems);
      }
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Cache First error:', error);
    return createOfflineResponse(request);
  }
}

/**
 * Estrategia: Network First
 * Intenta primero desde la red, si falla usa cache
 * Ideal para: API calls, datos dinámicos
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetchWithTimeout(request, NETWORK_TIMEOUT);
    
    // Cachear respuestas exitosas de la API
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
      trimCache(DYNAMIC_CACHE, MAX_DYNAMIC_CACHE_SIZE);
    }

    return networkResponse;
  } catch (error) {
    console.log('[SW] Network First: Red no disponible, buscando en cache');
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    return createOfflineResponse(request, true);
  }
}

/**
 * Estrategia: Stale While Revalidate
 * Devuelve cache inmediatamente mientras actualiza en background
 * Ideal para: páginas de navegación, contenido que tolera desactualización
 */
async function staleWhileRevalidate(request, cacheName, maxItems = null) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await caches.match(request);

  // Revalidar en background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone());
        if (maxItems) {
          trimCache(cacheName, maxItems);
        }
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log('[SW] Revalidation failed:', error);
      return cachedResponse;
    });

  // Devolver cache si existe, si no esperar a la red
  return cachedResponse || fetchPromise;
}

/**
 * Fetch con timeout
 */
function fetchWithTimeout(request, timeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error('Network timeout'));
    }, timeout);

    fetch(request)
      .then((response) => {
        clearTimeout(timeoutId);
        resolve(response);
      })
      .catch((error) => {
        clearTimeout(timeoutId);
        reject(error);
      });
  });
}

/**
 * Limitar tamaño de cache
 */
async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    // Eliminar los más antiguos
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map((key) => cache.delete(key)));
  }
}

/**
 * Crear respuesta offline
 */
function createOfflineResponse(request, isApi = false) {
  if (isApi) {
    return new Response(
      JSON.stringify({
        success: false,
        error: 'Sin conexión a internet',
        offline: true,
        message: 'Por favor, verifica tu conexión e inténtalo de nuevo.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store'
        }
      }
    );
  }

  // Para navegación, intentar devolver la página offline
  return caches.match('/offline').then((response) => {
    if (response) {
      return response;
    }

    return new Response(
      `<!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Sin conexión - Granja Mari Pepa</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
            padding: 20px;
          }
          .container {
            text-align: center;
            max-width: 400px;
            background: white;
            padding: 40px;
            border-radius: 16px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.1);
          }
          .icon {
            font-size: 64px;
            margin-bottom: 20px;
          }
          h1 {
            color: #166534;
            font-size: 24px;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          .btn {
            background: #16a34a;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            transition: background 0.2s;
          }
          .btn:hover {
            background: #15803d;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="icon">🌿</div>
          <h1>Sin conexión</h1>
          <p>
            Parece que no tienes conexión a internet. 
            Verifica tu conexión y vuelve a intentarlo.
          </p>
          <button class="btn" onclick="window.location.reload()">
            Reintentar
          </button>
        </div>
      </body>
      </html>`,
      {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store'
        }
      }
    );
  });
}

/**
 * Manejar mensajes del cliente
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_URLS':
      if (payload && Array.isArray(payload.urls)) {
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.addAll(payload.urls);
        });
      }
      break;

    case 'CLEAR_CACHE':
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      }).then(() => {
        event.ports[0].postMessage({ success: true });
      });
      break;

    case 'GET_CACHE_SIZE':
      getCacheSize().then((size) => {
        event.ports[0].postMessage({ size });
      });
      break;
  }
});

/**
 * Calcular tamaño total de caches
 */
async function getCacheSize() {
  let totalSize = 0;
  const cacheNames = await caches.keys();
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    
    for (const request of keys) {
      const response = await cache.match(request);
      if (response) {
        const blob = await response.clone().blob();
        totalSize += blob.size;
      }
    }
  }

  return totalSize;
}

/**
 * Notificaciones push (para futuro)
 */
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'Tienes una nueva notificación',
    icon: '/images/logo/logo-192.png',
    badge: '/images/logo/badge-72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    actions: data.actions || []
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || 'Granja Mari Pepa',
      options
    )
  );
});

/**
 * Click en notificación
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clientList) => {
      // Si ya hay una ventana abierta, enfocaria
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Si no, abrir nueva ventana
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

console.log('[SW] Service Worker cargado correctamente');
