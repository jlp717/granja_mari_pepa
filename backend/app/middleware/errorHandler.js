/**
 * ERROR HANDLER
 * ==============
 * Manejo centralizado de errores
 */

const logger = require('../utils/logger');

/**
 * Middleware para logging de requests
 */
function requestLogger(req, res, next) {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('📡 Request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
}

/**
 * Handler para rutas no encontradas (404)
 */
function notFoundHandler(req, res) {
  logger.warn('⚠️ Ruta no encontrada', { path: req.path });
  return res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
}

/**
 * Handler global de errores
 */
function errorHandler(err, req, res, next) {
  logger.error('❌ Error no manejado', {
    error: err.message,
    stack: err.stack,
    path: req.path
  });
  
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
}

module.exports = {
  requestLogger,
  notFoundHandler,
  errorHandler
};
