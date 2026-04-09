/**
 * SERVICIO PANAMAR - FACTURAS CON CONSUMO Y PRECIOS DE COBRO
 * ===========================================================
 * Devuelve facturas (no albaranes) de clientes 4300x con lineas PANAMAR
 * (familias 700-706), aplicando tarifa especial 84/85 cuando existe.
 *
 * Objetivo funcional:
 * - Mostrar negocio + consumo + precio/importe de cobro.
 * - Ocultar datos personales de cliente (NIF, direccion, etc.).
 * - Evitar duplicados en lineas por joins de tarifa.
 */

const odbcPool = require('../config/odbcConfig');
const logger = require('../utils/logger');

const PANAMAR_CLIENT_CODE = '9999999999';
const CONTADO_CLIENT_CODE = '4300005000';
const PANAMAR_FAMILIAS = ['700', '701', '702', '703', '704', '705', '706'];
const PANAMAR_FAMILIAS_SQL = PANAMAR_FAMILIAS.map(f => `'${f}'`).join(', ');
const PANAMAR_CLASES_LINEA_SQL = "'AB', 'RG', 'VT'";
const TARIFA_PANAMAR_SQL = 'CASE WHEN CAC.MESFACTURA = 1 THEN 84 ELSE 85 END';
const ANO_FIJO = 2026;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 500;

// Resuelve cliente destino: CONTADO -> cliente albaran, resto -> cliente factura.
const RESOLVED_CLIENT_EXPR = `
  CASE WHEN TRIM(CAC.CODIGOCLIENTEFACTURA) = '${CONTADO_CLIENT_CODE}'
       THEN TRIM(CAC.CODIGOCLIENTEALBARAN)
       ELSE TRIM(CAC.CODIGOCLIENTEFACTURA)
  END`;

// Nombres del negocio (comercial y fiscal).
const RESOLVED_CLIENT_NAME_EXPR = `TRIM(CLI.NOMBRECLIENTE)`;
const RESOLVED_FISCAL_NAME_EXPR = `TRIM(CLI.NOMBREALTERNATIVO)`;

// CTE central: lineas PANAMAR deduplicadas y con precio de cobro.
const PANAMAR_LINEAS_CTE = `
WITH TARIFAS_PANAMAR AS (
  SELECT
    TRIM(ARA.CODIGOARTICULO) AS CODIGO_ARTICULO,
    ARA.CODIGOTARIFA,
    MAX(ARA.PRECIOTARIFA) AS PRECIOTARIFA
  FROM DSEDAC.ARA ARA
  WHERE ARA.CODIGOTARIFA IN (84, 85)
  GROUP BY TRIM(ARA.CODIGOARTICULO), ARA.CODIGOTARIFA
),
PANAMAR_LINEAS AS (
  SELECT
    TRIM(CAC.SUBEMPRESAALBARAN) AS SUBEMPRESA_ALBARAN,
    CAC.EJERCICIOALBARAN AS EJERCICIO_ALBARAN,
    TRIM(CAC.SERIEALBARAN) AS SERIE_ALBARAN,
    CAC.TERMINALALBARAN AS TERMINAL_ALBARAN,
    CAC.NUMEROALBARAN AS NUMERO_ALBARAN,
    TRIM(CAC.SERIEFACTURA) AS SERIE_FACTURA,
    CAC.NUMEROFACTURA AS NUMERO_FACTURA,
    CAC.EJERCICIOFACTURA AS EJERCICIO_FACTURA,
    CAC.DIAFACTURA AS DIA_FACTURA,
    CAC.MESFACTURA AS MES_FACTURA,
    CAC.ANOFACTURA AS ANO_FACTURA,
    CAC.DIADOCUMENTO AS DIA_ALBARAN,
    CAC.MESDOCUMENTO AS MES_ALBARAN,
    CAC.ANODOCUMENTO AS ANO_ALBARAN,
    CAC.HORADOCUMENTO AS HORA_DOCUMENTO,
    ${RESOLVED_CLIENT_EXPR} AS CODIGO_CLIENTE,
    ${RESOLVED_CLIENT_NAME_EXPR} AS NOMBRE_CLIENTE,
    ${RESOLVED_FISCAL_NAME_EXPR} AS NOMBRE_FISCAL,
    CAC.NUMEROPEDIDO,
    TRIM(CAC.PEDIDOREFERENCIA) AS REF_PEDIDO,
    TRIM(CAC.REFERENCIA) AS REFERENCIA,
    LAC.SECUENCIA,
    TRIM(LAC.CODIGOARTICULO) AS CODIGO_ARTICULO,
    TRIM(LAC.DESCRIPCION) AS DESCRIPCION,
    TRIM(LAC.CODIGOLOTE) AS LOTE,
    LAC.CANTIDADENVASES AS CAJAS,
    LAC.CANTIDADUNIDADES AS UNIDADES,
    LAC.PRECIOVENTA,
    LAC.PORCENTAJEDESCUENTO AS DESCUENTO,
    CASE LAC.CODIGOIVA
      WHEN 1 THEN 10
      WHEN 2 THEN 21
      WHEN 3 THEN 4
      WHEN 4 THEN 0
      WHEN 5 THEN 10
      ELSE 4
    END AS IVA,
    LAC.IMPORTEVENTA,
    TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
    COALESCE(TP.PRECIOTARIFA, 0) AS PRECIO_TARIFA_PANAMAR
  FROM DSEDAC.CAC CAC
  LEFT JOIN DSEDAC.CLI CLI
    ON ${RESOLVED_CLIENT_EXPR} = TRIM(CLI.CODIGOCLIENTE)
  INNER JOIN DSEDAC.LAC LAC
    ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
    AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
    AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
    AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
    AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
  INNER JOIN DSEDAC.ART ART
    ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
  LEFT JOIN TARIFAS_PANAMAR TP
    ON TRIM(LAC.CODIGOARTICULO) = TP.CODIGO_ARTICULO
    AND TP.CODIGOTARIFA = ${TARIFA_PANAMAR_SQL}
  WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'
    AND CAC.NUMEROFACTURA > 0
    AND TRIM(CAC.SERIEFACTURA) <> ''
    AND TRIM(ART.CODIGOFAMILIA) IN (${PANAMAR_FAMILIAS_SQL})
    AND TRIM(LAC.CLASELINEA) IN (${PANAMAR_CLASES_LINEA_SQL})
)
`;

