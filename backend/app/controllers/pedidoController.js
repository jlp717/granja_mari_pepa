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
      WITH PendientesCVC AS (
        SELECT
          TRIM(SERIEDOCUMENTO) AS SERIE,
          NUMERODOCUMENTO AS NUMERO,
          EJERCICIODOCUMENTO AS EJERCICIO,
          SUM(COALESCE(IMPORTEPENDIENTE, 0)) AS PENDIENTE
        FROM DSEDAC.CVC
        GROUP BY TRIM(SERIEDOCUMENTO), NUMERODOCUMENTO, EJERCICIODOCUMENTO
      ),
      FacturasPedido AS (
        SELECT DISTINCT
          TRIM(CAC.SUBEMPRESAPEDIDO) AS SUBEMPRESA,
          CAC.EJERCICIOPEDIDO AS EJERCICIO,
          TRIM(CAC.SERIEPEDIDO) AS SERIE,
          CAC.NUMEROPEDIDO AS NUMERO,
          TRIM(CAC.SERIEFACTURA) AS FSERIE,
          CAC.NUMEROFACTURA AS FNUMERO,
          CAC.EJERCICIOFACTURA AS FEJERCICIO,
          CAC.IMPORTETOTAL AS FTOTAL
        FROM DSEDAC.CAC CAC
        WHERE CAC.NUMEROFACTURA > 0
          AND TRIM(CAC.CODIGOCLIENTEFACTURA) = ?
      ),
      FacturacionPedido AS (
        SELECT
          FP.SUBEMPRESA,
          FP.EJERCICIO,
          FP.SERIE,
          FP.NUMERO,
          COUNT(*) AS FACTURAS,
          SUM(FP.FTOTAL) AS IMPORTEFACTURADO,
          SUM(COALESCE(P.PENDIENTE, 0)) AS PENDIENTE
        FROM FacturasPedido FP
        LEFT JOIN PendientesCVC P
          ON FP.FSERIE = P.SERIE
          AND FP.FNUMERO = P.NUMERO
          AND FP.FEJERCICIO = P.EJERCICIO
        GROUP BY FP.SUBEMPRESA, FP.EJERCICIO, FP.SERIE, FP.NUMERO
      )
      SELECT
        L.SUBEMPRESAPEDIDO as subempresa,
        L.EJERCICIOPEDIDO as ejercicio,
        L.SERIEPEDIDO as serie,
        L.TERMINALPEDIDO as terminal,
        L.NUMEROPEDIDO as numero,
        L.DIADOCUMENTO as dia,
        L.MESDOCUMENTO as mes,
        L.ANODOCUMENTO as ano,
        L.CODIGOCLIENTEALBARAN as codigoCliente,
        SUM(L.IMPORTEVENTA) as importePedido,
        COUNT(DISTINCT L.SECUENCIAPEDIDO) as numLineas,
        COALESCE(F.FACTURAS, 0) as facturas,
        COALESCE(F.PENDIENTE, 0) as pendiente,
        COALESCE(F.IMPORTEFACTURADO, 0) as importeFacturado
      FROM DSEDAC.LPC L
      LEFT JOIN FacturacionPedido F
        ON TRIM(L.SUBEMPRESAPEDIDO) = F.SUBEMPRESA
        AND L.EJERCICIOPEDIDO = F.EJERCICIO
        AND TRIM(L.SERIEPEDIDO) = F.SERIE
        AND L.NUMEROPEDIDO = F.NUMERO
      WHERE TRIM(L.CODIGOCLIENTEALBARAN) = ?
      GROUP BY
        L.SUBEMPRESAPEDIDO, L.EJERCICIOPEDIDO, L.SERIEPEDIDO,
        L.TERMINALPEDIDO, L.NUMEROPEDIDO, L.DIADOCUMENTO,
        L.MESDOCUMENTO, L.ANODOCUMENTO, L.CODIGOCLIENTEALBARAN,
        F.FACTURAS, F.PENDIENTE, F.IMPORTEFACTURADO
      ORDER BY L.ANODOCUMENTO DESC, L.MESDOCUMENTO DESC, L.DIADOCUMENTO DESC
    `;

    const pedidosRaw = await odbcPool.query(query, [
      codigoCliente.trim(),
      codigoCliente.trim(),
    ]);

    const pad = (value) => String(value || 0).padStart(2, '0');
    const pick = (row, upper, lower) =>
      row[upper] !== undefined ? row[upper] : row[lower];
    const pedidos = (pedidosRaw || []).map((p) => {
      const numero = pick(p, 'NUMERO', 'numero');
      const dia = pick(p, 'DIA', 'dia');
      const mes = pick(p, 'MES', 'mes');
      const ano = pick(p, 'ANO', 'ano');
      const facturas = Number(pick(p, 'FACTURAS', 'facturas')) || 0;
      const pendiente = Number(pick(p, 'PENDIENTE', 'pendiente')) || 0;
      const importePedido =
        Number(pick(p, 'IMPORTEPEDIDO', 'importePedido')) || 0;
      const importeFacturado =
        Number(pick(p, 'IMPORTEFACTURADO', 'importeFacturado')) || 0;
      const estadoPago =
        facturas === 0
          ? 'Sin facturar'
          : pendiente > 0
            ? 'Pendiente'
            : 'Pagado';
      return {
        ...p,
        numeroPedido: numero,
        fecha: `${pad(dia)}/${pad(mes)}/${ano || ''}`,
        importeTotal: importeFacturado > 0 ? importeFacturado : importePedido,
        importePedido,
        importeFacturado,
        facturas,
        pendiente,
        estadoPago,
      };
    });

    return res.json({
      success: true,
      pedidos,
      total: pedidos.length
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
