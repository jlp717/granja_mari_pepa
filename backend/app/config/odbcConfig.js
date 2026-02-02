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
  const MAX_RETRIES = 5;
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

      // Extract error codes safely
      const errorState = error.odbcErrors?.[0]?.state || '';
      const errorCode = error.odbcErrors?.[0]?.code || 0;
      const errorMessage = error.message || '';

      // Check for connection errors (Communication link failure, etc.)
      const isConnectionError =
        ['08S01', '08003', '08S02', '40001', 'HYT00'].includes(errorState) ||
        errorCode === 10054 ||
        errorMessage.includes('Communication link failure') ||
        errorMessage.includes('Connection reset') ||
        errorMessage.includes('not connected') ||
        errorMessage.includes('Error preparing the SQL statement'); // Often caused by dropped connection

      if (isConnectionError) {
        retryCount++;
        logger.warn(`⚠️ Error de conexión ODBC (intento ${retryCount}/${MAX_RETRIES}): ${errorMessage} [State: ${errorState}, Code: ${errorCode}]`);

        // Force close/destroy the bad connection
        if (connection) {
          try { await connection.close(); } catch (e) { /* ignore */ }
          connection = null; // Ensure we get a fresh one next time
        }

        if (retryCount >= MAX_RETRIES) break;

        // Exponential backoff: 200, 400, 800, 1600, 3200ms
        await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));
        continue;
      }

      // If it's not a connection error (e.g. SQL syntax), throw immediately
      logger.error('❌ Error ejecutando query (No recuperable):', { sql: sql.substring(0, 50) + '...', error: errorMessage });
      throw error;
    } finally {
      if (connection) {
        try {
          await connection.close();
        } catch (closeError) {
          // Ignore close errors
        }
      }
    }
  }

  logger.error(`❌ Error ejecutando query después de ${MAX_RETRIES} intentos:`, { sql: sql.substring(0, 50) + '...', error: lastError?.message });
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
