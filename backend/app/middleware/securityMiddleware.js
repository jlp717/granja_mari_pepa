/**
 * MIDDLEWARE DE SEGURIDAD
 * ========================
 * Protección contra ataques comunes (XSS, SQLi, etc.)
 */

const logger = require('../utils/logger');
const { containsMaliciousPattern } = require('../utils/validators');

/**
 * Detectar patrones maliciosos en el request
 */
function detectMaliciousPatterns(req, res, next) {
  try {
    // Verificar body
    if (req.body) {
      for (const [key, value] of Object.entries(req.body)) {
        if (typeof value === 'string' && containsMaliciousPattern(value)) {
          logger.warn('⚠️ Patrón malicioso detectado en body', { 
            key, 
            value,
            ip: req.ip 
          });
          return res.status(400).json({ 
            success: false, 
            message: 'Input inválido detectado' 
          });
        }
      }
    }
    
    // Verificar query params
    if (req.query) {
      for (const [key, value] of Object.entries(req.query)) {
        if (typeof value === 'string' && containsMaliciousPattern(value)) {
          logger.warn('⚠️ Patrón malicioso detectado en query', { 
            key, 
            value,
            ip: req.ip 
          });
          return res.status(400).json({ 
            success: false, 
            message: 'Input inválido detectado' 
          });
        }
      }
    }
    
    next();
  } catch (error) {
    logger.error('❌ Error en detectMaliciousPatterns', error);
    next(error);
  }
}

/**
 * Logging de requests
 */
function logRequest(req, res, next) {
  const start = Date.now();
  
  // Capturar el final del request
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    logger.info('📡 Request procesado', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  
  next();
}

/**
 * Validar Content-Type para POST/PUT
 */
function validateContentType(req, res, next) {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      logger.warn('⚠️ Content-Type inválido', { 
        contentType,
        ip: req.ip 
      });
      return res.status(415).json({ 
        success: false, 
        message: 'Content-Type debe ser application/json' 
      });
    }
  }
  
  next();
}

/**
 * Sanitizar inputs
 */
function sanitizeInputs(req, res, next) {
  // Sanitizar body
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = req.body[key].trim();
      }
    }
  }
  
  // Sanitizar query
  if (req.query && typeof req.query === 'object') {
    for (const key in req.query) {
      if (typeof req.query[key] === 'string') {
        req.query[key] = req.query[key].trim();
      }
    }
  }
  
  next();
}

module.exports = {
  detectMaliciousPatterns,
  logRequest,
  validateContentType,
  sanitizeInputs
};
