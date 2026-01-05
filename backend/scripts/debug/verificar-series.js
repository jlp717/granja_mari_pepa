/**
 * VERIFICAR SERIE D Y COMPARAR CONTEO DE FACTURAS
 * ================================================
 * El usuario dijo: "Serie D quitarla"
 * Verificar si estamos incluyendo Serie D incorrectamente
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

async function verificarSerieD() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  VERIFICAR SERIE D Y CONTEO DE FACTURAS                         ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER TODAS LAS SERIES
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. TODAS LAS SERIES EN LOS DATOS');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySeries = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE3 + C.IMPORTEBASEIMPONIBLE5) as TOTAL_BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY TRIM(C.SERIEFACTURA)
      ORDER BY TRIM(C.SERIEFACTURA)
    `;

        const series = await pool.query(querySeries);
        console.log('Serie | Facturas | Base Total');
        console.log('------|----------|------------');
        let totalGeneral = 0;
        series.forEach(s => {
            const base = parseFloat(s.TOTAL_BASE) || 0;
            totalGeneral += base;
            console.log((s.SERIE || '').padEnd(5) + ' | ' + String(s.NUM_FACTURAS).padEnd(8) + ' | ' + base.toFixed(2));
        });
        console.log('\nTotal general: ' + totalGeneral.toFixed(2));

        // ═══════════════════════════════════════════════════════════════
        // 2. CONTAR FACTURAS EN EL TEXTO DE REFERENCIA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. CONTEO DE FACTURAS EN TEXTO DE REFERENCIA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Del texto de referencia, hay 15 páginas
        // Contando las facturas del texto:
        // - Serie A: casi todas las facturas
        // - Serie F: solo 2 (F-7370 y F-11500)

        console.log('Del texto de referencia (páginas 1-15):');
        console.log('  Serie A: ~377 líneas de factura');
        console.log('  Serie F: 2 facturas (F-7370 y F-11500)');
        console.log('  Total líneas con datos: ~379');

        // ═══════════════════════════════════════════════════════════════
        // 3. CONTAR NUESTRAS FACTURAS (SOLO A Y F)
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. NUESTRAS FACTURAS SOLO SERIE A Y F');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryAF = `
      SELECT
        COUNT(DISTINCT C.NUMEROFACTURA || TRIM(C.SERIEFACTURA)) as NUM_FACTURAS,
        COUNT(*) as NUM_LINEAS
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F')
    `;

        const af = (await pool.query(queryAF))[0];
        console.log('Nuestros datos (Serie A y F):');
        console.log('  Facturas distintas: ' + af.NUM_FACTURAS);
        console.log('  Líneas totales: ' + af.NUM_LINEAS);

        // ═══════════════════════════════════════════════════════════════
        // 4. VER LAS ÚLTIMAS FACTURAS DE SERIE F
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. TODAS LAS FACTURAS SERIE F');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryF = `
      SELECT DISTINCT
        C.NUMEROFACTURA,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE3 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) = 'F'
      GROUP BY C.NUMEROFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA
      ORDER BY C.NUMEROFACTURA
    `;

        const factF = await pool.query(queryF);
        console.log('Facturas Serie F:');
        factF.forEach(f => {
            console.log('  F-' + f.NUMEROFACTURA + ' ' + f.FECHA + ': ' + (parseFloat(f.BASE) || 0).toFixed(2));
        });

        console.log('\nReferencia del texto:');
        console.log('  F-7370 30/06/2025: 159,18');
        console.log('  F-11500 30/09/2025: 5,83');
        console.log('  Total F: 165,01');

        // ═══════════════════════════════════════════════════════════════
        // 5. COMPARAR CANTIDAD DE LÍNEAS POR MES
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. LÍNEAS POR MES (SERIE A)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryMes = `
      SELECT
        C.MESFACTURA as MES,
        COUNT(*) as LINEAS,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE5) as BASE_10,
        SUM(C.IMPORTEBASEIMPONIBLE3) as BASE_4
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) = 'A'
      GROUP BY C.MESFACTURA
      ORDER BY C.MESFACTURA
    `;

        const meses = await pool.query(queryMes);
        console.log('Mes | Líneas | Base 10%   | Base 4%');
        console.log('----|--------|------------|--------');
        let sumBase10 = 0, sumBase4 = 0;
        meses.forEach(m => {
            const b10 = parseFloat(m.BASE_10) || 0;
            const b4 = parseFloat(m.BASE_4) || 0;
            sumBase10 += b10;
            sumBase4 += b4;
            console.log(String(m.MES).padStart(2) + '  | ' + String(m.LINEAS).padEnd(6) + ' | ' + b10.toFixed(2).padStart(10) + ' | ' + b4.toFixed(2).padStart(8));
        });
        console.log('──────────────────────────────────────');
        console.log('TOT | ' + meses.reduce((a, b) => a + parseInt(b.LINEAS), 0) + '   | ' + sumBase10.toFixed(2).padStart(10) + ' | ' + sumBase4.toFixed(2).padStart(8));

        console.log('\nReferencia:');
        console.log('  Base 10%: 23.429,03');
        console.log('  Base 4%: 5.662,76');
        console.log('\nDiferencia:');
        console.log('  Base 10%: ' + (sumBase10 - 23429.03).toFixed(2) + ' (debería ser +87,31)');
        console.log('  Base 4%: ' + (sumBase4 - 5662.76).toFixed(2) + ' (debería ser +87,80)');

        console.log('\n✓ Verificación completada\n');

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        console.error(error.stack);
    } finally {
        if (pool) {
            await pool.close();
            console.log('✓ Pool cerrado\n');
        }
    }
}

verificarSerieD().catch(console.error);