function isPanamarClient(codigoCliente) {
  return String(codigoCliente).trim() === PANAMAR_CLIENT_CODE;
}

function buildLineFilters(options = {}, alias = 'PL') {
  const clauses = [];
  const params = [];

  // El panel PANAMAR trabaja sobre ejercicio de albarán (consumo).
  clauses.push(`${alias}.ANO_ALBARAN = ?`);
  params.push(ANO_FIJO);

  if (options.fechaDesde) {
    const fd = parseDate(options.fechaDesde);
    if (fd) {
      clauses.push(`(${alias}.ANO_FACTURA * 10000 + ${alias}.MES_FACTURA * 100 + ${alias}.DIA_FACTURA) >= ?`);
      params.push(fd.year * 10000 + fd.month * 100 + fd.day);
    }
  }

  if (options.fechaHasta) {
    const fh = parseDate(options.fechaHasta);
    if (fh) {
      clauses.push(`(${alias}.ANO_ALBARAN * 10000 + ${alias}.MES_ALBARAN * 100 + ${alias}.DIA_ALBARAN) <= ?`);
      params.push(fh.year * 10000 + fh.month * 100 + fh.day);
    }
  }

  if (options.codigoCliente) {
    clauses.push(`${alias}.CODIGO_CLIENTE = ?`);
    params.push(String(options.codigoCliente).trim());
  }

  if (options.codigoClienteDesde) {
    clauses.push(`${alias}.CODIGO_CLIENTE >= ?`);
    params.push(String(options.codigoClienteDesde).trim());
  }

  if (options.codigoClienteHasta) {
    clauses.push(`${alias}.CODIGO_CLIENTE <= ?`);
    params.push(String(options.codigoClienteHasta).trim());
  }

  const validMeses = Array.isArray(options.meses)
    ? options.meses.map(m => parseInt(m, 10)).filter(m => m >= 1 && m <= 12)
    : [];

  if (validMeses.length > 0) {
    const placeholders = validMeses.map(() => '?').join(', ');
    clauses.push(`${alias}.MES_ALBARAN IN (${placeholders})`);
    params.push(...validMeses);
  } else {
    // Proteccion de rendimiento: por defecto, ano en curso hasta mes actual.
    const currentMonth = Math.min(12, Math.max(1, new Date().getMonth() + 1));
    clauses.push(`${alias}.MES_ALBARAN <= ?`);
    params.push(currentMonth);
  }

  if (options.ejercicio) {
    const ejercicioNum = parseInt(options.ejercicio, 10);
    if (!Number.isNaN(ejercicioNum)) {
      clauses.push(`${alias}.ANO_ALBARAN = ?`);
      params.push(ejercicioNum);
    }
  }

  if (options.busqueda && String(options.busqueda).trim()) {
    const searchTerm = `%${String(options.busqueda).trim().toUpperCase()}%`;
    const searchClean = String(options.busqueda).trim().toUpperCase().replace(/[-\s]/g, '');

    clauses.push(`(
      UPPER(COALESCE(${alias}.REF_PEDIDO, '')) LIKE ?
      OR UPPER(COALESCE(${alias}.NOMBRE_CLIENTE, '')) LIKE ?
      OR UPPER(COALESCE(${alias}.NOMBRE_FISCAL, '')) LIKE ?
      OR CAST(${alias}.NUMEROPEDIDO AS VARCHAR(20)) LIKE ?
      OR CAST(${alias}.NUMERO_FACTURA AS VARCHAR(20)) LIKE ?
      OR CAST(${alias}.NUMERO_ALBARAN AS VARCHAR(20)) LIKE ?
      OR UPPER(COALESCE(${alias}.SERIE_FACTURA, '')) LIKE ?
      OR UPPER(CONCAT(${alias}.SERIE_FACTURA, ${alias}.NUMERO_FACTURA)) LIKE ?
      OR REPLACE(REPLACE(UPPER(CONCAT(${alias}.SERIE_FACTURA, ${alias}.NUMERO_FACTURA)), '-', ''), ' ', '') LIKE ?
    )`);
    params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, `%${searchClean}%`);
  }

  return {
    whereSQL: clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '',
    params
  };
}

/**
 * CLAVE DE FACTURA - Versión Robusta
 * ===================================
 * La clave debe identificar UNICAMENTE la factura, no el periodo de consumo.
 * 
 * PROBLEMA ANTERIOR: Se usaba MES_FACTURA/ANO_FACTURA en la clave, lo que causaba
 * que una misma factura con albaranes de diferentes meses se dividiera en múltiples
 * "facturas" separadas.
 * 
 * SOLUCIÓN: La clave se basa únicamente en SERIE_FACTURA + NUMERO_FACTURA + EJERCICIO_FACTURA
 * El cliente se usa para filtrar pero NO para diferenciar facturas.
 */
function buildInvoiceKey(codigoCliente, mesFactura, anoFactura, serieFactura, numeroFactura, ejercicioFactura) {
  return [
    String(serieFactura || '').trim(),
    String(numeroFactura || '').trim(),
    String(ejercicioFactura || '').trim()
  ].join('|');
}

function buildInvoiceKeyFromLine(line) {
  return buildInvoiceKey(
    line.CODIGO_CLIENTE,
    line.MES_FACTURA,
    line.ANO_FACTURA,
    line.SERIE_FACTURA,
    line.NUMERO_FACTURA,
    line.EJERCICIO_FACTURA
  );
}

