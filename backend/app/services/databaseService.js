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

    // Cabecera fiscal oficial: CFC contiene una fila por factura con los
    // totales ya cerrados por el ERP. CAC es por albaran y su suma puede
    // diferir por redondeos entre albaranes.
    const headerQuery = `
      WITH AlbaranCliente AS (
        SELECT
          TRIM(CAC.SERIEFACTURA) AS SERIEFACTURA,
          CAC.NUMEROFACTURA,
          CAC.EJERCICIOFACTURA,
          MAX(TRIM(CAC.CODIGOCLIENTEALBARAN)) AS CODIGOCLIENTEALBARAN
        FROM DSEDAC.CAC CAC
        WHERE TRIM(CAC.SERIEFACTURA) = ?
          AND CAC.NUMEROFACTURA = ?
          AND CAC.EJERCICIOFACTURA = ?
        GROUP BY TRIM(CAC.SERIEFACTURA), CAC.NUMEROFACTURA, CAC.EJERCICIOFACTURA
      )
      SELECT
        CFC.SERIEFACTURA,
        CFC.NUMEROFACTURA,
        CFC.EJERCICIOFACTURA,
        CFC.DIADOCUMENTO as DIAFACTURA,
        CFC.MESDOCUMENTO as MESFACTURA,
        CFC.ANODOCUMENTO as ANOFACTURA,
        TRIM(CFC.CODIGOCLIENTE) as CODIGOCLIENTEFACTURA,
        COALESCE(
          CASE WHEN LENGTH(TRIM(CLI.NOMBREALTERNATIVO)) > 1 THEN TRIM(CLI.NOMBREALTERNATIVO) END,
          CASE WHEN LENGTH(TRIM(CLI.NOMBRECLIENTE)) > 1 THEN TRIM(CLI.NOMBRECLIENTE) END,
          TRIM(CLI.NOMBREALTERNATIVO)
        ) as NOMBRECLIENTEFACTURA,
        CLI.DIRECCION as DIRECCIONCLIENTEFACTURA,
        CLI.POBLACION as POBLACIONCLIENTEFACTURA,
        CLI.PROVINCIA as PROVINCIACLIENTEFACTURA,
        CLI.CODIGOPOSTAL as CPCLIENTEFACTURA,
        CLI.NIF as CIFCLIENTEFACTURA,
        -- Cliente del albarán (para CONTADO y otros casos)
        ALB.CODIGOCLIENTEALBARAN,
        COALESCE(
          CASE WHEN LENGTH(TRIM(CLI_ALB.NOMBREALTERNATIVO)) > 1 THEN TRIM(CLI_ALB.NOMBREALTERNATIVO) END,
          CASE WHEN LENGTH(TRIM(CLI_ALB.NOMBRECLIENTE)) > 1 THEN TRIM(CLI_ALB.NOMBRECLIENTE) END,
          TRIM(CLI_ALB.NOMBREALTERNATIVO)
        ) as NOMBRECLIENTEALBARAN,
        CLI_ALB.DIRECCION as DIRECCIONCLIENTEALBARAN,
        CLI_ALB.POBLACION as POBLACIONCLIENTEALBARAN,
        CFC.IMPORTEBASEIMPONIBLE as BASEFACTURA,
        CFC.IMPORTEIVA as IVAFACTURA,
        CFC.IMPORTERECARGO as RECARGOFACTURA,
        CFC.IMPORTETOTAL as TOTALFACTURA,
        CFC.IMPORTEBASEIMPONIBLE1,
        CFC.PORCENTAJEIVA1,
        CFC.IMPORTEIVA1,
        CFC.IMPORTEBASEIMPONIBLE2,
        CFC.PORCENTAJEIVA2,
        CFC.IMPORTEIVA2,
        CFC.IMPORTEBASEIMPONIBLE3,
        CFC.PORCENTAJEIVA3,
        CFC.IMPORTEIVA3,
        CFC.IMPORTEBASEIMPONIBLE4,
        CFC.PORCENTAJEIVA4,
        CFC.IMPORTEIVA4,
        CFC.IMPORTEBASEIMPONIBLE5,
        CFC.PORCENTAJEIVA5,
        CFC.IMPORTEIVA5
      FROM DSEDAC.CFC CFC
      LEFT JOIN DSEDAC.CLI CLI ON TRIM(CFC.CODIGOCLIENTE) = TRIM(CLI.CODIGOCLIENTE)
      LEFT JOIN AlbaranCliente ALB
        ON TRIM(CFC.SERIEFACTURA) = ALB.SERIEFACTURA
        AND CFC.NUMEROFACTURA = ALB.NUMEROFACTURA
        AND CFC.EJERCICIOFACTURA = ALB.EJERCICIOFACTURA
      LEFT JOIN DSEDAC.CLI CLI_ALB ON TRIM(ALB.CODIGOCLIENTEALBARAN) = TRIM(CLI_ALB.CODIGOCLIENTE)
      WHERE TRIM(CFC.SERIEFACTURA) = ?
        AND CFC.NUMEROFACTURA = ?
        AND CFC.EJERCICIOFACTURA = ?
    `;

    // Removing client check from SQL to diagnose if it's a data mismatch
    const header = await odbcPool.query(headerQuery, [serie, numero, ejercicio, serie, numero, ejercicio]);

    if (!header || header.length === 0) {
      logger.warn('⚠️ Factura no encontrada (ni siquiera sin filtro de cliente). Params:', { serie, numero, ejercicio });
      throw new Error('Factura no encontrada'); // Genuine 404
    }

    const facturaFound = header[0];
    const dbClientCode = facturaFound.CODIGOCLIENTEFACTURA;

    // Strict security check: Ensure the invoice belongs to the requesting client
    // Compare trimmed strings to be safe
    if (String(dbClientCode).trim() !== String(codigoCliente).trim()) {
      // NIF-based relationship check:
      // If the requester has the SAME NIF as the invoice owner, allow access.
      // This handles "Director" accounts, branches, or linked codes.

      const invoiceNif = (facturaFound.CIFCLIENTEFACTURA || '').trim();

      if (invoiceNif) {
        // Fetch requester's NIF
        try {
          const requesterInfo = await odbcPool.query(
            `SELECT NIF FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = ?`,
            [codigoCliente]
          );

          const requesterNif = requesterInfo[0]?.NIF?.trim();

          if (requesterNif && requesterNif === invoiceNif) {
            logger.info('🔓 Acceso autorizado por coincidencia de NIF', {
              solicitante: codigoCliente,
              propietario: dbClientCode,
              nif: requesterNif
            });
            // ALLOW ACCESS (Do not throw)
          } else {
            // Access denied
            logger.warn('⛔ Acceso denegado a factura: Cliente no coincide y NIF diferente', {
              solicitante: codigoCliente,
              propietario: dbClientCode,
              nifSolicitante: requesterNif,
              nifFactura: invoiceNif,
              serie, numero, ejercicio
            });
            throw new Error('Factura no encontrada'); // Return 404 for security
          }
        } catch (err) {
          logger.error('Error verificando relacion de clientes', err);
          throw new Error('Factura no encontrada');
        }
      } else {
        // No NIF on invoice, strict deny
        logger.warn('⛔ Acceso denegado a factura: Cliente no coincide (Sin NIF)', {
          solicitante: codigoCliente,
          propietario: dbClientCode,
          serie, numero, ejercicio
        });
        throw new Error('Factura no encontrada');
      }
    }

    // Líneas de factura con productos
    // IMPORTANTE: La tabla DSEDAC.IVA tiene valores obsoletos (7%, 16%).
    // Usamos un CASE para mapear los códigos de IVA a los valores vigentes (10%, 21%, 4%).
    // 
    // FIX 2026-04-07: Líneas "Sin Cargo" (TIPOVENTA = 'SC') deben tener IMPORTE = 0.
    // El ERP marca estas líneas con TIPOVENTA = 'SC' en la tabla LAC.
    // Se fuerza IMPORTEVENTA a 0 para estas líneas para que no sumen al total del PDF.
    const linesQuery = `
      SELECT
        LAC.SECUENCIA as NUMEROLINEA,
        LAC.CODIGOARTICULO,
        LAC.DESCRIPCION as DESCRIPCIONARTICULO,
        COALESCE(LAC.CANTIDADUNIDADES, 0) as CANTIDADARTICULO,
        LAC.PRECIOVENTA as PRECIOARTICULO,
        LAC.PORCENTAJEDESCUENTO as PORCENTAJEDESCUENTOARTICULO,
        LAC.TIPOVENTA,
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
        -- FIX: Si TIPOVENTA = 'SC' (Sin Cargo), el importe es 0
        CASE 
          WHEN TRIM(LAC.TIPOVENTA) = 'SC' THEN 0
          ELSE LAC.IMPORTEVENTA
        END as IMPORTENETOARTICULO,
        -- El IVA también debe ser 0 para líneas sin cargo
        (CASE 
          WHEN TRIM(LAC.TIPOVENTA) = 'SC' THEN 0
          ELSE LAC.IMPORTEVENTA
        END * CASE LAC.CODIGOIVA
          WHEN 1 THEN 0.10
          WHEN 2 THEN 0.21
          WHEN 3 THEN 0.04
          WHEN 4 THEN 0.00
          WHEN 5 THEN 0.10
          ELSE 0.10
        END) as IMPORTEIVAARTICULO,
        -- El recargo también debe ser 0 para líneas sin cargo
        (CASE 
          WHEN TRIM(LAC.TIPOVENTA) = 'SC' THEN 0
          ELSE LAC.IMPORTEVENTA
        END * CASE LAC.CODIGOIVA
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
        AND TRIM(LAC.CODIGOARTICULO) <> ''
      ORDER BY LAC.NUMEROALBARAN, LAC.SECUENCIA
    `;

    const lines = await odbcPool.query(linesQuery, [serie, numero, ejercicio]);

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
      FROM DSEDAC.CVC CVC
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
      SELECT
        COUNT(*) AS TOTALFACTURAS,
        SUM(CFC.IMPORTEBASEIMPONIBLE) AS TOTALBASE,
        SUM(CFC.IMPORTEIVA) AS TOTALIVA,
        SUM(CFC.IMPORTETOTAL) AS TOTALFACTURADO
      FROM DSEDAC.CFC CFC
      WHERE TRIM(CFC.CODIGOCLIENTE) = ?
        AND CFC.NUMEROFACTURA > 0
        AND CFC.NUMEROFACTURA < 900000
        ${ejercicio ? 'AND CFC.EJERCICIOFACTURA = ?' : ''}
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

    const query = `
      SELECT
        CFC.EJERCICIOFACTURA AS YEAR,
        COUNT(*) AS TOTAL,
        SUM(CASE WHEN COALESCE(P.PENDIENTE, 0) = 0 THEN 1 ELSE 0 END) AS PAGADAS,
        SUM(CASE WHEN COALESCE(P.PENDIENTE, 0) = 0 THEN 0 ELSE 1 END) AS PENDIENTES,
        SUM(CASE WHEN COALESCE(P.PENDIENTE, 0) = 0 THEN CFC.IMPORTETOTAL ELSE 0 END) AS TOTALPAGADAS,
        SUM(CASE WHEN COALESCE(P.PENDIENTE, 0) = 0 THEN 0 ELSE CFC.IMPORTETOTAL END) AS TOTALPENDIENTES
      FROM DSEDAC.CFC CFC
      LEFT JOIN (
        SELECT
          TRIM(SERIEDOCUMENTO) AS SERIE,
          NUMERODOCUMENTO AS NUMERO,
          EJERCICIODOCUMENTO AS EJERCICIO,
          SUM(COALESCE(IMPORTEPENDIENTE, 0)) AS PENDIENTE
        FROM DSEDAC.CVC
        GROUP BY TRIM(SERIEDOCUMENTO), NUMERODOCUMENTO, EJERCICIODOCUMENTO
      ) P
        ON TRIM(CFC.SERIEFACTURA) = P.SERIE
        AND CFC.NUMEROFACTURA = P.NUMERO
        AND CFC.EJERCICIOFACTURA = P.EJERCICIO
      WHERE TRIM(CFC.CODIGOCLIENTE) = ?
        AND CFC.NUMEROFACTURA > 0
        AND CFC.NUMEROFACTURA < 900000
        AND CFC.EJERCICIOFACTURA >= YEAR(CURRENT_DATE) - 4
      GROUP BY CFC.EJERCICIOFACTURA
      ORDER BY CFC.EJERCICIOFACTURA ASC
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
      SELECT DISTINCT CFC.EJERCICIOFACTURA
      FROM DSEDAC.CFC CFC
      WHERE TRIM(CFC.CODIGOCLIENTE) = ?
        AND CFC.NUMEROFACTURA > 0
        AND CFC.NUMEROFACTURA < 900000
      ORDER BY CFC.EJERCICIOFACTURA DESC
    `;

    const result = await odbcPool.query(query, [codigoCliente]);

    // Extraer años de la DB
    const dbYears = result.map(row => Number(row.EJERCICIOFACTURA));

    // Asegurar ventana de 5 años (Año actual + 4 anteriores)
    // Ejemplo en 2026: [2026, 2025, 2024, 2023, 2022]
    const currentYear = new Date().getFullYear();
    const mandantoryYears = Array.from({ length: 5 }, (_, i) => currentYear - i);

    // Combinar años de DB con los obligatorios (Set elimina duplicados)
    const allYears = new Set([...dbYears, ...mandantoryYears]);

    // Retornar ordenados descendente
    return Array.from(allYears).sort((a, b) => b - a);
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

