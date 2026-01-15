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
 * Enviar factura por email con PDF adjunto
 */
async function enviarFacturaPorEmail(req, res) {
  try {
    const { factura, destinatario, clienteNombre } = req.body;
    const codigoCliente = req.user?.codigoCliente;

    if (!codigoCliente) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    if (!factura || !destinatario) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los datos de la factura y el destinatario'
      });
    }

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destinatario)) {
      return res.status(400).json({
        success: false,
        message: 'El email proporcionado no es válido'
      });
    }

    logger.info('📧 Enviando factura por email', {
      factura: factura.serie + '-' + factura.numero_albaran,
      destinatario,
      codigoCliente
    });

    // Validar datos mínimos de factura
    if (!factura.serie || !factura.numero || !factura.ejercicio) {
      return res.status(400).json({
        success: false,
        message: 'Datos de factura incompletos (serie, numero, ejercicio)'
      });
    }

    const serie = factura.serie;
    const numero = factura.numero;
    const ejercicio = factura.ejercicio;

    logger.info('📧 Procesando envío de factura', { serie, numero, ejercicio, destinatario });

    // Obtener detalle completo para generar PDF
    // getInvoiceDetail ya valida si existe y lanza error si no
    let facturaDetail;
    try {
      facturaDetail = await databaseService.getInvoiceDetail(serie, numero, ejercicio, codigoCliente);
    } catch (err) {
      logger.warn('Factura no encontrada para email', { serie, numero, ejercicio });
      return res.status(404).json({
        success: false,
        message: 'La factura solicitada no existe o no pertenece al cliente'
      });
    }

    // Generar PDF
    const pdfBuffer = await pdfService.generateInvoicePDF(facturaDetail);

    // Configurar nodemailer
    const nodemailer = require('nodemailer');

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'mail.mari-pepa.com',
      port: 465, // FORZADO: 465 (SSL) para saltar bloqueos de puerto 587
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'noreply@mari-pepa.com',
        pass: process.env.SMTP_PASSWORD || '6pVyRf3xptxiN3i'
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 10000, // 10 segundos
      socketTimeout: 15000 // 15 segundos
    });

    // Formatear datos
    const header = facturaDetail.header || {};
    const dia = String(header.DIAFACTURA || facturaData.DIAFACTURA || '').padStart(2, '0');
    const mes = String(header.MESFACTURA || facturaData.MESFACTURA || '').padStart(2, '0');
    const ano = header.ANOFACTURA || facturaData.ANOFACTURA || ejercicio;
    const fechaFactura = `${dia}/${mes}/${ano}`;
    const totalFactura = parseFloat(header.TOTALFACTURA || facturaData.TOTALFACTURA || 0).toFixed(2);
    const nombreCliente = header.NOMBRECLIENTEFACTURA || clienteNombre || 'Cliente';
    const numeroFactura = `${serie}-${String(numero).padStart(5, '0')}`;

    // Nombre del archivo
    const clientNameClean = nombreCliente.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const filename = `Factura_${serie}_${numero}_${clientNameClean}_${dia}-${mes}-${ano}.pdf`;

    // Template HTML profesional
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;background:#F1F5F9;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <tr><td style="background:linear-gradient(135deg, #1E3A5F 0%, #2D5A87 100%);padding:32px;text-align:center;">
                    <h1 style="color:#FFFFFF;margin:0;font-size:24px;font-weight:600;">
                        🧺 Granja Mari Pepa
                    </h1>
                    <p style="color:#93C5FD;margin:8px 0 0;font-size:14px;">
                        Factura Electrónica
                    </p>
                </td></tr>
                
                <!-- Contenido -->
                <tr><td style="padding:32px;">
                    <!-- Saludo -->
                    <p style="color:#1E293B;font-size:16px;line-height:1.6;margin:0 0 24px;">
                        Hola <strong>${nombreCliente}</strong>,
                    </p>
                    <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 24px;">
                        Te enviamos adjunta tu factura. Puedes descargarla directamente desde este email.
                    </p>
                    
                    <!-- Detalles de la factura -->
                    <table width="100%" cellpadding="0" cellspacing="0" style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:8px;overflow:hidden;margin-bottom:24px;">
                        <tr>
                            <td style="padding:16px;border-bottom:1px solid #E2E8F0;">
                                <span style="color:#64748B;font-size:12px;text-transform:uppercase;">Número de Factura</span><br>
                                <span style="color:#1E293B;font-size:16px;font-weight:600;">${numeroFactura}</span>
                            </td>
                            <td style="padding:16px;border-bottom:1px solid #E2E8F0;text-align:right;">
                                <span style="color:#64748B;font-size:12px;text-transform:uppercase;">Fecha</span><br>
                                <span style="color:#1E293B;font-size:16px;font-weight:600;">${fechaFactura}</span>
                            </td>
                        </tr>
                        <tr>
                            <td colspan="2" style="padding:16px;text-align:center;">
                                <span style="color:#64748B;font-size:12px;text-transform:uppercase;">Importe Total</span><br>
                                <span style="color:#059669;font-size:24px;font-weight:700;">${totalFactura} €</span>
                            </td>
                        </tr>
                    </table>
                    
                    <!-- Nota -->
                    <p style="color:#64748B;font-size:13px;line-height:1.5;margin:0;padding:16px;background:#EFF6FF;border-radius:6px;border-left:4px solid #3B82F6;">
                        📎 El PDF de tu factura está adjunto a este email. Si tienes cualquier pregunta, no dudes en contactarnos.
                    </p>
                </td></tr>
                
                <!-- Footer -->
                <tr><td style="background:#F8FAFC;padding:24px;border-top:1px solid #E2E8F0;text-align:center;">
                    <p style="color:#64748B;font-size:13px;margin:0 0 8px;">
                        <strong>Granja Mari Pepa</strong>
                    </p>
                    <p style="color:#94A3B8;font-size:12px;margin:0;">
                        Tel: 639 77 86 56 · pedidos@mari-pepa.com · www.mari-pepa.com
                    </p>
                </td></tr>
                
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    // Enviar email con PDF adjunto
    const mailOptions = {
      from: '"Granja Mari Pepa" <noreply@mari-pepa.com>',
      to: destinatario,
      subject: `Factura ${numeroFactura} - Granja Mari Pepa`,
      html: htmlTemplate,
      attachments: [
        {
          filename: filename,
          content: pdfBuffer,
          contentType: 'application/pdf'
        }
      ]
    };

    const info = await transporter.sendMail(mailOptions);

    logger.success('✅ Factura enviada por email', {
      messageId: info.messageId,
      destinatario,
      factura: numeroFactura
    });

    return res.json({
      success: true,
      message: `Factura enviada correctamente a ${destinatario}`,
      messageId: info.messageId
    });
  } catch (error) {
    logger.error('❌ Error enviando email', error);
    return res.status(500).json({
      success: false,
      message: 'Error enviando email: ' + (error.message || 'Error desconocido')
    });
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
