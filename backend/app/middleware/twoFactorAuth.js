/**
 * TWO FACTOR AUTH
 * ================
 * Autenticación de dos factores con implementación funcional
 */

const logger = require('../utils/logger');

// Store para tokens 2FA
const twoFactorTokens = new Map();
const usersWith2FA = new Set();

/**
 * Requerir 2FA para operaciones sensibles
 */
function require2FAForSensitive(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'No autenticado'
    });
  }
  
  const userId = req.user.codigoCliente;
  
  // Si el usuario tiene 2FA habilitado
  if (usersWith2FA.has(userId)) {
    const token2FA = req.get('x-2fa-token');
    
    if (!token2FA) {
      logger.warn('⚠️ 2FA requerido pero no proporcionado', { userId });
      return res.status(403).json({
        success: false,
        message: '2FA requerido',
        requires2FA: true
      });
    }
    
    // Verificar token 2FA
    const storedToken = twoFactorTokens.get(userId);
    if (!storedToken || storedToken.token !== token2FA) {
      logger.warn('⚠️ Token 2FA inválido', { userId });
      return res.status(403).json({
        success: false,
        message: 'Token 2FA inválido'
      });
    }
    
    // Verificar expiración (5 minutos)
    if (Date.now() - storedToken.timestamp > 5 * 60 * 1000) {
      twoFactorTokens.delete(userId);
      logger.warn('⚠️ Token 2FA expirado', { userId });
      return res.status(403).json({
        success: false,
        message: 'Token 2FA expirado'
      });
    }
    
    logger.info('✅ 2FA verificado', { userId });
  }
  
  next();
}

/**
 * Verificar si se necesita 2FA en login
 */
function needs2FAOnLogin(req, res, next) {
  const { codigoCliente } = req.body;
  
  // Por ahora, solo logging
  // En producción, verificar en BD si el usuario tiene 2FA habilitado
  if (usersWith2FA.has(codigoCliente)) {
    logger.info('🔐 Usuario con 2FA habilitado intentando login', { codigoCliente });
    req.needs2FA = true;
  }
  
  next();
}

/**
 * Generar token 2FA
 */
function generate2FAToken(userId) {
  const token = Math.floor(100000 + Math.random() * 900000).toString(); // 6 dígitos
  twoFactorTokens.set(userId, {
    token,
    timestamp: Date.now()
  });
  
  // Expirar token en 5 minutos
  setTimeout(() => {
    twoFactorTokens.delete(userId);
  }, 5 * 60 * 1000);
  
  return token;
}

/**
 * Habilitar 2FA para usuario
 */
function enable2FA(userId) {
  usersWith2FA.add(userId);
  logger.info('✅ 2FA habilitado', { userId });
}

/**
 * Deshabilitar 2FA para usuario
 */
function disable2FA(userId) {
  usersWith2FA.delete(userId);
  twoFactorTokens.delete(userId);
  logger.info('❌ 2FA deshabilitado', { userId });
}

module.exports = {
  require2FAForSensitive,
  needs2FAOnLogin,
  generate2FAToken,
  enable2FA,
  disable2FA
};