function normalizePanamarLine(line) {
  const precioTarifa = toNumber(line.PRECIO_TARIFA_PANAMAR);
  const precioOriginal = toNumber(line.PRECIOVENTA);
  const cajas = toNumber(line.CAJAS);
  const unidades = toNumber(line.UNIDADES);
  const cantidadCobro = cajas > 0 ? cajas : unidades;

  const precioCobro = precioTarifa > 0 ? precioTarifa : precioOriginal;
  const importeCobro = precioTarifa > 0
    ? precioCobro * cantidadCobro
    : toNumber(line.IMPORTEVENTA);

  return {
    subempresaAlbaran: line.SUBEMPRESA_ALBARAN,
    ejercicioAlbaran: line.EJERCICIO_ALBARAN,
    serieAlbaran: line.SERIE_ALBARAN,
    terminalAlbaran: line.TERMINAL_ALBARAN,
    numeroAlbaran: line.NUMERO_ALBARAN,
    secuencia: line.SECUENCIA,
    codigoArticulo: line.CODIGO_ARTICULO,
    descripcion: line.DESCRIPCION,
    lote: line.LOTE,
    cajas,
    unidades,
    precioCobro: round3(precioCobro),
    precioUnitario: round3(precioCobro), // compatibilidad con frontend actual
    descuento: round2(toNumber(line.DESCUENTO)),
    importe: round2(importeCobro),
    precioTarifa: round3(precioTarifa),
    precioTarifa85: round3(precioTarifa),
    precioOriginal: round3(precioOriginal),
    usaTarifaEspecial: precioTarifa > 0,
    usaTarifa85: precioTarifa > 0,
    tipoVenta: line.TIPO_VENTA || '',
    iva: toNumber(line.IVA),
    dia: toInt(line.DIA_ALBARAN),
    mes: toInt(line.MES_ALBARAN),
    ano: toInt(line.ANO_ALBARAN),
    fechaAlbaran: `${pad2(line.DIA_ALBARAN)}.${pad2(line.MES_ALBARAN)}.${line.ANO_ALBARAN}`
  };
}

/**
 * ASAMBLAR DOCUMENTOS DE FACTURA - Versión Robusta
 * =================================================
 * Agrupa las líneas POR FACTURA REAL (serie + número + ejercicio),
 * no por mes de albarán. Esto asegura que todas las líneas de una
 * factura estén juntas, independientemente de cuándo se consumieron.
 * 
 * Estructura de agrupación:
 * 1. Las líneas se agrupan por clave de factura (serie-numero-ejercicio)
 * 2. Las cabeceras representan facturas únicas (no grupos por mes)
 * 3. Todas las líneas de una factura se incluyen en el mismo documento
 */
function assembleInvoiceDocuments(headers, lines) {
  const linesByInvoice = new Map();

  // Agrupar todas las líneas por clave de factura (serie-numero-ejercicio)
  for (const line of (lines || [])) {
    const key = buildInvoiceKeyFromLine(line);

    if (!linesByInvoice.has(key)) {
      linesByInvoice.set(key, []);
    }
    linesByInvoice.get(key).push(normalizePanamarLine(line));
  }

  // Procesar cabeceras - cada cabecera es una factura única
  return (headers || []).map(header => {
    const key = buildInvoiceKey(
      header.CODIGO_CLIENTE,
      header.MES_FACTURA,
      header.ANO_FACTURA,
      header.SERIE_FACTURA,
      header.NUMERO_FACTURA,
      header.EJERCICIO_FACTURA
    );

    const docLines = linesByInvoice.get(key) || [];
    
    // Calcular totales basados en las líneas reales
    const totalImporte = docLines.length > 0
      ? round2(docLines.reduce((sum, l) => sum + toNumber(l.importe), 0))
      : round2(toNumber(header.TOTAL_IMPORTE_PANAMAR));
    const totalCajas = docLines.length > 0
      ? round3(docLines.reduce((sum, l) => sum + toNumber(l.cajas), 0))
      : round3(toNumber(header.TOTAL_CAJAS_PANAMAR));
    const totalUnidades = docLines.length > 0
      ? round3(docLines.reduce((sum, l) => sum + toNumber(l.unidades), 0))
      : round3(toNumber(header.TOTAL_UNIDADES_PANAMAR));

    const dia = toInt(header.DIA_FACTURA);
    const mes = toInt(header.MES_FACTURA);
    const ano = toInt(header.ANO_FACTURA);

    return {
      // Clave interna para endpoints (albaran representativo - el primero de la factura)
      subempresa: header.SUBEMPRESA_ALBARAN,
      ejercicio: toInt(header.EJERCICIO_ALBARAN),
      serieAlbaran: header.SERIE_ALBARAN,
      terminal: toInt(header.TERMINAL_ALBARAN),
      numeroAlbaran: toInt(header.NUMERO_ALBARAN),

      // Identidad de factura (visible en UI) - CLAVE REAL
      serieFactura: header.SERIE_FACTURA,
      numeroFactura: toInt(header.NUMERO_FACTURA),
      ejercicioFactura: toInt(header.EJERCICIO_FACTURA),
      refFactura: `${header.SERIE_FACTURA}-${toInt(header.NUMERO_FACTURA)}`,
      identity: key,

      // Fecha factura (la más reciente de todos los albaranes)
      fecha: formatDate(dia, mes, ano),
      dia,
      mes,
      ano,
      hora: formatHora(header.HORA_DOCUMENTO),

      // Negocio
      codigoCliente: header.CODIGO_CLIENTE,
      nombreCliente: header.NOMBRE_CLIENTE || header.CODIGO_CLIENTE,
      nombreFiscal: header.NOMBRE_FISCAL || '',

      // Pedido / referencia
      numeroPedido: toInt(header.NUMERO_PEDIDO),
      refPedido: header.REF_PEDIDO,
      referencia: header.REFERENCIA,

      // Líneas de consumo PANAMAR - TODAS las líneas de la factura
      lineas: docLines,
      totalLineasPanamar: docLines.length,
      totalCajasPanamar: totalCajas,
      totalUnidadesPanamar: totalUnidades,
      totalImportePanamar: totalImporte
    };
  });
}

