/**
 * CONFIGURACIÓN DE CONEXIÓN ODBC - SENIOR RESILIENT EDITION v2
 * =============================================================
 * Pool de conexiones a IBM i (AS/400) via ODBC con:
 * - Heartbeat keep-alive que FUERZA reinicio del pool si falla
 * - Reintento exponencial con backoff en fallos de red
 * - Auto-recuperación completa del pool (destroy + recreate)
 * - Contadores de salud para diagnóstico externo vía /health
 * - Protección contra conexiones zombie/colgadas
 */

require('dotenv').config();
const odbc = require('odbc');
const logger = require('../utils/logger');

// ─── Configuración ───────────────────────────────────────────────
const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
const HEARTBEAT_INTERVAL_MS = 90_000;     // 90 segundos (antes de cualquier firewall timeout)
const MAX_CONSECUTIVE_FAILURES = 3;       // Forzar reinicio del pool tras N heartbeats fallidos
const QUERY_TIMEOUT_MS = 30_000;          // Timeout por query individual

const poolConfig = {
  connectionString,
  initialSize: parseInt(process.env.ODBC_POOL_MIN) || 2,
  maxSize: parseInt(process.env.ODBC_POOL_MAX) || 10,
  connectionTimeout: parseInt(process.env.ODBC_CONNECTION_TIMEOUT) || 10,
  loginTimeout: parseInt(process.env.ODBC_LOGIN_TIMEOUT) || 10,
  reuseConnections: true
};

// ─── Estado interno ──────────────────────────────────────────────
let pool = null;
let heartbeatTimer = null;
let consecutiveHeartbeatFailures = 0;
let poolRecreationInProgress = false;

// Métricas de salud (expuestas vía /health)
const healthMetrics = {
  poolCreatedAt: null,
  lastHeartbeatOk: null,
  lastHeartbeatFail: null,
  totalPoolRecreations: 0,
  totalQueryRetries: 0,
  totalQueriesOk: 0,
  consecutiveHeartbeatFailures: 0
};

// ─── Panamar Pool (UTF-8) ────────────────────────────────────────
// User requested CCSID=1208 only for Panamar
const panamarConnectionString = connectionString.includes('CCSID=')
  ? connectionString
  : `${connectionString}${connectionString.endsWith(';') ? '' : ';'}CCSID=1208;NAM=1;`;

let panamarPool = null;
const panamarHealthMetrics = { ...healthMetrics };
let panamarHeartbeatTimer = null;
let panamarConsecutiveFailures = 0;

// ─── Pool Management ─────────────────────────────────────────────

/**
 * Crear (o recrear) el pool de conexiones ODBC desde cero.
 * Si ya existe un pool, lo cierra primero de forma segura.
 */
async function createPool() {
  // Prevenir recreaciones concurrentes
  if (poolRecreationInProgress) {
    logger.warn('⏳ Recreación del pool ya en progreso, esperando...');
    // Esperar hasta que termine
    for (let i = 0; i < 30; i++) {
      await sleep(1000);
      if (!poolRecreationInProgress) return;
    }
    throw new Error('Timeout esperando recreación del pool');
  }

  poolRecreationInProgress = true;
  try {
    // 1. Cerrar pool viejo de forma segura
    if (pool) {
      logger.info('🔄 Cerrando pool ODBC existente...');
      try { await pool.close(); } catch (_) { }
      pool = null;
    }

    // 2. Crear pool nuevo
    logger.info('📡 Creando pool ODBC...', {
      initialSize: poolConfig.initialSize,
      maxSize: poolConfig.maxSize
    });

    pool = await odbc.pool(poolConfig);
    consecutiveHeartbeatFailures = 0;
    healthMetrics.poolCreatedAt = new Date().toISOString();
    healthMetrics.totalPoolRecreations++;

    logger.info('✅ Pool ODBC creado correctamente (recreación #' + healthMetrics.totalPoolRecreations + ')');

    // 3. (Re)iniciar heartbeat
    startHeartbeat();

  } catch (error) {
    pool = null;
    logger.error('❌ Error creando pool ODBC:', error.message);
    throw error;
  } finally {
    poolRecreationInProgress = false;
  }
}

// ─── Heartbeat (Keep-alive) ──────────────────────────────────────

/**
 * Heartbeat periódico que:
 * 1. Mantiene las conexiones activas (evita que el AS/400 o firewall las cierre)
 * 2. Detecta pools dañados y los recrea automáticamente
 * 3. Actualiza métricas de salud para el endpoint /health
 */
