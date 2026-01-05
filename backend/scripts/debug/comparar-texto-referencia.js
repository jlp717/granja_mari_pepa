/**
 * COMPARAR FACTURA POR FACTURA CON TEXTO DE REFERENCIA
 * =====================================================
 * Valores exactos del texto de referencia:
 * - Serie A 10%: 23.429,03€
 * - Serie A 4%:  5.662,76€
 * - Serie F 10%: 165,01€
 * - TOTAL:       29.256,80€
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';

const REF = {
    a10: 23429.03,
    a4: 5662.76,
    f10: 165.01,
    total: 29256.80
};

async function compararConReferencia() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  COMPARAR CON TEXTO DE REFERENCIA                               ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. BUSCAR TABLAS SIMILARES A LACLAE
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. BUSCAR TABLAS CON NOMBRE SIMILAR');
        console.log('═══════════════════════════════════════════════════════════════\n');

        try {
            const queryTablas = `
        SELECT TABLE_SCHEMA, TABLE_NAME
        FROM QSYS2.SYSTABLES
        WHERE UPPER(TABLE_NAME) LIKE '%LACLA%'
           OR UPPER(TABLE_NAME) LIKE '%LIV%'
           OR UPPER(TABLE_NAME) LIKE '%347%'
      `;

            const tablas = await pool.query(queryTablas);
            console.log('Tablas encontradas:');
            tablas.forEach(t => {
                console.log('  ' + t.TABLE_SCHEMA + '.' + t.TABLE_NAME);
            });
        } catch (e) {
            console.log('Error: ' + e.message);
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. CALCULAR TOTALES DESGLOSADOS POR COLUMNA DE IVA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. TOTALES DESGLOSADOS POR COLUMNA DE IVA (SOLO SERIE A y F)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        // Calcular por columna 1 (IVA 10%)
        const queryCol1 = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        SUM(C.IMPORTEBASEIMPONIBLE1) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F')
        AND C.PORCENTAJEIVA1 BETWEEN 9.5 AND 10.5
      GROUP BY TRIM(C.SERIEFACTURA)
    `;

        const col1 = await pool.query(queryCol1);
        let a10_col1 = 0, f10_col1 = 0;
        col1.forEach(r => {
            if (r.SERIE === 'A') a10_col1 = parseFloat(r.BASE) || 0;
            if (r.SERIE === 'F') f10_col1 = parseFloat(r.BASE) || 0;
        });

        console.log('Columna 1 (IVA 10%):');
        console.log('  Serie A: ' + a10_col1.toFixed(2) + ' EUR');
        console.log('  Serie F: ' + f10_col1.toFixed(2) + ' EUR');

        // Calcular por columna 3 (IVA 4%)
        const queryCol3 = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        SUM(C.IMPORTEBASEIMPONIBLE3) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F')
        AND C.PORCENTAJEIVA3 BETWEEN 3.5 AND 4.5
      GROUP BY TRIM(C.SERIEFACTURA)
    `;

        const col3 = await pool.query(queryCol3);
        let a4_col3 = 0;
        col3.forEach(r => {
            if (r.SERIE === 'A') a4_col3 = parseFloat(r.BASE) || 0;
        });

        console.log('\nColumna 3 (IVA 4%):');
        console.log('  Serie A: ' + a4_col3.toFixed(2) + ' EUR');

        // Calcular por columna 5 (IVA 10% adicional)
        const queryCol5 = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        SUM(C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        AND TRIM(C.SERIEFACTURA) IN ('A', 'F')
        AND C.PORCENTAJEIVA5 BETWEEN 9.5 AND 10.5
      GROUP BY TRIM(C.SERIEFACTURA)
    `;

        const col5 = await pool.query(queryCol5);
        let a10_col5 = 0;
        col5.forEach(r => {
            if (r.SERIE === 'A') a10_col5 = parseFloat(r.BASE) || 0;
        });

        console.log('\nColumna 5 (IVA 10%):');
        console.log('  Serie A: ' + a10_col5.toFixed(2) + ' EUR');

        // ═══════════════════════════════════════════════════════════════
        // 3. TOTALES FINALES
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. TOTALES FINALES VS REFERENCIA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const nuestroA10 = a10_col1 + a10_col5;
        const nuestroA4 = a4_col3;
        const nuestroF10 = f10_col1;
        const nuestroTotal = nuestroA10 + nuestroA4 + nuestroF10;

        console.log('                    NUESTRO       REFERENCIA    DIFERENCIA');
        console.log('Serie A 10%:    ' + nuestroA10.toFixed(2).padStart(10) + '     ' + REF.a10.toFixed(2).padStart(10) + '     ' + (nuestroA10 - REF.a10).toFixed(2).padStart(8));
        console.log('Serie A 4%:     ' + nuestroA4.toFixed(2).padStart(10) + '     ' + REF.a4.toFixed(2).padStart(10) + '     ' + (nuestroA4 - REF.a4).toFixed(2).padStart(8));
        console.log('Serie F 10%:    ' + nuestroF10.toFixed(2).padStart(10) + '     ' + REF.f10.toFixed(2).padStart(10) + '     ' + (nuestroF10 - REF.f10).toFixed(2).padStart(8));
        console.log('─────────────────────────────────────────────────────────────');
        console.log('TOTAL:          ' + nuestroTotal.toFixed(2).padStart(10) + '     ' + REF.total.toFixed(2).padStart(10) + '     ' + (nuestroTotal - REF.total).toFixed(2).padStart(8));

        // ═══════════════════════════════════════════════════════════════
        // 4. VER PRIMERAS FACTURAS PARA COMPARAR
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. PRIMERAS FACTURAS ENERO (comparar con texto)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryEnero = `
      SELECT
        C.EJERCICIOFACTURA || '-' || TRIM(C.SERIEFACTURA) || '-' || RIGHT('000000' || CAST(C.NUMEROFACTURA AS VARCHAR(10)), 6) as FACTURA,
        C.DIAFACTURA || '/' || RIGHT('0' || CAST(C.MESFACTURA AS VARCHAR(2)), 2) || '/' || C.ANOFACTURA as FECHA,
        C.IMPORTEBASEIMPONIBLE1 as B1,
        C.PORCENTAJEIVA1 as P1,
        C.IMPORTEBASEIMPONIBLE3 as B3,
        C.PORCENTAJEIVA3 as P3,
        C.IMPORTEBASEIMPONIBLE5 as B5,
        C.PORCENTAJEIVA5 as P5
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.MESFACTURA = 1
        AND C.DIAFACTURA <= 3
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'A'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      ORDER BY C.EJERCICIOFACTURA, C.NUMEROFACTURA
    `;

        const enero = await pool.query(queryEnero);
        console.log('Factura             | Fecha      | B1(10%)  | B3(4%)   | B5(10%)');
        console.log('--------------------|------------|----------|----------|--------');
        enero.forEach(f => {
            console.log(
                f.FACTURA.padEnd(19) + ' | ' +
                f.FECHA.padEnd(10) + ' | ' +
                (parseFloat(f.B1) || 0).toFixed(2).padStart(8) + ' | ' +
                (parseFloat(f.B3) || 0).toFixed(2).padStart(8) + ' | ' +
                (parseFloat(f.B5) || 0).toFixed(2).padStart(8)
            );
        });

        console.log('\nReferencia del texto (primeras 3):');
        console.log('2024-A-009112 02/01/2025: B1=258,01(10%) B3=22,61(4%) B5=19,29(10%)');
        console.log('2024-A-009160 03/01/2025: B1=273,43(10%)');
        console.log('2024-A-009161 03/01/2025: B3=41,40(4%)');

        console.log('\n✓ Análisis completado\n');

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

compararConReferencia().catch(console.error);
