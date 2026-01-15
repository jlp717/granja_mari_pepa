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

    // Cabecera de factura con JOIN a CLI para datos del cliente
    // IMPORTANTE: CAC tiene múltiples registros por factura (uno por albarán)
    // Por eso usamos GROUP BY y SUM para obtener los totales correctos
    const headerQuery = `
      SELECT
        CAC.SERIEFACTURA,
        CAC.NUMEROFACTURA,
        CAC.EJERCICIOFACTURA,
        MAX(CAC.DIAFACTURA) as DIAFACTURA,
        MAX(CAC.MESFACTURA) as MESFACTURA,
        MAX(CAC.ANOFACTURA) as ANOFACTURA,
        TRIM(CAC.CODIGOCLIENTEFACTURA) as CODIGOCLIENTEFACTURA,
        MAX(CLI.NOMBRECLIENTE) as NOMBRECLIENTEFACTURA,
        MAX(CLI.DIRECCION) as DIRECCIONCLIENTEFACTURA,
        MAX(CLI.POBLACION) as POBLACIONCLIENTEFACTURA,
        MAX(CLI.PROVINCIA) as PROVINCIACLIENTEFACTURA,
        MAX(CLI.CODIGOPOSTAL) as CPCLIENTEFACTURA,
        MAX(CLI.NIF) as CIFCLIENTEFACTURA,
        SUM(CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + CAC.IMPORTEBASEIMPONIBLE3 +
            CAC.IMPORTEBASEIMPONIBLE4 + CAC.IMPORTEBASEIMPONIBLE5) as BASEFACTURA,
        SUM(CAC.IMPORTEIVA1 + CAC.IMPORTEIVA2 + CAC.IMPORTEIVA3 + CAC.IMPORTEIVA4 + CAC.IMPORTEIVA5) as IVAFACTURA,
        SUM(CAC.IMPORTERECARGO1 + CAC.IMPORTERECARGO2 + CAC.IMPORTERECARGO3 +
            CAC.IMPORTERECARGO4 + CAC.IMPORTERECARGO5) as RECARGOFACTURA,
        SUM(CAC.IMPORTETOTAL) as TOTALFACTURA
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.CLI CLI ON TRIM(CAC.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
      WHERE CAC.SERIEFACTURA = ?
        AND CAC.NUMEROFACTURA = ?
        AND CAC.EJERCICIOFACTURA = ?
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
      GROUP BY CAC.SERIEFACTURA, CAC.NUMEROFACTURA, CAC.EJERCICIOFACTURA, TRIM(CAC.CODIGOCLIENTEFACTURA)
    `;

    const header = await odbcPool.query(headerQuery, [serie, numero, ejercicio, codigoCliente]);

    if (!header || header.length === 0) {
      throw new Error('Factura no encontrada');
    }

    // Líneas de factura con productos
    // IMPORTANTE: La tabla DSEDAC.IVA tiene valores obsoletos (7%, 16%).
    // Usamos un CASE para mapear los códigos de IVA a los valores vigentes (10%, 21%, 4%).
    const linesQuery = `
      SELECT
        LAC.SECUENCIA as NUMEROLINEA,
        LAC.CODIGOARTICULO,
        LAC.DESCRIPCION as DESCRIPCIONARTICULO,
        COALESCE(LAC.CANTIDADUNIDADES, 0) as CANTIDADARTICULO,
        LAC.PRECIOVENTA as PRECIOARTICULO,
        LAC.PORCENTAJEDESCUENTO as PORCENTAJEDESCUENTOARTICULO,
        CASE LAC.CODIGOIVA
          WHEN 1 THEN 10.00
          WHEN 2 THEN 21.00
          WHEN 3 THEN 4.00
          WHEN 4 THEN 0.00
          WHEN 5 THEN 10.00
          ELSE 10.00 -- Fallback seguro
        END as PORCENTAJEIVAARTICULO,
        CASE LAC.CODIGOIVA
          WHEN 5 THEN 1.40 -- Recargo de equivalencia para tipo 5 (10% + 1.4%)
          ELSE 0.00
        END as PORCENTAJERECARGOARTICULO,
        LAC.IMPORTEVENTA as IMPORTENETOARTICULO,
        (LAC.IMPORTEVENTA * CASE LAC.CODIGOIVA
          WHEN 1 THEN 0.10
          WHEN 2 THEN 0.21
          WHEN 3 THEN 0.04
          WHEN 4 THEN 0.00
          WHEN 5 THEN 0.10
          ELSE 0.10
        END) as IMPORTEIVAARTICULO,
        (LAC.IMPORTEVENTA * CASE LAC.CODIGOIVA
          WHEN 5 THEN 0.014
          ELSE 0.00
        END) as IMPORTERECARGOARTICULO,
        LAC.SERIEALBARAN,
        LAC.NUMEROALBARAN,
        COALESCE(LAC.CODIGOLOTE, '') as LOTE,
        COALESCE(LAC.CODIGOLOTE, '') as LOTEARTICULO,
        COALESCE(LAC.CANTIDADENVASES, 0) as NUMEROCAJAS,
        COALESCE(LAC.CANTIDADENVASES, 0) as CAJASARTICULO
      FROM DSEDAC.LAC LAC
      INNER JOIN DSEDAC.CAC CAC
        ON CAC.SUBEMPRESAALBARAN = LAC.SUBEMPRESAALBARAN
        AND CAC.EJERCICIOALBARAN = LAC.EJERCICIOALBARAN
        AND CAC.SERIEALBARAN = LAC.SERIEALBARAN
        AND CAC.TERMINALALBARAN = LAC.TERMINALALBARAN
        AND CAC.NUMEROALBARAN = LAC.NUMEROALBARAN
      WHERE TRIM(CAC.SERIEFACTURA) = ?
        AND CAC.NUMEROFACTURA = ?
        AND CAC.EJERCICIOFACTURA = ?
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
        AND LAC.IMPORTEVENTA <> 0
        AND TRIM(LAC.CODIGOARTICULO) <> ''
      ORDER BY LAC.NUMEROALBARAN, LAC.SECUENCIA
    `;

    const lines = await odbcPool.query(linesQuery, [serie, numero, ejercicio, codigoCliente]);

    // NO sobrescribir PORCENTAJEIVAARTICULO: necesitamos soportar multi-IVA.
    // Solo trazamos una muestra de tipos de IVA detectados.
    const ivaRates = [...new Set((lines || []).map(l => Number.parseFloat(l.PORCENTAJEIVAARTICULO) || 0))].sort((a, b) => a - b);
    logger.info('✅ IVA por línea detectado (Corregido)', {
      serie,
      numero,
      ejercicio,
      lineas: lines.length,
      ivaRates: ivaRates.slice(0, 10)
    });

    // Estado de pago - COLUMNAS REALES de DSEDAC.CVC
    const paymentQuery = `
      SELECT
        CVC.NUMERODOCUMENTO as NUMEROVENCIMIENTO,
        CAST(CAST(CVC.ANOVENCIMIENTO AS CHAR(4)) || '-' ||
             LPAD(CAST(CVC.MESVENCIMIENTO AS CHAR(2)), 2, '0') || '-' ||
             LPAD(CAST(CVC.DIAVENCIMIENTO AS CHAR(2)), 2, '0') AS DATE) as FECHAVENCIMIENTO,
        CVC.IMPORTEVENCIMIENTO,
        CVC.IMPORTEPENDIENTE as PENDIENTE,
        CVC.CODIGOFORMAPAGO as FORMAPAGO
      FROM DSEDAC.CVC
      WHERE TRIM(CVC.SERIEDOCUMENTO) = ?
        AND CVC.NUMERODOCUMENTO = ?
        AND CVC.EJERCICIODOCUMENTO = ?
      ORDER BY CVC.ANOVENCIMIENTO, CVC.MESVENCIMIENTO, CVC.DIAVENCIMIENTO
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
 * Obtener productos del cliente - OPTIMIZADO
 */
async function getClientProducts(codigoCliente, limit = 100) {
  try {
    logger.info('📦 Obteniendo productos del cliente', { codigoCliente, limit });

    // Consulta optimizada: calculamos importe total directamente
    // Usamos EJERCICIOALBARAN en vez de EJERCICIOFACTURA porque las líneas
    // de albarán pueden tener EJERCICIOFACTURA = 0 si no están facturadas
    const query = `
      SELECT
        TRIM(LAC.CODIGOARTICULO) AS CODIGOARTICULO,
        TRIM(LAC.DESCRIPCION) AS DESCRIPCION,
        AVG(LAC.PRECIOVENTA) AS PRECIOPROMEDIO,
        SUM(ABS(LAC.CANTIDADUNIDADES)) AS CANTIDADTOTAL,
        SUM(ABS(LAC.IMPORTEVENTA)) AS IMPORTETOTAL,
        COUNT(DISTINCT LAC.NUMEROALBARAN) AS NUMEROPEDIDOS
      FROM DSEDAC.LAC LAC
      WHERE TRIM(LAC.CODIGOCLIENTEFACTURA) = ?
        AND LAC.EJERCICIOALBARAN >= YEAR(CURRENT_DATE) - 2
      GROUP BY TRIM(LAC.CODIGOARTICULO), TRIM(LAC.DESCRIPCION)
      ORDER BY IMPORTETOTAL DESC
      FETCH FIRST ${limit} ROWS ONLY
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
 * Obtener resumen de facturación del cliente (total agregado)
 */
