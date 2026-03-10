/**
 * CONTROLADOR PANAMAR
 * ====================
 * Endpoint para consultar documentos con productos PANAMAR (FILTRO03=40)
 * usando precios de TARIFA 85. Solo accesible por cliente 9999999999.
 *
 * Incluye: listado, resumen, PDF (descarga/preview), envío por email
 */

const panamarService = require('../services/panamarService');
const panamarPdfService = require('../services/panamarPdfService');
const panamarBulkService = require('../services/panamarBulkService');
const logger = require('../utils/logger');

/**
 * GET /api/panamar/documents
 *
 * Query params:
 *   page, pageSize, fechaDesde, fechaHasta,
 *   codigoCliente (del cliente destino, resolved), busqueda, ejercicio, meses
 */
async function getDocuments(req, res) {
  try {
    const codigoCliente = req.user?.codigoCliente;

    // Verificar que es el cliente PANAMAR
    if (!panamarService.isPanamarClient(codigoCliente)) {
      logger.warn('🚫 PANAMAR: Acceso denegado', { codigoCliente });
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Este endpoint es exclusivo para el modo PANAMAR.'
      });
    }

    const {
      page,
      pageSize,
      fechaDesde,
      fechaHasta,
      codigoCliente: clienteDestino,
      busqueda,
      ejercicio,
      meses
    } = req.query;

    // Parsear meses (viene como "1,3,5" o como array)
    let mesesArray;
    if (meses) {
      mesesArray = (Array.isArray(meses) ? meses : String(meses).split(',')).map(m => parseInt(m)).filter(m => m >= 1 && m <= 12);
      if (mesesArray.length === 0) mesesArray = undefined;
    }

    // Validar formato de fechas si se proporcionan
    if (fechaDesde && !/^\d{4}-\d{2}-\d{2}$/.test(fechaDesde)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fechaDesde inválido. Use YYYY-MM-DD.'
      });
    }
    if (fechaHasta && !/^\d{4}-\d{2}-\d{2}$/.test(fechaHasta)) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fechaHasta inválido. Use YYYY-MM-DD.'
      });
    }

    const result = await panamarService.getDocuments({
      page,
      pageSize,
      fechaDesde,
      fechaHasta,
      codigoCliente: clienteDestino,
      busqueda,
      ejercicio,
      meses: mesesArray
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('❌ PANAMAR: Error obteniendo albaranes', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Error interno al obtener albaranes PANAMAR'
    });
  }
}

/**
 * GET /api/panamar/summary
 *
 * Query params: ejercicio
 */
async function getSummary(req, res) {
  try {
    const codigoCliente = req.user?.codigoCliente;

    if (!panamarService.isPanamarClient(codigoCliente)) {
      logger.warn('🚫 PANAMAR: Acceso denegado a resumen', { codigoCliente });
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Este endpoint es exclusivo para el modo PANAMAR.'
      });
    }

    const { ejercicio, meses, codigoCliente: clienteDestino } = req.query;

    // Parsear meses para summary
    let mesesArray;
    if (meses) {
      mesesArray = (Array.isArray(meses) ? meses : String(meses).split(',')).map(m => parseInt(m)).filter(m => m >= 1 && m <= 12);
      if (mesesArray.length === 0) mesesArray = undefined;
    }

    const result = await panamarService.getSummary({
      ejercicio,
      meses: mesesArray,
      codigoCliente: clienteDestino
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('❌ PANAMAR: Error obteniendo resumen', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Error interno al obtener resumen PANAMAR'
    });
  }
}

/**
 * GET /api/panamar/diagnostics
 * Devuelve diagnóstico exhaustivo de cajas, desglose por mes, etc.
 */
