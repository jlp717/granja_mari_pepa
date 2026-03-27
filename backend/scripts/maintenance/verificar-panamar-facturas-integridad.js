/**
 * VERIFICACION DE INTEGRIDAD PANAMAR (FACTURAS)
 * =============================================
 * Uso:
 *   node scripts/maintenance/verificar-panamar-facturas-integridad.js
 *
 * El chequeo se hace por mes para evitar timeouts en consultas masivas.
 */

const panamarService = require('../../app/services/panamarService');
const db = require('../../app/config/odbcConfig');

const PAGE_SIZE = 250;
const MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

async function main() {
  let connected = false;

  try {
    console.log('='.repeat(80));
    console.log('VERIFICACION PANAMAR - FACTURAS');
    console.log('='.repeat(80));
    console.log(`Ano fijo: ${panamarService.ANO_FIJO}`);
    console.log(`Meses evaluados: ${MONTHS.join(', ')}`);
    console.log('');

    await db.initialize();
    connected = true;

    const documents = await fetchAllDocumentsByMonth();
    const checks = validateDocuments(documents);
    const monthlySummary = await fetchSummaryByMonth();
    const sqlChecks = await runSqlChecks();

    const summaryCountDiff = Math.abs(monthlySummary.totalFacturas - checks.uniqueInvoiceCount);
    const totalImporteDocs = round2(documents.reduce((sum, d) => sum + num(d.totalImportePanamar), 0));
    const summaryImporteDiff = Math.abs(totalImporteDocs - monthlySummary.totalImporte);

    printReport({
      documents,
      checks,
      monthlySummary,
      sqlChecks,
      summaryCountDiff,
      totalImporteDocs,
      summaryImporteDiff
    });

    const hasIssues =
      checks.duplicateInvoices.length > 0 ||
      checks.duplicateLines > 0 ||
      checks.totalMismatches.length > 0 ||
      checks.lineCountMismatches.length > 0 ||
      checks.personalDataLeaks > 0 ||
      checks.missingBusinessName.length > 0 ||
      summaryCountDiff !== 0 ||
      summaryImporteDiff > 1.0 ||
      num(sqlChecks.duplicadosCabeceraCAC) > 0 ||
      num(sqlChecks.araDuplicados) > 0;

    if (hasIssues) {
      console.log('\nRESULTADO FINAL: ERROR - Se detectaron inconsistencias.');
      process.exitCode = 1;
      return;
    }

    console.log('\nRESULTADO FINAL: OK - Sin duplicados y con datos consistentes.');
    process.exitCode = 0;
  } catch (error) {
    console.error('\nERROR EN VERIFICACION PANAMAR:', error.message);
    console.error(error.stack);
    process.exitCode = 1;
  } finally {
    if (connected) {
      await db.close().catch(() => undefined);
    }
  }
}

async function fetchAllDocumentsByMonth() {
  const all = [];

  for (const month of MONTHS) {
    let page = 1;
    let totalPages = 1;

    console.log(`\n[Mes ${String(month).padStart(2, '0')}] Cargando facturas...`);

    while (page <= totalPages) {
      const result = await panamarService.getDocuments({
        page,
        pageSize: PAGE_SIZE,
        meses: [month],
        bypassMaxLimit: true
      });

      totalPages = result.totalPages || 0;
      all.push(...(result.documents || []));

      console.log(`  - Pagina ${page}/${totalPages} -> ${result.documents.length} facturas`);
      page += 1;
    }
  }

  return all;
}

async function fetchSummaryByMonth() {
  let totalFacturas = 0;
  let totalImporte = 0;
  let totalCajas = 0;

  for (const month of MONTHS) {
    const summary = await panamarService.getSummary({ meses: [month] });
    const count = num(summary.totalFacturas ?? summary.totalDocumentos);
    totalFacturas += count;
    totalImporte += num(summary.totalImporte);
    totalCajas += num(summary.totalCajas);
  }

  return {
    totalFacturas,
    totalImporte: round2(totalImporte),
    totalCajas: round3(totalCajas)
  };
}

