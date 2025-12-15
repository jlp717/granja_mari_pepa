/**
 * RATE LIMITER
 * =============
 * Limitadores de tasa para diferentes endpoints
 */

const logger = require('../utils/logger');

// Configuración
const requestCounts = new Map();

function createLimiter(windowMs, maxRequests) {
  return (req, res, next) => {
    const ip = req.ip;
    const key = `${ip}_${req.path}`;
    
    if (!requestCounts.has(key)) {
      requestCounts.set(key, {
        count: 0,
        resetTime: Date.now() + windowMs
      });
    }
    
    const data = requestCounts.get(key);
    
    if (Date.now() > data.resetTime) {
      data.count = 0;
      data.resetTime = Date.now() + windowMs;
    }
    
    data.count++;
    
    if (data.count > maxRequests) {
      logger.warn('⚠️ Rate limit excedido', { ip, path: req.path });
      return res.status(429).json({
        success: false,
        message: 'Demasiadas peticiones'
      });
    }
    
    next();
  };
}

const generalLimiter = createLimiter(15 * 60 * 1000, 200); // 200 req/15min (más generoso)
const pdfLimiter = createLimiter(60 * 1000, 30); // 30 PDFs/min (aumentado de 10)

// Limpiar registros antiguos cada 30 minutos para evitar fugas de memoria
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of requestCounts.entries()) {
    if (now > data.resetTime + (30 * 60 * 1000)) { // Más de 30 min sin usar
      requestCounts.delete(key);
    }
  }
  logger.info('🧹 Rate limiter cleanup', { activeKeys: requestCounts.size });
}, 30 * 60 * 1000); // Cada 30 minutos

module.exports = {
  generalLimiter,
  pdfLimiter
};
