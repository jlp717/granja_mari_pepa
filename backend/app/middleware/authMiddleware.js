/**
 * MIDDLEWARE DE AUTENTICACIÓN
 * =============================
 * Verifica tokens JWT en requests protegidos
 */

const { verifyToken } = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Middleware para verificar JWT
 */
function authenticateToken(req, res, next) {
  try {
    // Extraer token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
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
    
    // Verificar token
    const verification = verifyToken(token);
    
    if (!verification.valid) {
      logger.warn('⚠️ Token inválido', { 
        ip: req.ip,
        error: verification.error 
      });
      return res.status(403).json({ 
        success: false, 
        message: 'Token inválido o expirado' 
      });
    }
    
    // Añadir datos del usuario al request
    req.user = verification.data;
    
    logger.debug('✅ Token verificado', { 
      codigoCliente: req.user.codigoCliente 
    });
    
    next();
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
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (token) {
    const verification = verifyToken(token);
    if (verification.valid) {
      req.user = verification.data;
    }
  }
  
  next();
}

module.exports = {
  authenticateToken,
  optionalAuth
};
