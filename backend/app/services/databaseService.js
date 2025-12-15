/**
 * SERVICIO DE BASE DE DATOS
 * ===========================
 * Queries especializadas para facturas, productos, y datos del cliente
 */

const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');

/**
 * Obtener detalle completo de una factura
 */
async function getInvoiceDetail(serie, numero, ejercicio, codigoCliente) {
  try {
    logger.info('🔍 Obteniendo detalle de factura', { serie, numero, ejercicio, codigoCliente });
    
    // Cabecera de factura
    const headerQuery = `
      SELECT 
        CAC.SERIEFACTURA,
        CAC.NUMEROFACTURA,
        CAC.EJERCICIOFACTURA,
        CAC.FECHAFACTURA,
        CAC.CODIGOCLIENTEFACTURA,
        CAC.NOMBRECLIENTEFACTURA,
        CAC.DIRECCIONCLIENTEFACTURA,
        CAC.POBLACIONCLIENTEFACTURA,
        CAC.PROVINCIACLIENTEFACTURA,
        CAC.CPCLIENTEFACTURA,
        CAC.CIFCLIENTEFACTURA,
        CAC.BASEFACTURA,
        CAC.IVAFACTURA,
        CAC.RECARGOFACTURA,
        CAC.TOTALFACTURA,
        CAC.OBSERVACIONESFACTURA
      FROM CAC
      WHERE CAC.SERIEFACTURA = ?
        AND CAC.NUMEROFACTURA = ?
        AND CAC.EJERCICIOFACTURA = ?
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
    `;
    
    const header = await odbcPool.query(headerQuery, [serie, numero, ejercicio, codigoCliente]);
    
    if (!header || header.length === 0) {
      throw new Error('Factura no encontrada');
    }
    
    // Líneas de factura con productos
    const linesQuery = `
      SELECT 
        LAC.NUMEROLINEA,
        LAC.CODIGOARTICULO,
        LAC.DESCRIPCIONARTICULO,
        LAC.CANTIDADARTICULO,
        LAC.PRECIOARTICULO,
        LAC.PORCENTAJEDESCUENTOARTICULO,
        LAC.PORCENTAJEIVAARTICULO,
        LAC.PORCENTAJERECARGOARTICULO,
        LAC.IMPORTENETOARTICULO,
        LAC.SERIEALBARAN,
        LAC.NUMEROALBARAN
      FROM LAC
      WHERE LAC.SERIEFACTURA = ?
        AND LAC.NUMEROFACTURA = ?
        AND LAC.EJERCICIOFACTURA = ?
        AND TRIM(LAC.CODIGOCLIENTEFACTURA) = ?
      ORDER BY LAC.NUMEROLINEA
    `;
    
    const lines = await odbcPool.query(linesQuery, [serie, numero, ejercicio, codigoCliente]);
    
    // Estado de pago
    const paymentQuery = `
      SELECT 
        CCC.NUMEROVENCIMIENTO,
        CCC.FECHAVENCIMIENTO,
        CCC.IMPORTEVENCIMIENTO,
        CCC.PENDIENTE,
        CCC.FORMAPAGO
      FROM CCC
      WHERE CCC.SERIEFACTURA = ?
        AND CCC.NUMEROFACTURA = ?
        AND CCC.EJERCICIOFACTURA = ?
      ORDER BY CCC.FECHAVENCIMIENTO
    `;
    
    const payments = await odbcPool.query(paymentQuery, [serie, numero, ejercicio]);
    
    logger.success('✅ Detalle de factura obtenido', { serie, numero, ejercicio });
    
    return {
      header: header[0],
      lines: lines || [],
      payments: payments || []
    };
  } catch (error) {
    logger.error('❌ Error obteniendo detalle de factura', error);
    throw error;
  }
}

/**
 * Obtener productos del cliente
 */
async function getClientProducts(codigoCliente, limit = 100) {
  try {
    logger.info('📦 Obteniendo productos del cliente', { codigoCliente, limit });
    
    const query = `
      SELECT DISTINCT TOP ${limit}
        LAC.CODIGOARTICULO,
        LAC.DESCRIPCIONARTICULO,
        AVG(LAC.PRECIOARTICULO) AS PRECIOPROMEDIO,
        SUM(LAC.CANTIDADARTICULO) AS CANTIDADTOTAL,
        COUNT(DISTINCT LAC.NUMEROFACTURA) AS NUMEROFACTURAS,
        MAX(CAC.FECHAFACTURA) AS ULTIMACOMPRA
      FROM LAC
      INNER JOIN CAC ON 
        LAC.SERIEFACTURA = CAC.SERIEFACTURA
        AND LAC.NUMEROFACTURA = CAC.NUMEROFACTURA
        AND LAC.EJERCICIOFACTURA = CAC.EJERCICIOFACTURA
      WHERE TRIM(LAC.CODIGOCLIENTEFACTURA) = ?
      GROUP BY LAC.CODIGOARTICULO, LAC.DESCRIPCIONARTICULO
      ORDER BY ULTIMACOMPRA DESC
    `;
    
    const result = await odbcPool.query(query, [codigoCliente]);
    
    logger.success(`✅ Productos obtenidos: ${result.length}`, { codigoCliente });
    
    return result;
  } catch (error) {
    logger.error('❌ Error obteniendo productos', error);
    throw error;
  }
}

/**
 * Obtener resumen de facturación del cliente
 */
async function getClientSummary(codigoCliente, ejercicio) {
  try {
    logger.info('📊 Obteniendo resumen del cliente', { codigoCliente, ejercicio });
    
    const query = `
      SELECT 
        COUNT(*) AS TOTALFACTURAS,
        SUM(CAC.BASEFACTURA) AS TOTALBASE,
        SUM(CAC.IVAFACTURA) AS TOTALIVA,
        SUM(CAC.TOTALFACTURA) AS TOTALFACTURADO,
        SUM(CASE WHEN EXISTS (
          SELECT 1 FROM CCC 
          WHERE CCC.SERIEFACTURA = CAC.SERIEFACTURA 
            AND CCC.NUMEROFACTURA = CAC.NUMEROFACTURA
            AND CCC.EJERCICIOFACTURA = CAC.EJERCICIOFACTURA
            AND CCC.PENDIENTE > 0
        ) THEN CAC.TOTALFACTURA ELSE 0 END) AS TOTALPENDIENTE
      FROM CAC
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
        ${ejercicio ? 'AND CAC.EJERCICIOFACTURA = ?' : ''}
    `;
    
    const params = ejercicio ? [codigoCliente, ejercicio] : [codigoCliente];
    const result = await odbcPool.query(query, params);
    
    logger.success('✅ Resumen obtenido', { codigoCliente });
    
    return result[0] || {};
  } catch (error) {
    logger.error('❌ Error obteniendo resumen', error);
    throw error;
  }
}

/**
 * Obtener ejercicios disponibles para el cliente
 */
async function getAvailableYears(codigoCliente) {
  try {
    const query = `
      SELECT DISTINCT CAC.EJERCICIOFACTURA
      FROM CAC
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
      ORDER BY CAC.EJERCICIOFACTURA DESC
    `;
    
    const result = await odbcPool.query(query, [codigoCliente]);
    
    return result.map(row => row.EJERCICIOFACTURA);
  } catch (error) {
    logger.error('❌ Error obteniendo ejercicios', error);
    throw error;
  }
}

module.exports = {
  getInvoiceDetail,
  getClientProducts,
  getClientSummary,
  getAvailableYears
};
