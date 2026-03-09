/**
 * SERVICIO PANAMAR - Documentos con productos CODIGOFILTRO=40
 * =============================================================
 * Recupera albaranes/facturas de CUALQUIER cliente que contengan
 * productos PANAMAR (ARTX.FILTRO03='40'), con precios de TARIFA 85.
 *
 * Solo accesible para el cliente especial 9999999999.
 */

const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');

const PANAMAR_CLIENT_CODE = '9999999999';
const PANAMAR_FILTRO = '40';
const TARIFA_PANAMAR = 85;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

/**
 * Verifica que el código de cliente sea el especial PANAMAR
 */
function isPanamarClient(codigoCliente) {
  return String(codigoCliente).trim() === PANAMAR_CLIENT_CODE;
}

/**
 * Obtener documentos PANAMAR con paginación y filtros
 *
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=50]
 * @param {string} [options.tipo] - 'albaran' | 'factura' | undefined (todos)
 * @param {string} [options.fechaDesde] - YYYY-MM-DD
 * @param {string} [options.fechaHasta] - YYYY-MM-DD
 * @param {string} [options.codigoCliente] - filtrar por cliente destino
 * @param {string} [options.busqueda] - búsqueda libre (ref pedido, nombre cliente)
 * @param {number} [options.ejercicio] - filtrar por ejercicio
 * @returns {Promise<{documents: Array, total: number, page: number, pageSize: number, totalPages: number}>}
 */
