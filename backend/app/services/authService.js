/**
 * SERVICIO DE AUTENTICACIÓN - CON FIX DEL BUG DE PDF
 * =====================================================
 * Autenticación de clientes y recuperación de datos
 * 
 * BUG CORREGIDO: MIN(SERIEALBARAN) y MIN(NUMEROALBARAN) calculados
 * independientemente causaban combinaciones inexistentes.
 * 
 * SOLUCIÓN: CTE con ROW_NUMBER() para obtener el primer albarán real.
 */

const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Autenticar cliente con código y email
 */
async function authenticateClient(codigoCliente, email) {
  try {
    logger.info('🔐 Intento de autenticación', { codigoCliente, email });
    
    // Sanitizar inputs
    const codigo = codigoCliente.toString().trim();
    const emailTrim = email.trim().toLowerCase();
    
    // Query para buscar cliente
    const query = `
      SELECT 
        CODIGOCLIENTE,
        NOMBRECLIENTE,
        DIRECCIONCLIENTE,
        POBLACIONCLIENTE,
        PROVINCIACLIENTE,
        CPCLIENTE,
        EMAILCLIENTE,
        TELEFONOCLIENTE
      FROM CLI
      WHERE TRIM(CODIGOCLIENTE) = ?
        AND TRIM(LOWER(EMAILCLIENTE)) = ?
    `;
    
    const result = await odbcPool.query(query, [codigo, emailTrim]);
    
    if (!result || result.length === 0) {
      logger.warn('⚠️ Cliente no encontrado o email incorrecto', { codigoCliente, email });
      return { success: false, message: 'Credenciales inválidas' };
    }
    
    const cliente = result[0];
    
    // Generar JWT token
    const token = jwt.sign(
      {
        codigoCliente: cliente.CODIGOCLIENTE,
        email: cliente.EMAILCLIENTE,
        nombre: cliente.NOMBRECLIENTE
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: process.env.JWT_EXPIRY || '24h' }
    );
    
    logger.success('✅ Autenticación exitosa', { codigoCliente: cliente.CODIGOCLIENTE });
    
    return {
      success: true,
      token,
      cliente: {
        codigo: cliente.CODIGOCLIENTE,
        nombre: cliente.NOMBRECLIENTE,
        direccion: cliente.DIRECCIONCLIENTE,
        poblacion: cliente.POBLACIONCLIENTE,
        provincia: cliente.PROVINCIACLIENTE,
        cp: cliente.CPCLIENTE,
        email: cliente.EMAILCLIENTE,
        telefono: cliente.TELEFONOCLIENTE
      }
    };
  } catch (error) {
    logger.error('❌ Error en autenticación', error);
    throw error;
  }
}

/**
 * OBTENER FACTURAS DEL CLIENTE - CON FIX DEL BUG
 * ===============================================
 * Usa CTE con ROW_NUMBER() para obtener el primer albarán real
 * de cada factura, evitando combinaciones inexistentes.
 */
async function getClientInvoices(codigoCliente, filters = {}) {
  try {
    logger.info('📄 Obteniendo facturas del cliente', { codigoCliente, filters });
    
    const { ejercicio, serie, estado } = filters;
    
    // CTE para obtener primer albarán real de cada factura
    let query = `
      WITH PrimerAlbaran AS (
        SELECT 
          LAC.SERIEFACTURA,
          LAC.NUMEROFACTURA,
          LAC.EJERCICIOFACTURA,
          LAC.SERIEALBARAN,
          LAC.NUMEROALBARAN,
          ROW_NUMBER() OVER (
            PARTITION BY LAC.SERIEFACTURA, LAC.NUMEROFACTURA, LAC.EJERCICIOFACTURA
            ORDER BY LAC.SERIEALBARAN, LAC.NUMEROALBARAN
          ) AS rn
        FROM LAC
        WHERE TRIM(LAC.CODIGOCLIENTEFACTURA) = ?
      )
      SELECT 
        CAC.SERIEFACTURA,
        CAC.NUMEROFACTURA,
        CAC.EJERCICIOFACTURA,
        CAC.FECHAFACTURA,
        CAC.TOTALFACTURA,
        CAC.CODIGOCLIENTEFACTURA,
        CAC.NOMBRECLIENTEFACTURA,
        PA.SERIEALBARAN,
        PA.NUMEROALBARAN,
        CASE 
          WHEN EXISTS (
            SELECT 1 FROM CCC 
            WHERE CCC.SERIEFACTURA = CAC.SERIEFACTURA 
              AND CCC.NUMEROFACTURA = CAC.NUMEROFACTURA
              AND CCC.EJERCICIOFACTURA = CAC.EJERCICIOFACTURA
              AND CCC.PENDIENTE > 0
          ) THEN 'Pendiente'
          ELSE 'Pagada'
        END AS ESTADOPAGO
      FROM CAC
      LEFT JOIN PrimerAlbaran PA ON 
        PA.SERIEFACTURA = CAC.SERIEFACTURA 
        AND PA.NUMEROFACTURA = CAC.NUMEROFACTURA
        AND PA.EJERCICIOFACTURA = CAC.EJERCICIOFACTURA
        AND PA.rn = 1
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
    `;
    
    const params = [codigoCliente, codigoCliente];
    
    // Aplicar filtros opcionales
    if (ejercicio) {
      query += ` AND CAC.EJERCICIOFACTURA = ?`;
      params.push(ejercicio);
    }
    
    if (serie) {
      query += ` AND CAC.SERIEFACTURA = ?`;
      params.push(serie);
    }
    
    if (estado) {
      if (estado === 'Pendiente') {
        query += ` AND EXISTS (
          SELECT 1 FROM CCC 
          WHERE CCC.SERIEFACTURA = CAC.SERIEFACTURA 
            AND CCC.NUMEROFACTURA = CAC.NUMEROFACTURA
            AND CCC.EJERCICIOFACTURA = CAC.EJERCICIOFACTURA
            AND CCC.PENDIENTE > 0
        )`;
      } else if (estado === 'Pagada') {
        query += ` AND NOT EXISTS (
          SELECT 1 FROM CCC 
          WHERE CCC.SERIEFACTURA = CAC.SERIEFACTURA 
            AND CCC.NUMEROFACTURA = CAC.NUMEROFACTURA
            AND CCC.EJERCICIOFACTURA = CAC.EJERCICIOFACTURA
            AND CCC.PENDIENTE > 0
        )`;
      }
    }
    
    query += ` ORDER BY CAC.FECHAFACTURA DESC, CAC.NUMEROFACTURA DESC`;
    
    const result = await odbcPool.query(query, params);
    
    logger.success(`✅ Facturas obtenidas: ${result.length}`, { codigoCliente });
    
    return result;
  } catch (error) {
    logger.error('❌ Error obteniendo facturas', error);
    throw error;
  }
}

/**
 * Verificar token JWT
 */
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
    return { valid: true, data: decoded };
  } catch (error) {
    logger.warn('⚠️ Token inválido', { error: error.message });
    return { valid: false, error: error.message };
  }
}

module.exports = {
  authenticateClient,
  getClientInvoices,
  verifyToken
};