async function runSqlChecks() {
  // Duplicados de cabecera en CAC (mismo invoice + mismo albaran repetido)
  const duplicateHeaderSQL = `
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

  const araDupesSQL = `
    SELECT COUNT(*) AS DUPLICADOS
    FROM (
      SELECT
        TRIM(ARA.CODIGOARTICULO) AS CODIGO_ARTICULO,
        ARA.CODIGOTARIFA,
        COUNT(*) AS FILAS
      FROM DSEDAC.ARA ARA
      WHERE ARA.CODIGOTARIFA IN (84, 85)
      GROUP BY TRIM(ARA.CODIGOARTICULO), ARA.CODIGOTARIFA
      HAVING COUNT(*) > 1
    ) X
  `;

  const [duplicateHeaderRows, araDupesRows] = await Promise.all([
    db.query(duplicateHeaderSQL, [panamarService.ANO_FIJO]),
    db.query(araDupesSQL)
  ]);

  return {
    duplicadosCabeceraCAC: num(duplicateHeaderRows[0]?.DUPLICADOS),
    araDuplicados: num(araDupesRows[0]?.DUPLICADOS)
  };
}

function validateDocuments(documents) {
  const invoiceSet = new Set();
  const duplicateInvoices = [];
  const missingBusinessName = [];
  const totalMismatches = [];
  const lineCountMismatches = [];
  let duplicateLines = 0;
  let personalDataLeaks = 0;

  for (const doc of documents) {
    const invoiceKey = [
      doc.codigoCliente || '',
      doc.ejercicioFactura || '',
      doc.serieFactura || '',
      doc.numeroFactura || ''
    ].join('|');

    if (invoiceSet.has(invoiceKey)) {
      duplicateInvoices.push(invoiceKey);
    } else {
      invoiceSet.add(invoiceKey);
    }

    if (!String(doc.nombreCliente || '').trim()) {
      missingBusinessName.push(invoiceKey);
    }

    const lines = Array.isArray(doc.lineas) ? doc.lineas : [];
    const declaredLines = num(doc.totalLineasPanamar);
    if (declaredLines !== lines.length) {
      lineCountMismatches.push({ invoiceKey, declared: declaredLines, expected: lines.length });
    }

    const lineTotal = round2(lines.reduce((sum, l) => sum + num(l.importe), 0));
    const declaredTotal = round2(num(doc.totalImportePanamar));
    if (Math.abs(lineTotal - declaredTotal) > 0.01) {
      totalMismatches.push({ invoiceKey, lineTotal, declaredTotal });
    }

    const lineSet = new Set();
    for (const line of lines) {
      const lineKey = [
        line.subempresaAlbaran || '',
        line.ejercicioAlbaran || '',
        line.serieAlbaran || '',
        line.terminalAlbaran || '',
        line.numeroAlbaran || '',
        line.secuencia || '',
        line.codigoArticulo || ''
      ].join('|');

      if (lineSet.has(lineKey)) {
        duplicateLines += 1;
      } else {
        lineSet.add(lineKey);
      }
    }

    if (
      Object.prototype.hasOwnProperty.call(doc, 'nifCliente') ||
      Object.prototype.hasOwnProperty.call(doc, 'direccionCliente') ||
      Object.prototype.hasOwnProperty.call(doc, 'poblacionCliente') ||
      Object.prototype.hasOwnProperty.call(doc, 'provinciaCliente') ||
      Object.prototype.hasOwnProperty.call(doc, 'cpCliente')
    ) {
      personalDataLeaks += 1;
    }
  }

  return {
    uniqueInvoiceCount: invoiceSet.size,
    duplicateInvoices,
    duplicateLines,
    missingBusinessName,
    totalMismatches,
    lineCountMismatches,
    personalDataLeaks
  };
}

function printReport(payload) {
  const { documents, checks, monthlySummary, sqlChecks, summaryCountDiff, totalImporteDocs, summaryImporteDiff } = payload;

  console.log('\nRESUMEN');
  console.log('-'.repeat(80));
  console.log(`Facturas cargadas (servicio): ${documents.length}`);
  console.log(`Facturas unicas:             ${checks.uniqueInvoiceCount}`);
  console.log(`Facturas (sumario mensual):  ${monthlySummary.totalFacturas}`);
  console.log(`Importe listado:             ${totalImporteDocs.toFixed(2)} EUR`);
  console.log(`Importe sumario mensual:     ${monthlySummary.totalImporte.toFixed(2)} EUR`);
  console.log(`Dif. conteo:                ${summaryCountDiff}`);
  console.log(`Dif. importe:               ${summaryImporteDiff.toFixed(2)} EUR`);

  console.log('\nINTEGRIDAD SERVICIO');
  console.log('-'.repeat(80));
  console.log(`Facturas duplicadas:         ${checks.duplicateInvoices.length}`);
  console.log(`Lineas duplicadas:           ${checks.duplicateLines}`);
  console.log(`Totales descuadrados:        ${checks.totalMismatches.length}`);
  console.log(`Conteo lineas descuadrado:   ${checks.lineCountMismatches.length}`);
  console.log(`Negocios sin nombre:         ${checks.missingBusinessName.length}`);
  console.log(`Fugas de datos personales:   ${checks.personalDataLeaks}`);

  console.log('\nINTEGRIDAD SQL');
  console.log('-'.repeat(80));
  console.log(`Duplicados cabecera CAC:     ${sqlChecks.duplicadosCabeceraCAC}`);
  console.log(`Duplicados ARA (84/85):      ${sqlChecks.araDuplicados}`);

  if (checks.totalMismatches.length > 0) {
    console.log('\nEjemplos totales descuadrados:');
    checks.totalMismatches.slice(0, 10).forEach(item => {
      console.log(`  - ${item.invoiceKey} | lineas=${item.lineTotal} | declarado=${item.declaredTotal}`);
    });
  }

  if (checks.duplicateInvoices.length > 0) {
    console.log('\nEjemplos facturas duplicadas:');
    checks.duplicateInvoices.slice(0, 10).forEach(key => console.log(`  - ${key}`));
  }
}

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function round2(value) {
  return Math.round(num(value) * 100) / 100;
}

function round3(value) {
  return Math.round(num(value) * 1000) / 1000;
}

main();
