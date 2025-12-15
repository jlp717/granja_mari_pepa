/**
 * SERVICIO DE CACHÉ
 * ==================
 * Sistema simple de caché en memoria
 */

const logger = require('../utils/logger');

// Store de caché
const cache = new Map();

// TTL por defecto: 5 minutos
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Obtener valor del caché
 */
function get(key) {
  const item = cache.get(key);
  
  if (!item) {
    return null;
  }
  
  // Verificar si expiró
  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }
  
  logger.debug('📦 Cache hit', { key });
  return item.value;
}

/**
 * Guardar valor en caché
 */
function set(key, value, ttl = DEFAULT_TTL) {
  const expiry = Date.now() + ttl;
  
  cache.set(key, {
    value,
    expiry
  });
  
  logger.debug('💾 Cache set', { key, ttl });
}

/**
 * Eliminar valor del caché
 */
function del(key) {
  cache.delete(key);
  logger.debug('🗑️ Cache delete', { key });
}

/**
 * Limpiar todo el caché
 */
function clear() {
  cache.clear();
  logger.info('🧹 Cache cleared');
}

/**
 * Obtener estadísticas del caché
 */
function stats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

/**
 * Obtener estadísticas del caché
 */
function stats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}

/**
 * Cerrar servicio de caché
 */
async function close() {
  clear();
  logger.info('🔒 Cache service cerrado');
}

module.exports = {
  get,
  set,
  del,
  clear,
  stats,
  close
};
