/**
 * PRUEBA EXHAUSTIVA de todas las combinaciones para CC/SC
 * Ejecutar: node scripts/combinaciones-cc-sc.js
 */
const db = require('../app/config/odbcConfig');

async function run() {
  await db.initialize();
  console.log('🔍 PRUEBA EXHAUSTIVA - Abril 2026');
  console.log('='.repeat(70));
  console.log('OBJETIVO: CC=3865, SC=11');
  console.log('='.repeat(70));

  // Todas las variantes de familias
  const familiasOpciones = [
    { nombre: '700-706 (actual)', filtro: "'700', '701', '702', '703', '704', '705', '706'" },
    { nombre: '700-705', filtro: "'700', '701', '702', '703', '704', '705'" },
    { nombre: '701-706', filtro: "'701', '702', '703', '704', '705', '706'" },
    { nombre: '700-704', filtro: "'700', '701', '702', '703', '704'" },
    { nombre: '700-703', filtro: "'700', '701', '702', '703'" },
    { nombre: '700-702', filtro: "'700', '701', '702'" },
    { nombre: 'Solo 700', filtro: "'700'" },
    { nombre: 'Solo 701', filtro: "'701'" },
    { nombre: '700+701', filtro: "'700', '701'" },
    { nombre: 'Sin filtro familias', filtro: null }
  ];

  // Todas las variantes de CLASELINEA
  const claseOpciones = [
    { nombre: 'AB,RG,VT', filtro: "'AB', 'RG', 'VT'" },
    { nombre: 'AB,VT', filtro: "'AB', 'VT'" },
    { nombre: 'RG,VT', filtro: "'RG', 'VT'" },
    { nombre: 'Solo VT', filtro: "'VT'" },
    { nombre: 'Solo RG', filtro: "'RG'" },
    { nombre: 'AB,RG,VT,NS', filtro: "'AB', 'RG', 'VT', 'NS'" },
    { nombre: 'Sin filtro CLASELINEA', filtro: null }
  ];

  let mejoresCoincidencias = [];

  for (const fam of familiasOpciones) {
    for (const cls of claseOpciones) {
      let query = `
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
      `;
      
      if (fam.filtro) {
        query += ` INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)`;
      }
      
      query += ` WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 4 AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%' AND CAC.NUMEROFACTURA > 0`;
      
      if (fam.filtro) {
        query += ` AND TRIM(ART.CODIGOFAMILIA) IN (${fam.filtro})`;
      }
      if (cls.filtro) {
        query += ` AND TRIM(LAC.CLASELINEA) IN (${cls.filtro})`;
      }
      
      query += ` GROUP BY TRIM(LAC.TIPOVENTA)`;

      const result = await db.query(query);
      
      let cc = 0, sc = 0;
      result.forEach(r => {
        if ((r.TIPO_VENTA || '').trim() === 'CC') cc = Number(r.CAJAS) || 0;
        if ((r.TIPO_VENTA || '').trim() === 'SC') sc = Number(r.CAJAS) || 0;
      });

      const diffCC = Math.abs(cc - 3865);
      const diffSC = Math.abs(sc - 11);
      const diffTotal = diffCC + diffSC;

      if (diffTotal < 20) {
        console.log(`✅ FAMILIAS: ${fam.nombre.padEnd(20)} | CLASE: ${cls.nombre.padEnd(15)} | CC=${cc}, SC=${sc} (diff=${diffTotal})`);
        mejoresCoincidencias.push({ fam: fam.nombre, cls: cls.nombre, cc, sc, diffTotal });
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('📌 MEJORES COINCIDENCIAS:');
  mejoresCoincidencias.sort((a, b) => a.diffTotal - b.diffTotal).forEach(m => {
    console.log(`   ${m.fam} + ${m.cls} -> CC=${m.cc}, SC=${m.sc} (diff=${m.diffTotal})`);
  });

  // Ahora probar variantes de cliente
  console.log('\n' + '='.repeat(70));
  console.log('📌 PROBANDO VARIANTES DE CLIENTE:');

  const variantesCliente = [
    { nombre: '43% (actual)', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%'" },
    { nombre: '4300% (no 44)', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%' AND TRIM(CAC.CODIGOCLIENTEFACTURA) NOT LIKE '44%'" },
    { nombre: '4300% solo', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'" },
    { nombre: '4301%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4301%'" },
    { nombre: '4302%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4302%'" },
    { nombre: '4303%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4303%'" },
    { nombre: '4304%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4304%'" },
    { nombre: '4305%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4305%'" },
    { nombre: '4306%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4306%'" },
    { nombre: '4307%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4307%'" },
    { nombre: '4308%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4308%'" },
    { nombre: '4309%', where: "AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4309%'" },
  ];

  for (const v of variantesCliente) {
    const query = `
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
      WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 4 AND CAC.NUMEROFACTURA > 0
        ${v.where}
        AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
        AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
      GROUP BY TRIM(LAC.TIPOVENTA)
    `;
    
    const result = await db.query(query);
    let cc = 0, sc = 0;
    result.forEach(r => {
      if ((r.TIPO_VENTA || '').trim() === 'CC') cc = Number(r.CAJAS) || 0;
      if ((r.TIPO_VENTA || '').trim() === 'SC') sc = Number(r.CAJAS) || 0;
    });

    const diffCC = Math.abs(cc - 3865);
    const diffSC = Math.abs(sc - 11);
    const diffTotal = diffCC + diffSC;

    if (diffTotal < 30) {
      console.log(`✅ ${v.nombre.padEnd(25)} | CC=${cc}, SC=${sc} (diff=${diffTotal})`);
    }
  }

  // Probar con TIPOVENTA específico
  console.log('\n' + '='.repeat(70));
  console.log('📌 PROBANDO DIFERENTES TIPOVENTA:');

  const tipoventaVariantes = [
    { nombre: 'Solo CC', filtro: "AND TRIM(LAC.TIPOVENTA) = 'CC'" },
    { nombre: 'CC + otros', filtro: "AND TRIM(LAC.TIPOVENTA) IN ('CC', 'CN', 'CO', 'DV')" },
    { nombre: 'Todos CC-like', filtro: "AND TRIM(LAC.TIPOVENTA) LIKE 'C%'" },
  ];

  for (const v of tipoventaVariantes) {
    const query = `
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
      WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 4 
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%' AND CAC.NUMEROFACTURA > 0
        AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
        AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
        ${v.filtro}
    `;
    
    const result = await db.query(query);
    let total = 0;
    result.forEach(r => {
      total += Number(r.CAJAS) || 0;
    });

    console.log(`   ${v.nombre.padEnd(20)} | Total=${total}`);
  }

  // Ver los diferentes TIPOVENTA que hay
  console.log('\n' + '='.repeat(70));
  console.log('📌 TODOS LOS TIPOVENTA EN ABRIL 2026:');
  const todosTipos = await db.query(`
    SELECT
      TRIM(LAC.TIPOVENTA) AS TIPO_VENTA,
      COUNT(*) AS LINEAS,
      SUM(COALESCE(LAC.CANTIDADENVASES, 0)) AS CAJAS
    FROM DSEDAC.CAC CAC
    INNER JOIN DSEDAC.LAC LAC ON 
      LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN AND
      LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN AND
      LAC.SERIEALBARAN = CAC.SERIEALBARAN AND
      LAC.TERMINALALBARAN = CAC.TERMINALALBARAN AND
      LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
    INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
    WHERE CAC.ANODOCUMENTO = 2026 AND CAC.MESDOCUMENTO = 4 
      AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '43%' AND CAC.NUMEROFACTURA > 0
      AND TRIM(ART.CODIGOFAMILIA) IN ('700', '701', '702', '703', '704', '705', '706')
      AND TRIM(LAC.CLASELINEA) IN ('AB', 'RG', 'VT')
    GROUP BY TRIM(LAC.TIPOVENTA)
    ORDER BY CAJAS DESC
  `);
  console.table(todosTipos);

  process.exit(0);
}

run().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});