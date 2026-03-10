/**
 * VERIFICACIÓN EXHAUSTIVA PANAMAR - Post-fix
 * ===========================================
 * Confirma que:
 *   1) La columna TIPOVENTA existe en LAC (no TIPODVENTA)
 *   2) Valores de CLASELINEA en datos PANAMAR
 *   3) Cajas enero 2026 con filtros CLASELINEA IN (AB,RG,VT) + IMPORTEVENTA <> 0 = 3623
 *   4) Desglose por CLASELINEA para ver qué se filtra
 *   5) Desglose CC/SC con TIPOVENTA correcto
 *   6) Cajas por mes (todos los meses disponibles)
 *   7) Comparación con/sin filtro CLASELINEA
 *
 * Ejecutar: node scripts/verify-panamar-fixes.js
 */
const db = require('../app/config/odbcConfig');

const EJERCICIO = 2026;
const FAMILIAS = "'701', '702', '703', '704', '705'";
const CLASES_LINEA = "'AB', 'RG', 'VT'";
const EXPECTED_ENERO_CAJAS = 3623;

async function run() {
    try {
        await db.initialize();
        console.log('✅ Conectado a BD\n');
        console.log('='.repeat(70));
        console.log('  VERIFICACIÓN EXHAUSTIVA PANAMAR - Post-fix');
        console.log('='.repeat(70));

        // ──────────────────────────────────────────────────────────
        // 1) Verificar columnas TIPO* en LAC
        // ──────────────────────────────────────────────────────────
        console.log('\n📋 1) Columnas TIPO* en tabla DSEDAC.LAC');
        const tipoCols = await db.query(`
      SELECT COLUMN_NAME, DATA_TYPE, LENGTH, COLUMN_TEXT
      FROM QSYS2.SYSCOLUMNS
      WHERE TABLE_SCHEMA = 'DSEDAC' AND TABLE_NAME = 'LAC'
        AND COLUMN_NAME LIKE '%TIPO%'
      ORDER BY COLUMN_NAME
    `);
        console.table(tipoCols);

        const hasTIPOVENTA = tipoCols.some(c => c.COLUMN_NAME.trim() === 'TIPOVENTA');
        const hasTIPODVENTA = tipoCols.some(c => c.COLUMN_NAME.trim() === 'TIPODVENTA');
        console.log(`   TIPOVENTA existe:  ${hasTIPOVENTA ? '✅ SÍ' : '❌ NO'}`);
        console.log(`   TIPODVENTA existe: ${hasTIPODVENTA ? '⚠️  SÍ (NO debería usarse)' : '✅ NO existe'}`);

        // ──────────────────────────────────────────────────────────
        // 2) Valores de CLASELINEA en datos PANAMAR
        // ──────────────────────────────────────────────────────────
        console.log('\n📋 2) Valores CLASELINEA en líneas PANAMAR (2026)');
        const clases = await db.query(`
      SELECT TRIM(LAC.CLASELINEA) AS CLASE, COUNT(*) AS LINEAS,
             COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
      WHERE CAC.EJERCICIOALBARAN = ${EJERCICIO}
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
        AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
        AND LAC.IMPORTEVENTA <> 0
      GROUP BY TRIM(LAC.CLASELINEA)
      ORDER BY TRIM(LAC.CLASELINEA)
    `);
        console.table(clases);
        console.log('   → Solo AB, RG, VT deben incluirse. El resto se descarta.');

        // ──────────────────────────────────────────────────────────
        // 3) ENERO 2026 - CON filtro CLASELINEA (ESPERADO: 3623)
        // ──────────────────────────────────────────────────────────
        console.log('\n📋 3) ★ ENERO 2026 - Con filtro CLASELINEA IN (AB, RG, VT) ★');
        const enero = await db.query(`
      SELECT
        COUNT(DISTINCT CAC.NUMEROALBARAN || '-' || CAC.SERIEALBARAN || '-' || CAC.TERMINALALBARAN || '-' || CAC.EJERCICIOALBARAN) AS DOCUMENTOS,
        COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS TOTAL_CAJAS,
        COALESCE(SUM(CASE WHEN TRIM(LAC.TIPOVENTA) = 'CC' THEN LAC.CANTIDADENVASES ELSE 0 END), 0) AS CAJAS_CC,
        COALESCE(SUM(CASE WHEN TRIM(LAC.TIPOVENTA) = 'SC' THEN LAC.CANTIDADENVASES ELSE 0 END), 0) AS CAJAS_SC,
        COUNT(*) AS TOTAL_LINEAS,
        COALESCE(SUM(LAC.CANTIDADUNIDADES), 0) AS TOTAL_UNIDADES
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
      WHERE CAC.EJERCICIOALBARAN = ${EJERCICIO}
        AND CAC.MESDOCUMENTO = 1
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
        AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
        AND LAC.IMPORTEVENTA <> 0
        AND TRIM(LAC.CLASELINEA) IN (${CLASES_LINEA})
    `);
        console.table(enero);

        const totalCajasEnero = enero[0]?.TOTAL_CAJAS || 0;
        console.log(`\n   >>> ESPERADO:  ${EXPECTED_ENERO_CAJAS} cajas en Enero`);
        console.log(`   >>> OBTENIDO:  ${totalCajasEnero} cajas en Enero`);
        if (totalCajasEnero === EXPECTED_ENERO_CAJAS) {
            console.log('   >>> ✅✅✅ COINCIDE PERFECTO ✅✅✅');
        } else {
            console.log(`   >>> ❌ DIFERENCIA: ${totalCajasEnero - EXPECTED_ENERO_CAJAS} cajas`);
        }

        // ──────────────────────────────────────────────────────────
        // 4) ENERO 2026 - SIN filtro CLASELINEA (comparación)
        // ──────────────────────────────────────────────────────────
        console.log('\n📋 4) ENERO 2026 - SIN filtro CLASELINEA (para comparar)');
        const eneroSinFiltro = await db.query(`
      SELECT
        COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS TOTAL_CAJAS,
        COUNT(*) AS TOTAL_LINEAS
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
      WHERE CAC.EJERCICIOALBARAN = ${EJERCICIO}
        AND CAC.MESDOCUMENTO = 1
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
        AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
        AND LAC.IMPORTEVENTA <> 0
    `);
        console.table(eneroSinFiltro);
        const cajasSinFiltro = eneroSinFiltro[0]?.TOTAL_CAJAS || 0;
        console.log(`   → Diferencia por filtro CLASELINEA: ${cajasSinFiltro - totalCajasEnero} cajas excluidas`);

        // ──────────────────────────────────────────────────────────
        // 5) Desglose por mes CON filtro CLASELINEA
        // ──────────────────────────────────────────────────────────
        console.log('\n📋 5) Cajas por mes CON filtro CLASELINEA + IMPORTEVENTA <> 0');
        const porMes = await db.query(`
      SELECT
        CAC.MESDOCUMENTO AS MES,
        COUNT(DISTINCT CAC.NUMEROALBARAN || '-' || CAC.SERIEALBARAN || '-' || CAC.TERMINALALBARAN || '-' || CAC.EJERCICIOALBARAN) AS DOCS,
        COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS,
        COUNT(*) AS LINEAS
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
      WHERE CAC.EJERCICIOALBARAN = ${EJERCICIO}
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
        AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
        AND LAC.IMPORTEVENTA <> 0
        AND TRIM(LAC.CLASELINEA) IN (${CLASES_LINEA})
      GROUP BY CAC.MESDOCUMENTO
      ORDER BY CAC.MESDOCUMENTO
    `);
        console.table(porMes);

        // ──────────────────────────────────────────────────────────
        // 6) Desglose CC/SC por mes con TIPOVENTA (no TIPODVENTA)
        // ──────────────────────────────────────────────────────────
        console.log('\n📋 6) Desglose CC/SC por mes (usando TIPOVENTA correcta)');
        const ccsc = await db.query(`
      SELECT
        CAC.MESDOCUMENTO AS MES,
        TRIM(LAC.TIPOVENTA) AS TIPO,
        COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
      WHERE CAC.EJERCICIOALBARAN = ${EJERCICIO}
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
        AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
        AND LAC.IMPORTEVENTA <> 0
        AND TRIM(LAC.CLASELINEA) IN (${CLASES_LINEA})
      GROUP BY CAC.MESDOCUMENTO, TRIM(LAC.TIPOVENTA)
      ORDER BY CAC.MESDOCUMENTO, TRIM(LAC.TIPOVENTA)
    `);
        console.table(ccsc);

        // ──────────────────────────────────────────────────────────
        // 7) Desglose CLASELINEA enero para ver qué se excluye
        // ──────────────────────────────────────────────────────────
        console.log('\n📋 7) Desglose CLASELINEA en Enero 2026');
        const claseEnero = await db.query(`
      SELECT TRIM(LAC.CLASELINEA) AS CLASE,
             COUNT(*) AS LINEAS,
             COALESCE(SUM(LAC.CANTIDADENVASES), 0) AS CAJAS,
             CASE WHEN TRIM(LAC.CLASELINEA) IN (${CLASES_LINEA}) THEN 'INCLUIDO' ELSE 'EXCLUIDO' END AS ESTADO
      FROM DSEDAC.CAC CAC
      INNER JOIN DSEDAC.LAC LAC
        ON LAC.SUBEMPRESAALBARAN = CAC.SUBEMPRESAALBARAN
        AND LAC.EJERCICIOALBARAN = CAC.EJERCICIOALBARAN
        AND LAC.SERIEALBARAN = CAC.SERIEALBARAN
        AND LAC.TERMINALALBARAN = CAC.TERMINALALBARAN
        AND LAC.NUMEROALBARAN = CAC.NUMEROALBARAN
      INNER JOIN DSEDAC.ART ART ON TRIM(LAC.CODIGOARTICULO) = TRIM(ART.CODIGOARTICULO)
      WHERE CAC.EJERCICIOALBARAN = ${EJERCICIO}
        AND CAC.MESDOCUMENTO = 1
        AND TRIM(CAC.CODIGOCLIENTEFACTURA) LIKE '4300%'
        AND TRIM(ART.CODIGOFAMILIA) IN (${FAMILIAS})
        AND LAC.IMPORTEVENTA <> 0
      GROUP BY TRIM(LAC.CLASELINEA)
      ORDER BY TRIM(LAC.CLASELINEA)
    `);
        console.table(claseEnero);

        // ──────────────────────────────────────────────────────────
        // RESUMEN FINAL
        // ──────────────────────────────────────────────────────────
        console.log('\n' + '='.repeat(70));
        console.log('  RESUMEN FINAL');
        console.log('='.repeat(70));
        console.log(`  Columna correcta (TIPOVENTA):    ${hasTIPOVENTA ? '✅' : '❌'}`);
        console.log(`  Enero 2026 = ${EXPECTED_ENERO_CAJAS} cajas:        ${totalCajasEnero === EXPECTED_ENERO_CAJAS ? '✅' : '❌'} (obtenido: ${totalCajasEnero})`);
        console.log(`  CLASELINEA filtrado:             ✅ Solo AB, RG, VT`);
        console.log('='.repeat(70));

        await db.close();
        process.exit(totalCajasEnero === EXPECTED_ENERO_CAJAS ? 0 : 1);
    } catch (err) {
        console.error('\n❌ ERROR:', err.message);
        console.error(err.stack);
        process.exit(1);
    }
}

run();
