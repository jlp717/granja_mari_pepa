/**
 * CONTROLADOR DE AUTENTICACIÓN
 * ==============================
 * Maneja login, logout y validación de usuarios
 */

const authService = require('../services/authService');
const logger = require('../utils/logger');
const { isValidClientCode, isValidEmail } = require('../utils/validators');

/**
 * POST /api/auth/login
 * Login de cliente con código y email
 */
async function login(req, res) {
  try {
    const { codigoCliente, email } = req.body;
    
    // Validar inputs
    if (!codigoCliente || !email) {
      return res.status(400).json({
        success: false,
        message: 'Código de cliente y email son requeridos'
      });
    }
    
    if (!isValidClientCode(codigoCliente)) {
      return res.status(400).json({
        success: false,
        message: 'Código de cliente inválido'
      });
    }
    
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Email inválido'
      });
    }
    
    // Intentar autenticación
    const result = await authService.authenticateClient(codigoCliente, email);
    
    if (!result.success) {
      return res.status(401).json(result);
    }
    
    // Login exitoso
    logger.success('✅ Login exitoso', { 
      codigoCliente,
      ip: req.ip 
    });
    
    return res.json(result);
  } catch (error) {
    logger.error('❌ Error en login', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/auth/verify
 * Verificar si un token es válido
 */
async function verifyTokenEndpoint(req, res) {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido'
      });
    }
    
    const verification = authService.verifyToken(token);
    
    if (!verification.valid) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }
    
    return res.json({
      success: true,
      user: verification.data
    });
  } catch (error) {
    logger.error('❌ Error verificando token', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * GET /api/auth/me
 * Obtener información del usuario autenticado
 */
async function getCurrentUser(req, res) {
  try {
    // El usuario ya viene de authenticateToken middleware
    return res.json({
      success: true,
      user: req.user
    });
  } catch (error) {
    logger.error('❌ Error obteniendo usuario actual', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

/**
 * POST /api/auth/logout
 * Logout (por ahora solo logging, JWT es stateless)
 */
async function logout(req, res) {
  try {
    logger.info('👋 Logout', { 
      codigoCliente: req.user?.codigoCliente,
      ip: req.ip 
    });
    
    return res.json({
      success: true,
      message: 'Logout exitoso'
    });
  } catch (error) {
    logger.error('❌ Error en logout', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
}

module.exports = {
  login,
  verifyTokenEndpoint,
  getCurrentUser,
  logout
};
