/**
 * Verificar si CAC tiene datos diferentes
 * Ejecutar: node scripts/test-cac-vs-lac.js
 */
const db = require('../app/config/odbcConfig');

async function run() {
  await db.initialize();
  console.log('🔍 CAC vs LAC - Abril 2026');
  console.log('='.repeat(60));

  // 1) Ver campo CAJAS en CAC
  console.log('\n1️⃣ CAC.CAJAS para abril:');
  const cacCajas = await db.query(`
    SELECT 
      SUM(COALESCE(CAC.CAJAS, 0)) AS TOTAL_CAJAS
    FROM DSEDAC.CAC CAC
    WHERE CAC.ANODOCUMENTO = 2026
      AND CAC.MESDOCUMENTO = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'
      AND CAC.NUMEROFACTURA > 0
  `);
  console.log(`   CAC.CAJAS: ${cacCajas[0].TOTAL_CAJAS}`);

  // 2) Ver por cliente específico qué tiene cada uno
  console.log('\n2️⃣ Comparar por cliente (TOP 10):');
  const comp = await db.query(`
    SELECT 
      TRIM(CAC.CODIGOCLIENTEFACTURA) AS CLIENTE,
      SUM(COALESCE(CAC.CAJAS, 0)) AS CAC_CAJAS
    FROM DSEDAC.CAC CAC
    WHERE CAC.ANODOCUMENTO = 2026
      AND CAC.MESDOCUMENTO = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'
      AND CAC.NUMEROFACTURA > 0
    GROUP BY TRIM(CAC.CODIGOCLIENTEFACTURA)
    ORDER BY CAC_CAJAS DESC
    FETCH FIRST 10 ROWS ONLY
  `);
  console.table(comp);

  // 3) Ver todos los campos de CAC que puedan tener cajas
  console.log('\n3️⃣ Campos de CAC que podrían tener cajas:');
  const campos = await db.query(`
    SELECT COLUMN_NAME 
    FROM QSYS2.SYSCOLUMNS 
    WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'CAC'
      AND COLUMN_NAME LIKE '%CAJAS%' OR COLUMN_NAME LIKE '%ENVAS%'
    ORDER BY COLUMN_NAME
  `);
  console.table(campos);

  // 4) Ver la suma de CAC.CAJAS filtrado como Panamar
  console.log('\n4️⃣ CAC.CAJAS con filtro Panamar:');
  const cacPanamar = await db.query(`
    SELECT 
      SUM(COALESCE(CAC.CAJAS, 0)) AS TOTAL_CAJAS
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
      AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
      AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
  `);
  console.log(`   CAC.CAJAS filtrado: ${cacPanamar[0].TOTAL_CAJAS}`);

  // 5) Ver qué pasa si cambio el período
  console.log('\n5️⃣ Diferentes períodos:');
  
  // Enero
  const ene = await db.query(`
    SELECT 
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      SUM(COALESCE(LAC.CANTIDADENVASES, 0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 1
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%' AND CAC.NUMEROFACTURA > 0
      AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
      AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  let ccEne = 0, scEne = 0;
  ene.forEach(r => {
    if ((r.TIPO_VENTA || '').trim() === 'CC') ccEne = Number(r.CAJAS) || 0;
    if ((r.TIPO_VENTA || '').trim() === 'SC') scEne = Number(r.CAJAS) || 0;
  });
  console.log(`   Enero: CC=${ccEne}, SC=${scEne}`);

  // Febrero
  const feb = await db.query(`
    SELECT 
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      SUM(COALESCE(LAC.CANTIDADENVASES, 0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 2
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%' AND CAC.NUMEROFACTURA > 0
      AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
      AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  let ccFeb = 0, scFeb = 0;
  feb.forEach(r => {
    if ((r.TIPO_VENTA || '').trim() === 'CC') ccFeb = Number(r.CAJAS) || 0;
    if ((r.TIPO_VENTA || '').trim() === 'SC') scFeb = Number(r.CAJAS) || 0;
  });
  console.log(`   Febrero: CC=${ccFeb}, SC=${scFeb}`);

  // Marzo
  const mar = await db.query(`
    SELECT 
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      SUM(COALESCE(LAC.CANTIDADENVASES, 0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 3
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%' AND CAC.NUMEROFACTURA > 0
      AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
      AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  let ccMar = 0, scMar = 0;
  mar.forEach(r => {
    if ((r.TIPO_VENTA || '').trim() === 'CC') ccMar = Number(r.CAJAS) || 0;
    if ((r.TIPO_VENTA || '').trim() === 'SC') scMar = Number(r.CAJAS) || 0;
  });
  console.log(`   Marzo: CC=${ccMar}, SC=${scMar}`);

  // Abril
  const abr = await db.query(`
    SELECT 
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      SUM(COALESCE(LAC.CANTIDADENVASES, 0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 4
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%' AND CAC.NUMEROFACTURA > 0
      AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
      AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
    GROUP BY TRIM(LAC.TIPOVENTA)
  `);
  let ccAbr = 0, scAbr = 0;
  abr.forEach(r => {
    if ((r.TIPO_VENTA || '').trim() === 'CC') ccAbr = Number(r.CAJAS) || 0;
    if ((r.TIPO_VENTA || '').trim() === 'SC') scAbr = Number(r.CAJAS) || 0;
  });
  console.log(`   Abril: CC=${ccAbr}, SC=${scAbr}`);

  console.log('\n' + '='.repeat(60));
  console.log(`📌 Acumulado Q1 (Ene-Abr): CC=${ccEne+ccFeb+ccMar+ccAbr}, SC=${scEne+scFeb+scMar+scAbr}`);

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});