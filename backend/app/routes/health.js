/**
 * RUTAS DE HEALTH CHECK
 * ======================
 * Endpoints para verificar el estado del sistema
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const odbcPool = require('../config/odbcConfig');

/**
 * GET /health
 * Health check básico
 */
router.get('/', async (req, res) => {
  try {
    // Verificar conexión a base de datos
    let dbStatus = 'disconnected';
    try {
      await odbcPool.query('SELECT 1 AS test');
      dbStatus = 'connected';
    } catch (dbError) {
      logger.error('Error en health check DB:', dbError);
    }
    
    return res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: dbStatus,
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    logger.error('Error en health check:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

module.exports = router;
