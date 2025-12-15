/**
 * CONTROLADOR DE FACTURAS
 * =========================
 * Maneja operaciones relacionadas con facturas
 */

const authService = require('../services/authService');
const databaseService = require('../services/databaseService');
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
    
    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="factura-${serie}-${numero}-${ejercicio}.pdf"`);
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

module.exports = {
  getInvoices,
  getInvoiceDetail,
  downloadInvoicePDF,
  getInvoiceSummary,
  getAvailableYears,
  getClientProducts
};
