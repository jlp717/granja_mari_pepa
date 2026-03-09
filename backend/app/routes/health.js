/**
 * RUTAS DE HEALTH CHECK - SENIOR EDITION
 * =======================================
 * Endpoints para verificar el estado del sistema.
 * Incluye un "deep check" que la DB está realmente accesible.
 * Las métricas se usan por el watchdog externo para decidir reinicios.
 */

const express = require('express');
const router = express.Router();
const logger = require('../utils/logger');
const odbcPool = require('../config/odbcConfig');

/**
 * GET /health
 * Health check con verificación real de la DB.
 * Retorna HTTP 200 si TODO está bien, HTTP 503 si la DB está caída.
 * Esto permite que scripts externos (cron watchdog) reinicien PM2 automáticamente.
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;

  try {
    const dbStart = Date.now();
    await odbcPool.query('SELECT 1 FROM SYSIBM.SYSDUMMY1');
    dbLatencyMs = Date.now() - dbStart;
    dbStatus = 'connected';
  } catch (dbError) {
    logger.error('❌ Health check DB failed:', dbError.message);
    dbStatus = 'error: ' + dbError.message.substring(0, 100);
  }

  // Obtener métricas del pool ODBC
  let poolMetrics = {};
  try {
    poolMetrics = odbcPool.getHealthMetrics();
  } catch (_) { }

  const isHealthy = dbStatus === 'connected';
  const statusCode = isHealthy ? 200 : 503;

  return res.status(statusCode).json({
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    totalLatencyMs: Date.now() - startTime,
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs,
      ...poolMetrics
    },
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + 'MB',
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB'
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

module.exports = router;