async function getClientSummary(codigoCliente, ejercicio) {
  try {
    logger.info('📊 Obteniendo resumen del cliente', { codigoCliente, ejercicio });

    const query = `
      WITH FacturasUnicas AS (
        SELECT
          TRIM(CAC.SERIEFACTURA) AS SERIE,
          CAC.NUMEROFACTURA AS NUMERO,
          CAC.EJERCICIOFACTURA AS EJERCICIO,
          SUM(CAC.IMPORTEBASEIMPONIBLE1 + CAC.IMPORTEBASEIMPONIBLE2 + CAC.IMPORTEBASEIMPONIBLE3 + CAC.IMPORTEBASEIMPONIBLE4 + CAC.IMPORTEBASEIMPONIBLE5) AS BASE_FACTURA,
          SUM(CAC.IMPORTEIVA1 + CAC.IMPORTEIVA2 + CAC.IMPORTEIVA3 + CAC.IMPORTEIVA4 + CAC.IMPORTEIVA5) AS IVA_FACTURA,
          SUM(CAC.IMPORTETOTAL) AS TOTAL_FACTURA
        FROM DSEDAC.CAC CAC
        WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
          ${ejercicio ? 'AND CAC.EJERCICIOFACTURA = ?' : ''}
        GROUP BY TRIM(CAC.SERIEFACTURA), CAC.NUMEROFACTURA, CAC.EJERCICIOFACTURA
      )
      SELECT
        COUNT(*) AS TOTALFACTURAS,
        SUM(BASE_FACTURA) AS TOTALBASE,
        SUM(IVA_FACTURA) AS TOTALIVA,
        SUM(TOTAL_FACTURA) AS TOTALFACTURADO
      FROM FacturasUnicas
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
 * Obtener resumen de facturación del cliente agrupado por año
 * Devuelve estadísticas anuales para los últimos 5 años
 */
async function getClientSummaryByYear(codigoCliente) {
  try {
    logger.info('📊 Obteniendo estadísticas por año del cliente', { codigoCliente });

    // CAC contiene múltiples registros por factura (uno por albarán).
    // Para obtener estadísticas por factura (no por registro de albarán)
    // primero agrupamos por factura y calculamos totales por factura,
    // y luego agregamos por año. Esto evita contar albaranes como facturas.
    const query = `
      WITH FacturasUnicas AS (
        SELECT
          TRIM(CAC.SERIEFACTURA) AS SERIE,
          CAC.NUMEROFACTURA AS NUMERO,
          CAC.EJERCICIOFACTURA AS YEAR,
          SUM(CAC.IMPORTETOTAL) AS TOTAL_FACTURA,
          CASE WHEN SUM(COALESCE(CAC.IMPORTECOBRADOPENDIENTE, 0)) = 0 THEN 1 ELSE 0 END AS PAGADA_FLAG
        FROM DSEDAC.CAC CAC
        WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
          AND CAC.NUMEROFACTURA > 0
        GROUP BY TRIM(CAC.SERIEFACTURA), CAC.NUMEROFACTURA, CAC.EJERCICIOFACTURA
      )
      SELECT
        YEAR,
        COUNT(*) AS TOTAL,
        SUM(PAGADA_FLAG) AS PAGADAS,
        COUNT(*) - SUM(PAGADA_FLAG) AS PENDIENTES,
        SUM(CASE WHEN PAGADA_FLAG = 1 THEN TOTAL_FACTURA ELSE 0 END) AS TOTALPAGADAS,
        SUM(CASE WHEN PAGADA_FLAG = 0 THEN TOTAL_FACTURA ELSE 0 END) AS TOTALPENDIENTES
      FROM FacturasUnicas
      WHERE YEAR >= YEAR(CURRENT_DATE) - 4
      GROUP BY YEAR
      ORDER BY YEAR ASC
    `;

    const result = await odbcPool.query(query, [codigoCliente]);

    logger.success(`✅ Estadísticas por año obtenidas: ${result.length} años`, { codigoCliente });

    return result || [];
  } catch (error) {
    logger.error('❌ Error obteniendo estadísticas por año', error);
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
      FROM DSEDAC.CAC CAC
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

/**
 * Método genérico para ejecutar queries SQL
 * Usado por authServiceSecure para operaciones CRUD
 */
async function executeQuery(sql, params = []) {
  try {
    logger.info('🔍 Ejecutando query', { sql: sql.substring(0, 100), paramsCount: params.length });

    const result = await odbcPool.query(sql, params);

    logger.success(`✅ Query ejecutado exitosamente: ${result.length} filas`);

    return result;
  } catch (error) {
    logger.error('❌ Error ejecutando query', error);
    throw error;
  }
}

module.exports = {
  getInvoiceDetail,
  getClientProducts,
  getClientSummary,
  getClientSummaryByYear,
  getAvailableYears,
  executeQuery // Nuevo método para auth service
};
