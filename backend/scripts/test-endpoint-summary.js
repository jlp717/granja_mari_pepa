/**
 * Test directo del endpoint summary
 */
const db = require('../app/config/odbcConfig');

(async () => {
  await db.initialize();
  console.log('TEST ENDPOINT SUMMARY\n');

  // Simular el CTE completo como lo hace panamarService.js
  const F = "'700', '701', '702', '703', '704', '705', '706'";
  const C = "'AB', 'RG', 'VT'";

  // Query del getSummary
  const aggSQL = `
    WITH TARIFAS_PANAMAR AS (
      SELECT TRIM(ARA.CODIGOARTICULO) AS CODIGO_ARTICULO, ARA.CODIGOTARIFA,
             MAX(ARA.PRECIOTARIFA) AS PRECIOTARIFA
      FROM DSEDAC.ARA ARA WHERE ARA.CODIGOTARIFA IN (84, 85)
      GROUP BY TRIM(ARA.CODIGOARTICULO), ARA.CODIGOTARIFA
    ),
    PANAMAR_LINEAS AS (
      SELECT TRIM(LAC.TIPOVENTA) AS TIPOVENTA, LAC.CANTIDADENVASES AS CAJAS
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC ON LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
      INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
      WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 4
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'
        AND TRIM(ART.CODIGOFAMILIA) IN (${F})
        AND TRIM(LAC.CLASELINEA) IN (${C})
    )
    SELECT 
      COALESCE(SUM(CASE WHEN TRIM(TIPOVENTA) = 'CC' THEN COALESCE(CAJAS, 0) ELSE 0 END), 0) AS TOTAL_CAJAS_CC,
      COALESCE(SUM(CASE WHEN TRIM(TIPOVENTA) = 'SC' THEN COALESCE(CAJAS, 0) ELSE 0 END), 0) AS TOTAL_CAJAS_SC
    FROM PANAMAR_LINEAS
  `;

  const result = await db.query(aggSQL);
  console.log('Resultado:', result[0]);

  console.log('\n=== RESUMEN ===');
  console.log('CC:', result[0].TOTAL_CAJAS_CC);
  console.log('SC:', result[0].TOTAL_CAJAS_SC);
  console.log('Objetivo: CC=3865, SC=11');

  process.exit(0);
})();