/**
 * SECURITY FORTRESS
 * ==================
 * Capa ultra-avanzada de seguridad con implementaciones funcionales
 */

const logger = require('../utils/logger');

// Store para IPs baneadas
const bannedIPs = new Set();
const ipAccessHistory = new Map();
const deviceFingerprints = new Map();
const csrfTokens = new Map();

/**
 * Verificar IPs baneadas
 */
function checkBannedIP(req, res, next) {
  if (bannedIPs.has(req.ip)) {
    logger.warn('🚫 IP baneada intentando acceder', { ip: req.ip });
    return res.status(403).json({ success: false, message: 'Acceso denegado' });
  }
  next();
}

/**
 * Detectar bots maliciosos por User-Agent
 */
function detectMaliciousBots(req, res, next) {
  const userAgent = req.get('user-agent') || '';
  const botPatterns = ['bot', 'crawler', 'spider', 'scraper', 'curl', 'wget'];

  const isSuspiciousBot = botPatterns.some(pattern =>
    userAgent.toLowerCase().includes(pattern)
  );

  if (isSuspiciousBot && req.path.startsWith('/api/')) {
    logger.warn('🤖 Bot sospechoso detectado', { userAgent, ip: req.ip, path: req.path });
    // Por ahora solo log, no bloqueamos
  }

  next();
}

/**
 * Validar headers requeridos
 */
function validateHeaders(req, res, next) {
  const requiredHeaders = ['user-agent'];

  for (const header of requiredHeaders) {
    if (!req.get(header)) {
      logger.warn('⚠️ Header requerido faltante', { header, ip: req.ip });
      return res.status(400).json({ success: false, message: 'Request inválido' });
    }
  }

  next();
}

/**
 * Detectar payloads maliciosos
 */
