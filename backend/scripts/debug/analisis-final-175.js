/**
 * ANÁLISIS FINAL: ENCONTRAR LA FUENTE EXACTA DE 175€
 * ===================================================
 * Lo que sabemos:
 * - Con ANOFACTURA=2025: 29.431,91€ (+175,11€ extra)
 * - Referencia: 29.256,80€
 * - Las 3 facturas del ejercicio 2024 SÍ están en la referencia
 * - Los abonos SÍ están en la referencia
 * 
 * HIPÓTESIS: Hay algunas facturas que nosotros contamos DOBLE
 * o hay facturas F que se suman a Serie A incorrectamente
 */

require('dotenv').config();

const CODIGO_CLIENTE = '4300013449';
const REF_BASE = 29256.80;

async function analisisFinal() {
    let pool;

    try {
        console.log('\n╔══════════════════════════════════════════════════════════════════╗');
        console.log('║  ANÁLISIS FINAL: ENCONTRAR LA FUENTE EXACTA DE 175€            ║');
        console.log('╚══════════════════════════════════════════════════════════════════╝\n');

        pool = require('../../app/config/odbcConfig');
        await pool.initialize();
        console.log('✓ Pool inicializado\n');

        // ═══════════════════════════════════════════════════════════════
        // 1. VER SI F-7370 Y A-7370 SON DUPLICADOS
        // ═══════════════════════════════════════════════════════════════
        console.log('═══════════════════════════════════════════════════════════════');
        console.log('1. VERIFICAR SI HAY DUPLICADOS (MISMO NÚMERO, DISTINTA SERIE)');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const queryDuplicados = `
      SELECT
        C.NUMEROFACTURA,
        COUNT(DISTINCT TRIM(C.SERIEFACTURA)) as NUM_SERIES,
        LISTAGG(DISTINCT TRIM(C.SERIEFACTURA), ', ') as SERIES
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY C.NUMEROFACTURA
      HAVING COUNT(DISTINCT TRIM(C.SERIEFACTURA)) > 1
    `;

        const duplicados = await pool.query(queryDuplicados);
        console.log(`Números de factura que aparecen en múltiples series: ${duplicados.length}`);

        if (duplicados.length > 0) {
            console.log('\nNúmero | Series');
            console.log('-------|--------');
            duplicados.forEach(d => {
                console.log(`${String(d.NUMEROFACTURA).padEnd(6)} | ${d.SERIES}`);
            });

            // Detalle de cada duplicado
            for (const d of duplicados) {
                const queryDetalle = `
          SELECT
            TRIM(C.SERIEFACTURA) as SERIE,
            C.NUMEROFACTURA,
            C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
            SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
          FROM DSEDAC.CAC C
          WHERE C.ANOFACTURA = 2025
            AND C.NUMEROFACTURA = ${d.NUMEROFACTURA}
            AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
          GROUP BY C.SERIEFACTURA, C.NUMEROFACTURA, C.DIAFACTURA, C.MESFACTURA, C.ANOFACTURA
        `;

                const detalle = await pool.query(queryDetalle);
                console.log(`\nDetalle de número ${d.NUMEROFACTURA}:`);
                detalle.forEach(det => {
                    console.log(`  ${det.SERIE}-${det.NUMEROFACTURA} (${det.FECHA}): Base=${parseFloat(det.BASE).toFixed(2)}€`);
                });
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // 2. VERIFICAR F-7370 vs A-7370
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('2. DETALLE DE FACTURA 7370 EN TODAS LAS SERIES');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const query7370 = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        C.NUMEROFACTURA,
        C.NUMEROALBARAN,
        C.DIAFACTURA || '/' || C.MESFACTURA || '/' || C.ANOFACTURA as FECHA,
        C.IMPORTEBASEIMPONIBLE1 as BASE,
        C.IMPORTEIVA1 as IVA
      FROM DSEDAC.CAC C
      WHERE C.NUMEROFACTURA = 7370
        AND C.ANOFACTURA = 2025
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      ORDER BY TRIM(C.SERIEFACTURA), C.NUMEROALBARAN
    `;

        const fact7370 = await pool.query(query7370);
        console.log(`Registros con número 7370: ${fact7370.length}`);
        console.log('\nSerie | Número  | Albarán | Fecha      | Base      | IVA');
        console.log('------|---------|---------|------------|-----------|--------');

        let sumaA7370 = 0, sumaF7370 = 0;
        fact7370.forEach(f => {
            const base = parseFloat(f.BASE) || 0;
            if (f.SERIE === 'A') sumaA7370 += base;
            if (f.SERIE === 'F') sumaF7370 += base;
            console.log(
                `${f.SERIE.padEnd(5)} | ${String(f.NUMEROFACTURA).padEnd(7)} | ` +
                `${String(f.NUMEROALBARAN).padEnd(7)} | ${f.FECHA.padEnd(10)} | ` +
                `${base.toFixed(2).padStart(9)} | ${parseFloat(f.IVA).toFixed(2).padStart(7)}`
            );
        });
        console.log(`\nSuma A-7370: ${sumaA7370.toFixed(2)}€`);
        console.log(`Suma F-7370: ${sumaF7370.toFixed(2)}€`);
        console.log(`TOTAL si ambas se cuentan: ${(sumaA7370 + sumaF7370).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 3. TOTALIZAR SERIE A vs SERIE F
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('3. TOTALES POR SERIE');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySeries = `
      SELECT
        TRIM(C.SERIEFACTURA) as SERIE,
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE,
        COUNT(DISTINCT C.NUMEROFACTURA) as NUM_FACTURAS
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
      GROUP BY TRIM(C.SERIEFACTURA)
    `;

        const series = await pool.query(querySeries);
        let totalGeneral = 0;
        series.forEach(s => {
            const base = parseFloat(s.BASE) || 0;
            totalGeneral += base;
            console.log(`Serie ${s.SERIE || '(vacía)'}: ${s.NUM_FACTURAS} facturas, Base=${base.toFixed(2)}€`);
        });
        console.log(`\nTOTAL GENERAL: ${totalGeneral.toFixed(2)}€`);
        console.log(`REFERENCIA:     ${REF_BASE.toFixed(2)}€`);
        console.log(`DIFERENCIA:     ${(totalGeneral - REF_BASE).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 4. VER SI EL PROBLEMA ES QUE CONTAMOS SERIE F DOS VECES
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('4. PROBAR SOLO CON SERIE A');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySoloA = `
      SELECT
        SUM(BASE) as TOTAL_BASE,
        COUNT(*) as NUM_FACTURAS
      FROM (
        SELECT
          SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
              C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
        FROM DSEDAC.CAC C
        WHERE C.ANOFACTURA = 2025
          AND C.NUMEROFACTURA > 0
          AND TRIM(C.SERIEFACTURA) = 'A'
          AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
        GROUP BY C.NUMEROFACTURA, C.ANOFACTURA, C.MESFACTURA, C.DIAFACTURA
        HAVING SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
                   C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) <> 0
      ) T
    `;

        const soloA = (await pool.query(querySoloA))[0];
        const baseSoloA = parseFloat(soloA.TOTAL_BASE) || 0;

        // La referencia tiene:
        // Serie A 10%: 23.429,03€
        // Serie A 4%: 5.662,76€
        // Total Serie A referencia = 29.091,79€
        const refSerieA = 23429.03 + 5662.76;

        console.log(`Solo Serie A: ${baseSoloA.toFixed(2)}€ (${soloA.NUM_FACTURAS} facturas)`);
        console.log(`Referencia Serie A: ${refSerieA.toFixed(2)}€ (23.429,03 + 5.662,76)`);
        console.log(`Diferencia: ${(baseSoloA - refSerieA).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // 5. VER SERIE F EN LA REFERENCIA
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('5. SERIE F - NUESTRA VS REFERENCIA');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const querySerieF = `
      SELECT
        SUM(C.IMPORTEBASEIMPONIBLE1 + C.IMPORTEBASEIMPONIBLE2 + C.IMPORTEBASEIMPONIBLE3 +
            C.IMPORTEBASEIMPONIBLE4 + C.IMPORTEBASEIMPONIBLE5) as BASE
      FROM DSEDAC.CAC C
      WHERE C.ANOFACTURA = 2025
        AND C.NUMEROFACTURA > 0
        AND TRIM(C.SERIEFACTURA) = 'F'
        AND TRIM(C.CODIGOCLIENTEFACTURA) = '${CODIGO_CLIENTE}'
    `;

        const serieF = (await pool.query(querySerieF))[0];
        const baseSerieF = parseFloat(serieF.BASE) || 0;
        const refSerieF = 165.01;

        console.log(`Nuestra Serie F: ${baseSerieF.toFixed(2)}€`);
        console.log(`Referencia Serie F: ${refSerieF.toFixed(2)}€`);
        console.log(`Diferencia: ${(baseSerieF - refSerieF).toFixed(2)}€`);

        // ═══════════════════════════════════════════════════════════════
        // CONCLUSIÓN
        // ═══════════════════════════════════════════════════════════════
        console.log('\n═══════════════════════════════════════════════════════════════');
        console.log('CONCLUSIÓN');
        console.log('═══════════════════════════════════════════════════════════════\n');

        const diffSerieA = baseSoloA - refSerieA;
        console.log(`Diferencia en Serie A: ${diffSerieA.toFixed(2)}€`);
        console.log(`Si la diferencia es 175€ y solo está en Serie A, entonces:`);
        console.log(`  → Hay facturas en Serie A que no deberían estar`);
        console.log(`  → O hay facturas que se cuentan doble`);

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

analisisFinal().catch(console.error);
