/**
 * CONTROLADOR DE FACTURAS
 * =========================
 * Maneja operaciones relacionadas con facturas
 */

const authService = require('../services/authService');
const databaseService = require('../services/databaseService');
const odbcPool = require('../config/odbcConfig');
const pdfService = require('../services/pdfService');
const logger = require('../utils/logger');

/**
 * GET /api/facturas
 * Obtener lista de facturas del cliente autenticado
 */
async function getInvoices(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    const { ejercicio, serie, estado } = req.query;
    
    const filters = {};
    if (ejercicio) filters.ejercicio = ejercicio;
    if (serie) filters.serie = serie;
    if (estado) filters.estado = estado;
    
    const facturas = await authService.getClientInvoices(codigoCliente, filters);
    
    return res.json({
      success: true,
      facturas,
      total: facturas.length
    });
  } catch (error) {
    logger.error('❌ Error obteniendo facturas', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo facturas'
    });
  }
}

/**
 * GET /api/facturas/:serie/:numero/:ejercicio
 * Obtener detalle de una factura específica
 */
async function getInvoiceDetail(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    const { serie, numero, ejercicio } = req.params;
    
    const factura = await databaseService.getInvoiceDetail(
      serie,
      numero,
      ejercicio,
      codigoCliente
    );
    
    return res.json({
      success: true,
      factura
    });
  } catch (error) {
    logger.error('❌ Error obteniendo detalle de factura', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo detalle de factura'
    });
  }
}

/**
 * GET /api/facturas/:serie/:numero/:ejercicio/pdf
 * Descargar PDF de una factura
 */
async function downloadInvoicePDF(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    const { serie, numero, ejercicio } = req.params;
    
    logger.info('📥 Solicitud de descarga PDF', { 
      serie, 
      numero, 
      ejercicio,
      codigoCliente 
    });
    
    // Obtener datos de la factura
    const factura = await databaseService.getInvoiceDetail(
      serie,
      numero,
      ejercicio,
      codigoCliente
    );
    
    // Generar PDF
    const pdfBuffer = await pdfService.generateInvoicePDF(factura);

    // Construir nombre de archivo: Factura_F_14074_CLIENTNAME_30-11-2025.pdf
    const header = factura.header || {};
    const clientName = (header.NOMBRECLIENTEFACTURA || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const dia = String(header.DIAFACTURA || '').padStart(2, '0');
    const mes = String(header.MESFACTURA || '').padStart(2, '0');
    const ano = header.ANOFACTURA || ejercicio;
    const filename = `Factura_${serie}_${numero}_${clientName}_${dia}-${mes}-${ano}.pdf`;

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error('❌ Error generando PDF', error);
    return res.status(500).json({
      success: false,
      message: 'Error generando PDF'
    });
  }
}

/**
 * GET /api/facturas/resumen
 * Obtener resumen de facturación del cliente
 */
async function getInvoiceSummary(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    const { ejercicio } = req.query;
    
    // Request summary aggregated per factura única (no por registro de albarán)
    const resumen = await databaseService.getClientSummary(codigoCliente, ejercicio);
    
    return res.json({
      success: true,
      resumen
    });
  } catch (error) {
    logger.error('❌ Error obteniendo resumen', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo resumen'
    });
  }
}

/**
 * GET /api/facturas/ejercicios
 * Obtener años disponibles con facturas
 */
async function getAvailableYears(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    
    const ejercicios = await databaseService.getAvailableYears(codigoCliente);
    
    return res.json({
      success: true,
      ejercicios
    });
  } catch (error) {
    logger.error('❌ Error obteniendo ejercicios', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo ejercicios'
    });
  }
}

/**
 * GET /api/facturas/productos
 * Obtener productos comprados por el cliente
 */
async function getClientProducts(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    const limit = parseInt(req.query.limit) || 100;
    
    const productos = await databaseService.getClientProducts(codigoCliente, limit);
    
    return res.json({
      success: true,
      productos,
      total: productos.length
    });
  } catch (error) {
    logger.error('❌ Error obteniendo productos', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo productos'
    });
  }
}

/**
 * POST /api/generar-factura
 * Generar PDF de factura
 */
