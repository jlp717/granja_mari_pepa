/**
 * Prueba de diferentes filtros para CC/SC
 * Ejecutar: node scripts/probar-filtros-cc-sc.js
 */
const db = require('../app/config/odbcConfig');

const FAMILIAS = "'700', '701', '702', '703', '704', '705', '706'";

async function run() {
  await db.initialize();
  console.log('🔍 PRUEBA DIFERENTES FILTROS - Abril 2026\n');
  console.log('='.repeat(60));

  // Prueba 1: Sin filtro CLASELINEA
  console.log('\n1️⃣ Sin filtro CLASELINEA (solo familias 700-706):');
  const sinClase = await db.query(`
    SELECT
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      SUM(COALESCE(LAC.CANTIDADENVASES, 0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON 
      LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN AND
      LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN AND
      LAC.SERIEALBARAN = CAC.SERIEALBARAN AND
      LAC.TERMINALALBARAN = CAC.TERMINALALBARAN AND
      LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026
      AND CAC.MESDOCUMENTO = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'
      AND CAC.NUMEROFACTURA > 0
      AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  let cc1 = 0, sc1 = 0;
  sinClase.forEach(r => {
    console.log(`   ${r.TIPO_VENTA}: ${r.CAJAS}`);
    if ((r.TIPO_VENTA || '').trim() === 'CC') cc1 = Number(r.CAJAS) || 0;
    if ((r.TIPO_VENTA || '').trim() === 'SC') sc1 = Number(r.CAJAS) || 0;
  });
  console.log(`   ➡️ CC=${cc1}, SC=${sc1}`);

  // Prueba 2: Con todas las familias y sin filtro CLASELINEA
  console.log('\n2️⃣ Todas las familias (1-999) sin filtro CLASELINEA:');
  const todasFam = await db.query(`
    SELECT
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      SUM(COALESCE(LAC.CANTIDADENVASES, 0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON 
      LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN AND
      LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN AND
      LAC.SERIEALBARAN = CAC.SERIEALBARAN AND
      LAC.TERMINALALBARAN = CAC.TERMINALALBARAN AND
      LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    WHERE CAC.ANODOCUMENTO = 2026
      AND CAC.MESDOCUMENTO = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'
      AND CAC.NUMEROFACTURA > 0
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  let cc2 = 0, sc2 = 0;
  todasFam.forEach(r => {
    console.log(`   ${r.TIPO_VENTA}: ${r.CAJAS}`);
    if ((r.TIPO_VENTA || '').trim() === 'CC') cc2 = Number(r.CAJAS) || 0;
    if ((r.TIPO_VENTA || '').trim() === 'SC') sc2 = Number(r.CAJAS) || 0;
  });
  console.log(`   ➡️ CC=${cc2}, SC=${sc2}`);

  // Prueba 3: Con filtro de cliente específico
  console.log('\n3️⃣ Solo clientes 4300 (no 44%):');
  const cli4300 = await db.query(`
    SELECT
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      SUM(COALESCE(LAC.CANTIDADENVASES, 0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON 
      LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN AND
      LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN AND
      LAC.SERIEALBARAN = CAC.SERIEALBARAN AND
      LAC.TERMINALALBARAN = CAC.TERMINALALBARAN AND
      LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026
      AND CAC.MESDOCUMENTO = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) NOT LIKE '44%'
      AND CAC.NUMEROFACTURA > 0
      AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
      AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  let cc3 = 0, sc3 = 0;
  cli4300.forEach(r => {
    console.log(`   ${r.TIPO_VENTA}: ${r.CAJAS}`);
    if ((r.TIPO_VENTA || '').trim() === 'CC') cc3 = Number(r.CAJAS) || 0;
    if ((r.TIPO_VENTA || '').trim() === 'SC') sc3 = Number(r.CAJAS) || 0;
  });
  console.log(`   ➡️ CC=${cc3}, SC=${sc3}`);

  // Ver comparación con el resultado esperado
  console.log('\n' + '='.repeat(60));
  console.log('📌 COMPARACIÓN:');
  console.log('   Mi web actual (43%, familias 700-706, CLASELINEA AB/RG/VT): CC=3792, SC=9');
  console.log('   Sin filtro CLASELINEA: CC=' + cc1 + ', SC=' + sc1);
  console.log('   Todas las familias: CC=' + cc2 + ', SC=' + sc2);
  console.log('   Solo 4300 (no 44%): CC=' + cc3 + ', SC=' + sc3);
  console.log('   ');
  console.log('   JEFE REPORTA: CC=3865, SC=11');

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});