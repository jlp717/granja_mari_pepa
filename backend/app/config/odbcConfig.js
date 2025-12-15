/**
 * CONFIGURACIÓN DE CONEXIÓN ODBC
 * ================================
 * Pool de conexiones a SQL Server/Access via ODBC
 */

const odbc = require('odbc');
const logger = require('../utils/logger');

// Pool de conexiones ODBC
const connectionString = 'DSN=ERPUNI';

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
async function query(sql, params = []) {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.query(sql, params);
    return result;
  } catch (error) {
    logger.error('❌ Error ejecutando query:', { sql, error: error.message });
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

module.exports = {
  initPool,
  getConnection,
  query,
  closePool,
  get pool() {
    return pool;
  }
};