async function generarFactura(req, res) {
  try {
    const { serie, numero, ejercicio } = req.body;
    const codigoCliente = req.user?.codigoCliente;

    if (!codigoCliente) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!serie || !numero || !ejercicio) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren serie, numero y ejercicio'
      });
    }

    logger.info('📄 Generando PDF de factura', {
      serie,
      numero,
      ejercicio,
      codigoCliente
    });

    const factura = await databaseService.getInvoiceDetail(serie, numero, ejercicio, codigoCliente);
    const pdfBuffer = await pdfService.generateInvoicePDF(factura);

    // Construir nombre de archivo: Factura_F_14074_CLIENTNAME_30-11-2025.pdf
    const header = factura.header || {};
    const clientName = (header.NOMBRECLIENTEFACTURA || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const dia = String(header.DIAFACTURA || '').padStart(2, '0');
    const mes = String(header.MESFACTURA || '').padStart(2, '0');
    const ano = header.ANOFACTURA || ejercicio;
    const filename = `Factura_${serie}_${numero}_${clientName}_${dia}-${mes}-${ano}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    logger.success('✅ PDF de factura generado', { serie, numero, ejercicio, filename });

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error('❌ Error generando factura', error);
    return res.status(500).json({
      success: false,
      message: 'Error generando factura',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
}

/**
 * POST /api/clientes/enviar-factura-email
 * Enviar factura por email
 */
async function enviarFacturaPorEmail(req, res) {
  try {
    const { facturaId, email } = req.body;
    
    logger.info('📧 Enviar factura por email', { facturaId, email });
    
    // Por ahora, simular envío exitoso
    return res.json({ success: true, message: 'Email enviado' });
  } catch (error) {
    logger.error('❌ Error enviando email', error);
    return res.status(500).json({ success: false, message: 'Error enviando email' });
  }
}

/**
 * GET /api/metrics
 * Obtener métricas del sistema
 */
async function obtenerMetricas(req, res) {
  try {
    return res.json({
      success: true,
      metricas: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('❌ Error obteniendo métricas', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo métricas' });
  }
}

/**
 * DELETE /api/cache/factura
 * Invalidar caché de factura
 */
async function invalidarCacheFactura(req, res) {
  try {
    const cacheService = require('../services/cacheService');
    const { key } = req.body;
    
    if (key) {
      cacheService.del(key);
    }
    
    return res.json({ success: true, message: 'Cache invalidado' });
  } catch (error) {
    logger.error('❌ Error invalidando cache', error);
    return res.status(500).json({ success: false, message: 'Error' });
  }
}

/**
 * DELETE /api/cache/all
 * Invalidar todo el caché
 */
async function invalidarTodoCache(req, res) {
  try {
    const cacheService = require('../services/cacheService');
    cacheService.clear();
    
    return res.json({ success: true, message: 'Todo el cache invalidado' });
  } catch (error) {
    logger.error('❌ Error limpiando cache', error);
    return res.status(500).json({ success: false, message: 'Error' });
  }
}

/**
 * GET /api/health
 * Health check
 */
async function healthCheck(req, res) {
  try {
    return res.json({ status: 'ok', service: 'facturas', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

/**
 * GET /api/facturas
 * Obtener todas las facturas del cliente autenticado
 */
async function obtenerFacturasCliente(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    const { ejercicio, mes } = req.query;
    
    let query = `
      SELECT 
        TRIM(SERIEFACTURA) AS SERIE,
        NUMEROFACTURA AS NUMERO,
        EJERCICIOFACTURA AS EJERCICIO,
        ANOFACTURA AS ANO,
        MESFACTURA AS MES,
        DIAFACTURA AS DIA,
        IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + 
        IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5 AS BASE_IMPONIBLE,
        IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5 AS IVA,
        IMPORTETOTAL AS TOTAL,
        CAST(
          CASE 
            WHEN DIAFACTURA < 10 THEN '0' || TRIM(CAST(DIAFACTURA AS CHAR(2)))
            ELSE TRIM(CAST(DIAFACTURA AS CHAR(2)))
          END || '/' ||
          CASE 
            WHEN MESFACTURA < 10 THEN '0' || TRIM(CAST(MESFACTURA AS CHAR(2)))
            ELSE TRIM(CAST(MESFACTURA AS CHAR(2)))
          END || '/' ||
          TRIM(CAST(ANOFACTURA AS CHAR(4)))
        AS VARCHAR(10)) AS FECHA
      FROM DSEDAC.CAC
      WHERE CODIGOCLIENTE = ?
    `;
    
    const params = [codigoCliente];
    
    if (ejercicio) {
      query += ' AND EJERCICIOFACTURA = ?';
      params.push(ejercicio);
    }
    
    if (mes) {
      query += ' AND MESFACTURA = ?';
      params.push(parseInt(mes));
    }
    
    query += ' ORDER BY ANOFACTURA DESC, MESFACTURA DESC, DIAFACTURA DESC, NUMEROFACTURA DESC';
    
    const facturas = await odbcPool.query(query, params);
    
    logger.info(`✅ Facturas obtenidas: ${facturas.length} para cliente ${codigoCliente}`);
    
    return res.json({
      success: true,
      facturas: facturas || [],
      total: facturas ? facturas.length : 0
    });
  } catch (error) {
    logger.error('❌ Error obteniendo facturas del cliente', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo facturas',
      error: error.message
    });
  }
}

/**
 * GET /api/dashboard
 * Obtener estadísticas del dashboard para el cliente autenticado
 */
async function obtenerDashboard(req, res) {
  try {
    const codigoCliente = req.user.codigoCliente;
    const añoActual = new Date().getFullYear();
    const mesActual = new Date().getMonth() + 1;
    
    // Obtener totales del año actual
    // Agrupar por factura única para evitar contar albaranes como facturas
    const queryTotales = `
      WITH FacturasUnicas AS (
        SELECT
          TRIM(SERIEFACTURA) AS SERIE,
          NUMEROFACTURA AS NUMERO,
          EJERCICIOFACTURA AS YEAR,
          SUM(IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 + 
              IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) AS BASE_FACTURA,
          SUM(IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5) AS IVA_FACTURA,
          SUM(IMPORTETOTAL) AS TOTAL_FACTURA
        FROM DSEDAC.CAC
        WHERE CODIGOCLIENTE = ? AND EJERCICIOFACTURA = ?
        GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA, EJERCICIOFACTURA
      )
      SELECT
        COUNT(*) AS NUM_FACTURAS,
        SUM(BASE_FACTURA) AS BASE_TOTAL,
        SUM(IVA_FACTURA) AS IVA_TOTAL,
        SUM(TOTAL_FACTURA) AS TOTAL
      FROM FacturasUnicas
    `;
    
    // Obtener totales del mes actual (agrupando por factura única y filtrando por mes)
    const queryMesActual = `
      WITH FacturasUnicas AS (
        SELECT
          TRIM(SERIEFACTURA) AS SERIE,
          NUMEROFACTURA AS NUMERO,
          EJERCICIOFACTURA AS YEAR,
          MAX(MESFACTURA) AS MES,
          SUM(IMPORTETOTAL) AS TOTAL_FACTURA
        FROM DSEDAC.CAC
        WHERE CODIGOCLIENTE = ? 
          AND EJERCICIOFACTURA = ? 
        GROUP BY TRIM(SERIEFACTURA), NUMEROFACTURA, EJERCICIOFACTURA
      )
      SELECT 
        COUNT(*) AS NUM_FACTURAS,
        SUM(TOTAL_FACTURA) AS TOTAL
      FROM FacturasUnicas
      WHERE MES = ?
    `;
    
    const [totalesAno, totalesMes] = await Promise.all([
      odbcPool.query(queryTotales, [codigoCliente, añoActual]),
      odbcPool.query(queryMesActual, [codigoCliente, añoActual, mesActual])
    ]);
    
    const stats = totalesAno[0] || {};
    const statsMes = totalesMes[0] || {};
    
    logger.info(`✅ Dashboard generado para cliente ${codigoCliente}`);
    
    return res.json({
      success: true,
      dashboard: {
        facturacionTotal: parseFloat(stats.TOTAL || 0).toFixed(2),
        numeroFacturas: parseInt(stats.NUM_FACTURAS || 0),
        ivaTotal: parseFloat(stats.IVA_TOTAL || 0).toFixed(2),
        baseImponible: parseFloat(stats.BASE_TOTAL || 0).toFixed(2),
        mediaFactura: stats.NUM_FACTURAS > 0 
          ? (parseFloat(stats.TOTAL || 0) / parseInt(stats.NUM_FACTURAS)).toFixed(2)
          : '0.00',
        mesActual: {
          numeroFacturas: parseInt(statsMes.NUM_FACTURAS || 0),
          total: parseFloat(statsMes.TOTAL || 0).toFixed(2),
          mes: mesActual,
          año: añoActual
        }
      }
    });
  } catch (error) {
    logger.error('❌ Error generando dashboard', error);
    return res.status(500).json({
      success: false,
      message: 'Error generando dashboard',
      error: error.message
    });
  }
}

module.exports = {
  getInvoices,
  getInvoiceDetail,
  downloadInvoicePDF,
  getInvoiceSummary,
  getAvailableYears,
  getClientProducts,
  generarFactura,
  enviarFacturaPorEmail,
  obtenerMetricas,
  invalidarCacheFactura,
  invalidarTodoCache,
  healthCheck,
  obtenerFacturasCliente,
  obtenerDashboard
};
