/**
 * SESSION SECURITY
 * =================
 * Middlewares de seguridad de sesión con implementaciones funcionales
 */

const logger = require('../utils/logger');

// Store para sesiones
const sessions = new Map();

/**
 * Middleware de timeout de sesión
 */
function sessionTimeoutMiddleware(req, res, next) {
  if (req.user) {
    const userId = req.user.codigoCliente;
    const now = Date.now();
    
    if (!sessions.has(userId)) {
      sessions.set(userId, { lastActivity: now });
    }
    
    const session = sessions.get(userId);
    const timeSinceLastActivity = now - session.lastActivity;
    
    // Timeout de 30 minutos
    if (timeSinceLastActivity > 30 * 60 * 1000) {
      logger.warn('⏰ Sesión expirada por inactividad', { userId });
      sessions.delete(userId);
      return res.status(401).json({
        success: false,
        message: 'Sesión expirada por inactividad'
      });
    }
    
    // Actualizar última actividad
    session.lastActivity = now;
  }
  
  next();
}

/**
 * Detección de hijacking de sesión
 */
function sessionHijackingDetection(req, res, next) {
  if (req.user) {
    const userId = req.user.codigoCliente;
    const userAgent = req.get('user-agent');
    const ip = req.ip;
    
    if (!sessions.has(userId)) {
      sessions.set(userId, { userAgent, ip });
    }
    
    const session = sessions.get(userId);
    
    // Verificar cambios sospechosos
    if (session.userAgent && session.userAgent !== userAgent) {
      logger.warn('⚠️ Cambio de User-Agent detectado', {
        userId,
        oldUA: session.userAgent,
        newUA: userAgent
      });
      // Por ahora solo log, no bloqueamos
    }
    
    if (session.ip && session.ip !== ip) {
      logger.warn('⚠️ Cambio de IP detectado', {
        userId,
        oldIP: session.ip,
        newIP: ip
      });
      // Por ahora solo log, no bloqueamos
    }
    
    // Actualizar sesión
    session.userAgent = userAgent;
    session.ip = ip;
  }
  
  next();
}

/**
 * Protección CSRF
 */
function csrfProtection(req, res, next) {
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const csrfToken = req.get('x-csrf-token') || req.body._csrf;
    
    if (!csrfToken) {
      logger.warn('⚠️ CSRF token faltante', { 
        ip: req.ip, 
        path: req.path, 
        method: req.method 
      });
      // Por ahora solo log, no bloqueamos
    }
  }
  
  next();
}

module.exports = {
  sessionTimeoutMiddleware,
  sessionHijackingDetection,
  csrfProtection
};
