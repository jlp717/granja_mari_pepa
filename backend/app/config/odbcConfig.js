/**
 * CONFIGURACIÓN DE CONEXIÓN ODBC
 * ================================
 * Pool de conexiones a SQL Server/Access via ODBC
 */

require('dotenv').config();
const odbc = require('odbc');
const logger = require('../utils/logger');

// Pool de conexiones ODBC
const connectionString = process.env.ODBC_CONNECTION_STRING || 'DSN=GMP;UID=JAVIER;PWD=JAVIER';

let pool;

/**
 * Inicializar pool de conexiones
 */
async function initPool() {
  try {
    pool = await odbc.pool({
      connectionString,
      connectionTimeout: 10,
      loginTimeout: 10
    });

    logger.info('✅ Pool ODBC inicializado correctamente');
    return pool;
  } catch (error) {
    logger.error('❌ Error inicializando pool ODBC:', error);
    throw error;
  }
}

/**
 * Obtener conexión del pool
 */
async function getConnection() {
  try {
    if (!pool) {
      await initPool();
    }
    return await pool.connect();
  } catch (error) {
    logger.error('❌ Error obteniendo conexión:', error);
    throw error;
  }
}

/**
 * Ejecutar query con manejo de errores
 */
/**
 * Ejecutar query con manejo de errores y RETRY automático
 */
async function query(sql, params = []) {
  const MAX_RETRIES = 3;
  let retryCount = 0;
  let lastError;

  while (retryCount < MAX_RETRIES) {
    let connection;
    try {
      connection = await getConnection();
      const result = await connection.query(sql, params);
      return result;
    } catch (error) {
      lastError = error;

      // Check for connection errors (Communication link failure, etc.)
      // 08S01: Link failure
      // 08003: Connection not open
      // 10054: Connection reset by peer
      // 40001: Deadlock (sometimes worth retrying)
      const isConnectionError =
        (error.odbcErrors && error.odbcErrors.some(e => ['08S01', '08003', '08S02', '40001'].includes(e.state) || e.code === 10054)) ||
        error.message?.includes('Communication link failure') ||
        error.message?.includes('Connection reset') ||
        error.message?.includes('not connected');

      if (isConnectionError) {
        retryCount++;
        logger.warn(`⚠️ Error de conexión ODBC (intento ${retryCount}/${MAX_RETRIES}):`, error.message);

        // Always close the bad connection if it exists
        if (connection) {
          try { await connection.close(); } catch (e) { /* ignore */ }
          connection = null;
        }

        if (retryCount >= MAX_RETRIES) break;

        // Wait before retry (exponential backoff: 200ms, 400ms, 800ms)
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));

        // Optional: If pool looks broken, maybe we should try to re-init it?
        // For now, relying on getting a fresh connection from pool
        continue;
      }

      // If it's not a connection error, throw immediately
      logger.error('❌ Error ejecutando query (No recuperable):', { sql, error: error.message });
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          logger.warn('⚠️ Error cerrando conexión:', closeError);
        }
      }
    }
  }

  logger.error(`❌ Error ejecutando query después de ${MAX_RETRIES} intentos:`, { sql, error: lastError?.message });
  throw lastError;
}

/**
 * Cerrar pool
 */
async function closePool() {
  if (pool) {
    try {
      await pool.close();
      logger.info('✅ Pool ODBC cerrado correctamente');
    } catch (error) {
      logger.error('❌ Error cerrando pool:', error);
    }
  }
}

/**
 * Cerrar pool
 */
async function closePool() {
  if (pool) {
    try {
      await pool.close();
      logger.info('✅ Pool ODBC cerrado correctamente');
    } catch (error) {
      logger.error('❌ Error cerrando pool:', error);
    }
  }
}

/**
 * Inicializar pool (alias de initPool)
 */
async function initialize() {
  return await initPool();
}

/**
 * Cerrar pool (alias de closePool)
 */
async function close() {
  return await closePool();
}

module.exports = {
  initPool,
  getConnection,
  query,
  closePool,
  initialize,
  close,
  get pool() {
    return pool;
  }
};