function startHeartbeat() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);

  heartbeatTimer = setInterval(async () => {
    if (!pool) return;

    let conn;
    try {
      conn = await pool.connect();
      await conn.query('SELECT 1 FROM SYSIBM.SYSDUMMY1');
      await conn.close();
      conn = null;

      // Éxito
      consecutiveHeartbeatFailures = 0;
      healthMetrics.lastHeartbeatOk = new Date().toISOString();
      healthMetrics.consecutiveHeartbeatFailures = 0;
      logger.debug('💓 Heartbeat OK');

    } catch (error) {
      if (conn) { try { await conn.close(); } catch (_) { } }

      consecutiveHeartbeatFailures++;
      healthMetrics.lastHeartbeatFail = new Date().toISOString();
      healthMetrics.consecutiveHeartbeatFailures = consecutiveHeartbeatFailures;

      logger.warn(`💔 Heartbeat FAIL #${consecutiveHeartbeatFailures}: ${error.message}`);

      // Si fallan N consecutivos, FORZAR recreación del pool
      if (consecutiveHeartbeatFailures >= MAX_CONSECUTIVE_FAILURES) {
        logger.error(`🚨 ${MAX_CONSECUTIVE_FAILURES} heartbeats fallidos consecutivos → Forzando recreación del pool`);
        try {
          await createPool();
        } catch (e) {
          logger.error('❌ No se pudo recrear el pool:', e.message);
        }
      }
    }
  }, HEARTBEAT_INTERVAL_MS);
}

// ─── Error Classification ────────────────────────────────────────

function isConnectionError(error) {
  const state = error.odbcErrors?.[0]?.state || '';
  const code = error.odbcErrors?.[0]?.code || 0;
  const msg = error.message || '';

  return (
    ['08S01', '08003', '08S02', '40001', 'HYT00', 'HY000'].includes(state) ||
    [10054, 8405, 10060, 10053, 10065].includes(code) ||
    msg.includes('Communication link failure') ||
    msg.includes('Connection reset') ||
    msg.includes('not connected') ||
    msg.includes('connection is closed') ||
    msg.includes('Error preparing the SQL statement')
  );
}

// ─── Query Execution ─────────────────────────────────────────────

/**
 * Ejecutar query con retry inteligente y auto-recovery del pool.
 * 
 * Estrategia:
 * - Intentos 1-2: Reintenta con la conexión normal del pool
 * - Intento 3+: Fuerza recreación del pool y reintenta con pool fresco
 */
async function query(sql, params = []) {
  const MAX_RETRIES = 5;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let connection;
    try {
      // Si no hay pool o se marcó para recreación, crearlo
      if (!pool) await createPool();

      if (!pool) {
        throw new Error('ODBC pool creation failed - pool is still null after createPool()');
      }

      connection = await pool.connect();

      // Ejecutar con timeout de protección
      const result = await Promise.race([
        connection.query(sql, params),
        rejectAfter(QUERY_TIMEOUT_MS, `Query timeout (${QUERY_TIMEOUT_MS}ms)`)
      ]);

      healthMetrics.totalQueriesOk++;
      return result;

    } catch (error) {
      lastError = error;

      if (isConnectionError(error)) {
        healthMetrics.totalQueryRetries++;
        const waitMs = Math.min(500 * Math.pow(2, attempt - 1), 8000);

        logger.warn(`⚠️ Error de conexión (intento ${attempt}/${MAX_RETRIES}), reintentando en ${waitMs}ms`, {
          state: error.odbcErrors?.[0]?.state,
          code: error.odbcErrors?.[0]?.code
        });

        // Cerrar conexión rota
        if (connection) { try { await connection.close(); } catch (_) { } connection = null; }

        // A partir del intento 3, forzar pool nuevo
        if (attempt >= 3) {
          logger.warn('🔄 Forzando recreación del pool en intento ' + attempt);
          try { await createPool(); } catch (_) { }
        }

        if (attempt < MAX_RETRIES) {
          await sleep(waitMs);
          continue;
        }
      } else {
        // Error de SQL (sintaxis, datos, etc.) → no reintentable
        logger.error('❌ Error SQL no recuperable:', {
          sql: sql.substring(0, 80) + '...',
          error: error.message
        });
        throw error;
      }
    } finally {
      if (connection) { try { await connection.close(); } catch (_) { } }
    }
  }

  logger.error(`❌ Fallo definitivo tras ${MAX_RETRIES} intentos:`, {
    sql: sql.substring(0, 80) + '...',
    error: lastError?.message
  });
  throw lastError;
}

// ─── Helpers ─────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function rejectAfter(ms, message) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms));
}

// ─── Panamar Pool Management ──────────────────────────────────────

let panamarPoolRecreating = false;

/**
 * Crear (o recrear) el pool PANAMAR desde cero e iniciar su heartbeat.
 */
