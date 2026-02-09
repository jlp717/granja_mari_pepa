/**
 * CONFIGURACIÓN DE CONEXIÓN ODBC - SENIOR RESILIENT EDITION
 * =========================================================
 * Pool de conexiones a IBM i (AS/400) via ODBC con:
 * - Validación automática de conexiones
 * - Heartbeat (Keep-alive) preventivo
 * - Reintento exponencial en fallos de red
 * - Auto-recuperación del pool completo
 */

require('dotenv').config();
const odbc = require('odbc');
const logger = require('../utils/logger');

// Configuración desde .env o valores por defecto senior
const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';
const poolConfig = {
  connectionString,
  initialSize: parseInt(process.env.ODBC_POOL_MIN) || 2,
  maxSize: parseInt(process.env.ODBC_POOL_MAX) || 10,
  connectionTimeout: parseInt(process.env.ODBC_CONNECTION_TIMEOUT) || 10000,
  loginTimeout: parseInt(process.env.ODBC_LOGIN_TIMEOUT) || 5000,
  reuseConnections: true
};

let pool;
let heartbeatInterval;
let isPoolInErrorState = false;

/**
 * Inicializar pool de conexiones
 */
async function initPool() {
  try {
    if (pool) {
      logger.info('🔄 Cerrando pool existente antes de reinicializar...');
      try { await pool.close(); } catch (e) { }
    }

    logger.info('📡 Inicializando pool ODBC con configuración:', {
      min: poolConfig.initialSize,
      max: poolConfig.maxSize,
      timeout: poolConfig.connectionTimeout
    });

    pool = await odbc.pool(poolConfig);
    isPoolInErrorState = false;

    // Iniciar heartbeat si no está activo
    startHeartbeat();

    logger.info('✅ Pool ODBC inicializado correctamente');
    return pool;
  } catch (error) {
    isPoolInErrorState = true;
    logger.error('❌ Error crítico inicializando pool ODBC:', error);
    throw error;
  }
}

/**
 * Sistema de Heartbeat (Keep-alive)
 * En AS/400, las conexiones inactivas suelen ser cortadas por el servidor o el firewall.
 * Este intervalo mantiene las conexiones activas y detecta fallos de red antes de que
 * afecten a una petición de usuario real.
 */
function startHeartbeat() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  // Ejecutar cada 2 minutos (ajustado para ser menos agresivo que el timeout típico de 5-15 min)
  heartbeatInterval = setInterval(async () => {
    if (!pool || isPoolInErrorState) return;

    try {
      // SYSIBM.SYSDUMMY1 es la tabla de sistema estándar para pruebas en IBM i
      await query('SELECT 1 FROM SYSIBM.SYSDUMMY1');
      logger.debug('💓 ODBC Heartbeat: OK');
    } catch (error) {
      logger.warn('💔 ODBC Heartbeat fallido. El pool podría estar dañado:', error.message);
      // Si el heartbeat falla sistemáticamente, marcamos el pool para reinicio
      if (['08S01', '08003', '10054'].some(code => error.message.includes(code))) {
        isPoolInErrorState = true;
      }
    }
  }, 120000); // 2 minutos
}

/**
 * Obtener conexión del pool con validación
 */
async function getConnection() {
  try {
    if (!pool || isPoolInErrorState) {
      logger.info('🚀 Pool no disponible o en estado de error, reinicializando...');
      await initPool();
    }
    return await pool.connect();
  } catch (error) {
    logger.error('❌ Error crítico obteniendo conexión del pool:', error);
    isPoolInErrorState = true;
    throw error;
  }
}

/**
 * Clasificador de errores de conexión ODBC
 */
function isConnectionError(error) {
  const errorState = error.odbcErrors?.[0]?.state || '';
  const errorCode = error.odbcErrors?.[0]?.code || 0;
  const errorMessage = error.message || '';

  return (
    ['08S01', '08003', '08S02', '40001', 'HYT00'].includes(errorState) ||
    [10054, 8405, 10060].includes(errorCode) ||
    errorMessage.includes('Communication link failure') ||
    errorMessage.includes('Connection reset') ||
    errorMessage.includes('not connected') ||
    errorMessage.includes('Error preparing the SQL statement')
  );
}

/**
 * Ejecutar query con manejo de errores persistente (SENIOR RETRY LOGIC)
 */
async function query(sql, params = []) {
  const MAX_RETRIES = 5;
  let retryCount = 0;
  let lastError;

  while (retryCount < MAX_RETRIES) {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.query(sql, params);

      // Si la query tiene éxito, nos aseguramos de que el pool esté marcado como sano
      isPoolInErrorState = false;
      return result;
    } catch (error) {
      lastError = error;

      if (isConnectionError(error)) {
        retryCount++;
        const waitTime = 250 * Math.pow(2, retryCount);

        logger.warn(`⚠️ Error de red/conexión (intento ${retryCount}/${MAX_RETRIES}). Reintentando en ${waitTime}ms...`, {
          code: error.odbcErrors?.[0]?.code,
          state: error.odbcErrors?.[0]?.state
        });

        // Invalidar pool si el error persiste
        if (retryCount >= 2) isPoolInErrorState = true;

        if (connection) {
          try { await connection.close(); } catch (e) { }
          connection = null;
        }

        if (retryCount >= MAX_RETRIES) break;

        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Error de SQL (sintaxis, etc.) - No reintentamos
      logger.error('❌ Error de SQL no recuperable:', {
        sql: sql.substring(0, 50) + '...',
        error: error.message
      });
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          // Ignorar errores de cierre
        }
      }
    }
  }

  logger.error(`❌ Fallo definitivo tras ${MAX_RETRIES} intentos:`, {
    sql: sql.substring(0, 50) + '...',
    error: lastError?.message
  });

  isPoolInErrorState = true; // Marcar pool para reinicio en la próxima llamada
  throw lastError;
}

/**
 * Inicializar pool (alias de initPool)
 */
async function initialize() {
  return await initPool();
}

/**
 * Cerrar pool y limpiar recursos
 */
async function close() {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  if (pool) {
    try {
      await pool.close();
      logger.info('✅ Pool ODBC cerrado correctamente');
    } catch (error) {
      logger.error('❌ Error cerrando pool ODBC:', error);
    }
  }
}

module.exports = {
  initialize,
  getConnection,
  query,
  close,
  // Accessor para el pool crudo si fuera necesario
  get pool() { return pool; }
};