/**
 * Obtener facturas del cliente
 */
async function getInvoices(codigoCliente, limit = 10, offset = 0, ejercicio = null) {
  try {
    logger.info('📄 Obteniendo facturas del cliente', { codigoCliente, limit, offset, ejercicio });

    let query = `
      SELECT
        TRIM(CFC.SERIEFACTURA) AS SERIE,
        CFC.NUMEROFACTURA AS NUMERO,
        CFC.EJERCICIOFACTURA AS EJERCICIO,
        CFC.EJERCICIOFACTURA AS EJERCICIO,
        CAST(
          CASE 
            WHEN CFC.DIADOCUMENTO < 10 THEN '0' || CAST(CFC.DIADOCUMENTO AS VARCHAR(2))
            ELSE CAST(CFC.DIADOCUMENTO AS VARCHAR(2))
          END || '/' ||
          CASE 
            WHEN CFC.MESDOCUMENTO < 10 THEN '0' || CAST(CFC.MESDOCUMENTO AS VARCHAR(2))
            ELSE CAST(CFC.MESDOCUMENTO AS VARCHAR(2))
          END || '/' ||
          CAST(CFC.ANODOCUMENTO AS VARCHAR(4))
        AS VARCHAR(10)) AS FECHA,
        CFC.IMPORTETOTAL AS TOTAL,
        COALESCE(P.PENDIENTE, 0) AS PENDIENTE,
        CASE WHEN COALESCE(P.PENDIENTE, 0) = 0 THEN 'Pagada' ELSE 'Pendiente' END AS ESTADO
      FROM DSEDAC.CFC CFC
      LEFT JOIN (
        SELECT
          TRIM(SERIEDOCUMENTO) AS SERIE,
          NUMERODOCUMENTO AS NUMERO,
          EJERCICIODOCUMENTO AS EJERCICIO,
          SUM(COALESCE(IMPORTEPENDIENTE, 0)) AS PENDIENTE
        FROM DSEDAC.CVC
        GROUP BY TRIM(SERIEDOCUMENTO), NUMERODOCUMENTO, EJERCICIODOCUMENTO
      ) P
        ON TRIM(CFC.SERIEFACTURA) = P.SERIE
        AND CFC.NUMEROFACTURA = P.NUMERO
        AND CFC.EJERCICIOFACTURA = P.EJERCICIO
      WHERE TRIM(CFC.CODIGOCLIENTE) = ?
        AND CFC.NUMEROFACTURA > 0
        AND CFC.NUMEROFACTURA < 900000
        ${ejercicio ? 'AND CFC.EJERCICIOFACTURA = ?' : ''}
      ORDER BY CFC.EJERCICIOFACTURA DESC, CFC.NUMEROFACTURA DESC
      OFFSET ? ROWS FETCH NEXT ? ROWS ONLY
    `;

    const params = [codigoCliente];
    if (ejercicio) params.push(ejercicio);
    params.push(offset, limit);

    const invoices = await odbcPool.query(query, params);

    logger.success(`✅ Facturas obtenidas: ${invoices.length}`, { codigoCliente });

    return invoices;
  } catch (error) {
    logger.error('❌ Error obteniendo facturas', error);
    throw error;
  }
}

