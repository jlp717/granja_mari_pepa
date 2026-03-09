/**
 * CONTROLADOR PANAMAR
 * ====================
 * Endpoint para consultar documentos con productos PANAMAR (FILTRO03=40)
 * usando precios de TARIFA 85. Solo accesible por cliente 9999999999.
 */

const panamarService = require('../services/panamarService');
const logger = require('../utils/logger');

/**
 * GET /api/panamar/documents
 *
 * Query params:
 *   page, pageSize, tipo (albaran|factura), fechaDesde, fechaHasta,
 *   codigoCliente (del cliente destino), busqueda, ejercicio
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
      tipo,
      fechaDesde,
      fechaHasta,
      codigoCliente: clienteDestino,
      busqueda,
      ejercicio
    } = req.query;

    // Validar tipo si se proporciona
    if (tipo && !['albaran', 'factura'].includes(tipo)) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de documento inválido. Use "albaran" o "factura".'
      });
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
      tipo,
      fechaDesde,
      fechaHasta,
      codigoCliente: clienteDestino,
      busqueda,
      ejercicio
    });

    return res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('❌ PANAMAR: Error obteniendo documentos', {
      error: error.message,
      stack: error.stack
    });
    return res.status(500).json({
      success: false,
      message: 'Error interno al obtener documentos PANAMAR'
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

    const { ejercicio } = req.query;
    const result = await panamarService.getSummary({ ejercicio });

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

module.exports = {
  getDocuments,
  getSummary,
  healthCheck
};
