/**
 * MIDDLEWARE DE RATE LIMITING
 * =============================
 * Limita requests por IP para prevenir abuso
 */

const logger = require('../utils/logger');

// Store para tracking de requests por IP
const requestCounts = new Map();

// Configuración
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000 || 15 * 60 * 1000; // 15 minutos
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX) || 100;

/**
 * Limpiar contador de una IP después del window
 */
function clearIPCounter(ip) {
  setTimeout(() => {
    requestCounts.delete(ip);
    logger.debug('🧹 Contador limpiado', { ip });
  }, WINDOW_MS);
}

/**
 * Middleware de rate limiting
 */
function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  
  // Obtener o inicializar contador
  if (!requestCounts.has(ip)) {
    requestCounts.set(ip, {
      count: 0,
      startTime: Date.now()
    });
    clearIPCounter(ip);
  }
  
  const ipData = requestCounts.get(ip);
  ipData.count++;
  
  // Verificar si excede el límite
  if (ipData.count > MAX_REQUESTS) {
    const timeLeft = Math.ceil((WINDOW_MS - (Date.now() - ipData.startTime)) / 1000);
    
    logger.warn('⚠️ Rate limit excedido', { 
      ip,
      count: ipData.count,
      limit: MAX_REQUESTS,
      timeLeft: `${timeLeft}s`
    });
    
    return res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Por favor, intenta más tarde.',
      retryAfter: timeLeft
    });
  }
  
  // Añadir headers informativos
  res.setHeader('X-RateLimit-Limit', MAX_REQUESTS);
  res.setHeader('X-RateLimit-Remaining', MAX_REQUESTS - ipData.count);
  res.setHeader('X-RateLimit-Reset', new Date(ipData.startTime + WINDOW_MS).toISOString());
  
  next();
}

/**
 * Rate limiter estricto para endpoints sensibles (login, etc.)
 */
function strictRateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const key = `strict_${ip}`;
  
  const STRICT_WINDOW = 5 * 60 * 1000; // 5 minutos
  const STRICT_MAX = 10; // Solo 10 intentos
  
  if (!requestCounts.has(key)) {
    requestCounts.set(key, {
      count: 0,
      startTime: Date.now()
    });
    
    setTimeout(() => {
      requestCounts.delete(key);
    }, STRICT_WINDOW);
  }
  
  const ipData = requestCounts.get(key);
  ipData.count++;
  
  if (ipData.count > STRICT_MAX) {
    const timeLeft = Math.ceil((STRICT_WINDOW - (Date.now() - ipData.startTime)) / 1000);
    
    logger.warn('🚨 Strict rate limit excedido', { 
      ip,
      count: ipData.count,
      endpoint: req.path
    });
    
    return res.status(429).json({
      success: false,
      message: 'Demasiados intentos. Bloqueado temporalmente.',
      retryAfter: timeLeft
    });
  }
  
  next();
}

module.exports = {
  rateLimiter,
  strictRateLimiter
};
