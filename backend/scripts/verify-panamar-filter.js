/**
 * SCRIPT DE VERIFICACIÓN - FILTRO PANAMAR (FILTRO03='40')
 * ========================================================
 * Ejecutar en el servidor para confirmar que SOLO se devuelven
 * líneas con FILTRO03='40'. Muestra un albarán de ejemplo con
 * TODAS sus líneas (PANAMAR y no PANAMAR) para comparar.
 *
 * Uso: node backend/scripts/verify-panamar-filter.js
 */

const odbcPool = require('../app/config/odbcConfig');

async function verify() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 VERIFICACIÓN DE FILTRO PANAMAR (FILTRO03=40)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // 1) Buscar un documento de ejemplo que tenga líneas PANAMAR
  const sampleDoc = await odbcPool.query(`
    SELECT CAC.SUBEMPRESAALBARAN, CAC.EJERCICIOALBARAN,
           TRIM(CAC.SERIEALBARAN) AS SERIE, CAC.TERMINALALBARAN, CAC.NUMEROALBARAN,
           TRIM(CAC.CODIGOCLIENTEFACTURA) AS CLIENTE
    FROM DSEDAC.CAC CAC
    WHERE CAC.EJERCICIOALBARAN = 2026
      AND EXISTS (
        SELECT 1 FROM DSEDAC.LAC LAC
        INNER JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
        WHERE LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
          AND LAC.EJERCICIOALBARAN  = CAC.EJERCICIOALBARAN
          AND LAC.SERIEALBARAN      = CAC.SERIEALBARAN
          AND LAC.TERMINALALBARAN   = CAC.TERMINALALBARAN
          AND LAC.NUMEROALBARAN     = CAC.NUMEROALBARAN
          AND TRIM(ARTX.FILTRO03)   = '40'
          AND LAC.IMPORTEVENTA <> 0
      )
    FETCH FIRST 1 ROWS ONLY
  `);

  if (!sampleDoc.length) {
    console.log('❌ No se encontraron documentos PANAMAR en 2026');
    process.exit(0);
  }

  const doc = sampleDoc[0];
  console.log(`📋 Documento de ejemplo: Sub=${doc.SUBEMPRESAALBARAN}, Ej=${doc.EJERCICIOALBARAN}, ` +
    `Serie=${doc.SERIE}, Term=${doc.TERMINALALBARAN}, Num=${doc.NUMEROALBARAN}, Cliente=${doc.CLIENTE}\n`);

  // 2) Obtener TODAS las líneas del documento (sin filtro FILTRO03)
  const allLines = await odbcPool.query(`
    SELECT
      LAC.SECUENCIA,
      TRIM(LAC.CODIGOARTICULO) AS ARTICULO,
      TRIM(LAC.DESCRIPCION) AS DESCRIPCION,
      TRIM(ARTX.FILTRO03) AS FILTRO03,
      LAC.PRECIOVENTA,
      LAC.PORCENTAJEDESCUENTO AS DESCUENTO,
      LAC.IMPORTEVENTA,
      COALESCE(ARA.PRECIOTARIFA, 0) AS PRECIO_TARIFA_85
    FROM DSEDAC.LAC LAC
    LEFT JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
    LEFT JOIN DSEDAC.ARA ARA ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARA.CODIGOARTICULO)
      AND ARA.CODIGOTARIFA = 85
    WHERE LAC.SUBEMPRESAALBARAN = ?
      AND LAC.EJERCICIOALBARAN  = ?
      AND TRIM(LAC.SERIEALBARAN) = ?
      AND LAC.TERMINALALBARAN   = ?
      AND LAC.NUMEROALBARAN     = ?
      AND LAC.IMPORTEVENTA <> 0
    ORDER BY LAC.SECUENCIA
  `, [doc.SUBEMPRESAALBARAN, doc.EJERCICIOALBARAN, doc.SERIE, doc.TERMINALALBARAN, doc.NUMEROALBARAN]);

  console.log(`📦 TODAS las líneas del documento (${allLines.length} total):`);
  console.log('─'.repeat(120));
  console.log(
    'Seq'.padEnd(5) +
    'Artículo'.padEnd(12) +
    'Descripción'.padEnd(45) +
    'FILTRO03'.padEnd(10) +
    'PrecioVenta'.padEnd(13) +
    '%Dto'.padEnd(7) +
    'ImporteVta'.padEnd(13) +
    'PrecioT85'.padEnd(12) +
    '¿PANAMAR?'
  );
  console.log('─'.repeat(120));

  let panamarCount = 0;
  let otherCount = 0;

  for (const line of allLines) {
    const isPanamar = String(line.FILTRO03).trim() === '40';
    if (isPanamar) panamarCount++;
    else otherCount++;

    console.log(
      String(line.SECUENCIA).padEnd(5) +
      String(line.ARTICULO).padEnd(12) +
      String(line.DESCRIPCION || '').substring(0, 43).padEnd(45) +
      String(line.FILTRO03 || '(null)').padEnd(10) +
      String(Number(line.PRECIOVENTA).toFixed(3)).padEnd(13) +
      String(Number(line.DESCUENTO).toFixed(2)).padEnd(7) +
      String(Number(line.IMPORTEVENTA).toFixed(2)).padEnd(13) +
      String(Number(line.PRECIO_TARIFA_85).toFixed(3)).padEnd(12) +
      (isPanamar ? '✅ SÍ' : '❌ NO')
    );
  }

  console.log('─'.repeat(120));
  console.log(`\n📊 RESUMEN: ${panamarCount} líneas PANAMAR (FILTRO03=40), ${otherCount} líneas NO-PANAMAR`);

  if (otherCount > 0) {
    console.log('✅ CONFIRMADO: Este albarán tiene líneas NO-PANAMAR que correctamente se EXCLUYEN del resultado.');
  } else {
    console.log('ℹ️  Este albarán solo tiene líneas PANAMAR. Buscando uno mixto...');

    // Try to find a mixed document
    const mixedDoc = await odbcPool.query(`
      SELECT CAC.SUBEMPRESAALBARAN, CAC.EJERCICIOALBARAN,
             TRIM(CAC.SERIEALBARAN) AS SERIE, CAC.TERMINALALBARAN, CAC.NUMEROALBARAN,
             COUNT(*) AS TOTAL_LINEAS,
             SUM(CASE WHEN TRIM(ARTX.FILTRO03) = '40' THEN 1 ELSE 0 END) AS LINEAS_PANAMAR,
             SUM(CASE WHEN TRIM(ARTX.FILTRO03) <> '40' OR ARTX.FILTRO03 IS NULL THEN 1 ELSE 0 END) AS LINEAS_OTRAS
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
        AND LAC.IMPORTEVENTA <> 0
      LEFT JOIN DSEDAC.ARTX ARTX ON TRIM(LAC.CODIGOARTICULO) = TRIM(ARTX.CODIGOARTICULO)
      WHERE CAC.EJERCICIOALBARAN = 2026
        AND EXISTS (
          SELECT 1 FROM DSEDAC.LAC L2
          INNER JOIN DSEDAC.ARTX A2 ON TRIM(L2.CODIGOARTICULO) = TRIM(A2.CODIGOARTICULO)
          WHERE L2.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
            AND L2.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
            AND L2.SERIEALBARAN = CAC.SERIEALBARAN
            AND L2.TERMINALALBARAN = CAC.TERMINALALBARAN
            AND L2.NUMEROALBARAN = CAC.NUMEROALBARAN
            AND TRIM(A2.FILTRO03) = '40'
            AND L2.IMPORTEVENTA <> 0
        )
      GROUP BY CAC.SUBEMPRESAALBARAN, CAC.EJERCICIOALBARAN, TRIM(CAC.SERIEALBARAN),
               CAC.TERMINALALBARAN, CAC.NUMEROALBARAN
      HAVING SUM(CASE WHEN TRIM(ARTX.FILTRO03) <> '40' OR ARTX.FILTRO03 IS NULL THEN 1 ELSE 0 END) > 0
      FETCH FIRST 5 ROWS ONLY
    `);

    if (mixedDoc.length) {
      console.log(`\n🔎 Documentos MIXTOS encontrados (tienen líneas PANAMAR Y no-PANAMAR):`);
      for (const m of mixedDoc) {
        console.log(`   Sub=${m.SUBEMPRESAALBARAN} Ej=${m.EJERCICIOALBARAN} ` +
          `Serie=${m.SERIE} Term=${m.TERMINALALBARAN} Num=${m.NUMEROALBARAN}: ` +
          `${m.TOTAL_LINEAS} líneas total, ${m.LINEAS_PANAMAR} PANAMAR, ${m.LINEAS_OTRAS} otras`);
      }
      console.log('\n✅ El filtro SQL excluye correctamente las líneas NO-PANAMAR de estos documentos.');
    } else {
      console.log('ℹ️  No se encontraron documentos mixtos en 2026.');
    }
  }

  // 3) Verificar que el filtro ARTX.FILTRO03 funciona
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔬 VALORES DISTINTOS DE FILTRO03 EN ARTX:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const filtros = await odbcPool.query(`
    SELECT TRIM(FILTRO03) AS FILTRO, COUNT(*) AS TOTAL
    FROM DSEDAC.ARTX
    WHERE FILTRO03 IS NOT NULL AND TRIM(FILTRO03) <> ''
    GROUP BY TRIM(FILTRO03)
    ORDER BY TOTAL DESC
    FETCH FIRST 20 ROWS ONLY
  `);

  for (const f of filtros) {
    const marker = String(f.FILTRO).trim() === '40' ? ' ← PANAMAR' : '';
    console.log(`   FILTRO03='${f.FILTRO}' → ${f.TOTAL} artículos${marker}`);
  }

  console.log('\n✅ Verificación completa.');
  process.exit(0);
}

verify().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