/**
 * Contar el total de facturas para un cliente
 */
async function countInvoices(codigoCliente, ejercicio = null) {
  try {
    let query = `
      SELECT COUNT(*) AS TOTAL_ROWS
      FROM DSEDAC.CFC CFC
      WHERE TRIM(CFC.CODIGOCLIENTE) = ?
        AND CFC.NUMEROFACTURA > 0
        AND CFC.NUMEROFACTURA < 900000
        ${ejercicio ? 'AND CFC.EJERCICIOFACTURA = ?' : ''}
    `;

    const params = [codigoCliente];
    if (ejercicio) params.push(ejercicio);

    const result = await odbcPool.query(query, params);
    return result[0].TOTAL_ROWS || 0;
  } catch (error) {
    logger.error('Error counting invoices:', error);
    return 0;
  }
}

/**
 * Obtener estadísticas de consumo del cliente para el Chatbot
 * - Top productos comprados
 * - Gasto mensual últimos 12 meses
 * - Frecuencia de compra
 */
async function getClientConsumptionStats(codigoCliente, months = 12) {
  try {
    const today = new Date();
    const currentYear = today.getFullYear();
    const lastYear = currentYear - 1;

    // 1. Top productos comprados (por importe) en el último año
    // Usamos ALBARANES_LINEAS (LAL) ya que es más directo para consumo real que facturas
    const topProductsQuery = `
      SELECT 
        LAL.CODIGOARTICULO, 
        MAX(LAL.DESCRIPCION) as DESCRIPCION, 
        SUM(LAL.CANTIDADUNIDADES) as UNIDADES, 
        SUM(LAL.IMPORTEVENTA) as IMPORTE_TOTAL,
        COUNT(DISTINCT LAL.NUMEROALBARAN) as VECES_COMPRADO,
        MAX(LAL.FECHAALBARAN) as ULTIMA_COMPRA
      FROM DSEDAC.LAL LAL
      WHERE LAL.CODIGOCLIENTE = ? 
        AND (LAL.ANOALBARAN = ? OR LAL.ANOALBARAN = ?)
      GROUP BY LAL.CODIGOARTICULO
      ORDER BY IMPORTE_TOTAL DESC
      FETCH FIRST 10 ROWS ONLY
    `;

    // 2. Gasto mensual (evolución)
    const monthlySalesQuery = `
      SELECT 
        MESALBARAN as MES, 
        ANOALBARAN as ANO, 
        SUM(IMPORTETOTAL) as TOTAL
      FROM DSEDAC.CAL
      WHERE CODIGOCLIENTE = ? 
        AND (ANOALBARAN = ? OR ANOALBARAN = ?)
      GROUP BY MESALBARAN, ANOALBARAN
      ORDER BY ANOALBARAN DESC, MESALBARAN DESC
      FETCH FIRST 12 ROWS ONLY
    `;

    const [topProducts, monthlySales] = await Promise.all([
      odbcPool.query(topProductsQuery, [codigoCliente, currentYear, lastYear]),
      odbcPool.query(monthlySalesQuery, [codigoCliente, currentYear, lastYear])
    ]);

    return {
      topProducts: topProducts.map(p => ({
        codigo: p.CODIGOARTICULO,
        nombre: p.DESCRIPCION,
        unidades: p.UNIDADES,
        total: p.IMPORTE_TOTAL,
        veces: p.VECES_COMPRADO,
        ultimaCompra: p.ULTIMA_COMPRA // Formato YYYYMMDD
      })),
      monthlySales: monthlySales.map(m => ({
        mes: m.MES,
        ano: m.ANO,
        total: m.TOTAL
      }))
    };

  } catch (error) {
    logger.error('Error getting consumption stats:', error);
    return { topProducts: [], monthlySales: [] };
  }
}

module.exports = {
  getInvoiceDetail,
  getInvoices,
  countInvoices,
  getClientProducts,
  getClientSummary,
  getClientSummaryByYear,
  getAvailableYears,
  executeQuery,
  getClientConsumptionStats // Nueva función exportada
};
