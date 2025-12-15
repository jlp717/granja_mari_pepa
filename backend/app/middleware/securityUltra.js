/**
 * SECURITY ULTRA
 * ===============
 * Capa de seguridad nivel máximo con implementaciones funcionales
 */

const logger = require('../utils/logger');

// Store para detección de automatización
const requestPatterns = new Map();

/**
 * Aplicar configuración de seguridad ultra
 */
function applySecurityUltra(app) {
  logger.info('🛡️ Security Ultra activado');
  
  // Configurar headers de seguridad adicionales
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    next();
  });
  
  // Ocultar tecnología usada
  app.disable('x-powered-by');
  
  logger.info('✅ Security Ultra configurado correctamente');
}

/**
 * Anti-automatización: detectar bots y scrapers
 */
function antiAutomation(req, res, next) {
  const ip = req.ip;
  const userAgent = req.get('user-agent') || '';
  const now = Date.now();
  
  if (!requestPatterns.has(ip)) {
    requestPatterns.set(ip, {
      requests: [],
      firstSeen: now
    });
  }
  
  const pattern = requestPatterns.get(ip);
  pattern.requests.push(now);
  
  // Mantener solo los últimos 100 requests
  if (pattern.requests.length > 100) {
    pattern.requests = pattern.requests.slice(-100);
  }
  
  // Detectar comportamiento de bot
  const recentRequests = pattern.requests.filter(t => now - t < 10000); // 10 segundos
  
  if (recentRequests.length > 50) {
    logger.warn('🤖 Comportamiento de bot detectado', {
      ip,
      requestsIn10s: recentRequests.length,
      userAgent
    });
    return res.status(429).json({
      success: false,
      message: 'Demasiadas peticiones. Por favor espera un momento.'
    });
  }
  
  // Detectar User-Agent sospechoso
  if (!userAgent || userAgent.length < 10) {
    logger.warn('⚠️ User-Agent sospechoso', { ip, userAgent });
  }
  
  // Limpiar datos viejos
  if (now - pattern.firstSeen > 3600000) { // 1 hora
    requestPatterns.delete(ip);
  }
  
  next();
}

module.exports = {
  applySecurityUltra,
  antiAutomation
};
