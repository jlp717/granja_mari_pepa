/**
 * VERIFICACIÓN: Totales CC y SC para Panamar en abril
 * Compara MES_ALBARAN vs MES_FACTURA
 * Ejecutar: node scripts/verify-abril-cc-sc.js
 */
const db = require('../app/config/odbcConfig');

const FAMILIAS = "'700', '701', '702', '703', '704', '705', '706'";
const CLASES_LINEA = "'AB', 'RG', 'VT'";

async function run() {
  await db.initialize();
  console.log('🔍 VERIFICACIÓN: Panamar Abril 2026\n');
  console.log('='.repeat(60));

  // Query con MES_ALBARAN (cómo estaba antes - web actual)
  console.log('\n📊 Con MES_ALBARAN (cómo está ahora en web):');
  const oldResult = await db.query(`
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
      AND TRIM(LAC.CLASELINEA) IN (${CLASES_LINEA})
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  
  let totalCC_old = 0, totalSC_old = 0, totalOld = 0;
  oldResult.forEach(r => {
    const cajas = Number(r.CAJAS) || 0;
    totalOld += cajas;
    if ((r.TIPO_VENTA || '').trim() === 'CC') totalCC_old = cajas;
    if ((r.TIPO_VENTA || '').trim() === 'SC') totalSC_old = cajas;
    console.log(`  ${r.TIPO_VENTA}: ${cajas.toFixed(3)}`);
  });
  console.log(`  TOTAL: ${totalOld.toFixed(3)}`);
  console.log(`  ➡️  CC: ${totalCC_old.toFixed(3)}, SC: ${totalSC_old.toFixed(3)}`);

  // Query con MES_FACTURA (cómo debería estar ahora)
  console.log('\n📊 Con MES_FACTURA (como debería estar ahora):');
  const newResult = await db.query(`
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
    WHERE CAC.ANOFACTURA = 2026
      AND CAC.MESFACTURA = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'
      AND CAC.NUMEROFACTURA > 0
      AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
      AND TRIM(LAC.CLASELINEA) IN (${CLASES_LINEA})
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  
  let totalCC_new = 0, totalSC_new = 0, totalNew = 0;
  newResult.forEach(r => {
    const cajas = Number(r.CAJAS) || 0;
    totalNew += cajas;
    if ((r.TIPO_VENTA || '').trim() === 'CC') totalCC_new = cajas;
    if ((r.TIPO_VENTA || '').trim() === 'SC') totalSC_new = cajas;
    console.log(`  ${r.TIPO_VENTA}: ${cajas.toFixed(3)}`);
  });
  console.log(`  TOTAL: ${totalNew.toFixed(3)}`);
  console.log(`  ➡️  CC: ${totalCC_new.toFixed(3)}, SC: ${totalSC_new.toFixed(3)}`);

  console.log('\n' + '='.repeat(60));
  console.log('📌 RESULTADO ESPERADO: CC 3865, SC 11');
  console.log(`   CC con MES_FACTURA: ${totalCC_new.toFixed(3)}`);
  console.log(`   SC con MES_FACTURA: ${totalSC_new.toFixed(3)}`);
  
  if (Math.abs(totalCC_new - 3865) < 10 && Math.abs(totalSC_new - 11) < 5) {
    console.log('\n✅ COINCIDE con el sistema de tu jefe!');
  } else {
    console.log('\n❌ NO coincide - revisar datos');
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});