async function diagnostics(req, res) {
  try {
    const codigoCliente = req.user?.codigoCliente;
    if (!panamarService.isPanamarClient(codigoCliente)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    }

    const result = await panamarService.getDiagnostics();
    return res.json({ success: true, ...result });
  } catch (error) {
    logger.error('❌ PANAMAR DIAGNOSTICS error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Health check para endpoint PANAMAR
 */
async function healthCheck(req, res) {
  return res.json({
    success: true,
    service: 'panamar',
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}

// ── Helper: fetch a single PANAMAR document by its key ──────────────
async function fetchSingleDocument(req) {
  const codigoCliente = req.user?.codigoCliente;

  if (!panamarService.isPanamarClient(codigoCliente)) {
    return { error: 403, message: 'Acceso denegado. Este endpoint es exclusivo para el modo PANAMAR.' };
  }

  const { subempresa, ejercicio, serie, terminal, numero } = req.params;

  if (!subempresa || !ejercicio || !serie || !terminal || !numero) {
    return { error: 400, message: 'Parámetros incompletos (subempresa, ejercicio, serie, terminal, numero).' };
  }

  const ejercicioNum = parseInt(ejercicio);
  const terminalNum = parseInt(terminal);
  const numeroNum = parseInt(numero);

  if (isNaN(ejercicioNum) || isNaN(terminalNum) || isNaN(numeroNum)) {
    return { error: 400, message: 'Parámetros numéricos inválidos.' };
  }

  // Use the service to get ONE document by its composite key
  // NOTE: subempresa is VARCHAR (e.g. 'GMP'), NOT a number — do NOT parseInt
  const result = await panamarService.getDocumentByKey({
    subempresa: String(subempresa).trim(),
    ejercicio: ejercicioNum,
    serie: serie.trim(),
    terminal: terminalNum,
    numero: numeroNum
  });

  if (!result) {
    return { error: 404, message: 'Documento no encontrado.' };
  }

  return { doc: result };
}

/**
 * GET /api/panamar/documents/:subempresa/:ejercicio/:serie/:terminal/:numero/pdf
 * Download PDF for a PANAMAR albaran
 */
async function downloadPDF(req, res) {
  try {
    const result = await fetchSingleDocument(req);
    if (result.error) {
      return res.status(result.error).json({ success: false, message: result.message });
    }

    const panamarDoc = result.doc;
    const pdfBuffer = await panamarPdfService.generateAlbaranPDF(panamarDoc);

    const clientName = (panamarDoc.nombreCliente || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const filename = `Albaran_PANAMAR_${panamarDoc.serieAlbaran}-${panamarDoc.numeroAlbaran}_${clientName}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    logger.info('📥 PANAMAR: PDF descargado', { ref: `${panamarDoc.serieAlbaran}-${panamarDoc.numeroAlbaran}` });

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error('❌ PANAMAR: Error generando PDF', { error: error.message, stack: error.stack });
    return res.status(500).json({ success: false, message: 'Error generando PDF del albarán PANAMAR' });
  }
}

/**
 * GET /api/panamar/documents/:subempresa/:ejercicio/:serie/:terminal/:numero/preview
 * Preview PDF inline (Content-Disposition: inline)
 */
async function previewPDF(req, res) {
  try {
    const result = await fetchSingleDocument(req);
    if (result.error) {
      return res.status(result.error).json({ success: false, message: result.message });
    }

    const panamarDoc = result.doc;
    const pdfBuffer = await panamarPdfService.generateAlbaranPDF(panamarDoc);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Content-Length', pdfBuffer.length);

    return res.send(pdfBuffer);
  } catch (error) {
    logger.error('❌ PANAMAR: Error previsualizando PDF', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error previsualizando PDF' });
  }
}

/**
 * POST /api/panamar/documents/:subempresa/:ejercicio/:serie/:terminal/:numero/email
 * Send albaran PDF via email
 * Body: { destinatario: string }
 */
async function sendEmail(req, res) {
  try {
    const result = await fetchSingleDocument(req);
    if (result.error) {
      return res.status(result.error).json({ success: false, message: result.message });
    }

    const { destinatario } = req.body;

    if (!destinatario) {
      return res.status(400).json({ success: false, message: 'Se requiere el email destinatario.' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(destinatario)) {
      return res.status(400).json({ success: false, message: 'El email proporcionado no es válido.' });
    }

    const panamarDoc = result.doc;
    const pdfBuffer = await panamarPdfService.generateAlbaranPDF(panamarDoc);

    const clientName = (panamarDoc.nombreCliente || 'Cliente').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
    const filename = `Albaran_PANAMAR_${panamarDoc.serieAlbaran}-${panamarDoc.numeroAlbaran}_${clientName}.pdf`;
    const docRef = `${panamarDoc.serieAlbaran}-${panamarDoc.numeroAlbaran}`;
    const totalStr = (panamarDoc.totalImportePanamar || 0).toFixed(2);

    // Send email using nodemailer
    const nodemailer = require('nodemailer');

    if (!process.env.SMTP_PASSWORD) {
      return res.status(500).json({ success: false, message: 'Servicio de email no configurado.' });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || '_dc-mx.bef93564e202.mari-pepa.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER || 'noreply@mari-pepa.com',
        pass: process.env.SMTP_PASSWORD
      },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      connectionTimeout: 20000,
      greetingTimeout: 10000,
      socketTimeout: 20000
    });

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;font-family:'Segoe UI',system-ui,sans-serif;background:#F1F5F9;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#FFF;border-radius:8px;border:1px solid #E2E8F0;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background:linear-gradient(135deg,#E67E22 0%,#D35400 100%);padding:28px;text-align:center;">
          <h1 style="color:#FFF;margin:0;font-size:22px;">📦 Albarán PANAMAR</h1>
          <p style="color:#FDEBD0;margin:6px 0 0;font-size:13px;">Granja Mari Pepa</p>
        </td></tr>
        <tr><td style="padding:28px;">
          <p style="color:#1E293B;font-size:15px;line-height:1.5;margin:0 0 20px;">
            Adjunto encontrarás el albarán <strong>${docRef}</strong> del cliente 
            <strong>${panamarDoc.nombreCliente}</strong>.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF7ED;border:1px solid #FDBA74;border-radius:8px;margin-bottom:20px;">
            <tr>
              <td style="padding:14px;border-bottom:1px solid #FDBA74;">
                <span style="color:#9A3412;font-size:11px;text-transform:uppercase;">Albarán</span><br>
                <span style="color:#1E293B;font-size:15px;font-weight:600;">${docRef}</span>
              </td>
              <td style="padding:14px;border-bottom:1px solid #FDBA74;text-align:right;">
                <span style="color:#9A3412;font-size:11px;text-transform:uppercase;">Fecha</span><br>
                <span style="color:#1E293B;font-size:15px;font-weight:600;">${panamarDoc.fecha}</span>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding:14px;text-align:center;">
                <span style="color:#9A3412;font-size:11px;text-transform:uppercase;">Total PANAMAR</span><br>
                <span style="color:#D35400;font-size:22px;font-weight:700;">${totalStr} €</span>
              </td>
            </tr>
          </table>
          <p style="color:#64748B;font-size:12px;line-height:1.4;padding:12px;background:#EFF6FF;border-radius:6px;border-left:4px solid #3B82F6;">
            📎 El PDF del albarán está adjunto a este email.
          </p>
        </td></tr>
        <tr><td style="background:#F8FAFC;padding:20px;border-top:1px solid #E2E8F0;text-align:center;">
          <p style="color:#64748B;font-size:12px;margin:0;">
            <strong>Granja Mari Pepa</strong> · Tel: 639 77 86 56 · www.mari-pepa.com
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

    const mailOptions = {
      from: '"Granja Mari Pepa - PANAMAR" <noreply@mari-pepa.com>',
      to: destinatario,
      subject: `Albarán PANAMAR ${docRef} - Granja Mari Pepa`,
      html: htmlTemplate,
      attachments: [{ filename, content: pdfBuffer, contentType: 'application/pdf' }]
    };

    const info = await transporter.sendMail(mailOptions);

    logger.info('📧 PANAMAR: Albarán enviado por email', {
      ref: docRef, destinatario, messageId: info.messageId
    });

    return res.json({
      success: true,
      message: `Albarán enviado correctamente a ${destinatario}`,
      messageId: info.messageId
    });
  } catch (error) {
    logger.error('❌ PANAMAR: Error enviando email', { error: error.message });
    return res.status(500).json({
      success: false,
      message: 'Error enviando email: ' + (error.message || 'Error desconocido')
    });
  }
}

/**
 * POST /api/panamar/bulk-download/init
 * Inicia una tarea asíncrona de generación de ZIP
 */
async function initBulkDownload(req, res) {
  try {
    const codigoCliente = req.user?.codigoCliente;
    if (!panamarService.isPanamarClient(codigoCliente)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    }

    const { fechaDesde, fechaHasta, codigoCliente: clienteDestino, busqueda, meses } = req.body;

    let mesesArray;
    if (meses) {
      mesesArray = (Array.isArray(meses) ? meses : String(meses).split(',')).map(m => parseInt(m)).filter(m => m >= 1 && m <= 12);
      if (mesesArray.length === 0) mesesArray = undefined;
    }

    // Obtener TODOS los documentos (bypass limit)
    const result = await panamarService.getDocuments({
      page: 1,
      pageSize: 10000,
      bypassMaxLimit: true,
      fechaDesde,
      fechaHasta,
      codigoCliente: clienteDestino,
      busqueda,
      meses: mesesArray
    });

    if (!result.documents || result.documents.length === 0) {
      return res.status(404).json({ success: false, message: 'No hay documentos para descargar.' });
    }

    const taskId = panamarBulkService.createTask(result.documents, codigoCliente);

    return res.json({
      success: true,
      taskId,
      total: result.documents.length
    });

  } catch (error) {
    logger.error('❌ PANAMAR: Error init bulk', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error al iniciar descarga masiva' });
  }
}

/**
 * GET /api/panamar/bulk-download/status/:taskId
 */
async function getBulkStatus(req, res) {
  try {
    const { taskId } = req.params;
    const status = panamarBulkService.getTaskStatus(taskId);

    if (!status) {
      return res.status(404).json({ success: false, message: 'Tarea no encontrada' });
    }

    return res.json({ success: true, ...status });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al consultar estado' });
  }
}

/**
 * GET /api/panamar/bulk-download/retrieve/:taskId
 * Descarga el archivo final
 */
async function retrieveBulkZip(req, res) {
  try {
    const { taskId } = req.params;
    const task = panamarBulkService.tasks.get(taskId);

    if (!task || task.status !== 'completed') {
      return res.status(404).json({ success: false, message: 'Archivo no listo o tarea inexistente' });
    }

    const fs = require('fs');
    if (!fs.existsSync(task.zipPath)) {
      return res.status(404).json({ success: false, message: 'El archivo ya no existe en el servidor' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${task.zipFilename}"`);

    const stream = fs.createReadStream(task.zipPath);
    stream.pipe(res);

    stream.on('end', () => {
      // Opcional: limpiar después de descargar (o esperar al autocleanup de 1h)
      // panamarBulkService.cleanupTask(taskId);
    });

  } catch (error) {
    logger.error('❌ PANAMAR: Error retrieve bulk', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error al descargar archivo' });
  }
}
/**
 * GET /api/panamar/clients
 * Returns distinct clients with PANAMAR albaranes for the dropdown selector.
 */
async function getClients(req, res) {
  try {
    const codigoCliente = req.user?.codigoCliente;

    if (!panamarService.isPanamarClient(codigoCliente)) {
      return res.status(403).json({ success: false, message: 'Acceso denegado.' });
    }

    const clients = await panamarService.getClients();

    return res.json({
      success: true,
      clients
    });
  } catch (error) {
    logger.error('❌ PANAMAR: Error obteniendo clientes', { error: error.message });
    return res.status(500).json({ success: false, message: 'Error interno al obtener clientes' });
  }
}

module.exports = {
  getDocuments,
  getSummary,
  getClients,
  healthCheck,
  downloadPDF,
  previewPDF,
  sendEmail,
  diagnostics,
  initBulkDownload,
  getBulkStatus,
  retrieveBulkZip
};
