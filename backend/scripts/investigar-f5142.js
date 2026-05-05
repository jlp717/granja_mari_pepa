/**
 * Investigar factura F-5142
 */
const db = require('../app/config/odbcConfig');

(async () => {
  await db.initialize();
  console.log('INVESTIGAR F-5142\n');

  // Buscar la factura
  const factura = await db.query(`
    SELECT 
      CAC.SERIEFACTURA,
      CAC.NUMEROFACTURA,
      CAC.EJERCICIOFACTURA,
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CODIGO_FACTURA,
      TRIM(CAC.CODIGOCLIENTEALBARAN) AS CODIGO_ALBARAN,
      CAC.MESFACTURA,
      CAC.ANOFACTURA
    FROM DSEDAC.CAC CAC
    WHERE TRIM(CAC.SERIEFACTURA) = 'F'
      AND CAC.NUMEROFACTURA = 5142
      AND CAC.EJERCICIOFACTURA = 2026
  `);

  console.log('Factura encontrada:');
  console.log(factura[0]);

  if (factura[0]) {
    const cf = factura[0].CODIGO_FACTURA;
    const ca = factura[0].CODIGO_ALBARAN;

    console.log('\nCliente FACTURA:', cf);
    console.log('Cliente ALBARAN:', ca);

    // Ver datos del cliente FACTURA
    const cliFact = await db.query(`
      SELECT TRIM(CODIGOCLIENTE) AS CODIGO, TRIM(NOMBRECLIENTE) AS NOMBRE, TRIM(NOMBREALTERNATIVO) AS ALT, DIRECCION, POBLACION
      FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = ?
    `, [cf]);
    console.log('\nDatos cliente FACTURA (' + cf + '):');
    console.log('  NOMBRECLIENTE:', cliFact[0]?.NOMBRE);
    console.log('  NOMBREALTERNATIVO:', cliFact[0]?.ALT);

    // Ver datos del cliente ALBARAN
    const cliAlb = await db.query(`
      SELECT TRIM(CODIGOCLIENTE) AS CODIGO, TRIM(NOMBRECLIENTE) AS NOMBRE, TRIM(NOMBREALTERNATIVO) AS ALT, DIRECCION, POBLACION
      FROM DSEDAC.CLI WHERE TRIM(CODIGOCLIENTE) = ?
    `, [ca]);
    console.log('\nDatos cliente ALBARAN (' + ca + '):');
    console.log('  NOMBRECLIENTE:', cliAlb[0]?.NOMBRE);
    console.log('  NOMBREALTERNATIVO:', cliAlb[0]?.ALT);
  }

  process.exit(0);
})();