async function getDocuments(options = {}) {
  const startTime = Date.now();
  const page = Math.max(1, parseInt(options.page) || 1);
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(options.pageSize) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  logger.info('📦 PANAMAR: Consultando documentos', {
    page,
    pageSize,
    tipo: options.tipo || 'todos',
    fechaDesde: options.fechaDesde,
    fechaHasta: options.fechaHasta,
    codigoCliente: options.codigoCliente,
    ejercicio: options.ejercicio
  });

  // ── Build WHERE clauses ──────────────────────────────────────────
  const whereClauses = [];
  const params = [];

  // Siempre: solo documentos que tengan al menos 1 línea PANAMAR con importe
  // (esta condición se aplica en el EXISTS sub-query abajo)

  // Filtro por tipo de documento
  if (options.tipo === 'factura') {
    whereClauses.push('CAC.NUMEROFACTURA > 0');
  } else if (options.tipo === 'albaran') {
    whereClauses.push('CAC.NUMEROFACTURA = 0');
  }

  // Filtro por fecha (usando ANODOCUMENTO, MESDOCUMENTO, DIADOCUMENTO)
  if (options.fechaDesde) {
    const fd = parseDate(options.fechaDesde);
    if (fd) {
      whereClauses.push('(CAC.ANODOCUMENTO * 10000 + CAC.MESDOCUMENTO * 100 + CAC.DIADOCUMENTO) >= ?');
      params.push(fd.year * 10000 + fd.month * 100 + fd.day);
    }
  }

  if (options.fechaHasta) {
    const fh = parseDate(options.fechaHasta);
    if (fh) {
      whereClauses.push('(CAC.ANODOCUMENTO * 10000 + CAC.MESDOCUMENTO * 100 + CAC.DIADOCUMENTO) <= ?');
      params.push(fh.year * 10000 + fh.month * 100 + fh.day);
    }
  }

  // Filtro por ejercicio
  if (options.ejercicio) {
    whereClauses.push('CAC.EJERCICIOALBARAN = ?');
    params.push(parseInt(options.ejercicio));
  }

  // Filtro por cliente destino
  if (options.codigoCliente) {
    whereClauses.push('TRIM(CAC.CODIGOCLIENTEFACTURA) = ?');
    params.push(String(options.codigoCliente).trim());
  }

  // Búsqueda libre (ref pedido o nombre cliente)
  if (options.busqueda) {
    const searchTerm = `%${options.busqueda.trim().toUpperCase()}%`;
    whereClauses.push(
      '(UPPER(TRIM(CAC.PEDIDOREFERENCIA)) LIKE ? OR UPPER(TRIM(CLI.NOMBRECLIENTE)) LIKE ? OR CAST(CAC.NUMEROPEDIDO AS VARCHAR(20)) LIKE ?)'
    );
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSQL = whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : '';

  // ── Count query ──────────────────────────────────────────────────
  const countSQL = `
    SELECT COUNT(*) AS TOTAL
    FROM DSEDAC.CAC CAC
    LEFT JOIN DSEDAC.CLI CLI ON TRIM(CAC.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
    WHERE EXISTS (
      SELECT 1 FROM DSEDAC.LAC LAC
      INNER JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
      WHERE LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN  = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN      = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN   = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN     = CAC.NUMEROALBARAN
        AND TRIM(ARTX.FILTRO03)   = '${PANAMAR_FILTRO}'
        AND LAC.IMPORTEVENTA <> 0
    )
    ${whereSQL}
  `;

  const countResult = await odbcPool.query(countSQL, params);
  const total = countResult[0]?.TOTAL || 0;

  if (total === 0) {
    logger.info('📦 PANAMAR: Sin resultados', { elapsed: Date.now() - startTime });
    return { documents: [], total: 0, page, pageSize, totalPages: 0 };
  }

  // ── Header query (paginated) ────────────────────────────────────
  const headerSQL = `
    SELECT
      CAC.SUBEMPRESAALBARAN,
      CAC.EJERCICIOALBARAN,
      TRIM(CAC.SERIEALBARAN)       AS SERIE_ALBARAN,
      CAC.TERMINALALBARAN,
      CAC.NUMEROALBARAN,
      CAC.DIADOCUMENTO,
      CAC.MESDOCUMENTO,
      CAC.ANODOCUMENTO,
      CAC.HORADOCUMENTO,
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_CLIENTE,
      TRIM(CLI.NOMBRECLIENTE)        AS NOMBRE_CLIENTE,
      TRIM(CLI.NIF)                  AS NIF_CLIENTE,
      TRIM(CLI.POBLACION)            AS POBLACION_CLIENTE,
      CAC.NUMEROPEDIDO,
      TRIM(CAC.PEDIDOREFERENCIA)     AS REF_PEDIDO,
      TRIM(CAC.REFERENCIA)           AS REFERENCIA,
      TRIM(CAC.SERIEFACTURA)         AS SERIE_FACTURA,
      CAC.NUMEROFACTURA,
      CAC.EJERCICIOFACTURA
    FROM DSEDAC.CAC CAC
    LEFT JOIN DSEDAC.CLI CLI ON TRIM(CAC.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
    WHERE EXISTS (
      SELECT 1 FROM DSEDAC.LAC LAC
      INNER JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
      WHERE LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN  = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN      = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN   = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN     = CAC.NUMEROALBARAN
        AND TRIM(ARTX.FILTRO03)   = '${PANAMAR_FILTRO}'
        AND LAC.IMPORTEVENTA <> 0
    )
    ${whereSQL}
    ORDER BY CAC.ANODOCUMENTO DESC, CAC.MESDOCUMENTO DESC, CAC.DIADOCUMENTO DESC,
             CAC.HORADOCUMENTO DESC, CAC.NUMEROALBARAN DESC
    OFFSET ${offset} ROWS FETCH FIRST ${pageSize} ROWS ONLY
  `;

  const headers = await odbcPool.query(headerSQL, params);

  if (headers.length === 0) {
    return { documents: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  // ── Lines query for all fetched documents ────────────────────────
  // Build OR clause for each document key (DB2 for i doesn't support tuple IN)
  const docKeys = headers.map(h => ({
    sub: h.SUBEMPRESAALBARAN,
    ej: h.EJERCICIOALBARAN,
    ser: h.SERIE_ALBARAN,
    ter: h.TERMINALALBARAN,
    num: h.NUMEROALBARAN
  }));

  const orConditions = docKeys.map(() =>
    '(LAC.SUBEMPRESAALBARAN = ? AND LAC.EJERCICIOALBARAN = ? AND TRIM(LAC.SERIEALBARAN) = ? AND LAC.TERMINALALBARAN = ? AND LAC.NUMEROALBARAN = ?)'
  ).join(' OR ');
  const keyParams = [];
  docKeys.forEach(k => {
    keyParams.push(k.sub, k.ej, k.ser, k.ter, k.num);
  });

  const linesSQL = `
    SELECT
      LAC.SUBEMPRESAALBARAN,
      LAC.EJERCICIOALBARAN,
      TRIM(LAC.SERIEALBARAN)     AS SERIE_ALBARAN,
      LAC.TERMINALALBARAN,
      LAC.NUMEROALBARAN,
      LAC.SECUENCIA,
      TRIM(LAC.CODIGOARTICULO)   AS CODIGO_ARTICULO,
      TRIM(LAC.DESCRIPCION)      AS DESCRIPCION,
      TRIM(LAC.CODIGOLOTE)       AS LOTE,
      LAC.CANTIDADENVASES         AS CAJAS,
      LAC.CANTIDADUNIDADES        AS UNIDADES,
      LAC.PRECIOVENTA,
      LAC.PORCENTAJEDESCUENTO     AS DESCUENTO,
      LAC.IMPORTEVENTA,
      COALESCE(ARA.PRECIOTARIFA, 0) AS PRECIO_TARIFA_85,
      TRIM(ARTX.FILTRO03)        AS FILTRO03
    FROM DSEDAC.LAC LAC
    INNER JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
    LEFT JOIN DSEDAC.ARA ARA
      ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARA.CODIGOARTICULO)
      AND ARA.CODIGOTARIFA = ${TARIFA_PANAMAR}
    WHERE TRIM(ARTX.FILTRO03) = '${PANAMAR_FILTRO}'
      AND LAC.IMPORTEVENTA <> 0
      AND (${orConditions})
    ORDER BY LAC.SUBEMPRESAALBARAN, LAC.EJERCICIOALBARAN, LAC.SERIEALBARAN,
             LAC.TERMINALALBARAN, LAC.NUMEROALBARAN, LAC.SECUENCIA
  `;

  const lines = await odbcPool.query(linesSQL, keyParams);

  // ── Assemble response ────────────────────────────────────────────
  // Index lines by document key
  const linesByDoc = {};
  for (const line of lines) {
    const key = `${line.SUBEMPRESAALBARAN}|${line.EJERCICIOALBARAN}|${line.SERIE_ALBARAN}|${line.TERMINALALBARAN}|${line.NUMEROALBARAN}`;
    if (!linesByDoc[key]) linesByDoc[key] = [];

    const precioTarifa85 = line.PRECIO_TARIFA_85 || 0;
    const precioUnitario = precioTarifa85 > 0 ? precioTarifa85 : line.PRECIOVENTA;
    const cantidad = line.CAJAS > 0 ? line.CAJAS : line.UNIDADES;
    const importeCalculado = precioTarifa85 > 0
      ? precioTarifa85 * cantidad
      : line.IMPORTEVENTA;

    linesByDoc[key].push({
      secuencia: line.SECUENCIA,
      codigoArticulo: line.CODIGO_ARTICULO,
      descripcion: line.DESCRIPCION,
      lote: line.LOTE,
      cajas: line.CAJAS,
      unidades: line.UNIDADES,
      precioUnitario: round2(precioUnitario),
      descuento: line.DESCUENTO,
      importe: round2(importeCalculado),
      precioTarifa85: round2(precioTarifa85),
      precioOriginal: round2(line.PRECIOVENTA),
      usaTarifa85: precioTarifa85 > 0
    });
  }

  const documents = headers.map(h => {
    const key = `${h.SUBEMPRESAALBARAN}|${h.EJERCICIOALBARAN}|${h.SERIE_ALBARAN}|${h.TERMINALALBARAN}|${h.NUMEROALBARAN}`;
    const docLines = linesByDoc[key] || [];
    const totalImporte = docLines.reduce((sum, l) => sum + l.importe, 0);
    const isFactura = h.NUMEROFACTURA > 0;

    return {
      // Identificadores
      subempresa: h.SUBEMPRESAALBARAN,
      ejercicio: h.EJERCICIOALBARAN,
      serieAlbaran: h.SERIE_ALBARAN,
      terminal: h.TERMINALALBARAN,
      numeroAlbaran: h.NUMEROALBARAN,
      // Fecha
      fecha: formatDate(h.DIADOCUMENTO, h.MESDOCUMENTO, h.ANODOCUMENTO),
      dia: h.DIADOCUMENTO,
      mes: h.MESDOCUMENTO,
      ano: h.ANODOCUMENTO,
      hora: formatHora(h.HORADOCUMENTO),
      // Cliente destino
      codigoCliente: h.CODIGO_CLIENTE,
      nombreCliente: h.NOMBRE_CLIENTE,
      nifCliente: h.NIF_CLIENTE,
      poblacionCliente: h.POBLACION_CLIENTE,
      // Pedido
      numeroPedido: h.NUMEROPEDIDO,
      refPedido: h.REF_PEDIDO,
      referencia: h.REFERENCIA,
      // Factura (si existe)
      tipoDocumento: isFactura ? 'factura' : 'albaran',
      serieFactura: isFactura ? h.SERIE_FACTURA : null,
      numeroFactura: isFactura ? h.NUMEROFACTURA : null,
      ejercicioFactura: isFactura ? h.EJERCICIOFACTURA : null,
      // Líneas PANAMAR con tarifa 85
      lineas: docLines,
      totalLineasPanamar: docLines.length,
      totalImportePanamar: round2(totalImporte)
    };
  });

  const elapsed = Date.now() - startTime;
  logger.info('📦 PANAMAR: Consulta completada', {
    total,
    returned: documents.length,
    page,
    totalPages: Math.ceil(total / pageSize),
    elapsed: `${elapsed}ms`
  });

  return {
    documents,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize)
  };
}

/**
 * Obtener UN solo documento PANAMAR por su clave compuesta
 *
 * @param {Object} key - { subempresa, ejercicio, serie, terminal, numero }
 * @returns {Promise<Object|null>} documento con líneas, o null si no existe
 */
async function getDocumentByKey(key) {
  const startTime = Date.now();

  logger.info('📦 PANAMAR: Obteniendo documento por clave', key);

  // ── Header query ──────────────────────────────────────────────────
  const headerSQL = `
    SELECT
      CAC.SUBEMPRESAALBARAN,
      CAC.EJERCICIOALBARAN,
      TRIM(CAC.SERIEALBARAN)       AS SERIE_ALBARAN,
      CAC.TERMINALALBARAN,
      CAC.NUMEROALBARAN,
      CAC.DIADOCUMENTO,
      CAC.MESDOCUMENTO,
      CAC.ANODOCUMENTO,
      CAC.HORADOCUMENTO,
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_CLIENTE,
      TRIM(CLI.NOMBRECLIENTE)        AS NOMBRE_CLIENTE,
      TRIM(CLI.NIF)                  AS NIF_CLIENTE,
      TRIM(CLI.POBLACION)            AS POBLACION_CLIENTE,
      CAC.NUMEROPEDIDO,
      TRIM(CAC.PEDIDOREFERENCIA)     AS REF_PEDIDO,
      TRIM(CAC.REFERENCIA)           AS REFERENCIA,
      TRIM(CAC.SERIEFACTURA)         AS SERIE_FACTURA,
      CAC.NUMEROFACTURA,
      CAC.EJERCICIOFACTURA
    FROM DSEDAC.CAC CAC
    LEFT JOIN DSEDAC.CLI CLI ON TRIM(CAC.CODIGOCLIENTEFACTURA) = TRIM(CLI.CODIGOCLIENTE)
    WHERE CAC.SUBEMPRESAALBARAN = ?
      AND CAC.EJERCICIOALBARAN  = ?
      AND TRIM(CAC.SERIEALBARAN) = ?
      AND CAC.TERMINALALBARAN   = ?
      AND CAC.NUMEROALBARAN     = ?
      AND EXISTS (
        SELECT 1 FROM DSEDAC.LAC LAC
        INNER JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
        WHERE LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
          AND LAC.EJERCICIOALBARAN  = CAC.EJERCICIOALBARAN
          AND LAC.SERIEALBARAN      = CAC.SERIEALBARAN
          AND LAC.TERMINALALBARAN   = CAC.TERMINALALBARAN
          AND LAC.NUMEROALBARAN     = CAC.NUMEROALBARAN
          AND TRIM(ARTX.FILTRO03)   = '${PANAMAR_FILTRO}'
          AND LAC.IMPORTEVENTA <> 0
      )
  `;

  const headers = await odbcPool.query(headerSQL, [
    key.subempresa, key.ejercicio, key.serie, key.terminal, key.numero
  ]);

  if (!headers || headers.length === 0) {
    logger.warn('📦 PANAMAR: Documento no encontrado', key);
    return null;
  }

  const h = headers[0];

  // ── Lines query ──────────────────────────────────────────────────
  const linesSQL = `
    SELECT
      LAC.SUBEMPRESAALBARAN,
      LAC.EJERCICIOALBARAN,
      TRIM(LAC.SERIEALBARAN)     AS SERIE_ALBARAN,
      LAC.TERMINALALBARAN,
      LAC.NUMEROALBARAN,
      LAC.SECUENCIA,
      TRIM(LAC.CODIGOARTICULO)   AS CODIGO_ARTICULO,
      TRIM(LAC.DESCRIPCION)      AS DESCRIPCION,
      TRIM(LAC.CODIGOLOTE)       AS LOTE,
      LAC.CANTIDADENVASES         AS CAJAS,
      LAC.CANTIDADUNIDADES        AS UNIDADES,
      LAC.PRECIOVENTA,
      LAC.PORCENTAJEDESCUENTO     AS DESCUENTO,
      LAC.IMPORTEVENTA,
      COALESCE(ARA.PRECIOTARIFA, 0) AS PRECIO_TARIFA_85,
      TRIM(ARTX.FILTRO03)        AS FILTRO03
    FROM DSEDAC.LAC LAC
    INNER JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
    LEFT JOIN DSEDAC.ARA ARA
      ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARA.CODIGOARTICULO)
      AND ARA.CODIGOTARIFA = ${TARIFA_PANAMAR}
    WHERE TRIM(ARTX.FILTRO03) = '${PANAMAR_FILTRO}'
      AND LAC.IMPORTEVENTA <> 0
      AND LAC.SUBEMPRESAALBARAN = ?
      AND LAC.EJERCICIOALBARAN  = ?
      AND TRIM(LAC.SERIEALBARAN) = ?
      AND LAC.TERMINALALBARAN   = ?
      AND LAC.NUMEROALBARAN     = ?
    ORDER BY LAC.SECUENCIA
  `;

  const lines = await odbcPool.query(linesSQL, [
    key.subempresa, key.ejercicio, key.serie, key.terminal, key.numero
  ]);

  // ── Assemble document ────────────────────────────────────────────
  const docLines = (lines || []).map(line => {
    const precioTarifa85 = line.PRECIO_TARIFA_85 || 0;
    const precioUnitario = precioTarifa85 > 0 ? precioTarifa85 : line.PRECIOVENTA;
    const cantidad = line.CAJAS > 0 ? line.CAJAS : line.UNIDADES;
    const importeCalculado = precioTarifa85 > 0
      ? precioTarifa85 * cantidad
      : line.IMPORTEVENTA;

    return {
      secuencia: line.SECUENCIA,
      codigoArticulo: line.CODIGO_ARTICULO,
      descripcion: line.DESCRIPCION,
      lote: line.LOTE,
      cajas: line.CAJAS,
      unidades: line.UNIDADES,
      precioUnitario: round2(precioUnitario),
      descuento: line.DESCUENTO,
      importe: round2(importeCalculado),
      precioTarifa85: round2(precioTarifa85),
      precioOriginal: round2(line.PRECIOVENTA),
      usaTarifa85: precioTarifa85 > 0
    };
  });

  const totalImporte = docLines.reduce((sum, l) => sum + l.importe, 0);
  const isFactura = h.NUMEROFACTURA > 0;

  const elapsed = Date.now() - startTime;
  logger.info('📦 PANAMAR: Documento obtenido', { elapsed: `${elapsed}ms`, lineas: docLines.length });

  return {
    subempresa: h.SUBEMPRESAALBARAN,
    ejercicio: h.EJERCICIOALBARAN,
    serieAlbaran: h.SERIE_ALBARAN,
    terminal: h.TERMINALALBARAN,
    numeroAlbaran: h.NUMEROALBARAN,
    fecha: formatDate(h.DIADOCUMENTO, h.MESDOCUMENTO, h.ANODOCUMENTO),
    dia: h.DIADOCUMENTO,
    mes: h.MESDOCUMENTO,
    ano: h.ANODOCUMENTO,
    hora: formatHora(h.HORADOCUMENTO),
    codigoCliente: h.CODIGO_CLIENTE,
    nombreCliente: h.NOMBRE_CLIENTE,
    nifCliente: h.NIF_CLIENTE,
    poblacionCliente: h.POBLACION_CLIENTE,
    numeroPedido: h.NUMEROPEDIDO,
    refPedido: h.REF_PEDIDO,
    referencia: h.REFERENCIA,
    tipoDocumento: isFactura ? 'factura' : 'albaran',
    serieFactura: isFactura ? h.SERIE_FACTURA : null,
    numeroFactura: isFactura ? h.NUMEROFACTURA : null,
    ejercicioFactura: isFactura ? h.EJERCICIOFACTURA : null,
    lineas: docLines,
    totalLineasPanamar: docLines.length,
    totalImportePanamar: round2(totalImporte)
  };
}

/**
 * Obtener resumen/estadísticas PANAMAR
 */
async function getSummary(options = {}) {
  const startTime = Date.now();

  logger.info('📊 PANAMAR: Consultando resumen');

  const ejercicio = options.ejercicio || new Date().getFullYear();

  const summarySQL = `
    SELECT
      COUNT(DISTINCT CAC.NUMEROALBARAN || '-' || CAC.SERIEALBARAN || '-' || CAC.EJERCICIOALBARAN) AS TOTAL_DOCUMENTOS,
      COUNT(DISTINCT TRIM(CAC.CODIGOCLIENTEFACTURA)) AS TOTAL_CLIENTES,
      SUM(CASE WHEN CAC.NUMEROFACTURA > 0 THEN 1 ELSE 0 END) AS TOTAL_FACTURADOS,
      SUM(CASE WHEN CAC.NUMEROFACTURA = 0 THEN 1 ELSE 0 END) AS TOTAL_PENDIENTES
    FROM DSEDAC.CAC CAC
    WHERE CAC.EJERCICIOALBARAN = ?
      AND EXISTS (
        SELECT 1 FROM DSEDAC.LAC LAC
        INNER JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
        WHERE LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
          AND LAC.EJERCICIOALBARAN  = CAC.EJERCICIOALBARAN
          AND LAC.SERIEALBARAN      = CAC.SERIEALBARAN
          AND LAC.TERMINALALBARAN   = CAC.TERMINALALBARAN
          AND LAC.NUMEROALBARAN     = CAC.NUMEROALBARAN
          AND TRIM(ARTX.FILTRO03)   = '${PANAMAR_FILTRO}'
          AND LAC.IMPORTEVENTA <> 0
      )
  `;

  const result = await odbcPool.query(summarySQL, [ejercicio]);
  const row = result[0] || {};

  const elapsed = Date.now() - startTime;
  logger.info('📊 PANAMAR: Resumen completado', { elapsed: `${elapsed}ms` });

  return {
    ejercicio,
    totalDocumentos: row.TOTAL_DOCUMENTOS || 0,
    totalClientes: row.TOTAL_CLIENTES || 0,
    totalFacturados: row.TOTAL_FACTURADOS || 0,
    totalPendientes: row.TOTAL_PENDIENTES || 0
  };
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length !== 3) return null;
  return { year: parseInt(parts[0]), month: parseInt(parts[1]), day: parseInt(parts[2]) };
}

function formatDate(day, month, year) {
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function formatHora(horaNum) {
  if (!horaNum) return null;
  const str = String(horaNum).padStart(6, '0');
  return `${str.slice(0, 2)}:${str.slice(2, 4)}`;
}

function round2(n) {
  return Math.round((n || 0) * 100) / 100;
}

module.exports = {
  PANAMAR_CLIENT_CODE,
  isPanamarClient,
  getDocuments,
  getDocumentByKey,
  getSummary
};
