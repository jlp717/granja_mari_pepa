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
const sqlGuard = require('../security/sqlGuard');

// ─── Configuración ───────────────────────────────────────────────
const connectionString = process.env.ODBC_CONNECTION_STRING;
if (!connectionString) {
  throw new Error(
    'ODBC_CONNECTION_STRING no configurada: el backend no puede arrancar sin credenciales por entorno.',
  );
}
const HEARTBEAT_INTERVAL_MS = 90_000;     // 90 segundos (antes de cualquier firewall timeout)
const MAX_CONSECUTIVE_FAILURES = 3;       // Forzar reinicio del pool tras N heartbeats fallidos
const QUERY_TIMEOUT_MS = 30_000;          // Timeout por query individual
const POOL_RECREATE_COOLDOWN_MS = 10 * 60 * 1000; // Enfriamiento: 1 recreación de pool cada 10 min máximo

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
let lastPoolRecreationAt = 0;
let lastPanamarRecreationAt = 0;

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
    lastPoolRecreationAt = Date.now();
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

// ─── Recreación con enfriamiento ─────────────────────────────────

/**
 * Cada socket ODBC abierto deja un QZDASOINIT vivo en el AS/400. Recrear el pool
 * en bucle deja decenas de jobs zombis consumiendo CPU y ralentiza a todos.
 * Aquí se permite como máximo una recreación cada POOL_RECREATE_COOLDOWN_MS.
 */
async function recreatePoolThrottled(reason) {
  const sinceLast = Date.now() - lastPoolRecreationAt;
  if (pool && sinceLast < POOL_RECREATE_COOLDOWN_MS) {
    logger.warn(`⏸️ Recreación de pool aplazada (${reason}): última hace ${Math.round(sinceLast / 1000)}s`);
    return;
  }
  logger.warn(`🔄 Recreando pool (${reason})`);
  try { await createPool(); } catch (e) { logger.error('❌ Recreación de pool fallida:', e.message); }
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

      // Si fallan N consecutivos, recrear el pool (con enfriamiento)
      if (consecutiveHeartbeatFailures >= MAX_CONSECUTIVE_FAILURES) {
        logger.error(`🚨 ${MAX_CONSECUTIVE_FAILURES} heartbeats fallidos consecutivos → Recreación controlada del pool`);
        await recreatePoolThrottled('heartbeats fallidos');
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
    msg.includes('connection is closed')
  );
}

// ─── Query Execution ─────────────────────────────────────────────

/**
 * Ejecutar query con retry inteligente y auto-recovery del pool.
 * 
 * Estrategia:
 * - Intentos 1-2: Reintenta con la conexión normal del pool
 * - Intento 3+: recrea el pool (con enfriamiento) y reintenta
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

      const guardContext = sqlGuard.getContext();
      if (guardContext && guardContext.readOnly) {
        sqlGuard.assertReadOnlySql(sql);
        await connection.query('SET TRANSACTION READ ONLY');
        logger.info('DB_GUARD_SET_TRANSACTION_READ_ONLY', {
          tool: guardContext.tool,
        });
      }

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

        // A partir del intento 3, recrear pool nuevo (con enfriamiento anti-fuga)
        if (attempt >= 3) {
          await recreatePoolThrottled('reintento de query');
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
    lastPanamarRecreationAt = Date.now();
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
 * Recreación del pool PANAMAR con el mismo enfriamiento anti-fuga.
 */
async function recreatePanamarPoolThrottled(reason) {
  const sinceLast = Date.now() - lastPanamarRecreationAt;
  if (panamarPool && sinceLast < POOL_RECREATE_COOLDOWN_MS) {
    logger.warn(`⏸️ Recreación PANAMAR aplazada (${reason}): última hace ${Math.round(sinceLast / 1000)}s`);
    return;
  }
  logger.warn(`🔄 Recreando pool PANAMAR (${reason})`);
  try { await createPanamarPool(); } catch (e) { logger.error('❌ Recreación PANAMAR fallida:', e.message); }
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
        logger.error(`🚨 ${MAX_CONSECUTIVE_FAILURES} heartbeats PANAMAR fallidos → Recreación controlada`);
        await recreatePanamarPoolThrottled('heartbeats fallidos');
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

        // A partir del intento 2, recrear el pool entero (con enfriamiento anti-fuga)
        if (attempt >= 2) {
          await recreatePanamarPoolThrottled('reintento de query');
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
