/**
 * SERVICIO PANAMAR - Albaranes con productos familias 701-705
 * =============================================================
 * Recupera ALBARANES de clientes 4300x que contengan productos
 * de las familias 701 a 705 (tabla ART.CODIGOFAMILIA),
 * con precios de TARIFA 85.
 *
 * Reglas de negocio:
 *  - Solo CODIGOCLIENTEFACTURA que empiece por '4300' (excluye 44xx)
 *  - Caso CONTADO (4300005000): se resuelve a CODIGOCLIENTEALBARAN
 *  - Todo se muestra como albarán (no hay filtro factura/albarán)
 *
 * Solo accesible para el cliente especial 9999999999.
 * Fijado al ejercicio 2026.
 */

const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');

const PANAMAR_CLIENT_CODE = '9999999999';
const CONTADO_CLIENT_CODE = '4300005000';
const PANAMAR_FAMILIAS = ['700', '701', '702', '703', '704', '705', '706'];
const PANAMAR_FAMILIAS_SQL = PANAMAR_FAMILIAS.map(f => `'${f}'`).join(', ');
const PANAMAR_CLASES_LINEA_SQL = "'AB', 'RG', 'VT'";
const TARIFA_PANAMAR_SQL = "CASE WHEN CAC.MESDOCUMENTO = 1 THEN 84 ELSE 85 END";
const ANO_FIJO = 2026;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

// ── SQL expression: resolved client code (CONTADO → albaran, else → factura) ──
const RESOLVED_CLIENT_EXPR = `
  CASE WHEN TRIM(CAC.CODIGOCLIENTEFACTURA) = '${CONTADO_CLIENT_CODE}'
       THEN TRIM(CAC.CODIGOCLIENTEALBARAN)
       ELSE TRIM(CAC.CODIGOCLIENTEFACTURA)
  END`;

// ── SQL expression: resolved client name (NOMBREALTERNATIVO → fallback NOMBRECLIENTE) ──
// Some clients have NOMBREALTERNATIVO set to '+' or empty; use NOMBRECLIENTE as fallback
const RESOLVED_CLIENT_NAME_EXPR = `
  COALESCE(
    CASE WHEN LENGTH(TRIM(CLI.NOMBREALTERNATIVO)) > 1 THEN TRIM(CLI.NOMBREALTERNATIVO) END,
    TRIM(CLI.NOMBRECLIENTE)
  )`;

// ── Reusable EXISTS sub-query for PANAMAR article filter ──
const PANAMAR_EXISTS_SQL = `
  EXISTS (
    SELECT 1 FROM DSEDAC.LAC LAC
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN  = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN      = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN   = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN     = CAC.NUMEROALBARAN
      AND TRIM(ART.CODIGOFAMILIA) IN (${PANAMAR_FAMILIAS_SQL})
      AND TRIM(LAC.CLASELINEA) IN (${PANAMAR_CLASES_LINEA_SQL})
  )`;


/**
 * Verifica que el código de cliente sea el especial PANAMAR
 */
function isPanamarClient(codigoCliente) {
  return String(codigoCliente).trim() === PANAMAR_CLIENT_CODE;
}

/**
 * Obtener albaranes PANAMAR con paginación y filtros
 *
 * @param {Object} options
 * @param {number} [options.page=1]
 * @param {number} [options.pageSize=50]
 * @param {string} [options.fechaDesde] - YYYY-MM-DD
 * @param {string} [options.fechaHasta] - YYYY-MM-DD
 * @param {string} [options.codigoCliente] - filtrar por cliente destino (resolved)
 * @param {string} [options.busqueda] - búsqueda libre (ref pedido, nombre cliente)
 * @param {number} [options.ejercicio] - filtrar por ejercicio
 * @param {number[]} [options.meses] - filtrar por meses
 * @returns {Promise<{documents: Array, total: number, page: number, pageSize: number, totalPages: number}>}
 */
