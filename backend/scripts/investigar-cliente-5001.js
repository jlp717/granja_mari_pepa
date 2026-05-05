/**
 * Investigar cliente 4300005001
 */
const db = require('../app/config/odbcConfig');

(async () => {
  await db.initialize();
  console.log('INVESTIGAR CLIENTE 4300005001\n');

  // Ver los clientes 4300005xxx
  const clientes = await db.query(`
    SELECT TRIM(CODIGOCLIENTE) AS CODIGO, TRIM(NOMBRECLIENTE) AS NOMBRE
    FROM DSEDAC.CLI 
    WHERE TRIM(CODIGOCLIENTE) LIKE '4300005%'
    ORDER BY CODIGO
    FETCH FIRST 20 ROWS ONLY
  `);

  console.log('Clientes 4300005xxx:');
  clientes.forEach(c => console.log('  ' + c.CODIGO + ': ' + c.NOMBRE));

  // Ahora ver los albaranes de estos clientes en abril 2026
  console.log('\nAlbaranes de estos clientes en abril 2026:');
  const albaranes = await db.query(`
    SELECT 
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CLIENTE_FACTURA,
      TRIM(CAC.CODIGOCLIENTEALBARAN) AS CLIENTE_ALBARAN,
      CLI_FACT.NOMBRECLIENTE AS NOMBRE_FACTURA,
      CLI_ALB.NOMBRECLIENTE AS NOMBRE_ALBARAN,
      COUNT(*) AS N
    FROM DSEDAC.CAC CAC
    LEFT JOIN DSEDAC.CLI CLI_FACT ON TRIM(CAC.CODIGOCLIENTEFACTURA) = TRIM(CLI_FACT.CODIGOCLIENTE)
    LEFT JOIN DSEDAC.CLI CLI_ALB ON TRIM(CAC.CODIGOCLIENTEALBARAN) = TRIM(CLI_ALB.CODIGOCLIENTE)
    WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300005%'
    GROUP BY 
      TRIM(CAC.CODIGOCLIENTEFACTURA),
      TRIM(CAC.CODIGOCLIENTEALBARAN),
      CLI_FACT.NOMBRECLIENTE,
      CLI_ALB.NOMBRECLIENTE
  `);

  albaranes.forEach(a => {
    console.log('  Fact: ' + a.CLIENTE_FACTURA + ' (' + (a.NOMBRE_FACTURA || 'SIN NOMBRE') + ') -> Alb: ' + a.CLIENTE_ALBARAN + ' (' + (a.NOMBRE_ALBARAN || 'SIN NOMBRE') + ') - Docs: ' + a.N);
  });

  process.exit(0);
})();