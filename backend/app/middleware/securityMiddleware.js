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

/**
 * Logger de seguridad
 */
function securityLogger(req, res, next) {
  logger.debug('🔒 Security check', { 
    ip: req.ip, 
    path: req.path, 
    method: req.method 
  });
  next();
}

/**
 * Sanitizar todos los inputs (alias para sanitizeInputs)
 */
function sanitizarTodos(req, res, next) {
  sanitizeInputs(req, res, next);
}

/**
 * Detectar patrones sospechosos (alias para detectMaliciousPatterns)
 */
function detectarPatronesSospechosos(req, res, next) {
  detectMaliciousPatterns(req, res, next);
}

/**
 * Validar datos de login
 */
function validarLogin(req, res, next) {
  const { codigoCliente, email } = req.body;
  if (!codigoCliente || !email) {
    return res.status(400).json({ success: false, message: 'Datos incompletos' });
  }
  next();
}

/**
 * Validar refresh token
 */
function validarRefreshToken(req, res, next) {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ success: false, message: 'Token requerido' });
  }
  next();
}

// Store para rate limiting
const rateLimitStore = new Map();

/**
 * Rate limiter para login
 */
function loginRateLimiter(req, res, next) {
  const ip = req.ip;
  const key = `login_${ip}`;
  const windowMs = 5 * 60 * 1000; // 5 minutos
  const maxRequests = 10;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 0, resetTime: Date.now() + windowMs });
    setTimeout(() => rateLimitStore.delete(key), windowMs);
  }
  
  const data = rateLimitStore.get(key);
  
  if (Date.now() > data.resetTime) {
    data.count = 0;
    data.resetTime = Date.now() + windowMs;
  }
  
  data.count++;
  
  if (data.count > maxRequests) {
    logger.warn('⚠️ Rate limit login excedido', { ip, count: data.count });
    return res.status(429).json({ success: false, message: 'Demasiados intentos de login' });
  }
  
  next();
}

/**
 * Rate limiter para refresh token
 */
function refreshRateLimiter(req, res, next) {
  const ip = req.ip;
  const key = `refresh_${ip}`;
  const windowMs = 15 * 60 * 1000; // 15 minutos
  const maxRequests = 50;
  
  if (!rateLimitStore.has(key)) {
    rateLimitStore.set(key, { count: 0, resetTime: Date.now() + windowMs });
    setTimeout(() => rateLimitStore.delete(key), windowMs);
  }
  
  const data = rateLimitStore.get(key);
  
  if (Date.now() > data.resetTime) {
    data.count = 0;
    data.resetTime = Date.now() + windowMs;
  }
  
  data.count++;
  
  if (data.count > maxRequests) {
    logger.warn('⚠️ Rate limit refresh excedido', { ip, count: data.count });
    return res.status(429).json({ success: false, message: 'Demasiadas peticiones' });
  }
  
  next();
}

module.exports = {
  detectMaliciousPatterns,
  logRequest,
  validateContentType,
  sanitizeInputs,
  securityLogger,
  sanitizarTodos,
  detectarPatronesSospechosos,
  validarLogin,
  validarRefreshToken,
  loginRateLimiter,
  refreshRateLimiter
};
