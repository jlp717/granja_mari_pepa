/**
 * MIDDLEWARE DE AUTENTICACIÓN
 * =============================
 * Verifica tokens JWT en requests protegidos
 */

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'CAMBIAR-EN-PRODUCCION-POR-SECRETO-MUY-LARGO';

/**
 * Middleware para verificar JWT
 */
function authenticateToken(req, res, next) {
  try {
    // Extraer token del header Authorization O de cookies
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    // Si no hay token en Authorization, buscar en cookies
    if (!token && req.cookies) {
      token = req.cookies.accessToken || req.cookies.access_token;
    }
    
    if (!token) {
      logger.warn('⚠️ Request sin token', { 
        ip: req.ip,
        path: req.path 
      });
      return res.status(401).json({ 
        success: false, 
        message: 'Token no proporcionado' 
      });
    }
    
    // Verificar token con JWT
    jwt.verify(token, JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        logger.warn('⚠️ Token inválido', { 
          ip: req.ip,
          error: err.message 
        });
        return res.status(403).json({ 
          success: false, 
          message: 'Token inválido o expirado' 
        });
      }
      
      // Añadir datos del usuario al request
      req.user = {
        customerId: decoded.customerId,
        customerCode: decoded.customerCode,
        email: decoded.email,
        // Mantener compatibilidad con código legacy
        codigoCliente: decoded.customerCode || decoded.codigoCliente,
        nombre: decoded.nombre
      };
      
      logger.debug('✅ Token verificado', { 
        codigoCliente: req.user.codigoCliente 
      });
      
      next();
    });
  } catch (error) {
    logger.error('❌ Error en authenticateToken', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor' 
    });
  }
}

/**
 * Middleware opcional de autenticación (no falla si no hay token)
 */
function optionalAuth(req, res, next) {
  try {
    // Extraer token del header Authorization O de cookies
    const authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    // Si no hay token en Authorization, buscar en cookies
    if (!token && req.cookies) {
      token = req.cookies.accessToken || req.cookies.access_token;
    }

    // Si no hay token, continuar sin autenticar
    if (!token) {
      logger.debug('🔓 Request sin token (opcional)', { path: req.path });
      return next();
    }

    // Verificar token con JWT
    jwt.verify(token, JWT_ACCESS_SECRET, (err, decoded) => {
      if (err) {
        // Token inválido - continuar sin autenticar (es opcional)
        logger.debug('⚠️ Token inválido en optionalAuth (no crítico)', {
          error: err.message
        });
        return next();
      }

      // Token válido - añadir datos del usuario al request
      req.user = {
        customerId: decoded.customerId,
        customerCode: decoded.customerCode,
        email: decoded.email,
        // Mantener compatibilidad con código legacy
        codigoCliente: decoded.customerCode || decoded.codigoCliente,
        nombre: decoded.nombre
      };

      logger.debug('✅ Usuario autenticado opcionalmente', {
        codigoCliente: req.user.codigoCliente
      });

      next();
    });
  } catch (error) {
    logger.error('❌ Error en optionalAuth', error);
    // No fallar - es middleware opcional
    next();
  }
}

/**
 * Middleware para verificar propiedad de recurso
 */
function requireOwnership(req, res, next) {
  try {
    const codigoCliente = req.params.codigoCliente;
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'No autenticado' });
    }
    
    if (req.user.codigoCliente !== codigoCliente) {
      logger.warn('⚠️ Intento de acceso no autorizado', {
        userCliente: req.user.codigoCliente,
        targetCliente: codigoCliente
      });
      return res.status(403).json({ success: false, message: 'No autorizado' });
    }
    
    next();
  } catch (error) {
    logger.error('❌ Error en requireOwnership', error);
    return res.status(500).json({ success: false, message: 'Error interno' });
  }
}

module.exports = {
  authenticateToken,
  optionalAuth,
  requireOwnership,
  requireAuth: authenticateToken // Alias para compatibilidad
};
