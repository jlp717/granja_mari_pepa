/**
 * Verificar summary - SIN filtros NUMEROFACTURA y SERIEFACTURA
 */
const db = require('../app/config/odbcConfig');

(async () => {
  await db.initialize();
  console.log('VERIFICANDO SUMMARY - QUITADOS AMBOS FILTROS\n');

  const F = "'700', '701', '702', '703', '704', '705', '706'";
  const C = "'AB', 'RG', 'VT'";

  // Sin NUMEROFACTURA y sin SERIEFACTURA filter (lo que está ahora en el código)
  const r1 = await db.query(`
    SELECT TRIM(LAC.TIPOVENTA) AS TV, SUM(COALESCE(LAC.CANTIDADENVASES,0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON 
      LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN AND
      LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN AND
      LAC.SERIEALBARAN = CAC.SERIEALBARAN AND
      LAC.TERMINALALBARAN = CAC.TERMINALALBARAN AND
      LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'
      AND TRIM(ART.CODIGOFAMILIA) IN (${F})
      AND TRIM(LAC.CLASELINEA) IN (${C})
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  let cc1=0, sc1=0; r1.forEach(x=>{if(x.TV==='CC')cc1=x.CAJAS;if(x.TV==='SC')sc1=x.CAJAS;});
  console.log('AHORA (sin NUM>0 y sin SERIEFACTURA): CC=' + cc1 + ', SC=' + sc1);

  console.log('\n=== RESULTADO ===');
  console.log('Web muestra: CC=' + cc1 + ', SC=' + sc1);
  console.log('Jefe espera: CC=3865, SC=11');
  
  if (cc1 === 3865 && sc1 === 11) {
    console.log('\n✅ COINCIDE CON EL JEFE!');
  } else {
    console.log('\n❌ DIFERENCIA: CC=' + (3865-cc1) + ', SC=' + (11-sc1));
  }

  process.exit(0);
})();