async function createPanamarPool() {
  if (panamarPoolRecreating) {
    for (let i = 0; i < 15; i++) {
      await sleep(1000);
      if (!panamarPoolRecreating) return;
    }
    throw new Error('Timeout esperando recreación del pool PANAMAR');
  }

  panamarPoolRecreating = true;
  try {
    if (panamarPool) {
      try { await panamarPool.close(); } catch (_) { }
      panamarPool = null;
    }

    logger.info('📡 Creando pool PANAMAR (CCSID=1208)...');
    panamarPool = await odbc.pool({
      ...poolConfig,
      connectionString: panamarConnectionString,
      initialSize: 1,
      maxSize: 5
    });
    panamarConsecutiveFailures = 0;
    panamarHealthMetrics.poolCreatedAt = new Date().toISOString();
    logger.info('✅ Pool PANAMAR creado correctamente');

    startPanamarHeartbeat();
  } catch (err) {
    panamarPool = null;
    logger.error('❌ Error creando pool PANAMAR:', err.message);
    throw err;
  } finally {
    panamarPoolRecreating = false;
  }
}

/**
 * Heartbeat periódico para el pool PANAMAR.
 * Mantiene las conexiones vivas ante timeouts del AS/400 o firewall.
 */
function startPanamarHeartbeat() {
  if (panamarHeartbeatTimer) clearInterval(panamarHeartbeatTimer);

  panamarHeartbeatTimer = setInterval(async () => {
    if (!panamarPool) return;

    let conn;
    try {
      conn = await panamarPool.connect();
      await conn.query('SELECT 1 FROM SYSIBM.SYSDUMMY1');
      await conn.close();
      conn = null;

      panamarConsecutiveFailures = 0;
      panamarHealthMetrics.lastHeartbeatOk = new Date().toISOString();
      panamarHealthMetrics.consecutiveHeartbeatFailures = 0;
      logger.debug('💓 PANAMAR Heartbeat OK');
    } catch (error) {
      if (conn) { try { await conn.close(); } catch (_) { } }

      panamarConsecutiveFailures++;
      panamarHealthMetrics.lastHeartbeatFail = new Date().toISOString();
      panamarHealthMetrics.consecutiveHeartbeatFailures = panamarConsecutiveFailures;

      logger.warn(`💔 PANAMAR Heartbeat FAIL #${panamarConsecutiveFailures}: ${error.message}`);

      if (panamarConsecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
        logger.error(`🚨 ${MAX_CONSECUTIVE_FAILURES} heartbeats PANAMAR fallidos → Forzando recreación`);
        try { await createPanamarPool(); } catch (e) {
          logger.error('❌ No se pudo recrear el pool PANAMAR:', e.message);
        }
      }
    }
  }, HEARTBEAT_INTERVAL_MS);
}

// ─── Panamar Query Execution ─────────────────────────────────────

/**
 * Ejecutar query específico para Panamar con CCSID=1208 (UTF-8).
 * Incluye auto-recovery del pool ante conexiones muertas.
 */
async function panamarQuery(sql, params = []) {
  if (!panamarPool) {
    await createPanamarPool();
  }

  const MAX_RETRIES = 3;
  let lastError;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    let connection;
    try {
      if (!panamarPool) {
        throw new Error('Panamar pool is null - cannot obtain connection');
      }
      connection = await panamarPool.connect();
      const result = await Promise.race([
        connection.query(sql, params),
        rejectAfter(QUERY_TIMEOUT_MS, `Panamar query timeout (${QUERY_TIMEOUT_MS}ms)`)
      ]);
      return result;
    } catch (error) {
      lastError = error;
      if (isConnectionError(error)) {
        if (connection) { try { await connection.close(); } catch (_) { } connection = null; }

        const waitMs = Math.min(500 * Math.pow(2, attempt - 1), 4000);
        logger.warn(`⚠️ PANAMAR conexión caída (intento ${attempt}/${MAX_RETRIES}), reintentando en ${waitMs}ms`, {
          state: error.odbcErrors?.[0]?.state,
          code: error.odbcErrors?.[0]?.code
        });

        // A partir del intento 2, recrear el pool entero (las conexiones están muertas)
        if (attempt >= 2) {
          logger.warn('🔄 Recreando pool PANAMAR en intento ' + attempt);
          try { await createPanamarPool(); } catch (_) { }
        }

        if (attempt < MAX_RETRIES) {
          await sleep(waitMs);
          continue;
        }
      }
      throw error;
    } finally {
      if (connection) { try { await connection.close(); } catch (_) { } }
    }
  }

  throw lastError;
}

// ─── Public API ──────────────────────────────────────────────────

module.exports = {
  initialize: createPool,
  initializePanamar: createPanamarPool,
  query,
  panamarQuery,
  close: async () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (panamarHeartbeatTimer) clearInterval(panamarHeartbeatTimer);
    if (pool) { try { await pool.close(); } catch (_) { } }
    if (panamarPool) { try { await panamarPool.close(); } catch (_) { } }
    logger.info('✅ Pools ODBC cerrados');
  },
  getHealthMetrics: () => ({ ...healthMetrics, panamar: panamarHealthMetrics }),
  get pool() { return pool; }
};
