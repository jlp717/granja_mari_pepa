/**
 * INVESTIGAR FACTURA 14074 - ¿Por qué aparece 4 veces?
 */

const odbcPool = require('./app/config/odbcConfig');

async function investigar() {
  try {
    console.log('🔍 Investigando factura F-14074 del cliente Diego...\n');

    const codigoCliente = '4300009900';

    // Ver en CAC
    const queryCAC = `
      SELECT
        TRIM(SERIEFACTURA) as SERIE,
        NUMEROFACTURA,
        EJERCICIOFACTURA,
        ANOFACTURA,
        MESFACTURA,
        DIAFACTURA,
        TRIM(CODIGOCLIENTEFACTURA) as CLIENTE,
        IMPORTEBASEIMPONIBLE1,
        IMPORTEBASEIMPONIBLE2,
        IMPORTEBASEIMPONIBLE3,
        IMPORTEBASEIMPONIBLE4,
        IMPORTEBASEIMPONIBLE5,
        IMPORTEIVA1,
        IMPORTEIVA2,
        IMPORTEIVA3,
        IMPORTEIVA4,
        IMPORTEIVA5,
        IMPORTETOTAL,
        (IMPORTEBASEIMPONIBLE1 + IMPORTEBASEIMPONIBLE2 + IMPORTEBASEIMPONIBLE3 +
         IMPORTEBASEIMPONIBLE4 + IMPORTEBASEIMPONIBLE5) as BASE_TOTAL,
        (IMPORTEIVA1 + IMPORTEIVA2 + IMPORTEIVA3 + IMPORTEIVA4 + IMPORTEIVA5) as IVA_TOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(SERIEFACTURA) = 'F'
        AND NUMEROFACTURA = 14074
        AND TRIM(CODIGOCLIENTEFACTURA) = ?
    `;

    const resultCAC = await odbcPool.query(queryCAC, [codigoCliente]);

    console.log(`📊 Registros en CAC: ${resultCAC.length}\n`);

    resultCAC.forEach((r, idx) => {
      console.log(`Registro ${idx + 1}:`);
      console.log(`  BASE1: ${r.IMPORTEBASEIMPONIBLE1}, IVA1: ${r.IMPORTEIVA1}`);
      console.log(`  BASE2: ${r.IMPORTEBASEIMPONIBLE2}, IVA2: ${r.IMPORTEIVA2}`);
      console.log(`  BASE3: ${r.IMPORTEBASEIMPONIBLE3}, IVA3: ${r.IMPORTEIVA3}`);
      console.log(`  BASE4: ${r.IMPORTEBASEIMPONIBLE4}, IVA4: ${r.IMPORTEIVA4}`);
      console.log(`  BASE5: ${r.IMPORTEBASEIMPONIBLE5}, IVA5: ${r.IMPORTEIVA5}`);
      console.log(`  BASE_TOTAL: ${r.BASE_TOTAL}`);
      console.log(`  IVA_TOTAL: ${r.IVA_TOTAL}`);
      console.log(`  TOTAL: ${r.IMPORTETOTAL}\n`);
    });

    // Ver albaranes
    const queryAlbaranes = `
      SELECT
        TRIM(SERIEFACTURA) as SERIE,
        NUMEROFACTURA,
        TRIM(SERIEALBARAN) as SERIE_ALBARAN,
        NUMEROALBARAN,
        IMPORTETOTAL
      FROM DSEDAC.CAC
      WHERE TRIM(SERIEFACTURA) = 'F'
        AND NUMEROFACTURA = 14074
        AND TRIM(CODIGOCLIENTEFACTURA) = ?
    `;

    const albaranes = await odbcPool.query(queryAlbaranes, [codigoCliente]);

    console.log(`📦 Albaranes asociados a la factura: ${albaranes.length}\n`);

    albaranes.forEach((a, idx) => {
      console.log(`  ${idx + 1}. Albarán ${a.SERIE_ALBARAN}-${a.NUMEROALBARAN} - Total: ${a.IMPORTETOTAL}`);
    });

    console.log('\n💡 EXPLICACIÓN:');
    console.log('La tabla CAC tiene 5 columnas para base imponible e IVA (una por cada tipo de IVA).');
    console.log('Si una factura tiene artículos con diferentes % de IVA, se almacenan en columnas separadas.');
    console.log('La query actual SUMA todas las columnas, por lo que debería dar UN solo registro por factura.');
    console.log('\nPero si hay múltiples registros en CAC para la misma factura (diferentes albaranes), aparecerá duplicada.\n');

    console.log('\n🎯 SOLUCIÓN:');
    console.log('En la query del libro de IVA, debemos agrupar por SERIE y NUMERO de factura');
    console.log('usando GROUP BY y SUM() para que cada factura aparezca UNA SOLA VEZ.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

investigar();