async function getDocuments(options = {}) {
  const startTime = Date.now();
  const page = Math.max(1, parseInt(options.page) || 1);
  const maxLimit = options.bypassMaxLimit ? 10000 : MAX_PAGE_SIZE;
  const pageSize = Math.min(maxLimit, Math.max(1, parseInt(options.pageSize) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  logger.info('📦 PANAMAR: Consultando albaranes', {
    page,
    pageSize,
    fechaDesde: options.fechaDesde,
    fechaHasta: options.fechaHasta,
    codigoCliente: options.codigoCliente,
    ejercicio: options.ejercicio
  });

  // ── Build WHERE clauses ──────────────────────────────────────────
  const whereClauses = [];
  const params = [];

  // Solo clientes 4300x (excluir 44xx y cualquier otro)
  whereClauses.push("TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'");

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

  // Filtro fijo por Año del Calendario 2026
  whereClauses.push('CAC.ANODOCUMENTO = ?');
  params.push(ANO_FIJO);

  // Filtro por cliente destino (resolved: CONTADO → albaran code)
  if (options.codigoCliente) {
    whereClauses.push(`${RESOLVED_CLIENT_EXPR} = ?`);
    params.push(String(options.codigoCliente).trim());
  }

  // Filtro por rango de código cliente (para descarga por tramos)
  if (options.codigoClienteDesde) {
    whereClauses.push(`${RESOLVED_CLIENT_EXPR} >= ?`);
    params.push(String(options.codigoClienteDesde).trim());
  }
  if (options.codigoClienteHasta) {
    whereClauses.push(`${RESOLVED_CLIENT_EXPR} <= ?`);
    params.push(String(options.codigoClienteHasta).trim());
  }

  // Filtro por meses (multi-selección)
  if (options.meses && Array.isArray(options.meses) && options.meses.length > 0) {
    const validMeses = options.meses.map(m => parseInt(m)).filter(m => m >= 1 && m <= 12);
    if (validMeses.length > 0) {
      const mesesPlaceholders = validMeses.map(() => '?').join(', ');
      whereClauses.push(`CAC.MESDOCUMENTO IN (${mesesPlaceholders})`);
      params.push(...validMeses);
    }
  }

  // Búsqueda libre (ref pedido o nombre cliente)
  if (options.busqueda) {
    const searchTerm = `%${options.busqueda.trim().toUpperCase()}%`;
    whereClauses.push(
      `(UPPER(TRIM(CAC.PEDIDOREFERENCIA)) LIKE ? OR UPPER(${RESOLVED_CLIENT_NAME_EXPR}) LIKE ? OR CAST(CAC.NUMEROPEDIDO AS VARCHAR(20)) LIKE ?)`
    );
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSQL = whereClauses.length > 0 ? 'AND ' + whereClauses.join(' AND ') : '';

  // ── Count query ──────────────────────────────────────────────────
  const countSQL = `
    SELECT COUNT(*) AS TOTAL
    FROM DSEDAC.CAC CAC
    LEFT JOIN DSEDAC.CLI CLI ON ${RESOLVED_CLIENT_EXPR} = TRIM(CLI.CODIGOCLIENTE)
    WHERE ${PANAMAR_EXISTS_SQL}
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
      ${RESOLVED_CLIENT_EXPR}        AS CODIGO_CLIENTE,
      ${RESOLVED_CLIENT_NAME_EXPR}        AS NOMBRE_CLIENTE,
      TRIM(CLI.NIF)                  AS NIF_CLIENTE,
      TRIM(CLI.DIRECCION)            AS DIRECCION_CLIENTE,
      TRIM(CLI.POBLACION)            AS POBLACION_CLIENTE,
      TRIM(CLI.PROVINCIA)            AS PROVINCIA_CLIENTE,
      TRIM(CLI.CODIGOPOSTAL)         AS CP_CLIENTE,
      CAC.NUMEROPEDIDO,
      TRIM(CAC.PEDIDOREFERENCIA)     AS REF_PEDIDO,
      TRIM(CAC.REFERENCIA)           AS REFERENCIA
    FROM DSEDAC.CAC CAC
    LEFT JOIN DSEDAC.CLI CLI ON ${RESOLVED_CLIENT_EXPR} = TRIM(CLI.CODIGOCLIENTE)
    WHERE ${PANAMAR_EXISTS_SQL}
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
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      COALESCE(ARA.PRECIOTARIFA, 0) AS PRECIO_TARIFA_PANAMAR,
      ART.CODIGOFAMILIA           AS FAMILIA
    FROM DSEDAC.LAC LAC
    INNER JOIN DSEDAC.CAC CAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    LEFT JOIN DSEDAC.ARA ARA
      ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARA.CODIGOARTICULO)
      AND ARA.CODIGOTARIFA = ${TARIFA_PANAMAR_SQL}
    WHERE TRIM(ART.CODIGOFAMILIA) IN (${PANAMAR_FAMILIAS_SQL})
      AND TRIM(LAC.CLASELINEA) IN (${PANAMAR_CLASES_LINEA_SQL})
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

    const precioTarifa = line.PRECIO_TARIFA_PANAMAR || 0;
    const precioUnitario = precioTarifa > 0 ? precioTarifa : line.PRECIOVENTA;
    const cantidad = line.CAJAS > 0 ? line.CAJAS : line.UNIDADES;
    const importeCalculado = precioTarifa > 0
      ? precioTarifa * cantidad
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
      precioTarifa: round2(precioTarifa),
      precioOriginal: round2(line.PRECIOVENTA),
      usaTarifaEspecial: precioTarifa > 0,
      tipoVenta: line.TIPO_VENTA || ''
    });
  }

  const documents = headers.map(h => {
    const key = `${h.SUBEMPRESAALBARAN}|${h.EJERCICIOALBARAN}|${h.SERIE_ALBARAN}|${h.TERMINALALBARAN}|${h.NUMEROALBARAN}`;
    const docLines = linesByDoc[key] || [];
    const totalImporte = docLines.reduce((sum, l) => sum + l.importe, 0);

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
      // Cliente destino (resolved: CONTADO → albaran code)
      codigoCliente: h.CODIGO_CLIENTE,
      nombreCliente: h.NOMBRE_CLIENTE,
      nifCliente: h.NIF_CLIENTE,
      direccionCliente: h.DIRECCION_CLIENTE,
      poblacionCliente: h.POBLACION_CLIENTE,
      provinciaCliente: h.PROVINCIA_CLIENTE,
      cpCliente: h.CP_CLIENTE,
      // Pedido
      numeroPedido: h.NUMEROPEDIDO,
      refPedido: h.REF_PEDIDO,
      referencia: h.REFERENCIA,
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
      ${RESOLVED_CLIENT_EXPR}        AS CODIGO_CLIENTE,
      ${RESOLVED_CLIENT_NAME_EXPR}        AS NOMBRE_CLIENTE,
      TRIM(CLI.NIF)                  AS NIF_CLIENTE,
      TRIM(CLI.DIRECCION)            AS DIRECCION_CLIENTE,
      TRIM(CLI.POBLACION)            AS POBLACION_CLIENTE,
      TRIM(CLI.PROVINCIA)            AS PROVINCIA_CLIENTE,
      TRIM(CLI.CODIGOPOSTAL)         AS CP_CLIENTE,
      CAC.NUMEROPEDIDO,
      TRIM(CAC.PEDIDOREFERENCIA)     AS REF_PEDIDO,
      TRIM(CAC.REFERENCIA)           AS REFERENCIA
    FROM DSEDAC.CAC CAC
    LEFT JOIN DSEDAC.CLI CLI ON ${RESOLVED_CLIENT_EXPR} = TRIM(CLI.CODIGOCLIENTE)
    WHERE TRIM(CAC.SUBEMPRESAALBARAN) = ?
      AND CAC.EJERCICIOALBARAN  = ?
      AND TRIM(CAC.SERIEALBARAN) = ?
      AND CAC.TERMINALALBARAN   = ?
      AND CAC.NUMEROALBARAN     = ?
      AND ${PANAMAR_EXISTS_SQL}
  `;

  const headers = await odbcPool.query(headerSQL, [
    String(key.subempresa).trim(), key.ejercicio, key.serie, key.terminal, key.numero
  ]);

  if (!headers || headers.length === 0) {
    logger.warn('📦 PANAMAR: Documento no encontrado', key);
    return null;
  }

  const h = headers[0];
  const month = h.MESDOCUMENTO;
  const tariff = (month === 1) ? 84 : 85;

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
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      COALESCE(ARA.PRECIOTARIFA, 0) AS PRECIO_TARIFA_85,
      ART.CODIGOFAMILIA           AS FAMILIA
    FROM DSEDAC.LAC LAC
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    LEFT JOIN DSEDAC.ARA ARA
      ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARA.CODIGOARTICULO)
      AND ARA.CODIGOTARIFA = ${tariff}
    WHERE TRIM(ART.CODIGOFAMILIA) IN (${PANAMAR_FAMILIAS_SQL})
      AND TRIM(LAC.CLASELINEA) IN (${PANAMAR_CLASES_LINEA_SQL})
      AND TRIM(LAC.SUBEMPRESAALBARAN) = ?
      AND LAC.EJERCICIOALBARAN  = ?
      AND TRIM(LAC.SERIEALBARAN) = ?
      AND LAC.TERMINALALBARAN   = ?
      AND LAC.NUMEROALBARAN     = ?
    ORDER BY LAC.SECUENCIA
  `;

  const lines = await odbcPool.query(linesSQL, [
    String(key.subempresa).trim(), key.ejercicio, key.serie, key.terminal, key.numero
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
      usaTarifa85: precioTarifa85 > 0,
      tipoVenta: line.TIPO_VENTA || ''
    };
  });

  const totalImporte = docLines.reduce((sum, l) => sum + l.importe, 0);

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
    direccionCliente: h.DIRECCION_CLIENTE,
    poblacionCliente: h.POBLACION_CLIENTE,
    provinciaCliente: h.PROVINCIA_CLIENTE,
    cpCliente: h.CP_CLIENTE,
    numeroPedido: h.NUMEROPEDIDO,
    refPedido: h.REF_PEDIDO,
    referencia: h.REFERENCIA,
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

  logger.info('📊 PANAMAR: Consultando resumen', { meses: options.meses, codigoCliente: options.codigoCliente });

  const ano = ANO_FIJO; // Siempre 2026

  // Build dynamic WHERE clauses for summary
  const extraClauses = [];
  const extraParams = [];

  // Solo clientes 4300x
  extraClauses.push("TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'");

  if (options.meses && Array.isArray(options.meses) && options.meses.length > 0) {
    const validMeses = options.meses.map(m => parseInt(m)).filter(m => m >= 1 && m <= 12);
    if (validMeses.length > 0) {
      const mesesPlaceholders = validMeses.map(() => '?').join(', ');
      extraClauses.push(`CAC.MESDOCUMENTO IN (${mesesPlaceholders})`);
      extraParams.push(...validMeses);
    }
  }

  if (options.codigoCliente) {
    extraClauses.push(`${RESOLVED_CLIENT_EXPR} = ?`);
    extraParams.push(String(options.codigoCliente).trim());
  }

  const extraSQL = extraClauses.length > 0 ? 'AND ' + extraClauses.join(' AND ') : '';

  const summarySQL = `
    SELECT
      COUNT(DISTINCT CAC.NUMEROALBARAN || '-' || CAC.SERIEALBARAN || '-' || CAC.TERMINALALBARAN || '-' || CAC.EJERCICIOALBARAN) AS TOTAL_DOCUMENTOS,
      COUNT(DISTINCT ${RESOLVED_CLIENT_EXPR}) AS TOTAL_CLIENTES
    FROM DSEDAC.CAC CAC
    WHERE CAC.ANODOCUMENTO = ?
      AND ${PANAMAR_EXISTS_SQL}
      ${extraSQL}
  `;

  // Importe total + cajas aggregation (CC / SC / total)
  const aggregateSQL = `
    SELECT
      COALESCE(SUM(
        CASE WHEN COALESCE(ARA.PRECIOTARIFA, 0) > 0
          THEN ARA.PRECIOTARIFA * (CASE WHEN LAC.CANTIDADENVASES > 0 THEN LAC.CANTIDADENVASES ELSE LAC.CANTIDADUNIDADES END)
          ELSE LAC.IMPORTEVENTA
        END
      ), 0) AS TOTAL_IMPORTE,
      COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS TOTAL_CAJAS,
      COALESCE(SUM(CASE WHEN TRIM(LAC.TIPOVENTA) = 'CC' THEN LAC.CANTIDADENVASES ELSE 0 END), 0) AS TOTAL_CAJAS_CC,
      COALESCE(SUM(CASE WHEN TRIM(LAC.TIPOVENTA) = 'SC' THEN LAC.CANTIDADENVASES ELSE 0 END), 0) AS TOTAL_CAJAS_SC
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    LEFT JOIN DSEDAC.ARA ARA
      ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARA.CODIGOARTICULO)
      AND ARA.CODIGOTARIFA = ${TARIFA_PANAMAR_SQL}
    WHERE CAC.ANODOCUMENTO = ?
      AND TRIM(ART.CODIGOFAMILIA) IN (${PANAMAR_FAMILIAS_SQL})
      AND TRIM(LAC.CLASELINEA) IN (${PANAMAR_CLASES_LINEA_SQL})
      ${extraSQL}
  `;

  const [summaryResult, aggregateResult] = await Promise.all([
    odbcPool.query(summarySQL, [ano, ...extraParams]),
    odbcPool.query(aggregateSQL, [ano, ...extraParams])
  ]);

  const row = summaryResult[0] || {};
  const aggRow = aggregateResult[0] || {};

  const elapsed = Date.now() - startTime;
  logger.info('📊 PANAMAR: Resumen completado', { elapsed: `${elapsed}ms` });

  return {
    ano,
    totalDocumentos: row.TOTAL_DOCUMENTOS || 0,
    totalClientes: row.TOTAL_CLIENTES || 0,
    totalImporte: round2(aggRow.TOTAL_IMPORTE || 0),
    totalCajas: aggRow.TOTAL_CAJAS || 0,
    totalCajasCC: aggRow.TOTAL_CAJAS_CC || 0,
    totalCajasSC: aggRow.TOTAL_CAJAS_SC || 0
  };
}

/**
 * Obtener lista de clientes con albaranes PANAMAR (para selector/dropdown)
 */
async function getClients() {
  const startTime = Date.now();

  logger.info('📊 PANAMAR: Consultando clientes');

  const clientsSQL = `
    SELECT DISTINCT
      ${RESOLVED_CLIENT_EXPR} AS CODIGO_CLIENTE,
      ${RESOLVED_CLIENT_NAME_EXPR} AS NOMBRE_CLIENTE
    FROM DSEDAC.CAC CAC
    LEFT JOIN DSEDAC.CLI CLI ON ${RESOLVED_CLIENT_EXPR} = TRIM(CLI.CODIGOCLIENTE)
    WHERE CAC.ANODOCUMENTO = ?
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND ${PANAMAR_EXISTS_SQL}
    ORDER BY ${RESOLVED_CLIENT_NAME_EXPR}
  `;

  const rows = await odbcPool.query(clientsSQL, [ANO_FIJO]);

  const elapsed = Date.now() - startTime;
  logger.info('📊 PANAMAR: Clientes obtenidos', { count: rows.length, elapsed: `${elapsed}ms` });

  return (rows || []).map(r => ({
    codigoCliente: r.CODIGO_CLIENTE,
    nombreCliente: r.NOMBRE_CLIENTE || r.CODIGO_CLIENTE
  }));
}

/**
 * Diagnóstico detallado de cajas PANAMAR - desglose por mes y filtros
 * Sirve para verificar que los datos coinciden con lo esperado
 */
async function getDiagnostics() {
  const startTime = Date.now();
  logger.info('🔍 PANAMAR DIAGNOSTICS: Iniciando análisis exhaustivo');

  // 1) Desglose de cajas por mes (con y sin filtro IMPORTEVENTA <> 0)
  const cajasDesglose = `
    SELECT
      CAC.MESDOCUMENTO AS MES,
      COUNT(DISTINCT CAC.NUMEROALBARAN || '-' || CAC.SERIEALBARAN || '-' || CAC.TERMINALALBARAN || '-' || CAC.EJERCICIOALBARAN) AS DOCS,
      COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS_ENVASES,
      COALESCE(SUM(LAC.CANTIDADUNIDADES), 0) AS CAJAS_UNIDADES,
      COUNT(*) AS TOTAL_LINEAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = ${ANO_FIJO}
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND TRIM(ART.CODIGOFAMILIA) IN (${PANAMAR_FAMILIAS_SQL})
      AND TRIM(LAC.CLASELINEA) IN (${PANAMAR_CLASES_LINEA_SQL})
      AND LAC.IMPORTEVENTA <> 0
    GROUP BY CAC.MESDOCUMENTO
    ORDER BY CAC.MESDOCUMENTO
  `;

  // 2) Lo mismo SIN el filtro IMPORTEVENTA <> 0 (para ver si hay lineas excluidas)
  const cajasSinFiltroImporte = `
    SELECT
      CAC.MESDOCUMENTO AS MES,
      COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS_ENVASES,
      COALESCE(SUM(LAC.CANTIDADUNIDADES), 0) AS CAJAS_UNIDADES,
      COUNT(*) AS TOTAL_LINEAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = ${ANO_FIJO}
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND TRIM(ART.CODIGOFAMILIA) IN (${PANAMAR_FAMILIAS_SQL})
      AND TRIM(LAC.CLASELINEA) IN (${PANAMAR_CLASES_LINEA_SQL})
    GROUP BY CAC.MESDOCUMENTO
    ORDER BY CAC.MESDOCUMENTO
  `;

  // 3) Verificar posibles duplicados por ARA (si un articulo tiene >1 fila en ARA para tarifa 85)
  const araDuplicados = `
    SELECT TRIM(ARA.CODIGOARTICULO) AS ARTICULO, ARA.CODIGOTARIFA, COUNT(*) AS FILAS_ARA
    FROM DSEDAC.ARA ARA
    WHERE ARA.CODIGOTARIFA IN (84, 85)
    GROUP BY TRIM(ARA.CODIGOARTICULO), ARA.CODIGOTARIFA
    HAVING COUNT(*) > 1
  `;

  // 4) Verificar nombre real de columna TIPOVENTA
  const tipodventaCheck = `
    SELECT COLUMN_NAME
    FROM QSYS2.SYSCOLUMNS
    WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'LAC'
      AND COLUMN_NAME LIKE '%TIPO%'
  `;

  // 5) Desglose CC/SC por mes
  const ccScDesglose = `
    SELECT
      CAC.MESDOCUMENTO AS MES,
      TRIM(LAC.TIPOVENTA) AS TIPO,
      COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC
      ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
      AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
      AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
      AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = ${ANO_FIJO}
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND TRIM(ART.CODIGOFAMILIA) IN (${PANAMAR_FAMILIAS_SQL})
      AND TRIM(LAC.CLASELINEA) IN (${PANAMAR_CLASES_LINEA_SQL})
      AND LAC.IMPORTEVENTA <> 0
    GROUP BY CAC.MESDOCUMENTO, TRIM(LAC.TIPOVENTA)
    ORDER BY CAC.MESDOCUMENTO, TRIM(LAC.TIPOVENTA)
  `;

  try {
    const [desglose, sinFiltro, duplicados, columnas, ccsc] = await Promise.all([
      odbcPool.query(cajasDesglose),
      odbcPool.query(cajasSinFiltroImporte),
      odbcPool.query(araDuplicados).catch(e => ({ error: e.message })),
      odbcPool.query(tipodventaCheck).catch(e => ({ error: e.message })),
      odbcPool.query(ccScDesglose).catch(e => ({ error: e.message }))
    ]);

    const elapsed = Date.now() - startTime;

    const result = {
      info: 'Diagnóstico exhaustivo de cajas PANAMAR',
      elapsed: `${elapsed}ms`,
      anoFijo: ANO_FIJO,
      filtros: `Familias: ${PANAMAR_FAMILIAS.join(', ')}, Clientes: 4300%, Tarifa: ${TARIFA_PANAMAR}`,

      // Desglose por mes CON filtro IMPORTEVENTA <> 0
      cajasConFiltroImporte: desglose.map ? desglose.map(r => ({
        mes: r.MES,
        documentos: r.DOCS,
        cajasEnvases: r.CAJAS_ENVASES,
        cajasUnidades: r.CAJAS_UNIDADES,
        totalLineas: r.TOTAL_LINEAS
      })) : desglose,

      // Desglose por mes SIN filtro IMPORTEVENTA <> 0
      cajasSinFiltroImporte: sinFiltro.map ? sinFiltro.map(r => ({
        mes: r.MES,
        cajasEnvases: r.CAJAS_ENVASES,
        cajasUnidades: r.CAJAS_UNIDADES,
        totalLineas: r.TOTAL_LINEAS
      })) : sinFiltro,

      // Diferencia por mes (lineas excluidas por IMPORTEVENTA = 0)
      diferenciaPorMes: sinFiltro.map && desglose.map ? sinFiltro.map(sf => {
        const cf = desglose.find(d => d.MES === sf.MES) || { CAJAS_ENVASES: 0, TOTAL_LINEAS: 0 };
        return {
          mes: sf.MES,
          lineasExcluidas: sf.TOTAL_LINEAS - (cf.TOTAL_LINEAS || 0),
          cajasExcluidas: sf.CAJAS_ENVASES - (cf.CAJAS_ENVASES || 0)
        };
      }) : 'N/A',

      // ARA duplicados (si hay, podrían inflar el SUM)
      araDuplicados: duplicados.length !== undefined
        ? (duplicados.length === 0 ? 'Sin duplicados - OK' : duplicados)
        : duplicados,

      // Columnas TIPO* en LAC
      columnasLAC_TIPO: columnas.map ? columnas.map(c => c.COLUMN_NAME) : columnas,

      // Desglose CC/SC por mes
      ccScPorMes: ccsc.map ? ccsc.map(r => ({
        mes: r.MES,
        tipo: r.TIPO,
        cajas: r.CAJAS
      })) : ccsc
    };

    logger.info('🔍 PANAMAR DIAGNOSTICS:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    logger.error('🔍 PANAMAR DIAGNOSTICS ERROR:', error.message);
    throw error;
  }
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
  ANO_FIJO,
  isPanamarClient,
  getDocuments,
  getDocumentByKey,
  getSummary,
  getClients,
  getDiagnostics
};