async function getDocuments(options = {}) {
  const startTime = Date.now();
  const page = Math.max(1, parseInt(options.page, 10) || 1);
  const maxLimit = options.bypassMaxLimit ? 10000 : MAX_PAGE_SIZE;
  const pageSize = Math.min(maxLimit, Math.max(1, parseInt(options.pageSize, 10) || DEFAULT_PAGE_SIZE));
  const offset = (page - 1) * pageSize;

  const { whereSQL, params } = buildLineFilters(options, 'PL');

  logger.info('PANAMAR: Consultando facturas', {
    page,
    pageSize,
    fechaDesde: options.fechaDesde,
    fechaHasta: options.fechaHasta,
    codigoCliente: options.codigoCliente,
    ejercicio: options.ejercicio
  });

  /**
   * COUNT DE FACTURAS - Agrupado por factura REAL
   * ===============================================
   * Se agrupa por SERIE_FACTURA + NUMERO_FACTURA + EJERCICIO_FACTURA
   * No por MES_ALBARAN, para evitar contar la misma factura múltiples veces
   */
  const countSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT COUNT(*) AS TOTAL
    FROM (
      SELECT DISTINCT
        PL.SERIE_FACTURA,
        PL.NUMERO_FACTURA,
        PL.EJERCICIO_FACTURA
      FROM PANAMAR_LINEAS PL
      ${whereSQL}
    ) FACTURAS
  `;

  const countResult = await odbcPool.panamarQuery(countSQL, params);
  const total = toInt(countResult[0]?.TOTAL);

  if (total === 0) {
    logger.info('PANAMAR: Sin resultados', { elapsed: Date.now() - startTime });
    return { documents: [], total: 0, page, pageSize, totalPages: 0 };
  }

  /**
   * CABECERAS DE FACTURA - Agrupado por factura REAL
   * =================================================
   * Cada fila representa una factura única (serie + número + ejercicio)
   * Todos los campos agregados toman el valor representativo (MIN/MAX) de todos los albaranes
   */
  const headersSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT *
    FROM (
      SELECT
        MIN(PL.SUBEMPRESA_ALBARAN) AS SUBEMPRESA_ALBARAN,
        MIN(PL.EJERCICIO_ALBARAN) AS EJERCICIO_ALBARAN,
        MIN(PL.SERIE_ALBARAN) AS SERIE_ALBARAN,
        MIN(PL.TERMINAL_ALBARAN) AS TERMINAL_ALBARAN,
        MIN(PL.NUMERO_ALBARAN) AS NUMERO_ALBARAN,
        PL.CODIGO_CLIENTE,
        MAX(PL.NOMBRE_CLIENTE) AS NOMBRE_CLIENTE,
        MAX(PL.NOMBRE_FISCAL) AS NOMBRE_FISCAL,
        PL.SERIE_FACTURA,
        PL.NUMERO_FACTURA,
        PL.EJERCICIO_FACTURA,
        MAX(PL.DIA_FACTURA) AS DIA_FACTURA,
        MAX(PL.MES_FACTURA) AS MES_FACTURA,
        MAX(PL.ANO_FACTURA) AS ANO_FACTURA,
        MAX(PL.HORA_DOCUMENTO) AS HORA_DOCUMENTO,
        MAX(PL.NUMEROPEDIDO) AS NUMERO_PEDIDO,
        MAX(PL.REF_PEDIDO) AS REF_PEDIDO,
        MAX(PL.REFERENCIA) AS REFERENCIA,
        COUNT(*) AS TOTAL_LINEAS_PANAMAR,
        COALESCE(SUM(CASE WHEN COALESCE(PL.CAJAS, 0) > 0 THEN PL.CAJAS ELSE 0 END), 0) AS TOTAL_CAJAS_PANAMAR,
        COALESCE(SUM(CASE WHEN COALESCE(PL.UNIDADES, 0) > 0 THEN PL.UNIDADES ELSE 0 END), 0) AS TOTAL_UNIDADES_PANAMAR,
        COALESCE(SUM(
          CASE
            WHEN COALESCE(PL.PRECIO_TARIFA_PANAMAR, 0) > 0
              THEN PL.PRECIO_TARIFA_PANAMAR * (CASE WHEN COALESCE(PL.CAJAS, 0) > 0 THEN PL.CAJAS ELSE PL.UNIDADES END)
            ELSE PL.IMPORTEVENTA
          END
        ), 0) AS TOTAL_IMPORTE_PANAMAR
      FROM PANAMAR_LINEAS PL
      ${whereSQL}
      GROUP BY
        PL.CODIGO_CLIENTE,
        PL.SERIE_FACTURA,
        PL.NUMERO_FACTURA,
        PL.EJERCICIO_FACTURA
    ) H
    ORDER BY
      H.ANO_FACTURA DESC,
      H.MES_FACTURA DESC,
      H.DIA_FACTURA DESC,
      H.SERIE_FACTURA DESC,
      H.NUMERO_FACTURA DESC
    OFFSET ${offset} ROWS FETCH FIRST ${pageSize} ROWS ONLY
  `;

  const headers = await odbcPool.panamarQuery(headersSQL, params);

  if (!headers || headers.length === 0) {
    return { documents: [], total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  /**
   * Claves para obtener líneas - basadas en factura REAL
   * =====================================================
   * Se filtra por SERIE_FACTURA + NUMERO_FACTURA + EJERCICIO_FACTURA
   * No se usa MES_FACTURA/ANO_FACTURA para evitar perder líneas
   */
  const invoiceKeys = headers.map(h => ({
    codigoCliente: String(h.CODIGO_CLIENTE).trim(),
    serieFactura: String(h.SERIE_FACTURA).trim(),
    numeroFactura: toInt(h.NUMERO_FACTURA),
    ejercicioFactura: toInt(h.EJERCICIO_FACTURA)
  }));

  const invoiceConditions = invoiceKeys.map(() =>
    '(PL.CODIGO_CLIENTE = ? AND PL.SERIE_FACTURA = ? AND PL.NUMERO_FACTURA = ? AND PL.EJERCICIO_FACTURA = ?)'
  ).join(' OR ');

  const lineParams = [];
  for (const key of invoiceKeys) {
    lineParams.push(key.codigoCliente, key.serieFactura, key.numeroFactura, key.ejercicioFactura);
  }

  const linesSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT
      PL.CODIGO_CLIENTE,
      PL.MES_FACTURA,
      PL.ANO_FACTURA,
      PL.SERIE_FACTURA,
      PL.NUMERO_FACTURA,
      PL.EJERCICIO_FACTURA,
      PL.SUBEMPRESA_ALBARAN,
      PL.EJERCICIO_ALBARAN,
      PL.SERIE_ALBARAN,
      PL.TERMINAL_ALBARAN,
      PL.NUMERO_ALBARAN,
      PL.SECUENCIA,
      PL.CODIGO_ARTICULO,
      PL.DESCRIPCION,
      PL.LOTE,
      PL.CAJAS,
      PL.UNIDADES,
      PL.PRECIOVENTA,
      PL.DESCUENTO,
      PL.IMPORTEVENTA,
      PL.TIPO_VENTA,
      PL.PRECIO_TARIFA_PANAMAR,
      PL.DIA_ALBARAN,
      PL.MES_ALBARAN,
      PL.ANO_ALBARAN
    FROM PANAMAR_LINEAS PL
    WHERE (${invoiceConditions})
    ORDER BY
      PL.CODIGO_CLIENTE,
      PL.ANO_FACTURA,
      PL.MES_FACTURA,
      PL.EJERCICIO_ALBARAN,
      PL.SERIE_ALBARAN,
      PL.TERMINAL_ALBARAN,
      PL.NUMERO_ALBARAN,
      PL.SECUENCIA
  `;

  const lines = await odbcPool.panamarQuery(linesSQL, lineParams);
  const documents = assembleInvoiceDocuments(headers, lines);

  const elapsed = Date.now() - startTime;
  logger.info('PANAMAR: Consulta de facturas completada', {
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
 * OBTENER FACTURA POR IDENTIDAD - Versión Robusta
 * ================================================
 * Obtiene una factura completa por serie + número + ejercicio
 * Sin filtrar por cliente ni MES_FACTURA/ANO_FACTURA para incluir TODAS las líneas
 * 
 * NOTA: La identidad SERIE+NUMERO+EJERCICIO es única, no necesitamos filtrar por cliente.
 * El codigoCliente='9999999999' es virtual y no existe en la tabla CAC.
 */
async function getInvoiceByIdentity(identity) {
  const params = [
    String(identity.serie || '').trim(),
    toInt(identity.numero || 0),
    toInt(identity.ejercicio || 0)
  ];

  // Sin filtro de CODIGO_CLIENTE - la identidad de factura ya es única
  const invoiceWhereSQL = `
    WHERE PL.SERIE_FACTURA = ?
      AND PL.NUMERO_FACTURA = ?
      AND PL.EJERCICIO_FACTURA = ?
  `;

  const headerSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT
      MIN(PL.SUBEMPRESA_ALBARAN) AS SUBEMPRESA_ALBARAN,
      MIN(PL.EJERCICIO_ALBARAN) AS EJERCICIO_ALBARAN,
      MIN(PL.SERIE_ALBARAN) AS SERIE_ALBARAN,
      MIN(PL.TERMINAL_ALBARAN) AS TERMINAL_ALBARAN,
      MIN(PL.NUMERO_ALBARAN) AS NUMERO_ALBARAN,
      PL.CODIGO_CLIENTE,
      MAX(PL.NOMBRE_CLIENTE) AS NOMBRE_CLIENTE,
      MAX(PL.NOMBRE_FISCAL) AS NOMBRE_FISCAL,
      PL.SERIE_FACTURA,
      PL.NUMERO_FACTURA,
      PL.EJERCICIO_FACTURA,
      MAX(PL.DIA_FACTURA) AS DIA_FACTURA,
      MAX(PL.MES_FACTURA) AS MES_FACTURA,
      MAX(PL.ANO_FACTURA) AS ANO_FACTURA,
      MAX(PL.HORA_DOCUMENTO) AS HORA_DOCUMENTO,
      MAX(PL.NUMEROPEDIDO) AS NUMERO_PEDIDO,
      MAX(PL.REF_PEDIDO) AS REF_PEDIDO,
      MAX(PL.REFERENCIA) AS REFERENCIA,
      COUNT(*) AS TOTAL_LINEAS_PANAMAR,
      COALESCE(SUM(CASE WHEN COALESCE(PL.CAJAS, 0) > 0 THEN PL.CAJAS ELSE 0 END), 0) AS TOTAL_CAJAS_PANAMAR,
      COALESCE(SUM(CASE WHEN COALESCE(PL.UNIDADES, 0) > 0 THEN PL.UNIDADES ELSE 0 END), 0) AS TOTAL_UNIDADES_PANAMAR,
      COALESCE(SUM(
        CASE
          WHEN COALESCE(PL.PRECIO_TARIFA_PANAMAR, 0) > 0
            THEN PL.PRECIO_TARIFA_PANAMAR * (CASE WHEN COALESCE(PL.CAJAS, 0) > 0 THEN PL.CAJAS ELSE PL.UNIDADES END)
          ELSE PL.IMPORTEVENTA
        END
      ), 0) AS TOTAL_IMPORTE_PANAMAR
    FROM PANAMAR_LINEAS PL
    ${invoiceWhereSQL}
    GROUP BY
      PL.CODIGO_CLIENTE,
      PL.SERIE_FACTURA,
      PL.NUMERO_FACTURA,
      PL.EJERCICIO_FACTURA
  `;

  const linesSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT
      PL.CODIGO_CLIENTE,
      PL.MES_FACTURA,
      PL.ANO_FACTURA,
      PL.SERIE_FACTURA,
      PL.NUMERO_FACTURA,
      PL.EJERCICIO_FACTURA,
      PL.SUBEMPRESA_ALBARAN,
      PL.EJERCICIO_ALBARAN,
      PL.SERIE_ALBARAN,
      PL.TERMINAL_ALBARAN,
      PL.NUMERO_ALBARAN,
      PL.SECUENCIA,
      PL.CODIGO_ARTICULO,
      PL.DESCRIPCION,
      PL.LOTE,
      PL.CAJAS,
      PL.UNIDADES,
      PL.PRECIOVENTA,
      PL.DESCUENTO,
      PL.IVA,
      PL.IMPORTEVENTA,
      PL.TIPO_VENTA,
      PL.PRECIO_TARIFA_PANAMAR,
      PL.DIA_ALBARAN,
      PL.MES_ALBARAN,
      PL.ANO_ALBARAN
    FROM PANAMAR_LINEAS PL
    ${invoiceWhereSQL}
    ORDER BY
      PL.ANO_FACTURA,
      PL.MES_FACTURA,
      PL.EJERCICIO_ALBARAN,
      PL.SERIE_ALBARAN,
      PL.TERMINAL_ALBARAN,
      PL.NUMERO_ALBARAN,
      PL.SECUENCIA
  `;

  const [headers, lines] = await Promise.all([
    odbcPool.panamarQuery(headerSQL, params),
    odbcPool.panamarQuery(linesSQL, params)
  ]);

  const docs = assembleInvoiceDocuments(headers, lines);
  return docs[0] || null;
}

async function getDocumentByKey(key) {
  const startTime = Date.now();

  logger.info('PANAMAR: Resolviendo factura por clave de acceso', key);

  const resolverSQL = `
    SELECT
      ${RESOLVED_CLIENT_EXPR} AS CODIGO_CLIENTE,
      MAX(CAC.MESFACTURA) AS MES_FACTURA,
      MAX(CAC.ANOFACTURA) AS ANO_FACTURA,
      TRIM(CAC.SERIEFACTURA) AS SERIE_FACTURA,
      MAX(CAC.NUMEROFACTURA) AS NUMERO_FACTURA,
      MAX(CAC.EJERCICIOFACTURA) AS EJERCICIO_FACTURA
    FROM DSEDAC.CAC CAC
    WHERE TRIM(CAC.SUBEMPRESAALBARAN) = ?
      AND CAC.EJERCICIOALBARAN = ?
      AND TRIM(CAC.SERIEALBARAN) = ?
      AND CAC.TERMINALALBARAN = ?
      AND CAC.NUMEROALBARAN = ?
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND CAC.NUMEROFACTURA > 0
      AND TRIM(CAC.SERIEFACTURA) <> ''
    GROUP BY ${RESOLVED_CLIENT_EXPR}, TRIM(CAC.SERIEFACTURA), CAC.NUMEROFACTURA, CAC.EJERCICIOFACTURA
    FETCH FIRST 1 ROWS ONLY
  `;

  const ref = await odbcPool.panamarQuery(resolverSQL, [
    String(key.subempresa).trim(),
    toInt(key.ejercicio),
    String(key.serie).trim(),
    toInt(key.terminal),
    toInt(key.numero)
  ]);

  if (!ref || ref.length === 0) {
    logger.warn('PANAMAR: No existe factura para la clave solicitada', key);
    return null;
  }

  const invoiceIdentity = {
    codigoCliente: ref[0].CODIGO_CLIENTE,
    serie: ref[0].SERIE_FACTURA,
    numero: ref[0].NUMERO_FACTURA,
    ejercicio: ref[0].EJERCICIO_FACTURA
  };

  const doc = await getInvoiceByIdentity(invoiceIdentity);
  const elapsed = Date.now() - startTime;

  if (!doc) {
    logger.warn('PANAMAR: Factura no contiene lineas PANAMAR', { invoiceIdentity, elapsed: `${elapsed}ms` });
    return null;
  }

  logger.info('PANAMAR: Factura obtenida por clave', {
    refFactura: doc.refFactura,
    codigoCliente: doc.codigoCliente,
    lineas: doc.totalLineasPanamar,
    elapsed: `${elapsed}ms`
  });

  return doc;
}

async function getSummary(options = {}) {
  const startTime = Date.now();
  const { whereSQL, params } = buildLineFilters(options, 'PL');

  logger.info('PANAMAR: Consultando resumen de facturas', {
    meses: options.meses,
    codigoCliente: options.codigoCliente
  });

  /**
   * RESUMEN - Conteo de facturas REALES
   * ====================================
   * Agrupado por SERIE_FACTURA + NUMERO_FACTURA + EJERCICIO_FACTURA
   * No por MES_ALBARAN, para evitar contar la misma factura múltiples veces
   */
  const summarySQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT
      COUNT(DISTINCT 
        TRIM(PL.SERIE_FACTURA) || '|' || 
        CAST(PL.NUMERO_FACTURA AS VARCHAR(20)) || '|' ||
        CAST(PL.EJERCICIO_FACTURA AS VARCHAR(10))
      ) AS TOTAL_FACTURAS,
      COUNT(DISTINCT PL.CODIGO_CLIENTE) AS TOTAL_CLIENTES
    FROM PANAMAR_LINEAS PL
    ${whereSQL}
  `;

  const aggregateSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT
      COALESCE(SUM(
        CASE
          WHEN COALESCE(PL.PRECIO_TARIFA_PANAMAR, 0) > 0
            THEN PL.PRECIO_TARIFA_PANAMAR * (CASE WHEN COALESCE(PL.CAJAS, 0) <> 0 THEN PL.CAJAS ELSE PL.UNIDADES END)
          ELSE PL.IMPORTEVENTA
        END
      ), 0) AS TOTAL_IMPORTE,
      COALESCE(SUM(COALESCE(PL.CAJAS, 0)), 0) AS TOTAL_CAJAS,
      COALESCE(SUM(CASE WHEN TRIM(PL.TIPO_VENTA) = 'CC' THEN COALESCE(PL.CAJAS, 0) ELSE 0 END), 0) AS TOTAL_CAJAS_CC,
      COALESCE(SUM(CASE WHEN TRIM(PL.TIPO_VENTA) = 'SC' THEN COALESCE(PL.CAJAS, 0) ELSE 0 END), 0) AS TOTAL_CAJAS_SC
    FROM PANAMAR_LINEAS PL
    ${whereSQL}
  `;

  const [summaryResult, aggregateResult] = await Promise.all([
    odbcPool.panamarQuery(summarySQL, params),
    odbcPool.panamarQuery(aggregateSQL, params)
  ]);

  const row = summaryResult[0] || {};
  const aggRow = aggregateResult[0] || {};

  const elapsed = Date.now() - startTime;
  logger.info('PANAMAR: Resumen completado', { elapsed: `${elapsed}ms` });

  const totalFacturas = toInt(row.TOTAL_FACTURAS);

  return {
    ano: ANO_FIJO,
    ejercicio: ANO_FIJO,
    totalFacturas,
    totalDocumentos: totalFacturas, // compatibilidad con frontend anterior
    totalClientes: toInt(row.TOTAL_CLIENTES),
    totalImporte: round2(toNumber(aggRow.TOTAL_IMPORTE)),
    totalCajas: round3(toNumber(aggRow.TOTAL_CAJAS)),
    totalCajasCC: round3(toNumber(aggRow.TOTAL_CAJAS_CC)),
    totalCajasSC: round3(toNumber(aggRow.TOTAL_CAJAS_SC))
  };
}

async function getClients() {
  const startTime = Date.now();
  logger.info('PANAMAR: Consultando clientes con facturas PANAMAR');

  const clientsSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT
      PL.CODIGO_CLIENTE,
      MAX(PL.NOMBRE_CLIENTE) AS NOMBRE_CLIENTE,
      MAX(PL.NOMBRE_FISCAL) AS NOMBRE_FISCAL
    FROM PANAMAR_LINEAS PL
    WHERE PL.ANO_FACTURA = ?
    GROUP BY PL.CODIGO_CLIENTE
    ORDER BY MAX(PL.NOMBRE_CLIENTE)
  `;

  const rows = await odbcPool.panamarQuery(clientsSQL, [ANO_FIJO]);
  const elapsed = Date.now() - startTime;

  logger.info('PANAMAR: Clientes obtenidos', { count: rows.length, elapsed: `${elapsed}ms` });

  return (rows || []).map(r => ({
    codigoCliente: String(r.CODIGO_CLIENTE).trim(),
    nombreCliente: r.NOMBRE_CLIENTE || String(r.CODIGO_CLIENTE).trim(),
    nombreFiscal: r.NOMBRE_FISCAL || ''
  }));
}

async function getDiagnostics() {
  const startTime = Date.now();
  logger.info('PANAMAR DIAGNOSTICS: Iniciando analisis de integridad en facturas');

  const monthlySQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT
      PL.MES_FACTURA AS MES,
      COUNT(DISTINCT
        PL.CODIGO_CLIENTE || '|' ||
        CAST(PL.MES_FACTURA AS VARCHAR(10)) || '|' ||
        CAST(PL.ANO_FACTURA AS VARCHAR(10))
      ) AS FACTURAS,
      COUNT(*) AS LINEAS,
      COALESCE(SUM(CASE WHEN COALESCE(PL.CAJAS, 0) > 0 THEN PL.CAJAS ELSE 0 END), 0) AS TOTAL_CAJAS,
      COALESCE(SUM(
        CASE
          WHEN COALESCE(PL.PRECIO_TARIFA_PANAMAR, 0) > 0
            THEN PL.PRECIO_TARIFA_PANAMAR * (CASE WHEN COALESCE(PL.CAJAS, 0) > 0 THEN PL.CAJAS ELSE PL.UNIDADES END)
          ELSE PL.IMPORTEVENTA
        END
      ), 0) AS TOTAL_IMPORTE
    FROM PANAMAR_LINEAS PL
    WHERE PL.ANO_FACTURA = ?
    GROUP BY PL.MES_FACTURA
    ORDER BY PL.MES_FACTURA
  `;

  const duplicatedCACSQL = `
    SELECT COUNT(*) AS DUPLICADOS
    FROM (
      SELECT
        TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_CLIENTE_FACTURA,
        TRIM(CAC.SERIEFACTURA) AS SERIE_FACTURA,
        CAC.NUMEROFACTURA,
        CAC.EJERCICIOFACTURA,
        TRIM(CAC.SUBEMPRESAALBARAN) AS SUBEMPRESA_ALBARAN,
        CAC.EJERCICIOALBARAN,
        TRIM(CAC.SERIEALBARAN) AS SERIE_ALBARAN,
        CAC.TERMINALALBARAN,
        CAC.NUMEROALBARAN,
        COUNT(*) AS REPETICIONES
      FROM DSEDAC.CAC CAC
      WHERE TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
        AND CAC.ANOFACTURA = ?
        AND CAC.NUMEROFACTURA > 0
      GROUP BY
        TRIM(CAC.CODIGOCLIENTEFACTURA),
        TRIM(CAC.SERIEFACTURA),
        CAC.NUMEROFACTURA,
        CAC.EJERCICIOFACTURA,
        TRIM(CAC.SUBEMPRESAALBARAN),
        CAC.EJERCICIOALBARAN,
        TRIM(CAC.SERIEALBARAN),
        CAC.TERMINALALBARAN,
        CAC.NUMEROALBARAN
      HAVING COUNT(*) > 1
    ) T
  `;

  const lineDupesSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT
      COUNT(*) AS TOTAL_FILAS,
      COUNT(DISTINCT
        COALESCE(PL.CODIGO_CLIENTE, '') || '|' ||
        CAST(PL.EJERCICIO_FACTURA AS VARCHAR(10)) || '|' ||
        COALESCE(PL.SERIE_FACTURA, '') || '|' ||
        CAST(PL.NUMERO_FACTURA AS VARCHAR(20)) || '|' ||
        COALESCE(PL.SUBEMPRESA_ALBARAN, '') || '|' ||
        CAST(PL.EJERCICIO_ALBARAN AS VARCHAR(10)) || '|' ||
        COALESCE(PL.SERIE_ALBARAN, '') || '|' ||
        CAST(PL.TERMINAL_ALBARAN AS VARCHAR(10)) || '|' ||
        CAST(PL.NUMERO_ALBARAN AS VARCHAR(20)) || '|' ||
        CAST(PL.SECUENCIA AS VARCHAR(20)) || '|' ||
        COALESCE(PL.CODIGO_ARTICULO, '')
      ) AS FILAS_UNICAS
    FROM PANAMAR_LINEAS PL
    WHERE PL.ANO_FACTURA = ?
  `;

  const araDupesSQL = `
    SELECT
      TRIM(ARA.CODIGOARTICULO) AS ARTICULO,
      ARA.CODIGOTARIFA,
      COUNT(*) AS FILAS_ARA
    FROM DSEDAC.ARA ARA
    WHERE ARA.CODIGOTARIFA IN (84, 85)
    GROUP BY TRIM(ARA.CODIGOARTICULO), ARA.CODIGOTARIFA
    HAVING COUNT(*) > 1
  `;

  const missingBusinessNameSQL = `
    ${PANAMAR_LINEAS_CTE}
    SELECT COUNT(*) AS SIN_NOMBRE
    FROM (
      SELECT
        PL.CODIGO_CLIENTE,
        MAX(COALESCE(TRIM(PL.NOMBRE_CLIENTE), '')) AS NOMBRE_CLIENTE
      FROM PANAMAR_LINEAS PL
      WHERE PL.ANO_FACTURA = ?
      GROUP BY PL.CODIGO_CLIENTE
    ) C
    WHERE C.NOMBRE_CLIENTE = ''
  `;

  const [monthly, duplicatedCAC, lineDupes, araDupes, missingBusiness] = await Promise.all([
    odbcPool.panamarQuery(monthlySQL, [ANO_FIJO]),
    odbcPool.panamarQuery(duplicatedCACSQL, [ANO_FIJO]),
    odbcPool.panamarQuery(lineDupesSQL, [ANO_FIJO]),
    odbcPool.panamarQuery(araDupesSQL).catch(e => ({ error: e.message })),
    odbcPool.panamarQuery(missingBusinessNameSQL, [ANO_FIJO])
  ]);

  const lineStats = lineDupes[0] || {};
  const totalLineas = toInt(lineStats.TOTAL_FILAS);
  const totalLineasUnicas = toInt(lineStats.FILAS_UNICAS);
  const lineasDuplicadas = Math.max(0, totalLineas - totalLineasUnicas);

  const result = {
    info: 'Diagnostico PANAMAR sobre facturas (sin datos personales)',
    anoFijo: ANO_FIJO,
    elapsed: `${Date.now() - startTime}ms`,
    filtros: `Familias: ${PANAMAR_FAMILIAS.join(', ')}, Clientes: 4300%, Clases linea: ${PANAMAR_CLASES_LINEA_SQL}, Tarifa: 84/85`,
    resumenIntegridad: {
      duplicadosCabeceraCAC: toInt(duplicatedCAC[0]?.DUPLICADOS),
      lineasTotales: totalLineas,
      lineasUnicas: totalLineasUnicas,
      lineasDuplicadas,
      clientesSinNombreNegocio: toInt(missingBusiness[0]?.SIN_NOMBRE)
    },
    porMes: (monthly || []).map(r => ({
      mes: toInt(r.MES),
      facturas: toInt(r.FACTURAS),
      lineas: toInt(r.LINEAS),
      totalCajas: round3(toNumber(r.TOTAL_CAJAS)),
      totalImporte: round2(toNumber(r.TOTAL_IMPORTE))
    })),
    araDuplicados: Array.isArray(araDupes)
      ? (araDupes.length > 0 ? araDupes : 'Sin duplicados en ARA 84/85')
      : araDupes
  };

  logger.info('PANAMAR DIAGNOSTICS RESULT', result);
  return result;
}

function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).split('-');
  if (parts.length !== 3) return null;

  const year = toInt(parts[0]);
  const month = toInt(parts[1]);
  const day = toInt(parts[2]);

  if (!year || month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

function formatDate(day, month, year) {
  if (!day || !month || !year) return '';
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function formatHora(horaNum) {
  if (horaNum === null || horaNum === undefined || horaNum === '') return null;
  const str = String(horaNum).padStart(6, '0');
  return `${str.slice(0, 2)}:${str.slice(2, 4)}`;
}

function pad2(n) {
  return String(n || 0).padStart(2, '0');
}

function toNumber(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function toInt(value) {
  const n = parseInt(value, 10);
  return Number.isFinite(n) ? n : 0;
}

function round2(value) {
  return Math.round(toNumber(value) * 100) / 100;
}

function round3(value) {
  return Math.round(toNumber(value) * 1000) / 1000;
}

module.exports = {
  PANAMAR_CLIENT_CODE,
  ANO_FIJO,
  isPanamarClient,
  getDocuments,
  getDocumentByKey,
  getInvoiceByIdentity,
  getSummary,
  getClients,
  getDiagnostics
};