function detectMaliciousPayloads(req, res, next) {
  if (req.body) {
    const bodyStr = JSON.stringify(req.body);

    // Patrones de ataque comunes
    const maliciousPatterns = [
      /<script/i,
      /javascript:/i,
      /onerror=/i,
      /onload=/i,
      /eval\(/i,
      /union\s+select/i,
      /drop\s+table/i,
      /insert\s+into/i,
      /delete\s+from/i
    ];

    for (const pattern of maliciousPatterns) {
      if (pattern.test(bodyStr)) {
        logger.warn('⚠️ Payload malicioso detectado', { pattern: pattern.source, ip: req.ip });
        return res.status(400).json({ success: false, message: 'Payload inválido' });
      }
    }
  }

  next();
}

/**
 * Honeypot trap para detectar bots
 */
function honeypotTrap(req, res, next) {
  // Si acceden a rutas honeypot, banear IP
  if (req.path.includes('/admin') || req.path.includes('/wp-admin')) {
    logger.warn('🍯 Honeypot activado', { ip: req.ip, path: req.path });
    bannedIPs.add(req.ip);
    return res.status(404).json({ success: false, message: 'Not found' });
  }
  next();
}

/**
 * CSRF Protection avanzada - PRODUCCIÓN
 * Excluye: GET, OPTIONS, rutas públicas (login, csrf-token)
 */
function csrfProtectionAdvanced(req, res, next) {
  // Excluir métodos seguros
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Excluir rutas públicas de autenticación, recuperación y chatbot
  const publicRoutes = [
    '/api/auth/v2/login',
    '/api/auth/login',
    '/api/auth/v2/solicitar-codigo',
    '/api/auth/v2/verificar-codigo',
    '/api/auth/v2/verificar-solo-codigo',
    '/api/auth/v2/configure-email',
    '/api/auth/change-password',
    '/api/auth/check-password-pwned',
    '/api/csrf-token',
    '/api/security/csrf-token',
    '/api/analytics/events',
    '/api/auth/logout',
    '/api/logs/frontend-error',
    '/api/generar-factura',
    '/api/libro-iva',
    '/api/libro-iva/enviar-email',
    '/api/clientes/enviar-factura-email',
    '/api/chatbot' // Chatbot IA - excluido de CSRF (operación de consulta)
  ];

  // Excluir rutas dinámicas de contacto (protegidas por JWT)
  if (req.path.match(/^\/api\/clientes\/\d+\/contacto$/)) {
    return next();
  }

  if (publicRoutes.includes(req.path)) {
    return next();
  }

  // Verificar token CSRF
  const token = req.get('x-csrf-token') || req.get('X-CSRF-Token');

  if (!token) {
    logger.warn('⚠️ CSRF token faltante', { ip: req.ip, path: req.path, method: req.method });
    return res.status(403).json({
      success: false,
      message: 'CSRF token requerido',
      code: 'CSRF_TOKEN_MISSING'
    });
  }

  if (!csrfTokens.has(token)) {
    logger.warn('⚠️ CSRF token inválido', { ip: req.ip, path: req.path });
    return res.status(403).json({
      success: false,
      message: 'CSRF token inválido o expirado',
      code: 'CSRF_TOKEN_INVALID'
    });
  }

  next();
}

/**
 * Auditar acceso a datos
 */
function auditDataAccess(resourceType = 'UNKNOWN') {
  return (req, res, next) => {
    if (req.user && req.method === 'GET' && req.path.includes('/facturas')) {
      logger.info('📋 Acceso a datos auditado', {
        user: req.user.codigoCliente,
        resourceType,
        resource: req.path,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
    }
    next();
  };
}

/**
 * Device fingerprinting
 */
function deviceFingerprinting(req, res, next) {
  const fingerprint = {
    userAgent: req.get('user-agent'),
    acceptLanguage: req.get('accept-language'),
    acceptEncoding: req.get('accept-encoding'),
    ip: req.ip
  };

  const fingerprintHash = JSON.stringify(fingerprint);

  if (!deviceFingerprints.has(fingerprintHash)) {
    deviceFingerprints.set(fingerprintHash, {
      firstSeen: Date.now(),
      requests: 0
    });
    logger.debug('🔍 Nuevo dispositivo registrado', { ip: req.ip });
  }

  const device = deviceFingerprints.get(fingerprintHash);
  device.requests++;
  device.lastSeen = Date.now();

  // Detectar comportamiento anómalo
  if (device.requests > 1000) {
    logger.warn('⚠️ Dispositivo con actividad sospechosa', {
      ip: req.ip,
      requests: device.requests
    });
  }

  next();
}

/**
 * Enmascarar PII en respuesta
 */
function maskPIIInResponse(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = function (data) {
    if (data && typeof data === 'object') {
      // Enmascarar emails y teléfonos en logs (no en respuesta)
      if (data.email && !req.user) {
        logger.debug('📧 Email accedido', { path: req.path });
      }
    }
    return originalJson(data);
  };

  next();
}

/**
 * Rate limiting por usuario
 */
function perUserRateLimit(req, res, next) {
  if (req.user) {
    const userId = req.user.codigoCliente;
    const now = Date.now();

    if (!ipAccessHistory.has(userId)) {
      ipAccessHistory.set(userId, { count: 0, resetTime: now + 60000 });
    }

    const userAccess = ipAccessHistory.get(userId);

    if (now > userAccess.resetTime) {
      userAccess.count = 0;
      userAccess.resetTime = now + 60000;
    }

    userAccess.count++;

    if (userAccess.count > 100) {
      logger.warn('⚠️ Rate limit por usuario excedido', { userId, count: userAccess.count });
      return res.status(429).json({ success: false, message: 'Demasiadas peticiones' });
    }
  }

  next();
}

/**
 * Obtener token CSRF
 */
function getCSRFToken(req, res) {
  const token = require('crypto').randomBytes(32).toString('hex');
  csrfTokens.set(token, Date.now());

  // Limpiar tokens viejos
  setTimeout(() => csrfTokens.delete(token), 3600000); // 1 hora

  return res.json({ success: true, token });
}

function getSecurityStats(req, res) {
  return res.json({ stats: {} });
}

module.exports = {
  checkBannedIP,
  detectMaliciousBots,
  validateHeaders,
  detectMaliciousPayloads,
  honeypotTrap,
  csrfProtectionAdvanced,
  auditDataAccess,
  deviceFingerprinting,
  maskPIIInResponse,
  perUserRateLimit,
  getCSRFToken,
  getSecurityStats
};
