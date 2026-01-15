/**
 * CONTROLADOR DE PEDIDOS
 * ========================
 * Gestión de pedidos del cliente - CÓDIGO DE PRODUCCIÓN
 */

const logger = require('../utils/logger');
const odbcPool = require('../config/odbcConfig');

/**
 * GET /api/pedidos/:codigoCliente
 * Obtener pedidos del cliente
 */
async function obtenerPedidos(req, res) {
  try {
    const { codigoCliente } = req.params;

    logger.info('📦 Obtener pedidos', { codigoCliente });

    const query = `
      SELECT 
        SUBEMPRESAPEDIDO as subempresa,
        EJERCICIOPEDIDO as ejercicio,
        SERIEPEDIDO as serie,
        TERMINALPEDIDO as terminal,
        NUMEROPEDIDO as numero,
        DIADOCUMENTO as dia,
        MESDOCUMENTO as mes,
        ANODOCUMENTO as ano,
        CODIGOCLIENTEALBARAN as codigoCliente,
        SUM(IMPORTEVENTA) as importeTotal,
        COUNT(DISTINCT SECUENCIAPEDIDO) as numLineas
      FROM DSEDAC.LPC
      WHERE TRIM(CODIGOCLIENTEALBARAN) = ?
      GROUP BY 
        SUBEMPRESAPEDIDO, EJERCICIOPEDIDO, SERIEPEDIDO,
        TERMINALPEDIDO, NUMEROPEDIDO, DIADOCUMENTO,
        MESDOCUMENTO, ANODOCUMENTO, CODIGOCLIENTEALBARAN
      ORDER BY ANODOCUMENTO DESC, MESDOCUMENTO DESC, DIADOCUMENTO DESC
    `;

    const pedidos = await odbcPool.query(query, [codigoCliente.trim()]);

    return res.json({
      success: true,
      pedidos: pedidos || [],
      total: pedidos ? pedidos.length : 0
    });
  } catch (error) {
    logger.error('❌ Error obteniendo pedidos', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo pedidos' });
  }
}

/**
 * GET /api/pedidos/:codigoCliente/detalle
 * Obtener detalle de pedido
 */
async function obtenerDetallePedido(req, res) {
  try {
    const { codigoCliente } = req.params;
    const { subempresa, ejercicio, serie, terminal, numero } = req.query;

    logger.info('🔍 Detalle pedido', { codigoCliente, subempresa, ejercicio, serie, terminal, numero });

    const query = `
      SELECT 
        SECUENCIAPEDIDO as secuencia,
        CODIGOARTICULO as codigoArticulo,
        DESCRIPCION as descripcion,
        CANTIDADENVASES as cantidadEnvases,
        CANTIDADUNIDADES as cantidadUnidades,
        PRECIOVENTA as precioVenta,
        PORCENTAJEDESCUENTO as descuento,
        IMPORTEVENTA as importeVenta,
        CANTIDADENVASESSERVIDOS as envasesServidos,
        CANTIDADUNIDADESSERVIDAS as unidadesServidas
      FROM DSEDAC.LPC
      WHERE TRIM(CODIGOCLIENTEALBARAN) = ?
        AND SUBEMPRESAPEDIDO = ?
        AND EJERCICIOPEDIDO = ?
        AND SERIEPEDIDO = ?
        AND TERMINALPEDIDO = ?
        AND NUMEROPEDIDO = ?
      ORDER BY SECUENCIAPEDIDO
    `;

    const lineas = await odbcPool.query(query, [
      codigoCliente.trim(), subempresa, ejercicio, serie, terminal, numero
    ]);

    return res.json({
      success: true,
      detalle: { lineas: lineas || [], totalLineas: lineas ? lineas.length : 0 }
    });
  } catch (error) {
    logger.error('❌ Error obteniendo detalle', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo detalle' });
  }
}

/**
 * GET /api/pedidos/health
 * Health check
 */
async function healthCheck(req, res) {
  try {
    return res.json({ status: 'ok', service: 'pedidos', timestamp: new Date().toISOString() });
  } catch (error) {
    return res.status(500).json({ status: 'error', message: error.message });
  }
}

module.exports = {
  obtenerPedidos,
  obtenerDetallePedido,
  healthCheck
};
